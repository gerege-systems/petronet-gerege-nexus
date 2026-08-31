/*
 * PetroNet System
 * Copyright (c) 2026 Gerege Systems Development Team, Gerege Nomadica Foundation
 * Distributed under the Apache 2.0 License.
 *
 * Тээвэрлэлтийн телеметр.
 *
 * Өмнө нь энэ файл нийтэд зориулсан «замд яваа цистернүүд» хариултыг гаргаж,
 * газрын зураг дээр хөдөлдөг тэмдэглэгээ болгодог байсан. Тэр харагдац
 * бүхэлдээ хасагдав: түлш хаанаас авахыг хайж буй хүнд цистерн хаана явааг
 * хэлэх нь тусалдаггүй, харин аюултай ачааны байршлыг нийтэд зарлах нь
 * бодит эрсдэл байсан. Хамт явсан зүйлс: `PublicTrip`, замын дагуух
 * байрлалын интерполяци, зохиомол флот үүсгэгч.
 *
 * Үлдсэн нь бодит ажиллагаа: тээвэрлэгчийн төхөөрөмж байршлаа мэдээлэх зам.
 * Түүнийг хүлээн авалт (`/trips/{id}/receive`) түшиглэдэг бөгөөд ШТС-ийн
 * нөөц зөвхөн тэндээс өсдөг.
 */

package petro

import (
	"encoding/json"
	"net/http"

	"github.com/gerege-systems/open-gerege-nexus/backend/pkg/nexus"
	"github.com/go-chi/chi/v5"
)

// TelemetryReport is what a tracker on a tanker sends.
type TelemetryReport struct {
	Lat      float64  `json:"lat"`
	Lon      float64  `json:"lon"`
	SpeedKmh *float64 `json:"speed_kmh"`
	Heading  *float64 `json:"heading"`
}

// handleTripTelemetry records where a tanker says it is.
//
// Gated, and scoped by row-level policy to the organisation the caller is
// acting for: a position report is a write about somebody's vehicle, and an
// operator must not be able to move another operator's lorry. The policy is
// what enforces that — the UPDATE names no tenant and could not narrow itself
// if it wanted to.
func (m *Module) handleTripTelemetry(w http.ResponseWriter, r *http.Request) {
	if _, ok := nexus.RequireWorkspace(w, r); !ok {
		return
	}
	tripID := chi.URLParam(r, "id")

	var report TelemetryReport
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 4096)).Decode(&report); err != nil {
		nexus.Error(w, http.StatusBadRequest, "invalid payload")
		return
	}
	if report.Lat < -90 || report.Lat > 90 || report.Lon < -180 || report.Lon > 180 {
		nexus.Error(w, http.StatusBadRequest, "lat/lon out of range")
		return
	}

	tag, err := m.db.Exec(r.Context(), `
		UPDATE petro_dispatch_trips
		   SET current_lat = $2, current_lon = $3,
		       speed_kmh = $4, heading = $5,
		       reported_at = NOW(), updated_at = NOW()
		 WHERE id = $1 AND completed_at IS NULL`,
		tripID, report.Lat, report.Lon, report.SpeedKmh, report.Heading)
	if err != nil {
		nexus.Error(w, http.StatusInternalServerError, "could not record the position")
		return
	}
	if tag.RowsAffected() == 0 {
		nexus.Error(w, http.StatusNotFound, "no such delivery in progress")
		return
	}
	nexus.JSON(w, http.StatusOK, map[string]any{"recorded": true})
}
