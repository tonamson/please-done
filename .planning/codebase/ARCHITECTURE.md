# Architecture

**Analysis Date:** 2026-04-07

## Pattern Overview

**Overall:** Cross-Platform Skill Transpiler & Project Lifecycle Framework with GSD Workflow Integration

**Key Characteristics:**
- Write-once source (Claude Code) → Platform-specific conversion at install time
- Skill-driven workflow orchestration (init → plan → write-code → test → fix-bug → complete)
- Multi-stage project initialization with FastCode MCP dependency verification
- Template-driven planning and task decomposition
- Platform abstraction via TOOL_MAP converters
- GSD (Get Shit Done) workflow integration with phase-based execution
- Agent orchestration with parallel execution and health checking

## Layers

**Installer Layer:**
- Purpose: Execute multi-stage setup for specific platforms, verify prerequisites, manage MCP registration
- Location: `bin/install.js`, `bin/lib/installers/`
- Contains: Platform-specific installers (claude.js, codex.js, gemini.js, opencode.js, copilot.js)
- Depends on: Converters, Platforms, Utils, Manifest
- Used by: CLI entry point

**Converter Layer:**
- Purpose: Transform Claude Code skill markdown into platform-native formats
- Location: `bin/lib/converters/`
- Contains: Format converters (codex.js, gemini.js, opencode.js, copilot.js)
- Depends on: Platforms, Utils
- Used by: Installers for skill transpilation

**Platform Abstraction Layer:**
- Purpose: Define runtime-specific configuration (tool names, path structures, command syntax)
- Location: `bin/lib/platforms.js`
- Contains: PLATFORMS registry, TOOL_MAP, command reference conversion, config directory resolution
- Depends on: Utils
- Used by: Installers, Converters

**Manifest & Tracking Layer:**
- Purpose: Track installed files via SHA256 hashing, detect user modifications, preserve local patches
- Location: `bin/lib/manifest.js`
- Contains: File generation, diff detection, backup/restore mechanisms
- Depends on: Utils
- Used by: Installers to prevent overwriting user edits

**Skill Framework Layer:**
- Purpose: Define skill structure, frontmatter parsing, YAML/TOML formatting, workflow inlining
- Location: `bin/lib/utils.js` (parseFrontmatter, buildFrontmatter, inlineWorkflow, etc.)
- Contains: Markdown-to-structured-data parsers, frontmatter builders, workflow file inlining
- Depends on: Node.js fs/path
- Used by: Converters, Installers

**Workflow Execution Layer:**
- Purpose: Define step-by-step procedures for each skill (init → plan → write → test → fix)
- Location: `workflows/`
- Contains: Executable steps, decision trees, tool invocation sequences, state management
- Depends on: Templates, References, Codebase code_qa tools
- Used by: Skills (via @workflows/ inclusion)

**Template & Reference Layer:**
- Purpose: Provide reusable structures for planning, tasking, state management, and domain-specific rules
- Location: `templates/`, `references/`, `commands/pd/rules/`
- Contains: PLAN.md structure, TASKS.md structure, state-machine, security checklists, conventions
- Depends on: None (reference data)
- Used by: Skills to scaffold project artifacts

**Skill Definition Layer:**
- Purpose: Define AI coding routines that coordinate codebase analysis and code generation
- Location: `commands/pd/`
- Contains: Skill markdown files with frontmatter (name, description, allowed-tools) and execution logic
- Depends on: Workflows, Templates, References, FastCode MCP, Context7 MCP
- Used by: Installed platforms (Claude Code, Codex, Gemini, OpenCode, Copilot)

**GSD Workflow Layer (New):**
- Purpose: Phase-based project management with autonomous execution
- Location: `.claude/get-shit-done/workflows/`, `.claude/agents/`
- Contains: Orchestrator workflows, mapper agents, autonomous execution pipelines
- Depends on: Skills, State management, Codebase intelligence
- Used by: GSD orchestrator for automated milestone execution

**State Management Layer:**
- Purpose: Track project state across milestones and phases
- Location: `.planning/STATE.md`, `.planning/CURRENT_MILESTONE.md`, `.planning/milestones/`
- Contains: State tracking, milestone completion, phase transitions
- Depends on: File system
- Used by: All skills and GSD workflows

## Data Flow

**Installation Flow:**

