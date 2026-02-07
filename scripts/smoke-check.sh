#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

required_major=22
current_major="$(node -p "process.versions.node.split('.')[0]")"
if [[ "$current_major" != "$required_major" ]]; then
  echo "ERROR: Node ${required_major}.x is required. Detected Node ${current_major}.x."
  exit 1
fi

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi


missing=()
required=(SUPABASE_URL SUPABASE_SERVICE_KEY SUPABASE_ANON_KEY)
for key in "${required[@]}"; do
  if [[ -z "${!key:-}" ]]; then
    missing+=("$key")
  fi
done

if (( ${#missing[@]} > 0 )); then
  echo "Missing required environment variables: ${missing[*]}"
  exit 1
fi

echo ""
echo "▶ cd angular && npm run lint && npx ng build --progress=false --verbose"
pushd angular >/dev/null
npm run lint
attempt=1
max_attempts=3
until npx ng build --progress=false --verbose; do
  if (( attempt >= max_attempts )); then
    echo "Build failed after ${max_attempts} attempts."
    exit 1
  fi
  attempt=$((attempt + 1))
  echo "WARN: Build failed. Retrying (${attempt}/${max_attempts})..."
done
popd >/dev/null

echo ""
echo "▶ netlify functions:build --src netlify/functions"
netlify functions:build --src netlify/functions

echo ""
echo "▶ npm run test:backend"
npm run test:backend

echo ""
echo "▶ npm run test:unit"
npm run test:unit

echo ""
echo "▶ health check"
node - <<'NODE'
require("dotenv/config");
const { handler: healthHandler } = require("./netlify/functions/health.cjs");

async function runHealthCheck() {
  const result = await healthHandler(
    {
      httpMethod: "GET",
      headers: {},
      path: "/api/health",
      queryStringParameters: {},
      body: null,
      isBase64Encoded: false,
    },
    {},
  );

  if (!result?.body) {
    throw new Error("Health check returned an empty response");
  }

  const payload = JSON.parse(result.body);
  if (!payload?.success) {
    throw new Error("Health check failed");
  }

  console.log("Health check passed.");
}

runHealthCheck().catch((error) => {
  console.error("Health check failed:", error.message);
  process.exit(1);
});
NODE
