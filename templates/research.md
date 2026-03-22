# Mẫu RESEARCH.md

> Dùng bởi: `/pd:plan` (tạo ở Bước 3)
> Đọc bởi: `/pd:plan` (Bước 4 thiết kế), `/pd:write-code` (tham khảo khi code)

## Mục đích

RESEARCH.md là **kết quả nghiên cứu cấp phase** — lưu lại những gì Claude tìm hiểu được TRƯỚC khi thiết kế. Gồm 2 phần:
- **Code hiện có**: patterns, utilities, schema đang dùng trong dự án
- **Hệ sinh thái**: thư viện nên dùng, cạm bẫy cần tránh, xu hướng mới

**Phân biệt với research cấp milestone:**
- `.planning/research/SUMMARY.md` = nghiên cứu tổng quan cho toàn bộ milestone (tạo bởi `/pd:new-milestone`)
- `.planning/milestones/[version]/phase-[phase]/RESEARCH.md` = nghiên cứu chi tiết cho 1 phase cụ thể (tạo bởi `/pd:plan`)

**Vị trí:** `.planning/milestones/[version]/phase-[phase]/RESEARCH.md`

## Mẫu

```markdown
# Nghiên cứu Phase [x.x]
> Ngày: [DD_MM_YYYY]
> Deliverables: [tóm tắt deliverables từ ROADMAP]
> Độ tin cậy tổng: [CAO | TRUNG BÌNH | THẤP]

## Code hiện có

### Thư viện đã cài
| Tên | Phiên bản | Liên quan đến phase |
|-----|-----------|---------------------|

### Code tái sử dụng
| Function/Service | File | Mô tả |
|------------------|------|-------|

### Patterns đang dùng
[Mô tả ngắn patterns backend/frontend/DB hiện tại mà phase này cần tuân theo]

## Hệ sinh thái

### Thư viện đề xuất
| Thư viện | Phiên bản | Mục đích | Lý do chọn | Thay thế đã loại |
|----------|-----------|----------|-------------|-------------------|

### Không nên tự code
<!-- Những vấn đề TRÔNG đơn giản nhưng có giải pháp sẵn — tự code sẽ gặp edge cases -->
| Vấn đề | Đừng tự viết | Dùng thay thế | Lý do |
|--------|--------------|---------------|-------|

### Cạm bẫy thường gặp
<!-- Lỗi phổ biến khi triển khai loại feature này — cảnh báo TRƯỚC khi code -->
| Cạm bẫy | Hậu quả | Cách phòng | Dấu hiệu nhận biết |
|----------|---------|------------|---------------------|

### Xu hướng mới
<!-- Gì đã thay đổi gần đây? Gì đã lỗi thời? -->
| Cách cũ | Cách mới | Ảnh hưởng |
|---------|---------|-----------|

## Nguồn tham khảo
| Nguồn | Độ tin cậy | Ghi chú |
|-------|------------|---------|
| [Context7: library-id] | CAO | [topics tra cứu] |
| [FastCode: query] | CAO | [code patterns tìm thấy] |
| [Docs local: file] | CAO | [sections đọc] |
| [Kiến thức Claude] | THẤP | [cần verify khi code] |
```

## Quy tắc

- **CHỈ tạo sections có dữ liệu** — bỏ sections rỗng
- **Code hiện có** LUÔN tạo nếu project đã có code (dù chỉ 1 bảng)
- **Hệ sinh thái** CHỈ tạo khi phase dùng thư viện mới hoặc domain phức tạp
- Nếu phase đơn giản (chỉ CRUD cơ bản, dùng thư viện đã có) → section "Hệ sinh thái" có thể chỉ ghi: "Phase này dùng stack có sẵn, không cần thư viện mới."
- Giữ ngắn gọn — RESEARCH.md là tham khảo, không phải tutorial
- Độ tin cậy nguồn: **CAO** = Context7/FastCode/docs chính thức, **TRUNG BÌNH** = WebSearch + verify, **THẤP** = kiến thức Claude chưa verify
