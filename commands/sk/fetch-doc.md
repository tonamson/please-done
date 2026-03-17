---
name: sk:fetch-doc
description: Tải tài liệu từ URL theo version thư viện hiện tại, lưu local để research nhanh
---

<objective>
Tải tài liệu từ URL, lưu markdown local kèm version thư viện và mục lục phân section. Mục đích: cache tài liệu đúng version, các skill sau chỉ đọc mục lục rồi đọc đúng section cần thiết thay vì toàn bộ file.
</objective>

<context>
User input: $ARGUMENTS
Đầu vào: URL [tên-tùy-chỉnh]
VD: /sk:fetch-doc https://docs.nestjs.com/guards
VD: /sk:fetch-doc https://docs.nestjs.com/guards nestjs-guards
</context>

<process>

## Bước 1: Validate input + xác định tên + version
- Kiểm tra `.planning/CONTEXT.md` tồn tại:
  - Nếu CÓ nhưng thiếu `.planning/docs/` → tạo `mkdir -p .planning/docs`
  - Nếu CHƯA CÓ CONTEXT.md → DỪNG, thông báo chạy `/sk:init` trước
- URL hợp lệ? Nếu không → hỏi user
- Tên file: user cung cấp hoặc trích xuất từ URL (`docs.nestjs.com/guards` → `nestjs-guards`)
- Đọc `package.json` đúng thư mục → version thư viện đang dùng (VD: `"@nestjs/core": "^10.3.0"` → `10.3.0`)
  - URL thuộc NestJS/backend → đọc backend `package.json` (Glob `**/nest-cli.json` → cùng thư mục)
  - URL thuộc NextJS/antd/React → đọc frontend `package.json` (Glob `**/next.config.*` → cùng thư mục)
  - Không xác định được → đọc cả hai, tìm thư viện phù hợp

## Bước 2: Kiểm tra doc đã tồn tại
Kiểm tra `.planning/docs/[tên].md`:
- CÓ + version GIỐNG → hỏi user muốn fetch lại không
- CÓ + version KHÁC → thông báo "Version đã thay đổi", fetch lại
- CHƯA CÓ → tiếp tục

## Bước 3: Fetch trang chính
WebFetch URL chính → trích xuất:
- Nội dung tài liệu + code examples
- Danh sách internal links cùng domain (chỉ tài liệu kỹ thuật, bỏ blog/changelog/marketing)

## Bước 4: Fetch trang liên quan (có chọn lọc)
Từ danh sách links ở Bước 3:
- Lọc chỉ trang kỹ thuật liên quan trực tiếp (API, config, examples, getting started)
- **Tối đa 10 trang**, ưu tiên trang liên quan nhất đến chủ đề chính
- Fetch song song (tối đa 5 cùng lúc)

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
→ Các skill sau (plan, write-code) chỉ cần đọc mục lục (~10 dòng), rồi Read section cụ thể bằng offset/limit.

## Bước 6: Thông báo
- Số trang fetch thành công, đường dẫn file, version
- "Khi upgrade thư viện, chạy lại `/sk:fetch-doc` để cập nhật"
</process>

<rules>
- Heading, ghi chú: TIẾNG VIỆT CÓ DẤU | Nội dung tài liệu: giữ nguyên gốc
- PHẢI ghi version từ package.json + kiểm tra doc tồn tại trước khi fetch
- PHẢI có mục lục nhanh với từ khóa và số dòng bắt đầu mỗi section
- Tối đa 10 trang, chỉ fetch trang kỹ thuật cùng domain
- Giữ nguyên code examples
</rules>
