# Phase 10: Core Plan Checks - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Plan checker module có thể kiểm tra 4 structural properties của PLAN.md + TASKS.md và trả kết quả structured. Module này là core engine — workflow integration (Phase 11) và advanced checks (Phase 12) build on top.

</domain>

<decisions>
## Implementation Decisions

### Severity mapping per check
- **D-01:** CHECK-01 (requirement không có task cover) → BLOCK — gap coverage cơ bản, plan thiếu requirement = chắc chắn sẽ miss deliverable
- **D-02:** CHECK-02 (task thiếu required fields):
  - Thiếu Truths/Files/Effort/Mô tả/Tiêu chí chấp nhận → BLOCK — task không thể execute hoặc verify nếu thiếu
  - Thiếu Trạng thái/Ưu tiên/Phụ thuộc/Loại → WARN — structural nhưng không chặn execution
  - "Ghi chú kỹ thuật" section → không check (template ghi rõ "Chỉ khi cần thiết")
- **D-03:** CHECK-03 (circular deps / invalid refs) → BLOCK — gây execution deadlock hoặc runtime failure
- **D-04:** CHECK-04 (orphaned Truth hoặc orphaned Task):
  - Truth không có task nào map → BLOCK — success criterion sẽ không đạt được
  - Task không có Truth nào map → WARN — có thể là infrastructure/setup task hợp lệ

### Required fields definition (CHECK-02)
- **D-05:** Required fields trong task detail block metadata line: Effort, Files, Truths — 3 fields bắt buộc
- **D-06:** Required sections trong task detail block: "Mô tả" và "Tiêu chí chấp nhận" — phải tồn tại và không rỗng
- **D-07:** Summary table phải có cột Truths — thiếu cột = BLOCK
- **D-08:** Fields Trạng thái, Ưu tiên, Phụ thuộc, Loại được check nhưng chỉ WARN nếu thiếu

### Requirement-to-task matching (CHECK-01)
- **D-09:** Chuỗi truy vết: ROADMAP.md `Requirements:` field per phase → requirement IDs phải xuất hiện trong PLAN.md (objectives, truths, hoặc task descriptions)
- **D-10:** Nếu phase không có `Requirements:` trong ROADMAP → CHECK-01 tự động PASS (graceful skip, không false positive trên v1.0 plans)
- **D-11:** Matching bằng regex literal requirement ID (VD: `CHECK-01`, `INTG-02`) — tìm trong toàn bộ nội dung PLAN.md
- **D-12:** Requirement ID không xuất hiện ở đâu trong PLAN.md → BLOCK với message chỉ rõ requirement nào bị thiếu

### Check result data structure
- **D-13:** Mỗi check trả về object: `{ checkId, status: 'pass'|'block'|'warn', issues: [{ message, location, fixHint }] }`
- **D-14:** Combined result: `{ overall: 'pass'|'block'|'warn', checks: [check1Result, check2Result, ...] }`
- **D-15:** `overall` = 'block' nếu bất kỳ check nào có status 'block', = 'warn' nếu có warn nhưng không block

### Historical plan compatibility
- **D-16:** Parsing phải handle cả format tiếng Việt (TASKS.md hiện tại) và bất kỳ variation nào trong 16 v1.0 plans
- **D-17:** Zero false positives trên 16 historical plans là acceptance gate — bất kỳ false positive nào = phải sửa parsing logic

### Claude's Discretion
- Module file location và internal structure (single file vs split)
- Regex patterns cụ thể cho parsing PLAN.md/TASKS.md
- Helper functions internal cho mỗi check
- Test file organization
- Error messages wording

</decisions>

<specifics>
## Specific Ideas

