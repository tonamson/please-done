---
phase: 41-bao-ve-workflow
verified: 2026-03-25T23:44:51Z
status: passed
score: 13/13 must-haves verified
re_verification: false
---

# Phase 41: Bảo Vệ Workflow — Báo Cáo Xác Minh

**Mục tiêu phase:** Workflow plan tự động phát hiện khi thiếu research backing và gợi ý bổ sung — không block, chỉ cảnh báo
**Xác minh:** 2026-03-25T23:44:51Z
**Trạng thái:** PASSED
**Re-verification:** Không — xác minh lần đầu

---

## Đạt được Mục tiêu

### Các Sự thật Quan sát được

| #  | Sự thật                                                                               | Trạng thái  | Bằng chứng                                                                      |
|----|---------------------------------------------------------------------------------------|-------------|---------------------------------------------------------------------------------|
| 1  | CHECK-06 trả PASS khi research dir rỗng (không có files)                              | ✓ VERIFIED  | `checkResearchBacking('...', { hasResearchFiles: false })` → `pass`             |
| 2  | CHECK-06 trả WARN khi có research files nhưng plan không reference `.planning/research/` | ✓ VERIFIED  | `checkResearchBacking('no ref', { hasResearchFiles: true })` → `warn`; fixHint có 'pd research' |
| 3  | CHECK-06 trả PASS khi plan có reference `.planning/research/`                         | ✓ VERIFIED  | Input có `.planning/research/` → `pass`                                         |
| 4  | CHECK-06 configurable severity WARN/BLOCK/OFF                                         | ✓ VERIFIED  | `severity: 'block'` → `block`; `severity: 'off'` → `pass`                      |
| 5  | CHECK-07 trả PASS khi < 2 hedging patterns                                            | ✓ VERIFIED  | 0 pattern → `pass`; 1 pattern → `pass` (test line 1444)                         |
| 6  | CHECK-07 trả WARN khi >= 2 hedging patterns với gợi ý pd research                    | ✓ VERIFIED  | 2 pattern → `warn`; message có 'pd research'                                    |
| 7  | CHECK-07 configurable severity WARN/BLOCK/OFF                                         | ✓ VERIFIED  | `severity: 'block'` → `block`; `severity: 'off'` → `pass`                      |
| 8  | `runAllChecks` trả về 10 checks (không phải 8)                                        | ✓ VERIFIED  | Chạy trực tiếp: `checks.length: 10`; 4 test assertions tại dòng 828, 909, 1382, 1531 |
| 9  | `workflows/write-code.md` có block `<research_injection>` hướng dẫn đọc INDEX.md     | ✓ VERIFIED  | Dòng 19-32; có INDEX.md, max 2 entries, max 2000 ký tự, fallback silent         |
| 10 | `workflows/plan.md` có block `<research_injection>` tương tự                          | ✓ VERIFIED  | Dòng 22-35; nội dung giống hệt write-code.md                                   |
| 11 | Hướng dẫn chỉ đọc tối đa 2 files, 2000 ký tự mỗi file                                | ✓ VERIFIED  | `write-code.md` dòng 24-25: "tối đa 2 entries" và "2000 ký tự"                 |
| 12 | Fallback: không có INDEX.md hoặc không match → bỏ qua, không báo lỗi                 | ✓ VERIFIED  | `write-code.md` dòng 31: "bỏ qua, tiếp tục bình thường (KHÔNG báo lỗi)"        |
| 13 | Snapshot tests pass sau khi regenerate                                                | ✓ VERIFIED  | Full test suite: 907/907 pass, 0 fail                                           |

**Điểm:** 13/13 sự thật đã xác minh

---

### Artifacts Bắt buộc

#### Plan 01 Artifacts

| Artifact                                  | Mô tả dự kiến                                          | Tồn tại | Thực chất | Được nối dây | Trạng thái  |
|-------------------------------------------|--------------------------------------------------------|---------|-----------|--------------|-------------|
| `bin/lib/plan-checker.js`                 | checkResearchBacking, checkHedgingLanguage functions   | ✓       | ✓         | ✓            | ✓ VERIFIED  |
| `bin/plan-check.js`                       | CLI truyền check06Options + check07Severity vào runAllChecks | ✓  | ✓         | ✓            | ✓ VERIFIED  |
| `test/smoke-plan-checker.test.js`         | Tests cho CHECK-06, CHECK-07, checks.length === 10     | ✓       | ✓         | ✓            | ✓ VERIFIED  |

#### Plan 02 Artifacts

| Artifact                                  | Mô tả dự kiến                                          | Tồn tại | Thực chất | Được nối dây | Trạng thái  |
|-------------------------------------------|--------------------------------------------------------|---------|-----------|--------------|-------------|
| `workflows/write-code.md`                 | Research context injection guard                       | ✓       | ✓         | ✓            | ✓ VERIFIED  |
| `workflows/plan.md`                       | Research context injection guard                       | ✓       | ✓         | ✓            | ✓ VERIFIED  |

---

### Xác Minh Key Links

#### Plan 01 Key Links

| Từ                          | Đến              | Qua                                                          | Trạng thái | Chi tiết                                                          |
|-----------------------------|------------------|--------------------------------------------------------------|------------|-------------------------------------------------------------------|
| `bin/lib/plan-checker.js`   | `runAllChecks`   | checkResearchBacking + checkHedgingLanguage trong checks array | ✓ WIRED    | Dòng 1021-1022: cả 2 được gọi trong `checks = [...]`             |
| `bin/plan-check.js`         | `runAllChecks`   | truyền check06Options và check07Severity                      | ✓ WIRED    | Dòng 79-84: `check06Options` và `check07Severity` được truyền vào |

#### Plan 02 Key Links

