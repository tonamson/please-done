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
(Scan KHÔNG cần đọc rules files — chỉ quét và báo cáo, không viết code.)
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

  **Backend (NestJS):**
  - `@Module`, `@Controller`, `@Injectable`, `@Entity`, `@Guard`
  - Routes: `@Get`, `@Post`, `@Put`, `@Patch`, `@Delete`

  **Frontend (NextJS):** (CHỈ quét nếu tồn tại `next.config.*`)
  - Pages: Glob `**/app/**/page.tsx` → liệt kê tất cả routes
  - Components: Glob `**/components/**/*.tsx` → đếm + nhóm theo domain
  - Client vs Server: Grep `'use client'` → đếm client components
  - Stores: Glob `**/stores/use*.{ts,tsx}` → liệt kê Zustand stores
  - Hooks: Glob `**/hooks/use*.{ts,tsx}` → liệt kê custom hooks
  - API Layer: Read `**/lib/api.ts`, `**/lib/admin-api.ts` → liệt kê API functions
  - Types: Glob `**/types/*.ts` → liệt kê type files

## Bước 3: Bổ sung bằng FastCode MCP
Dùng `mcp__fastcode__code_qa` (repos: đường dẫn dự án từ CONTEXT.md):
- "Phân tích cấu trúc project, liệt kê modules, services, controllers, routes, models, utilities."

Nếu FastCode MCP lỗi khi gọi → DỪNG, thông báo user chạy `/sk:init` kiểm tra lại.

## Bước 4: Kiểm tra bảo mật dependencies
Chạy `npm audit` trong từng thư mục có `package.json` (backend, frontend, hoặc cả hai):
```bash
# Tìm tất cả thư mục có package.json (trừ node_modules)
# Chạy npm audit --production trong mỗi thư mục
cd [backend-dir] && npm audit --production 2>/dev/null
cd [frontend-dir] && npm audit --production 2>/dev/null
```
Liệt kê lỗ hổng theo mức độ (nghiêm trọng, cao, trung bình, thấp) + ghi rõ thuộc backend hay frontend.

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
(CHỈ tạo nếu project có NextJS — kiểm tra bằng `next.config.*`)

### Cấu trúc thư mục
[Tree structure: app/, components/, hooks/, lib/, stores/, types/]

### Pages & Routing
| Đường dẫn URL | File | Server/Client | Mô tả |

### Components
| Thư mục | Số file | Danh sách |

### State Management (Zustand)
| Store | File | Persist | Mô tả |

### API Layer
| Hàm | File | Server/Client | Endpoint |

### UI Framework
- Ant Design version, theme config, locale
- Styling approach (inline styles / CSS modules / Tailwind)

### SEO
- Metadata exports, generateMetadata, robots.ts, sitemap.ts, JSON-LD

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
- Tuân thủ quy tắc trong `.planning/rules/general.md` (ngôn ngữ, ngày tháng, bảo mật)
- Không sửa code, chỉ quét và báo cáo
- CHỈ tạo sections có dữ liệu trong report, bỏ section rỗng
- Section "Trạng thái hoàn thành" BẮT BUỘC
- PHẢI liệt kê thư viện từ package.json + chạy npm audit cho từng thư mục (backend/frontend)
- Phân tích Frontend CHỈ khi tồn tại `next.config.*` — bỏ qua nếu project không có frontend
- Phân tích Backend CHỈ khi tồn tại `nest-cli.json` — bỏ qua nếu project không có backend
- Nếu FastCode MCP lỗi → DỪNG, yêu cầu chạy `/sk:init`
</rules>
