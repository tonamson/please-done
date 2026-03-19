---
name: pd:init
description: Khởi tạo môi trường làm việc, kiểm tra MCP FastCode, tạo context gọn cho các skill sau
---

<objective>
Skill đầu tiên phải chạy trước mọi skill khác. Kiểm tra FastCode MCP (BẮT BUỘC kết nối thành công), index project, phát hiện tech stack, tạo CONTEXT.md + copy rules phù hợp vào .planning/rules/.
</objective>

<context>
User input: $ARGUMENTS (path dự án, mặc định thư mục hiện tại)

Rules templates: đọc `.pdconfig` tại `~/.claude/commands/pd/.pdconfig` → lấy `SKILLS_DIR` → rules nằm tại `[SKILLS_DIR]/commands/pd/rules/`:
- `general.md` — quy tắc chung (luôn copy)
- `nestjs.md` — quy tắc NestJS (chỉ copy nếu có NestJS)
- `nextjs.md` — quy tắc NextJS (chỉ copy nếu có NextJS)
- `wordpress.md` — quy tắc WordPress (chỉ copy nếu có WordPress)
- `solidity.md` — quy tắc Solidity smart contract (chỉ copy nếu có Solidity)
- `flutter.md` — quy tắc Flutter/Dart (chỉ copy nếu có Flutter)
</context>

<process>

## Bước 1: Xác định đường dẫn dự án
- Nếu `$ARGUMENTS` có path → dùng path đó
- Nếu không → dùng thư mục hiện tại
- Ghi nhận absolute path

## Bước 2: Kiểm tra FastCode MCP (BẮT BUỘC)
Gọi `mcp__fastcode__list_indexed_repos` để kiểm tra MCP server:

- **THÀNH CÔNG** → ghi nhận "FastCode MCP: Hoạt động", tiếp tục
- **THẤT BẠI** → **DỪNG NGAY**, thông báo:
  > "FastCode MCP không hoạt động. Không thể tiếp tục.
  > Kiểm tra:
  > 1. Đã chạy `node bin/install.js` chưa?
  > 2. API key Gemini đã điền trong `FastCode/.env` chưa?
  > 3. Đã khởi động lại Claude Code sau khi cài chưa?
  > Chạy lại `/pd:init` sau khi khắc phục."

## Bước 2.5: Kiểm tra CONTEXT.md hiện có
Nếu `.planning/CONTEXT.md` đã tồn tại:
- Thông báo: "Đã có CONTEXT.md từ session trước. Bạn muốn:
  1. Giữ nguyên và bỏ qua init
  2. Khởi tạo lại từ đầu"
- Nếu giữ → kiểm tra `.planning/rules/general.md` tồn tại:
  - Nếu THIẾU → cảnh báo: "Rules files bị thiếu. Nên chọn 'Khởi tạo lại' để tái tạo rules." Hỏi lại user.
  - Nếu CÓ → thông báo ngắn: "Giữ nguyên CONTEXT.md hiện có. Môi trường sẵn sàng." kèm gợi ý `/pd:scan` hoặc `/pd:what-next`. KHÔNG chạy tiếp các bước sau.
- Nếu khởi tạo lại → tiếp tục Bước 3 bình thường

## Bước 3: Kiểm tra project có code chưa
Glob `**/*.{ts,tsx,js,jsx,py,php,sol,dart,html}` (trừ node_modules, .venv, .planning, wp-includes, wp-admin, artifacts, cache, build) — KHÔNG bao gồm `.json` vì `package.json` alone không phải source code:
- **CÓ source files** → `isNewProject = false`, tiếp tục Bước 3a
- **KHÔNG có source files** (folder trống/chỉ có README/package.json) → `isNewProject = true`, nhảy sang Bước 4

### Bước 3a: Index dự án trong FastCode (CHỈ khi isNewProject = false)
Gọi `mcp__fastcode__code_qa`:
- repos: [đường dẫn absolute của project]
- question: "Liệt kê tất cả modules, tech stack, database type đang dùng."

Mục đích: pre-warm index để các skill sau gọi nhanh hơn. Response bị bỏ qua (chỉ trigger indexing).
Nếu `code_qa` lỗi ở bước này → ghi warning, tiếp tục sang Bước 4 (pre-warm thất bại không ảnh hưởng init).

