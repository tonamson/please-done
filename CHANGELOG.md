# Nhật ký thay đổi Skills

## [2.4.0] - 19_03_2026
### Thêm mới
- **WordPress stack support**: Thêm `wordpress.md` rules (coding standards, security, hooks, database, REST API, performance, i18n, enqueue assets)
- **9 WordPress reference docs** (`wordpress-refs/`): plugin-architecture, theme-development, gutenberg-blocks, woocommerce, security-hardening, database-migrations, wp-cli, multisite, testing — copy vào `.planning/docs/wordpress/` khi init
- **WordPress detection**: `init.md` + `scan.md` detect qua `wp-config.php`, `wp-content/plugins/*/`, `wp-content/themes/*/style.css`
- **WordPress test flow**: `test.md` hỗ trợ PHPUnit + `WP_UnitTestCase` bên cạnh Jest/Supertest
- **WordPress scan patterns**: `scan.md` quét plugins, themes, custom tables (`dbDelta`/`$wpdb->prefix`), REST API (`register_rest_route`), hooks (`add_action`/`add_filter`)
- **WordPress bug tracing**: `fix-bug.md` trace hook/action → callback → $wpdb → output, kiểm tra sanitize/escape/nonce/capability/prepared statements
- **3 eval tests WordPress**: init detection, write-code rules compliance, PHPUnit test flow

### Thay đổi
- `init.md`: Glob thêm `.php` + exclude `wp-includes/wp-admin` (tránh core WP files). `<context>` + Bước 8 notification + `<rules>` security list đều bao gồm WordPress
- `scan.md`: Glob thêm `.php`, Grep patterns dùng `|` (ripgrep syntax thay vì `\|`), WordPress scan section mới, `<rules>` security thêm `wp-config.php`
- `plan.md`: `<context>` đọc `wordpress.md` rules theo stack
- `write-code.md`: WordPress task section (ABSPATH check, docs tra cứu, Context7, `composer run lint`). Test suggestions: "NestJS hoặc WordPress" thay vì "NestJS only". Fallback lint: `composer run lint`
- `fix-bug.md`: `<context>` + Bước 5 + Bước 7 bao gồm WordPress
- `what-next.md`: Ưu tiên 6 bao gồm WordPress cho test suggestion
- `complete-milestone.md`: TEST_REPORT check bao gồm WordPress
- `general.md`: Code style ghi rõ "(TS/JS) — PHP theo rules riêng". Bảo mật thêm `wp-config.php`. Commit format thêm `[TRACKING]`
- `backend.md`: Decorator `@Roles` (sửa từ `@Group/@Role`), RequestWithUser gợi ý, MongoDB prefix `m` có VD, Middleware & Interceptor section mới, Soft delete 3 patterns (TypeORM/Mongoose/Prisma)
- `frontend.md`: Sub-components escape clause (>500 dòng), Error Handling & Loading section mới
- `README.md`: Bảng rules + cây `.planning/` bao gồm WordPress, bảng tech stack thêm WordPress row
- `promptfooconfig.yaml`: Glob patterns thêm `.php`, lint command đồng bộ, comment PHPUnit

### Sửa lỗi
- `wordpress.md`: `update_meta_cache` → `update_post_meta_cache` (đúng WP_Query parameter)
- `wordpress.md`: `composer run phpcs` → `composer run lint` (khớp testing.md reference)
- `init.md`: Glob thiếu `.php` → WordPress PHP-only project bị coi là "dự án mới" (critical)
- `scan.md`: Grep `\|` → `|` (ripgrep syntax)
- `write-code.md`: 4 chỗ reference NestJS-only cho test → sửa bao gồm WordPress
- `promptfooconfig.yaml`: 6× glob thiếu `.php`, 1× `composer phpcs` cũ

## [2.3.0] - 19_03_2026
### Thêm mới
- **DISCUSS mode dùng AskUserQuestion**: `plan.md` viết lại toàn bộ chế độ DISCUSS — user chọn bằng phím mũi tên thay vì gõ A/B/C. Hỗ trợ multiSelect, single select, chia nhóm 5+ vấn đề
- **Vòng lặp thảo luận mở rộng (3.5.4)**: User có thể chọn "Thảo luận thêm" sau bảng tóm tắt → Claude đưa vấn đề mới → loop đến khi user hài lòng
- **DISCUSS hybrid table**: PLAN.md phân biệt rõ "User chọn" vs "Claude quyết định" với ghi chú bổ sung cho quyết định tự đưa ra
- **Tracking commit**: `write-code.md` tạo commit `[TRACKING]` riêng khi phase hoàn tất — tách khỏi commit task code
- **7 eval tests mới**: Rules-missing check, 3.5.4 loop, back/cancel keywords, hybrid table, tracking commit, bug report header, TEST_REPORT failures. Tổng 41 tests (100% pass)

