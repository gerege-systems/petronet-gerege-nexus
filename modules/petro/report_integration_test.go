package petro

// The regulatory loop, asserted against a real database.
//
// Four of the rules below are not enforced by any Go branch and cannot be seen
// in a unit test: the row-level policy that hides one company's figures from
// another and shows them to the ministry, the unique index that stops a period
// being answered twice at the same version, the four-eyes rule, and the hash
// chain that links each submission to the one before it. Those are exactly the
// rules that stop holding without anybody noticing.
//
//	DATABASE_URL=postgres://... go test ./modules/petro/...

import (
	"context"
	"net/http"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// period opens a reporting window and answers its id.
func makePeriod(t *testing.T, pool *pgxpool.Pool, start string) string {
	t.Helper()
	var id string
	err := pool.QueryRow(context.Background(), `
		INSERT INTO petro_report_periods (kind, period_start, period_end, due_at)
		VALUES ('daily', $1::date, $1::date, $1::date + INTERVAL '36 hours')
		RETURNING id::text`, start).Scan(&id)
	if err != nil {
		t.Fatalf("create period: %v", err)
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(),
			`DELETE FROM petro_report_periods WHERE id = $1::uuid`, id)
	})
	return id
}

// appoint makes this organisation a supervisory body.
func (c *company) appoint(t *testing.T, pool *pgxpool.Pool) {
	t.Helper()
	if _, err := pool.Exec(context.Background(), `
		INSERT INTO petro_oversight_bodies (tenant_id, name, scope)
		VALUES ($1::uuid, 'Зохицуулагч (тест)', 'national')`, c.tenantID); err != nil {
		t.Fatalf("appoint oversight body: %v", err)
	}
}

// sells registers a forecourt with one grade, which is what gives it a line on
// the report form.
func (c *company) sells(t *testing.T, name string, capacity, price float64) string {
	t.Helper()
	stationID := c.forecourt(t, name)
	rec := c.call(t, c.module.handleSetStationGrade, http.MethodPut, "/stations/x/grades",
		GradeDraft{FuelType: "ai92", PriceMNT: &price, CapacityLiters: &capacity},
		map[string]string{"id": stationID})
	if rec.Code != http.StatusOK {
		t.Fatalf("set grade: %d %s", rec.Code, rec.Body.String())
	}
	return stationID
}

func reportLine(stationID string, opening, receipts, sales, closing float64) ReportLine {
	temp, density := 12.0, 745.0
	price := 3190.0
	return ReportLine{
		SiteKind: "station", SiteID: stationID, ProductCode: "ai92",
		Opening: opening, Receipts: receipts, Sales: sales, Closing: closing,
		PriceMNT: &price, TemperatureC: &temp, DensityKgM3: &density,
	}
}

type submitResponse struct {
	Submission Submission `json:"submission"`
	Findings   []Finding  `json:"findings"`
}

func (c *company) submit(t *testing.T, periodID string, lines ...ReportLine) submitResponse {
	t.Helper()
	rec := c.call(t, c.module.handleSubmit, http.MethodPost, "/report/periods/x/submissions",
		SubmissionDraft{Lines: lines}, map[string]string{"id": periodID})
	if rec.Code != http.StatusCreated {
		t.Fatalf("submit: %d %s", rec.Code, rec.Body.String())
	}
	return decode[submitResponse](t, rec)
}

func TestABalancedSubmissionIsAccepted(t *testing.T) {
	pool := openFuelPool(t)
	filler := newCompany(t, pool, "balanced")
	station := filler.sells(t, "Тайлант ШТС", 30000, 3190)
	period := makePeriod(t, pool, "2026-09-01")

	answer := filler.submit(t, period, reportLine(station, 0, 20000, 19000, 1000))

	if answer.Submission.Status != StatusSubmitted {
		t.Fatalf("status = %q, want %q (findings: %+v)",
			answer.Submission.Status, StatusSubmitted, answer.Findings)
	}
	if answer.Submission.ErrorCount != 0 {
		t.Fatalf("a balanced report produced %d errors: %+v",
			answer.Submission.ErrorCount, answer.Findings)
	}
	if answer.Submission.Hash == "" {
		t.Fatal("the submission was not placed in the chain")
	}
}

