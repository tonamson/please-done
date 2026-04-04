<!-- Translated from docs/workflows/milestone-management.md -->
<!-- Source version: 4.0.0 -->
<!-- Translation date: 2026-04-05 -->

[![English](https://img.shields.io/badge/lang-English-blue.svg)](milestone-management.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](milestone-management.vi.md)

# Hướng Dẫn Workflow: Quản Lý Milestone

> **Độ khó:** 🔴 Nâng cao
> **Thời gian:** Phụ thuộc vào phạm vi milestone
> **Yêu Cầu Tiên Quyết:** Hiểu biết về phases, tasks, và milestones

---

## Yêu Cầu Tiên Quyết

Trước khi bắt đầu, hãy đảm bảo bạn có:

- [ ] Hiểu biết về các phases, tasks, và milestones của PD
- [ ] Dự án đã khởi tạo với `/pd:onboard`
- [ ] Milestone trước đã hoàn thành (nếu có)
- [ ] Yêu cầu đã được xác định cho milestone mới
- [ ] Tất cả các bên liên quan đã thống nhất về phạm vi

---

## Tổng Quan

Hướng dẫn này bao gồm vòng đời milestone hoàn chỉnh: lập kế hoạch phases, thực thi tasks, và hoàn thành milestones. Cuối cùng, bạn sẽ:

1. Lập kế hoạch milestone mới
2. Lập kế hoạch và thực thi nhiều phases
3. Xác minh với testing toàn diện
4. Hoàn thành và lưu trữ milestone
5. Chuẩn bị cho milestone tiếp theo

---

## Hướng Dẫn Từng Bước

### Bước 1: Lập Kế Hoạch Milestone Mới

**Lệnh:**
```
/pd:new-milestone v2.0
```

**Kết Quả Mong Đợi:**
```
Created REQUIREMENTS.md with structure
Updated ROADMAP.md with v2.0 milestone
Phases defined: 5 phases estimated
Dependencies mapped
Current milestone: v2.0

Phase overview:
- Phase 2.1: Core Features (3 tasks)
- Phase 2.2: API Integration (4 tasks)
- Phase 2.3: Testing & QA (2 tasks)
```

**Việc này làm gì:**
Xác định yêu cầu và lộ trình cho milestone mới. Tạo cấu trúc để theo dõi tất cả các phases và phụ thuộc của chúng.

**Các Điểm Quyết Định:**
- Nếu phiên bản đã tồn tại (ví dụ: v2.0 đã được xác định), sử dụng v2.1 hoặc chỉ định phiên bản đầy đủ
- Nếu yêu cầu không rõ ràng, xem xét với các bên liên quan trước khi tiếp tục
- Nếu phạm vi có vẻ quá lớn, cân nhắc chia thành nhiều milestones

---

### Bước 2: Lập Kế Hoạch Phase Đầu Tiên

**Lệnh:**
```
/pd:plan --auto 2.1
```

**Kết Quả Mong Đợi:**
```
Phase 2.1: Core Features
Creating RESEARCH.md...
Creating PLAN.md (3 tasks)...
  - Task 2.1.1: Setup database schema
  - Task 2.1.2: Implement user model
  - Task 2.1.3: Add authentication middleware
Creating TASKS.md...
Plan-check: PASS
Ready to execute with /pd:what-next
```

**Việc này làm gì:**
Tạo kế hoạch chi tiết cho Phase 2.1 của milestone v2.0 với research, tasks, và tiêu chí xác minh.

**Các Điểm Quyết Định:**
- Nếu plan-check BLOCK, đọc fixHint và điều chỉnh phạm vi trong REQUIREMENTS.md
- Nếu plan-check WARN, tiếp tục nhưng lưu ý các vấn đề tiềm ẩn
- Nếu bạn muốn thảo luận các quyết định kiến trúc, sử dụng `/pd:plan --discuss` thay vì `--auto`

---

### Bước 3: Thực Thi Các Task Của Phase

**Lệnh:**
```
/pd:what-next
```

**Kết Quả Mong Đợi:**
```
Phase 2.1: Core Features
Task 2.1.1: Setup database schema — Ready
Recommended: /pd:write-code
```

**Lệnh:**
```
/pd:write-code
```

**Kết Quả Mong Đợi:**
```
Executing Task 2.1.1...
Files modified: 4
Tests: PASS
Committed: a1b2c3d — feat(2.1.1): setup database schema
Task 2.1.1: COMPLETED

Task 2.1.2: Ready to execute
```

**Việc này làm gì:**
Lặp qua tất cả các tasks trong phase, thực thi từng cái một. Chu kỳ tiếp tục: `/pd:what-next` → `/pd:write-code` cho đến khi tất cả các tasks hoàn thành.

**Các Điểm Quyết Định:**
- Nếu task bị chặn, kiểm tra `/pd:status` để tìm blockers
- Nếu lint không đạt liên tục, sử dụng `/pd:fix-bug "lint error"`
- Nếu test không đạt, sử dụng `/pd:fix-bug "test failure"`
- Tiếp tục vòng lặp cho đến khi phase hoàn thành

---

### Bước 4: Xác Minh Hoàn Thành Phase

**Lệnh:**
```
/pd:status
```

**Kết Quả Mong Đợi:**
```
Milestone: v2.0
Phase: 2.1 — Core Features
Tasks: 3/3 completed
Status: Phase complete
Next: Plan Phase 2.2 or complete milestone

All tasks in Phase 2.1 are complete.
Ready to proceed to next phase.
```

**Việc này làm gì:**
Xác nhận tất cả các tasks trong phase đã hoàn thành và hiển thị tiến độ milestone tổng thể.

**Các Điểm Quyết Định:**
- Nếu còn nhiều phases trong milestone, chạy `/pd:plan` cho phase tiếp theo
- Nếu đây là phase cuối cùng, tiến tới testing cuối cùng và hoàn thành
- Nếu tasks chưa hoàn thành, chạy `/pd:what-next` để tiếp tục

---

### Bước 5: Testing Cuối Cùng

**Lệnh:**
```
/pd:test --coverage
```

**Kết Quả Mong Đợi:**
```
Running full test suite...

Test Suites: 28 passed, 28 total
Tests:       156 passed, 0 failed
Snapshots:   12 updated
Coverage:    87% (target: 80%)

No regressions detected
Coverage increased by 5% since milestone start
```

**Việc này làm gì:**
Đảm bảo tất cả các tests đạt trước khi hoàn thành milestone. Báo cáo coverage hiển thị các chỉ số chất lượng.

**Các Điểm Quyết Định:**
- Nếu tests không đạt, sửa với `/pd:fix-bug` trước khi hoàn thành
- Nếu coverage thấp, thêm tests trước khi hoàn thành
- Nếu phát hiện regressions, điều tra nguyên nhân gốc rễ

---

### Bước 6: Hoàn Thành Milestone

**Lệnh:**
```
/pd:complete-milestone
```

**Kết Quả Mong Đợi:**
```
Checking prerequisites...
✓ All tasks: COMPLETED (12/12)
✓ Tests: PASSING (156 passed)
✓ Bugs: 0 unresolved
✓ Verification: Complete

Archiving milestone v2.0...
✓ Created CHANGELOG.md summary
✓ ROADMAP.md updated (status: Done)
✓ State archived to .planning/archive/v2.0/

Milestone v2.0: COMPLETED

Summary:
- 12 tasks completed across 3 phases
- 156 tests passing
- 87% code coverage
- 0 unresolved bugs

Next: Start v2.1 with /pd:new-milestone
```

**Việc này làm gì:**
Hoàn tất milestone, lưu trữ nó, tạo bản tóm tắt CHANGELOG, và chuẩn bị cho milestone tiếp theo.

**Các Điểm Quyết Định:**
- Nếu còn tasks chưa hoàn thành, hoàn thành chúng trước (lệnh sẽ thất bại)
- Nếu còn bugs mở, giải quyết với `/pd:fix-bug` trước
- Nếu verification chưa hoàn thành, chạy `/pd:test` hoặc `/pd:verify-work`

---

## Tổng Kết

Bạn đã thành công:

- ✅ Lập kế hoạch và cấu trúc một milestone với các phases
- ✅ Thực thi tất cả các tasks của phase một cách có hệ thống
- ✅ Xác minh với testing toàn diện
- ✅ Hoàn thành và lưu trữ milestone
- ✅ Tạo CHANGELOG và cập nhật ROADMAP

Vòng đời milestone cung cấp:
- Lập kế hoạch có cấu trúc với phụ thuộc phase
- Thực thi có hệ thống với theo dõi task
- Cổng chất lượng trước khi hoàn thành
- Tạo tài liệu tự động

---

## Các Bước Tiếp Theo

- Xem xét bản tóm tắt CHANGELOG.md cho các bên liên quan
- Bắt đầu milestone tiếp theo với `/pd:new-milestone v2.1`
- Chia sẻ các bài học với team của bạn
- Cập nhật tài liệu dự án với các mẫu mới

---

## Xem Thêm

- [Hướng Dẫn Bắt Đầu](getting-started.md) — Workflow PD cơ bản
- [Hướng Dẫn Sửa Lỗi](bug-fixing.md) — Debug và sửa các vấn đề
- [Xử Lý Lỗi](/docs/error-troubleshooting.md) — Các lỗi thường gặp
- [Bảng Tham Khảo Lệnh](/docs/cheatsheet.md) — Tham khảo nhanh
- [CLAUDE.md](/CLAUDE.md) — Tài liệu lệnh đầy đủ
