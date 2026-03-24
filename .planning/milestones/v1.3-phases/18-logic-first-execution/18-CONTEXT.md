# Phase 18: Logic-First Execution - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Đảm bảo AI luôn validate lại business logic trước khi viết code (Bước 1.7 trong write-code workflow), và báo cáo verification theo cấu trúc Truths với bằng chứng phân loại rõ ràng (Test/Log/Screenshot/Manual).

Requirements: EXEC-01, EXEC-02

</domain>

<decisions>
## Implementation Decisions

### Re-validate Logic — Bước 1.7 (EXEC-01)
- **D-01:** Output dạng **bullet paraphrase** — mỗi Truth 1 dòng: `- T1: [paraphrase ngắn gọn]`. Nhẹ ~50-80 tokens.
- **D-02:** **In ra output** cho user thấy (không phải internal reasoning). User có thể phát hiện AI hiểu sai logic.
- **D-03:** **Luôn chạy** — không skip dù task simple hay chỉ có 1 Truth. Chi phí nhỏ (~20 tokens cho 1 Truth) nhưng đảm bảo không bao giờ bỏ sót.
- **D-04:** Sau khi in bullet, **dừng và hỏi** "Logic đúng chưa? (Y/n)". Nếu user nói sai → đọc lại PLAN.md, sửa và hỏi lại. An toàn, tránh code dựa trên logic sai.
- **D-05:** Đặt **sau Bước 1.6, trước Bước 2** — hiểu WHY (business logic) trước, rồi mới đọc HOW (context chi tiết).
- **D-06:** Khi chạy **parallel (--parallel)**, mỗi agent con chạy Bước 1.7 riêng cho task của mình. Đảm bảo mọi task đều được validate.
- **D-07:** **Không ghi vào PROGRESS.md** — chỉ in ra output là đủ.

### Verification Report — Cột Loại bằng chứng (EXEC-02)
- **D-08:** Thêm cột **"Loại"** vào bảng Truths trong verification-report template. 4 loại cố định: **Test** (unit/integration test pass), **Log** (console/API output), **Screenshot** (chụp màn hình), **Manual** (cần user kiểm tra).
- **D-09:** Các section khác (Artifacts, Key Links, Anti-pattern) **giữ nguyên** — chỉ sửa bảng Truths.

### Claude's Discretion
- Wording chính xác của prompt Bước 1.7 trong write-code.md
- Format câu hỏi xác nhận "Logic đúng chưa?" (Y/n hay AskUserQuestion)
- Cách handle khi user nói "sai" — cụ thể đọc lại phần nào của PLAN.md
- Thứ tự cột trong bảng Truths verification-report (miễn có cột Loại)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Workflow
- `workflows/write-code.md` — Workflow chính cần thêm Bước 1.7. Hiện có Bước 1.1 → 1.6 → Bước 2 → ... → Bước 10
- `workflows/write-code.md` §Bước 1.5 — Parallel execution flow, agent con cần chạy 1.7 riêng

### Templates
- `templates/verification-report.md` — Template cần thêm cột "Loại" vào bảng Truths
- `templates/plan.md` — Bảng Truths 5 cột (nguồn dữ liệu cho Bước 1.7 đọc)
- `templates/tasks.md` — Trường `Truths:` trong task metadata

### Plan Checker
- `bin/lib/plan-checker.js` — parseTruthsV11() line 125, reference cho format Truths

### Requirements
- `.planning/REQUIREMENTS.md` — EXEC-01, EXEC-02 definitions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `parseTruthsV11()` in `bin/lib/plan-checker.js:125` — Parser đã handle 3-col và 5-col Truths, có thể dùng làm reference cho format
- `parseTaskDetailBlocksV11()` in `bin/lib/plan-checker.js:142` — Đã parse `> Truths:` field, Bước 1.7 đọc từ đây
- `templates/verification-report.md` — Template đã có cấu trúc Truths-based, chỉ cần thêm cột

### Established Patterns
- Workflow steps đánh số theo pattern: Bước X.Y — 1.7 khớp với convention hiện tại
- Confirmation pattern: write-code đã có "Xác nhận chạy? (Y/n)" ở Bước 1.5, có thể tái sử dụng pattern cho 1.7
- Pure function pattern: plan-checker functions nhận content, không đọc file

### Integration Points
- `workflows/write-code.md` Bước 1.6 → **[NEW: Bước 1.7]** → Bước 2: Insertion point rõ ràng
- `templates/verification-report.md` bảng Truths: thêm 1 cột giữa Trạng thái và Bằng chứng
- Parallel flow (Bước 1.5): agent con prompt cần include instruction cho Bước 1.7

</code_context>

<specifics>
## Specific Ideas

Format mong muốn cho Bước 1.7 output:
```
**Logic cần đảm bảo (Task 1):**
- T1: User đăng nhập email+password → JWT hợp lệ
- T2: Sai password 5 lần → khóa 15 phút
- T3: Token hết hạn → redirect login

Logic đúng chưa? (Y/n)
```

Format mong muốn cho bảng Truths trong verification-report:
```
| # | Sự thật | Trạng thái | Loại | Bằng chứng |
|---|---------|-----------|------|----------|
| T1 | [mô tả] | ✅ ĐẠT | Test | test/auth.test pass |
| T2 | [mô tả] | ✅ ĐẠT | Log | POST /api → 200 |
| T3 | [mô tả] | ⚠️ CẦN KIỂM TRA | Manual | Cần kiểm tra UI |
```

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 18-logic-first-execution*
*Context gathered: 2026-03-24*
