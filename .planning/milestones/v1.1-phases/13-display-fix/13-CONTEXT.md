# Phase 13: Display Fix - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix PASS report table trong workflows/plan.md Step 8.1 de hien thi day du tat ca checks tu runAllChecks result, thay vi hardcode 4 check names. Gap closure tu audit INTG-DISPLAY-01.

</domain>

<decisions>
## Implementation Decisions

### PASS table rendering (Section B)
- **D-01:** Dynamic iteration — chi dan Claude iterate qua `result.checks` array va render tung dong trong table, thay vi liet ke ten check cu the
- **D-02:** Format moi dong: `| {check.checkId}: {ten mo ta} | PASS |` — lay checkId tu result object
- **D-03:** Ten mo ta cho moi checkId lay tu mapping co dinh (CHECK-01 = Requirement Coverage, ADV-01 = Key Links, etc.) — vi checkId la stable identifier

### ISSUES FOUND examples (Section C)
- **D-04:** Them 1 ADV check vao examples de minh hoa ca 2 loai check (core + advanced)
- **D-05:** Giu nguyen rule "nhom theo check" o line 344 — logic da dung, chi update examples

### Claude's Discretion
- Exact wording cua ten mo ta cho moi ADV check
- Vi tri chinh xac cua thay doi trong file

</decisions>

<specifics>
## Specific Ideas

- PASS table phai tu dong bao gom checks moi trong tuong lai ma khong can sua template
- Section C examples nen bao gom 1 CHECK va 1 ADV de minh hoa pattern

</specifics>

<canonical_refs>
## Canonical References

### Workflow file
- `workflows/plan.md` §8.1 (lines 298-425) — Step 8.1 plan checker integration, section B (PASS table) va section C (ISSUES FOUND)

### Plan checker module
- `bin/lib/plan-checker.js` — runAllChecks returns `{ overall, checks }` where checks is array of `{ checkId, status, issues }`
- `references/plan-checker.md` — Rules spec v1.1, section 9 (Result Format) shows 7 check structure

### Audit gap
- `.planning/v1.1-MILESTONE-AUDIT.md` — INTG-DISPLAY-01 gap description

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `runAllChecks` API da tra ve day du 7 checks trong `result.checks` array — khong can thay doi code
- Moi check object co `checkId` (string), `status` (pass/block/warn), `issues` (array)

### Established Patterns
- Section C da dung pattern dynamic: "nhom theo check, moi check co issues → header + danh sach" — chi can apply pattern nay cho section B

### Integration Points
- `workflows/plan.md` lines 314-322 (section B) — thay the hardcoded table bang dynamic instruction
- `workflows/plan.md` lines 336-341 (section C) — them 1 ADV example

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 13-display-fix*
*Context gathered: 2026-03-23*
