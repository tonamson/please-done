# PD Command Reference

Quick reference for all 20 PD commands. Each entry: purpose, syntax, and one example.

---

## Project Commands

### `pd:onboard`
**Purpose**: Orient AI to an unfamiliar codebase — initialize, scan, and create a ready-to-use `.planning/` directory.
**Syntax**: `/pd:onboard [project path]`
**Example**: `/pd:onboard ./my-project`

### `pd:init`
**Purpose**: Initialize the workspace, verify FastCode MCP, and create compact context for later skills.
**Syntax**: `/pd:init [project path]`
**Example**: `/pd:init`

### `pd:scan`
**Purpose**: Scan the entire project, analyze structure, libraries, and security, and generate a report.
**Syntax**: `/pd:scan [project path]`
**Example**: `/pd:scan`

### `pd:new-milestone`
**Purpose**: Start strategic project planning with a clear roadmap and milestones.
**Syntax**: `/pd:new-milestone [milestone name] [--reset-phase-numbers]`
**Example**: `/pd:new-milestone v2.0 Performance`

### `pd:complete-milestone`
**Purpose**: Complete the milestone, commit, create a git tag, and generate a completion report.
**Syntax**: `/pd:complete-milestone`
**Example**: `/pd:complete-milestone`

### `pd:sync-version`
**Purpose**: Sync version from package.json across README badges, version text, and doc file headers.
**Syntax**: `/pd:sync-version [--check]`
**Example**: `/pd:sync-version --check`

---

## Planning Commands

### `pd:plan`
**Purpose**: Technical planning and task breakdown for the current milestone phase.
**Syntax**: `/pd:plan [--auto | --discuss] [phase]`
**Example**: `/pd:plan --auto 1.2`

### `pd:research`
**Purpose**: Automated research — classify internal vs external topics, collect evidence, verify, and cross-validate.
**Syntax**: `/pd:research [research topic]`
**Example**: `/pd:research "React Server Components"`

### `pd:fetch-doc`
**Purpose**: Download documentation from a URL using the current library version and cache it locally for fast lookup.
**Syntax**: `/pd:fetch-doc <URL> [custom-name]`
**Example**: `/pd:fetch-doc https://docs.stripe.com/api stripe-api`

### `pd:update`
**Purpose**: Check for a new version of the skill set on GitHub, show the changelog, and apply the update.
**Syntax**: `/pd:update [--check | --apply]`
**Example**: `/pd:update --check`

---

## Execution Commands

### `pd:write-code`
**Purpose**: Write code for tasks already planned in TASKS.md, lint, build, commit, and report back.
**Syntax**: `/pd:write-code [task number] [--auto | --parallel | --resume]`
**Example**: `/pd:write-code --auto`

### `pd:test`
**Purpose**: Write tests and run verification, confirm results with the user, and report failures.
**Syntax**: `/pd:test [task number | --all | --standalone path]`
**Example**: `/pd:test --all`

---

## Debug Commands

### `pd:fix-bug`
**Purpose**: Find and fix bugs using a scientific method — investigate, report, patch the code, and confirm until resolved.
**Syntax**: `/pd:fix-bug [bug description]`
**Example**: `/pd:fix-bug "login returns 500 after password reset"`

### `pd:audit`
**Purpose**: View and search the discussion context audit trail — list, filter, and view stored discussion summaries.
**Syntax**: `/pd:audit [--phase N] [--search keyword] [--from DATE] [--to DATE] [--view N] [--json] [--limit N]`
**Example**: `/pd:audit --search "auth" --limit 5`

### `pd:conventions`
**Purpose**: Analyze the project and create CLAUDE.md with project-specific coding conventions (style, naming, patterns).
**Syntax**: `/pd:conventions`
**Example**: `/pd:conventions`

---

## Utility Commands

### `pd:status`
**Purpose**: Display a read-only project status dashboard showing milestone, phase, tasks, bugs, errors, and blockers.
**Syntax**: `/pd:status [--auto-refresh] [--refresh-threshold=MINUTES]`
**Example**: `/pd:status --auto-refresh`

### `pd:what-next`
**Purpose**: Check project progress and suggest the next command when work is interrupted or forgotten.
**Syntax**: `/pd:what-next [--execute]`
**Example**: `/pd:what-next`

### `pd:stats`
**Purpose**: Display comprehensive project statistics including phases, plans, requirements, milestones, timeline, and file counts.
**Syntax**: `/pd:stats [--json]`
**Example**: `/pd:stats`

### `pd:health`
**Purpose**: Diagnose planning directory issues — missing files, STATE.md validation errors, and orphaned directories.
**Syntax**: `/pd:health [--json]`
**Example**: `/pd:health`

### `pd:discover`
**Purpose**: Discover MCP tools and built-in tools across all configured platforms — shows servers, tools, and platform coverage.
**Syntax**: `/pd:discover [--verbose] [--json]`
**Example**: `/pd:discover --verbose`
