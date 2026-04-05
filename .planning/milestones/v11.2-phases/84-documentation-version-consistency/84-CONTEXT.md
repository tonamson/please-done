# Phase 84: Documentation & Version Consistency - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver fully accurate, version-consistent project documentation:
1. Fix README.md stale version badge (2.8.0 → 4.0.0)
2. Create INTEGRATION_GUIDE.md (detailed: fork workflow, add stacks, edit rules, anchor patterns, cross-references)
3. Create 4 missing command docs in docs/commands/ using extended format
4. Deprecate CHANGELOG.md with frozen notice + pointer to MILESTONES.md
5. Add "Supported Stacks" section to README listing all 6 stack rules

No code changes. Documentation files only.
</domain>

<decisions>
## Implementation Decisions

### README.md
- **D-01:** Update version badge on line 3 from `2.8.0` to `4.0.0` (matches VERSION file and package.json)
- **D-04:** Add a "Supported Stacks" section listing the 6 existing stack rules: flutter, nextjs, nestjs, solidity, wordpress, general — to be placed near the existing reference to `commands/pd/rules/` (around line 490)

### INTEGRATION_GUIDE.md
- **D-02:** Create full INTEGRATION_GUIDE.md at repo root with detailed coverage:
  - Fork workflow (fork → edit → install from fork)
  - Adding a new stack rule (add file in `commands/pd/rules/[stack].md` + detection pattern in `workflows/init.md`)
  - Editing existing rules
  - Anchor patterns (how skills reference rules via `@commands/pd/rules/`)
  - Cross-references between skills (how commands call workflows)
  - English language, consistent with project convention

### Command Docs (docs/commands/)
- **D-03:** Create 4 missing files using **extended format**: Purpose + Arguments + How It Works + When to run + Output + Examples + Next step
  - `audit.md` — pd:audit (OWASP security audit, parallel scanners, `[path] [--full|--only|--poc|--auto-fix]`)
  - `conventions.md` — pd:conventions (detect coding conventions, create/update CLAUDE.md)
  - `onboard.md` — pd:onboard (orient AI to unfamiliar codebase, calls init+scan internally)
  - `status.md` — pd:status (read-only 8-field dashboard, Haiku model, no file writes)

### CHANGELOG.md
- **D-05:** Prepend a deprecation notice at the top of CHANGELOG.md:
  ```
  > **Note:** This changelog is frozen at v2.8.0. For history from v3.0 onward, see [MILESTONES.md](.planning/MILESTONES.md).
  ```
  Keep existing entries intact — no removal.

### the agent's Discretion
- Placement of "Supported Stacks" section in README: agent chooses the best location near existing rules references
- Exact wording and section depth for INTEGRATION_GUIDE.md beyond the required topics
- Internal structure of the 4 command docs (section ordering, example depth)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source of Truth for Phase 84 Scope
- `.planning/REQUIREMENTS.md` §DOC-01 through DOC-04 — 4 documentation requirements this phase closes
- `SKILL_REPO_AUDIT.md` §H-01, H-02, M-01, M-08 — verified audit findings driving this phase

### Existing Patterns to Match
- `docs/commands/scan.md` — format reference for existing command docs
- `docs/commands/update.md` — another format reference
- `.planning/MILESTONES.md` — history source for CHANGELOG deprecation redirect
- `README.md` — target file for badge fix and stacks section; line 3 = badge, line 238 = INTEGRATION_GUIDE ref, line 490 = rules extension note, line 524 = key references table

### Source Command Definitions (for command docs)
- `commands/pd/audit.md` — audit skill definition (arguments, objective, output)
- `commands/pd/conventions.md` — conventions skill definition
- `commands/pd/onboard.md` — onboard skill definition
- `commands/pd/status.md` — status skill definition (read-only, haiku model)

### Version Info
- `VERSION` — current version: 4.0.0
- `package.json` — version: 4.0.0

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `docs/commands/*.md` (12 existing files) — format templates; scan.md and update.md are the clearest format examples

### Established Patterns
- Command docs use: `# Command \`pd X\`` heading style
- Extended format to add: Arguments section before How It Works, Examples section before Next step
- Stack rules in `commands/pd/rules/`: flutter.md, general.md, nestjs.md, nextjs.md, solidity.md, wordpress.md (+ solidity-refs dir)

### Integration Points
- README.md line 238: inline reference to INTEGRATION_GUIDE.md in blockquote — will become a real link after file creation
- README.md line 524: table row for INTEGRATION_GUIDE.md — will resolve after file creation
- CHANGELOG.md line 1: prepend deprecation notice

</code_context>

<specifics>
## Specific Ideas

- INTEGRATION_GUIDE.md should cover 5 topics: fork workflow, add stacks, edit rules, anchor patterns, cross-references between skills
- "Supported Stacks" section in README should list all 6 stacks with brief one-liner descriptions
- 4 command docs must use extended format with Arguments section and Examples section
- CHANGELOG deprecation notice uses blockquote format `> **Note:**` for visibility

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 84-documentation-version-consistency*
*Context gathered: 2026-04-05*
