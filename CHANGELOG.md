# Nhật ký thay đổi Skills

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
- `complete-milestone.md`: Thêm gợi ý chạy `/sk:scan` sau khi hoàn tất milestone để cập nhật kiến trúc
- `update.md`: Xóa cache status line (`sk-update-check.json`) sau khi cập nhật thành công — ngừng hiện thông báo ngay
- `update.md`: Thêm rule bắt buộc xóa cache sau update

## [1.1.1] - 18_03_2026
### Thêm mới
- Thông báo version mới trên status line (góc trái dưới) — `⬆ Skills v[x.x.x] — /sk:update`
- SessionStart hook (`sk-check-update.js`) — kiểm tra remote version khi bắt đầu session, cache 10 phút
- Tích hợp vào GSD statusline — hiện cùng dòng với thông tin GSD

### Sửa lỗi
- Fix `update.md` Bước 8: "Ghi thêm" gây duplicate CURRENT_VERSION — đổi thành thay thế idempotent
- Fix `what-next.md` context/rules: ghi rõ dùng Bash cho version check (trước nói "chỉ Read/Glob")
- Xóa `check-update.sh` orphaned (đã thay bằng `sk-check-update.js`)

## [1.1.0] - 18_03_2026
### Thêm mới
- `/sk:update` — Kiểm tra + cập nhật bộ skills từ GitHub, hiện changelog, gợi ý restart
- `/sk:plan --discuss` — Chế độ thảo luận tương tác: liệt kê vấn đề, user chọn thảo luận, options A-E cho từng vấn đề
- `/sk:plan --auto` — Chế độ mặc định, Claude tự quyết định toàn bộ thiết kế
- Kiểm tra phiên bản tự động — hiện thông báo khi có version mới (1 lần/conversation)
- `VERSION` + `CHANGELOG.md` — Hệ thống tracking phiên bản cho bộ skills

### Thay đổi
- `plan.md`: Hỗ trợ 2 chế độ AUTO/DISCUSS, lưu quyết định thiết kế vào PLAN.md section "Quyết định thiết kế"
- `plan.md`: DISCUSS flow hỗ trợ back/cancel/thay đổi quyết định, validate input không hợp lệ
- `write-code.md`: Đọc + tuân thủ section "Quyết định thiết kế" từ PLAN.md (Bước 2 + rules)
- `general.md`: Thêm section kiểm tra phiên bản Skills tự động
- `what-next.md`: Thêm Bước 6 kiểm tra phiên bản (guard chống duplicate check)
- `install.sh`: Hiện version khi cài, liệt kê `/sk:update`, bảo toàn CURRENT_VERSION trong .skconfig

### Sửa lỗi
- Fix XML structure toàn bộ 11 skills: tags balanced, bỏ `</output>` thừa, consistent endings
- Fix template comment `(CHỈ tạo section này nếu chế độ DISCUSS)` nằm trong code block — di chuyển ra ngoài
- Fix `install.sh` ghi đè `.skconfig` mất CURRENT_VERSION — preserve trước khi overwrite
- Fix `update.md` không handle LOCAL > REMOTE — thêm semver comparison đầy đủ (4 nhánh)
- Fix `plan.md` DISCUSS flow thiếu error handling — thêm xử lý input không hợp lệ, back, cancel

## [1.0.0] - 18_03_2026
### Khởi tạo
- Bộ 10 skills: init, scan, roadmap, plan, fetch-doc, write-code, test, fix-bug, what-next, complete-milestone
- Rules: general.md, backend.md (NestJS), frontend.md (NextJS)
- FastCode MCP + Context7 MCP integration
- install.sh + uninstall.sh
