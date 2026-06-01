# Auth Hardening — Leaked Password Protection & Advisor Posture

**When to use:** closing the Supabase security-advisor `auth_leaked_password_protection`
warning, or reviewing why the remaining advisor warnings are accepted.

Project ref: `grfjmnjpzvknmsxrwesx`

---

## 1. Enable native leaked-password protection (ACTION REQUIRED — manual)

The advisor lint `auth_leaked_password_protection` ("Leaked Password Protection
Disabled") refers to **Supabase Auth's native HaveIBeenPwned check**, a GoTrue
config setting. **It cannot be toggled via the Supabase MCP** (no auth-config
tool exists) or via SQL — it must be set in the dashboard or the Management API.

### Option A — Dashboard (recommended)

1. Supabase Dashboard → project `grfjmnjpzvknmsxrwesx`
2. **Authentication → Policies** (a.k.a. *Password security* under
   Authentication → Providers → Email, depending on dashboard version)
3. Enable **"Check passwords against HaveIBeenPwned"** / *Leaked password
   protection*.
4. Save. Re-run the advisor to confirm the warning clears:
   `get_advisors(type: "security")` → `auth_leaked_password_protection` gone.

### Option B — Management API (requires a personal access token)

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/grfjmnjpzvknmsxrwesx/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "password_hibp_enabled": true }'
```

> Reversible at any time (set `false` / untoggle). Low risk — it only rejects
> passwords found in known breaches at signup / password change.

### Defense-in-depth already present (do not confuse with the above)

The `enable-leaked-password-protection` **edge function** is a *separate,
application-level* HIBP check (k-anonymity, callable pre-session at signup). Its
`enable`/`status` actions are cosmetic and **do not** flip the native GoTrue
setting — so deploying/invoking it does **not** clear the advisor. Keep it as a
belt-and-suspenders check the signup flow can call; enable the native setting
above regardless.

---

## 2. Residual advisor warnings (accepted by design — no action)

As of 2026-06-01 the security advisor reports **76 WARN, 0 ERROR**:

| Lint | Count | Disposition |
| --- | --- | --- |
| `auth_leaked_password_protection` | 1 | **Actionable** — see §1 |
| `anon_security_definer_function_executable` | 10 | **By design** — RLS predicate helpers |
| `authenticated_security_definer_function_executable` | 65 | **By design** — legitimate authenticated RPCs |

The 10 `anon`-executable functions are exactly the RLS/policy predicate helpers
(`ff_is_active_team_member`, `ff_is_team_staff`, `ff_can_access_channel`,
`ff_can_manage_channel`, `ff_can_post_to_channel`, `ff_share_active_team`,
`auth_user_team_ids`, `can_view_player_performance`, `has_role`,
`is_active_superadmin`). They **must** remain executable so RLS policies can
evaluate them; revoking would break row-level security. This is the intended end
state after the backend audit's Fix E (anon-executable SECURITY DEFINER set was
reduced 71 → 10; the remaining 10 are these predicates).

The 65 `authenticated`-executable functions are RPCs legitimately called by
signed-in users; the cron/admin/PII-mutating functions were already restricted
to `service_role` in Fix E2/E3. The advisor flags every SECURITY DEFINER
function reachable by these roles generically — presence here is not a defect.

> Re-evaluate this table if new SECURITY DEFINER functions are added: a new
> entry that is **not** an RLS predicate or a deliberately-authenticated RPC
> should be revoked to `service_role` (REVOKE FROM PUBLIC; GRANT service_role),
> not left flagged.
