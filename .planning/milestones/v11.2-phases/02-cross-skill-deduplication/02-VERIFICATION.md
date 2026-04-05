---
phase: 02-cross-skill-deduplication
verified: 2026-03-22T07:09:18Z
status: passed
score: 7/7 must-haves verified
re_verification: false
---

# Phase 2: Cross-Skill Deduplication Verification Report

**Phase Goal:** Shared content that currently repeats across 12 skills is extracted into micro-templates, eliminating redundant token consumption at the source
**Verified:** 2026-03-22T07:09:18Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Guard micro-template files exist in references/ with correct content | VERIFIED | 4 files present: guard-context.md, guard-fastcode.md, guard-context7.md, guard-valid-path.md — each contains exactly one non-diacritical Vietnamese checklist line |
| 2 | inlineGuardRefs resolves @references/guard-*.md lines to file content | VERIFIED | Function at bin/lib/utils.js:235, regex `^@references/(guard-[a-z0-9_-]+\.md)$` with `gm` flags, reads file and trims — graceful fallback for missing files |
| 3 | inlineWorkflow calls inlineGuardRefs at start before workflow check | VERIFIED | bin/lib/utils.js:257 — `body = inlineGuardRefs(body, skillsDir);` is the first statement in inlineWorkflow, before the `workflowMatch` early-return at line 260 |
| 4 | No skill file contains duplicated guard text that exists in a guard micro-template | VERIFIED | Python scan of all 12 skill `<guards>` sections found zero inline instances of any shared guard text — all replaced with @references/ refs or absent (conventions, what-next, update have only unique guards) |
| 5 | Each guard micro-template is referenced by 2+ skills | VERIFIED | guard-context=8, guard-fastcode=6, guard-context7=5, guard-valid-path=2 — all meet the ≥2 threshold |
| 6 | Updating a shared guard requires changing exactly one file | VERIFIED | All shared guard text lives exclusively in references/guard-*.md; skills hold only @references/ refs which inlineGuardRefs resolves at conversion time |
| 7 | All converters still produce correct output for all 12 skills | VERIFIED | Full test suite: 202 pass, 0 fail — includes 4 converter guard-expansion tests verifying Codex, Copilot, Gemini, and OpenCode all expand guard refs |

**Score:** 7/7 truths verified

---

## Required Artifacts

### Plan 02-01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `references/guard-context.md` | CONTEXT.md existence check guard | VERIFIED | Contains `- [ ] \`.planning/CONTEXT.md\` ton tai -> "Chay \`/pd:init\` truoc."` — no frontmatter, no XML |
| `references/guard-fastcode.md` | FastCode MCP connectivity guard | VERIFIED | Contains `- [ ] FastCode MCP ket noi thanh cong -> ...` |
| `references/guard-context7.md` | Context7 MCP connectivity guard | VERIFIED | Contains `- [ ] Context7 MCP ket noi thanh cong -> ...` |
| `references/guard-valid-path.md` | Path parameter validation guard | VERIFIED | Contains `- [ ] Tham so path hop le (neu co) -> ...` |
| `bin/lib/utils.js` | inlineGuardRefs function, wired into inlineWorkflow, exported | VERIFIED | Function defined at line 235, called at line 257 (first line of inlineWorkflow), exported at line 349 |
| `test/smoke-integrity.test.js` | Guard deduplication verification tests | VERIFIED | 3-test describe block `'Repo integrity -- guard deduplication'` — all 3 pass GREEN |
| `test/smoke-utils.test.js` | inlineGuardRefs unit tests (5) + inlineWorkflow guard-expansion (1) | VERIFIED | `describe('inlineGuardRefs')` with 5 tests + 1 test in `'inlineWorkflow'` block |
| `test/smoke-converters.test.js` | Guard expansion tests for 4 converters | VERIFIED | `describe('Guard expansion in converters')` — 4 tests (Codex, Copilot, Gemini, OpenCode), all pass |

