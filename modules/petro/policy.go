/*
 * Gerege Nexus
 * Copyright (c) 2026 Gerege Systems Development Team, Gerege Nomadica Foundation
 * Distributed under the Apache 2.0 License.
 *
 * The numbers a person may change without a deployment.
 *
 * Tolerances, report cadence, the deviation threshold: every one of them is a
 * policy decision that will be argued about, and during a shortage it may be
 * argued about twice in a day. A tolerance compiled into the binary is a
 * tolerance whose change needs a build, a review and a restart — so the figures
 * live in a row, versioned, with the old ones kept.
 *
 * # Why a missing row does not mean "no rules"
 *
 * The obvious failure of a policy table is the empty one: no row, so every
 * threshold reads as its zero value, so a 0% tolerance refuses every report or
 * an infinite one accepts every report. Load falls back to DefaultPolicy
 * instead, which is the same set of figures migration 00009 seeds. Being
 * written twice is the price of a system that judges the same way whether or
 * not its configuration loaded.
 */

package petro

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/gerege-systems/open-gerege-nexus/backend/pkg/nexus"
	"github.com/jackc/pgx/v5"
)

// policyDocument is the shape stored in petro_policy.rules.
//
// Pointers throughout: a rule the document does not mention keeps its default,
// where a zero would silently become the rule.
type policyDocument struct {
	Tolerance *struct {
		BorderPct    *float64 `json:"border_pct"`
		TransportPct *float64 `json:"transport_pct"`
		StationPct   *float64 `json:"station_pct"`
	} `json:"tolerance"`
	Report *struct {
		Cadence    *string `json:"cadence"`
		DueHour    *int    `json:"due_hour"`
		GraceHours *int    `json:"grace_hours"`
	} `json:"report"`
	Deviation *struct {
		MaxChangePct *float64 `json:"max_change_pct"`
		PriceJumpPct *float64 `json:"price_jump_pct"`
	} `json:"deviation"`
	StaleHours *int `json:"stale_hours"`
}

// LoadPolicy answers the rules in force now.
//
// Any failure — no row, an unreadable document, a database that is not
// answering — logs and returns the defaults. Validation must not stop because
// configuration did.
func (m *Module) LoadPolicy(ctx context.Context) Policy {
	pol := DefaultPolicy()

	var raw []byte
	err := m.db.QueryRow(ctx, `
		SELECT rules
		  FROM petro_policy
		 WHERE effective_from <= NOW()
		   AND (effective_to IS NULL OR effective_to > NOW())
		 ORDER BY version DESC
		 LIMIT 1`).Scan(&raw)
	if errors.Is(err, pgx.ErrNoRows) {
		return pol
	}
	if err != nil {
		slog.Warn("petro: policy could not be read, using defaults", "error", err)
		return pol
	}

	var doc policyDocument
	if err := json.Unmarshal(raw, &doc); err != nil {
		slog.Warn("petro: policy document is not readable, using defaults", "error", err)
		return pol
	}

	if t := doc.Tolerance; t != nil {
		if t.BorderPct != nil {
			pol.BorderTolerancePct = *t.BorderPct
		}
		if t.TransportPct != nil {
			pol.TransportTolerancePct = *t.TransportPct
		}
		if t.StationPct != nil {
			pol.StationTolerancePct = *t.StationPct
		}
	}
	if r := doc.Report; r != nil {
		if r.Cadence != nil {
			pol.Cadence = *r.Cadence
		}
		if r.DueHour != nil {
			pol.DueHour = *r.DueHour
		}
		if r.GraceHours != nil {
			pol.GraceHours = *r.GraceHours
		}
	}
	if d := doc.Deviation; d != nil {
		if d.MaxChangePct != nil {
			pol.MaxChangePct = *d.MaxChangePct
		}
		if d.PriceJumpPct != nil {
			pol.PriceJumpPct = *d.PriceJumpPct
		}
	}
	if doc.StaleHours != nil {
		pol.StaleHours = *doc.StaleHours
	}

	return pol
}

// handleReadPolicy serves the rules in force, so a portal can show a sender the
// tolerance they are being judged by before they submit rather than after.
func (m *Module) handleReadPolicy(w http.ResponseWriter, r *http.Request) {
	pol := m.LoadPolicy(r.Context())
	nexus.JSON(w, http.StatusOK, map[string]any{
		"tolerance": map[string]float64{
			"border_pct":    pol.BorderTolerancePct,
			"transport_pct": pol.TransportTolerancePct,
			"station_pct":   pol.StationTolerancePct,
		},
		"report":      map[string]any{"cadence": pol.Cadence, "due_hour": pol.DueHour, "grace_hours": pol.GraceHours},
		"deviation":   map[string]float64{"max_change_pct": pol.MaxChangePct, "price_jump_pct": pol.PriceJumpPct},
		"stale_hours": pol.StaleHours,
	})
}
