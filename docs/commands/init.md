# Command `pd init`

## Purpose
Initialize the project management structure following the **please-done (PD)** standard. This is the first step to transform a regular code directory into a project tightly managed by AI.

## How It Works
When running `pd init`, AI (using **Haiku 4.5**) will:
1. **Analyze context:** Scan the current directory to understand the project type.
2. **Codebase Mapper (NEW):** Automatically scan the current state or propose a Blueprint (for new projects).
3. **Create `.planning/` structure:** Initialize the `codebase/` directory with STACK, ARCHITECTURE files.
4. **Initialize root documents:** PROJECT, ROADMAP, STATE.

## Input
- **User requirements:** A general description of the project or features to build.
- **Existing codebase (if any):** AI will read the file structure to adapt accordingly.

## Output
- `.planning/` directory with all necessary templates.
- `ROADMAP.md` file containing the initial roadmap.
- Project ready to run `pd plan` for the first Milestone.

## Usage Tips
- Provide requirements as detailed as possible at this step so AI creates a `ROADMAP.md` that closely matches reality.
- If you already have design files or PRD documents, tell AI to read them during `init`.

---
**Next step:** [pd plan](plan.md) or [pd new-milestone](new-milestone.md)
