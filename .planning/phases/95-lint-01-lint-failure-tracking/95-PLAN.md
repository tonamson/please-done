---
phase: "95"
name: lint-01-lint-failure-tracking
version: "1.0"
---

# Phase 95 Plan: LINT-01 — Lint Failure Tracking

## Goal

Implement `bin/lib/progress-tracker.js` utility library để quản lý lint failure tracking trong PROGRESS.md. Wire utility này vào các skills gặp lint failures.

## Success Criteria

- [ ] SC-01: `bin/lib/progress-tracker.js` utility được tạo với 3 primary functions
- [ ] SC-02: Unit tests với 90%+ coverage cho progress-tracker
- [ ] SC-03: `workflows/write-code.md` Step 5 được cập nhật để gọi `incrementLintFail()`
- [ ] SC-04: `workflows/write-code.md` Step 1.1 được cập nhật để gọi `getLintFailCount()`
- [ ] SC-05: Threshold logic (3 lần) hoạt động đúng — STOP sau 3 failures
- [ ] SC-06: `resetLintFail()` được gọi khi lint thành công
- [ ] SC-07: Graceful degradation khi PROGRESS.md không tồn tại

## Task 1: Create progress-tracker.js Utility Library

**Task ID:** P95-T1  
**Priority:** High  
**Est. Time:** 35 minutes

**Description:**
Tạo `bin/lib/progress-tracker.js` với 3 primary functions để quản lý lint failure tracking.

