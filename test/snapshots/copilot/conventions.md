---
name: pd:conventions
description: "Analyze the project and create CLAUDE.md with project-specific coding conventions (style, naming, patterns)"
---
<objective>
Analyze the project, detect coding conventions, ask about user preferences, then create or update `CLAUDE.md`.
</objective>
<guards>
There are no strict prerequisites. This skill can be run at any time.
- [ ] The project directory contains source code -> "The directory is empty or contains no source code to analyze."
</guards>
<context>
User input: $ARGUMENTS
</context>
<process>
## Step 1: Check for existing CLAUDE.md
`CLAUDE.md` at root:
- Exists → "CLAUDE.md already exists. (1) Supplement (keep existing) (2) Recreate"
- Does not exist → continue
## Step 2: Detect conventions from code
search/read scan patterns:
| Type | search targets |
|------|-------------|
| Naming | file naming (snake/kebab/camelCase/PascalCase), function/method, variables (prefix `is*`/`has*`/`_private`) |
| Import & module | aliases (`@/`, `~/`, `#/`), relative vs absolute, barrel exports (`index.ts`) |
| Styling | `className`+Tailwind, `styled.`/`` css` ``, `.module.css`, `style={{`, `antd`/`ant-design` |
| State management | `zustand`/`create<`, `redux`/`createSlice`, `GetxController`/`.obs`, `useState`/`useReducer` |
| API | `axios`, `fetch(`, `Dio` |
| Testing | `describe(`/`it(`, `WP_UnitTestCase`, `flutter_test` |
| Error & logging | `console.log`/`Logger`/`winston`, `throw new`/`HttpException`, throw message language |
| Formatting | `.prettierrc`/`.eslintrc`/`biome.json`, `tsconfig.json` (strict, paths, target) |
## Step 3: Compile findings
List for user:
```
Detected from code:
- Naming: kebab-case files, camelCase functions
- UI: Ant Design v6 + inline styles
- State: Zustand
- ...
```
## Step 4: Ask user for additions
Ask about things NOT detectable:
1. Communication language: notes/JSDoc in Vietnamese or English?
2. Commit style: conventional? Vietnamese? Prefixes?
3. Special conventions? (MongoDB prefix, pagination format, directory structure...)
4. Common AI mistakes to remind? (creating new files instead of editing, adding unnecessary libraries...)
User can skip any question.
## Step 5: Create CLAUDE.md
```markdown
# Project Conventions
## Code Style
## Naming
## Architecture
## Do / Don't
## Build & Testing
```
Rules: ONLY write things AI cannot infer on its own. DO NOT repeat framework knowledge. Each bullet 1 line. **Under 50 lines.** Existing CLAUDE.md + additions → merge, remove duplicates.
## Step 6: Notification
```
╔══════════════════════════════════════╗
║     CLAUDE.md created!               ║
╠══════════════════════════════════════╣
║ File: CLAUDE.md ([N] lines)          ║
║ Claude Code auto-reads each session  ║
║ edit: directly or /pd:conventions    ║
╚══════════════════════════════════════╝
```
</process>
<output>
**Create/Update:**
- `CLAUDE.md` -- project coding conventions
**Next step:** `/pd:plan` or `/pd:write-code`
**Success when:**
- `CLAUDE.md` includes naming conventions, coding style, and active patterns
- The user confirms the content
**Common errors:**
- The project has no source code -> it cannot be analyzed
- The user disagrees -> allow manual editing
</output>
<rules>
- All output MUST be in English
- You MUST ask the user about personal preferences before creating `CLAUDE.md`
- `CLAUDE.md` MUST reflect the current codebase reality and must not impose new conventions
- CLAUDE.md UNDER 50 lines — concise, only project-specific conventions
- DO NOT write tutorial/framework explanations
- DO NOT repeat `.planning/rules/` content
- MUST scan actual code before asking user
- New project with no code → ask more, detect less
- DO NOT read/display sensitive files
- File compatible with Claude Code auto-load (CLAUDE.md at root)
</rules>