### Thay đổi
- `plan.md`: Bước 4.5 mở rộng — cover 6 trường hợp DISCUSS/AUTO (skip-all, cancel, partial, full, 0 issues)
- `plan.md`: Ngôn ngữ options PHẢI đơn giản cho người không phải dev, kèm VD tốt/xấu
- `plan.md`: Xử lý keyword "back"/"cancel" qua Other — quay lại vấn đề trước hoặc hủy thảo luận
- `init.md`: Kiểm tra rules files khi user giữ CONTEXT.md — cảnh báo nếu general.md bị thiếu
- `init.md`: Sửa false positive NestJS detection — main.ts phải chứa `NestFactory` (tránh nhầm Vite/Angular)
- `new-milestone.md`: Bước 6 phân biệt rõ hành vi GHI ĐÈ vs VIẾT TIẾP cho ROADMAP
- `test.md`: Bug report header 2 dòng khớp fix-bug.md — `Trạng thái | Chức năng | Task` và `Patch version | Lần sửa`
- `test.md`: Cập nhật trạng thái 🐛 CẢ HAI nơi (bảng + detail block)
- `what-next.md`: Ưu tiên 6 tách rõ "chưa test" vs "test fail" — gợi ý /pd:fix-bug khi TEST_REPORT có ❌
- `write-code.md`: --auto DỪNG tại ranh giới phase ban đầu (KHÔNG tự nhảy sang phase tiếp dù CURRENT_MILESTONE đã advance)
- `install.js`: Dedup runtimes khi dùng --all + --claude cùng lúc
- `install.js`: Banner word-wrapping cho platform names dài
- `claude.js`: Cleanup symlink trước khi tạo mới (ngăn EEXIST)
- `utils.js`: Bảo vệ null/undefined + truncate trong banner lines

### Sửa lỗi
- 2 eval tests cũ fail do scenario thiếu data → sửa: --auto phase boundary scenario rõ hơn, what-next all-phases-done bổ sung đầy đủ TEST_REPORT

## [2.2.1] - 18_03_2026
### Thay đổi
- `what-next.md`: Thêm rule bắt buộc output tiếng Việt có dấu (trước đó không đọc general.md nên thiếu rule ngôn ngữ)
- `update.md`: Tương tự — thêm rule tiếng Việt trực tiếp trong `<rules>`
- `README.md`: Bổ sung hướng dẫn bảo mật đa tầng cho tất cả 5 platforms (built-in rules + platform deny list + .gitignore)

## [2.2.0] - 18_03_2026
### Thêm mới
- **Eval suite (Promptfoo)**: Bộ đánh giá chất lượng prompt theo Anthropic best practices
- **32 workflow compliance tests**: Kiểm tra mỗi skill follow đúng process, branch logic, prerequisite handling
- **19 trigger accuracy tests**: Kiểm tra description trigger đúng skill (true positive, true negative, disambiguation)
- **Benchmark history**: Lưu kết quả JSON + so sánh trend qua thời gian (`npm run eval:compare`)
- **Full eval pipeline**: `npm run eval:full` chạy workflow + trigger + benchmark trong 1 lệnh
- **Skill classification**: Ghi rõ tất cả 11 skills thuộc loại "Encoded Preference" trong config

### Thay đổi
- `write-code.md`: Sửa description rõ ràng hơn — giảm false positive trigger cho việc lẻ (refactor, README)

## [2.1.0] - 18_03_2026
### Sửa lỗi
- **Codex `mergeCodexConfig` mất markers**: Merge lần 2+ bị duplicate append do markers bị strip — giờ giữ lại markers để idempotent
- **`--config-dir` không có giá trị**: parseArgs crash với `undefined` khi flag là arg cuối — thêm bounds check + thông báo lỗi
- **Gemini JSON parse thầm lặng**: settings.json bị corrupt mất data không cảnh báo — thêm `log.warn`

### Thêm mới
- **npm scripts đầy đủ**: Thêm `install:opencode`, `install:copilot`, `uninstall:codex`, `uninstall:gemini`, `uninstall:opencode`, `uninstall:copilot`, `uninstall:all`

## [2.0.1] - 18_03_2026
### Thay đổi
- **Đổi tên skill**: `pd:roadmap` → `pd:new-milestone` — đồng bộ naming convention với `pd:complete-milestone`
- Cập nhật references trong: `init.md`, `plan.md`, `what-next.md`, `complete-milestone.md`, `README.md`, `claude.js` installer

