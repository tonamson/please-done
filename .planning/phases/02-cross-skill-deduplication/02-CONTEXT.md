# Phase 2: Cross-Skill Deduplication - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Extract shared content that repeats across 12 skill files into reusable micro-templates in references/. Focus on guards and reference patterns only — process and context sections stay per-skill. After this phase, updating a shared instruction requires changing exactly one file.

</domain>

<decisions>
## Implementation Decisions

### Storage Location
- Shared content goes in separate files under `references/` directory
- Skills reference them via `@references/filename.md` in `<execution_context>`

### Extraction Threshold
- Content appearing in 2+ skills qualifies for extraction
- Even if only 2 skills share it, extract to prevent future duplication

### Guard Deduplication Strategy
- Multiple small files, one per guard type:
  - `references/guard-context.md` — CONTEXT.md existence check
  - `references/guard-fastcode.md` — FastCode MCP connectivity check
  - `references/guard-context7.md` — Context7 MCP connectivity check
  - (Claude may identify and create additional guard files)
- Each skill's `<guards>` section references the common guard files + lists ONLY its own unique guards
- Common guard files contain the check condition + failure message

### Deduplication Scope
- ONLY guards and reference patterns are deduplicated
- `<context>` and `<process>` sections stay per-skill (they contain unique business logic)
- `<objective>` and `<output>` sections stay per-skill

### Claude's Discretion
- Exact list of guard files to create (may be more than 3 listed above)
- How skills reference common guards (inline include vs explicit reference)
- Whether to extract common reference loading patterns (e.g., "load rules based on tech stack")
- Format and structure of each guard micro-template file
- How converters handle the new reference files across platforms

</decisions>

<specifics>
## Specific Ideas

- User prefers many small files over one big file — each guard type gets its own file
- Only dedup guards and reference patterns — keep process/context unique per skill
- Pattern observed: 9/12 skills check CONTEXT.md, 6/12 check FastCode, 5/12 check Context7

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `extractXmlSection()`: Can extract guard content for analysis
- `listSkillFiles()`: Iterate all skills to find shared content
- `inlineWorkflow()`: Already handles @references/ inclusion — new guard files will be inlined automatically

### Established Patterns
- `@references/conventions.md` already referenced by multiple skills — proven pattern
- Phase 1 tagged references as required/optional — deduped guards should follow same tagging
- Converters handle references through existing path mapping (TOOL_MAP in platforms.js)

### Integration Points
- `smoke-integrity.test.js`: May need updated to handle guard references
- Converters: New reference files need to be handled correctly during transpilation
- Installer: New files in references/ will be picked up automatically by manifest

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-cross-skill-deduplication*
*Context gathered: 2026-03-22*
