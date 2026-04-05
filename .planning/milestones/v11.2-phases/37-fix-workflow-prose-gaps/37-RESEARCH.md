# Phase 37: Fix Workflow Prose Gaps - Research

**Researched:** 2026-03-25
**Domain:** Workflow markdown prose editing (fix-bug.md)
**Confidence:** HIGH

## Summary

Phase 37 dong 2 integration gaps cuoi cung cua v2.1 milestone: INT-09 (buildIndex param shape underspecified trong Buoc 5e) va INT-10 (INCONCLUSIVE round counter fragile trong Buoc 4). Ca 2 chi can sua text trong `workflows/fix-bug.md` — KHONG sua bat ky JS module nao.

INT-09: Buoc 5e hien tai chi noi "parse thanh records" nhung khong chi ro phai goi `parseFrontmatter()` tu `bin/lib/utils.js` de construct `{ id, frontmatter }` objects truoc khi truyen cho `buildIndex()`. Thieu instruction nay, bugRecords se la raw strings va INDEX.md se chua toan "unknown" entries.

INT-10: Buoc 4 INCONCLUSIVE path hien ghi round counter bang `appendToBody: '- inconclusive_rounds: ' + currentRound` — moi vong append 1 dong moi, tao nhieu dong trung lap. Doc lai bang grep "inconclusive_rounds:" khong co "take last match" — ambiguous. Decision D-05 doi sang pattern ghi `## Round {N}: INCONCLUSIVE` heading, dem headings de biet currentRound.

**Primary recommendation:** Sua 2 doan text trong fix-bug.md (dong 252/264 cho INT-10, dong 335 cho INT-09), regenerate 4 platform snapshots, verify tests pass.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: INT-09 — Buoc 5e khong chi ro phai goi parseFrontmatter() de construct {id, frontmatter} objects
- D-02: Fix INT-09 — Them instruction cu the trong Buoc 5e: "Doc moi BUG-*.md -> parseFrontmatter(content) tu bin/lib/utils.js -> construct { id: 'BUG-NNN', frontmatter: parsed.frontmatter } cho moi file -> truyen array nay cho buildIndex(bugRecords)"
- D-03: buildIndex expects bugRecords la array cua { id, frontmatter: { file, function, error_message, status, session_id, resolved_date } }
- D-04: INT-10 — Buoc 4 INCONCLUSIVE ghi round counter bang appendToBody: '- inconclusive_rounds: ' + currentRound — fragile
- D-05: Fix INT-10 — Doi strategy: ghi "## Round {N}: INCONCLUSIVE" heading vao SESSION.md body. Doc lai bang dem so "## Round" headings
- D-06: Round counter = count("## Round" headings) + 1. Neu chua co heading nao, currentRound = 1
- D-07: Verify existing tests pass — KHONG them tests moi
- D-08: Regenerate snapshots sau khi fix fix-bug.md

### Claude's Discretion
- So luong plans va task breakdown
- Exact wording cua workflow prose

### Deferred Ideas (OUT OF SCOPE)
None — gap closure phase, scope fixed by milestone audit
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MEM-04 | He thong tu dong tao va cap nhat .planning/bugs/INDEX.md liet ke tat ca bug theo file/function/keyword | INT-09 fix: Buoc 5e can chi ro parseFrontmatter() call de buildIndex() nhan dung {id, frontmatter} shape |
| FLOW-06 | Khi INCONCLUSIVE o Buoc 4, orchestrator quay lai Buoc 2 voi Elimination Log va thong tin moi tu user (max 3 vong) | INT-10 fix: Round counter doi sang heading-based counting de dam bao dem chinh xac qua nhieu vong |
</phase_requirements>

## Standard Stack

Khong co thu vien moi. Phase nay chi sua markdown text trong 1 file workflow.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in test runner | v18+ | Chay tests | Da dung tu Phase 28+ |
| bin/converter.js | local | Regenerate platform snapshots | Da dung tu Phase 34+ |
| test/generate-snapshots.js | local | Regenerate 4 platform snapshots | Da dung tu Phase 35+ |

