# Phase 20: Logic Audit - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 20-logic-audit
**Areas discussed:** CHECK-05 vs CHECK-04, Severity conflict, Technical Debt reporting

---

## CHECK-05 vs CHECK-04

| Option | Description | Selected |
|--------|-------------|----------|
| Refine CHECK-04 | Tách CHECK-04 thành CHECK-04 + CHECK-05. CHECK-04 giữ Direction 1. CHECK-05 làm Direction 2 với severity khác + orphan reporting | ✓ |
| Replace CHECK-04 | CHECK-05 thay thế hoàn toàn CHECK-04 | |
| Standalone bổ sung | Giữ CHECK-04 nguyên, CHECK-05 kiểm tra ở mức khác | |

**User's choice:** Refine CHECK-04 (Recommended)
**Notes:** Tách 1 check thành 2 checks riêng biệt, mỗi check 1 direction

---

## Severity conflict

| Option | Description | Selected |
|--------|-------------|----------|
| WARN (theo AUDIT-01) | Task thiếu Truths = warning, không block | |
| Giữ BLOCK (theo D-05/D-06) | Nhất quán Phase 17, mọi task phải có Truth | |
| Configurable | Mặc định WARN, nâng BLOCK qua config | ✓ |

**User's choice:** Configurable (Recommended)
**Notes:** Linh hoạt — dự án strict dùng BLOCK, dự án đang chuyển đổi dùng WARN

---

## Technical Debt reporting

| Option | Description | Selected |
|--------|-------------|----------|
| PASS table chỉ | Report trong PASS table, nhất quán với checks khác | ✓ |
| PASS table + summary count | PASS table + dòng tổng kết coverage percentage | |
| Separate report file | Tạo TECH-DEBT.md riêng | |

**User's choice:** PASS table chỉ (Recommended)
**Notes:** Không thêm artifact mới, giữ đơn giản

---

## Claude's Discretion

- Config mechanism cho severity override
- Test structure và refactoring strategy
- Dynamic PASS table name mapping

## Deferred Ideas

None — discussion stayed within phase scope
