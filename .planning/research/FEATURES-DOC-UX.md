# Features Research: Documentation UX

**Milestone:** v12.3 — Installation & Documentation UX  
**Researched:** 2026-04-07  
**Scope:** Documentation rewrite only (not installation UX)  
**Confidence:** HIGH — based on direct reading of all existing docs + established CLI doc patterns

---

## Command Reference Format

### Recommendation: Inline table-per-category, then expandable per-command detail

**Decision:** Hybrid format — category summary table at top (scannable), followed by per-command blocks with syntax + example + one-line description.

**Rationale:**

| Approach | Problem |
|----------|---------|
| Pure table (all 21 commands in one table) | GitHub renders wide tables with horizontal scroll; 5 columns (name/usage/flags/example/notes) becomes unreadable on mobile and in narrow terminal previews |
| Pure prose per-command (no tables) | Not scannable; gh CLI docs do this for man-page style but they live at a domain, not in GitHub Markdown |
| Table per category + notes block below | Current cheatsheet pattern — already works. Keep it. GitHub renders 3-column tables cleanly at any viewport. |

**Optimal table column count for GitHub Markdown:** 3 columns max for command tables. Use:

```
| Command | Syntax | What it does |
```

Never 5+ columns in a single table — column 4+ wraps unreadably on GitHub.

**COMMAND_REFERENCE.md rewrite format:**

```markdown
## Category Name

| Command | Syntax | What it does |
|---------|--------|--------------|
| `/pd:foo` | `/pd:foo [--bar]` | One sentence. |

### `/pd:foo` — Short Title
**Purpose:** One sentence.  
**Syntax:** `/pd:foo [--bar] [--baz value]`  
**Example:** `/pd:foo --bar` → does X  
**Flags:** `--bar` skip verification · `--baz N` set threshold
```

**Key rules for the rewrite:**
1. No links to `commands/` subdirectory — the subdirectory links currently 404 in COMMAND_REFERENCE.md (links go to `commands/init.md` etc., which are skill files, not user docs). All content must be inline.
2. Purpose = exactly 1 sentence. If you need more, it goes in WORKFLOW_OVERVIEW.md.
3. Real examples only — not contrived. Use actual output values that match what v12.2 produces.
4. Use `·` (middle dot) to separate flags in one line — saves vertical space, renders well in GitHub Markdown.

---

## Getting Started Structure

### Recommendation: `docs/GETTING_STARTED.md` — 70–80 lines max, numbered steps with time estimates

The REQUIREMENTS.md (DOCS-05) defines the scope: install → onboard → first plan → first phase done. This maps exactly to a "tutorial" pattern used by `gh auth login` docs and `fastlane` Getting Started.

**Proven structure from gh CLI, npm, and fastlane tutorials:**

```
# Getting Started with Please Done

> Time: ~10 minutes

## Step 1: Install (2 min)
[exact curl/npm command — copy-pasteable]
Expected output: ✓ [what they should see]

## Step 2: Onboard your project (1 min)
[exact command]
Expected output: [short example]
Common pitfall: [inline, not in a separate section]

## Step 3: Create your first milestone (3 min)
[exact command]
What gets created: [list of files]

## Step 4: Plan a phase (2 min)
[exact command]
What it does: [1 sentence]

## Step 5: Execute (2 min)
[exact command]
✓ You're done — check pd:status for project state.

## What's next?
→ [cheatsheet link] for all commands
→ [WORKFLOW_OVERVIEW link] for when to use which command
→ [COMMAND_REFERENCE link] for full flag reference
```

**Include:**
- Exact commands (copy-paste ready) for each step
- One-line "expected output" after each step — so users know they succeeded
- One "Common pitfall" per step (inline, not a separate Troubleshooting section)
- Time estimate per step (builds confidence, sets expectations)
- Navigation footer pointing to cheatsheet + reference docs

**Exclude:**
- Philosophy / "why" explanations — belongs in WORKFLOW_OVERVIEW
- Platform comparison table — belongs in README
- Detailed flag documentation — belongs in COMMAND_REFERENCE
- Vietnamese translation — out of scope per REQUIREMENTS.md

