---
name: pd:write-code
description: Viết code theo task đã plan trong TASKS.md, lint, build, commit và báo cáo (yêu cầu có PLAN.md + TASKS.md trước)
model: sonnet
argument-hint: "[task number] [--auto | --parallel]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent
  - AskUserQuestion
  - mcp__fastcode__code_qa
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
---
<!-- Audit 2026-03-23: Intentional -- Agent tool required for --parallel mode multi-agent execution. See Phase 14 Audit I4. -->

<objective>
Viết mã nguồn (code) theo các công việc (tasks) trong `PLAN.md` và `TASKS.md`, tuân thủ `.planning/rules/`, chạy kiểm tra lỗi cú pháp (lint) + biên dịch (build) rồi commit.

**Chế độ:** Mặc định thực hiện 1 task -> dừng hỏi | `--auto`: thực hiện tất cả tuần tự | `--parallel`: thực hiện song song theo đợt (waves) bằng đa tác tử.
**Khôi phục:** Tự động phát hiện tiến trình qua `PROGRESS.md` + trạng thái tệp tin/git -> tiếp tục từ điểm bị dừng.
**Sau khi xong:** Chạy `/pd:test`, `/pd:plan [phase tiếp]`, hoặc `/pd:complete-milestone`.
</objective>

<guards>
Dừng và hướng dẫn người dùng nếu bất kỳ điều kiện nào sau đây thất bại:

@references/guard-context.md
- [ ] Số thứ tự task hợp lệ hoặc có cờ `--auto`/`--parallel` -> "Cung cấp số task hoặc cờ chế độ."
- [ ] `PLAN.md` và `TASKS.md` tồn tại cho giai đoạn (phase) hiện tại -> "Chạy `/pd:plan` trước để tạo kế hoạch."
@references/guard-fastcode.md
@references/guard-context7.md
</guards>

<context>
Dữ liệu nhập: $ARGUMENTS
- Số thứ tự task (VD: `3`) -> thực hiện task cụ thể.
- `--auto` -> thực hiện tuần tự | `--parallel` -> thực hiện song song | Kết hợp: `3 --auto`.
- Không có gì -> chọn task tiếp theo ⬜, xong 1 task thì DỪNG để hỏi ý kiến người dùng.

Đọc thêm:
- `.planning/PROJECT.md` -> tầm nhìn, ràng buộc dự án.
- `.planning/rules/general.md` -> quy tắc chung (luôn đọc).
- `.planning/rules/{nestjs,nextjs,wordpress,solidity,flutter}.md` -> theo công nghệ (CHỈ nếu tồn tại).
</context>

<execution_context>
@workflows/write-code.md (required)
@references/conventions.md (required)
@references/prioritization.md (optional)
@references/ui-brand.md (optional)
@references/security-checklist.md (optional)
@references/verification-patterns.md (optional)
@templates/progress.md (optional)
@references/context7-pipeline.md (optional)
</execution_context>

<process>
Thực hiện quy trình @workflows/write-code.md từ đầu đến cuối. Logic chọn task, viết mã, kiểm tra lỗi, bảo mật, commit và cập nhật trạng thái nằm trong quy trình này.
</process>

<output>
**Tạo/Cập nhật:**
- Mã nguồn và các tệp kiểm thử theo task.
- Cập nhật `TASKS.md` và `PROGRESS.md`.

**Bước tiếp theo:** `/pd:test`, `/pd:plan [phase tiếp]`, hoặc `/pd:complete-milestone`.

**Thành công khi:**
- Mã nguồn đã viết xong, lint và build đều vượt qua (pass).
- Công việc được đánh dấu hoàn thành trong `TASKS.md`.
- Commit có thông điệp (message) rõ ràng.

**Lỗi thường gặp:**
- Lỗi lint hoặc build -> đọc thông báo lỗi, sửa mã rồi chạy lại.
- Công việc chưa rõ ràng -> hỏi người dùng qua `AskUserQuestion`.
- MCP không kết nối -> kiểm tra dịch vụ và cấu hình.
</output>

<rules>
- Mọi kết quả đầu ra PHẢI bằng tiếng Việt có dấu.
- PHẢI đọc và tuân thủ quy tắc trong `.planning/rules/` trước khi viết mã.
- PHẢI chạy lint và build sau khi viết mã.
- PHẢI commit sau khi hoàn thành mỗi task.
- KHÔNG được thay đổi mã nguồn ngoài phạm vi của task đang thực hiện.
</rules>