## [2.0.0] - 18_03_2026
### Thêm mới
- **Cross-platform installer**: Hỗ trợ 5 platforms — Claude Code, Codex CLI, Gemini CLI, OpenCode, GitHub Copilot
- `bin/install.js`: CLI installer với interactive mode, flags per platform (`--claude`, `--codex`, `--gemini`, `--opencode`, `--copilot`, `--all`)
- Converters: transpile skills từ Claude Code format sang native format cho từng platform (tool names, command prefix, paths, frontmatter)
- Codex: XML skill adapter header (`<codex_skill_adapter>`), MCP config trong `config.toml` (TOML)
- Gemini: tool name mapping (Read→read_file, Bash→run_shell_command), MCP config trong `settings.json`
- OpenCode: flat command structure (`command/pd-*.md`), strip frontmatter fields
- Copilot: skill directories (`skills/pd-*/SKILL.md`), merge instructions vào `copilot-instructions.md`
- SHA256 manifest tracking — detect + auto-backup files user đã modify trước khi re-install
- Leaked path scan — verify không còn `~/.claude/` trong output non-Claude platforms
- Uninstall tích hợp (`--uninstall`) — clean per platform, marker-based idempotent

### Thay đổi
- `complete-milestone.md`: Thêm Bước 8 cập nhật `VERSION` và `package.json` khi hoàn tất milestone
- `general.md`: Thêm quy tắc bảo mật — khi code dùng biến môi trường mới, BẮT BUỘC thêm key vào `.env.example`

### Xóa
- `install.sh` — thay bằng `bin/install.js --claude`
- `uninstall.sh` — thay bằng `bin/install.js --uninstall --claude`

## [1.2.2] - 18_03_2026
### Thay đổi
- `complete-milestone.md`: Thêm Bước 8 cập nhật `VERSION` và `package.json` khi hoàn tất milestone, git add các file version trong commit

## [1.2.1] - 18_03_2026
### Thay đổi
- `general.md`: Thêm quy tắc bảo mật — khi code dùng biến môi trường mới, BẮT BUỘC thêm key vào `.env.example` với giá trị placeholder

## [1.2.0] - 18_03_2026
### Thêm mới
- **Transparency cho AUTO mode**: `plan.md`, `roadmap.md` ghi lại mọi quyết định Claude tự đưa ra (phương án, lý do, alternatives đã loại) — user review được trước khi viết code
- **Quyết định chiến lược trong ROADMAP**: roadmap.md thêm section bắt buộc ghi lý do phân chia milestones, thứ tự ưu tiên
- **Format specs chuẩn trong `general.md`**: CURRENT_MILESTONE.md format, TASKS.md dependency format, phase/version numbering convention, icon matching patterns
- **Multi-stack detection**: `init.md`, `scan.md` detect Express, Vite, React generic ngoài NestJS/NextJS; `test.md` hỗ trợ thông báo + fallback cho non-NestJS
- **Phase auto-advance**: `write-code.md` tự advance CURRENT_MILESTONE sang phase tiếp khi phase hiện tại hoàn tất
- **`--all` regression test**: `test.md` đọc context cross-phase, xác định patch version theo milestone chứa task fail
- **Task cross-phase lookup**: `test.md` tìm task ở phase khác nếu không có trong phase hiện tại

### Thay đổi
- `write-code.md`: Đảo thứ tự Bước 7/8 — git commit TRƯỚC, đánh dấu ✅ SAU (rollback nếu commit fail)
- `write-code.md`: Thêm stop khi PLAN.md thiếu info, circular dependency detection, lint/build retry limit (3 lần), update `Dự án mới` flag sau task đầu tiên
- `write-code.md`: Parallel mode thêm empty wave guard, file conflict detection qua `> Files:` field
- `plan.md`: Bước 4.5 ghi nhận quyết định SAU thiết kế (không phải trước), thêm check CURRENT_MILESTONE tồn tại, xử lý conflicting flags `--discuss --auto`
- `scan.md`: Rules xóa chỉ template files (giữ custom rules), thêm path validation CONTEXT.md, explicit guard Bước 6 cho project mới
- `roadmap.md`: Thêm cleanup/backup khi GHI ĐÈ, version conflict check khi VIẾT TIẾP, phân biệt câu hỏi theo mode
- `fix-bug.md`: Thêm git commit sau user confirm fix, fallback Grep/Read khi FastCode lỗi, patch version regex nhất quán, retry suggestion sau 3 lần
- `test.md`: Shared code bug attribution, testPathPattern cho phase hiện tại, patch version 3 số convention
- `complete-milestone.md`: CODE_REPORT verify per-task per-phase (không cross-phase), CHANGELOG prepend, guard chống chạy lại, git tag check
- `what-next.md`: Đọc ROADMAP cho ưu tiên 7, cross-check bugs vs tasks, renumber ưu tiên 1-8, TEST_REPORT content check
- `fetch-doc.md`: Version detection từ package.json theo tên thư viện, SPA content detection, clarify 10 filter → 5 fetch, HTTP error handling, monorepo version conflict
- `update.md`: Semver comparison rõ ràng, branch check trước pull, submodule check, rollback bằng commit hash, CHANGELOG chỉ hiện entries mới
- `init.md`: CONTEXT.md thêm dòng `Cập nhật:`, monorepo path support, xóa rules chỉ template files
- Bug severity 4 levels thống nhất giữa `fix-bug.md` và `test.md`
- TASKS.md update CẢ HAI nơi (bảng + detail block) nhất quán toàn bộ skills

