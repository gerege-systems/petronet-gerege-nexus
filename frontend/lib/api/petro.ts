/*
 * Gerege Nexus
 * Copyright (c) 2026 Gerege Systems Development Team, Gerege Nomadica Foundation
 * Distributed under the Apache 2.0 License.
 */

// The fuel distribution network: the stations an organisation operates.

import { request } from "./client";

/* ---------------------------------------------------------------- reporting
 *
 * The regulatory loop: the periods a company answers for, the figures it
 * sends, what the system found wrong with them, and — for a supervisory body —
 * the national picture those figures add up to.
 */

/** A window every company answers for. */
export type ReportPeriod = {
  id: string;
  kind: string;
  period_start: string;
  period_end: string;
  due_at: string;
  status: string;
  /** This organisation's latest answer, absent until it sends one. */
  my_submission?: ReportSubmission;
};

/**
 * One answer to one period.
 *
 * `status` is the whole state machine: draft → submitted → approved, or
 * returned. A report the system refused arrives back as `returned` within a
 * second of being sent, with a finding per broken rule; nobody waits for an
 * official to notice an arithmetic error.
 */
export type ReportSubmission = {
  id: string;
  period_id: string;
  tenant_id?: string;
  tenant_name?: string;
  version: number;
  status: "draft" | "submitted" | "returned" | "approved";
  source: string;
  file_name?: string;
  row_count: number;
  error_count: number;
  warning_count: number;
  submitted_at: string | null;
  reviewed_at: string | null;
  review_note?: string;
  period_start?: string;
  period_end?: string;
  hash?: string;
};

/** What is wrong with one line: the rule, and the sentence a sender can act on. */
export type ReportFinding = {
  rule: string;
  severity: "error" | "warning";
  message: string;
  line_id?: string;
  detail?: Record<string, unknown>;
};

/**
 * A row of the form, as far as the system can fill it in.
 *
 * `opening_liters` is yesterday's closing and the portal does not let it be
 * edited: the one figure a sender must not choose is the one that can make a
 * month of loss disappear a day at a time.
 */
export type ReportPrefillLine = {
  site_kind: string;
  site_id: string;
  site_name: string;
  product_code: string;
  product_label: string;
  opening_liters: number;
  capacity_liters: number;
  last_price_mnt: number | null;
};

/** One line as it is sent. */
export type ReportLineDraft = {
  site_kind: string;
  site_id: string;
  product_code: string;
  opening_liters: number;
  receipts_liters: number;
  sales_liters: number;
  transfers_out_liters?: number;
  adjustments_liters?: number;
  closing_liters: number;
  price_mnt?: number | null;
  temperature_c?: number | null;
  density_kg_m3?: number | null;
  note?: string;
};

/** A stored line, with what the system computed beside what was claimed. */
export type ReportStoredLine = ReportLineDraft & {
  id: string;
  site_name: string;
  closing_liters_15c: number | null;
  variance_liters: number | null;
  variance_pct: number | null;
};

/** One grade in one province on one day, from the national table. */
export type NationalRow = {
  day: string;
  product_code: string;
  product_label: string;
  aimag: string;
  stock_liters: number;
  capacity_liters: number;
  receipts_liters: number;
  sales_liters: number;
  sites_total: number;
  sites_reported: number;
  days_of_supply: number | null;
};

/** A company that owes a figure and has not sent one. */
export type ReportGap = {
  tenant_id: string;
  tenant_name: string;
  sites_total: number;
  last_reported_at: string | null;
  overdue: boolean;
};

/** One rung of the reconciliation ladder. */
export type BalanceRow = {
  code: string;
  name: string;
  tolerance_pct: number;
  left_liters: number;
  right_liters: number;
  delta_liters: number;
  delta_pct: number | null;
  breaches: number;
  /** False where the data source is not connected yet; `waiting` says what for. */
  available: boolean;
  waiting?: string;
};

/** A consignment between two sites: opened by the sender, closed by the receiver. */
export type FuelMovement = {
  id: string;
  national_ref: string;
  from_kind: string;
  from_id: string | null;
  to_kind: string;
  to_id: string | null;
  product_code: string;
  declared_liters: number;
  received_liters: number | null;
  status: "open" | "closed" | "disputed" | "cancelled";
  variance_pct: number | null;
  opened_at: string;
  due_at: string | null;
  closed_at: string | null;
  note: string;
  overdue_by_hours?: number;
};

