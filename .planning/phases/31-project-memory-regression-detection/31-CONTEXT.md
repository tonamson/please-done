# Phase 31: Project Memory & Regression Detection - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

He thong nho lich su bug va canh bao regression truoc khi fix. Janitor luc lai .planning/bugs/ tim bug tuong tu, orchestrator canh bao regression khi khop >= 2/3 tieu chi, Architect kiem tra fix moi khong pha vo fix cu. Tu dong tao va cap nhat INDEX.md.

</domain>

<decisions>
## Implementation Decisions

### Bug Record Format
- **D-01:** Moi bug = 1 file BUG-{NNN}.md trong `.planning/bugs/`. Ten file theo thu tu tang dan (BUG-001.md, BUG-002.md).
- **D-02:** YAML frontmatter toi thieu: `file`, `function`, `error_message`, `session_id`, `resolved_date`. Body: 1-2 dong mo ta nguyen nhan + fix. Khong bloat.
- **D-03:** Module moi `bin/lib/bug-memory.js` — pure function, tach biet concern voi session-manager va evidence-protocol. Exports: createBugRecord(), searchBugs(), buildIndex().

### Keyword Matching Strategy
- **D-04:** 3-field scoring: so khop file path, function name, error message. Moi truong khop = 1 diem. Score >= 2/3 = regression alert (MEM-02).
- **D-05:** Case-insensitive substring matching: file path dung includes(), function dung exact match (case-insensitive), error message dung substring match (case-insensitive).
- **D-06:** Ket qua tim bug tuong tu ghi trong evidence_janitor.md — section "Bug tuong tu". Downstream agents (Detective, Architect) thay qua evidence chain. Khong tao file rieng.

### Regression Alert UX
- **D-07:** Claude's Discretion — Claude tu quyet dinh UX hien thi regression alert (blocking vs non-blocking, muc chi tiet) phu hop voi flow hien tai.

### Architect Double-Check
- **D-08:** Claude's Discretion — Claude tu chon approach de Architect kiem tra fix moi khong pha vo fix cu (prompt injection vs auto-test). Phu hop voi do phuc tap cua project.

### Bug Lifecycle
- **D-09:** Bug record tao SAU KHI user verify fix thanh cong (khong phai sau commit). Dam bao chi ghi bug that su da duoc fix.
- **D-10:** INDEX.md tu dong rebuild moi khi tao/cap nhat bug record. buildIndex() generate lai toan bo tu tat ca BUG-*.md files. Luon dong bo.
- **D-11:** Bug records giu nguyen vinh vien trong .planning/bugs/. Khong archive, khong xoa. INDEX.md phan biet resolved/active.

### Claude's Discretion
- Regression alert UX (D-07): blocking vs non-blocking, format hien thi
- Architect double-check approach (D-08): prompt-based vs test-based
- Unit test structure cho bug-memory.js
- Error handling khi .planning/bugs/ chua ton tai (tao tu dong)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Evidence & Session (Phase 29 output)
- `bin/lib/evidence-protocol.js` — OUTCOME_TYPES, validateEvidence(), parseEvidence()
- `bin/lib/session-manager.js` — createSession(), listSessions(), getSession(), updateSession()

### Agent files (da cap nhat Phase 29)
- `.claude/agents/pd-bug-janitor.md` — Scout agent, ghi evidence_janitor.md — CAN CAP NHAT de ghi section "Bug tuong tu"
- `.claude/agents/pd-fix-architect.md` — Architect agent — CAN CAP NHAT de nhan related bugs info

### Existing regression module (KHAC voi bug history)
- `bin/lib/regression-analyzer.js` — Phan tich dependency/call chain (v1.5). KHONG phai bug history — khong trung lap voi bug-memory.js

### Pure function patterns
- `bin/lib/resource-config.js` — Module moi nhat, pure function pattern
- `bin/lib/logic-sync.js` — Orchestrator pure function pattern

### Strategy document
- `2.1_UPGRADE_DEBUG.md` — Chien luoc tong the v2.1, Section 4 (Project Memory)

### Requirements
- `.planning/REQUIREMENTS.md` — MEM-01 (keyword matching), MEM-02 (regression alert), MEM-03 (double-check), MEM-04 (INDEX.md)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `parseFrontmatter()` trong `bin/lib/utils.js` — Parse YAML frontmatter tu bug files
- `assembleMd()` trong `bin/lib/utils.js` — Assemble YAML + body thanh markdown
- `session-manager.js` — Pattern reference cho folder-based storage va slug generation
- `evidence-protocol.js` — Pattern reference cho structured output voi warnings array

### Established Patterns
- Pure function: KHONG doc file, content truyen qua tham so, return structured object
- Non-blocking warnings: `warnings: []` array trong return value
- TDD: Viet test truoc, module sau (601+ tests hien tai)
- YAML frontmatter: parseFrontmatter() da co san trong utils.js
- Naming: `lowercase-with-hyphens.js`, camelCase functions

### Integration Points
- `.planning/bugs/` directory: Tao moi (chua ton tai)
- `bin/lib/bug-memory.js`: Module moi
- `test/bug-memory.test.js`: Tests moi
- `.claude/agents/pd-bug-janitor.md`: Cap nhat prompt de ghi section "Bug tuong tu"
- `.claude/agents/pd-fix-architect.md`: Cap nhat prompt de nhan related bugs
- `.planning/bugs/INDEX.md`: File moi, auto-generated

</code_context>

<specifics>
## Specific Ideas

- User muon "tu tim giai phap tot nhat cho repo" — tin tuong Claude quyet dinh ky thuat cho regression alert UX va Architect double-check
- Bug record chi duoc tao SAU verify pass — dam bao chat luong data
- Ket qua bug tuong tu nam trong evidence_janitor.md — nhat quan voi evidence chain, khong tao them file moi
- regression-analyzer.js (v1.5) la module KHAC — phan tich dependency, khong phai bug history. Khong trung lap

</specifics>

<deferred>
## Deferred Ideas

- Agent memory cross-session (MEM-05) — v2.2
- AI-powered bug similarity scoring — Out of Scope (can embedding API)
- Auto-fix tu lich su bug — Out of Scope (nguy hiem)
- Orchestrator workflow loop tong the — Phase 32
- Loop-back khi INCONCLUSIVE — Phase 33

</deferred>

---

*Phase: 31-project-memory-regression-detection*
*Context gathered: 2026-03-25*
