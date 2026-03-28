---
name: pd-init
description: Initialize the workspace, verify FastCode MCP, and create compact context for later skills
---
<codex_skill_adapter>
## Cách gọi skill này
Skill name: `$pd-init`
Khi user gọi `$pd-init {{args}}`, thực hiện toàn bộ instructions bên dưới.
## Tool mapping
- `AskUserQuestion` → `request_user_input`: Khi cần hỏi user, dùng request_user_input thay vì AskUserQuestion
- `Task()` → `spawn_agent()`: Khi cần spawn sub-agent, dùng spawn_agent với fork_context
  - Chờ kết quả: `wait(agent_ids)`
  - Kết thúc agent: `close_agent()`
## Fallback tương thích
- Nếu `request_user_input` không khả dụng trong mode hiện tại, hỏi user bằng văn bản thường bằng 1 câu ngắn gọn rồi chờ user trả lời
- Mọi chỗ ghi "PHẢI dùng `request_user_input`" được hiểu là: ưu tiên dùng khi tool khả dụng; nếu không thì fallback sang hỏi văn bản thường, không được tự đoán thay user
## Quy ước
- `$ARGUMENTS` chính là `{{GSD_ARGS}}` — input từ user khi gọi skill
- Tất cả paths config đã được chuyển sang `~/.codex/`
- Các MCP tools (`mcp__*`) hoạt động tự động qua config.toml
- Đọc `~/.codex/.pdconfig` (cat ~/.codex/.pdconfig) → lấy `SKILLS_DIR`
- Các tham chiếu `[SKILLS_DIR]/templates/*`, `[SKILLS_DIR]/references/*` → đọc từ thư mục source tương ứng
</codex_skill_adapter>
<objective>
First skill to run. Verify FastCode MCP (REQUIRED), index the project, detect the tech stack, create `CONTEXT.md`, and copy the relevant rules.
</objective>
<guards>
Stop and instruct the user if any of the following conditions fail:
- [ ] Tham so path hop le (neu co) -> "Path khong ton tai hoac khong phai thu muc."
- [ ] FastCode MCP ket noi thanh cong -> "Kiem tra Docker dang chay va FastCode MCP da duoc cau hinh."
</guards>
<context>
User input: {{GSD_ARGS}} (project path, defaults to the current directory)
Rule templates: `.pdconfig` -> `SKILLS_DIR` -> files at `[SKILLS_DIR]/commands/pd/rules/`:
- `general.md` -- always copy
- `nestjs.md` / `nextjs.md` / `wordpress.md` / `solidity.md` / `flutter.md` -- copy when the corresponding stack is detected
</context>
<process>
## Bước 1: Xác định đường dẫn dự án
- `{{GSD_ARGS}}` có path → dùng đó | Không → thư mục hiện tại
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
  - CÓ → "Giữ nguyên. Sẵn sàng." + gợi ý `$pd-scan`/`$pd-what-next`. KHÔNG chạy tiếp.
- Khởi tạo lại → tiếp Bước 3
## Bước 3: Kiểm tra project có code chưa
Glob `**/*.{ts,tsx,js,jsx,py,php,sol,dart,html}` (trừ node_modules, .venv, .planning, wp-includes, wp-admin, artifacts, cache, build — KHÔNG gồm `.json`):
- **CÓ** → `isNewProject = false`, tiếp Bước 3a
- **KHÔNG** → `isNewProject = true`, nhảy Bước 4
### Bước 3a: Index dự án FastCode (CHỈ khi isNewProject = false)
`mcp__fastcode__code_qa` (repos: absolute path): "Liệt kê modules, tech stack, database type."
Pre-warm index — response bỏ qua. Lỗi → warning, tiếp Bước 3b.
### Bước 3b: Map codebase (CHỈ khi isNewProject = false)
Kiểm tra `.planning/codebase/STRUCTURE.md` tồn tại:
- **CÓ** → "Codebase đã được map. Bỏ qua." Nhảy Bước 4.
- **KHÔNG** → Tạo thư mục và spawn mapper:
```bash
mkdir -p .planning/codebase
```
Spawn pd-codebase-mapper agent:
```
Task(prompt="
Map codebase của dự án tại đường dẫn hiện tại.
Tạo các file output vào .planning/codebase/:
- STRUCTURE.md — cấu trúc thư mục
- TECH_STACK.md — tech stack
- ENTRY_POINTS.md — entry points
- DEPENDENCIES.md — dependency graph
", subagent_type="pd-codebase-mapper", model="haiku", description="Map codebase structure")
```
- **THÀNH CÔNG** → "Codebase mapped: .planning/codebase/"
- **THẤT BẠI** → Warning: "Mapper thất bại. Tiếp tục không có codebase map." Tiếp tục Bước 4 — KHÔNG block init.
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
## Bước 4.5: Thảo luận Chính sách Ngôn ngữ & Báo lỗi [MỚI]
Agent sử dụng `request_user_input` để chốt chiến lược ngôn ngữ cho 3 tầng:
1. **Giao diện (UI):** Thông báo lỗi/thành công cho người dùng cuối.
2. **Nhật ký (Logs):** Ghi chú cho lập trình viên debug.
3. **Nội bộ (Exceptions):** Mã lỗi và tin nhắn trong code.
**Gợi ý các lựa chọn phổ biến:**
- **Standard (Khuyên dùng):** UI (Tiếng Việt), Logs/Exceptions (Tiếng Anh).
- **International:** Toàn bộ bằng Tiếng Anh.
- **Local:** Toàn bộ bằng Tiếng Việt.
Kết quả thảo luận sẽ được ghi vào `PROJECT.md` ngay sau khi file này được tạo ở các bước sau.
## Bước 5: Tạo .planning/ structure
```bash
mkdir -p .planning/scan .planning/docs .planning/bugs .planning/rules .planning/docs/solidity
```
## Bước 6: Copy rules vào .planning/rules/
Đọc `.pdconfig` → `SKILLS_DIR`. (Claude Code: `cat ~/.codex/.pdconfig`)
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
║ Tiếp: $pd-scan hoặc $pd-new-milestone║
╚══════════════════════════════════════╝
```
</process>
<output>
**Create/Update:**
- `.planning/CONTEXT.md` -- project context
- `.planning/rules/*.md` -- framework-specific rules
**Next step:** `$pd-scan` or `$pd-plan`
**Success when:**
- `CONTEXT.md` contains complete tech stack information
- FastCode MCP confirms it is connected
**Common errors:**
- FastCode MCP is not connected -> check that Docker is running
- The tech stack cannot be detected -> the user supplies it manually
</output>
<rules>
- All output MUST be in English
- You MUST confirm FastCode MCP is connected before taking any action
- DO NOT change files outside `.planning/`
- CONTEXT.md DƯỚI 50 dòng — chỉ info dự án
- Coding rules riêng `.planning/rules/*.md` — copy từ `[SKILLS_DIR]/commands/pd/rules/` (path từ `.pdconfig`)
- Chỉ copy rules phù hợp tech stack (hasNestJS/hasNextJS/hasWordPress/hasSolidity/hasFlutter)
- Project mới: skip FastCode indexing, hỏi mô tả, chỉ copy general.md
- FastCode MCP PHẢI kết nối thành công → DỪNG nếu thất bại
- CẤM đọc/hiển thị `.env`, `.env.*` (trừ `.env.example`), `credentials.*`, `*.pem`, `*.key`, `*secret*`, `wp-config.php`
- CONTEXT.md đã có → hỏi giữ/khởi tạo lại
</rules>
