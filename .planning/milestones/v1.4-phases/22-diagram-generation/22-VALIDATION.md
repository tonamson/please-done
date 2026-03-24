---
phase: 22
slug: diagram-generation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 22 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in, Node.js 24.13.0) |
| **Config file** | none — uses npm script |
| **Quick run command** | `node --test test/smoke-generate-diagrams.test.js` |
| **Full suite command** | `node --test 'test/*.test.js'` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/smoke-generate-diagrams.test.js`
- **After every plan wave:** Run `node --test 'test/*.test.js'`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 22-01-01 | 01 | 1 | DIAG-01 | unit | `node --test test/smoke-generate-diagrams.test.js` | ❌ W0 | ⬜ pending |
| 22-01-02 | 01 | 1 | DIAG-01 | unit | `node --test test/smoke-generate-diagrams.test.js` | ❌ W0 | ⬜ pending |
| 22-01-03 | 01 | 1 | DIAG-02 | unit | `node --test test/smoke-generate-diagrams.test.js` | ❌ W0 | ⬜ pending |
| 22-01-04 | 01 | 1 | DIAG-02 | unit | `node --test test/smoke-generate-diagrams.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/smoke-generate-diagrams.test.js` — stubs for DIAG-01, DIAG-02
- Existing infrastructure covers framework needs (node:test built-in)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mermaid renders visually correct in viewer | DIAG-01, DIAG-02 | Rendering requires browser/Mermaid CLI | Paste output into mermaid.live and verify layout |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