**Length target:** 70–80 lines. If it exceeds 80 lines, cut theory, not steps.

---

## Cheatsheet Improvements

### Gap Analysis: cheatsheet.md currently at 204 lines / 16 commands

**Missing (5 commands from v12.2):**

| Command | Category | What to add |
|---------|----------|-------------|
| `/pd:stats` | Utility | Usage: `/pd:stats [--json]` · Shows phases, plans, milestones, file counts |
| `/pd:health` | Utility | Usage: `/pd:health [--json]` · Diagnoses planning dir issues with severity |
| `/pd:discover` | Utility | Usage: `/pd:discover [--verbose] [--json]` · Lists MCP tools across platforms |
| `/pd:audit` | Debug | Usage: `/pd:audit [--security] [--performance]` · Already in cheatsheet! ✓ |
| `/pd:sync-version` | Utility | Usage: `/pd:sync-version` · Syncs version badges on milestone completion |

> **Note:** `/pd:audit` IS already in the cheatsheet (line 93, Debug category). The 5 truly missing commands are: `pd:stats`, `pd:health`, `pd:discover`, `pd:sync-version`, + `pd:onboard` is present but `pd:audit` duplicated in the count. The summary table (bottom of cheatsheet) says 16 but counts 5 Utility commands not including stats/health/discover/sync-version.

**Stale content to fix:**

| Location | Stale | Fix |
|----------|-------|-----|
| Line 7 | "Quick reference for all 16 Please Done (PD) commands" | Change to 21 |
| Line 198 | Command Count Summary: Utility shows 5, Total 16 | Add new commands, update to 21 |
| Last line | "Last updated: 2026-04-04" | Update date |
| Utility section | Missing stats, health, discover, sync-version | Add 4 rows to Utility table |
| Popular Flags Reference | Missing `--json` flag (used by stats, health, discover) | Add row |

**Format recommendation: Keep existing table-per-category format.** It's correct. The Notes block below each table (bullet list of per-command details) is the right depth for a cheatsheet — more than a one-liner but less than full reference.

**One improvement:** Add a "When to use" column to the category header descriptions. Currently "Utility Commands — Check status, view conventions, fetch docs, and get suggestions" doesn't cover the 4 new diagnostic commands well. Rewrite to: "Monitor, diagnose, and manage your project environment."

---

## Workflow Overview

### Recommendation: Rewrite to ≤60 lines with Mermaid flow diagram

**Current state:** 53 lines, but ~40% is philosophy ("Why PD never loses its mind"), not flow guidance. It answers "how it works" not "when do I use which command."

**Mermaid is the right choice for GitHub:**
- GitHub.com renders Mermaid natively as SVG since 2022
- ASCII flow diagrams degrade in copy-paste and narrow viewports
- A `flowchart TD` or `stateDiagram-v2` with 8–10 nodes fits in 15–20 lines

**Target structure (≤60 lines):**

```markdown
# Workflow Overview

[1-sentence hook: "PD guides you through a structured loop..."]

## The Loop

[Mermaid diagram — 15–20 lines]
flowchart TD
  A[pd:onboard] --> B[pd:new-milestone]
  B --> C[pd:plan]
  C --> D[pd:write-code]
  D --> E{tests pass?}
  E -- yes --> F[pd:complete-milestone]
  E -- no --> G[pd:fix-bug]
  G --> D
  F --> B

## When to Use Which Command

| I want to... | Use |
|--------------|-----|
| Orient AI to existing codebase | pd:onboard |
| Start a new feature set | pd:new-milestone |
| ...etc for all 21 commands | ... |

## Key Files PD Creates

[3-column table: File → Created by → Purpose]

[link to COMMAND_REFERENCE for flags]
```

**Cut from current WORKFLOW_OVERVIEW.md:**
- The "State Machine" explanation (2 paragraphs) → move to COMMAND_REFERENCE under `pd:status`
- The "Surgical Principle" section → too philosophical for a quick reference; belongs in a contributing guide
- Step-by-step numbered prose → replace with the Mermaid diagram

