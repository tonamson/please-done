# Phase 36: Fix Workflow Wiring - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning
**Source:** Gap closure from v2.1-MILESTONE-AUDIT.md (INT-07, INT-08)

<domain>
## Phase Boundary

Fix 2 wiring bugs trong fix-bug.md: detectiveResult shape mismatch khi goi mergeParallelResults (INT-07), va runLogicSync return destructuring sai (INT-08). Day la gap closure cuoi cung cua v2.1 milestone — scope cuc ky hep, chi fix 2 call sites trong workflow.

</domain>

<decisions>
## Implementation Decisions

### INT-07 (P1): detectiveResult shape mismatch trong mergeParallelResults call
- **D-01:** Hien tai fix-bug.md dong 126 gan `validateEvidence(detectiveContent) -> detectiveResult` tra ve `{ valid, outcome, warnings }`. Nhung `mergeParallelResults` (parallel-dispatch.js dong 66) expect `{ evidenceContent: string }`. Detective luon appear FAILED.
- **D-02:** Fix: Construct `{ evidenceContent: detectiveContent }` khi goi mergeParallelResults, KHONG reuse validateEvidence result. Tuong tu cho docSpecResult — construct `{ evidenceContent: docSpecContent }`.
- **D-03:** Giu validateEvidence call de validate rieng (dong 126), nhung truyen shape dung cho mergeParallelResults (dong 136).

### INT-08 (P2): runLogicSync return destructuring sai
- **D-04:** Hien tai fix-bug.md dong 357 doc `{ hasLogicChange, signals, diagramUpdated, rulesSuggested }` nhung runLogicSync (logic-sync.js dong 249) tra ve `{ logicResult, reportResult, rulesResult, warnings }`.
- **D-05:** Fix: Doi destructuring thanh `{ logicResult, reportResult, rulesResult, warnings }`. Access dung sub-fields: `logicResult.hasLogicChange`, `reportResult !== null` (PDF update), `rulesResult.suggestions` (CLAUDE.md rules).
- **D-06:** Cap nhat conditions: dong 359 doi `hasLogicChange = true va diagramUpdated` thanh `logicResult?.hasLogicChange && reportResult`. Dong 361 doi `rulesSuggested co noi dung` thanh `rulesResult?.suggestions?.length > 0`.

### Test & Snapshot Strategy
- **D-07:** Verify existing tests pass — KHONG them tests moi (modules da co unit tests day du).
- **D-08:** Regenerate snapshots sau khi fix fix-bug.md — nhat quan voi Phase 34/35 pattern.

### Claude's Discretion
- So luong plans va task breakdown
- Commit message style

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Audit report (source of all gaps)
- `.planning/v2.1-MILESTONE-AUDIT.md` — INT-07 va INT-08 descriptions, severity, affected requirements, fix directions

### Workflow (primary edit target)
- `workflows/fix-bug.md` — V2.1 orchestrator, can fix 2 call sites: dong 126-136 (INT-07) va dong 357-361 (INT-08)

### Pure function modules (reference — KHONG sua modules, chi sua caller)
- `bin/lib/parallel-dispatch.js` dong 66 — `mergeParallelResults({ detectiveResult, docSpecResult })` expects `{ evidenceContent: string }` shape
- `bin/lib/logic-sync.js` dong 220-249 — `runLogicSync()` returns `{ logicResult, reportResult, rulesResult, warnings }`

### Prior phase context
- `.planning/phases/34-fix-integration-wiring/34-CONTEXT.md` — Established pattern: chi sua caller, khong sua modules
- `.planning/phases/35-fix-evidence-encoding-critical-wiring/35-CONTEXT.md` — Established pattern: snapshot regeneration

### Requirements affected
- `.planning/REQUIREMENTS.md` — PROT-08 (partial), FLOW-02 (partial), FLOW-05 (partial)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `mergeParallelResults` da tested day du (4 test cases trong smoke-parallel-dispatch.test.js)
- `runLogicSync` da tested day du (3 test cases trong smoke-logic-sync.test.js)
- Converter pipeline san sang regenerate snapshots

### Established Patterns
- Workflow la markdown — edits la text substitution
- Pure function pattern — modules KHONG can thay doi, chi sua workflow goi chung
- Converter pipeline — fix-bug.md changes → chay `node bin/converter.js` → snapshots tu dong

### Integration Points
- `workflows/fix-bug.md` dong 126-136 — INT-07 fix site
- `workflows/fix-bug.md` dong 357-361 — INT-08 fix site
- `test/snapshots/` — 4 platform snapshots can regenerate

</code_context>

<specifics>
## Specific Ideas

- Day la gap closure cuoi cung cua v2.1 — scope cuc ky hep, chi 2 text edits trong 1 file
- Sau phase nay, tat ca E2E flows se hoat dong dung va milestone v2.1 hoan tat

</specifics>

<deferred>
## Deferred Ideas

None — gap closure phase, scope fixed by milestone audit

</deferred>

---

*Phase: 36-fix-workflow-wiring*
*Context gathered: 2026-03-25 via gap closure from v2.1-MILESTONE-AUDIT.md*
