# Quy ước chung dự án

> Dùng bởi: tất cả commands và workflows
> Mục đích: nguồn sự thật duy nhất cho các patterns/quy ước chia sẻ giữa nhiều commands

## Biểu tượng trạng thái Task

| Biểu tượng | Ý nghĩa | Mô tả |
|-------------|---------|-------|
| ⬜ | Chưa bắt đầu | Task chưa được pick |
| 🔄 | Đang thực hiện | Task đang được code |
| ✅ | Hoàn tất | Task đã code + build + commit thành công |
| ❌ | Bị chặn | Task bị chặn bởi dependency hoặc vấn đề khác |
| 🐛 | Có lỗi | Task có test fail hoặc phát hiện bug |

**Quy tắc cập nhật trạng thái:**
- Cập nhật CẢ HAI nơi: (1) bảng Tổng quan (cột Trạng thái), (2) task detail block (`> Trạng thái:`)
- Đánh ✅ TRƯỚC commit (để commit bao gồm trạng thái hoàn tất). Nếu commit fail → revert về 🔄, sửa lỗi rồi thử lại
- Chỉ đánh 🐛 khi có test fail hoặc bug report mở

## Quy tắc version

### Patch version
Format: `[major].[minor].[patch]` — VD: `1.0.1`

**Xác định patch version mới:**
1. Glob `.planning/bugs/BUG_*.md`
2. Grep `Patch version:` → lọc entries dạng `[version-gốc].N` (3 số)
3. Tìm patch cao nhất hiện có
4. Nếu chưa có patch → `[version-gốc].1` (VD: `1.0.1`)
5. Nếu đã có → tăng: `1.0.1` → `1.0.2`

**Lỗi thuộc version hiện tại (milestone chưa hoàn tất):**
- Patch = `[version].0` (VD: `1.1.0`)
- Nếu đã có → tìm patch cao nhất, tăng 1

### Version filtering (match bugs thuộc milestone)

Bug thuộc milestone nếu `Patch version` khớp:
- Bằng chính xác `[version]` (VD: `1.0`)
- HOẶC bắt đầu bằng `[version].` theo sau bởi số (VD: `1.0.1`, `1.0.2`)
- KHÔNG match: `1.1`, `1.10`, `10.0`, `2.0`

**Pattern sử dụng:**
```
Grep `Patch version: [version]` trong .planning/bugs/BUG_*.md
→ lọc kết quả: chỉ lấy khớp CHÍNH XÁC `[version]` hoặc `[version].[digit]`
→ PHẢI dùng word boundary hoặc so sánh chính xác — KHÔNG dùng substring match
→ Cách an toàn: đọc giá trị `Patch version:`, tách bằng dấu chấm,
  so sánh [major].[minor] bằng số (VD: "1.0.2" → major=1, minor=0 → khớp version "1.0")
  KHÔNG match: "10.0" khi tìm "1.0", "1.10" khi tìm "1.1"
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

- File names: `DD_MM_YYYY_HH_MM_SS` (VD: `21_03_2026_14_30_00`)
- Hiển thị: `DD_MM_YYYY` hoặc `DD_MM_YYYY HH:MM`
- KHÔNG dùng format khác (ISO, US, v.v.)

## Ngôn ngữ

- Output/báo cáo/comments/JSDoc: Tiếng Việt có dấu
- Tên biến/function/class/file: Tiếng Anh
- Commit messages: Tiếng Việt có dấu
- Ngoại lệ: Solidity NatSpec dùng tiếng Anh

## Bảo mật — Files cấm đọc

CẤM đọc/hiển thị nội dung:
- `.env`, `.env.*` (trừ `.env.example`)
- `credentials.*`, `*.pem`, `*.key`, `*secret*`
- `wp-config.php`

Chỉ được ghi tên biến, KHÔNG bao giờ ghi giá trị.