**Steps:**
1. Tạo file `bin/lib/progress-tracker.js` với structure:
   - `incrementLintFail(errorMsg)` — increment counter, save to PROGRESS.md, return status
   - `getLintFailCount()` — read current count (return 0 if file doesn't exist)
   - `resetLintFail()` — set count to 0, clear last_lint_error
2. Implement helper function `getProgressFilePath()` để tìm PROGRESS.md
3. Implement `parseProgressMd(content)` để parse YAML-like frontmatter
4. Implement `updateProgressMd(content, count, errorMsg)` để update lint_fail_count và last_lint_error
5. Hardcode threshold = 3 trong constant
6. Truncate error message nếu quá dài (max 500 chars)
7. Thêm JSDoc cho tất cả functions
8. Follow pattern từ `refresh-detector.js`: pure functions, defensive programming

**Acceptance Criteria:**
- Cả 3 functions hoạt động đúng
- Trả về status object: `{count, thresholdReached, lastError}`
- Graceful degradation khi file không tồn tại
- Code follow existing patterns trong `bin/lib/`

**Files Created/Modified:**
- `bin/lib/progress-tracker.js` (new)

---

## Task 2: Create Unit Tests for progress-tracker

**Task ID:** P95-T2  
**Priority:** High  
**Est. Time:** 30 minutes

**Description:**
Tạo comprehensive unit tests cho progress-tracker với 90%+ coverage.

**Steps:**
1. Tạo file `test/progress-tracker.test.js`
2. Test cases cho `incrementLintFail()`:
   - Tăng count từ 0 → 1, 1 → 2, 2 → 3
   - Lưu error message đúng
   - Truncate error message quá dài
   - Trả về thresholdReached: false (count < 3), true (count >= 3)
3. Test cases cho `getLintFailCount()`:
   - Đọc đúng count từ PROGRESS.md
   - Return 0 khi file không tồn tại
   - Return 0 khi lint_fail_count không có trong file
4. Test cases cho `resetLintFail()`:
   - Reset count về 0
   - Clear last_lint_error
5. Test edge cases:
   - PROGRESS.md không tồn tại
   - Malformed PROGRESS.md
   - Error message rỗng
   - Concurrent calls (nếu applicable)

**Acceptance Criteria:**
- 90%+ test coverage
- Tất cả tests pass
- Follow pattern từ `test/refresh-detector.test.js`

**Files Created/Modified:**
- `test/progress-tracker.test.js` (new)

---

## Task 3: Update write-code.md Step 5 with Lint Tracking

**Task ID:** P95-T3  
**Priority:** High  
**Est. Time:** 25 minutes

**Description:**
Cập nhật `workflows/write-code.md` Step 5 để gọi `incrementLintFail()` khi lint fail.

**Steps:**
1. Đọc current `workflows/write-code.md` Step 5 (Lint/Build section)
2. Tìm logic "Max 3 times" hiện tại
3. Thay thế bằng:
   - Gọi `incrementLintFail(errorOutput)`
   - Check `thresholdReached` trong kết quả
   - Nếu thresholdReached: STOP và suggest `pd:fix-bug`
   - Nếu chưa: retry lint (existing logic)
4. Thêm import/require cho progress-tracker
5. Update error message để include lint_fail_count
6. Đảm bảo backward compatible với existing behavior

**Acceptance Criteria:**
- Step 5 gọi `incrementLintFail()` khi lint fail
- Threshold logic hoạt động đúng (3 failures)
- Error message rõ ràng với count hiện tại
- Workflow vẫn hoạt động đúng

**Files Created/Modified:**
- `workflows/write-code.md` (modified)

---

## Task 4: Update write-code.md Step 1.1 with Recovery Check

**Task ID:** P95-T4  
**Priority:** High  
**Est. Time:** 20 minutes

**Description:**
Cập nhật `workflows/write-code.md` Step 1.1 để gọi `getLintFailCount()` cho recovery logic.

**Steps:**
1. Đọc current `workflows/write-code.md` Step 1.1 (Task Selection)
2. Tìm logic "Task 🔄 has PROGRESS.md → recover (Step 1.1 Case 1)"
3. Thêm check `getLintFailCount()` khi phát hiện PROGRESS.md tồn tại
4. Nếu count > 0: hiển thị warning "Previous lint failures: N"
5. Nếu count >= 3: suggest `pd:fix-bug` workflow trước khi tiếp tục
6. Update flowchart/recovery logic nếu cần

**Acceptance Criteria:**
- Step 1.1 gọi `getLintFailCount()` khi recover
- Warning hiển thị đúng số lần fail trước đó
- Suggest `pd:fix-bug` khi count >= 3
- Recovery logic hoạt động đúng

**Files Created/Modified:**
- `workflows/write-code.md` (modified)

---

## Task 5: Implement resetLintFail on Successful Lint

**Task ID:** P95-T5  
**Priority:** Medium  
**Est. Time:** 15 minutes

**Description:**
Thêm `resetLintFail()` call khi lint/build thành công.

**Steps:**
1. Tìm vị trí trong `workflows/write-code.md` khi lint/build pass
2. Thêm gọi `resetLintFail()` sau khi lint thành công
3. Đảm bảo được gọi trước khi xóa PROGRESS.md (nếu applicable)
4. Thêm log message optional: "Lint failures reset"

**Acceptance Criteria:**
- `resetLintFail()` được gọi khi lint thành công
- Counter reset về 0
- Workflow tiếp tục bình thường

**Files Created/Modified:**
- `workflows/write-code.md` (modified)

---

## Task 6: Optional — Wire into fix-bug Skill

**Task ID:** P95-T6  
**Priority:** Low  
**Est. Time:** 15 minutes

**Description:**
Optionally wire progress-tracker vào `fix-bug` skill để reset lint count khi bug fix resolves lint issues.

**Steps:**
1. Đọc `commands/pd/fix-bug.md` hoặc `workflows/fix-bug.md`
2. Tìm vị trí sau khi bug được fix thành công
3. Thêm gọi `resetLintFail()` nếu fix liên quan đến lint errors
4. Hoặc thêm flag để force reset: `pd:fix-bug --reset-lint`

**Acceptance Criteria:**
- Optional integration hoạt động (nếu implemented)
- Không break existing fix-bug workflow

**Files Created/Modified:**
- `commands/pd/fix-bug.md` hoặc `workflows/fix-bug.md` (modified if applicable)

---

## Task 7: Integration Testing

**Task ID:** P95-T7  
**Priority:** High  
**Est. Time:** 25 minutes

**Description:**
Tạo integration tests cho lint failure tracking workflow.

**Steps:**
1. Tạo `test/lint-failure-tracking.integration.test.js`
2. Test scenarios:
   - First lint failure: count = 1, thresholdReached = false
   - Second lint failure: count = 2, thresholdReached = false
   - Third lint failure: count = 3, thresholdReached = true, suggest fix-bug
   - Successful lint: count reset về 0
   - Recovery: đọc đúng count từ PROGRESS.md
3. Mock file system để test PROGRESS.md operations
4. Test với actual workflow files (nếu applicable)

**Acceptance Criteria:**
- Integration tests pass
- Cover end-to-end lint failure flow
- 85%+ coverage

**Files Created/Modified:**
- `test/lint-failure-tracking.integration.test.js` (new)

---

## Task 8: Smoke Test and Validation

**Task ID:** P95-T8  
**Priority:** High  
**Est. Time:** 20 minutes

**Description:**
Final validation của lint failure tracking implementation.

**Steps:**
1. Chạy full test suite: `npm test`
2. Test `incrementLintFail()` trực tiếp với mock PROGRESS.md
3. Test `getLintFailCount()` với file không tồn tại
4. Test `resetLintFail()` hoạt động đúng
5. Verify threshold logic (3 failures = stop)
6. Check graceful degradation
7. Run regression tests
8. Update `.planning/STATE.md` nếu cần

**Acceptance Criteria:**
- All tests pass (target: 1300+ tests)
- Lint tracking hoạt động đúng
- Zero regressions
- Code follow existing patterns

**Files Created/Modified:**
- None (validation only)

---

## Execution Order

```
P95-T1 → P95-T2 → P95-T3 → P95-T4 → P95-T5 → P95-T6 → P95-T7 → P95-T8
   │        │        │        │        │        │        │        │
   └────────┴────────┴────────┴────────┴────────┴────────┴────────┘
                              Sequential
```

Tất cả tasks là sequential do dependencies:
- T1 (utility) cần trước T2 (tests)
- T1 cần trước T3, T4, T5 (integration)
- T3, T4, T5 cần trước T7 (integration tests)

## Task Summary

| ID | Task | Priority | Est. Time | Dependencies |
|----|------|----------|-----------|--------------|
| P95-T1 | Create progress-tracker.js | High | 35m | None |
| P95-T2 | Unit tests | High | 30m | T1 |
| P95-T3 | Update Step 5 | High | 25m | T1 |
| P95-T4 | Update Step 1.1 | High | 20m | T1 |
| P95-T5 | Reset on success | Medium | 15m | T1 |
| P95-T6 | Wire fix-bug (optional) | Low | 15m | T1 |
| P95-T7 | Integration tests | High | 25m | T1-T5 |
| P95-T8 | Smoke test | High | 20m | All |

**Total Est. Time:** ~3 hours  
**Total Tasks:** 8

## API Reference

### incrementLintFail(errorMsg)
```javascript
// Returns: { count, thresholdReached, lastError }
const result = incrementLintFail("ESLint error: unexpected token");
// result: { count: 1, thresholdReached: false, lastError: "ESLint error..." }
```

### getLintFailCount()
```javascript
// Returns: number (0-3)
const count = getLintFailCount();
// count: 0 (if no PROGRESS.md or lint_fail_count not set)
```

### resetLintFail()
```javascript
// Returns: boolean (true if success)
const success = resetLintFail();
```

## Threshold Behavior

| Count | thresholdReached | Behavior |
|-------|------------------|----------|
| 0 | false | Normal operation |
| 1 | false | Retry lint, warning displayed |
| 2 | false | Retry lint, warning displayed |
| 3 | true | STOP, suggest `pd:fix-bug` |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing lint flow | Low | High | Integration tests |
| PROGRESS.md parse errors | Low | Medium | Graceful degradation |
| Threshold miscount | Low | High | Unit tests for boundary |
| Race condition (concurrent) | Very Low | Low | Sync file operations |
