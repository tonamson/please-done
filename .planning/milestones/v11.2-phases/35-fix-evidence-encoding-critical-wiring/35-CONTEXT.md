# Phase 35: Fix Evidence Encoding & Critical Wiring - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning
**Source:** Gap closure from v2.1-MILESTONE-AUDIT.md

<domain>
## Phase Boundary

Sua tat ca integration wiring gaps (INT-01 → INT-05) de E2E flows hoat dong dung: evidence encoding mismatch, CHECKPOINT roundNumber, FIX-PLAN path, createBugRecord params, SESSION.md write-back. Day la gap closure cuoi cung cua v2.1 milestone.

</domain>

<decisions>
## Implementation Decisions

### INT-01 (P0): Evidence section name encoding mismatch
- **D-01:** Dong bo section names giua evidence-protocol.js/outcome-router.js/checkpoint-handler.js va 5 agent files. Ca hai phia deu can kiem tra va dong bo.
- **D-02:** Chon 1 huong: sua module JS de nhan dang ca ASCII lan Unicode, HOAC sua agent prompts de ghi ASCII. Claude quyet dinh cach nao it tac dong nhat.

### INT-02 (P1): roundNumber undefined trong CHECKPOINT continuation
- **D-03:** Khoi tao roundNumber = 1 truoc khi goi buildContinuationContext trong fix-bug.md. Doc tu SESSION.md neu la vong tiep theo.

### INT-03 (P2): FIX-PLAN.md path resolution
- **D-04:** Doi planPath thanh `{session_dir}/FIX-PLAN.md` trong fix-bug.md — khong ghi vao project root.

### INT-04 (P2): createBugRecord params
- **D-05:** Truyen existingBugs tu Glob result truoc khi goi createBugRecord. Dung `result.content` thay vi `result.bugRecordMd`.

### INT-05 (P3): SESSION.md write-back thieu
- **D-06:** Them Read → updateSession → write-back pattern tai 2 vi tri: isHeavyAgent warning (Buoc 2) va Repro FAIL (Buoc 3).

### Documentation sync
- **D-07:** Cap nhat REQUIREMENTS.md checkboxes ORCH-01/02 va MEM-01..04 thanh [x] sau khi fix xong.

### Claude's Discretion
- So luong plans va task breakdown
- Chon encoding direction cho INT-01 (ASCII vs Unicode vs dual-accept)
- Test strategy — them tests moi hay chi verify existing tests pass
- Snapshot regeneration strategy

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Audit report (source of all gaps)
- `.planning/v2.1-MILESTONE-AUDIT.md` — Full gap analysis with INT-01..INT-06, severity, affected requirements, fix descriptions

### Workflow (primary edit target)
- `workflows/fix-bug.md` — V2.1 orchestrator workflow, can fix encoding refs, roundNumber init, FIX-PLAN path, createBugRecord call, SESSION.md write-back

### Pure function modules (may need section name changes for INT-01)
- `bin/lib/evidence-protocol.js` — validateEvidence(), parseEvidence() — section name definitions
- `bin/lib/outcome-router.js` — section lookups for root_cause/checkpoint/inconclusive outcomes
- `bin/lib/checkpoint-handler.js` — buildContinuationContext() with currentRound param
- `bin/lib/bug-memory.js` — createBugRecord({ existingBugs, ... }) signature
- `bin/lib/session-manager.js` — updateSession() for write-back pattern

### Agent files (section heading source for INT-01)
- `.claude/agents/pd-bug-janitor.md` — Agent output headings
- `.claude/agents/pd-code-detective.md` — Agent output headings
- `.claude/agents/pd-doc-specialist.md` — Agent output headings
- `.claude/agents/pd-repro-engineer.md` — Agent output headings
- `.claude/agents/pd-fix-architect.md` — Agent output headings

### Phase 34 context (prior decisions)
- `.planning/phases/34-fix-integration-wiring/34-CONTEXT.md` — Prior wiring fix decisions, established patterns

### Test files
- `test/smoke-integrity.test.js` — Existing integration tests
- `test/` — All test files for regression check

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Tat ca 7 pure function modules da ton tai va tested
- updateSession() pattern da co o nhieu vi tri trong fix-bug.md — chi can copy pattern
- validateEvidence() va parseEvidence() da export tu evidence-protocol.js

### Established Patterns
- Pure function pattern: modules nhan content qua params, return structured objects
- Workflow la markdown: edits la text substitution
- Read → process → write-back pattern cho SESSION.md
- Converter pipeline: fix-bug.md changes → regenerate snapshots

### Integration Points
- `workflows/fix-bug.md` — Primary edit target (INT-01 refs, INT-02 init, INT-03 path, INT-04 call, INT-05 write-back)
- `bin/lib/evidence-protocol.js` — May need section name update for INT-01
- `bin/lib/outcome-router.js` — May need section lookup update for INT-01
- `.claude/agents/pd-*.md` — May need heading standardization for INT-01
- `test/snapshots/` — Regenerate after fix-bug.md changes

</code_context>

<specifics>
## Specific Ideas

- Day la gap closure cuoi cung — scope rat hep, chi fix 5 integration issues
- Moi INT bug da co mo ta chi tiet, affected requirements, va fix direction trong milestone audit
- Uu tien: INT-01 (P0) > INT-02 (P1) > INT-03 = INT-04 (P2) > INT-05 (P3)

</specifics>

<deferred>
## Deferred Ideas

None — gap closure phase, scope fixed by milestone audit

</deferred>

---

*Phase: 35-fix-evidence-encoding-critical-wiring*
*Context gathered: 2026-03-25 via gap closure from v2.1-MILESTONE-AUDIT.md*
