# Phase 17: Truth Protocol - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-23
**Phase:** 17-truth-protocol
**Areas discussed:** Column naming, Logic Reference, BLOCK cho mọi task

---

## Column Naming

### Ngôn ngữ cột

| Option | Description | Selected |
|--------|-------------|----------|
| Tiếng Việt | Nhất quán với template hiện tại | ✓ |
| Tiếng Anh | Ngắn gọn hơn, dễ parse hơn | |
| Hybrid | Cột cũ Việt, cột mới Anh | |

**User's choice:** Tiếng Việt
**Notes:** Giữ nhất quán với toàn bộ template hệ thống đang dùng tiếng Việt

### Nội dung "Giá trị nghiệp vụ"

| Option | Description | Selected |
|--------|-------------|----------|
| Tại sao | Giải thích tại sao logic tồn tại từ góc nhìn business | ✓ |
| Stakeholder impact | Nêu rõ ai bị ảnh hưởng và thế nào | |
| Câu hỏi kiểm tra | Một câu hỏi business-level có/không | |

**User's choice:** Tại sao
**Notes:** None

### Format "Trường hợp biên"

| Option | Description | Selected |
|--------|-------------|----------|
| Liệt kê ngắn | Danh sách ngắn, cách nhau bằng dấu phẩy | ✓ |
| Scenario kèm kết quả | Mỗi edge case kèm expected behavior | |
| Claude quyết định | AI tự chọn format phù hợp theo từng plan | |

**User's choice:** Liệt kê ngắn
**Notes:** None

---

## Logic Reference

| Option | Description | Selected |
|--------|-------------|----------|
| Cùng 1 thứ | "Logic Reference" = trường "Truths" đã có, không thêm field mới | ✓ |
| Khác nhau | Thêm field mới "Logic Reference" riêng biệt bên cạnh "Truths" | |

**User's choice:** Cùng 1 thứ
**Notes:** Trường Truths đã có trong tasks template, chỉ cần ép bắt buộc qua plan-checker

---

## BLOCK cho mọi task

### Infrastructure task exemption

| Option | Description | Selected |
|--------|-------------|----------|
| BLOCK tất cả | Mọi task phải có Truth, kể cả infrastructure | ✓ |
| BLOCK + exempt list | Cho phép tag đặc biệt 'infra' hoặc 'none' | |
| Giữ WARN | Không nâng severity | |

**User's choice:** BLOCK tất cả
**Notes:** Infrastructure task gán vào Truth gần nhất mà nó phục vụ

### Plan-level behavior

| Option | Description | Selected |
|--------|-------------|----------|
| BLOCK toàn bộ plan | 1 task thiếu Truths = cả plan BLOCK | ✓ |
| BLOCK từng task | Chỉ report từng task, không block plan | |

**User's choice:** BLOCK toàn bộ plan
**Notes:** Nhất quán với triết lý "Không có Truth = Không có Code"

---

## Claude's Discretion

- Parser backward compatibility strategy (3-col vs 5-col)
- Converter snapshot regeneration order
- Test structure cho tests mới

## Deferred Ideas

None — discussion stayed within phase scope
