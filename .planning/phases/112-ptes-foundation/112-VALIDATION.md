---
phase: 112
slug: ptes-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-05
---

# Phase 112 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (node:test) |
| **Config file** | `package.json` test script |
| **Quick run command** | `npm test -- --test-name-pattern="cache\|flag"` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --test-name-pattern="<relevant-pattern>"`
- **After every plan wave:** Run full test suite
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 112-01-01 | 01 | 1 | PTES-01 | T-112-01 / Architecture | Cache keys are deterministic (git commit + file list) | unit | `npm test -- bin/lib/recon-cache.test.js` | ❌ W0 | ⬜ pending |
| 112-01-02 | 01 | 1 | PTES-01 | T-112-02 / Cache | Cache auto-invalidates on file changes | unit | `npm test -- bin/lib/recon-cache.test.js` | ❌ W0 | ⬜ pending |
| 112-01-03 | 01 | 1 | PTES-02 | T-112-03 / Flags | `--recon` flag parsed correctly | unit | `npm test -- bin/lib/flag-parser.test.js` | ❌ W0 | ⬜ pending |
| 112-02-01 | 02 | 2 | PTES-03 | T-112-04 / Tier | Tiered commands map to correct token budgets | unit | `npm test -- bin/lib/tier-router.test.js` | ❌ W0 | ⬜ pending |
| 112-02-02 | 02 | 2 | PTES-04 | T-112-05 / Integration | Default `/pd:audit` behavior unchanged | integration | `npm test -- workflows/audit.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `bin/lib/recon-cache.test.js` — stubs for PTES-01, PTES-03
- [ ] `bin/lib/flag-parser.test.js` — stubs for PTES-02
- [ ] `bin/lib/tier-router.test.js` — stubs for PTES-04

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Token budget display | PTES-04 | Requires LLM API call | Run `/pd:audit --recon` and verify "[Token Budget]" appears in output |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
