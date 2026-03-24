# Phase 15: Workflow Verification - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Deep verify 3 workflow chinh (new-milestone, write-code, fix-bug) end-to-end. Moi buoc logic duoc trace, data flow duoc kiem tra, moi gap duoc ghi nhan voi impact va suggested fix. Output la verification report duy nhat phuc vu Phase 16 (Bug Fixes). KHONG fix bugs o phase nay — chi verify va ghi nhan.

</domain>

<decisions>
## Implementation Decisions

### Verification method (4-level depth)
- **D-01:** Dung he thong 4 cap verification theo verification-patterns.md: Cap 1 (Ton tai — file phai co tren dia), Cap 2 (Thuc chat — code khong phai stub/placeholder), Cap 3 (Ket noi — imports/exports/calls thuc te), Cap 4 (Hoat dong — chay test logic)
- **D-02:** Code-backed verification — moi claim trong workflow phai duoc doi chieu voi code that qua Grep/Glob (vd: workflow noi "utils.js export X" thi phai verify X thuc su ton tai)
- **D-03:** Truth-based edge cases — moi behavior claim can co "Truth" tuong ung. Vd: "retry 3 lan" phai co Truth kiem chung hanh vi retry va dieu kien dung
- **D-04:** Key Links trace data flow xuyen steps — neu Step 3 tao file va Step 7 dung file do, Key Link bat buoc ca hai steps phai tham chieu file nay
- **D-05:** State Machine strict — trang thai chi duoc danh dau hoan tat SAU KHI code da viet, build thanh cong va commit. Build fail → giu trang thai "dang chay"
- **D-06:** Fallback check cho external tools — verify artifact dau ra, khong gia dinh tool luon dung. 2 lan tu sua that bai → STOP + bao user

### Phase 14 findings integration
- **D-07:** Audit report (14-AUDIT-REPORT.md) la baseline — Phase 15 la stress-test thuc te cho nhung gi audit cho la dung
- **D-08:** Confirm + deep-dive MOI issue da biet (C2, W9, W10, W12, W13, W15) — xac dinh Impact thuc te de Phase 16 prioritize. KHONG skip bat ky issue nao
- **D-09:** Phat hien issues moi ma audit bo sot — ghi vao verification report voi cross-reference nguoc audit (vd: "V5 la he luy cua W13 Phase 14")

### Report format
- **D-10:** 1 file duy nhat: `15-VERIFICATION-REPORT.md` voi anchor links (#wflow-01, #wflow-02, #wflow-03) de dieu huong nhanh
- **D-11:** Hybrid trace format — Steps pass: 1 dong ("✓ Verified. Artifacts & state updates match spec"). Steps fail: full detail (Logic Trace, Code Reference, Impact, Suggested Fix)
- **D-12:** Pre-defined Truth inventory — 3-5 Critical Truths per workflow truoc khi trace, bo sung Implicit Truths trong qua trinh verify
- **D-13:** Moi issue can: ID (V1, V2...), Source (WFLOW-0X), Affected lines, Severity (Critical/Warning/Info), Description & Impact, Suggested Fix cu the, Regression Risk (Low/Med/High)
- **D-14:** Report viet bang tieng Viet — don gian, ro rang, de hieu nhat co the

### Claude's Discretion
- Thu tu verify 3 workflows (co the bat dau voi workflow don gian nhat)
- So luong Critical Truths per workflow (3-5 la guideline, khong phai hard limit)
- Chi tiet level cua Logic Trace cho failed steps
- Cach nhom issues trong Executive Summary

</decisions>

<specifics>
## Specific Ideas

- Mau report phai theo cau truc: Executive Summary → Per-workflow sections (Truth Inventory → Logic Trace → Detailed Findings table)
- Moi dong trong bang Issue phai la mot hanh dong cu the cho Phase 16 — "surgical fix", khong phai goi y chung chung
- Regression Risk column giup Phase 16 biet can bo sung bao nhieu test cases sau khi fix
- Cross-reference voi Phase 14 audit bang cach dung format: "Issue V5 (Phase 15) la he luy cua Warning W13 (Phase 14)"

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 14 audit output (baseline)
- `.planning/phases/14-skill-workflow-audit/14-AUDIT-REPORT.md` — Consolidated audit report voi 27 issues, Priority Workflow Notes cho ca 3 workflows
- `.planning/phases/14-skill-workflow-audit/14-01-SKILL-FINDINGS.md` — Chi tiet findings cho skills/references/templates
- `.planning/phases/14-skill-workflow-audit/14-02-WORKFLOW-FINDINGS.md` — Chi tiet findings cho workflows/JS modules

### 3 workflow files can verify
- `workflows/new-milestone.md` — 10 steps, WFLOW-01
- `workflows/write-code.md` — 10+ steps (423 dong), WFLOW-02
- `workflows/fix-bug.md` — 10 steps, WFLOW-03

### Verification framework
- `references/verification-patterns.md` — 4-level verification system (Exists → Substance → Connected → Operational)
- `references/state-machine.md` — State transition rules, dieu kien danh dau hoan tat
- `references/plan-checker.md` — Key Links (ADV-01), Truth-Task mapping (CHECK-04)

### Supporting references
- `references/context7-pipeline.md` — Context7 pipeline (referenced by write-code, fix-bug)
- `references/guard-context.md` — Guard pattern cho context loading
- `references/guard-fastcode.md` — FastCode guard va fallback

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `14-AUDIT-REPORT.md` Priority Workflow Notes — da co assessment chi tiet cho ca 3 workflows, dung lam baseline
- `references/verification-patterns.md` — 4-level verification framework san sang ap dung
- `references/plan-checker.md` Key Links va Truth-Task mapping — co the adapt cho workflow verification

### Established Patterns
- Workflows dung numbered steps (Buoc 0, 0.5, 1, 2...) voi sub-steps (6a, 6b...)
- State updates tai nhieu checkpoints trong workflow
- Guard conditions kiem tra prerequisites truoc khi chay logic chinh
- Cross-workflow handoffs o step cuoi (vd: new-milestone → plan, write-code → test)

### Integration Points
- Workflows reference JS modules: `bin/lib/utils.js`, `bin/lib/plan-checker.js`
- Workflows reference templates: `@templates/*.md`
- Workflows reference references: `@references/*.md`
- External tools: FastCode MCP, Context7 MCP, AskUserQuestion

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 15-workflow-verification*
*Context gathered: 2026-03-23*
