# Phase 34: Fix Integration Wiring - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning
**Source:** Gap closure from v2.1-MILESTONE-AUDIT.md

<domain>
## Phase Boundary

Sua call signatures va them enforcement points de tat ca modules duoc goi dung tu workflow fix-bug.md. Day la gap closure phase — tat ca modules da ton tai va tested, chi can fix wiring giua modules va workflow.

</domain>

<decisions>
## Implementation Decisions

### BUG-1: mergeParallelResults param names (FLOW-02, PROT-08)
- **D-01:** Sua `workflows/fix-bug.md` dong 130: doi `{ detective: detectiveResult, docSpec: docSpecResult }` thanh `{ detectiveResult, docSpecResult }` de khop voi `parallel-dispatch.js` dong 66.

### BUG-2: buildContinuationContext call signature (PROT-06)
- **D-02:** Sua `workflows/fix-bug.md` dong 225: doi positional args `(content, userAnswer, roundNumber)` thanh object `{ evidencePath, userAnswer, sessionDir, currentRound, agentName }` de khop voi `checkpoint-handler.js` dong 65.

### BUG-3: prepareSelfFix return fields (PROT-03)
- **D-03:** Sua `workflows/fix-bug.md` dong 215: doi `suggestedSteps` thanh `filesForReview` + `resumeHint` de khop voi `outcome-router.js` dong 145 return `{ action, sessionUpdate, summary, filesForReview, resumeHint, warnings }`.

### BUG-4: prepareFixNow return fields (FLOW-05)
- **D-04:** Sua `workflows/fix-bug.md` dong 207, 266-269: doi `fixInstructions, targetFiles, rootCause` thanh `action, reusableModules, evidence, suggestion, commitPrefix` de khop voi `outcome-router.js` dong 85-93.

### ORCH-03: Heavy Lock enforcement
- **D-05:** Them `isHeavyAgent()` check vao Buoc 2 cua fix-bug.md truoc khi spawn Detective. Neu Detective la heavy agent va da co heavy task dang chay → ghi warning va doi.

### ORCH-04: Auto-degrade enforcement
- **D-06:** Them `shouldDegrade()` call trong error handler cua Buoc 2 khi agent spawn fail. Neu shouldDegrade() tra true → chuyen sang sequential execution, ghi warning.

### PROT-07/PROT-08: DocSpec evidence chain
- **D-07:** Cap nhat `pd-doc-specialist.md` process de them buoc doc `evidence_janitor.md` explicitly — hien tai chi doc tu "trieu chung" nhung khong reference file path cu the.

### Claude's Discretion
- So luong plans va task breakdown
- Test strategy cho wiring fixes
- Error handling chi tiet cho Heavy Lock va Auto-degrade

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Audit report (source of all gaps)
- `.planning/v2.1-MILESTONE-AUDIT.md` — Full gap analysis, 4 BUGs, 2 orphaned functions, 2 partial wirings

### Workflow (can sua)
- `workflows/fix-bug.md` — V2.1 orchestrator, can fix 4 call signature bugs + them 2 enforcement calls

### Pure function modules (reference — KHONG sua modules, chi sua caller)
- `bin/lib/parallel-dispatch.js` dong 66 — `mergeParallelResults({ detectiveResult, docSpecResult })` expected signature
- `bin/lib/checkpoint-handler.js` dong 65 — `buildContinuationContext({ evidencePath, userAnswer, sessionDir, currentRound, agentName })` expected signature
- `bin/lib/outcome-router.js` dong 85-93 — `prepareFixNow` returns `{ action, reusableModules, evidence, suggestion, commitPrefix, warnings }`
- `bin/lib/outcome-router.js` dong 145 — `prepareSelfFix` returns `{ action, sessionUpdate, summary, filesForReview, resumeHint, warnings }`
- `bin/lib/resource-config.js` — `isHeavyAgent()`, `shouldDegrade()` — functions to call from workflow

### Agent file (can sua)
- `.claude/agents/pd-doc-specialist.md` — Can them buoc doc evidence_janitor.md

### Test files
- `test/smoke-integrity.test.js` — Can them tests cho new wiring

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Tat ca modules da ton tai, tested, exported — chi can fix caller side
- `isHeavyAgent()` va `shouldDegrade()` da co trong resource-config.js voi unit tests

### Established Patterns
- Workflow la markdown — edits la text, khong phai code compilation
- Pure function pattern — modules KHONG can thay doi, chi sua cach workflow goi chung
- Converter pipeline — fix-bug.md thay doi → can regenerate snapshots

### Integration Points
- `workflows/fix-bug.md` — primary edit target (4 bugs + 2 enforcement calls)
- `.claude/agents/pd-doc-specialist.md` — secondary edit (evidence chain)
- `test/smoke-integrity.test.js` — verification
- `test/snapshots/` — regenerate after fix-bug.md changes

</code_context>

<specifics>
## Specific Ideas

- Day la gap closure — scope rat hep, chi fix wiring
- Khong tao module moi, khong them function moi
- Chi sua call sites trong fix-bug.md va agent prompt trong pd-doc-specialist.md

</specifics>

<deferred>
## Deferred Ideas

None — gap closure phase, scope fixed by audit

</deferred>

---

*Phase: 34-fix-integration-wiring*
*Context gathered: 2026-03-25 via gap closure from v2.1-MILESTONE-AUDIT.md*
