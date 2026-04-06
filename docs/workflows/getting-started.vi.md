<!-- Translated from docs/workflows/getting-started.md -->
<!-- Source version: 4.0.0 -->
<!-- Translation date: 2026-04-05 -->

[![English](https://img.shields.io/badge/lang-English-blue.svg)](getting-started.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](getting-started.vi.md)

# Hướng Dẫn Workflow: Bắt Đầu

> **Độ khó:** 🟢 Người mới
> **Thời gian:** ~15 phút
> **Yêu Cầu Tiên Quyết:** Node.js 16+, Python 3.12+, Git, Claude Code CLI

---

## Yêu Cầu Tiên Quyết

Trước khi bắt đầu, hãy đảm bảo bạn có:

- [ ] Node.js 16+ đã cài đặt (`node --version`)
- [ ] Python 3.12+ đã cài đặt (`python3 --version`)
- [ ] Git đã cài đặt (`git --version`)
- [ ] Claude Code CLI đã cài đặt và xác thực
- [ ] Một dự án code (mới hoặc hiện có)

---

## Tổng Quan

Hướng dẫn này đưa bạn qua quy trình thiết lập Please Done trên một dự án mới, từ onboarding ban đầu đến hoàn thành task đầu tiên. Cuối cùng, bạn sẽ:

1. Phân tích và onboard codebase của mình
2. Tạo milestone đầu tiên
3. Lập kế hoạch phase đầu tiên
4. Thực thi các task đầu tiên
5. Học cách kiểm tra trạng thái dự án

---

## Hướng Dẫn Từng Bước

### Bước 1: Onboard Dự Án

**Lệnh:**
```
/pd:onboard
```

**Kết Quả Mong Đợi:**
```
Analyzing codebase structure...
Detected tech stack: Node.js, React
Created .planning/PROJECT.md
Created .planning/ROADMAP.md
Created .planning/STATE.md
Created .planning/CONTEXT.md
Onboarding complete! Run /pd:new-milestone next.
```

**Chức năng:**
Phân tích cấu trúc codebase, phát hiện tech stack, và tạo thư mục `.planning/` với các file ngữ cảnh dự án. Đây là nền tảng cho tất cả các workflow PD.

**Các Điểm Quyết Định:**
- Nếu bạn thấy "MCP not connected", kiểm tra FastCode MCP đang chạy trong Docker
- Nếu `.planning/` đã tồn tại, bạn có thể ở sai thư mục — xác minh working directory
- Nếu phát hiện tech stack không chính xác, bạn có thể chỉnh sửa `.planning/CONTEXT.md` sau

---

### Bước 2: Tạo Milestone Đầu Tiên

**Lệnh:**
```
/pd:new-milestone v1.0
```

**Kết Quả Mong Đợi:**
```
Created REQUIREMENTS.md with initial structure
Updated ROADMAP.md with v1.0 milestone
Current milestone set to: v1.0
Phases estimated: 3-5
Next: Run /pd:plan to start Phase 1
```

**Chức năng:**
Định nghĩa milestone đầu tiên (v1.0) và tạo cấu trúc tài liệu requirements. Milestone đại diện cho một đơn vị công việc có thể deliver.

**Các Điểm Quyết Định:**
- Nếu milestone đã tồn tại, sử dụng version khác như v1.1 hoặc v2.0
- Nếu ROADMAP.md bị thiếu, chạy `/pd:onboard` trước
- Nếu requirements chưa rõ ràng, bắt đầu với milestone nhỏ và mở rộng sau

---

### Bước 3: Lập Kế Hoạch Phase Đầu Tiên

**Lệnh:**
```
/pd:plan --auto
```

**Kết Quả Mong Đợi:**
```
Phase 1.1 selected: Setup Foundation
Creating RESEARCH.md...
Creating PLAN.md...
Creating TASKS.md...
Plan-check: PASS
Run /pd:what-next to see your first task
```

**Chức năng:**
Tạo kế hoạch chi tiết cho Phase 1.1 với các tài liệu research, plan, và tasks. Flag `--auto` cho phép AI quyết định cách tiếp cận tốt nhất.

**Các Điểm Quyết Định:**
- Nếu plan-check hiển thị BLOCK, đọc fixHint và điều chỉnh requirements trong REQUIREMENTS.md, sau đó chạy lại
- Nếu bạn muốn thảo luận các lựa chọn tương tác, sử dụng `/pd:plan --discuss` thay thế
- Nếu plan-check hiển thị WARN, tiếp tục nhưng lưu ý cảnh báo có thể gây vấn đề sau

---

### Bước 4: Kiểm Tra Bước Tiếp Theo

**Lệnh:**
```
/pd:what-next
```

**Kết Quả Mong Đợi:**
```
Milestone: v1.0
Phase: 1.1 — Setup Foundation
Task: 1.1.1 — Create project structure
Status: Ready to execute

Recommended command: /pd:write-code
```

**Chức năng:**
Hiển thị tiến độ hiện tại và đề xuất lệnh tiếp theo cần chạy. Đây là hệ thống điều hướng cho PD.

**Các Điểm Quyết Định:**
- Nếu trạng thái hiển thị "Plan incomplete", chạy `/pd:plan` trước
- Nếu không có tasks nào, milestone có thể đã hoàn thành — kiểm tra `/pd:status`
- Nếu bị chặn bởi lỗi, xem [Hướng Dẫn Sửa Lỗi](bug-fixing.md)

---

### Bước 5: Thực Thi Task Đầu Tiên

**Lệnh:**
```
/pd:write-code
```

**Kết Quả Mong Đợi:**
```
Loading PLAN.md...
Executing Task 1.1.1: Create project structure
Files created: 3
Tests passing: 5/5
Committed: a1b2c3d — feat(1.1.1): create project structure
Task 1.1.1: COMPLETED
```

**Chức năng:**
Thực thi task hiện tại từ TASKS.md, chạy tests tự động, và commit thay đổi với message mô tả.

**Các Điểm Quyết Định:**
- Nếu lint fails, sửa lỗi hiển thị và chạy lại `/pd:write-code`
- Nếu tests fail, chạy `/pd:fix-bug "test failure description"` (xem [Hướng Dẫn Sửa Lỗi](bug-fixing.md))
- Nếu task có vẻ chưa hoàn thành, kiểm tra `/pd:status` để biết chi tiết

---

### Bước 6: Tiếp Tục Task Tiếp Theo

**Lệnh:**
```
/pd:what-next
```

**Kết Quả Mong Đợi:**
```
Task 1.1.1: COMPLETED
Task 1.1.2: Create configuration files — Ready
Run /pd:write-code to continue
```

**Chức năng:**
Kiểm tra task tiếp theo có sẵn trong phase hiện tại và hiển thị tiến độ.

**Các Điểm Quyết Định:**
- Nếu tất cả tasks hoàn thành, bạn sẽ thấy message "Phase complete"
- Nếu bị kẹt, chạy `/pd:status` để xem toàn bộ dự án
- Tiếp tục vòng lặp: `/pd:what-next` → `/pd:write-code` cho đến khi phase hoàn thành

---

### Bước 7: Kiểm Tra Trạng Thái Dự Án

**Lệnh:**
```
/pd:status
```

**Kết Quả Mong Đợi:**
```
Milestone: v1.0
Phase: 1.1 — Setup Foundation
Tasks: 2/3 completed (1 pending)
Bugs: 0 unresolved
Errors: 0 recent
Blockers: None
Last commit: a1b2c3d feat(1.1.1): create project structure
Map: fresh
```

**Chức năng:**
Hiển thị dashboard view về trạng thái hiện tại của dự án. Đây là read-only và không bao giờ thay đổi state.

**Các Điểm Quyết Định:**
- Nếu Map hiển thị "stale", chạy `/pd:scan` để refresh
- Nếu có Blockers, giải quyết chúng trước khi tiếp tục
- Nếu Bugs > 0, cân nhắc `/pd:fix-bug` trước khi tiếp tục

---

## Tổng Kết

Chúc mừng! Bạn đã thành công:

- ✅ Thiết lập Please Done trên dự án của bạn
- ✅ Tạo milestone đầu tiên (v1.0)
- ✅ Lập kế hoạch và bắt đầu phase đầu tiên
- ✅ Hoàn thành các task đầu tiên
- ✅ Học cách kiểm tra trạng thái và tiến độ

Bạn hiện đã hiểu workflow PD cốt lõi:
1. `/pd:onboard` — Khởi tạo
2. `/pd:new-milestone` — Định nghĩa milestone
3. `/pd:plan` — Lập kế hoạch phase
4. `/pd:what-next` → `/pd:write-code` — Thực thi tasks
5. `/pd:status` — Kiểm tra tiến độ

---

## Bước Tiếp Theo

- Tiếp tục thực thi các tasks còn lại với `/pd:what-next` và `/pd:write-code`
- Khi phase hoàn thành, lập kế hoạch phase tiếp theo với `/pd:plan`
- Gặp bug? Xem [Hướng Dẫn Sửa Lỗi](bug-fixing.md)
- Sẵn sàng hoàn thành milestone? Xem [Hướng Dẫn Quản Lý Milestone](milestone-management.md)
- Cần refresh lệnh? Xem [Command Cheat Sheet](/docs/cheatsheet.md)

---

## Xem Thêm

- [Hướng Dẫn Sửa Lỗi](bug-fixing.md) — Debug và sửa vấn đề
- [Hướng Dẫn Quản Lý Milestone](milestone-management.md) — Hoàn thành milestones
- [Error Troubleshooting](/docs/error-troubleshooting.md) — Các lỗi thường gặp
- [Command Cheat Sheet](/docs/cheatsheet.md) — Tham khảo nhanh
- [CLAUDE.md](/CLAUDE.md) — Tài liệu lệnh đầy đủ
