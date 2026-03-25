---
phase: 39
slug: tieu-chuan-kiem-chung-chi-muc
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-25
---

# Phase 39 — Validation Strategy

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node --test (built-in) |
| **Quick run command** | `node --test test/smoke-research-store.test.js test/smoke-confidence-scorer.test.js` |
| **Full suite command** | `node --test test/*.test.js` |
| **Estimated runtime** | ~15 seconds |

## Sampling Rate

- **After every task commit:** Quick run
- **After every plan wave:** Full suite
- **Max feedback latency:** 15 seconds

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 39-01-01 | 01 | 1 | AUDIT-02, AUDIT-04, STORE-03 | unit | `node --test test/smoke-research-store.test.js` | ✅ | ⬜ pending |
| 39-02-01 | 02 | 1 | AUDIT-03 | unit | `node --test test/smoke-confidence-scorer.test.js` | ❌ W0 | ⬜ pending |

## Wave 0 Requirements

- [ ] `test/smoke-confidence-scorer.test.js` — stubs for scoreConfidence

## Validation Sign-Off

- [x] All tasks have automated verify
- [x] Sampling continuity OK
- [x] Wave 0 covers MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true`

**Approval:** approved 2026-03-25
