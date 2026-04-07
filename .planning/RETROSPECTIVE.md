# Project Retrospective

_A living document updated after each milestone. Lessons feed forward into future planning._

## Milestone: v1.0 — Workflow Optimization

**Shipped:** 2026-03-22
**Phases:** 9 | **Plans:** 22 | **Tasks:** 44

### What Was Built

- 30.6% token reduction across 45 workflow/skill/template files (84,899 → 58,952 tokens)
- Conditional context loading — 12,549 tokens of optional refs lazy-loaded per invocation
- Effort-level routing — task complexity classification with automatic model selection
- Context7 standardization — canonical pipeline with version detection and auto-fallback
- Wave-based parallel execution — topological sort with file-conflict detection
- Base converter pipeline — shared 9-step logic across 4 platform converters

### What Worked

- TDD contract-first approach (Phase 1) — tests caught regressions throughout all 9 phases
- Single-day execution — all 9 phases shipped in one session with zero rework
- Wave-based plan execution — independent plans executed in parallel, dependent plans serialized
- Snapshot testing (Phase 9) — 48 comparisons guaranteed zero behavioral regression during converter refactoring
- Guard micro-templates (Phase 2) — single source of truth for shared instructions

### What Was Inefficient

- ROADMAP.md progress table got out of sync (Phases 5-7 showed "Not started" while plans were marked [x])
- Some phases could have been parallelized further (Phase 6 independent of Phases 2-5 but ran sequentially)

### Patterns Established

- Canonical section order for skills: frontmatter, guards, execution, output
- `(required)` / `(optional)` tagging in execution_context as load-control signals
- Guard micro-templates for cross-skill deduplication
- Template method pattern for converter base with config objects
- Classified error handling: hard errors throw, soft warnings log.warn()

### Key Lessons

1. Compress AFTER format stabilizes — Phase 3 ran after Phase 1-2 normalized structure
2. Snapshot testing is essential for refactoring — captures before/after with zero false positives
3. Token counting tooling (js-tiktoken) pays for itself immediately — measurement drives optimization
4. Pure function style scales better than class hierarchies for this codebase size

### Cost Observations

- Model mix: ~70% opus (planning + execution), ~30% sonnet (verification + checking)
- Sessions: 1 (single continuous session)
- Notable: 303 tests run in <1 second — near-zero feedback latency

---

## Milestone: v1.1 — Plan Checker

**Shipped:** 2026-03-23
**Phases:** 4 | **Plans:** 6 | **Tasks:** 12

### What Was Built

- Plan checker engine with 7 structural validators (4 core + 3 advanced) — pure functions, no I/O
- Automatic integration into plan workflow (Step 8.1) with PASS/ISSUES FOUND reporting
- 140 unit tests with zero false positives on 22 historical plans
- Dynamic PASS table rendering all checks from runAllChecks result

### What Worked

- Pure function design — all check functions take content strings as args, no file I/O, fully testable
- Historical validation gate (D-17) — requiring zero false positives on 22 v1.0 plans caught potential regressions
- Additive module expansion — Phase 12 extended plan-checker.js from 18 to 26 exports without breaking existing functionality
- Audit-driven gap closure — milestone audit caught PASS table display gap, Phase 13 fixed it cleanly

### What Was Inefficient

- Phase 11 hardcoded PASS table with 4 check names — should have been dynamic from start (required Phase 13 to fix)
- Snapshot regeneration missed in Phase 13 — integration checker caught it during re-audit
- Nyquist VALIDATION.md files auto-created but never filled — process overhead for no value in this milestone

### Patterns Established

- Check function signature pattern: `function checkXxx(planContent, tasksContent)` returning `{ checkId, status, issues }`
- Name mapping for dynamic UI rendering (checkId → human-readable name)
- 3-source cross-reference for requirements verification (VERIFICATION + SUMMARY + REQUIREMENTS)

### Key Lessons

1. Dynamic rendering > hardcoded lists — Phase 11's static table immediately went stale when Phase 12 added checks
2. Snapshot tests catch workflow changes too — converters transpile plan.md, so plan.md changes must regenerate snapshots
3. Gap closure phases should be small and fast — Phase 13 was 1 plan, 2 tasks, done in minutes
4. Pure function check pattern is highly extensible — adding 3 checks in Phase 12 required no refactoring of existing 4

### Cost Observations

- Model mix: ~60% opus (planning + execution), ~40% sonnet (verification + checking + integration)
- Sessions: 1 (single continuous session, same day as v1.0)
- Notable: 140 tests run in <0.2 seconds — instant feedback

---

