# Please Done — Bộ Skills AI Coding Đa Nền Tảng

[![Version](https://img.shields.io/badge/version-2.7.3-blue.svg)](https://github.com/tonamson/please-done/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D16-brightgreen.svg)](https://nodejs.org)
[![Platforms](https://img.shields.io/badge/platforms-Claude%20Code%20%7C%20Codex%20%7C%20Gemini%20%7C%20OpenCode%20%7C%20Copilot-purple.svg)](#nền-tảng-hỗ-trợ)

Please Done là bộ skills (`/pd:*`) cho AI coding CLI — quy trình phát triển có cấu trúc, từ khởi tạo đến phát hành.

**Phiên bản hiện tại: v2.7.3**

## Mục lục

- [Nền tảng hỗ trợ](#nền-tảng-hỗ-trợ)
- [Yêu cầu](#yêu-cầu)
- [Cài đặt](#cài-đặt)
- [Gỡ cài đặt](#gỡ-cài-đặt)
- [Cập nhật Please Done](#cập-nhật-please-done)
- [Sau khi cài](#sau-khi-cài)
- [Danh sách Skills](#danh-sách-skills)
- [Cấu trúc `.planning/`](#cấu-trúc-planning)
- [Kiến trúc đa nền tảng](#kiến-trúc-đa-nền-tảng)
- [Máy chủ MCP](#máy-chủ-mcp)
- [Bảo mật](#bảo-mật)
- [Quy ước Commit](#quy-ước-commit)
- [Biểu tượng trạng thái](#biểu-tượng-trạng-thái)
- [Tech Stack hỗ trợ](#tech-stack-hỗ-trợ)
- [Bộ đánh giá (Promptfoo)](#bộ-đánh-giá-promptfoo)
- [Tài liệu bổ sung](#tài-liệu-bổ-sung)
- [Giấy phép](#giấy-phép)

## Nền tảng hỗ trợ


| Nền tảng           | Cú pháp gọi skill         | Thư mục cấu hình              |
| ------------------ | ------------------------- | ----------------------------- |
| **Claude Code**    | `/pd:init`, `/pd:plan`... | `~/.claude/commands/pd/`      |
| **Codex CLI**      | `$pd-init`, `$pd-plan`... | `~/.codex/skills/pd-*/`       |
| **Gemini CLI**     | `/pd:init`, `/pd:plan`... | `~/.gemini/commands/pd/`      |
| **OpenCode**       | `/pd-init`, `/pd-plan`... | `~/.config/opencode/command/` |
| **GitHub Copilot** | `/pd:init`, `/pd:plan`... | `~/.copilot/skills/pd-*/`     |


Kiến trúc: Viết 1 lần (Claude Code) → Chuyển đổi khi cài → Chạy native trên từng nền tảng.

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
git clone https://github.com/tonamson/please-done.git
cd please-done
```

```bash
# Tương tác — chọn nền tảng
node bin/install.js

# Cài cho nền tảng cụ thể
node bin/install.js --claude
node bin/install.js --codex
node bin/install.js --gemini
node bin/install.js --opencode
node bin/install.js --copilot

# Cài tất cả nền tảng
node bin/install.js --all

# Cài cục bộ (chỉ project hiện tại)
node bin/install.js --claude --local
```

### Trình cài đặt tự động thực hiện


| Bước | Mô tả                                                          |
| ---- | -------------------------------------------------------------- |
| 1    | Kiểm tra điều kiện tiên quyết (python, uv, git)                |
| 2    | Khởi tạo FastCode submodule                                    |
| 3    | Tạo Python venv + cài thư viện phụ thuộc                       |
| 4    | Cấu hình Gemini API Key (bắt buộc cho FastCode MCP)            |
| 5    | Chuyển đổi + sao chép skills vào thư mục cấu hình của nền tảng |
| 6    | Đăng ký máy chủ MCP (FastCode + Context7)                      |


### Lấy Gemini API Key (bắt buộc)

FastCode MCP dùng Gemini API để lập chỉ mục và phân tích code:

1. Truy cập [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Tạo API key mới
3. Dán key khi trình cài đặt hỏi

### Context7 MCP (tự động cài)

Context7 tra cứu tài liệu API đúng phiên bản cho thư viện đang dùng. Trình cài đặt tự động đăng ký nếu có `npx`.

## Gỡ cài đặt

```bash
# Gỡ từng nền tảng
node bin/install.js --uninstall --claude
node bin/install.js --uninstall --codex
node bin/install.js --uninstall --gemini
node bin/install.js --uninstall --opencode
node bin/install.js --uninstall --copilot

# Gỡ tất cả
node bin/install.js --uninstall --all
```

Gỡ cài đặt chỉ xóa files có tiền tố `pd-` — không đụng cấu hình/files khác của người dùng.

## Cập nhật Please Done

Khi có phiên bản mới, thanh trạng thái sẽ hiện:

```
⬆ Please Done v[x.x.x] — /pd:update hoặc $pd-update
```

Cập nhật bằng lệnh:

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

Sau khi cập nhật → thoát CLI → chạy lại để tải phiên bản Please Done mới.

## Sau khi cài

```bash
# 1. Khởi động lại CLI để tải Please Done mới
# 2. Mở dự án bất kỳ
cd /path/to/your/project

# 3. Chạy skill đầu tiên
/pd:init        # Claude Code, Gemini, Copilot
$pd-init        # Codex
/pd-init        # OpenCode
```

## Danh sách Skills

### Quy trình chính (theo thứ tự)


| #   | Skill                | Mô tả                                                                                                              | Cần chạy trước |
| --- | -------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------- |
| 1   | `init`               | Kiểm tra FastCode MCP, lập chỉ mục dự án, nhận diện tech stack, tạo CONTEXT.md + sao chép rules                    | -              |
| 2   | `scan`               | Quét cấu trúc code, thư viện phụ thuộc, kiến trúc, kiểm tra bảo mật, tạo SCAN_REPORT                               | init           |
| 3   | `new-milestone`      | Lập kế hoạch milestones + phases + phụ thuộc                                                                       | init, scan (*) |
| 4   | `plan`               | Nghiên cứu dự án, thiết kế kỹ thuật, chia danh sách công việc cho phase                                            | new-milestone  |
| 5   | `write-code`         | Thực thi task từ TASKS.md, kiểm tra cú pháp, build, commit `[TASK-N]`                                              | plan           |
| 6   | `test`               | Viết tests (Jest/Supertest, PHPUnit, Hardhat/Foundry, flutter_test), chạy, yêu cầu xác nhận | write-code     |
| 7   | `fix-bug`            | Nghiên cứu lỗi, phân tích, sửa, commit `[LỖI]`, lặp đến khi người dùng xác nhận                                    | init           |
| 8   | `complete-milestone` | Kiểm tra lỗi, tổng kết, commit `[PHIÊN BẢN]`, tạo git tag                                                          | tất cả tasks ✅ |


(*) Dự án mới chưa có code: `new-milestone` cho phép bỏ qua scan.

### Tiện ích


| Skill       | Mô tả                                                                               |
| ----------- | ----------------------------------------------------------------------------------- |
| `what-next` | Quét trạng thái .planning/, hiển thị tiến trình, gợi ý lệnh tiếp theo               |
| `fetch-doc` | Tải tài liệu từ URL, lưu markdown cục bộ kèm phiên bản + mục lục phân theo section  |
| `update`    | Kiểm tra + cập nhật bộ skills từ GitHub, hiện nhật ký thay đổi, gợi ý khởi động lại |


### Rules (quy tắc viết code)


| Tệp                     | Áp dụng khi  | Nội dung chính                                                                                                                         |
| ----------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `rules/general.md`      | Luôn luôn    | Phong cách code, ngôn ngữ, biểu tượng, định dạng phiên bản, git, bảo mật                                                               |
| `rules/nestjs.md`       | Có NestJS    | Controller, Service, DTO, Entity, Response, Guard, Build & Lint                                                                        |
| `rules/nestjs-refs/`    | Có NestJS    | 5 tài liệu tham khảo: authentication, database patterns, testing, Swagger, error handling                                              |
| `rules/nextjs.md`       | Có NextJS    | Component, Ant Design v6, Zustand, API layer, Pages, Admin                                                                             |
| `rules/nextjs-refs/`    | Có NextJS    | 5 tài liệu tham khảo: server components, authentication, SEO metadata, API integration, Zustand patterns                               |
| `rules/wordpress.md`    | Có WordPress | Security (sanitize/escape/nonce), Hooks, $wpdb, REST API, Performance, WP Coding Standards                                             |
| `rules/wordpress-refs/` | Có WordPress | 9 tài liệu tham khảo chi tiết: plugin architecture, theme, Gutenberg, WooCommerce, security, DB migrations, WP-CLI, multisite, testing |
| `rules/solidity.md`     | Có Solidity  | OpenZeppelin imports, SafeERC20, Security modifiers, NatSpec, Gas optimization, Signature verification, Hardhat/Foundry                |
| `rules/solidity-refs/`  | Có Solidity  | 2 tài liệu tham khảo: contract templates (base + signature pattern), audit checklist (12 categories + pre-deploy)                      |
| `rules/flutter.md`     | Có Flutter   | GetX architecture (Logic+State+View+Binding), design tokens, navigation, Dio, testing, security                                       |
| `rules/flutter-refs/`  | Có Flutter   | 8 tài liệu tham khảo: state management, navigation, design system, testing, performance, platform channels, packages, notifications   |


Rules được `init` tự động sao chép vào `.planning/rules/` theo tech stack nhận diện được. NestJS references được copy vào `.planning/docs/nestjs/`, NextJS references vào `.planning/docs/nextjs/`, WordPress references vào `.planning/docs/wordpress/`, Solidity references vào `.planning/docs/solidity/`, Flutter references vào `.planning/docs/flutter/` để tra cứu khi code. Các skill `plan`, `write-code`, `test`, `fix-bug` đọc rules từ đó khi viết code.

### Tùy chọn plan


| Lệnh                 | Hành vi                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| `plan`               | Chế độ **TỰ ĐỘNG** — assistant tự quyết định, ghi lại mọi quyết định + lý do để người dùng xem lại |
| `plan --discuss`     | Chế độ **THẢO LUẬN** — trao đổi tương tác tính năng với người dùng                              |
| `plan 1.2`           | Lập kế hoạch cho phase cụ thể                                                                   |
| `plan 1.2 --discuss` | Lập kế hoạch phase 1.2 kèm thảo luận                                                            |


#### Chế độ THẢO LUẬN (`--discuss`)

Assistant phân tích deliverable, liệt kê các vấn đề cần quyết định → người dùng chọn bằng phím mũi tên nếu nền tảng hỗ trợ, hoặc trả lời bằng văn bản thường nếu không có UI chọn → assistant đưa ra phương án cho từng vấn đề:

- Người dùng chọn vấn đề muốn thảo luận (multiSelect — chọn nhiều cùng lúc)
- Mỗi vấn đề hiện danh sách phương án — phương án đầu luôn là khuyến nghị (ghi "Đề xuất")
- Chọn "Other" để mô tả cách riêng, gõ `back` quay lại vấn đề trước, `cancel` hủy thảo luận
- Sau khi chốt → bảng tóm tắt → có thể "Thảo luận thêm vấn đề khác" (assistant đưa vấn đề mới)
- Quyết định được lưu vào PLAN.md mục "Quyết định thiết kế" → `write-code` tuân thủ

### Tùy chọn write-code


| Lệnh                      | Hành vi                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `write-code`              | Chọn task ⬜ tiếp theo, làm xong **dừng hỏi**                    |
| `write-code --auto`       | Làm **tất cả** tasks ⬜ trong phase **tuần tự**                  |
| `write-code --parallel`   | Phân tích phụ thuộc, nhóm đợt, chạy **song song** tasks độc lập |
| `write-code 3`            | Làm task số 3, xong dừng hỏi                                    |
| `write-code 3 --auto`     | Bắt đầu từ task 3, chạy hết phase tuần tự                       |
| `write-code 3 --parallel` | Bắt đầu từ task 3, chạy song song tasks độc lập                 |


#### Chế độ song song (`--parallel`)

Phân tích đồ thị phụ thuộc giữa tasks → nhóm thành **đợt** → tasks độc lập trong cùng đợt chạy song song bằng **đa tác tử**:

```
Đợt 1 (song song):
  🔀 Tác tử A: Task 1 (Backend) — tạo API users
  🔀 Tác tử B: Task 2 (Frontend) — trang users (dùng cấu trúc response từ PLAN.md)
Đợt 2 (tuần tự — phụ thuộc Đợt 1):
  → Task 3: Kết nối validation (cần code từ Task 1)
```

## Cấu trúc `.planning/`

Khi chạy skills trong một dự án, thư mục `.planning/` được tạo với cấu trúc:

```
.planning/
├── CONTEXT.md                    # Tech stack, thư viện, trỏ tới rules (< 50 dòng)
├── ROADMAP.md                    # Milestones + phases + deliverables
├── CURRENT_MILESTONE.md          # Theo dõi version/phase/trạng thái hiện tại
├── CHANGELOG.md                  # Nhật ký thay đổi (tạo khi complete-milestone)
├── scan/
│   └── SCAN_REPORT.md            # Báo cáo quét dự án + kiểm tra bảo mật thư viện
├── docs/                         # Tài liệu cache (fetch-doc) kèm phiên bản + mục lục
│   ├── nestjs/                   # Tài liệu tham khảo NestJS (nếu có NestJS)
│   ├── nextjs/                   # Tài liệu tham khảo NextJS (nếu có NextJS)
│   ├── wordpress/                # Tài liệu tham khảo WordPress (nếu có WordPress)
│   ├── solidity/                 # Tài liệu tham khảo Solidity (nếu có Solidity)
│   └── flutter/                  # Tài liệu tham khảo Flutter (nếu có Flutter)
├── bugs/
│   └── BUG_*.md                  # Báo cáo lỗi (code trước/sau, phiên bản vá)
├── rules/                        # Quy tắc viết code (sao chép từ repo Please Done theo stack)
│   ├── general.md                # Quy tắc chung (luôn có)
│   ├── nestjs.md                 # Quy ước NestJS (nếu có NestJS)
│   ├── nextjs.md                 # Quy ước NextJS (nếu có NextJS)
│   ├── wordpress.md              # Quy ước WordPress (nếu có WordPress)
│   ├── solidity.md               # Quy ước Solidity (nếu có Solidity)
│   └── flutter.md                # Quy ước Flutter (nếu có Flutter)
└── milestones/[version]/
    ├── MILESTONE_COMPLETE.md     # Tổng kết milestone (tạo khi hoàn tất)
    └── phase-[x.x]/
        ├── PLAN.md               # Thiết kế kỹ thuật + API + cơ sở dữ liệu + quyết định
        ├── TASKS.md              # Danh sách công việc + trạng thái
        ├── TEST_REPORT.md        # Kết quả kiểm thử (NestJS/WordPress/Solidity/Flutter)
        └── reports/
            └── CODE_REPORT_TASK_[N].md  # Báo cáo từng task
```

## Kiến trúc đa nền tảng

```
Mã nguồn (Claude Code gốc)          Trình chuyển đổi khi cài          Nền tảng đích
┌──────────────────────┐            ┌──────────────────┐            ┌─────────────────┐
│ commands/pd/*.md     │            │                  │──────────→ │ Claude Code     │
│ workflows/*.md       │            │                  │──────────→ │ Codex CLI       │
│ references/*.md      │───────────→│  bin/install.js  │──────────→ │ Gemini CLI      │
│ templates/*.md       │            │  (Node.js, 0 dep)│──────────→ │ OpenCode        │
│ commands/pd/rules/*  │            │                  │──────────→ │ GitHub Copilot  │
│ VERSION, CHANGELOG   │            └──────────────────┘            └─────────────────┘
└──────────────────────┘
```

**Nguyên tắc:**

- Các skill chỉ viết 1 lần bằng định dạng Claude Code
- Trình cài đặt chuyển đổi sang định dạng gốc cho từng nền tảng
- Không có thư viện phụ thuộc khi chạy (chỉ Node.js stdlib)
- Theo dõi mã băm SHA256 — tự động sao lưu files người dùng đã chỉnh sửa trước khi cài lại
- Quét đường dẫn rò rỉ — xác minh không còn `~/.claude/` trong đầu ra nền tảng khác

### Chuyển đổi theo nền tảng


| Thành phần          | Claude Code       | Codex                  | Gemini                                   | OpenCode       | Copilot                 |
| ------------------- | ----------------- | ---------------------- | ---------------------------------------- | -------------- | ----------------------- |
| **Tên công cụ**     | Read, Write, Bash | Giữ nguyên             | read_file, write_file, run_shell_command | Giữ nguyên     | read, write, execute    |
| **Tiền tố lệnh**    | /pd:              | $pd-                   | /pd:                                     | /pd-           | /pd:                    |
| **Định dạng skill** | .md lồng nhau     | SKILL.md + XML adapter | .md lồng nhau                            | pd-*.md phẳng  | SKILL.md                |
| **Cấu hình MCP**    | settings.json     | config.toml (TOML)     | settings.json                            | Cấu hình riêng | copilot-instructions.md |


## Máy chủ MCP


| MCP          | Vai trò                                              | Bắt buộc             |
| ------------ | ---------------------------------------------------- | -------------------- |
| **FastCode** | Lập chỉ mục + phân tích code dự án (dùng Gemini API) | Có (init dừng nếu lỗi; skill khác fallback Grep/Read) |
| **Context7** | Tra cứu tài liệu API thư viện đúng phiên bản         | Không (nhưng nên có) |


Please Done tự động gọi FastCode để nghiên cứu code hiện có và Context7 để tra cứu tài liệu thư viện. Nếu FastCode MCP lỗi: `init` sẽ dừng (bắt buộc kết nối thành công); các skill khác (`scan`, `plan`, `write-code`, `test`, `fix-bug`) tự động fallback sang Grep/Read kèm cảnh báo — vẫn hoạt động nhưng kém chính xác hơn.

## Bảo mật

### Bảo vệ tích hợp trong skills

Tất cả skills tuân thủ quy tắc bảo mật trong `rules/general.md`:


| Quy tắc                       | Mô tả                                                                            |
| ----------------------------- | -------------------------------------------------------------------------------- |
| **CẤM đọc/hiển thị nội dung** | `.env`, `.env.*`, `credentials.*`, `*.pem`, `*.key`, `*secret*`, `wp-config.php` |
| **Chỉ ghi tên biến**          | Khi quét/báo cáo gặp biến môi trường → ghi tên key, KHÔNG ghi giá trị            |
| **Bắt buộc `.env.example`**   | Khi code dùng biến môi trường mới → thêm key vào `.env.example` với giá trị mẫu  |


Đây là lớp phòng thủ **trong prompt** — skills tự từ chối đọc file nhạy cảm dù người dùng yêu cầu.

### Bảo vệ ở tầng nền tảng (khuyến nghị)

Lớp phòng thủ trong prompt có thể bị vượt qua. Nên thêm danh sách chặn **ở tầng nền tảng** để chặn hoàn toàn:

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

**OpenCode / Copilot** — thêm vào `.gitignore` (đã có sẵn) + tệp hướng dẫn của nền tảng tương ứng với nội dung tương tự Codex.

> [!IMPORTANT]
> Phòng thủ nhiều lớp luôn tốt hơn: **Lớp 1** — Danh sách chặn nền tảng ngăn đọc file. **Lớp 2** — Skills từ chối đọc/hiển thị nội dung nhạy cảm. **Lớp 3** — `.gitignore` ngăn commit file bí mật.

## Quy ước Commit

Please Done tự động commit với tiền tố tiếng Việt (bỏ qua nếu dự án không có git):


| Tiền tố       | Skill              | Khi nào                                                                |
| ------------- | ------------------ | ---------------------------------------------------------------------- |
| `[TASK-N]`    | write-code         | Hoàn thành 1 task                                                      |
| `[KIỂM THỬ]`  | test               | Thêm file kiểm thử (`.spec.ts`, `test-*.php`, `test/*.ts`, `test/*.t.sol`, `test/**/*_test.dart`) |
| `[LỖI]`       | fix-bug            | Mỗi lần sửa lỗi (có thể nhiều lần/lỗi)                                 |
| `[TRACKING]`  | write-code         | Phase hoàn tất tất cả tasks (tracking commit riêng)                    |
| `[PHIÊN BẢN]` | complete-milestone | Đóng milestone + tạo git tag                                           |
| `[AUDIT]`     | thủ công           | Sửa lỗi phát hiện từ audit + patch bump + git tag                      |


## Biểu tượng trạng thái


| Biểu tượng | Ý nghĩa        |
| ---------- | -------------- |
| ⬜          | Chưa bắt đầu   |
| 🔄         | Đang thực hiện |
| ✅          | Hoàn tất       |
| ❌          | Bị chặn        |
| 🐛         | Có lỗi         |


## Tech Stack hỗ trợ


| Loại       | Framework                  | Cơ sở dữ liệu                     | Nhận diện bằng                                           |
| ---------- | -------------------------- | --------------------------------- | -------------------------------------------------------- |
| Backend    | NestJS                     | MongoDB/Mongoose, TypeORM, Prisma | `nest-cli.json`, `app.module.ts`                         |
| Backend    | Express                    | -                                 | `app.js`/`app.ts` + `express` trong package.json         |
| Frontend   | NextJS App Router          | -                                 | `next.config.`*                                          |
| Frontend   | Vite/React                 | -                                 | `vite.config.`*, nhiều tệp `.tsx/.jsx`                   |
| CMS        | WordPress                  | MySQL (wp-config.php)             | `wp-config.php`, `wp-content/`                           |
| Blockchain | Solidity (Hardhat/Foundry) | On-chain (EVM)                    | `hardhat.config.*`, `foundry.toml`, `contracts/**/*.sol` |
| Mobile     | Flutter (Dart + GetX)      | Local (Hive/SQLite)               | `pubspec.yaml` + `flutter`, `lib/main.dart`              |


NestJS, NextJS, WordPress, Solidity, và Flutter có rules + phân tích chi tiết. Các stack khác được nhận diện nhưng chỉ liệt kê files, áp dụng `general.md`.

**Mở rộng stack mới**: Thêm tệp `commands/pd/rules/[stack].md` + mẫu nhận diện trong `workflows/init.md` Bước 4.

## Bộ đánh giá (Promptfoo)

Bộ đánh giá chất lượng prompt theo [phương pháp Anthropic](https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills). Tất cả skills thuộc loại **Encoded Preference** — đánh giá tập trung vào độ chính xác quy trình.

### Chạy đánh giá

```bash
# Thiết lập: tạo .env với ANTHROPIC_API_KEY
# Cài promptfoo: npm install -g promptfoo

npm run eval            # 58 bài kiểm tra tuân thủ quy trình
npm run eval:trigger    # 19 bài kiểm tra độ chính xác kích hoạt
npm run eval:full       # Cả 2 + lưu lịch sử benchmark
npm run eval:compare    # So sánh benchmark qua thời gian
npm run eval:view       # Xem kết quả trong trình duyệt
npm run eval:filter -- "pd:init"  # Chạy riêng 1 skill
```

### Kết quả hiện tại


| Bộ kiểm tra            | Số lượng |
| ---------------------- | -------- |
| Tuân thủ quy trình     | 58       |
| Độ chính xác kích hoạt | 19       |


## Tài liệu bổ sung


| Tệp                                          | Nội dung                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------ |
| [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)  | Hướng dẫn tích hợp: anchor patterns, cross-references giữa skills       |
| [CHANGELOG.md](CHANGELOG.md)                  | Nhật ký thay đổi chi tiết theo từng phiên bản                           |


## Giấy phép

[MIT](LICENSE) - Xem file LICENSE để biết chi tiết.