func TestAnUnbalancedSubmissionIsReturnedByTheSystem(t *testing.T) {
	pool := openFuelPool(t)
	filler := newCompany(t, pool, "gap")
	station := filler.sells(t, "Зөрүүтэй ШТС", 30000, 3190)
	period := makePeriod(t, pool, "2026-09-02")

	// 0 + 20000 − 19000 = 1000, but 600 is claimed.
	answer := filler.submit(t, period, reportLine(station, 0, 20000, 19000, 600))

	if answer.Submission.Status != StatusReturned {
		t.Fatalf("status = %q, want %q", answer.Submission.Status, StatusReturned)
	}
	found := false
	for _, f := range answer.Findings {
		if f.Rule == "balance_mismatch" && f.Severity == SeverityError {
			found = true
		}
	}
	if !found {
		t.Fatalf("no balance finding on a 400-litre gap: %+v", answer.Findings)
	}

	// The figures are kept, not discarded: a returned report is evidence.
	var stored int
	if err := pool.QueryRow(context.Background(),
		`SELECT COUNT(*)::int FROM petro_report_lines WHERE submission_id = $1::uuid`,
		answer.Submission.ID).Scan(&stored); err != nil {
		t.Fatalf("count lines: %v", err)
	}
	if stored != 1 {
		t.Fatalf("a returned submission kept %d lines, want 1", stored)
	}
}

func TestOnlyASupervisoryBodySeesAnotherCompanysReport(t *testing.T) {
	pool := openFuelPool(t)
	filler := newCompany(t, pool, "watched")
	rival := newCompany(t, pool, "rival")
	ministry := newCompany(t, pool, "ministry")
	ministry.appoint(t, pool)

	station := filler.sells(t, "Хараат ШТС", 30000, 3190)
	period := makePeriod(t, pool, "2026-09-03")
	answer := filler.submit(t, period, reportLine(station, 0, 20000, 19000, 1000))

	rec := rival.call(t, rival.module.handleReadSubmission, http.MethodGet,
		"/report/submissions/x", nil, map[string]string{"id": answer.Submission.ID})
	if rec.Code != http.StatusNotFound {
		t.Fatalf("a rival read another company's report: %d %s", rec.Code, rec.Body.String())
	}

	rec = ministry.call(t, ministry.module.handleReadSubmission, http.MethodGet,
		"/report/submissions/x", nil, map[string]string{"id": answer.Submission.ID})
	if rec.Code != http.StatusOK {
		t.Fatalf("the ministry could not read the report: %d %s", rec.Code, rec.Body.String())
	}
}

func TestTheSubmitterCannotApproveTheirOwnReport(t *testing.T) {
	pool := openFuelPool(t)
	ministry := newCompany(t, pool, "foureyes")
	ministry.appoint(t, pool)

	// The ministry reporting on its own forecourt is contrived, and it is the
	// cheapest way to put the same user on both ends of the workflow — which is
	// exactly what the rule has to refuse.
	station := ministry.sells(t, "Яамны ШТС", 30000, 3190)
	period := makePeriod(t, pool, "2026-09-04")
	answer := ministry.submit(t, period, reportLine(station, 0, 20000, 19000, 1000))

	rec := ministry.call(t, ministry.module.handleReview(StatusApproved), http.MethodPost,
		"/oversight/submissions/x/approve", Verdict{}, map[string]string{"id": answer.Submission.ID})
	if rec.Code != http.StatusForbidden {
		t.Fatalf("the submitter approved their own report: %d %s", rec.Code, rec.Body.String())
	}

	// A second official in the same body may.
	second := &company{module: ministry.module, tenantID: ministry.tenantID, userID: uuid.NewString()}
	rec = second.call(t, second.module.handleReview(StatusApproved), http.MethodPost,
		"/oversight/submissions/x/approve", Verdict{}, map[string]string{"id": answer.Submission.ID})
	if rec.Code != http.StatusOK {
		t.Fatalf("a second official could not approve: %d %s", rec.Code, rec.Body.String())
	}
	if decode[Submission](t, rec).Status != StatusApproved {
		t.Fatal("the approval did not stick")
	}
}

func TestAReturnedReportIsCorrectedByANewVersion(t *testing.T) {
	pool := openFuelPool(t)
	filler := newCompany(t, pool, "versions")
	station := filler.sells(t, "Хоёр хувилбар ШТС", 30000, 3190)
	period := makePeriod(t, pool, "2026-09-05")

	first := filler.submit(t, period, reportLine(station, 0, 20000, 19000, 600))
	second := filler.submit(t, period, reportLine(station, 0, 20000, 19000, 1000))

	if first.Submission.Version != 1 || second.Submission.Version != 2 {
		t.Fatalf("versions = %d, %d; want 1, 2",
			first.Submission.Version, second.Submission.Version)
	}
	if second.Submission.Status != StatusSubmitted {
		t.Fatalf("the corrected version was not accepted: %q", second.Submission.Status)
	}

	// Both versions survive. The first one, with its findings, is the record of
	// what was claimed before the correction.
	var versions int
	if err := pool.QueryRow(context.Background(), `
		SELECT COUNT(*)::int FROM petro_report_submissions WHERE period_id = $1::uuid`,
		period).Scan(&versions); err != nil {
		t.Fatalf("count versions: %v", err)
	}
	if versions != 2 {
		t.Fatalf("kept %d versions, want 2", versions)
	}

	// And the chain links them.
	var linked bool
	if err := pool.QueryRow(context.Background(), `
		SELECT (SELECT prev_hash FROM petro_report_submissions WHERE id = $2::uuid)
		     = (SELECT hash FROM petro_report_submissions WHERE id = $1::uuid)`,
		first.Submission.ID, second.Submission.ID).Scan(&linked); err != nil {
		t.Fatalf("read the chain: %v", err)
	}
	if !linked {
		t.Fatal("the second submission does not carry the first's hash")
	}
}

