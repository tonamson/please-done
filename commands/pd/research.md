---
name: pd:research
description: Nghiên cứu tự động — phân loại internal/external, thu thập bằng chứng, xác minh và cross-validate
model: sonnet
argument-hint: "[chủ đề cần nghiên cứu]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
---

<objective>
Nghiên cứu 1 chủ đề tự động: phân loại internal/external, chạy pipeline Evidence Collector -> Fact Checker, cross-validate khi có cả 2 loại. Sau khi xong: Hiển thị tóm tắt kết quả.

**Sau khi xong:** `/pd:what-next`
</objective>

<guards>
Dừng và hướng dẫn người dùng nếu bất kỳ điều kiện nào sau đây thất bại:

@references/guard-context.md
- [ ] Có chủ đề nghiên cứu được cung cấp -> "Hãy cung cấp chủ đề cần nghiên cứu."
</guards>

<context>
Người dùng nhập: $ARGUMENTS
</context>

<execution_context>
@workflows/research.md (required)
@references/conventions.md (required)
</execution_context>

<process>
Thực thi @workflows/research.md từ đầu đến cuối.
</process>

<output>
**Tạo/Cập nhật:**
- Research file trong `.planning/research/internal/` hoặc `external/`
- Verification file từ Fact Checker
- `INDEX.md` cập nhật
- `AUDIT_LOG.md` cập nhật

**Bước tiếp theo:** `/pd:what-next`

**Thành công khi:**
- Research file có frontmatter đầy đủ
- Fact Checker đã xác minh
- Tóm tắt hiển thị cho user

**Lỗi thường gặp:**
- Không phân loại được chủ đề -> mặc định external
- Evidence Collector không tìm được nguồn -> tiếp tục với confidence LOW
- MCP không kết nối -> kiểm tra cấu hình
</output>

<rules>
- Mọi output PHẢI bằng tiếng Việt có dấu
- PHẢI chạy pipeline đầy đủ: route -> collect -> verify
- KHÔNG skip Fact Checker khi Collector fail — chạy với confidence LOW
</rules>
</output>
