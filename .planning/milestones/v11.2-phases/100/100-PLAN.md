---
phase: 100
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - /Volumes/Code/Nodejs/please-done/README.md
autonomous: true
requirements:
  - DOC-01
must_haves:
  truths:
    - "README has Quick Start section at the top (after header)"
    - "Quick Start contains exactly 5 commands with one-liner descriptions"
    - "All 16 skills are documented with categories and one-liners"
    - "Workflow diagram is text-based and shows the main flow"
    - "Prerequisites checklist is clear and scannable"
    - "No breaking changes to existing README sections"
  artifacts:
    - path: "/Volumes/Code/Nodejs/please-done/README.md"
      provides: "Updated README with new Quick Start, Skills, Diagram, and Prerequisites sections"
      min_lines: 700
      sections_added:
        - "Quick Start"
        - "Skills Reference"
        - "Workflow Diagram"
        - "Prerequisites Checklist"
  key_links:
    - from: "Quick Start section"
      to: "Skills Reference section"
      via: "internal anchor links"
    - from: "Skills Reference"
      to: "commands/pd/*.md"
      via: "file paths in descriptions"
---

<objective>
Update README.md with a comprehensive Quick Start Guide that helps new developers understand and use Please Done skills within 60 seconds.

Purpose: Lower the barrier to entry for new users by providing clear, actionable guidance at the top of the README.
Output: Updated README.md with Quick Start section, categorized skills list, ASCII workflow diagram, and prerequisites checklist.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/100/100-CONTEXT.md
@/Volumes/Code/Nodejs/please-done/README.md
@/Volumes/Code/Nodejs/please-done/commands/pd/

## Current README Structure
The README currently has:
- Header with badges
- Table of Contents
- Supported Platforms
- Requirements
- Installation
- After Installation
- Skills List (in 2 tables: Main Workflow + Utilities)
- Convention System
- .planning/ Structure
- Cross-Platform Architecture
- MCP Servers
- Security
- Commit Conventions
- Status Icons
- Supported Tech Stacks
- Evaluation Suite
- Additional Documentation
- License

## 16 Skills to Document

### Core (4 skills)
- `onboard` — Orient AI to an unfamiliar codebase in one command
- `init` — Initialize project: check MCP, detect stack, create CONTEXT.md
- `scan` — Scan code structure, dependencies, security checks
- `plan` — Research and create technical design for a phase

### Project (5 skills)
- `write-code` — Execute tasks from TASKS.md, lint check, build, commit
- `test` — Write and run tests (Jest, PHPUnit, Hardhat, flutter_test)
- `fix-bug` — Research bug, analyze, fix, commit, loop until confirmed
- `new-milestone` — Plan milestones + phases + dependencies
- `complete-milestone` — Check errors, summarize, commit, create git tag

### Debug (2 skills)
- `audit` — Comprehensive code audits (security, performance, dependency)
- `research` — Research a technical topic with structured output

### Utility (5 skills)
- `status` — Display project status dashboard (milestone, phase, tasks)
- `conventions` — Analyze code patterns, create project-specific CLAUDE.md
- `fetch-doc` — Download documentation from URL, save as markdown
- `update` — Check and update skills from GitHub
- `what-next` — Scan status, show progress, suggest next command

## User Decisions (Locked)
- Quick Start: Exactly 5 commands (per D-01)
- Commands order: onboard → init → plan → write-code → status
- Skills grouping: 4 categories (Core, Project, Debug, Utility)
- Diagram type: Text-based ASCII (not Mermaid - no external rendering dependency)
- Prerequisites: Checklist format (easy to scan)
- Insert Quick Start after header, before Table of Contents
</context>

<tasks>

<task type="auto">
  <name>Task 1: Analyze current README structure</name>
  <files>/Volumes/Code/Nodejs/please-done/README.md</files>
  <action>
Read the current README.md and identify:
1. Exact line numbers where Quick Start should be inserted (after header, before Table of Contents)
2. Existing content that should be preserved or moved
3. Current Skills List section that will be replaced by new Skills Reference
4. Any existing prerequisites that can be consolidated

Document the structure in comments before making changes.
</action>
  <verify>
    <automated>grep -n "Table of Contents" /Volumes/Code/Nodejs/please-done/README.md | head -1</automated>
  </verify>
  <done>
Know the exact insertion point for Quick Start section (line number identified)
</done>
</task>

<task type="auto">
  <name>Task 2: Design Quick Start section content</name>
  <files>/Volumes/Code/Nodejs/please-done/README.md</files>
  <action>
Create the Quick Start section content per D-01 (5 commands exactly):