## Architecture Patterns

### Pattern 1: Workflow-Only Edit (Established)
**What:** Chi sua prose trong workflow markdown, KHONG sua JS modules
**When to use:** Khi gap la "workflow underspecified" — module da dung, workflow chi dan sai
**Established by:** Phase 34, 35, 36 — tat ca deu chi sua caller/workflow, khong sua modules

### Pattern 2: Snapshot Regeneration Pipeline
**What:** Sau khi sua workflow, chay `node test/generate-snapshots.js` de cap nhat 4 platform snapshots (codex, copilot, gemini, opencode)
**Files affected:**
```
test/snapshots/codex/fix-bug.md
test/snapshots/copilot/fix-bug.md
test/snapshots/gemini/fix-bug.md
test/snapshots/opencode/fix-bug.md
```
**Verification:** `npm test` — tat ca tests phai pass sau regeneration

### Anti-Patterns to Avoid
- **Sua JS modules:** Modules da tested va hoat dong dung. Chi sua workflow prose.
- **Them tests moi:** Per D-07, KHONG them tests moi. Verify existing tests pass la du.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Snapshot regeneration | Manual copy | `node test/generate-snapshots.js` | 4 platforms x converter pipeline — tu dong va nhat quan |
| Frontmatter parsing | Custom regex | `parseFrontmatter()` tu bin/lib/utils.js | Da tested, handles edge cases |

## Common Pitfalls

### Pitfall 1: Buoc 5e — Duplicate step number
**What goes wrong:** Trong workflow hien tai, Buoc 5e co 2 dong deu danh so "3." (dong 334 va 335). Dong 335 la site can fix.
**How to avoid:** Khi edit, giữ nguyen so thu tu (hoac fix numbering) — nhung focus chinh la noi dung dong 335.

### Pitfall 2: INT-10 — Nhieu noi can update
**What goes wrong:** Round counter duoc su dung o 2 cho trong INCONCLUSIVE path:
1. Dong 252: doc currentRound (`grep inconclusive_rounds:` — can doi sang dem `## Round` headings)
2. Dong 264: ghi round counter (`appendToBody: '- inconclusive_rounds: ' + currentRound` — can doi sang `appendToBody: '## Round {currentRound}: INCONCLUSIVE'`)
**How to avoid:** Sua CA HAI cho — doc va ghi — de nhat quan.

### Pitfall 3: INT-10 — buildInconclusiveContext currentRound param
**What goes wrong:** O dong 251, `buildInconclusiveContext` nhan `currentRound` param. Gia tri nay phai dung tu heading count. Can cap nhat instruction doc currentRound truoc khi goi function.
**How to avoid:** Doc currentRound truoc (dem `## Round` headings trong SESSION.md body, +1), roi truyen vao buildInconclusiveContext.

### Pitfall 4: INT-09 — parseFrontmatter import
**What goes wrong:** Workflow prose can noi ro parseFrontmatter den tu dau (`bin/lib/utils.js`) va cach construct object shape phu hop voi buildIndex.
**How to avoid:** Prose phai ghi cu the: (1) import source, (2) goi parseFrontmatter(content), (3) construct { id: 'BUG-NNN', frontmatter: parsed.frontmatter }.

## Code Examples

### INT-09: Buoc 5e hien tai (TRUOC fix)
```markdown
  3. Glob `.planning/bugs/BUG-*.md` -> Read tat ca -> parse thanh records
     Goi `buildIndex(bugRecords)` tu `bin/lib/bug-memory.js` -> indexMd
     Ghi indexMd vao `.planning/bugs/INDEX.md`
```

### INT-09: Buoc 5e SAU fix (per D-02, D-03)
```markdown
  3. Glob `.planning/bugs/BUG-*.md` -> Read tat ca
     Voi moi file BUG-*.md:
       - Goi `parseFrontmatter(content)` tu `bin/lib/utils.js` -> { frontmatter }
       - Parse so tu filename (VD: BUG-003.md -> 'BUG-003')
       - Construct object: { id: 'BUG-003', frontmatter: parsed.frontmatter }
     Tao mang bugRecords tu tat ca objects tren
     Goi `buildIndex(bugRecords)` tu `bin/lib/bug-memory.js` -> indexMd
     Ghi indexMd vao `.planning/bugs/INDEX.md`
```

