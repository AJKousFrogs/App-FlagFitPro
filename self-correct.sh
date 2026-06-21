#!/usr/bin/env bash
# self-correct.sh — run a task, verify against a gate, feed failures back until green.
#
# Usage: ./self-correct.sh "task description"
#
# Gate notes (why this differs from the original):
#   - `npm run typecheck` does NOT exist in this repo — the script is `type-check`
#     (hyphen). The original gate failed at that step on every pass regardless of
#     code state, exhausting all passes and exiting "human needed" on a green tree.
#   - `npm run test:e2e` runs the root Playwright suite, which (a) needs the dev
#     stack up and (b) includes visual-regression whose PNG baselines are Linux
#     (regenerated in CI) — so it false-fails on macOS. That belongs in CI, not a
#     local loop.
#
# So the LOCAL gate below is the fast, deterministic, server-free, snapshot-free
# set that gives real signal anywhere: type-check + lint + backend unit tests.
# The full E2E + visual + mobile suites already gate every PR in CI.
set -euo pipefail

TASK="${1:?usage: ./self-correct.sh \"task description\"}"
MAX=6
mkdir -p .claude
LOG=".claude/loop-$(date +%s).log"

# Local-safe verification gate (deterministic, no dev server, no OS-specific snapshots).
# To run the full suite instead (CI-parity, needs the dev stack + Linux for snapshots):
#   GATE="npm run test:e2e --silent && npm run type-check --silent && npm run lint --silent"
GATE="npm run type-check --silent && npm run lint --silent && npm run test:unit:backend --silent"

CONTEXT=""
for i in $(seq 1 "$MAX"); do
  echo "=== Pass $i/$MAX ===" | tee -a "$LOG"

  PROMPT="$TASK

Workflow: audit before code, root-cause not symptom, atomic conventional commits.
${CONTEXT:+Previous pass failed the gate. Here is the failure output — diagnose the ROOT cause and fix it, do not patch around it:}
$CONTEXT

After fixing, the verification gate that will run is:
  $GATE
End your response when you believe the gate will pass."

  claude -p "$PROMPT" --dangerously-skip-permissions 2>&1 | tee -a "$LOG"

  echo "--- verifying ---" | tee -a "$LOG"
  if OUTPUT=$(bash -c "$GATE" 2>&1); then
    echo "GATE PASSED on pass $i" | tee -a "$LOG"
    git log --oneline -5 | tee -a "$LOG"
    exit 0
  fi

  # feed only the failure tail back in — keep context lean
  CONTEXT=$(echo "$OUTPUT" | tail -n 40)
  echo "Gate failed, looping with failure context" | tee -a "$LOG"
done

echo "FAILED after $MAX passes — human needed. See $LOG" >&2
exit 1
