---
phase: 24
slug: workflow-integration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 24 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test + node:assert/strict (built-in Node.js 24) |
| **Config file** | none — dung built-in test runner |
| **Quick run command** | `node --test test/smoke-report-filler.test.js` |
| **Full suite command** | `node --test 'test/*.test.js'` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/smoke-report-filler.test.js`
- **After every plan wave:** Run `node --test 'test/*.test.js'`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 24-01-01 | 01 | 1 | INTG-01 | unit | `node --test test/smoke-report-filler.test.js` | ❌ W0 | ⬜ pending |
| 24-01-02 | 01 | 1 | INTG-01 | unit | `node --test test/smoke-report-filler.test.js` | ❌ W0 | ⬜ pending |
| 24-01-03 | 01 | 1 | INTG-02 | unit | `node --test test/smoke-report-filler.test.js` | ❌ W0 | ⬜ pending |
| 24-02-01 | 02 | 2 | INTG-01 | grep | `grep "3.6" workflows/complete-milestone.md` | N/A | ⬜ pending |
| 24-02-02 | 02 | 2 | INTG-02 | grep | `grep -c "non-blocking" workflows/complete-milestone.md` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/smoke-report-filler.test.js` — stubs for INTG-01, INTG-02
- [ ] Khong can framework install — node:test da co san

*Existing infrastructure covers test framework requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PDF output quality | INTG-01 | Puppeteer optional, visual check | Chay `node bin/generate-pdf-report.js` voi filled MD, kiem tra PDF output |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
