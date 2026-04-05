---
phase: 28
slug: agent-infrastructure-resource-rules
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 28 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in Node.js test runner) |
| **Config file** | none — existing test infrastructure |
| **Quick run command** | `node --test test/resource-config.test.js` |
| **Full suite command** | `node --test test/*.test.js` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/resource-config.test.js`
- **After every plan wave:** Run `node --test test/*.test.js`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 28-01-01 | 01 | 1 | ORCH-01 | unit | `node --test test/resource-config.test.js` | ❌ W0 | ⬜ pending |
| 28-01-02 | 01 | 1 | ORCH-02 | unit | `node --test test/resource-config.test.js` | ❌ W0 | ⬜ pending |
| 28-01-03 | 01 | 1 | ORCH-03 | unit | `node --test test/resource-config.test.js` | ❌ W0 | ⬜ pending |
| 28-01-04 | 01 | 1 | ORCH-04 | unit | `node --test test/resource-config.test.js` | ❌ W0 | ⬜ pending |
| 28-02-01 | 02 | 1 | ORCH-01 | file | `test -f .claude/agents/pd-bug-janitor.md` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/resource-config.test.js` — unit tests cho 5 exports cua resource-config.js
- [ ] Existing test infrastructure covers all phase requirements

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Agent files load in Claude Code | ORCH-01 | Requires Claude Code runtime | Spawn pd-bug-janitor and verify model=haiku |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
