/*
 * Gerege Nexus
 * Copyright (c) 2026 Gerege Systems Development Team, Gerege Nomadica Foundation
 * Distributed under the Apache 2.0 License.
 *
 * Two things that must happen whether or not anybody opens a screen.
 *
 *	the periods exist        — a window nobody opened is a window nobody answers
 *	the day is computed      — the dashboard has three seconds, not a query
 *
 * # Why a ticker and not a scheduler
 *
 * The platform's scheduler runs reports, and both jobs here are writes rather
 * than reports. A ticker in the module is twenty lines; a scheduling subsystem
 * is a thing to operate. The exchange is that this runs on every replica
 * instead of on one — which is safe here and only here, because both statements
 * are idempotent: the periods insert with ON CONFLICT DO NOTHING and the day
 * upserts. Two replicas doing this at once produce the same rows as one.
 *
 * ponytail: per-replica ticker, no leader election — revisit if a job appears
 * that is not idempotent.
 *
 * # Why the last three days and not only today
 *
 * A report may arrive late, and a day whose figures changed after it was
 * computed would keep the old number until somebody noticed. Three days covers
 * the grace period the policy allows, and costs three small statements an hour.
 */

package petro

import (
	"context"
	"log/slog"
	"time"
)

// jobInterval is how often the two statements run.
//
// Hourly rather than nightly because the day being computed is today: an
// official opening the dashboard at four in the afternoon should see the
// morning's submissions, not yesterday's total.
const jobInterval = time.Hour

// StartJobs runs the module's periodic work until ctx is done.
//
// Started from New. The first pass runs immediately rather than after the first
// tick, so a deployment that boots at midnight has today's period before
// anybody tries to answer it.
func (m *Module) StartJobs(ctx context.Context) {
	go func() {
		ticker := time.NewTicker(jobInterval)
		defer ticker.Stop()
		for {
			m.runJobs(ctx)
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
			}
		}
	}()
}

func (m *Module) runJobs(ctx context.Context) {
	ctx, cancel := context.WithTimeout(ctx, 2*time.Minute)
	defer cancel()

	policy := m.LoadPolicy(ctx)

	if err := m.EnsurePeriods(ctx, time.Now(), policy); err != nil {
		slog.Error("petro: could not open the reporting periods", "error", err)
	}

	for offset := 0; offset < 3; offset++ {
		day := time.Now().AddDate(0, 0, -offset)
		if err := m.RefreshDaily(ctx, day); err != nil {
			slog.Error("petro: could not refresh the national table",
				"day", day.Format("2006-01-02"), "error", err)
		}
	}
}
