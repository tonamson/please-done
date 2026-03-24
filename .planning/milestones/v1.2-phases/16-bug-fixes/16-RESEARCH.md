# Phase 16: Bug Fixes - Research

**Researched:** 2026-03-23
**Domain:** Workflow/skill audit fixes, CLI wrapper creation, dead code removal
**Confidence:** HIGH

## Summary

Phase 16 fixes all bugs discovered in Phase 14 (audit of 108 files) and Phase 15 (verification of 3 workflows). The scope is 31 locked decisions from CONTEXT.md covering 2 Critical, 1 Warning-High, and multiple Warning/Info issues across workflows, JS modules, skill files, and reference documents. BFIX-02 (snapshot sync) is already satisfied -- 48/48 snapshots match.

The fixes are predominantly text edits to markdown workflow/skill files, with three code-level changes: (1) creating a new `bin/plan-check.js` CLI wrapper, (2) removing dead exports from `bin/lib/utils.js`, and (3) replacing Unicode escapes in `bin/lib/converters/codex.js`. Snapshot regeneration is needed only after touching converters/commands -- and since codex.js is being modified, one-shot regeneration at the end is required.

**Primary recommendation:** Group fixes by file to minimize edit passes. Fix JS modules first (testable immediately), then workflows/skills (text changes), then intentional-pattern documentation, and finally snapshot regeneration as the last task.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Fix 3 severity levels: Critical (C1, C2), Warning-High (V3), Warning (V1, V2, V5, W1-W15 triage)
- **D-02:** Info items: Fix I3 (hardcoded version string), I5 (Unicode escapes), I6 (stale comment "4 validators") -- nhung cai co suggested fix ro rang va mang tinh Source of Truth
- **D-03:** Defer I8, I9, I10 (backward compat re-exports, legacy manifest) -- can Major release (v2.0). Dua vao checklist cua ban Major update tiep theo
- **D-04:** Document I1, I2, I4, I7 (intentional patterns) -- them comment `// Audit 2026-03-23: Intentional [Pattern] for [Reason]. See Phase 14 Audit.` vao code
- **D-05:** Warning triage: Fix ngay neu Risk == Low AND Complexity == Low. Defer neu Risk == Med/High ma chua co bang chung gay loi thuc te
- **D-06:** High risk + Info severity -> skip. Khong fix.
- **D-07:** Option A (Hybrid): Tao `bin/plan-check.js` CLI wrapper goi `bin/lib/plan-checker.js`. Giu module library nguyen ven
- **D-08:** CLI interface: `node bin/plan-check.js <plan-file-or-glob>` -- output structured JSON + human-readable summary
- **D-09:** Update `workflows/plan.md` Step 8.1: chuyen tu "doc file roi goi ham inline" sang "chay lenh terminal `node bin/plan-check.js`"
- **D-10:** Loi ich: tiet kiem token (agent khong can doc 550 dong code), Single Source of Truth, CI/CD ready
- **D-11:** Them row "Generic/Khac" vao bang stack trace trong `workflows/fix-bug.md` (lines 133-141): "entry point -> handler -> business logic -> data layer -> response"
- **D-12:** Them fallback: "Khong xac dinh duoc stack tu CONTEXT.md -> dung luong truy vet generic"
- **D-13:** Sua `workflows/new-milestone.md` line 105: "AskUserQuestion khong kha dung nhu tool -> hoi van ban thuong. Nguoi dung khong phan hoi HOAC tool loi ky thuat -> tu dong sao luu. Ghi chu: 'Da tu dong sao luu do khong nhan duoc phan hoi.'"
- **D-14:** Xoa effort routing table trong `workflows/fix-bug.md` (lines 162-174). Them note: "fix-bug luon chay voi sonnet (theo skill file). Effort routing khong ap dung cho fix-bug."
- **D-15:** `workflows/write-code.md` line 118: canh bao RO RANG truoc spawn agents, list tasks thieu `> Files:`
- **D-16:** `workflows/write-code.md` line 366: them sub-step -- tasks thieu `> Files:` -> hien thi files can review
- **D-17:** Chi regenerate khi cham converters (`bin/lib/converters/`) hoac commands (`commands/pd/`). Workflows va references KHONG affect snapshots
- **D-18:** One-shot regeneration SAU tat ca fixes cua Phase 16 -- khong incremental
- **D-19:** Quy trinh: (1) code fixes, (2) `node test/generate-snapshots.js`, (3) review `git diff test/snapshots/`, (4) commit code + snapshots cung nhau
- **D-20:** Workflows/references changes KHONG affect snapshots -- confirmed tu source code generate-snapshots.js
- **D-21:** W1 (orphaned progress.md): Fix -- Low risk, Low complexity. Inline content hoac wire reference
- **D-22:** W2 (plan-checker.md weak ref): Fix -- Low risk. Them `@references/plan-checker.md (optional)` vao plan.md skill
- **D-23:** W3 (missing guard error): Fix -- Low risk. Them error message pattern
- **D-24:** W4 (context7-pipeline transparency): Fix -- Low risk. Them optional ref vao skills
- **D-25:** W5 (verification-report low refs): Fix -- Low risk. Them ref vao complete-milestone.md
- **D-26:** W6-W8 (dead exports utils.js): Fix -- Low risk. Remove tu module.exports
- **D-27:** W10 (stale test check grep): Defer -- Med risk (thay doi commit pattern detection)
- **D-28:** W11 (complex verification step): Fix -- Low risk. Them fallback instruction
- **D-29:** W13 (plan checker step too long): Defer -- Med risk (restructure 137 lines co the break workflow)
- **D-30:** W14 (JSON exclusion rationale): Fix -- Low risk. Them comment giai thich
- **D-31:** W15 (strict FastCode requirement): Fix -- Low risk. Them "continue without FastCode" option

