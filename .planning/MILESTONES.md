# Milestones

## v12.0 Pentest & Red Team Enhancement (Shipped: 2026-04-06)

**Phases completed:** 0 phases, 0 plans, 0 tasks

**Key accomplishments:**

- (none recorded)

---

## v11.2 Vietnamese Documentation (Shipped: 2026-04-05)

**Phases completed:** 6 phases, 9 plans, 1 tasks

**Key accomplishments:**

- Translation completed:
- One-liner:
- One-liner:
- One-liner:
- Task 3 (conventions.vi.md):
- Status:

---

## v11.0 Developer Tooling & Observability (Shipped: 2026-04-04)

**Phases completed:** 75 phases, 132 plans, 157 tasks

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
- 1. [Rule 3 - Blocking] Adapt tests cho agent file format thuc te
- 1. [Rule 1 - Bug] Old test batchSize<1 khong tuong thich voi PARALLEL_MIN clamp
- Commit:
- Wire strategy_path vao plan-phase planner prompt (SKIL-04) va PD Research Squad activation vao new-milestone workflow (SKIL-02)
- Them conditional_reading block vao audit.md va scan.md, verify eval pipeline voi promptfooconfig.yaml — nang tong so workflows co conditional_reading len 10.
- Canonical Context7 pipeline reference with 2-step invocation, batch resolve, and 3-option error handling plus operational guard check
- All 5 workflows refactored to reference canonical context7-pipeline.md, removing stack-specific rules and silent fallbacks
- Context7 pipeline expanded with Buoc 0 version detection (3 manifest types + monorepo heuristic) and auto-fallback chain replacing Phase 6 hard-stop error handling
- Kahn's algorithm topological sort with 6-stack hotspot patterns table, > Files: cross-reference, and auto-serialize conflict handling in write-code.md Buoc 1.5
- Buoc 10 parallel upgrade with agent context minimization, post-wave git diff safety net, build check, wave summary report, and plan.md > Files: enforcement for plans >= 3 tasks
- Shared base converter pipeline with config-driven delegation, 48 snapshot tests proving zero behavioral regression across all 4 platform converters
- 7 silent catch blocks replaced with classified error handling -- soft warnings log context via log.warn(), hard errors throw naturally at final fallback
- Tach parseTruthsFromContent() thanh shared module truths-parser.js, refactor generate-diagrams.js import tu helper moi, 6 unit tests + 13 regression tests pass
- generateReproTest() pure function tao skeleton test tai hien loi voi TODO markers, AAA pattern, va node:test imports
- regression-analyzer.js với 2 mode phân tích (FastCode call chain + BFS fallback), max 5 files output, depth 1-2, 14 tests pass
- Tich hop repro-test-generator va regression-analyzer vao workflow fix-bug qua 2 sub-steps blocking (5b.1, 8a), 385 dong, 561 tests pass
- 2 pure functions scanDebugMarkers + matchSecurityWarnings voi 18 smoke tests, TDD red-green
- Chen sub-step 9a vao fix-bug.md — debug cleanup + security warnings truoc commit, 4 platform snapshots cap nhat, 120 tests pass
- Module logic-sync.js voi 4 pure functions: phat hien thay doi logic qua diff heuristics, cap nhat Mermaid report, de xuat CLAUDE.md rules, orchestrator non-blocking
- Chen Buoc 10a vao workflow fix-bug — 3 sub-features non-blocking (logic detection, report update, rule suggestion) + 4 platform snapshots cap nhat
- TDD resource-config.js voi 5 pure functions: tier mapping (scout/haiku, builder/sonnet, architect/opus), parallel limit 2, heavy agent detection qua mcp__fastcode__ pattern, degradation logic cho TIMEOUT/RESOURCE_EXHAUSTED/RATE_LIMIT
- 5 agent files tai .claude/agents/ voi Claude Code native YAML frontmatter (haiku/sonnet/opus) va 10 integration tests verify consistency voi resource-config.js
- TDD evidence-protocol.js — module pure function chuan hoa 3 outcome types voi non-blocking validation va Elimination Log table check
- TDD session-manager.js — pure function module quan ly debug sessions voi folder-based S{NNN}-{slug} structure, 35 tests pass
- 4 pure functions routing ROOT CAUSE choices (Sua ngay/Len ke hoach/Tu sua) tu evidence content, 8 tests pass
- Module checkpoint-handler.js xu ly CHECKPOINT flow va Continuation Agent — extractCheckpointQuestion trich xuat cau hoi, buildContinuationContext tao prompt 4 thanh phan, enforce max 2 vong
- buildParallelPlan() va mergeParallelResults() cho song song Detective + DocSpec, xu ly partial failure non-blocking per D-12/D-13
- Status:
- Commit:
- 1. [Rule 2 - Missing] Xoa fixInstructions trong Architect FAIL fallback (dong 257)
- 1. [Rule 3 - Blocking] Regenerate converter snapshots
- Fix 2 wiring bugs trong fix-bug.md: detectiveResult shape mismatch (INT-07) va runLogicSync return destructuring sai (INT-08) — gap closure cuoi cung cua v2.1
- 1. [Rule 1 - Bug] Cap nhat integrity test regex cho INT-10 pattern moi
- One-liner:
- 1. [Rule 1 - Bug] Fix test assertion cho audit separator
- 1. [Rule 1 - Bug] Sua frontmatter format agent files
- Commit:
- 1. [Rule 3 - Blocking] inlineWorkflow() khong extract research_injection section
- Van de:
- Commit:
- Commit:
- 1. [Rule 1 - Bug] Sua regex section extraction trong parseClaims
- RED:
- 1. [Rule 3 - Blocking] Cai dat js-yaml devDependency
- 1. [Rule 1 - Bug] Fix body text "allowed-tools" leak trong Gemini converter output
- B2 moi — Delta-aware:
- 1. [Rule 2 - Missing] Cap nhat skill audit.md rules dong bo voi workflow
- Commit:
- 1. [Rule 1 - Bug] Cap nhat smoke-utils.test.js platform count tu 5 len 7
- Gộp 14 agent definitions từ `.claude/agents/` vào `commands/pd/agents/`, tạo source of truth duy nhất với 16 agents.
- Thay 14 file thật bằng symlinks + tạo 2 symlinks mới, tổng 16 symlinks trong `.claude/agents/` trỏ về `commands/pd/agents/`.
- Migrated all .claude/agents/ references to commands/pd/agents/ across test, workflow, and 4 snapshot files — zero legacy references remain in core code.
- Converted 2 security agents (pd-sec-fixer, pd-sec-reporter) từ legacy frontmatter sang format mới — tất cả 16 agents giờ dùng cùng format.
- Thêm pd-sec-fixer và pd-sec-reporter vào AGENT_NAMES, cập nhật counts 14→16 — toàn bộ 16 agents pass smoke test.
- Dual-mode guard structure in pd:test skill — standalone soft warnings for FastCode/Context7, standard mode guards byte-for-byte preserved
- Step 0 router + S0.5 recovery + S1-S8 standalone flow with auto-detection for 5 tech stacks, report generation, and bug tracking
- Closed v7.0 Nyquist tech-debt: all 3 VALIDATION.md files updated to compliant, 14 task rows verified ✅ green.
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- Mapper tests (Plan 01 will turn GREEN):
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- Vietnamese commit convention replaced with English, fix-bug-v1.5.md archived to workflows/legacy/, and mermaid-rules.md wiring confirmed — 1224 tests passing
- Files Created:
- Skill Files (16)
- Found during:
- commands/pd/onboard.md
- One-liner:
- One-liner:
- Completed:
- Phase 98: STALE-01 — Map Metadata & Refresh
- Status:
- Status:

---

## v10.0 Skill Repo Audit Fixes (Shipped: 2026-04-03)

**Phases completed:** 4 phases (84–87), 8 plans, 13 requirements

**Key accomplishments:**

- README.md version badge corrected (2.8.0 → 4.0.0), INTEGRATION_GUIDE.md created, 4 missing command docs added (audit, conventions, onboard, status) — DOC-01–04
- Vietnamese commit convention in write-code.md replaced with English; fix-bug-v1.5.md archived to workflows/legacy/ — LANG-01, CLEAN-01, CLEAN-02
- All bare catch blocks in plan-check.js and utils.js replaced with PD_DEBUG conditional logging; all 6 process.exit(1) calls in claude.js replaced with throw new Error() — ERR-01–03
- smoke-onboard.test.js (6 tests) + smoke-error-handling.test.js expanded to 8 tests; full suite: 1232 tests, 0 failures — TEST-01–03
- Integration verified: ERR-03 propagation chain (claude.js → install.js → main().catch()) intact

**Phases completed:** 5 phases (76–80), 10 plans, 6 requirements
**Key deliverables:**

- pd:status read-only 8-field dashboard (Haiku) — STATUS-01
- 3-strike lint recovery path with PROGRESS.md persistence — LINT-01
- Codebase map staleness detection via git commit-delta — STALE-01
- pd:onboard single-command AI orientation skill — ONBOARD-01
- JSONL structured error logging infrastructure (log-schema + log-writer) — LOG-01
- 28-test integration contract test suite for all v8.0 artifacts — INTEG-01
- +79 new tests (1140 → 1216 passing), 0 regressions

