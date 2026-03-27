---
phase: 057-reference-dedup-runtime-dry
verified: 2026-03-27T00:00:00Z
status: gaps_found
score: 3/6 success criteria verified
gaps:
  - truth: "Zero broken @references/ trong bất kỳ file command/workflow"
    status: failed
    reason: "bin/lib/plan-checker.js dòng 10 vẫn còn JSDoc trỏ tới references/plan-checker.md"
    artifacts:
      - path: "bin/lib/plan-checker.js"
        issue: "Dòng 10: '* Rules spec: references/plan-checker.md' — chưa đổi sang references/verification.md"
    missing:
      - "Sửa bin/lib/plan-checker.js dòng 10: đổi 'references/plan-checker.md' → 'references/verification.md'"

  - truth: "4 platform installers dùng shared utils (ensureDir thay thế toàn bộ mkdirSync recursive)"
    status: partial
    reason: "Cả 4 installers đã import installer-utils, nhưng codex.js (3 lần), copilot.js (3 lần), gemini.js (2 lần) vẫn còn gọi fs.mkdirSync(..., { recursive: true }) thay vì ensureDir()"
    artifacts:
      - path: "bin/lib/installers/codex.js"
        issue: "Còn 3 lần gọi fs.mkdirSync(..., { recursive: true }) tại các dòng 35, 48, 59 — chưa thay bằng ensureDir()"
      - path: "bin/lib/installers/copilot.js"
        issue: "Còn 3 lần gọi fs.mkdirSync(..., { recursive: true }) tại các dòng 41, 62, 84 — chưa thay bằng ensureDir()"
      - path: "bin/lib/installers/gemini.js"
        issue: "Còn 2 lần gọi fs.mkdirSync(..., { recursive: true }) tại các dòng 51, 70 — chưa thay bằng ensureDir()"
    missing:
      - "codex.js dòng 35, 48, 59: thay fs.mkdirSync(X, { recursive: true }) → ensureDir(X)"
      - "copilot.js dòng 41, 62, 84: thay fs.mkdirSync(X, { recursive: true }) → ensureDir(X)"
      - "gemini.js dòng 51, 70: thay fs.mkdirSync(X, { recursive: true }) → ensureDir(X)"

  - truth: "Tất cả smoke tests + snapshot tests pass"
    status: failed
    reason: "smoke-snapshot.test.js fail 16/56 tests — snapshots chưa được regenerate sau khi đổi verification-patterns.md → verification.md"
    artifacts:
      - path: "test/snapshots/codex/write-code.md"
        issue: "Vẫn chứa references/verification-patterns.md (dòng 61, 182, 312)"
      - path: "test/snapshots/codex/complete-milestone.md"
        issue: "Vẫn chứa references/verification-patterns.md (dòng 49, 65, 101)"
      - path: "test/snapshots/codex/plan.md"
        issue: "Vẫn chứa references/verification-patterns.md (dòng 204)"
    missing:
      - "Chạy node test/generate-snapshots.js để regenerate tất cả snapshots sau khi sửa plan-checker.js và installers"
      - "Sau khi regenerate, chạy node --test test/smoke-snapshot.test.js để xác nhận pass"
---

# Phase 57: Reference Dedup + Runtime DRY — Báo cáo xác minh

**Mục tiêu phase:** Gộp verification-patterns.md + plan-checker.md → verification.md, cập nhật toàn bộ references, trích installer-utils.js từ shared installer code, cập nhật 4 installers import utils, review converter config consistency.
**Thời điểm xác minh:** 2026-03-27
**Trạng thái:** gaps_found
**Xác minh lần đầu:** Có — không có file VERIFICATION.md trước đó.

---

## Đánh giá mục tiêu

### Các tiêu chí thành công (từ ROADMAP.md)