### Claude's Discretion
- Thu tu fix cac issues (co the nhom theo file de giam so commits)
- Chi tiet implementation cua `bin/plan-check.js` CLI
- Cach nhom fixes vao plans/waves

### Deferred Ideas (OUT OF SCOPE)
- I8, I9 (COPILOT_TOOL_MAP, GEMINI_TOOL_MAP re-exports): Defer cho v2.0 Major release -- backward compat
- I10 (legacy sk-file-manifest.json cleanup): Defer cho v2.0
- W10 (stale test check grep pattern): Defer -- Med risk, can thay doi commit pattern detection
- W13 (plan checker step too long): Defer -- Med risk, restructure 137 lines co the break workflow flow
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BFIX-01 | Fix tat ca logic gaps phat hien tu skill audit (AUDIT-01, AUDIT-02) | File-by-file fix mapping with exact lines, 21 issues scoped for fix |
| BFIX-02 | Fix tat ca sync issues phat hien tu snapshot audit (AUDIT-03) | Already satisfied -- 48/48 match. Only re-check after codex.js + command file edits |
| BFIX-03 | Fix tat ca logic gaps phat hien tu workflow verification (WFLOW-01, WFLOW-02, WFLOW-03) | 6 verification issues (V1-V6) with exact lines and suggested fixes |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js test runner | 22+ | Run existing 448 tests | Already in use, zero dependencies |
| bin/lib/plan-checker.js | current | Plan checking module -- CLI wrapper imports from this | 140 existing tests, well-proven |
| test/generate-snapshots.js | current | Regenerate 48 converter snapshots | Established pipeline, Phase 14 verified |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fs/path (Node built-in) | N/A | CLI wrapper reads plan files from disk | bin/plan-check.js needs file I/O |
| process.argv | N/A | CLI argument parsing | Simple enough -- no external parser needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| process.argv | yargs/commander | Overkill for single-file CLI with 1-2 args |
| Built-in test runner | jest/vitest | Would add dependencies -- project already uses built-in |

**Installation:**
No new packages needed. All fixes use existing project infrastructure.

## Architecture Patterns

### File Grouping for Fixes

Files are grouped by concern to minimize edit passes. Each group should be a separate plan or wave:

```
Group 1: JS Module Fixes (testable code)
├── bin/plan-check.js          # NEW: C1 CLI wrapper
├── bin/lib/plan-checker.js    # I6: stale comment "4 validators" -> "7 checks"
├── bin/lib/utils.js           # W6-W8: remove dead exports
└── bin/lib/converters/codex.js # I5: Unicode escapes -> Vietnamese chars

Group 2: Workflow Fixes (markdown text)
├── workflows/fix-bug.md       # C2/V1 (stack fallback) + V2 (effort routing)
├── workflows/new-milestone.md  # V3/W12 (AskUserQuestion) + W3 (guard error)
├── workflows/write-code.md    # V5/W9 (parallel degradation)
├── workflows/complete-milestone.md # W11 (verification fallback)
├── workflows/scan.md          # W14 (JSON exclusion rationale)
└── workflows/init.md          # W15 (FastCode bypass option)

Group 3: Skill/Reference Wiring (markdown text)
├── commands/pd/plan.md        # W2 (plan-checker.md ref)
├── commands/pd/write-code.md  # W4 (context7-pipeline ref), W1 (progress.md ref)
├── commands/pd/fix-bug.md     # W4 (context7-pipeline ref)
├── commands/pd/test.md        # W4 (context7-pipeline ref)
├── commands/pd/complete-milestone.md # W5 (verification-report ref)
├── references/plan-checker.md # I3 (hardcoded version string)
└── references/conventions.md  # V6 (subtle difference note)

Group 4: Intentional Pattern Documentation
├── commands/pd/fetch-doc.md   # I1 audit comment
├── commands/pd/update.md      # I2 audit comment
├── commands/pd/write-code.md  # I4 audit comment (Agent tool)
└── workflows/conventions.md   # I7 audit comment

Group 5: Snapshot Regeneration + Final Verification
├── test/generate-snapshots.js # Run to regenerate
└── test/snapshots/            # Review + commit diffs
```

