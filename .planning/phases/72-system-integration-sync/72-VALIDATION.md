---
phase: 72
slug: system-integration-sync
status: compliant
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-30
---

# Phase 72 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                               |
| ---------------------- | ----------------------------------- |
| **Framework**          | Node.js test runner (smoke tests)   |
| **Config file**        | `package.json` (test scripts)       |
| **Quick run command**  | `node test/smoke-integrity.test.js` |
| **Full suite command** | `npm test`                          |
| **Estimated runtime**  | ~15 seconds                         |

---

## Sampling Rate

- **After every task commit:** Run `node test/smoke-integrity.test.js`
- **After all tasks:** Run `npm test` for full regression

---

## Validation Architecture

### What to Validate

| Requirement | Validation Method                                         | Expected Result                         |
| ----------- | --------------------------------------------------------- | --------------------------------------- |
| SYNC-01     | `grep "pd:test --standalone" references/state-machine.md` | Matches prerequisites row + side branch |
| SYNC-02     | `grep "STANDALONE_TEST_REPORT" workflows/what-next.md`    | Matches standalone detection logic      |
| SYNC-03     | `grep "standalone" workflows/complete-milestone.md`       | Matches bug skip logic                  |

### Snapshot Considerations

- `what-next.md` and `complete-milestone.md` have platform snapshots in `test/snapshots/`
- After modifications, run `node test/generate-snapshots.js` to regenerate
- Verify with `node test/smoke-integrity.test.js`

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|----------|------|------|-------------|-----------|-------------------|-------------|--------|
| 72-01-01 | 01   | 1    | SYNC-01     | grep      | `grep "pd:test --standalone" references/state-machine.md` | ✅ | ✅ green |
| 72-01-02 | 01   | 1    | SYNC-02     | grep      | `grep "STANDALONE_TEST_REPORT" workflows/what-next.md`    | ✅ | ✅ green |
| 72-01-03 | 01   | 1    | SYNC-03     | grep      | `grep "standalone" workflows/complete-milestone.md`       | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements — no new test framework needed.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-01
