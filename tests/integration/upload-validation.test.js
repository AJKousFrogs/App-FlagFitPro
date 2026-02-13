import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  authSuccess: true,
  uploadError: null,
  removeError: null,
  removedPaths: [],
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/utils/auth-helper.js", () => ({
  authenticateRequest: async () =>
    state.authSuccess ? { success: true, user: { id: "user-1" } } : { success: false },
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  checkEnvVars: () => true,
  supabaseAdmin: {
    storage: {
      from: () => ({
        upload: async (_path, _buffer, _opts) => {
          if (state.uploadError) {
            return { data: null, error: state.uploadError };
          }
          return { data: { path: "user-1/123_photo.jpg" }, error: null };
        },
        getPublicUrl: (path) => ({
          data: { publicUrl: `https://example.com/${path}` },
        }),
        remove: async (paths) => {
          state.removedPaths.push(...paths);
          if (state.removeError) {
            return { error: state.removeError };
          }
          return { error: null };
        },
      }),
    },
  },
}));

describe("upload validation and security hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.authSuccess = true;
    state.uploadError = null;
    state.removeError = null;
    state.removedPaths = [];
    const mod = await import("../../netlify/functions/upload.js");
    handler = mod.handler;
  });

  it("returns 201 for successful upload", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/upload",
        body: JSON.stringify({
          file: "data:image/jpeg;base64,aGVsbG8=",
          fileType: "image/jpeg",
          fileName: "photo.jpg",
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
  });

  it("returns 422 for non-object JSON body", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/upload",
        body: JSON.stringify("bad"),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns sanitized 500 when storage upload fails", async () => {
    state.uploadError = { message: "sensitive storage details" };

    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/upload",
        body: JSON.stringify({
          file: "data:image/jpeg;base64,aGVsbG8=",
          fileType: "image/jpeg",
          fileName: "photo.jpg",
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error.message).toBe("Upload failed");
    expect(body.error.details).toBeFalsy();
  });

  it("blocks delete path outside requester ownership", async () => {
    const response = await handler(
      {
        httpMethod: "DELETE",
        path: "/.netlify/functions/upload",
        queryStringParameters: { path: "user-2/123_photo.jpg" },
      },
      {},
    );

    expect(response.statusCode).toBe(403);
    expect(state.removedPaths).toEqual([]);
  });

  it("normalizes slash direction before delete", async () => {
    const response = await handler(
      {
        httpMethod: "DELETE",
        path: "/.netlify/functions/upload",
        queryStringParameters: { path: "user-1\\123_photo.jpg" },
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    expect(state.removedPaths).toEqual(["user-1/123_photo.jpg"]);
  });
});
