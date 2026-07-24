import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of, throwError } from "rxjs";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  LucideAngularModule,
  ChevronRight,
  Upload,
  FileText,
} from "lucide-angular";
import { SessionLoadImportComponent } from "./session-load-import.component";
import { ApiService } from "../../core/services/api.service";

function sampleResult(over: Record<string, unknown> = {}) {
  return {
    provider: "manual",
    received: 3,
    imported: 2,
    failedCount: 1,
    failed: [{ index: 1, reason: "no device<->athlete pairing" }],
    partial: true,
    idempotentKey: "user_id,session_id,provider",
    ...over,
  };
}

function mount(opts: { postResult?: unknown; postError?: unknown }) {
  const post = vi.fn(() => {
    if (opts.postError) return throwError(() => opts.postError);
    return of({ success: true, data: opts.postResult ?? sampleResult() });
  });

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [
      SessionLoadImportComponent,
      LucideAngularModule.pick({ ChevronRight, Upload, FileText }),
    ],
    providers: [provideRouter([]), { provide: ApiService, useValue: { post } }],
  });

  const fixture = TestBed.createComponent(SessionLoadImportComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, post };
}

function fakeFile(name: string, text: string, sizeOverride?: number): File {
  const file = new File([text], name, { type: "text/csv" });
  if (sizeOverride != null) {
    Object.defineProperty(file, "size", { value: sizeOverride });
  }
  return file;
}

function fileInputEvent(file: File | null): Event {
  const input = document.createElement("input");
  input.type = "file";
  Object.defineProperty(input, "files", { value: file ? [file] : [] });
  return { target: input } as unknown as Event;
}

describe("SessionLoadImportComponent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuses to import before a file is chosen", async () => {
    const { component, post } = mount({});
    await component.import();
    expect(post).not.toHaveBeenCalled();
    expect(component.error()).toContain("Choose a CSV file");
  });

  it("reads a selected file and enables import", async () => {
    const { component } = mount({});
    const file = fakeFile("export.csv", "a,b\n1,2\n");
    await component.onFileSelected(fileInputEvent(file));
    expect(component.fileName()).toBe("export.csv");
    expect(component.csvText()).toBe("a,b\n1,2\n");
    expect(component.error()).toBeNull();
  });

  it("rejects an oversized file client-side without calling the API", async () => {
    const { component, post } = mount({});
    const file = fakeFile("huge.csv", "x", 3 * 1024 * 1024);
    await component.onFileSelected(fileInputEvent(file));
    expect(component.csvText()).toBeNull();
    expect(component.error()).toContain("too large");
    await component.import();
    expect(post).not.toHaveBeenCalled();
  });

  it("posts the chosen provider and CSV text, and stores the result", async () => {
    const { component, post } = mount({});
    await component.onFileSelected(
      fileInputEvent(fakeFile("export.csv", "athlete_id,session_id\nA,1\n")),
    );
    component.provider.set("catapult");

    await component.import();

    expect(post).toHaveBeenCalledWith("/api/session-load-import/csv", {
      provider: "catapult",
      csv: "athlete_id,session_id\nA,1\n",
    });
    expect(component.result()).toEqual(sampleResult());
  });

  it("surfaces an import failure as an error", async () => {
    const { component } = mount({ postError: new Error("nope") });
    await component.onFileSelected(
      fileInputEvent(fakeFile("export.csv", "a,b\n1,2\n")),
    );
    await component.import();
    expect(component.error()).toBe("nope");
    expect(component.result()).toBeNull();
  });

  it("reset() clears file, result, and error state", async () => {
    const { component } = mount({});
    await component.onFileSelected(
      fileInputEvent(fakeFile("export.csv", "a,b\n1,2\n")),
    );
    await component.import();
    expect(component.result()).not.toBeNull();

    component.reset();

    expect(component.fileName()).toBeNull();
    expect(component.csvText()).toBeNull();
    expect(component.result()).toBeNull();
    expect(component.error()).toBeNull();
  });

  it("formats a failure with a row index as 1-based", () => {
    const { component } = mount({});
    expect(
      component.failureLabel({ index: 0, reason: "missing session id" }),
    ).toBe("Row 1: missing session id");
  });

  it("formats a failure with no index but a sessionId", () => {
    const { component } = mount({});
    expect(
      component.failureLabel({
        index: null,
        reason: "not permitted to import for this athlete",
        sessionId: "sess-9",
      }),
    ).toBe("Session sess-9: not permitted to import for this athlete");
  });
});
