---
name: pd:update
description: Kiểm tra + cập nhật bộ skills từ GitHub, hiện changelog
model: haiku
argument-hint: "[--check | --apply]"
allowed-tools:
  - read_file
  - write_file
  - edit_file
  - run_shell_command
  - AskUserQuestion
---
<objective>
Kiểm tra phiên bản mới từ GitHub, hiển thị changelog, cập nhật skills, gợi ý restart.
</objective>
<guards>
DUNG va huong dan user neu bat ky dieu kien nao that bai:
- [ ] `.pdconfig` ton tai -> "Chua cai dat skills. Chay `node bin/install.js` truoc."
- [ ] Ket noi mang kha dung (git fetch thanh cong) -> "Khong the ket noi GitHub. Kiem tra mang."
</guards>
<context>
User input: $ARGUMENTS
- Không có flag/`--check` -> chỉ kiểm tra, KHÔNG cập nhật
- `--apply` -> kiểm tra + cập nhật luôn
`.pdconfig` -> `SKILLS_DIR`
(Claude Code: `~/.gemini/commands/pd/.pdconfig` -- nền tảng khác: tự chuyển đổi)
</context>
<execution_context>
Khong co -- skill nay xu ly truc tiep, khong dung workflow rieng.
</execution_context>
<process>
## Buoc 1: Doc version hien tai
`.pdconfig` -> `SKILLS_DIR` -> `[SKILLS_DIR]/VERSION` -> `LOCAL_VERSION`
VERSION không tồn tại -> `LOCAL_VERSION = unknown`
## Buoc 2: Kiem tra remote
```bash
cd [SKILLS_DIR] && git fetch origin main --quiet 2>/dev/null
```
Thất bại -> DỪNG: "Không thể kết nối GitHub."
## Buoc 3: So sanh version
```bash
cd [SKILLS_DIR] && git show origin/main:VERSION 2>/dev/null
```
| So sanh | Hanh dong |
|---------|-----------|
| GIỐNG | "Đã là phiên bản mới nhất (v[x.x.x])." -> DỪNG |
| REMOTE > LOCAL (hoặc LOCAL=unknown) | Tiếp Bước 4 |
| LOCAL > REMOTE | "Local (v[LOCAL]) mới hơn remote (v[REMOTE])." -> DỪNG |
| REMOTE rỗng | "Remote không có VERSION." -> DỪNG |
Semver: tách [major,minor,patch] so sánh, hoặc `sort -V`.
## Buoc 4: Hien thi changelog
```bash
cd [SKILLS_DIR] && git show origin/main:CHANGELOG.md 2>/dev/null
```
Chỉ hiện entries MỚI HƠN LOCAL_VERSION.
```
+--------------------------------------+
|     CẬP NHẬT BỘ SKILLS              |
| Hiện tại: v[LOCAL] | Mới: v[REMOTE] |
| Thay đổi: [changelog entries]       |
+--------------------------------------+
```
## Buoc 5: Phan nhanh theo flag
- `--apply` -> Bước 6
- Không/`--check` -> hỏi "Cập nhật ngay? (y/n)" -> y: Bước 6 | n: DỪNG, gợi ý `/pd:update --apply`
## Buoc 6: Cap nhat
Kiểm tra branch: `git -C [SKILLS_DIR] branch --show-current` -> không phải `main` -> checkout main (fail vì uncommitted -> DỪNG cảnh báo)
```bash
OLD_COMMIT=$(git -C [SKILLS_DIR] rev-parse HEAD)
cd [SKILLS_DIR] && git pull origin main
```
Pull thất bại -> thông báo lỗi + gợi ý `git stash && git pull && git stash pop` -> DỪNG
Thành công -> đọc VERSION mới xác nhận
## Buoc 7: Submodules
`.gitmodules` tồn tại -> `git submodule update --init --recursive`
FastCode có thay đổi -> "FastCode cũng đã được cập nhật."
## Buoc 8: Cap nhat .pdconfig + xoa cache
- `CURRENT_VERSION=[REMOTE_VERSION]` trong `.pdconfig` (thay thế nếu có, thêm nếu chưa)
- `rm -f ~/.gemini/cache/pd-update-check.json`
## Buoc 9: Thong bao
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
**Tao/Cap nhat:**
- `[SKILLS_DIR]/` -- cap nhat skills tu GitHub
- `.pdconfig` -- cap nhat CURRENT_VERSION
- Xoa `~/.gemini/cache/pd-update-check.json`
**Buoc tiep theo:** Restart Claude Code
**Thanh cong khi:**
- VERSION cap nhat dung
- .pdconfig co CURRENT_VERSION moi
- Cache thong bao da xoa
**Loi thuong gap:**
- Khong co mang -> kiem tra ket noi
- Git conflict -> `git stash && git pull && git stash pop`
- .pdconfig khong ton tai -> chay `node bin/install.js`
</output>
<rules>
- KHONG sua code du an -- chi cap nhat skills
- KHONG push -- chi pull
- KHONG tu restart -- chi goi y user restart
- Git pull conflict -> DUNG, huong dan user thu cong
- Khong co mang -> DUNG, thong bao ro
- `--check` (mac dinh): chi kiem tra, hoi truoc
- `--apply`: cap nhat ngay khong hoi
- PHAI hien changelog truoc khi cap nhat
- PHAI xoa `~/.gemini/cache/pd-update-check.json` sau cap nhat
- PHAI goi y restart sau cap nhat
- Moi output PHAI bang tieng Viet co dau
</rules>
