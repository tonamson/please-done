---
phase: "058"
plan: "02"
subsystem: "workflows, eval-pipeline"
tags: [conditional-reading, eval-pipeline, token-budget, benchmark]
dependency_graph:
  requires: [058-01]
  provides: [conditional-reading-audit, conditional-reading-scan, eval-pipeline-verified]
  affects: [workflows/audit.md, workflows/scan.md, BENCHMARK_RESULTS.md]
tech_stack:
  added: []
  patterns: [conditional-reading-pattern]
key_files:
  created: []
  modified: [workflows/audit.md, workflows/scan.md, BENCHMARK_RESULTS.md]
decisions:
  - id: D-08
    summary: "audit.md conditional_reading dat sau </purpose>, truoc <process> — nhat quan voi pattern hien co"
  - id: D-09
    summary: "scan.md conditional_reading tuong tu audit.md — cung vi tri, cung format"
  - id: D-10
    summary: "promptfoo CLI dung npx fallback — khong can cai dat global"
metrics:
  duration: "96s"
  completed: "2026-03-27T11:04:18Z"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 3
---

# Phase 058 Plan 02: Mo rong conditional_reading + Verify eval pipeline

**Them conditional_reading block vao audit.md va scan.md, verify eval pipeline voi promptfooconfig.yaml — nang tong so workflows co conditional_reading len 10.**

## Tasks Completed

### Task 1: Them conditional_reading vao audit.md va scan.md
- **Commit:** `d980aa9`
- **Files:** workflows/audit.md, workflows/scan.md
- **Chi tiet:**
  - audit.md: them conditional_reading block voi security-checklist.md va conventions.md
  - scan.md: them conditional_reading block voi security-checklist.md va conventions.md
  - Vi tri: sau `</purpose>`, truoc `<process>` — nhat quan voi 8 workflows hien co
  - Tong so workflows co conditional_reading: 10 (8 cu + 2 moi)

### Task 2: Verify eval pipeline va cap nhat BENCHMARK_RESULTS.md
- **Commit:** `db225f0`
- **Files:** BENCHMARK_RESULTS.md
- **Chi tiet:**
  - promptfooconfig.yaml: YAML hop le, 1 provider, 62 tests
  - evals/run.js: saveBenchmark() va compareBenchmarks() ton tai va hoat dong
  - promptfoo CLI: chua cai dat global, npx promptfoo available lam fallback
  - evals/benchmarks/ directory: da tao va san sang
  - ANTHROPIC_API_KEY: chua co trong .env — skip live eval run
  - Them section "Eval Pipeline Status" vao BENCHMARK_RESULTS.md

## Verification Results

| Check | Ket qua |
|-------|---------|
| `grep -rl 'conditional_reading' workflows/*.md \| wc -l` | 10 (>= 10) |
| YAML validation | PASS |
| `test -d evals/benchmarks` | PASS |
| `npm test` | All tests pass |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.
