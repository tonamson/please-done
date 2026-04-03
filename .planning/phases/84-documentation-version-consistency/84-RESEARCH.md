# Phase 84: Documentation & Version Consistency - Research

**Researched:** 2026-04-05
**Domain:** Project documentation, markdown editing, link validation
**Confidence:** HIGH

## Summary

Phase 84 addresses 4 documentation issues identified in `SKILL_REPO_AUDIT.md`: stale version badge (H-01), missing INTEGRATION_GUIDE.md (H-02), 4 missing command docs (M-01), and outdated CHANGELOG.md (M-08). This is a documentation-only phase with no code changes.

The work involves: (1) single-line badge fix in README.md, (2) creating a comprehensive INTEGRATION_GUIDE.md at repo root, (3) creating 4 command docs using the extended format in `docs/commands/`, and (4) adding a deprecation notice to CHANGELOG.md. All patterns and formats are already established in the codebase.

**Primary recommendation:** Follow existing `docs/commands/*.md` format exactly, using `scan.md` and `update.md` as templates. The extended format adds Arguments and Examples sections to the standard Purpose/How It Works/When/Output/Next step structure.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Update version badge on line 3 from `2.8.0` to `4.0.0` (matches VERSION file and package.json)
- **D-02:** Create full INTEGRATION_GUIDE.md at repo root with detailed coverage: fork workflow, adding new stack rules, editing rules, anchor patterns, cross-references between skills
- **D-03:** Create 4 missing files using **extended format**: Purpose + Arguments + How It Works + When to run + Output + Examples + Next step
  - `audit.md` — pd:audit (OWASP security audit, parallel scanners, `[path] [--full|--only|--poc|--auto-fix]`)
  - `conventions.md` — pd:conventions (detect coding conventions, create/update CLAUDE.md)
  - `onboard.md` — pd:onboard (orient AI to unfamiliar codebase, calls init+scan internally)
  - `status.md` — pd:status (read-only 8-field dashboard, Haiku model, no file writes)
- **D-04:** Add a "Supported Stacks" section listing the 6 existing stack rules: flutter, nextjs, nestjs, solidity, wordpress, general — to be placed near the existing reference to `commands/pd/rules/` (around line 490)
- **D-05:** Prepend a deprecation notice at the top of CHANGELOG.md using blockquote format

### Agent's Discretion
- Placement of "Supported Stacks" section in README: agent chooses the best location near existing rules references
- Exact wording and section depth for INTEGRATION_GUIDE.md beyond the required topics
- Internal structure of the 4 command docs (section ordering, example depth)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DOC-01 | README.md version badge updated from `2.8.0` to match `VERSION` file (`4.0.0`) | Simple line edit — line 3 contains badge URL with version string |
| DOC-02 | `INTEGRATION_GUIDE.md` reference in README.md either resolves to a real file or is removed | Create new file at repo root; references at lines 238 and 524 will auto-resolve |
| DOC-03 | Command docs exist in `docs/commands/` for all 16 commands — currently missing: `audit.md`, `conventions.md`, `onboard.md`, `status.md` | Extended format documented; source command definitions in `commands/pd/*.md` |
| DOC-04 | CHANGELOG.md updated with entries for v3.0 through v9.0 (or deprecated in favor of MILESTONES.md) | Deprecation notice approach chosen; prepend blockquote to existing file |
</phase_requirements>

## Standard Stack

This phase is documentation-only. No libraries or packages required.

### Tools Used
| Tool | Purpose | Notes |
|------|---------|-------|
| Text editor | Markdown file editing | Standard file operations only |
| Git | Version control | For committing documentation changes |

### Files Modified
| File | Line(s) | Change |
|------|---------|--------|
| `README.md` | Line 3 | Badge URL version 2.8.0 → 4.0.0 |
| `README.md` | ~Line 490 | Insert "Supported Stacks" section |
| `CHANGELOG.md` | Line 1 | Prepend deprecation notice |