### Pattern: CLI Wrapper for plan-checker (C1)

**What:** Create `bin/plan-check.js` as thin CLI wrapper that imports `runAllChecks` from `bin/lib/plan-checker.js`, reads files from disk, and outputs results.

**Architecture decision:** The library module (`bin/lib/plan-checker.js`) stays pure -- accepts content strings, returns result objects. The CLI wrapper handles I/O.

**Interface per D-08:**
```
node bin/plan-check.js <plan-file-or-glob>
```

**Example implementation pattern:**
```javascript
#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { runAllChecks } = require('./lib/plan-checker');

// Parse args
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node bin/plan-check.js <plan-dir-or-plan-file>');
  process.exit(1);
}

const target = args[0];

// Resolve PLAN.md, TASKS.md, requirement IDs
// ... (read from disk, parse ROADMAP.md for requirement IDs)

const result = runAllChecks({ planContent, tasksContent, requirementIds });

// Output JSON + human-readable summary
console.log(JSON.stringify(result, null, 2));

// Human-readable summary
const statusIcon = { pass: 'PASS', warn: 'WARN', block: 'BLOCK' };
console.log(`\nOverall: ${statusIcon[result.overall]}`);
for (const check of result.checks) {
  console.log(`  ${check.checkId}: ${statusIcon[check.status]}`);
}

process.exit(result.overall === 'block' ? 1 : 0);
```

### Pattern: Audit Comment for Intentional Patterns (D-04)

**Format:** Use consistent audit comment format across all intentional pattern documentation:

For markdown files (I1, I2, I7):
```markdown
<!-- Audit 2026-03-23: Intentional — [Pattern description]. See Phase 14 Audit. -->
```

For JS/code files (I4):
```javascript
// Audit 2026-03-23: Intentional — Agent tool listed for --parallel mode. See Phase 14 Audit.
```

### Anti-Patterns to Avoid
- **Editing module.exports without verifying consumers:** Before removing exports from utils.js, verify no external module imports them. VERIFIED: no external imports of `assembleMd`, `COLORS`, `colorize`, `CONDITIONAL_LOADING_MAP`.
- **Incremental snapshot regeneration:** D-18 locks one-shot regeneration AFTER all fixes. Do not regenerate after each individual fix.
- **Modifying plan-checker.js library interface:** D-07 says keep the library module intact. The CLI wrapper wraps it, does not modify it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Plan checking CLI | New standalone checker | `bin/plan-check.js` wrapper importing existing `runAllChecks()` | 140 tests already validate the checker logic |
| Snapshot regeneration | Manual per-converter rebuild | `node test/generate-snapshots.js` | Established pipeline, generates all 48 snapshots |
| Snapshot verification | Manual diff comparison | `node --test test/smoke-snapshot.test.js` | 48 smoke tests verify sync |
| Test suite | New test framework | `node --test test/smoke-*.test.js` | 448 existing tests, zero dependencies |

**Key insight:** Phase 16 creates almost no new code (only bin/plan-check.js ~60 lines). Every other change is text edits or dead code removal. Leverage existing test infrastructure to catch regressions.

## File-by-File Fix Map

### Critical + Warning-High Fixes

#### C1: bin/plan-check.js (NEW FILE)
- **Issue:** plan-checker.js never imported at runtime -- only by tests
- **Fix:** Create `bin/plan-check.js` CLI wrapper (D-07 through D-10)
- **Also update:** `workflows/plan.md` Step 8.1 (D-09) -- change instruction from "read file and call inline" to "run terminal command `node bin/plan-check.js`"
- **Dependencies:** None (plan-checker.js module is stable, 140 tests pass)
- **Snapshot impact:** NO (bin/ files are not in snapshot pipeline)

#### C2 + V1: workflows/fix-bug.md lines 133-141
- **Issue:** Stack trace table has only 5 stacks, no generic fallback
- **Fix per D-11/D-12:** Add "Generic/Khac" row to table: "entry point -> handler -> business logic -> data layer -> response". Add fallback text before table: "Khong xac dinh duoc stack tu CONTEXT.md -> dung luong truy vet generic"
- **Current content (line 133):** `CONTEXT.md -> stack -> doc .planning/rules/[stack].md -> truy vet luong:`
- **Current table (lines 135-141):** 5 rows (NestJS, NextJS, WordPress, Solidity, Flutter)
- **Snapshot impact:** NO (workflows are not in snapshot pipeline, confirmed D-20)

