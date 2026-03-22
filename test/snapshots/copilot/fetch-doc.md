---
name: pd:fetch-doc
description: Tải tài liệu từ URL theo version thư viện hiện tại, lưu local để research nhanh
---
<objective>
Tải tài liệu từ URL -> markdown local kèm version + mục lục phân section. Cache đúng version, skill sau chỉ đọc mục lục rồi read section cần thiết.
</objective>
<guards>
DUNG va huong dan user neu bat ky dieu kien nao that bai:
- [ ] `.planning/CONTEXT.md` ton tai -> "Chay `/pd:init` truoc."
- [ ] URL hop le (co protocol http/https) -> "URL khong hop le. Kiem tra lai."
- [ ] fetch tool kha dung -> "fetch khong kha dung. Kiem tra cai dat MCP."
</guards>
<context>
User input: $ARGUMENTS
VD: `/pd:fetch-doc https://docs.nestjs.com/guards [nestjs-guards]`
</context>
<execution_context>
Khong co -- skill nay xu ly truc tiep, khong dung workflow rieng.
</execution_context>
<process>
## Buoc 1: Validate input + ten + version
- `.planning/CONTEXT.md` -> CÓ nhưng thiếu `docs/` -> `mkdir -p .planning/docs` | CHƯA CÓ -> DỪNG: chạy `/pd:init`
- URL không hợp lệ -> hỏi user
- **Tên file từ URL:** path segments cuối (bỏ query/hash), prepend domain keyword
  - `docs.nestjs.com/guards` -> `nestjs-guards` | `ant.design/components/table` -> `antd-table`
  - User cung cấp tên tùy chỉnh -> dùng tên đó
- **Version thư viện:**
  1. Extract tên từ URL
  2. search tên trong `**/package.json` (bỏ node_modules) -> lấy version
  3. Nhiều kết quả -> ưu tiên exact match
  4. Nhiều version khác nhau -> hỏi user chọn hoặc dùng package.json gần nhất
  5. Không tìm thấy -> hỏi user hoặc ghi `latest`
  - Heuristic: URL NestJS/backend -> backend `package.json` (glob `**/nest-cli.json`) | URL NextJS/React -> frontend `package.json` (glob `**/next.config.*`)
## Buoc 2: Kiem tra doc ton tai
`.planning/docs/[tên].md`:
- CÓ + version GIỐNG + URL GIỐNG -> hỏi fetch lại không
- CÓ + version GIỐNG + URL KHÁC -> hỏi: đặt tên khác hay ghi đè?
- CÓ + version KHÁC -> "Version thay đổi", fetch lại
- CHƯA CÓ -> tiếp tục
## Buoc 3: Fetch trang chinh
fetch URL -> trích xuất nội dung + internal links cùng domain (chỉ kỹ thuật, bỏ blog/changelog)
**HTTP errors:**
- 429 -> đợi 5s, thử lại (tối đa 2 lần)
- 301/302 -> follow redirect
- 401/403 -> DỪNG: "Trang yêu cầu đăng nhập"
- Timeout >30s -> thông báo không phản hồi
- 404/500/trống -> thử lại 1 lần
- Vẫn lỗi -> DỪNG: "Không thể tải [URL]."
**SPA detection:** nội dung < 500 ký tự -> cảnh báo: "Trang dùng JS rendering. Thử Context7 MCP."
## Buoc 4: Fetch trang lien quan
Từ links Bước 3:
- Lọc trang kỹ thuật (API, config, examples, getting started)
- Xếp hạng tối đa 10 trang -> fetch 5 đầu (nhiều fetch cùng 1 block)
- Trang lỗi -> bỏ qua + warning, tiếp tục
## Buoc 5: Luu file voi muc luc
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
## Buoc 6: Thong bao
- Số trang thành công, đường dẫn, version
- "Khi upgrade thư viện, chạy lại `/pd:fetch-doc` để cập nhật"
</process>
<output>
**Tao/Cap nhat:**
- `.planning/docs/[tên].md` -- tài liệu cached + version + mục lục
**Buoc tiep theo:** `/pd:plan` hoac `/pd:write-code`
**Thanh cong khi:**
- Doc tao voi dung version tu package.json
- Muc luc co tu khoa + so dong moi section
- Noi dung giu nguyen ngon ngu goc + code examples
**Loi thuong gap:**
- fetch khong kha dung -> kiem tra MCP
- URL 401/403 -> khong the fetch tu dong
- Trang SPA -> thu Context7 MCP
</output>
<rules>
- Heading, ghi chu: TIENG VIET CO DAU | Noi dung tai lieu: giu nguyen goc
- PHAI ghi version tu package.json + kiem tra doc ton tai truoc khi fetch
- PHAI co muc luc nhanh voi tu khoa va so dong
- Toi da 10 trang, chi fetch trang ky thuat cung domain
- Giu nguyen code examples
</rules>
