# v11.1 Requirements: Documentation Improvements

## Goal
Cải thiện tài liệu hướng dẫn sử dụng các command skill hiện có trong repo để developer dễ dàng sử dụng.

## Requirements

### DOC-01: README Quick Start Guide
**Requirement:** Cải thiện README.md với quick start guide rõ ràng  
**Chi tiết:**
- Thêm mục "Quick Start" ngay đầu README với 3-5 lệnh cơ bản nhất
- Liệt kê tất cả các skill commands với one-liner description
- Thêm workflow diagram đơn giản (text-based)
- Prerequisites checklist rõ ràng

### DOC-02: Command Cheat Sheet
**Requirement:** Tạo command cheat sheet cho các lệnh thường dùng  
**Chi tiết:**
- File `docs/cheatsheet.md` với format: command | usage | example
- Group commands theo category (Project, Planning, Execution, Debug)
- Include flags/options phổ biến
- Printable format (markdown table)

### DOC-03: CLAUDE.md Usage Examples
**Requirement:** Cập nhật CLAUDE.md với ví dụ sử dụng thực tế  
**Chi tiết:**
- Thêm mục "Common Workflows" với 3-5 workflow phổ biến
- Mỗi workflow có: context → command → expected output → next steps
- Ví dụ: "Bắt đầu project mới", "Fix bug đang gặp", "Kiểm tra tiến độ"
- Cập nhật command reference với real-world usage patterns

### DOC-04: Error Message Improvements
**Requirement:** Cải thiện error messages để user biết cách khắc phục  
**Chi tiết:**
- Review các error messages trong skills hiện tại
- Thêm "Suggested action" cho mỗi error
- Tạo error troubleshooting guide
- Link errors với relevant documentation

### DOC-05: Workflow Walkthrough Guides
**Requirement:** Tạo text-based walkthrough guides cho workflow phổ biến  
**Chi tiết:**
- `docs/workflows/getting-started.md` — Workflow cho người mới
- `docs/workflows/bug-fixing.md` — Workflow debug và fix bug
- `docs/workflows/milestone-management.md` — Quản lý milestone
- Mỗi guide: step-by-step với commands, expected outputs, và decision points

### DOC-06: Skill Reference Cards
**Requirement:** Tạo quick reference cards cho mỗi skill  
**Chi tiết:**
- Một file ngắn (200-300 words) cho mỗi skill
- Structure: Purpose → When to use → Prerequisites → Basic command → Common flags → See also
- Đặt trong `docs/skills/`

## Deferred (Future Milestones)

- Video tutorials — out of scope for v11.1
- Interactive documentation — requires tooling not in repo
- Multi-language docs — focus on English first

## Out of Scope

- Rewriting skills from scratch — improve docs only
- Breaking changes to commands — maintain backward compatibility
- New platform targets — focus on Claude Code

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DOC-01 | 100 | Not started |
| DOC-02 | 101 | Not started |
| DOC-03 | 102 | Not started |
| DOC-04 | 103 | Not started |
| DOC-05 | 104 | Not started |
| DOC-06 | 105 | Not started |

*Traceability sẽ được cập nhật trong ROADMAP.md*
