# Workflow & JS Module Audit Findings

**Date:** 2026-03-23
**Files scanned:** 10 workflows, 15 JS modules (25 files total)
**Issues found:** 18 (critical: 2, warning: 10, info: 6)

## Issues Found

### Critical

| # | File | Line | Description | Suggested Fix |
|---|------|------|-------------|---------------|
| C1 | `bin/lib/plan-checker.js` | N/A | Module is exported but NEVER imported by any runtime code in `bin/`. Only imported by test file `test/smoke-plan-checker.test.js`. The workflow `plan.md` references it by path string in documentation (Step 8.1), but the actual `require()` is absent from any executable module. If plan-checker is meant to be called programmatically during `plan.md` workflow, there is no JS entry point that does so — the AI agent calls `runAllChecks` by reading the file path from the workflow text, not via a Node.js `require` chain. | Verify this is intentional (agent reads + executes inline). If a CLI entry point is planned, create `bin/plan-check.js` that imports and runs the checker. |
| C2 | `workflows/fix-bug.md` | 133-140 | Stack-specific trace flows reference specific framework patterns (NestJS, NextJS, WordPress, Solidity, Flutter) but there is NO error handling for unknown/generic stacks. If a project uses Express, FastAPI, or another unlisted framework, the workflow provides no fallback tracing guidance. | Add a "Generic/Other" row to the stack trace table with general debugging flow: "entry point -> handler -> business logic -> data layer -> response". |

### Warning

| # | File | Line | Description | Suggested Fix |
|---|------|------|-------------|---------------|
| W1 | `bin/lib/utils.js` | 125-128 | `assembleMd()` is exported but never imported by any other module (dead export). Only used internally within utils.js itself (line 126 references buildFrontmatter). No consumer in bin/, test/, or anywhere else. | Remove from exports or mark as internal-only. If kept for future use, add a comment explaining the intent. |
| W2 | `bin/lib/utils.js` | 13-23 | `COLORS` and `colorize` are exported but never directly imported by external modules. They are only used internally via the `log` object. External consumers always import `log`, not `COLORS`/`colorize`. | Remove `COLORS` and `colorize` from module.exports. They are implementation details of the `log` object. |
| W3 | `bin/lib/utils.js` | 251-260 | `CONDITIONAL_LOADING_MAP` is exported but only used internally within `inlineWorkflow()` (line 364). No external consumer imports it directly. | Remove from module.exports unless test coverage requires direct access. |
| W4 | `workflows/write-code.md` | 353-377 | The `--parallel` mode (Step 10) instructs spawning Agent tool sub-agents, but the parallel wave conflict detection relies on `> Files:` metadata in TASKS.md. If `> Files:` is missing or incomplete (which is allowed as "degraded detection"), the conflict detection silently falls back with no guarantee of correctness. This is documented but the risk is not surfaced to the user. | Add explicit warning to user when `> Files:` is missing: "Conflict detection degraded — manual review recommended after wave completes." |
| W5 | `workflows/complete-milestone.md` | 36-53 | Step 2 checks for TEST_REPORT.md in each phase but the "Stale?" check (line 50) uses `git log --oneline --grep="\\[LOI\\]"` which only works for Vietnamese-prefixed bug fix commits. If commits use English prefixes or different formats, the staleness detection fails silently. | Make the staleness grep pattern configurable or check commit dates against TEST_REPORT date regardless of commit prefix. |
| W6 | `workflows/complete-milestone.md` | 62-90 | Step 3.5 (goal-backward verification) is comprehensive but extremely long (28 lines of instructions). The multi-level verification (4 levels) combined with cross-phase link checking makes this step very complex. No guidance on what to do if verification itself fails (e.g., tool errors during Glob/Grep). | Add a fallback instruction: "If verification tools fail, document the failure and proceed with manual verification flag." |
| W7 | `workflows/new-milestone.md` | 73-110 | Step 3 "check existing roadmap" presents AskUserQuestion with backup/delete/selective-delete options for old milestones directories. However, line 105 says "Khong hoi duoc -> tu dong sao luu" (can't ask -> auto backup). This assumes AskUserQuestion failure is the only reason, but the user might simply not respond. No timeout or retry logic specified. | Clarify the condition: "If AskUserQuestion is not available as a tool OR user does not respond within reasonable time -> auto backup." |
| W8 | `workflows/plan.md` | 298-435 | Step 8.1 (Plan Checker) is extremely long at 137 lines — the longest single step across all 10 workflows. It contains 9 sub-sections (A through I) with nested decision trees. This makes the step hard to follow and increases the risk of the AI agent missing branches. | Consider splitting into separate numbered steps (8.1a, 8.1b) or extracting the plan-checker interaction into a dedicated reference document. |
| W9 | `workflows/scan.md` | 14-15 | Step 2 excludes `.json` and `.css` files from the initial code detection glob, but `.json` files like `package.json` are read in later steps anyway. The exclusion comment says "KHONG gom .json" but doesn't explain why — this could confuse the AI agent about whether to consider JSON files as "code." | Add brief rationale: "(.json excluded from code detection because config files don't indicate active source code)." |
| W10 | `workflows/init.md` | 14-17 | Step 2 checks FastCode MCP with `mcp__fastcode__list_indexed_repos` and STOPS if it fails. However, this is overly strict — the user might want to initialize a project without FastCode (e.g., for planning only). The workflow provides no bypass option. | Consider adding a "continue without FastCode" option with degraded functionality warning, rather than hard STOP. |

