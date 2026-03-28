# Command `pd new-milestone`

## Purpose
Initialize a new Milestone or Phase based on `ROADMAP.md`.

## How It Works
1. **Scan ROADMAP:** Find the next unexecuted Phase (e.g., `Phase 1.2`).
2. **Update CURRENT_MILESTONE.md:** Mark the phase currently being worked on.
3. **Create directory structure:** `.planning/milestones/[version]/phase-[phase]/`.
4. **Prepare files:** Copy necessary templates (Plan, Tasks, Research) into the new directory.

## When to run this command?
- Right after `pd init` completes to start the first Phase.
- After `pd complete-milestone` to move on to the next Phase.

## Output
- New milestone directory ready to run `pd plan`.
- Status updated in `STATE.md`.

---
**Next step:** [pd plan](plan.md)
