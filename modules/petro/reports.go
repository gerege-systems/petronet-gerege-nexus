/*
 * Gerege Nexus
 * Copyright (c) 2026 Gerege Systems Development Team, Gerege Nomadica Foundation
 * Distributed under the Apache 2.0 License.
 *
 * The seven reports the requirement names, declared rather than built.
 *
 * The platform already owns a report engine: it runs the query under the
 * caller's tenant binding, renders the table, draws the chart, exports the
 * Excel and the CSV from the same Result, keeps a schedule and delivers the
 * finished thing by e-mail. Writing any of that again here would be writing a
 * second set of numbers that can disagree with the first.
 *
 * So a report in this file is a row of configuration: a key, a title, the
 * columns, and the SQL. One type carries all seven because they differ in
 * nothing else — this is not an abstraction over an unknown future, it is seven
 * instances of a shape that already exists seven times.
 *
 * # The daily list of who did not report
 *
 * `petro.coverage_gaps` is the cheapest thing this system does and the first
 * thing it should have done: the names of the companies that owe a figure and
 * have not sent one. It is a report rather than a bespoke mailer because the
 * engine already knows how to run something every morning at eight and send it
 * to a list of people — and because an official who wants it as a spreadsheet
 * then gets that for free.
 */

package petro

import (
	"context"
	"time"

	"github.com/gerege-systems/open-gerege-nexus/backend/pkg/nexus"
)

// The default windows below are written in days; the spec wants a duration.
const time24h = 24 * time.Hour

// sqlReport is one declared report.
type sqlReport struct {
	key     string
	titles  map[string]string
	columns []nexus.ColumnSpec
	params  []nexus.ParamSpec
	// query takes the two ends of the date range as $1 and $2.
	query string
}

func (r sqlReport) Key() string                 { return r.key }
func (r sqlReport) App() string                 { return ID }
func (r sqlReport) Titles() map[string]string   { return r.titles }
func (r sqlReport) Params() []nexus.ParamSpec   { return r.params }
func (r sqlReport) Columns() []nexus.ColumnSpec { return r.columns }

func (r sqlReport) Run(ctx context.Context, q nexus.Querier, p nexus.Params) (nexus.Result, error) {
	rows, err := q.Query(ctx, r.query, p.Time("period_from"), p.Time("period_to"))
	if err != nil {
		return nexus.Result{}, err
	}
	defer rows.Close()

	// Scanning into the declared columns, in their declared order: the header
	// of the export and the keys of the rows then cannot drift apart.
	collected, err := nexus.Collect(rows, func() (map[string]any, error) {
		values := make([]any, len(r.columns))
		pointers := make([]any, len(r.columns))
		for i := range values {
			pointers[i] = &values[i]
		}
		if err := rows.Scan(pointers...); err != nil {
			return nil, err
		}
		row := make(map[string]any, len(r.columns))
		for i, column := range r.columns {
			row[column.Key] = values[i]
		}
		return row, nil
	})
	if err != nil {
		return nexus.Result{}, err
	}

	return nexus.Result{Columns: r.columns, Rows: collected}, nil
}

// dateRange is the parameter every one of these takes.
func dateRange(defaultDays int) []nexus.ParamSpec {
	return []nexus.ParamSpec{{
		Key:           "period",
		Kind:          nexus.ParamDateRange,
		Titles:        map[string]string{"mn": "Хугацаа", "en": "Period"},
		Required:      true,
		DefaultWindow: time.Duration(defaultDays) * time24h,
	}}
}

func text(key, mn, en string) nexus.ColumnSpec {
	return nexus.ColumnSpec{Key: key, Kind: nexus.ColumnText,
		Titles: map[string]string{"mn": mn, "en": en}}
}

func number(key, mn, en string) nexus.ColumnSpec {
	return nexus.ColumnSpec{Key: key, Kind: nexus.ColumnNumber, Total: true,
		Titles: map[string]string{"mn": mn, "en": en}}
}

func money(key, mn, en string) nexus.ColumnSpec {
	return nexus.ColumnSpec{Key: key, Kind: nexus.ColumnMoney,
		Titles: map[string]string{"mn": mn, "en": en}}
}

func category(key, mn, en string) nexus.ColumnSpec {
	return nexus.ColumnSpec{Key: key, Kind: nexus.ColumnText, Chart: nexus.ChartCategory,
		Titles: map[string]string{"mn": mn, "en": en}}
}

