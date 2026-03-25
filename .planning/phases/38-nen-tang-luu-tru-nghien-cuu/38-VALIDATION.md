---
phase: 38
slug: nen-tang-luu-tru-nghien-cuu
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-25
---

# Phase 38 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node --test (built-in) |
| **Config file** | none — built-in |
| **Quick run command** | `node --test test/smoke-research-store.test.js` |
| **Full suite command** | `node --test test/*.test.js` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/smoke-research-store.test.js`
- **After every plan wave:** Run `node --test test/*.test.js`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 38-01-01 | 01 | 0 | STORE-01, STORE-02 | unit | `node --test test/smoke-research-store.test.js` | ❌ W0 | ⬜ pending |
| 38-01-02 | 01 | 1 | STORE-01, STORE-02, AUDIT-01, AUDIT-03 | unit | `node --test test/smoke-research-store.test.js` | ❌ W0 | ⬜ pending |
| 38-02-01 | 02 | 1 | STORE-01, STORE-02 | smoke | `test -d .planning/research/internal && test -d .planning/research/external` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/smoke-research-store.test.js` — stubs for createEntry, parseEntry, nextResId, listEntries, generateIndex, appendAuditLog

*TDD: tests created before implementation code.*

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-25
