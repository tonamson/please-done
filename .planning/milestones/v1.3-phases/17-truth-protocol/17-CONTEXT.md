# Phase 17: Truth Protocol - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Chuẩn hóa cấu trúc Truths trong plan documents — mở rộng bảng Truths từ 3 lên 5 cột (thêm "Giá trị nghiệp vụ" và "Trường hợp biên"), ép mỗi Task phải có Truths reference bắt buộc, nâng CHECK-04 severity từ WARN lên BLOCK cho Direction 2 (Task không có Truth).

</domain>

<decisions>
## Implementation Decisions

### Column Naming (D-01, D-02, D-03)
- **D-01:** Tất cả cột trong bảng Truths dùng tiếng Việt, nhất quán với template hiện tại: `| # | Sự thật | Giá trị nghiệp vụ | Trường hợp biên | Cách kiểm chứng |`
- **D-02:** Cột "Giá trị nghiệp vụ" chứa giải thích **tại sao** logic tồn tại từ góc nhìn business (VD: "Đảm bảo bảo mật tài khoản", "Giảm tỷ lệ bỏ giỏ hàng")
- **D-03:** Cột "Trường hợp biên" chứa danh sách ngắn các edge cases, cách nhau bằng dấu phẩy (VD: "Password sai 5 lần, email trống, token hết hạn")

### Logic Reference (D-04)
- **D-04:** "Logic Reference" trong REQUIREMENTS chính là trường "Truths" đã có trong tasks template (`> Truths: [T1, T2]` và cột `Truths` trong bảng tổng quan). Không thêm field mới — chỉ ép bắt buộc qua plan-checker CHECK-04.

### CHECK-04 Severity (D-05, D-06)
- **D-05:** CHECK-04 Direction 2 (Task không có Truth) nâng từ WARN lên BLOCK. Mọi task — kể cả infrastructure tasks — phải map tới ≥1 Truth. Infrastructure task gán vào Truth gần nhất mà nó phục vụ.
- **D-06:** 1 task thiếu Truths = toàn bộ plan BLOCK. Nhất quán với triết lý "Không có Truth = Không có Code".

### Claude's Discretion
- Parser backward compatibility strategy: Claude tự chọn cách parseTruthsV11() handle cả 3-column (v1.1) và 5-column (v1.3) formats
- Converter snapshot regeneration order và batching strategy
- Test structure cho các tests mới

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Plan Templates
- `templates/plan.md` — Bảng Truths hiện tại (3 cột), cần mở rộng lên 5 cột
- `templates/tasks.md` — Trường Truths trong task metadata, đã có nhưng chưa bắt buộc

### Plan Checker
- `bin/lib/plan-checker.js` — parseTruthsV11() (line 125), checkTruthTaskCoverage() (line 669), CHECK-04 logic
- `references/plan-checker.md` — Rules spec cho plan checker

### Tests
- `test/smoke-plan-checker.test.js` — Tests cho plan checker (140+ tests)
- `test/snapshots/` — 48 converter snapshots cần regenerate sau template change

### Requirements
- `.planning/REQUIREMENTS.md` — TRUTH-01, TRUTH-02, TRUTH-03 definitions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `parseTruthsV11()` in `bin/lib/plan-checker.js:125` — Parser hiện tại match 3-column Truths table, cần extend cho 5 columns
- `checkTruthTaskCoverage()` in `bin/lib/plan-checker.js:669` — CHECK-04 logic, Direction 2 cần đổi từ WARN → BLOCK
- `parseTaskDetailBlocksV11()` in `bin/lib/plan-checker.js:142` — Đã parse `> Truths:` field từ task blocks
- `parseTruthRefs()` — Helper parse Truth references từ metadata string

### Established Patterns
- Pure function pattern: tất cả check functions nhận content, trả kết quả, không đọc file
- Dynamic PASS table: checks tự đăng ký qua name mapping, không cần sửa workflow
- Converter snapshot testing: 48 comparisons đảm bảo zero behavioral regression

### Integration Points
- `templates/plan.md` → Converters (codex, gemini, copilot, opencode) transpile template
- `bin/lib/plan-checker.js` → `bin/plan-check.js` CLI wrapper → `workflows/plan.md` workflow
- Template change → Parser regex update → Snapshot regeneration → Test suite verification

</code_context>

<specifics>
## Specific Ideas

Ví dụ format mong muốn cho bảng Truths 5 cột:
```
| # | Sự thật | Giá trị nghiệp vụ | Trường hợp biên | Cách kiểm chứng |
|---|---------|-----------------|-----------------|------------------|
| T1 | User đăng nhập bằng email + password | Đảm bảo bảo mật tài khoản | Password sai 5 lần, email trống, token hết hạn | POST /auth/login trả về JWT hợp lệ |
```

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 17-truth-protocol*
*Context gathered: 2026-03-23*
