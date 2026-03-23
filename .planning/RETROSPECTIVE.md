# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

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

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 1 | 9 | Full optimization cycle: structure → tokens → architecture → capabilities |
| v1.1 | 1 | 4 | Plan quality gate: 7 checks, workflow integration, dynamic reporting |
| v1.2 | 2 | 3 | Audit + verify + fix cycle: systematic quality assurance of existing code |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 303 | Full smoke + snapshot | 0 (js-tiktoken only) |
| v1.1 | 443+ | Smoke + snapshot + plan checker | 0 |
| v1.2 | 448 | Smoke + snapshot + plan checker + integrity | 0 |

### Top Lessons (Verified Across Milestones)

1. TDD contract-first prevents regressions across multi-phase refactoring
2. Measurement before optimization (baseline → target → verify) produces reliable results
3. Pure function patterns enable additive growth without refactoring (v1.0 base converter, v1.1 plan checker)
4. Dynamic rendering > hardcoded content — static lists go stale as soon as the next phase ships
5. Audit-first development: scan → classify → fix produces higher quality than ad-hoc bug hunting (v1.2)
