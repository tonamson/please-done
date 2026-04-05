# Phase 73: Verification & Edge Cases - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 73-verification-edge-cases
**Areas discussed:** Verification approach, Fallback behavior, Edge case scope, Bug handling

---

## Verification Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Smoke tests tự động mới | Viết file test mới, chạy cùng `npm test`, tái sử dụng được | ✓ |
| Manual checklist walkthrough | Chạy tay từng scenario, nhanh hơn, không cần code mới | |
| Kết hợp | Smoke tests cho logic cốt lõi + manual cho UX flow | |

**User's choice:** Viết smoke tests tự động mới

---

## File Structure

| Option | Description | Selected |
|--------|-------------|----------|
| smoke-standalone.test.js | Một file duy nhất cho toàn bộ standalone flow | ✓ |
| Nhiều file nhỏ | smoke-standalone-flow.test.js + smoke-standalone-integration.test.js | |
| Thêm vào file hiện tại | Mở rộng smoke-integrity.test.js hoặc smoke-state-machine.test.js | |

**User's choice:** smoke-standalone.test.js — một file duy nhất

---

## FastCode Fallback Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Warn + tiếp tục | Hiển thị cảnh báo rồi dùng Grep/Read thay thế | ✓ |
| Silent skip | Bỏ qua hoàn toàn không thông báo | |
| Warn + skip | Cảnh báo nhưng không thử fallback | |

**User's choice:** Warn + tiếp tục (Grep/Read fallback)

---

## Context7 Fallback Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Skip hoàn toàn | Context7 không bắt buộc trong standalone | ✓ |
| Warn + skip | Hiển thị cảnh báo rồi bỏ qua | |
| Warn + dùng training data | Fallback về training data | |

**User's choice:** Skip hoàn toàn

---

## Edge Case Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Chỉ 7 tiêu chí ROADMAP | Scope rõ ràng, không phình | ✓ |
| 7 tiêu chí + thêm khi code | Linh hoạt hơn | |
| Tìm thêm chủ động | Proactive edge case discovery | |

**User's choice:** Chỉ 7 tiêu chí trong ROADMAP.md

---

## Bug Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Fix nhỏ trong phase này | Fix luôn nếu bug nhỏ | |
| Chỉ document | Tạo bug report, không fix trong phase này | ✓ |
| Fix tất cả | Fix dù lớn nhỏ | |

**User's choice:** Chỉ document bug, tạo bug report cho phase khác

---

## Agent's Discretion

- Cấu trúc nội bộ của `smoke-standalone.test.js`
- Cách mock FastCode/Context7 errors
- Wording của warning messages trong assertions

## Deferred Ideas

None
