/*
 * Gerege Nexus
 * Copyright (c) 2026 Gerege Systems Development Team, Gerege Nomadica Foundation
 * Distributed under the Apache 2.0 License.
 *
 * What makes a submitted figure a figure the state can use.
 *
 * # Why this file has no database in it
 *
 * Every rule below is a function of the line and what is already known about
 * the site it describes. Nothing here reads a row, which means every rule can
 * be tested by writing down two numbers and the answer — and a rule that is
 * cheap to test is a rule somebody will add rather than work around. The
 * caller assembles the context; this file only judges.
 *
 * # The balance is the rule the rest exist to protect
 *
 *	opening + receipts − sales − transfers ± adjustments = closing
 *
 * That equation is the whole of statistical inventory reconciliation at one
 * day's resolution: EPA's UST method is this arithmetic accumulated over
 * thirty days with a t-test on the residual. It needs no gauge, no ATG and no
 * sensor — three numbers a person already writes down, and the difference
 * between what they imply and what is claimed. The system does not say whether
 * a gap is loss, theft or a badly calibrated meter. It says the gap exists,
 * which is the sentence nobody could say before.
 *
 * Every other rule is there so that the balance means something: a negative
 * litre, a closing figure above the vessel's capacity or an opening that does
 * not continue yesterday's closing would each let the equation balance while
 * describing a tank that cannot exist.
 *
 * # Errors return the report, warnings mark it
 *
 * A returned report costs the sender an evening and the regulator a day, so
 * the line is drawn at what the sender can actually fix: a wrong number is an
 * error, an unusual one is a warning. A month of warnings is a conversation;
 * a month of errors is a system nobody uses.
 */

package petro

import (
	"fmt"
	"math"
)

// Severity levels, as stored in petro_validation_findings.
const (
	SeverityError   = "error"
	SeverityWarning = "warning"
)

// Finding is one thing wrong with one line.
//
// Rule is stable and machine-readable; Message is what the sender reads. The
// two are separate because the message will be translated and reworded and the
// rule must not move when it is.
type Finding struct {
	Rule     string         `json:"rule"`
	Severity string         `json:"severity"`
	Message  string         `json:"message"`
	Detail   map[string]any `json:"detail,omitempty"`
}

// ReportLine is one site, one grade, one period, as submitted.
//
// The five terms of the balance are plain float64 and the observations are
// pointers: a missing temperature is a different fact from a temperature of
// zero, and in this country the difference is a hundred degrees.
type ReportLine struct {
	SiteKind    string `json:"site_kind"`
	SiteID      string `json:"site_id"`
	ProductCode string `json:"product_code"`

	Opening      float64 `json:"opening_liters"`
	Receipts     float64 `json:"receipts_liters"`
	Sales        float64 `json:"sales_liters"`
	TransfersOut float64 `json:"transfers_out_liters"`
	Adjustments  float64 `json:"adjustments_liters"`
	Closing      float64 `json:"closing_liters"`

	PriceMNT     *float64 `json:"price_mnt"`
	TemperatureC *float64 `json:"temperature_c"`
	DensityKgM3  *float64 `json:"density_kg_m3"`

	Note string `json:"note"`
}

// LineContext is what the system already knows about the site the line names.
//
// Assembled by the caller from the register and the previous period. A zero
// value describes a site the system has never heard of, which is itself the
// first thing checked.
type LineContext struct {
	SiteExists     bool
	SiteName       string
	CapacityLiters float64
	PrevClosing    *float64
	PrevPrice      *float64
	// JODICategory empty means the product code is not in the dictionary.
	JODICategory string
}

// Policy carries the numbers a person may change without a deployment.
//
// Read from petro_policy; see policy.go. Defaults live in DefaultPolicy so
// that a test, an import job or a first boot with an empty table all judge by
// the same rules as production.
type Policy struct {
	BorderTolerancePct    float64 `json:"-"`
	TransportTolerancePct float64 `json:"-"`
	StationTolerancePct   float64 `json:"-"`
	MaxChangePct          float64 `json:"-"`
	PriceJumpPct          float64 `json:"-"`
	StaleHours            int     `json:"-"`
	DueHour               int     `json:"-"`
	GraceHours            int     `json:"-"`
	Cadence               string  `json:"-"`
}

