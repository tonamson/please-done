---
name: sk:init
description: Khởi tạo môi trường làm việc, kiểm tra MCP FastCode, tạo context gọn cho các skill sau
---

<objective>
Skill đầu tiên phải chạy trước mọi skill khác. Kiểm tra FastCode MCP (BẮT BUỘC kết nối thành công), index project, phát hiện tech stack, tạo CONTEXT.md + copy rules phù hợp vào .planning/rules/.
</objective>

<context>
User input: $ARGUMENTS (path dự án, mặc định thư mục hiện tại)

Rules templates: đọc `.skconfig` tại `~/.claude/commands/sk/.skconfig` → lấy `SKILLS_DIR` → rules nằm tại `[SKILLS_DIR]/commands/sk/rules/`:
- `general.md` — quy tắc chung (luôn copy)
- `backend.md` — quy tắc NestJS (chỉ copy nếu có backend)
- `frontend.md` — quy tắc NextJS (chỉ copy nếu có frontend)
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
  > 1. Đã chạy `install.sh` chưa?
  > 2. API key Gemini đã điền trong `FastCode/.env` chưa?
  > 3. Đã khởi động lại Claude Code sau khi cài chưa?
  > Chạy lại `/sk:init` sau khi khắc phục."

## Bước 3: Kiểm tra project có code chưa
Glob `**/*.{ts,tsx,js,jsx,py,html,json}` (trừ node_modules, .venv, .planning):
- **CÓ source files** → `isNewProject = false`, tiếp tục Bước 3a
- **KHÔNG có source files** (folder trống/chỉ có README) → `isNewProject = true`, nhảy sang Bước 4

### Bước 3a: Index dự án trong FastCode (CHỈ khi isNewProject = false)
Gọi `mcp__fastcode__code_qa`:
- repos: [đường dẫn absolute của project]
- question: "Liệt kê tất cả modules, tech stack, database type đang dùng."

Mục đích: pre-warm index để các skill sau gọi nhanh hơn.

## Bước 4: Phát hiện tech stack
### Nếu isNewProject = false:
Dùng built-in tools (Glob, Grep, Read) quét nhanh:
- Glob `**/nest-cli.json` → **hasBackend = true**
- Glob `**/next.config.*` → **hasFrontend = true**
- Glob `**/*.module.ts` → Grep `MongooseModule|TypeOrmModule|PrismaService` → xác định DB type

Đọc nhanh:
- `package.json` (backend + frontend nếu tách thư mục) → dependencies chính
- `.planning/CURRENT_MILESTONE.md` (nếu có, từ session trước)
- `.planning/ROADMAP.md` (nếu có, chỉ lấy milestone hiện tại)

### Nếu isNewProject = true:
Hỏi user: "Dự án mới chưa có code. Bạn muốn xây dựng gì?"
- Ghi nhận mô tả dự án từ user (VD: "Chrome extension", "CLI tool", "React Native app")
- `hasBackend`, `hasFrontend` = false (sẽ được detect lại khi có code)
- `projectType` = mô tả từ user

## Bước 5: Tạo .planning/ structure
```bash
mkdir -p .planning/scan .planning/docs .planning/bugs .planning/rules
```

## Bước 6: Tạo CONTEXT.md (GỌN — chỉ chứa info dự án)
Tạo `.planning/CONTEXT.md`:

```markdown
# Context dự án
> Khởi tạo: [DD_MM_YYYY HH:MM]
> Đường dẫn: [absolute path]
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
- `general.md` — quy tắc chung (luôn đọc)
- `backend.md` — quy tắc NestJS (chỉ khi có NestJS)
- `frontend.md` — quy tắc NextJS (chỉ khi có NextJS)

## Milestone hiện tại
(nếu có từ session trước)
- Version: [x.x]
- Phase: [x.x]
- Trạng thái: [...]
```

**CONTEXT.md phải DƯỚI 50 dòng** — chỉ chứa info dự án + pointer tới rules files.

## Bước 7: Copy rules vào .planning/rules/
Đọc `.skconfig` (Bash: `cat ~/.claude/commands/sk/.skconfig`) → lấy giá trị `SKILLS_DIR`.
Đọc rules từ `[SKILLS_DIR]/commands/sk/rules/` → Write vào `.planning/rules/`:

- **Luôn copy**: `general.md`
- **Nếu hasBackend = true**: copy `backend.md`
- **Nếu hasFrontend = true**: copy `frontend.md`
- **Nếu project mới hoặc stack khác** (Chrome extension, CLI, v.v.): CHỈ copy `general.md`

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
║   - backend.md (nếu có)             ║
║   - frontend.md (nếu có)            ║
╠══════════════════════════════════════╣
║ Tiếp theo:                          ║
║   /sk:scan   → Quét chi tiết        ║
║   /sk:roadmap → Lập lộ trình        ║
╚══════════════════════════════════════╝
```
</process>

<rules>
- CONTEXT.md DƯỚI 50 dòng — chỉ info dự án, KHÔNG chứa coding rules
- Coding rules nằm riêng trong `.planning/rules/*.md` — copy từ `[SKILLS_DIR]/commands/sk/rules/` (path lấy từ `.skconfig`)
- Chỉ copy rules files phù hợp với tech stack detected (hasBackend/hasFrontend)
- Project mới (isNewProject = true): skip FastCode indexing, hỏi user mô tả dự án, chỉ copy general.md
- Sau này thêm stack mới (React Native, Flutter...) = thêm 1 file `commands/sk/rules/[stack].md` + thêm detection pattern ở Bước 4
- FastCode MCP PHẢI kết nối thành công → DỪNG nếu thất bại, KHÔNG có fallback
- CẤM đọc/ghi/hiển thị nội dung file nhạy cảm (`.env`, `.env.*`, `credentials.*`, `*.pem`, `*.key`, `*secret*`)
- Nếu đã có CONTEXT.md từ session trước → hỏi user muốn khởi tạo lại hay giữ
</rules>
