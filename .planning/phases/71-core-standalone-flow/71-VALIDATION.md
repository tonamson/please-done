---
phase: 71
slug: core-standalone-flow
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 71 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                              |
| ---------------------- | ------------------------------------------------------------------ |
| **Framework**          | Manual verification (markdown template changes — no runtime tests) |
| **Config file**        | none                                                               |
| **Quick run command**  | `grep -c "standalone" commands/pd/test.md workflows/test.md`       |
| **Full suite command** | `npm test` (existing smoke tests)                                  |
| **Estimated runtime**  | ~5 seconds                                                         |

---

## Sampling Rate

- **After every task commit:** Run `grep -c "standalone" commands/pd/test.md workflows/test.md`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement                                                                             | Test Type | Automated Command                                                   | File Exists | Status     |
| -------- | ---- | ---- | --------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------- | ----------- | ---------- |
| 71-01-01 | 01   | 1    | TEST-01, TEST-02, TEST-03, GUARD-01, GUARD-02, GUARD-03, REPORT-01, REPORT-02, RECOV-01 | grep      | `grep "standalone" commands/pd/test.md`                             | ✅          | ⬜ pending |
| 71-02-01 | 02   | 1    | TEST-01                                                                                 | grep      | `grep "Step 0\|Step S1" workflows/test.md`                          | ✅          | ⬜ pending |
| 71-02-02 | 02   | 1    | TEST-01, TEST-02, TEST-03                                                               | grep      | `grep "Step S1\|Step S8" workflows/test.md`                         | ✅          | ⬜ pending |
| 71-02-03 | 02   | 1    | GUARD-01                                                                                | diff      | `git diff HEAD -- workflows/test.md \| grep "^-" \| grep -v "^---"` | ✅          | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

_Existing infrastructure covers all phase requirements — no new test framework needed._

---

## Manual-Only Verifications

| Behavior                | Requirement | Why Manual                                         | Test Instructions                                                                               |
| ----------------------- | ----------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Standard flow unchanged | GUARD-01    | Must verify Steps 1–10 are byte-for-byte unchanged | `git diff HEAD -- workflows/test.md` — verify only additions (Step 0 prepended, S1–S8 appended) |
| Auto-detect stack       | TEST-03     | Requires various project structures                | Create test dirs with nest-cli.json, composer.json, etc. and verify detection                   |
| Recovery flow           | RECOV-01    | Requires interrupted session state                 | Create partial standalone report, run standalone, verify resume offer                           |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
