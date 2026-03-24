---
phase: 23
slug: pdf-export
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 23 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in, Node.js 18+) |
| **Config file** | None — uses `node --test 'test/*.test.js'` |
| **Quick run command** | `node --test test/smoke-pdf-renderer.test.js` |
| **Full suite command** | `node --test 'test/*.test.js'` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/smoke-pdf-renderer.test.js`
- **After every plan wave:** Run `node --test 'test/*.test.js'`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 23-01-01 | 01 | 1 | PDF-01 | unit | `node --test test/smoke-pdf-renderer.test.js` | ❌ W0 | ⬜ pending |
| 23-01-02 | 01 | 1 | PDF-01 | unit | `node --test test/smoke-pdf-renderer.test.js` | ❌ W0 | ⬜ pending |
| 23-01-03 | 01 | 1 | PDF-01 | unit | `node --test test/smoke-pdf-renderer.test.js` | ❌ W0 | ⬜ pending |
| 23-01-04 | 01 | 1 | PDF-01 | manual-only | Manual — requires Puppeteer + internet | N/A | ⬜ pending |
| 23-02-01 | 02 | 1 | PDF-02 | unit | `node --test test/smoke-pdf-renderer.test.js` | ❌ W0 | ⬜ pending |
| 23-02-02 | 02 | 1 | PDF-02 | unit | `node --test test/smoke-pdf-renderer.test.js` | ❌ W0 | ⬜ pending |
| 23-02-03 | 02 | 1 | PDF-02 | unit | `node --test test/smoke-pdf-renderer.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/smoke-pdf-renderer.test.js` — stubs for PDF-01 (markdownToHtml, buildHtml, CSS) and PDF-02 (canUsePuppeteer, fallback)
- Existing infrastructure covers framework — node:test is built-in

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PDF generation with Puppeteer (page.pdf) | PDF-01 | Requires Puppeteer installed + internet for Mermaid CDN | 1. `npm install puppeteer` 2. Run `node bin/generate-pdf-report.js <input.md> <output.pdf>` 3. Open PDF, verify Mermaid renders as SVG, A4 format, Corporate Blue headings |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
