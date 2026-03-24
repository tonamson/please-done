# Phase 1: Skill Structure Normalization - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Standardize all 12 skill files to a consistent format with clear layer separation. Every skill follows the same section order, has the same mandatory sections, and clearly separates guards (validation/prerequisites) from execution (business logic). This phase does NOT change behavior — only structure.

</domain>

<decisions>
## Implementation Decisions

### Section Ordering
- Claude decides optimal section order across all 12 skills
- All sections are MANDATORY in every skill — even simple skills must have every section
- Add new `<output>` section containing: files/artifacts created, next step suggestion, success criteria, error cases
- Claude decides position of `<output>` in the section order

### Frontmatter
- Standardize and enforce all frontmatter fields across 12 skills
- Required fields: name, description, model, argument-hint, allowed-tools
- Consistent field ordering across all skills

### Guard Layer
- Separate guards clearly from execution logic
- Guards include: file existence checks, argument validation, MCP connectivity checks, + Claude proposes additional checks
- Claude decides placement (dedicated `<guards>` section or labeled within existing section)
- On guard failure: STOP immediately + guide user to fix (e.g., "Chạy /pd:init trước")
- Claude decides guard listing format (checklist vs table)

### Reference Loading
- Each skill decides its own references — no forced uniform count
- References stay in `<execution_context>` section
- Tag references as required vs optional (e.g., `@workflows/plan.md (required)`, `@references/security.md (optional)`)
- This tagging prepares for Phase 4 lazy loading

### Naming/Language
- Keep Vietnamese for description, objective, context, process content
- Keep English for XML tag names (objective, execution_context, context, process)
- XML tag names stay as-is — no renaming
- Frontmatter description format is free-form per skill (no forced pattern)

### Claude's Discretion
- Exact section ordering (Claude picks optimal order based on analysis)
- Guard placement strategy (separate section vs labeled subsection)
- Guard listing format (checklist vs table)
- Position of `<output>` section
- What additional guard checks to add beyond file existence, argument validation, MCP connectivity
- Any structural micro-decisions not covered above

</decisions>

<specifics>
## Specific Ideas

- User wants skills to be easy to understand for people who fork the project — readability is key
- All 12 skills must be structurally identical so reading one skill teaches you the pattern for all
- The `<output>` section should be a "full spec" — files created, next step, success criteria, error cases

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `parseFrontmatter()` in utils.js: Already parses frontmatter fields — can validate required fields
- `extractXmlSection()` in utils.js: Extracts XML section content — can verify section presence
- `listSkillFiles()` in utils.js: Lists all skill files — useful for batch validation

### Established Patterns
- Frontmatter format: YAML between `---` delimiters with standard fields
- XML-like tags in body: `<objective>`, `<execution_context>`, `<context>`, `<process>`
- Vietnamese content with English technical terms
- Comments in Vietnamese (project convention)

### Integration Points
- Converters read skill files and transform them — section order changes must be converter-compatible
- Installers inline @workflows/ references — `<execution_context>` changes affect inlining
- Smoke tests verify skill structure — tests need updating after normalization
- `smoke-integrity.test.js` already checks frontmatter validity

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-skill-structure-normalization*
*Context gathered: 2026-03-22*
