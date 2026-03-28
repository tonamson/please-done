# Command `pd write-code`

## Purpose
Execute code changes (Coding) based on the Task assigned in `TASKS.md`.

## AI Process
1. **Read Task description:** Understand exactly what the Task ID requires, related files, and acceptance criteria.
2. **Scan Context:** Search existing code to understand the correct implementation approach (e.g., which library to use, naming conventions).
3. **Execute changes:**
   - **Surgical update:** Only modify the files listed in the Task.
   - **Follow rules:** Apply rules from `.planning/rules/` (NestJS, React, Flutter...).
4. **Self-check:**
   - Run linting/formatting commands (if available).
   - Ensure the code builds without errors.
5. **Update status:** Mark the Task as `COMPLETED` in `TASKS.md`.

## The "Surgical" Principle (Precise Intervention)
This command is extremely strict about not going off-scope:
- **DO NOT** refactor code outside the Task scope.
- **DO NOT** add "nice-to-have" features not in the Plan.
- Every line of code changed must work toward completing a committed "Truth".

## Output
- Code changes in the codebase.
- Task status updated in `TASKS.md`.
- Suggested next command (usually `pd what-next` or `pd test`).

---
**Next step:** [pd what-next](what-next.md) (for the next task) or [pd test](test.md) (if Milestone is complete).
