---
phase: 100
name: DOC-01 — README Quick Start Guide
milestone: v11.1
requirement: DOC-01
created: 2026-04-04
---

# Phase 100 Context: README Quick Start Guide

## Goal
Cải thiện README.md với quick start guide rõ ràng, giúp developer mới dễ dàng bắt đầu sử dụng các skill commands.

## Requirements Reference
- DOC-01: README Quick Start Guide (từ REQUIREMENTS.md)

## Decisions Locked

### Content Structure
1. **Quick Start Section** (đặt ngay sau header)
   - 3-5 lệnh cơ bản nhất để bắt đầu
   - Mỗi lệnh có one-liner giải thích
   - Thứ tự: onboard → status → plan → execute

2. **Available Skills List**
   - Liệt kê tất cả 16 skills hiện có
   - Format: `command` — one-liner description
   - Group theo category: Core, Project, Debug, Utility

3. **Workflow Diagram**
   - Text-based diagram (ASCII/Mermaid)
   - Show flow: onboard → init → plan → write-code → test
   - Include decision points (failing tests → fix-bug)

4. **Prerequisites Checklist**
   - Claude Code CLI installed
   - Git repository initialized
   - Node.js (nếu cần)
   - Clear expectations

### Gray Areas Resolved

| Question | Decision | Rationale |
|----------|----------|-----------|
| How many commands in Quick Start? | 5 commands | Đủ để thấy workflow chính, không quá nhiều |
| Skills grouping? | 4 categories | Core (onboard, init), Project (plan, write-code), Debug (fix-bug, test), Utility (status, audit) |
| Diagram type? | Text-based ASCII | Không phụ thuộc external rendering |
| Prerequisites detail level? | Checklist format | Dễ scan, đủ thông tin để biết cần gì |

## Out of Scope (Deferred)

- Video tutorials → v11.x backlog
- Interactive examples → requires tooling not available
- Multi-language → focus English first

## Success Criteria

1. README có Quick Start section ngay đầu file
2. Liệt kê đủ 16 skills với description
3. Workflow diagram text-based hiển thị đúng
4. Prerequisites checklist rõ ràng
5. Không breaking changes với existing structure

## Technical Notes

- Target file: `/Volumes/Code/Nodejs/please-done/README.md`
- Keep existing content, insert new sections
- Follow existing markdown style
- Update table of contents nếu có

## Research Needed

1. Current README structure (để biết insert ở đâu)
2. Danh sách đầy đủ 16 skills (từ commands/)
3. Workflow patterns phổ biến (từ workflows/)

## Next Steps

1. Research current README và skill list
2. Draft Quick Start content
3. Create workflow diagram
4. Update README với new sections
5. Verify all links work
