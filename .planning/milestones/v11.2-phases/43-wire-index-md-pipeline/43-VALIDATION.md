---
phase: 43
slug: wire-index-md-pipeline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 43 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.js |
| **Quick run command** | `npx jest --testPathPattern="smoke-(index-generator|research-store|update-research-index)" --no-coverage` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="smoke-(index-generator|research-store|update-research-index)" --no-coverage`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 43-01-01 | 01 | 1 | STORE-03 | unit | `npx jest --testPathPattern="smoke-update-research-index" --no-coverage` | ❌ W0 | ⬜ pending |
| 43-01-02 | 01 | 1 | STORE-03 | unit | `npx jest --testPathPattern="smoke-research-store" --no-coverage` | ✅ | ⬜ pending |
| 43-02-01 | 02 | 2 | GUARD-03, EXTRA-01 | integration | `npx jest --testPathPattern="smoke-(index-generator|research-store)" --no-coverage` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/smoke-update-research-index.test.js` — stubs for CLI script tests (STORE-03)

*Existing index-generator and research-store tests cover core logic.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Strategy Injection reads INDEX.md | GUARD-03 | Workflow prompt behavior | Run pd:research, verify INDEX.md created, then run write-code and check research_injection references INDEX.md |
| Fact Checker cross-validate via INDEX.md | EXTRA-01 | Agent behavior | Run pd:research on overlapping topic, verify Fact Checker output references INDEX.md entries |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