// DefaultPolicy is what the rules are when nobody has said otherwise.
//
// The same figures as migration 00009 seeds. They are repeated rather than
// read from the database because validation must work in a test with no
// database, and a rule that silently loosened to zero tolerance when a row was
// missing would be worse than a rule that is stated twice.
func DefaultPolicy() Policy {
	return Policy{
		BorderTolerancePct:    0.3,
		TransportTolerancePct: 0.3,
		StationTolerancePct:   0.5,
		MaxChangePct:          60,
		PriceJumpPct:          15,
		StaleHours:            26,
		DueHour:               12,
		GraceHours:            24,
		Cadence:               "daily",
	}
}

// Below this many litres a percentage tolerance is meaningless — a site that
// moved four litres all day would fail a 0.5% check on a rounding difference.
const minThroughputForPercent = 200.0

// absoluteToleranceLiters is what a tiny site is judged by instead.
const absoluteToleranceLiters = 1.0

// BalanceResidual is what the five terms leave over.
//
// Exported because the reconciliation screen reports it per line and the
// national aggregate sums it: one definition, so the number on the dashboard
// and the number in the finding cannot drift apart.
func BalanceResidual(l ReportLine) float64 {
	return l.Opening + l.Receipts - l.Sales - l.TransfersOut + l.Adjustments - l.Closing
}

