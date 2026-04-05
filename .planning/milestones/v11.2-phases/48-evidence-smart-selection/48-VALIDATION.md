---
phase: 48
slug: evidence-smart-selection
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 48 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in) |
| **Config file** | Không có — node:test không cần config |
| **Quick run command** | `node --test test/smoke-smart-selection.test.js` |
| **Full suite command** | `node --test test/*.test.js` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/smoke-smart-selection.test.js`
- **After every plan wave:** Run `node --test test/*.test.js`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 48-01-01 | 01 | 1 | SMART-01, SMART-02, SMART-03 | unit | `node --test test/smoke-smart-selection.test.js` | ❌ W0 | ⬜ pending |
| 48-02-01 | 02 | 2 | EVID-01 | manual-only | `grep -c "Function Checklist" commands/pd/agents/pd-sec-scanner.md` | N/A | ⬜ pending |
| 48-02-02 | 02 | 2 | EVID-02 | manual-only | `grep -c "Master Table" commands/pd/agents/pd-sec-reporter.md` | N/A | ⬜ pending |
| 48-02-03 | 02 | 2 | AGENT-03 | manual-only | `grep -c "selectScanners" commands/pd/workflows/audit.md` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/smoke-smart-selection.test.js` — TDD tests for SMART-01, SMART-02, SMART-03 (created by Plan 48-01 Task 1)

*EVID-01, EVID-02, AGENT-03 are template modifications — verified by grep, not unit tests.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| User confirm prompt khi < 2 match | SMART-03 | Interactive TUI prompt | Run `pd:audit` trên project nhỏ, verify prompt xuất hiện |
| Function Checklist format trong scanner output | EVID-01 | Template file, không phải code | Grep `## Function Checklist` + 4 verdicts trong pd-sec-scanner.md |
| Master table + hot spots trong reporter | EVID-02 | Template file, không phải code | Grep `Master Table`, `Hot Spots`, `Glob` trong pd-sec-reporter.md |
| Reporter merge function outcomes | AGENT-03 | Template logic, không phải code | Verify merge key `file_path::function_name` trong pd-sec-reporter.md |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
