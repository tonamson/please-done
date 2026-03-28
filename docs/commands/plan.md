# Command `pd plan` (The Heart of PD)

## Purpose
Design the technical solution and break down work for the current Phase. This is when AI "thinks" before "doing".

## AI Process
1. **Research:** Search for existing libraries, read related code to ensure feasibility.
2. **Design (PLAN.md):** Describe the technical strategy, key changes, and the list of "Truths" (things that must be true when complete).
3. **Task Breakdown (TASKS.md):** Split the plan into small Tasks (usually 6 max) for execution.
4. **Validation (Plan-Check):** AI runs an automated quality check on the plan.

## Operating Modes
- `--auto` (default): AI decides the entire solution independently.
- `--discuss`: AI lists technical choices and asks the User for input before finalizing the plan.

## Quality Checks (Plan-Checker)
For a plan to achieve `PASS` status, it must pass these checks:
- **CHECK-01 (Requirements):** Every requirement in ROADMAP must be reflected in the Plan.
- **CHECK-02 (Completeness):** Each Task must have: Description, List of files to modify, and Acceptance Criteria.
- **CHECK-03 (Dependencies):** Ensure no circular dependencies between Tasks.
- **CHECK-04 (Truth-Task Coverage):** Every "Truth" must have at least one Task implementing it.
- **ADV-01 (Key Links):** Logical links between important files must be handled together in one Task.
- **ADV-02 (Scope Sanity):** Limit Task count (<= 6) and files per Task (<= 7) to prevent AI "overload".

## Output
- `PLAN.md` and `TASKS.md` files in the corresponding milestone directory.
- Plan-check results report.

## Usage Tips
- If the plan gets `BLOCK`, read the `fixHint` in the report carefully to see what AI needs to fix (usually splitting tasks or adding files).
- Always prefer `--discuss` if you want tight control over system architecture.

---
**Next step:** [pd what-next](what-next.md)
