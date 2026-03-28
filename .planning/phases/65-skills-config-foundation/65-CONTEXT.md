# Phase 65: Skills + Config Foundation - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Dich 14 skill files trong `commands/pd/*.md` va cap nhat `CLAUDE.md` sang tieng Anh, sau do regenerate snapshot cho 4 platforms va xac nhan smoke snapshot test pass. Phase nay chi thay doi ngon ngu/noi dung van ban, khong thay doi logic workflow, command names, hay cau truc parser.

</domain>

<decisions>
## Implementation Decisions

### Translation Scope and Safety
- **D-01:** Dich toan bo 14 skill files trong `commands/pd/` va `CLAUDE.md` theo roadmap, khong mo rong sang workflows/rules/references (cac phan do thuoc phases 66-68).
- **D-02:** Giu nguyen frontmatter keys, XML tags, placeholders (`$ARGUMENTS`, `@...`) va command semantics; chi dich mo ta/noi dung nguyen van.
- **D-03:** Khong doi ten file, khong doi duong dan, khong doi file organization de tranh pha vo converter va snapshot mapping hien tai.

### Translation Order and Batching
- **D-04:** Thuc hien theo 2 batch nhu roadmap/plan: 7 skills nho truoc (`scan`, `init`, `conventions`, `what-next`, `update`, `fetch-doc`, `research`), 7 skills lon sau (`plan`, `write-code`, `test`, `fix-bug`, `audit`, `complete-milestone`, `new-milestone`).
- **D-05:** Cap nhat `CLAUDE.md` trong batch dau de dong bo language convention truoc khi regenerate snapshots.

### Terminology and Consistency
- **D-06:** Chuan hoa thuat ngu tieng Anh giua cac skill files: `phase`, `milestone`, `verification`, `requirements`, `success criteria`; tranh dung nhieu bien the cho cung mot khai niem.
- **D-07:** Van ban output huong den user trong skill files chuyen sang tieng Anh; ten bien/ten file/ten command giu nguyen nhu hien trang.

### Verification and Snapshot Sync
- **D-08:** Sau translation, chay grep ky tu tieng Viet tren pham vi phase 65 (`CLAUDE.md` + 14 skill files) de xac nhan zero Vietnamese.
- **D-09:** Regenerate snapshots bang `node test/generate-snapshots.js` va xac nhan tong 56 file (`4 platforms x 14 skills`).
- **D-10:** Chay `node --test test/smoke-snapshot.test.js` va chi chap nhan hoan tat khi test pass hoan toan.

### the agent's Discretion
- Cach chia nho commit trong qua trinh dich tung file.
- Cach dien dat tieng Anh cu the mien la giu nguyen y nghia va khong thay doi hanh vi.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope and Requirements
- `.planning/ROADMAP.md` — Section `Phase 65: Skills + Config Foundation` va success criteria cho TRANS-01, TRANS-02, SYNC-01.
- `.planning/REQUIREMENTS.md` — Requirement IDs TRANS-01, TRANS-02, SYNC-01 va rang buoc migration language-only.
- `.planning/PROJECT.md` — Milestone v6.0, constraints backward compatibility, no structural refactor.

### Source Files to Translate
- `CLAUDE.md` — Project language convention goc.
- `commands/pd/audit.md`
- `commands/pd/complete-milestone.md`
- `commands/pd/conventions.md`
- `commands/pd/fetch-doc.md`
- `commands/pd/fix-bug.md`
- `commands/pd/init.md`
- `commands/pd/new-milestone.md`
- `commands/pd/plan.md`
- `commands/pd/research.md`
- `commands/pd/scan.md`
- `commands/pd/test.md`
- `commands/pd/update.md`
- `commands/pd/what-next.md`
- `commands/pd/write-code.md`

### Snapshot and Validation Pipeline
- `test/generate-snapshots.js` — Generator dung `listSkillFiles(commands/pd)` de tao snapshots cho 4 converters.
- `test/smoke-snapshot.test.js` — Snapshot comparison tests cho codex/copilot/gemini/opencode.
- `bin/lib/utils.js` — `listSkillFiles()` va helper parsing lien quan converter input.
- `test/snapshots/codex/`
- `test/snapshots/copilot/`
- `test/snapshots/gemini/`
- `test/snapshots/opencode/`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bin/lib/utils.js::listSkillFiles` doc toan bo `commands/pd/*.md` lam input cho converter va snapshot generation.
- `test/generate-snapshots.js` da co pipeline tao snapshot dong loat cho 4 platforms.
- `test/smoke-snapshot.test.js` da co co che compare output hien tai voi snapshot baselines.

### Established Patterns
- Skills trong `commands/pd/*.md` su dung frontmatter + XML sections (`<objective>`, `<process>`, ...).
- Converter va tests dua vao ten file skills; doi ten/cau truc se gay mismatch snapshots.
- Milestone v6.0 ap dung migration theo phase, language-only, khong doi logic.

### Integration Points
- Nguon translation: `commands/pd/*.md` + `CLAUDE.md`.
- Synchronization gate: `test/generate-snapshots.js`.
- Regression gate: `test/smoke-snapshot.test.js`.

</code_context>

<specifics>
## Specific Ideas

- [auto] Plans da ton tai (2 plans) nen context nay duoc tao de replan/verify nhat quan voi user decisions.
- [auto] Chon tat ca gray areas lien quan phase 65 de khoa quyet dinh implementation som.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 65-skills-config-foundation*
*Context gathered: 2026-03-28*
