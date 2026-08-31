"use client";

/**
 * The company's daily report — the door every figure in this system enters by.
 *
 * # The opening figure is not a field
 *
 * It is shown, and it is not editable. Yesterday's closing is today's opening,
 * and a form that let a sender type over it would let a month of loss be
 * spread one day at a time until it disappeared. The server refuses a mismatch
 * anyway; the screen not offering the box is the same rule said politely.
 *
 * # The balance is shown while it is being typed
 *
 * Opening + receipts − sales is computed as the sender types, beside the box
 * they are typing the closing figure into. Nearly every rejection this system
 * will issue is arithmetic, and arithmetic the sender can see is arithmetic
 * they fix before sending rather than after being refused. The server checks it
 * again regardless — this is a courtesy, never the check.
 *
 * # Findings are attached to the line, not listed at the top
 *
 * "The report is invalid" is not actionable. The line, the rule and the two
 * numbers that disagree are.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, Loader2, Send } from "lucide-react";

import {
  api,
  type ReportFinding,
  type ReportPeriod,
  type ReportPrefillLine,
  type ReportSubmission,
} from "@/lib/api";
import { apiBase } from "@/lib/apiBase";
import { useI18n } from "@/lib/i18n";
import { ErrorNote, GhostButton, PrimaryButton, inputClass, litres } from "@/components/petro/operatorUI";

/** What the sender types into one row. Strings, so a half-typed number is legal. */
type Entry = {
  receipts: string;
  sales: string;
  closing: string;
  price: string;
  temperature: string;
  density: string;
};

const emptyEntry: Entry = {
  receipts: "",
  sales: "",
  closing: "",
  price: "",
  temperature: "",
  density: "",
};

