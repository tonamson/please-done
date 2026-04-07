---
phase: 143
plan: "143-01"
status: completed
date: 2026-04-07
---

# Phase 143-01 Summary: Scope Reduction Detection

## What was built

Created `bin/lib/scope-checker.js` — a pure-function library for detecting scope reductions between PLAN.md requirements and SUMMARY.md deliverables.

## Deliverables

- `test/scope-checker.test.js` — 25 TDD tests covering all 5 exported functions (committed RED, then GREEN)
- `bin/lib/scope-checker.js` — implementation with 5 exports:
  - `parsePlanFile(content)` — extracts `requirements[]`, `truths[]`, `artifacts[]`, `phase` from YAML frontmatter
  - `parseSummaryFile(content)` — extracts `mentionedReqs[]` (L-XX IDs), `deliveredPaths[]` (backtick file tokens with `/` or `.`), `status`, `phase`
  - `detectReductions(plan, summary, label)` — returns `{ issues, droppedReqs, droppedArtifacts }`
  - `checkScopeReductions(pairs)` — higher-order; processes `[{planContent, summaryContent, label}]` pairs
  - `formatScopeReport(issues)` — boxed table (health-checker pattern); `"No scope reductions detected ✓"` when empty
- `commands/pd/health.md` — updated process section (steps 7-9) to load `checkScopeReductions` + `formatScopeReport` from scope-checker.js and display scope report after health report
- `~/.copilot/get-shit-done/workflows/complete-milestone.md` — injected non-blocking `scope_reduction_check` step before `update_state`

## Requirements covered

- L-07: parsePlanFile and parseSummaryFile extract scope data from PLAN/SUMMARY files
- L-08: detectReductions compares plan vs summary and surfaces dropped requirements/artifacts

## Test results

- `test/scope-checker.test.js`: 25/25 pass
- Full suite: no new failures vs baseline (log brittleness tests are pre-existing)

## Key decisions

- D-01: Backtick path filter uses `includes('/')` OR `includes('.')` to catch relative paths and filenames without slashes
- D-02: `detectReductions` artifact matching uses `.includes()` bidirectionally to handle partial path matches
- D-03: `formatScopeReport` shows before/after header summary line per plan-checker requirement
- D-04: `complete-milestone.md` injection is non-blocking (warns, does not prevent completion)