| Từ                          | Đến                                | Qua                                               | Trạng thái | Chi tiết                                                          |
|-----------------------------|------------------------------------|---------------------------------------------------|------------|-------------------------------------------------------------------|
| `workflows/write-code.md`   | `.planning/research/INDEX.md`      | research_injection block references INDEX.md      | ✓ WIRED    | Dòng 22: `Đọc .planning/research/INDEX.md`                       |
| `workflows/plan.md`         | `.planning/research/INDEX.md`      | research_injection block references INDEX.md      | ✓ WIRED    | Dòng 25: `Đọc .planning/research/INDEX.md`                       |

---

### Data-Flow Trace (Level 4)

Các artifacts trong phase này là pure functions và workflow text files — không render dynamic data từ state/props. Level 4 không áp dụng cho pure function checkers.

- `checkResearchBacking`: Pure function nhận input, trả output trực tiếp — không có state
- `checkHedgingLanguage`: Tương tự pure function
- `workflows/*.md`: Text files tĩnh hướng dẫn AI agent — không render dynamic data

**Kết luận Level 4:** SKIPPED — artifacts là pure functions và static text, không cần data-flow trace.

---

### Behavioral Spot-Checks

| Hành vi                                           | Lệnh kiểm tra                                                                     | Kết quả                                        | Trạng thái |
|---------------------------------------------------|-----------------------------------------------------------------------------------|------------------------------------------------|------------|
| checkResearchBacking WARN khi thiếu ref           | `node -e "pc.checkResearchBacking('no ref', { hasResearchFiles: true }).status"`  | `warn`                                         | ✓ PASS     |
| checkHedgingLanguage WARN với 2+ patterns         | `node -e "pc.checkHedgingLanguage('Chua ro. Can tim hieu.').status"`              | `warn`                                         | ✓ PASS     |
| runAllChecks trả 10 checks                        | `node -e "...runAllChecks(...).checks.length"`                                    | `10`                                           | ✓ PASS     |
| Full test suite (165 smoke-plan-checker + 907 tổng) | `node --test 'test/*.test.js'`                                                  | 907 pass, 0 fail                               | ✓ PASS     |
| research_injection có trong tất cả 8 snapshots    | `grep -c "research_injection" test/snapshots/*/write-code.md`                    | 2 (codex, copilot, opencode) / 1 (gemini) each | ✓ PASS     |

---

### Phủ Tầm Yêu Cầu

| Yêu cầu  | Plan nguồn | Mô tả                                                                                 | Trạng thái  | Bằng chứng                                                                   |
|----------|------------|---------------------------------------------------------------------------------------|-------------|------------------------------------------------------------------------------|
| GUARD-01 | Plan 01    | CHECK-06 trong plan-checker kiểm tra plan có research backing (WARN default, configurable) | ✓ THỎA MÃN | `checkResearchBacking` tại dòng 728, được export, wired vào `runAllChecks`   |
| GUARD-02 | Plan 01    | Phat hien >= 2 hedging patterns và gợi ý chạy `pd research`                          | ✓ THỎA MÃN | `checkHedgingLanguage` tại dòng 758, regex 6 patterns, message có 'pd research' |
| GUARD-03 | Plan 02    | Strategy Injection tải research context vào agent prompts (max 2 files, 2000 tokens) | ✓ THỎA MÃN | `<research_injection>` block trong cả 2 workflows + được inject vào 8 snapshots qua `inlineWorkflow()` trong `bin/lib/utils.js` |

**Lưu ý GUARD-03:** REQUIREMENTS.md traceability table vẫn ghi `Pending` và checkbox `[ ]` chưa được cập nhật — đây là documentation gap. Code đã được implement đầy đủ: workflows có block, utils.js extract và inject block vào snapshots, 907 tests pass. Yêu cầu về tính năng đã đạt nhưng REQUIREMENTS.md cần cập nhật status thủ công.

---

### Anti-Patterns Phát Hiện

| File | Dòng | Pattern | Mức độ | Tác động |
|------|------|---------|--------|----------|
| `bin/lib/plan-checker.js` | 1 | JSDoc header vẫn ghi "8 checks" ở dòng 6 | ℹ️ Info | Documentation lỗi thời — comment nói "8 checks" nhưng code thực tế có 10 |

**Phân loại:** Không có blocker. Comment JSDoc lỗi thời là info-level — không ảnh hưởng tới runtime behavior.

---

### Yêu Cầu Xác Minh Bởi Con Người

Không có — tất cả hành vi có thể kiểm tra tự động.

- Workflow text files là hướng dẫn cho AI agent (không phải UI để user nhìn thấy)
- Behavior của CHECK-06/07 đã được xác minh qua unit tests và spot-checks
- Snapshot regeneration đã được xác minh qua test suite

---

### Tóm Tắt

Phase 41 đạt được mục tiêu: workflow plan-checker tự động phát hiện thiếu research backing và ngôn ngữ mơ hồ, gợi ý `pd research` — không block (severity WARN default).

**Plan 01** thêm 2 pure function checks (CHECK-06, CHECK-07) vào `plan-checker.js`, cập nhật `runAllChecks` từ 8 lên 10 checks, cập nhật CLI và 165 tests (tất cả pass). **Plan 02** thêm `<research_injection>` block vào 2 workflow files, cập nhật `inlineWorkflow()` để inject vào converted snapshots — 8 snapshots đã sync, 907 tests pass.

Một điểm cần theo dõi nhỏ: REQUIREMENTS.md traceability table ghi GUARD-03 là `Pending` — cần cập nhật thủ công để phản ánh đúng trạng thái đã hoàn thành.

---

_Xác minh: 2026-03-25T23:44:51Z_
_Người xác minh: Claude (gsd-verifier)_
