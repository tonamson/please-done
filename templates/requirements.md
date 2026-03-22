# Mẫu REQUIREMENTS.md

> `/pd:new-milestone` tạo | `/pd:plan`, `/pd:write-code`, `/pd:complete-milestone` đọc

## Mẫu

```markdown
# Yêu cầu: [Tên dự án]
> Ngày tạo: [DD_MM_YYYY]
> Milestone: v[X.Y] — [Tên milestone]

## Yêu cầu v1
Yêu cầu milestone hiện tại. Mỗi yêu cầu gắn 1 phase.

### [Nhóm 1]
- [ ] **NHOM1-01**: Người dùng có thể [hành động cụ thể, kiểm tra được]
- [ ] **NHOM1-02**: Người dùng có thể [hành động cụ thể, kiểm tra được]

### [Nhóm 2]
- [ ] **NHOM2-01**: Người dùng có thể [hành động cụ thể, kiểm tra được]

## Yêu cầu tương lai
Hoãn sang milestone sau.

- **NHOM-XX**: [mô tả]

## Ngoài phạm vi
| Tính năng | Lý do loại |
|-----------|-----------|

## Bảng theo dõi
| Yêu cầu | Phase | Trạng thái |
|----------|-------|------------|

**Độ phủ:**
- Yêu cầu v1: [X] tổng
- Đã gắn vào phase: —
- Chưa gắn: [X] (gắn khi tạo lộ trình)

---
*Tạo: [DD_MM_YYYY]*
*Cập nhật lần cuối: [DD_MM_YYYY]*
```

## Mã yêu cầu

Format: `[NHÓM]-[SỐ]` viết HOA, không dấu (VD: `AUTH-01`, `NOTIF-02`).
Có REQUIREMENTS.md cũ → tiếp tục đánh số. Tên nhóm 3-10 ký tự.

## Tiêu chí yêu cầu tốt

| Tiêu chí | Tốt | Xấu |
|----------|-----|-----|
| Cụ thể, kiểm tra được | "Đặt lại mật khẩu qua email" | "Xử lý mật khẩu" |
| Hướng người dùng | "Người dùng có thể X" | "Hệ thống làm Y" |
| Đơn lẻ | "Đăng nhập bằng email" | "Đăng nhập và quản lý hồ sơ" |
| Độc lập | Ít phụ thuộc | Cần 3 yêu cầu khác |
