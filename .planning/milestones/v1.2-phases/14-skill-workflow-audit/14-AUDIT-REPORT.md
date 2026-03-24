# Phase 14: Skill & Workflow Audit Report

**Date:** 2026-03-23
**Phase:** 14-skill-workflow-audit
**Auditor:** Claude (automated scan)
**Plans executed:** 3 (14-01 Skills, 14-02 Workflows + JS, 14-03 Snapshots + Consolidation)

## Executive Summary

| Category | Files Scanned | Critical | Warning | Info | Total |
|----------|---------------|----------|---------|------|-------|
| Skills (AUDIT-01) | 12 | 0 | 1 | 3 | 4 |
| References (AUDIT-01) | 13 | 0 | 2 | 1 | 3 |
| Templates (AUDIT-01) | 10 | 0 | 2 | 0 | 2 |
| Workflows (AUDIT-02) | 10 | 1 | 7 | 1 | 9 |
| JS Modules (AUDIT-02) | 15 | 1 | 3 | 5 | 9 |
| Snapshots (AUDIT-03) | 48 | 0 | 0 | 0 | 0 |
| **Total** | **108** | **2** | **15** | **10** | **27** |

**Overall health:** Good. No showstopper bugs. 2 critical issues are logic gaps (not crashes). 15 warnings are improvement opportunities. 10 info items are style/cleanup notes.

## Snapshot Sync Results (AUDIT-03)

**Status:** 48/48 snapshots in sync, 0 mismatches found

All 48 converter snapshots (4 platforms x 12 skills) were regenerated from current source files and compared against the committed baselines. Zero differences detected.

- **Verification method:** `node test/generate-snapshots.js` + `git diff test/snapshots/`
- **Smoke test:** `node --test test/smoke-snapshot.test.js` -- 48/48 pass, 0 fail
- **Platforms verified:** codex, copilot, gemini, opencode
- **Skills verified:** complete-milestone, conventions, fetch-doc, fix-bug, init, new-milestone, plan, scan, test, update, what-next, write-code

### Mismatches

No mismatches found -- all 48 snapshots in sync with current source files.

## All Issues by Severity

### Critical Issues

| # | Source | File | Line | Description | Suggested Fix |
|---|--------|------|------|-------------|---------------|
| C1 | AUDIT-02 | `bin/lib/plan-checker.js` | N/A | Module is exported but NEVER imported by any runtime code in `bin/`. Only imported by test file `test/smoke-plan-checker.test.js`. The workflow `plan.md` references it by path string in documentation (Step 8.1), but the actual `require()` is absent from any executable module. The AI agent calls `runAllChecks` by reading the file path from the workflow text, not via a Node.js `require` chain. | Verify this is intentional (agent reads + executes inline). If a CLI entry point is planned, create `bin/plan-check.js` that imports and runs the checker. |
| C2 | AUDIT-02 | `workflows/fix-bug.md` | 133-140 | Stack-specific trace flows reference specific framework patterns (NestJS, NextJS, WordPress, Solidity, Flutter) but there is NO error handling for unknown/generic stacks. If a project uses Express, FastAPI, or another unlisted framework, the workflow provides no fallback tracing guidance. | Add a "Generic/Other" row to the stack trace table with general debugging flow: "entry point -> handler -> business logic -> data layer -> response". |

### Warning Issues

