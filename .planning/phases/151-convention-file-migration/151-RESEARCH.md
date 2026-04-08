# Phase 151: Convention File Migration - Research

**Researched:** 2026-04-08
**Domain:** Skill/workflow file refactoring (text replacement)
**Confidence:** HIGH

## Summary

This is a straightforward text replacement phase to rename `CLAUDE.md` → `CONVENTIONS.md` across the `pd:conventions` skill and its workflow. The scope is well-defined in CONTEXT.md with 3 files to modify: `commands/pd/conventions.md`, `workflows/conventions.md`, and delete `CLAUDE.md` at repo root.

The research confirmed **no hidden dependencies** in the core code (`bin/`, `lib/`) that would break from this change. The `fix-bug` workflow does reference `CLAUDE.md`, but that's explicitly **out of scope** per CONTEXT.md (Phase 152 territory).

**Primary recommendation:** Execute as a simple find-and-replace across the 3 in-scope files, regenerate snapshots, and delete the root `CLAUDE.md`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
1. **Target file name:** `CONVENTIONS.md` (at project root)
2. **Backward compatibility:** No backward compatibility needed — users with existing `CLAUDE.md` delete manually
3. **This repo's CLAUDE.md:** Delete `CLAUDE.md` from this repo entirely (Claude-specific, project aims to be model-agnostic)

### Files to Change (locked scope)
- `commands/pd/conventions.md` — skill file (description, output, rules)
- `workflows/conventions.md` — workflow logic (Step 1 check, Step 5 create)
- `CLAUDE.md` — delete from repo root

### Out of Scope (IGNORE)
- Migrating existing user CLAUDE.md files
- Updating any other skill that might reference CLAUDE.md (Phase 152 scope)
- Changes to pd:write-code, pd:fix-bug, pd:plan injection (Phase 152)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONV-01 | `pd:conventions` creates/updates `CONVENTIONS.md` instead of `CLAUDE.md` | Exact line-by-line changes identified in skill and workflow files |
| CONV-02 | `CLAUDE.md` is removed from the project or replaced by `CONVENTIONS.md` | Root `CLAUDE.md` file exists and should be deleted per decision |
</phase_requirements>

## Standard Stack

This phase requires no new libraries — it's pure text/file manipulation.

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Node.js | 20.x | Test runner | Already project runtime [VERIFIED: package.json] |
| git | any | File operations | Standard VCS |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| `node --test` | Run snapshot tests | After modifying skill/workflow files |
| `node test/generate-snapshots.js` | Regenerate snapshots | After any skill file change |

**Installation:** None required — all tools already in project.

## Architecture Patterns

### File Change Map

The research identified **exact changes** needed in each file:

#### `commands/pd/conventions.md` (6 occurrences)
| Line | Current | New |
|------|---------|-----|
| 3 | `description: "...create CLAUDE.md..."` | `description: "...create CONVENTIONS.md..."` |
| 17 | `create or update \`CLAUDE.md\`` | `create or update \`CONVENTIONS.md\`` |
| 41 | `\`CLAUDE.md\` -- project coding conventions` | `\`CONVENTIONS.md\` -- project coding conventions` |
| 46 | `\`CLAUDE.md\` includes naming conventions...` | `\`CONVENTIONS.md\` includes naming conventions...` |
| 56 | `before creating \`CLAUDE.md\`` | `before creating \`CONVENTIONS.md\`` |
| 57 | `\`CLAUDE.md\` MUST reflect...` | `\`CONVENTIONS.md\` MUST reflect...` |

#### `workflows/conventions.md` (10 occurrences)
| Line | Current | New |
|------|---------|-----|
| 2 | `create/update CLAUDE.md` | `create/update CONVENTIONS.md` |
| 10 | `## Step 1: Check for existing CLAUDE.md` | `## Step 1: Check for existing CONVENTIONS.md` |
| 11 | `\`CLAUDE.md\` at root:` | `\`CONVENTIONS.md\` at root:` |
| 12 | `"CLAUDE.md already exists..."` | `"CONVENTIONS.md already exists..."` |
| 48 | `## Step 5: Create CLAUDE.md` | `## Step 5: Create CONVENTIONS.md` |
| 59 | `Existing CLAUDE.md + additions` | `Existing CONVENTIONS.md + additions` |
| 64 | `CLAUDE.md created!` | `CONVENTIONS.md created!` |
| 66 | `File: CLAUDE.md ([N] lines)` | `File: CONVENTIONS.md ([N] lines)` |
| 75 | `CLAUDE.md UNDER 50 lines` | `CONVENTIONS.md UNDER 50 lines` |
| 81 | `File compatible with Claude Code auto-load (CLAUDE.md at root)` | **DELETE this line** — no longer relevant |

