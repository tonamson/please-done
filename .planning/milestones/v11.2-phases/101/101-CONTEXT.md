---
phase: 101
name: DOC-02 — Command Cheat Sheet
milestone: v11.1
requirement: DOC-02
created: 2026-04-04
---

# Phase 101 Context: Command Cheat Sheet

## Goal
Tạo command cheat sheet cho các lệnh thường dùng của Please Done, giúp developer nhanh chóng tra cứu cú pháp và ví dụ.

## Requirements Reference
- DOC-02: Command Cheat Sheet (từ REQUIREMENTS.md)

## Decisions Locked

### Content Structure
1. **File Location**
   - Target: `docs/cheatsheet.md`
   - New file (doesn't exist yet)

2. **Format**
   - Markdown tables: `command | usage | example`
   - Each command on one row for easy scanning
   - Code formatting cho commands và examples

3. **Categories (4 groups)**
   - **Project** — Quản lý project (onboard, init, scan, new-milestone, complete-milestone)
   - **Planning** — Lập kế hoạch (plan)
   - **Execution** — Thực thi (write-code, test)
   - **Debug** — Debug và analysis (fix-bug, audit, research)
   - **Utility** — Tiện ích (status, conventions, fetch-doc, update, what-next)

4. **Popular Flags/Options**
   - `--auto` — Auto-execute without prompts
   - `--wave N` — Execute specific wave
   - `--skip-research` — Skip research phase
   - `--skip-verify` — Skip verification

5. **Printable Format**
   - Clean markdown tables
   - No external dependencies
   - Works when rendered to PDF or printed

### Gray Areas Resolved

| Question | Decision | Rationale |
|----------|----------|-----------|
| How many commands per category? | All 16 commands | Đầy đủ reference cho tất cả skills |
| Include flags in table? | Yes, in usage column | Cú pháp đầy đủ cho quick reference |
| Include examples? | Yes, 1 example per command | Thực tế và dễ hiểu |
| Format cho flags? | `[--flag]` optional, `--flag value` required | Standard CLI convention |
| Printable = ? | Clean tables, no colors | Markdown tables render well in PDF |

## Out of Scope (Deferred)

- PDF generation → v11.x backlog (tự tạo từ markdown)
- Interactive cheat sheet → requires tooling
- Auto-update từ code → manual maintenance

## Success Criteria

1. File `docs/cheatsheet.md` exists với markdown tables
2. 16 commands được group theo 5 categories
3. Mỗi command có: command name, usage syntax, example
4. Popular flags được document cho mỗi command
5. Format printable (clean markdown tables)

## Technical Notes

- Target file: `/Volumes/Code/Nodejs/please-done/docs/cheatsheet.md`
- Create new file, không modify existing
- Follow markdown table syntax: `| col1 | col2 | col3 |`
- Use code blocks cho examples nếu cần

## Research Needed

1. Current commands và flags từ commands/pd/
2. Ví dụ thực tế từ README.md hoặc documentation hiện có

## Next Steps

1. Research command syntax từ existing docs
2. Design table structure
3. Create cheatsheet.md với all sections
4. Verify formatting và links
