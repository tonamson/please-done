<!-- Translated from docs/skills/scan.md -->
<!-- Source version: 4.0.0 -->
<!-- Translation date: 2026-04-05 -->

[![English](https://img.shields.io/badge/lang-English-blue.svg)](scan.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](scan.vi.md)

# Skill: scan

## Mục đích

Phân tích cấu trúc codebase và tạo PROJECT.md với ngữ cảnh kỹ thuật toàn diện bao gồm stack, entry points, và dependencies.

## Khi nào dùng

- **Khám phá codebase:** Hiểu kiến trúc dự án không quen thuộc
- **Trước khi lập kế hoạch:** Thu thập thông tin tech stack trước khi tạo plans
- **Làm mới tài liệu:** Cập nhật PROJECT.md cũ sau các thay đổi lớn
- **Phân tích dependencies:** Hiểu các mối quan hệ module nội bộ
- **Audit tech:** Liệt kê frameworks và libraries đang sử dụng

## Điều kiện tiên quyết

- [ ] Git repository đã được khởi tạo
- [ ] Codebase có source files để phân tích
- [ ] Thư mục `.planning/` tồn tại (chạy `init` trước nếu chưa có)
- [ ] Quyền read access đến các file dự án

## Lệnh cơ bản

```
/pd:scan
```

**Ví dụ:**
```
/pd:scan --deep
```

**Chức năng:**
1. Quét cấu trúc thư mục (độ sâu có thể cấu hình)
2. Phát hiện tech stack từ các package files
3. Xác định entry points (main, bin, exports)
4. Lập bản đồ dependencies nội bộ (require/import)
5. Tạo `PROJECT.md` với các phát hiện
6. Tạo `CONTEXT.md` với project overview

## Các cờ phổ biến

| Flag | Description | Example |
|------|-------------|---------|
| `--deep` | Phân tích sâu bao gồm dependencies | `/pd:scan --deep` |
| `--output <file>` | File output tùy chỉnh | `/pd:scan --output custom.md` |

## Xem thêm

- [onboard](onboard.md) — Định hướng dự án đầy đủ
- [research](research.md) — Nghiên cứu các công nghệ cụ thể được tìm thấy
- [init](init.md) — Khởi tạo cấu trúc planning trước