### Info

| # | File | Line | Description | Suggested Fix |
|---|------|------|-------------|---------------|
| I1 | `bin/lib/converters/codex.js` | 16-39 | `generateSkillAdapter()` contains hardcoded Unicode escape sequences for Vietnamese text (e.g., `\u00E1ch`, `\u1ECDi`). While functionally correct, this makes the code hard to read and maintain compared to using actual Vietnamese characters with proper file encoding. | Replace Unicode escapes with actual Vietnamese characters since the file is already UTF-8. |
| I2 | `bin/lib/plan-checker.js` | 1-9 | Module header comment says "4 structural validators" but the module actually contains 7 checks (CHECK-01 through CHECK-04 + ADV-01 through ADV-03). The comment is stale from before ADV checks were added in Phase 12. | Update comment to "7 structural validators" or "4 core + 3 advanced validators." |
| I3 | `workflows/conventions.md` | 1 | This is the simplest workflow — just a single-purpose flow with no numbered steps (Buoc N pattern). While it works, it breaks the convention that all other 9 workflows use numbered steps. | Minor inconsistency, acceptable given the simple nature of this workflow. Document the exception if workflow audit standards require uniform structure. |
| I4 | `bin/lib/converters/copilot.js` | 14 | `COPILOT_TOOL_MAP` is re-exported for backward compatibility but is just an alias for `TOOL_MAP.copilot` from platforms.js. Consumers could import directly from platforms.js. | Keep for now (backward compat), but consider deprecation notice. |
| I5 | `bin/lib/converters/gemini.js` | 17 | `GEMINI_TOOL_MAP` is re-exported for backward compatibility, same pattern as copilot.js. Alias for `TOOL_MAP.gemini` from platforms.js. | Same as I4 — keep for backward compat, consider future deprecation. |
| I6 | `bin/lib/manifest.js` | 70-76 | Legacy manifest cleanup (`sk-file-manifest.json`) still present. The `sk` -> `pd` rename was part of the project rename. This legacy code could be removed in a future cleanup pass since the rename happened in v1.0. | Track for future cleanup. Not urgent — the code is defensive and handles missing files gracefully. |

## Priority Workflow Notes

### new-milestone.md

**Overall assessment:** Well-structured, comprehensive workflow with 10 numbered steps. Strong points include 2 approval gates (requirements + roadmap), research phase, and STATE.md updates at multiple checkpoints.

**Detailed findings:**
1. **Step logic clarity:** All 10 steps have clear entry conditions and expected outputs. Step 0 (self-check) and Step 0.5 (auto-discovery) are well-designed guard rails.
2. **Error handling:** Good — CONTEXT.md missing triggers STOP, rules missing triggers STOP. Step 3 handles existing roadmap with user choice. Step 5 research is optional with user decision.
3. **References validation:** All 14 `@references/` and `@templates/` references verified to exist on disk. No broken references.
4. **Step numbering:** Consistent (0, 0.5, 1, 2, 3, 4, 5, 6, 6a-6e, 7, 7a-7f, 8, 9, 9a-9d, 10). Sub-steps use letter suffixes consistently.
5. **Orphaned sections:** None found.
6. **State updates:** Correct — STATE.md updated at Steps 1, 5, 6e, 7f, and 8. Format matches STATE.md expectations.
7. **Guard references:** `@references/guard-context.md` and `@references/guard-context7.md` used in corresponding skill file (`commands/pd/new-milestone.md`). Guards not in workflow itself (correct — guards are skill-level, not workflow-level).
8. **Cross-workflow handoffs:** Step 10 correctly suggests `/pd:plan` as next action. CURRENT_MILESTONE.md format aligns with what `plan.md` expects to read.
9. **Potential concern (W7):** The AskUserQuestion fallback for existing roadmap (line 105) lacks clarity on timeout/unavailability conditions.

### write-code.md

**Overall assessment:** The most complex workflow at 423 lines with 10+ steps. Handles 3 modes (default, --auto, --parallel) with recovery mechanism (PROGRESS.md). Strong goal-backward verification loop.

