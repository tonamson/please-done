# Phase 30: Detective Interactions - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

User tuong tac voi orchestrator qua 3 nhanh ket qua (ROOT CAUSE choices, CHECKPOINT flow + Continuation Agent, parallel dispatch Detective+DocSpec). Tao cac module/logic blocks ma orchestrator (Phase 32) se dung.

</domain>

<decisions>
## Implementation Decisions

### ROOT CAUSE Choices (PROT-03)
- **D-01:** Khi ROOT CAUSE duoc tim thay, orchestrator hien 3 lua chon qua AskUserQuestion: "Sua ngay", "Len ke hoach", "Tu sua".
- **D-02:** "Sua ngay" → Orchestrator truc tiep sua code, doc evidence_architect.md, chay test, commit [LOI]. Tai su dung logic v1.5 (debug-cleanup.js, logic-sync.js, regression-analyzer.js). KHONG spawn them agent.
- **D-03:** "Len ke hoach" → Tao FIX-PLAN.md trong session dir: root cause, files can sua, test can viet, risk assessment. User xem + sua tay truoc khi chay.
- **D-04:** "Tu sua" → Cap nhat SESSION.md status=paused, hien root cause summary + danh sach files can xem. User tu sua, sau do chay lai pd:fix-bug de verify qua Resume UI.

### CHECKPOINT Flow (PROT-04)
- **D-05:** Khi agent ghi CHECKPOINT REACHED, orchestrator doc evidence file, trich xuat "Cau hoi cho User" section, hien qua AskUserQuestion menu voi cac lua chon goi y.
- **D-06:** Truyen cau tra loi cua user cho agent tiep theo qua prompt injection (nhat quan voi D-11 Phase 29 — session dir qua prompt).
- **D-07:** Agent tiep theo chi nhan evidence cuoi (cua agent gui checkpoint) + cau tra loi user. KHONG doc toan bo evidence chain — tiet kiem token.

### Continuation Agent (PROT-06)
- **D-08:** Continuation Agent = spawn lai CUNG loai agent voi context moi. VD: Detective checkpoint → spawn Detective moi. Don gian, de hieu, de debug.
- **D-09:** Toi da 2 vong continuation. Sau 2 lan continuation ma van checkpoint → escalate: hien thong bao "Can nguoi xem xet", pause session. Tranh loop vo han, tiet kiem token.
- **D-10:** Continuation Agent nhan qua prompt: (1) evidence file cuoi, (2) cau tra loi user, (3) session dir path, (4) vong hien tai (1 hoac 2).

### Parallel Dispatch (PROT-08)
- **D-11:** Detective (builder/sonnet) va DocSpec (scout/haiku) chay song song. Ca 2 doc evidence_janitor.md (chi doc, khong xung dot). Ghi ra evidence_code.md va evidence_docs.md rieng.
- **D-12:** Neu 1 agent fail: ghi warning vao SESSION.md, tiep tuc voi evidence tu agent con lai. DocSpec la bo sung, khong bat buoc — workflow khong block.
- **D-13:** Evidence tu 2 agent GIU TACH RIENG — evidence_code.md va evidence_docs.md la 2 files doc lap. Repro va Architect doc ca 2. KHONG can merge logic.

### Claude's Discretion
- Module structure cho outcome-router logic (pure function hay workflow markdown)
- Unit test cases cu the cho tung interaction path
- Error messages khi escalate sau 2 vong continuation
- FIX-PLAN.md template format

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Evidence & Session (Phase 29 output)
- `bin/lib/evidence-protocol.js` — OUTCOME_TYPES, validateEvidence(), parseEvidence(), getRequiredSections()
- `bin/lib/session-manager.js` — createSession(), listSessions(), getSession(), updateSession()

### Agent files (da cap nhat Phase 29)
- `.claude/agents/pd-bug-janitor.md` — Scout agent, ghi evidence_janitor.md tu session dir
- `.claude/agents/pd-code-detective.md` — Builder agent, doc evidence_janitor, ghi evidence_code
- `.claude/agents/pd-doc-specialist.md` — Scout agent, doc evidence_janitor, ghi evidence_docs
- `.claude/agents/pd-repro-engineer.md` — Builder agent, doc evidence chain, ghi evidence_repro
- `.claude/agents/pd-fix-architect.md` — Architect agent, doc tat ca evidence

### Resource management (Phase 28 output)
- `bin/lib/resource-config.js` — getModelForTier(), getAgentConfig(), getParallelLimit()

### v1.5 reusable modules
- `bin/lib/debug-cleanup.js` — scanDebugMarkers(), matchSecurityWarnings()
- `bin/lib/logic-sync.js` — runLogicSync() orchestrator pattern
- `bin/lib/regression-analyzer.js` — phan tich regression
- `bin/lib/repro-test-generator.js` — tao Red Test tu evidence

### Strategy document
- `2.1_UPGRADE_DEBUG.md` — Chien luoc tong the v2.1, Section 3 (Detective Interactions)

### Requirements
- `.planning/REQUIREMENTS.md` — PROT-03 (ROOT CAUSE choices), PROT-04 (CHECKPOINT flow), PROT-06 (Continuation Agent), PROT-08 (parallel dispatch)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `evidence-protocol.js`: parseEvidence() co the dung de trich xuat outcome type va required sections tu evidence files
- `session-manager.js`: updateSession() de cap nhat status (active→paused, resolved)
- `resource-config.js`: getAgentConfig() de lay model/tools khi spawn agents
- `parseFrontmatter()` trong utils.js: parse YAML frontmatter tu evidence files

### Established Patterns
- Pure function: KHONG doc file, content truyen qua tham so, return structured object
- Non-blocking warnings: `warnings: []` array trong return value
- Prompt injection: session dir + context truyen qua prompt khi spawn agent (D-11 Phase 29)
- AskUserQuestion: UX chuan cua please-done cho moi interaction voi user

### Integration Points
- Outcome routing logic se duoc Phase 32 (Orchestrator Workflow) goi
- FIX-PLAN.md template can tao trong session dir
- Continuation Agent logic can biet vong hien tai de enforce max 2

</code_context>

<specifics>
## Specific Ideas

- Nhat quan UX: moi tuong tac voi user qua AskUserQuestion — giong Resume UI va ROOT CAUSE choices
- Token efficiency: Continuation Agent chi nhan evidence cuoi + cau tra loi, khong doc lai toan bo
- Fail-safe: DocSpec fail khong block workflow — la bonus info, khong phai critical path

</specifics>

<deferred>
## Deferred Ideas

- Orchestrator workflow loop tong the (5 buoc) — Phase 32
- Loop-back khi INCONCLUSIVE (max 3 vong) — Phase 33
- Single-agent fallback mode (--single flag) — Phase 33
- Bug history recall truoc khi dieu tra — Phase 31
- Progressive disclosure (an chi tiet agent spawning) — Phase 32

</deferred>

---

*Phase: 30-detective-interactions*
*Context gathered: 2026-03-25*
