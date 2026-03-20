# Mẫu ROADMAP.md

> Dùng bởi: `/pd:new-milestone` (tạo/cập nhật)
> Đọc bởi: `/pd:plan`, `/pd:write-code`, `/pd:complete-milestone`, `/pd:what-next`

## Mẫu

```markdown
# Lộ trình dự án
> Dự án: [tên]
> Ngày tạo: [DD_MM_YYYY]
> Cập nhật lần cuối: [DD_MM_YYYY]

## Mục tiêu dự án
[Mô tả ngắn gọn — copy từ PROJECT.md "Tầm nhìn"]

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

Mỗi phase PHẢI có đủ 5 thành phần:

| # | Thành phần | Bắt buộc | Mô tả |
|---|-----------|----------|-------|
| 1 | Mục tiêu | PHẢI | 1 câu mô tả phase đạt được gì |
| 2 | Sản phẩm bàn giao | PHẢI | Danh sách checkbox cụ thể |
| 3 | Mã yêu cầu | PHẢI | Gắn từ REQUIREMENTS.md |
| 4 | Tiêu chí thành công | PHẢI | 2-5 tiêu chí quan sát được |
| 5 | Phụ thuộc | PHẢI | "Không" hoặc "Phase X.Y" |

## Quy tắc phiên bản

| Loại | Khi nào | Ví dụ |
|------|---------|-------|
| Phiên bản lớn | Bộ tính năng hoàn chỉnh mới | 1.0 → 2.0 |
| Phiên bản nhỏ | Tính năng bổ sung | 1.0 → 1.1 |
| Ghi lý do | LUÔN ghi vào bảng Quyết định chiến lược | |

## Quy tắc ưu tiên

| Mức | Ý nghĩa |
|-----|---------|
| Quan trọng | Không có thì dự án không hoạt động |
| Cao | Cần thiết cho trải nghiệm tối thiểu |
| Trung bình | Cải thiện đáng kể nhưng có thể hoãn |
| Thấp | Nâng cao, có thì tốt |

## Quy tắc GHI ĐÈ vs VIẾT TIẾP

**GHI ĐÈ:** Viết mới toàn bộ ROADMAP.md.
**VIẾT TIẾP:** Giữ nguyên milestones cũ (KHÔNG sửa trạng thái/nội dung) → thêm milestones mới SAU milestone cuối → cập nhật `Cập nhật lần cuối`.

## Kiểm tra độ phủ (BẮT BUỘC)

MỌI yêu cầu v1 trong REQUIREMENTS.md PHẢI gắn vào **đúng 1 phase**.
- Yêu cầu chưa gắn = **lỗi** → DỪNG, sửa trước khi duyệt lộ trình
- 1 yêu cầu gắn vào 2+ phases = **lỗi** → chọn phase chính

Kiểm tra trùng phiên bản (khi VIẾT TIẾP): phiên bản milestones mới KHÔNG trùng với milestones đã có.