| # | Source | File | Line | Description | Suggested Fix |
|---|--------|------|------|-------------|---------------|
| W1 | AUDIT-01 | `templates/progress.md` | N/A | ORPHANED template -- not referenced by any skill or workflow via `@templates/progress.md`. The write-code workflow mentions PROGRESS.md concept inline but never loads this template via the standard `@templates/` loading mechanism. | Either add `@templates/progress.md` to write-code.md skill's execution_context (optional), or inline its content into the workflow since the workflow already describes the format. |
| W2 | AUDIT-01 | `references/plan-checker.md` | N/A | Not referenced by any skill or workflow via `@references/plan-checker.md`. Only referenced indirectly by `workflows/plan.md` as `bin/lib/plan-checker.js` (the JS module). The reference doc serves as a spec for the JS implementation, not as a skill/workflow dependency. | Add `@references/plan-checker.md (optional)` to the `plan.md` skill's execution_context so the plan checker rules are loadable when running the plan workflow's Step 8 (plan quality check). |
| W3 | AUDIT-01 | `commands/pd/new-milestone.md` | 30 | Guard condition `- [ ] WebSearch kha dung khi can nghien cuu` is missing the standard `-> "error message"` pattern used by all other guard conditions. | Add error message: `- [ ] WebSearch kha dung khi can nghien cuu -> "WebSearch khong kha dung. Kiem tra ket noi mang."` |
| W4 | AUDIT-01 | `references/context7-pipeline.md` | N/A | Referenced by 4 workflows (write-code, test, plan, fix-bug) but not listed in ANY skill's execution_context section. Skills load workflows, and workflows reference this pipeline -- but the pipeline is a lazy-loaded dependency, never explicitly declared at the skill level. | Consider adding `@references/context7-pipeline.md (optional)` to skills that list `@references/guard-context7.md` in guards for transparency. |
| W5 | AUDIT-01 | `templates/verification-report.md` | N/A | Only referenced by 1 workflow (`workflows/write-code.md` line 320) and 0 skills. Low reference count. The complete-milestone workflow also discusses verification but doesn't reference this template. | Consider adding `@templates/verification-report.md (optional)` to the complete-milestone.md skill's execution_context since Step 3 performs verification. |
| W6 | AUDIT-02 | `bin/lib/utils.js` | 125-128 | `assembleMd()` is exported but never imported by any other module (dead export). Only used internally within utils.js itself. No consumer in bin/, test/, or anywhere else. | Remove from exports or mark as internal-only. |
| W7 | AUDIT-02 | `bin/lib/utils.js` | 13-23 | `COLORS` and `colorize` are exported but never directly imported by external modules. They are only used internally via the `log` object. External consumers always import `log`, not `COLORS`/`colorize`. | Remove `COLORS` and `colorize` from module.exports. They are implementation details of the `log` object. |
| W8 | AUDIT-02 | `bin/lib/utils.js` | 251-260 | `CONDITIONAL_LOADING_MAP` is exported but only used internally within `inlineWorkflow()`. No external consumer imports it directly. | Remove from module.exports unless test coverage requires direct access. |
| W9 | AUDIT-02 | `workflows/write-code.md` | 353-377 | The `--parallel` mode (Step 10) parallel wave conflict detection relies on `> Files:` metadata in TASKS.md. If `> Files:` is missing or incomplete, the conflict detection silently falls back with no guarantee of correctness. | Add explicit warning to user when `> Files:` is missing: "Conflict detection degraded -- manual review recommended after wave completes." |
| W10 | AUDIT-02 | `workflows/complete-milestone.md` | 36-53 | Step 2 "Stale?" check uses `git log --oneline --grep="\\[LOI\\]"` which only works for Vietnamese-prefixed bug fix commits. If commits use English prefixes or different formats, the staleness detection fails silently. | Make the staleness grep pattern configurable or check commit dates against TEST_REPORT date regardless of commit prefix. |
| W11 | AUDIT-02 | `workflows/complete-milestone.md` | 62-90 | Step 3.5 (goal-backward verification) is comprehensive but extremely complex (28 lines, 4 levels). No guidance on what to do if verification tools fail. | Add a fallback instruction: "If verification tools fail, document the failure and proceed with manual verification flag." |
| W12 | AUDIT-02 | `workflows/new-milestone.md` | 73-110 | Step 3 "check existing roadmap" AskUserQuestion fallback says "Khong hoi duoc -> tu dong sao luu" but lacks clarity on timeout/unavailability conditions. | Clarify: "If AskUserQuestion is not available as a tool OR user does not respond within reasonable time -> auto backup." |
| W13 | AUDIT-02 | `workflows/plan.md` | 298-435 | Step 8.1 (Plan Checker) is extremely long at 137 lines with 9 sub-sections (A through I) with nested decision trees. This makes the step hard to follow. | Consider splitting into separate numbered steps or extracting the plan-checker interaction into a dedicated reference document. |
| W14 | AUDIT-02 | `workflows/scan.md` | 14-15 | Step 2 excludes `.json` and `.css` files from initial code detection glob, but `.json` files are read in later steps anyway. The exclusion lacks rationale. | Add brief rationale: "(.json excluded from code detection because config files don't indicate active source code)." |
| W15 | AUDIT-02 | `workflows/init.md` | 14-17 | Step 2 checks FastCode MCP with `mcp__fastcode__list_indexed_repos` and STOPS if it fails. Overly strict -- no bypass option for users who want to initialize without FastCode. | Consider adding a "continue without FastCode" option with degraded functionality warning. |