## [1.1.2] - 18_03_2026
### Thay đổi
- `complete-milestone.md`: Thêm gợi ý chạy `/pd:scan` sau khi hoàn tất milestone để cập nhật kiến trúc
- `update.md`: Xóa cache status line (`pd-update-check.json`) sau khi cập nhật thành công — ngừng hiện thông báo ngay
- `update.md`: Thêm rule bắt buộc xóa cache sau update

## [1.1.1] - 18_03_2026
### Thêm mới
- Thông báo version mới trên status line (góc trái dưới) — `⬆ Skills v[x.x.x] — /pd:update`
- SessionStart hook (`pd-check-update.js`) — kiểm tra remote version khi bắt đầu session, cache 10 phút
- Tích hợp vào GSD statusline — hiện cùng dòng với thông tin GSD

### Sửa lỗi
- Fix `update.md` Bước 8: "Ghi thêm" gây duplicate CURRENT_VERSION — đổi thành thay thế idempotent
- Fix `what-next.md` context/rules: ghi rõ dùng Bash cho version check (trước nói "chỉ Read/Glob")
- Xóa `check-update.sh` orphaned (đã thay bằng `pd-check-update.js`)

## [1.1.0] - 18_03_2026
### Thêm mới
- `/pd:update` — Kiểm tra + cập nhật bộ skills từ GitHub, hiện changelog, gợi ý restart
- `/pd:plan --discuss` — Chế độ thảo luận tương tác: liệt kê vấn đề, user chọn thảo luận, options A-E cho từng vấn đề
- `/pd:plan --auto` — Chế độ mặc định, Claude tự quyết định toàn bộ thiết kế
- Kiểm tra phiên bản tự động — hiện thông báo khi có version mới (1 lần/conversation)
- `VERSION` + `CHANGELOG.md` — Hệ thống tracking phiên bản cho bộ skills

### Thay đổi
- `plan.md`: Hỗ trợ 2 chế độ AUTO/DISCUSS, lưu quyết định thiết kế vào PLAN.md section "Quyết định thiết kế"
- `plan.md`: DISCUSS flow hỗ trợ back/cancel/thay đổi quyết định, validate input không hợp lệ
- `write-code.md`: Đọc + tuân thủ section "Quyết định thiết kế" từ PLAN.md (Bước 2 + rules)
- `general.md`: Thêm section kiểm tra phiên bản Skills tự động
- `what-next.md`: Thêm Bước 6 kiểm tra phiên bản (guard chống duplicate check)
- `install.sh`: Hiện version khi cài, liệt kê `/pd:update`, bảo toàn CURRENT_VERSION trong .pdconfig

### Sửa lỗi
- Fix XML structure toàn bộ 11 skills: tags balanced, bỏ `</output>` thừa, consistent endings
- Fix template comment `(CHỈ tạo section này nếu chế độ DISCUSS)` nằm trong code block — di chuyển ra ngoài
- Fix `install.sh` ghi đè `.pdconfig` mất CURRENT_VERSION — preserve trước khi overwrite
- Fix `update.md` không handle LOCAL > REMOTE — thêm semver comparison đầy đủ (4 nhánh)
- Fix `plan.md` DISCUSS flow thiếu error handling — thêm xử lý input không hợp lệ, back, cancel

## [1.0.0] - 18_03_2026
### Khởi tạo
- Bộ 10 skills: init, scan, roadmap, plan, fetch-doc, write-code, test, fix-bug, what-next, complete-milestone
- Rules: general.md, backend.md (NestJS), frontend.md (NextJS)
- FastCode MCP + Context7 MCP integration
- install.sh + uninstall.sh
