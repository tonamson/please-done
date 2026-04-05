# Phase 109: I18N-04 — Workflow Guides Tiếng Việt - Context

**Gathered:** 2026-04-05 (auto mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Create Vietnamese translations of the 3 Workflow Guides (`docs/workflows/getting-started.vi.md`, `docs/workflows/bug-fixing.vi.md`, `docs/workflows/milestone-management.vi.md`) with full content preservation. This is a documentation-only phase — no code changes. The translation must maintain structure, preserve all examples, and accurately translate content while keeping technical terms in English.

**Scope:** Translation of 3 workflow guide files (~6,000 lines total) into Vietnamese
**Out of scope:** Code changes, logic modifications, file renames, new workflow creation
</domain>

<decisions>
## Implementation Decisions

### Translation Approach
- **D-01:** Bilingual approach — keep English workflow files, add `.vi.md` versions as parallel files
- **D-02:** Follow Phase 106-108 translation patterns for consistency
- **D-03:** HTML comment header with source version tracking (same as previous files)
- **D-04:** Language switcher badges linking between English and Vietnamese versions

### Content Handling
- **D-05:** Preserve ALL command examples — commands stay in English (e.g., `/pd:plan`, `/pd:init`)
- **D-06:** Preserve ALL workflow sequences and step-by-step instructions
- **D-07:** Preserve file paths in examples — no translation of paths
- **D-08:** Preserve table structures — translate content cells, keep structure

### Technical Terms
- **D-09:** Keep technical terminology in English with Vietnamese explanation
  - "Phase", "Milestone", "Plan", "Task" → keep English, explain in Vietnamese
  - "Workflow" → "Workflow" (quy trình làm việc)
- **D-10:** Translate descriptive/explanatory text to natural Vietnamese
- **D-11:** Keep workflow file references in English for cross-linking

### Claude's Discretion
- Exact phrasing choices where multiple Vietnamese translations are valid
- Badge styling (follow README.vi.md pattern)
- Section ordering (keep identical to source)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source Material
- `docs/workflows/getting-started.md` — Getting started workflow guide
- `docs/workflows/bug-fixing.md` — Bug fixing workflow guide
- `docs/workflows/milestone-management.md` — Milestone management workflow guide
- `README.vi.md` — Reference for translation patterns
- `CLAUDE.vi.md` — Reference for technical terminology translation

### Requirements
- `.planning/REQUIREMENTS.md` § I18N-04 — Detailed requirements for Workflow Guides translation
- `.planning/ROADMAP.md` § Phase 109 — Phase goal and success criteria

### Prior Art
- `.planning/phases/108-i18n-03-command-cheat-sheet-ti-ng-vi-t/108-01-PLAN.md` — Reference plan from Phase 108
- `.planning/phases/108-i18n-03-command-cheat-sheet-ti-ng-vi-t/108-01-SUMMARY.md` — Verification approach from Phase 108

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Translation Pattern from Phase 106-108:** HTML comment header format, badge structure, anchor handling
- **Workflow guides structure:** Step-by-step instructions, examples, decision points

### Established Patterns
- Badge format: `[![Label](shield)](link)` with language switchers
- HTML tracking comment: `<!-- Source version: X.Y.Z -->`
- Section anchors: `<a id="anchor-name"></a>` before headers

### Integration Points
- Workflow .vi.md files will be in docs/workflows/ alongside English versions
- No code integration — documentation-only deliverables

</code_context>

<specifics>
## Specific Ideas

- Follow exact same pattern as README.vi.md, CLAUDE.vi.md, and cheatsheet.vi.md from previous phases
- Translate "Step-by-step" instructions to "Hướng dẫn từng bước"
- Keep "Workflow" as "Workflow" with Vietnamese explanation
- Translate "Decision Points" to "Các Điểm Quyết Định"
- Ensure command sequences remain in English (copy-paste API)
- Mirror file structure exactly — same sections, same order

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 109-i18n-04-workflow-guides-ti-ng-vi-t*
*Context gathered: 2026-04-05*
