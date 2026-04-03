---
phase: 80
slug: integration-contract-tests
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-03
---

# Phase 80 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (node:test) |
| **Config file** | `package.json` → `"test": "node --test test/**/*.test.js"` |
| **Quick run command** | `node --test test/integration-contracts.test.js` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/integration-contracts.test.js`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 80-01-01 | 01 | 1 | INTEG-01 | unit+contract | `node --test test/integration-contracts.test.js` | ❌ new | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No Wave 0 required — `test/integration-contracts.test.js` is itself the deliverable. No prior stubs needed.

Existing infrastructure already in place:
- `bin/lib/log-schema.js` (Phase 79) — `validateLogEntry` exported and importable
- `templates/progress.md` — canonical PROGRESS.md schema (with Phase 76 lint fields)
- `node:test` + `node:assert/strict` — available in Node v24

---

## Per-Artifact Contract Coverage

| Artifact | Required Fields | Regex Pattern | SC |
|----------|----------------|---------------|-----|
| CONTEXT.md | header, Initialized, New project, Tech Stack, Rules | `/^# Context/m` etc. | SC2 |
| TASKS.md | header, Milestone, Overview, table, Task heading, Status | `/^# Tasks/m` etc. | SC2 |
| PROGRESS.md | 9 fields incl. lint_fail_count, last_lint_error | `/^> lint_fail_count:/m` etc. | SC2+SC3 |
| META.json | schema_version, mapped_at_commit (40-char SHA), mapped_at (ISO-8601) | `/^[a-f0-9]{40}$/` etc. | SC3 |
| agent-errors.jsonl | 7 JSONL fields via validateLogEntry | `validateLogEntry(parsed)` | SC3 |
| Malformed detection | lint_fail_count missing → negative assertion | `assert.ok(!/regex/.test(malformed))` | SC4 |

---

## Manual-Only Verifications

All phase behaviors have automated verification — 28 inline-fixture contract tests with no manual steps required.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: single task — continuous automated verify
- [x] Wave 0 covers all MISSING references (N/A — no Wave 0)
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ✅ approved — all checks pass, phase verified
