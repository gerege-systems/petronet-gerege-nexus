package petro

import "testing"

// A helper so the cases below read as the numbers a station would write down.
func line(opening, receipts, sales, closing float64) ReportLine {
	temp, density := 12.0, 745.0
	price := 3190.0
	return ReportLine{
		SiteKind: "station", SiteID: "s-1", ProductCode: "ai92",
		Opening: opening, Receipts: receipts, Sales: sales, Closing: closing,
		PriceMNT: &price, TemperatureC: &temp, DensityKgM3: &density,
	}
}

func knownSite(capacity float64, prevClosing *float64) LineContext {
	return LineContext{
		SiteExists: true, SiteName: "Тест ШТС",
		CapacityLiters: capacity, PrevClosing: prevClosing,
		JODICategory: "motor_gasoline",
	}
}

func rules(findings []Finding) map[string]string {
	out := map[string]string{}
	for _, f := range findings {
		out[f.Rule] = f.Severity
	}
	return out
}

func TestABalancedLineIsAccepted(t *testing.T) {
	t.Parallel()

	opening := 8000.0
	got := ValidateLine(line(8000, 20000, 19000, 9000), knownSite(30000, &opening), DefaultPolicy())
	if len(got) != 0 {
		t.Fatalf("clean line produced findings: %+v", got)
	}
}

func TestTheBalanceCatchesAGap(t *testing.T) {
	t.Parallel()

	opening := 8000.0
	// 8000 + 20000 − 19000 = 9000, but 8600 is claimed: 400 litres gone.
	got := rules(ValidateLine(line(8000, 20000, 19000, 8600), knownSite(30000, &opening), DefaultPolicy()))
	if got["balance_mismatch"] != SeverityError {
		t.Fatalf("a 400-litre gap must be an error, got %v", got)
	}
}

// 0.5% of 28,000 litres is 140, so a 100-litre residual is inside the day's
// tolerance and must not return the report.
func TestASmallResidualIsWithinTolerance(t *testing.T) {
	t.Parallel()

	opening := 8000.0
	got := rules(ValidateLine(line(8000, 20000, 19000, 8900), knownSite(30000, &opening), DefaultPolicy()))
	if _, found := got["balance_mismatch"]; found {
		t.Fatalf("100 litres on 28,000 should be inside 0.5%%, got %v", got)
	}
}

// A tiny site must not be judged by a percentage of almost nothing.
func TestASmallSiteIsJudgedInLitres(t *testing.T) {
	t.Parallel()

	opening := 40.0
	clean := ValidateLine(line(40, 10, 20, 30), knownSite(1000, &opening), DefaultPolicy())
	if len(clean) != 0 {
		t.Fatalf("an exactly balanced small site produced findings: %+v", clean)
	}

	got := rules(ValidateLine(line(40, 10, 20, 25), knownSite(1000, &opening), DefaultPolicy()))
	if got["balance_mismatch"] != SeverityError {
		t.Fatalf("five litres missing from a small site is still an error, got %v", got)
	}
}

func TestOpeningMustContinueThePreviousClosing(t *testing.T) {
	t.Parallel()

	prev := 9000.0
	// The balance itself is fine; only the opening was overwritten.
	got := rules(ValidateLine(line(8000, 20000, 19000, 9000), knownSite(30000, &prev), DefaultPolicy()))
	if got["continuity_broken"] != SeverityError {
		t.Fatalf("a rewritten opening must be an error, got %v", got)
	}
}

func TestClosingAboveCapacityIsRefused(t *testing.T) {
	t.Parallel()

	opening := 8000.0
	got := rules(ValidateLine(line(8000, 40000, 0, 48000), knownSite(30000, &opening), DefaultPolicy()))
	if got["capacity_exceeded"] != SeverityError {
		t.Fatalf("a tank cannot hold more than it holds, got %v", got)
	}
}

func TestUnknownSiteStopsTheLine(t *testing.T) {
	t.Parallel()

	got := ValidateLine(line(8000, 20000, 19000, 9000), LineContext{JODICategory: "motor_gasoline"}, DefaultPolicy())
	if len(got) != 1 || got[0].Rule != "site_unknown" {
		t.Fatalf("an unknown site should produce exactly one finding, got %+v", got)
	}
}

func TestUnusualIsAWarningNotAnError(t *testing.T) {
	t.Parallel()

	prev := 8000.0
	l := line(8000, 0, 7000, 1000) // balanced, but the stock fell by 87%
	got := rules(ValidateLine(l, knownSite(30000, &prev), DefaultPolicy()))
	if got["deviation"] != SeverityWarning {
		t.Fatalf("a large but balanced swing is a warning, got %v", got)
	}
	if got["balance_mismatch"] != "" {
		t.Fatalf("the line balances; it must not also be an error: %v", got)
	}
}

func TestImplausibleMetrologyIsAnErrorAndMissingIsAWarning(t *testing.T) {
	t.Parallel()

	opening := 8000.0

	missing := line(8000, 20000, 19000, 9000)
	missing.TemperatureC, missing.DensityKgM3 = nil, nil
	if rules(ValidateLine(missing, knownSite(30000, &opening), DefaultPolicy()))["metrology_missing"] != SeverityWarning {
		t.Fatal("a blank temperature is a warning, not a refusal")
	}

	typo := line(8000, 20000, 19000, 9000)
	density := 7.45
	typo.DensityKgM3 = &density
	if rules(ValidateLine(typo, knownSite(30000, &opening), DefaultPolicy()))["density_implausible"] != SeverityError {
		t.Fatal("a density of 7.45 must be refused, not multiplied through")
	}
}

func TestCountBySeverity(t *testing.T) {
	t.Parallel()

	errors, warnings := CountBySeverity([]Finding{
		{Severity: SeverityError}, {Severity: SeverityWarning}, {Severity: SeverityError},
	})
	if errors != 2 || warnings != 1 {
		t.Fatalf("counts = %d errors, %d warnings; want 2, 1", errors, warnings)
	}
}
