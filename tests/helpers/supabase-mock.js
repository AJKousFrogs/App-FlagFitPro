/**
 * Shared in-memory Supabase mock for backend unit/integration tests.
 *
 * Most test files hand-roll their own chainable `class Query`; this is the one
 * reusable version. It actually FILTERS the seeded rows (eq/in/gte/lte/order/
 * limit), so tests assert real query behaviour rather than canned returns.
 *
 * Usage:
 *   const client = createSupabaseMock({ team_members: [ {...}, {...} ] });
 *   await getStaffedTeamIds(userId, { client });
 *
 * Supported terminals: await (thenable → { data: rows, error }), maybeSingle(),
 * single() (PGRST116 when empty). Pass `{ errors: { team_members: {...} } }` to
 * force a query error for a table.
 */

export function createSupabaseMock(tables = {}, options = {}) {
  const errors = options.errors || {};

  function query(table) {
    let rows = (tables[table] || []).map((r) => ({ ...r }));
    const tableError = errors[table] || null;

    const result = (data) =>
      tableError ? { data: null, error: tableError } : { data, error: null };

    const api = {
      select() {
        return api;
      },
      eq(col, val) {
        rows = rows.filter((r) => r[col] === val);
        return api;
      },
      neq(col, val) {
        rows = rows.filter((r) => r[col] !== val);
        return api;
      },
      in(col, vals) {
        rows = rows.filter((r) => vals.includes(r[col]));
        return api;
      },
      gte(col, val) {
        rows = rows.filter((r) => r[col] >= val);
        return api;
      },
      lte(col, val) {
        rows = rows.filter((r) => r[col] <= val);
        return api;
      },
      not(col, _op, val) {
        // supports .not(col, "is", null) → keep rows where col != val
        rows = rows.filter((r) => r[col] !== val);
        return api;
      },
      order(col, opts = {}) {
        const dir = opts.ascending === false ? -1 : 1;
        rows = [...rows].sort((a, b) => {
          if (a[col] === b[col]) return 0;
          return a[col] > b[col] ? dir : -dir;
        });
        return api;
      },
      limit(n) {
        rows = rows.slice(0, n);
        return api;
      },
      maybeSingle() {
        return Promise.resolve(result(rows[0] ?? null));
      },
      single() {
        if (tableError)
          return Promise.resolve({ data: null, error: tableError });
        return Promise.resolve(
          rows[0]
            ? { data: rows[0], error: null }
            : { data: null, error: { code: "PGRST116" } },
        );
      },
      then(resolve, reject) {
        return Promise.resolve(result(rows)).then(resolve, reject);
      },
    };
    return api;
  }

  return { from: (t) => query(t) };
}
