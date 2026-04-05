# Phase 51: Tích hợp Ecosystem - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 51-tich-hop-ecosystem
**Areas discussed:** Security gate behavior, what-next priority logic, State machine wiring, Test strategy

---

## Security gate behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Non-blocking (Recommended) | Cảnh báo rõ ràng + hỏi user muốn tiếp tục hay chạy audit. Không ép buộc — phù hợp với tinh thần 'khuyến nghị'. REQUIREMENTS.md cũng ghi non-blocking. | ✓ |
| Blocking | Bắt buộc phải có SECURITY_REPORT.md. User không thể complete-milestone nếu chưa audit. | |
| Configurable | Mặc định non-blocking. Config security.gate_mode: blocking để chuyển sang blocking. | |

**User's choice:** Non-blocking (Recommended)
**Notes:** Phù hợp với REQUIREMENTS.md mô tả "non-blocking cảnh báo"

### Gate bypass options

| Option | Description | Selected |
|--------|-------------|----------|
| 2 lựa chọn (Recommended) | (1) Chạy pd:audit ngay (2) Bỏ qua, tiếp tục complete-milestone. Đơn giản, rõ ràng. | ✓ |
| 3 lựa chọn | (1) Chạy pd:audit (2) Bỏ qua với ghi chú lý do (3) Hủy. | |

**User's choice:** 2 lựa chọn (Recommended)

---

## what-next priority logic

| Option | Description | Selected |
|--------|-------------|----------|
| Sau tất cả phases ✅ (Recommended) | Chỉ gợi ý pd:audit khi tất cả phases hoàn tất + chưa có SECURITY_REPORT.md. Đúng thời điểm. Như 4_AUDIT_MILESTONE.md mô tả. | ✓ |
| Bất kỳ lúc nào | Gợi ý pd:audit ở priority thấp hơn bất kỳ lúc nào chưa có report. | |
| Kèm điều kiện thêm | Tất cả phases ✅ + milestone có code thay đổi (không gợi ý cho docs-only milestone). | |

**User's choice:** Sau tất cả phases ✅ (Recommended)

---

## State machine wiring

| Option | Description | Selected |
|--------|-------------|----------|
| Nhánh phụ (Recommended) | Giống fix-bug/what-next — chạy bất kỳ lúc nào sau init. Gate trong complete-milestone là enforcement duy nhất. | ✓ |
| Bước bắt buộc | Thêm vào luồng chính giữa 'Tất cả phases hoàn tất' và 'complete-milestone'. | |

**User's choice:** Nhánh phụ (Recommended)

### Wire points

| Option | Description | Selected |
|--------|-------------|----------|
| 3 files (Recommended) | state-machine.md + what-next.md + complete-milestone.md. Đủ phủ hết 3 requirements. | |
| Thêm snapshots | 3 files trên + cập nhật 4 snapshot folders. Đầy đủ cross-platform. | ✓ |

**User's choice:** Thêm snapshots

---

## Test strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Extend smoke tests (Recommended) | Mở rộng test/smoke-state-machine.test.js + test/smoke-integrity.test.js hiện có. | |
| Test suite riêng | Tạo test/smoke-security-wire.test.js mới. Tách biệt nhưng thêm file. | ✓ |

**User's choice:** Test suite riêng

---

## Claude's Discretion

- Format cảnh báo security gate trong complete-milestone
- Vị trí chèn ưu tiên 7.5 trong bảng what-next
- Mô tả pd:audit trong nhánh phụ state machine
- Snapshot sync strategy

## Deferred Ideas

- CI/CD integration — ngoài scope v4.0
- Configurable gate mode — có thể thêm sau
- Auto-run pd:audit — quá intrusive
