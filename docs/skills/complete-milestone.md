# Skill: complete-milestone

## Purpose

Finalize current milestone, archive accumulated context, and prepare for transition to next milestone or project phase.

## When to Use

- **Milestone completion:** All phases in milestone are complete and verified
- **Release ready:** Ready to ship a version or product release
- **Cleanup:** Need to clean up `.planning/` directory
- **Transition:** Moving to new milestone and want to archive current work
- **Documentation:** Finalizing documentation before milestone closure

## Prerequisites

- [ ] All tasks in current milestone marked COMPLETED
- [ ] Verification report exists with Pass result
- [ ] No unresolved bugs or critical errors
- [ ] ROADMAP.md updated with completion status
- [ ] Optional: All tests passing

## Basic Command

```
/pd:complete-milestone
```

**Example:**
```
/pd:complete-milestone
```

**What it does:**
1. Verifies all tasks completed
2. Validates verification report exists
3. Archives phase directories (optional)
4. Updates ROADMAP.md status to Done
5. Creates milestone summary
6. Resets STATE.md for next milestone

## Common Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--archive` | Archive phase directories | `/pd:complete-milestone --archive` |
| `--skip-verify` | Skip verification checks | `/pd:complete-milestone --skip-verify` |

## See Also

- [new-milestone](new-milestone.md) — Create next milestone
- [status](status.md) — Check milestone status before completion
- [test](test.md) — Run final tests before completion