## Bước 4: Phát hiện tech stack
### Nếu isNewProject = false:
Dùng built-in tools (Glob, Grep, Read) quét nhanh:
- Glob `**/nest-cli.json` → **hasNestJS = true**
- Fallback NestJS: Glob `**/app.module.ts` → **hasNestJS = true** (NestJS không có nest-cli)
- Fallback NestJS: Glob `**/main.ts` → Grep `NestFactory` trong file đó → **hasNestJS = true** (KHÔNG dùng main.ts alone — quá broad, match Vite/Angular/vanilla TS)
- Fallback backend: Glob `**/app.js` hoặc `**/app.ts` + Grep `express` trong package.json → **hasBackend = true** (Express — chỉ general.md, chưa có rules riêng)
- Glob `**/next.config.*` → **hasNextJS = true**
- Fallback frontend: Glob `**/vite.config.*` → **hasFrontend = true** (Vite — chỉ general.md, chưa có rules riêng)
- Fallback frontend: Glob `**/*.tsx` + `**/*.jsx` — nếu có nhiều files (>5) → **hasFrontend = true** (React generic — chỉ general.md, chưa có rules riêng)
- Glob `**/*.module.ts` → Grep `MongooseModule|TypeOrmModule|PrismaService` → xác định DB type
- Glob `**/wp-config.php` → **hasWordPress = true**
- Fallback WordPress: Glob `**/wp-content/plugins/*/` hoặc `**/wp-content/themes/*/style.css` → **hasWordPress = true**
- Nếu hasWordPress = true: `hasNestJS`, `hasNextJS`, `hasBackend`, `hasFrontend` giữ nguyên (WordPress project có thể kết hợp NestJS API hoặc React frontend)
- Glob `**/hardhat.config.*` → **hasSolidity = true**
- Fallback Solidity: Glob `**/foundry.toml` → **hasSolidity = true**
- Fallback Solidity: Glob `**/contracts/**/*.sol` — nếu có files `.sol` (>0) → **hasSolidity = true**
- Nếu hasSolidity = true: `hasNestJS`, `hasNextJS`, `hasBackend`, `hasFrontend` giữ nguyên (Solidity project có thể kết hợp NestJS API hoặc React frontend)
- Glob `**/pubspec.yaml` → Grep `flutter` trong file đó → **hasFlutter = true**
- Fallback Flutter: Glob `**/lib/main.dart` → **hasFlutter = true**
- Nếu hasFlutter = true: `hasNestJS`, `hasNextJS`, `hasBackend`, `hasFrontend` giữ nguyên (Flutter project có thể kết hợp NestJS API hoặc React frontend)
- Khi detect stack không có rules file tương ứng trong `[SKILLS_DIR]/commands/pd/rules/` → thông báo: "Phát hiện [stack] nhưng chưa có rules template. Chỉ áp dụng general.md."

Đọc nhanh:
- `package.json` (backend + frontend nếu tách thư mục) → dependencies chính
- `.planning/CURRENT_MILESTONE.md` (nếu có, từ session trước)
- `.planning/ROADMAP.md` (nếu có, chỉ lấy milestone hiện tại)

### Nếu isNewProject = true:
Hỏi user: "Dự án mới chưa có code. Bạn muốn xây dựng gì?"
- Ghi nhận mô tả dự án từ user (VD: "Chrome extension", "CLI tool", "React Native app")
- `hasNestJS`, `hasNextJS`, `hasBackend`, `hasFrontend` = false (sẽ được detect lại khi có code)
- `projectType` = mô tả từ user

## Bước 5: Tạo .planning/ structure
```bash
mkdir -p .planning/scan .planning/docs .planning/bugs .planning/rules
```

## Bước 6: Copy rules vào .planning/rules/
Đọc `.pdconfig` (Bash: `cat ~/.claude/commands/pd/.pdconfig`) → lấy giá trị `SKILLS_DIR`.
Nếu `.pdconfig` không tồn tại hoặc không có `SKILLS_DIR` → **DỪNG**, thông báo: "Không tìm thấy .pdconfig. Chạy lại `node bin/install.js`."

**Chỉ xóa các files template**: `general.md`, `nestjs.md`, `nextjs.md`, `wordpress.md`, `solidity.md`, `flutter.md`. Giữ nguyên files custom khác (nếu có). → đảm bảo rules phù hợp với tech stack hiện tại (VD: nếu NestJS bị xóa, nestjs.md cũ cũng bị xóa) mà không mất rules do user tự thêm.

Đọc rules từ `[SKILLS_DIR]/commands/pd/rules/` → Write vào `.planning/rules/`:

- **Luôn copy**: `general.md`
- **Nếu hasNestJS = true**: copy `nestjs.md` + copy thư mục `[SKILLS_DIR]/commands/pd/rules/nestjs-refs/` → `.planning/docs/nestjs/` (reference docs cho tra cứu khi code)
- **Nếu hasNextJS = true**: copy `nextjs.md` + copy thư mục `[SKILLS_DIR]/commands/pd/rules/nextjs-refs/` → `.planning/docs/nextjs/` (reference docs cho tra cứu khi code)
- **Nếu hasWordPress = true**: copy `wordpress.md` + copy thư mục `[SKILLS_DIR]/commands/pd/rules/wordpress-refs/` → `.planning/docs/wordpress/` (reference docs cho tra cứu khi code)
- **Nếu hasSolidity = true**: copy `solidity.md` + copy thư mục `[SKILLS_DIR]/commands/pd/rules/solidity-refs/` → `.planning/docs/solidity/` (reference docs cho tra cứu khi code)
- **Nếu hasFlutter = true**: copy `flutter.md` + copy thư mục `[SKILLS_DIR]/commands/pd/rules/flutter-refs/` → `.planning/docs/flutter/` (reference docs cho tra cứu khi code)
- **Nếu project mới hoặc stack khác** (Chrome extension, CLI, v.v.): CHỈ copy `general.md`

