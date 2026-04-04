<!-- Translated from docs/skills/research.md -->
<!-- Source version: 4.0.0 -->
<!-- Translation date: 2026-04-05 -->

[![English](https://img.shields.io/badge/lang-English-blue.svg)](research.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](research.vi.md)

# Skill: research

## Mục đích

Nghiên cứu các libraries, patterns, và technologies trước khi implementation sử dụng các nguồn tài liệu uy tín như Context7.

## Khi nào dùng

- **Unfamiliar tech:** Sử dụng library hoặc framework chưa quen thuộc
- **Approach evaluation:** Đánh giá các approaches hoặc patterns kỹ thuật
- **Current docs:** Cần tài liệu cập nhật hoặc best practices
- **Pre-planning:** Trước khi lập kế hoạch để hiểu các tùy chọn có sẵn
- **Technology comparison:** So sánh các công nghệ tương tự để đưa ra quyết định

## Điều kiện tiên quyết

- [ ] Chủ đề nghiên cứu được xác định rõ ràng
- [ ] Truy cập các nguồn tài liệu
- [ ] Hiểu về use case và requirements
- [ ] Optional: Các câu hỏi cụ thể cần trả lời

## Lệnh cơ bản

```
/pd:research "topic"
```

**Ví dụ:**
```
/pd:research "React Server Components"
```

**Chức năng:**
1. Tìm kiếm các nguồn tài liệu
2. Lấy các best practices hiện tại
3. Tạo RESEARCH.md với các phát hiện
4. Liệt kê các tùy chọn với trade-offs
5. Xác định các potential pitfalls

## Các cờ phổ biến

| Flag | Description | Example |
|------|-------------|---------|
| `--library <name>` | Specific library | `/pd:research --library express` |
| `--pattern` | Design patterns | `/pd:research --pattern "factory"` |
| `--docs` | Fetch official docs | `/pd:research --docs next.js` |

## Xem thêm

- [plan](plan.md) — Sử dụng nghiên cứu trong lập kế hoạch
- [write-code](write-code.md) — Triển khai các phát hiện
- [fetch-doc](fetch-doc.md) — Lấy tài liệu cụ thể