// ValidateLine judges one line and returns everything wrong with it.
//
// All rules run: a line with two problems reports two, because a sender who
// fixes one and resubmits into a second refusal stops trusting the system.
func ValidateLine(l ReportLine, ctx LineContext, pol Policy) []Finding {
	var out []Finding
	// Every finding names the row it belongs to.
	//
	// Only `site_unknown` used to carry site_kind/site_id, so the portal — which
	// places a message beside the line that caused it — had nothing to place
	// and showed a bare "returned" banner instead (audit §39). The row is known
	// here; carrying it costs three map entries.
	add := func(rule, severity, message string, detail map[string]any) {
		if detail == nil {
			detail = map[string]any{}
		}
		detail["site_kind"] = l.SiteKind
		detail["site_id"] = l.SiteID
		detail["product_code"] = l.ProductCode
		out = append(out, Finding{Rule: rule, Severity: severity, Message: message, Detail: detail})
	}

	// ---- the line has to describe something that exists ----

	if ctx.JODICategory == "" {
		add("product_unknown", SeverityError,
			fmt.Sprintf("«%s» бүтээгдэхүүн тольд байхгүй", l.ProductCode),
			map[string]any{"product_code": l.ProductCode})
	}
	if !ctx.SiteExists {
		add("site_unknown", SeverityError,
			"энэ объект танай байгууллагад бүртгэлгүй байна",
			map[string]any{"site_kind": l.SiteKind, "site_id": l.SiteID})
		// Everything below compares against the register, so there is nothing
		// left to say about a line that names no site.
		return out
	}

	// ---- negative litres are not a small mistake ----

	for _, term := range []struct {
		name  string
		label string
		value float64
	}{
		{"opening_liters", "нээлтийн үлдэгдэл", l.Opening},
		{"receipts_liters", "хүлээн авалт", l.Receipts},
		{"sales_liters", "борлуулалт", l.Sales},
		{"transfers_out_liters", "шилжүүлэг", l.TransfersOut},
		{"closing_liters", "хаалтын үлдэгдэл", l.Closing},
	} {
		if term.value < 0 {
			add("negative_value", SeverityError,
				fmt.Sprintf("%s сөрөг байж болохгүй (%.3f)", term.label, term.value),
				map[string]any{"field": term.name, "value": term.value})
		}
	}

	// ---- the vessel has a size ----

	if ctx.CapacityLiters > 0 && l.Closing > ctx.CapacityLiters*1.001 {
		add("capacity_exceeded", SeverityError,
			fmt.Sprintf("хаалтын үлдэгдэл савны багтаамжаас их байна (%.0f > %.0f л)",
				l.Closing, ctx.CapacityLiters),
			map[string]any{"closing": l.Closing, "capacity": ctx.CapacityLiters})
	}

	// ---- yesterday's closing is today's opening ----
	//
	// The web form prefills it, so a mismatch means somebody typed over it or
	// a spreadsheet carried a different number — and if the opening can drift,
	// a whole period's loss can be made to disappear one day at a time.

	if ctx.PrevClosing != nil && math.Abs(l.Opening-*ctx.PrevClosing) > absoluteToleranceLiters {
		add("continuity_broken", SeverityError,
			fmt.Sprintf("нээлтийн үлдэгдэл өмнөх үеийн хаалттай таарахгүй байна (%.3f ≠ %.3f)",
				l.Opening, *ctx.PrevClosing),
			map[string]any{"opening": l.Opening, "previous_closing": *ctx.PrevClosing})
	}

	// ---- the balance ----

	residual := BalanceResidual(l)
	throughput := l.Opening + l.Receipts
	tolerance := absoluteToleranceLiters
	if throughput >= minThroughputForPercent {
		tolerance = throughput * pol.StationTolerancePct / 100
	}
	if math.Abs(residual) > tolerance {
		add("balance_mismatch", SeverityError,
			fmt.Sprintf("тэнцэл таарахгүй: зөрүү %.3f л (хүлцэл %.3f л)", residual, tolerance),
			map[string]any{
				"residual_liters":  residual,
				"tolerance_liters": tolerance,
				"throughput":       throughput,
			})
	}

	// ---- unusual, not wrong ----

	if ctx.PrevClosing != nil && *ctx.PrevClosing > minThroughputForPercent {
		changePct := math.Abs(l.Closing-*ctx.PrevClosing) / *ctx.PrevClosing * 100
		if changePct > pol.MaxChangePct {
			add("deviation", SeverityWarning,
				fmt.Sprintf("үлдэгдэл өмнөх үеэс %.0f%% өөрчлөгдсөн", changePct),
				map[string]any{"change_pct": changePct})
		}
	}

	if l.PriceMNT == nil {
		if l.SiteKind == "station" {
			add("price_missing", SeverityWarning, "жижиглэнгийн үнэ оруулаагүй байна", nil)
		}
	} else if ctx.PrevPrice != nil && *ctx.PrevPrice > 0 {
		jumpPct := math.Abs(*l.PriceMNT-*ctx.PrevPrice) / *ctx.PrevPrice * 100
		if jumpPct > pol.PriceJumpPct {
			add("price_jump", SeverityWarning,
				fmt.Sprintf("үнэ %.1f%% үсэрсэн (%.0f → %.0f₮)", jumpPct, *ctx.PrevPrice, *l.PriceMNT),
				map[string]any{"jump_pct": jumpPct})
		}
	}

	// ---- metrology ----
	//
	// Missing is a warning, implausible is an error. A blank cell leaves the
	// litre uncorrected, which is a known loss of precision; a density of 7.45
	// would silently multiply a national total by the wrong factor.

	if ctx.JODICategory != "" && ctx.JODICategory != "lpg" {
		if l.TemperatureC == nil || l.DensityKgM3 == nil {
			add("metrology_missing", SeverityWarning,
				"температур эсвэл нягт оруулаагүй тул 15 °C-т залруулга хийгдэхгүй", nil)
		} else {
			if *l.TemperatureC < minTemperature || *l.TemperatureC > maxTemperature {
				add("temperature_implausible", SeverityError,
					fmt.Sprintf("температур боломжит мужаас гадна (%.1f °C)", *l.TemperatureC),
					map[string]any{"temperature_c": *l.TemperatureC})
			}
			if *l.DensityKgM3 < minDensityKgM3 || *l.DensityKgM3 > maxDensityKgM3 {
				add("density_implausible", SeverityError,
					fmt.Sprintf("нягт боломжит мужаас гадна (%.1f кг/м³)", *l.DensityKgM3),
					map[string]any{"density_kg_m3": *l.DensityKgM3})
			}
		}
	}

	return out
}

// CountBySeverity is what the submission row stores, so that a queue can be
// sorted without opening every finding.
func CountBySeverity(findings []Finding) (errors, warnings int) {
	for _, f := range findings {
		if f.Severity == SeverityError {
			errors++
			continue
		}
		warnings++
	}
	return errors, warnings
}