#### V2: workflows/fix-bug.md lines 162-174
- **Issue:** Effort routing table is aspirational -- skill hardcodes `model: sonnet`
- **Fix per D-14:** Delete effort routing table (lines 162-174), replace with note: "fix-bug luon chay voi sonnet (theo skill file). Effort routing khong ap dung cho fix-bug."
- **Snapshot impact:** NO

#### V3 + W12: workflows/new-milestone.md line 105
- **Issue:** Conflict between Step 3 fallback (auto backup) and rules (ask text)
- **Fix per D-13:** Replace line 105 with: "AskUserQuestion khong kha dung nhu tool -> hoi van ban thuong. Nguoi dung khong phan hoi HOAC tool loi ky thuat -> tu dong sao luu: .planning/milestones/ -> .planning/milestones_backup_[DD_MM_YYYY]/. Ghi chu: 'Da tu dong sao luu do khong nhan duoc phan hoi.'"
- **Current content (line 105):** `- Khong hoi duoc -> tu dong sao luu: .planning/milestones/ -> .planning/milestones_backup_[DD_MM_YYYY]/`
- **Snapshot impact:** NO

#### V5 + W9: workflows/write-code.md lines 118, 366
- **Issue:** Parallel mode `> Files:` missing -> silent degradation
- **Fix per D-15:** Line 118: Replace vague "canh bao" with explicit warning format including task list and recommendation
- **Fix per D-16:** Line ~366: Add sub-step b2 for post-wave review of tasks missing `> Files:`
- **Current content (line 118):** `- Task thieu > Files: -> canh bao nhung van cho chay song song (degraded detection)`
- **Snapshot impact:** NO

### Warning Fixes

#### W1: templates/progress.md orphaned reference
- **Fix per D-21:** Add `@templates/progress.md (optional)` to `commands/pd/write-code.md` execution_context (line 57 area)
- **Current execution_context (lines 50-57):** Lists 6 refs, no progress.md

#### W2: references/plan-checker.md weak reference
- **Fix per D-22:** Add `@references/plan-checker.md (optional)` to `commands/pd/plan.md` execution_context (line 54 area)
- **Current execution_context (lines 45-54):** Lists 8 refs, no plan-checker.md

#### W3: commands/pd/new-milestone.md guard error message
- **Fix per D-23:** Line 30: Change `- [ ] WebSearch kha dung khi can nghien cuu` to `- [ ] WebSearch kha dung khi can nghien cuu -> "WebSearch khong kha dung. Kiem tra ket noi mang."`
- **Current content (line 30):** `- [ ] WebSearch khả dụng khi cần nghiên cứu` (missing `-> "error message"` pattern)
- **Snapshot impact:** YES (commands/pd/ files affect snapshots)

#### W4: context7-pipeline.md not in skill execution_context
- **Fix per D-24:** Add `@references/context7-pipeline.md (optional)` to these skill files:
  - `commands/pd/write-code.md` (line 57 area -- uses context7 in workflow line 172)
  - `commands/pd/fix-bug.md` (line 48 area -- uses context7 in workflow line 92)
  - `commands/pd/test.md` (line 50 area -- uses context7 in workflow line 96)
  - `commands/pd/plan.md` (line 54 area -- uses context7 in workflow line 103)
- **Snapshot impact:** YES (commands/pd/ files affect snapshots)

#### W5: verification-report.md low reference count
- **Fix per D-25:** Add `@templates/verification-report.md (optional)` to `commands/pd/complete-milestone.md` execution_context
- **Current execution_context (lines 37-45):** Lists 7 refs, no verification-report.md
- **Snapshot impact:** YES (commands/pd/ files affect snapshots)

#### W6-W8: Dead exports in utils.js
- **Fix per D-26:** Remove from `module.exports` at line 412-430:
  - `assembleMd` (W6 -- defined line 125, only used internally by buildFrontmatter flow)
  - `COLORS` (W7 -- defined line 13, only used internally via `log` object)
  - `colorize` (W7 -- defined line 22, only used internally via `log` object)
  - `CONDITIONAL_LOADING_MAP` (W8 -- defined line 251, only used internally by `inlineWorkflow`)
- **Verification:** Grep confirmed 0 external imports of these 4 symbols. Only internal usage within utils.js itself.
- **Consumer check:** `bin/lib/plan-checker.js` imports `{ parseFrontmatter, extractXmlSection }` -- NOT affected. `bin/lib/converters/base.js` imports `{ parseFrontmatter, buildFrontmatter, inlineWorkflow }` -- NOT affected.
- **Snapshot impact:** NO (utils.js is not in converter/command pipeline)

#### W11: workflows/complete-milestone.md verification fallback
- **Fix per D-28:** Add fallback instruction after Step 3.5 verification logic (around line 74-75): "Cong cu xac minh that bai -> ghi nhan that bai, tiep tuc voi co xac minh thu cong."
- **Snapshot impact:** NO

