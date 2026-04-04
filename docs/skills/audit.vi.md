<!-- Translated from docs/skills/audit.md -->
<!-- Source version: 4.0.0 -->
<!-- Translation date: 2026-04-05 -->

[![English](https://img.shields.io/badge/lang-English-blue.svg)](audit.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](audit.vi.md)

# Skill: audit

## Mục đích

Thực hiện audit bảo mật và chất lượng code sử dụng các hướng dẫn OWASP và best practices để xác định các lỗ hổng, anti-patterns, và vấn đề về khả năng bảo trì.

## Khi nào dùng

- **Security review:** Đánh giá bảo mật trước khi release trước khi ship
- **Code quality:** Đánh giá chất lượng code và khả năng bảo trì
- **Compliance:** Đáp ứng các yêu cầu compliance về bảo mật
- **Regular maintenance:** Các chu kỳ audit định kỳ cho các dự án đang chạy
- **Post-incident:** Sau các sự cố bảo mật để xác định các lỗ hổng

## Điều kiện tiên quyết

- [ ] Codebase được truy cập với quyền đọc
- [ ] Thư mục `.planning/` đã được khởi tạo
- [ ] Hiểu về phạm vi audit
- [ ] Optional: Các khu vực cụ thể cần tập trung

## Lệnh cơ bản

```
/pd:audit
```

**Ví dụ:**
```
/pd:audit --security
```

**Chức năng:**
1. Quét code để tìm các lỗ hổng bảo mật
2. Kiểm tra theo các danh mục OWASP Top 10
3. Xác định các vấn đề về chất lượng code
4. Tạo AUDIT_REPORT.md với các phát hiện
5. Ưu tiên các phát hiện theo mức độ nghiêm trọng
6. Đề xuất các bước khắc phục

## Các cờ phổ biến

| Flag | Description | Example |
|------|-------------|---------|
| `--security` | Security-focused audit | `/pd:audit --security` |
| `--quality` | Code quality audit | `/pd:audit --quality` |
| `--owasp` | OWASP Top 10 check | `/pd:audit --owasp` |

## Xem thêm

- [fix-bug](fix-bug.md) — Sửa các phát hiện từ audit
- [test](test.md) — Xác minh fixes pass tests
- [research](research.md) — Nghiên cứu các security patterns