### Info Issues

| # | Source | File | Line | Description | Suggested Fix |
|---|--------|------|------|-------------|---------------|
| I1 | AUDIT-01 | `commands/pd/fetch-doc.md` | 33 | execution_context says "Khong co -- skill nay xu ly truc tiep, khong dung workflow rieng." This is consistent with the skill having its full process logic embedded. Same pattern applies to `update.md`. Both are valid self-contained skills. | No fix needed -- document as intentional pattern for lightweight/utility skills. |
| I2 | AUDIT-01 | `commands/pd/update.md` | 35 | Same as I1 -- self-contained skill with 9-step embedded process. | No fix needed -- intentional pattern for utility skills. |
| I3 | AUDIT-01 | `references/plan-checker.md` | 297 | Contains hardcoded version string `Plan Checker Rules v1.1` and date `Updated: 23_03_2026`. Maintenance concern as rules evolve. | Consider removing the version string from the footer, or ensure it is updated automatically. |
| I4 | AUDIT-01 | `commands/pd/write-code.md` | 13 | Lists `Agent` tool in allowed-tools. Only skill that uses the Agent tool (for `--parallel` mode). Correct by design. | No fix needed -- intentional for parallel execution feature. |
| I5 | AUDIT-02 | `bin/lib/converters/codex.js` | 16-39 | `generateSkillAdapter()` contains hardcoded Unicode escape sequences for Vietnamese text. Functionally correct but hard to read. | Replace Unicode escapes with actual Vietnamese characters since the file is already UTF-8. |
| I6 | AUDIT-02 | `bin/lib/plan-checker.js` | 1-9 | Module header comment says "4 structural validators" but the module actually contains 7 checks (CHECK-01 through CHECK-04 + ADV-01 through ADV-03). Stale comment. | Update comment to "7 structural validators" or "4 core + 3 advanced validators." |
| I7 | AUDIT-02 | `workflows/conventions.md` | 1 | Simplest workflow -- no numbered steps (Buoc N pattern). Breaks the convention that all other 9 workflows use numbered steps. | Minor inconsistency, acceptable given simple nature. |
| I8 | AUDIT-02 | `bin/lib/converters/copilot.js` | 14 | `COPILOT_TOOL_MAP` re-exported for backward compatibility. Just an alias for `TOOL_MAP.copilot` from platforms.js. | Keep for backward compat, consider future deprecation. |
| I9 | AUDIT-02 | `bin/lib/converters/gemini.js` | 17 | `GEMINI_TOOL_MAP` re-exported for backward compatibility. Same pattern as copilot.js. | Same as I8 -- keep for backward compat, consider future deprecation. |
| I10 | AUDIT-02 | `bin/lib/manifest.js` | 70-76 | Legacy manifest cleanup (`sk-file-manifest.json`) still present from `sk` -> `pd` rename. Defensive code, handles missing files gracefully. | Track for future cleanup. Not urgent. |

