/*
 * Gerege Nexus
 * Copyright (c) 2026 Gerege Systems Development Team, Gerege Nomadica Foundation.
 * Distributed under the Apache 2.0 License.
 */

/**
 * The instant a person means when they pick a date.
 *
 * `new Date("2026-09-30")` is UTC midnight, which in Ulaanbaatar is eight in
 * the morning on the 30th — so a flag set to expire "on the 30th" went dark
 * sixteen hours before that day ended, and was already being shown as expired
 * from breakfast (audit §43). A date without a time means the whole day in the
 * reader's own zone, and the end of a day is the last instant in it.
 *
 * The dialogs that use `datetime-local` never had this: they carry a time, so
 * the browser parses them locally. That difference is what makes this a bug
 * rather than a convention.
 */
export function endOfLocalDay(date: string): string | null {
  if (!date) return null;
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
}

/** The first instant of a picked day, in the reader's own zone. */
export function startOfLocalDay(date: string): string | null {
  if (!date) return null;
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day).toISOString();
}
