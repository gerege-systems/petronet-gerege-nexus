package fuel

// The deployment operator's read-only view across every fuel company.
//
// A Level-2 module cannot import the platform's private operator middleware.
// This route therefore validates the existing console cookie against the
// platform's own /me endpoint before issuing its single aggregate query. The
// check keeps session resolution, host gating and operator roles owned by the
// platform while allowing the distribution module to supply its own screen.

import (
	"errors"
	"io"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgconn"

	"github.com/gerege-systems/open-gerege-nexus/backend/pkg/nexus"
)

var operatorAuthClient = &http.Client{Timeout: 5 * time.Second}

func operatorSessionStatus(r *http.Request) int {
	port := strings.TrimSpace(os.Getenv("PORT"))
	if port == "" {
		port = "8080"
	}
	req, err := http.NewRequestWithContext(r.Context(), http.MethodGet,
		"http://127.0.0.1:"+port+"/api/platform/v1/me", nil)
	if err != nil {
		return http.StatusInternalServerError
	}
	req.Host = r.Host
	req.Header.Set("Cookie", r.Header.Get("Cookie"))
	resp, err := operatorAuthClient.Do(req)
	if err != nil {
		slog.Error("fuel overview: operator session check failed", "error", err)
		return http.StatusServiceUnavailable
	}
	defer resp.Body.Close()
	_, _ = io.Copy(io.Discard, resp.Body)
	return resp.StatusCode
}

const overviewQuery = `
SELECT json_build_object(
  'installed', TRUE,
  'operators', (
    SELECT COALESCE(json_agg(row_to_json(o)), '[]') FROM (
      SELECT t.id, t.name, t.slug,
             (SELECT COUNT(*)::int FROM fuel_stations s WHERE s.tenant_id = t.id) AS stations,
             (SELECT COUNT(*)::int FROM fuel_depots d WHERE d.tenant_id = t.id) AS depots,
             (SELECT COALESCE(SUM(i.current_stock_liters), 0)::float8
                FROM fuel_station_inventory i WHERE i.tenant_id = t.id) AS station_liters,
             (SELECT COALESCE(SUM(k.current_liters), 0)::float8
                FROM fuel_depot_tanks k WHERE k.tenant_id = t.id) AS depot_liters,
             (SELECT COUNT(*)::int FROM fuel_station_inventory i
               WHERE i.tenant_id = t.id
                 AND (i.last_reported_at IS NULL
                      OR i.last_reported_at < NOW() - INTERVAL '24 hours')) AS stale_rows,
             (SELECT COUNT(*)::int FROM fuel_dispatch_trips d
               WHERE d.tenant_id = t.id AND d.status = 'in_transit') AS in_transit,
             (SELECT COUNT(*)::int FROM fuel_customs_shipments c
               WHERE c.tenant_id = t.id AND c.status <> 'at_depot') AS at_border,
             (SELECT MAX(i.last_reported_at) FROM fuel_station_inventory i
               WHERE i.tenant_id = t.id) AS last_report_at
        FROM registry.tenants t
       WHERE EXISTS (SELECT 1 FROM fuel_stations s WHERE s.tenant_id = t.id)
          OR EXISTS (SELECT 1 FROM fuel_depots d WHERE d.tenant_id = t.id)
       ORDER BY stations DESC, t.name) o),
  'stock', (
    SELECT COALESCE(json_agg(row_to_json(p)), '[]') FROM (
      SELECT fuel_type,
             SUM(station_liters)::float8 AS station_liters,
             SUM(depot_liters)::float8 AS depot_liters,
             SUM(border_liters)::float8 AS border_liters,
             SUM(capacity_liters)::float8 AS capacity_liters,
             SUM(stale)::int AS stale
        FROM (
          SELECT fuel_type, current_stock_liters AS station_liters, 0 AS depot_liters,
                 0 AS border_liters, tank_capacity_liters AS capacity_liters,
                 CASE WHEN last_reported_at IS NULL
                        OR last_reported_at < NOW() - INTERVAL '24 hours'
                      THEN 1 ELSE 0 END AS stale
            FROM fuel_station_inventory
           UNION ALL
          SELECT fuel_type, 0, current_liters, 0, capacity_liters,
                 CASE WHEN updated_at < NOW() - INTERVAL '24 hours' THEN 1 ELSE 0 END
            FROM fuel_depot_tanks
           UNION ALL
          SELECT fuel_type, 0, 0, declared_liters, 0, 0
            FROM fuel_customs_shipments WHERE status <> 'at_depot') AS everything
       GROUP BY fuel_type ORDER BY fuel_type) p),
  'aimags', (
    SELECT COALESCE(json_agg(row_to_json(a)), '[]') FROM (
      SELECT COALESCE(NULLIF(s.aimag, ''), '—') AS aimag,
             COUNT(DISTINCT s.id)::int AS stations,
             COALESCE(SUM(i.current_stock_liters), 0)::float8 AS liters
        FROM fuel_stations s
        LEFT JOIN fuel_station_inventory i ON i.station_id = s.id
       GROUP BY COALESCE(NULLIF(s.aimag, ''), '—')
       ORDER BY stations DESC LIMIT 30) a),
  'dry', (
    SELECT COALESCE(json_agg(row_to_json(d)), '[]') FROM (
      SELECT s.id, s.name, s.aimag, s.district, s.brand_label,
             i.fuel_type, i.current_stock_liters::float8 AS liters, i.last_reported_at
        FROM fuel_station_inventory i
        JOIN fuel_stations s ON s.id = i.station_id
       WHERE i.status <> 'available' OR i.current_stock_liters <= 0
       ORDER BY s.aimag, s.name LIMIT 40) d),
  'totals', json_build_object(
    'operators', (SELECT COUNT(DISTINCT tenant_id)::int FROM fuel_stations),
    'stations', (SELECT COUNT(*)::int FROM fuel_stations),
    'depots', (SELECT COUNT(*)::int FROM fuel_depots),
    'in_transit', (SELECT COUNT(*)::int FROM fuel_dispatch_trips WHERE status = 'in_transit'),
    'in_transit_liters', (SELECT COALESCE(SUM(volume_liters), 0)::float8
                            FROM fuel_dispatch_trips WHERE status = 'in_transit'),
    'at_border', (SELECT COUNT(*)::int FROM fuel_customs_shipments WHERE status <> 'at_depot'),
    'received_7d_liters', (SELECT COALESCE(SUM(liters), 0)::float8
                             FROM fuel_station_receipts
                            WHERE received_at > NOW() - INTERVAL '7 days'),
    'batches_open', (SELECT COUNT(*)::int FROM fuel_batches
                      WHERE received_liters < imported_liters)
))::text`

func (m *Module) handleOperatorOverview(w http.ResponseWriter, r *http.Request) {
	status := operatorSessionStatus(r)
	if status != http.StatusOK {
		if status == http.StatusNotFound {
			nexus.Error(w, http.StatusNotFound, "not found")
			return
		}
		if status >= http.StatusInternalServerError {
			nexus.Error(w, status, "operator session could not be verified")
			return
		}
		nexus.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var body string
	if err := m.db.QueryRow(r.Context(), overviewQuery).Scan(&body); err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "42P01" {
			nexus.JSON(w, http.StatusOK, map[string]any{"installed": false})
			return
		}
		slog.Error("fuel overview: query failed", "error", err)
		nexus.Error(w, http.StatusInternalServerError, "could not load the overview")
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(body))
}
