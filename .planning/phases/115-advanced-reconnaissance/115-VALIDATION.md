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
| **Framework** | Jest (existing project standard) |
| **Config file** | `jest.config.js` or `package.json` jest section |
| **Quick run command** | `jest bin/lib/workflow-mapper.test.js bin/lib/taint-engine.test.js --testPathIgnorePatterns=[] -x` |
| **Full suite command** | `jest bin/lib/ --testPathIgnorePatterns=[]` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `jest bin/lib/workflow-mapper.test.js bin/lib/taint-engine.test.js --testPathIgnorePatterns=[] -x`
- **After every plan wave:** Run `jest bin/lib/ --testPathIgnorePatterns=[]`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 115-01-01 | 01 | 1 | RECON-06 | T115-01 | State machine detected from route handlers | unit | `jest workflow-mapper.test.js -t "state machine" -x` | W0 | pending |
| 115-01-02 | 01 | 1 | RECON-06 | T115-02 | Logic flaws (TOCTOU, bypass) identified | unit | `jest workflow-mapper.test.js -t "flaw detection" -x` | W0 | pending |
| 115-01-03 | 01 | 1 | RECON-06 | T115-03 | Mermaid state diagram generated | unit | `jest workflow-mapper.test.js -t "diagram" -x` | W0 | pending |
| 115-02-01 | 02 | 1 | RECON-07 | T115-04 | Inter-procedural taint tracking | unit | `jest taint-engine.test.js -t "inter-procedural" -x` | W0 | pending |
| 115-02-02 | 02 | 1 | RECON-07 | T115-05 | Sanitization edges identified | unit | `jest taint-engine.test.js -t "sanitization" -x` | W0 | pending |
| 115-02-03 | 02 | 1 | RECON-07 | T115-06 | Data flow graph with taint markers | unit | `jest taint-engine.test.js -t "data flow graph" -x` | W0 | pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `bin/lib/workflow-mapper.test.js` — stubs for RECON-06 (state machine, flaw detection, diagram)
- [ ] `bin/lib/taint-engine.test.js` — stubs for RECON-07 (taint tracking, sanitization, data flow graph)
- [ ] `bin/lib/mocks/` — mock AST fixtures for testing without real source files

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual workflow diagram readability | RECON-06 | Human judgment on diagram clarity | Render mermaid diagram, visually inspect |
| Business logic flaw severity accuracy | RECON-06 | Severity scoring requires context | Manual review of flaw classifications |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
