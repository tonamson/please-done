# Phase 43: Wire INDEX.md vao Pipeline - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Ket noi generateIndex() vao workflow thuc te — INDEX.md duoc tao/cap nhat tu dong sau moi lan chay pd:research pipeline. Unblock Strategy Injection (doc INDEX.md de inject research context) va Fact Checker cross-validate (doc INDEX.md de tim files cung topic).

</domain>

<decisions>
## Implementation Decisions

### Diem goi generateIndex()
- **D-01:** Goi generateIndex() 1 LAN duy nhat — SAU Fact Checker hoan tat (cuoi pipeline). INDEX.md phan anh trang thai da xac minh.
- **D-02:** Scan CA HAI thu muc internal/ + external/ — INDEX.md la chi muc toan bo research, khong chi source type cua lan chay hien tai.

### Xu ly 2 module trung
- **D-03:** Dung `index-generator.js` lam source of truth cho generateIndex() — module chuyen biet co parseResearchFiles + buildIndexRow.
- **D-04:** `research-store.js` giu export generateIndex nhung DELEGATE sang index-generator.js noi bo — backward compatible, khong break callers hien co.

### Orchestration trong workflow
- **D-05:** Tao CLI script `bin/update-research-index.js` — doc tat ca .md trong internal/ + external/, goi parseResearchFiles() tu index-generator.js, goi generateIndex(), ghi INDEX.md.
- **D-06:** Workflow `workflows/research.md` chi can them 1 buoc cuoi: `node bin/update-research-index.js` sau Fact Checker xong. Khong can agent doc files — CLI script lo het.
- **D-07:** Dung parseResearchFiles() tu index-generator.js de parse frontmatter — khong tu parse lai.

### Carrying Forward
- generateIndex() format tu Phase 39 D-09 — locked
- INDEX.md regenerate toan bo moi lan (Phase 39 D-11) — locked
- Strategy Injection doc INDEX.md + keyword match (Phase 41 D-10-13) — locked, da wired vao write-code.md + plan.md
- Fact Checker cross-validate qua INDEX.md (Phase 42 D-10) — locked

### Claude's Discretion
- Error handling cho edge cases (thu muc rong, file khong co frontmatter)
- Test data fixtures
- So luong plans va task breakdown

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Index generation (source of truth)
- `bin/lib/index-generator.js` — generateIndex, parseResearchFiles, buildIndexRow — module chinh de dung
- `bin/lib/research-store.js` — generateIndex hien co (se delegate sang index-generator.js)

### Workflow (modify)
- `workflows/research.md` — Them buoc goi CLI script cuoi pipeline

### Tests (verify)
- `test/smoke-index-generator.test.js` — Tests cho generateIndex, parseResearchFiles
- `test/smoke-research-store.test.js` — Tests cho generateIndex trong research-store

### Strategy Injection (verify hoat dong)
- `workflows/write-code.md` — research_injection section doc INDEX.md
- `workflows/plan.md` — research_injection section doc INDEX.md

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `index-generator.js:generateIndex()` — Tao INDEX.md content tu entries array
- `index-generator.js:parseResearchFiles()` — Parse array {filename, content} thanh entries voi frontmatter
- `index-generator.js:buildIndexRow()` — Format 1 dong trong bang INDEX
- `research-store.js:generateIndex()` — Ban duplicate, se delegate

### Established Patterns
- Pure function pattern: modules return strings, caller ghi file
- CLI scripts trong `bin/` goi library functions tu `bin/lib/`
- Workflow files la prompt cho AI agent, goi CLI qua Bash

### Integration Points
- `workflows/research.md` Buoc 3 (sau Fact Checker) — them buoc goi CLI
- `research-store.js` exports — delegate generateIndex sang index-generator.js
- `.planning/research/INDEX.md` — file output duoc doc boi Strategy Injection va Fact Checker

</code_context>

<specifics>
## Specific Ideas

Khong co yeu cau dac biet — su dung standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 43-wire-index-md-pipeline*
*Context gathered: 2026-03-26*
