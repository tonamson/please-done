---
name: pd:scan
description: Quét toàn bộ dự án, phân tích cấu trúc, thư viện, bảo mật và tạo báo cáo
---

<objective>
Quét toàn bộ dự án, phân tích cấu trúc code, dependencies, kiến trúc, kiểm tra bảo mật và tạo báo cáo.
</objective>

<context>
User input: $ARGUMENTS

Đọc `.planning/CONTEXT.md` (đã tạo bởi /pd:init).
Nếu chưa có CONTEXT.md → thông báo chạy `/pd:init` trước.
(Scan KHÔNG cần đọc rules files — chỉ quét và báo cáo, không viết code.)
</context>

<process>

## Bước 1: Xác định đường dẫn
- Nếu `$ARGUMENTS` có path → dùng path đó
- Nếu không → dùng thư mục hiện tại
- Tạo `.planning/scan/` nếu chưa có

## Bước 2: Kiểm tra project có code không
Glob `**/*.{ts,tsx,js,jsx,py,php,sol,html}` (trừ node_modules, .venv, .planning, wp-includes, wp-admin, artifacts, cache — KHÔNG bao gồm .json/.css để khớp với init.md):
- **KHÔNG có source files** (project mới) → nhảy sang **Bước 5** tạo scan report tối giản:
  - Ghi: "Dự án mới, chưa có code. Tech stack dự kiến: [từ CONTEXT.md]"
  - Trạng thái hoàn thành: "Chưa bắt đầu"
  - KHÔNG chạy Bước 3, 4, 6 (không có code → không cần re-detect hay cập nhật CONTEXT)
- **CÓ source files** → tiếp tục quét bình thường

## Bước 2a: Quét cấu trúc bằng built-in tools
- **Glob** tìm file: `**/*.ts`, `**/*.tsx`, `**/*.json`, `**/*.prisma`, `**/*.sol`, `**/Dockerfile`
- **Read** config: `package.json`, `tsconfig.json`, `nest-cli.json`, `next.config.*`, `prisma/schema.prisma`
- **Grep** patterns:

  **Backend (NestJS):**
  - `@Module`, `@Controller`, `@Injectable`, `@Entity`, `@Guard` (glob: `*.ts`)
  - Routes: `@Get`, `@Post`, `@Put`, `@Patch`, `@Delete` (glob: `*.ts`)

  **Frontend (NextJS):** (CHỈ quét nếu tồn tại `next.config.*`)
  - Pages: Glob `**/app/**/page.tsx` → liệt kê tất cả routes
  - Components: Glob `**/components/**/*.tsx` → đếm + nhóm theo domain
  - Client vs Server: Grep `'use client'` (glob: `*.{tsx,jsx}`) → đếm client components
  - Stores: Glob `**/stores/use*.{ts,tsx}` → liệt kê Zustand stores
  - Hooks: Glob `**/hooks/use*.{ts,tsx}` → liệt kê custom hooks
  - API Layer: Glob `**/lib/api.ts`, `**/lib/admin-api.ts` → nếu tồn tại thì Read → liệt kê API functions
  - Types: Glob `**/types/*.ts` → liệt kê type files

  **WordPress:** (CHỈ quét nếu tồn tại `**/wp-config.php` hoặc `**/wp-content/plugins/*/` hoặc `**/wp-content/themes/*/style.css`)
  - Plugins: Glob `**/wp-content/plugins/*/` → liệt kê plugins
  - Themes: Glob `**/wp-content/themes/*/style.css` → liệt kê themes
  - Custom tables: Grep `dbDelta|\$wpdb->prefix` (glob: `*.php`) → liệt kê custom tables
  - REST API: Grep `register_rest_route` (glob: `*.php`) → liệt kê endpoints
  - Hooks: Grep `add_action|add_filter` (glob: `*.php`) → đếm hooks registered

  **Solidity:** (CHỈ quét nếu tồn tại `**/hardhat.config.*` hoặc `**/foundry.toml` hoặc `**/contracts/**/*.sol`)
  - Contracts: Glob `**/contracts/**/*.sol` hoặc `**/src/**/*.sol` → liệt kê contracts
  - Imports: Grep `import.*@openzeppelin` (glob: `*.sol`) → liệt kê OZ dependencies
  - Interfaces: Grep `^\s*interface\s+` (glob: `*.sol`) → liệt kê interfaces
  - Events: Grep `^\s*event ` (glob: `*.sol`) → liệt kê events
  - Modifiers: Grep `^\s*modifier\s+\w+` (glob: `*.sol`) → liệt kê custom modifiers
  - Security patterns: Grep `nonReentrant|whenNotPaused|onlyOwner` (glob: `*.sol`) → đếm security modifiers sử dụng

