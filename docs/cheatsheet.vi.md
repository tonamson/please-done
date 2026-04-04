<!-- Translated from docs/cheatsheet.md -->
<!-- Source version: 4.0.0 -->
<!-- Translation date: 2026-04-05 -->

[![English](https://img.shields.io/badge/lang-English-blue.svg)](cheatsheet.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](cheatsheet.vi.md)

# Bảng Tham Khảo Lệnh Please Done

Tham khảo nhanh cho tất cả 16 lệnh Please Done (PD). Mỗi lệnh tuân theo cú pháp `/pd:command` với các cờ (flags) và tham số tùy chọn.

## Cách Đọc Bảng Tham Khảo Này

- Các lệnh được tổ chức theo nhóm (Project, Planning, Execution, Debug, Utility)
- Cột **Cú pháp** hiển thị cú pháp với các cờ tùy chọn `[--flags]` và cờ yêu cầu `--flag value`
- Cột **Ví dụ** hiển thị các ví dụ sử dụng thực tế
- Xem [Chú giải](#legend) ở cuối để hiểu cách viết cờ

## Mục Lục

- [Các Lệnh Project](#project-commands) — 5 lệnh cho vòng đời dự án
- [Các Lệnh Planning](#planning-commands) — 1 lệnh cho lập kế hoạch kỹ thuật
- [Các Lệnh Execution](#execution-commands) — 2 lệnh cho coding và testing
- [Các Lệnh Debug](#debug-commands) — 3 lệnh cho debugging và phân tích
- [Các Lệnh Utility](#utility-commands) — 5 lệnh cho trạng thái và tiện ích
- [Tham Khảo Các Cờ Phổ Biến](#popular-flags-reference) — Tra cứu nhanh các cờ thường dùng
- [Chú giải](#legend) — Giải thích ký hiệu cờ

---

## Các Lệnh Project

Quản lý vòng đời dự án từ khởi tạo đến hoàn thành.

| Lệnh | Cú pháp | Ví dụ |
|------|---------|-------|
| `/pd:onboard` | `/pd:onboard [path]` | `/pd:onboard ./my-project` |
| `/pd:init` | `/pd:init [--force]` | `/pd:init` |
| `/pd:scan` | `/pd:scan [--deep]` | `/pd:scan` |
| `/pd:new-milestone` | `/pd:new-milestone [version]` | `/pd:new-milestone v2.0` |
| `/pd:complete-milestone` | `/pd:complete-milestone` | `/pd:complete-milestone` |

**Ghi chú:**
- `onboard`: Định hướng AI vào codebase mới — tạo `.planning/` với PROJECT.md, SCAN_REPORT.md, CONTEXT.md
- `init`: Khởi tạo cấu trúc thư mục planning (onboard chạy lệnh này nội bộ)
- `scan`: Phân tích cấu trúc codebase và tạo SCAN_REPORT.md
- `new-milestone`: Định nghĩa requirements và tạo ROADMAP.md với các phase
- `complete-milestone`: Hoàn tất milestone và lưu trữ vào `.planning/archive/`

---

## Các Lệnh Planning

Lập kế hoạch kỹ thuật và nghiên cứu trước khi viết code.

| Lệnh | Cú pháp | Ví dụ |
|------|---------|-------|
| `/pd:plan` | `/pd:plan [--auto \| --discuss] [phase]` | `/pd:plan --auto 1.2` |

**Ghi chú:**
- Tạo RESEARCH.md, PLAN.md, và TASKS.md cho phase được chỉ định
- `--auto`: AI tự quyết định cách tiếp cận (mặc định)
- `--discuss`: Thảo luận tương tác nơi người dùng chọn cách tiếp cận
- Định dạng phase: `1.2` = milestone 1, phase 2

---

## Các Lệnh Execution

Viết code và chạy tests theo plan.

| Lệnh | Cú pháp | Ví dụ |
|------|---------|-------|
| `/pd:write-code` | `/pd:write-code [--wave N] [--skip-verify] [--auto \| --parallel]` | `/pd:write-code --wave 2` |
| `/pd:test` | `/pd:test [--coverage] [--watch]` | `/pd:test --coverage` |

**Ghi chú:**
- `write-code`: Thực thi tasks từ TASKS.md — yêu cầu PLAN.md và TASKS.md
  - `--wave N`: Thực thi chỉ wave N của các task song song
  - `--skip-verify`: Bỏ qua các bước verification
  - `--auto`: Thực thi tất cả tasks tuần tự
  - `--parallel`: Thực thi tasks song song sử dụng nhiều agents
- `test`: Chạy test suite với báo cáo coverage tùy chọn
  - `--coverage`: Tạo báo cáo coverage
  - `--watch`: Chế độ watch cho testing liên tục

---

## Các Lệnh Debug

Điều tra bugs, audit chất lượng code, và nghiên cứu giải pháp.

| Lệnh | Cú pháp | Ví dụ |
|------|---------|-------|
| `/pd:fix-bug` | `/pd:fix-bug [description]` | `/pd:fix-bug "login fails with 500 error"` |
| `/pd:audit` | `/pd:audit [--security] [--performance]` | `/pd:audit --security` |
| `/pd:research` | `/pd:research [topic]` | `/pd:research "React Server Components"` |

**Ghi chú:**
- `fix-bug`: Điều tra bugs khoa học với xác minh giả thuyết
  - Tạo BUG_REPORT.md với các bước tái hiện và plan sửa lỗi
- `audit`: Phân tích chất lượng code và bảo mật
  - `--security`: Audit tập trung bảo mật với kiểm tra OWASP
  - `--performance`: Audit tập trung hiệu suất
- `research`: Nghiên cứu sâu về libraries, patterns, hoặc technologies
  - Tạo RESEARCH.md với các phát hiện và đề xuất

---

## Các Lệnh Utility

Kiểm tra trạng thái, xem conventions, fetch docs, và nhận đề xuất.

| Lệnh | Cú pháp | Ví dụ |
|------|---------|-------|
| `/pd:status` | `/pd:status [--auto-refresh] [--refresh-threshold=N]` | `/pd:status --auto-refresh` |
| `/pd:conventions` | `/pd:conventions [language]` | `/pd:conventions typescript` |
| `/pd:fetch-doc` | `/pd:fetch-doc [library]` | `/pd:fetch-doc react` |
| `/pd:update` | `/pd:update [--check]` | `/pd:update` |
| `/pd:what-next` | `/pd:what-next` | `/pd:what-next` |

**Ghi chú:**
- `status`: Hiển thị dashboard dự án (milestone, phase, tasks, bugs)
  - `--auto-refresh`: Bật phát hiện độ cũ
  - `--refresh-threshold=N`: Đặt ngưỡng tùy chỉnh tính bằng phút (mặc định: 10)
- `conventions`: Hiển thị coding conventions cho ngôn ngữ hoặc framework
- `fetch-doc`: Fetch documentation hiện tại cho libraries (sử dụng Context7 MCP)
- `update`: Cập nhật Please Done tooling lên phiên bản mới nhất
  - `--check`: Kiểm tra updates mà không cài đặt
- `what-next`: Đề xuất hành động tiếp theo dựa trên trạng thái dự án

---

## Tham Khảo Các Cờ Phổ Biến

Tra cứu nhanh các cờ hoạt động trên nhiều lệnh.

| Cờ | Mô tả | Lệnh |
|----|-------|------|
| `--auto` | Tự động thực thi không hỏi (AI quyết định) | `plan`, `write-code` |
| `--discuss` | Chế độ tương tác với quyết định của người dùng | `plan` |
| `--wave N` | Thực thi chỉ wave cụ thể | `write-code` |
| `--skip-research` | Bỏ qua phase nghiên cứu | `plan`, `write-code` |
| `--skip-verify` | Bỏ qua các bước verification | `write-code` |
| `--parallel` | Thực thi tasks song song | `write-code` |
| `--resume` | Tiếp tục từ điểm gián đoạn | `write-code` |
| `--auto-refresh` | Bật phát hiện auto-refresh | `status` |
| `--refresh-threshold=N` | Đặt ngưỡng độ cũ (phút) | `status` |
| `--coverage` | Tạo báo cáo coverage | `test` |
| `--watch` | Chế độ watch cho testing liên tục | `test` |
| `--security` | Audit tập trung bảo mật | `audit` |
| `--performance` | Audit tập trung hiệu suất | `audit` |
| `--force` | Thực thi bắt buộc không hỏi | `init` |
| `--deep` | Chế độ phân tích sâu | `scan` |
| `--check` | Chỉ kiểm tra, không áp dụng thay đổi | `update` |

---

## Chú giải

Hiểu ký hiệu cờ được sử dụng trong cột Cú pháp:

- `[--flag]` — **Cờ tùy chọn**: Dấu ngoặc vuông cho biết cờ là tùy chọn
- `--flag value` — **Giá trị yêu cầu**: Cờ yêu cầu giá trị sau nó
- `[value]` — **Tham số tùy chọn**: Tham số có thể bỏ qua
- `\|` — **Hoặc**: Ký tự pipe phân tách các tùy chọn loại trừ lẫn nhau
- `command \| command` — Chọn một trong các tùy chọn (ví dụ: `--auto \| --discuss`)

### Các Mẫu Thường Gặp

```
/pd:plan [--auto \| --discuss] [phase]
         ^^^^^^^^^^^^^^^^^^^^^  ^^^^^^
         Các cờ tùy chọn         Tham số tùy chọn
         (chọn một hoặc không)  (mặc định là phase hiện tại)
```

### Các Kiểu Giá Trị

| Mẫu | Ý nghĩa | Ví dụ |
|-----|---------|-------|
| `[path]` | Đường dẫn thư mục dự án tùy chọn | `/pd:onboard ./my-project` |
| `[version]` | Chuỗi phiên bản (ví dụ: v2.0) | `/pd:new-milestone v2.0` |
| `[phase]` | Định danh phase (ví dụ: 1.2) | `/pd:plan 2.1` |
| `[N]` | Số (ví dụ: số wave) | `/pd:write-code --wave 2` |
| `[description]` | Mô tả văn bản | `/pd:fix-bug "error message"` |
| `[topic]` | Chủ đề nghiên cứu | `/pd:research "React hooks"` |
| `[language]` | Ngôn ngữ lập trình | `/pd:conventions typescript` |
| `[library]` | Tên library hoặc framework | `/pd:fetch-doc react` |

---

## Tổng Kết Số Lệnh

| Nhóm | Các lệnh | Số lượng |
|------|----------|----------|
| Project | onboard, init, scan, new-milestone, complete-milestone | 5 |
| Planning | plan | 1 |
| Execution | write-code, test | 2 |
| Debug | fix-bug, audit, research | 3 |
| Utility | status, conventions, fetch-doc, update, what-next | 5 |
| **Tổng** | | **16** |

---

*Cập nhật lần cuối: 2026-04-05*

*Để xem tài liệu chi tiết cho mỗi lệnh, xem thư mục `commands/pd/` hoặc chạy `/pd:status` để kiểm tra trạng thái dự án.*
