# Phase 50: POC & Fix Phases - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 50-poc-fix-phases
**Areas discussed:** POC pipeline, Gadget Chain, Fix Phases tự động, B8 stub thay thế

---

## POC Pipeline

### POC Timing

| Option | Description | Selected |
|--------|-------------|----------|
| Trong scanner | Mỗi pd-sec-scanner khi phát hiện FLAG/FAIL tự viết POC section ngay trong evidence file | ✓ |
| Agent POC riêng sau dispatch | Spawn thêm agent pd-sec-poc cho mỗi finding FLAG/FAIL | |
| Gộp trong Reporter B6 | Reporter khi tổng hợp báo cáo tự thêm POC section | |

**User's choice:** Trong scanner
**Notes:** Không cần agent riêng, ít token hơn

### POC Output Location

| Option | Description | Selected |
|--------|-------------|----------|
| Trong evidence file | Thêm section ## POC vào evidence_sec_{cat}.md | ✓ |
| File POC riêng | Tạo poc_sec_{cat}.md riêng biệt | |
| Trong SECURITY_REPORT | POC chỉ xuất hiện trong báo cáo tổng hợp | |

**User's choice:** Trong evidence file

### POC Default Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Không — chỉ khi --poc | Tiết kiệm token. Default audit chỉ phát hiện | ✓ |
| Luôn ghi POC cho CRITICAL/HIGH | Findings nghiêm trọng luôn có POC | |

**User's choice:** Không — chỉ khi --poc

### POC Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Mô tả khai thác | Input vector + payload mẫu + bước tái hiện bằng text. Không chạy code thật | ✓ |
| Script tái hiện | Tạo script (curl, node) có thể chạy | |
| Chỉ gợi ý | Mô tả vector tấn công ngắn gọn | |

**User's choice:** Mô tả khai thác

---

## Gadget Chain

### Chain Timing

| Option | Description | Selected |
|--------|-------------|----------|
| Trong Reporter B6 | Reporter đã đọc tất cả evidence — thêm logic cross-reference | ✓ |
| Bước mới B7b | Thêm bước Gadget Analysis riêng sau Analyze | |
| Trong Analyze B7 | Mở rộng B7 hiện tại | |

**User's choice:** Trong Reporter B6

### Chain Logic

| Option | Description | Selected |
|--------|-------------|----------|
| Rule-based patterns | Dựng sẵn chain templates phổ biến trong YAML. Match findings vào template | ✓ |
| AI phân tích | Dùng AI đọc tất cả findings và suy luận chain | |
| Kết hợp | Rule-based trước, AI bổ sung | |

**User's choice:** Rule-based patterns

### Severity Escalation

| Option | Description | Selected |
|--------|-------------|----------|
| Escalate lên 1 bậc | severity tổng hợp = max(individual) + 1 bậc. Cap tại CRITICAL | ✓ |
| Luôn CRITICAL | Mọi gadget chain đều là CRITICAL | |
| Giữ nguyên max | Chain severity = max severity của findings thành phần | |

**User's choice:** Escalate lên 1 bậc

---

## Fix Phases tự động

### Fix Trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Khi user approve | Hiển thị danh sách findings + gợi ý. User chọn thì mới tạo | ✓ |
| Tự động luôn | B8 tự động tạo fix phases vào ROADMAP | |
| Chỉ trong mode tích hợp | Tích hợp tự động, độc lập chỉ gợi ý | |

**User's choice:** Khi user approve

### Fix Priority Order

| Option | Description | Selected |
|--------|-------------|----------|
| Gadget chain ngược | Fix từ gốc chain trước | ✓ |
| Theo severity giảm dần | CRITICAL trước, HIGH sau | |
| Theo file hot spots | File có nhiều finding nhất fix trước | |

**User's choice:** Gadget chain ngược

### SEC-VERIFY

| Option | Description | Selected |
|--------|-------------|----------|
| Re-audit chỉ files đã fix | Dùng session-delta chỉ scan lại files đã sửa | ✓ |
| Full re-audit | Chạy lại --full audit toàn bộ | |
| Chỉ verify findings cụ thể | Check từng finding đã report còn tồn tại không | |

**User's choice:** Re-audit chỉ files đã fix

---

## B8 Stub thay thế

### B8 Wiring

| Option | Description | Selected |
|--------|-------------|----------|
| Module fix-routing.js | Pure function module nhận findings → tạo fix plan | |
| Logic inline trong audit.md | Viết logic trực tiếp trong workflow | |
| Agent riêng pd-sec-fixer | Spawn agent riêng để phân tích findings và tạo fix phases | ✓ |

**User's choice:** Agent riêng pd-sec-fixer
**Notes:** User chọn agent riêng thay vì pure function module — linh hoạt hơn cho phân tích complex

### Fix Template Content

| Option | Description | Selected |
|--------|-------------|----------|
| Evidence + hướng sửa + tiêu chí | Trích dẫn evidence gốc, hướng sửa từ security-rules.yaml, tiêu chí hoàn thành | ✓ |
| Chỉ evidence + link | Trích dẫn evidence, link đến OWASP docs | |
| Full auto-fix instructions | Hướng dẫn chi tiết từng dòng code | |

**User's choice:** Evidence + hướng sửa + tiêu chí

---

## Claude's Discretion

- Chi tiết gadget chain templates trong YAML
- Cách pd-sec-fixer tương tác với ROADMAP.md
- Format section ## POC trong evidence
- Cách SEC-VERIFY so sánh kết quả trước/sau fix

## Deferred Ideas

- --auto-fix: tự sửa code trực tiếp (rejected — AUTOFIX-01)
- Interactive fix mode
- CI/CD integration (Phase 51)
