import { computed, effect, inject, Injectable } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
} from "@angular/router";
import { filter, map, startWith } from "rxjs";
import { HeaderPreset, HeaderService } from "./header.service";

export type RouteEntry =
  | "deeplink"
  | "hub"
  | "internal"
  | "legacy"
  | "public"
  | null;

interface RouteShellData {
  entry: RouteEntry;
  headerPreset: HeaderPreset | null;
  showBottomNav: boolean | null;
  showFab: boolean | null;
}

@Injectable({
  providedIn: "root",
})
export class RouteShellService {
  private readonly router = inject(Router);
  private readonly headerService = inject(HeaderService);

  readonly currentPath = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.getCurrentUrlPath()),
      startWith(this.getCurrentUrlPath()),
    ),
    { initialValue: this.getCurrentUrlPath() },
  );

  private readonly routeShellData = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.getRouteShellData()),
      startWith(this.getRouteShellData()),
    ),
    { initialValue: this.getRouteShellData() },
  );

  readonly entry = computed(() => this.routeShellData().entry);
  readonly headerPreset = computed(
    () => this.routeShellData().headerPreset ?? "default",
  );
  readonly showBottomNav = computed(() => {
    const explicit = this.routeShellData().showBottomNav;
    return explicit ?? this.isAppShellEntry(this.entry());
  });
  readonly showFab = computed(() => {
    const explicit = this.routeShellData().showFab;
    return explicit ?? this.isAppShellEntry(this.entry());
  });

  constructor() {
    effect(() => {
      this.headerService.applyPreset(this.headerPreset());
    });
  }

  private getRouteShellData(): RouteShellData {
    let snapshot: ActivatedRouteSnapshot | null = this.router.routerState
      .snapshot.root;
    const mergedData: Record<string, unknown> = {};

    while (snapshot) {
      Object.assign(mergedData, snapshot.data);
      snapshot = snapshot.firstChild ?? null;
    }

    return {
      entry: this.asRouteEntry(mergedData["entry"]),
      headerPreset: this.asHeaderPreset(mergedData["headerPreset"]),
      showBottomNav: this.asBooleanOrNull(mergedData["showBottomNav"]),
      showFab: this.asBooleanOrNull(mergedData["showFab"]),
    };
  }

  private getCurrentUrlPath(): string {
    const [pathWithHash] = this.router.url.split("?");
    const [path] = pathWithHash.split("#");
    return path || "/";
  }

  private isAppShellEntry(entry: RouteEntry): boolean {
    return entry === "hub" || entry === "internal";
  }

  private asRouteEntry(value: unknown): RouteEntry {
    switch (value) {
      case "deeplink":
      case "hub":
      case "internal":
      case "legacy":
      case "public":
        return value;
      default:
        return null;
    }
  }

  private asHeaderPreset(value: unknown): HeaderPreset | null {
    switch (value) {
      case "default":
      case "dashboard":
      case "training":
      case "analytics":
        return value;
      default:
        return null;
    }
  }

  private asBooleanOrNull(value: unknown): boolean | null {
    return typeof value === "boolean" ? value : null;
  }
}
