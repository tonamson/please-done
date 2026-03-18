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
- **GIỐNG** → thông báo: "Bộ skills đã là phiên bản mới nhất (v[x.x.x])." → **DỪNG**
- **REMOTE mới hơn** (semver so sánh: REMOTE > LOCAL, hoặc LOCAL = unknown) → tiếp tục Bước 4
- **LOCAL mới hơn REMOTE** (LOCAL > REMOTE) → thông báo: "Bạn đang có phiên bản local (v[LOCAL]) mới hơn remote (v[REMOTE]). Không cần cập nhật." → **DỪNG**
- **REMOTE rỗng** (file VERSION không tồn tại trên remote) → thông báo: "Remote không có file VERSION. Kiểm tra repository." → **DỪNG**

## Bước 4: Hiển thị changelog
```bash
# Lấy changelog diff từ remote
cd [SKILLS_DIR] && git show origin/main:CHANGELOG.md 2>/dev/null
```

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
```bash
cd [SKILLS_DIR] && git submodule update --init --recursive 2>/dev/null
```
Nếu FastCode submodule có thay đổi → thông báo: "FastCode cũng đã được cập nhật."

## Bước 8: Cập nhật .skconfig
Ghi thêm `CURRENT_VERSION=[REMOTE_VERSION]` vào `.skconfig` (không xóa SKILLS_DIR/FASTCODE_DIR).

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
- PHẢI gợi ý restart sau khi cập nhật xong
</rules>
