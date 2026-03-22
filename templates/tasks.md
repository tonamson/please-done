# Mẫu TASKS.md

> `/pd:plan` tạo | `/pd:write-code`, `/pd:test`, `/pd:fix-bug`, `/pd:what-next`, `/pd:complete-milestone` đọc

Danh sách công việc 1 phase: bảng tổng quan + chi tiết từng task.

Biểu tượng trạng thái: @references/conventions.md

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
> Trạng thái: ⬜ | Ưu tiên: Cao | Phụ thuộc: Không | Loại: Backend | Effort: standard
> Files: [danh sách files dự kiến]
> Truths: [T1, T2] ← truy vết Tiêu chí thành công PLAN.md

### Mô tả
[Công việc cần làm]

### Tiêu chí chấp nhận
- [ ] [Tiêu chí 1 — liên quan Truths]
- [ ] [Tiêu chí 2]

### Ghi chú kỹ thuật
[Chỉ khi cần thiết]
```

## Loại task

`Backend` | `Frontend` | `Fullstack` | `WordPress` | `Solidity` | `Flutter` | `[Stack khác]`

## Effort level

`simple` | `standard` | `complex`

Mặc định: `standard`. Xem @references/conventions.md → 'Effort level'.

## Truths (truy vết goal-backward)

Cột `Truths` + trường `> Truths:` = mã Truth từ PLAN.md "Tiêu chí thành công → Sự thật phải đạt".
- Mỗi task PHẢI phục vụ ≥1 Truth
- Mỗi Truth PHẢI được ≥1 task phủ
- Truth không task nào phủ → gap → thêm task hoặc sửa plan

## Phụ thuộc

| Loại | Cách ghi | Parallel-safe? |
|------|---------|---------------|
| Code | `Task A` | Không — B dùng function A tạo |
| Design | `Không` | Có — dùng response shape từ PLAN.md |
| File | `Task A (shared file)` | Không — sửa cùng file |

## Cập nhật trạng thái

- Cập nhật CẢ HAI: bảng Tổng quan + task detail `> Trạng thái:`
- Cập nhật `> Files:` nếu thực tế khác plan
- Chỉ ✅ SAU git commit thành công (@references/conventions.md)
