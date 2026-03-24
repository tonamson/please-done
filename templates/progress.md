# Mẫu PROGRESS.md

> `/pd:write-code` tạo + cập nhật | `/pd:write-code` đọc (khôi phục), `/pd:what-next` đọc

Điểm khôi phục khi phiên viết code bị gián đoạn. Lưu tại `.planning/milestones/[version]/phase-[phase]/PROGRESS.md`.

**Vòng đời:** Tạo khi bắt đầu task → cập nhật sau mỗi file/giai đoạn → xóa sau commit thành công.

## Mẫu

```markdown
# Tiến trình thực thi
> Cập nhật: [DD_MM_YYYY HH:MM]
> Task: [N] — [Tên task]
> Giai đoạn: [Bắt đầu | Đọc context | Viết code | Lint/Build | Tạo báo cáo | Commit]

## Các bước
- [x] Chọn task
- [ ] Đọc context + nghiên cứu
- [ ] Viết code
- [ ] Lint + Build
- [ ] Tạo báo cáo
- [ ] Commit

## Files dự kiến
(Từ TASKS.md `> Files:`)

## Files đã viết
(Cập nhật sau mỗi file — xác định cần viết thêm gì nếu gián đoạn)

## Logic Changes (nếu có)
<!-- CHỈ tạo khi phát hiện logic nghiệp vụ cần điều chỉnh. Không có → KHÔNG tạo section này. -->
| Truth ID | Thay đổi | Lý do |
|----------|---------|-------|
```

## Quy tắc

- PHẢI tạo khi bắt đầu task mới — trước khi viết code
- PHẢI cập nhật sau mỗi file + sau mỗi bước (`> Giai đoạn:` + `> Cập nhật:`)
- Xóa `rm -f` sau commit thành công
- Task 🔄 có PROGRESS.md → khôi phục (Bước 1.1 Case 1)
- Task 🔄 KHÔNG có PROGRESS.md → Bước 2, tạo mới
- Không có logic change → KHÔNG tạo section "Logic Changes" (D-14)
