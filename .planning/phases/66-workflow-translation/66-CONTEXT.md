# Phase 66: Workflow Translation - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Translate 13 workflow files in `workflows/*.md` (3,610 lines total) from Vietnamese to English. This phase handles the heaviest Vietnamese content in the project. Only language changes — no structural, behavioral, or logic modifications.

</domain>

<decisions>
## Implementation Decisions

### Translation Scope and Safety

- **D-01:** Translate all 13 workflow files in `workflows/` per the roadmap. Do not expand scope to agents, rules, references, templates, or other directories (those belong to phases 67-68).
- **D-02:** Preserve all frontmatter keys, XML tags, placeholders (`$ARGUMENTS`, `@...`), and command semantics — only translate descriptive/prose content. (Carried forward from Phase 65 D-02)
- **D-03:** Do not rename files, change paths, or reorganize file structure. (Carried forward from Phase 65 D-03)

### Step Numbering Convention

- **D-04:** Translate "Bước X" to "Step X" uniformly. Preserve sub-step numbering patterns: "Bước 1.7" → "Step 1.7", "Bước 5b.1" → "Step 5b.1". The numbering scheme itself does not change — only the label word.

### Terminology and Consistency

- **D-05:** Standardize English terminology across all workflow files: `phase`, `milestone`, `verification`, `requirements`, `success criteria`. Avoid multiple variants for the same concept. (Carried forward from Phase 65 D-06)
- **D-06:** User-facing output text translates to English; variable names, file names, and command names stay as-is. (Carried forward from Phase 65 D-07)

### Batching Strategy

- **D-07:** Follow roadmap-defined split: Plan 01 handles 7 smaller workflows (init, scan, conventions, what-next, research, complete-milestone, test), Plan 02 handles 6 larger workflows (write-code, fix-bug, fix-bug-v1.5, plan, new-milestone, audit).

### Test Impact Handling

- **D-08:** Update test assertion strings in `smoke-integrity.test.js` that directly reference workflow content (Vietnamese test names, Vietnamese assertion strings about workflows). This prevents immediate regressions from the translation.
- **D-09:** Defer broader test string migration to phase 69 (SYNC-02). Only fix assertions that would break from translating workflows.

### Cross-Reference Handling

- **D-10:** Preserve all `@workflows/name.md`, `@references/name.md`, `@templates/name.md` path references exactly. Translate only the surrounding descriptive text.

### Verification

- **D-11:** After translation, grep for Vietnamese diacritic characters across all 13 workflow files to confirm zero Vietnamese text remaining.
- **D-12:** Run `node --test test/smoke-integrity.test.js` to confirm no regressions from workflow translation and test string updates.

### the agent's Discretion

- Specific English phrasing choices, as long as meaning and behavior are preserved.
- How to batch commits during the translation process.
- Whether to use temp files or direct edits (temp files recommended based on Phase 65 experience).

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope and Requirements

- `.planning/ROADMAP.md` — Section "Phase 66: Workflow Translation" with success criteria for TRANS-03.
- `.planning/REQUIREMENTS.md` — Requirement ID TRANS-03 and constraint that migration is language-only.
- `.planning/PROJECT.md` — Milestone v6.0, backward compatibility constraints, no structural refactor.

### Prior Phase Context

- `.planning/phases/65-skills-config-foundation/65-CONTEXT.md` — Decisions D-01 through D-10 from Phase 65 that Phase 66 carries forward (translation safety patterns, terminology standardization, verification approach).
- `.planning/phases/65-skills-config-foundation/VERIFICATION.md` — Phase 65 verification report, confirms patterns that apply to Phase 66.

### Source Files to Translate

- `workflows/audit.md` (307 lines)
- `workflows/complete-milestone.md` (272 lines)
- `workflows/conventions.md` (81 lines)
- `workflows/fix-bug-v1.5.md` (438 lines)
- `workflows/fix-bug.md` (408 lines)
- `workflows/init.md` (168 lines)
- `workflows/new-milestone.md` (404 lines)
- `workflows/plan.md` (524 lines)
- `workflows/research.md` (91 lines)
- `workflows/scan.md` (108 lines)
- `workflows/test.md` (247 lines)
- `workflows/what-next.md` (91 lines)
- `workflows/write-code.md` (471 lines)

### Test Files Impacted

- `test/smoke-integrity.test.js` — Contains Vietnamese test names and assertions referencing workflow content.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- Phase 65 translation patterns — same approach applies: preserve structure, translate prose only.
- Temp-file strategy from Phase 65 — create translations in `.tmp/`, verify, then copy into place.

### Established Patterns

- Step numbering: All 13 workflow files use "Bước X" consistently — 269 total occurrences across all files.
- Cross-references: Workflows reference each other and skills via `@workflows/name.md`, `@references/name.md` path syntax.
- XML structure: Workflows use `<purpose>`, `<process>`, `<required_reading>`, `<verification>` XML tags — these must be preserved.

### Integration Points

- `test/smoke-integrity.test.js` reads workflow files and checks structure/content.
- `test/smoke-converters.test.js`, `test/smoke-plan-checker.test.js`, `test/smoke-utils.test.js` reference workflows — impact should be minimal since they check structure not language.
- Skill files in `commands/pd/` reference workflows via `@workflows/name.md` — paths stay unchanged.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — follow the same translation approach established in Phase 65. The key difference is workflow files are larger and more structured than skill files, requiring careful preservation of step numbering, XML blocks, and cross-references.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

_Phase: 66-workflow-translation_
_Context gathered: 2026-03-28_
