# Command `pd scan`

## Purpose
Check the overall health of the project and the synchronization (Sync) between actual Code and Design documents.

## How It Works
1. **Scan Codebase:** AI reviews recently changed files.
2. **Compare with `PLAN.md`:** Check whether changes align with the original plan.
3. **Detect "Drift" (Desync):**
   - If you manually edited code without informing AI via the Plan.
   - If AI implemented something differently from the plan.
4. **Report:** List desync points and suggest fixes (usually run `pd fix-bug` or update the Plan).

## When to run this command?
- When you've just made a major manual code change.
- When the Agent seems to be going in the wrong direction.
- Before starting a new Milestone to ensure the "foundation" is clean.

## Output
- List of desynced files.
- Recommended actions to re-synchronize the project.

---
**Next step:** [pd fix-bug](fix-bug.md) or [pd what-next](what-next.md).