#### W14: workflows/scan.md JSON exclusion rationale
- **Fix per D-30:** Add comment after line 14: "(.json loai tru khoi phat hien code vi config files khong chi thi ma nguon dang hoat dong)"
- **Current content (line 14):** `Glob **/*.{ts,tsx,js,jsx,py,php,sol,dart,html} (tru ... KHONG gom .json/.css):`
- **Snapshot impact:** NO

#### W15: workflows/init.md strict FastCode requirement
- **Fix per D-31:** Line 16 area: Add "continue without FastCode" option after DUNG instruction
- **Current content (line 16):** `- **THAT BAI** -> **DUNG**: "FastCode MCP khong hoat dong..."`
- **Snapshot impact:** NO

### Info Fixes

#### I3: references/plan-checker.md hardcoded version
- **Fix per D-02:** Remove or update version string at line 296-297
- **Current content:** `*Plan Checker Rules v1.1*\n*Updated: 23_03_2026*`
- **Snapshot impact:** NO

#### I5: bin/lib/converters/codex.js Unicode escapes
- **Fix per D-02:** Replace Unicode escape sequences (lines 16-39) with actual Vietnamese UTF-8 characters
- **Current:** `C\u00E1ch g\u1ECDi skill n\u00E0y` -> should be `Cach goi skill nay` (Vietnamese with diacritics)
- **Snapshot impact:** YES (converters/ affect snapshots)

#### I6: bin/lib/plan-checker.js stale comment
- **Fix per D-02:** Line 2: Change `4 structural validators` to `7 checks (4 core + 3 advanced)`
- **Current content (line 2):** `* Plan Checker Module -- 4 structural validators cho PLAN.md + TASKS.md`
- **Snapshot impact:** NO (JS comments do not affect output)

#### V6: references/conventions.md subtle difference
- **Fix:** Add note at line 18 area: "Ap dung cho /pd:write-code. Cac workflow khac (fix-bug) co logic rieng."
- **Snapshot impact:** NO

### Intentional Pattern Documentation (D-04)

#### I1: commands/pd/fetch-doc.md
- **Location:** Line 33 (execution_context "Khong co -- skill nay xu ly truc tiep")
- **Comment:** `<!-- Audit 2026-03-23: Intentional -- self-contained skill without workflow (lightweight/utility pattern). See Phase 14 Audit I1. -->`

#### I2: commands/pd/update.md
- **Location:** Line 35 (execution_context "Khong co -- skill nay xu ly truc tiep")
- **Comment:** `<!-- Audit 2026-03-23: Intentional -- self-contained skill without workflow (lightweight/utility pattern). See Phase 14 Audit I2. -->`

#### I4: commands/pd/write-code.md
- **Location:** Line 13 (Agent tool in allowed-tools)
- **Comment:** `<!-- Audit 2026-03-23: Intentional -- Agent tool required for --parallel mode multi-agent execution. See Phase 14 Audit I4. -->`

#### I7: workflows/conventions.md
- **Location:** Line 1 (no numbered steps)
- **Comment:** `<!-- Audit 2026-03-23: Intentional -- simple conventions workflow without numbered steps (data-driven, not procedural). See Phase 14 Audit I7. -->`

## Dependency Chain Analysis

### Fix Ordering Constraints

```
Independent (no ordering constraint):
  - W6-W8 (utils.js dead exports)
  - I5 (codex.js Unicode)
  - I6 (plan-checker.js comment)
  - All workflow text fixes (C2/V1, V2, V3, V5, W11, W14, W15)
  - All skill reference wiring (W1-W5)
  - All intentional pattern comments (I1, I2, I4, I7)
  - I3 (plan-checker.md version)
  - V6 (conventions.md note)

Sequential dependency:
  C1 (bin/plan-check.js) --depends-on--> plan-checker.js being stable
    --> D-09 (plan.md Step 8.1 update) --depends-on--> C1 existing

Must be LAST:
  Snapshot regeneration --depends-on--> ALL of:
    - I5 (codex.js) DONE
    - W3 (new-milestone.md guard) DONE
    - W4 (skill file context7-pipeline refs) DONE
    - W5 (complete-milestone.md ref) DONE
    - W1 (write-code.md progress.md ref) DONE
    - W2 (plan.md plan-checker.md ref) DONE
    - I1, I2, I4 (command file comments) DONE
```

### Snapshot Impact Summary

