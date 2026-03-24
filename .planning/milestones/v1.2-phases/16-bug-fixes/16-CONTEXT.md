# Phase 16: Bug Fixes - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix tat ca bugs phat hien tu Phase 14 (audit) va Phase 15 (verification). Code thuc te phai thay doi — khong chi la report. Existing test suites (443+ tests) phai pass sau khi fix. BFIX-02 (snapshot sync) da satisfied — 48/48 match, 0 issues.

</domain>

<decisions>
## Implementation Decisions

### Fix scope va prioritization
- **D-01:** Fix 3 severity levels: Critical (C1, C2), Warning-High (V3), Warning (V1, V2, V5, W1-W15 triage)
- **D-02:** Info items: Fix I3 (hardcoded version string), I5 (Unicode escapes), I6 (stale comment "4 validators") — nhung cai co suggested fix ro rang va mang tinh Source of Truth
- **D-03:** Defer I8, I9, I10 (backward compat re-exports, legacy manifest) — can Major release (v2.0). Dua vao checklist cua ban Major update tiep theo
- **D-04:** Document I1, I2, I4, I7 (intentional patterns) — them comment `// Audit 2026-03-23: Intentional [Pattern] for [Reason]. See Phase 14 Audit.` vao code
- **D-05:** Warning triage: Fix ngay neu Risk == Low AND Complexity == Low. Defer neu Risk == Med/High ma chua co bang chung gay loi thuc te
- **D-06:** High risk + Info severity → skip. Khong fix.

### C1 resolution — plan-checker CLI
- **D-07:** Option A (Hybrid): Tao `bin/plan-check.js` CLI wrapper goi `bin/lib/plan-checker.js`. Giu module library nguyen ven
- **D-08:** CLI interface: `node bin/plan-check.js <plan-file-or-glob>` — output structured JSON + human-readable summary
- **D-09:** Update `workflows/plan.md` Step 8.1: chuyen tu "doc file roi goi ham inline" sang "chay lenh terminal `node bin/plan-check.js`"
- **D-10:** Loi ich: tiet kiem token (agent khong can doc 550 dong code), Single Source of Truth, CI/CD ready

### C2 + V1 resolution — fix-bug generic stack fallback
- **D-11:** Them row "Generic/Khac" vao bang stack trace trong `workflows/fix-bug.md` (lines 133-141): "entry point -> handler -> business logic -> data layer -> response"
- **D-12:** Them fallback: "Khong xac dinh duoc stack tu CONTEXT.md -> dung luong truy vet generic"

### V3 resolution — AskUserQuestion fallback conflict
- **D-13:** Sua `workflows/new-milestone.md` line 105: "AskUserQuestion khong kha dung nhu tool -> hoi van ban thuong. Nguoi dung khong phan hoi HOAC tool loi ky thuat -> tu dong sao luu. Ghi chu: 'Da tu dong sao luu do khong nhan duoc phan hoi.'"

### V2 resolution — effort routing aspirational
- **D-14:** Xoa effort routing table trong `workflows/fix-bug.md` (lines 162-174). Them note: "fix-bug luon chay voi sonnet (theo skill file). Effort routing khong ap dung cho fix-bug."

### V5 resolution — parallel mode silent degradation
- **D-15:** `workflows/write-code.md` line 118: canh bao RO RANG truoc spawn agents, list tasks thieu `> Files:`
- **D-16:** `workflows/write-code.md` line 366: them sub-step — tasks thieu `> Files:` -> hien thi files can review

### Snapshot regeneration strategy
- **D-17:** Chi regenerate khi cham converters (`bin/lib/converters/`) hoac commands (`commands/pd/`). Workflows va references KHONG affect snapshots
- **D-18:** One-shot regeneration SAU tat ca fixes cua Phase 16 — khong incremental
- **D-19:** Quy trinh: (1) code fixes, (2) `node test/generate-snapshots.js`, (3) review `git diff test/snapshots/`, (4) commit code + snapshots cung nhau
- **D-20:** Workflows/references changes KHONG affect snapshots — confirmed tu source code generate-snapshots.js