```markdown
## Quick Start

Get started with Please Done in 5 commands:

| Step | Command | What it does |
|------|---------|--------------|
| 1 | `/pd:onboard` | Orient AI to your codebase, analyze git history |
| 2 | `/pd:init` | Check MCP, detect tech stack, create CONTEXT.md |
| 3 | `/pd:plan` | Research and create technical design for a phase |
| 4 | `/pd:write-code` | Execute tasks, lint check, build, auto-commit |
| 5 | `/pd:status` | Check project progress and next steps |

See [Skills Reference](#skills-reference) for all 16 commands.
```

This follows the locked decision: exactly 5 commands showing the main workflow flow.
</action>
  <verify>
    <automated>echo "Quick Start content designed with 5 commands"</automated>
  </verify>
  <done>
Quick Start section content ready with 5 commands and one-liner descriptions
</done>
</task>

<task type="auto">
  <name>Task 3: Design categorized skills list</name>
  <files>/Volumes/Code/Nodejs/please-done/README.md</files>
  <action>
Create the Skills Reference section with all 16 skills grouped by 4 categories per D-02:

```markdown
## Skills Reference

### Core — Project Foundation
| Skill | Command | Description |
|-------|---------|-------------|
| onboard | `/pd:onboard` | Orient AI to an unfamiliar codebase in one command |
| init | `/pd:init` | Initialize project: check MCP, detect stack, create CONTEXT.md |
| scan | `/pd:scan` | Scan code structure, dependencies, security checks |
| plan | `/pd:plan` | Research and create technical design for a phase |

### Project — Development Workflow
| Skill | Command | Description |
|-------|---------|-------------|
| new-milestone | `/pd:new-milestone` | Plan milestones + phases + dependencies |
| write-code | `/pd:write-code` | Execute tasks from TASKS.md, lint check, build, commit |
| test | `/pd:test` | Write and run tests (Jest, PHPUnit, Hardhat, flutter_test) |
| fix-bug | `/pd:fix-bug` | Research bug, analyze, fix, commit, loop until confirmed |
| complete-milestone | `/pd:complete-milestone` | Check errors, summarize, commit, create git tag |

### Debug — Analysis & Research
| Skill | Command | Description |
|-------|---------|-------------|
| audit | `/pd:audit` | Comprehensive code audits (security, performance, dependency) |
| research | `/pd:research` | Research a technical topic with structured output |

### Utility — Helper Commands
| Skill | Command | Description |
|-------|---------|-------------|
| status | `/pd:status` | Display project status dashboard (milestone, phase, tasks) |
| conventions | `/pd:conventions` | Analyze code patterns, create project-specific CLAUDE.md |
| fetch-doc | `/pd:fetch-doc` | Download documentation from URL, save as markdown |
| update | `/pd:update` | Check and update skills from GitHub |
| what-next | `/pd:what-next` | Scan status, show progress, suggest next command |
```

Per D-02: Group into 4 categories with one-liner descriptions.
</action>
  <verify>
    <automated>echo "Skills list designed: Core(4) + Project(5) + Debug(2) + Utility(5) = 16 skills"</automated>
  </verify>
  <done>
All 16 skills categorized with one-liner descriptions ready
</done>
</task>

<task type="auto">
  <name>Task 4: Create text-based workflow diagram</name>
  <files>/Volumes/Code/Nodejs/please-done/README.md</files>
  <action>
Create the Workflow Diagram section with ASCII art per D-03 (text-based, no external dependencies):

```markdown
## Workflow Diagram

Typical Please Done workflow:

```
    +-----------+        +-----------+        +-------------+
    |  onboard  |------->|   init    |------->|    plan     |
    |  (once)   |        |  (setup)  |        |  (design)   |
    +-----------+        +-----------+        +-------------+
                                                    |
                                                    v
    +-------------------+      +-------------+   +-------------+
    |  complete-milestone|<-----|    test     |<--| write-code  |
    |   (release)       |      | (verify)    |   | (implement) |
    +-------------------+      +------+------+   +-------------+
           ^                          |
           |                     (fails?)
           |                          |
           +------------------+       v
                              |  +----------+
                              +--| fix-bug  |
                                 | (repair) |
                                 +----------+
```

Legend: `->` Normal flow  `-->` Feedback loop (test fails -> fix -> retest)
```

The diagram shows:
- Main flow: onboard → init → plan → write-code → test → complete-milestone
- Decision point: failing tests trigger fix-bug loop
- Text-based ASCII format per locked decision D-03
</action>
  <verify>
    <automated>echo "ASCII workflow diagram created showing main flow with decision points"</automated>
  </verify>
  <done>
Text-based ASCII workflow diagram ready showing main flow and feedback loops
</done>
</task>

<task type="auto">
  <name>Task 5: Write prerequisites checklist</name>
  <files>/Volumes/Code/Nodejs/please-done/README.md</files>
  <action>
Create the Prerequisites section with checklist format per D-04:

```markdown
## Prerequisites Checklist

Before using Please Done, ensure you have:

- [ ] **Claude Code CLI** (or another supported platform) installed
  - [Claude Code](https://docs.anthropic.com/en/docs/claude-code) — recommended
  - [Codex CLI](https://github.com/openai/codex), [Gemini CLI](https://github.com/google-gemini/gemini-cli), [OpenCode](https://github.com/opencode-ai/opencode), or [GitHub Copilot](https://github.com/features/copilot)

- [ ] **Node.js** 16+ (`node --version`)

- [ ] **Python** 3.12+ (`python3 --version`)

- [ ] **Git** repository initialized (`git --version`)

- [ ] **Gemini API Key** (for FastCode MCP — prompts during `/pd:init`)
  - Get free key at [Google AI Studio](https://aistudio.google.com/apikey)

Run `/pd:init` after installation to verify everything is working.
```

This checklist format is easy to scan and follows D-04 requirements.
</action>
  <verify>
    <automated>echo "Prerequisites checklist created with 5 items in checkbox format"</automated>
  </verify>
  <done>
Prerequisites checklist ready with 5 clear items in checkbox format
</done>
</task>

<task type="auto">
  <name>Task 6: Update README.md with new sections</name>
  <files>/Volumes/Code/Nodejs/please-done/README.md</files>
  <action>
Update the README.md file by:

1. Inserting Quick Start section after the header badges (around line 15), BEFORE Table of Contents
2. Adding Prerequisites Checklist after Quick Start (or consolidating with existing Requirements)
3. Replacing the old "Skills List" section (lines ~178-230) with new Skills Reference
4. Inserting Workflow Diagram before or within the new Skills Reference

Important constraints (per D-05 - no breaking changes):
- Keep all existing content intact
- Update Table of Contents anchors if section names change
- Preserve existing deep links (anchor IDs)
- Keep the "After Installation" section as-is (it serves a different purpose)

The new structure should be:
1. Header with badges
2. **Quick Start** (NEW)
3. Table of Contents
4. Supported Platforms
5. **Prerequisites Checklist** (NEW - may consolidate with Requirements)
6. Installation
7. After Installation
8. **Skills Reference** (NEW - replaces Skills List)
9. **Workflow Diagram** (NEW)
10. Convention System (existing)
11. ... rest of existing sections ...
</action>
  <verify>
    <automated>grep -c "## Quick Start" /Volumes/Code/Nodejs/please-done/README.md && grep -c "## Skills Reference" /Volumes/Code/Nodejs/please-done/README.md && grep -c "## Workflow Diagram" /Volumes/Code/Nodejs/please-done/README.md</automated>
  </verify>
  <done>
README.md updated with all 4 new sections, existing content preserved
</done>
</task>

<task type="auto">
  <name>Task 7: Verify links and formatting</name>
  <files>/Volumes/Code/Nodejs/please-done/README.md</files>
  <action>
Verify the updated README.md:

1. Check all internal anchor links work:
   - Quick Start → Skills Reference link
   - Table of Contents entries for new sections
   
2. Verify markdown formatting:
   - All tables render correctly (check | alignment)
   - ASCII diagram displays properly in monospace
   - Checkboxes use proper `- [ ]` syntax
   
3. Count verification:
   - Quick Start has exactly 5 commands
   - Skills Reference has all 16 skills
   - 4 categories present

4. Check for breaking changes:
   - Existing deep links still work
   - No removed sections (only reorganized)
   - All images/badges still display

Fix any formatting issues found.
</action>
  <verify>
    <automated>echo "Verification complete:" && echo "- Quick Start commands: $(grep -c '| [1-5] |' /Volumes/Code/Nodejs/please-done/README.md || echo 'check manually')" && echo "- Skills count: $(grep -c '/pd:' /Volumes/Code/Nodejs/please-done/README.md)" && echo "- Tables valid: $(grep -c '|' /Volumes/Code/Nodejs/please-done/README.md) pipe characters found"</automated>
  </verify>
  <done>
All links work, formatting correct, 5 commands in Quick Start, 16 skills documented
</done>
</task>

</tasks>

<verification>
1. Quick Start section exists at top of README with exactly 5 commands
2. All 16 skills documented in Skills Reference with one-liner descriptions
3. 4 skill categories present: Core, Project, Debug, Utility
4. ASCII workflow diagram displays correctly
5. Prerequisites checklist in checkbox format
6. No breaking changes (existing links work, content preserved)
7. Table of Contents updated with new sections
</verification>

<success_criteria>
- README.md has Quick Start section with 5 commands in table format
- Skills Reference section lists all 16 skills with categories and one-liners
- Workflow Diagram section has text-based ASCII diagram
- Prerequisites Checklist has 5 items in checkbox format
- All existing README content preserved (no breaking changes)
- Table of Contents updated to include new sections
</success_criteria>

<output>
After completion, create `.planning/phases/100/100-01-SUMMARY.md`
</output>
