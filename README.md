# Skills for Claude Code

Custom skills (`/sk:*`) cho Claude Code CLI — workflow phát triển có cấu trúc, từ khởi tạo đến release.

**Phiên bản hiện tại: v1.2.0**

## Yêu cầu

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) (đã cài và đăng nhập)
- Python 3.12+ (`python3 --version`)
- Node.js 18+ với npm/npx (`node --version`)
- Git (`git --version`)

## Cài đặt

```bash
git clone https://github.com/tonamson/skills.git
cd skills
./install.sh
```

Script `install.sh` tự động thực hiện 6 bước:

| Bước | Mô tả |
|------|--------|
| 1 | Kiểm tra prerequisites (claude, python, uv, git) |
| 2 | Khởi tạo FastCode submodule |
| 3 | Tạo Python venv + cài dependencies |
| 4 | Cấu hình Gemini API Key (bắt buộc) |
| 5 | Symlink skills + rules vào `~/.claude/commands/sk/` |
| 6 | Đăng ký FastCode MCP + Context7 MCP |

### Lấy Gemini API Key (bắt buộc)

FastCode MCP dùng Gemini API để index và phân tích code:

1. Truy cập https://aistudio.google.com/apikey
2. Tạo API key mới
3. Dán key khi `install.sh` hỏi

### Context7 MCP (tự động cài)

Context7 tra cứu API documentation đúng version cho thư viện đang dùng. `install.sh` tự động đăng ký nếu có `npx`.

Nếu cần cài thủ công:
```bash
claude mcp add --scope user context7 -- npx -y @upstash/context7-mcp@latest
```

## Cập nhật Skills

Khi có phiên bản mới, status line ở góc trái dưới sẽ hiện:

```
⬆ Skills v[x.x.x] — /sk:update
```

Cập nhật bằng lệnh:

```bash
# Trong Claude Code:
/sk:update           # Kiểm tra + hỏi trước khi update
/sk:update --apply   # Cập nhật ngay không hỏi
```

Sau khi cập nhật → thoát Claude Code (Ctrl+C) → chạy lại `claude` để load skills mới.

## Sau khi cài

```bash
# 1. Khởi động lại Claude Code để load skills mới
# 2. Mở dự án bất kỳ
cd /path/to/your/project

# 3. Chạy skill đầu tiên
/sk:init
```

## Danh sách Skills

### Workflow chính (theo thứ tự)

