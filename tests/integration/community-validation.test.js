import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  pollOptionExists: false,
  pollVoteExists: false,
  voteInsertErrorMessage: null,
}));

function createFakeSupabase() {
  class Query {
    constructor(table) {
      this.table = table;
      this.filters = {};
    }
    select() {
      return this;
    }
    eq(field, value) {
      this.filters[field] = value;
      return this;
    }
    order() {
      return this;
    }
    range() {
      return this;
    }
    limit() {
      return this;
    }
    in() {
      return this;
    }
    insert() {
      if (this.table === "community_poll_votes" && state.voteInsertErrorMessage) {
        throw new Error(state.voteInsertErrorMessage);
      }
      return this;
    }
    rpc() {
      return Promise.resolve({ data: null, error: null });
    }
    not() {
      return this;
    }
    single() {
      if (this.table === "community_poll_options") {
        if (state.pollOptionExists) {
          return Promise.resolve({ data: { poll_id: "poll-1" }, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }
      if (this.table === "community_poll_votes") {
        if (state.pollVoteExists) {
          return Promise.resolve({ data: { id: "vote-1" }, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }
    then(resolve, reject) {
      if (this.table === "community_poll_options") {
        return Promise.resolve({ data: [{ id: "option-1" }], error: null }).then(
          resolve,
          reject,
        );
      }
      if (this.table === "community_poll_votes") {
        return Promise.resolve({ data: [], error: null }).then(resolve, reject);
      }
      return Promise.resolve({ data: [], error: null }).then(resolve, reject);
    }
  }

  return {
    from(table) {
      return new Query(table);
    },
  };
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  checkEnvVars: () => {},
  supabaseAdmin: createFakeSupabase(),
}));

vi.mock("../../netlify/functions/utils/auth-helper.js", () => ({
  authenticateRequest: async () => ({
    success: true,
    user: { id: "user-1" },
  }),
}));

describe("community validation hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.pollOptionExists = false;
    state.pollVoteExists = false;
    state.voteInsertErrorMessage = null;
    const mod = await import("../../netlify/functions/community.js");
    handler = mod.handler;
  });

  it("returns 422 for malformed feed limit query", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/community",
        headers: {},
        queryStringParameters: { feed: "true", limit: "20rows" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for malformed feed offset query", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/community",
        headers: {},
        queryStringParameters: { feed: "true", offset: "next" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 400 for invalid JSON in post creation", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/community",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: "{bad-json",
      },
      {},
    );

    expect(response.statusCode).toBe(400);
  });

  it("returns 422 for non-object JSON in post creation", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/community",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: "null",
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 404 when voting on a missing poll option", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/community",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { pollVote: "true", optionId: "missing-option" },
      },
      {},
    );

    const body = JSON.parse(response.body);
    expect(response.statusCode).toBe(404);
    expect(body.error?.code).toBe("not_found");
  });

  it("returns sanitized 500 when vote processing fails unexpectedly", async () => {
    state.pollOptionExists = true;
    state.voteInsertErrorMessage = "sensitive vote insertion detail";

    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/community",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { pollVote: "true", optionId: "option-1" },
      },
      {},
    );

    const body = JSON.parse(response.body);
    expect(response.statusCode).toBe(500);
    expect(body.error?.message).toBe("Failed to vote");
    expect(body.error?.code).toBe("server_error");
    expect(response.body).not.toContain("sensitive vote insertion detail");
  });

  it("returns 409 when user has already voted on the poll", async () => {
    state.pollOptionExists = true;
    state.pollVoteExists = true;

    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/community",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { pollVote: "true", optionId: "option-1" },
      },
      {},
    );

    const body = JSON.parse(response.body);
    expect(response.statusCode).toBe(409);
    expect(body.error?.code).toBe("conflict");
  });
});