| # | Tiêu chí | Trạng thái | Bằng chứng |
|---|---------|-----------|-----------|
| 1 | verification.md tồn tại, old files removed | ✓ VERIFIED | references/verification.md tồn tại (473 dòng). verification-patterns.md + plan-checker.md đã xóa. |
| 2 | Zero broken @references/ trong file command/workflow | ✗ FAILED | bin/lib/plan-checker.js dòng 10 vẫn còn `references/plan-checker.md` |
| 3 | installer-utils.js exports ensureDir, validateGitRoot, copyWithBackup | ✓ VERIFIED | Cả 3 hàm có mặt và được export. Module có 153 dòng, thực chất. |
| 4 | Tất cả 4 installers dùng shared utils | ✗ PARTIAL | 4 installers đều import, nhưng codex.js (3), copilot.js (3), gemini.js (2) còn mkdirSync gọi trực tiếp |
| 5 | Converter configs nhất quán (key names/format) | ✓ VERIFIED | Đã review, ghi nhận consistent trong SUMMARY. Smoke tests 38/38 pass. |
| 6 | Tất cả smoke tests + snapshot tests pass | ✗ FAILED | smoke-snapshot.test.js: 16 fail / 56 tests — snapshots chưa regenerate |

**Điểm số:** 3/6 tiêu chí xác minh

---

### Artifacts bắt buộc

| Artifact | Mô tả | Tồn tại | Thực chất | Wired | Trạng thái |
|---------|-------|---------|----------|-------|-----------|
| `references/verification.md` | File merged từ verification-patterns.md + plan-checker.md | ✓ | ✓ (473 dòng, "Phan A" + "Phan B") | ✓ (utils.js CONDITIONAL_LOADING_MAP trỏ đúng) | ✓ VERIFIED |
| `bin/lib/installer-utils.js` | Module shared utilities cho installers | ✓ | ✓ (153 dòng, 6 functions được export) | ✓ (4 installers import) | ✓ VERIFIED |
| `test/smoke-installer-utils.test.js` | Smoke test cho installer-utils | ✗ MISSING | — | — | ✗ MISSING |

Lưu ý: test/smoke-installer-utils.test.js không tồn tại như kế hoạch yêu cầu. Chức năng installer-utils được kiểm tra gián tiếp qua smoke-installers.test.js (30/30 pass), nhưng bản thân file test riêng biệt bị thiếu.

---

### Xác minh key links

| Từ | Đến | Via | Trạng thái | Chi tiết |
|----|-----|-----|-----------|---------|
| bin/lib/utils.js | references/verification.md | CONDITIONAL_LOADING_MAP key | ✓ WIRED | Dòng 254: `'references/verification.md': ...` |
| bin/lib/plan-checker.js | references/verification.md | JSDoc reference | ✗ NOT_WIRED | Dòng 10 vẫn còn `references/plan-checker.md` |
| workflows/plan.md | references/verification.md | @reference | ✓ WIRED | Dòng 215: `@references/verification.md` |
| workflows/write-code.md | references/verification.md | @reference | ✓ WIRED | 4 chỗ đã đổi sang `verification.md` |
| workflows/complete-milestone.md | references/verification.md | @reference | ✓ WIRED | 3 chỗ đã đổi sang `verification.md` |
| bin/lib/installers/codex.js | bin/lib/installer-utils.js | require('../installer-utils') | ✓ WIRED | Import có mặt dòng 12 |
| bin/lib/installers/copilot.js | bin/lib/installer-utils.js | require('../installer-utils') | ✓ WIRED | Import có mặt dòng 18 |
| bin/lib/installers/gemini.js | bin/lib/installer-utils.js | require('../installer-utils') | ✓ WIRED | Import có mặt dòng 12 |
| bin/lib/installers/opencode.js | bin/lib/installer-utils.js | require('../installer-utils') | ✓ WIRED | Import có mặt dòng 14 |

---

### Kiểm tra thực thi (Behavioral Spot-Checks)

| Hành vi | Lệnh | Kết quả | Trạng thái |
|---------|------|---------|-----------|
| installer-utils exports 3 functions | node -e "const m = require('bin/lib/installer-utils.js'); console.log(typeof m.ensureDir, typeof m.validateGitRoot, typeof m.copyWithBackup);" | function function function | ✓ PASS |
| smoke-integrity.test.js pass | node --test test/smoke-integrity.test.js | 56/56 pass | ✓ PASS |
| smoke-snapshot.test.js pass | node --test test/smoke-snapshot.test.js | 40/56 pass, **16 fail** | ✗ FAIL |
| smoke-installers.test.js pass | node --test test/smoke-installers.test.js | 30/30 pass | ✓ PASS |
| smoke-converters.test.js pass | node --test test/smoke-converters.test.js | 38/38 pass | ✓ PASS |

---

### Phủ sóng yêu cầu

