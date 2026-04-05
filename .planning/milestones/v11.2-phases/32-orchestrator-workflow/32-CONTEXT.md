# Phase 32: Orchestrator Workflow - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

5-buoc execution loop hoan chinh cho pd:fix-bug: Janitor → Detective+DocSpec → Repro → Architect → Fix+Commit. Tich hop tat ca modules tu Phase 28-31 vao workflow orchestrator duy nhat, thay the fix-bug.md v1.5.

</domain>

<decisions>
## Implementation Decisions

### Workflow File Strategy
- **D-01:** Rewrite fix-bug.md thanh orchestrator moi. Giu lai preamble (purpose, required_reading) va Buoc 0.5 (phan tich bug). Thay toan bo Buoc 1-10 bang 5 buoc orchestrator.
- **D-02:** Backup fix-bug.md hien tai thanh `workflows/fix-bug-v1.5.md` truoc khi rewrite. Phase 33 dung lam reference/fallback cho --single mode.
- **D-03:** Ten file va invocation giu nguyen: `fix-bug.md`, user van goi `pd:fix-bug` nhu cu.

### Step Transitions & Error Handling
- **D-04:** Fail-forward voi warning: agent fail → ghi warning vao SESSION.md, tiep tuc voi evidence co san. Chi STOP khi Janitor (Buoc 1) fail vi khong co trieu chung.
- **D-05:** Progressive disclosure bang milestone banners: moi buoc hien 1 banner ngan ("Dang thu thap trieu chung...", "Dang phan tich code..."). Chi tiet agent an. Ket qua cuoi hien day du.
- **D-06:** DocSpec fail nhung Detective thanh cong → tiep tuc voi evidence_code.md. DocSpec la bo sung, khong block workflow. Nhat quan voi D-12 Phase 30.

### V1.5 Logic Reuse
- **D-07:** Claude's Discretion — Claude tu chon cach tai su dung 3 modules v1.5 (debug-cleanup.js, logic-sync.js, regression-analyzer.js) trong Buoc 5. Co the goi truc tiep hoac wrap tuy code hien tai.
- **D-08:** Commit message format: `fix([LOI]): mo ta`. Giu nguyen convention v1.5.

### Session Lifecycle
- **D-09:** Tao session ngay dau Buoc 1, sau Resume UI. User chon "Tao phien moi" hoac khong co session cu → createSession() → Janitor ghi evidence vao session dir.
- **D-10:** Tao bug record SAU user verify fix thanh cong (nhat quan voi D-09 Phase 31). Flow: commit fix → test pass → user xac nhan → createBugRecord() → buildIndex() → ghi INDEX.md.
- **D-11:** Session resolved SAU bug record + INDEX rebuild. Flow day du: fix commit → user verify → tao bug record → rebuild INDEX.md → updateSession(status=resolved).

### Claude's Discretion
- So luong plans va task breakdown cho Phase 32
- Chi tiet Buoc 0.5 giu nguyen bao nhieu tu v1.5
- Error message format cho milestone banners
- Unit test strategy cho orchestrator workflow (neu can)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Workflow hien tai (can rewrite)
- `workflows/fix-bug.md` — V1.5 single-agent workflow, se duoc backup va rewrite
- `workflows/fix-bug-v1.5.md` — (se tao) Backup cua v1.5 cho Phase 33 fallback

### Agent files (Phase 28, cap nhat Phase 29, 31)
- `.claude/agents/pd-bug-janitor.md` — Scout/haiku, Buoc 1
- `.claude/agents/pd-code-detective.md` — Builder/sonnet, Buoc 2
- `.claude/agents/pd-doc-specialist.md` — Scout/haiku, Buoc 2 (song song voi Detective)
- `.claude/agents/pd-repro-engineer.md` — Builder/sonnet, Buoc 3
- `.claude/agents/pd-fix-architect.md` — Architect/opus, Buoc 4

### Pure function modules (Phase 28-31)
- `bin/lib/resource-config.js` — getModelForTier(), getAgentConfig(), getParallelLimit(), shouldDegrade()
- `bin/lib/session-manager.js` — createSession(), listSessions(), getSession(), updateSession()
- `bin/lib/evidence-protocol.js` — validateEvidence(), parseEvidence(), OUTCOME_TYPES, getRequiredSections()
- `bin/lib/outcome-router.js` — ROOT CAUSE 3 lua chon logic
- `bin/lib/checkpoint-handler.js` — CHECKPOINT flow, Continuation Agent max 2 vong
- `bin/lib/parallel-dispatch.js` — Detective+DocSpec song song, partial failure
- `bin/lib/bug-memory.js` — createBugRecord(), searchBugs(), buildIndex()

### V1.5 modules (tai su dung trong Buoc 5)
- `bin/lib/debug-cleanup.js` — scanDebugMarkers(), matchSecurityWarnings()
- `bin/lib/logic-sync.js` — detectLogicChanges(), updateReportDiagram(), suggestClaudeRules(), runLogicSync()
- `bin/lib/regression-analyzer.js` — Phan tich dependency/call chain

### Prior phase contexts (locked decisions)
- `.planning/phases/28-agent-infrastructure-resource-rules/28-CONTEXT.md` — Agent infrastructure, tier/model, resource rules
- `.planning/phases/29-evidence-protocol-session-management/29-CONTEXT.md` — Evidence format, session management, evidence chain
- `.planning/phases/30-detective-interactions/30-CONTEXT.md` — ROOT CAUSE choices, CHECKPOINT flow, parallel dispatch
- `.planning/phases/31-project-memory-regression-detection/31-CONTEXT.md` — Bug memory, regression detection

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- 7 pure function modules (resource-config, session-manager, evidence-protocol, outcome-router, checkpoint-handler, parallel-dispatch, bug-memory) — tat ca san sang de tich hop
- 3 v1.5 modules (debug-cleanup, logic-sync, regression-analyzer) — pure functions, goi truc tiep
- 5 agent files tai .claude/agents/ — da co model, tools, maxTurns config

### Established Patterns
- Pure function pattern: modules KHONG doc file, content truyen qua tham so (D-03 Phase 31, D-20 Phase 29)
- Evidence chain qua prompt injection: orchestrator truyen session dir path khi spawn agent (D-11 Phase 29)
- Parallel limit 2: resource-config.js getParallelLimit() tra 2 (D-06 Phase 28)
- Non-blocking validation: ghi warning thay vi throw (D-13 Phase 29)

### Integration Points
- fix-bug.md la entry point — skill file `commands/pd/fix-bug.md` tro den `workflows/fix-bug.md`
- Resume UI dung AskUserQuestion voi listSessions() (D-14 Phase 29)
- Agent spawn dung Agent tool voi agent name (D-03 Phase 28)
- Converter pipeline can cap nhat khi fix-bug.md thay doi (D-14 Phase 28)

</code_context>

<specifics>
## Specific Ideas

- User tin tuong Claude quyet dinh ky thuat (confirmed across multiple phases)
- Flow hoan chinh: Resume UI → Session → Janitor → Detective+DocSpec → Repro → Architect → Fix+Commit → User verify → Bug record → INDEX rebuild → Session resolved

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 32-orchestrator-workflow*
*Context gathered: 2026-03-25*
