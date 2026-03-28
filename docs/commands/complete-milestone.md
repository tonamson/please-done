# Command `pd complete-milestone`

## Purpose
Close a project Phase/Milestone. This is the cleanup and packaging step for achievements.

## AI Process
1. **Check status:** Ensure 100% of Tasks in `TASKS.md` are `COMPLETED`.
2. **Confirm reports:** Verify that `verification-report.md` has a Pass result.
3. **Update documentation:**
   - Mark status as `Done` in `ROADMAP.md`.
   - Summarize what was accomplished in `CHANGELOG.md`.
4. **Clean up:** Remove unnecessary junk files or temporary notes.
5. **Suggest next Phase:** Based on `ROADMAP.md` to recommend the next step.

## Why is this command important?
It keeps the project organized. Each completed Milestone is a solid "checkpoint" to move forward to the next phase.

## Output
- Updated `ROADMAP.md` and `CHANGELOG.md`.
- `STATE.md` is reset to prepare for a new Milestone.
- A brief summary for the User about what was achieved.

---
**Next step:** [pd new-milestone](new-milestone.md)
