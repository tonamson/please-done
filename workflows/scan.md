<purpose>
Quét dự án, phân tích cấu trúc code, dependencies, kiến trúc, kiểm tra bảo mật, tạo báo cáo.

Ghi chú: `~/.claude/` dùng cho Claude Code. Trình cài đặt chuyển đổi sang đường dẫn phù hợp nền tảng khác.
</purpose>

<process>

## Bước 1: Xác định đường dẫn
- `$ARGUMENTS` có path → dùng đó | Không → thư mục hiện tại
- Tạo `.planning/scan/` nếu chưa có

## Bước 2: Kiểm tra project có code không
Glob `**/*.{ts,tsx,js,jsx,py,php,sol,dart,html}` (trừ node_modules, .venv, .planning, wp-includes, wp-admin, artifacts, cache, build — KHÔNG gồm .json/.css):
- **KHÔNG có source files** → nhảy **Bước 5** tạo scan report tối giản: "Dự án mới, chưa có code. Tech stack dự kiến: [từ CONTEXT.md]". KHÔNG chạy Bước 3, 4, 6.
- **CÓ** → tiếp tục

## Bước 2a: Quét cấu trúc bằng built-in tools
- **Glob** tìm file: `**/*.ts`, `**/*.tsx`, `**/*.json`, `**/*.prisma`, `**/*.sol`, `**/Dockerfile`
- **Read** config: `package.json`, `tsconfig.json`, `nest-cli.json`, `next.config.*`, `prisma/schema.prisma`
- **Grep** patterns:

| Stack | Detect condition | Grep patterns |
|-------|-----------------|---------------|
| NestJS | — | `@Module`, `@Controller`, `@Injectable`, `@Entity`, `@Guard`, `@Get/@Post/@Put/@Patch/@Delete` (*.ts) |
| NextJS | `next.config.*` tồn tại | Pages `**/app/**/page.tsx`, Components `**/components/**/*.tsx`, `'use client'`, Stores `**/stores/use*.{ts,tsx}`, Hooks `**/hooks/use*.{ts,tsx}`, API `**/lib/api.ts`, Types `**/types/*.ts` |
| WordPress | `**/wp-config.php` / `**/wp-content/plugins/*/` / `**/wp-content/themes/*/style.css` | Plugins, Themes, `dbDelta\|\$wpdb->prefix`, `register_rest_route`, `add_action\|add_filter` (*.php) |
| Solidity | `**/hardhat.config.*` / `**/foundry.toml` / `**/contracts/**/*.sol` | Contracts, `import.*@openzeppelin`, `interface\s+`, `event `, `modifier\s+\w+`, `nonReentrant\|whenNotPaused\|onlyOwner` (*.sol) |
| Flutter | `**/pubspec.yaml` + `flutter` dependency | Screens `**/modules/**/*_view.dart`, `extends GetxController`, `GetPage\(`, `fromJson\|toJson`, `pubspec.yaml` packages |

## Bước 3: Bổ sung bằng FastCode MCP (CHỈ khi có code)
Validate đường dẫn CONTEXT.md khớp `pwd`. Khác → cảnh báo user.

`mcp__fastcode__code_qa` (repos: đường dẫn từ CONTEXT.md):
- "Phân tích cấu trúc project, liệt kê modules, services, controllers, routes, models, utilities."

FastCode MCP lỗi → ghi warning trong report, tiếp tục với Bước 2a. KHÔNG DỪNG.

## Bước 4: Kiểm tra bảo mật dependencies (CHỈ khi có package.json)
Detect: `yarn.lock` → yarn | `pnpm-lock.yaml` → pnpm | mặc định → npm.
```bash
# npm:  cd [dir] && npm audit --omit=dev 2>&1 | tail -30
# yarn: cd [dir] && yarn audit --groups production 2>&1 | tail -30
# pnpm: cd [dir] && pnpm audit --prod 2>&1 | tail -30
```
Audit fail (không phải vulnerabilities) → ghi "Audit command thất bại". Liệt kê lỗ hổng theo mức độ + backend/frontend.