## Bước 3: Bổ sung bằng FastCode MCP (CHỈ khi có code)
Validate đường dẫn trong CONTEXT.md khớp với thư mục hiện tại (`pwd`). Nếu khác → cảnh báo user trước khi tiếp tục.

Dùng `mcp__fastcode__code_qa` (repos: đường dẫn dự án từ CONTEXT.md):
- "Phân tích cấu trúc project, liệt kê modules, services, controllers, routes, models, utilities."

Nếu FastCode MCP lỗi → ghi warning trong report, tiếp tục với kết quả từ Bước 2a (built-in tools). KHÔNG DỪNG.

## Bước 4: Kiểm tra bảo mật dependencies (CHỈ khi có package.json)
Detect package manager: `yarn.lock` → yarn | `pnpm-lock.yaml` → pnpm | mặc định → npm.
Chạy audit trong từng thư mục có `package.json` (backend, frontend, hoặc cả hai):
```bash
# Lệnh audit theo package manager:
# npm:  cd [dir] && npm audit --omit=dev 2>&1 | tail -30
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

## Phân tích Backend
Modules | Controllers & Routes | Services | Entities | Guards & Middleware

## Phân tích Frontend
(CHỈ tạo nếu project có frontend framework — kiểm tra bằng `next.config.*`, `vite.config.*`)

### Cấu trúc thư mục
[Tree structure: app/, components/, hooks/, lib/, stores/, types/]

### Pages & Routing
| Đường dẫn URL | File | Server/Client | Mô tả |

### Components
| Thư mục | Số file | Danh sách |

### State Management
| Store | File | Persist | Mô tả |

### API Layer
| Hàm | File | Server/Client | Endpoint |

### UI Framework
- Framework + version, theme config, locale
- Styling approach (inline styles / CSS modules / Tailwind / styled-components)

### SEO
- Metadata exports, generateMetadata, robots.ts, sitemap.ts, JSON-LD

## Phân tích WordPress
(CHỈ tạo nếu project có WordPress — kiểm tra bằng `**/wp-config.php` hoặc `**/wp-content/plugins/*/` hoặc `**/wp-content/themes/*/style.css`)

### Plugins
| Tên | Đường dẫn | Mô tả |

### Themes
| Tên | Đường dẫn | Parent Theme |

### Custom Tables
| Tên bảng | Plugin/Theme | Mô tả |

### REST API Endpoints
| Route | Callback | Permission |

### Hooks
| Loại | Hook name | Callback | Priority |

## Phân tích Solidity
(CHỈ tạo nếu project có Solidity framework — kiểm tra bằng `hardhat.config.*`, `foundry.toml`, hoặc `contracts/**/*.sol`)

### Contracts
| Tên | Base Contract | Mô tả |

### OZ Imports
| Contract | Imports |

### Security Modifiers
| Contract | nonReentrant | whenNotPaused | onlyOwner/onlyRole |

### Events
| Contract | Events |

## Cơ sở dữ liệu
Entities | Quan hệ | Migrations (ghi rõ Prisma/Mongoose)

## Xác thực & Phân quyền

## Trạng thái hoàn thành
| Chức năng | Trạng thái | Ghi chú |

## Vấn đề & Đề xuất
```

**CHỈ tạo sections có dữ liệu.** Bỏ section rỗng không liên quan.

## Bước 6: Cập nhật CONTEXT.md + Rules
**CHỈ chạy khi project có code (Bước 2 xác nhận CÓ source files). Nếu project mới → bỏ qua bước này.**

Dựa trên kết quả quét, cập nhật `.planning/CONTEXT.md` để phản ánh trạng thái hiện tại:

1. **Re-detect tech stack**:
   Dùng kết quả detect từ Bước 2a. Nếu kết quả từ Bước 2a không có (edge case) → re-detect tương tự Bước 2a.

2. **Cập nhật CONTEXT.md** (giữ format gốc từ init, DƯỚI 50 dòng):
   - `Dự án mới` → `Không` (nếu Bước 2 tìm thấy source files). Nếu project mới (Bước 2 skip Bước 3,4,6) → flag KHÔNG được update bởi scan. Flag sẽ được update khi `/pd:write-code` hoàn tất task đầu tiên hoặc khi scan chạy lại sau khi có code.
   - Cập nhật dòng `> Cập nhật: [DD_MM_YYYY HH:MM]` (dòng này đã có sẵn từ init template, chỉ cần update value)
   - Tech Stack: cập nhật theo kết quả scan mới
   - Thư viện chính: cập nhật từ package.json hiện tại (tối đa 20 dòng, bỏ devDeps)
   - Milestone hiện tại: giữ nguyên (nếu có)
   - Rules: cập nhật danh sách rules files thực tế trong `.planning/rules/`

3. **Re-copy rules nếu tech stack thay đổi**:
   So sánh hasBackend/hasFrontend/hasWordPress/hasSolidity mới với tech stack cũ trong CONTEXT.md:
   - Nếu KHÁC (VD: thêm frontend mới, xóa backend, thêm WordPress, thêm Solidity):
     - Đọc `.pdconfig` (Bash: `cat ~/.claude/commands/pd/.pdconfig`) → lấy `SKILLS_DIR`
     - Nếu `.pdconfig` không tồn tại → bỏ qua re-copy, ghi warning trong thông báo: "Không thể cập nhật rules — thiếu .pdconfig"
     - Nếu CÓ → Chỉ xóa các files template: `general.md`, `backend.md`, `frontend.md`, `wordpress.md`, `solidity.md`. Giữ nguyên files custom khác (nếu có). → copy lại rules phù hợp (general + backend/frontend/wordpress/solidity theo stack mới)
     - Nếu hasWordPress thay đổi: copy/xóa `wordpress-refs/` → `.planning/docs/wordpress/` tương ứng
     - Nếu hasSolidity thay đổi: copy/xóa `solidity-refs/` → `.planning/docs/solidity/` tương ứng
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
- CẤM đọc/hiển thị nội dung `.env`, `.env.*` (trừ `.env.example`), `credentials.*`, `*.pem`, `*.key`, `*secret*`, `wp-config.php` — chỉ ghi tên file tồn tại, KHÔNG đọc nội dung
- Phân tích Frontend CHỈ khi detect được frontend framework (NextJS qua `next.config.*`, Vite qua `vite.config.*`, hoặc nhiều file `.tsx/.jsx`) — bỏ qua nếu không detect được. Các stack ngoài NextJS: chỉ liệt kê files, KHÔNG phân tích chi tiết
- Phân tích WordPress CHỈ khi detect được (`**/wp-config.php` hoặc `**/wp-content/plugins/*/` hoặc `**/wp-content/themes/*/style.css`) — quét plugins, themes, custom tables, REST API, hooks
- Phân tích Solidity CHỈ khi detect được (`**/hardhat.config.*` hoặc `**/foundry.toml` hoặc `**/contracts/**/*.sol`) — quét contracts, OZ imports, interfaces, events, modifiers, security patterns
- Phân tích Backend CHỈ khi detect được backend framework (NestJS qua `nest-cli.json`/`app.module.ts`, Express qua `app.js`/`app.ts` + `express` trong package.json) — bỏ qua nếu không detect được. Các stack ngoài NestJS: chỉ liệt kê files, KHÔNG phân tích chi tiết
- Nếu FastCode MCP lỗi → ghi warning trong report, tiếp tục với built-in tools (KHÔNG DỪNG)
- PHẢI cập nhật CONTEXT.md sau khi quét — đảm bảo context luôn phản ánh trạng thái hiện tại của dự án
- Nếu tech stack thay đổi so với CONTEXT.md cũ → PHẢI re-copy rules tương ứng vào `.planning/rules/`
</rules>