/** How many forecourts are in each integration class, and how many unsurveyed. */
export type CensusSummary = {
  classes: { class: string; label: string; stations: number; with_atg: number; with_internet: number }[];
  surveyed: number;
  stations_total: number;
};


export type FuelStation = {
  id: string;
  name: string;
  brand: string;
  brand_label: string;
  lat: number;
  lon: number;
  aimag: string;
  district: string;
  address: string;
  phone: string;
  opening_hours: string;
  total_pumps: number;
  active_pumps: number;
  /** No real source until the redemption stream exists — 0 everywhere for now. */
  current_queue_count: number;
  status: string;
  is_voucher_enabled: boolean;
  fuel_type_count: number;
  /** The grades this forecourt sells; they travel with it, like a depot's tanks. */
  fuels?: StationGrade[];
};

export type FuelStationList = {
  stations: FuelStation[];
  count: number;
};

/**
 * One grade at one forecourt: what it costs, how big the vessel is, and
 * whether it can be had.
 *
 * `current_stock_liters` is read-only everywhere. Litres in a tank are the sum
 * of what deliveries put there — see internal/apps/petro/station.go — and the
 * honest way to say "we are out" is `status`, not a zero typed into a box.
 */
export type StationGrade = {
  fuel_type: string;
  fuel_label: string;
  price_mnt: number;
  tank_capacity_liters: number;
  current_stock_liters: number;
  status: string;
  last_reported_at: string | null;
};

/** One fuel a station sells, as a citizen sees it. No litres — see the handler. */
export type PublicFuel = {
  type: string;
  label: string;
  price_mnt: number;
  status: string;
  /** Percentage of tank, or null where nobody has reported a tank size. */
  stock_percent: number | null;
};

/** A station as somebody looking for fuel sees it. */
export type PublicStation = {
  id: string;
  name: string;
  brand: string;
  brand_label: string;
  lat: number;
  lon: number;
  aimag: string;
  district: string;
  address: string;
  opening_hours: string;
  status: string;
  is_voucher_enabled: boolean;
  fuels: PublicFuel[];
  /** The fullest tank on the forecourt, or null when none has a reported size. */
  stock_percent: number | null;
};

export type PublicStationList = {
  stations: PublicStation[];
  count: number;
  /** The viewport held more than one answer carries. Zoom in for the rest. */
  truncated: boolean;
};

/** A map viewport, in the order GeoJSON and every mapping client use it. */
export type BBox = { minLon: number; minLat: number; maxLon: number; maxLat: number };


/** What a citizen has left of today's ration. */
export type Entitlement = {
  date: string;
  granted_mnt: number;
  used_mnt: number;
  remaining_mnt: number;
};

/** A claim against the day's ration, redeemable at any pump. */
export type Voucher = {
  id: string;
  amount_mnt: number;
  fuel_type: string;
  fuel_label: string;
  qr_token: string;
  status: string;
  expires_at: string;
  created_at: string;
  intended_station?: string;
  redeemed_at?: string | null;
};

/**
 * A consignment at, or past, the border.
 *
 * `declared_liters` is the figure everything downstream works in;
 * `declared_tons` is what the customs document says and is not reconciled
 * against it. Density moves with temperature, so the two never agree exactly,
 * and a screen that hid one of them would be choosing which to believe.
 */
export type Shipment = {
  id: string;
  declaration_no: string;
  border_port: string;
  origin_country: string;
  exporter: string;
  fuel_type: string;
  fuel_label: string;
  declared_liters: number;
  declared_tons: number | null;
  wagons: number;
  convoy_code: string;
  /** border_arrived · inspecting · cleared · in_transit · at_depot */
  status: string;
  lab_status: string;
  quality_cert_no: string;
  octane_tested: number | null;
  sulfur_ppm: number | null;
  entered_at: string;
  cleared_at: string | null;
  expected_at: string | null;
  /** Minted when customs clears the consignment, and empty until then. */
  batch_code?: string;
  note: string;
};

/** One vessel at a depot. */
export type Tank = {
  id: string;
  depot_id: string;
  tank_no: string;
  tank_type: string;
  fuel_type: string;
  fuel_label: string;
  capacity_liters: number;
  current_liters: number;
  fill_percent: number;
  temperature_c: number | null;
  density_kg_m3: number | null;
  safety_status: string;
  next_inspection_at: string | null;
};

