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
| **Framework** | Node.js built-in `node:test` + `node:assert/strict` |
| **Config file** | package.json `"test": "node --test 'test/*.test.js'"` |
| **Quick run command** | `node --test test/smoke-gadget-chain.test.js` |
| **Full suite command** | `node --test 'test/*.test.js'` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/smoke-gadget-chain.test.js`
- **After every plan wave:** Run `node --test 'test/*.test.js'`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 50-01-01 | 01 | 1 | POC-02 | unit | `node --test test/smoke-gadget-chain.test.js` | No W0 | pending |
| 50-01-02 | 01 | 1 | POC-02 | unit | `node --test test/smoke-gadget-chain.test.js` | No W0 | pending |
| 50-01-03 | 01 | 1 | POC-02 | unit | `node --test test/smoke-gadget-chain.test.js` | No W0 | pending |
| 50-02-01 | 02 | 2 | POC-01 | manual-only | N/A (agent template prose) | N/A | pending |
| 50-02-02 | 02 | 2 | FIX-01 | smoke | `node --test test/smoke-agent-files.test.js` | Yes (extend) | pending |
| 50-02-03 | 02 | 2 | FIX-02 | smoke | `node --test test/smoke-agent-files.test.js` | Yes (extend) | pending |
| 50-02-04 | 02 | 2 | FIX-01,FIX-02 | smoke | `node --test test/smoke-resource-config.test.js` | Yes (extend) | pending |
| 50-02-05 | 02 | 2 | FIX-03 | unit | `node --test test/smoke-session-delta.test.js` | Yes (existing) | pending |
| 50-02-06 | 02 | 2 | POC-01,POC-02,FIX-01 | integration | manual audit --poc run | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `test/smoke-gadget-chain.test.js` — detectChains + escalateSeverity (POC-02, FIX-01)
- [ ] Extend `test/smoke-resource-config.test.js` — pd-sec-fixer registration (FIX-01)
- [ ] Extend `test/smoke-agent-files.test.js` — pd-sec-fixer.md + security-fix-phase.md existence (FIX-02)

*Existing test infrastructure covers runner. Only new test file + extensions needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| POC section format in evidence | POC-01 | Scanner agent prose template | Run `pd:audit --poc` on test project, verify ## POC section with 4 fields |
| pd-sec-fixer proposal format | FIX-01 | Agent template output varies | Run full audit, verify fix phases proposal displayed |
| SEC-VERIFY re-audit scope | FIX-03 | Requires multi-phase execution | Run fix phases then SEC-VERIFY, verify only fixed files scanned |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