func TestTheNationalTableCountsWhoDidNotReport(t *testing.T) {
	pool := openFuelPool(t)
	filler := newCompany(t, pool, "coverage")
	ministry := newCompany(t, pool, "coverage-ministry")
	ministry.appoint(t, pool)

	reporting := filler.sells(t, "Тайлагнасан ШТС", 30000, 3190)
	filler.sells(t, "Чимээгүй ШТС", 30000, 3190)
	period := makePeriod(t, pool, "2026-09-06")
	filler.submit(t, period, reportLine(reporting, 0, 20000, 19000, 1000))

	day, err := time.Parse("2006-01-02", "2026-09-06")
	if err != nil {
		t.Fatalf("parse day: %v", err)
	}
	// The refresh runs outside any workspace, as the scheduled job does.
	if err := (&Module{db: pool}).RefreshDaily(context.Background(), day); err != nil {
		t.Fatalf("refresh: %v", err)
	}

	var total, reported int
	if err := pool.QueryRow(context.Background(), `
		SELECT SUM(sites_total)::int, SUM(sites_reported)::int
		  FROM petro_daily_national WHERE day = $1::date`, "2026-09-06").
		Scan(&total, &reported); err != nil {
		t.Fatalf("read the national table: %v", err)
	}
	if total < 2 || reported < 1 || reported >= total {
		t.Fatalf("coverage = %d of %d; want one of two reporting", reported, total)
	}
}

func TestAMovementIsOpenedAndClosedWithItsGap(t *testing.T) {
	pool := openFuelPool(t)
	hauler := newCompany(t, pool, "movement")
	depotID, _ := hauler.base(t, 100000)
	stationID := hauler.sells(t, "Хүлээн авагч ШТС", 30000, 3190)

	rec := hauler.call(t, hauler.module.handleOpenMovement, http.MethodPost, "/movements",
		MovementDraft{
			FromKind: "depot", FromID: depotID, ToKind: "station", ToID: stationID,
			ProductCode: "ai92", DeclaredLiters: 20000,
		}, nil)
	if rec.Code != http.StatusCreated {
		t.Fatalf("open movement: %d %s", rec.Code, rec.Body.String())
	}
	opened := decode[Movement](t, rec)
	if opened.NationalRef == "" || opened.Status != "open" {
		t.Fatalf("movement came back as %+v", opened)
	}

	rec = hauler.call(t, hauler.module.handleCloseMovement, http.MethodPost,
		"/movements/x/receive", MovementReceipt{ReceivedLiters: 19800},
		map[string]string{"id": opened.ID})
	if rec.Code != http.StatusOK {
		t.Fatalf("close movement: %d %s", rec.Code, rec.Body.String())
	}
	closed := decode[Movement](t, rec)
	if closed.Status != "closed" {
		t.Fatalf("status = %q, want closed", closed.Status)
	}
	if closed.VariancePct == nil || *closed.VariancePct < 0.9 || *closed.VariancePct > 1.1 {
		t.Fatalf("variance = %v, want about 1%%", closed.VariancePct)
	}

	// Closing it twice is not a second delivery.
	rec = hauler.call(t, hauler.module.handleCloseMovement, http.MethodPost,
		"/movements/x/receive", MovementReceipt{ReceivedLiters: 19800},
		map[string]string{"id": opened.ID})
	if rec.Code != http.StatusConflict {
		t.Fatalf("a closed movement was closed again: %d", rec.Code)
	}
}

// ── аудитын §4 ба §5-ын засварыг барих тестүүд ───────────────────────────────

