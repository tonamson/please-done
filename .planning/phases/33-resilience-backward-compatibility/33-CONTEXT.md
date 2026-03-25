# Phase 33: Resilience & Backward Compatibility - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Workflow xu ly duoc moi truong hop loi va tuong thich nguoc voi v1.5 single-agent mode. INCONCLUSIVE loop-back (max 3 vong) quay lai Buoc 2 voi Elimination Log + thong tin moi tu user. Single-agent fallback khi thieu agent configs hoac truyen --single flag. Toan bo tests hien tai van pass.

</domain>

<decisions>
## Implementation Decisions

### INCONCLUSIVE Loop-back (FLOW-06)
- **D-01:** Them `buildInconclusiveContext()` vao `bin/lib/outcome-router.js` — pure function, trich xuat Elimination Log tu evidence_architect.md, tao prompt cho Buoc 2 tiep theo. Tai su dung pattern tuong tu `buildContinuationContext()` cua checkpoint-handler.js.
- **D-02:** Theo doi so vong qua field `inconclusive_rounds` trong SESSION.md. Orchestrator kiem tra truoc moi lan loop, tang counter sau moi vong. Max 3 vong.
- **D-03:** Khi dat max 3 vong: pause session + hien full Elimination Log cho user. Tuong tu escalate pattern cua checkpoint-handler (D-09 Phase 30) nhung max la 3 thay vi 2.
- **D-04:** User bo sung thong tin moi qua AskUserQuestion free-text. Thong tin ghi vao session dir file `user_input_round_{N}.md`. Agent Buoc 2 nhan file nay + Elimination Log qua prompt injection.
- **D-05:** Flow INCONCLUSIVE loop-back: evidence_architect outcome=inconclusive → hien Elimination Log → AskUserQuestion free-text → ghi user_input_round_N.md → tang inconclusive_rounds trong SESSION.md → quay lai Buoc 2 (Detective+DocSpec) voi context moi.

### Single-agent Fallback (FLOW-07)
- **D-06:** Kiem tra su ton tai 5 agent files tai `.claude/agents/pd-*.md` luc workflow khoi dong (truoc Resume UI). Thieu bat ky file nao → auto-fallback.
- **D-07:** Parse `--single` flag tu arguments dau workflow. Neu co → skip toan bo orchestrator, load fix-bug-v1.5.md content.
- **D-08:** Auto-fallback UX: hien warning banner 1 dong ("Thieu agent configs, dung che do don agent") roi chay v1.5 workflow. Khong hoi user — fail silently vao safe mode.
- **D-09:** Implementation: Buoc 0 cua fix-bug.md them check block. Neu --single hoac thieu agents → redirect sang fix-bug-v1.5.md logic. KHONG spawn process moi — inline v1.5 steps.

### Progressive Disclosure Completion
- **D-10:** Phase 32 da implement progressive disclosure banners (D-05 Phase 32). Phase 33 chi can dam bao INCONCLUSIVE loop cung hien banner nhat quan ("Vong {N}/3: Dang dieu tra them voi thong tin moi...").

### Test & Converter Pipeline
- **D-11:** Test outcome-router.js additions (buildInconclusiveContext) + unit test cho agent detection logic.
- **D-12:** Chay toan bo test suite dam bao 601+ tests van pass. Cap nhat snapshots neu fix-bug.md thay doi.

### Claude's Discretion
- So luong plans va task breakdown cho Phase 33
- Chi tiet implementation cua agent file detection (glob pattern vs hardcoded list)
- Error messages khi max loop reached
- Unit test structure va so luong test cases
- Converter pipeline snapshot update strategy

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Workflow files (can sua)
- `workflows/fix-bug.md` — V2.1 orchestrator workflow, can them INCONCLUSIVE loop-back va --single detection
- `workflows/fix-bug-v1.5.md` — V1.5 backup, dung lam fallback content cho --single mode

### Pure function modules (can sua/them)
- `bin/lib/outcome-router.js` — Can them buildInconclusiveContext() cho INCONCLUSIVE loop-back
- `bin/lib/checkpoint-handler.js` — Pattern reference cho buildContinuationContext() va MAX_CONTINUATION_ROUNDS
- `bin/lib/session-manager.js` — updateSession() de cap nhat inconclusive_rounds
- `bin/lib/evidence-protocol.js` — parseEvidence() de doc INCONCLUSIVE outcome

### Agent files (kiem tra ton tai)
- `.claude/agents/pd-bug-janitor.md` — 1 trong 5 files can check
- `.claude/agents/pd-code-detective.md`
- `.claude/agents/pd-doc-specialist.md`
- `.claude/agents/pd-repro-engineer.md`
- `.claude/agents/pd-fix-architect.md`

### Prior phase contexts (locked decisions)
- `.planning/phases/30-detective-interactions/30-CONTEXT.md` — D-09: max 2 vong continuation (CHECKPOINT, khac voi INCONCLUSIVE max 3)
- `.planning/phases/32-orchestrator-workflow/32-CONTEXT.md` — D-02: fix-bug-v1.5.md da backup, D-04: fail-forward pattern, D-05: progressive disclosure

### Requirements
- `.planning/REQUIREMENTS.md` — FLOW-06 (INCONCLUSIVE loop-back), FLOW-07 (single-agent fallback)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `checkpoint-handler.js`: `buildContinuationContext()` + `MAX_CONTINUATION_ROUNDS` — pattern truc tiep cho INCONCLUSIVE loop-back
- `outcome-router.js`: Da co ROOT CAUSE routing — them INCONCLUSIVE routing vao day
- `session-manager.js`: `updateSession()` — dung de cap nhat `inconclusive_rounds` counter
- `evidence-protocol.js`: `parseEvidence()` — doc outcome type va Elimination Log section
- `fix-bug-v1.5.md`: 438 dong — full v1.5 workflow, san sang lam fallback content

### Established Patterns
- Pure function: KHONG doc file, content truyen qua tham so, return structured object voi warnings array
- Counter tracking: checkpoint-handler dung roundNumber tham so, SESSION.md luu state
- Prompt injection: session dir + context truyen qua prompt khi spawn agent
- Fail-forward: loi chi tao WARNING, khong block workflow

### Integration Points
- `fix-bug.md` dong 214-218: INCONCLUSIVE stub hien tai chi pause, can thay bang loop-back logic
- `fix-bug.md` dau file: can them Buoc 0 check --single va agent files
- Converter pipeline: fix-bug.md thay doi → can update snapshots
- Test suite: 26 test files, 601+ tests hien tai

</code_context>

<specifics>
## Specific Ideas

- INCONCLUSIVE loop-back pattern tuong tu checkpoint continuation nhung max 3 thay vi 2 va quay ve Buoc 2 (khong phai cung agent)
- Single-agent fallback la safety net — khong can phuc tap, chi can redirect sang v1.5 content
- User tin tuong Claude quyet dinh ky thuat (confirmed across multiple phases)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 33-resilience-backward-compatibility*
*Context gathered: 2026-03-25*
