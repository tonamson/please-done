# Phase 14: Skill & Workflow Audit - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Scan toan bo 12 skills, 10 workflows, va 48 converter snapshots tim logic gaps, dead code, outdated references, va sync issues. Output la audit report chi tiet. KHONG fix bugs o phase nay — chi phat hien va ghi nhan.

</domain>

<decisions>
## Implementation Decisions

### Audit scope va file inventory
- **D-01:** 12 skills = commands/pd/*.md (complete-milestone, conventions, fetch-doc, fix-bug, init, new-milestone, plan, scan, test, update, what-next, write-code)
- **D-02:** 10 workflows = workflows/*.md (complete-milestone, conventions, fix-bug, init, new-milestone, plan, scan, test, what-next, write-code)
- **D-03:** 48 snapshots = test/snapshots/{codex,copilot,gemini,opencode}/ x 12 skills moi platform
- **D-04:** Cung scan 13 references (references/*.md) va 10 templates (templates/*.md) vi chung la dependencies cua skills/workflows
- **D-05:** Scan 15 JS modules (bin/**/*.js) vi chung la runtime dependencies

### Audit method
- **D-06:** Scan theo checklist per file — moi file duoc kiem tra cung bo criteria
- **D-07:** Skill audit checklist: (1) frontmatter valid, (2) execution_context references exist, (3) workflow reference matches actual workflow file, (4) step references match workflow steps, (5) no stale version mentions, (6) no dead conditional branches
- **D-08:** Workflow audit checklist: (1) tung step co logic ro rang, (2) error handling cho edge cases, (3) references toi files khac van valid, (4) buoc numbering consistent, (5) no orphaned steps/sections, (6) state updates correct
- **D-09:** Snapshot audit: chay `node test/generate-snapshots.js` roi `git diff test/snapshots/` — bat ky diff nao la sync issue

### Report format
- **D-10:** Output la 1 file audit report: `{phase_dir}/14-AUDIT-REPORT.md`
- **D-11:** Issues phan loai severity: critical (logic error/broken flow), warning (stale reference/outdated), info (dead code/cleanup opportunity)
- **D-12:** Moi issue co: file path, line number (neu co the), description, severity, suggested fix direction

### Claude's Discretion
- Thu tu scan files
- Chi tiet level cua tung issue description
- Nhom issues theo file hay theo loai

</decisions>

<specifics>
## Specific Ideas

- Focus dac biet vao 3 workflows se duoc verify o Phase 15: new-milestone, write-code, fix-bug — bat ky issue nao o day la high priority
- Kiem tra xem cac skill commands co reference dung version cua workflow khong (v1.0 structure vs current)
- Kiem tra cac guard references (guard-context.md, guard-context7.md, guard-fastcode.md, guard-valid-path.md) con duoc dung dung khong

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Skill files (12)
- `commands/pd/complete-milestone.md`
- `commands/pd/conventions.md`
- `commands/pd/fetch-doc.md`
- `commands/pd/fix-bug.md`
- `commands/pd/init.md`
- `commands/pd/new-milestone.md`
- `commands/pd/plan.md`
- `commands/pd/scan.md`
- `commands/pd/test.md`
- `commands/pd/update.md`
- `commands/pd/what-next.md`
- `commands/pd/write-code.md`

### Workflow files (10)
- `workflows/complete-milestone.md`
- `workflows/conventions.md`
- `workflows/fix-bug.md`
- `workflows/init.md`
- `workflows/new-milestone.md`
- `workflows/plan.md`
- `workflows/scan.md`
- `workflows/test.md`
- `workflows/what-next.md`
- `workflows/write-code.md`

### Reference files (13)
- `references/context7-pipeline.md`
- `references/conventions.md`
- `references/guard-context.md`
- `references/guard-context7.md`
- `references/guard-fastcode.md`
- `references/guard-valid-path.md`
- `references/plan-checker.md`
- `references/prioritization.md`
- `references/questioning.md`
- `references/security-checklist.md`
- `references/state-machine.md`
- `references/ui-brand.md`
- `references/verification-patterns.md`

### JS modules (key ones)
- `bin/lib/utils.js` — Shared utilities used by converters and plan-checker
- `bin/lib/converters/base.js` — Base converter pipeline (shared logic)
- `bin/lib/plan-checker.js` — Plan checker engine (7 checks)

### Snapshot generation
- `test/generate-snapshots.js` — Generates 48 snapshots from source files
- `test/smoke-snapshot.test.js` — Verifies snapshots match source

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `test/generate-snapshots.js` — co the chay truc tiep de verify snapshot sync
- `test/smoke-*.test.js` — 9 test files co the chay de verify current state

### Established Patterns
- Skills dung canonical 7-section structure (tu v1.0 Phase 1)
- Workflows dung numbered steps (Buoc 1, Buoc 2, etc.)
- Guards inlined qua guard-*.md references trong execution_context

### Integration Points
- Skills reference workflows qua `@workflows/{name}.md`
- Workflows reference templates qua `@templates/{name}.md`
- Workflows reference references qua `@references/{name}.md`
- Converters read source files va output to test/snapshots/

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-skill-workflow-audit*
*Context gathered: 2026-03-23*