// The policy this replaced was FOR UPDATE and knew nothing about columns, so a
// manager inside a supervisory body could rewrite any company's register: its
// name, its coordinates, its licence number. Only the status may cross the
// ownership line, and only through the named action.
func TestAnOversightBodyCannotRewriteAnotherCompanysRegister(t *testing.T) {
	pool := openFuelPool(t)
	owner := newCompany(t, pool, "owned")
	ministry := newCompany(t, pool, "rewriter")
	ministry.appoint(t, pool)

	stationID := owner.sells(t, "Хамгаалагдсан ШТС", 30000, 3190)

	lat, lon := 1.0, 1.0
	rec := ministry.call(t, ministry.module.handleUpdateStation, http.MethodPatch,
		"/stations/x", StationDraft{Name: "Булаасан нэр", Brand: "x", Lat: &lat, Lon: &lon},
		map[string]string{"id": stationID})
	if rec.Code == http.StatusOK {
		t.Fatalf("a supervisory body rewrote another company's station: %s", rec.Body.String())
	}

	var name string
	if err := pool.QueryRow(context.Background(),
		`SELECT name FROM petro_stations WHERE id = $1::uuid`, stationID).Scan(&name); err != nil {
		t.Fatalf("read the station: %v", err)
	}
	if name != "Хамгаалагдсан ШТС" {
		t.Fatalf("the station's name is now %q", name)
	}

	// Suspending it, though, is exactly what a supervisory body is for.
	rec = ministry.call(t, ministry.module.handleSetSiteStatus, http.MethodPost,
		"/oversight/sites/station/x/status",
		SiteStatusChange{RegistryStatus: "suspended", Note: "шалгалт"},
		map[string]string{"kind": "station", "id": stationID})
	if rec.Code != http.StatusOK {
		t.Fatalf("suspend: %d %s", rec.Code, rec.Body.String())
	}
}

// An ordinary company must not be able to suspend anything at all.
func TestOnlyAnOversightBodyCanSuspendASite(t *testing.T) {
	pool := openFuelPool(t)
	owner := newCompany(t, pool, "self-suspend")
	stationID := owner.sells(t, "Өөрийн ШТС", 30000, 3190)

	rec := owner.call(t, owner.module.handleSetSiteStatus, http.MethodPost,
		"/oversight/sites/station/x/status",
		SiteStatusChange{RegistryStatus: "closed"},
		map[string]string{"kind": "station", "id": stationID})
	if rec.Code != http.StatusForbidden {
		t.Fatalf("a company suspended a site itself: %d %s", rec.Code, rec.Body.String())
	}
}

// The refresh button answered 42501 on every press: the handler runs inside the
// workspace gate, and the tenant role held SELECT on the national table and
// nothing more. The integration test called RefreshDaily on the raw pool, so
// the HTTP path was never exercised — this one goes through the handler.
func TestTheRefreshButtonWorksFromInsideTheWorkspaceGate(t *testing.T) {
	pool := openFuelPool(t)
	ministry := newCompany(t, pool, "refresher")
	ministry.appoint(t, pool)

	rec := ministry.call(t, ministry.module.handleRefreshDaily, http.MethodPost,
		"/oversight/daily/refresh?day=2026-09-07", nil, nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("refresh from the tenant role: %d %s", rec.Code, rec.Body.String())
	}
}

// A day recomputed after its last site closed must lose the row, not keep the
// stock it held — a pure upsert left ghost litres in the national total.
func TestRefreshRetiresTheRowsOfAClosedSite(t *testing.T) {
	pool := openFuelPool(t)
	filler := newCompany(t, pool, "ghost")
	ministry := newCompany(t, pool, "ghost-ministry")
	ministry.appoint(t, pool)

	station := filler.sells(t, "Хаагдах ШТС", 30000, 3190)
	period := makePeriod(t, pool, "2026-09-08")
	filler.submit(t, period, reportLine(station, 0, 20000, 19000, 1000))

	day, _ := time.Parse("2006-01-02", "2026-09-08")
	module := &Module{db: pool}
	if err := module.RefreshDaily(context.Background(), day); err != nil {
		t.Fatalf("first refresh: %v", err)
	}

	var before float64
	if err := pool.QueryRow(context.Background(),
		`SELECT COALESCE(SUM(stock_liters), 0)::float8 FROM petro_daily_national WHERE day = $1::date`,
		"2026-09-08").Scan(&before); err != nil {
		t.Fatalf("read the day: %v", err)
	}
	if before < 1000 {
		t.Fatalf("the first refresh recorded %v litres, want the reported 1000", before)
	}

	if _, err := pool.Exec(context.Background(),
		`UPDATE petro_stations SET registry_status = 'closed' WHERE id = $1::uuid`, station); err != nil {
		t.Fatalf("close the station: %v", err)
	}
	if err := module.RefreshDaily(context.Background(), day); err != nil {
		t.Fatalf("second refresh: %v", err)
	}

	var after float64
	if err := pool.QueryRow(context.Background(),
		`SELECT COALESCE(SUM(stock_liters), 0)::float8 FROM petro_daily_national WHERE day = $1::date`,
		"2026-09-08").Scan(&after); err != nil {
		t.Fatalf("read the day again: %v", err)
	}
	if after != 0 {
		t.Fatalf("a closed site left %v litres in the national total", after)
	}
}