## Milestone: v1.2 — Skill Audit & Bug Fixes

**Shipped:** 2026-03-23
**Phases:** 3 | **Plans:** 11 | **Tasks:** 18

### What Was Built

- Comprehensive audit of 108 files (12 skills, 10 workflows, 15 JS modules, 13 references, 10 templates) — 27 issues found
- End-to-end verification of 3 critical workflows (new-milestone, write-code, fix-bug) — 60 steps, 29 Truths
- 22/27 issues fixed, 5 deferred with documented decisions, 448 tests pass with 0 failures
- Plan-check.js CLI wrapper separating file I/O from library logic
- 48/48 converter snapshots verified and regenerated after fixes

### What Worked

- Audit-first approach — Phase 14-15 found all issues before Phase 16 started fixing, no guesswork
- 4-level verification methodology (Surface → Logic → Cross-ref → Deep-dive) caught issues that surface scanning missed
- Issue severity classification (Critical/Warning/Info) naturally prioritized fix order
- Gap closure pattern (Phase 16-05) — verification caught 3 remaining gaps, small plan closed them all
- YAML comment placement lesson: audit comments in markdown must not break YAML frontmatter

### What Was Inefficient

- V4 (reset-phase-numbers conflict detection) fell through cracks — not fixed, not formally deferred
- Phase 14 predates Nyquist adoption, no VALIDATION.md generated — partial compliance
- SUMMARY.md frontmatter in Plans 15-02/15-03 missing requirement IDs — metadata gap caught by milestone audit

### Patterns Established

- 4-level verification methodology for workflow tracing (Surface → Logic → Cross-ref → Deep-dive)
- Audit report format: consolidated findings with severity, affected files, and fix recommendations
- Execution_context references marked `(optional)` to avoid breaking existing flows
- HTML comment format for audit trail comments in markdown files
- CLI wrapper pattern: bin/ script handles I/O, lib/ module stays pure

### Key Lessons

1. Audit + fix in same milestone works well for small-to-medium issue counts (27 issues here)
2. Verification reports are the highest-value audit artifact — they catch integration issues that unit tests miss
3. Always check YAML frontmatter validity after editing markdown files with inline content
4. Info-level issues still need explicit defer decisions — V4 slipped through without one
5. Snapshot regeneration is a mandatory step after any source file changes — make it a checklist item

### Cost Observations

- Model mix: ~60% opus (planning + auditing), ~40% sonnet (execution + verification)
- Sessions: 2 (audit + verification in session 1, bug fixes in session 2)
- Notable: 448 tests run in ~608ms — feedback loop under 1 second

---

## Milestone: v1.3 — Truth-Driven Development

**Shipped:** 2026-03-24
**Phases:** 4 | **Plans:** 5 | **Tasks:** 10

### What Was Built

- 5-column Truths table (ID, Description, Business Value, Edge Cases, Verification) with backward-compatible parser
- Buoc 1.7 Re-validate Logic — AI paraphrases business logic before writing code (~100 token budget)
- Buoc 6.5 Logic Update — fix-bug workflow corrects Truths before code fix when bug is logic-related
- Logic Changes tracking in both write-code and fix-bug workflows
- CHECK-05 checkLogicCoverage — detects orphan tasks/Truths with configurable WARN severity
- CHECK-04 refactored: Direction 1 (BLOCK) kept, Direction 2 extracted to CHECK-05

### What Worked

- Milestone audit driving gap closure — 3 phases (18-20) emerged from v1.3 audit identifying orphaned requirements
- Small, focused phases — each phase had 1 plan targeting 2-3 requirements, completed in 3-8 minutes
- Surgical workflow edits — Buoc 1.7 and 6.5 inserted precisely without disrupting existing flow
- Configurable severity for CHECK-05 — WARN by default allows projects to opt into stricter enforcement

### What Was Inefficient

- Phase 17 had 2 plans while Phases 18-20 had 1 each — inconsistent granularity, though Phase 17 covered more ground
- Snapshot regeneration required after every workflow change — predictable but adds overhead

### Patterns Established

- Truth-driven enforcement: every task must trace to a business logic truth (CHECK-04 BLOCK)
- Logic re-validation before code changes (Buoc 1.7) — prevents drift between plan and implementation
- Conditional tracking sections — Logic Changes only appears when changes actually occur (D-14 pattern)
- Check function splitting pattern — extract sub-check to separate function when severity needs differ

### Key Lessons