### Files Created
| File | Purpose |
|------|---------|
| `INTEGRATION_GUIDE.md` | Fork workflow, stack customization, skill architecture |
| `docs/commands/audit.md` | pd:audit command documentation |
| `docs/commands/conventions.md` | pd:conventions command documentation |
| `docs/commands/onboard.md` | pd:onboard command documentation |
| `docs/commands/status.md` | pd:status command documentation |

## Architecture Patterns

### Existing Command Doc Format (Standard)
From `docs/commands/scan.md` and `docs/commands/update.md`:
```markdown
# Command `pd [name]`

## Purpose
[1-2 sentence description]

## How It Works
1. **Step name:** Description
2. **Step name:** Description
...

## When to run this command?
- Bullet points of use cases

## Output
- List of artifacts created/modified

---
**Next step:** [pd next-command](next-command.md) or [pd other](other.md).
```

### Extended Command Doc Format (for D-03)
Adds Arguments and Examples sections:
```markdown
# Command `pd [name]`

## Purpose
[1-2 sentence description]

## Arguments
| Argument | Required | Description |
|----------|----------|-------------|
| `path` | No | Path to scan (default: current directory) |
| `--flag` | No | Flag description |

## How It Works
1. **Step name:** Description
...

## When to run this command?
- Bullet points of use cases

## Output
- List of artifacts created/modified

## Examples
```bash
pd [name]                    # Basic usage
pd [name] --flag             # With flag
```

---
**Next step:** [pd next-command](next-command.md) or [pd other](other.md).
```

### INTEGRATION_GUIDE.md Structure (Required Topics)
From CONTEXT.md D-02:
```markdown
# Integration Guide

## Fork Workflow
- Fork the Please Done repo
- Edit files in `commands/pd/rules/`
- Install skills from your fork

## Adding a New Stack Rule
- Create file in `commands/pd/rules/[stack].md`
- Add detection pattern in `workflows/init.md` Step 4

## Editing Existing Rules
- Modify files directly in `commands/pd/rules/`
- Rules auto-copy to `.planning/rules/` on init

## Anchor Patterns
- How skills reference rules via `@commands/pd/rules/`
- Resolution mechanism

## Cross-References Between Skills
- How commands call workflows
- @workflows/ and @references/ resolution
```