## v7.0 Standalone Test Mode (Shipped: 2026-04-02)

**Phases completed:** 5 phases, 6 plans, 7 tasks

**Key accomplishments:**

- Dual-mode guard structure in pd:test skill — standalone soft warnings for FastCode/Context7, standard mode guards byte-for-byte preserved
- Step 0 router + S0.5 recovery + S1-S8 standalone flow with auto-detection for 5 tech stacks, report generation, and bug tracking
- Closed v7.0 Nyquist tech-debt: all 3 VALIDATION.md files updated to compliant, 14 task rows verified ✅ green.

---

## v6.0 Vietnamese → English Migration (Shipped: 2026-03-28)

**Phases completed:** 6 phases, 12 plans, 12 tasks

**Key accomplishments:**

- Translated 7 workflow files (1,058 lines) from Vietnamese to English with zero diacritics remaining and all 56 smoke tests passing.
- Translated 6 larger workflow files (2,552 lines) from Vietnamese to English. All 56 smoke-integrity tests pass. TRANS-03 complete — all 13 workflow files now English.
- One-liner:
- 1. [Rule 1 - Bug] Fixed residual Vietnamese in CHANGELOG.md line 8
- Translated Vietnamese comments, JSDoc, and string literals in all 15 bin/lib/ JS source files to English with cross-module section name coordination

---

## v5.1 Agent Sync & Reference Update (Shipped: 2026-03-27)

**Phases completed:** 5 phases, 5 plans, 4 tasks

**Key accomplishments:**

- Gộp 14 agent definitions từ `.claude/agents/` vào `commands/pd/agents/`, tạo source of truth duy nhất với 16 agents.
- Thay 14 file thật bằng symlinks + tạo 2 symlinks mới, tổng 16 symlinks trong `.claude/agents/` trỏ về `commands/pd/agents/`.
- Migrated all .claude/agents/ references to commands/pd/agents/ across test, workflow, and 4 snapshot files — zero legacy references remain in core code.
- Converted 2 security agents (pd-sec-fixer, pd-sec-reporter) từ legacy frontmatter sang format mới — tất cả 16 agents giờ dùng cùng format.
- Thêm pd-sec-fixer và pd-sec-reporter vào AGENT_NAMES, cập nhật counts 14→16 — toàn bộ 16 agents pass smoke test.

---

## v5.0 Repo Optimization (Shipped: 2026-03-27)

