---
phase: 58
slug: token-budget-benchmark
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 58 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x + custom scripts |
| **Config file** | `jest.config.js` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test && node scripts/count-tokens.js --compare` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test && node scripts/count-tokens.js --compare`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 058-01-01 | 01 | 1 | TOKN-01 | unit | `npm test -- --testPathPattern=resource-config` | ✅ | ⬜ pending |
| 058-01-02 | 01 | 1 | TOKN-02 | script | `node scripts/count-tokens.js --compare` | ✅ | ⬜ pending |
| 058-02-01 | 02 | 1 | TOKN-03 | snapshot | `npm test -- --testPathPattern=snapshot` | ✅ | ⬜ pending |
| 058-02-02 | 02 | 1 | TOKN-04 | script | `npm run eval:full` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| BENCHMARK_RESULTS.md readable | TOKN-02 | Document quality | Review markdown formatting and data accuracy |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
