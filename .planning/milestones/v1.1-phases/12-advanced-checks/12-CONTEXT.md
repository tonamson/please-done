# Phase 12: Advanced Checks - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Plan checker phát hiện thêm 3 loại vấn đề nâng cao để tăng chất lượng plan: Key Links verification, scope threshold warnings, effort classification validation. Build on top of plan-checker.js (Phase 10) đã có 4 checks + workflow integration (Phase 11). Module mở rộng thêm 3 check functions mới vào runAllChecks().

</domain>

<decisions>
## Implementation Decisions

### Key Links verification (ADV-01)
- **D-01:** Check cả 2 hướng: `from`/`to` paths phải xuất hiện trong `Files:` của tasks VÀ `pattern` field phải xuất hiện trong description/criteria của tasks
- **D-02:** Cả 2 đầu (`from` + `to`) phải có task touch, VÀ ít nhất 1 task phải touch cả 2 đầu cùng lúc — đảm bảo integration thực sự xảy ra
- **D-03:** Path normalization (strip suffix `(...)`, handle variations) — Claude tự quyết cách implement
- **D-04:** Severity: BLOCK — Key Link đứt = Truth không đạt được, đúng như template plan.md ghi ("Link đứt → Truth không đạt")

### Scope threshold warnings (ADV-02)
- **D-05:** 4 dimensions được check:
  - Tasks per plan: > 6 → WARN
  - Files per task: > 7 → WARN
  - Total files per plan: > 25 → WARN
  - Truths per plan: > 6 → WARN
- **D-06:** Severity: tất cả dimensions là WARN — advisory, không block execution

### Effort classification validation (ADV-03)
- **D-07:** Flag mismatch cả hai chiều — underestimate (labeled simple, scope thực tế complex) VÀ overestimate (labeled complex, scope thực tế simple)
- **D-08:** Xác định effort "thực tế" bằng 4 signals từ conventions.md: files, truths, deps, multi-domain. Lấy signal cao nhất (conservative) — 1 signal nào complex thì coi là complex
- **D-09:** Detect "multi-domain" qua file paths — nếu files span nhiều top-level directories (VD: `bin/` + `workflows/` + `references/`) thì coi là multi-domain
- **D-10:** Vẫn WARN khi mismatch bất kể planner override — planner acknowledge rồi proceed qua workflow choices (Phase 11)
- **D-11:** Severity: WARN — effort là guidelines, không phải hard rules

### v1.0 format handling
- **D-12:** v1.0 plans không có Key Links hoặc Effort fields → graceful PASS cho ADV-01 và ADV-03 (consistent với D-10/D-17 từ Phase 10)
- **D-13:** ADV-02 scope thresholds áp dụng cho cả v1.0 (task count và file count vẫn parse được từ XML format)

### Claude's Discretion
- Path normalization strategy cho Key Links (D-03)
- Check function naming và internal structure
- Exact wording của warning/block messages và fixHints
- Logic detect top-level directories cho multi-domain
- Effort thresholds từ conventions.md: đọc trực tiếp từ bảng hay hardcode

</decisions>

<specifics>
## Specific Ideas

- Key Links nằm trong PLAN.md frontmatter dạng YAML: `key_links:` array với `from/to/via/pattern` fields
- Ví dụ thực tế từ 11-01-PLAN.md: `from: "workflows/plan.md (Step 8.1)"`, `to: "bin/lib/plan-checker.js"`, `pattern: "runAllChecks"`
- Conventions.md effort table: simple (1-2 files, 1 truth, 0 deps), standard (3-4 files, 2-3 truths, 1-2 deps), complex (5+ files, 4+ truths, 3+ deps)
- `parseFrontmatter()` trong utils.js có thể parse key_links từ YAML frontmatter
- Existing check IDs: CHECK-01 đến CHECK-04 → new checks cần IDs mới (ADV-01, ADV-02, ADV-03 hoặc CHECK-05, CHECK-06, CHECK-07)

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Plan checker module (extend)
- `bin/lib/plan-checker.js` — Existing 4 checks + runAllChecks(), helpers, exports — new checks integrate here
- `references/plan-checker.md` — Rules spec: update with 3 new check rules

### Templates (format to parse)
- `templates/plan.md` §"Liên kết then chốt (Key Links)" — Key Links table format: `| Từ | Đến | Mô tả |`
- `templates/plan.md` §"Sự thật phải đạt (Truths)" — Truths table for counting
- `templates/tasks.md` — Task metadata format: `> Files:`, `> Truths:`, `> Effort:`

### Effort classification source
- `references/conventions.md` §"Effort level" — Classification table (simple/standard/complex) with 4 signals (files, truths, deps, multi-domain)

### Existing utilities
- `bin/lib/utils.js` — parseFrontmatter (parse key_links from YAML), extractXmlSection

### Historical plans (validation)
- `.planning/phases/10-core-plan-checks/10-01-PLAN.md` — Has key_links in frontmatter (validation data)
- `.planning/phases/11-workflow-integration/11-01-PLAN.md` — Has key_links in frontmatter (validation data)

### Requirements
- `.planning/REQUIREMENTS.md` — ADV-01, ADV-02, ADV-03 definitions
- `.planning/ROADMAP.md` — Phase 12 success criteria

### Prior context (decisions to inherit)
- Phase 10 CONTEXT.md D-13/D-14/D-15 — Check result format: `{ checkId, status, issues }`, combined result: `{ overall, checks }`
- Phase 10 CONTEXT.md D-16/D-17 — v1.0 graceful handling, zero false positive principle

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `runAllChecks()` — Main orchestrator, new checks append to `checks` array
- `detectPlanFormat()` — Returns 'v1.0' | 'v1.1' | 'unknown', reuse for format-aware routing
- `parseFrontmatter()` — Parse YAML frontmatter including key_links
- `parseTaskDetailBlocksV11()` — Extract task metadata (Files, Truths, Effort) from TASKS.md
- `parseSummaryTableV11()` — Extract summary table rows
- `parseTruthsV11()` — Parse Truths table from PLAN.md
- `parseTasksV10()` — Parse v1.0 XML tasks

### Established Patterns
- Pure functions — nhận content strings, trả result object, không I/O
- Check function signature: `checkXxx(planContent, tasksContent)` → `{ checkId, status, issues }`
- Result aggregation trong runAllChecks: `hasBlock ? 'block' : hasWarn ? 'warn' : 'pass'`
- Graceful PASS cho v1.0/unknown format khi data không đủ để check

### Integration Points
- `runAllChecks()` — thêm 3 check calls mới vào checks array
- `module.exports` — export 3 new check functions + bất kỳ helpers mới
- `references/plan-checker.md` — update rules spec với 3 new sections
- Test file — extend existing test patterns

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-advanced-checks*
*Context gathered: 2026-03-23*
