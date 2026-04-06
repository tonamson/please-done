---
phase: 115
slug: advanced-reconnaissance
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-05
updated: 2026-04-06
---

# Phase 115 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (node:test) |
| **Config file** | package.json test script |
| **Quick run command** | `node --test bin/lib/workflow-mapper.test.js bin/lib/taint-engine.test.js` |
| **Full suite command** | `node --test bin/lib/` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command
- **After every plan wave:** Run full suite command
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | Status |
|---------|------|------|-------------|------------|-----------------|-----------|------------------|--------|
| 115-01-01 | 01 | 1 | RECON-06 | T115-01 | State machine detected from route handlers | unit | `node --test bin/lib/workflow-mapper.test.js -t "state machine"` | ✅ green |
| 115-01-02 | 01 | 1 | RECON-06 | T115-02 | Logic flaws (TOCTOU, bypass) identified | unit | `node --test bin/lib/workflow-mapper.test.js -t "flaw detection"` | ✅ green |
| 115-01-03 | 01 | 1 | RECON-06 | T115-03 | Mermaid state diagram generated | unit | `node --test bin/lib/workflow-mapper.test.js -t "diagram"` | ✅ green |
| 115-02-01 | 02 | 1 | RECON-07 | T115-04 | Inter-procedural taint tracking | unit | `node --test bin/lib/taint-engine.test.js -t "inter-procedural"` | ✅ green |
| 115-02-02 | 02 | 1 | RECON-07 | T115-05 | Sanitization edges identified | unit | `node --test bin/lib/taint-engine.test.js -t "sanitization"` | ✅ green |
| 115-02-03 | 02 | 1 | RECON-07 | T115-06 | Data flow graph with taint markers | unit | `node --test bin/lib/taint-engine.test.js -t "data flow graph"` | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `bin/lib/workflow-mapper.test.js` — 23 tests covering RECON-06 (state machine, flaw detection, diagram)
- [x] `bin/lib/taint-engine.test.js` — 18 tests covering RECON-07 (taint tracking, sanitization, data flow graph)
- [x] Test infrastructure uses Node.js built-in test runner (node:test)

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual workflow diagram readability | RECON-06 | Human judgment on diagram clarity | Render mermaid diagram, visually inspect |
| Business logic flaw severity accuracy | RECON-06 | Severity scoring requires context | Manual review of flaw classifications |

*These manual verifications are advisory only - automated tests verify functional correctness.*

---

## Validation Audit 2026-04-06

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
| Total tests | 41 |
| Passing tests | 41 |
| Failing tests | 0 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-06