### Phase 14 Warning triage (D-05 applied)
- **D-21:** W1 (orphaned progress.md): Fix — Low risk, Low complexity. Inline content hoac wire reference
- **D-22:** W2 (plan-checker.md weak ref): Fix — Low risk. Them `@references/plan-checker.md (optional)` vao plan.md skill
- **D-23:** W3 (missing guard error): Fix — Low risk. Them error message pattern
- **D-24:** W4 (context7-pipeline transparency): Fix — Low risk. Them optional ref vao skills
- **D-25:** W5 (verification-report low refs): Fix — Low risk. Them ref vao complete-milestone.md
- **D-26:** W6-W8 (dead exports utils.js): Fix — Low risk. Remove tu module.exports
- **D-27:** W10 (stale test check grep): Defer — Med risk (thay doi commit pattern detection)
- **D-28:** W11 (complex verification step): Fix — Low risk. Them fallback instruction
- **D-29:** W13 (plan checker step too long): Defer — Med risk (restructure 137 lines co the break workflow)
- **D-30:** W14 (JSON exclusion rationale): Fix — Low risk. Them comment giai thich
- **D-31:** W15 (strict FastCode requirement): Fix — Low risk. Them "continue without FastCode" option

### Claude's Discretion
- Thu tu fix cac issues (co the nhom theo file de giam so commits)
- Chi tiet implementation cua `bin/plan-check.js` CLI
- Cach nhom fixes vao plans/waves

</decisions>

<specifics>
## Specific Ideas

- Nhom fixes theo file de giam so lan edit cung file: vd fix-bug.md (C2+V1, V2), new-milestone.md (V3, W3, W12), write-code.md (V5, W9), utils.js (W6-W8)
- Document intentional patterns bang comment format thong nhat: `// Audit 2026-03-23: Intentional [Pattern] for [Reason]`
- Snapshot regeneration la task CUOI CUNG sau tat ca code fixes — 1 commit duy nhat cho snapshots
- Test suite chay SAU moi plan wave de catch regressions som

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 14 audit output (issue source)
- `.planning/phases/14-skill-workflow-audit/14-AUDIT-REPORT.md` — 27 issues: 2 Critical, 15 Warning, 10 Info. Master issue list voi suggested fixes
- `.planning/phases/14-skill-workflow-audit/14-01-SKILL-FINDINGS.md` — Per-file scan results cho skills/references/templates
- `.planning/phases/14-skill-workflow-audit/14-02-WORKFLOW-FINDINGS.md` — Per-file scan results cho workflows/JS modules

### Phase 15 verification output (confirmed + new issues)
- `.planning/phases/15-workflow-verification/15-VERIFICATION-REPORT.md` — 6 issues: V1-V6 voi Phase 14 cross-references. Issue Registry + Recommendations cho Phase 16

### Files can fix (grouped by concern)
- `workflows/fix-bug.md` — C2/V1 (stack fallback), V2 (effort routing)
- `workflows/new-milestone.md` — V3/W12 (AskUserQuestion fallback), W3 (guard error)
- `workflows/write-code.md` — V5/W9 (parallel degradation)
- `bin/lib/plan-checker.js` — C1 (no runtime import), I6 (stale comment)
- `bin/lib/utils.js` — W6-W8 (dead exports)
- `bin/lib/converters/codex.js` — I5 (Unicode escapes)
- `references/plan-checker.md` — I3 (hardcoded version), W2 (weak reference)

### Verification framework
- `references/verification-patterns.md` — 4-level verification for validating fixes
- `references/state-machine.md` — State transition rules

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bin/lib/plan-checker.js` — 7 checks, well-tested (140 tests). CLI wrapper chi can import va call `runAllChecks()`
- `test/generate-snapshots.js` — Regenerate 48 snapshots tu source files
- `test/smoke-snapshot.test.js` — Verify snapshots match source (48 tests)

### Established Patterns
- Skills dung 7-section structure voi execution_context references
- Guard conditions dung pattern `- [ ] condition -> "error message"`
- Workflows dung numbered steps voi sub-steps (6a, 6b...)
- Converters transpile `commands/pd/*.md` — chi files nay affect snapshots

### Integration Points
- `bin/plan-check.js` (moi) se import tu `bin/lib/plan-checker.js` (existing)
- `workflows/plan.md` Step 8.1 se goi CLI thay vi doc inline
- Snapshot regeneration chi khi cham `commands/pd/` hoac `bin/lib/converters/`

</code_context>

<deferred>
## Deferred Ideas

- I8, I9 (COPILOT_TOOL_MAP, GEMINI_TOOL_MAP re-exports): Defer cho v2.0 Major release — backward compat
- I10 (legacy sk-file-manifest.json cleanup): Defer cho v2.0
- W10 (stale test check grep pattern): Defer — Med risk, can thay doi commit pattern detection
- W13 (plan checker step too long): Defer — Med risk, restructure 137 lines co the break workflow flow

</deferred>

---

*Phase: 16-bug-fixes*
*Context gathered: 2026-03-23*