Files that affect snapshots (require regeneration):
| File | Issue | Reason |
|------|-------|--------|
| `bin/lib/converters/codex.js` | I5 | Converter code change |
| `commands/pd/new-milestone.md` | W3 | Command file edit |
| `commands/pd/write-code.md` | W1, W4, I4 | Command file edit |
| `commands/pd/fix-bug.md` | W4 | Command file edit |
| `commands/pd/test.md` | W4 | Command file edit |
| `commands/pd/plan.md` | W2, W4 | Command file edit |
| `commands/pd/complete-milestone.md` | W5 | Command file edit |
| `commands/pd/fetch-doc.md` | I1 | Command file edit |
| `commands/pd/update.md` | I2 | Command file edit |

Files that do NOT affect snapshots:
- `workflows/*.md` (all workflow edits)
- `references/*.md` (all reference edits)
- `bin/lib/utils.js` (not in converter pipeline)
- `bin/lib/plan-checker.js` (not in converter pipeline)
- `bin/plan-check.js` (new file, not in pipeline)

## Common Pitfalls

### Pitfall 1: Breaking utils.js consumers when removing exports
**What goes wrong:** Removing an export that is actually imported elsewhere
**Why it happens:** Incomplete grep -- missing dynamic requires or test-only imports
**How to avoid:** VERIFIED via grep: 0 external imports of assembleMd, COLORS, colorize, CONDITIONAL_LOADING_MAP. Test files (smoke-utils.test.js) may test these directly -- check and update if needed.
**Warning signs:** Test failures in smoke-utils.test.js after export removal

### Pitfall 2: Forgetting to update plan.md Step 8.1 after creating CLI wrapper
**What goes wrong:** C1 fix creates bin/plan-check.js but plan.md Step 8.1 still tells agent to "read and call inline"
**Why it happens:** D-09 is a separate change from D-07/D-08
**How to avoid:** Plan C1 fix as a single task that includes both creating the CLI and updating plan.md
**Warning signs:** Agents still reading 550-line plan-checker.js instead of running CLI

