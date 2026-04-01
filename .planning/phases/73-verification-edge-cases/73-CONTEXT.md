# Phase 73: Verification & Edge Cases - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Xác minh cả hai luồng (standard + standalone) hoạt động đúng end-to-end với đầy đủ edge cases, bằng cách viết smoke tests tự động. Không bao gồm việc fix bug — nếu phát hiện bug thì document và tạo bug report để phase sau xử lý.

</domain>

<decisions>
## Implementation Decisions

### Verification Method

- **D-01:** Viết smoke tests tự động mới — không manual walkthrough. Tests chạy cùng `npm test` suite hiện có.
- **D-02:** Tất cả tests cho standalone flow đặt trong một file duy nhất: `test/smoke-standalone.test.js`. Không tách nhỏ file, không thêm vào file hiện có.

### Edge Case Scope

- **D-03:** Chỉ xác minh đúng 7 success criteria trong ROADMAP.md — không tìm thêm edge cases ngoài phạm vi:
  1. Standard flow: `pd:test 1` với ✅ task hoạt động, `pd:test` không có ✅ task vẫn block
  2. Standalone flow: `pd:test --standalone [path]` tạo report, xử lý no-code error
  3. No CONTEXT.md + có code → auto-detect stack, warn
  4. FastCode/Context7 errors → soft fallback (không block)
  5. `what-next` hiện standalone reports + bugs
  6. `complete-milestone` bỏ qua standalone bugs
  7. Tất cả existing tests vẫn pass (smoke-integrity, snapshots)

### Fallback Behavior (cụ thể hóa D-07 từ Phase 71)

- **D-04:** Khi FastCode lỗi trong standalone mode: **warn + tiếp tục** — hiển thị cảnh báo rồi dùng Grep/Read thay thế. Không chặn flow.
- **D-05:** Khi Context7 lỗi trong standalone mode: **skip hoàn toàn** — Context7 không bắt buộc trong standalone, bỏ qua không cần thông báo.

### Bug Handling

- **D-06:** Nếu smoke tests phát hiện bug trong quá trình viết tests, **chỉ document** — tạo bug report theo format chuẩn, không fix trong phase này. Phase sau sẽ xử lý.

### Agent's Discretion

- Cấu trúc nội bộ của `smoke-standalone.test.js` (describe blocks, thứ tự tests)
- Cách mock FastCode/Context7 errors trong tests (stub vs env var vs temp file)
- Wording cụ thể của warning messages trong assertions

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Primary Target Files

- `workflows/test.md` — Standalone flow Steps S0–S7, routing logic, fallback specs; source of truth cho behavior cần verify
- `.planning/phases/71-core-standalone-flow/71-CONTEXT.md` — D-06 (guard bypass), D-07 (soft fallback), D-11 (report filename), D-13 (Patch version: standalone)
- `.planning/phases/72-system-integration-sync/72-CONTEXT.md` — D-04 (what-next Priority 5.7), D-08/D-09 (complete-milestone bug filtering)

### Supporting References

- `references/conventions.md` — Status icons, version filtering rules
- `.planning/REQUIREMENTS.md` — Acceptance criteria cross-cutting
- `test/smoke-integrity.test.js` — Existing test pattern to follow
- `test/smoke-state-machine.test.js` — Example of filesystem-based tests using temp dirs

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `test/smoke-integrity.test.js`: Pattern cho integrity checks — có thể reuse structure
- `test/smoke-state-machine.test.js`: Dùng `os.tmpdir()` cho temp dirs — pattern phù hợp cho standalone tests cần filesystem
- `workflows/test.md` Steps S0–S7: Toàn bộ standalone logic đã implement ở đây

### Established Patterns

- Test file format: `'use strict'; const { describe, it } = require('node:test'); const assert = require('node:assert/strict');`
- Test descriptions: viết bằng tiếng Việt (theo convention dự án)
- Temp dirs: `os.tmpdir()` cho filesystem fixtures — không tạo fixture files trên disk
- No external test dependencies — chỉ dùng `node:test` và `node:assert/strict`

### Integration Points

- `npm test` → `node --test 'test/*.test.js'` — file mới tự động được pick up
- `smoke-integrity.test.js` đọc thực files từ `commands/`, `workflows/`, `templates/` — pattern này có thể dùng để verify report format

</code_context>

<specifics>
## Specific Ideas

- Test #3 (auto-detect stack): Dùng temp dir với fake `package.json` chứa `@nestjs/core` để test auto-detection
- Test #4 (FastCode fallback): Stub FastCode call để throw error, assert warning xuất hiện và flow tiếp tục với Grep/Read
- Tests nên độc lập, không phụ thuộc nhau — mỗi `it()` setup/teardown riêng

</specifics>

<deferred>
## Deferred Ideas

None — thảo luận bám sát phạm vi phase.

</deferred>

---

*Phase: 73-verification-edge-cases*
*Context gathered: 2026-04-01*
