<purpose>
Skill đầu tiên — kiểm tra FastCode MCP (BẮT BUỘC), index dự án, phát hiện tech stack, tạo CONTEXT.md + copy rules.

Ghi chú: `~/.claude/` dùng cho Claude Code. Trình cài đặt chuyển đổi đường dẫn phù hợp nền tảng khác.
</purpose>

<process>

## Bước 1: Xác định đường dẫn dự án
- `$ARGUMENTS` có path → dùng đó | Không → thư mục hiện tại
- Ghi nhận absolute path

## Bước 2: Kiểm tra FastCode MCP (BẮT BUỘC)
`mcp__fastcode__list_indexed_repos`:
- **THÀNH CÔNG** → "FastCode MCP: Hoạt động", tiếp tục
- **THẤT BẠI** → Canh bao: "FastCode MCP khong hoat dong. Code search se dung Grep/Read (cham hon)."
  Tiep tuc khong co FastCode -- chuc nang co ban van hoat dong (Grep/Read fallback).
  Hien thi: "Tiep tuc khong co FastCode? (Khuyen nghi: Co)"

## Bước 2.5: Kiểm tra CONTEXT.md hiện có
`.planning/CONTEXT.md` đã tồn tại → hỏi: "1. Giữ nguyên 2. Khởi tạo lại"
- Giữ → kiểm tra `.planning/rules/general.md`:
  - THIẾU → cảnh báo: "Rules bị thiếu. Nên khởi tạo lại." Hỏi lại.
  - CÓ → "Giữ nguyên. Sẵn sàng." + gợi ý `/pd:scan`/`/pd:what-next`. KHÔNG chạy tiếp.
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
Đọc `.pdconfig` → `SKILLS_DIR`. (Claude Code: `cat ~/.claude/commands/pd/.pdconfig`)
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
║ Tiếp: /pd:scan hoặc /pd:new-milestone║
╚══════════════════════════════════════╝
```
</process>

<rules>
- CONTEXT.md DƯỚI 50 dòng — chỉ info dự án
- Coding rules riêng `.planning/rules/*.md` — copy từ `[SKILLS_DIR]/commands/pd/rules/` (path từ `.pdconfig`)
- Chỉ copy rules phù hợp tech stack (hasNestJS/hasNextJS/hasWordPress/hasSolidity/hasFlutter)
- Project mới: skip FastCode indexing, hỏi mô tả, chỉ copy general.md
- FastCode MCP PHẢI kết nối thành công → DỪNG nếu thất bại
- CẤM đọc/hiển thị `.env`, `.env.*` (trừ `.env.example`), `credentials.*`, `*.pem`, `*.key`, `*secret*`, `wp-config.php`
- CONTEXT.md đã có → hỏi giữ/khởi tạo lại
</rules>