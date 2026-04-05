---
phase: "106"
name: "I18N-01 — README Song Ngữ"
date: "2026-04-04"
mode: auto
---

# Phase 106 Context

## Phase Goal
Tạo phiên bản README tiếng Việt song song với bản tiếng Anh.

## Success Criteria (from ROADMAP.md)
1. File `README.vi.md` với nội dung đầy đủ
2. Liên kết chuyển đổi ngôn ngữ ở đầu mỗi file
3. Giữ nguyên cấu trúc và format

## Gray Areas & Decisions

### [auto] Translation Approach
**Decision:** Technical commands và code examples giữ nguyên tiếng Anh, chỉ dịch explanations và descriptions.

**Rationale:**
- Các commands như `/pd:init`, `/pd:plan` là tên gọi cố định, không dịch
- Code examples giữ nguyên để đảm bảo copy-paste hoạt động
- Descriptions và explanations dịch sang tiếng Việt để dễ hiểu

### [auto] File Naming Convention
**Decision:** Sử dụng `.vi.md` suffix cho tất cả file tiếng Việt.

**Rationale:**
- Pattern nhất quán với internationalization standards
- Dễ dàng detect và switch giữa các ngôn ngữ
- Align với common practices (e.g., README.fr.md, README.de.md)

### [auto] Language Switcher UI
**Decision:** Badge-style links ở đầu file, ngay dưới badges version/license.

**Format:**
```markdown
[English](README.md) | [Tiếng Việt](README.vi.md)
```

**Rationale:**
- Đơn giản, không cần JavaScript
- Hoạt động trên tất cả Markdown renderers (GitHub, GitLab, etc.)
- Dễ maintain

### [auto] Terminology Handling
**Decision:** Giữ các thuật ngữ kỹ thuật quan trọng bằng tiếng Anh trong lần đầu xuất hiện, sau đó có thể dùng tiếng Việt.

**Ví dụ:**
- "AI coding CLI" → giữ nguyên, có thể thêm giải thích
- "MCP server" → giữ nguyên
- "workflow" → có thể dùng "quy trình làm việc"

### [auto] Content Scope
**Decision:** Dịch toàn bộ README.md hiện tại (~33KB), không bỏ sót section nào.

**Các sections cần dịch:**
1. Quick Start
2. Prerequisites Checklist
3. Table of Contents
4. Supported Platforms
5. Requirements
6. Installation
7. Uninstallation
8. Updating
9. After Installation
10. Skills Reference
11. Workflow Diagram
12. `.planning/` Structure
13. Cross-Platform Architecture
14. MCP Servers
15. Security
16. Commit Conventions
17. Status Icons
18. Supported Tech Stacks
19. Evaluation Suite
20. Additional Documentation
21. License

## Prior Decisions Applied
- Bilingual approach đã được xác nhận trong PROJECT.md
- Giữ bản tiếng Anh, thêm bản tiếng Việt song song
- Không thay thế, chỉ bổ sung

## Canonical References
- `README.md` — Source of truth cho nội dung cần dịch
- `CLAUDE.md` — Tham khảo cách dùng thuật ngữ trong project

## Notes for Researcher/Planner
- Không cần nghiên cứu thêm — task rõ ràng là dịch thuật
- Cần đảm bảo giữ nguyên tất cả links và references
- Các commands và flags giữ nguyên
- Tables và formatting giữ nguyên structure
