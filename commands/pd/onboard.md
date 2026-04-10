---
name: pd:onboard
description: Orient AI to an unfamiliar codebase — initialize, scan, and create a ready-to-use .planning/ directory
argument-hint: "[project path, defaults to current directory]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

<objective>
Single command to orient AI to an unfamiliar codebase. Calls pd:init and pd:scan internally, analyzes git history, creates PROJECT.md baseline, and leaves .planning/ ready for pd:plan. Fully automated — no user prompts.
</objective>

<guards>
Stop and instruct the user if any of the following conditions fail:

@references/guard-valid-path.md
@references/guard-fastcode.md
</guards>

<context>
User input: $ARGUMENTS (project path, defaults to the current directory)

Templates (for creating planning files):
- @templates/project.md → PROJECT.md format
- @templates/roadmap.md → ROADMAP.md format
- @templates/current-milestone.md → CURRENT_MILESTONE.md format
- @templates/state.md → STATE.md format
- @templates/requirements.md → REQUIREMENTS.md format
- @templates/context-template.md → CONTEXT.md format
</context>

<execution_context>
@workflows/onboard.md (required)
@references/conventions.md (required)
</execution_context>

<process>
Execute @workflows/onboard.md from start to finish.

### Step 1: Initialize Planning Directory
Run `pd:init` to create `.planning/` structure and framework rules.

### Step 2: Validate Project Path
Ensure the target path exists and contains a valid project.

### Step 3: Analyze Git History
Extract project vision, tech stack, and language policy from git commits.

### Step 4: Create PROJECT.md
Generate project overview with vision derived from git analysis.

### Step 5: Scan Codebase
Run `pd:scan` to analyze code structure and create SCAN_REPORT.md.

### Step 6: Generate CONTEXT.md

Generate `.planning/CONTEXT.md` using:
1. Tech stack from scan results
2. Key files (select top 10-15 using `lib/key-file-selector.js`)
3. Framework patterns detected
4. Documentation links mapped from stack using `lib/doc-link-mapper.js`

Use template: `templates/context-template.md`

**Error handling:**
- If generation fails, log error but continue
- Missing data should not block completion
- Gracefully handle missing template

### Step 7: Create Supporting Files
Generate ROADMAP.md, CURRENT_MILESTONE.md, STATE.md, and REQUIREMENTS.md.

### Step 8: Display Summary
Output onboarding summary with tech stack, key files, and next steps.
</process>

<output>
**Create/Update:**
- `.planning/CONTEXT.md` — project context (via init)
- `.planning/rules/*.md` — framework-specific rules (via init)
- `.planning/scan/SCAN_REPORT.md` — code analysis report (via scan)
- `.planning/PROJECT.md` — vision, tech stack, language policy from git history
- `.planning/ROADMAP.md` — initial roadmap with v1.0 milestone placeholder
- `.planning/CURRENT_MILESTONE.md` — pointer to v1.0, status: Not started
- `.planning/STATE.md` — initial working state
- `.planning/REQUIREMENTS.md` — placeholder for user to fill in

**Next step:** `/pd:new-milestone` to define v1.0 requirements, or `/pd:plan` if requirements are known

**Success when:**
- `.planning/CONTEXT.md` exists with tech stack
- `.planning/PROJECT.md` exists with vision derived from git history
- `.planning/ROADMAP.md` exists with v1.0 milestone placeholder
- `.planning/CURRENT_MILESTONE.md` exists pointing to v1.0
- Running `/pd:plan` does not fail on missing prerequisites

**Common errors:**
- No `.planning/` directory → onboard creates it via init
- No git history → PROJECT.md vision derived from CONTEXT.md only
- FastCode MCP not available → continues with Grep/Read fallback (warning shown)
</output>

<rules>
- All output MUST be in English
- DO NOT change files outside `.planning/`
- DO NOT ask the user questions — onboard is fully automated
- Default language policy: all English (UI, Logs, Exceptions) unless codebase indicates otherwise
- If git is unavailable, skip git history analysis and derive PROJECT.md from CONTEXT.md alone
</rules>

