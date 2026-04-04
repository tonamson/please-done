<!-- Translated from docs/skills/fetch-doc.md -->
<!-- Source version: 4.0.0 -->
<!-- Translation date: 2026-04-05 -->

[![English](https://img.shields.io/badge/lang-English-blue.svg)](fetch-doc.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](fetch-doc.vi.md)

# Skill: fetch-doc

## Mục đích

Tải xuống và cache documentation cho tham khảo offline sử dụng Context7 và các nguồn web có thẩm quyền cho libraries và frameworks.

## Khi nào dùng

- **Offline work:** Đang làm offline hoặc kết nối kém và cần reference docs
- **Library docs:** Cần documentation cụ thể của library cho tham khảo implementation
- **Pre-research:** Nghiên cứu các technology options trước phase planning
- **Documentation building:** Xây dựng references documentation cho team sử dụng
- **Version specific:** Cần documentation phiên bản cụ thể cho compatibility

## Điều kiện tiên quyết

- [ ] Tên library hoặc technology được chỉ định
- [ ] Kết nối internet cho lần fetch ban đầu
- [ ] Không gian lưu trữ cho documentation được cache

## Lệnh cơ bản

```
/pd:fetch-doc <library>
```

**Ví dụ:**
```
/pd:fetch-doc react
```

**Chức năng:**
1. Tìm kiếm Context7 cho library documentation
2. Tải xuống và cache documentation cục bộ
3. Làm cho docs có sẵn offline cho tham khảo trong tương lai
4. Trả về các phần liên quan nhất ngay lập tức

## Các cờ phổ biến

| Cờ | Mô tả | Ví dụ |
|----|-------|-------|
| `--version <v>` | Phiên bản cụ thể | `/pd:fetch-doc react --version 18.2` |
| `--output <dir>` | Thư mục output tùy chỉnh | `/pd:fetch-doc express --output ./docs` |

## Xem thêm

- [research](research.vi.md) — Nghiên cứu các topics sử dụng docs đã fetch
- [plan](plan.vi.md) — Sử dụng docs trong các phase planning
- [update](update.vi.md) — Làm mới documentation đã cache
