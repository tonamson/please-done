<!-- Translated from docs/skills/index.md -->
<!-- Source version: 4.0.0 -->
<!-- Translation date: 2026-04-05 -->

[![English](https://img.shields.io/badge/lang-English-blue.svg)](index.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](index.vi.md)

# Tham Khảo Skills

Tham khảo nhanh cho 16 skills Please Done với tài liệu súc tích, dễ quét.

Mỗi card bao gồm: **Mục đích** → **Khi nào dùng** → **Điều kiện tiên quyết** → **Lệnh cơ bản** → **Các cờ phổ biến** → **Xem thêm**

---

## Skills Cốt Lõi

Điểm khởi đầu để định hướng AI và thiết lập cấu trúc planning. Dùng các skill này để bắt đầu với một codebase.

| Skill | Description | Quick Command |
|-------|-------------|---------------|
| [onboard](onboard.md) | Định hướng AI vào codebase | `/pd:onboard` |
| [init](init.md) | Khởi tạo cấu trúc planning | `/pd:init` |
| [scan](scan.md) | Phân tích codebase | `/pd:scan` |
| [plan](plan.md) | Tạo phase plans | `/pd:plan --auto 1.1` |

---

## Skills Quản Lý Dự Án

Quản lý vòng đời cho milestones và code execution. Dùng các skill này để lập kế hoạch, thực thi, và hoàn thành công việc.

| Skill | Description | Quick Command |
|-------|-------------|---------------|
| [new-milestone](new-milestone.md) | Tạo milestone | `/pd:new-milestone v2.0` |
| [write-code](write-code.md) | Thực thi tasks | `/pd:write-code` |
| [test](test.md) | Chạy tests | `/pd:test --coverage` |
| [fix-bug](fix-bug.md) | Debug và sửa lỗi | `/pd:fix-bug "issue"` |
| [complete-milestone](complete-milestone.md) | Hoàn tất milestone | `/pd:complete-milestone` |

---

## Skills Gỡ Lỗi

Điều tra và nghiên cứu. Dùng các skill này để hiểu code, tìm bugs, và nghiên cứu công nghệ.

| Skill | Description | Quick Command |
|-------|-------------|---------------|
| [audit](audit.md) | Audit bảo mật/code | `/pd:audit --security` |
| [research](research.md) | Nghiên cứu kỹ thuật | `/pd:research "topic"` |

---

## Skills Tiện Ích

Trạng thái, quy ước, và công cụ bảo trì. Dùng các skill này cho kiểm tra nhanh và bảo trì.

| Skill | Description | Quick Command |
|-------|-------------|---------------|
| [status](status.md) | Trạng thái dự án | `/pd:status` |
| [what-next](what-next.md) | Đề xuất hành động tiếp theo | `/pd:what-next` |
| [conventions](conventions.md) | Các pattern code | `/pd:conventions` |
| [fetch-doc](fetch-doc.md) | Lấy documentation | `/pd:fetch-doc lib` |
| [update](update.md) | Cập nhật tooling | `/pd:update` |

---

## Tài Liệu Đầy Đủ

- [Tham Khảo Lệnh](../CLAUDE.md) — Tài liệu lệnh đầy đủ
- [Bảng Tham Khảo](../cheatsheet.md) — Tham khảo lệnh nhanh
- [Hướng Dẫn Workflow](../workflows/) — Các workflow từng bước
- [Xử Lý Lỗi](../error-troubleshooting.md) — Debug các lỗi thường gặp

---

## Pattern Sử Dụng Phổ Biến

```
# Bắt đầu ở đây — định hướng vào codebase
/pd:onboard

# Kiểm tra trạng thái bất cứ lúc nào — chỉ đọc, an toàn
/pd:status

# Nhận hướng dẫn khi không chắc chắn
/pd:what-next

# Lập kế hoạch và thực thi công việc
/pd:plan --auto 1.1
/pd:write-code

# Xác minh và hoàn thành
/pd:test
/pd:complete-milestone
```

---

## Danh Mục Skills Theo Use Case

**Bắt Đầu:** onboard → init → scan → new-milestone
**Phát Triển Hàng Ngày:** status → what-next → plan → write-code → test
**Gỡ Lỗi:** fix-bug → test → audit
**Nghiên Cứu:** research → fetch-doc → plan
**Bảo Trì:** update → conventions → audit
