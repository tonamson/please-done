# Phase 3: Prompt Prose Compression - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Reduce 30-40% of structural text across all skill files, workflow files, reference files, and template files without losing any behavioral instructions. Only structural prose, filler text, and redundant explanations are removed. AI must produce identical outputs before and after compression.

</domain>

<decisions>
## Implementation Decisions

### Compression Scope
- Compress ALL file types: skills (1,125 lines), workflows (3,363 lines), references (985 lines), templates (770 lines)
- Workflows are the primary target — 3x larger than skills, most prose lives there
- Top targets by size: workflows/new-milestone.md (667), workflows/write-code.md (526), workflows/plan.md (454)

### Compression Technique
- Telegraphic shorthand style — maximize token savings
- Arrow notation: `Đọc X → không có → DỪNG` instead of full sentences
- Emoji status inline: `⬜ → bắt đầu | 🔄 → resume`
- Bullet lists over paragraphs, tables over verbose explanations
- Remove filler words, redundant context, repeated explanations
- PRESERVE: all behavioral instructions (what AI must DO), guard conditions, error messages, user-facing strings

### Measurement
- Use tiktoken to count tokens before/after compression
- Establish baseline token count for all target files before starting
- Target: 30-40% total token reduction across all files
- Track per-file reduction to ensure even compression

### Behavioral Verification
- Before compressing each file: extract a before/after checklist of all behavioral instructions
- After compressing: verify every behavioral instruction from checklist is still present
- If any instruction missing → add it back before moving on
- Behavioral = things the AI must DO, CHECK, STOP, CREATE, UPDATE, COMMIT

### Claude's Discretion
- Exact compression decisions per sentence/paragraph
- Whether to merge related bullet points or keep separate
- Table vs list format decisions within each file
- Order of files to compress (priority by token savings potential)

</decisions>

<specifics>
## Specific Ideas

- User approved telegraphic preview: `Đọc CURRENT_MILESTONE.md → version + phase + status` style
- Vietnamese content stays Vietnamese — compress prose, don't translate
- Guard content already extracted to micro-templates (Phase 2) — don't re-compress guards
- Phase 1 canonical section order is stable — compress within sections, don't reorganize

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `listSkillFiles()` in utils.js: Iterate all skill files for batch processing
- `extractXmlSection()` in utils.js: Extract sections for per-section compression
- `parseFrontmatter()` in utils.js: Preserve frontmatter while compressing body
- `inlineGuardRefs()` in utils.js: Guard expansion already handles micro-template references

### Established Patterns
- Frontmatter format: YAML between `---` — do not compress
- XML-like tags: `<objective>`, `<process>`, etc. — compress content inside tags, keep tags
- Vietnamese content with English technical terms — maintain this convention
- `@references/` and `@workflows/` inline patterns — keep reference paths intact

### Integration Points
- Converters read skill files → compressed format must remain converter-compatible
- `smoke-integrity.test.js` verifies skill structure → may need assertions updated
- Installer inlines @workflows/ references → compressed workflows must still inline correctly
- Guard micro-templates in references/ → already compact from Phase 2

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-prompt-prose-compression*
*Context gathered: 2026-03-22*
