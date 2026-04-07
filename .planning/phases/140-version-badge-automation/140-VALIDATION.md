---
phase: 140
slug: version-badge-automation
status: draft
nyquist_compliant: true
wave_0_complete: false
sampling_per_task_commit: true
created: 2026-04-07
---

# Phase 140 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in) |
| **Config file** | none — existing infrastructure |
| **Quick run command** | `node --test test/version-sync.test.js` |
| **Full suite command** | `node --test test/version-sync.test.js` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/version-sync.test.js`
- **After every plan wave:** Run `node --test test/version-sync.test.js`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 140-01-01 | 01 | 1 | L-01 | T-140-01 / T-140-02 | No path traversal — reads only known project files; regex patterns avoid ReDoS | unit | `node --test test/version-sync.test.js` | ❌ W0 | ⬜ pending |
| 140-01-02 | 01 | 1 | L-01 | T-140-03 / T-140-04 | Glob tool constrains file paths; .planning/ exclusion hardcoded; sync failures are non-blocking | integration | `node --test test/version-sync.test.js && grep -c "name: pd:sync-version" commands/pd/sync-version.md && grep -c "Step 8.5" workflows/complete-milestone.md` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/version-sync.test.js` — test file created in Task 1 (TDD RED phase creates it first)
- [ ] `bin/lib/version-sync.js` — library module created in Task 1 (TDD GREEN phase)

*Existing infrastructure (node:test + node:assert/strict) covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Skill file invocation reads correct files | L-01 | Requires agent runtime | Run `/pd:sync-version --check` and verify output matches expected file list |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 2s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
