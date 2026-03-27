import { describe, expect, it, vi } from "vitest";
import { getRouteAnimationState } from "./route-animations";

describe("route-animations", () => {
  it("returns fade before the router outlet activates", () => {
    const outlet = {
      isActivated: false,
      get activatedRouteData() {
        throw new Error("should not read activatedRouteData");
      },
      get activatedRoute() {
        throw new Error("should not read activatedRoute");
      },
    };

    expect(getRouteAnimationState(outlet)).toBe("fade");
  });

  it("uses route animation data when the router outlet is active", () => {
    const activatedRouteGetter = vi.fn(() => ({
      snapshot: { data: { animation: "slideLeft" } },
    }));

    const outlet = {
      isActivated: true,
      activatedRouteData: { animation: "fadeScale" },
      get activatedRoute() {
        return activatedRouteGetter();
      },
    };

    expect(getRouteAnimationState(outlet)).toBe("fadeScale");
    expect(activatedRouteGetter).not.toHaveBeenCalled();
  });

  it("falls back to activated route snapshot data when needed", () => {
    const outlet = {
      isActivated: true,
      activatedRouteData: undefined,
      activatedRoute: {
        snapshot: { data: { animation: "slideUp" } },
      },
    };

    expect(getRouteAnimationState(outlet)).toBe("slideUp");
  });
});
