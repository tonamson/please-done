<!-- Translated from docs/skills/update.md -->
<!-- Source version: 4.0.0 -->
<!-- Translation date: 2026-04-05 -->

[![English](https://img.shields.io/badge/lang-English-blue.svg)](update.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](update.vi.md)

# Skill: update

## Mục đích

Cập nhật PD/GSD tooling lên phiên bản mới nhất với hiển thị changelog và tùy chọn local patch reapplication cho workflow của bạn.

## Khi nào dùng

- **New features:** Các tính năng mới hoặc bug fixes quan trọng có sẵn trong phiên bản mới hơn
- **Version check:** Tooling lỗi thời được phát hiện và cần cập nhật
- **Pre-milestone:** Trước khi bắt đầu milestone mới để đảm bảo tools mới nhất
- **Maintenance:** Lịch trình bảo trì định kỳ cho các bản cập nhật tooling
- **Bug fixes:** Các bản fixes lỗi quan trọng được phát hành ảnh hưởng đến workflow của bạn

## Điều kiện tiên quyết

- [ ] Git repository với PD tooling
- [ ] Working tree sạch hoặc các thay đổi đã được commit
- [ ] Kết nối internet có sẵn

## Lệnh cơ bản

```
/pd:update
```

**Ví dụ:**
```
/pd:update --check
```

**Chức năng:**
1. Kiểm tra các bản cập nhật có sẵn cho tooling
2. Hiển thị changelog với tất cả các thay đổi
3. Cập nhật các file tooling lên phiên bản mới
4. Reapply local patches (với cờ)
5. Cập nhật các version markers trong files

## Các cờ phổ biến

| Cờ | Mô tả | Ví dụ |
|----|-------|-------|
| `--check` | Chỉ kiểm tra các bản cập nhật | `/pd:update --check` |
| `--force` | Force cập nhật | `/pd:update --force` |
| `--reapply-patches` | Reapply các local patches | `/pd:update --reapply-patches` |

## Xem thêm

- [status](status.vi.md) — Kiểm tra phiên bản hiện tại
- [fetch-doc](fetch-doc.vi.md) — Cập nhật documentation
- [conventions](conventions.vi.md) — Kiểm tra các conventions mới
