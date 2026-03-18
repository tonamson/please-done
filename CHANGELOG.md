# Nhật ký thay đổi Skills

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