1. Milestone audits are high-value — they caught 3 orphaned requirements that would have been missed
2. Inserting workflow steps requires precise placement — Buoc 6.5 between 6c and 7 maintains flow integrity
3. Configurable severity is better than fixed — projects have different maturity levels
4. Small gap-closure phases execute faster than multi-requirement phases — keep phases focused

### Cost Observations

- Model mix: ~50% opus (planning + research), ~50% sonnet (execution + verification)
- Sessions: 2 (Phase 17 in session 1, Phases 18-20 in session 2)
- Notable: 154 plan-checker tests covering 8 checks — comprehensive quality gate

---

## Milestone: v1.4 — Mermaid Diagrams

**Shipped:** 2026-03-24
**Phases:** 4 | **Plans:** 7 | **Tasks:** 13

### What Was Built

- Mermaid aesthetic rules spec (Corporate Blue palette, Shape-by-Role mappings) + Vietnamese management report template
- mermaidValidator() pure function (6 checks: 3 syntax + 3 style, 16 tests)
- generateBusinessLogicDiagram() — Truths table → Mermaid flowchart TD with auto subgraph splitting
- generateArchitectureDiagram() — ARCHITECTURE.md layer parser → Mermaid flowchart LR with role-based shapes
- pdf-renderer.js pure library (markdownToHtml regex parser, buildHtml A4 template, Mermaid CDN)
- generate-pdf-report.js CLI (Puppeteer A4 PDF + graceful .md fallback)
- fillManagementReport() pure function (template fill + section-specific Mermaid replacement)
- Buoc 3.6 non-blocking report generation in complete-milestone workflow

### What Worked

- Pure function pattern consistent across all 4 phases — no file I/O in any library module
- Building blocks approach — Phase 21 foundation → Phase 22 diagrams → Phase 23 PDF → Phase 24 integration
- TDD on every phase — tests written before implementation, 0 regressions
- Section-specific Mermaid replacement — prevents cross-section pollution between Section 3 (TD) and Section 4 (LR)
- Non-blocking pipeline design — each sub-step has independent try/catch, milestone completion never blocked

### What Was Inefficient

- Phase 23 plan 01 SUMMARY.md missing — had to create retroactively during milestone completion
- Milestone audit stale — ran before phases 22-24 existed in ROADMAP, flagged all requirements as orphaned
- Nyquist VALIDATION.md had to re-research to include Validation Architecture section

### Patterns Established

- Section-specific content replacement in templates (sectionPrefix matching before regex replacement)
- Non-blocking pipeline: each sub-step wrapped in try/catch, errors logged as warnings
- Template fill as pure function: content strings in, filled markdown out, no file I/O
- Diagram generation as pure function: data structures in, Mermaid text out, with validation retry

### Key Lessons

1. Always create SUMMARY.md immediately after plan execution — retroactive creation during milestone is error-prone
2. Milestone audits should be re-run after all phases are added to ROADMAP — stale audits create false gaps
3. Non-blocking pipeline pattern is essential for optional features — report generation must never block core workflow
4. Pure function pattern scales well — 7 library modules now follow the same pattern (plan-checker, generate-diagrams, pdf-renderer, mermaid-validator, report-filler, utils)

### Cost Observations

- Model mix: ~60% opus (research + planning + execution), ~40% sonnet (verification + checking)
- Sessions: 1 (all 4 phases completed in single session)
- Notable: 526 total tests, all passing in <1 second

---

## Milestone: v6.0 — Vietnamese → English Migration

**Shipped:** 2026-03-29
**Phases:** 6 (65-70) | **Plans:** 12 | **Commits:** 61 | **Duration:** 12 days

### What Was Built

- Full codebase language migration from Vietnamese to English across all file types
- 14 skill files, 13 workflow files, 16 agent files, 8 rules files translated
- 15 reference files, 12 template files, 14 docs files, 12 root markdown files translated
- 33 JS source files (JSDoc, comments, string literals) translated
- 56 snapshots regenerated from translated skill sources
- Comprehensive verification sweep confirming zero Vietnamese outside `.planning/`

### What Worked

- Phase-by-file-type grouping — each phase had a clear, bounded scope (skills, workflows, agents, etc.)
- Snapshot-first approach (Phase 65) — translating skill sources first, then regenerating 56 snapshots, prevented cascade failures
- Wave-based dependency ordering — JS source (Phase 69 Plans 01-02) before test assertions (Plan 03) avoided double-work
- Milestone audit caught 40 test sync issues — systematic verification after all phases found edge cases manual testing missed
- Separation of concerns — `.planning/` directory explicitly excluded from translation scope

### What Was Inefficient

