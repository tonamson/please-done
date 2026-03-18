---
name: pd:fetch-doc
description: Tải tài liệu từ URL theo version thư viện hiện tại, lưu local để research nhanh
---

<objective>
Tải tài liệu từ URL, lưu markdown local kèm version thư viện và mục lục phân section. Mục đích: cache tài liệu đúng version, các skill sau chỉ đọc mục lục rồi đọc đúng section cần thiết thay vì toàn bộ file.
</objective>

<context>
User input: $ARGUMENTS
Đầu vào: URL [tên-tùy-chỉnh]
VD: /pd:fetch-doc https://docs.nestjs.com/guards
VD: /pd:fetch-doc https://docs.nestjs.com/guards nestjs-guards
</context>

<process>

## Bước 1: Validate input + xác định tên + version
- Kiểm tra `.planning/CONTEXT.md` tồn tại:
  - Nếu CÓ nhưng thiếu `.planning/docs/` → tạo `mkdir -p .planning/docs`
  - Nếu CHƯA CÓ CONTEXT.md → DỪNG, thông báo chạy `/pd:init` trước
- URL hợp lệ? Nếu không → hỏi user
- **Extract tên file từ URL:** lấy path segments cuối (bỏ query params, hash), prepend domain keyword nếu cần. VD:
  - `docs.nestjs.com/guards` → `nestjs-guards`
  - `ant.design/components/table` → `antd-table`
  - `zod.dev/docs/getting-started` → `zod-getting-started`
  - Nếu user cung cấp tên tùy chỉnh → dùng tên đó thay thế
- **Xác định version thư viện:**
  1. Extract tên thư viện từ URL (VD: `zod` từ `zod.dev/docs`, `dayjs` từ `day.js.org`, `nestjs` từ `docs.nestjs.com`)
  2. Grep tên thư viện trong TẤT CẢ `package.json` files (Glob `**/package.json`, bỏ qua `node_modules`): tìm dependency chứa tên thư viện → lấy version chính xác
  3. Nếu tìm thấy nhiều kết quả → ưu tiên exact match (VD: `zod` match `"zod"` trước `"zod-validation"`)
  4. Nếu tìm thấy cùng thư viện với NHIỀU version khác nhau trong nhiều package.json → hỏi user chọn version, hoặc dùng version từ package.json gần nhất với context (backend/frontend).
  5. **Fallback nếu không tìm thấy trong package.json:** hỏi user version cụ thể, hoặc ghi `latest` và fetch docs phiên bản mới nhất
  - Bổ sung: vẫn dùng heuristic thư mục khi cần:
    - URL thuộc NestJS/backend → đọc backend `package.json` (Glob `**/nest-cli.json` → cùng thư mục)
    - URL thuộc NextJS/antd/React → đọc frontend `package.json` (Glob `**/next.config.*` → cùng thư mục)
    - Không xác định được → đọc cả hai, tìm thư viện phù hợp

## Bước 2: Kiểm tra doc đã tồn tại
Kiểm tra `.planning/docs/[tên].md`:
- CÓ + version GIỐNG → kiểm tra thêm URL nguồn (dòng `> Nguồn:` trong file):
  - URL GIỐNG → hỏi user muốn fetch lại không
  - URL KHÁC → hỏi user: "File cùng tên đã tồn tại nhưng từ URL khác. Đặt tên khác hay ghi đè?"
- CÓ + version KHÁC → thông báo "Version đã thay đổi", fetch lại
- CHƯA CÓ → tiếp tục

## Bước 3: Fetch trang chính
WebFetch URL chính → trích xuất:
- Nội dung tài liệu + code examples
- Danh sách internal links cùng domain (chỉ tài liệu kỹ thuật, bỏ blog/changelog/marketing)

**Xử lý HTTP errors:**
- **429 (Rate Limited):** đợi 5s và thử lại (tối đa 2 lần)
- **301/302 (Redirect):** follow redirect tự động
- **401/403 (Unauthorized/Forbidden):** **DỪNG**, thông báo: "Trang yêu cầu đăng nhập, không thể fetch tự động."
- **Timeout (>30s):** thông báo: "Trang không phản hồi sau 30s."
- **Các lỗi khác (404, 500, trang trống):** thử lại 1 lần

Nếu vẫn lỗi sau retry → **DỪNG**, thông báo: "Không thể tải [URL]. Kiểm tra URL hợp lệ và thử lại."

**SPA content detection:** Nếu nội dung fetch được < 500 ký tự (sau khi bỏ HTML tags) → cảnh báo: "Trang có thể dùng JavaScript rendering, nội dung không đầy đủ. Thử dùng Context7 MCP thay thế."

## Bước 4: Fetch trang liên quan (có chọn lọc)
Từ danh sách links ở Bước 3:
- Lọc chỉ trang kỹ thuật liên quan trực tiếp (API, config, examples, getting started)
- **Lọc và xếp hạng tối đa 10 trang** liên quan nhất đến chủ đề chính
- **Fetch 5 trang đầu** trong danh sách đã lọc (gọi nhiều WebFetch trong cùng 1 message block để tối ưu)
- Trang lỗi (timeout, 404) → bỏ qua, ghi warning, tiếp tục các trang còn lại

## Bước 5: Lưu file có mục lục nhanh
Tạo `.planning/docs/[tên].md`:

```markdown
# Tài liệu [Tên thư viện]
> Nguồn: [URL gốc]
> Phiên bản: [x.x.x] (từ package.json)
> Ngày tải: [DD_MM_YYYY]
> Số trang: [N]

## Mục lục nhanh
| # | Section | Từ khóa | Dòng |
|---|---------|---------|------|
| 1 | Guards Overview | guard, canActivate, AuthGuard | 20 |
| 2 | Role-based Auth | roles, SetMetadata, RolesGuard | 95 |
| 3 | Custom Decorators | createParamDecorator, ExecutionContext | 160 |

---
## Section 1: [Tên]
> Nguồn: [URL]
[Nội dung giữ nguyên ngôn ngữ gốc]

## Section 2: [Tên]
> Nguồn: [URL]
...
```

**Mục lục nhanh** chứa: tên section + từ khóa chính + số dòng bắt đầu.
> Số dòng tham khảo tại thời điểm tạo. Khi đọc, luôn search heading text thay vì dựa vào line number.

→ Các skill sau (plan, write-code) chỉ cần đọc mục lục (~10 dòng), rồi Read section cụ thể bằng offset/limit.

## Bước 6: Thông báo
- Số trang fetch thành công, đường dẫn file, version
- "Khi upgrade thư viện, chạy lại `/pd:fetch-doc` để cập nhật"
</process>

<rules>
- Heading, ghi chú: TIẾNG VIỆT CÓ DẤU | Nội dung tài liệu: giữ nguyên gốc
- PHẢI ghi version từ package.json + kiểm tra doc tồn tại trước khi fetch
- PHẢI có mục lục nhanh với từ khóa và số dòng bắt đầu mỗi section
- Tối đa 10 trang, chỉ fetch trang kỹ thuật cùng domain
- Giữ nguyên code examples
</rules>
