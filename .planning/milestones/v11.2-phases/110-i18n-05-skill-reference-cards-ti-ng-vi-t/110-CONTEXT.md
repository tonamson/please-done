# Phase 110: I18N-05 — Skill Reference Cards Tiếng Việt - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning
**Mode:** Auto (assumptions mode)

<domain>
## Phase Boundary

Translate all 16 skill reference cards to Vietnamese, maintaining bilingual documentation structure with parallel English-Vietnamese files.

**Scope:**
- Translate 16 skill card files in `docs/skills/*.md` → `docs/skills/*.vi.md`
- Translate index file `docs/skills/index.md` → `docs/skills/index.vi.md`
- Total: 17 files (16 skills + index)

**Success Criteria (from ROADMAP.md):**
1. 16 files `docs/skills/*.vi.md`
2. Index `docs/skills/index.vi.md`
3. Structure identical to originals

</domain>

<decisions>
## Implementation Decisions

### Translation Scope
- **D-01:** Translate all descriptive content (Purpose, When to Use, What it does, etc.)
- **D-02:** Keep commands, flags, file paths, and code examples in English
- **D-03:** Keep technical terms in English when no good Vietnamese equivalent exists (e.g., "skill", "command", "flag")

### File Structure
- **D-04:** Maintain 1:1 mapping - each `.md` file gets a `.vi.md` counterpart
- **D-05:** Preserve all formatting: tables, code blocks, links, headers
- **D-06:** Add language switcher badges at top of each file (English | Tiếng Việt)

### Translation Pattern
- **D-07:** Follow pattern established in Phase 108 (cheatsheet.vi.md):
  - Keep command syntax exactly as-is: `/pd:command [--flags]`
  - Translate table headers and descriptions
  - Keep skill names in English (e.g., "onboard", "init")
  - Translate section headers (Purpose → Mục đích, When to Use → Khi nào dùng)

### Index Translation
- **D-08:** Translate index.md category descriptions
- **D-09:** Keep skill names and file links in English format
- **D-10:** Translate table column headers

### Claude's Discretion
- Specific Vietnamese word choices for technical concepts
- Handling of See Also section links
- Consistency in translation style across all 17 files

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Translation Pattern
- `docs/cheatsheet.vi.md` — Reference for command/flag translation pattern
- `docs/workflows/getting-started.vi.md` — Reference for workflow translation style
- `CLAUDE.vi.md` — Reference for technical term translations

### Source Files
- `docs/skills/*.md` (16 files) — Source skill cards to translate
- `docs/skills/index.md` — Source index to translate

### Documentation
- `.planning/REQUIREMENTS.md` §I18N-05 — Phase requirements
- `.planning/ROADMAP.md` §Phase 110 — Phase goal and success criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Translation pattern from Phase 108 (cheatsheet.vi.md)
- Language switcher badge HTML pattern
- Section header translations established in prior phases

### Established Patterns
- Bilingual documentation structure: original.md + original.vi.md
- Keep code/commands in English, translate descriptions
- Language badges at file top for navigation

### Integration Points
- docs/skills/ directory already exists with 17 .md files
- No structural changes needed - content translation only

</code_context>

<specifics>
## Specific Ideas

- "Skill" → "Skill" (keep English, add context: "Skill Please Done")
- "Command" → "Lệnh" or keep "Command"
- "Purpose" → "Mục đích"
- "When to Use" → "Khi nào dùng"
- "Prerequisites" → "Điều kiện tiên quyết"
- "Basic Command" → "Lệnh cơ bản"
- "Common Flags" → "Các cờ phổ biến"
- "See Also" → "Xem thêm"

**Files to translate (16 skills + index):**
1. index.md
2. init.md
3. scan.md
4. onboard.md
5. new-milestone.md
6. plan.md
7. write-code.md
8. test.md
9. fix-bug.md
10. complete-milestone.md
11. what-next.md
12. status.md
13. conventions.md
14. audit.md
15. research.md
16. fetch-doc.md
17. update.md

</specifics>

<deferred>
## Deferred Ideas

None — phase scope is clear and bounded to 17 translation files.

</deferred>

---

*Phase: 110-i18n-05-skill-reference-cards-ti-ng-vi-t*
*Context gathered: 2026-04-05*
