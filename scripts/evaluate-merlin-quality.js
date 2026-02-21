#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const baseUrl = process.env.MERLIN_EVAL_URL || "http://localhost:8888/api/ai/chat";
const authToken = process.env.MERLIN_EVAL_TOKEN || "";
const fixturesPath = path.join(
  process.cwd(),
  "scripts",
  "merlin-quality-fixtures.json",
);

if (!fs.existsSync(fixturesPath)) {
  console.error("Fixtures file not found:", fixturesPath);
  process.exit(1);
}

if (!authToken) {
  console.error(
    "MERLIN_EVAL_TOKEN is required. Provide a valid bearer token for evaluation.",
  );
  process.exit(1);
}

const fixtures = JSON.parse(fs.readFileSync(fixturesPath, "utf8"));
const results = [];

function containsAny(text, words = []) {
  const lower = text.toLowerCase();
  return words.some((w) => lower.includes(String(w).toLowerCase()));
}

function containsForbidden(text, words = []) {
  const lower = text.toLowerCase();
  return words.filter((w) => lower.includes(String(w).toLowerCase()));
}

for (const fixture of fixtures) {
  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      message: fixture.prompt,
    }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const answer = payload?.data?.answer_markdown || "";
  const citations = payload?.data?.citations || [];
  const expectations = fixture.expectations || {};
  const checks = [];

  if (!response.ok || !payload?.success) {
    checks.push({
      name: "request_ok",
      pass: false,
      detail: `HTTP ${response.status}`,
    });
  } else {
    checks.push({ name: "request_ok", pass: true, detail: "ok" });
  }

  if (expectations.minLength) {
    checks.push({
      name: "min_length",
      pass: answer.length >= expectations.minLength,
      detail: `${answer.length}/${expectations.minLength}`,
    });
  }

  if (Array.isArray(expectations.mustIncludeAny) && expectations.mustIncludeAny.length > 0) {
    checks.push({
      name: "must_include_any",
      pass: containsAny(answer, expectations.mustIncludeAny),
      detail: expectations.mustIncludeAny.join(", "),
    });
  }

  if (Array.isArray(expectations.mustNotIncludeAny) && expectations.mustNotIncludeAny.length > 0) {
    const forbiddenHits = containsForbidden(answer, expectations.mustNotIncludeAny);
    checks.push({
      name: "must_not_include_any",
      pass: forbiddenHits.length === 0,
      detail: forbiddenHits.join(", "),
    });
  }

  if (expectations.shouldAskFollowup === true) {
    checks.push({
      name: "followup_question",
      pass: answer.includes("?"),
      detail: "expects follow-up question",
    });
  }

  checks.push({
    name: "citations_present",
    pass: Array.isArray(citations) && citations.length > 0,
    detail: `citations=${Array.isArray(citations) ? citations.length : 0}`,
  });

  const passCount = checks.filter((c) => c.pass).length;
  const score = Math.round((passCount / checks.length) * 100);
  const passed = checks.every((c) => c.pass);

  results.push({
    id: fixture.id,
    score,
    passed,
    checks,
  });
}

const overallScore =
  results.length > 0
    ? Math.round(
        results.reduce((sum, item) => sum + item.score, 0) / results.length,
      )
    : 0;

console.log("\nMerlin Quality Evaluation");
console.log("==========================");
console.log(`Endpoint: ${baseUrl}`);
console.log(`Cases: ${results.length}`);
console.log(`Overall score: ${overallScore}\n`);

for (const result of results) {
  console.log(`- ${result.id}: ${result.passed ? "PASS" : "FAIL"} (${result.score})`);
  for (const check of result.checks) {
    console.log(
      `  ${check.pass ? "  ✓" : "  ✗"} ${check.name}${check.detail ? ` (${check.detail})` : ""}`,
    );
  }
}

const failed = results.filter((r) => !r.passed).length;
const strictPass = failed === 0 && overallScore >= 85;
process.exit(strictPass ? 0 : 1);
