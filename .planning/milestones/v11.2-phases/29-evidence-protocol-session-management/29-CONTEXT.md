# Phase 29: Evidence Protocol & Session Management - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Chuan hoa cach agents giao tiep qua evidence files voi format chuan 3 outcomes (ROOT CAUSE FOUND, CHECKPOINT REACHED, INVESTIGATION INCONCLUSIVE), tao session management cho phep user tiep tuc phien debug cu, va cap nhat agent files de hoat dong voi session-based paths.

</domain>

<decisions>
## Implementation Decisions

### Session Structure
- **D-01:** Moi session debug = 1 folder rieng tai `.planning/debug/S{NNN}-{slug}/`. VD: `S001-timeout-api-call/`.
- **D-02:** Session ID format: `S001` + slug (so tang dan + slug tu mo ta loi). De doc, de sort, de hien thi trong Resume UI.
- **D-03:** Moi session folder chua `SESSION.md` (metadata) + cac `evidence_*.md` files.
- **D-04:** SESSION.md co YAML frontmatter day du: id, slug, status (active|paused|resolved), created, updated, outcome (root_cause|checkpoint|inconclusive|null), va Markdown body voi mo ta + Evidence Trail checklist.

### Evidence Format
- **D-05:** Evidence files co YAML frontmatter (agent, outcome, timestamp, session) + Markdown body. Nhat quan voi SESSION.md, parseable bang parseFrontmatter() co san.
- **D-06:** 3 outcome types chuan: `root_cause`, `checkpoint`, `inconclusive`. Moi outcome co required sections rieng.
- **D-07:** ROOT CAUSE FOUND: 3 sections bat buoc — Nguyen nhan, Bang chung (file:dong cu the), De xuat.
- **D-08:** CHECKPOINT REACHED: 3 sections bat buoc — Tien do dieu tra, Cau hoi cho User, Context cho Agent tiep (files da kiem tra, gia thuyet, evidence key).
- **D-09:** INVESTIGATION INCONCLUSIVE: 2 sections bat buoc — Elimination Log (table: File/Logic | Ket qua | Ghi chu), Huong dieu tra tiep.
- **D-10:** Elimination Log dung format bang Markdown: 3 cot (File/Logic, Ket qua BINH THUONG/NGHI NGO, Ghi chu).

### Evidence Chain
- **D-11:** Orchestrator truyen session dir qua prompt khi spawn agent (prompt injection). Agent doc/ghi evidence tu session dir duoc truyen. KHONG hardcode paths trong agent files.
- **D-12:** Cap nhat 5 agent files trong Phase 29: bo hardcode `.planning/debug/evidence_*.md`, ghi huong dan agent doc tu session dir duoc truyen qua prompt.
- **D-13:** Evidence validation nhe: evidence-protocol.js export validateEvidence(), orchestrator goi sau khi agent ghi. Neu invalid, ghi warning vao SESSION.md va tiep tuc (non-blocking).

### Resume UI Flow
- **D-14:** Khi khoi dong pd:fix-bug, dung AskUserQuestion menu hien danh sach sessions active/paused + option "Tao phien moi". Nhat quan voi UX please-done.
- **D-15:** Neu khong co session nao (active/paused), bo qua menu, tao session moi ngay.
- **D-16:** Sessions da resolved KHONG hien trong Resume UI (van nam trong folder de Phase 31 Memory dung).
- **D-17:** Khi user chon tiep tuc session cu: orchestrator doc SESSION.md de biet outcome cuoi cung, tim evidence file cuoi cung co outcome, route theo outcome (root_cause → Phase 30 choices, checkpoint → hien cau hoi cho user, inconclusive → spawn vong dieu tra moi, null/paused → tiep tu agent cuoi).

### Modules
- **D-18:** `bin/lib/session-manager.js` — Pure JS module: createSession(), listSessions(), getSession(), updateSession(). Nhat quan voi 12 modules hien tai.
- **D-19:** `bin/lib/evidence-protocol.js` — Pure JS module rieng: validateEvidence(), parseEvidence(), OUTCOME_TYPES, getRequiredSections(). Tach biet concern: session != evidence format.
- **D-20:** Ca 2 modules theo pattern pure function: KHONG doc file, content truyen qua tham so, return structured object.

### Claude's Discretion
- maxTurns cho session-manager va evidence-protocol (hop ly, tinh chinh sau)
- Chi tiet error messages khi validation fail
- Unit test structure cho 2 modules moi
- Slug generation algorithm (tu mo ta loi → kebab-case)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Agent files (can cap nhat trong Phase 29)
- `.claude/agents/pd-bug-janitor.md` — Scout agent, ghi evidence_janitor.md
- `.claude/agents/pd-code-detective.md` — Builder agent, doc evidence_janitor, ghi evidence_code
- `.claude/agents/pd-doc-specialist.md` — Scout agent, doc evidence_janitor, ghi evidence_docs
- `.claude/agents/pd-repro-engineer.md` — Builder agent, doc evidence_janitor + evidence_code, ghi evidence_repro
- `.claude/agents/pd-fix-architect.md` — Architect agent, doc tat ca evidence files

### Pure function patterns (tham khao)
- `bin/lib/resource-config.js` — Module moi nhat tu Phase 28, pure function pattern
- `bin/lib/logic-sync.js` — Orchestrator pure function pattern (runLogicSync)
- `bin/lib/repro-test-generator.js` — Simple pure function pattern

### Strategy document
- `2.1_UPGRADE_DEBUG.md` — Chien luoc tong the cua milestone v2.1, Section 2 (Detective Protocols)

### Requirements
- `.planning/REQUIREMENTS.md` — PROT-01 (Resume UI), PROT-02 (3 outcomes), PROT-05 (Elimination Log), PROT-07 (evidence-as-communication)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `parseFrontmatter()` trong `bin/lib/utils.js` — Parse YAML frontmatter tu markdown, dung cho SESSION.md va evidence files
- `bin/lib/resource-config.js` — Pattern reference cho pure function module moi (Phase 28)
- `.claude/agents/*.md` (5 files) — Can cap nhat bo hardcode paths

### Established Patterns
- Pure function: KHONG doc file, content truyen qua tham so, return structured object
- Non-blocking warnings: `warnings: []` array trong return value
- TDD: Viet test truoc, module sau (601 tests hien tai)
- YAML frontmatter: parseFrontmatter() da co san trong utils.js

### Integration Points
- `.planning/debug/` — Chuyen tu flat files sang session folders
- `bin/lib/session-manager.js` — Module moi
- `bin/lib/evidence-protocol.js` — Module moi
- `.claude/agents/*.md` — Cap nhat 5 files bo hardcode paths
- `test/session-manager.test.js` — Tests moi
- `test/evidence-protocol.test.js` — Tests moi

</code_context>

<specifics>
## Specific Ideas

- Session folders giai quyet van de ghi de evidence khi mo nhieu sessions cung luc
- User muon consistency voi UX please-done (AskUserQuestion menu)
- Validation nhe, non-blocking — khong block workflow khi evidence format khong chuan

</specifics>

<deferred>
## Deferred Ideas

- ROOT CAUSE choices (Sua ngay/Len ke hoach/Tu sua) — Phase 30
- CHECKPOINT flow va Continuation Agent — Phase 30
- Parallel dispatch (Detective + DocSpec song song) — Phase 30
- Bug history recall va regression alerts — Phase 31
- `.planning/bugs/INDEX.md` auto-generation — Phase 31
- Orchestrator workflow loop — Phase 32

</deferred>

---

*Phase: 29-evidence-protocol-session-management*
*Context gathered: 2026-03-24*
