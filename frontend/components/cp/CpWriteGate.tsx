"use client";

/*
 * Gerege Nexus
 * Copyright (c) 2026 Gerege Systems Development Team, Gerege Nomadica Foundation.
 * Distributed under the Apache 2.0 License.
 */

import type { ReactNode } from "react";

import { useConsole } from "@/components/cp/Console";
import { cpAllowed } from "@/lib/cpCapabilities";
import { useI18n } from "@/lib/i18n";

/**
 * A console screen whose controls belong to some roles and not others.
 *
 * A `fieldset` rather than a check at every button: the screens this wraps
 * carry dozens of controls in nested components, and a rule applied by hand at
 * each one is a rule that is missed at the next one somebody adds. Disabling
 * the fieldset disables every form control inside it, including the ones
 * written after this file.
 *
 * `display: contents` so the fieldset lays nothing out — the screen inside is
 * the screen it would have been.
 *
 * The banner is not an apology. A reader who cannot press the buttons should
 * be told why in one line rather than left to discover it by pressing.
 */
export function CpWriteGate({
  capability,
  children,
}: {
  capability: string;
  children: ReactNode;
}) {
  const { operator } = useConsole();
  const { t } = useI18n();
  const may = cpAllowed(operator.role, capability);

  return (
    <>
      {may ? null : (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {t("cp.notice.read_only")}
        </p>
      )}
      <fieldset disabled={!may} style={{ display: "contents" }}>
        {children}
      </fieldset>
    </>
  );
}
