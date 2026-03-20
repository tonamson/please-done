# Mẫu REQUIREMENTS.md

> Dùng bởi: `/pd:new-milestone` (tạo)
> Đọc bởi: `/pd:plan`, `/pd:write-code`, `/pd:complete-milestone`

## Mẫu

```markdown
# Yêu cầu: [Tên dự án]
> Ngày tạo: [DD_MM_YYYY]
> Milestone: v[X.Y] — [Tên milestone]

## Yêu cầu v1
Yêu cầu cho milestone hiện tại. Mỗi yêu cầu gắn vào 1 phase trong lộ trình.

### [Nhóm 1]
- [ ] **NHOM1-01**: Người dùng có thể [hành động cụ thể, kiểm tra được]
- [ ] **NHOM1-02**: Người dùng có thể [hành động cụ thể, kiểm tra được]

### [Nhóm 2]
- [ ] **NHOM2-01**: Người dùng có thể [hành động cụ thể, kiểm tra được]

## Yêu cầu tương lai
Hoãn sang milestone sau. Theo dõi nhưng không nằm trong lộ trình hiện tại.

- **NHOM-XX**: [mô tả]

## Ngoài phạm vi
Loại trừ rõ ràng. Ghi lý do để tránh thêm lại.

| Tính năng | Lý do loại |
|-----------|-----------|

## Bảng theo dõi
Yêu cầu nào thuộc phase nào. Điền tự động khi tạo lộ trình.

| Yêu cầu | Phase | Trạng thái |
|----------|-------|------------|

**Độ phủ:**
- Yêu cầu v1: [X] tổng
- Đã gắn vào phase: —
- Chưa gắn: [X] (sẽ gắn khi tạo lộ trình)

---
*Tạo: [DD_MM_YYYY]*
*Cập nhật lần cuối: [DD_MM_YYYY]*
```

## Mã yêu cầu

Format: `[NHÓM]-[SỐ]` viết HOA, không dấu.
- VD: `AUTH-01`, `NOTIF-02`, `CONT-03`, `THANHTOAN-01`
- Nếu có REQUIREMENTS.md cũ → tiếp tục đánh số từ mã cuối
- Tên nhóm nên ngắn (3-10 ký tự), dễ nhận diện

## Tiêu chí yêu cầu tốt

| Tiêu chí | Tốt | Xấu |
|----------|-----|-----|
| Cụ thể, kiểm tra được | "Người dùng có thể đặt lại mật khẩu qua email" | "Xử lý mật khẩu" |
| Hướng người dùng | "Người dùng có thể X" | "Hệ thống làm Y" |
| Đơn lẻ | "Đăng nhập bằng email" | "Đăng nhập và quản lý hồ sơ" |
| Độc lập | Ít phụ thuộc yêu cầu khác | Cần 3 yêu cầu khác mới test được |
