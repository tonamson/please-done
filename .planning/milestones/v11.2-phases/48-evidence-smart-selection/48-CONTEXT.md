# Phase 48: Evidence & Smart Selection - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Hệ thống smart selection chọn scanner liên quan dựa trên context dự án (tech stack + file patterns), xuất evidence chi tiết đến từng hàm (function-level checklist PASS/FLAG/FAIL/SKIP), và reporter tổng hợp master table với hot spots. Thay thế stub B4 trong workflow audit bằng logic selection thực.

</domain>

<decisions>
## Implementation Decisions

### Smart Selection Engine
- **D-01:** 3 base scanner luôn chạy không cần tín hiệu: `secrets`, `misconfig`, `logging`
- **D-02:** 10 scanner còn lại chạy có điều kiện — kích hoạt khi phát hiện tín hiệu phù hợp
- **D-03:** Engine đặt tại file mới `bin/lib/smart-selection.js` — pure function `selectScanners(projectContext)` trả về `{ selected: string[], skipped: string[], signals: Signal[] }`
- **D-04:** 12 tín hiệu dựa trên kết hợp **package.json deps** (express, prisma, sequelize...) + **file patterns** (file extensions, import statements). Không dùng AI phân tích — hoàn toàn rule-based
- **D-05:** Khi < 2 tín hiệu match: hiển thị danh sách tín hiệu tìm được, hỏi user chọn "chạy 3 base + N matched" hay "--full 13 scanner"
- **D-06:** `--full` và `--only cat1,cat2` bypass B4 hoàn toàn — không chạy smart selection

### Function-Level Checklist
- **D-07:** Bổ sung section `## Function Checklist` vào evidence format hiện tại — giữ nguyên summary table + findings cũ, thêm bảng từng hàm. Backward compatible
- **D-08:** Mỗi hàm có verdict: PASS (an toàn), FLAG (nghi ngờ), FAIL (lỗ hổng xác nhận), SKIP (không liên quan đến category) — SKIP ghi kèm lý do ngắn
- **D-09:** Phát hiện hàm bằng FastCode query (dùng `fastcode_queries[]` từ security-rules.yaml), Grep fallback khi FastCode unavailable

### Reporter & Master Table
- **D-10:** Master table sắp xếp: Severity đầu tiên (CRITICAL → HIGH → MEDIUM → LOW), cùng severity sort theo OWASP (A01 → A10)
- **D-11:** Hot spots hiển thị 2 bảng riêng: Top 5 files có nhiều finding nhất + Top 5 functions nguy hiểm nhất
- **D-12:** Reporter merge function outcomes từ nhiều scanner — cùng 1 function bị FLAG bởi 2 scanner khác nhau → gộp thành 1 dòng với nhiều findings

### Tích hợp Workflow
- **D-13:** Flow: B3 (scope) → B4 `selectScanners(scanPath)` → hiển thị kết quả → user confirm → B5 `buildScannerPlan(selected)` → dispatch
- **D-14:** `selectScanners()` và `buildScannerPlan()` là 2 function riêng biệt, loose coupling. Workflow lấy `.selected` từ selection rồi truyền cho plan
- **D-15:** `--full` skip B4, dispatch 13/13. `--only` skip B4, dispatch danh sách chỉ định

### Claude's Discretion
- Chi tiết 12 tín hiệu cụ thể (mapping signal → category) — researcher sẽ điều tra pattern nào phù hợp nhất
- Format chính xác của Function Checklist table (cột nào, width nào)
- Logic merge function outcomes trong reporter (key: file+function name hay hash)
- Cách hiển thị confirm prompt cho user khi < 2 match

</decisions>

<specifics>
## Specific Ideas

- Smart selection phải nhanh — chỉ Glob + Grep + đọc package.json, không spawn AI agent
- Function checklist SKIP giống "N/A" trong audit checklist thật — minh bạch, dễ verify
- Hot spots giúp developer biết ngay file/hàm nào cần fix gấp nhất mà không đọc toàn bộ report

</specifics>

<canonical_refs>
## Canonical References

### Scanner infrastructure (Phase 46-47)
- `.planning/phases/46-nen-tang-scanner/46-CONTEXT.md` — D-06 dispatch model, D-07 tier assignment, D-08 tool-first flow, D-09 Grep fallback
- `.planning/phases/47-luong-audit-cot-loi/47-CONTEXT.md` — D-05 smart selection stub, D-09 buildScannerPlan exists

### Security rules
- `references/security-rules.yaml` — 13 OWASP categories với patterns[], fixes[], fastcode_queries[]

### Existing code
- `bin/lib/parallel-dispatch.js` — `buildScannerPlan()` và `mergeScannerResults()` functions
- `commands/pd/audit.md` — Workflow 9 bước, B4 hiện là stub
- `commands/pd/agents/pd-sec-reporter.md` — Reporter agent template hiện tại

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `buildScannerPlan(categories, batchSize, scanPath)` — nhận categories[] trực tiếp, không cần sửa interface
- `mergeScannerResults(scanResults)` — merge evidence outcomes, failure isolation
- `security-rules.yaml` — chứa sẵn `fastcode_queries[]` và `patterns[]` cho mỗi category — có thể tái sử dụng làm signal patterns
- `pd-sec-reporter.md` — template reporter đã có, cần mở rộng thêm master table + hot spots + function merge

### Established Patterns
- Pure function pattern: `buildScannerPlan` là pure function, `selectScanners` cũng nên theo pattern này
- YAML-driven: scanner config tập trung trong security-rules.yaml, signal mapping cũng nên đặt ở đây hoặc file YAML riêng
- Wave dispatch: 2 scanner/wave là pattern đã quyết định, smart selection chỉ thay đổi DANH SÁCH categories, không thay đổi cách dispatch

### Integration Points
- B4 stub trong `commands/pd/workflows/audit.md` → thay bằng gọi `selectScanners()`
- `pd-sec-scanner.md` template → thêm output section `## Function Checklist`
- `pd-sec-reporter.md` → mở rộng để đọc function checklist từ evidence files

</code_context>

<deferred>
## Deferred Ideas

- Auto-fix suggestions (--auto-fix flag) — đã thông báo "chưa hỗ trợ" trong audit.md
- PoC generation (--poc flag) — tương tự, chưa hỗ trợ
- ML-based signal detection thay vì rule-based — quá phức tạp cho scope hiện tại

</deferred>

---

*Phase: 48-evidence-smart-selection*
*Context gathered: 2026-03-26*
