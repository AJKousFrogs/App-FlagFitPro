# Backend Function Contract

## Purpose

This document defines the default contract for Netlify functions in this repo.

It exists to stop backend drift in:
- request body parsing
- success/error response shape
- role resolution
- route-level error classification
- request tracing

Use this doc together with:
- [API.md](./API.md)
- [ROLE_AUTHORIZATION_MODEL.md](./ROLE_AUTHORIZATION_MODEL.md)
- [SINGLE_SOURCE_OF_TRUTH.md](./SINGLE_SOURCE_OF_TRUTH.md)

## Binding Rules

### 1. Request Body Parsing

- Default parser: `parseJsonObjectBody` from `netlify/functions/utils/input-validator.js`
- Do not use ad hoc `JSON.parse(event.body || "{}")` in new functions.
- Empty body is allowed only when the endpoint truly supports an empty object payload.

Required behavior:
- malformed JSON -> `400 invalid_json`
- valid JSON but non-object payload -> `422 validation_error`

If an older endpoint already has tests that depend on a slightly different wording, preserve the wording but keep the same status-classification split.

### 2. Success Responses

- Prefer `createSuccessResponse` from `netlify/functions/utils/error-handler.js`
- Do not handcraft JSON success payloads unless the endpoint is returning:
  - a file/download
  - non-JSON content
  - a very specific external contract that cannot use the helper

Use the helper to keep:
- status codes explicit
- response shape consistent
- request IDs available where expected

### 3. Error Responses

- Prefer `createErrorResponse`
- Prefer `handleValidationError` for simple `422` validation paths when the endpoint already uses it

Status rules:
- `400`: malformed JSON or malformed raw request syntax
- `401`: unauthenticated
- `403`: authenticated but not allowed
- `404`: resource/path not found
- `409`: state conflict
- `422`: valid request syntax but invalid input values or body shape
- `500`: internal app/database failure
- `502` / `503`: upstream/provider/runtime dependency failure only

Do not use `500` for validation failures.
Do not use `502` as a generic catch-all.

### 4. Role Resolution

- Team role authority lives in `team_members`, not `users`
- Prefer shared role helpers over endpoint-local role logic
- Avoid `.maybeSingle()` when a user can legitimately have multiple active memberships

Required rule:
- if role checks are team-scoped, compare against the relevant team membership set, not one assumed row

### 5. Request Context

- Prefer `baseHandler`
- Prefer the runtime-v2 adapter wrapper
- Use the request context request ID in shaped error responses where available

Blocking first-line safety should stay in shared utilities:
- runtime adapter
- Supabase bootstrap
- shared parser
- shared error helpers

### 6. Validation Ownership

Keep validation local only when it is domain-specific.

Shared/common validation should live in shared helpers:
- JSON object body parsing
- bounded ints
- simple enum checks
- common date parsing
- common ID/string guards

### 7. Exceptions

Custom handling is acceptable when:
- the endpoint streams or downloads content
- the endpoint proxies a third-party response
- the endpoint must preserve an older tested contract

When making an exception, keep the status-classification logic aligned with this doc.

## Migration Priority

When cleaning older functions, do it in this order:
1. body parsing
2. role resolution
3. success/error helper consistency
4. duplicated validators

This order removes the highest-risk bugs first without broad refactors.
