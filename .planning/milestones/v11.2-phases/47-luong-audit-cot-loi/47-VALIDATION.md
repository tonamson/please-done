---
phase: 47
slug: luong-audit-cot-loi
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 47 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in) |
| **Config file** | none — project uses node --test directly |
| **Quick run command** | `node --test test/smoke-*.test.js` |
| **Full suite command** | `node --test test/smoke-*.test.js` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/smoke-*.test.js`
- **After every plan wave:** Run `node --test test/smoke-*.test.js`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 47-01-01 | 01 | 1 | BATCH-01, BATCH-02 | unit | `node --test test/smoke-parallel-dispatch.test.js` | ❌ W0 | ⬜ pending |
| 47-02-01 | 02 | 1 | CORE-01, CORE-02, CORE-03 | content check | `grep "pd:audit" commands/pd/audit.md` | ❌ W0 | ⬜ pending |
| 47-02-02 | 02 | 1 | CORE-02 | content check | `grep "detect" workflows/audit.md` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/smoke-parallel-dispatch.test.js` — tests cho buildScannerPlan, mergeScannerResults
- [ ] Existing test infrastructure covers remaining phase requirements (smoke tests)

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| pd:audit end-to-end flow | CORE-02 | Can chay skill tu CLI voi du an thuc | Chay `pd:audit .` tren du an test, xac nhan 9 buoc chay dung |
| Doc lap vs Tich hop mode | CORE-03 | Can 2 moi truong khac nhau | Test tren du an co .planning/ va khong co .planning/ |
| Scanner failure isolation | BATCH-02 | Can 1 scanner that bai thuc | Tao category khong hop le, xac nhan cac scanner con lai van chay |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
