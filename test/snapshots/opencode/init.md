---
description: Khởi tạo môi trường làm việc, kiểm tra MCP FastCode, tạo context gọn cho các skill sau
tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - mcp__fastcode__list_indexed_repos
  - mcp__fastcode__code_qa
---
<objective>
Skill chạy đầu tiên. Kiểm tra FastCode MCP (BẮT BUỘC), index dự án, phát hiện tech stack, tạo CONTEXT.md + copy rules phù hợp.
</objective>
<guards>
DUNG va huong dan user neu bat ky dieu kien nao that bai:
- [ ] Tham so path hop le (neu co) -> "Path khong ton tai hoac khong phai thu muc."
- [ ] FastCode MCP ket noi thanh cong -> "Kiem tra Docker dang chay va FastCode MCP da duoc cau hinh."
</guards>
<context>
User input: $ARGUMENTS (path dự án, mặc định thư mục hiện tại)
Rules templates: `.pdconfig` -> `SKILLS_DIR` -> rules tại `[SKILLS_DIR]/commands/pd/rules/`:
- `general.md` -- luôn copy
- `nestjs.md` / `nextjs.md` / `wordpress.md` / `solidity.md` / `flutter.md` -- copy nếu phát hiện stack tương ứng
</context>
<process>
## Bước 1: Xác định đường dẫn dự án
- `$ARGUMENTS` có path → dùng đó | Không → thư mục hiện tại
- Ghi nhận absolute path
## Bước 2: Kiểm tra FastCode MCP (BẮT BUỘC)
`mcp__fastcode__list_indexed_repos`:
- **THÀNH CÔNG** → "FastCode MCP: Hoạt động", tiếp tục
- **THẤT BẠI** → **DỪNG**: "FastCode MCP không hoạt động. Kiểm tra: (1) Đã chạy `node bin/install.js`? (2) API key Gemini trong `FastCode/.env`? (3) Đã restart sau cài? Chạy lại `/pd-init`."
## Bước 2.5: Kiểm tra CONTEXT.md hiện có
`.planning/CONTEXT.md` đã tồn tại → hỏi: "1. Giữ nguyên 2. Khởi tạo lại"
- Giữ → kiểm tra `.planning/rules/general.md`:
  - THIẾU → cảnh báo: "Rules bị thiếu. Nên khởi tạo lại." Hỏi lại.
  - CÓ → "Giữ nguyên. Sẵn sàng." + gợi ý `/pd-scan`/`/pd-what-next`. KHÔNG chạy tiếp.
