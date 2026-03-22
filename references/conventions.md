# Quy ước chung dự án

> Dùng bởi: tất cả commands và workflows
> Nguồn sự thật duy nhất cho patterns/quy ước chia sẻ

## Biểu tượng trạng thái Task

| Biểu tượng | Ý nghĩa | Mô tả |
|-------------|---------|-------|
| ⬜ | Chưa bắt đầu | Task chưa được pick |
| 🔄 | Đang thực hiện | Task đang được code |
| ✅ | Hoàn tất | Task đã code + build + commit thành công |
| ❌ | Bị chặn | Task bị chặn bởi dependency hoặc vấn đề khác |
| 🐛 | Có lỗi | Task có test fail hoặc phát hiện bug |

**Quy tắc cập nhật:**
- Cập nhật CẢ HAI: (1) bảng Tổng quan (cột Trạng thái), (2) task detail block (`> Trạng thái:`)
- Đánh ✅ TRƯỚC commit. Commit fail → revert 🔄, sửa rồi thử lại
- 🐛 chỉ khi có test fail hoặc bug report mở

## Quy tắc version

### Patch version
Format: `[major].[minor].[patch]` — VD: `1.0.1`

**Xác định patch mới:**
1. Glob `.planning/bugs/BUG_*.md`
2. Grep `Patch version:` → lọc `[version-gốc].N` (3 số)
3. Tìm patch cao nhất
4. Chưa có → `[version-gốc].1`
5. Đã có → tăng: `1.0.1` → `1.0.2`

**Lỗi thuộc version hiện tại:** Patch = `[version].0`. Đã có → tìm cao nhất, +1.

### Version filtering

Bug thuộc milestone nếu `Patch version` khớp:
- Chính xác `[version]` hoặc bắt đầu `[version].[digit]`
- KHÔNG match: `1.1`, `1.10`, `10.0`, `2.0`

```
Grep `Patch version: [version]` trong .planning/bugs/BUG_*.md
→ lọc: chỉ khớp CHÍNH XÁC `[version]` hoặc `[version].[digit]`
→ PHẢI dùng word boundary — KHÔNG substring match
→ Cách an toàn: đọc giá trị, tách dấu chấm,
  so sánh [major].[minor] bằng số (VD: "1.0.2" → major=1, minor=0 → khớp "1.0")
```

## Commit prefixes

| Prefix | Skill | Mô tả |
|--------|-------|-------|
| `[TASK-N]` | write-code | Hoàn tất task N |
| `[KIỂM THỬ]` | test | Thêm test files |
| `[LỖI]` | fix-bug | Sửa lỗi |
| `[TRACKING]` | write-code | Phase hoàn tất |
| `[PHIÊN BẢN]` | complete-milestone | Đóng milestone |

## Format ngày tháng

- File names: `DD_MM_YYYY_HH_MM_SS`
- Hiển thị: `DD_MM_YYYY` hoặc `DD_MM_YYYY HH:MM`
- KHÔNG dùng format khác (ISO, US, v.v.)

## Ngôn ngữ

- Output/báo cáo/comments/JSDoc: Tiếng Việt có dấu
- Tên biến/function/class/file: Tiếng Anh
- Commit messages: Tiếng Việt có dấu
- Ngoại lệ: Solidity NatSpec dùng tiếng Anh

## Effort level

| Effort | Model | Ví dụ |
|--------|-------|-------|
| simple | haiku | đổi tên biến, thêm import, sửa typo, cập nhật config |
| standard | sonnet | tạo component mới, API endpoint, bộ unit test |
| complex | opus | refactor nhiều file, quyết định kiến trúc, tích hợp |

Mặc định: `standard` (sonnet). Task thiếu trường Effort → xử lý như `standard`.

Phân loại:
| Tín hiệu | simple | standard | complex |
|----------|--------|----------|---------|
| Files sửa/tạo | 1-2 | 3-4 | 5+ |
| Số Truths | 1 | 2-3 | 4+ |
| Phụ thuộc | 0 | 1-2 | 3+ |
| Đa domain | không | không | có |

Planner CÓ THỂ override guidelines dựa trên hiểu biết context.
User override: sửa trực tiếp `Effort:` trong TASKS.md trước khi chạy.

## Bảo mật — Files cấm đọc

CẤM đọc/hiển thị nội dung: `.env`, `.env.*` (trừ `.env.example`), `credentials.*`, `*.pem`, `*.key`, `*secret*`, `wp-config.php`

Chỉ ghi tên biến, KHÔNG bao giờ ghi giá trị.