### INT-10: INCONCLUSIVE read currentRound hien tai (TRUOC fix)
```markdown
     - currentRound: doc tu SESSION.md (grep `inconclusive_rounds:` -> parse so, mac dinh 1 neu chua co)
```

### INT-10: INCONCLUSIVE read currentRound SAU fix (per D-05, D-06)
```markdown
     - currentRound: doc tu SESSION.md body — dem so "## Round" headings + 1 (mac dinh 1 neu chua co heading nao)
```

### INT-10: INCONCLUSIVE write round hien tai (TRUOC fix)
```markdown
     Goi `updateSession(currentMd, { appendToBody: '- inconclusive_rounds: ' + currentRound })` tu `bin/lib/session-manager.js`
```

### INT-10: INCONCLUSIVE write round SAU fix (per D-05)
```markdown
     Goi `updateSession(currentMd, { appendToBody: '\n## Round ' + currentRound + ': INCONCLUSIVE\n' })` tu `bin/lib/session-manager.js`
```

## Exact Fix Locations

| Gap | File | Line(s) | Current Text | Action |
|-----|------|---------|--------------|--------|
| INT-09 | workflows/fix-bug.md | 335 | `Glob .planning/bugs/BUG-*.md -> Read tat ca -> parse thanh records` | Replace voi parseFrontmatter instructions cu the (per D-02) |
| INT-10 (read) | workflows/fix-bug.md | 252 | `grep inconclusive_rounds: -> parse so` | Doi sang dem `## Round` headings + 1 (per D-06) |
| INT-10 (write) | workflows/fix-bug.md | 264 | `appendToBody: '- inconclusive_rounds: ' + currentRound` | Doi sang `appendToBody: '## Round ' + currentRound + ': INCONCLUSIVE'` (per D-05) |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node --test) |
| Config file | package.json scripts.test |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MEM-04 | buildIndex nhan dung {id, frontmatter} shape | unit (existing) | `node --test test/smoke-bug-memory.test.js` | Da co |
| FLOW-06 | INCONCLUSIVE loop-back max 3 rounds | unit (existing) | `node --test test/smoke-outcome-router.test.js` | Da co |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green truoc /gsd:verify-work

### Wave 0 Gaps
None — existing test infrastructure covers all phase requirements. Chi can verify tests pass, khong them tests moi (per D-07).

## Sources

### Primary (HIGH confidence)
- `workflows/fix-bug.md` — Workflow hien tai, da doc va xac dinh chinh xac 3 fix sites
- `bin/lib/bug-memory.js` — buildIndex() expects `{ id, frontmatter }` objects (dong 153, 168-228)
- `bin/lib/utils.js` — parseFrontmatter() returns `{ frontmatter, body, raw }` (dong 50-101)
- `bin/lib/outcome-router.js` — buildInconclusiveContext nhan currentRound param, canContinue = currentRound <= 3 (dong 171-198)
- `bin/lib/session-manager.js` — updateSession nhan appendToBody option (dong 209-243)
- `.planning/v2.1-MILESTONE-AUDIT.md` — INT-09 va INT-10 descriptions va fix directions

### Secondary (MEDIUM confidence)
- `.planning/phases/36-fix-workflow-wiring/36-01-PLAN.md` — Pattern reference cho snapshot regeneration workflow

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Khong co thu vien moi, chi tool noi bo da verified
- Architecture: HIGH - Pattern da established qua Phase 34/35/36
- Pitfalls: HIGH - Da doc source code va xac dinh chinh xac fix sites
- Fix locations: HIGH - Da verify dong so va noi dung hien tai trong fix-bug.md

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable — workflow text edit, khong phu thuoc external deps)
