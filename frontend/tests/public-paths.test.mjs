import { expect, test } from "vitest";

import { isPublicPath } from "../lib/publicPath.mjs";

test("PetroNet product pages do not require a tenant session", () => {
  for (const path of [
    "/",
    "/supply",
    "/stations",
    "/vouchers",
    "/oversight",
    "/rollout",
  ]) {
    expect(isPublicPath(path), path).toBe(true);
  }
});

test("authenticated platform pages remain protected", () => {
  for (const path of [
    "/apps",
    "/profile",
    "/settings",
    "/module/documents",
    "/supply/private",
  ]) {
    expect(isPublicPath(path), path).toBe(false);
  }
});
