# Phase 105 Research: Skill Reference Cards

> Phase: 105 — DOC-06 Skill Reference Cards
> Updated: 2026-04-04

## Requirements Analysis

Phase 105 yêu cầu tạo quick reference cards cho 16 skills/commands của Please Done:

1. **Format:** Mỗi file ngắn (200-300 words)
2. **Structure:** Purpose → When to use → Prerequisites → Basic command → Common flags → See also
3. **Location:** `docs/skills/`
4. **Coverage:** Tất cả 16 skills

## Current State

- Đã có `docs/commands/` với 16 files cho mỗi command
- Files hiện tại chi tiết hơn yêu cầu (500-800 words)
- Cần tạo bản tóm tắt ngắn gọn theo format mới

## Skills List (16 total)

### Project Commands (5)
1. `/pd:onboard` — Orient AI to new codebase
2. `/pd:init` — Initialize planning structure
3. `/pd:scan` — Analyze codebase structure
4. `/pd:new-milestone` — Create new milestone
5. `/pd:complete-milestone` — Finalize milestone

### Planning Commands (1)
6. `/pd:plan` — Create phase plan

### Execution Commands (2)
7. `/pd:write-code` — Execute tasks
8. `/pd:test` — Run tests

### Debug Commands (3)
9. `/pd:fix-bug` — Investigate and fix bugs
10. `/pd:audit` — Code quality audit
11. `/pd:research` — Research libraries/patterns

### Utility Commands (5)
12. `/pd:status` — Project status dashboard
13. `/pd:what-next` — Suggest next actions
14. `/pd:conventions` — Show coding conventions
15. `/pd:fetch-doc` — Fetch library documentation
16. `/pd:update` — Update PD tooling

## Output

- 16 skill reference cards in `docs/skills/`
- Each file: ~250 words
- Consistent structure across all files
