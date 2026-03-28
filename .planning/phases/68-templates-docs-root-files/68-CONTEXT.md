# Phase 68 — Templates + Docs + Root Files — Context

## Phase Goal
Translate documentation, templates, and root markdown files from Vietnamese to English.

## Requirements Coverage
- **TRANS-07**: 12 template files (templates/)
- **TRANS-08**: 14 docs files (docs/ + docs/commands/)
- **TRANS-09**: 12 root .md files
- **TRANS-11**: 4 evals/ files (roadmap Plan 02 Task 2 includes evals/ explicitly)

## Scope Assessment

### Template Files (templates/) — 12 files, ~789 lines
All 12 have Vietnamese content:
- 10 with diacritics: current-milestone(22), plan(92), progress(28), project(33), requirements(35), research(38), roadmap(44), state(31), tasks(38), verification-report(45)
- 2 with non-diacritical Vietnamese only: management-report(17 matches), security-fix-phase(3 matches)

### Docs Files (docs/) — 14 files, ~398 lines
- 2 overview files with diacritics: COMMAND_REFERENCE(23), WORKFLOW_OVERVIEW(33)
- 12 command docs with diacritics: complete-milestone(18), fetch-doc(17), fix-bug(18), init(20), new-milestone(15), plan(26), research(27), scan(18), test(15), update(16), what-next(16), write-code(23)

### Root MD Files — 12 files, ~3741 lines
Roadmap lists 12 files. CLAUDE.md already translated (Phase 65). Actual scope:
- 11 with diacritics: BEFORE_END_FIX_INSTALL(188), BENCHMARK_RESULTS(42), CHANGELOG(252), Change_vietnamese_to_english(3), FINAL_optimize-repo(169), INTEGRATION_GUIDE(250), INTRODUCTION(124), N_FIGMA_TO_HTML_NOTES(120), README(246), Update_test_skills(299), VERSION_BUMP_GUIDE(126)
- 1 already English: CLAUDE.md (translated in Phase 65)

### Evals Files (evals/) — 4 files, ~460 lines
- 4 files with diacritics: prompt-wrapper.js(13), run.js(7), trigger-config.yaml(45), trigger-wrapper.js(7)
- Note: These are JS/YAML files, not .md — translate comments, string literals, and YAML values only

### Test Impact
- smoke-integrity.test.js: 34 remaining diacritical Vietnamese lines (test descriptions and assert messages). These don't check template/doc/root content — they check converter behavior. Not in Phase 68 scope (will be Phase 69 TRANS-10).
- smoke-report-filler.test.js: May reference template content — needs checking during planning.

**Grand total: 42 files, ~5388 lines**

## Decisions

### Carried Forward from Phase 65/66/67

- **D-01: Scope boundaries** — Translate only user-facing Vietnamese text. Preserve code identifiers, file paths, XML tags, frontmatter keys, YAML keys, and placeholder variables.
- **D-02: Preserve structure** — Keep frontmatter, XML tags, markdown formatting, YAML keys, and template placeholders exactly as-is.
- **D-03: No file renames** — File names stay unchanged.
- **D-04: Step numbering** — "Bước N" → "Step N" consistently.
- **D-05: Terminology** — Standardize recurring terms.
- **D-06: Diacritic verification** — Post-translation grep for diacritics to confirm zero remain.
- **D-07: Non-diacritical detection** — Full file review for all files, not just diacritic-based detection.

### New for Phase 68

- **D-08: Template placeholder preservation** — Templates contain `{placeholders}`, `[variable]`, and `<!-- comment -->` markers that downstream tools fill in. Preserve ALL placeholder syntax verbatim.
- **D-09: Evals scope inclusion** — Roadmap Plan 02 Task 2 explicitly includes "evals/ files" despite TRANS-11 being mapped to Phase 69. Include evals/ in Phase 68 to match the roadmap plan structure. For JS files: translate comments and string literals only, preserve code logic. For evals/trigger-config.yaml: translate values/comments only.
- **D-10: Change_vietnamese_to_english.md** — This is a migration planning document. Translate it like any other root MD file per TRANS-09.
- **D-11: CLAUDE.md exclusion** — Already fully English from Phase 65. Skip.
- **D-12: Test assertion scope** — The 34 remaining Vietnamese lines in smoke-integrity.test.js are converter test descriptions/assertions, NOT template/doc content checks. These belong to Phase 69 (TRANS-10: bin/ JS files). Do NOT update test file in Phase 68 unless a specific assertion fails due to template/doc translation.

## Plan Structure (from Roadmap)
- **Plan 01 — Templates + Docs**: Task 1 = 12 template files, Task 2 = 14 docs files
- **Plan 02 — Root MD + Evals**: Task 1 = 6 larger root files (README, INTRODUCTION, INTEGRATION_GUIDE, CHANGELOG, VERSION_BUMP_GUIDE, BENCHMARK_RESULTS), Task 2 = 5 misc root files (BEFORE_END_FIX_INSTALL, FINAL_optimize-repo, N_FIGMA_TO_HTML_NOTES, Update_test_skills, Change_vietnamese_to_english) + 4 evals files

## Prior Art
- Phase 65: Skills + config CLAUDE.md
- Phase 66: Workflow files (write-code, fix-bug, plan, etc.)
- Phase 67: Agents + rules + references
- Temp file strategy: create `.tmp` then `mv`
