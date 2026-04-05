# Phase 108: I18N-03 — Command Cheat Sheet Tiếng Việt - Context

**Gathered:** 2026-04-05 (auto mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Create Vietnamese translation of the Command Cheat Sheet (`docs/cheatsheet.vi.md`) with full content preservation. This is a documentation-only phase — no code changes. The translation must maintain table structures, preserve all commands/flags, and accurately translate descriptions.

**Scope:** Translation of ~200-line docs/cheatsheet.md into Vietnamese
**Out of scope:** Code changes, logic modifications, new command additions
</domain>

<decisions>
## Implementation Decisions

### Translation Approach
- **D-01:** Bilingual approach — keep English docs/cheatsheet.md, add docs/cheatsheet.vi.md as parallel file
- **D-02:** Follow Phase 106-107 (README.vi.md, CLAUDE.vi.md) translation pattern for consistency
- **D-03:** HTML comment header with source version tracking (same as previous files)
- **D-04:** Language switcher badges linking between cheatsheet.md and cheatsheet.vi.md

### Content Handling
- **D-05:** Preserve ALL commands — commands stay in English (e.g., `/pd:plan`, `/pd:status`)
- **D-06:** Preserve ALL flags — flags stay in English (e.g., `--auto`, `--wave`)
- **D-07:** Preserve file paths in examples — no translation of paths
- **D-08:** Preserve ALL table structures — translate headers and descriptions, keep command syntax intact

### Technical Terms
- **D-09:** Keep command names and flag names in English (they are the API)
- **D-10:** Translate category descriptions and notes to natural Vietnamese
- **D-11:** Keep "Legend" section flag notation symbols (`[--flag]`, `--flag value`, `|`, etc.) as they are universal notation

### Claude's Discretion
- Exact phrasing choices where multiple Vietnamese translations are valid
- Badge styling (follow README.vi.md pattern)
- Section ordering (keep identical to source)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source Material
- `docs/cheatsheet.md` — Full source content (~200 lines) to translate
- `README.vi.md` — Reference for translation patterns and conventions
- `CLAUDE.vi.md` — Reference for technical terminology translation

### Requirements
- `.planning/REQUIREMENTS.md` § I18N-03 — Detailed requirements for Command Cheat Sheet translation
- `.planning/ROADMAP.md` § Phase 108 — Phase goal and success criteria

### Prior Art
- `.planning/phases/107-i18n-02-claude-md-song-ng/107-01-PLAN.md` — Reference plan from Phase 107
- `.planning/phases/107-i18n-02-claude-md-song-ng/107-01-SUMMARY.md` — Verification approach from Phase 107

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Translation Pattern from Phase 106-107:** HTML comment header format, badge structure
- **Cheatsheet structure:** 5 command categories, usage tables, flags reference table, legend

### Established Patterns
- Badge format: `[![Label](shield)](link)` with language switchers
- HTML tracking comment: `<!-- Source version: X.Y.Z -->`
- Table format: Commands in English, descriptions in Vietnamese

### Integration Points
- cheatsheet.vi.md will be in docs/ directory alongside cheatsheet.md
- No code integration — documentation-only deliverable

</code_context>

<specifics>
## Specific Ideas

- Follow exact same pattern as README.vi.md and CLAUDE.vi.md from previous phases
- Keep "Please Done Command Cheat Sheet" title style — translate to "Bảng Tham Khảo Lệnh Please Done"
- Ensure "How to Read" section explains the translated format clearly
- Keep command count summary numbers identical (16 commands total)
- Flag notation in Legend is universal — keep symbols, translate explanations

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 108-i18n-03-command-cheat-sheet-ti-ng-vi-t*
*Context gathered: 2026-04-05*
