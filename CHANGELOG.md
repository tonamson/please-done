# Nhật ký thay đổi Skills

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
