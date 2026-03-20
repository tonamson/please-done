# Mẫu PROJECT.md

> Dùng bởi: `/pd:new-milestone` (tạo/cập nhật)
> Đọc bởi: tất cả commands (nguồn sự thật cấp dự án)

## Mục đích

PROJECT.md là **nguồn sự thật duy nhất cấp dự án**, lưu:
- Tầm nhìn + mục tiêu dài hạn (không đổi giữa các milestones)
- Đối tượng người dùng + ràng buộc
- Lịch sử milestones đã hoàn tất
- Bài học kinh nghiệm tích lũy

**Phân biệt với các file khác:**
- `ROADMAP.md` = chi tiết phases/deliverables (thay đổi mỗi milestone)
- `STATE.md` = trạng thái làm việc hiện tại (thay đổi liên tục)
- `PROJECT.md` = bức tranh toàn cảnh (ít thay đổi)

## Mẫu

```markdown
# [Tên dự án]
> Khởi tạo: [DD_MM_YYYY]
> Cập nhật: [DD_MM_YYYY]

## Tầm nhìn
[1-3 câu: dự án tồn tại để làm gì, phục vụ ai, giải quyết vấn đề gì]

## Đối tượng người dùng
- [Nhóm 1]: [mô tả ngắn — nhu cầu chính]
- [Nhóm 2]: [mô tả ngắn — nhu cầu chính]

## Ràng buộc
[Nếu có: ràng buộc kỹ thuật, kinh doanh, thời gian, pháp lý]
[Nếu không có: "Chưa xác định ràng buộc đặc biệt."]

## Lịch sử Milestones

| Phiên bản | Tên | Ngày hoàn tất | Tóm tắt |
|-----------|-----|---------------|---------|
| v1.0 | [Tên] | DD_MM_YYYY | [1 dòng: chức năng chính đã giao] |
| v1.1 | [Tên] | DD_MM_YYYY | [1 dòng: chức năng chính đã giao] |

## Bài học kinh nghiệm
- [Bài học từ milestones trước — chỉ ghi những gì ảnh hưởng đến quyết định tương lai]
```

## Quy tắc cập nhật

| Thời điểm | Hành động |
|-----------|-----------|
| Tạo milestone mới | Thêm milestone vừa hoàn tất vào "Lịch sử". Cập nhật "Tầm nhìn" nếu user thay đổi hướng |
| Đóng milestone (`/pd:complete-milestone`) | Thêm dòng vào "Lịch sử" + "Bài học kinh nghiệm" nếu có |
| User yêu cầu | Cập nhật bất kỳ phần nào |

**KHÔNG ghi vào PROJECT.md:**
- Chi tiết phase/task (→ ROADMAP.md, TASKS.md)
- Trạng thái hiện tại (→ STATE.md, CURRENT_MILESTONE.md)
- Thông tin kỹ thuật chi tiết (→ CONTEXT.md, SCAN_REPORT.md)
