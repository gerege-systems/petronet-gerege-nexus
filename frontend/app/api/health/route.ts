import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * A process-local readiness probe.
 *
 * This deliberately does not call the backend: Compose already waits for the
 * backend independently, and making the web process's health depend on a
 * second service would make one outage look like two.
 */
export async function GET() {
  return NextResponse.json(
    { status: "ok", service: "petronet-web" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
