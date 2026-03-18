# Skills — Cross-platform AI Coding Skills

Bộ skills (`/sk:*`) cho AI coding CLI — workflow phát triển có cấu trúc, từ khởi tạo đến release.

**Phiên bản hiện tại: v2.0.0**

## Platforms hỗ trợ

| Platform | Gọi skill bằng | Config dir |
|----------|----------------|------------|
| **Claude Code** | `/sk:init`, `/sk:plan`... | `~/.claude/commands/sk/` |
| **Codex CLI** | `$sk-init`, `$sk-plan`... | `~/.codex/skills/sk-*/` |
| **Gemini CLI** | `/sk:init`, `/sk:plan`... | `~/.gemini/commands/sk/` |
| **OpenCode** | `/sk-init`, `/sk-plan`... | `~/.config/opencode/command/` |
| **GitHub Copilot** | `/sk:init`, `/sk:plan`... | `~/.copilot/skills/sk-*/` |

Kiến trúc: Write Once (Claude Code) → Transpile at Install → Native per Platform.

## Yêu cầu

- Node.js 16+ (`node --version`)
- Python 3.12+ (`python3 --version`)
- Git (`git --version`)
- Ít nhất 1 AI coding CLI đã cài:
  - [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
  - [Codex CLI](https://github.com/openai/codex)
  - [Gemini CLI](https://github.com/google-gemini/gemini-cli)
  - [OpenCode](https://github.com/opencode-ai/opencode)
  - [GitHub Copilot](https://github.com/features/copilot)

## Cài đặt

```bash
git clone https://github.com/tonamson/skills.git
cd skills
```

```bash
# Interactive — chọn platform
node bin/install.js

# Cài cho platform cụ thể
node bin/install.js --claude
node bin/install.js --codex
node bin/install.js --gemini
node bin/install.js --opencode
node bin/install.js --copilot

# Cài tất cả platforms
node bin/install.js --all

# Local install (chỉ project hiện tại)
node bin/install.js --claude --local
```

### Installer tự động thực hiện

| Bước | Mô tả |
|------|--------|
| 1 | Kiểm tra prerequisites (python, uv, git) |
| 2 | Khởi tạo FastCode submodule |
| 3 | Tạo Python venv + cài dependencies |
| 4 | Cấu hình Gemini API Key (bắt buộc cho FastCode MCP) |
| 5 | Convert + copy skills vào config dir của platform |
| 6 | Đăng ký MCP servers (FastCode + Context7) |

### Lấy Gemini API Key (bắt buộc)

FastCode MCP dùng Gemini API để index và phân tích code:

1. Truy cập https://aistudio.google.com/apikey
2. Tạo API key mới
3. Dán key khi installer hỏi

### Context7 MCP (tự động cài)

Context7 tra cứu API documentation đúng version cho thư viện đang dùng. Installer tự động đăng ký nếu có `npx`.

## Gỡ cài đặt

```bash
# Gỡ từng platform
node bin/install.js --uninstall --claude
node bin/install.js --uninstall --codex
node bin/install.js --uninstall --gemini
node bin/install.js --uninstall --opencode
node bin/install.js --uninstall --copilot

# Gỡ tất cả
node bin/install.js --uninstall --all
```

Uninstall chỉ xóa files có prefix `sk-` — không đụng config/files khác của user.

## Cập nhật Skills

Khi có phiên bản mới, status line sẽ hiện:

```
⬆ Skills v[x.x.x] — /sk:update
```

Cập nhật bằng lệnh:

```bash
# Trong AI coding CLI:
/sk:update           # Kiểm tra + hỏi trước khi update
/sk:update --apply   # Cập nhật ngay không hỏi
```

Sau khi cập nhật → thoát CLI → chạy lại để load skills mới.

## Sau khi cài

```bash
# 1. Khởi động lại CLI để load skills mới
# 2. Mở dự án bất kỳ
cd /path/to/your/project

# 3. Chạy skill đầu tiên
/sk:init        # Claude Code, Gemini, Copilot
$sk-init        # Codex
/sk-init        # OpenCode
```

## Danh sách Skills

### Workflow chính (theo thứ tự)

| # | Skill | Mô tả | Cần chạy trước |
|---|-------|--------|----------------|
| 1 | `init` | Kiểm tra FastCode MCP, index project, detect tech stack, tạo CONTEXT.md + copy rules | - |
| 2 | `scan` | Quét cấu trúc code, dependencies, kiến trúc, npm audit, tạo SCAN_REPORT | init |
| 3 | `roadmap` | Lập kế hoạch milestones + phases + dependencies | init, scan (*) |
| 4 | `plan` | Research dự án, thiết kế kỹ thuật, chia danh sách tasks cho phase | roadmap |
| 5 | `write-code` | Viết code theo task, lint, build, commit `[TASK-N]` | plan |
| 6 | `test` | Viết Jest + Supertest tests, chạy, yêu cầu user xác nhận (Backend NestJS only) | write-code |
| 7 | `fix-bug` | Research lỗi, phân tích, fix, commit `[LỖI]`, lặp đến khi user xác nhận | init |
| 8 | `complete-milestone` | Kiểm tra bugs, tổng kết, commit `[PHIÊN BẢN]`, tạo git tag | all tasks ✅ |

(*) Project mới chưa có code: `roadmap` cho phép bỏ qua scan.

### Utility

| Skill | Mô tả |
|-------|--------|
| `what-next` | Quét trạng thái .planning/, hiển thị tiến trình, gợi ý command tiếp theo |
| `fetch-doc` | Tải tài liệu từ URL, lưu markdown local kèm version + mục lục phân section |
| `update` | Kiểm tra + cập nhật bộ skills từ GitHub, hiện changelog, gợi ý restart |

### Rules (coding conventions)

| File | Áp dụng khi | Nội dung chính |
|------|-------------|----------------|
| `rules/general.md` | Luôn luôn | Code style, ngôn ngữ, icons, version format, git, bảo mật |
| `rules/backend.md` | Có NestJS | Controller, Service, DTO, Entity, Response, Guard, Build & Lint |
| `rules/frontend.md` | Có NextJS | Component, Ant Design v6, Zustand, API layer, Pages, Admin |

Rules được `init` tự động copy vào `.planning/rules/` theo tech stack detected. Các skill `plan`, `write-code`, `test`, `fix-bug` đọc rules từ đó khi viết code.

### plan options

| Lệnh | Hành vi |
|-------|---------|
| `plan` | Chế độ **AUTO** — Claude tự quyết định, ghi lại mọi quyết định + lý do để user review |
| `plan --discuss` | Chế độ **DISCUSS** — thảo luận tương tác tính năng với user |
| `plan 1.2` | Plan cho phase cụ thể |
| `plan 1.2 --discuss` | Plan phase 1.2 với thảo luận |

#### Chế độ DISCUSS (`--discuss`)

Claude phân tích deliverable, liệt kê các vấn đề cần quyết định → user chọn vấn đề muốn bàn → Claude đưa options cho từng vấn đề:

```
Chọn phương án:
  A. JWT + HttpOnly Cookie ← recommend
  B. Session-based auth
  C. OAuth2 + Social login
  D. Bạn có cách riêng — mô tả phương án của bạn
```

- Option A luôn là recommend (đơn giản, hiệu quả nhất)
- Option cuối luôn cho user tự mô tả cách riêng
- Hỗ trợ: `back` (quay lại), `cancel` (chuyển AUTO), `skip` (Claude tự quyết định)
- Quyết định được lưu vào PLAN.md section "Quyết định thiết kế" → `write-code` tuân thủ

### write-code options

| Lệnh | Hành vi |
|-------|---------|
| `write-code` | Pick task ⬜ tiếp theo, làm xong **dừng hỏi** |
| `write-code --auto` | Làm **tất cả** tasks ⬜ trong phase **tuần tự** |
| `write-code --parallel` | Phân tích dependency, nhóm wave, chạy **song song** tasks độc lập |
| `write-code 3` | Làm task số 3, xong dừng hỏi |
| `write-code 3 --auto` | Bắt đầu từ task 3, chạy hết phase tuần tự |
| `write-code 3 --parallel` | Bắt đầu từ task 3, chạy song song tasks độc lập |

#### Parallel mode (`--parallel`)

Phân tích dependency graph giữa tasks → nhóm thành **waves** → tasks độc lập trong cùng wave chạy song song bằng **multi-agent**:

```
Wave 1 (song song):
  🔀 Agent A: Task 1 (Backend) — tạo API users
  🔀 Agent B: Task 2 (Frontend) — trang users (dùng response shape từ PLAN.md)
Wave 2 (tuần tự — phụ thuộc Wave 1):
  → Task 3: Kết nối validation (cần code từ Task 1)
```

## Cấu trúc `.planning/`

Khi chạy skills trong một dự án, thư mục `.planning/` được tạo với cấu trúc:

```
.planning/
├── CONTEXT.md                    # Tech stack, thư viện, pointer tới rules (< 50 dòng)
├── ROADMAP.md                    # Milestones + phases + deliverables
├── CURRENT_MILESTONE.md          # Tracking version/phase/status hiện tại
├── CHANGELOG.md                  # Nhật ký thay đổi (tạo khi complete-milestone)
├── scan/
│   └── SCAN_REPORT.md            # Báo cáo quét dự án + npm audit
├── docs/                         # Tài liệu cache (fetch-doc) kèm version + mục lục
├── bugs/
│   └── BUG_*.md                  # Báo cáo lỗi (code trước/sau, patch version)
├── rules/                        # Coding rules (copy từ skills repo theo stack)
│   ├── general.md                # Quy tắc chung (luôn có)
│   ├── backend.md                # NestJS conventions (nếu có backend)
│   └── frontend.md               # NextJS conventions (nếu có frontend)
└── milestones/[version]/
    ├── MILESTONE_COMPLETE.md     # Tổng kết milestone (tạo khi complete)
    └── phase-[x.x]/
        ├── PLAN.md               # Thiết kế kỹ thuật + API + database + quyết định
        ├── TASKS.md              # Danh sách tasks + trạng thái
        ├── TEST_REPORT.md        # Kết quả kiểm thử (Backend only)
        └── reports/
            └── CODE_REPORT_TASK_[N].md  # Báo cáo từng task
```

## Cross-platform Architecture

```
Source (Claude Code native)          Install-time Transpiler          Target Platforms
┌──────────────────────┐            ┌──────────────────┐            ┌─────────────────┐
│ commands/sk/*.md     │            │                  │──────────→ │ Claude Code     │
│ commands/sk/rules/*  │───────────→│  bin/install.js  │──────────→ │ Codex CLI       │
│ VERSION, CHANGELOG   │            │  (Node.js, 0 dep)│──────────→ │ Gemini CLI      │
└──────────────────────┘            │                  │──────────→ │ OpenCode        │
                                    └──────────────────┘──────────→ │ GitHub Copilot  │
                                                                    └─────────────────┘
```

**Nguyên tắc:**
- Skills chỉ viết 1 lần bằng format Claude Code
- Installer convert sang format native cho từng platform
- Zero runtime dependencies (chỉ Node.js stdlib)
- SHA256 manifest tracking — auto-backup files user đã modify trước khi re-install
- Leaked path scan — verify không còn `~/.claude/` trong output non-Claude

### Chuyển đổi per platform

| Thành phần | Claude Code | Codex | Gemini | OpenCode | Copilot |
|------------|-------------|-------|--------|----------|---------|
| **Tool names** | Read, Write, Bash | Giữ nguyên | read_file, write_file, run_shell_command | Giữ nguyên | read, write, execute |
| **Command prefix** | /sk: | $sk- | /sk: | /sk- | /sk: |
| **Skill format** | Nested .md | SKILL.md + XML adapter | Nested .md | Flat sk-*.md | SKILL.md |
| **MCP config** | settings.json | config.toml (TOML) | settings.json | Config riêng | instructions.md |

## MCP Servers

| MCP | Vai trò | Bắt buộc |
|-----|---------|----------|
| **FastCode** | Index + phân tích code dự án (dùng Gemini API) | Có |
| **Context7** | Tra cứu API docs thư viện đúng version | Không (nhưng nên có) |

Skills tự động gọi FastCode để research code hiện có và Context7 để tra cứu docs thư viện. Nếu FastCode MCP lỗi, các skill chính sẽ dừng và yêu cầu chạy `init` kiểm tra lại.

## Commit Conventions

Skills tự động commit với prefix tiếng Việt (bỏ qua nếu project không có git):

| Prefix | Skill | Khi nào |
|--------|-------|---------|
| `[TASK-N]` | write-code | Hoàn thành 1 task |
| `[KIỂM THỬ]` | test | Thêm test files (.spec.ts) |
| `[LỖI]` | fix-bug | Mỗi lần fix (có thể nhiều lần/bug) |
| `[PHIÊN BẢN]` | complete-milestone | Đóng milestone + tạo git tag |

## Icons trạng thái

| Icon | Ý nghĩa |
|------|---------|
| ⬜ | Chưa bắt đầu |
| 🔄 | Đang thực hiện |
| ✅ | Hoàn tất |
| ❌ | Bị chặn |
| 🐛 | Có lỗi |

## Tech Stack hỗ trợ

| Stack | Framework | Database | Detect bằng |
|-------|-----------|----------|-------------|
| Backend | NestJS | MongoDB/Mongoose, TypeORM, Prisma | `nest-cli.json`, `app.module.ts` |
| Backend | Express | - | `app.js`/`app.ts` + `express` trong package.json |
| Frontend | NextJS App Router | - | `next.config.*` |
| Frontend | Vite/React | - | `vite.config.*`, nhiều `.tsx/.jsx` files |

NestJS và NextJS có rules + phân tích chi tiết. Các stack khác được detect nhưng chỉ liệt kê files, áp dụng `general.md`.

**Mở rộng stack mới**: Thêm file `commands/sk/rules/[stack].md` + detection pattern trong `init.md` Bước 4.
