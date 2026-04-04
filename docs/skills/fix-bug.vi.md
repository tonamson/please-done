<!-- Translated from docs/skills/fix-bug.md -->
<!-- Source version: 4.0.0 -->
<!-- Translation date: 2026-04-05 -->

[![English](https://img.shields.io/badge/lang-English-blue.svg)](fix-bug.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](fix-bug.vi.md)

# Skill: fix-bug

## Mục đích

Điều tra và sửa lỗi một cách có hệ thống bằng cách sử dụng kỹ thuật debug có cấu trúc với phân tích nguyên nhân gốc rễ và xác minh bằng test.

## Khi nào dùng

- **Test failures:** Tests đang fail và nguyên nhân gốc rễ chưa được xác định
- **Error reports:** Các thông báo lỗi cụ thể chỉ ra vấn đề
- **Unexpected behavior:** Các vấn đề trong production hoặc development
- **Regressions:** Bugs phát hiện sau các thay đổi gần đây
- **User reports:** Các báo cáo lỗi từ bên ngoài với các triệu chứng

## Điều kiện tiên quyết

- [ ] Mô tả bug hoặc thông báo lỗi
- [ ] Các bước tái hiện (nếu đã biết)
- [ ] Codebase được truy cập
- [ ] Môi trường test khả dụng

## Lệnh cơ bản

```
/pd:fix-bug "description"
```

**Ví dụ:**
```
/pd:fix-bug "login fails with 500 error on OAuth callback"
```

**Chức năng:**
1. Phân tích các triệu chứng và ngữ cảnh lỗi
2. Điều tra nguyên nhân gốc rễ trong code
3. Tạo test case tái hiện
4. Áp dụng fix với xác minh
5. Chạy tests để xác nhận fix
6. Ghi chép fix trong BUG_REPORT.md

## Các cờ phổ biến

| Flag | Description | Example |
|------|-------------|---------|
| `--quick` | Skip deep analysis | `/pd:fix-bug "typo" --quick` |
| `--research` | Include external research | `/pd:fix-bug "issue" --research` |

## Xem thêm

- [test](test.md) — Xác minh fix hoạt động
- [audit](audit.md) — Review code rộng hơn
- [research](research.md) — Nghiên cứu các pattern lỗi
- [Bug Fixing Workflow](../workflows/bug-fixing.md) — Hướng dẫn từng bước