**Phases completed:** 44 phases, 90 plans, 128 tasks

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
- 1. [Rule 3 - Blocking] Adapt tests cho agent file format thuc te
- 1. [Rule 1 - Bug] Old test batchSize<1 khong tuong thich voi PARALLEL_MIN clamp
- Commit:
- Wire strategy_path vao plan-phase planner prompt (SKIL-04) va PD Research Squad activation vao new-milestone workflow (SKIL-02)
- Them conditional_reading block vao audit.md va scan.md, verify eval pipeline voi promptfooconfig.yaml — nang tong so workflows co conditional_reading len 10.
- Canonical Context7 pipeline reference with 2-step invocation, batch resolve, and 3-option error handling plus operational guard check
- All 5 workflows refactored to reference canonical context7-pipeline.md, removing stack-specific rules and silent fallbacks
- Context7 pipeline expanded with Buoc 0 version detection (3 manifest types + monorepo heuristic) and auto-fallback chain replacing Phase 6 hard-stop error handling
- Kahn's algorithm topological sort with 6-stack hotspot patterns table, > Files: cross-reference, and auto-serialize conflict handling in write-code.md Buoc 1.5
- Buoc 10 parallel upgrade with agent context minimization, post-wave git diff safety net, build check, wave summary report, and plan.md > Files: enforcement for plans >= 3 tasks
- Shared base converter pipeline with config-driven delegation, 48 snapshot tests proving zero behavioral regression across all 4 platform converters
- 7 silent catch blocks replaced with classified error handling -- soft warnings log context via log.warn(), hard errors throw naturally at final fallback
- Tach parseTruthsFromContent() thanh shared module truths-parser.js, refactor generate-diagrams.js import tu helper moi, 6 unit tests + 13 regression tests pass
- generateReproTest() pure function tao skeleton test tai hien loi voi TODO markers, AAA pattern, va node:test imports
- regression-analyzer.js với 2 mode phân tích (FastCode call chain + BFS fallback), max 5 files output, depth 1-2, 14 tests pass
- Tich hop repro-test-generator va regression-analyzer vao workflow fix-bug qua 2 sub-steps blocking (5b.1, 8a), 385 dong, 561 tests pass
- 2 pure functions scanDebugMarkers + matchSecurityWarnings voi 18 smoke tests, TDD red-green
- Chen sub-step 9a vao fix-bug.md — debug cleanup + security warnings truoc commit, 4 platform snapshots cap nhat, 120 tests pass
- Module logic-sync.js voi 4 pure functions: phat hien thay doi logic qua diff heuristics, cap nhat Mermaid report, de xuat CLAUDE.md rules, orchestrator non-blocking
- Chen Buoc 10a vao workflow fix-bug — 3 sub-features non-blocking (logic detection, report update, rule suggestion) + 4 platform snapshots cap nhat
- TDD resource-config.js voi 5 pure functions: tier mapping (scout/haiku, builder/sonnet, architect/opus), parallel limit 2, heavy agent detection qua mcp__fastcode__ pattern, degradation logic cho TIMEOUT/RESOURCE_EXHAUSTED/RATE_LIMIT
- 5 agent files tai .claude/agents/ voi Claude Code native YAML frontmatter (haiku/sonnet/opus) va 10 integration tests verify consistency voi resource-config.js
- TDD evidence-protocol.js — module pure function chuan hoa 3 outcome types voi non-blocking validation va Elimination Log table check
- TDD session-manager.js — pure function module quan ly debug sessions voi folder-based S{NNN}-{slug} structure, 35 tests pass
- 4 pure functions routing ROOT CAUSE choices (Sua ngay/Len ke hoach/Tu sua) tu evidence content, 8 tests pass
- Module checkpoint-handler.js xu ly CHECKPOINT flow va Continuation Agent — extractCheckpointQuestion trich xuat cau hoi, buildContinuationContext tao prompt 4 thanh phan, enforce max 2 vong
- buildParallelPlan() va mergeParallelResults() cho song song Detective + DocSpec, xu ly partial failure non-blocking per D-12/D-13
- Status:
- Commit:
- 1. [Rule 2 - Missing] Xoa fixInstructions trong Architect FAIL fallback (dong 257)
- 1. [Rule 3 - Blocking] Regenerate converter snapshots
- Fix 2 wiring bugs trong fix-bug.md: detectiveResult shape mismatch (INT-07) va runLogicSync return destructuring sai (INT-08) — gap closure cuoi cung cua v2.1
- 1. [Rule 1 - Bug] Cap nhat integrity test regex cho INT-10 pattern moi
- One-liner:
- 1. [Rule 1 - Bug] Fix test assertion cho audit separator
- 1. [Rule 1 - Bug] Sua frontmatter format agent files
- Commit:
- 1. [Rule 3 - Blocking] inlineWorkflow() khong extract research_injection section
- Van de:
- Commit:
- Commit:
- 1. [Rule 1 - Bug] Sua regex section extraction trong parseClaims
- RED:
- 1. [Rule 3 - Blocking] Cai dat js-yaml devDependency
- 1. [Rule 1 - Bug] Fix body text "allowed-tools" leak trong Gemini converter output
- B2 moi — Delta-aware:
- 1. [Rule 2 - Missing] Cap nhat skill audit.md rules dong bo voi workflow
- Commit:
- 1. [Rule 1 - Bug] Cap nhat smoke-utils.test.js platform count tu 5 len 7

