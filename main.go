/*
 * PetroNet
 * Copyright (c) 2026 Gerege Systems Development Team, Gerege Nomadica Foundation.
 * Distributed under the Apache 2.0 License.
 */

// Command petronet runs the Gerege Nexus platform as the PetroNet
// distribution: the national fuel reserve's monitoring and management system,
// at petronet.mn.
//
// There is no core code in this repository — go.mod's one line is the whole of
// it. This product's own apps live under modules/, and the repository is
// Level 2 precisely so that adding one is a change to this file rather than a
// migration of the deployment (docs/ECOSYSTEM_GIT_STRATEGY.md, §1).
//
// It identifies people itself: no SSO_CLIENT_ISSUER, its own sign-in, its own
// database. That is a deployment decision and nothing in this file knows about
// it — see deploy/docker-compose.yml.
//
// It carries one module, petro: the registry of depots and stations, the
// chain of custody from import to nozzle, the reporting periods the regulator
// reads, and the citizen entitlements on top of them. Modules go in the
// Options.Modules callback and nowhere else — logic written in this file
// instead of in a module is logic no other deployment can have and no test can
// reach.
package main

import (
	"log/slog"
	"os"

	"github.com/gerege-systems/open-gerege-nexus/backend/pkg/host"
	"github.com/gerege-systems/open-gerege-nexus/backend/pkg/nexus"
	"github.com/gerege-systems/petronet-gerege-nexus/modules/petro"
)

func main() {
	// The error is checked and the exit code is the point: a distribution that
	// cannot start must not exit 0 and read as a clean shutdown to whatever is
	// supervising it.
	if err := host.Run(host.Options{
		Modules: func(p nexus.Platform) {
			petro.New(p)
		},
		// PetroNet is the fuel-sector distribution, so the fuel network is part
		// of every organisation rather than an optional store install.
		DefaultApps: []string{petro.ID},
	}); err != nil {
		slog.Error("petronet stopped", "error", err)
		os.Exit(1)
	}
}