| Requirement | Plan | Mô tả | Trạng thái | Bằng chứng |
|------------|------|-------|-----------|-----------|
| DEDU-01 | 057-01 | Gộp verification-patterns.md + plan-checker.md → verification.md | ✓ SATISFIED | references/verification.md tồn tại 473 dòng, 2 file cũ đã xóa |
| DEDU-02 | 057-01 | Cập nhật tất cả references đến 2 file cũ → file mới | ✗ BLOCKED | bin/lib/plan-checker.js:10 vẫn còn JSDoc trỏ tới plan-checker.md |
| DRYU-01 | 057-02 | Trích ensureDir(), validateGitRoot(), copyWithBackup() thành installer-utils.js | ✓ SATISFIED | 3 functions export + 3 thêm (savePdconfig, cleanLegacyDir, cleanOldFiles) |
| DRYU-02 | 057-02 | 4 platform installers import utils, giữ logic platform-specific | ? PARTIAL | Import có nhưng codex (3), copilot (3), gemini (2) còn mkdirSync recursive trực tiếp |
| DRYU-03 | 057-02 | Review 4 converter configs consistent | ✓ SATISFIED | SUMMARY ghi nhận "confirmed consistent", smoke-converters 38/38 pass |

---

### Phát hiện anti-pattern

| File | Dòng | Pattern | Mức độ | Tác động |
|------|------|---------|--------|---------|
| bin/lib/plan-checker.js | 10 | JSDoc reference đến file đã xóa: `references/plan-checker.md` | ✗ Blocker | DEDU-02 không thể được coi là hoàn thành — còn broken reference đến file đã bị xóa |
| bin/lib/installers/codex.js | 35, 48, 59 | `fs.mkdirSync(X, { recursive: true })` không dùng ensureDir() | ⚠ Warning | DRYU-02 chỉ partial — refactor không đầy đủ |
| bin/lib/installers/copilot.js | 41, 62, 84 | `fs.mkdirSync(X, { recursive: true })` không dùng ensureDir() | ⚠ Warning | DRYU-02 chỉ partial — refactor không đầy đủ |
| bin/lib/installers/gemini.js | 51, 70 | `fs.mkdirSync(X, { recursive: true })` không dùng ensureDir() | ⚠ Warning | DRYU-02 chỉ partial — refactor không đầy đủ |
| test/snapshots/codex/write-code.md | 61, 182, 312 | Snapshot vẫn chứa `verification-patterns.md` | ✗ Blocker | Snapshot test fail — snapshots chưa được regenerate |
| test/snapshots/codex/complete-milestone.md | 49, 65, 101 | Snapshot vẫn chứa `verification-patterns.md` | ✗ Blocker | Tương tự các platform khác (copilot, gemini, opencode) |

---

### Không cần xác minh thủ công

Tất cả items có thể kiểm tra tự động. Không cần human verification.

---

### Tóm tắt gaps

**3 gaps cản trở mục tiêu phase:**

**Gap 1 — bin/lib/plan-checker.js JSDoc broken reference (DEDU-02):**
Dù workflows, templates, và utils.js đã cập nhật đúng sang `verification.md`, file `bin/lib/plan-checker.js` dòng 10 còn sót lại tham chiếu `references/plan-checker.md` trong JSDoc comment. File này nằm trong danh sách `files_modified` của Plan 057-01 nhưng không được sửa đúng.

**Gap 2 — installers còn mkdirSync gọi trực tiếp (DRYU-02):**
codex.js, copilot.js và gemini.js đã import `ensureDir` nhưng chỉ dùng nó ở 1 vị trí mỗi file (targetDir). Các vị trí còn lại — skillDir, rulesDestDir, subDestDir — vẫn gọi `fs.mkdirSync(..., { recursive: true })` trực tiếp. Tổng cộng 8 chỗ chưa được chuyển đổi.

**Gap 3 — Snapshots chưa được regenerate (Success criterion 6):**
Sau khi các source files (write-code.md, complete-milestone.md, plan.md) được cập nhật từ `verification-patterns.md` → `verification.md`, snapshot files trong `test/snapshots/` không được tái tạo. 16 snapshot tests fail vì so sánh source hiện tại (có `verification.md`) với snapshot cũ (có `verification-patterns.md`). Cần chạy `node test/generate-snapshots.js` sau khi sửa xong 2 gaps trên.

---

_Xác minh: 2026-03-27_
_Verifier: Claude (gsd-verifier)_
