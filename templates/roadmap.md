# Mẫu ROADMAP.md

> `/pd:new-milestone` tạo/cập nhật | `/pd:plan`, `/pd:write-code`, `/pd:complete-milestone`, `/pd:what-next` đọc

## Mẫu

```markdown
# Lộ trình dự án
> Dự án: [tên]
> Ngày tạo: [DD_MM_YYYY]
> Cập nhật lần cuối: [DD_MM_YYYY]

## Mục tiêu dự án
[Mô tả ngắn — copy từ PROJECT.md "Tầm nhìn"]

## Milestones

### Milestone 1: [Tên] (v1.0)
> Trạng thái: ⬜ | Ưu tiên: Quan trọng

#### Phase 1.1: [Tên]
- [ ] Sản phẩm bàn giao 1
- [ ] Sản phẩm bàn giao 2
- Yêu cầu: AUTH-01, AUTH-02
- Tiêu chí thành công:
  1. [Người dùng có thể... → kết quả quan sát được]
  2. [Người dùng có thể... → kết quả quan sát được]
- Phụ thuộc: Không

#### Phase 1.2: [Tên]
- [ ] Sản phẩm bàn giao 1
- Yêu cầu: PROF-01, PROF-02
- Tiêu chí thành công:
  1. [tiêu chí quan sát được]
- Phụ thuộc: Phase 1.1

### Milestone 2: [Tên] (v1.1)
> Trạng thái: ⬜ | Ưu tiên: Cao
...

## Quyết định chiến lược
| # | Vấn đề | Quyết định | Lý do | Phương án đã loại |
|---|--------|-----------|-------|-------------------|

## Rủi ro & Lưu ý
```

## Quy tắc Phase

Mỗi phase PHẢI có: Mục tiêu (1 câu), Sản phẩm bàn giao (checkbox), Mã yêu cầu (từ REQUIREMENTS.md), Tiêu chí thành công (2-5), Phụ thuộc.

## Quy tắc phiên bản

| Loại | Khi nào |
|------|---------|
| Lớn | Bộ tính năng hoàn chỉnh mới (1.0 → 2.0) |
| Nhỏ | Tính năng bổ sung (1.0 → 1.1) |

Ghi lý do vào bảng Quyết định chiến lược.

## Quy tắc ưu tiên

Quan trọng (không có → không hoạt động) | Cao (cần cho trải nghiệm tối thiểu) | Trung bình (cải thiện, có thể hoãn) | Thấp (nâng cao)

## GHI ĐÈ vs VIẾT TIẾP

**GHI ĐÈ:** Viết mới toàn bộ.
**VIẾT TIẾP:** Giữ milestones cũ nguyên → thêm mới SAU milestone cuối → cập nhật `Cập nhật lần cuối`.

## Kiểm tra độ phủ (BẮT BUỘC)

MỌI yêu cầu v1 PHẢI gắn vào **đúng 1 phase**. Chưa gắn = lỗi → DỪNG sửa. 1 yêu cầu gắn 2+ phases = lỗi → chọn phase chính.
Viết tiếp: phiên bản milestones mới KHÔNG trùng milestones đã có.
