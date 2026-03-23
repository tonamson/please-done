---
description: Kiểm tra và cập nhật bộ kỹ năng từ GitHub, hiển thị changelog
tools:
  - Read
  - Write
  - Edit
  - Bash
  - AskUserQuestion
---
<objective>
Kiểm tra phiên bản mới từ GitHub, hiển thị changelog, cập nhật bộ kỹ năng và gợi ý khởi động lại.
</objective>
<guards>
Dừng và hướng dẫn người dùng nếu bất kỳ điều kiện nào sau đây thất bại:
- [ ] `.pdconfig` tồn tại -> "Chưa cài đặt bộ kỹ năng. Chạy `node bin/install.js` trước."
- [ ] Kết nối mạng khả dụng (`git fetch` thành công) -> "Không thể kết nối GitHub. Kiểm tra mạng."
</guards>
<context>
Người dùng nhập: $ARGUMENTS
- Không có flag/`--check` -> chỉ kiểm tra, KHÔNG cập nhật
- `--apply` -> kiểm tra + cập nhật luôn
`.pdconfig` -> `SKILLS_DIR`
(Claude Code: `~/.config/opencode/.pdconfig` -- nền tảng khác: tự chuyển đổi)
</context>
<execution_context>
Không có -- skill này xử lý trực tiếp, không dùng workflow riêng.
<!-- Audit 2026-03-23: Intentional -- self-contained skill without workflow (lightweight/utility pattern). See Phase 14 Audit I2. -->
</execution_context>
<process>
## Bước 1: Đọc phiên bản hiện tại
`.pdconfig` -> `SKILLS_DIR` -> `[SKILLS_DIR]/VERSION` -> `LOCAL_VERSION`
VERSION không tồn tại -> `LOCAL_VERSION = unknown`
## Bước 2: Kiểm tra remote
```bash
cd [SKILLS_DIR] && git fetch origin main --quiet 2>/dev/null
```
Thất bại -> DỪNG: "Không thể kết nối GitHub."
## Bước 3: So sánh phiên bản
```bash
cd [SKILLS_DIR] && git show origin/main:VERSION 2>/dev/null
```
| So sánh | Hành động |
|---------|-----------|
| GIỐNG | "Đã là phiên bản mới nhất (v[x.x.x])." -> DỪNG |
| REMOTE > LOCAL (hoặc LOCAL=unknown) | Tiếp Bước 4 |
| LOCAL > REMOTE | "Local (v[LOCAL]) mới hơn remote (v[REMOTE])." -> DỪNG |
| REMOTE rỗng | "Remote không có VERSION." -> DỪNG |
Semver: tách `[major, minor, patch]` để so sánh, hoặc dùng `sort -V`.
## Bước 4: Hiển thị changelog
```bash
cd [SKILLS_DIR] && git show origin/main:CHANGELOG.md 2>/dev/null
```
Chỉ hiển thị các mục MỚI HƠN `LOCAL_VERSION`.
```
+--------------------------------------+
|     CẬP NHẬT BỘ SKILLS              |
| Hiện tại: v[LOCAL] | Mới: v[REMOTE] |
| Thay đổi: [changelog entries]       |
+--------------------------------------+
```
## Bước 5: Phân nhánh theo cờ
- `--apply` -> Bước 6
- Không/`--check` -> hỏi "Cập nhật ngay? (y/n)" -> y: Bước 6 | n: DỪNG, gợi ý `/pd-update --apply`
## Bước 6: Cập nhật
Kiểm tra branch: `git -C [SKILLS_DIR] branch --show-current` -> không phải `main` -> checkout main (fail vì uncommitted -> DỪNG cảnh báo)
```bash
OLD_COMMIT=$(git -C [SKILLS_DIR] rev-parse HEAD)
cd [SKILLS_DIR] && git pull origin main
```
Pull thất bại -> thông báo lỗi + gợi ý `git stash && git pull && git stash pop` -> DỪNG
Thành công -> đọc VERSION mới xác nhận
## Bước 7: Submodule
`.gitmodules` tồn tại -> `git submodule update --init --recursive`
FastCode có thay đổi -> "FastCode cũng đã được cập nhật."
## Bước 8: Cập nhật `.pdconfig` và xóa cache
- `CURRENT_VERSION=[REMOTE_VERSION]` trong `.pdconfig` (thay thế nếu có, thêm nếu chưa)
- `rm -f ~/.config/opencode/cache/pd-update-check.json`
## Bước 9: Thông báo
```
+--------------------------------------+
|     CẬP NHẬT THÀNH CÔNG!            |
| v[OLD] -> v[NEW]                     |
| Đóng + khởi động lại phiên làm việc |
| Ctrl+C -> mở lại trợ lý AI          |
| Rollback: cd [SKILLS_DIR] &&        |
|   git checkout [OLD_COMMIT]          |
+--------------------------------------+
```
</process>
<output>
**Tạo/Cập nhật:**
- `[SKILLS_DIR]/` -- cập nhật bộ kỹ năng từ GitHub
- `.pdconfig` -- cập nhật `CURRENT_VERSION`
- Xóa `~/.config/opencode/cache/pd-update-check.json`
**Bước tiếp theo:** Khởi động lại Claude Code
**Thành công khi:**
- `VERSION` được cập nhật đúng
- `.pdconfig` có `CURRENT_VERSION` mới
- Cache thông báo đã được xóa
**Lỗi thường gặp:**
- Không có mạng -> kiểm tra kết nối
- Git conflict -> `git stash && git pull && git stash pop`
- `.pdconfig` không tồn tại -> chạy `node bin/install.js`
</output>
<rules>
- KHÔNG sửa code dự án, chỉ cập nhật bộ kỹ năng
- KHÔNG push, chỉ pull
- KHÔNG tự khởi động lại, chỉ gợi ý người dùng khởi động lại
- Nếu `git pull` conflict -> DỪNG và hướng dẫn người dùng xử lý thủ công
- Không có mạng -> DỪNG và thông báo rõ
- `--check` (mặc định): chỉ kiểm tra, hỏi trước khi cập nhật
- `--apply`: cập nhật ngay, không hỏi
- PHẢI hiển thị changelog trước khi cập nhật
- PHẢI xóa `~/.config/opencode/cache/pd-update-check.json` sau khi cập nhật
- PHẢI gợi ý khởi động lại sau khi cập nhật
- Mọi output PHẢI bằng tiếng Việt có dấu
</rules>
