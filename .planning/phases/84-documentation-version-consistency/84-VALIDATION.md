---
phase: 84
slug: documentation-version-consistency
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 84 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — documentation-only phase |
| **Config file** | none |
| **Quick run command** | `bash -c 'test -f INTEGRATION_GUIDE.md && grep -q "version-4.0.0" README.md && echo OK'` |
| **Full suite command** | `bash -c 'test -f INTEGRATION_GUIDE.md && test -f docs/commands/audit.md && test -f docs/commands/conventions.md && test -f docs/commands/onboard.md && test -f docs/commands/status.md && grep -q "version-4.0.0" README.md && grep -q "frozen at v2.8.0" CHANGELOG.md && echo ALL OK'` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `bash -c 'test -f INTEGRATION_GUIDE.md && grep -q "version-4.0.0" README.md && echo OK'`
- **After every plan wave:** Run full suite command
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 84-01-01 | 01 | 1 | DOC-01 | shell | `grep -q "version-4.0.0" README.md && echo PASS` | ✅ | ⬜ pending |
| 84-01-02 | 01 | 1 | DOC-02 | shell | `test -f INTEGRATION_GUIDE.md && echo PASS` | ❌ W0 | ⬜ pending |
| 84-01-03 | 01 | 1 | DOC-03 | shell | `test -f docs/commands/audit.md && test -f docs/commands/conventions.md && test -f docs/commands/onboard.md && test -f docs/commands/status.md && echo PASS` | ❌ W0 | ⬜ pending |
| 84-01-04 | 01 | 1 | DOC-04 | shell | `grep -q "frozen at v2.8.0" CHANGELOG.md && echo PASS` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `INTEGRATION_GUIDE.md` — must be created (DOC-02)
- [ ] `docs/commands/audit.md` — must be created (DOC-03)
- [ ] `docs/commands/conventions.md` — must be created (DOC-03)
- [ ] `docs/commands/onboard.md` — must be created (DOC-03)
- [ ] `docs/commands/status.md` — must be created (DOC-03)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| All README.md links resolve to existing files | DOC-01 | Requires human link-checking or curl | Open README.md, follow every `[text](path)` reference and verify the file exists |
| INTEGRATION_GUIDE.md covers all 5 required topics | DOC-02 | Content quality check | Read INTEGRATION_GUIDE.md, verify sections for: fork workflow, add stacks, edit rules, anchor patterns, cross-references |
| "Supported Stacks" section lists all 6 stacks | D-04 | Content presence check | `grep -A 20 "Supported Stacks" README.md` and verify flutter, nextjs, nestjs, solidity, wordpress, general appear |
| Command docs use extended format | DOC-03 | Format quality check | Read each of audit.md, conventions.md, onboard.md, status.md — verify Purpose + Arguments + How It Works + When + Output + Examples + Next step sections |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
