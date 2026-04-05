---
phase: 115
slug: advanced-reconnaissance
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-05
---

# Phase 115 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `node --test test/lib/*.test.js` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/lib/*.test.js`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 115-01-01 | 01 | 1 | RECON-06 | T-115-01 / — | State machine detection identifies useState, Redux, XState patterns | unit | `node --test test/lib/business-logic-mapper.test.js` | ❌ W0 | ⬜ pending |
| 115-01-02 | 01 | 2 | RECON-06 | T-115-02 / — | Workflow extraction traces API call chains and async flows | unit | `node --test test/lib/workflow-extractor.test.js` | ❌ W0 | ⬜ pending |
| 115-02-01 | 02 | 1 | RECON-07 | T-115-03 / — | Taint engine tracks sources through 5-level depth | unit | `node --test test/lib/taint-engine.test.js` | ❌ W0 | ⬜ pending |
| 115-02-02 | 02 | 2 | RECON-07 | T-115-04 / — | DOT graph generation produces valid graphviz output | unit | `node --test test/lib/dot-generator.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/lib/business-logic-mapper.test.js` — stubs for RECON-06
- [ ] `test/lib/taint-engine.test.js` — stubs for RECON-07
- [ ] `test/fixtures/sample-state-machine.js` — test fixture for state detection
- [ ] `test/fixtures/sample-taint-flow.js` — test fixture for taint analysis

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mermaid diagram rendering | RECON-06 | Visual verification required | Open generated .md in Mermaid-supported viewer |
| DOT graph visualization | RECON-07 | Visual layout verification | Run `dot -Tpng output.dot` and review layout |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
