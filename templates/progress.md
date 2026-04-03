# PROGRESS.md Template

> `/pd:write-code` creates + updates | `/pd:write-code` reads (recovery), `/pd:what-next` reads

Recovery checkpoint when a coding session is interrupted. Stored at `.planning/milestones/[version]/phase-[phase]/PROGRESS.md`.

**Lifecycle:** Created when starting a task → updated after each file/stage → deleted after successful commit.

## Template

```markdown
# Execution Progress
> Updated: [DD_MM_YYYY HH:MM]
> Task: [N] — [Task name]
> Stage: [Started | Reading context | Writing code | Lint/Build | Creating report | Commit]
> lint_fail_count: 0
> last_lint_error: ""

## Steps
- [x] Select task
- [ ] Read context + research
- [ ] Write code
- [ ] Lint + Build
- [ ] Create report
- [ ] Commit

## Expected Files
(From TASKS.md `> Files:`)

## Files Written
(Updated after each file — determines what still needs writing if interrupted)

## Logic Changes (if any)
<!-- ONLY create when discovering business logic that needs adjustment. None → DO NOT create this section. -->
| Truth ID | Change | Reason |
|----------|--------|--------|
```

## Rules

- MUST create when starting a new task — before writing code
- MUST update after each file + after each step (`> Stage:` + `> Updated:`)
- Delete `rm -f` after successful commit
- Task 🔄 has PROGRESS.md → recover (Step 1.1 Case 1)
- Task 🔄 has NO PROGRESS.md → Step 2, create new
- No logic change → DO NOT create "Logic Changes" section (D-14)
- `lint_fail_count` tracks consecutive lint/build failures (0–3); `last_lint_error` stores the last error output. Both reset naturally when PROGRESS.md is deleted after successful commit