---

## v3.0 Research Squad (Shipped: 2026-03-26)

**Phases completed:** 8 phases, 14 plans
**Files modified:** 115 | **Net LOC:** +14,504
**Timeline:** 2 days (2026-03-25 → 2026-03-26)

**Key accomplishments:**

- research-store.js — 7 pure functions (createEntry, parseEntry, validateConfidence, generateFilename, validateEvidence, parseClaims, routeQuery) cho structured research storage
- 3 audit modules (confidence-scorer.js, audit-logger.js, index-generator.js) — rule-based confidence scoring, append-only audit log, auto-generated INDEX.md
- 2 research agents (Evidence Collector sonnet + Fact Checker opus) voi source-or-skip protocol chong ao giac
- 3 workflow guards — CHECK-06 Research Backing, CHECK-07 Hedging Language, Strategy Injection tu dong load research context
- pd:research command — auto-route internal/external, pipeline Evidence Collector → INDEX.md → Fact Checker cross-validation
- Gap closure phases 43-45: wire INDEX.md vao pipeline, wire routeQuery vao workflow, claim-level confidence API (parseClaims + createEntry claims rendering)

---

## v2.1 Detective Orchestrator (Shipped: 2026-03-25)

**Phases completed:** 10 phases, 20 plans, 24 tasks

**Key accomplishments:**

- TDD resource-config.js voi 5 pure functions: tier mapping (scout/haiku, builder/sonnet, architect/opus), parallel limit 2, heavy agent detection qua mcp__fastcode__ pattern, degradation logic cho TIMEOUT/RESOURCE_EXHAUSTED/RATE_LIMIT
- 5 agent files tai .claude/agents/ voi Claude Code native YAML frontmatter (haiku/sonnet/opus) va 10 integration tests verify consistency voi resource-config.js
- TDD evidence-protocol.js — module pure function chuan hoa 3 outcome types voi non-blocking validation va Elimination Log table check
- TDD session-manager.js — pure function module quan ly debug sessions voi folder-based S{NNN}-{slug} structure, 35 tests pass
- 4 pure functions routing ROOT CAUSE choices (Sua ngay/Len ke hoach/Tu sua) tu evidence content, 8 tests pass
- Module checkpoint-handler.js xu ly CHECKPOINT flow va Continuation Agent — extractCheckpointQuestion trich xuat cau hoi, buildContinuationContext tao prompt 4 thanh phan, enforce max 2 vong
- buildParallelPlan() va mergeParallelResults() cho song song Detective + DocSpec, xu ly partial failure non-blocking per D-12/D-13
- Status:
- Commit:
- 1. [Rule 2 - Missing] Xoa fixInstructions trong Architect FAIL fallback (dong 257)
- 1. [Rule 3 - Blocking] Regenerate converter snapshots
- Fix 2 wiring bugs trong fix-bug.md: detectiveResult shape mismatch (INT-07) va runLogicSync return destructuring sai (INT-08) — gap closure cuoi cung cua v2.1
- 1. [Rule 1 - Bug] Cap nhat integrity test regex cho INT-10 pattern moi

