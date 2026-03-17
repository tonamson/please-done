# Skills for Claude Code

Custom skills (`/sk:*`) cho Claude Code CLI — workflow phát triển NestJS + NextJS có cấu trúc, từ khởi tạo đến release.

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

| Skill | Mô tả | Cần chạy trước |
|-------|--------|----------------|
| `/sk:init` | Khởi tạo project, kiểm tra MCP, detect tech stack | - |
| `/sk:scan` | Quét cấu trúc, dependencies, npm audit | init |
| `/sk:roadmap` | Lập kế hoạch milestones + phases | init, scan |
| `/sk:plan` | Thiết kế kỹ thuật + chia tasks cho phase | roadmap |
| `/sk:write-code` | Viết code theo task, lint, build, commit | plan |
| `/sk:test` | Viết Jest tests, chạy, xác nhận (Backend only) | write-code |
| `/sk:fix-bug` | Debug + fix + commit, lặp đến khi user xác nhận | - |
| `/sk:complete-milestone` | Tổng kết, commit, tạo git tag | all tasks done |

### Utility

| Skill | Mô tả |
|-------|--------|
| `/sk:what-next` | Kiểm tra tiến trình, gợi ý command tiếp theo |
| `/sk:fetch-doc` | Cache tài liệu từ URL kèm version + mục lục nhanh |

## Cấu trúc `.planning/`

Khi chạy skills trong một dự án, thư mục `.planning/` được tạo với cấu trúc:

```
.planning/
├── CONTEXT.md                    # Tech stack, thư viện (< 50 dòng)
├── ROADMAP.md                    # Milestones + phases
├── CURRENT_MILESTONE.md          # Tracking version/phase/status
├── CHANGELOG.md                  # Nhật ký thay đổi
├── scan/SCAN_REPORT.md           # Báo cáo quét dự án
├── docs/                         # Tài liệu cache (fetch-doc)
├── bugs/BUG_*.md                 # Báo cáo lỗi
├── rules/                        # Coding rules (copy từ skills repo)
│   ├── general.md
│   ├── backend.md                # NestJS conventions
│   └── frontend.md               # NextJS conventions
└── milestones/[version]/
    ├── MILESTONE_COMPLETE.md
    └── phase-[x.x]/
        ├── PLAN.md               # Thiết kế kỹ thuật
        ├── TASKS.md              # Danh sách tasks + trạng thái
        ├── TEST_REPORT.md        # Kết quả kiểm thử
        └── reports/
            └── CODE_REPORT_TASK_[N].md
```

## MCP Servers

| MCP | Vai trò | Bắt buộc |
|-----|---------|----------|
| **FastCode** | Index + phân tích code dự án | Co |
| **Context7** | Tra cứu API docs thư viện đúng version | Không (nhưng nên có) |

### Kiểm tra MCP hoạt động

```bash
# Trong Claude Code
/sk:init
# Nếu FastCode MCP hoạt động → ✅
# Nếu lỗi → kiểm tra API key trong FastCode/.env
```

## Gỡ cài đặt

```bash
./uninstall.sh
```

Xóa symlinks + MCP registrations. Giữ nguyên source code và venv.

## Commit Conventions

Skills tự động commit với prefix tiếng Việt:

| Prefix | Khi nào |
|--------|---------|
| `[TASK-N]` | Hoàn thành task (write-code) |
| `[KIỂM THỬ]` | Thêm tests (test) |
| `[LỖI]` | Fix bug (fix-bug) |
| `[PHIÊN BẢN]` | Đóng milestone + git tag (complete-milestone) |

## Tech Stack hỗ trợ

- **Backend**: NestJS (MongoDB/Mongoose, TypeORM, Prisma)
- **Frontend**: NextJS App Router (Ant Design v6, Zustand, native fetch)
- **Mở rộng**: Thêm file `commands/sk/rules/[stack].md` + detection pattern trong `init.md`
