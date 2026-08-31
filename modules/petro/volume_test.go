package petro

import (
	"math"
	"testing"
)

// The correction is the one piece of arithmetic in this module that a reader
// cannot check by eye, and every balance in the system is measured against its
// output. So it is checked against the shape the standard guarantees rather
// than against numbers copied from the same code it is testing.
func TestVolumeCorrectionFactor(t *testing.T) {
	t.Parallel()

	cases := []struct {
		name     string
		category string
		tempC    float64
		density  float64
		want     float64 // 0 means "only the direction is asserted"
		ok       bool
	}{
		{name: "at fifteen degrees nothing moves", category: "motor_gasoline",
			tempC: 15, density: 745, want: 1.0, ok: true},
		{name: "diesel at fifteen degrees nothing moves", category: "gas_diesel_oil",
			tempC: 15, density: 840, want: 1.0, ok: true},
		{name: "warm fuel shrinks", category: "motor_gasoline",
			tempC: 35, density: 745, ok: true},
		{name: "cold fuel grows", category: "motor_gasoline",
			tempC: -40, density: 745, ok: true},
		{name: "an unknown commodity is refused", category: "unobtainium",
			tempC: 20, density: 745, ok: false},
		{name: "a mistyped density is refused", category: "motor_gasoline",
			tempC: 20, density: 7.45, ok: false},
		{name: "an impossible temperature is refused", category: "motor_gasoline",
			tempC: 300, density: 745, ok: false},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			factor, ok := VolumeCorrectionFactor(c.category, c.tempC, c.density)
			if ok != c.ok {
				t.Fatalf("ok = %v, want %v", ok, c.ok)
			}
			if !ok {
				return
			}
			if c.want != 0 && math.Abs(factor-c.want) > 1e-9 {
				t.Fatalf("factor = %v, want %v", factor, c.want)
			}
			if c.tempC > 15 && factor >= 1 {
				t.Fatalf("warm fuel must correct downwards, got %v", factor)
			}
			if c.tempC < 15 && factor <= 1 {
				t.Fatalf("cold fuel must correct upwards, got %v", factor)
			}
		})
	}
}

// The reason the correction is in the first month at all: at Mongolia's spread
// the seasonal swing is larger than the 0.5% tolerance the station balance is
// checked against. If this ever stops being true the correction could wait —
// so the claim is asserted rather than written in a comment.
func TestSeasonalSwingExceedsTheBalanceTolerance(t *testing.T) {
	t.Parallel()

	const stationTolerancePct = 0.5

	summer, ok := VolumeCorrectionFactor("gas_diesel_oil", 35, 840)
	if !ok {
		t.Fatal("summer correction refused")
	}
	winter, ok := VolumeCorrectionFactor("gas_diesel_oil", -40, 840)
	if !ok {
		t.Fatal("winter correction refused")
	}

	swingPct := (winter - summer) * 100
	if swingPct <= stationTolerancePct {
		t.Fatalf("seasonal swing %.2f%% no longer exceeds the %.2f%% tolerance",
			swingPct, stationTolerancePct)
	}
}

func TestCorrectToStandard(t *testing.T) {
	t.Parallel()

	temp, density := 35.0, 745.0

	corrected, ok := CorrectToStandard("motor_gasoline", 10_000, &temp, &density)
	if !ok {
		t.Fatal("correction refused for a plausible observation")
	}
	if corrected >= 10_000 {
		t.Fatalf("warm petrol should correct below the observed volume, got %v", corrected)
	}

	// LPG passes through, and the caller is told so rather than being handed a
	// silent zero it might add into a national total.
	gas, ok := CorrectToStandard("lpg", 5_000, nil, nil)
	if !ok || gas != 5_000 {
		t.Fatalf("lpg = %v, %v; want 5000, true", gas, ok)
	}

	// A missing observation is not a correction of zero.
	if _, ok := CorrectToStandard("motor_gasoline", 10_000, nil, nil); ok {
		t.Fatal("a missing temperature must refuse, not assume 15 °C")
	}
}
