---
phase: 101-doc-02
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - docs/cheatsheet.md
autonomous: true
requirements:
  - DOC-02
must_haves:
  truths:
    - "File docs/cheatsheet.md exists with markdown tables"
    - "16 commands documented across 5 categories"
    - "Format command | usage | example for each command"
    - "Popular flags included in usage column"
    - "Printable clean markdown tables"
  artifacts:
    - path: "docs/cheatsheet.md"
      provides: "Command cheat sheet with all 16 commands"
      min_lines: 100
      contains:
        - "| Command | Usage | Example |"
        - "## Project"
        - "## Planning"
        - "## Execution"
        - "## Debug"
        - "## Utility"
  key_links:
    - from: "cheatsheet.md sections"
      to: "16 skill commands"
      via: "category grouping"
      pattern: "## Category header with table"
---

<objective>
Create a comprehensive command cheat sheet for all 16 Please Done skills, organized by category with command | usage | example format.

Purpose: Provide developers with a quick reference guide for all available commands, their syntax, common flags, and practical examples.
Output: `docs/cheatsheet.md` — a printable markdown file with organized command tables.
</objective>

<execution_context>
@.planning/phases/101/101-CONTEXT.md
@commands/pd/*.md
</execution_context>

<context>
@.planning/ROADMAP.md
@docs/COMMAND_REFERENCE.md

## Commands to Document (16 total)

### Project Category (5 commands)
- **onboard** — Orient AI to unfamiliar codebase, creates .planning/
- **init** — Initialize planning directory structure
- **scan** — Analyze codebase and create SCAN_REPORT.md
- **new-milestone** — Define requirements and create milestone roadmap
- **complete-milestone** — Finalize milestone and tag release

### Planning Category (1 command)
- **plan** — Technical planning + task breakdown

### Execution Category (2 commands)
- **write-code** — Execute tasks from TASKS.md
- **test** — Run test suite with coverage

### Debug Category (3 commands)
- **fix-bug** — Scientific bug investigation and fixing
- **audit** — Code quality and security audit
- **research** — Deep research on libraries/patterns

### Utility Category (5 commands)
- **status** — Display project status dashboard
- **conventions** — Show coding conventions
- **fetch-doc** — Fetch documentation for libraries
- **update** — Update Please Done tooling
- **what-next** — Suggest next actions

## Popular Flags (to include in usage column)
- `--auto` — Auto-execute without prompts
- `--wave N` — Execute specific wave
- `--skip-research` — Skip research phase
- `--skip-verify` — Skip verification
- `--discuss` — Interactive mode (plan)
- `--auto-refresh` — Auto-refresh (status)

## Table Format
| Command | Usage | Example |
|---------|-------|---------|
| `/pd:command` | `/pd:command [--flag] [args]` | `/pd:command --auto` |
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create docs directory structure</name>
  <files>docs/cheatsheet.md</files>
  <action>
    Verify docs/ directory exists (it does). Create the cheatsheet.md file with:
    - Header section with title "Please Done Command Cheat Sheet"
    - Description of how to read the cheat sheet
    - Legend for flags notation: [--optional], --required value
    - Table of contents linking to each category section
    - Placeholder markers for the 5 category sections

    Format conventions:
    - Use `code` formatting for commands and code
    - Bold for category headers
    - Clear markdown table syntax
  </action>
  <verify>
    <automated>test -f docs/cheatsheet.md && grep -q "Please Done Command Cheat Sheet" docs/cheatsheet.md && echo "Header OK"</automated>
  </verify>
  <done>File docs/cheatsheet.md created with header, TOC, and section placeholders</done>
</task>

<task type="auto">
  <name>Task 2: Document Project commands section</name>
  <files>docs/cheatsheet.md</files>
  <action>
    Add the Project category section with table for 5 commands:

    ## Project Commands

    | Command | Usage | Example |
    |---------|-------|---------|
    | `/pd:onboard` | `/pd:onboard [path]` | `/pd:onboard ./my-project` |
    | `/pd:init` | `/pd:init [--force]` | `/pd:init` |
    | `/pd:scan` | `/pd:scan [--deep]` | `/pd:scan` |
    | `/pd:new-milestone` | `/pd:new-milestone [version]` | `/pd:new-milestone v2.0` |
    | `/pd:complete-milestone` | `/pd:complete-milestone` | `/pd:complete-milestone` |

    Notes:
    - onboard: Orient AI to unfamiliar codebase, creates .planning/
    - init: Initialize planning directory structure
    - scan: Analyze codebase structure
    - new-milestone: Define requirements, create ROADMAP.md
    - complete-milestone: Finalize milestone, create summary
  </action>
  <verify>
    <automated>grep -A 8 "## Project" docs/cheatsheet.md | grep -c "| /pd:" | grep -q "5" && echo "5 Project commands documented"</automated>
  </verify>
  <done>Project section complete with onboard, init, scan, new-milestone, complete-milestone</done>
</task>

<task type="auto">
  <name>Task 3: Document Planning and Execution commands</name>
  <files>docs/cheatsheet.md</files>
  <action>
    Add Planning and Execution category sections:

    ## Planning Commands

    | Command | Usage | Example |
    |---------|-------|---------|
    | `/pd:plan` | `/pd:plan [--auto \| --discuss] [phase]` | `/pd:plan --auto 1.2` |

    Notes:
    - --auto: AI decides approach automatically
    - --discuss: Interactive discussion mode
    - phase: e.g., "1.2" for milestone 1 phase 2

    ## Execution Commands

    | Command | Usage | Example |
    |---------|-------|---------|
    | `/pd:write-code` | `/pd:write-code [--wave N] [--skip-verify]` | `/pd:write-code --wave 2` |
    | `/pd:test` | `/pd:test [--coverage] [--watch]` | `/pd:test --coverage` |

    Notes:
    - write-code: Execute tasks from TASKS.md
    - --wave: Execute specific wave only
    - test: Run test suite
    - --coverage: Generate coverage report
  </action>
  <verify>
    <automated>grep -c "| /pd:plan" docs/cheatsheet.md | grep -q "1" && grep -c "| /pd:write-code" docs/cheatsheet.md | grep -q "1" && grep -c "| /pd:test" docs/cheatsheet.md | grep -q "1" && echo "Planning and Execution OK"</automated>
  </verify>
  <done>Planning section (plan) and Execution section (write-code, test) complete</done>
</task>

<task type="auto">
  <name>Task 4: Document Debug commands section</name>
  <files>docs/cheatsheet.md</files>
  <action>
    Add the Debug category section with table for 3 commands:

    ## Debug Commands

    | Command | Usage | Example |
    |---------|-------|---------|
    | `/pd:fix-bug` | `/pd:fix-bug [description]` | `/pd:fix-bug "login fails"` |
    | `/pd:audit` | `/pd:audit [--security] [--performance]` | `/pd:audit --security` |
    | `/pd:research` | `/pd:research [topic]` | `/pd:research "React hooks"` |

    Notes:
    - fix-bug: Scientific bug investigation with hypothesis verification
    - audit: Code quality and security analysis
    - research: Deep research on libraries, patterns, or technologies
  </action>
  <verify>
    <automated>grep -A 6 "## Debug" docs/cheatsheet.md | grep -c "| /pd:" | grep -q "3" && echo "3 Debug commands documented"</automated>
  </verify>
  <done>Debug section complete with fix-bug, audit, research</done>
</task>

<task type="auto">
  <name>Task 5: Document Utility commands section</name>
  <files>docs/cheatsheet.md</files>
  <action>
    Add the Utility category section with table for 5 commands:

    ## Utility Commands

    | Command | Usage | Example |
    |---------|-------|---------|
    | `/pd:status` | `/pd:status [--auto-refresh]` | `/pd:status --auto-refresh` |
    | `/pd:conventions` | `/pd:conventions [language]` | `/pd:conventions typescript` |
    | `/pd:fetch-doc` | `/pd:fetch-doc [library]` | `/pd:fetch-doc react` |
    | `/pd:update` | `/pd:update [--check]` | `/pd:update` |
    | `/pd:what-next` | `/pd:what-next` | `/pd:what-next` |

    Notes:
    - status: Display project dashboard (milestone, phase, tasks, bugs)
    - conventions: Show coding conventions for language/framework
    - fetch-doc: Fetch current documentation for libraries
    - update: Update Please Done tooling
    - what-next: Suggest next actions based on project state
  </action>
  <verify>
    <automated>grep -A 8 "## Utility" docs/cheatsheet.md | grep -c "| /pd:" | grep -q "5" && echo "5 Utility commands documented"</automated>
  </verify>
  <done>Utility section complete with status, conventions, fetch-doc, update, what-next</done>
</task>

<task type="auto">
  <name>Task 6: Add popular flags reference and verify formatting</name>
  <files>docs/cheatsheet.md</files>
  <action>
    Add a Popular Flags section at the end of the file and verify overall formatting:

    ## Popular Flags Reference

    | Flag | Description | Commands |
    |------|-------------|----------|
    | `--auto` | Auto-execute without prompts | plan |
    | `--discuss` | Interactive mode with user decisions | plan |
    | `--wave N` | Execute specific wave only | write-code |
    | `--skip-research` | Skip research phase | plan, write-code |
    | `--skip-verify` | Skip verification steps | write-code |
    | `--auto-refresh` | Enable auto-refresh detection | status |
    | `--coverage` | Generate coverage report | test |
    | `--security` | Security-focused audit | audit |
    | `--force` | Force operation without prompts | init |

    ## Legend

    - `[--flag]` — Optional flag (brackets indicate optional)
    - `--flag value` — Required value after flag
    - `[phase]` — Optional phase identifier (e.g., 1.2)
    - `[path]` — Optional path (defaults to current directory)

    Also add a footer with last updated date.
  </action>
  <verify>
    <automated>grep -q "## Popular Flags Reference" docs/cheatsheet.md && grep -q "## Legend" docs/cheatsheet.md && wc -l docs/cheatsheet.md | awk '{print $1}' | xargs -I {} test {} -ge 80 && echo "Flags reference and legend added, file size OK"</automated>
  </verify>
  <done>Popular flags reference and legend added, file is complete and printable</done>
</task>

<task type="auto">
  <name>Task 7: Final verification and link validation</name>
  <files>docs/cheatsheet.md</files>
  <action>
    Perform final verification of the complete cheatsheet:

    1. Count total commands documented:
       - Project: 5 (onboard, init, scan, new-milestone, complete-milestone)
       - Planning: 1 (plan)
       - Execution: 2 (write-code, test)
       - Debug: 3 (fix-bug, audit, research)
       - Utility: 5 (status, conventions, fetch-doc, update, what-next)
       Total: 16 commands

    2. Verify markdown table formatting:
       - All tables have proper | delimiters
       - Header rows have |---|---| separators
       - No broken table lines

    3. Verify printable format:
       - No external image dependencies
       - Clean markdown tables
       - No color codes or ANSI escapes

    4. Add link from README if not already present (optional enhancement note)

    Output summary of verification results.
  </action>
  <verify>
    <automated>grep -c "| /pd:" docs/cheatsheet.md | grep -q "16" && grep -c "^|" docs/cheatsheet.md | awk '{print $1}' | xargs -I {} test {} -ge 50 && echo "All 16 commands verified in tables"</automated>
  </verify>
  <done>All 16 commands documented, tables properly formatted, file ready for use</done>
</task>

</tasks>

<verification>
Final checklist for cheatsheet completion:

1. **File exists**: `docs/cheatsheet.md` is present
2. **All commands**: 16 commands across 5 categories
3. **Format**: Each command has command | usage | example
4. **Categories**: Project, Planning, Execution, Debug, Utility
5. **Flags**: Popular flags included in usage column
6. **Printable**: Clean markdown tables, no external dependencies
7. **Legend**: Flag notation explained
8. **Reference**: Popular flags quick reference table
</verification>

<success_criteria>
The phase is complete when:

1. File `docs/cheatsheet.md` exists with markdown tables
2. All 16 commands documented:
   - Project: onboard, init, scan, new-milestone, complete-milestone
   - Planning: plan
   - Execution: write-code, test
   - Debug: fix-bug, audit, research
   - Utility: status, conventions, fetch-doc, update, what-next
3. Format follows: command | usage | example for each row
4. Popular flags (--auto, --wave, --skip-research, etc.) included in usage
5. Printable format: clean markdown tables, no colors, works in PDF
6. Legend section explains flag notation
7. File passes markdown linting (tables are valid)
</success_criteria>

<output>
After completion, create `.planning/phases/101/101-doc-02-SUMMARY.md` with:
- Summary of commands documented
- Category breakdown
- File location: docs/cheatsheet.md
- Line count and structure notes
- Link to DOC-02 requirement
</output>
