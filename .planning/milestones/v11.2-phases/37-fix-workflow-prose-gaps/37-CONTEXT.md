# Phase 37: Fix Workflow Prose Gaps - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning
**Source:** Gap closure from v2.1-MILESTONE-AUDIT.md (INT-09, INT-10)

<domain>
## Phase Boundary

Fix 2 workflow prose gaps trong fix-bug.md: buildIndex param shape underspecified (INT-09), va INCONCLUSIVE round counter fragile (INT-10). Day la gap closure cuoi cung cua v2.1 milestone — scope cuc ky hep, chi sua workflow text.

</domain>

<decisions>
## Implementation Decisions

### INT-09 (P1): buildIndex param shape underspecified
- **D-01:** Hien tai fix-bug.md Buoc 5e noi "Glob .planning/bugs/BUG-*.md -> Read tat ca -> parse thanh records" nhung khong chi ro phai goi parseFrontmatter() de construct {id, frontmatter} objects.
- **D-02:** Fix: Them instruction cu the trong Buoc 5e: "Doc moi BUG-*.md -> parseFrontmatter(content) tu bin/lib/utils.js -> construct { id: 'BUG-NNN', frontmatter: parsed.frontmatter } cho moi file -> truyen array nay cho buildIndex(bugRecords)".
- **D-03:** Xac nhan buildIndex expects `bugRecords` la array cua `{ id, frontmatter: { file, function, error_message, status, session_id, resolved_date } }`.

### INT-10 (P2): INCONCLUSIVE round counter fragile
- **D-04:** Hien tai fix-bug.md Buoc 4 INCONCLUSIVE path ghi round counter bang `updateSession(currentMd, { appendToBody: '- inconclusive_rounds: ' + currentRound })`. Khi doc lai, grep body cho "inconclusive_rounds:" — fragile khi co nhieu appends.
- **D-05:** Fix: Doi strategy — ghi "## Round {N}: INCONCLUSIVE" heading vao SESSION.md body. Doc lai bang dem so "## Round" headings. Nhu vay moi round co heading rieng, de dem va khong bi ambiguous.
- **D-06:** Round counter = count("## Round" headings) + 1. Neu chua co heading nao, currentRound = 1.

### Test & Snapshot Strategy
- **D-07:** Verify existing tests pass — KHONG them tests moi (modules da co unit tests day du).
- **D-08:** Regenerate snapshots sau khi fix fix-bug.md — nhat quan voi Phase 34/35/36 pattern.

### Claude's Discretion
- So luong plans va task breakdown
- Exact wording cua workflow prose

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Audit report (source of all gaps)
- `.planning/v2.1-MILESTONE-AUDIT.md` — INT-09 va INT-10 descriptions, severity, fix directions

### Workflow (primary edit target)
- `workflows/fix-bug.md` — V2.1 orchestrator, can fix Buoc 5e (INT-09) va Buoc 4 INCONCLUSIVE path (INT-10)

### Pure function modules (reference — KHONG sua modules, chi sua workflow prose)
- `bin/lib/bug-memory.js` — buildIndex(bugRecords) expects {id, frontmatter} objects
- `bin/lib/utils.js` — parseFrontmatter(content) returns {frontmatter, body}
- `bin/lib/session-manager.js` — updateSession(content, options) for SESSION.md updates
- `bin/lib/outcome-router.js` — buildInconclusiveContext reads round info

### Prior phase context
- `.planning/phases/36-fix-workflow-wiring/36-CONTEXT.md` — Established pattern: chi sua caller, khong sua modules

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- parseFrontmatter() da export tu utils.js — chi can reference trong workflow prose
- buildIndex() da tested day du trong smoke-bug-memory.test.js
- updateSession() da tested day du trong smoke-session-manager.test.js

### Established Patterns
- Workflow la markdown — edits la text substitution
- Pure function pattern — modules KHONG can thay doi, chi sua workflow prose
- Converter pipeline — fix-bug.md changes → regenerate snapshots

### Integration Points
- `workflows/fix-bug.md` Buoc 5e — INT-09 fix site (buildIndex call)
- `workflows/fix-bug.md` Buoc 4 INCONCLUSIVE — INT-10 fix site (round counter)
- `test/snapshots/` — 4 platform snapshots can regenerate

</code_context>

<specifics>
## Specific Ideas

- Day la gap closure cuoi cung — scope cuc ky hep, chi 2 text edits trong 1 file
- Sau phase nay, milestone v2.1 hoan tat voi 0 integration gaps

</specifics>

<deferred>
## Deferred Ideas

None — gap closure phase, scope fixed by milestone audit

</deferred>

---

*Phase: 37-fix-workflow-prose-gaps*
*Context gathered: 2026-03-25 via gap closure from v2.1-MILESTONE-AUDIT.md*
