---
phase: 50
slug: poc-fix-phases
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 50 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.js |
| **Quick run command** | `npx jest --testPathPattern="phase-50" --bail` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="phase-50" --bail`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 50-01-01 | 01 | 1 | POC-01 | unit | `npx jest poc-generator` | ❌ W0 | ⬜ pending |
| 50-01-02 | 01 | 1 | POC-01 | unit | `npx jest poc-generator` | ❌ W0 | ⬜ pending |
| 50-02-01 | 02 | 1 | POC-02 | unit | `npx jest gadget-chain` | ❌ W0 | ⬜ pending |
| 50-02-02 | 02 | 1 | POC-02 | unit | `npx jest gadget-chain` | ❌ W0 | ⬜ pending |
| 50-03-01 | 03 | 2 | FIX-01,FIX-02 | unit | `npx jest fix-phase-generator` | ❌ W0 | ⬜ pending |
| 50-03-02 | 03 | 2 | FIX-03 | unit | `npx jest fix-phase-generator` | ❌ W0 | ⬜ pending |
| 50-04-01 | 04 | 3 | FIX-01 | integration | `npx jest audit-workflow` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/poc-generator.test.js` — stubs for POC-01 (POC section generation)
- [ ] `tests/gadget-chain.test.js` — stubs for POC-02 (chain detection + severity escalation)
- [ ] `tests/fix-phase-generator.test.js` — stubs for FIX-01, FIX-02, FIX-03 (fix phases + template + SEC-VERIFY)

*Existing jest infrastructure covers test runner — only test files needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| pd-sec-fixer agent proposal format | FIX-01 | Agent template output varies | Run audit with --poc on test project, verify fix phases proposal displayed |
| SEC-VERIFY re-audit scope | FIX-03 | Requires multi-phase execution | Run fix phases then SEC-VERIFY, verify only fixed files scanned |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
