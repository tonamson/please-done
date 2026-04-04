<!-- Translated from CLAUDE.md -->
<!-- Source version: 4.0.0 -->
<!-- Translation date: 2026-04-05 -->

[![English](https://img.shields.io/badge/lang-English-blue.svg)](CLAUDE.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](CLAUDE.vi.md)

### Quy ước Ngôn ngữ Dự án
- Sử dụng tiếng Anh xuyên suốt, với ngữ pháp và chính tả chuẩn

---

## Các Quy Trình Làm Việc Thường Gặp

Phần này cung cấp các ví dụ quy trình thực tế cho thấy cách sử dụng các lệnh PD trong các tình huống thực tế. Mỗi quy trình bao gồm ngữ cảnh, chuỗi lệnh, hướng dẫn từng bước, và các điểm quyết định để xử lý các tình huống thường gặp.

### Mục Lục

1. [Quy trình 1: Khởi Tạo Dự Án Mới](#workflow-1-starting-a-new-project)
2. [Quy trình 2: Sửa Lỗi](#workflow-2-fixing-a-bug)
3. [Quy trình 3: Kiểm Tra Tiến Độ Dự Án](#workflow-3-checking-project-progress)
4. [Quy trình 4: Lập Kế Hoạch Tính Năng](#workflow-4-planning-a-feature)
5. [Quy trình 5: Hoàn Thành Milestone](#workflow-5-completing-a-milestone)

---

<a id="workflow-1-starting-a-new-project"></a>
### Quy trình 1: Khởi Tạo Dự Án Mới

**Khi nào dùng:** Bạn đã clone hoặc khởi tạo codebase và muốn thiết lập cấu trúc PD lần đầu.

**Chuỗi lệnh:**
```
/pd:onboard → /pd:new-milestone → /pd:plan → /pd:what-next → /pd:write-code
```

**Các bước:**

| Ngữ cảnh | Lệnh | Kết quả mong đợi | Bước tiếp theo |
|----------|------|------------------|----------------|
| Codebase mới, chưa có cấu trúc PD | `/pd:onboard [path]` | Tạo `.planning/` với PROJECT.md, ROADMAP.md, STATE.md | Tiến tới định nghĩa milestone |
| Cấu trúc PD đã sẵn sàng | `/pd:new-milestone v1.0` | Tạo REQUIREMENTS.md, cập nhật ROADMAP.md | Tiến tới lập kế hoạch |
| Milestone đã được định nghĩa | `/pd:plan --auto 1.1` | Tạo RESEARCH.md, PLAN.md, TASKS.md, plan-check: PASS | Kiểm tra với `/pd:what-next` |
| Plan đã được tạo | `/pd:what-next` | Hiển thị ID task tiếp theo và lệnh | Thực thi với `/pd:write-code` |
| Task đã được gán | `/pd:write-code` | Thay đổi code, task được đánh dấu COMPLETED | Lặp lại từ `/pd:what-next` |

**Điểm quyết định:**
- **Nếu plan-check hiển thị BLOCK:** Đọc fixHint, điều chỉnh requirements, chạy lại `/pd:plan`
- **Nếu write-code bị lỗi lint:** Sửa lỗi và chạy lại cùng lệnh
- **Nếu what-next không hiển thị task nào:** Milestone có thể đã hoàn thành, kiểm tra `/pd:status`

---

<a id="workflow-2-fixing-a-bug"></a>
### Quy trình 2: Sửa Lỗi

**Khi nào dùng:** Bạn gặp lỗi trong production hoặc development và cần điều tra và sửa lỗi một cách có hệ thống.

**Chuỗi lệnh:**
```
/pd:fix-bug "description" → (điều tra) → /pd:test → /pd:what-next
```

**Các bước:**

| Ngữ cảnh | Lệnh | Kết quả mong đợi | Bước tiếp theo |
|----------|------|------------------|----------------|
| Gặp lỗi | `/pd:fix-bug "login fails with 500 error"` | Tạo BUG_REPORT.md với các bước tái hiện | AI tự động điều tra |
| Điều tra hoàn tất | (tự động) Phân tích nguyên nhân gốc | AI xác định nguyên nhân gốc trong code | Xem xét kết quả |
| Tìm thấy nguyên nhân gốc | (tự động) Tạo plan sửa | Xác định các file cần sửa đổi | AI áp dụng bản sửa |
| Bản sửa đã được áp dụng | (tự động) Thay đổi code | Các file đã sửa đổi với bản sửa | Xác minh với tests |
| Hoàn tất sửa lỗi | `/pd:test` | Kết quả test, bao gồm regression test | Nếu pass: xong; Nếu fail: chạy lại fix-bug |

**Điểm quyết định:**
- **Nếu không thể tái hiện lỗi:** Thêm chi tiết vào description, chạy lại `/pd:fix-bug`
- **Nếu bản sửa gây ra vấn đề mới:** Chạy lại `/pd:fix-bug` với các triệu chứng mới
- **Nếu tests fail sau khi sửa:** Bản sửa có thể chưa đầy đủ, chạy lại với ngữ cảnh cập nhật

---

<a id="workflow-3-checking-project-progress"></a>
### Quy trình 3: Kiểm Tra Tiến Độ Dự Án

**Khi nào dùng:** Bạn muốn biết trạng thái hiện tại của dự án mà không cần sửa đổi gì — kiểm tra trạng thái nhanh.

**Chuỗi lệnh:**
```
/pd:status → (tùy chọn) /pd:what-next
```

**Các bước:**

| Ngữ cảnh | Lệnh | Kết quả mong đợi | Bước tiếp theo |
|----------|------|------------------|----------------|
| Cần tổng quan trạng thái | `/pd:status` | Dashboard 8 trường: milestone, phase, tasks, bugs, errors, blockers, last commit | Không (chỉ đọc) |
| Map có thể đã cũ | `/pd:status --auto-refresh` | Dashboard với chỉ báo độ cũ (fresh/aging/stale) | Làm mới nếu stale |
| Muốn task tiếp theo | `/pd:what-next` | ID task cụ thể và hướng dẫn | Thực thi lệnh được đề xuất |

**Kết quả mẫu:**
```
Milestone: v1.1 Documentation Improvements
Phase: 102 — DOC-03 Usage Examples
Plan: 102-PLAN.md
Tasks: 4/5 completed (1 pending)
Bugs: 0 unresolved
Errors: 0 recent
Blockers: None
Last commit: c17fa4e docs: create milestone v11.1 roadmap
Map: fresh
```

**Điểm quyết định:**
- **Nếu map đã cũ:** Chạy `/pd:map-codebase` để làm mới
- **Nếu bugs > 0:** Xem xét `/pd:fix-bug` trước khi tiếp tục
- **Nếu có blockers:** Xử lý blockers trước

---

<a id="workflow-4-planning-a-feature"></a>
### Quy trình 4: Lập Kế Hoạch Tính Năng

**Khi nào dùng:** Bạn có requirements cho tính năng mới và cần thiết kế kỹ thuật trước khi coding.

**Chuỗi lệnh:**
```
(tùy chọn) /pd:research → /pd:plan → /pd:what-next
```

**Các bước:**

| Ngữ cảnh | Lệnh | Kết quả mong đợi | Bước tiếp theo |
|----------|------|------------------|----------------|
| Cần nghiên cứu kỹ thuật | `/pd:research "React Server Components"` | RESEARCH.md với các tùy chọn, patterns, pitfalls | Sử dụng kết quả trong plan |
| Nghiên cứu xong hoặc bỏ qua | `/pd:plan --auto 1.2` | PLAN.md, TASKS.md, báo cáo plan-check | Xem xét plan-check |
| Hoàn tất plan-check | Xem xét output | Trạng thái PASS, WARN, hoặc BLOCK | Nếu BLOCK: sửa và replan |

**Điểm quyết định:**
- **--auto vs --discuss:** Dùng `--discuss` cho các quyết định kiến trúc cần input từ người dùng
- **Nếu plan-check BLOCK:** Đọc fixHint, điều chỉnh scope, chạy lại `/pd:plan`
- **Nếu plan-check WARN:** Tiếp tục nhưng lưu ý warnings có thể gây vấn đề sau

**Kiểm tra chất lượng Plan-Check:**
- CHECK-01: Requirements coverage
- CHECK-02: Task completeness
- CHECK-03: No circular dependencies
- CHECK-04: Truth-task coverage
- ADV-01: Key links handled
- ADV-02: Scope sanity (≤6 tasks)

---

<a id="workflow-5-completing-a-milestone"></a>
### Quy trình 5: Hoàn Thành Milestone

**Khi nào dùng:** Tất cả tasks đã hoàn thành và bạn muốn hoàn tất milestone một cách đúng đắn.

**Chuỗi lệnh:**
```
/pd:test → /pd:complete-milestone → (tùy chọn) /pd:new-milestone
```

**Các bước:**

| Ngữ cảnh | Lệnh | Kết quả mong đợi | Bước tiếp theo |
|----------|------|------------------|----------------|
| Tasks đã hoàn thành | `/pd:test --coverage` | Báo cáo test, metrics coverage | Xác minh tất cả pass |
| Tests đang pass | `/pd:complete-milestone` | ROADMAP.md cập nhật (status: Done), CHANGELOG.md summary | Xem xét hoàn thành |
| Sẵn sàng cho phase tiếp theo | `/pd:new-milestone v2.0` | Cấu trúc milestone mới được tạo | Bắt đầu phase tiếp theo |

**Điều kiện tiên quyết được kiểm tra:**
- Tất cả tasks COMPLETED trong TASKS.md
- verification-report.md tồn tại với kết quả Pass
- Không có bugs chưa giải quyết (BUG_*.md)

**Điểm quyết định:**
- **Nếu tests fail:** Chạy `/pd:fix-bug` trước khi hoàn thành
- **Nếu có open bugs:** Phải giải quyết trước (lệnh sẽ fail)
- **Nếu thiếu verification report:** Chạy `/pd:verify` trước

---

## Các Mẫu Sử Dụng Lệnh

### Các Tổ Hợp Cờ Thường Dùng

| Lệnh | Cờ thường dùng | Trường hợp dùng |
|------|----------------|-----------------|
| `/pd:plan` | `--auto` | AI tự quyết định cách tiếp cận (mặc định) |
| `/pd:plan` | `--discuss` | Tương tác, người dùng chọn cách tiếp cận |
| `/pd:plan` | `--research` | Bao gồm phase nghiên cứu |
| `/pd:write-code` | `--wave 2` | Thực thi chỉ các task wave 2 |
| `/pd:write-code` | `--skip-verify` | Bỏ qua verification (nhanh hơn) |
| `/pd:status` | `--auto-refresh` | Bật phát hiện độ cũ |
| `/pd:status` | `--refresh-threshold=5` | Ngưỡng 5 phút |
| `/pd:test` | `--coverage` | Tạo báo cáo coverage |
| `/pd:test` | `--watch` | Chạy tests ở chế độ watch |
| `/pd:fix-bug` | `--quick` | Bỏ qua phân tích sâu |

### Các Mẫu Phục Hồi Lỗi

| Lỗi | Lệnh phục hồi |
|-----|---------------|
| Plan quá lớn | `/pd:plan --discuss` (chia nhỏ scope) |
| Plan-check BLOCK | Đọc fixHint, điều chỉnh, chạy lại `/pd:plan` |
| Lint fails | Sửa lỗi, chạy lại `/pd:write-code` |
| Tests fail | `/pd:fix-bug "test failure"` |
| MCP not connected | Kiểm tra Docker, chạy lại lệnh |
| Dữ liệu cũ | `/pd:status --auto-refresh` |
| Write-code sai file | `/pd:what-next` để định hướng lại |

### Tham Khảo Nhanh: Các Nhóm Lệnh

| Nhóm | Các lệnh | Mục đích |
|------|----------|----------|
| Project | onboard, init, scan, new-milestone, complete-milestone | Vòng đời dự án |
| Planning | plan, research, fetch-doc, update | Thiết kế và nghiên cứu |
| Execution | write-code, test | Thực thi |
| Debug | fix-bug, audit | Điều tra |
| Utility | status, what-next, conventions | Trạng thái và hướng dẫn |

---

### Tài Liệu Tham Khảo Lệnh: pd:onboard

Skill `pd:onboard` định hướng AI vào codebase không quen thuộc trong một lệnh.

**Cách dùng:**
- `/pd:onboard` — Onboard thư mục hiện tại
- `/pd:onboard /path/to/project` — Onboard dự án cụ thể

**Chức năng:**
1. Chạy `pd:init` nội bộ (tạo CONTEXT.md, framework rules)
2. Phân tích lịch sử git để suy ra tầm nhìn dự án
3. Chạy `pd:scan` nội bộ (tạo SCAN_REPORT.md)
4. Tạo PROJECT.md, ROADMAP.md, CURRENT_MILESTONE.md, STATE.md, REQUIREMENTS.md

**Output:**
- `.planning/CONTEXT.md` — ngữ cảnh tech stack và dự án
- `.planning/PROJECT.md` — tầm nhìn từ phân tích git
- `.planning/ROADMAP.md` — placeholder milestone v1.0
- `.planning/CURRENT_MILESTONE.md` — status: Not started
- `.planning/STATE.md` — trạng thái làm việc ban đầu
- `.planning/REQUIREMENTS.md` — placeholder cho requirements

**Bước tiếp theo:** `/pd:new-milestone` hoặc `/pd:plan`

**Xử lý lỗi:**
- Sử dụng error handler nâng cao cho structured logging
- Ghi log vào `.planning/logs/agent-errors.jsonl`

---

### Tài Liệu Tham Khảo Lệnh: pd:map-codebase

Skill `pd:map-codebase` tạo bản đồ cấu trúc codebase để các agent khác tham khảo.

**Cách dùng:**
- `/pd:map-codebase` — Map codebase hiện tại
- Tự động trigger bởi `/pd:init` khi codebase chưa được map

**Chức năng:**
1. Quét cấu trúc thư mục (lên đến 3 cấp)
2. Phát hiện tech stack từ các file config
3. Xác định các entry points (main, bin, exports)
4. Phân tích dependencies nội bộ (require/import)
5. Tạo các file output trong `.planning/codebase/`:
   - `STRUCTURE.md` — cây thư mục với chú thích
   - `STACK.md` (hoặc `TECH_STACK.md`) — các công nghệ phát hiện
   - `ENTRY_POINTS.md` — các entry points chính
   - `DEPENDENCIES.md` — dependency graph nội bộ
   - `META.json` — metadata mapping (commit SHA, timestamp)

**Phát hiện độ cũ:**
- `META.json` lưu `mapped_at_commit` (40-char SHA)
- `pd:status` kiểm tra độ cũ so với HEAD hiện tại
- Ngưỡng độ cũ: 20 commits
- Các cấp độ: fresh (<20), aging (20-49), stale (50+)
- Đề xuất hiển thị trong trường Map của status dashboard

**Tích hợp với pd:init:**
- Nếu map đang aging/stale, init hỏi: "Codebase map is [level]. Refresh now?"
- Non-blocking: init tiếp tục ngay cả khi người dùng từ chối
- Tùy chọn người dùng: "Yes, refresh now" | "Skip this time"

---

### Tài Liệu Tham Khảo Lệnh: pd:status

Skill `pd:status` hiển thị dashboard trạng thái dự án chỉ đọc.

**Cách dùng:**
- `/pd:status` — Hiển thị trạng thái hiện tại
- `/pd:status --auto-refresh` — Bật phát hiện độ cũ
- `/pd:status --refresh-threshold=5` — Đặt ngưỡng tùy chỉnh (phút)

**Các trường output:**
- Milestone, Phase, Plan
- Trạng thái hoàn thành task
- Số lượng bugs, Lỗi gần đây
- Các vấn đề blockers
- Thông tin last commit
- Chỉ báo độ cũ

**Logic tự động làm mới:**
- Ngưỡng mặc định: 10 phút
- Các cấp độ độ cũ: fresh (<50%), aging (50-100%), stale (>100%)
- Đề xuất làm mới khi idle và dữ liệu cũ
- Tôn trọng các task đang hoạt động (trì hoãn refresh khi có công việc đang tiến hành)

**Phát hiện độ cũ của map:**
- `pd:status` hiển thị độ cũ của codebase map (fresh/aging/stale)
- Map được coi là cũ sau 20 commits kể từ lần map cuối
- Ngưỡng: 20 commits (có thể cấu hình qua code)
- Các cấp độ độ cũ:
  - `fresh`: <20 commits behind
  - `aging`: 20-49 commits behind
  - `stale`: 50+ commits behind
- Đề xuất hiển thị trong trường Map của status dashboard

---

### Xác Thực Schema

Module `bin/lib/schema-validator.js` xác thực các file artifact được tạo bởi skill chain.

**Các hàm:**
- `validateContext(content)` — Xác thực cấu trúc CONTEXT.md
- `validateTasks(content)` — Xác thực cấu trúc TASKS.md
- `validateProgress(content)` — Xác thực cấu trúc PROGRESS.md
- `validateArtifact(type, content)` — Xác thực chung theo loại

**Định dạng trả về:**
- Success: `{ ok: true }`
- Failure: `{ ok: false, error: 'CONTEXT.md: missing required field: Initialized' }`

**Cách dùng:**
```javascript
const { validateContext } = require('./bin/lib/schema-validator');
const result = validateContext(content);
if (!result.ok) {
  console.error(result.error);
}
```

**Các Artifact được xác thực:**
- **CONTEXT.md**: `# Project Context`, `> Initialized:`, `> New project:`, `## Tech Stack`, `## Rules`
- **TASKS.md**: `# Task List`, `> Milestone:`, `## Overview` table, `## Task N:` sections
- **PROGRESS.md**: `# Execution Progress`, `> Updated:`, `> Task:`, `> Stage:`, `> lint_fail_count:`, `> last_lint_error:`