### Plan 02-02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `commands/pd/write-code.md` | @references/guard-context.md, guard-fastcode.md, guard-context7.md | VERIFIED | All 3 refs present in `<guards>` section; preamble is non-diacritical |
| `commands/pd/test.md` | @references/guard-context.md, guard-fastcode.md, guard-context7.md | VERIFIED | All 3 refs present; preamble is non-diacritical |
| `commands/pd/fix-bug.md` | @references/guard-context.md, guard-fastcode.md, guard-context7.md | VERIFIED | All 3 refs present; preamble is non-diacritical |
| `commands/pd/plan.md` | @references/guard-context.md, guard-fastcode.md, guard-context7.md | VERIFIED | All 3 refs present; preamble normalized to non-diacritical |
| `commands/pd/init.md` | @references/guard-valid-path.md, guard-fastcode.md | VERIFIED | Both refs present; preamble is non-diacritical |
| `commands/pd/scan.md` | @references/guard-context.md, guard-valid-path.md, guard-fastcode.md | VERIFIED | All 3 refs present; preamble is non-diacritical |
| `commands/pd/new-milestone.md` | @references/guard-context.md, guard-context7.md | VERIFIED | Both refs present; preamble normalized to non-diacritical |
| `commands/pd/complete-milestone.md` | @references/guard-context.md | VERIFIED | Ref present; preamble normalized to non-diacritical |
| `commands/pd/fetch-doc.md` | @references/guard-context.md | VERIFIED | Ref present; preamble is non-diacritical; DUNG occurrences in `<process>` section are expected (not guards) |
| `commands/pd/what-next.md` | Non-diacritical unique guard (no shared guards) | VERIFIED | Guards section has non-diacritical preamble and unique inline guard for `.planning/` directory check — correct, distinct from guard-context.md |
| `commands/pd/update.md` | Non-diacritical unique guards (no shared guards) | VERIFIED | Guards section has non-diacritical preamble and 2 unique inline guards — correct |
| `commands/pd/conventions.md` | Unchanged (no shared guards) | VERIFIED | Guards section unchanged — unique guard for source code directory check retained as-is |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `bin/lib/utils.js` | `references/guard-*.md` | `fs.readFileSync` in inlineGuardRefs | WIRED | Line 241: `fs.readFileSync(guardPath, 'utf8').trim()` — path constructed as `path.join(skillsDir, 'references', filename)` |
| `bin/lib/utils.js (inlineWorkflow)` | `bin/lib/utils.js (inlineGuardRefs)` | inlineWorkflow calls inlineGuardRefs before workflow match | WIRED | Line 257: `body = inlineGuardRefs(body, skillsDir);` — first statement before `workflowMatch` check at line 260 |
| `test/smoke-integrity.test.js` | `references/guard-*.md` | `fs.readdirSync` filter on `guard-` prefix | WIRED | Describe block `'Repo integrity -- guard deduplication'` reads and verifies guard files and skill references |
| `commands/pd/write-code.md` | `references/guard-context.md` | `@references/guard-context.md` in `<guards>` | WIRED | Pattern present in guards section |
| `commands/pd/init.md` | `references/guard-fastcode.md` | `@references/guard-fastcode.md` in `<guards>` | WIRED | Pattern present in guards section |
| `test/smoke-integrity.test.js` | `commands/pd/*.md` | guard deduplication verification tests | WIRED | Tests verify reference count and no inline duplication across all skills — all 3 tests pass |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| TOKN-01 | 02-01-PLAN.md, 02-02-PLAN.md | Remove redundancy across 12 skill files — extract shared content into micro-templates | SATISFIED | 4 guard micro-templates in references/; 8 skills reference guard-context, 6 reference guard-fastcode, 5 reference guard-context7, 2 reference guard-valid-path; zero inline duplication detected; REQUIREMENTS.md marks TOKN-01 as `[x]` complete |

No orphaned requirements found — REQUIREMENTS.md phase mapping shows TOKN-01 assigned to Phase 2 only, and both plans claim it.

---

## Anti-Patterns Found

No blockers or warnings found.

| File | Pattern | Severity | Finding |
|------|---------|----------|---------|
| `commands/pd/fetch-doc.md` | `DỪNG` occurrences | INFO | Diacritical `DỪNG` appears at lines 43, 77, 81 — all in `<process>` section, not `<guards>`. Per plan 02-02 decision: "Diacritical Vietnamese in non-guards sections preserved as-is." No action needed. |
| `commands/pd/update.md` | `DỪNG` occurrences | INFO | Diacritical `DỪNG` at lines 52, 62, 64, 65, 96 — all in `<process>` section. Same ruling as above. |
| `commands/pd/write-code.md` | `DỪNG` occurrence | INFO | Diacritical `DỪNG` at line 49 — in `<process>` section. Same ruling as above. |

---

## Human Verification Required

None. All phase goal outcomes are mechanically verifiable:
- Guard file content is deterministic text
- Reference counts are grep-verifiable
- Test suite provides automated coverage of all converter pipelines
- The "one-file-change updates all" property is structurally guaranteed by the inlining mechanism

---

## Commit Verification

All 4 task commits confirmed present in git history:

| Commit | Plan | Description |
|--------|------|-------------|
| `918515d` | 02-01 Task 1 | test: add guard micro-templates and deduplication tests (TDD RED) |
| `4b0fd40` | 02-01 Task 2 | feat: add inlineGuardRefs function, wire into inlineWorkflow, add guard expansion tests |
| `4bf1f5e` | 02-02 Task 1 | feat: deduplicate guards in batch 1 (init, scan, write-code, test, fix-bug) |
| `823a52c` | 02-02 Task 2 | feat: deduplicate guards in batch 2 (plan, new-milestone, complete-milestone, fetch-doc, what-next, update) |

---

## Summary

Phase 2 goal is fully achieved. All shared guard text that previously repeated across multiple skills has been extracted into 4 micro-template files in `references/`. The `inlineGuardRefs` function in `bin/lib/utils.js` resolves these references at conversion time, is wired into `inlineWorkflow` before the early-return path, and is exported for direct use. All 12 skill files use non-diacritical Vietnamese in their `<guards>` sections. The full test suite (202 tests, 0 failures) confirms no regression across any of the 4 converter platforms.

Reference count targets from the plan are exactly met: guard-context=8, guard-fastcode=6, guard-context7=5, guard-valid-path=2.

TOKN-01 requirement is satisfied and marked complete in REQUIREMENTS.md.

---

_Verified: 2026-03-22T07:09:18Z_
_Verifier: Claude (gsd-verifier)_