### Pitfall 3: Snapshot drift after command file edits
**What goes wrong:** Edit commands/pd/*.md files but forget snapshot regeneration
**Why it happens:** Not obvious that markdown command files trigger converter pipeline
**How to avoid:** D-18 locks one-shot regeneration as LAST task. After all fixes, run `node test/generate-snapshots.js`, review diffs, commit together
**Warning signs:** smoke-snapshot.test.js failures (48 tests)

### Pitfall 4: Unicode replacement in codex.js breaking template literal
**What goes wrong:** Replacing `\uXXXX` sequences with Vietnamese characters breaks the JavaScript template literal backticks
**Why it happens:** Vietnamese characters with diacritics may interact with template literal syntax if not careful
**How to avoid:** Replace Unicode escapes with exact Vietnamese characters, run `node -e "require('./bin/lib/converters/codex')"` to verify no syntax errors, then run full test suite
**Warning signs:** Syntax errors when requiring codex.js, snapshot test failures

### Pitfall 5: Editing wrong line numbers due to stale references
**What goes wrong:** Audit report says "line 105" but file has changed since audit
**Why it happens:** Phase 14/15 audited at a specific git state, subsequent edits may shift line numbers
**How to avoid:** VERIFIED: Current file line numbers match audit report references. All line references in this research are verified against current HEAD (commit c3f9156).
**Warning signs:** Content at specified line does not match expected text

## Code Examples

### C1: bin/plan-check.js CLI Wrapper Pattern

Source: Derived from existing `runAllChecks` API in `bin/lib/plan-checker.js` (line 937)

```javascript
#!/usr/bin/env node
/**
 * Plan Checker CLI — chay kiem tra chat luong PLAN.md + TASKS.md tu terminal.
 *
 * Usage: node bin/plan-check.js <plan-dir>
 *   plan-dir: duong dan thu muc chua PLAN.md va TASKS.md
 *
 * Output: JSON ket qua + human-readable summary
 * Exit code: 0 = pass/warn, 1 = block
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { runAllChecks } = require('./lib/plan-checker');

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node bin/plan-check.js <plan-dir>');
  console.error('  plan-dir: thu muc chua PLAN.md + TASKS.md');
  process.exit(1);
}

const planDir = path.resolve(args[0]);
const planPath = path.join(planDir, 'PLAN.md');
const tasksPath = path.join(planDir, 'TASKS.md');

if (!fs.existsSync(planPath)) {
  console.error(`Khong tim thay PLAN.md tai: ${planPath}`);
  process.exit(1);
}
if (!fs.existsSync(tasksPath)) {
  console.error(`Khong tim thay TASKS.md tai: ${tasksPath}`);
  process.exit(1);
}

const planContent = fs.readFileSync(planPath, 'utf8');
const tasksContent = fs.readFileSync(tasksPath, 'utf8');

// Parse requirement IDs from ROADMAP.md if available
let requirementIds = [];
const roadmapPath = path.resolve(planDir, '../../../ROADMAP.md');
if (fs.existsSync(roadmapPath)) {
  // Extract requirement IDs for current phase from ROADMAP.md
  // ... (parse logic)
}

const result = runAllChecks({ planContent, tasksContent, requirementIds });

// JSON output
console.log(JSON.stringify(result, null, 2));

// Human-readable summary
const icons = { pass: 'PASS', warn: 'WARN', block: 'BLOCK' };
console.log(`\n--- Summary ---`);
console.log(`Overall: ${icons[result.overall]}`);
for (const check of result.checks) {
  console.log(`  ${check.checkId}: ${icons[check.status]}${check.message ? ' — ' + check.message : ''}`);
}

process.exit(result.overall === 'block' ? 1 : 0);
```

### W6-W8: utils.js Export Cleanup

Current exports (lines 412-430):
```javascript
module.exports = {
  COLORS,           // W7: REMOVE — internal to log object
  colorize,         // W7: REMOVE — internal to log object
  log,
  parseFrontmatter,
  buildFrontmatter,
  assembleMd,       // W6: REMOVE — only used internally
  fileHash,
  listSkillFiles,
  commandExists,
  exec,
  isWSL,
  extractXmlSection,
  extractReadingRefs,
  classifyRefs,
  CONDITIONAL_LOADING_MAP,  // W8: REMOVE — only used by inlineWorkflow
  inlineGuardRefs,
  inlineWorkflow,
};
```

After fix:
```javascript
module.exports = {
  log,
  parseFrontmatter,
  buildFrontmatter,
  fileHash,
  listSkillFiles,
  commandExists,
  exec,
  isWSL,
  extractXmlSection,
  extractReadingRefs,
  classifyRefs,
  inlineGuardRefs,
  inlineWorkflow,
};
```

### I5: codex.js Unicode Escape Replacement

Current (lines 16-39, template literal with \uXXXX):
```javascript
return `<codex_skill_adapter>
## C\u00E1ch g\u1ECDi skill n\u00E0y
...
```

After fix (actual Vietnamese UTF-8):
```javascript
return `<codex_skill_adapter>
## Cach goi skill nay
Skill name: \`$pd-${skillName}\`
Khi user goi \`$pd-${skillName} {{args}}\`, thuc hien toan bo instructions ben duoi.

## Tool mapping
- \`AskUserQuestion\` -> \`request_user_input\`: Khi can hoi user, dung request_user_input thay vi AskUserQuestion
...
```

Note: The Vietnamese text should have proper diacritics (e.g., `Cach` -> `Cach` with proper accents). The exact characters are decoded from the Unicode escapes in the current file.

### C2/V1: fix-bug.md Stack Table Addition

Current (lines 135-141):
```markdown
| Stack | Luong |
|-------|-------|
| NestJS | request -> controller -> service -> database -> response |
| NextJS | page/component -> store -> API call -> hien thi |
| WordPress | hook/action -> callback -> $wpdb -> output |
| Solidity | function -> require -> state change -> external -> events |
| Flutter | View (Obx) -> Logic (GetxController) -> Repository -> API -> Response |
```

After fix:
```markdown
| Stack | Luong |
|-------|-------|
| NestJS | request -> controller -> service -> database -> response |
| NextJS | page/component -> store -> API call -> hien thi |
| WordPress | hook/action -> callback -> $wpdb -> output |
| Solidity | function -> require -> state change -> external -> events |
| Flutter | View (Obx) -> Logic (GetxController) -> Repository -> API -> Response |
| Generic/Khac | entry point -> handler -> business logic -> data layer -> response |
```

Plus add before table (around line 133):
```markdown
CONTEXT.md -> stack -> doc .planning/rules/[stack].md -> truy vet luong:
Khong xac dinh duoc stack tu CONTEXT.md -> dung luong truy vet generic: entry point -> handler -> business logic -> data layer -> response. Ghi note: "Stack khong xac dinh, dung luong generic."
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner v22+ |
| Config file | None (uses node --test directly) |
| Quick run command | `node --test test/smoke-utils.test.js test/smoke-plan-checker.test.js` |
| Full suite command | `node --test test/smoke-*.test.js` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BFIX-01 (W6-W8) | Dead exports removed from utils.js | unit | `node --test test/smoke-utils.test.js` | Yes (may need update if tests import removed exports) |
| BFIX-01 (I5) | codex.js Unicode replaced | unit + snapshot | `node --test test/smoke-converters.test.js test/smoke-snapshot.test.js` | Yes |
| BFIX-01 (I6) | plan-checker comment updated | N/A (comment only) | N/A | N/A |
| BFIX-01 (C1) | bin/plan-check.js CLI works | smoke | `node bin/plan-check.js .planning/milestones/v1.0/phase-1/` (manual) | No -- Wave 0 gap |
| BFIX-02 | Snapshots in sync after all fixes | snapshot | `node --test test/smoke-snapshot.test.js` | Yes |
| BFIX-03 (all workflow fixes) | Workflows have correct content | manual-only | Manual review -- markdown text changes | N/A |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-utils.test.js test/smoke-plan-checker.test.js` (quick, <2s)
- **Per wave merge:** `node --test test/smoke-*.test.js` (full suite, ~1s, 448 tests)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Verify `test/smoke-utils.test.js` does not directly test removed exports (COLORS, colorize, assembleMd, CONDITIONAL_LOADING_MAP) -- if so, remove those test cases
- [ ] CLI wrapper test: manual verification `node bin/plan-check.js <existing-plan-dir>` returns valid JSON

## Recommended Fix Ordering

### Wave 1: JS Module Fixes (testable, independent)
1. **W6-W8:** Remove dead exports from `bin/lib/utils.js` (check/update tests first)
2. **I6:** Fix stale comment in `bin/lib/plan-checker.js` line 2
3. **I5:** Replace Unicode escapes in `bin/lib/converters/codex.js` lines 16-39
4. **C1:** Create `bin/plan-check.js` CLI wrapper + update `workflows/plan.md` Step 8.1

**Verify after Wave 1:** `node --test test/smoke-*.test.js` -- all 448 tests must pass (may change slightly due to test updates)

### Wave 2: Workflow Text Fixes (independent of each other)
5. **C2/V1 + V2:** Fix `workflows/fix-bug.md` (stack fallback + effort routing removal)
6. **V3/W12 + W3:** Fix `workflows/new-milestone.md` (AskUserQuestion fallback + guard error)
7. **V5/W9:** Fix `workflows/write-code.md` (parallel degradation warning)
8. **W11:** Fix `workflows/complete-milestone.md` (verification fallback)
9. **W14:** Fix `workflows/scan.md` (JSON exclusion rationale)
10. **W15:** Fix `workflows/init.md` (FastCode bypass option)

### Wave 3: Skill/Reference Wiring + Pattern Documentation
11. **W1, W2, W4, W5:** Wire missing references into skill execution_context sections
12. **I1, I2, I4, I7:** Add intentional pattern audit comments
13. **I3:** Fix hardcoded version in `references/plan-checker.md`
14. **V6:** Add note to `references/conventions.md`

### Wave 4: Snapshot Regeneration + Final Verification
15. **D-18/D-19:** Run `node test/generate-snapshots.js`, review diffs, commit

**Verify after Wave 4:** `node --test test/smoke-*.test.js` -- all tests pass including snapshot tests

## Open Questions

1. **smoke-utils.test.js coverage of removed exports**
   - What we know: W6-W8 removes 4 exports. No external module imports them.
   - What's unclear: Does the test file directly test these removed exports?
   - Recommendation: Check test file before removing exports. If tests exist for these, remove the test cases too.

2. **bin/plan-check.js requirement ID parsing from ROADMAP.md**
   - What we know: `runAllChecks` accepts `requirementIds` parameter. Plan.md Step 8.1 says to parse from ROADMAP.md.
   - What's unclear: Exact parsing logic for extracting requirement IDs from ROADMAP.md phase section
   - Recommendation: Keep it simple -- if ROADMAP.md exists and has `**Requirements**:` line for the phase, parse comma-separated IDs. Otherwise empty array (graceful degradation).

## Sources

### Primary (HIGH confidence)
- `bin/lib/utils.js` (lines 412-430) -- verified current exports
- `bin/lib/plan-checker.js` (lines 1-9, 937-986) -- verified module header and exports
- `bin/lib/converters/codex.js` (lines 14-40) -- verified Unicode escape content
- `workflows/fix-bug.md` (lines 133-174) -- verified current stack table and effort routing
- `workflows/new-milestone.md` (line 105) -- verified current fallback text
- `workflows/write-code.md` (lines 118, 364-368) -- verified parallel mode text
- `commands/pd/*.md` -- verified all 8 skill execution_context sections
- `test/smoke-*.test.js` -- verified 448 tests pass (0 fail)
- `.planning/phases/14-skill-workflow-audit/14-AUDIT-REPORT.md` -- 27 issues master list
- `.planning/phases/15-workflow-verification/15-VERIFICATION-REPORT.md` -- 6 issues V1-V6

### Secondary (MEDIUM confidence)
- Grep verification of external imports for utils.js exports -- 0 external consumers found
- `.planning/config.json` -- `commit_docs: false`, `nyquist_validation: true`

### Tertiary (LOW confidence)
- None -- all findings verified against source files at current HEAD

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all existing infrastructure
- Architecture: HIGH -- file grouping and fix ordering verified against dependency chains
- Pitfalls: HIGH -- all line numbers verified against current files, consumer analysis complete
- Fix map: HIGH -- every issue traced to exact file + line + current content

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable -- no fast-moving dependencies)
