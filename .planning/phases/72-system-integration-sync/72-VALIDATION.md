---
phase: 72
slug: system-integration-sync
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 72 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js test runner (smoke tests) |
| **Config file** | `package.json` (test scripts) |
| **Quick run command** | `node test/smoke-integrity.test.js` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node test/smoke-integrity.test.js`
- **After all tasks:** Run `npm test` for full regression

---

## Validation Architecture

### What to Validate

| Requirement | Validation Method | Expected Result |
|-------------|-------------------|-----------------|
| SYNC-01 | `grep "pd:test --standalone" references/state-machine.md` | Matches prerequisites row + side branch |
| SYNC-02 | `grep "STANDALONE_TEST_REPORT" workflows/what-next.md` | Matches standalone detection logic |
| SYNC-03 | `grep "standalone" workflows/complete-milestone.md` | Matches bug skip logic |

### Snapshot Considerations

- `what-next.md` and `complete-milestone.md` have platform snapshots in `test/snapshots/`
- After modifications, run `node test/generate-snapshots.js` to regenerate
- Verify with `node test/smoke-integrity.test.js`

---

*Phase: 72-system-integration-sync*
*Created: 2026-03-30*