| # | Skill | Mô tả | Cần chạy trước |
|---|-------|--------|----------------|
| 1 | `/sk:init` | Kiểm tra FastCode MCP, index project, detect tech stack, tạo CONTEXT.md + copy rules | - |
| 2 | `/sk:scan` | Quét cấu trúc code, dependencies, kiến trúc, npm audit, tạo SCAN_REPORT | init |
| 3 | `/sk:roadmap` | Lập kế hoạch milestones + phases + dependencies | init, scan (*) |
| 4 | `/sk:plan` | Research dự án, thiết kế kỹ thuật, chia danh sách tasks cho phase (xem [options](#skplan-options)) | roadmap |
| 5 | `/sk:write-code` | Viết code theo task, lint, build, commit `[TASK-N]` (xem [options](#skwrite-code-options)) | plan |
| 6 | `/sk:test` | Viết Jest + Supertest tests, chạy, yêu cầu user xác nhận (Backend NestJS only) | write-code |
| 7 | `/sk:fix-bug` | Research lỗi, phân tích, fix, commit `[LỖI]`, lặp đến khi user xác nhận | init |
| 8 | `/sk:complete-milestone` | Kiểm tra bugs, tổng kết, commit `[PHIÊN BẢN]`, tạo git tag | all tasks ✅ |

(*) Project mới chưa có code: `/sk:roadmap` cho phép bỏ qua scan.

### Utility

| Skill | Mô tả |
|-------|--------|
| `/sk:what-next` | Quét trạng thái .planning/, hiển thị tiến trình, gợi ý command tiếp theo |
| `/sk:fetch-doc` | Tải tài liệu từ URL, lưu markdown local kèm version + mục lục phân section |
| `/sk:update` | Kiểm tra + cập nhật bộ skills từ GitHub, hiện changelog, gợi ý restart |

### Rules (coding conventions)

| File | Áp dụng khi | Nội dung chính |
|------|-------------|----------------|
| `rules/general.md` | Luôn luôn | Code style, ngôn ngữ, icons, version format, git, bảo mật, kiểm tra phiên bản |
| `rules/backend.md` | Có NestJS | Controller, Service, DTO, Entity, Response, Guard, Build & Lint |
| `rules/frontend.md` | Có NextJS | Component, Ant Design v6, Zustand, API layer, Pages, Admin, Build & Lint |

Rules được `/sk:init` tự động copy vào `.planning/rules/` theo tech stack detected. Các skill `plan`, `write-code`, `test`, `fix-bug` đọc rules từ đó khi viết code.

### sk:plan options

| Lệnh | Hành vi |
|-------|---------|
| `/sk:plan` | Chế độ **AUTO** — Claude tự quyết định, ghi lại mọi quyết định + lý do để user review |
| `/sk:plan --discuss` | Chế độ **DISCUSS** — thảo luận tương tác tính năng với user |
| `/sk:plan 1.2` | Plan cho phase cụ thể |
| `/sk:plan 1.2 --discuss` | Plan phase 1.2 với thảo luận |

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

### sk:write-code options

| Lệnh | Hành vi |
|-------|---------|
| `/sk:write-code` | Pick task ⬜ tiếp theo, làm xong **dừng hỏi** |
| `/sk:write-code --auto` | Làm **tất cả** tasks ⬜ trong phase **tuần tự** |
| `/sk:write-code --parallel` | Phân tích dependency, nhóm wave, chạy **song song** tasks độc lập |
| `/sk:write-code 3` | Làm task số 3, xong dừng hỏi |
| `/sk:write-code 3 --auto` | Bắt đầu từ task 3, chạy hết phase tuần tự |
| `/sk:write-code 3 --parallel` | Bắt đầu từ task 3, chạy song song tasks độc lập |

#### Parallel mode (`--parallel`)

Phân tích dependency graph giữa tasks → nhóm thành **waves** → tasks độc lập trong cùng wave chạy song song bằng **multi-agent**:

```
Wave 1 (song song):
  🔀 Agent A: Task 1 (Backend) — tạo API users
  🔀 Agent B: Task 2 (Frontend) — trang users (dùng response shape từ PLAN.md)
Wave 2 (tuần tự — phụ thuộc Wave 1):
  → Task 3: Kết nối validation (cần code từ Task 1)
```

**Khi nào chạy song song:**
- Tasks không có dependency trực tiếp (task B không cần function/module task A tạo)
- Tasks không sửa chung file
- Backend API + Frontend consume: Frontend agent dùng response format đã thiết kế trong PLAN.md để code trước, verify integration sau

**Khi nào PHẢI tuần tự:**
- Task B import/sử dụng function từ task A
- Hai tasks sửa cùng file
- Task B cần output thực tế (không chỉ design) từ task A

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

## MCP Servers

| MCP | Vai trò | Bắt buộc |
|-----|---------|----------|
| **FastCode** | Index + phân tích code dự án (dùng Gemini API) | Có |
| **Context7** | Tra cứu API docs thư viện đúng version | Không (nhưng nên có) |

Skills tự động gọi FastCode để research code hiện có và Context7 để tra cứu docs thư viện. Nếu FastCode MCP lỗi, các skill chính sẽ dừng và yêu cầu chạy `/sk:init` kiểm tra lại.

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

## Hỗ trợ project mới (chưa có code)

Skills hoạt động với cả project mới lẫn project có sẵn code:
- `/sk:init` → hỏi user mô tả dự án, skip FastCode indexing, chỉ copy `general.md`
- `/sk:scan` → tạo scan report tối giản
- `/sk:roadmap` → cho phép bỏ qua scan, lập kế hoạch từ yêu cầu user
- `/sk:plan` → research qua Context7 thay vì FastCode, thiết kế từ docs thư viện
- `/sk:write-code` → tra cứu Context7 cho API thư viện, skip FastCode

## Tech Stack hỗ trợ

| Stack | Framework | Database | Detect bằng |
|-------|-----------|----------|-------------|
| Backend | NestJS | MongoDB/Mongoose, TypeORM, Prisma | `nest-cli.json`, `app.module.ts` |
| Backend | Express | - | `app.js`/`app.ts` + `express` trong package.json |
| Frontend | NextJS App Router | - | `next.config.*` |
| Frontend | Vite/React | - | `vite.config.*`, nhiều `.tsx/.jsx` files |

NestJS và NextJS có rules + phân tích chi tiết. Các stack khác được detect nhưng chỉ liệt kê files, áp dụng `general.md`.

**Mở rộng stack mới**: Thêm file `commands/sk/rules/[stack].md` + detection pattern trong `init.md` Bước 4.

## Gỡ cài đặt

```bash
./uninstall.sh
```

Xóa symlinks + FastCode MCP. Context7 MCP giữ nguyên (dùng chung với Cursor/IDE khác). Source code FastCode vẫn còn trong repo — xóa repo để gỡ hoàn toàn.
