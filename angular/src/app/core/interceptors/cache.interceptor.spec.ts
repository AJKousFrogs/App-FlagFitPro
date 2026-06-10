import { describe, it, expect, beforeEach } from "vitest";
import { HttpResponse } from "@angular/common/http";
import { HttpCacheService } from "./cache.interceptor";

// The interceptor's singleton cache, exported under this alias.
const cache = HttpCacheService as unknown as {
  set(url: string, res: HttpResponse<unknown>): void;
  get(url: string, ttl?: number): HttpResponse<unknown> | null;
  clear(url?: string): void;
  clearRelated(mutationUrl: string): void;
};

const res = (body: unknown) => new HttpResponse({ status: 200, body });

describe("cache invalidation is resource-scoped", () => {
  beforeEach(() => cache.clear());

  it("a POST invalidates only its own resource, not the whole API", () => {
    cache.set("/api/schedule", res({ a: 1 }));
    cache.set("/api/player-settings", res({ b: 2 }));
    cache.set("/api/calc-readiness", res({ c: 3 }));

    // Previously this wiped every entry; now it must touch only calc-readiness.
    cache.clearRelated("/api/calc-readiness");

    expect(cache.get("/api/schedule")).not.toBeNull();
    expect(cache.get("/api/player-settings")).not.toBeNull();
    expect(cache.get("/api/calc-readiness")).toBeNull();
  });

  it("invalidates query-string and sub-path variants of the same resource", () => {
    cache.set("/api/schedule?week=1", res({ a: 1 }));
    cache.set("/api/schedule/today", res({ b: 2 }));
    cache.set("/api/wellness", res({ c: 3 }));

    cache.clearRelated("/api/schedule");

    expect(cache.get("/api/schedule?week=1")).toBeNull();
    expect(cache.get("/api/schedule/today")).toBeNull();
    expect(cache.get("/api/wellness")).not.toBeNull();
  });

  it("does not let a similarly-named resource leak (wellness vs wellness-checkin)", () => {
    cache.set("/api/wellness", res({ a: 1 }));
    cache.set("/api/wellness-checkin", res({ b: 2 }));

    cache.clearRelated("/api/wellness-checkin");

    expect(cache.get("/api/wellness")).not.toBeNull();
    expect(cache.get("/api/wellness-checkin")).toBeNull();
  });
});
