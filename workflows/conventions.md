<!-- Audit 2026-03-23: Intentional -- simple conventions workflow without numbered steps (data-driven, not procedural). See Phase 14 Audit I7. -->
Analyze project, detect coding conventions from code, ask user for specific preferences, create/update CLAUDE.md.

<context>
- @references/conventions.md → commit prefixes, icons, language
</context>

<process>

## Step 1: Check for existing CLAUDE.md
`CLAUDE.md` at root:
- Exists → "CLAUDE.md already exists. (1) Supplement (keep existing) (2) Recreate"
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
║ Edit: directly or /pd:conventions    ║
╚══════════════════════════════════════╝
```

</process>

<rules>
- CLAUDE.md UNDER 50 lines — concise, only project-specific conventions
- DO NOT write tutorial/framework explanations
- DO NOT repeat `.planning/rules/` content
- MUST scan actual code before asking user
- New project with no code → ask more, detect less
- DO NOT read/display sensitive files
- File compatible with Claude Code auto-load (CLAUDE.md at root)
</rules>
