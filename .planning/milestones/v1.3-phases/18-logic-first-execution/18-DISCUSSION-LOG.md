# Phase 18: Logic-First Execution - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 18-logic-first-execution
**Areas discussed:** Re-validate Logic format, Verification report scope, Workflow integration

---

## Re-validate Logic format

### Q1: Output format

| Option | Description | Selected |
|--------|-------------|----------|
| Bullet paraphrase | Mỗi Truth 1 dòng: "T1: [paraphrase]". ~50-80 tokens | ✓ |
| Table mapping | Bảng 3 cột: Truth ID / Paraphrase / Edge Cases. ~100-150 tokens | |
| Free-form paragraph | 2-3 câu tự nhiên mô tả logic | |

**User's choice:** Bullet paraphrase
**Notes:** Nhẹ, nhanh, dễ scan

### Q2: Visibility

| Option | Description | Selected |
|--------|-------------|----------|
| In ra output | AI in bullet list ra conversation cho user thấy | ✓ |
| Internal chỉ ghi vào PROGRESS.md | AI tự validate, không hiển thị | |

**User's choice:** In ra output
**Notes:** Minh bạch, user có thể phát hiện AI hiểu sai

### Q3: Skip logic

| Option | Description | Selected |
|--------|-------------|----------|
| Luôn chạy | Dù task đơn giản vẫn in ra | ✓ |
| Skip khi effort=simple | Chỉ chạy cho standard/complex | |
| Bạn quyết định | Claude tự quyết định | |

**User's choice:** Luôn chạy
**Notes:** Chi phí nhỏ (~20 tokens cho 1 Truth), không bao giờ bỏ sót

### Q4: Mismatch handling

| Option | Description | Selected |
|--------|-------------|----------|
| Dừng và hỏi | In xong hỏi "Logic đúng chưa? (Y/n)" | ✓ |
| In và tiếp tục | In rồi viết code luôn | |

**User's choice:** Dừng và hỏi
**Notes:** An toàn, tránh code dựa trên logic sai

---

## Verification report scope

### Q1: EXEC-02 scope

| Option | Description | Selected |
|--------|-------------|----------|
| Phân loại bằng chứng | Thêm cột "Loại" (Test/Log/Screenshot/Manual) | ✓ |
| Đã đủ rồi | Template hiện tại đã đáp ứng EXEC-02 | |
| Sửa wording + hướng dẫn | Đổi tên section, thêm hướng dẫn | |

**User's choice:** Phân loại bằng chứng
**Notes:** Giúp rõ ràng bằng chứng là gì, dễ audit

### Q2: Evidence types

| Option | Description | Selected |
|--------|-------------|----------|
| 4 loại cố định | Test, Log, Screenshot, Manual | ✓ |
| Free-text loại | AI tự ghi loại không giới hạn | |
| Bạn quyết định | Claude chọn | |

**User's choice:** 4 loại cố định
**Notes:** Đủ cover hầu hết trường hợp

### Q3: Other sections

| Option | Description | Selected |
|--------|-------------|----------|
| Giữ nguyên | Chỉ sửa bảng Truths, các section khác không đổi | ✓ |
| Sửa tên section | Đổi tên thành "Truths Verified" | |

**User's choice:** Giữ nguyên
**Notes:** Các section Artifacts, Key Links, Anti-pattern đã tốt

---

## Workflow integration

### Q1: Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Sau 1.6, trước Bước 2 | Hiểu WHY trước, rồi mới đọc HOW | ✓ |
| Sau Bước 2, trước Bước 3 | Sau khi đọc context đầy đủ | |
| Sau Bước 3, trước Bước 4 | Ngay trước khi viết code | |

**User's choice:** Sau 1.6, trước Bước 2
**Notes:** Logic: hiểu WHY (business logic) trước, rồi mới đọc HOW (context chi tiết)

### Q2: Parallel behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Mỗi agent chạy riêng | Mỗi agent con in paraphrase Truths của task mình | ✓ |
| Chỉ main agent chạy 1 lần | Main agent in toàn bộ Truths trước khi spawn | |

**User's choice:** Mỗi agent chạy riêng
**Notes:** Đảm bảo mọi task đều được validate dù chạy song song

### Q3: Logging

| Option | Description | Selected |
|--------|-------------|----------|
| Không cần | Chỉ in ra output, không ghi PROGRESS.md | ✓ |
| Ghi vào PROGRESS.md | Lưu bullet list trong PROGRESS.md | |

**User's choice:** Không cần
**Notes:** In ra output là đủ

---

## Claude's Discretion

- Wording chính xác của prompt Bước 1.7
- Format câu hỏi xác nhận "Logic đúng chưa?"
- Cách handle khi user nói "sai"
- Thứ tự cột trong bảng Truths verification-report

## Deferred Ideas

None — discussion stayed within phase scope
