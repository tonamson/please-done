# Skill Audit Findings

**Date:** 2026-03-23
**Files scanned:** 12 skills, 13 references, 10 templates (35 files total)
**Issues found:** 9 (critical: 0, warning: 5, info: 4)

## Issues Found

### Critical

| # | File | Line | Description | Suggested Fix |
|---|------|------|-------------|---------------|
| (none) | | | | |

No critical issues found. All skill files have valid frontmatter, all execution_context references resolve to existing files, and all workflow references map correctly.

### Warning

| # | File | Line | Description | Suggested Fix |
|---|------|------|-------------|---------------|
| W1 | `templates/progress.md` | N/A | ORPHANED template -- not referenced by any skill or workflow via `@templates/progress.md`. The write-code workflow mentions PROGRESS.md concept inline but never loads this template via the standard `@templates/` loading mechanism. | Either add `@templates/progress.md` to write-code.md skill's execution_context (optional), or inline its content into the workflow since the workflow already describes the format. |
| W2 | `references/plan-checker.md` | N/A | Not referenced by any skill or workflow via `@references/plan-checker.md`. Only referenced indirectly by `workflows/plan.md` as `bin/lib/plan-checker.js` (the JS module). The reference doc serves as a spec for the JS implementation, not as a skill/workflow dependency. | Add `@references/plan-checker.md (optional)` to the `plan.md` skill's execution_context so the plan checker rules are loadable when running the plan workflow's Step 8 (plan quality check). |
| W3 | `commands/pd/new-milestone.md` | 30 | Guard condition `- [ ] WebSearch kha dung khi can nghien cuu` is missing the standard `-> "error message"` pattern used by all other guard conditions. Other guards follow `condition -> "error message"` format consistently. | Add error message: `- [ ] WebSearch kha dung khi can nghien cuu -> "WebSearch khong kha dung. Kiem tra ket noi mang."` |
| W4 | `references/context7-pipeline.md` | N/A | Referenced by 4 workflows (write-code, test, plan, fix-bug) but not listed in ANY skill's execution_context section. Skills load workflows, and workflows reference this pipeline -- but the pipeline is a lazy-loaded dependency, never explicitly declared at the skill level. | This is by design (conditional loading: only when task uses external library). However, consider adding `@references/context7-pipeline.md (optional)` to skills that list `@references/guard-context7.md` in guards (fix-bug, plan, test, write-code) for transparency. |
| W5 | `templates/verification-report.md` | N/A | Only referenced by 1 workflow (`workflows/write-code.md` line 320) and 0 skills. Low reference count compared to other templates. The complete-milestone workflow also discusses verification but doesn't reference this template. | Consider adding `@templates/verification-report.md (optional)` to the complete-milestone.md skill's execution_context, since Step 3 of that workflow performs verification. |

### Info

| # | File | Line | Description | Suggested Fix |
|---|------|------|-------------|---------------|
| I1 | `commands/pd/fetch-doc.md` | 33 | execution_context says "Khong co -- skill nay xu ly truc tiep, khong dung workflow rieng." This is consistent with the skill having its full process logic embedded in the `<process>` section (6 steps). Same pattern applies to `update.md`. Both are valid self-contained skills. | No fix needed -- document as intentional pattern for lightweight/utility skills. |
| I2 | `commands/pd/update.md` | 35 | Same as I1 -- execution_context says "Khong co -- skill nay xu ly truc tiep, khong dung workflow rieng." Process has 9 steps embedded directly. | No fix needed -- intentional pattern for utility skills. |
| I3 | `references/plan-checker.md` | 297 | Contains version string `Plan Checker Rules v1.1` and date `Updated: 23_03_2026`. This is a version-specific reference that should be updated when plan checker rules change. Not stale currently, but hardcoded version in footer is a maintenance concern. | Consider removing the version string from the footer, or ensure it is updated automatically when rules change. |
| I4 | `commands/pd/write-code.md` | 13 | Lists `Agent` tool in allowed-tools. This is the only skill that uses the Agent tool (for `--parallel` mode). Correct by design for multi-agent wave execution. | No fix needed -- intentional for parallel execution feature. |

## Files Scanned

