# Mẫu PROGRESS.md

> Dùng bởi: `/pd:write-code` (tạo + cập nhật)
> Đọc bởi: `/pd:write-code` (khôi phục sau gián đoạn), `/pd:what-next` (hiển thị tiến trình)

## Mục đích

PROGRESS.md là **điểm khôi phục** khi phiên viết code bị gián đoạn (mất mạng, đóng phiên).
Chứa trạng thái thực thi task: giai đoạn hiện tại, files đã viết, files dự kiến.

**Vòng đời:**
- Tạo khi bắt đầu task mới (Bước 1.1)
- Cập nhật sau mỗi file viết xong + sau mỗi giai đoạn hoàn tất
- Xóa sau commit thành công (Bước 7) — task hoàn tất, không cần khôi phục

**Đường dẫn:** `.planning/milestones/[version]/phase-[phase]/PROGRESS.md`

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
(Lấy từ task detail `> Files:` trong TASKS.md)

## Files đã viết
(Cập nhật sau mỗi file hoàn tất — dùng để xác định cần viết thêm gì nếu bị gián đoạn)
```

## Quy tắc

- PHẢI tạo PROGRESS.md khi bắt đầu task mới — trước khi viết code
- PHẢI cập nhật sau mỗi file viết xong (thêm vào "Files đã viết")
- PHẢI cập nhật `> Giai đoạn:` + `> Cập nhật:` sau mỗi bước hoàn tất
- Xóa bằng `rm -f` sau commit thành công
- Nếu task 🔄 có PROGRESS.md → write-code dùng để khôi phục (Bước 1.1 Case 1)
- Nếu task 🔄 KHÔNG có PROGRESS.md → write-code bắt đầu từ Bước 2, tạo PROGRESS.md mới
