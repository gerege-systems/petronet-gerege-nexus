import { expect, test } from "vitest";

import { switchDestination } from "../lib/nav.mjs";

const MENUS = ["/fuel", "/fuel/depots", "/module/documents/inbox"];

test("a switch stays on the screen the new tenant also has", () => {
  for (const path of ["/fuel", "/fuel/depots", "/module/documents/inbox/abc"]) {
    expect(switchDestination(path, MENUS)).toBe(path);
  }
});

test("a switch leaves a screen the new tenant has no app for", () => {
  expect(switchDestination("/sso-clients", MENUS)).toBe("/apps");
  expect(switchDestination("/fuel", [])).toBe("/apps");
  // A sibling whose path merely begins with the same characters is not the app.
  expect(switchDestination("/fuel-cards", MENUS)).toBe("/apps");
});

test("the shell's own screens are never left: /menus never lists them", () => {
  for (const path of ["/apps", "/settings/apps", "/profile", "/cp/tenants"]) {
    expect(switchDestination(path, [])).toBe(path);
  }
});