## Bước 5: Tạo báo cáo
Viết `.planning/scan/SCAN_REPORT.md`:
```markdown
# Báo cáo quét dự án
> Ngày quét: [DD_MM_YYYY HH:MM] | Dự án: [tên] | Đường dẫn: [path]

## Tổng quan
## Cấu trúc thư mục
## Thư viện (Dependencies / DevDependencies)
## Cảnh báo bảo mật
## Phân tích Backend (NestJS: Modules | Controllers & Routes | Services | Entities | Guards & Middleware)
## Phân tích Frontend (NextJS: Pages & Routing | Components | State Management | API Layer | UI Framework | SEO)
## Phân tích WordPress (Plugins | Themes | Custom Tables | REST API | Hooks)
## Phân tích Solidity (Contracts | OZ Imports | Security Modifiers | Events)
## Phân tích Flutter (Screens & Navigation | State Management | Packages)
## Cơ sở dữ liệu
## Xác thực & Phân quyền
## Trạng thái hoàn thành
## Vấn đề & Đề xuất
```
**CHỈ tạo sections có dữ liệu.** Bỏ section rỗng.

## Bước 6: Cập nhật CONTEXT.md + Rules
**CHỈ khi có code. Project mới → bỏ qua.**

1. **Re-detect tech stack** (cùng pattern init.md): NestJS `nest-cli.json` → `app.module.ts` → `main.ts`+`NestFactory` | NextJS `next.config.*` | WordPress `wp-config.php`/`wp-content/` | Solidity `hardhat.config.*`/`foundry.toml`/`contracts/**/*.sol` | Flutter `pubspec.yaml`+`flutter`

2. **Cập nhật CONTEXT.md** (giữ format gốc, DƯỚI 50 dòng):
   - `Dự án mới: Không` (nếu có source). Cập nhật `> Cập nhật:`, Tech Stack, Thư viện chính (tối đa 20 dòng, bỏ devDeps), Rules files

3. **Re-copy rules nếu tech stack thay đổi**:
   So sánh stack mới vs cũ → KHÁC → đọc `.pdconfig` → `SKILLS_DIR` → xóa template files (`general.md`, `nestjs.md`, `nextjs.md`, `wordpress.md`, `solidity.md`, `flutter.md`) giữ custom → copy lại phù hợp. hasSolidity thay đổi → copy/xóa `solidity-refs/` ↔ `.planning/docs/solidity/`. Không có `.pdconfig` → bỏ qua, warning.
   Stack GIỐNG → không copy lại.

## Bước 7: Thông báo
Tóm tắt kết quả. Nếu CONTEXT.md/rules cập nhật → thông báo rõ.
</process>

<rules>
- Tuân thủ `.planning/rules/general.md` (ngôn ngữ, ngày tháng, bảo mật)
- Không sửa code, chỉ quét và báo cáo
- Project mới → scan report tối giản, KHÔNG gọi FastCode, KHÔNG npm audit
- CHỈ sections có dữ liệu, bỏ rỗng
- "Trạng thái hoàn thành" BẮT BUỘC
- PHẢI liệt kê thư viện + chạy audit NẾU có package.json
- CẤM đọc/hiển thị `.env`, `.env.*` (trừ `.env.example`), `credentials.*`, `*.pem`, `*.key`, `*secret*`, `wp-config.php` — chỉ ghi tên file
- Frontend CHỈ khi detect được framework (NextJS `next.config.*`, Vite `vite.config.*`, hoặc >5 `.tsx/.jsx`). Ngoài NextJS: chỉ liệt kê files
- WordPress CHỈ khi detect `wp-config.php`/`wp-content/`
- Solidity CHỈ khi detect `hardhat.config.*`/`foundry.toml`/`contracts/**/*.sol`
- Flutter CHỈ khi detect `pubspec.yaml` + `flutter`
- Backend CHỈ khi detect framework (NestJS `nest-cli.json`/`app.module.ts`, Express `app.js`/`app.ts`+`express`). Ngoài NestJS: chỉ liệt kê files
- FastCode lỗi → warning, tiếp tục built-in tools
- PHẢI cập nhật CONTEXT.md sau quét
- Tech stack thay đổi → PHẢI re-copy rules
</rules>
</output>