**Detailed findings:**
1. **Step logic clarity:** Steps 1-10 have clear logic. Step 1.5 (parallel dependency analysis) is particularly well-designed with Kahn's algorithm specification. Step 9.5 (verification loop) has clear MAX_ROUNDS limit.
2. **Error handling:** Good coverage — FastCode failure has Grep/Read fallback. Lint/build failure has 3-retry limit. PLAN.md missing info triggers STOP. Circular dependency detected and reported.
3. **References validation:** All 8 `@references/` and 1 `@templates/` references verified to exist. No broken references.
4. **Step numbering:** Consistent with sub-steps (1, 1.1, 1.5, 1.6, 2, 3, 4, 5, 6, 6.5, 6.5a, 6.5b, 7, 7a, 7b, 8, 9, 9.5, 9.5a-f, 10).
5. **Orphaned sections:** None found.
6. **State updates:** Correct — TASKS.md updated before commit (7a before 7b), STATE.md updated at Step 9 when phase completes, ROADMAP/REQUIREMENTS updated at Step 9.
7. **Guard references:** `@references/guard-context.md`, `@references/guard-fastcode.md`, `@references/guard-context7.md` used in skill file. Correct.
8. **Cross-workflow handoffs:** Step 10 suggests `/pd:test`, `/pd:plan`, `/pd:complete-milestone` correctly. Auto-advance logic updates CURRENT_MILESTONE.md for next phase.
9. **Potential concern (W4):** Parallel mode conflict detection degrades silently when `> Files:` is missing. No user-visible warning in degraded state.
10. **Version-specific logic:** Effort routing table (haiku/sonnet/opus) is current. PROGRESS.md recovery mechanism is robust with 6 possible resume points.

### fix-bug.md

**Overall assessment:** Scientific debugging workflow with 10 steps, investigation sessions (SESSION_*.md), and risk classification. Well-designed iterative loop (user confirms fix or continues). Strong audit trail via SESSION + BUG report files.

**Detailed findings:**
1. **Step logic clarity:** All 10 steps have clear logic. Step 5 (scientific method) with hypothesis formation/testing is well-structured. Step 6 (evaluation) has 3 clear outcomes (found, needs decision, not found).
2. **Error handling:** Good — FastCode failure has fallback (line 309). "Not found" case has 3 options (more info, expand scope, add temp logging). 3+ fix attempts triggers suggestion to change approach.
3. **References validation:** All 3 `@references/` references verified to exist. No broken references.
4. **Step numbering:** Consistent (0.5, 1, 1a, 1b, 2, 3, 4, 5, 5a-5c, 6, 6a-6c, 7, 8, 9, 10).
5. **Orphaned sections:** None found.
6. **State updates:** SESSION file updated throughout. TASKS.md updated on user confirmation (Step 10). BUG report linked to SESSION.
7. **Guard references:** `@references/guard-context.md`, `@references/guard-fastcode.md`, `@references/guard-context7.md` used in skill file. Correct.
8. **Cross-workflow handoffs:** Step 1a can resume from existing sessions. Step 10 updates TASKS.md with version-correct path.
9. **Potential concern (C2):** Stack-specific trace table (Step 5c, lines 133-140) has no fallback for unlisted frameworks.
10. **Version-specific logic:** Patch version logic (Step 2) correctly handles current vs old version bugs. Risk classification (Step 6a) links to effort routing. Effort routing table is current.

## Files Scanned

### Workflows (10/10)
- [x] complete-milestone.md — W5 (stale test check grep pattern), W6 (complex verification step)
- [x] conventions.md — I3 (no numbered steps, minor convention break)
- [x] fix-bug.md — C2 (no fallback for unknown stacks in trace table)
- [x] init.md — W10 (overly strict FastCode check with no bypass)
- [x] new-milestone.md — W7 (AskUserQuestion fallback clarity)
- [x] plan.md — W8 (Step 8.1 extremely long at 137 lines)
- [x] scan.md — W9 (JSON exclusion rationale missing)
- [x] test.md — clean
- [x] what-next.md — clean
- [x] write-code.md — W4 (parallel mode silent degradation)

### JS Modules (15/15)
- [x] bin/install.js — clean
- [x] bin/lib/utils.js — W1 (dead export: assembleMd), W2 (dead exports: COLORS, colorize), W3 (dead export: CONDITIONAL_LOADING_MAP)
- [x] bin/lib/converters/base.js — clean
- [x] bin/lib/plan-checker.js — C1 (no runtime import), I2 (stale comment "4 validators" → actually 7)
- [x] bin/lib/manifest.js — I6 (legacy sk cleanup code still present)
- [x] bin/lib/platforms.js — clean
- [x] bin/lib/converters/codex.js — I1 (Unicode escapes instead of UTF-8 Vietnamese)
- [x] bin/lib/converters/copilot.js — I4 (re-exported TOOL_MAP alias for backward compat)
- [x] bin/lib/converters/gemini.js — I5 (re-exported TOOL_MAP alias for backward compat)
- [x] bin/lib/converters/opencode.js — clean
- [x] bin/lib/installers/claude.js — clean
- [x] bin/lib/installers/codex.js — clean
- [x] bin/lib/installers/copilot.js — clean
- [x] bin/lib/installers/gemini.js — clean
- [x] bin/lib/installers/opencode.js — clean
