# Command `pd what-next`

## Purpose
Help the AI Agent determine the next action based on the project's current state. This is the "compass" to prevent the Agent from getting lost among numerous tasks.

## How It Works
When running `pd what-next`, AI will:
1. **Scan `STATE.md`:** To know which Phase and Milestone it's in.
2. **Read `ROADMAP.md` and `TASKS.md`:** To find the list of uncompleted tasks.
3. **Analyze priority:** Prioritize Tasks with `PENDING` status that are not blocked by other Tasks.
4. **Recommend:** Specify exactly which Task ID to work on next.

## Why is this command important?
During development, the Agent may lose context (context drift) due to chat session changes or crashes. `pd what-next` ensures the Agent always starts right where it left off.

## Output
- Current Phase name.
- ID and name of the next Task to execute.
- Specific command guidance for the next step (usually `pd write-code`).

---
**Next step:** [pd write-code](write-code.md)
