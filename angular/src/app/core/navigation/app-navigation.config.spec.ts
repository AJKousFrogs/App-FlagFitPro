import { describe, expect, it } from "vitest";
import {
  getMeNavigationItems,
  getMobileMoreNavigationItems,
  getMobilePrimaryNavigationItems,
  getPrimaryNavigationItems,
  getRoleNavigationItems,
  getSecondaryNavigationItems,
  isExactNavigationRoute,
} from "./app-navigation.config";

function toRouteSet(routes: { route: string }[]): Set<string> {
  return new Set(routes.map((item) => item.route));
}

describe("app-navigation.config", () => {
  it.each([
    ["player"],
    ["coach"],
    ["assistant_coach"],
    ["admin"],
  ])(
    "keeps sidebar and bottom-nav route sources in parity for %s",
    (role) => {
      const sidebarRoutes = toRouteSet([
        ...getPrimaryNavigationItems(role),
        ...getSecondaryNavigationItems(role),
        ...getMeNavigationItems(role),
      ]);
      const bottomNavRoutes = toRouteSet([
        ...getMobilePrimaryNavigationItems(role),
        ...getMobileMoreNavigationItems(role),
      ]);

      expect(bottomNavRoutes).toEqual(sidebarRoutes);
      expect(sidebarRoutes).toEqual(toRouteSet(getRoleNavigationItems(role)));
    },
  );

  it("keeps mobile primary routes as a subset of primary navigation", () => {
    const primaryRoutes = toRouteSet(getPrimaryNavigationItems("player"));
    const mobileRoutes = getMobilePrimaryNavigationItems("player").map(
      (item) => item.route,
    );

    for (const route of mobileRoutes) {
      expect(primaryRoutes.has(route)).toBe(true);
    }
  });

  it("marks only the exact-match shell routes as exact navigation paths", () => {
    expect(isExactNavigationRoute("/dashboard")).toBe(true);
    expect(isExactNavigationRoute("/player-dashboard")).toBe(true);
    expect(isExactNavigationRoute("/coach/dashboard")).toBe(true);
    expect(isExactNavigationRoute("/todays-practice")).toBe(true);

    expect(isExactNavigationRoute("/training")).toBe(false);
    expect(isExactNavigationRoute("/community")).toBe(false);
    expect(isExactNavigationRoute("/settings")).toBe(false);
  });
});
