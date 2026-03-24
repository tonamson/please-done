# Phase 19: Knowledge Correction - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 19-knowledge-correction
**Areas discussed:** Logic bug detection, PLAN.md update scope, Bước 6.5 flow, Logic Changes format

---

## Logic Bug Detection

### Q1: AI phân biệt bug do logic sai vs bug code đơn thuần bằng cách nào?

| Option | Description | Selected |
|--------|-------------|----------|
| AI tự phân loại | Sau khi tìm nguyên nhân (Bước 6b), AI tự đánh giá: nguyên nhân liên quan đến Truth/business logic → trigger 6.5 | ✓ |
| Luôn hỏi user | Sau Bước 6b, luôn hỏi user quyết định | |
| Keyword-based | Grep nguyên nhân trong SESSION file với keywords | |

**User's choice:** AI tự phân loại
**Notes:** Nhẹ, không hỏi thêm

### Q2: Khi AI tự phân loại là 'logic bug', có cần thông báo user trước khi sửa Truth không?

| Option | Description | Selected |
|--------|-------------|----------|
| Thông báo + hỏi | AI nói: 'Bug này do Truth [TX] sai → cần sửa PLAN.md. Đồng ý?' | ✓ |
| Thông báo rồi sửa luôn | Không chờ confirm | |
| Sửa im lặng | Không thông báo | |

**User's choice:** Thông báo + hỏi
**Notes:** An toàn vì PLAN.md là tài liệu quan trọng

### Q3: Nếu user nói 'không phải logic bug', xử lý thế nào?

| Option | Description | Selected |
|--------|-------------|----------|
| Skip 6.5, tiếp tục | Tôn trọng quyết định user, bỏ qua Bước 6.5 | ✓ |
| Hỏi lại với giải thích | AI giải thích lần 2, nếu vẫn 'không' thì skip | |
| Bắt buộc sửa | Bắt buộc chạy 6.5 dù user nói không | |

**User's choice:** Skip 6.5, tiếp tục
**Notes:** Ghi note vào SESSION

---

## PLAN.md Update Scope

### Q1: Khi sửa Truth trong PLAN.md, sửa những cột nào?

| Option | Description | Selected |
|--------|-------------|----------|
| Sửa cột liên quan | Chỉ sửa cột bị sai — AI tự đánh giá | ✓ |
| Sửa toàn bộ 5 cột | Luôn review và cập nhật cả 5 cột | |
| Chỉ sửa Sự thật | Chỉ sửa cột mô tả logic | |

**User's choice:** Sửa cột liên quan
**Notes:** AI tự đánh giá dựa trên nguyên nhân bug

### Q2: Có cho phép thêm Truth MỚI vào PLAN.md?

| Option | Description | Selected |
|--------|-------------|----------|
| Chỉ sửa, không thêm | Logic thiếu = scope lớn, ghi Deferred | ✓ |
| Cho thêm nếu cần | Linh hoạt hơn | |

**User's choice:** Chỉ sửa, không thêm
**Notes:** Giữ scope nhỏ

### Q3: Khi sửa Truth, có cần ghi chú giá trị cũ?

| Option | Description | Selected |
|--------|-------------|----------|
| Ghi vào BUG report | Giá trị cũ trong BUG_*.md, PLAN.md chỉ chứa giá trị mới | ✓ |
| Ghi inline trong PLAN.md | Comment trong PLAN.md | |
| Không cần ghi | Git diff đã track | |

**User's choice:** Ghi vào BUG report
**Notes:** Tách biệt tài liệu thiết kế vs. lịch sử

---

## Bước 6.5 Flow

### Q1: Bước 6.5 nằm ở đâu chính xác?

| Option | Description | Selected |
|--------|-------------|----------|
| Sau 6c, trước 7 | Sau Cổng kiểm tra đạt → Logic Update → Báo cáo | ✓ |
| Sau 6b, trước 6c | Sau đánh giá → Logic Update → Cổng kiểm tra | |
| Sau 7, trước 8 | Viết báo cáo xong rồi mới sửa Truth | |

**User's choice:** Sau 6c, trước 7
**Notes:** Đã xác định nguyên nhân + đủ bằng chứng

### Q2: Commit strategy cho PLAN.md?

| Option | Description | Selected |
|--------|-------------|----------|
| Commit riêng | Commit PLAN.md riêng với prefix [LỖI] | ✓ |
| Gom chung Bước 9 | PLAN.md + code fix gộp 1 commit | |
| Bạn quyết | Claude tự chọn theo phân loại rủi ro | |

**User's choice:** Commit riêng
**Notes:** Tách biệt: sửa tài liệu trước, sửa code sau

### Q3: Không tìm thấy PLAN.md thì sao?

| Option | Description | Selected |
|--------|-------------|----------|
| Skip + ghi note | Skip 6.5, ghi vào BUG report | ✓ |
| Warn user | Hỏi user có tạo Truth doc mới không | |
| BLOCK | Không cho sửa code | |

**User's choice:** Skip + ghi note
**Notes:** Tiếp tục sửa code không bị block

### Q4: Có cần sửa TASKS.md song song không?

| Option | Description | Selected |
|--------|-------------|----------|
| Chỉ sửa PLAN.md | Task vẫn cùng Truth ID, chỉ nội dung thay đổi | ✓ |
| Sửa cả hai | Đảm bảo đồng bộ | |

**User's choice:** Chỉ sửa PLAN.md
**Notes:** Giữ đơn giản

---

## Logic Changes Format

### Q1: Mục 'Logic Changes' dùng ở workflow nào?

| Option | Description | Selected |
|--------|-------------|----------|
| Cả write-code + fix-bug | Ghi lại bất cứ khi nào phát sinh | ✓ |
| Chỉ fix-bug | write-code đã có Bước 1.7 | |
| Chỉ write-code | fix-bug đã có BUG report | |

**User's choice:** Cả write-code + fix-bug
**Notes:** N/A

### Q2: Format của mục 'Logic Changes'?

| Option | Description | Selected |
|--------|-------------|----------|
| Bảng Truth ID + thay đổi | `\| TX \| Thay đổi \| Lý do \|` | ✓ |
| Bullet list đơn giản | `- T1: [thay đổi gì]` | |
| Diff format | `T1: [cũ] → [mới]` | |

**User's choice:** Bảng Truth ID + thay đổi
**Notes:** Gọn, trùng Truths format, dễ trace

### Q3: PROGRESS.md xóa sau commit — Logic Changes persist ở đâu?

| Option | Description | Selected |
|--------|-------------|----------|
| Xóa cùng PROGRESS | BUG report + git diff đã lưu lịch sử | ✓ |
| Copy sang CODE_REPORT | Bảo toàn trong tài liệu phase | |
| File riêng | LOGIC_CHANGES.md trong phase dir | |

**User's choice:** Xóa cùng PROGRESS
**Notes:** Không duplicate

### Q4: Khi không có logic change?

| Option | Description | Selected |
|--------|-------------|----------|
| Bỏ qua section | Không tạo "Logic Changes" | ✓ |
| Section trống | Luôn có section, nội dung "Không có" | |

**User's choice:** Bỏ qua section
**Notes:** Giữ template gọn

---

## Claude's Discretion

- Wording chính xác của prompt Bước 6.5
- Logic phân loại chi tiết (keywords, heuristics)
- Format câu hỏi confirm
- Cách tìm PLAN.md liên quan

## Deferred Ideas

None — discussion stayed within phase scope
