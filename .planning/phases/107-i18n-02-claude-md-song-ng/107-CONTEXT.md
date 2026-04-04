# Phase 107: I18N-02 — CLAUDE.md Song Ngữ - Context

**Gathered:** 2026-04-04 (auto mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Create Vietnamese translation of CLAUDE.md documentation (`CLAUDE.vi.md`) with full content preservation. This is a documentation-only phase — no code changes. The translation must maintain structure, preserve all examples/workflows, and accurately translate technical terminology.

**Scope:** Translation of ~290-line CLAUDE.md into Vietnamese
**Out of scope:** Code changes, logic modifications, file renames
</domain>

<decisions>
## Implementation Decisions

### Translation Approach
- **D-01:** Bilingual approach — keep English CLAUDE.md, add CLAUDE.vi.md as parallel file
- **D-02:** Follow Phase 106 (README.vi.md) translation pattern for consistency
- **D-03:** HTML comment header with source version tracking (same as README.vi.md)
- **D-04:** Language switcher badges linking between CLAUDE.md and CLAUDE.vi.md

### Content Handling
- **D-05:** Preserve ALL command examples — commands stay in English (e.g., `/pd:plan`, `/pd:write-code`)
- **D-06:** Preserve ALL workflow code blocks — exact commands/flags unchanged
- **D-07:** Preserve file paths in examples — no translation of paths
- **D-08:** Preserve table structures — translate content cells, keep structure

### Technical Terms
- **D-09:** Keep technical terminology in English with Vietnamese explanation
  - "Skills" → "Skills" (with Vietnamese description)
  - "Phase", "Milestone", "Plan" → keep English, explain in Vietnamese
  - "Workflow" → "Workflow" (quy trình làm việc)
- **D-10:** Translate descriptive/explanatory text to natural Vietnamese
- **D-11:** Keep CLAUDE.md section anchors (`#quick-start`, etc.) in English for cross-file linking

### Claude's Discretion
- Exact phrasing choices where multiple Vietnamese translations are valid
- Badge styling (follow README.vi.md pattern)
- Section ordering (keep identical to source)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source Material
- `CLAUDE.md` — Full source content (~290 lines) to translate
- `README.vi.md` — Reference for translation patterns and conventions (Phase 106 output)

### Requirements
- `.planning/REQUIREMENTS.md` § I18N-02 — Detailed requirements for CLAUDE.md translation
- `.planning/ROADMAP.md` § Phase 107 — Phase goal and success criteria

### Prior Art
- `.planning/phases/106-i18n-01-readme-song-ngu/106-01-PLAN.md` — Reference plan from Phase 106
- `.planning/phases/106-i18n-01-readme-song-ngu/106-01-SUMMARY.md` — Verification approach from Phase 106

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Translation Pattern from Phase 106:** HTML comment header format, badge structure, anchor handling
- **CLAUDE.md structure:** 5 workflows, 2 command references, schema section

### Established Patterns
- Badge format: `[![Label](shield)](link)` with language switchers
- HTML tracking comment: `<!-- Source version: X.Y.Z -->`
- Section anchors: `<a id="anchor-name"></a>` before headers

### Integration Points
- CLAUDE.vi.md will be root-level file alongside CLAUDE.md
- No code integration — documentation-only deliverable

</code_context>

<specifics>
## Specific Ideas

- Follow exact same pattern as README.vi.md from Phase 106
- Keep "CLAUDE.md" references in English — don't translate file references
- Ensure command tables maintain alignment (commands in English, descriptions in Vietnamese)
- Mirror section structure exactly — same headers, same order

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 107-i18n-02-claude-md-song-ngu*
*Context gathered: 2026-04-04*