- Phase 69 required 3 plans when 2 would have sufficed — batch 1/batch 2 split for JS files was arbitrary
- Some test assertion updates were done during source phases instead of waiting for Phase 69 Plan 03, causing redundant edits
- Duplicate content appeared in ROADMAP.md Phase 69 section (Plan 02/03 listed twice) — copy-paste artifact not caught until archival

### Patterns Established

- Translation-only migration: zero behavioral changes — only language of comments, strings, and documentation changed
- Grep-based verification sweep as final phase — comprehensive pattern matching catches stragglers
- `.planning/` exclusion convention — internal planning artifacts keep original language for historical accuracy

### Key Lessons

1. File-type grouping is the right unit for translation phases — not module-based or feature-based
2. Snapshot regeneration must happen immediately after source translation — stale snapshots cause cascading test failures
3. Milestone audits are essential for translation work — subtle string mismatches are invisible during manual review
4. 40+ test fixes during audit phase proves that translation is deceptively complex — every string literal is a potential break point
5. Excluding planning artifacts from scope is correct — they serve as historical records

---

## Milestone: v12.1 — Quality Hardening

**Shipped:** 2026-04-06
**Phases:** 12 (125-136) | **Plans:** 12 | **Duration:** 1 day

### What Was Built

- Fixed 5 broken command references in CLAUDE.md and documentation
- Updated test infrastructure with nested test patterns and c8 coverage tool
- Unfroze CHANGELOG.md with v3.0-v12.0 milestone entries
- Fixed 28 bare catch blocks with proper logging across 10 JavaScript files
- Created AGENTS.md as source of truth for cross-runtime agent instructions (12 platforms)
- Implemented sync script for automatic deployment to Claude Code, Codex, Gemini, OpenCode, Copilot, Cursor, Windsurf, Cline, Trae, Augment, Kilo, Antigravity
- Archived orphaned files and organized loose documentation notes
- Added gsd-verifier format VERIFICATION.md for phases 125-126
- Upgraded phases 130-131 verification to full gsd-verifier format
- Corrected REQUIREMENTS.md traceability table alignment

### What Worked

- Gap-closure phases (133-136) efficiently addressed audit findings — small, focused fixes
- AGENTS.md + sync script pattern enables DRY agent instructions across 12 platforms
- gsd-verifier format standardization improves verification consistency across phases
- Milestone audit caught Phase 136 gap before archival — prevented shipping incomplete docs

### What Was Inefficient

- Duplicate Phase 128 directories created confusion (superseded by Phase 132)
- Milestone audit ran before Phase 136 execution, creating false "gaps_found" status
- VERIFICATION.md format varied across phases until Phase 134 standardized them

### Patterns Established

- AGENTS.md as single source of truth for all runtime agent instructions
- Sync script integrated into install/postinstall for automatic deployment
- gsd-verifier format for all new phase verification reports
- Milestone audit should run AFTER all phases in ROADMAP — not during active execution

### Key Lessons

1. Gap-closure phases are fast and effective — 4 phases (133-136) addressed all audit gaps in <1 day
2. Duplicate phase directories cause ROADMAP confusion — clean up superseded phases before archival
3. Milestone audit timing matters — audit after all phases complete, not during execution
4. Cross-runtime sync pattern is reusable — single file + sync script = 12 platforms

### Cost Observations

- Model mix: ~60% opus (planning + execution), ~40% sonnet (verification)
- Sessions: 1 (all 12 phases completed in continuous session)
- Notable: 12 gap-closure phases executed efficiently with clear audit trail

---

## Milestone: v12.2 — Developer Experience Improvements

**Shipped:** 2026-04-07
**Phases:** 8 (137-144) | **Plans:** 9 | **Duration:** 1 day

### What Was Built

- Merged `pd:next` auto-execute behavior into `pd:what-next --execute` (SlashCommand integration, backward-compatible)
- Created `pd:stats` with `stats-collector.js` library (7 pure functions, 29 tests, boxed unicode output)
- Built `pd:health` with `health-checker.js` (5 check categories, 3-level severity classification, grouped report)
- Version badge sync via `version-sync.js` (9 exports) + `pd:sync-version` + complete-milestone integration
- MCP Tool Discovery across 12 platforms via `mcp-discovery.js` + `pd:discover` (JSON/TOML config parsing)
- Discussion audit trail with auto-capture hook via `audit-trail.js` + `pd:audit` (30 TDD tests)
- Scope reduction detection wired into health + milestone workflow via `scope-checker.js` (25 TDD tests)
- Schema drift detection for STATE.md validation via `drift-detector.js` (31 TDD tests, 6 exports)

### What Worked