### Skills (12/12)
- [x] complete-milestone.md -- clean. Frontmatter valid (name, description, model, allowed-tools, argument-hint). execution_context refs: 7 (all exist). Workflow ref matches `workflows/complete-milestone.md`. No stale versions. No dead branches.
- [x] conventions.md -- clean. Frontmatter valid. execution_context refs: 2 (all exist). Workflow ref matches `workflows/conventions.md`. No stale versions. No dead branches.
- [x] fetch-doc.md -- clean (see I1). Frontmatter valid. No workflow (self-contained, 6-step process). Guard refs: guard-context.md (exists). No stale versions. No dead branches.
- [x] fix-bug.md -- clean. Frontmatter valid. execution_context refs: 3 (all exist). Workflow ref matches `workflows/fix-bug.md`. Guard refs: guard-context, guard-fastcode, guard-context7 (all exist). No stale versions. No dead branches.
- [x] init.md -- clean. Frontmatter valid. execution_context refs: 1 (exists). Workflow ref matches `workflows/init.md`. Guard refs: guard-valid-path, guard-fastcode (all exist). No stale versions. No dead branches.
- [x] new-milestone.md -- W3 found. Frontmatter valid. execution_context refs: 9 (all exist). Workflow ref matches `workflows/new-milestone.md`. Guard refs: guard-context, guard-context7 (all exist). WebSearch guard missing error message (W3). No stale versions. No dead branches.
- [x] plan.md -- clean. Frontmatter valid. execution_context refs: 8 (all exist). Workflow ref matches `workflows/plan.md`. Guard refs: guard-context, guard-fastcode, guard-context7 (all exist). No stale versions. No dead branches.
- [x] scan.md -- clean. Frontmatter valid. execution_context refs: 1 (exists). Workflow ref matches `workflows/scan.md`. Guard refs: guard-context, guard-valid-path, guard-fastcode (all exist). No stale versions. No dead branches.
- [x] test.md -- clean. Frontmatter valid. execution_context refs: 2 (all exist). Workflow ref matches `workflows/test.md`. Guard refs: guard-context, guard-fastcode, guard-context7 (all exist). No stale versions. No dead branches.
- [x] update.md -- clean (see I2). Frontmatter valid. No workflow (self-contained, 9-step process). No guard refs (uses custom guards). No stale versions. No dead branches.
- [x] what-next.md -- clean. Frontmatter valid. execution_context refs: 3 (all exist). Workflow ref matches `workflows/what-next.md`. No guard refs (only checks `.planning/` exists). No stale versions. No dead branches.
- [x] write-code.md -- clean (see I4). Frontmatter valid. execution_context refs: 6 (all exist). Workflow ref matches `workflows/write-code.md`. Guard refs: guard-context, guard-fastcode, guard-context7 (all exist). Agent tool listed (intentional). No stale versions. No dead branches.

### References (13/13)
- [x] context7-pipeline.md -- referenced by 4 workflows (write-code, test, plan, fix-bug), 0 skills directly (W4)
- [x] conventions.md -- referenced by 8 skills, 8 workflows (heavily used, central reference)
- [x] guard-context.md -- referenced by 8 skills, 0 workflows (guard-only pattern, correct)
- [x] guard-context7.md -- referenced by 5 skills, 0 workflows (guard-only pattern, correct)
- [x] guard-fastcode.md -- referenced by 6 skills, 0 workflows (guard-only pattern, correct)
- [x] guard-valid-path.md -- referenced by 2 skills (init, scan), 0 workflows (guard-only pattern, correct)
- [x] plan-checker.md -- referenced by 0 skills, 1 workflow indirectly (W2). Serves as spec for bin/lib/plan-checker.js
- [x] prioritization.md -- referenced by 4 skills, 4 workflows (well-connected)
- [x] questioning.md -- referenced by 2 skills (new-milestone, plan), 2 workflows (well-connected)
- [x] security-checklist.md -- referenced by 1 skill (write-code), 2 workflows (write-code, test)
- [x] state-machine.md -- referenced by 3 skills, 3 workflows (well-connected)
- [x] ui-brand.md -- referenced by 4 skills, 4 workflows (well-connected)
- [x] verification-patterns.md -- referenced by 2 skills, 3 workflows (W5 -- low on complete-milestone side)

### Templates (10/10)
- [x] current-milestone.md -- referenced by 2 skills (new-milestone, complete-milestone), 3 workflows (well-connected)
- [x] plan.md -- referenced by 1 skill (plan), 1 workflow (plan) (correct -- single-use template)
- [x] progress.md -- referenced by 0 skills, 0 workflows (W1 -- ORPHANED via @templates/ pattern, but concept used inline in write-code workflow)
- [x] project.md -- referenced by 1 skill (new-milestone), 1 workflow (new-milestone) (correct -- single-use template)
- [x] requirements.md -- referenced by 1 skill (new-milestone), 1 workflow (new-milestone) (correct -- single-use template)
- [x] research.md -- referenced by 1 skill (plan), 1 workflow (plan) (correct -- single-use template)
- [x] roadmap.md -- referenced by 1 skill (new-milestone), 1 workflow (new-milestone) (correct -- single-use template)
- [x] state.md -- referenced by 2 skills (new-milestone, complete-milestone), 3 workflows (well-connected)
- [x] tasks.md -- referenced by 1 skill (plan), 1 workflow (plan) (correct -- single-use template)
- [x] verification-report.md -- referenced by 0 skills, 1 workflow (write-code) (W5 -- should also be in complete-milestone)

## Summary

The skill layer is in good shape overall. No critical issues -- all files exist, all frontmatter is valid, all workflow references resolve correctly, and there are no broken `@` references.

**Key findings:**
- 1 orphaned template (`templates/progress.md`) that is conceptually used but never formally loaded
- 1 weakly-connected reference (`references/plan-checker.md`) serving as an implementation spec rather than a skill dependency
- 1 inconsistent guard format in `new-milestone.md`
- 2 reference files (`context7-pipeline.md`, `verification-patterns.md`) with room for improved transparency in skill-level declaration

All 5 warnings are addressable as minor cleanup tasks in Phase 16 (Bug Fixes).
