---
name: pd:fetch-doc
description: Tải tài liệu từ URL theo phiên bản thư viện hiện tại, lưu cục bộ để tra cứu nhanh
---
<objective>
Tải tài liệu từ URL thành file markdown cục bộ kèm phiên bản và mục lục theo từng phần. Cache đúng phiên bản để các skill sau chỉ cần đọc mục lục rồi mở đúng section cần thiết.
</objective>
<guards>
Dừng và hướng dẫn người dùng nếu bất kỳ điều kiện nào sau đây thất bại:
- [ ] `.planning/CONTEXT.md` ton tai -> "Chay `/pd:init` truoc."
- [ ] URL hợp lệ (có giao thức `http` hoặc `https`) -> "URL không hợp lệ. Kiểm tra lại."
- [ ] fetch khả dụng -> "fetch không khả dụng. Kiểm tra cài đặt MCP."
</guards>
<context>
Người dùng nhập: $ARGUMENTS
Ví dụ: `/pd:fetch-doc https://docs.nestjs.com/guards [nestjs-guards]`
</context>
<execution_context>
Không có -- skill này xử lý trực tiếp, không dùng workflow riêng.
<!-- Audit 2026-03-23: Intentional -- self-contained skill without workflow (lightweight/utility pattern). See Phase 14 Audit I1. -->
</execution_context>
<process>
## Bước 1: Kiểm tra đầu vào, tên file và phiên bản
- `.planning/CONTEXT.md` -> CÓ nhưng thiếu `docs/` -> `mkdir -p .planning/docs` | CHƯA CÓ -> DỪNG: chạy `/pd:init`
- URL không hợp lệ -> hỏi user
- **Tên file từ URL:** path segments cuối (bỏ query/hash), prepend domain keyword
  - `docs.nestjs.com/guards` -> `nestjs-guards` | `ant.design/components/table` -> `antd-table`
  - User cung cấp tên tùy chỉnh -> dùng tên đó
- **Phiên bản thư viện:**
  1. Trích xuất tên từ URL
  2. search tên trong `**/package.json` (bỏ node_modules) -> lấy version
  3. Nhiều kết quả -> ưu tiên exact match
  4. Nhiều version khác nhau -> hỏi user chọn hoặc dùng package.json gần nhất
  5. Không tìm thấy -> hỏi user hoặc ghi `latest`
  - Heuristic: URL NestJS/backend -> `package.json` của backend (glob `**/nest-cli.json`) | URL NextJS/React -> `package.json` của frontend (glob `**/next.config.*`)
## Bước 2: Kiểm tra tài liệu đã tồn tại
`.planning/docs/[tên].md`:
- CÓ + phiên bản GIỐNG + URL GIỐNG -> hỏi có tải lại không
- CÓ + version GIỐNG + URL KHÁC -> hỏi: đặt tên khác hay ghi đè?
- CÓ + version KHÁC -> "Version thay đổi", fetch lại
- CHƯA CÓ -> tiếp tục
## Bước 3: Tải trang chính
fetch URL -> trích xuất nội dung + internal links cùng domain (chỉ kỹ thuật, bỏ blog/changelog)
**HTTP errors:**
- 429 -> đợi 5s, thử lại (tối đa 2 lần)
- 301/302 -> follow redirect
- 401/403 -> DỪNG: "Trang yêu cầu đăng nhập"
- Timeout >30s -> thông báo không phản hồi
- 404/500/trống -> thử lại 1 lần
- Vẫn lỗi -> DỪNG: "Không thể tải [URL]."
**SPA detection:** nội dung < 500 ký tự -> cảnh báo: "Trang dùng JS rendering. Thử Context7 MCP."
## Bước 4: Tải các trang liên quan
Từ các liên kết ở Bước 3:
- Lọc trang kỹ thuật (API, config, examples, getting started)
- Xếp hạng tối đa 10 trang -> tải 5 trang đầu (nhiều fetch trong cùng 1 block)
- Trang lỗi -> bỏ qua + warning, tiếp tục
## Bước 5: Lưu file với mục lục
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
| 1 | Guards Overview | guard, canActivate | 20 |
---
## Section 1: [Tên]
> Nguồn: [URL]
[Nội dung giữ nguyên ngôn ngữ gốc]
```
> Số dòng tham khảo. Khi đọc, search heading text thay vì dựa line number.
## Bước 6: Thông báo
- Số trang thành công, đường dẫn, version
- "Khi upgrade thư viện, chạy lại `/pd:fetch-doc` để cập nhật"
</process>
<output>
**Tạo/Cập nhật:**
- `.planning/docs/[tên].md` -- tài liệu đã cache kèm phiên bản và mục lục
**Bước tiếp theo:** `/pd:plan` hoặc `/pd:write-code`
**Thành công khi:**
- Tài liệu được tạo với đúng phiên bản từ `package.json`
- Mục lục có từ khóa và số dòng cho mỗi section
- Nội dung giữ nguyên ngôn ngữ gốc và ví dụ code
**Lỗi thường gặp:**
- fetch không khả dụng -> kiểm tra MCP
- URL trả về `401/403` -> không thể tải tự động
- Trang là SPA -> thử Context7 MCP
</output>
<rules>
- Heading và ghi chú: TIẾNG VIỆT CÓ DẤU | Nội dung tài liệu: giữ nguyên bản gốc
- PHẢI ghi phiên bản từ `package.json` và kiểm tra tài liệu đã tồn tại trước khi tải
- PHẢI có mục lục nhanh với từ khóa và số dòng
- Tối đa 10 trang, chỉ tải trang kỹ thuật cùng domain
- Giữ nguyên ví dụ code
</rules>