1. User runs `node bin/install.js --[platform]`
2. Install script parses flags → determines platform(s)
3. For each platform:
    - Run platform-specific installer (`installers/[platform].js`)
    - Installer executes prerequisite checks (Python 3.12+, uv, git, Claude CLI, etc.)
    - Installer calls converter for each skill → transforms frontmatter + body
    - Converter reads skill from `commands/pd/[skill].md`
    - Converter inline-expands @workflows/* references
    - Converter applies platform-specific tool name mappings (TOOL_MAP)
    - Converter applies path/command syntax conversions (e.g., ~/.claude/ → ~/.codex/)
    - Installer writes converted skill to platform-specific location (e.g., ~/.codex/skills/pd-[name]/SKILL.md)
    - Installer copies rules from `commands/pd/rules/` → platform rules directory
    - Installer registers MCP servers (FastCode, Context7) with platform
    - Installer writes manifest with file SHA256 hashes
4. Installation complete → Skills available in platform

**Skill Execution Flow (Example: /pd:init):**

1. User invokes `/pd:init` (Claude Code) or equivalent platform-native call
2. Skill body executes steps from @workflows/init.md
3. Step 1: Validate project path
4. Step 2: Call FastCode MCP (`mcp__fastcode__list_indexed_repos`) → verify MCP connectivity
5. Step 3: Check if CONTEXT.md exists → handle re-init vs first-time
6. Step 4: Glob source files to detect project status (new vs existing)
7. Step 5: Run tech-stack detection:
    - Glob for framework config files (nest-cli.json, next.config.*, vite.config.*, etc.)
    - Grep for framework identifiers (NestFactory, MongooseModule, etc.)
    - Match detected tech to available rules files
8. Step 6: Copy matched rules files from `commands/pd/rules/[tech].md` → `.planning/rules/[tech].md`
9. Step 7: Read & parse project metadata (package.json, existing ROADMAP/CONTEXT)
10. Step 8: Generate CONTEXT.md with project overview + FastCode readiness indicator
11. Task complete → Next skill: `/pd:scan` or `/pd:what-next` or `/pd:plan`

**Planning Flow (/pd:plan):**

1. User invokes `/pd:plan [phase]`
2. Validates prerequisites (CONTEXT.md, ROADMAP.md, CURRENT_MILESTONE.md exist)
3. Executes @workflows/plan.md:
    - Detects --auto (default) vs --discuss mode
    - AUTO mode: Claude researches project → makes all design decisions → generates PLAN.md + TASKS.md
    - DISCUSS mode: Claude identifies decision points → user selects options → generates PLAN.md + TASKS.md
4. PLAN.md generation:
    - Uses @templates/plan.md structure
    - Documents design decisions (table: issue → decision → rationale)
    - Documents research findings (libraries, code reuse, documentation fetched)
    - Documents technical design (API endpoints, database schema, etc.)
5. TASKS.md generation:
    - Uses @templates/tasks.md structure
    - Lists tasks with status, priority, dependencies, affected files
    - Links each task to PLAN.md "truth" (success criteria)
    - Validates task-to-truth coverage
6. Both files written to `.planning/milestones/[version]/phase-[phase]/`

**GSD Autonomous Execution Flow:**

1. User invokes `/gsd:autonomous` or phase reaches auto-execution threshold
2. GSD orchestrator loads codebase documents from `.planning/codebase/`
3. Parallel mapper agents explore focus areas (tech, arch, quality, concerns)
4. Phase plans created with TASKS.md and verification criteria
5. Wave-based parallel execution of tasks
6. Verification and UAT per phase
7. Automatic advancement to next phase
8. State persistence in `.planning/STATE.md`

**State Management:**

Files in `.planning/`:
- `CONTEXT.md` — Project metadata, tech stack detection, FastCode verification status
- `PROJECT.md` — Vision, constraints, high-level goals
- `ROADMAP.md` — Milestone definitions and phase ordering
- `CURRENT_MILESTONE.md` — Active milestone version/phase
- `STATE.md` — Current working state and accumulated context
- `REQUIREMENTS.md` — Requirements tracking for current milestone
- `milestones/[version]/phase-[phase]/PLAN.md` — Technical design for phase
- `milestones/[version]/phase-[phase]/TASKS.md` — Task list for phase
- `milestones/[version]/phase-[phase]/PROGRESS.md` — Execution progress tracking
- `rules/general.md` → common conventions (always copied)
- `rules/nestjs.md`, `rules/nextjs.md`, etc. → tech-specific rules (conditionally copied by /pd:init)

## Key Abstractions

**Platform Abstraction:**
- Purpose: Unify multi-platform install/convert logic via registry of platform configs
- Examples: `bin/lib/platforms.js` → PLATFORMS dict with claude, codex, gemini, opencode, copilot
- Pattern: Each platform defines dirName, commandPrefix, commandSeparator, envVar, skillFormat (nested|skill-dir|flat), frontmatterFormat, toolMap

**Skill Definition:**
- Purpose: Represent a reusable AI coding routine that coordinates tools and workflows
- Examples: `commands/pd/init.md`, `commands/pd/plan.md`, `commands/pd/write-code.md`
- Pattern: YAML frontmatter (name, description, allowed-tools) + execution body with @workflows, @templates, @references includes

**Tool Mapping:**
- Purpose: Normalize tool names across platforms (Claude Read → Gemini read_file → Copilot read)
- Examples: `TOOL_MAP.gemini`, `TOOL_MAP.copilot` in platforms.js
- Pattern: Converter applies map during transpilation to generate platform-native tool calls

**Workflow Template:**
- Purpose: Define step-by-step procedure with decision trees and tool invocations
- Examples: `workflows/init.md` (10 steps), `workflows/plan.md` (major research → planning → decomposition)
- Pattern: Step numbers, conditions (if/then/else), tool calls with parameters, next-step routing

**Manifest Tracking:**
- Purpose: Detect user-edited installed files and preserve custom modifications during reinstalls
- Examples: `pd-file-manifest.json` (SHA256 hashes), `pd-local-patches/` (backups)
- Pattern: generateManifest() scans directory tree → writeManifest() stores SHA256 hashes → detectChanges() compares new vs old → saveLocalPatches() backups changed files

**GSD Phase Management:**
- Purpose: Structured milestone execution with autonomous capabilities
- Examples: `.planning/milestones/v11.2-phases/`, `.planning/ROADMAP.md`
- Pattern: Milestone → Phases → Tasks → Waves, with state transitions and verification gates

## Entry Points

**Installer Entry:**
- Location: `bin/install.js`
- Triggers: `npm install please-done && node bin/install.js --[platform]`
- Responsibilities: Parse CLI flags, prompt for platform selection, delegate to platform installers, summarize results

**Skill Entry (Claude Code):**
- Location: `~/.claude/commands/pd/[skill].md` (after install)
- Triggers: `/pd:init`, `/pd:plan`, `/pd:write-code`, `/pd:test`, `/pd:fix-bug`, `/pd:complete-milestone`, etc.
- Responsibilities: Execute workflow steps, manage project state, call MCP tools, generate/update planning artifacts

**GSD Orchestrator Entry:**
- Location: `.claude/get-shit-done/workflows/*.md`
- Triggers: `/gsd:map-codebase`, `/gsd:plan-phase`, `/gsd:execute-phase`, `/gsd:autonomous`
- Responsibilities: Manage phase lifecycle, spawn mapper agents, coordinate parallel execution

**MCP Server Integration:**
- FastCode MCP: Index codebases, answer code QA questions (called by workflows)
- Context7 MCP: Fetch library documentation, resolve package versions (called by /pd:plan workflow)

## Error Handling

**Strategy:** Fail-fast with diagnostic messages, preserve install state on interruption

**Patterns:**

1. **Prerequisite Validation** (Installer):
    - Check Python 3.12+ → exit 1 if missing
    - Check uv → auto-install or exit 1
    - Check git → exit 1 if missing
    - Check platform CLI (claude/codex/gemini/etc.) → exit 1 if missing
    - If multiple failures → report all, single exit

2. **MCP Connectivity Check** (Workflows):
    - Call `mcp__fastcode__list_indexed_repos` → if error → STOP immediately
    - Message: "FastCode MCP không hoạt động. Kiểm tra..."
    - Don't proceed to downstream steps

3. **File Change Detection** (Installer):
    - Compute SHA256 of new file vs manifest entry
    - If hash mismatch → prompt user
    - Options: keep local, backup and overwrite, abort
    - Backup saved to `pd-local-patches/` with timestamp

4. **Manifest Tracking** (Installer):
    - If manifest corrupted → warn and regenerate
    - If files deleted → note in report but continue install
    - If symlinks broken → follow physical file (stat)

5. **GSD Error Handling** (Orchestrator):
    - `bin/lib/enhanced-error-handler.js` - Structured error logging
    - `bin/lib/audit-trail.js` - Comprehensive audit trail
    - State persistence before failures
    - Recovery mechanisms with PROGRESS.md

## Cross-Cutting Concerns

**Logging:**
- Implementation: `utils.js` → log object with info/success/warn/error/step methods
- Pattern: Colorized terminal output via ANSI escape codes (red, green, yellow, cyan)
- Usage: Every step of installer and workflow prints progress
- GSD Structured Logging: `.planning/logs/agent-errors.jsonl`

**Validation:**
- Frontmatter parsing: YAML → object, handles nested arrays (allowed-tools lists)
- Tech stack detection: Glob → Grep → heuristic match (not 100% reliable, supports fallbacks)
- Manifest integrity: SHA256 comparison, symlink resolution
- Schema validation: `bin/lib/schema-validator.js` validates CONTEXT.md, TASKS.md, PROGRESS.md

**Configuration:**
- Platform configs: `bin/lib/platforms.js` → PLATFORMS registry (unchanging)
- Project configs: `.planning/CONTEXT.md` → tech stack, FastCode readiness
- Installer configs: `.pdconfig` in skill installation root (SKILLS_DIR variable)

**State Transitions:**
- New project: Empty → CONTEXT.md → ROADMAP.md → CURRENT_MILESTONE.md → phase PLAN.md → phase TASKS.md
- Existing project: detect existing .planning files → optionally reinit → proceed
- Each state validated before proceeding to next skill
- GSD phases: PLAN.md → TASKS.md → PROGRESS.md → TEST_REPORT.md → CODE_REPORT_TASK_*.md

---

*Architecture analysis: 2026-04-07*