## Bước 7: Tạo CONTEXT.md (GỌN — chỉ chứa info dự án)
Tạo `.planning/CONTEXT.md`:

```markdown
# Context dự án
> Khởi tạo: [DD_MM_YYYY HH:MM]
> Cập nhật: —
> Đường dẫn Backend: [path hoặc —]
> Đường dẫn Frontend: [path hoặc —]
> FastCode MCP: Hoạt động
> Dự án mới: [Có/Không]

## Tech Stack
(CHỈ ghi stack CÓ trong project — nếu project mới thì ghi mô tả từ user)
- [stack]: [framework/tool] | Thư mục: [dir]
- Database: [type] (nếu có)

## Thư viện chính
| Tên | Phiên bản |
|-----|-----------|
(chỉ dependencies chính, bỏ devDeps, tối đa 20 dòng — bỏ section nếu project mới)

## Rules
Quy tắc code nằm tại `.planning/rules/`:
(CHỈ liệt kê rules files đã copy ở Bước 6 — KHÔNG liệt kê files không tồn tại)

## Milestone hiện tại
(nếu có từ session trước)
- Version: [x.x]
- Phase: [x.x]
- Trạng thái: [...]
```

**CONTEXT.md phải DƯỚI 50 dòng** — chỉ chứa info dự án + pointer tới rules files.

## Bước 8: Thông báo kết quả
```
╔══════════════════════════════════════╗
║     Khởi tạo hoàn tất!              ║
╠══════════════════════════════════════╣
║ Dự án: [tên]                        ║
║ Tech:  [stacks detected]            ║
║ MCP:   ✅ Hoạt động                 ║
║ Context: .planning/CONTEXT.md       ║
║ Rules:   .planning/rules/           ║
║   - general.md                      ║
║   - nestjs.md (nếu có)              ║
║   - nextjs.md (nếu có)             ║
║   - wordpress.md (nếu có)           ║
║   - solidity.md (nếu có)            ║
║   - flutter.md (nếu có)             ║
║ Docs:    .planning/docs/            ║
║   - nestjs/ (nếu có NestJS)         ║
║   - nextjs/ (nếu có NextJS)        ║
║   - wordpress/ (nếu có WordPress)   ║
║   - solidity/ (nếu có Solidity)     ║
║   - flutter/ (nếu có Flutter)       ║
╠══════════════════════════════════════╣
║ Tiếp theo:                          ║
║   /pd:scan   → Quét chi tiết        ║
║   /pd:new-milestone → Lập lộ trình   ║
╚══════════════════════════════════════╝
```
</process>

<rules>
- CONTEXT.md DƯỚI 50 dòng — chỉ info dự án, KHÔNG chứa coding rules
- Coding rules nằm riêng trong `.planning/rules/*.md` — copy từ `[SKILLS_DIR]/commands/pd/rules/` (path lấy từ `.pdconfig`)
- Chỉ copy rules files phù hợp với tech stack detected (hasNestJS/hasNextJS/hasWordPress/hasSolidity/hasFlutter)
- Nếu hasNestJS = true: copy `nestjs.md` vào `.planning/rules/` + copy `nestjs-refs/` vào `.planning/docs/nestjs/`
- Nếu hasNextJS = true: copy `nextjs.md` vào `.planning/rules/` + copy `nextjs-refs/` vào `.planning/docs/nextjs/`
- Nếu hasWordPress = true: copy `wordpress.md` vào `.planning/rules/` + copy `wordpress-refs/` vào `.planning/docs/wordpress/`
- Nếu hasSolidity = true: copy `solidity.md` vào `.planning/rules/` + copy `solidity-refs/` vào `.planning/docs/solidity/`
- Nếu hasFlutter = true: copy `flutter.md` vào `.planning/rules/` + copy `flutter-refs/` vào `.planning/docs/flutter/`
- Project mới (isNewProject = true): skip FastCode indexing, hỏi user mô tả dự án, chỉ copy general.md
- Sau này thêm stack mới (React Native, Laravel...) = thêm 1 file `commands/pd/rules/[stack].md` + thêm detection pattern ở Bước 4
- FastCode MCP PHẢI kết nối thành công → DỪNG nếu thất bại, KHÔNG có fallback
- CẤM đọc/ghi/hiển thị nội dung file nhạy cảm (`.env`, `.env.*` (trừ `.env.example`), `credentials.*`, `*.pem`, `*.key`, `*secret*`, `wp-config.php`)
- Nếu đã có CONTEXT.md từ session trước → hỏi user muốn khởi tạo lại hay giữ
</rules>
