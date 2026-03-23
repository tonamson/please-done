# Milestones

## v1.2 Skill Audit & Bug Fixes (Shipped: 2026-03-23)

**Phases completed:** 3 phases, 11 plans, 18 tasks

**Key accomplishments:**

- Scanned 35 files (12 skills, 13 references, 10 templates) -- found 9 issues: 0 critical, 5 warnings, 4 info
- Scanned 10 workflow files and 15 JS modules per D-08/D-05 checklists, finding 18 issues (2 critical, 10 warning, 6 info) with extra deep-dive on 3 priority workflows
- 48/48 converter snapshots verified in sync; consolidated audit report with 27 issues (2 critical, 15 warning, 10 info) across 108 files with prioritized Phase 16 recommendations
- 4-level verification cua fix-bug workflow: 20 steps traced, 4 Critical Truths PASS, C2 deep-dived (60-70% projects impacted), 2 new issues (V1 stack fallback gap, V2 effort routing mismatch)
- 4-level verification cua new-milestone workflow: 18 steps traced, 4 Critical Truths PASS, W12 deep-dived (phat hien CONFLICT rules vs Step 3), data flow 5 files traced end-to-end, 2 new issues (V3 conflict Warning-High, V4 reset-phase Info)
- 4-level verification cua write-code workflow: 22 steps traced across 3 modes (default, --auto, --parallel), 5 CT + 6 IT PASS, W9 deep-dived (parallel silent degradation), effort routing KHOP conventions.md. Report 100% hoan chinh: Executive Summary (56/60 PASS), Issue Registry V1-V6, Recommendations cho Phase 16.
- Removed 4 dead exports from utils.js, fixed stale plan-checker header, replaced Unicode escapes in codex.js with UTF-8 Vietnamese, created plan-check.js CLI wrapper, and updated plan.md to use CLI
- Fixed 8 workflow logic issues across 6 files: generic stack fallback, effort routing cleanup, AskUserQuestion conflict resolution, parallel degradation warnings, verification fallback, JSON exclusion rationale, and FastCode bypass option
- Wired 7 missing execution_context references across 5 skills, added 4 audit trail comments, removed hardcoded version from plan-checker.md, clarified conventions.md write-code scope
- 48/48 converter snapshots regenerated after Phase 16 code fixes -- 28 changed reflecting UTF-8, reference wiring, and audit comment updates across 4 platforms
- Fixed YAML comment placement in write-code.md, updated 2 integrity test expectations, regenerated 48 snapshots — 448 tests pass, 0 failures

---

## v1.1 Plan Checker (Shipped: 2026-03-23)

**Phases completed:** 4 phases, 6 plans, 12 tasks

**Key accomplishments:**

- Plan checker rules spec + module with 4 structural validators (requirement coverage, task completeness, dependency correctness, Truth-Task coverage) supporting v1.0 XML and v1.1 markdown formats
- 85 unit + historical validation tests for plan checker with D-17 acceptance gate: zero false positive blocks on all 22 v1.0 historical plans
- Step 8.1 plan checker quality gate integrated into plan workflow with PASS/ISSUES FOUND reporting, Fix/Proceed/Cancel user choices, BLOCK confirmation, and STATE.md audit entries
- 3 advanced check functions (Key Links, Scope Thresholds, Effort Classification) with 5 helpers extending plan-checker.js to 7 total checks, plus rules spec updated to v1.1
- 140 unit tests covering 7 plan checks (4 core + 3 advanced) with makePlanV11WithKeyLinks helper, edge case coverage for all ADV helpers, and historical 22-plan zero-false-positive gate at 7 checks
- Dynamic PASS table with 7-check name mapping and ADV check examples in Step 8.1 workflow

---

## v1.0 Workflow Optimization (Shipped: 2026-03-22)

**Phases completed:** 9 phases, 22 plans, 44 tasks

**Key accomplishments:**

- TDD RED phase: 5 canonical structure enforcement tests defining section order, frontmatter fields, guards separation, output subsections, and reference tagging
- 6 skill files (init, scan, write-code, test, fix-bug, conventions) normalized to canonical 7-section structure with guards, output, and rules sections added
- 6 complex/divergent skills (plan, new-milestone, complete-milestone, what-next, fetch-doc, update) normalized to canonical structure with fixed section order, guards extraction, and output sections
- 4 guard micro-templates + inlineGuardRefs function wired into converter pipeline via inlineWorkflow, with TDD tests for Plan 02 skill updates
- Token counting script with js-tiktoken (cl100k_base) measuring 84,899 baseline tokens across 39 files in 4 directories
- Compressed 4 largest workflow files (61% of workflow content) using telegraphic shorthand, reducing 31,523 -> 18,767 tokens (-40.5%) while preserving all behavioral instructions
- Compressed 6 workflow files (test, complete-milestone, scan, init, what-next, conventions) from 1,317 to 839 lines with 25-50% token reduction per file
- All 12 command/skill files compressed 20.3% (11,187 -> 8,917 tokens) using telegraphic shorthand while preserving canonical structure, frontmatter, and all behavioral instructions
- 7 reference files compressed via telegraphic shorthand: 14,036 to 12,337 tokens (12.1% reduction) with all tables, code examples, and regex patterns preserved intact
- All 10 template files compressed (770->661 lines, 20% tokens), total phase reduction verified at 30.6% across 45 files
- classifyRefs() + CONDITIONAL_LOADING_MAP + inlineWorkflow() modification to produce <conditional_reading> for optional refs, with conventions.md promoted to (required) in all 8 skills
- Added <conditional_reading> sections and task-analysis steps to 6 workflow files, with 4 integration tests verifying the full conditional loading pipeline and 12,549 tokens of optional refs now lazy-loaded
- Effort field (simple/standard/complex) added to task templates, conventions reference, and 4 workflow files enabling per-task model routing (haiku/sonnet/opus)
- 11 regression tests verifying effort classification in templates/conventions and effort->model routing in write-code/fix-bug/test workflows
- Canonical Context7 pipeline reference with 2-step invocation, batch resolve, and 3-option error handling plus operational guard check
- All 5 workflows refactored to reference canonical context7-pipeline.md, removing stack-specific rules and silent fallbacks
- Context7 pipeline expanded with Buoc 0 version detection (3 manifest types + monorepo heuristic) and auto-fallback chain replacing Phase 6 hard-stop error handling
- Kahn's algorithm topological sort with 6-stack hotspot patterns table, > Files: cross-reference, and auto-serialize conflict handling in write-code.md Buoc 1.5
- Buoc 10 parallel upgrade with agent context minimization, post-wave git diff safety net, build check, wave summary report, and plan.md > Files: enforcement for plans >= 3 tasks
- Shared base converter pipeline with config-driven delegation, 48 snapshot tests proving zero behavioral regression across all 4 platform converters
- 7 silent catch blocks replaced with classified error handling -- soft warnings log context via log.warn(), hard errors throw naturally at final fallback

---