---

## v1.5 Nang cap Skill Fix-Bug (Shipped: 2026-03-24)

**Phases completed:** 3 phases, 8 plans, 14 tasks

**Key accomplishments:**

- Tach parseTruthsFromContent() thanh shared module truths-parser.js, refactor generate-diagrams.js import tu helper moi, 6 unit tests + 13 regression tests pass
- generateReproTest() pure function tao skeleton test tai hien loi voi TODO markers, AAA pattern, va node:test imports
- regression-analyzer.js với 2 mode phân tích (FastCode call chain + BFS fallback), max 5 files output, depth 1-2, 14 tests pass
- Tich hop repro-test-generator va regression-analyzer vao workflow fix-bug qua 2 sub-steps blocking (5b.1, 8a), 385 dong, 561 tests pass
- 2 pure functions scanDebugMarkers + matchSecurityWarnings voi 18 smoke tests, TDD red-green
- Chen sub-step 9a vao fix-bug.md — debug cleanup + security warnings truoc commit, 4 platform snapshots cap nhat, 120 tests pass
- Module logic-sync.js voi 4 pure functions: phat hien thay doi logic qua diff heuristics, cap nhat Mermaid report, de xuat CLAUDE.md rules, orchestrator non-blocking
- Chen Buoc 10a vao workflow fix-bug — 3 sub-features non-blocking (logic detection, report update, rule suggestion) + 4 platform snapshots cap nhat

---

## v1.4 Mermaid Diagrams (Shipped: 2026-03-24)

**Phases completed:** 13 phases, 29 plans, 56 tasks

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
- Mermaid aesthetic rules spec (8 sections, 5-color Corporate Blue palette, 6 Shape-by-Role mappings) and 7-section Vietnamese management report template with Mermaid flowchart placeholders
- TDD pure function mermaidValidator() with 6 checks (3 syntax + 3 style), zero dependencies, 16 tests passing
- generateBusinessLogicDiagram() pure function — Truths table to Mermaid flowchart TD with auto subgraph splitting, cross-plan arrows from depends_on, Vietnamese labels, mermaidValidator retry
- generateArchitectureDiagram() pure function — ARCHITECTURE.md layer parser to milestone-scoped Mermaid flowchart LR with layered subgraphs and role-based shapes (rectangle/cylinder/rounded/subroutine)
- CLI generate-pdf-report.js with Puppeteer A4 PDF rendering, Mermaid SVG wait, and graceful .md fallback to process.cwd()/.planning/reports/
- fillManagementReport() pure function điền template báo cáo quản lý với Mermaid diagrams section-specific, tích hợp Bước 3.6 non-blocking vào workflow complete-milestone

---

## v1.3 Truth-Driven Development (Shipped: 2026-03-24)

**Phases completed:** 4 phases, 5 plans, 10 tasks
**Files modified:** 29 | **Net LOC:** +1,033

**Key accomplishments:**

- 5-column Truths table with backward-compatible parser, CHECK-04 Direction 2 upgraded to BLOCK severity
- Planner workflow updated with 5-column Truths instruction and 4 converter snapshots regenerated
- Buoc 1.7 Re-validate Logic step in write-code workflow with typed evidence verification-report
- Buoc 6.5 Logic Update in fix-bug workflow with Truth correction before code fix, plus Logic Changes tracking in both workflows and progress template
- Split CHECK-04 into Direction 1 (BLOCK) + new CHECK-05 checkLogicCoverage Direction 2 (configurable WARN) with 154 tests passing

---

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
