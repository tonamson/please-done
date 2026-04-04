<!-- Translated from docs/skills/conventions.md -->
<!-- Source version: 4.0.0 -->
<!-- Translation date: 2026-04-05 -->

[![English](https://img.shields.io/badge/lang-English-blue.svg)](conventions.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](conventions.vi.md)

# Skill: conventions

## Mục đích

Hiển thị coding conventions và patterns cho codebase hiện tại để đảm bảo code của bạn khớp với style và patterns hiện có.

## Khi nào dùng

- **Style guide:** Cần hiểu code style trước khi viết code
- **Contributing:** Đóng góp vào codebase không quen thuộc
- **New code:** Viết code mới để khớp với patterns hiện có
- **Code review:** Review code để đảm bảo nhất quán với conventions
- **Team onboarding:** Học project conventions với tư cách thành viên mới
- **Refactoring:** Đảm bảo code đã refactor tuân theo conventions

## Điều kiện tiên quyết

- [ ] Codebase đã được phân tích (chạy scan hoặc onboard trước)
- [ ] Thư mục `.planning/` tồn tại
- [ ] Quyền đọc code hiện có

## Lệnh cơ bản

```
/pd:conventions
```

**Ví dụ:**
```
/pd:conventions --pattern naming
```

**Nội dung được hiển thị:**
1. Naming conventions được sử dụng trong dự án
2. Code structure patterns và tổ chức
3. Các patterns import/require cho dependencies
4. Các patterns xử lý lỗi và approaches
5. Testing conventions và expectations

## Các cờ phổ biến

| Cờ | Mô tả | Ví dụ |
|----|-------|-------|
| `--pattern <type>` | Hiển thị pattern type cụ thể | `/pd:conventions --pattern functions` |
| `--rules` | Hiển thị tất cả các rules | `/pd:conventions --rules` |

## Xem thêm

- [onboard](onboard.vi.md) — Nhận ngữ cảnh dự án đầy đủ
- [scan](scan.vi.md) — Phân tích patterns codebase
- [write-code](write-code.vi.md) — Áp dụng conventions khi viết code