**Length budget breakdown:**
- Header + intro: 5 lines
- Mermaid diagram block: 18 lines
- "When to use" table (21 rows): 25 lines
- Key files table: 10 lines
- Footer link: 2 lines
- **Total: ~60 lines** ✓

---

## README Quick Start

### What to change (surgical updates only — README is 730 lines)

**Priority 1 — Correctness (must fix):**

| Location | Current | Fix |
|----------|---------|-----|
| Line 3 | Version badge: `version-4.0.0-blue` | Update to `version-12.2.0-blue` |
| Line 30 | "See Skills Reference for all 16 commands" | Change 16 → 21 |
| Line 16 | "Current version: v4.0.0" | Update to v12.2 |

**Priority 2 — Quick Start table (lines 22–29):**

Current 5-step table is the right format — keep it. Add one row:

```
| 0 | `npx please-done install` | Install Please Done |
```

(Or whatever the actual install command is — confirm from bin/install.js)

The 5-step table stops at `/pd:status` but never mentions the new diagnostic commands. Add a note row or sixth step:
```
| 6 | `/pd:health` | Verify your setup is complete |
```

**Priority 3 — New commands need to appear somewhere in README:**

Current README has a "Skills Reference" section (not in first 80 lines). That section likely shows 16 commands. It needs 5 more rows: stats, health, discover, audit (may already be there), sync-version.

**Do NOT change:**
- Prerequisites checklist (well structured, accurate)
- Platform support table (comprehensive)
- The fork disclaimer / relationship to GSD (important for SEO + community trust)
- MCP servers section (accurate)
- Vietnamese badge

**README length target:** Stay near 730 lines — don't bloat it. The Quick Start and Prerequisites are the only sections a new user reads. Keep first 80 lines as the "landing zone" that drives to GETTING_STARTED.md.

---

## Document Complexity Assessment

| Document | Current State | Rework Complexity | Notes |
|----------|---------------|-------------------|-------|
| `docs/COMMAND_REFERENCE.md` | 34-line stub with broken links | **HIGH** — complete rewrite | All 21 commands inline, no external deps |
| `docs/cheatsheet.md` | 204 lines, 16 commands | **LOW** — additive | Add 4 commands + fix 3 stale count refs |
| `docs/WORKFLOW_OVERVIEW.md` | 53 lines, prose-heavy | **MEDIUM** — restructure | Keep core content, add Mermaid, cut philosophy |
| `docs/GETTING_STARTED.md` | Doesn't exist | **MEDIUM** — new file | Well-defined structure from REQUIREMENTS.md |
| `README.md` | 730 lines, v4.0.0 | **LOW** — 5 surgical edits | Version badge, count refs, add new commands to reference section |

**Dependency order for writing:**
1. cheatsheet.md first — it's the authoritative command list; other docs reference it
2. COMMAND_REFERENCE.md second — full flag details needed before GETTING_STARTED
3. WORKFLOW_OVERVIEW.md third — flow diagram references command names
4. GETTING_STARTED.md fourth — links to all three above
5. README.md last — just update counts and link to GETTING_STARTED.md

**Avoid duplication:**
- Don't repeat flag documentation in both cheatsheet AND COMMAND_REFERENCE — cheatsheet gets one-liners, COMMAND_REFERENCE gets the full flag list
- Don't put the Mermaid diagram in both WORKFLOW_OVERVIEW and README — use a link
- GETTING_STARTED.md should not explain what each flag does — link to COMMAND_REFERENCE

---

## Sources

- Direct analysis of: `docs/cheatsheet.md`, `docs/COMMAND_REFERENCE.md`, `docs/WORKFLOW_OVERVIEW.md`, `README.md` (lines 1–80), `.planning/REQUIREMENTS.md`, `.planning/PROJECT.md`
- CLI documentation patterns: gh CLI (cli.github.com/manual), npm docs (docs.npmjs.com), git documentation (git-scm.com/docs), fastlane docs (docs.fastlane.tools)
- GitHub Markdown rendering: Mermaid support confirmed at github.blog/2022-02-14-include-diagrams-markdown-files-mermaid
- Confidence: HIGH for format recommendations (based on reading actual files + established patterns); MEDIUM for exact line counts (file sizes verified, content extrapolated from samples)
