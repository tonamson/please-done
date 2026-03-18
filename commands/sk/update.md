---
name: sk:update
description: Kiểm tra + cập nhật bộ skills từ GitHub, hiện changelog
---

<objective>
Kiểm tra phiên bản mới từ GitHub, hiển thị changelog, cập nhật bộ skills và gợi ý restart Claude Code.
</objective>

<context>
User input: $ARGUMENTS
- Không có flag hoặc `--check` → chỉ kiểm tra, KHÔNG cập nhật
- `--apply` → kiểm tra + cập nhật luôn

Đọc `.skconfig` (Bash: `cat ~/.claude/commands/sk/.skconfig`) → lấy `SKILLS_DIR`.
Nếu `.skconfig` không tồn tại → **DỪNG**, thông báo: "Chưa cài đặt skills. Chạy `install.sh` trước."
</context>

<process>

## Bước 1: Đọc version hiện tại
- Đọc `.skconfig` → lấy `SKILLS_DIR`
- Đọc `[SKILLS_DIR]/VERSION` → `LOCAL_VERSION`
- Nếu file VERSION không tồn tại → gán `LOCAL_VERSION = unknown`

## Bước 2: Kiểm tra remote
```bash
cd [SKILLS_DIR] && git fetch origin main --quiet 2>/dev/null
```

Nếu `git fetch` thất bại (không có mạng, remote không tồn tại):
- Thông báo: "Không thể kết nối GitHub. Kiểm tra mạng và thử lại."
- **DỪNG**

## Bước 3: So sánh version
```bash
# Lấy remote version
cd [SKILLS_DIR] && git show origin/main:VERSION 2>/dev/null
```

So sánh `LOCAL_VERSION` với `REMOTE_VERSION`:
- **Cách so sánh semver:** Tách version thành mảng số [major, minor, patch], so sánh từng phần. Hoặc dùng bash: `printf '%s\n' "$LOCAL" "$REMOTE" | sort -V | tail -1` để lấy version lớn hơn.
- **GIỐNG** → thông báo: "Bộ skills đã là phiên bản mới nhất (v[x.x.x])." → **DỪNG**
- **REMOTE mới hơn** (semver so sánh: REMOTE > LOCAL, hoặc LOCAL = unknown) → tiếp tục Bước 4
- **LOCAL mới hơn REMOTE** (LOCAL > REMOTE) → thông báo: "Bạn đang có phiên bản local (v[LOCAL]) mới hơn remote (v[REMOTE]). Không cần cập nhật." → **DỪNG**
- **REMOTE rỗng** (file VERSION không tồn tại trên remote) → thông báo: "Remote không có file VERSION. Kiểm tra repository." → **DỪNG**

## Bước 4: Hiển thị changelog
```bash
# Lấy changelog diff từ remote
cd [SKILLS_DIR] && git show origin/main:CHANGELOG.md 2>/dev/null
```

Chỉ hiện CHANGELOG entries MỚI HƠN LOCAL_VERSION: parse CHANGELOG, tìm section header chứa LOCAL_VERSION, hiện từ đầu file đến section đó (không bao gồm).

Hiển thị changelog của version mới:
```
╔══════════════════════════════════════╗
║     CẬP NHẬT BỘ SKILLS              ║
╠══════════════════════════════════════╣
║ Hiện tại: v[LOCAL_VERSION]          ║
║ Mới nhất: v[REMOTE_VERSION]         ║
╠══════════════════════════════════════╣
║ Thay đổi:                           ║
║   [Nội dung changelog version mới]  ║
╚══════════════════════════════════════╝
```

## Bước 5: Phân nhánh theo flag

### Nếu `--apply`:
Thực hiện cập nhật ngay → nhảy sang Bước 6.

### Nếu không có flag hoặc `--check`:
Hỏi user: "Bạn muốn cập nhật ngay? (y/n)"
- **y** → nhảy sang Bước 6
- **n** → **DỪNG**, thông báo: "Bạn có thể chạy `/sk:update --apply` khi sẵn sàng."

