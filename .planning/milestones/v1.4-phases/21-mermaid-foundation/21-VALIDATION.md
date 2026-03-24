---
phase: 21
slug: mermaid-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 21 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in) |
| **Config file** | none — uses node:test directly |
| **Quick run command** | `node --test test/smoke-mermaid-validator.test.js` |
| **Full suite command** | `node --test test/smoke-*.test.js` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/smoke-mermaid-validator.test.js`
- **After every plan wave:** Run `node --test test/smoke-*.test.js`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 21-01-01 | 01 | 1 | MERM-01 | file-exists | `test -f references/mermaid-rules.md` | ❌ W0 | ⬜ pending |
| 21-02-01 | 02 | 1 | MERM-02 | unit | `node --test test/smoke-mermaid-validator.test.js` | ❌ W0 | ⬜ pending |
| 21-03-01 | 03 | 2 | REPT-01 | file-exists | `test -f templates/management-report.md` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/smoke-mermaid-validator.test.js` — stubs for MERM-02
- Existing infrastructure covers MERM-01 and REPT-01 (file existence checks)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mermaid rules completeness | MERM-01 | Content quality requires human review | Read mermaid-rules.md, verify all 7 rule categories present |
| Report template readability | REPT-01 | Layout/formatting quality is subjective | Read management-report.md, verify 7 sections with Mermaid placeholders |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
