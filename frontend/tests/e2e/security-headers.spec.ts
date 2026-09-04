import { expect, test } from "@playwright/test";

const publicOrigin = "http://nexus.localhost:3210";

test.describe("security response contract", () => {
  for (const path of ["/", "/login"]) {
    test(`${path} receives a usable nonce policy`, async ({ request }) => {
      const response = await request.get(`${publicOrigin}${path}`);
      expect(response.status()).toBe(200);

      const headers = response.headers();
      const csp = headers["content-security-policy"] ?? "";
      expect(csp).toMatch(/script-src [^;]*'nonce-[^']+'/);
      const nonce = csp.match(/'nonce-([^']+)'/)?.[1];
      expect(nonce).toBeTruthy();
      expect(await response.text()).toContain(`nonce="${nonce}"`);
      expect(csp).toContain("'strict-dynamic'");
      expect(csp.match(/script-src [^;]*/)?.[0] ?? "").not.toContain("'unsafe-inline'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(headers["strict-transport-security"]).toMatch(/max-age=\d+/);
      expect(headers["x-frame-options"]).toBe("DENY");
      expect(headers["x-content-type-options"]).toBe("nosniff");
      expect(headers["permissions-policy"]).toContain("geolocation=(self)");
    });
  }

  test("health endpoint identifies only the web process", async ({ request }) => {
    const response = await request.get(`${publicOrigin}/api/health`);
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ status: "ok", service: "petronet-web" });
    expect(response.headers()["cache-control"]).toContain("no-store");
  });
});
