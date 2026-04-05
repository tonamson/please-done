---
phase: 25
slug: dieu-tra-tai-hien-loi
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 25 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (Node.js built-in, v24.13.0) |
| **Config file** | none — chay truc tiep qua `npm test` |
| **Quick run command** | `node --test test/smoke-truths-parser.test.js test/smoke-repro-test-generator.test.js test/smoke-regression-analyzer.test.js` |
| **Full suite command** | `npm test` (526+ tests, ~600ms) |
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/smoke-truths-parser.test.js test/smoke-repro-test-generator.test.js test/smoke-regression-analyzer.test.js`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 25-01-01 | 01 | 1 | N/A | unit | `node --test test/smoke-truths-parser.test.js` | ❌ W0 | ⬜ pending |
| 25-01-02 | 01 | 1 | N/A | regression | `node --test test/smoke-generate-diagrams.test.js` | ✅ | ⬜ pending |
| 25-02-01 | 02 | 1 | REPRO-01 | unit | `node --test test/smoke-repro-test-generator.test.js` | ❌ W0 | ⬜ pending |
| 25-03-01 | 03 | 1 | REGR-01 | unit | `node --test test/smoke-regression-analyzer.test.js` | ❌ W0 | ⬜ pending |
| 25-04-01 | 04 | 2 | N/A | regression | `npm test` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/smoke-truths-parser.test.js` — test cho shared helper parseTruthsFromContent
- [ ] `test/smoke-repro-test-generator.test.js` — test cho generateReproTest()
- [ ] `test/smoke-regression-analyzer.test.js` — test cho analyzeFromCallChain() + analyzeFromSourceFiles()
- [ ] Framework install: khong can — da co node:test built-in

*Existing infrastructure covers framework requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Workflow sub-steps 5b.1 va 8a dung voi tri | REPRO-01, REGR-01 | Markdown workflow khong co automated test | Grep `5b.1` va `8a` trong fix-bug.md, verify nam trong Buoc 5 va Buoc 8 |
| fix-bug.md duoi 420 dong | D-12 | Line count check | `wc -l workflows/fix-bug.md` — ket qua phai < 420 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 2s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
