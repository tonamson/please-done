# Mẫu PROJECT.md

> `/pd:new-milestone` tạo/cập nhật | Tất cả commands đọc (nguồn sự thật cấp dự án)

Nguồn sự thật duy nhất cấp dự án: tầm nhìn, đối tượng, ràng buộc, lịch sử milestones, bài học.

- `ROADMAP.md` = phases/deliverables (thay đổi mỗi milestone)
- `STATE.md` = trạng thái hiện tại (thay đổi liên tục)
- `PROJECT.md` = bức tranh toàn cảnh (ít thay đổi)

## Mẫu

```markdown
# [Tên dự án]
> Khởi tạo: [DD_MM_YYYY]
> Cập nhật: [DD_MM_YYYY]

## Tầm nhìn
[1-3 câu: dự án phục vụ ai, giải quyết vấn đề gì]

## Đối tượng người dùng
- [Nhóm 1]: [nhu cầu chính]
- [Nhóm 2]: [nhu cầu chính]

## Ràng buộc
[Kỹ thuật, kinh doanh, thời gian, pháp lý — hoặc "Chưa xác định ràng buộc đặc biệt."]

## Lịch sử Milestones
| Phiên bản | Tên | Ngày hoàn tất | Tóm tắt |
|-----------|-----|---------------|---------|
| v1.0 | [Tên] | DD_MM_YYYY | [1 dòng: chức năng chính] |

## Bài học kinh nghiệm
- [Bài học ảnh hưởng quyết định tương lai]
```

## Quy tắc cập nhật

| Thời điểm | Hành động |
|-----------|-----------|
| Tạo milestone mới | Thêm milestone vừa xong vào "Lịch sử". Cập nhật "Tầm nhìn" nếu đổi hướng |
| Đóng milestone | Thêm "Lịch sử" + "Bài học" nếu có |
| User yêu cầu | Cập nhật bất kỳ phần nào |

**KHÔNG ghi:** chi tiết phase/task (→ ROADMAP/TASKS), trạng thái (→ STATE/CURRENT_MILESTONE), kỹ thuật chi tiết (→ CONTEXT/SCAN_REPORT)
