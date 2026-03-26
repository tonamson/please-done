---
name: pd:audit
description: Quét bảo mật OWASP — dispatch 13 scanner song song và tổng hợp báo cáo
model: opus
argument-hint: "[path] [--full|--only cat1,cat2|--poc|--auto-fix]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - mcp__fastcode__code_qa
  - SubAgent
---

<objective>
Quét bảo mật toàn diện dựa trên OWASP Top 10. Dispatch 13 scanner song song (2/wave), tổng hợp báo cáo, phân tích chéo.
</objective>

<guards>
Tự động phát hiện chế độ hoạt động TRƯỚC khi chạy guards:

1. Kiểm tra `.planning/PROJECT.md` tồn tại (dùng Bash: `test -f .planning/PROJECT.md`)
2. Tồn tại → mode = "tich-hop": chạy đầy đủ 3 guards bên dưới
3. Không tồn tại → mode = "doc-lap": bỏ qua guard-context, chỉ chạy 2 guards còn lại (guard-valid-path, guard-fastcode)

Dừng và hướng dẫn người dùng nếu bất kỳ guard nào thất bại:

@references/guard-context.md (chỉ chế độ tích hợp)
@references/guard-valid-path.md
@references/guard-fastcode.md
</guards>

<context>
Người dùng nhập: $ARGUMENTS
</context>

<execution_context>
@workflows/audit.md (required)
</execution_context>

<process>
Thực thi @workflows/audit.md từ đầu đến cuối. Truyền $ARGUMENTS cho workflow.
</process>

<output>
**Tạo:**
- SECURITY_REPORT.md (vị trí tùy mode: doc-lap → ./, tich-hop → .planning/audit/)
- Evidence files trong temp dir

**Bước tiếp theo:** Đọc SECURITY_REPORT.md để xem kết quả

**Thành công khi:**
- Tất cả scanners đã dispatch và trả kết quả (hoặc inconclusive)
- SECURITY_REPORT.md đã tạo tại đúng vị trí

**Lỗi thường gặp:**
- FastCode MCP không kết nối → kiểm tra Docker đang chạy
- SubAgent không khả dụng → kiểm tra cấu hình tool cho phép SubAgent
</output>

<rules>
- Mọi output PHẢI bằng tiếng Việt có dấu
- KHÔNG sửa code của dự án — chỉ quét và báo cáo
- Khi --poc hoặc --auto-fix được truyền: thông báo "Chưa hỗ trợ trong phiên bản này" và tiếp tục
</rules>