#### `CLAUDE.md` at repo root
- **Action:** Delete file entirely
- **Note:** `CLAUDE.vi.md` exists but is out of scope (also Claude-specific, but Phase 152 or separate cleanup)

### Anti-Patterns to Avoid
- **Mass grep-replace:** Don't blindly replace all `CLAUDE.md` references — only in-scope files
- **Forgetting snapshots:** Test snapshots in `test/snapshots/*/conventions.md` will fail after skill changes
- **Editing fix-bug workflow:** That's Phase 152 scope — don't touch it

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Snapshot regeneration | Manual editing of 4 snapshot files | `node test/generate-snapshots.js` | Maintains consistency across all 4 platforms |
| Text replacement | Custom sed/awk scripts | Manual edits in IDE | Only 16 occurrences total — simple enough |

**Key insight:** This is a documentation/config change, not a logic change. Keep it simple.

## Common Pitfalls

### Pitfall 1: Snapshot Test Failures
**What goes wrong:** After editing `commands/pd/conventions.md`, the 4 snapshot tests fail
**Why it happens:** Converters re-generate skill content, snapshots become stale
**How to avoid:** Run `node test/generate-snapshots.js` immediately after editing skill file
**Warning signs:** `node --test test/smoke-snapshot.test.js` fails with "output changed from snapshot"

### Pitfall 2: Missing the Workflow Notification Block
**What goes wrong:** The ASCII box in Step 6 still says "CLAUDE.md created!"
**Why it happens:** Easy to miss the notification block in `workflows/conventions.md` lines 63-69
**How to avoid:** Search for all 10 occurrences systematically; the notification block has 2
**Warning signs:** Visual scan of workflow after changes shows old filename

### Pitfall 3: Leaving Line 81 In
**What goes wrong:** Workflow still mentions "Claude Code auto-load"
**Why it happens:** Copy-paste replacement doesn't catch semantic changes
**How to avoid:** Line 81 should be **deleted**, not replaced — it's Claude-specific
**Warning signs:** Grep for "Claude Code" in changed files

### Pitfall 4: Accidentally Changing Out-of-Scope Files
**What goes wrong:** Editing `workflows/fix-bug.md` or eval config files
**Why it happens:** Grep shows many CLAUDE.md references; easy to over-extend scope
**How to avoid:** Strictly follow CONTEXT.md file list; Phase 152 handles the rest
**Warning signs:** Commit includes files outside the 3-file scope

## Code Examples

### Verified Pattern: Skill Description Change
```yaml
# commands/pd/conventions.md line 3
# BEFORE:
description: "Analyze the project and create CLAUDE.md with project-specific coding conventions (style, naming, patterns)"

# AFTER:
description: "Analyze the project and create CONVENTIONS.md with project-specific coding conventions (style, naming, patterns)"
```
[VERIFIED: direct file read]

### Verified Pattern: Workflow Step Header Change
```markdown
<!-- workflows/conventions.md line 10 -->
<!-- BEFORE: -->
## Step 1: Check for existing CLAUDE.md

<!-- AFTER: -->
## Step 1: Check for existing CONVENTIONS.md
```
[VERIFIED: direct file read]

### Verified Pattern: Notification Block Change
```text
<!-- workflows/conventions.md lines 63-69 -->
<!-- BEFORE: -->
╔══════════════════════════════════════╗
║     CLAUDE.md created!               ║
╠══════════════════════════════════════╣
║ File: CLAUDE.md ([N] lines)          ║
║ Claude Code auto-reads each session  ║
║ Edit: directly or /pd:conventions    ║
╚══════════════════════════════════════╝

<!-- AFTER: -->
╔═══════════════════════════════════════╗
║     CONVENTIONS.md created!           ║
╠═══════════════════════════════════════╣
║ File: CONVENTIONS.md ([N] lines)      ║
║ Run /pd:write-code to use conventions ║
║ Edit: directly or /pd:conventions     ║
╚═══════════════════════════════════════╝
```
Note: Line 67 changes from Claude-specific message to model-agnostic guidance.
[VERIFIED: direct file read + semantic analysis]