// latestLines is the subquery every line-reading report starts from.
//
// Audit §10: the four aggregates filtered on `status IN ('submitted','approved')`
// and nothing more, so a company that corrected a report had both versions
// summed — the day's sales doubled, the price averaged twice, and the national
// days-of-supply came out five times low. The refresh statement had known the
// right answer all along (DISTINCT ON … ORDER BY version DESC); these four had
// simply never been given it.
const latestLines = `
	SELECT DISTINCT ON (l.site_kind, l.site_id, l.product_code, p.period_start)
	       l.*, p.period_start
	  FROM petro_report_lines l
	  JOIN petro_report_submissions s ON s.id = l.submission_id
	  JOIN petro_report_periods p ON p.id = s.period_id
	 WHERE s.status IN ('submitted', 'approved')
	   AND p.period_start BETWEEN $1::date AND $2::date
	 ORDER BY l.site_kind, l.site_id, l.product_code, p.period_start, s.version DESC`

// RegisterReports declares this module's reports with the engine.
//
// Called from New, like the metrics: a report that has to be wired up in a
// distribution's main.go is a report every distribution forgets.
func RegisterReports() {
	for _, report := range []sqlReport{
		{
			key:    "petro.stock",
			titles: map[string]string{"mn": "Үлдэгдлийн тайлан", "en": "Stock report"},
			params: dateRange(30),
			columns: []nexus.ColumnSpec{
				text("day", "Огноо", "Day"),
				category("product", "Бүтээгдэхүүн", "Product"),
				text("aimag", "Аймаг", "Province"),
				number("stock_liters", "Үлдэгдэл (л)", "Stock (l)"),
				number("capacity_liters", "Багтаамж (л)", "Capacity (l)"),
				number("sites_reported", "Тайлагнасан", "Reported"),
				number("sites_total", "Нийт объект", "Sites"),
			},
			query: `
				SELECT n.day::text, pr.label_mn, n.aimag,
				       n.stock_liters::float8, n.capacity_liters::float8,
				       n.sites_reported, n.sites_total
				  FROM petro_daily_national n
				  JOIN petro_products pr ON pr.code = n.product_code
				 WHERE n.day BETWEEN $1::date AND $2::date
				 ORDER BY n.day DESC, pr.sort_order, n.aimag`,
		},
		{
			key:    "petro.imports",
			titles: map[string]string{"mn": "Импортын тайлан", "en": "Import report"},
			params: dateRange(90),
			columns: []nexus.ColumnSpec{
				text("month", "Сар", "Month"),
				category("border_port", "Боомт", "Border post"),
				text("fuel", "Бүтээгдэхүүн", "Product"),
				number("liters", "Литр", "Litres"),
				number("shipments", "Мэдүүлэг", "Declarations"),
			},
			query: `
				SELECT to_char(entered_at, 'YYYY-MM'),
				       COALESCE(NULLIF(border_port, ''), '—'),
				       COALESCE(NULLIF(fuel_label, ''), fuel_type),
				       SUM(declared_liters)::float8, COUNT(*)::int
				  FROM petro_customs_shipments
				 WHERE entered_at::date BETWEEN $1::date AND $2::date
				 GROUP BY 1, 2, 3
				 ORDER BY 1 DESC, 4 DESC`,
		},
		{
			key:    "petro.retail_sales",
			titles: map[string]string{"mn": "Жижиглэн борлуулалтын тайлан", "en": "Retail sales"},
			params: dateRange(30),
			columns: []nexus.ColumnSpec{
				text("site", "ШТС", "Station"),
				text("aimag", "Аймаг", "Province"),
				category("product", "Бүтээгдэхүүн", "Product"),
				number("sales_liters", "Борлуулалт (л)", "Sales (l)"),
				money("avg_price", "Дундаж үнэ", "Average price"),
			},
			query: `
				WITH lines AS (` + latestLines + `)
				SELECT st.name, COALESCE(NULLIF(st.aimag, ''), '—'), pr.label_mn,
				       SUM(l.sales_liters)::float8, AVG(l.price_mnt)::float8
				  FROM lines l
				  JOIN petro_stations st ON st.id = l.site_id
				  JOIN petro_products pr ON pr.code = l.product_code
				 WHERE l.site_kind = 'station'
				 GROUP BY st.id, st.name, st.aimag, pr.label_mn, pr.sort_order
				 ORDER BY 4 DESC`,
		},
		{
			key:    "petro.wholesale",
			titles: map[string]string{"mn": "Бөөний борлуулалтын тайлан", "en": "Wholesale"},
			params: dateRange(30),
			columns: []nexus.ColumnSpec{
				text("depot", "Бааз", "Depot"),
				category("product", "Бүтээгдэхүүн", "Product"),
				number("transfers_liters", "Гарсан (л)", "Dispatched (l)"),
				number("receipts_liters", "Орсон (л)", "Received (l)"),
			},
			query: `
				WITH lines AS (` + latestLines + `)
				SELECT dp.name, pr.label_mn,
				       SUM(l.transfers_out_liters + l.sales_liters)::float8,
				       SUM(l.receipts_liters)::float8
				  FROM lines l
				  JOIN petro_depots dp ON dp.id = l.site_id
				  JOIN petro_products pr ON pr.code = l.product_code
				 WHERE l.site_kind = 'depot'
				 GROUP BY dp.id, dp.name, pr.label_mn, pr.sort_order
				 ORDER BY 3 DESC`,
		},
		{
			key:    "petro.prices",
			titles: map[string]string{"mn": "Шатахууны үнийн тайлан", "en": "Fuel prices"},
			params: dateRange(30),
			columns: []nexus.ColumnSpec{
				text("day", "Огноо", "Day"),
				category("product", "Бүтээгдэхүүн", "Product"),
				text("aimag", "Аймаг", "Province"),
				money("avg_price", "Дундаж үнэ", "Average price"),
				money("min_price", "Хамгийн бага", "Lowest"),
				money("max_price", "Хамгийн их", "Highest"),
			},
			query: `
				WITH lines AS (` + latestLines + `)
				SELECT l.period_start::text, pr.label_mn,
				       COALESCE(NULLIF(st.aimag, ''), '—'),
				       AVG(l.price_mnt)::float8, MIN(l.price_mnt)::float8, MAX(l.price_mnt)::float8
				  FROM lines l
				  JOIN petro_stations st ON st.id = l.site_id
				  JOIN petro_products pr ON pr.code = l.product_code
				 WHERE l.site_kind = 'station' AND l.price_mnt IS NOT NULL
				 GROUP BY l.period_start, pr.label_mn, pr.sort_order, st.aimag
				 ORDER BY 1 DESC, pr.sort_order`,
		},
		{
			key:    "petro.balance",
			titles: map[string]string{"mn": "Нэгдсэн балансын тайлан", "en": "Fuel balance"},
			params: dateRange(30),
			columns: []nexus.ColumnSpec{
				text("day", "Огноо", "Day"),
				category("product", "Бүтээгдэхүүн", "Product"),
				number("opening", "Нээлт (л)", "Opening (l)"),
				number("receipts", "Хүлээн авалт (л)", "Receipts (l)"),
				number("sales", "Борлуулалт (л)", "Sales (l)"),
				number("closing", "Хаалт (л)", "Closing (l)"),
				number("closing_15c", "Хаалт 15 °C (л)", "Closing at 15 °C (l)"),
				number("variance", "Зөрүү (л)", "Variance (l)"),
			},
			query: `
				WITH lines AS (` + latestLines + `)
				SELECT l.period_start::text, pr.label_mn,
				       SUM(l.opening_liters)::float8, SUM(l.receipts_liters)::float8,
				       SUM(l.sales_liters)::float8, SUM(l.closing_liters)::float8,
				       SUM(COALESCE(l.closing_liters_15c, l.closing_liters))::float8,
				       SUM(l.variance_liters)::float8
				  FROM lines l
				  JOIN petro_products pr ON pr.code = l.product_code
				 GROUP BY l.period_start, pr.label_mn, pr.sort_order
				 ORDER BY 1 DESC, pr.sort_order`,
		},
		{
			key:    "petro.coverage_gaps",
			titles: map[string]string{"mn": "Тайлан ирүүлээгүй байгууллага", "en": "Missing reports"},
			params: dateRange(7),
			columns: []nexus.ColumnSpec{
				text("day", "Огноо", "Day"),
				text("tenant", "Байгууллага", "Company"),
				number("sites", "Объект", "Sites"),
				text("last_reported", "Сүүлд ирүүлсэн", "Last submission"),
			},
			query: `
				WITH holders AS (
					SELECT tenant_id, COUNT(*)::int AS sites FROM (
						SELECT tenant_id FROM petro_stations WHERE registry_status <> 'closed'
						UNION ALL
						SELECT tenant_id FROM petro_depots WHERE registry_status <> 'closed') s
					 GROUP BY tenant_id)
				SELECT p.period_start::text, t.name, h.sites,
				       COALESCE((SELECT MAX(s2.submitted_at)::text
				                   FROM petro_report_submissions s2
				                  WHERE s2.tenant_id = h.tenant_id), '—')
				  FROM petro_report_periods p
				 CROSS JOIN holders h
				  JOIN registry.tenants t ON t.id = h.tenant_id
				 WHERE p.period_start BETWEEN $1::date AND $2::date
				   AND p.due_at < NOW()
				   AND NOT EXISTS (
				       SELECT 1 FROM petro_report_submissions s
				        WHERE s.tenant_id = h.tenant_id AND s.period_id = p.id
				          AND s.status IN ('submitted', 'approved'))
				 ORDER BY p.period_start DESC, h.sites DESC`,
		},
	} {
		nexus.RegisterReport(report)
	}
}
