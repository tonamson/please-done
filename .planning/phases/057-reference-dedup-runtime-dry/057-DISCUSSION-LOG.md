# Phase 57: Reference Dedup & Runtime DRY - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 057-reference-dedup-runtime-dry
**Areas discussed:** Merge strategy, Reference update scope, Installer utils API, Converter config consistency
**Mode:** --auto (all decisions auto-selected)

---

## Merge Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Nối nội dung, giữ sections riêng | Gộp 2 file thành 1, mỗi phần giữ header riêng biệt | ✓ |
| Rewrite thành 1 doc thống nhất | Viết lại toàn bộ, merge concepts | |
| Giữ 2 file, tạo index | Tạo verification.md làm index trỏ tới 2 file | |

**User's choice:** [auto] Nối nội dung, giữ sections riêng (recommended default)
**Notes:** Đơn giản nhất, không mất thông tin, dễ review.

---

## Reference Update Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Chỉ source files | commands/, workflows/, templates/, bin/lib/ | ✓ |
| Source + snapshots | Bao gồm test/snapshots/ | |
| Tất cả files | Bao gồm cả .planning/ docs | |

**User's choice:** [auto] Chỉ source files (recommended default)
**Notes:** Snapshots tự cập nhật khi chạy converter. Planning docs là historical records.

---

## Installer Utils API

| Option | Description | Selected |
|--------|-------------|----------|
| Trích xuất 3 hàm core | ensureDir, validateGitRoot, copyWithBackup | ✓ |
| Trích xuất tất cả shared logic | Bao gồm cả copy rules, path resolution | |
| Chỉ ensureDir | Minimal extraction | |

**User's choice:** [auto] Trích xuất 3 hàm core (recommended default)
**Notes:** Chỉ extract patterns lặp rõ ràng. Giữ platform-specific logic nguyên vẹn.

---

## Converter Config Consistency

| Option | Description | Selected |
|--------|-------------|----------|
| Review + fix inconsistencies | Claude's discretion cho chi tiết | ✓ |
| Strict standardization | Enforce identical key names across all | |
| Skip review | Chỉ focus reference dedup + installer utils | |

**User's choice:** [auto] Review + fix inconsistencies (recommended default)
**Notes:** Scope nhỏ, planner quyết định chi tiết cụ thể.

---

## Claude's Discretion

- Chi tiết merge format trong verification.md
- Tên hàm bổ sung nếu phát hiện thêm pattern lặp
- Mức độ refactor converter configs
- Test naming cho installer-utils

## Deferred Ideas

None — discussion stayed within phase scope