## Priority Workflow Notes

### new-milestone.md

**Overall assessment:** Well-structured, comprehensive workflow with 10 numbered steps. Strong points include 2 approval gates (requirements + roadmap), research phase, and STATE.md updates at multiple checkpoints.

**Detailed findings:**
1. **Step logic clarity:** All 10 steps have clear entry conditions and expected outputs. Step 0 (self-check) and Step 0.5 (auto-discovery) are well-designed guard rails.
2. **Error handling:** Good -- CONTEXT.md missing triggers STOP, rules missing triggers STOP. Step 3 handles existing roadmap with user choice. Step 5 research is optional with user decision.
3. **References validation:** All 14 `@references/` and `@templates/` references verified to exist on disk. No broken references.
4. **Step numbering:** Consistent (0, 0.5, 1, 2, 3, 4, 5, 6, 6a-6e, 7, 7a-7f, 8, 9, 9a-9d, 10). Sub-steps use letter suffixes consistently.
5. **Orphaned sections:** None found.
6. **State updates:** Correct -- STATE.md updated at Steps 1, 5, 6e, 7f, and 8.
7. **Guard references:** All guard references valid and in correct skill file.
8. **Cross-workflow handoffs:** Step 10 correctly suggests `/pd:plan` as next action. CURRENT_MILESTONE.md format aligns with what `plan.md` expects.
9. **Concern (W12):** AskUserQuestion fallback for existing roadmap (line 105) lacks clarity on timeout/unavailability conditions.

### write-code.md

**Overall assessment:** The most complex workflow at 423 lines with 10+ steps. Handles 3 modes (default, --auto, --parallel) with recovery mechanism (PROGRESS.md). Strong goal-backward verification loop.

**Detailed findings:**
1. **Step logic clarity:** Steps 1-10 have clear logic. Step 1.5 (parallel dependency analysis) is well-designed with Kahn's algorithm specification. Step 9.5 (verification loop) has clear MAX_ROUNDS limit.
2. **Error handling:** Good coverage -- FastCode failure has Grep/Read fallback. Lint/build failure has 3-retry limit. PLAN.md missing info triggers STOP. Circular dependency detected and reported.
3. **References validation:** All 8 `@references/` and 1 `@templates/` references verified to exist. No broken references.
4. **Step numbering:** Consistent with sub-steps (1, 1.1, 1.5, 1.6, 2, 3, 4, 5, 6, 6.5, 6.5a, 6.5b, 7, 7a, 7b, 8, 9, 9.5, 9.5a-f, 10).
5. **Orphaned sections:** None found.
6. **State updates:** Correct -- TASKS.md updated before commit, STATE.md and ROADMAP/REQUIREMENTS updated at Step 9.
7. **Guard references:** All guard references valid.
8. **Cross-workflow handoffs:** Step 10 correctly suggests `/pd:test`, `/pd:plan`, `/pd:complete-milestone`.
9. **Concern (W9):** Parallel mode conflict detection degrades silently when `> Files:` is missing.
10. **Version-specific logic:** Effort routing table and PROGRESS.md recovery mechanism are current.

### fix-bug.md

**Overall assessment:** Scientific debugging workflow with 10 steps, investigation sessions (SESSION_*.md), and risk classification. Well-designed iterative loop. Strong audit trail via SESSION + BUG report files.

**Detailed findings:**
1. **Step logic clarity:** All 10 steps have clear logic. Step 5 (scientific method) with hypothesis formation/testing is well-structured. Step 6 (evaluation) has 3 clear outcomes (found, needs decision, not found).
2. **Error handling:** Good -- FastCode failure has fallback. "Not found" case has 3 options. 3+ fix attempts triggers suggestion to change approach.
3. **References validation:** All 3 `@references/` references verified to exist. No broken references.
4. **Step numbering:** Consistent (0.5, 1, 1a, 1b, 2, 3, 4, 5, 5a-5c, 6, 6a-6c, 7, 8, 9, 10).
5. **Orphaned sections:** None found.
6. **State updates:** SESSION file updated throughout. TASKS.md updated on user confirmation.
7. **Guard references:** All guard references valid.
8. **Cross-workflow handoffs:** Step 1a can resume from existing sessions. Step 10 updates TASKS.md correctly.
9. **Concern (C2):** Stack-specific trace table (Step 5c, lines 133-140) has no fallback for unlisted frameworks.
10. **Version-specific logic:** Patch version logic and risk classification are current.

