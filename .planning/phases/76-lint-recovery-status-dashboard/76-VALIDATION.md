---
phase: 76
slug: lint-recovery-status-dashboard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 76 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (node:test) |
| **Config file** | `package.json` → `"test": "node --test test/**/*.test.js"` |
| **Quick run command** | `npm test -- --grep "smoke-integrity"` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --grep "smoke-integrity"`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 76-01-01a | 01 | 1 | LINT-01 | grep | `grep -n "lint_fail_count" templates/progress.md` | ✅ | ⬜ pending |
| 76-01-01b | 01 | 1 | LINT-01 | grep | `grep -n "lint_fail_count" workflows/write-code.md` | ✅ | ⬜ pending |
| 76-01-01c | 01 | 1 | LINT-01 | grep | `grep -n "lint-only" workflows/write-code.md` | ✅ | ⬜ pending |
| 76-02-01 | 02 | 1 | STATUS-01 | file+grep | `test -f commands/pd/status.md && grep -n "model: haiku" commands/pd/status.md` | ❌ new | ⬜ pending |
| 76-02-02 | 02 | 1 | STATUS-01 | file+test | `test -f workflows/status.md && npm test` | ❌ new | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

- `test/smoke-integrity.test.js` already validates `commands/pd/*.md` schema (frontmatter, XML sections, `@workflows/*.md` refs)
- No new test files needed — Plan 02 satisfies existing assertions once files are created
- No new npm deps required

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| LLM agent increments `lint_fail_count` correctly on consecutive failures | LINT-01 | Requires live LLM execution + lint-failing code | Read Step 5 logic in write-code.md and trace path manually |
| `pd:status` dashboard output is well-formatted (8–12 lines) | STATUS-01 | Requires live LLM run to produce output | Invoke with no PROGRESS.md → verify Lint field shows "✓ no active task" |
| lint-only resume skips code regeneration | LINT-01 | Requires write-code.md session in lint-fail state | Check Step 1.1 routing: choice A should skip Steps 2-4 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
