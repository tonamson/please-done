# Mẫu TASKS.md

> Dùng bởi: `/pd:plan` (tạo)
> Đọc bởi: `/pd:write-code`, `/pd:test`, `/pd:fix-bug`, `/pd:what-next`, `/pd:complete-milestone`

## Mục đích

TASKS.md là **danh sách công việc** cho 1 phase. Chứa:
- Bảng tổng quan (overview nhanh — đọc bởi what-next, complete-milestone)
- Chi tiết từng task (mô tả, files, tiêu chí, ghi chú — đọc bởi write-code)

## Biểu tượng trạng thái

Xem @references/conventions.md → "Biểu tượng trạng thái Task"

## Mẫu

```markdown
# Danh sách công việc
> Milestone: [tên] (v[x.x]) | Phase: [x.x]
> Ngày tạo: [DD_MM_YYYY] | Tổng: [N]

## Tổng quan
| # | Công việc | Trạng thái | Ưu tiên | Phụ thuộc | Loại | Truths |
|---|----------|-----------|---------|-----------|------|--------|

---
## Task 1: [Tên]
> Trạng thái: ⬜ | Ưu tiên: Cao | Phụ thuộc: Không | Loại: Backend
> Files: [danh sách files dự kiến tạo/sửa]
> Truths: [T1, T2] ← truy vết về Tiêu chí thành công nào trong PLAN.md

### Mô tả
[Mô tả công việc cần làm]

### Tiêu chí chấp nhận
- [ ] [Tiêu chí 1 — phải liên quan trực tiếp đến Truths ở trên]
- [ ] [Tiêu chí 2]

### Ghi chú kỹ thuật
[Nếu có — chỉ ghi khi cần thiết]
```

## Loại task

Giá trị hợp lệ: `Backend` | `Frontend` | `Fullstack` | `WordPress` | `Solidity` | `Flutter` | `[Stack khác]`

## Truths (truy vết goal-backward)

Cột `Truths` trong bảng + trường `> Truths:` trong task detail = danh sách mã Truth từ PLAN.md → "Tiêu chí thành công → Sự thật phải đạt".
- Mỗi task PHẢI phục vụ ít nhất 1 Truth
- Mỗi Truth PHẢI được phủ bởi ít nhất 1 task
- Nếu có Truth không được task nào phủ → gap → cần thêm task hoặc sửa plan

## Phụ thuộc (dependency)

| Loại | Cách ghi | Parallel-safe? |
|------|---------|---------------|
| **Phụ thuộc code** | `Task A` | Không — task B import/dùng function task A tạo |
| **Phụ thuộc design** | `Không` | Có — task Frontend dùng response shape từ PLAN.md |
| **Phụ thuộc file** | `Task A (shared file)` | Không — task B sửa cùng file task A |

## Quy tắc cập nhật trạng thái

- Cập nhật CẢ HAI nơi: (1) bảng Tổng quan, (2) task detail block `> Trạng thái:`
- Cập nhật `> Files:` nếu files thực tế khác files trong plan
- Chỉ đánh ✅ SAU khi git commit thành công (xem @references/conventions.md)
