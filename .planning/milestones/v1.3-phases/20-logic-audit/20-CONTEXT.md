# Phase 20: Logic Audit - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Tách CHECK-04 hiện tại thành CHECK-04 + CHECK-05 trong plan-checker. CHECK-04 giữ Direction 1 (Truth→Task, BLOCK). CHECK-05 mới xử lý Direction 2 (Task→Truth) với severity configurable (default WARN) và orphan detection reporting. Code "mồ côi" = technical debt, reported trong PASS table.

</domain>

<decisions>
## Implementation Decisions

### CHECK-05 vs CHECK-04 (D-01, D-02, D-03)
- **D-01:** Tách CHECK-04 thành 2 checks riêng: CHECK-04 giữ Direction 1 (Truth không có task → BLOCK), CHECK-05 mới làm Direction 2 (Task không có Truth → configurable severity)
- **D-02:** CHECK-05 function name: `checkLogicCoverage` (theo AUDIT-01 spec)
- **D-03:** CHECK-04 `checkTruthTaskCoverage()` thu hẹp scope: chỉ giữ Direction 1 (Truth→Task). Direction 2 code di chuyển sang CHECK-05

### Severity Model (D-04, D-05)
- **D-04:** CHECK-05 severity mặc định WARN — cho phép plan pass với warning. Task thiếu Truths = technical debt, không block
- **D-05:** CHECK-05 severity configurable: dự án strict có thể nâng lên BLOCK qua plan-checker config/parameter. Phase 17 D-05/D-06 tinh thần giữ nguyên nhưng thực thi linh hoạt hơn

### Technical Debt Reporting (D-06)
- **D-06:** Orphan reporting chỉ trong PASS table — nhất quán với các checks khác, không tạo artifact mới. Issues list ghi rõ tasks mồ côi nào thiếu Truth mapping

### Claude's Discretion
- Config mechanism cho severity override (parameter, env var, hoặc plan-checker config)
- Test structure và coverage cho CHECK-05
- Cách refactor CHECK-04 code mà không break existing 140+ tests
- Dynamic PASS table name mapping cho CHECK-05

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Plan Checker Core
- `bin/lib/plan-checker.js` — `checkTruthTaskCoverage()` (line 649), `parseTruthsV11()` (line 125), `parseTaskDetailBlocksV11()` (line 142), `runAllChecks()` (line 935)
- `references/plan-checker.md` — Rules spec for plan checker (needs CHECK-05 addition)

### Tests
- `test/smoke-plan-checker.test.js` — 140+ existing tests, CHECK-04 tests need split/update

### Prior Phase Context
- `.planning/phases/17-truth-protocol/17-CONTEXT.md` — D-05/D-06 decisions on CHECK-04 severity (now being refined)

### Requirements
- `.planning/REQUIREMENTS.md` — AUDIT-01 definition

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `checkTruthTaskCoverage()` in `plan-checker.js:649` — Contains both Direction 1 and Direction 2 logic, needs splitting
- `parseTruthsV11()` — Existing Truth parser, reused by CHECK-05
- `parseTaskDetailBlocksV11()` — Existing task parser, reused by CHECK-05
- Dynamic PASS table — CHECK-05 auto-registers via name mapping (no workflow changes needed)

### Established Patterns
- Pure function pattern: check functions receive content as args, return result object `{ checkId, status, issues[] }`
- Each issue: `{ message, location, fixHint }`
- Status values: 'pass', 'warn', 'block'
- Exports at bottom of plan-checker.js, `runAllChecks()` orchestrates all checks

### Integration Points
- `runAllChecks()` at line 935 — needs CHECK-05 added to the checks array
- `module.exports` at line 960 — needs `checkLogicCoverage` exported
- `references/plan-checker.md` — needs CHECK-05 rule documentation
- Dynamic PASS table: name mapping auto-detects new checks, no workflow edits needed

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 20-logic-audit*
*Context gathered: 2026-03-24*
