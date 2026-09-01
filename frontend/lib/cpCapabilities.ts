/*
 * Gerege Nexus
 * Copyright (c) 2026 Gerege Systems Development Team, Gerege Nomadica Foundation.
 * Distributed under the Apache 2.0 License.
 */

/**
 * What each console role may do, in one place.
 *
 * It was written twice — in the tenant detail screen and again in the SSO
 * client screen — and six other screens that also carry buttons had no copy at
 * all. An auditor, whose row here is deliberately empty, could open /cp/support
 * and press "revoke sessions", fill in a reason, confirm, and receive a raw 403
 * from the server; the same for approving a tenant deletion, which is a
 * superadmin act (audit §17). The server refused every one of them, so nothing
 * was ever wrongly done — what was wrong is the screen offering it.
 *
 * This is the display half of the decision and never the enforcing half. The
 * console API checks the same capabilities server-side; a copy in the browser
 * cannot be trusted and is not asked to be.
 */
export const CP_CAPABILITIES: Record<string, string[]> = {
  superadmin: [
    "tenant.suspend",
    "tenant.delete",
    "quota.write",
    "support.act",
    "user.impersonate",
    "approval.decide",
    "settings.write",
  ],
  operator: ["tenant.suspend", "quota.write", "support.act", "settings.write"],
  support: ["support.act", "user.impersonate"],
  auditor: [],
};

/** Whether a role holds a capability. An unknown role holds nothing. */
export function cpAllowed(role: string, capability: string): boolean {
  return (CP_CAPABILITIES[role] ?? []).includes(capability);
}
