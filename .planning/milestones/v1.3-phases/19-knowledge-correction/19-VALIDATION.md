---
phase: 19
slug: knowledge-correction
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 19 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.js |
| **Quick run command** | `npx jest --testPathPattern=test/ --bail` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern=test/ --bail`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 19-01-01 | 01 | 1 | CORR-01 | manual | grep "Bước 6.5" workflows/fix-bug.md | ❌ W0 | ⬜ pending |
| 19-01-02 | 01 | 1 | CORR-02 | manual | grep "Logic Changes" templates/progress.md | ❌ W0 | ⬜ pending |
| 19-01-03 | 01 | 1 | CORR-02 | manual | grep "Logic Changes" workflows/write-code.md | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. This phase modifies markdown templates and workflows only — no new test files needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Bước 6.5 triggers on logic bug | CORR-01 | Workflow instruction, not executable code | Read fix-bug.md, verify Bước 6.5 section exists with correct flow |
| Logic Changes in progress template | CORR-02 | Template content, not executable code | Read progress.md template, verify conditional Logic Changes table |
| Logic Changes in write-code workflow | CORR-02 | Workflow instruction | Read write-code.md, verify Logic Changes instructions |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
