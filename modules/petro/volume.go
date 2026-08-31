/*
 * Gerege Nexus
 * Copyright (c) 2026 Gerege Systems Development Team, Gerege Nomadica Foundation
 * Distributed under the Apache 2.0 License.
 *
 * Litres at 15 °C, from litres at whatever the tank was.
 *
 * # Why this is not optional here
 *
 * A litre is a volume and a volume is a function of temperature. Everywhere
 * else that fact can be waved away; in Mongolia it cannot. Fuel loaded at +35
 * and received at −40 shrinks by something close to two per cent — larger than
 * the 0.5% tolerance the station balance is checked against. Without the
 * correction the balance check is noise, and worse than noise: seasonal
 * shrinkage would show up every summer as loss and hide real theft every
 * winter.
 *
 * # Where the numbers come from
 *
 * ASTM D1250 / API MPMS Ch. 11.1, the 2004 formulation. The correction factor
 * is
 *
 *	VCF = exp(−α·ΔT·(1 + 0.8·α·ΔT))
 *	α   = (K0 + K1·ρ15) / ρ15²
 *
 * with ΔT the departure from 15 °C and ρ15 the density at 15 °C in kg/m³. K0
 * and K1 are the commodity group's constants, and choosing the wrong group is
 * the one error this file can make silently — so the group comes from the
 * product dictionary's JODI category rather than from a guess about the name.
 *
 * The observed density a station reports is treated as ρ15. That is an
 * approximation: strictly, ρ15 is itself found by iterating the same equation.
 * The residual error is under a tenth of a per cent over the range a forecourt
 * ever sees, which is an order of magnitude below the tolerance it feeds. The
 * iteration belongs with the ATG data, where the inputs are precise enough for
 * it to mean something.
 *
 * ponytail: single-pass ρ15, not the iterative solve — revisit when ATG
 * readings replace typed-in densities.
 */

package petro

import "math"

// commodityGroup carries the two constants of one API 11.1 group.
type commodityGroup struct {
	k0 float64
	k1 float64
}

// The four groups this system meets, keyed by the product dictionary's JODI
// category. LPG is deliberately absent: propane and butane are corrected from
// their own tables (54E), and a gasoline constant applied to LPG would produce
// a confident wrong number — see CorrectToStandard.
var commodityGroups = map[string]commodityGroup{
	"motor_gasoline": {k0: 346.4228, k1: 0.4388},
	"gas_diesel_oil": {k0: 186.9696, k1: 0.4862},
	"kerosene":       {k0: 594.5418, k1: 0.0},
	"crude":          {k0: 613.9723, k1: 0.0},
}

// Plausible bounds for a reported observation. Outside them the correction is
// not attempted — a density of 7 is a typing error, and correcting by it would
// turn one wrong cell into a wrong national total.
const (
	minDensityKgM3 = 400.0
	maxDensityKgM3 = 1100.0
	minTemperature = -60.0
	maxTemperature = 70.0
)

// VolumeCorrectionFactor answers the multiplier that takes an observed volume
// to its volume at 15 °C.
//
// ok is false when the inputs are outside the range where the formulation
// holds, or when the commodity has no group here. The caller stores nothing
// rather than storing a number it cannot defend.
func VolumeCorrectionFactor(jodiCategory string, temperatureC, densityKgM3 float64) (factor float64, ok bool) {
	group, known := commodityGroups[jodiCategory]
	if !known {
		return 0, false
	}
	if densityKgM3 < minDensityKgM3 || densityKgM3 > maxDensityKgM3 {
		return 0, false
	}
	if temperatureC < minTemperature || temperatureC > maxTemperature {
		return 0, false
	}

	alpha := (group.k0 + group.k1*densityKgM3) / (densityKgM3 * densityKgM3)
	delta := temperatureC - 15.0
	return math.Exp(-alpha * delta * (1 + 0.8*alpha*delta)), true
}

// CorrectToStandard converts an observed volume to litres at 15 °C.
//
// LPG returns the observed volume unchanged with ok true, and that is a
// decision rather than an oversight: the gas tables are a different
// calculation, LPG is a small share of the national balance, and returning the
// observed figure keeps the balance arithmetic consistent — every term in the
// equation is then in the same units. When the gas tables arrive, this is the
// one function that changes.
func CorrectToStandard(jodiCategory string, observedLiters float64, temperatureC, densityKgM3 *float64) (liters float64, ok bool) {
	if jodiCategory == "lpg" {
		return observedLiters, true
	}
	if temperatureC == nil || densityKgM3 == nil {
		return 0, false
	}
	factor, ok := VolumeCorrectionFactor(jodiCategory, *temperatureC, *densityKgM3)
	if !ok {
		return 0, false
	}
	return observedLiters * factor, true
}
