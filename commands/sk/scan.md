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

## Bước 2: Kiểm tra project có code không
Glob `**/*.{ts,tsx,js,jsx,py,html}` (trừ node_modules, .venv, .planning — KHÔNG bao gồm .json/.css để khớp với init.md):
- **KHÔNG có source files** (project mới) → nhảy sang **Bước 5** tạo scan report tối giản:
  - Ghi: "Dự án mới, chưa có code. Tech stack dự kiến: [từ CONTEXT.md]"
  - Trạng thái hoàn thành: "Chưa bắt đầu"
  - KHÔNG chạy Bước 3, 4, 6 (không có code → không cần re-detect hay cập nhật CONTEXT)
- **CÓ source files** → tiếp tục quét bình thường

## Bước 2a: Quét cấu trúc bằng built-in tools
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
  - API Layer: Glob `**/lib/api.ts`, `**/lib/admin-api.ts` → nếu tồn tại thì Read → liệt kê API functions
  - Types: Glob `**/types/*.ts` → liệt kê type files

## Bước 3: Bổ sung bằng FastCode MCP (CHỈ khi có code)
Dùng `mcp__fastcode__code_qa` (repos: đường dẫn dự án từ CONTEXT.md):
- "Phân tích cấu trúc project, liệt kê modules, services, controllers, routes, models, utilities."

Nếu FastCode MCP lỗi → ghi warning trong report, tiếp tục với kết quả từ Bước 2a (built-in tools). KHÔNG DỪNG.

## Bước 4: Kiểm tra bảo mật dependencies (CHỈ khi có package.json)
Detect package manager: `yarn.lock` → yarn | `pnpm-lock.yaml` → pnpm | mặc định → npm.
Chạy audit trong từng thư mục có `package.json` (backend, frontend, hoặc cả hai):
```bash
# Lệnh audit theo package manager:
# npm:  cd [dir] && npm audit --production 2>&1 | tail -30
# yarn: cd [dir] && yarn audit --groups production 2>&1 | tail -30
# pnpm: cd [dir] && pnpm audit --prod 2>&1 | tail -30
```
Nếu audit command fail (exit code khác 0 mà không phải do vulnerabilities) → ghi "Audit command thất bại" trong report thay vì bỏ trống.
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

## Bước 6: Cập nhật CONTEXT.md + Rules
Dựa trên kết quả quét, cập nhật `.planning/CONTEXT.md` để phản ánh trạng thái hiện tại:

1. **Re-detect tech stack**:
   - Glob `**/nest-cli.json` → hasBackend
   - Glob `**/next.config.*` → hasFrontend
   - Grep `MongooseModule|TypeOrmModule|PrismaService` → DB type

2. **Cập nhật CONTEXT.md** (giữ format gốc từ init, DƯỚI 50 dòng):
   - `Dự án mới` → `Không` (nếu Bước 2 tìm thấy source files)
   - Thêm/cập nhật dòng `> Cập nhật: [DD_MM_YYYY HH:MM]` (ngay sau dòng `Khởi tạo`)
   - Tech Stack: cập nhật theo kết quả scan mới
   - Thư viện chính: cập nhật từ package.json hiện tại (tối đa 20 dòng, bỏ devDeps)
   - Milestone hiện tại: giữ nguyên (nếu có)
   - Rules: cập nhật danh sách rules files thực tế trong `.planning/rules/`

3. **Re-copy rules nếu tech stack thay đổi**:
   So sánh hasBackend/hasFrontend mới với tech stack cũ trong CONTEXT.md:
   - Nếu KHÁC (VD: thêm frontend mới, xóa backend):
     - Đọc `.skconfig` (Bash: `cat ~/.claude/commands/sk/.skconfig`) → lấy `SKILLS_DIR`
     - Nếu `.skconfig` không tồn tại → bỏ qua re-copy, ghi warning trong thông báo: "Không thể cập nhật rules — thiếu .skconfig"
     - Nếu CÓ → xóa rules cũ trong `.planning/rules/` → copy lại rules phù hợp (general + backend/frontend theo stack mới)
   - Nếu GIỐNG → không cần copy lại

## Bước 7: Thông báo
In tóm tắt kết quả cho user. Nếu CONTEXT.md hoặc rules đã được cập nhật → thông báo rõ.
</process>

<rules>
- Tuân thủ quy tắc trong `.planning/rules/general.md` (ngôn ngữ, ngày tháng, bảo mật)
- Không sửa code, chỉ quét và báo cáo
- Project mới (chưa có code) → tạo scan report tối giản, KHÔNG gọi FastCode, KHÔNG chạy npm audit
- CHỈ tạo sections có dữ liệu trong report, bỏ section rỗng
- Section "Trạng thái hoàn thành" BẮT BUỘC
- PHẢI liệt kê thư viện từ package.json + chạy audit **NẾU project có package.json**. Nếu không có package.json → bỏ section Thư viện và Cảnh báo bảo mật
- CẤM đọc/hiển thị nội dung `.env`, `.env.*`, `credentials.*`, `*.pem`, `*.key`, `*secret*` — chỉ ghi tên file tồn tại, KHÔNG đọc nội dung
- Phân tích Frontend CHỈ khi tồn tại `next.config.*` — bỏ qua nếu project không có frontend
- Phân tích Backend CHỈ khi tồn tại `nest-cli.json` — bỏ qua nếu project không có backend
- Nếu FastCode MCP lỗi → ghi warning trong report, tiếp tục với built-in tools (KHÔNG DỪNG)
- PHẢI cập nhật CONTEXT.md sau khi quét — đảm bảo context luôn phản ánh trạng thái hiện tại của dự án
- Nếu tech stack thay đổi so với CONTEXT.md cũ → PHẢI re-copy rules tương ứng vào `.planning/rules/`
</rules>