### Verified Pattern: Rules Section Line 81 Deletion
```markdown
<!-- workflows/conventions.md line 81 -->
<!-- BEFORE: -->
- File compatible with Claude Code auto-load (CLAUDE.md at root)

<!-- AFTER: -->
<!-- DELETE THIS LINE ENTIRELY — no longer applicable -->
```
[VERIFIED: direct file read]

## Other Files Referencing CLAUDE.md (OUT OF SCOPE)

Research identified these files that also reference `CLAUDE.md` — all are **explicitly out of scope** per CONTEXT.md:

| File | Reference Count | Scope |
|------|-----------------|-------|
| `workflows/fix-bug.md` | 5 | Phase 152 (CONV-03/04/05) |
| `bin/lib/logic-sync.js` | 5 | Library code — param name `claudeContent` |
| `test/smoke-logic-sync.test.js` | 2 | Test data for logic-sync |
| `test/snapshots/codex/fix-bug.md` | 4 | Snapshot for fix-bug (follows fix-bug change) |
| `test/snapshots/codex/conventions.md` | 10 | Will auto-regenerate |
| `evals/trigger-config.yaml` | 3 | Eval config (separate cleanup) |
| `promptfooconfig.yaml` | ~12 | Eval config (separate cleanup) |
| `CLAUDE.vi.md` | — | Vietnamese version (separate cleanup) |

**Action:** Do not touch these files in Phase 151.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node:test) |
| Config file | None — built-in |
| Quick run command | `node --test test/smoke-snapshot.test.js` |
| Full suite command | `node --test test/` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONV-01 | Skill output references CONVENTIONS.md | snapshot | `node --test test/smoke-snapshot.test.js` | ✅ Yes (will fail until snapshots regenerated) |
| CONV-02 | CLAUDE.md removed from root | manual | `ls CLAUDE.md` should fail | N/A (file deletion check) |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-snapshot.test.js`
- **Per wave merge:** `node --test test/`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] Regenerate snapshots: `node test/generate-snapshots.js` — covers CONV-01 snapshot alignment

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Model-specific `CLAUDE.md` | Universal `CONVENTIONS.md` | v12.4 (this phase) | Any AI model can read conventions |

**Deprecated/outdated:**
- `CLAUDE.md` at project root: Replaced by `CONVENTIONS.md` for model-agnosticism

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Notification block line 67 should change from "Claude Code auto-reads" to model-agnostic message | Code Examples | Low — cosmetic only |
| A2 | No other core code depends on filename `CLAUDE.md` being hardcoded | Other Files section | Low — verified via grep |

## Open Questions

1. **Should CLAUDE.vi.md also be deleted?**
   - What we know: It's the Vietnamese version of CLAUDE.md
   - What's unclear: Whether it should be migrated to CONVENTIONS.vi.md or deleted
   - Recommendation: Out of scope for Phase 151 — handle in separate cleanup phase

2. **Eval configs (promptfooconfig.yaml, trigger-config.yaml)**
   - What we know: They reference CLAUDE.md in test descriptions
   - What's unclear: Whether they need updating for test correctness
   - Recommendation: Out of scope — evals are testing skill behavior, not file existence

## Sources

### Primary (HIGH confidence)
- `commands/pd/conventions.md` — direct file read, exact line numbers
- `workflows/conventions.md` — direct file read, exact line numbers
- `151-CONTEXT.md` — locked decisions and scope

### Secondary (MEDIUM confidence)
- `grep -rn "CLAUDE\.md"` — full repository scan for completeness

### Tertiary (LOW confidence)
- None — all findings verified via file reads

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies
- Architecture: HIGH — exact line changes identified
- Pitfalls: HIGH — scope is narrow and well-defined

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable — file structure unlikely to change)

---

## RESEARCH COMPLETE

**Phase:** 151 - Convention File Migration
**Confidence:** HIGH

### Key Findings
- **16 total text replacements** across 2 files (6 in skill, 10 in workflow)
- **1 line deletion** (workflow line 81 — Claude-specific comment)
- **1 file deletion** (root `CLAUDE.md`)
- **Snapshots must be regenerated** after skill file change
- **No hidden dependencies** in core code (`bin/`, `lib/`)

### File Created
`.planning/phases/151-convention-file-migration/151-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | No new dependencies, existing test infrastructure |
| Architecture | HIGH | Exact line-by-line changes mapped from source files |
| Pitfalls | HIGH | Narrow scope, well-documented out-of-scope files |

### Open Questions
- CLAUDE.vi.md cleanup (out of scope)
- Eval config updates (out of scope)

### Ready for Planning
Research complete. Planner can now create PLAN.md files.