## Recommendations for Phase 16

### Critical Fixes (must fix)

1. **C1 -- plan-checker.js no runtime import:** Verify if this is intentional (AI agent reads and executes inline) or if a CLI entry point (`bin/plan-check.js`) should be created. If intentional, add a comment documenting the design decision.
2. **C2 -- fix-bug.md no generic stack fallback:** Add a "Generic/Other" row to the stack trace table in `workflows/fix-bug.md` (lines 133-140) with general debugging flow: "entry point -> handler -> business logic -> data layer -> response".

### Warning Fixes (should fix)

1. **W1 -- Orphaned progress.md template:** Either wire `@templates/progress.md` into write-code.md skill's execution_context, or inline its content.
2. **W2 -- plan-checker.md weak reference:** Add `@references/plan-checker.md (optional)` to plan.md skill's execution_context.
3. **W3 -- Missing guard error message:** Add `-> "WebSearch khong kha dung."` to new-milestone.md guard condition.
4. **W4 -- context7-pipeline.md not in skills:** Add `@references/context7-pipeline.md (optional)` to relevant skills.
5. **W5 -- verification-report.md low refs:** Add to complete-milestone.md skill's execution_context.
6. **W6-W8 -- Dead exports in utils.js:** Remove `assembleMd`, `COLORS`, `colorize`, `CONDITIONAL_LOADING_MAP` from module.exports.
7. **W9 -- Parallel mode silent degradation:** Add warning when `> Files:` metadata is missing.
8. **W10 -- Stale test check grep pattern:** Make staleness check in complete-milestone.md language-agnostic.
9. **W11 -- Complex verification step:** Add tool-failure fallback instruction.
10. **W12 -- AskUserQuestion fallback clarity:** Clarify timeout/unavailability conditions.
11. **W13 -- Plan checker step too long:** Consider splitting or extracting to reference document.
12. **W14 -- JSON exclusion rationale:** Add brief comment explaining why .json excluded from code detection.
13. **W15 -- Strict FastCode requirement:** Add "continue without FastCode" option.

### Cleanup Opportunities (nice to have)

1. **I1-I2 -- Self-contained skill pattern:** Document as intentional for lightweight/utility skills (fetch-doc, update).
2. **I3 -- Hardcoded version string:** Remove or auto-update version in plan-checker.md footer.
3. **I4 -- Agent tool in write-code:** Already correct by design, no action needed.
4. **I5 -- Unicode escapes in codex.js:** Replace with actual Vietnamese characters for readability.
5. **I6 -- Stale comment in plan-checker.js:** Update "4 validators" to "7 validators."
6. **I7 -- conventions.md no numbered steps:** Minor inconsistency, acceptable.
7. **I8-I9 -- Re-exported TOOL_MAP aliases:** Keep for backward compat, consider deprecation notice.
8. **I10 -- Legacy sk manifest cleanup:** Track for future removal.

## Audit Coverage

- Skills: 12/12 scanned (AUDIT-01, Plan 14-01)
- References: 13/13 scanned (AUDIT-01, Plan 14-01)
- Templates: 10/10 scanned (AUDIT-01, Plan 14-01)
- Workflows: 10/10 scanned (AUDIT-02, Plan 14-02)
- JS Modules: 15/15 scanned (AUDIT-02, Plan 14-02)
- Snapshots: 48/48 verified (AUDIT-03, Plan 14-03)
- **Total files audited: 108**