/** A storage base, with its tanks. */
export type Depot = {
  id: string;
  name: string;
  brand: string;
  aimag: string;
  district: string;
  address: string;
  lat: number | null;
  lon: number | null;
  has_rail_siding: boolean;
  rail_station_code: string;
  status: string;
  tank_count: number;
  capacity_liters: number;
  current_liters: number;
  /** The whole base, tanks summed. Null when no tank is registered. */
  fill_percent: number | null;
  tanks?: Tank[];
};

/** One consignment unloaded into a tank. */
export type DepotReceipt = {
  id: string;
  depot_id: string;
  tank_id: string;
  shipment_id: string | null;
  batch_id: string | null;
  batch_code?: string;
  liters: number;
  received_at: string;
  tank_after_liters: number;
  tank_fill_percent: number;
};

export const petroApi = {
  /** The stations this organisation operates. Requires a session. */
  listFuelStations: () => request<FuelStationList>("/petro/stations"),

  /** Register a forecourt. Coordinates are required: the map has to draw it. */
  createFuelStation: (body: {
    name: string;
    brand?: string;
    brand_label?: string;
    aimag?: string;
    district?: string;
    address?: string;
    phone?: string;
    opening_hours?: string;
    lat: number;
    lon: number;
    total_pumps?: number;
    active_pumps?: number;
    is_voucher_enabled?: boolean;
  }) => request<FuelStation>("/petro/stations", { method: "POST", body: JSON.stringify(body) }),

  /** Correct a row. Only what is sent changes; the rest is written back to itself. */
  updateFuelStation: (
    stationId: string,
    body: Partial<{
      name: string;
      brand: string;
      brand_label: string;
      aimag: string;
      district: string;
      address: string;
      phone: string;
      opening_hours: string;
      lat: number;
      lon: number;
      total_pumps: number;
      active_pumps: number;
      status: string;
      is_voucher_enabled: boolean;
    }>,
  ) =>
    request<FuelStation>(`/petro/stations/${stationId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  /**
   * Remove a forecourt nothing has happened at.
   *
   * Answers 409 once a delivery has been received there: at that point the row
   * is part of the chain a batch travelled, and the way to take it out of
   * service is to close it.
   */
  deleteFuelStation: (stationId: string) =>
    request<void>(`/petro/stations/${stationId}`, { method: "DELETE" }),

  /** Add a grade to a forecourt, or change its price, vessel size or availability. */
  setStationGrade: (
    stationId: string,
    body: {
      fuel_type: string;
      fuel_label?: string;
      price_mnt?: number;
      tank_capacity_liters?: number;
      status?: string;
    },
  ) =>
    request<StationGrade>(`/petro/stations/${stationId}/grades`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  /** Stop selling a grade. Different from being out of it — that is `status`. */
  deleteStationGrade: (stationId: string, fuelType: string) =>
    request<void>(`/petro/stations/${stationId}/grades/${encodeURIComponent(fuelType)}`, {
      method: "DELETE",
    }),

  /** Consignments this organisation has declared, newest first. */
  listFuelShipments: () => request<{ shipments: Shipment[]; count: number }>("/petro/shipments"),

  /** Declare a consignment arriving at a port. */
  createFuelShipment: (body: {
    declaration_no: string;
    border_port: string;
    origin_country: string;
    exporter: string;
    fuel_type: string;
    declared_liters: number;
    declared_tons?: number | null;
    wagons?: number;
    convoy_code?: string;
    note?: string;
  }) =>
    request<Shipment>("/petro/shipments", { method: "POST", body: JSON.stringify(body) }),

  /**
   * Move a consignment along.
   *
   * Clearing it is what mints its batch — the number every downstream record
   * carries — so this is the request that starts the chain, not the one that
   * declared the fuel.
   */
  advanceFuelShipment: (
    id: string,
    body: {
      status: string;
      lab_status?: string;
      quality_cert_no?: string;
      octane_tested?: number | null;
      sulfur_ppm?: number | null;
    },
  ) =>
    request<{ id: string; status: string; batch_code: string }>(
      `/petro/shipments/${id}/status`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  /** This organisation's bases, each with its tanks. */
  listFuelDepots: () => request<{ depots: Depot[]; count: number }>("/petro/depots"),

  /** Register a base. */
  createFuelDepot: (body: {
    name: string;
    brand?: string;
    aimag?: string;
    district?: string;
    address?: string;
    lat?: number | null;
    lon?: number | null;
    has_rail_siding?: boolean;
    rail_station_code?: string;
  }) => request<Depot>("/petro/depots", { method: "POST", body: JSON.stringify(body) }),

  /**
   * Add a vessel to a base.
   *
   * No opening level, and there is no endpoint that sets one: a tank enters the
   * system empty and fills through receipts. An opening figure typed into a
   * form would be fuel that entered the country through a text box.
   */
  createFuelTank: (
    depotId: string,
    body: { tank_no: string; tank_type?: string; fuel_type: string; capacity_liters: number },
  ) =>
    request<Tank>(`/petro/depots/${depotId}/tanks`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** Record a gauge reading. Temperature, density, safety — never the level. */
  updateFuelTank: (
    depotId: string,
    tankId: string,
    body: { temperature_c?: number | null; density_kg_m3?: number | null; safety_status?: string },
  ) =>
    request<Tank>(`/petro/depots/${depotId}/tanks/${tankId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  /** Unload a cleared consignment into a tank. */
  receiveIntoFuelDepot: (
    depotId: string,
    body: { tank_id: string; shipment_id?: string; liters: number; manifest_liters?: number | null; note?: string },
  ) =>
    request<DepotReceipt>(`/petro/depots/${depotId}/receipts`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** A base's intake history. */
  listFuelDepotReceipts: (depotId: string) =>
    request<{ receipts: DepotReceipt[]; count: number }>(`/petro/depots/${depotId}/receipts`),

  /**
   * The stations inside a map viewport, across every operator.
   *
   * No session: a person looking for fuel is not a member of anything. Rate
   * limited server-side at 60/min, so a caller that refires on every pixel of
   * a drag will be turned away — debounce on `moveend`, not on `move`.
   */
  publicFuelStations: (box: BBox) =>
    request<PublicStationList>(
      `/petro/public/stations?bbox=${box.minLon},${box.minLat},${box.maxLon},${box.maxLat}`,
    ),


  /** Today's ration. Needs a session; a citizen signs in with eID. */
  myFuelEntitlement: () => request<Entitlement>("/petro/me/entitlement"),

  /** Today's vouchers, newest first. */
  myFuelVouchers: () => request<{ vouchers: Voucher[]; count: number }>("/petro/me/vouchers"),

  /**
   * Draw an amount out of today's ration.
   *
   * `intended_station_id` is a signal, not a commitment: the voucher is good at
   * any pump, and naming a forecourt only helps the queue estimate for it.
   */
  issueFuelVoucher: (body: {
    amount_mnt: number;
    fuel_type: string;
    intended_station_id?: string;
  }) =>
    request<{ voucher: Voucher; entitlement: Entitlement }>("/petro/me/vouchers", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /* -------------------------------------------------------------- reporting */

  /** The periods this organisation answers for, with its latest answer to each. */
  fuelReportPeriods: () => request<{ periods: ReportPeriod[] }>("/petro/report/periods"),

  /** The form for one period, prefilled from the register and yesterday's closing. */
  fuelReportPrefill: (periodId: string) =>
    request<{ period: ReportPeriod; lines: ReportPrefillLine[] }>(
      `/petro/report/periods/${periodId}/prefill`,
    ),

  /**
   * Send a period's figures.
   *
   * Answers with the submission and everything found wrong with it. An
   * `error` finding means the report came back `returned` — the figures are
   * stored either way, because a refused report is evidence too.
   */
  submitFuelReport: (
    periodId: string,
    body: { lines: ReportLineDraft[]; idempotency_key?: string },
  ) =>
    request<{ submission: ReportSubmission; findings: ReportFinding[] }>(
      `/petro/report/periods/${periodId}/submissions`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  /** This organisation's own history. */
  fuelReportSubmissions: () =>
    request<{ submissions: ReportSubmission[] }>("/petro/report/submissions"),

  /** One submission with its lines and findings. */
  fuelReportSubmission: (id: string) =>
    request<{
      submission: ReportSubmission;
      lines: ReportStoredLine[];
      findings: ReportFinding[];
    }>(`/petro/report/submissions/${id}`),

  /** The tolerances and deadlines in force, so a sender sees them before sending. */
  fuelPolicy: () =>
    request<{
      tolerance: { border_pct: number; transport_pct: number; station_pct: number };
      report: { cadence: string; due_hour: number; grace_hours: number };
      deviation: { max_change_pct: number; price_jump_pct: number };
      stale_hours: number;
    }>("/petro/policy"),

  /* -------------------------------------------------------------- oversight */

  /** What is waiting for a decision, oldest first. */
  fuelReviewQueue: (status = "submitted") =>
    request<{ submissions: ReportSubmission[] }>(
      `/petro/oversight/queue?status=${encodeURIComponent(status)}`,
    ),

  /** Accept a submission into the national picture. */
  approveFuelReport: (id: string, note = "") =>
    request<ReportSubmission>(`/petro/oversight/submissions/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ note }),
    }),

  /** Send it back. The reason is required — "invalid" is not a reason. */
  returnFuelReport: (id: string, note: string) =>
    request<ReportSubmission>(`/petro/oversight/submissions/${id}/return`, {
      method: "POST",
      body: JSON.stringify({ note }),
    }),

  /** The national picture for a day: coverage first, then the grades. */
  fuelNationalDashboard: (day?: string) =>
    request<{
      day: string;
      coverage: { sites_total: number; sites_reported: number; percent: number };
      products: NationalRow[];
      detail: NationalRow[];
      // The query stays inside the literal and the empty value is legal: the
      // handler reads an absent day as "the latest one computed", and a path
      // assembled outside the literal is a path tests/petro-api-paths.test.mjs
      // cannot compare against the module's routing table.
    }>(`/petro/oversight/dashboard?day=${encodeURIComponent(day ?? "")}`),

  /** Who did not report for the newest period that is past due. */
  fuelReportGaps: () =>
    request<{ period: { id: string; period_start: string } | null; missing: ReportGap[] }>(
      "/petro/oversight/gaps",
    ),

  /** The five balances, and what the three unbuilt ones are waiting for. */
  fuelReconciliation: () =>
    request<{ from: string; days: number; balances: BalanceRow[] }>(
      "/petro/oversight/reconciliation",
    ),

  /** Recompute one day of the national table. */
  refreshFuelDaily: (day?: string) =>
    request<{ day: string; refreshed: boolean }>(
      `/petro/oversight/daily/refresh?day=${encodeURIComponent(day ?? "")}`,
      { method: "POST" },
    ),

  /** Suspend a site, or lift a suspension. Watching is not the whole job. */
  setFuelSiteStatus: (kind: "station" | "depot", id: string, status: string, note = "") =>
    request<{ id: string; kind: string; name: string; registry_status: string }>(
      `/petro/oversight/sites/${kind}/${id}/status`,
      { method: "POST", body: JSON.stringify({ registry_status: status, note }) },
    ),

  /* -------------------------------------------------------------- movements */

  listFuelMovements: (params: { status?: string; overdue?: boolean } = {}) =>
    request<{ movements: FuelMovement[] }>(
      `/petro/movements?status=${encodeURIComponent(params.status ?? "")}` +
        `&overdue=${params.overdue ? "true" : "false"}`,
    ),

  openFuelMovement: (body: {
    from_kind: string;
    from_id?: string;
    to_kind: string;
    to_id?: string;
    product_code: string;
    declared_liters: number;
    temperature_c?: number | null;
    density_kg_m3?: number | null;
    due_hours?: number;
    note?: string;
  }) => request<FuelMovement>("/petro/movements", { method: "POST", body: JSON.stringify(body) }),

  closeFuelMovement: (
    id: string,
    body: { received_liters: number; temperature_c?: number | null; density_kg_m3?: number | null; note?: string },
  ) =>
    request<FuelMovement>(`/petro/movements/${id}/receive`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  disputeFuelMovement: (id: string, note: string) =>
    request<{ id: string; national_ref: string; status: string }>(
      `/petro/oversight/movements/${id}/dispute`,
      { method: "POST", body: JSON.stringify({ note }) },
    ),

  /* ----------------------------------------------------------------- census */

  /** How many forecourts are in each integration class — the IoT phase's input. */
  fuelCensusSummary: () => request<CensusSummary>("/petro/census/summary"),

  /** Record the technical survey of one forecourt. */
  recordFuelCensus: (
    stationId: string,
    body: {
      integration_class?: string;
      pump_brand?: string;
      pump_protocol?: string;
      has_atg?: boolean | null;
      has_internet?: boolean | null;
    },
  ) =>
    request<{ id: string; name: string; integration_class: string }>(
      `/petro/stations/${stationId}/census`,
      { method: "PATCH", body: JSON.stringify(body) },
    ),

  /** The licence number a site is known by, nationally. */
  setFuelNationalCode: (kind: "station" | "depot", id: string, code: string) =>
    request<{ id: string; kind: string; national_code: string | null }>(
      `/petro/registry/${kind}/${id}/code`,
      { method: "PATCH", body: JSON.stringify({ national_code: code }) },
    ),
};