### Deprecation Notice Format
From CONTEXT.md D-05:
```markdown
> **Note:** This changelog is frozen at v2.8.0. For history from v3.0 onward, see [MILESTONES.md](.planning/MILESTONES.md).
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Command doc format | Custom template | Copy `scan.md` / `update.md` | Consistency with existing 12 docs |
| Stack list | Invent stack names | Read `commands/pd/rules/` directory | Source of truth has 6 stacks |
| Version number | Guess or hardcode | Read `VERSION` file | Single source of truth = 4.0.0 |
| MILESTONES.md path | Assume location | Use `.planning/MILESTONES.md` | Verified path in CONTEXT.md |

**Key insight:** All formats, content sources, and patterns are already established in the codebase. This phase is about consistent replication, not invention.

## Common Pitfalls

### Pitfall 1: Inconsistent Command Doc Sections
**What goes wrong:** Creating command docs with different section order or naming than existing docs.
**Why it happens:** Not checking existing format carefully.
**How to avoid:** Open `docs/commands/scan.md` side-by-side when writing. Match section names exactly.
**Warning signs:** Section headings differ from template (`How It Works` vs `Process` vs `Steps`).

### Pitfall 2: Wrong Version Number
**What goes wrong:** Using 3.0.0, 4.0, or other variants instead of exact `4.0.0`.
**Why it happens:** Mixing up milestone version vs package version.
**How to avoid:** Read `VERSION` file literally — it says `4.0.0`.
**Warning signs:** Badge shows anything other than `version-4.0.0`.

### Pitfall 3: Broken Internal Links
**What goes wrong:** Creating INTEGRATION_GUIDE.md at wrong location or with wrong filename.
**Why it happens:** Not checking README.md link syntax exactly.
**How to avoid:** README line 238 and 524 both use `[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)` — file must be at repo root with exact name.
**Warning signs:** Links in README still 404 after file creation.

### Pitfall 4: Missing Supported Stacks Entry
**What goes wrong:** Adding "Supported Stacks" section but missing one of the 6 stacks.
**Why it happens:** Not verifying against `commands/pd/rules/` directory contents.
**How to avoid:** List directory: flutter.md, general.md, nestjs.md, nextjs.md, solidity.md, wordpress.md (+ solidity-refs/).
**Warning signs:** Section has fewer than 6 stacks listed.

### Pitfall 5: Modifying CHANGELOG.md Content
**What goes wrong:** Editing or removing existing changelog entries instead of just prepending notice.
**Why it happens:** Misinterpreting "deprecate" as "delete".
**How to avoid:** D-05 explicitly says "Keep existing entries intact — no removal."
**Warning signs:** CHANGELOG.md has fewer lines than before.

## Code Examples

### README.md Badge Fix (DOC-01)
```markdown
<!-- Current (line 3) -->
[![Version](https://img.shields.io/badge/version-2.8.0-blue.svg)](https://github.com/tonamson/please-done/releases)

<!-- After fix -->
[![Version](https://img.shields.io/badge/version-4.0.0-blue.svg)](https://github.com/tonamson/please-done/releases)
```

### CHANGELOG.md Deprecation Notice (DOC-04)
```markdown
<!-- Prepend at line 1 -->
> **Note:** This changelog is frozen at v2.8.0. For history from v3.0 onward, see [MILESTONES.md](.planning/MILESTONES.md).

# Skills Changelog
<!-- existing content continues -->
```

### Command Doc Example: status.md (DOC-03)
```markdown
# Command `pd status`

## Purpose
Display a read-only 8-field project status dashboard. Does not modify any files.

## Arguments
| Argument | Required | Description |
|----------|----------|-------------|
| (none) | — | No arguments needed |

## How It Works
1. **Read planning files:** STATE.md, CURRENT_MILESTONE.md, TASKS.md, PROGRESS.md
2. **Check git log:** Get last commit hash and message
3. **Count bugs:** Glob `.planning/bugs/BUG_*.md` for unresolved issues
4. **Display dashboard:** Print 8 fields in formatted output

## When to run this command?
- Quick check of project state without suggestions
- Before starting work to see current milestone/phase
- After completing tasks to verify progress recorded

## Output
- 8-line formatted dashboard (no files created or modified)
- Fields: Milestone, Phase, Plan, Tasks, Bugs, Lint, Blockers, Last commit

## Examples
```bash
pd status                    # Display dashboard
```

---
**Next step:** [pd what-next](what-next.md) for actionable suggestions.
```

### Supported Stacks Section for README.md (D-04)
```markdown
### Supported Tech Stacks

Rules in `commands/pd/rules/` provide framework-specific conventions:

| Stack | Rule File | Description |
|-------|-----------|-------------|
| Flutter | `flutter.md` | Dart conventions, GetX state management, Dio HTTP |
| NestJS | `nestjs.md` | TypeScript decorators, dependency injection, guards |
| NextJS | `nextjs.md` | App Router patterns, server components, data fetching |
| Solidity | `solidity.md` | OpenZeppelin v5, SafeERC20, gas optimization |
| WordPress | `wordpress.md` | WP coding standards, sanitize/escape, REST API |
| General | `general.md` | Fallback conventions for unlisted frameworks |

> Stacks are auto-detected by `/pd:init` and rules are copied to `.planning/rules/`.
```

## Source Information for Command Docs

### pd:audit (from commands/pd/audit.md)
- **Model:** opus
- **Arguments:** `[path] [--full|--only cat1,cat2|--poc|--auto-fix]`
- **Purpose:** OWASP security audit dispatching 13 scanners in parallel
- **Output:** SECURITY_REPORT.md + evidence files
- **Key feature:** Dual-mode (standalone at `./`, integrated at `.planning/audit/`)

### pd:conventions (from commands/pd/conventions.md)
- **Model:** sonnet
- **Arguments:** (no arguments needed)
- **Purpose:** Analyze project, detect coding conventions, create/update CLAUDE.md
- **Output:** CLAUDE.md at repo root
- **Key feature:** Scans code patterns before asking user preferences

### pd:onboard (from commands/pd/onboard.md)
- **Model:** sonnet
- **Arguments:** `[project path, defaults to current directory]`
- **Purpose:** Single command to orient AI to unfamiliar codebase
- **Output:** Complete `.planning/` directory (CONTEXT.md, PROJECT.md, ROADMAP.md, STATE.md, etc.)
- **Key feature:** Fully automated — no user prompts

### pd:status (from commands/pd/status.md)
- **Model:** haiku
- **Arguments:** (no arguments needed)
- **Purpose:** Read-only 8-field project status dashboard
- **Output:** No files — display only
- **Key feature:** Uses Haiku for speed, never suggests next steps (that's what-next's job)

## Canonical References

| Document | What to Reference |
|----------|-------------------|
| `commands/pd/audit.md` | Frontmatter (model, args), objective, output section |
| `commands/pd/conventions.md` | Frontmatter, workflow steps, output section |
| `commands/pd/onboard.md` | Frontmatter, full output list, success criteria |
| `commands/pd/status.md` | Frontmatter (haiku model), 8 fields list, rules |
| `docs/commands/scan.md` | Format template — standard sections |
| `docs/commands/update.md` | Format template — section ordering |
| `commands/pd/rules/` | 6 stack files for Supported Stacks section |
| `.planning/MILESTONES.md` | Target of CHANGELOG deprecation redirect |
| `VERSION` | Source of truth for version = 4.0.0 |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js test runner (built-in) |
| Config file | `package.json` scripts |
| Quick run command | `npm test -- --grep "smoke"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DOC-01 | README badge shows 4.0.0 | manual | `grep "version-4.0.0" README.md` | N/A (grep check) |
| DOC-02 | INTEGRATION_GUIDE.md exists | manual | `test -f INTEGRATION_GUIDE.md` | N/A (existence check) |
| DOC-03 | 4 command docs exist | manual | `ls docs/commands/{audit,conventions,onboard,status}.md` | N/A (existence check) |
| DOC-04 | CHANGELOG.md has deprecation notice | manual | `head -1 CHANGELOG.md \| grep "Note"` | N/A (content check) |

### Sampling Rate
- **Per task commit:** Quick existence checks via bash
- **Per wave merge:** All 4 requirements verified
- **Phase gate:** All files exist with correct content before `/gsd-verify-work`

### Wave 0 Gaps
None — this is a documentation-only phase with no test infrastructure needed. Verification is via file existence and content checks.

## Open Questions

None — all decisions are locked in CONTEXT.md with sufficient detail.

## Sources

### Primary (HIGH confidence)
- `README.md` lines 3, 238, 490, 524 — verified badge location and link references
- `VERSION` file — confirmed content is `4.0.0`
- `package.json` — confirmed version is `4.0.0`
- `docs/commands/scan.md`, `docs/commands/update.md` — verified command doc format
- `commands/pd/audit.md`, `commands/pd/conventions.md`, `commands/pd/onboard.md`, `commands/pd/status.md` — source definitions for command docs
- `commands/pd/rules/` — verified 6 stack files exist
- `SKILL_REPO_AUDIT.md` — audit findings H-01, H-02, M-01, M-08

### Secondary (MEDIUM confidence)
- CONTEXT.md D-01 through D-05 — user decisions from discussion phase

## Metadata

**Confidence breakdown:**
- README changes: HIGH — exact line numbers verified
- Command doc format: HIGH — multiple existing examples examined
- INTEGRATION_GUIDE topics: HIGH — requirements explicit in CONTEXT.md
- Stack list: HIGH — directory contents verified

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (30 days — stable documentation patterns)
