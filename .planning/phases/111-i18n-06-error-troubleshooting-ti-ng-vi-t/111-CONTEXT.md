# Phase 111: I18N-06 — Error Troubleshooting Tiếng Việt - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning
**Mode:** Auto (discuss mode)

<domain>
## Phase Boundary

Translate the error troubleshooting guide to Vietnamese, creating a bilingual documentation resource for Vietnamese users.

**Scope:**
- Translate `docs/error-troubleshooting.md` → `docs/error-troubleshooting.vi.md`
- Single file translation with full content preservation

**Success Criteria (from ROADMAP.md):**
1. File `docs/error-troubleshooting.vi.md`
2. Translate error messages and suggested actions
3. Keep commands unchanged (don't translate)

</domain>

<decisions>
## Implementation Decisions

### Translation Scope
- **D-01:** Translate all descriptive content (error descriptions, causes, explanations)
- **D-02:** Keep error codes (ERR-001 through ERR-015) in English
- **D-03:** Keep commands, flags, file paths, and code examples in English
- **D-04:** Keep technical terms in English when no good Vietnamese equivalent exists

### File Structure
- **D-05:** Maintain 1:1 mapping - single `.vi.md` counterpart to original
- **D-06:** Preserve all formatting: tables, code blocks, links, headers
- **D-07:** Add language switcher badges at top (English | Tiếng Việt)

### Translation Pattern
- **D-08:** Follow pattern established in Phase 108-110:
  - Keep command syntax exactly as-is: `/pd:command [--flags]`
  - Translate table headers and descriptions
  - Keep skill names and error codes in English
  - Translate section headers (Setup Errors → Lỗi Cài đặt, etc.)

### Error Message Translation
- **D-09:** Translate error message descriptions but keep the actual error code/text in English
- **D-10:** Translate "Suggested Actions" section headers and descriptions
- **D-11:** Keep file paths in code blocks unchanged

### Claude's Discretion
- Specific Vietnamese word choices for technical concepts
- Consistency in translation style across the document
- Handling of "See Also" section translations

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Translation Pattern
- `docs/cheatsheet.vi.md` — Reference for command/flag translation pattern
- `CLAUDE.vi.md` — Reference for technical term translations
- `docs/workflows/getting-started.vi.md` — Reference for workflow translation style

### Source Files
- `docs/error-troubleshooting.md` — Source file to translate

### Documentation
- `.planning/REQUIREMENTS.md` §I18N-06 — Phase requirements
- `.planning/ROADMAP.md` §Phase 111 — Phase goal and success criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Translation pattern from Phase 108-110
- Language switcher badge HTML pattern
- Section header translations established in prior phases

### Established Patterns
- Bilingual documentation structure: original.md + original.vi.md
- Keep code/commands/error codes in English, translate descriptions
- Language badges at file top for navigation

### Integration Points
- docs/error-troubleshooting.md exists (~500+ lines)
- No structural changes needed - content translation only

</code_context>

<specifics>
## Specific Ideas

**Key translations to apply:**
- "Error Troubleshooting Guide" → "Hướng dẫn Xử lý Lỗi"
- "How to Use This Guide" → "Cách Sử dụng Hướng dẫn này"
- "Quick Reference Table" → "Bảng Tham khảo Nhanh"
- "Setup Errors" → "Lỗi Cài đặt"
- "Planning Errors" → "Lỗi Lập kế hoạch"
- "Execution Errors" → "Lỗi Thực thi"
- "Debug Errors" → "Lỗi Gỡ lỗi"
- "Suggested Actions" → "Các Hành động Đề xuất"
- "Cause" → "Nguyên nhân"
- "Solution" → "Giải pháp"
- "See Also" → "Xem thêm"

**Keep in English:**
- All error codes: ERR-001, ERR-002, etc.
- All commands: `/pd:init`, `/pd:plan`, etc.
- All file paths: `.planning/`, `docs/`, etc.
- All code examples and JSON snippets
- Technical terms: MCP, Docker, Git, Node.js

</specifics>

<deferred>
## Deferred Ideas

None — phase scope is clear and bounded to single file translation.

</deferred>

---

*Phase: 111-i18n-06-error-troubleshooting-ti-ng-vi-t*
*Context gathered: 2026-04-05*
