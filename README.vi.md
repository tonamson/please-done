<!-- Translated from README.md -->
<!-- Source version: 4.0.0 -->
<!-- Translation date: 2026-04-04 -->

[![English](https://img.shields.io/badge/lang-English-blue.svg)](README.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](README.vi.md)

# Please Done — Bộ kỹ năng lập trình AI đa nền tảng

[![Version](https://img.shields.io/badge/version-4.0.0-blue.svg)](https://github.com/tonamson/please-done/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D16-brightgreen.svg)](https://nodejs.org)
[![Platforms](https://img.shields.io/badge/platforms-Claude%20Code%20%7C%20Codex%20%7C%20Gemini%20%7C%20OpenCode%20%7C%20Copilot-purple.svg)](#supported-platforms)

Please Done là bộ kỹ năng (`/pd:*`) dành cho các CLI lập trình AI — một quy trình phát triển có cấu trúc, từ khởi tạo đến phát hành.

> Please Done là nhánh fork và được tinh chỉnh từ [GSD / get-shit-done](https://github.com/gsd-build/get-shit-done). Phiên bản này hướng tới việc giúp người mới dễ tiếp cận hơn, giảm độ phức tạp khi bắt đầu, và ưu tiên trải nghiệm cài đặt/vận hành thực dụng trên nhiều CLI khác nhau.
>
> Nếu bạn đã quen với quy trình lập trình agentic và muốn đầy đủ tính năng, nhịp làm việc gốc, và cập nhật upstream nhanh nhất, [GSD](https://github.com/gsd-build/get-shit-done) vẫn là lựa chọn phù hợp hơn.

**Phiên bản hiện tại: v4.0.0**

<a id="quick-start"></a>
## Bắt Đầu Nhanh

Bắt đầu với Please Done chỉ với 5 lệnh:

| Bước | Lệnh | Chức năng |
|------|------|-----------|
| 1 | `/pd:onboard` | Định hướng AI vào codebase, phân tích lịch sử git |
| 2 | `/pd:init` | Kiểm tra MCP, phát hiện tech stack, tạo CONTEXT.md |
| 3 | `/pd:plan` | Nghiên cứu và tạo thiết kế kỹ thuật cho một phase |
| 4 | `/pd:write-code` | Thực thi task, kiểm tra lint, build, tự động commit |
| 5 | `/pd:status` | Xem tiến độ dự án và bước tiếp theo |

Xem [Tài liệu tham khảo kỹ năng](#skills-reference) để biết đủ 16 lệnh.

<a id="prerequisites-checklist"></a>
## Danh Sách Yêu Cầu Tiên Quyết

Trước khi dùng Please Done, hãy đảm bảo bạn có:

- [ ] **Claude Code CLI** (hoặc nền tảng được hỗ trợ khác) đã cài đặt
  - [Claude Code](https://docs.anthropic.com/en/docs/claude-code) — khuyến nghị
  - [Codex CLI](https://github.com/openai/codex), [Gemini CLI](https://github.com/google-gemini/gemini-cli), [OpenCode](https://github.com/opencode-ai/opencode), hoặc [GitHub Copilot](https://github.com/features/copilot)

- [ ] **Node.js** 16+ (`node --version`)

- [ ] **Python** 3.12+ (`python3 --version`)

- [ ] **Git** đã khởi tạo repo (`git --version`)

- [ ] **Gemini API Key** (cho FastCode MCP — sẽ hỏi trong `/pd:init`)
  - Lấy key miễn phí tại [Google AI Studio](https://aistudio.google.com/apikey)

Chạy `/pd:init` sau khi cài để xác minh mọi thứ hoạt động.

<a id="table-of-contents"></a>
## Mục Lục

- [Bắt Đầu Nhanh](#quick-start)
- [Danh Sách Yêu Cầu Tiên Quyết](#prerequisites-checklist)
- [Nền Tảng Được Hỗ Trợ](#supported-platforms)
- [Yêu Cầu](#requirements)
- [Cài Đặt](#installation)
- [Gỡ Cài Đặt](#uninstallation)
- [Cập Nhật Please Done](#updating-please-done)
- [Sau Khi Cài Đặt](#after-installation)
- [Tài Liệu Tham Khảo Kỹ Năng](#skills-reference)
- [Sơ Đồ Quy Trình](#workflow-diagram)
- [Cấu Trúc `.planning/`](#planning-structure)
- [Kiến Trúc Đa Nền Tảng](#cross-platform-architecture)
- [MCP Servers](#mcp-servers)
- [Bảo Mật](#security)
- [Quy Ước Commit](#commit-conventions)
- [Biểu Tượng Trạng Thái](#status-icons)
- [Các Stack Công Nghệ Được Hỗ Trợ](#supported-tech-stacks)
- [Bộ Đánh Giá (Promptfoo)](#evaluation-suite-promptfoo)
- [Tài Liệu Bổ Sung](#additional-documentation)
- [Giấy Phép](#license)

<a id="supported-platforms"></a>
## Nền Tảng Được Hỗ Trợ


| Nền tảng           | Cú pháp gọi kỹ năng    | Vị trí kỹ năng global          | Vị trí kỹ năng local           |
| ------------------ | ---------------------- | ------------------------------ | ------------------------------ |
| **Claude Code**    | `/pd:init`, `/pd:plan`... | `~/.claude/commands/pd/`      | `.claude/commands/pd/`        |
| **Codex CLI**      | `$pd-init`, `$pd-plan`... | `~/.codex/skills/pd-*/`       | —                             |
| **Gemini CLI**     | `/pd:init`, `/pd:plan`... | `~/.gemini/commands/pd/`      | —                             |
| **OpenCode**       | `/pd-init`, `/pd-plan`... | `~/.config/opencode/command/` | —                             |
| **GitHub Copilot** | `/pd:init`, `/pd:plan`... | `~/.copilot/skills/pd-*/`     | `.github/skills/pd-*/`        |


Kiến trúc: Viết một lần (Claude Code) → Chuyển đổi khi cài → Chạy native trên từng nền tảng.

<a id="requirements"></a>
## Yêu Cầu

- Node.js 16+ (`node --version`)
- Python 3.12+ (`python3 --version`)
- Git (`git --version`)
- Ít nhất 1 CLI lập trình AI đã cài:
  - [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
  - [Codex CLI](https://github.com/openai/codex)
  - [Gemini CLI](https://github.com/google-gemini/gemini-cli)
  - [OpenCode](https://github.com/opencode-ai/opencode)
  - [GitHub Copilot](https://github.com/features/copilot)

<a id="installation"></a>
## Cài Đặt

```bash
git clone https://github.com/tonamson/please-done.git
cd please-done
```

```bash
# Tương tác — chọn nền tảng
node bin/install.js

# Cài cho một nền tảng cụ thể
node bin/install.js --claude
node bin/install.js --codex
node bin/install.js --gemini
node bin/install.js --opencode
node bin/install.js --copilot

# Cài tất cả nền tảng
node bin/install.js --all

# Cài local (chỉ project hiện tại)
node bin/install.js --claude --local
```

### Trình cài đặt làm gì

**Claude Code** — thiết lập đầy đủ (6 bước):

| Bước | Mô tả                                                              |
| ---- | ------------------------------------------------------------------ |
| 1    | Kiểm tra điều kiện (python 3.12+, uv, git)                         |
| 2    | Khởi tạo submodule FastCode                                       |
| 3    | Tạo Python venv + cài dependencies                               |
| 4    | Cấu hình Gemini API Key (bắt buộc cho FastCode MCP)                 |
| 5    | Symlink skills vào `~/.claude/commands/pd/`                     |
| 6    | Đăng ký MCP servers (FastCode + Context7) qua `claude mcp add`    |

**Codex / Gemini / OpenCode / Copilot** — chỉ chuyển đổi + cài skills (3–4 bước):

| Bước | Mô tả                                                              |
| ---- | ------------------------------------------------------------------ |
| 1    | Chuyển đổi skills sang định dạng nền tảng (tên tool, cú pháp lệnh, đường dẫn) |
| 2    | Copy skills + rules vào thư mục cấu hình                           |
| 3    | Lưu `.pdconfig` (trỏ về thư mục nguồn)                             |
| 4    | Ghi cấu hình MCP vào file cấu hình nền tảng (Codex: `config.toml`, Gemini: `settings.json`, Copilot: `copilot-instructions.md`) |

> **Lưu ý:** Các nền tảng không phải Claude **không** tự thiết lập Python/venv/Gemini API Key. Cấu hình MCP của chúng trỏ tới `FastCode/.venv/bin/python` — bạn cần cài Claude trước (hoặc thiết lập FastCode thủ công) để MCP hoạt động.

### Lấy Gemini API Key (bắt buộc cho FastCode MCP)

FastCode MCP dùng Gemini API để index và phân tích code:

1. Truy cập [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Tạo API key mới
3. Dán key khi trình cài Claude hỏi, hoặc ghi thủ công vào `FastCode/.env` nếu cài nền tảng khác trước

### Context7 MCP (tự động cài)

Context7 tra cứu tài liệu API thư viện đúng phiên bản. Trình cài tự đăng ký nếu có `npx`.

<a id="uninstallation"></a>
## Gỡ Cài Đặt

```bash
# Gỡ theo từng nền tảng
node bin/install.js --uninstall --claude
node bin/install.js --uninstall --codex
node bin/install.js --uninstall --gemini
node bin/install.js --uninstall --opencode
node bin/install.js --uninstall --copilot

# Gỡ tất cả
node bin/install.js --uninstall --all
```

Gỡ cài chỉ xóa các artifact do Please Done tạo/quản lý (file skill, symlink, rules, `.pdconfig`, mục cấu hình MCP) — không đụng tới cấu hình/file khác của người dùng.

<a id="updating-please-done"></a>
## Cập Nhật Please Done

Khi có phiên bản mới, thanh trạng thái sẽ hiển thị:

```
⬆ Please Done v[x.x.x] — /pd:update or $pd-update
```

Cập nhật bằng:

```bash
# Claude Code, Gemini CLI, GitHub Copilot
/pd:update
/pd:update --apply

# Codex CLI
$pd-update
$pd-update --apply

# OpenCode
/pd-update
/pd-update --apply
```

Sau khi cập nhật → thoát CLI → khởi động lại để tải phiên bản Please Done mới.

<a id="after-installation"></a>
## Sau Khi Cài Đặt

```bash
# 1. Khởi động lại CLI để tải Please Done mới
# 2. Mở bất kỳ project nào
cd /path/to/your/project

# 3. Chạy kỹ năng đầu tiên
/pd:init        # Claude Code, Gemini, Copilot
$pd-init        # Codex
/pd-init        # OpenCode
```

<a id="skills-reference"></a>
## Tài Liệu Tham Khảo Kỹ Năng

Please Done cung cấp 16 kỹ năng chia thành 4 nhóm.

### Core — Nền tảng dự án

| Kỹ năng | Lệnh | Mô tả |
|---------|------|-------|
| onboard | `/pd:onboard` | Định hướng AI vào codebase lạ chỉ với một lệnh |
| init | `/pd:init` | Khởi tạo project: kiểm tra MCP, phát hiện stack, tạo CONTEXT.md |
| scan | `/pd:scan` | Quét cấu trúc code, dependencies, kiểm tra bảo mật |
| plan | `/pd:plan` | Nghiên cứu và tạo thiết kế kỹ thuật cho một phase |

### Project — Quy trình phát triển

| Kỹ năng | Lệnh | Mô tả |
|---------|------|-------|
| new-milestone | `/pd:new-milestone` | Lập milestone + phase + phụ thuộc |
| write-code | `/pd:write-code` | Thực thi task từ TASKS.md, lint, build, commit |
| test | `/pd:test` | Viết và chạy test (Jest, PHPUnit, Hardhat, flutter_test) |
| fix-bug | `/pd:fix-bug` | Nghiên cứu lỗi, phân tích, sửa, commit, lặp đến khi xác nhận |
| complete-milestone | `/pd:complete-milestone` | Kiểm tra lỗi, tóm tắt, commit, tạo git tag |

### Debug — Phân tích & nghiên cứu

| Kỹ năng | Lệnh | Mô tả |
|---------|------|-------|
| audit | `/pd:audit` | Kiểm toán code toàn diện (bảo mật, hiệu năng, dependency) |
| research | `/pd:research` | Nghiên cứu chủ đề kỹ thuật với đầu ra có cấu trúc |

### Utility — Lệnh tiện ích

| Kỹ năng | Lệnh | Mô tả |
|---------|------|-------|
| status | `/pd:status` | Hiển thị dashboard trạng thái (milestone, phase, task) |
| conventions | `/pd:conventions` | Phân tích pattern code, tạo CLAUDE.md riêng project |
| fetch-doc | `/pd:fetch-doc` | Tải tài liệu từ URL, lưu dạng markdown |
| update | `/pd:update` | Kiểm tra và cập nhật skills từ GitHub |
| what-next | `/pd:what-next` | Quét trạng thái, hiển thị tiến độ, gợi ý lệnh tiếp theo |

**Cách dùng lệnh Status:**

```bash
# Kiểm tra trạng thái cơ bản
/pd:status

# Tự làm mới (cảnh báo nếu dữ liệu cũ)
/pd:status --auto-refresh

# Ngưỡng “cũ” tùy chỉnh (phút)
/pd:status --refresh-threshold=5

# Kết hợp
/pd:status --auto-refresh --refresh-threshold=15
```

Dashboard trạng thái hiển thị:
- Milestone và phase hiện tại
- Tiến độ task (✅ hoàn thành, 🔄 đang làm, ⬜ chờ, 🐛 bug)
- Lỗi gần đây từ log (10 mục cuối)
- Vấn đề chặn từ STATE.md
- Gợi ý quy trình


<a id="workflow-diagram"></a>
## Sơ Đồ Quy Trình

Quy trình Please Done điển hình:

```
    +-----------+        +-----------+        +-------------+
    |  onboard  |------->|   init    |------->|    plan     |
    |  (once)   |        |  (setup)  |        |  (design)   |
    +-----------+        +-----------+        +-------------+
                                                    |
                                                    v
    +-------------------+      +-------------+   +-------------+
    |  complete-milestone|<-----|    test     |<--| write-code  |
    |   (release)       |      | (verify)    |   | (implement) |
    +-------------------+      +------+------+   +-------------+
           ^                          |
           |                     (fails?)
           |                          |
           +------------------+       v
                              |  +----------+
                              +--| fix-bug  |
                                 | (repair) |
                                 +----------+
```

**Chú giải:** `->` Luồng bình thường  `-->` Vòng phản hồi (test fail → sửa → test lại)

Sơ đồ thể hiện:
- **Luồng chính**: onboard → init → plan → write-code → test → complete-milestone
- **Điểm quyết định**: Test thất bại kích hoạt vòng fix-bug
- **Vòng phản hồi**: Sau khi sửa, quay lại test để xác minh


### Hệ quy ước (Rules + CLAUDE.md)

Please Done dùng **2 lớp quy ước bổ sung**:

| Lớp | Nguồn | Phạm vi | Áp dụng |
| --- | --- | --- | --- |
| **Rules** (`commands/pd/rules/`) | Đi kèm bộ skills | Chung cho mọi project cùng stack | Tự động khi `/pd:init` |
| **CLAUDE.md** (thư mục gốc project) | Tạo bởi `/pd:conventions` hoặc thủ công | Riêng từng project | Tự động mỗi phiên hội thoại |

**Tại sao cần cả hai?**

- **Rules** chứa cấu hình kỹ thuật mà workflow cần: lệnh build/lint, pattern phát hiện stack, quy tắc bảo mật theo framework. Nếu bạn fork Please Done, sửa rules cho đúng quy ước — mỗi lần `/pd:init` chạy, quy ước được áp dụng cho mọi project cùng stack mà không phải khai báo lại.
- **CLAUDE.md** chứa quy ước riêng project (phong cách code, quyết định kiến trúc, nên/không nên) mà rules chung không bao phủ.

#### Rules (quy ước code)


| File                    | Áp dụng khi | Nội dung chính                                                                  |
| ----------------------- | ------------ | ----------------------------------------------------------------------------- |
| `rules/general.md`     | Luôn       | Phong cách code, ngôn ngữ, icon, định dạng phiên bản, git, bảo mật                    |
| `rules/nestjs.md`      | Có NestJS   | Quy ước cụ thể: prefix MongoDB, DTO, định dạng phân trang, ngôn ngữ lỗi  |
| `rules/nextjs.md`      | Có NextJS   | Quy ước cụ thể: Ant Design v6, Zustand, native fetch, quyền admin |
| `rules/wordpress.md`   | Có WordPress| Quy ước WP, sanitize/escape, $wpdb, REST API  |
| `rules/solidity.md`    | Có Solidity | Quy ước OZ v5, SafeERC20, modifier bảo mật, chữ ký, gas   |
| `rules/solidity-refs/` | Có Solidity | Mẫu hợp đồng + checklist audit (2 file)                                |
| `rules/flutter.md`     | Có Flutter  | Quy ước kiến trúc Logic+State, design token, Dio, fromJson thủ công |


Rules được copy tự động vào `.planning/rules/` bởi `init` theo stack phát hiện. Rules chỉ chứa **quy ước cụ thể** — kiến thức framework chuẩn tra bằng Context7 MCP khi cần. Các skill `plan`, `write-code`, `test`, `fix-bug` đọc rules từ đó khi viết code.

> **Tùy biến cho riêng bạn**: Fork repo Please Done → sửa file trong `commands/pd/rules/` → cài skills từ fork. Mỗi lần `/pd:init`, quy ước của bạn được áp dụng mà không cần khai báo lại. Xem [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) để thêm stack mới hoặc sửa rules.

#### Quy ước theo project (CLAUDE.md)

Ngoài rules có sẵn, mỗi project nên có file `CLAUDE.md` ở gốc chứa quy ước riêng. Claude Code tự đọc file này mỗi phiên.

**Chạy `/pd:conventions`** để phân tích code tự động + tạo CLAUDE.md, hoặc viết thủ công:

```markdown
# Project Conventions

## Code Style
- Semicolons, single quotes, 2 spaces indent
- Import alias: @/ for cross-module

## Architecture
- State management: Zustand (not Redux)
- CSS: Tailwind only
- API: native fetch (not axios)

## Do / Don't
- Commit messages in English, conventional commits
- Don't mock database in tests
- Don't create new files if you can edit existing ones
```

Lợi ích:
- **0 token từ skills** — Claude Code tự tải
- **Khác nhau theo project**
- **Dễ sửa** — chỉnh file trực tiếp, không cần đụng skills

### Tùy chọn Plan


| Lệnh              | Hành vi                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| `plan`               | Chế độ **AUTO** — trợ lý quyết định mọi thứ, ghi lại quyết định + lý do để bạn xem lại    |
| `plan --discuss`     | Chế độ **DISCUSS** — thảo luận tính năng tương tác với bạn                                   |
| `plan 1.2`           | Lập kế hoạch cho một phase cụ thể                                                                         |
| `plan 1.2 --discuss` | Lập phase 1.2 kèm thảo luận                                                                   |


#### Chế độ DISCUSS (`--discuss`)

Trợ lý phân tích deliverable, liệt kê vấn đề cần quyết định → bạn chọn bằng phím mũi tên (nếu nền tảng hỗ trợ) hoặc trả lời văn bản → trợ lý đưa phương án cho từng vấn đề:

- Chọn nhiều vấn đề cần thảo luận (multiSelect)
- Mỗi vấn đề có danh sách phương án — phương án đầu luôn là khuyến nghị ("Recommended")
- Chọn "Other" để mô tả cách làm riêng, gõ `back` quay lại, `cancel` hủy thảo luận
- Sau khi xong → bảng tóm tắt → có thể "Discuss more issues"
- Quyết định lưu vào PLAN.md mục "Design Decisions" → `write-code` tuân theo

### Tùy chọn Write-Code


| Lệnh                    | Hành vi                                                    |
| ------------------------- | ----------------------------------------------------------- |
| `write-code`              | Chọn task ⬜ tiếp theo, hoàn thành, **dừng và hỏi**             |
| `write-code --auto`       | Hoàn thành **tất cả** task ⬜ trong phase **tuần tự**          |
| `write-code --parallel`   | Phân tích phụ thuộc, gom wave, chạy song song task độc lập |
| `write-code 3`            | Hoàn thành task 3 rồi dừng                                  |
| `write-code 3 --auto`     | Bắt đầu từ task 3, chạy hết phần còn lại tuần tự           |
| `write-code 3 --parallel` | Bắt đầu từ task 3, chạy song song phần độc lập        |


#### Chế độ Parallel (`--parallel`)

Phân tích đồ thị phụ thuộc giữa các task → gom **wave** → task độc lập trong cùng wave chạy song song bằng **multi-agent**:

```
Wave 1 (parallel):
  🔀 Agent A: Task 1 (Backend) — tạo API users
  🔀 Agent B: Task 2 (Frontend) — trang users (dùng cấu trúc response từ PLAN.md)
Wave 2 (sequential — phụ thuộc Wave 1):
  → Task 3: Nối validation (cần code từ Task 1)
```

<a id="planning-structure"></a>
## Cấu Trúc `.planning/`

Khi chạy skills trong project, thư mục `.planning/` được tạo với cấu trúc:

```
.planning/
├── CONTEXT.md                    # Tech stack, thư viện, trỏ tới rules (< 50 dòng)
├── ROADMAP.md                    # Milestone + phase + deliverable
├── CURRENT_MILESTONE.md          # Theo dõi phiên bản/phase/trạng thái hiện tại
├── CHANGELOG.md                  # Nhật ký thay đổi (tạo khi complete-milestone)
├── scan/
│   └── SCAN_REPORT.md            # Báo cáo quét project + kiểm tra bảo mật dependency
├── docs/                         # Tài liệu cache (fetch-doc) + solidity refs
│   └── solidity/                 # Mẫu hợp đồng + checklist audit (nếu Solidity)
├── bugs/
│   └── BUG_*.md                  # Báo cáo bug (code trước/sau, phiên bản patch)
├── rules/                        # Quy tắc code (copy từ repo Please Done theo stack)
│   ├── general.md                # Quy tắc chung (luôn có)
│   ├── nestjs.md                 # Quy ước NestJS (nếu phát hiện)
│   ├── nextjs.md                 # Quy ước NextJS (nếu phát hiện)
│   ├── wordpress.md              # Quy ước WordPress (nếu phát hiện)
│   ├── solidity.md               # Quy ước Solidity (nếu phát hiện)
│   └── flutter.md                # Quy ước Flutter (nếu phát hiện)
└── milestones/[version]/
    ├── MILESTONE_COMPLETE.md     # Tóm tắt milestone (tạo khi hoàn thành)
    └── phase-[x.x]/
        ├── PLAN.md               # Thiết kế kỹ thuật + API + database + quyết định
        ├── TASKS.md              # Danh sách task + trạng thái
        ├── TEST_REPORT.md        # Kết quả test (NestJS/WordPress/Solidity/Flutter)
        └── reports/
            └── CODE_REPORT_TASK_[N].md  # Báo cáo theo task
```

<a id="cross-platform-architecture"></a>
## Kiến Trúc Đa Nền Tảng

```
Source (Claude Code original)       Converter on install             Target platform
┌──────────────────────┐            ┌──────────────────┐            ┌─────────────────┐
│ commands/pd/*.md     │            │                  │──────────→ │ Claude Code     │
│ workflows/*.md       │            │                  │──────────→ │ Codex CLI       │
│ references/*.md      │───────────→│  bin/install.js  │──────────→ │ Gemini CLI      │
│ templates/*.md     │            │  (Node.js, 0 dep)│──────────→ │ OpenCode        │
│ commands/pd/rules/*  │            │                  │──────────→ │ GitHub Copilot  │
│ VERSION, CHANGELOG   │            └──────────────────┘            └─────────────────┘
└──────────────────────┘
```

**Nguyên tắc:**

- Skills viết một lần theo định dạng Claude Code
- Trình cài chuyển sang định dạng native cho từng nền tảng
- Không phụ thuộc runtime (chỉ Node.js stdlib)
- Theo dõi manifest SHA256 — tự sao lưu file người dùng sửa trước khi cài lại
- Quét rò rỉ đường dẫn — đảm bảo output nền không phải Claude không còn `~/.claude/`

### Chuyển đổi theo nền tảng


| Thành phần          | Claude Code       | Codex                  | Gemini                                   | OpenCode       | Copilot                 |
| ------------------- | ----------------- | ---------------------- | ---------------------------------------- | -------------- | ----------------------- |
| **Tên tool**     | Read, Write, Bash | Không đổi              | read_file, write_file, run_shell_command | Không đổi      | read, write, execute    |
| **Tiền tố lệnh** | /pd:              | $pd-                   | /pd:                                     | /pd-           | /pd:                    |
| **Định dạng skill**   | Nested .md        | SKILL.md + XML adapter | Nested .md                               | pd-*.md flat   | SKILL.md                |
| **Cấu hình MCP**     | settings.json     | config.toml (TOML)     | settings.json                            | Custom config  | copilot-instructions.md |


<a id="mcp-servers"></a>
## MCP Servers


| MCP          | Vai trò                                                  | Bắt buộc             |
| ------------ | ----------------------------------------------------- | -------------------- |
| **FastCode** | Index + phân tích code project (dùng Gemini API)        | Có (`init` dừng nếu lỗi; skill khác fallback Grep/Read) |
| **Context7** | Tra tài liệu API thư viện đúng phiên bản    | Không (nhưng khuyến nghị) |


Please Done tự gọi FastCode để nghiên cứu code hiện có và Context7 để tra tài liệu thư viện. Nếu FastCode MCP lỗi: `init` sẽ dừng (cần kết nối thành công); các skill khác (`scan`, `plan`, `write-code`, `test`, `fix-bug`) tự fallback Grep/Read kèm cảnh báo — vẫn chạy nhưng kém chính xác hơn.

<a id="security"></a>
## Bảo Mật

### Bảo vệ tích hợp trong skills

Mọi skill tuân theo quy tắc bảo mật trong `rules/general.md`:


| Rule                          | Mô tả                                                                       |


<a id="error-logging-debugging"></a>
## Ghi Log Lỗi & Gỡ Lỗi

Please Done có ghi log lỗi đầy đủ để chẩn đoán và theo dõi thực thi skill.

### File log

- **Vị trí**: `.planning/logs/agent-errors.jsonl`
- **Định dạng**: JSONL (JSON Lines), một bản ghi mỗi lỗi
- **Nội dung**: Timestamp, mức lỗi, tên skill, phase, bước, thông báo lỗi và ngữ cảnh chi tiết

### Xem log

```bash
# Xem lỗi gần đây
tail -f .planning/logs/agent-errors.jsonl

# In đẹp với jq
tail -n 20 .planning/logs/agent-errors.jsonl | jq '.'

# Lọc theo skill
grep '"agent":"pd:fix-bug"' .planning/logs/agent-errors.jsonl | jq '.'

# Thống kê lỗi theo skill
node -e "const {getErrorStatsByAgent} = require('./bin/lib/log-reader'); console.log(JSON.stringify(getErrorStatsByAgent('./.planning/logs/agent-errors.jsonl', {sinceHours: 24}), null, 2))"
```

### Điều gì được ghi

**Mọi lỗi đều tự động ghi**, gồm:
- Lỗi thực thi skill
- Sự cố kết nối MCP
- Lỗi build/lint
- Test thất bại
- Lỗi hệ thống file
- Thiếu điều kiện tiên quyết

**Skill quan trọng** (fix-bug, plan, write-code, test, audit) ghi ngữ cảnh chi tiết:
- fix-bug: mô tả bug, session ID, bước điều tra, agent gọi
- plan: số phase, yêu cầu, trạng thái nghiên cứu, task đã tạo
- write-code: số task, file sửa, trạng thái lint/build, chế độ thực thi
- test: loại test, file, số pass/fail
- audit: loại audit, scanner, số phát hiện

### Quản lý log

Log được quản lý tự động:
- **Rotation**: Xoay file khi 10MB, giữ 10 bản gần nhất
- **Thư mục**: Tự tạo lần đầu dùng
- **Git**: File log tự được git-ignore
- **Dọn dẹp**: Có thể xóa mục log cũ theo thời gian

Xem `docs/logging.md` để biết đầy đủ API, ví dụ và xử lý sự cố.

### Tích hợp với what-next

Lệnh `/pd:what-next` hiển thị lỗi gần đây:

```
╔══════════════════════════════════════╗
║      RECENT ERRORS (Last 10)         ║
╠══════════════════════════════════════╣
║ Error count by skill:                ║
║   pd:fix-bug    [N] errors           ║
║   pd:write-code [N] errors           ║
║   ...                                 ║
║                                       ║
║ Most recent error:                   ║
║   [timestamp] [skill] [error]        ║
║   Run `/pd:fix-bug` to investigate   ║
╚══════════════════════════════════════╝
```

### Phục hồi lỗi

Các lỗi thường gặp và bước xử lý được ghi trong `docs/error-recovery.md`, theo từng skill với pattern và giải pháp cụ thể.

<a id="security-1"></a>
## Bảo Mật


| Rule                          | Mô tả                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------- |
| **CẤM đọc/hiển thị** | `.env`, `.env.*`, `credentials.*`, `*.pem`, `*.key`, `*secret*`, `wp-config.php`  |
| **Chỉ ghi tên key**        | Khi quét/báo cáo gặp biến môi trường → ghi tên key, KHÔNG ghi giá trị        |
| **Yêu cầu `.env.example`**    | Khi code dùng biến môi trường mới → thêm key vào `.env.example` kèm giá trị mẫu   |


Đây là lớp phòng thủ **trong prompt** — skill từ chối đọc file nhạy cảm kể cả khi người dùng yêu cầu.

### Bảo vệ cấp nền tảng (khuyến nghị)

Lớp prompt có thể bị vượt qua. Thêm **danh sách cấm** cấp nền tảng để chặn triệt để:

**Claude Code** — `.claude/settings.json`:

```json
{
  "permissions": {
    "deny": [
      "Read(.env)", "Read(.env.*)",
      "Read(**/secrets/*)", "Read(**/*credential*)",
      "Read(**/*.pem)", "Read(**/*.key)"
    ]
  }
}
```

**Codex CLI** — thêm vào `~/.codex/instructions.md`:

```
NEVER read files matching: .env, .env.*, *.pem, *.key, *credential*, secrets/*
```

**Gemini CLI** — `~/.gemini/settings.json`:

```json
{
  "blocked_file_patterns": [
    ".env", ".env.*", "*.pem", "*.key", "*credential*", "secrets/**"
  ]
}
```

**OpenCode / Copilot** — thêm vào `.gitignore` (đã có) + file hướng dẫn nền tảng với nội dung tương tự Codex.

> [!IMPORTANT]
> Phòng thủ nhiều lớp luôn tốt hơn: **Lớp 1** — Danh sách cấm nền tảng chặn đọc file. **Lớp 2** — Skill từ chối đọc/hiển thị nội dung nhạy cảm. **Lớp 3** — `.gitignore` ngăn commit file bí mật.

<a id="commit-conventions"></a>
## Quy Ước Commit

Please Done tự commit với tiền tố (bỏ qua nếu project không có git):


| Tiền tố        | Skill              | Khi nào                                                                    |
| ------------- | ------------------ | ----------------------------------------------------------------------- |
| `[TASK-N]`    | write-code         | Hoàn thành 1 task                                                        |
| `[TEST]`      | test               | Thêm file test (`.spec.ts`, `test-*.php`, `test/*.ts`, `test/*.t.sol`, `test/**/*_test.dart`) |
| `[BUG]`       | fix-bug            | Mỗi lần sửa bug (có thể nhiều lần cho một bug)                                  |
| `[TRACKING]`  | write-code         | Phase xong hết task (commit theo dõi riêng)                    |
| `[VERSION]`   | complete-milestone | Đóng milestone + tạo git tag                                        |
| `[AUDIT]`     | thủ công            | Sửa từ audit + tăng patch + git tag                        |


<a id="status-icons"></a>
## Biểu Tượng Trạng Thái


| Icon | Ý nghĩa        |
| ---- | -------------- |
| ⬜    | Chưa bắt đầu    |
| 🔄   | Đang làm    |
| ✅    | Hoàn thành      |
| ❌    | Bị chặn        |
| 🐛   | Có bug        |


<a id="supported-tech-stacks"></a>
## Các Stack Công Nghệ Được Hỗ Trợ


| Loại       | Framework                  | Database                          | Phát hiện bởi                                              |
| ---------- | -------------------------- | --------------------------------- | -------------------------------------------------------- |
| Backend    | NestJS                     | MongoDB/Mongoose, TypeORM, Prisma | `nest-cli.json`, `app.module.ts`                         |
| Backend    | Express                    | -                                 | `app.js`/`app.ts` + `express` trong package.json            |
| Frontend   | NextJS App Router          | -                                 | `next.config.`*                                          |
| Frontend   | Vite/React                 | -                                 | `vite.config.`*, nhiều file `.tsx/.jsx`                  |
| CMS        | WordPress                  | MySQL (wp-config.php)             | `wp-config.php`, `wp-content/`                           |
| Blockchain | Solidity (Hardhat/Foundry) | On-chain (EVM)                    | `hardhat.config.*`, `foundry.toml`, `contracts/**/*.sol` |
| Mobile     | Flutter (Dart + GetX)      | Local (Hive/SQLite)               | `pubspec.yaml` + `flutter`, `lib/main.dart`              |


### Các stack được hỗ trợ

Rules trong `commands/pd/rules/` cung cấp quy ước theo framework:

| Stack | File rule | Mô tả |
|-------|-----------|-------|
| Flutter | `flutter.md` | Quy ước Dart, GetX, Dio HTTP |
| NestJS | `nestjs.md` | Decorator TypeScript, DI, guard |
| NextJS | `nextjs.md` | App Router, server components, fetch data |
| Solidity | `solidity.md` | OpenZeppelin v5, SafeERC20, tối ưu gas |
| WordPress | `wordpress.md` | Chuẩn WP, sanitize/escape, REST API |
| General | `general.md` | Quy ước dự phòng cho framework chưa liệt kê |

> Stack được `/pd:init` tự phát hiện và rules copy vào `.planning/rules/`.

**Mở rộng stack mới**: Thêm `commands/pd/rules/[stack].md` + pattern phát hiện trong `workflows/init.md` Bước 4.

<a id="evaluation-suite-promptfoo"></a>
## Bộ Đánh Giá (Promptfoo)

Bộ đánh giá chất lượng prompt theo [best practices của Anthropic](https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills). Mọi skill được phân loại **Encoded Preference** — đánh giá tập trung độ chính xác tuân thủ quy trình.

### Chạy đánh giá

```bash
# Thiết lập: tạo .env với ANTHROPIC_API_KEY
# Cài promptfoo: npm install -g promptfoo

npm run eval            # 58 test tuân thủ workflow
npm run eval:trigger    # 19 test độ chính xác trigger
npm run eval:full       # Cả hai + lưu lịch sử benchmark
npm run eval:compare    # So sánh benchmark theo thời gian
npm run eval:view       # Xem kết quả trên trình duyệt
npm run eval:filter -- "pd:init"  # Chỉ chạy một skill
```

### Kết quả hiện tại


| Bộ test              | Số lượng    |
| ---------------------- | -------- |
| Tuân thủ workflow    | 58       |
| Độ chính xác trigger       | 19       |


<a id="additional-documentation"></a>
## Tài Liệu Bổ Sung


| File                                          | Nội dung                                                                 |
| --------------------------------------------- | ----------------------------------------------------------------------- |
| [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)  | Hướng tích hợp: mẫu anchor, tham chiếu chéo giữa các skill     |
| [CHANGELOG.md](CHANGELOG.md)                  | Changelog chi tiết theo phiên bản                                          |


<a id="license"></a>
## Giấy Phép

[MIT](LICENSE) — Xem file LICENSE để biết chi tiết.