## Bước 6: Cập nhật
Kiểm tra branch hiện tại: `git -C [SKILLS_DIR] branch --show-current`. Nếu KHÔNG phải `main` → `git -C [SKILLS_DIR] checkout main` trước khi pull. Nếu checkout fail (có uncommitted changes) → cảnh báo user và **DỪNG**.

Lưu commit hiện tại: `OLD_COMMIT=$(git -C [SKILLS_DIR] rev-parse HEAD)`

```bash
cd [SKILLS_DIR] && git pull origin main
```

Nếu `git pull` thất bại (conflict, dirty working tree):
- Thông báo lỗi cụ thể
- Gợi ý: "Có thể cần chạy thủ công: `cd [SKILLS_DIR] && git stash && git pull origin main && git stash pop`"
- **DỪNG**

Nếu thành công:
- Đọc `VERSION` mới → xác nhận version đã cập nhật

## Bước 7: Kiểm tra submodules
Kiểm tra `.gitmodules` tồn tại trong SKILLS_DIR trước khi chạy submodule update. Nếu không có → bỏ qua bước này.

```bash
cd [SKILLS_DIR] && [ -f .gitmodules ] && git submodule update --init --recursive 2>/dev/null
```
Nếu `.gitmodules` tồn tại VÀ FastCode submodule có thay đổi → thông báo: "FastCode cũng đã được cập nhật."

## Bước 8: Cập nhật .skconfig + xóa cache thông báo
Ghi nhớ `OLD_VERSION` = `LOCAL_VERSION` (trước khi cập nhật) để dùng cho rollback guidance.

Cập nhật `CURRENT_VERSION=[REMOTE_VERSION]` trong `.skconfig`:
- Nếu dòng `CURRENT_VERSION=` đã tồn tại → **thay thế** giá trị (KHÔNG append thêm dòng mới)
- Nếu chưa có → thêm dòng mới
- Giữ nguyên SKILLS_DIR/FASTCODE_DIR

Xóa cache thông báo update trên status line:
```bash
rm -f ~/.claude/cache/sk-update-check.json
```
→ Status line sẽ ngừng hiện `⬆ Skills v[x.x.x]` ngay lập tức.

## Bước 9: Thông báo
```
╔══════════════════════════════════════╗
║     CẬP NHẬT THÀNH CÔNG!            ║
╠══════════════════════════════════════╣
║ v[OLD] → v[NEW]                     ║
╠══════════════════════════════════════╣
║ ⚠ QUAN TRỌNG:                       ║
║ Thoát Claude Code và khởi động lại  ║
║ để load skills phiên bản mới.       ║
║                                      ║
║ Nhấn Ctrl+C → chạy lại `claude`     ║
║                                      ║
║ Nếu gặp vấn đề sau update:          ║
║ cd [SKILLS_DIR] && git checkout      ║
║   [OLD_COMMIT]                       ║
║ (hoặc git reflog để tìm commit      ║
║  trước khi pull)                     ║
╚══════════════════════════════════════╝
```
</process>

<rules>
- KHÔNG sửa code dự án — chỉ cập nhật bộ skills
- KHÔNG push — chỉ pull
- KHÔNG tự restart Claude — chỉ gợi ý user restart
- Nếu git pull conflict → DỪNG, hướng dẫn user giải quyết thủ công
- Nếu không có mạng → DỪNG, thông báo rõ ràng
- `--check` (mặc định): chỉ kiểm tra, hỏi trước khi update
- `--apply`: cập nhật ngay không hỏi
- PHẢI hiển thị changelog trước khi cập nhật
- PHẢI xóa `~/.claude/cache/sk-update-check.json` sau khi cập nhật thành công — để status line ngừng hiện thông báo
- PHẢI gợi ý restart sau khi cập nhật xong
</rules>