- Khởi tạo lại → tiếp Bước 3
## Bước 3: Kiểm tra project có code chưa
Glob `**/*.{ts,tsx,js,jsx,py,php,sol,dart,html}` (trừ node_modules, .venv, .planning, wp-includes, wp-admin, artifacts, cache, build — KHÔNG gồm `.json`):
- **CÓ** → `isNewProject = false`, tiếp Bước 3a
- **KHÔNG** → `isNewProject = true`, nhảy Bước 4
### Bước 3a: Index dự án FastCode (CHỈ khi isNewProject = false)
`mcp__fastcode__code_qa` (repos: absolute path): "Liệt kê modules, tech stack, database type."
Pre-warm index — response bỏ qua. Lỗi → warning, tiếp Bước 4.
## Bước 4: Phát hiện tech stack
### isNewProject = false:
Dùng Glob/Grep/Read quét nhanh:
| Detection | Condition | Flag |
|-----------|-----------|------|
| NestJS | `**/nest-cli.json` → fallback `**/app.module.ts` → fallback `**/main.ts` + grep `NestFactory` | hasNestJS |
| Backend generic | `**/app.js`/`**/app.ts` + `express` trong package.json | hasBackend (chỉ general.md) |
| NextJS | `**/next.config.*` | hasNextJS |
| Frontend generic | `**/vite.config.*` hoặc >5 `.tsx/.jsx` | hasFrontend (chỉ general.md) |
| DB type | `**/*.module.ts` → grep `MongooseModule\|TypeOrmModule\|PrismaService` | — |
| WordPress | `**/wp-config.php` → fallback `**/wp-content/plugins/*/` hoặc `themes/*/style.css` | hasWordPress |
| Solidity | `**/hardhat.config.*` → fallback `**/foundry.toml` → fallback `**/contracts/**/*.sol` | hasSolidity |
| Flutter | `**/pubspec.yaml` + grep `flutter` → fallback `**/lib/main.dart` | hasFlutter |
- WordPress/Solidity/Flutter: giữ nguyên các flags khác (có thể kết hợp)
- Stack không có rules file → "Phát hiện [stack] nhưng chưa có rules template. Chỉ general.md."
Đọc nhanh: `package.json`, `.planning/CURRENT_MILESTONE.md`, `.planning/ROADMAP.md` (nếu có)
### isNewProject = true:
Hỏi: "Dự án mới chưa có code. Bạn muốn xây dựng gì?" → ghi nhận. Tất cả flags = false.
## Bước 5: Tạo .planning/ structure
```bash
mkdir -p .planning/scan .planning/docs .planning/bugs .planning/rules .planning/docs/solidity
```
## Bước 6: Copy rules vào .planning/rules/
Đọc `.pdconfig` → `SKILLS_DIR`. (Claude Code: `cat ~/.config/opencode/.pdconfig`)
Không tồn tại → **DỪNG**: "Không tìm thấy .pdconfig. Chạy lại `node bin/install.js`."
Xóa CHỈ files template: `general.md`, `nestjs.md`, `nextjs.md`, `wordpress.md`, `solidity.md`, `flutter.md`. Giữ files custom.
Copy từ `[SKILLS_DIR]/commands/pd/rules/` → `.planning/rules/`:
- **Luôn**: `general.md`
- hasNestJS → `nestjs.md`
- hasNextJS → `nextjs.md`
- hasWordPress → `wordpress.md`
- hasSolidity → `solidity.md` + copy `solidity-refs/` → `.planning/docs/solidity/`
- hasFlutter → `flutter.md`
- Project mới/stack khác → CHỈ `general.md`
## Bước 7: Tạo CONTEXT.md (DƯỚI 50 dòng)
```markdown
# Context dự án
> Khởi tạo: [DD_MM_YYYY HH:MM]
> Cập nhật: —
> Đường dẫn Backend: [path hoặc —]
> Đường dẫn Frontend: [path hoặc —]
> FastCode MCP: Hoạt động
> Dự án mới: [Có/Không]
## Tech Stack
(CHỈ stack CÓ — project mới ghi mô tả user)
- [stack]: [framework] | Thư mục: [dir]
- Database: [type] (nếu có)
## Thư viện chính
| Tên | Phiên bản |
(dependencies chính, bỏ devDeps, tối đa 20 dòng — bỏ section nếu project mới)
## Rules
`.planning/rules/`: (CHỈ files đã copy)
## Milestone hiện tại
(nếu có từ session trước)
```
## Bước 8: Thông báo kết quả
```
╔══════════════════════════════════════╗
║     Khởi tạo hoàn tất!              ║
╠══════════════════════════════════════╣
║ Dự án: [tên]                        ║
║ Tech:  [stacks]                     ║
║ MCP:   ✅ Hoạt động                 ║
║ Context: .planning/CONTEXT.md       ║
║ Rules: .planning/rules/             ║
║ Docs:  .planning/docs/ (nếu có)     ║
╠══════════════════════════════════════╣
║ Tiếp: /pd-scan hoặc /pd-new-milestone║
╚══════════════════════════════════════╝
```
</process>
<output>
**Tao/Cap nhat:**
- `.planning/CONTEXT.md` -- project context
- `.planning/rules/*.md` -- framework rules (conditional)
**Buoc tiep theo:** `/pd-scan` hoac `/pd-plan`
**Thanh cong khi:**
- CONTEXT.md day du thong tin tech stack
- FastCode MCP xac nhan ket noi
**Loi thuong gap:**
- FastCode MCP khong ket noi -> kiem tra Docker dang chay
- Khong phat hien tech stack -> user them thong tin thu cong
</output>
<rules>
- Moi output PHAI bang tieng Viet co dau
- PHAI xac nhan FastCode MCP ket noi truoc khi thuc hien bat ky buoc nao
- KHONG duoc thay doi file ngoai .planning/
- CONTEXT.md DƯỚI 50 dòng — chỉ info dự án
- Coding rules riêng `.planning/rules/*.md` — copy từ `[SKILLS_DIR]/commands/pd/rules/` (path từ `.pdconfig`)
- Chỉ copy rules phù hợp tech stack (hasNestJS/hasNextJS/hasWordPress/hasSolidity/hasFlutter)
- Project mới: skip FastCode indexing, hỏi mô tả, chỉ copy general.md
- FastCode MCP PHẢI kết nối thành công → DỪNG nếu thất bại
- CẤM đọc/hiển thị `.env`, `.env.*` (trừ `.env.example`), `credentials.*`, `*.pem`, `*.key`, `*secret*`, `wp-config.php`
- CONTEXT.md đã có → hỏi giữ/khởi tạo lại
</rules>