- 1-requirement-per-phase structure kept each phase small, independently verifiable, and fast to ship
- TDD-first (RED→GREEN) produced clean, well-tested libraries with zero regressions
- Pure function pattern scales consistently — each library has 5-9 exports, all individually testable
- Phases 137-142 ran in any order (no cross-dependencies) — enabled flexible sequencing

### What Was Inefficient

- Snapshot tests failed on new skill files (what-next, health, stats, discover, sync-version) — stale snapshots not updated during execution
- VERIFICATION.md files for phases 138 and 141 were not written during execution — required audit fix pass
- Discussion audit trail scope reduction warning (L-06 in PLAN vs SUMMARY) — `formatAuditTable` one-liner absent in SUMMARY

### Patterns Established

- TDD (RED→GREEN) as standard for all pure-function libraries in this codebase
- Scope checker and drift detector wired into `pd:health` and `pd:complete-milestone` as non-blocking gates
- Version sync step in `complete-milestone.md` (Step 8.5) for automated badge propagation
- `audit-trail.js` captures CONTEXT.md metadata for traceability across discuss/plan/execute phases

### Key Lessons

1. Snapshot tests must be updated whenever skill file content changes — treat stale snapshots as a code smell
2. VERIFICATION.md should be created immediately after plan execution, not deferred to audit phase
3. 1-req-per-phase produces the most predictable delivery — audit gaps were administrative, not functional
4. Non-blocking integration (scope-checker, drift-detector) is the right pattern for diagnostic tools

### Cost Observations

- Model mix: ~70% sonnet (execution), ~30% opus (planning + audit)
- Sessions: 1 (all 8 phases and audit pass in continuous session)
- Notable: 75 commits, 239 files changed, 15,644 insertions / 21,859 deletions (net shrink due to audit cleanup)

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change                                                                        |
| --------- | -------- | ------ | --------------------------------------------------------------------------------- |
| v1.0      | 1        | 9      | Full optimization cycle: structure → tokens → architecture → capabilities         |
| v1.1      | 1        | 4      | Plan quality gate: 7 checks, workflow integration, dynamic reporting              |
| v1.2      | 2        | 3      | Audit + verify + fix cycle: systematic quality assurance of existing code         |
| v1.3      | 2        | 4      | Truth-driven enforcement: logic validation before code, orphan detection          |
| v1.4      | 1        | 4      | Visual reporting: Mermaid diagrams, PDF export, non-blocking workflow integration |
| v6.0      | 4+       | 6      | Full Vietnamese → English migration: all file types, 61 commits, 40 audit fixes   |
| v12.1     | 1        | 12     | Quality hardening: cross-runtime support, verification standardization, gap closure |
| v12.2     | 1        | 8      | Developer experience: stats/health/audit/discovery/sync/scope/drift pure-function libraries |

### Cumulative Quality

| Milestone | Tests              | Coverage                                                        | Zero-Dep Additions     |
| --------- | ------------------ | --------------------------------------------------------------- | ---------------------- |
| v1.0      | 303                | Full smoke + snapshot                                           | 0 (js-tiktoken only)   |
| v1.1      | 443+               | Smoke + snapshot + plan checker                                 | 0                      |
| v1.2      | 448                | Smoke + snapshot + plan checker + integrity                     | 0                      |
| v1.3      | 154 (plan-checker) | 8 checks incl. CHECK-05 logic coverage                          | 0                      |
| v1.4      | 526 total          | Smoke + snapshot + plan-checker + diagram + PDF + report-filler | 0 (Puppeteer optional) |
| v6.0      | 1101               | Full smoke + snapshot + integrity + all modules                 | 0                      |

### Top Lessons (Verified Across Milestones)

1. TDD contract-first prevents regressions across multi-phase refactoring
2. Measurement before optimization (baseline → target → verify) produces reliable results
3. Pure function patterns enable additive growth without refactoring (v1.0 base converter, v1.1 plan checker)
4. Dynamic rendering > hardcoded content — static lists go stale as soon as the next phase ships
5. Audit-first development: scan → classify → fix produces higher quality than ad-hoc bug hunting (v1.2)
6. Milestone audits catch orphaned requirements — gap-closure phases are small and fast (v1.3)
7. Non-blocking pipeline pattern essential for optional features — never block core workflow (v1.4)
8. Pure function pattern scales to 7+ modules — consistent testability and composability (v1.0-v1.4)
9. Translation-only migrations need milestone audits — subtle string mismatches are invisible during manual review (v6.0)
10. File-type grouping is the correct unit for cross-cutting changes like translation (v6.0)