- TASKS.md dùng format: metadata line `> Trạng thái: ⬜ | Ưu tiên: Cao | Phụ thuộc: Không | Loại: Backend | Effort: standard` + `> Files:` + `> Truths: [T1, T2]`
- PLAN.md Truths table format: `| T1 | [sự thật] | [cách kiểm chứng] |`
- Summary table trong TASKS.md: `| # | Công việc | Trạng thái | Ưu tiên | Phụ thuộc | Loại | Truths |`
- `extractXmlSection()` trong utils.js có thể reuse cho parsing PLAN.md sections
- `parseFrontmatter()` đã handle YAML frontmatter — reuse cho cả PLAN.md và TASKS.md
- 16 historical plans nằm trong `.planning/milestones/v1.0-*/` hoặc `.planning/phases/0X-*/`

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Templates (defines the format checkers must parse)
- `templates/plan.md` — PLAN.md template: Truths table format, Artifacts table, Key Links table, overall section structure
- `templates/tasks.md` — TASKS.md template: summary table columns, detail block metadata line format, required fields, Truths tracing rules

### Existing utilities (integration points)
- `bin/lib/utils.js` — parseFrontmatter, extractXmlSection, listSkillFiles — reusable parsing functions

### Historical plans (validation test data)
- `.planning/phases/01-skill-structure-normalization/` — 3 PLAN.md files
- `.planning/phases/02-cross-skill-deduplication/` — 2 PLAN.md files
- `.planning/phases/03-prompt-prose-compression/` — 6 PLAN.md files
- `.planning/phases/04-conditional-context-loading/` — 2 PLAN.md files
- `.planning/phases/05-effort-level-routing/` — 2 PLAN.md files
- `.planning/phases/06-context7-standardization/` — 2 PLAN.md files
- `.planning/phases/07-library-fallback-and-version-detection/` — 1 PLAN.md file
- `.planning/phases/08-wave-based-parallel-execution/` — 2 PLAN.md files
- `.planning/phases/09-converter-pipeline-optimization/` — 2 PLAN.md files
- Total: 22 PLAN.md + 22 TASKS.md = validation corpus

### ROADMAP (requirement source for CHECK-01)
- `.planning/ROADMAP.md` — Phase details with `Requirements:` field per phase
- `.planning/REQUIREMENTS.md` — Full requirement definitions with traceability table

### References (conventions)
- `references/conventions.md` — Status icons, effort levels, commit conventions
- `references/verification-patterns.md` — Verification level patterns (for understanding what checkers verify)

### Test infrastructure
- `test/smoke-integrity.test.js` — Existing test patterns, utility usage examples

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `parseFrontmatter(content)` in utils.js: Parse YAML frontmatter → có thể dùng cho PLAN.md/TASKS.md header
- `extractXmlSection(content, tagName)` in utils.js: Extract XML sections — không trực tiếp dùng cho PLAN.md (dùng markdown headings) nhưng pattern tham khảo
- `listSkillFiles(skillsDir)` in utils.js: File listing pattern — tham khảo cho listing plan files

### Established Patterns
- Pure function style — không classes, module.exports object với named functions
- Regex-based parsing throughout codebase (frontmatter, XML sections, path replacement)
- Test pattern: `describe` blocks with specific assertions, utilities imported from utils.js
- Error handling: classified hard errors (re-throw) vs soft warnings (log+continue) — Phase 9 convention

### Integration Points
- Plan checker module sẽ được import bởi plan workflow (Phase 11) — API phải stable
- Results consumed bởi report formatter (Phase 11) — data structure phải well-defined (D-13, D-14)
- `references/plan-checker.md` sẽ là single source of truth cho check rules — module reads rules from here

</code_context>

<deferred>
## Deferred Ideas

- Workflow integration (Step 8.1 insertion) — Phase 11
- Report format PASS/ISSUES FOUND — Phase 11
- User interaction Fix/Proceed/Cancel — Phase 11
- Key Links verification — Phase 12
- Scope threshold warnings — Phase 12
- Effort classification validation — Phase 12

</deferred>

---

*Phase: 10-core-plan-checks*
*Context gathered: 2026-03-22*
