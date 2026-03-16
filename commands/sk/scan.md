---
name: sk:scan
description: Quét toàn bộ dự án, phân tích cấu trúc, thư viện, bảo mật và tạo báo cáo
---

<objective>
Quét toàn bộ dự án, phân tích cấu trúc code, dependencies, kiến trúc, kiểm tra bảo mật và tạo báo cáo.
</objective>

<context>
User input: $ARGUMENTS

Đọc `.planning/CONTEXT.md` (đã tạo bởi /sk:init).
Nếu chưa có CONTEXT.md → thông báo chạy `/sk:init` trước.
</context>

<process>

## Bước 1: Xác định đường dẫn
- Nếu `$ARGUMENTS` có path → dùng path đó
- Nếu không → dùng thư mục hiện tại
- Tạo `.planning/scan/` nếu chưa có

## Bước 2: Quét cấu trúc bằng built-in tools
- **Glob** tìm file: `**/*.ts`, `**/*.tsx`, `**/*.json`, `**/*.prisma`, `**/Dockerfile`
- **Read** config: `package.json`, `tsconfig.json`, `nest-cli.json`, `next.config.*`, `prisma/schema.prisma`
- **Grep** patterns:
  - NestJS: `@Module`, `@Controller`, `@Injectable`, `@Entity`, `@Guard`
  - NextJS: `export default function`, `'use client'`, `'use server'`
  - Routes: `@Get`, `@Post`, `@Put`, `@Patch`, `@Delete`

## Bước 3: Bổ sung bằng FastCode MCP
Dùng `mcp__fastcode__code_qa` (repos: đường dẫn dự án từ CONTEXT.md):
- "Phân tích cấu trúc project, liệt kê modules, services, controllers, routes, models, utilities."

Nếu FastCode MCP lỗi khi gọi → DỪNG, thông báo user chạy `/sk:init` kiểm tra lại.

## Bước 4: Kiểm tra bảo mật dependencies
```bash
npm audit --production 2>/dev/null
```
Liệt kê lỗ hổng theo mức độ (nghiêm trọng, cao, trung bình, thấp).

## Bước 5: Tạo báo cáo
Viết `.planning/scan/SCAN_REPORT.md`:

```markdown
# Báo cáo quét dự án
> Ngày quét: [DD_MM_YYYY HH:MM]
> Dự án: [tên]
> Đường dẫn: [path]

## Tổng quan
- Tech stack, kiến trúc, số lượng files/modules

## Cấu trúc thư mục
[Tree structure]

## Thư viện
### Dependencies
| Tên | Phiên bản | Công dụng |
### DevDependencies
| Tên | Phiên bản | Công dụng |

## Cảnh báo bảo mật
[Kết quả npm audit - nếu có lỗ hổng]

## Phân tích Backend (NestJS)
Modules | Controllers & Routes | Services | Entities | Guards & Middleware

## Phân tích Frontend (NextJS)
(CHỈ tạo nếu project có NextJS)

## Cơ sở dữ liệu
Entities | Quan hệ | Migrations (ghi rõ Prisma/Mongoose)

## Xác thực & Phân quyền

## Trạng thái hoàn thành
| Chức năng | Trạng thái | Ghi chú |

## Vấn đề & Đề xuất
```

**CHỈ tạo sections có dữ liệu.** Bỏ section rỗng không liên quan.

## Bước 6: Thông báo
In tóm tắt kết quả cho user.
</process>

<rules>
- Tuân thủ quy tắc trong CONTEXT.md (ngôn ngữ, ngày tháng, bảo mật)
- Không sửa code, chỉ quét và báo cáo
- CHỈ tạo sections có dữ liệu trong report, bỏ section rỗng
- Section "Trạng thái hoàn thành" BẮT BUỘC
- PHẢI liệt kê thư viện từ package.json + chạy npm audit
- Nếu FastCode MCP lỗi → DỪNG, yêu cầu chạy `/sk:init`
</rules>