function num(value: string): number {
  const parsed = Number.parseFloat(value.replace(/\s|,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function optional(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number.parseFloat(value.replace(/\s|,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export default function ReportPage() {
  const { t } = useI18n();

  const [periods, setPeriods] = useState<ReportPeriod[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [lines, setLines] = useState<ReportPrefillLine[] | null>(null);
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [findings, setFindings] = useState<ReportFinding[]>([]);
  const [outcome, setOutcome] = useState<ReportSubmission | null>(null);
  const [tolerance, setTolerance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const loadPeriods = useCallback(() => {
    api
      .fuelReportPeriods()
      .then((result) => {
        setPeriods(result.periods);
        setSelected((current) => current ?? result.periods[0]?.id ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  useEffect(loadPeriods, [loadPeriods]);

  useEffect(() => {
    api
      .fuelPolicy()
      .then((policy) => setTolerance(policy.tolerance.station_pct))
      .catch(() => setTolerance(null));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLines(null);
    setFindings([]);
    setOutcome(null);
    api
      .fuelReportPrefill(selected)
      .then((result) => {
        setLines(result.lines);
        setEntries(
          Object.fromEntries(
            result.lines.map((line) => [
              `${line.site_kind}|${line.site_id}|${line.product_code}`,
              {
                ...emptyEntry,
                price: line.last_price_mnt != null ? String(line.last_price_mnt) : "",
              },
            ]),
          ),
        );
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [selected]);

  const period = useMemo(
    () => periods?.find((p) => p.id === selected) ?? null,
    [periods, selected],
  );

  // Findings come back keyed by the stored line id, which the sender has never
  // seen. They are re-keyed by site and grade so a message can sit on the row
  // that caused it.
  const findingsByRow = useMemo(() => {
    const map: Record<string, ReportFinding[]> = {};
    for (const finding of findings) {
      const detail = (finding.detail ?? {}) as { site_kind?: string; site_id?: string };
      const key =
        detail.site_kind && detail.site_id ? `${detail.site_kind}|${detail.site_id}` : "*";
      (map[key] ??= []).push(finding);
    }
    return map;
  }, [findings]);

  const send = useCallback(async () => {
    if (!selected || !lines) return;
    setSending(true);
    setError(null);
    try {
      const result = await api.submitFuelReport(selected, {
        // The key makes a resend the same submission rather than a second one:
        // a lost connection must not become two reports for one day.
        idempotency_key: `${selected}:${Date.now()}`,
        lines: lines.map((line) => {
          const key = `${line.site_kind}|${line.site_id}|${line.product_code}`;
          const entry = entries[key] ?? emptyEntry;
          return {
            site_kind: line.site_kind,
            site_id: line.site_id,
            product_code: line.product_code,
            opening_liters: line.opening_liters,
            receipts_liters: num(entry.receipts),
            sales_liters: num(entry.sales),
            closing_liters: num(entry.closing),
            price_mnt: optional(entry.price),
            temperature_c: optional(entry.temperature),
            density_kg_m3: optional(entry.density),
          };
        }),
      });
      setFindings(result.findings);
      setOutcome(result.submission);
      loadPeriods();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  }, [entries, lines, loadPeriods, selected]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <p className="max-w-2xl text-slate-500">{t("petro.report.subtitle")}</p>
        {selected ? (
          <a
            href={`${apiBase()}/petro/report/periods/${selected}/template.xlsx`}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            {t("petro.report.template")}
          </a>
        ) : null}
      </div>

      {error ? <ErrorNote>{error}</ErrorNote> : null}

      {periods === null ? (
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      ) : periods.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          {t("petro.report.no_periods")}
        </p>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-2">
            {periods.slice(0, 10).map((p) => {
              const active = p.id === selected;
              const status = p.my_submission?.status;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? "border-[var(--gerege-blue)] bg-white text-slate-900"
                      : "border-slate-200 bg-white text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <span className="block font-medium">{p.period_start}</span>
                  <span className="block text-xs">
                    {status ? t(`petro.report.status.${status}`) : t("petro.report.due")}
                  </span>
                </button>
              );
            })}
          </div>

          {outcome ? (
            <p
              className={`mb-6 flex items-start gap-2 rounded-xl border p-4 text-sm ${
                outcome.status === "returned"
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              {outcome.status === "returned" ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>
                {outcome.status === "returned"
                  ? t("petro.report.returned")
                  : t("petro.report.accepted")}{" "}
                <span className="opacity-70">
                  ({t("petro.report.version")} {outcome.version})
                </span>
              </span>
            </p>
          ) : null}

          {lines === null ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          ) : lines.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              {t("petro.report.no_lines")}
            </p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">{t("petro.tab.stations")}</th>
                      <th className="px-3 py-3 text-right font-medium">
                        {t("petro.report.opening")}
                      </th>
                      <th className="px-3 py-3 font-medium">{t("petro.report.receipts")}</th>
                      <th className="px-3 py-3 font-medium">{t("petro.report.sales")}</th>
                      <th className="px-3 py-3 font-medium">{t("petro.report.closing")}</th>
                      <th className="px-3 py-3 font-medium">{t("petro.report.price")}</th>
                      <th className="px-3 py-3 font-medium">{t("petro.report.temperature")}</th>
                      <th className="px-3 py-3 font-medium">{t("petro.report.density")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lines.map((line) => {
                      const key = `${line.site_kind}|${line.site_id}|${line.product_code}`;
                      const entry = entries[key] ?? emptyEntry;
                      const expected =
                        line.opening_liters + num(entry.receipts) - num(entry.sales);
                      const claimed = num(entry.closing);
                      const drift = Math.abs(expected - claimed);
                      const throughput = line.opening_liters + num(entry.receipts);
                      const allowed =
                        tolerance != null && throughput >= 200
                          ? (throughput * tolerance) / 100
                          : 1;
                      const off = entry.closing !== "" && drift > allowed;
                      const rowFindings = findingsByRow[`${line.site_kind}|${line.site_id}`] ?? [];

                      const cell = (field: keyof Entry, width: string) => (
                        <input
                          className={`${inputClass} ${width} text-right`}
                          inputMode="decimal"
                          value={entry[field]}
                          onChange={(event) =>
                            setEntries((current) => ({
                              ...current,
                              [key]: { ...(current[key] ?? emptyEntry), [field]: event.target.value },
                            }))
                          }
                        />
                      );

                      return (
                        <tr key={key} className="align-top">
                          <td className="px-4 py-3">
                            <span className="font-medium text-slate-900">{line.site_name}</span>
                            <span className="block text-xs text-slate-400">
                              {line.product_label}
                            </span>
                            {rowFindings.map((finding, index) => (
                              <span
                                key={index}
                                className={`mt-1 block text-xs ${
                                  finding.severity === "error" ? "text-red-600" : "text-amber-600"
                                }`}
                              >
                                {finding.message}
                              </span>
                            ))}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums text-slate-500">
                            {litres(line.opening_liters)}
                          </td>
                          <td className="px-3 py-3">{cell("receipts", "w-28")}</td>
                          <td className="px-3 py-3">{cell("sales", "w-28")}</td>
                          <td className="px-3 py-3">
                            {cell("closing", "w-28")}
                            <span
                              className={`mt-1 block text-right text-xs ${
                                off ? "text-red-600" : "text-slate-400"
                              }`}
                            >
                              {t("petro.report.expected")} {litres(expected)}
                            </span>
                          </td>
                          <td className="px-3 py-3">{cell("price", "w-24")}</td>
                          <td className="px-3 py-3">{cell("temperature", "w-20")}</td>
                          <td className="px-3 py-3">{cell("density", "w-20")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs text-slate-400">
                  {tolerance != null
                    ? `${t("petro.report.tolerance")} ${tolerance}%`
                    : null}
                </p>
                <div className="flex gap-2">
                  <GhostButton onClick={() => setSelected(selected)}>
                    {period?.period_start}
                  </GhostButton>
                  <PrimaryButton onClick={send} busy={sending}>
                    <Send className="h-4 w-4" />
                    {t("petro.report.send")}
                  </PrimaryButton>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
