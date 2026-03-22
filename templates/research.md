# Mẫu RESEARCH.md

> `/pd:plan` tạo (Bước 3) | `/pd:plan` (Bước 4), `/pd:write-code` đọc

Kết quả nghiên cứu cấp phase — code hiện có + hệ sinh thái. Lưu tại `.planning/milestones/[version]/phase-[phase]/RESEARCH.md`.

- `.planning/research/SUMMARY.md` = nghiên cứu tổng quan milestone (`/pd:new-milestone`)
- `RESEARCH.md` = nghiên cứu chi tiết 1 phase (`/pd:plan`)

## Mẫu

```markdown
# Nghiên cứu Phase [x.x]
> Ngày: [DD_MM_YYYY]
> Deliverables: [tóm tắt từ ROADMAP]
> Độ tin cậy tổng: [CAO | TRUNG BÌNH | THẤP]

## Code hiện có

### Thư viện đã cài
| Tên | Phiên bản | Liên quan đến phase |
|-----|-----------|---------------------|

### Code tái sử dụng
| Function/Service | File | Mô tả |
|------------------|------|-------|

### Patterns đang dùng
[Patterns backend/frontend/DB hiện tại mà phase cần tuân theo]

## Hệ sinh thái

### Thư viện đề xuất
| Thư viện | Phiên bản | Mục đích | Lý do chọn | Thay thế đã loại |
|----------|-----------|----------|-------------|-------------------|

### Không nên tự code
| Vấn đề | Đừng tự viết | Dùng thay thế | Lý do |
|--------|--------------|---------------|-------|

### Cạm bẫy thường gặp
| Cạm bẫy | Hậu quả | Cách phòng | Dấu hiệu nhận biết |
|----------|---------|------------|---------------------|

### Xu hướng mới
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
- **Code hiện có** LUÔN tạo nếu project đã có code
- **Hệ sinh thái** CHỈ khi dùng thư viện mới / domain phức tạp. Phase đơn giản → "Dùng stack có sẵn."
- Giữ ngắn gọn — tham khảo, không phải tutorial
- Độ tin cậy: **CAO** = Context7/FastCode/docs chính thức | **TRUNG BÌNH** = WebSearch + verify | **THẤP** = kiến thức Claude chưa verify
