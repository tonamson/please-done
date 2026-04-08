---
name: pd-conventions
description: "Analyze the project and create CONVENTIONS.md with project-specific coding conventions (style, naming, patterns)"
---
<codex_skill_adapter>
## How to invoke this skill
Skill name: `$pd-conventions`
When the user invokes `$pd-conventions {{args}}`, execute all instructions below.
## Tool mapping
- `AskUserQuestion` → `request_user_input`: When you need to ask the user, use request_user_input instead of AskUserQuestion
- `Task()` → `spawn_agent()`: When you need to spawn a sub-agent, use spawn_agent with fork_context
  - Wait for result: `wait(agent_ids)`
  - End agent: `close_agent()`
## Compatibility fallback
- If `request_user_input` is not available in the current mode, ask the user in plain text with a short question and wait for the user to respond
- Anywhere that says "MUST use `request_user_input`" means: prefer using it when the tool is available; otherwise fall back to plain text questions — never guess on behalf of the user
## Conventions
- `$ARGUMENTS` is equivalent to `{{GSD_ARGS}}` — user input when invoking the skill
- All config paths have been converted to `~/.codex/`
- MCP tools (`mcp__*`) work automatically via config.toml
- Read `~/.codex/.pdconfig` (cat ~/.codex/.pdconfig) → get `SKILLS_DIR`
- References to `[SKILLS_DIR]/templates/*`, `[SKILLS_DIR]/references/*` → read from the corresponding source directory
</codex_skill_adapter>
<objective>
Analyze the project, detect coding conventions, ask about user preferences, then create or update `CONVENTIONS.md`.
</objective>
<guards>
There are no strict prerequisites. This skill can be run at any time.
- [ ] The project directory contains source code -> "The directory is empty or contains no source code to analyze."
</guards>
<context>
User input: {{GSD_ARGS}}
</context>
<process>
## Step 1: Check for existing CONVENTIONS.md
`CONVENTIONS.md` at root:
- Exists → "CONVENTIONS.md already exists. (1) Supplement (keep existing) (2) Recreate"
- Does not exist → continue
## Step 2: Detect conventions from code
Grep/Read scan patterns:
| Type | Grep targets |
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
## Step 5: Create CONVENTIONS.md
```markdown
# Project Conventions
## Code Style
## Naming
## Architecture
## Do / Don't
## Build & Testing
```
Rules: ONLY write things AI cannot infer on its own. DO NOT repeat framework knowledge. Each bullet 1 line. **Under 50 lines.** Existing CONVENTIONS.md + additions → merge, remove duplicates.
## Step 6: Notification
```
╔═══════════════════════════════════════╗
║     CONVENTIONS.md created!           ║
╠═══════════════════════════════════════╣
║ File: CONVENTIONS.md ([N] lines)      ║
║ Run $pd-write-code to use conventions ║
║ Edit: directly or $pd-conventions     ║
╚═══════════════════════════════════════╝
```
</process>
<output>
**Create/Update:**
- `CONVENTIONS.md` -- project coding conventions
**Next step:** `$pd-plan` or `$pd-write-code`
**Success when:**
- `CONVENTIONS.md` includes naming conventions, coding style, and active patterns
- The user confirms the content
**Common errors:**
- The project has no source code -> it cannot be analyzed
- The user disagrees -> allow manual editing
</output>
<rules>
- All output MUST be in English
- You MUST ask the user about personal preferences before creating `CONVENTIONS.md`
- `CONVENTIONS.md` MUST reflect the current codebase reality and must not impose new conventions
- CONVENTIONS.md UNDER 50 lines — concise, only project-specific conventions
- DO NOT write tutorial/framework explanations
- DO NOT repeat `.planning/rules/` content
- MUST scan actual code before asking user
- New project with no code → ask more, detect less
- DO NOT read/display sensitive files
</rules>
<script type="error-handler">
const { createBasicErrorHandler } = require('../../../bin/lib/basic-error-handler');
// Create error handler for conventions skill
const errorHandler = createBasicErrorHandler('pd:conventions', '$CURRENT_PHASE', {
  operation: 'conventions'
});
// Export for skill executor
module.exports = { errorHandler };
</script>
