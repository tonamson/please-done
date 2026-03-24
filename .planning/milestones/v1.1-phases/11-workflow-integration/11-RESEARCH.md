# Phase 11: Workflow Integration - Research

**Researched:** 2026-03-23
**Domain:** Workflow modification (plan.md), report formatting, user choice patterns, STATE.md audit
**Confidence:** HIGH

## Summary

Phase 11 integrates the existing `plan-checker.js` module (Phase 10, fully implemented) into the `workflows/plan.md` workflow. The module is a pure function (`runAllChecks`) that takes `{ planContent, tasksContent, requirementIds }` and returns `{ overall: 'pass'|'block'|'warn', checks: [...] }`. Phase 11's job is strictly: (1) insert a new Step 8.1 between Step 8 (tracking update) and Step 8.5 (git commit), (2) format the check results for user display, (3) present user choices when issues are found, and (4) write audit/tracking entries to STATE.md.

No new libraries are needed. No new JavaScript modules need to be created. The entire scope is modifying `workflows/plan.md` (a markdown workflow instruction file read by Claude, not executable code) and defining the display/choice/audit behavior within that workflow step.

**Primary recommendation:** This is a single-file workflow modification to `workflows/plan.md`. Add Step 8.1 with three paths: PASS (continue to 8.5), ISSUES FOUND (user choice: Fix/Proceed/Cancel), and the fix loop. All formatting, choice, and audit logic are workflow instructions (markdown prose), not executable JavaScript.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Khi PASS -- hien thi summary table liet ke tung check voi status icon: CHECK-01 pass, CHECK-02 pass, CHECK-03 pass, CHECK-04 pass
- **D-02:** Khi ISSUES FOUND -- grouped theo check: moi check failed hien thi header + danh sach issues ben duoi
- **D-03:** Issues chi hien thi message -- khong hien fixHint inline (fixHint dung internal khi Claude auto-fix)
- **D-04:** Max 10 issues hien thi, vuot qua thi ghi "+N more issues" o cuoi
- **D-05:** Khi user chon Fix -- giu nguyen PLAN.md + TASKS.md, Claude doc issues + fixHint va tu sua truc tiep vao file
- **D-06:** Sau moi lan fix, tu dong re-run checker -- loop cho den khi pass hoac user chon Proceed/Cancel
- **D-07:** WARN-only (khong co BLOCK) van hoi user choice -- khong auto-proceed
- **D-08:** Choice options khi co issues: Fix (De xuat) / Proceed with warnings / Cancel
- **D-09:** BLOCK issues: cho phep Proceed nhung KHONG mac dinh -- can user xac nhan explicit rieng (VD: "Force proceed" voi confirm step them)
- **D-10:** BLOCK proceed phai luu audit ro rang -- ghi vao STATE.md nhung BLOCK nao user da override
- **D-11:** Khi Cancel -- giu PLAN.md + TASKS.md tren disk (khong xoa), ghi note vao STATE.md rang plan bi cancel kem ly do (issues found)
- **D-12:** Warnings da acknowledged ghi vao STATE.md -> Accumulated Context section -- de session sau biet plan co known issues
- **D-13:** Canh bao tich luy nhe khi user lien tuc proceed qua warnings o nhieu plans (VD: "Luu y: 3 plans gan day deu co warnings"), nhung moi plan van la don vi quyet dinh chinh -- khong block dua tren lich su

### Claude's Discretion
- Re-plan flow (Step 1.5 interaction): Claude quyet dinh behavior toi uu khi checker chay tren plan da re-plan
- Report formatting chi tiet (spacing, icons, markdown style)
- fixHint parsing logic de auto-fix
- So lan max re-run loop truoc khi suggest Cancel
- Exact wording cua cumulative warning message

### Deferred Ideas (OUT OF SCOPE)
- Key Links verification -- Phase 12 (ADV-01)
- Scope threshold warnings -- Phase 12 (ADV-02)
- Effort classification validation -- Phase 12 (ADV-03)
- Standalone `/pd:check-plan` command -- Out of Scope per REQUIREMENTS.md
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INTG-01 | Plan checker tra ket qua PASS/ISSUES FOUND voi danh sach blockers/warnings co actionable fix hints | Report format patterns (D-01 through D-04), user choice pattern (D-08/D-09), STATE.md audit (D-10/D-11/D-12) |
| INTG-02 | Plan checker tu dong chay sau khi tao PLAN.md + TASKS.md trong workflow plan.md | Step 8.1 insertion point (between Step 8 and Step 8.5), runAllChecks API, requirementIds parsing from ROADMAP.md |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| plan-checker.js | (local module) | 4 structural validators + runAllChecks orchestrator | Phase 10 output, already tested against 22 historical plans |
| utils.js | (local module) | parseFrontmatter, extractXmlSection | Existing shared utility, imported by plan-checker.js |

### Supporting
No new libraries needed. Zero new dependencies (per v1.1 research decision in STATE.md).

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Workflow markdown instructions | Separate JS formatter module | Overkill -- formatting is Claude's output to user, not programmatic. Workflow instructions are the established pattern |

## Architecture Patterns

### Recommended Project Structure
```
workflows/
  plan.md              # MODIFY: add Step 8.1 between Step 8 and Step 8.5
bin/lib/
  plan-checker.js      # READ ONLY: already complete from Phase 10
  utils.js             # READ ONLY: shared utilities
references/
  plan-checker.md      # READ ONLY: rules spec
.planning/
  STATE.md             # MODIFY: audit entries for proceed/cancel
  ROADMAP.md           # READ: parse Requirements: field per phase
```

### Pattern 1: Workflow Step Insertion
**What:** Adding a new numbered step between existing steps using decimal numbering.
**When to use:** When the plan.md workflow needs a new behavior between existing steps.
**Established convention:** Steps are numbered with decimals for insertions (e.g., 8, 8.1, 8.5, 9). This pattern already exists for Steps 1.4, 1.5, 3.5, 4.3, 4.5.

**Example from existing code (plan.md):**
```markdown
## Buoc 8: Cap nhat tracking
[existing content]
---

## Buoc 8.1: Kiem tra plan (NEW STEP)
[plan checker integration]
---

## Buoc 8.5: Git commit (CHI neu co git)
[existing content]
```

### Pattern 2: AskUserQuestion Single-Select with "(De xuat)"
**What:** User choice pattern using AskUserQuestion with single-select mode and recommended option marked.
**When to use:** When user must choose between actions.
**Established convention:** First option marked "(De xuat)", multiSelect: false, max 3-4 options, label + description format.

**Example from existing code (new-milestone.md lines 92-103):**
```
AskUserQuestion({
  questions: [{
    question: "...",
    header: "...",
    multiSelect: false,
    options: [
      { label: "Sao luu (De xuat)", description: "..." },
      { label: "Xoa tat ca", description: "..." },
      { label: "Chi xoa chua co code", description: "..." }
    ]
  }]
})
```

### Pattern 3: STATE.md Accumulated Context Entries
**What:** Writing audit/tracking entries to STATE.md's "Boi canh tich luy" section.
**When to use:** When workflow decisions need to persist across sessions.
**Established convention:** STATE.md has "Decisions", "Pending Todos", "Blockers/Concerns" subsections under Accumulated Context. Entries are formatted as `- [context]: description`.

**Existing example from STATE.md:**
```markdown
## Accumulated Context

### Decisions
- [v1.1 Research]: Zero new dependencies -- pure Node.js regex + existing utils.js
- [Phase 10]: Single plan-checker.js module with 4 checks + 12 helpers

### Pending Todos
None yet.

### Blockers/Concerns
- Phase 10: False positive validation against 16 historical plans...
```

### Pattern 4: Plan Checker API Usage
**What:** Calling runAllChecks with plan content and processing the result.
**When to use:** In Step 8.1 to validate the freshly created PLAN.md + TASKS.md.

**API from plan-checker.js (verified by reading source):**
```javascript
const { runAllChecks, detectPlanFormat } = require('./plan-checker');

// Main entry point - pure function, no I/O
const result = runAllChecks({
  planContent,      // string: full PLAN.md content
  tasksContent,     // string: full TASKS.md content (null for v1.0)
  requirementIds    // string[]: e.g. ['INTG-01', 'INTG-02']
});

// Result structure:
// {
//   overall: 'pass' | 'block' | 'warn',
//   checks: [
//     { checkId: 'CHECK-01', status: 'pass'|'block'|'warn', issues: [{message, location, fixHint}] },
//     { checkId: 'CHECK-02', ... },
//     { checkId: 'CHECK-03', ... },
//     { checkId: 'CHECK-04', ... }
//   ]
// }
```

### Pattern 5: Requirement IDs Parsing from ROADMAP.md
**What:** Extracting requirement IDs from ROADMAP.md's `**Requirements**:` field per phase.
**When to use:** To pass requirementIds parameter to runAllChecks.

**ROADMAP.md format (verified):**
```markdown
### Phase 11: Workflow Integration
**Goal**: ...
**Depends on**: Phase 10
**Requirements**: INTG-01, INTG-02   <-- parse this line
```

**Parsing logic:** Read ROADMAP.md, find phase section, extract comma-separated IDs from `**Requirements**:` line. If field missing, pass empty array (CHECK-01 auto-PASS per D-10 in Phase 10).

### Anti-Patterns to Avoid
- **Creating a new JS module for formatting:** The report display is Claude's text output to user, not programmatic code. Formatting logic belongs in workflow instructions.
- **Modifying plan-checker.js:** Phase 10's module is complete and tested. Step 8.1 is a consumer only.
- **Auto-proceeding on WARN-only results:** D-07 explicitly requires user choice even for warnings-only.
- **Showing fixHint to user:** D-03 says fixHint is internal for Claude auto-fix, not displayed to user.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Plan validation | Custom validation code | `runAllChecks()` from plan-checker.js | Already implemented, tested against 22 plans, zero false positives |
| Format detection | Manual format checking | `detectPlanFormat()` from plan-checker.js | Handles v1.0, v1.1, and unknown formats correctly |
| User choice UI | Custom prompt mechanism | AskUserQuestion pattern | Established pattern across all workflows |
| Frontmatter parsing | Manual regex | `parseFrontmatter()` from utils.js | Edge cases already handled |

**Key insight:** Phase 11 creates NO new executable code. It modifies workflow instructions (markdown) that Claude follows. The plan-checker module (Phase 10) does all the computation.

## Common Pitfalls

### Pitfall 1: Forgetting requirementIds Parsing
**What goes wrong:** Step 8.1 calls runAllChecks without requirementIds, causing CHECK-01 to auto-PASS on every plan.
**Why it happens:** requirementIds must be extracted from ROADMAP.md, not from the PLAN.md frontmatter. The workflow currently doesn't read ROADMAP for this purpose in the commit step.
**How to avoid:** Step 8.1 instructions must explicitly include: "Read ROADMAP.md, find current phase section, parse `**Requirements**:` field to extract IDs."
**Warning signs:** CHECK-01 always passes even on plans that obviously miss requirements.

### Pitfall 2: BLOCK Proceed Without Explicit Confirmation
**What goes wrong:** User accidentally proceeds past BLOCK issues because the choice pattern is same as WARN.
**Why it happens:** D-09 requires a separate confirmation step for BLOCK proceed, but implementer uses the same AskUserQuestion for both.
**How to avoid:** Two-step flow for BLOCK: first choice (Fix/Proceed/Cancel), then if Proceed selected with BLOCKs, second confirmation ("Force proceed" explicit confirm). D-09 is clear about this.
**Warning signs:** User can proceed past BLOCKs with one click.

### Pitfall 3: Fix Loop Without Exit Condition
**What goes wrong:** Claude enters infinite fix-recheck loop.
**Why it happens:** D-06 says loop until pass or user chooses Proceed/Cancel, but without a max iteration guard, edge cases could loop forever.
**How to avoid:** Claude's discretion includes max re-run count. Recommend 3 iterations max before suggesting Cancel. After each fix attempt, re-present user choice.
**Warning signs:** Claude keeps fixing the same issue repeatedly.

### Pitfall 4: Step 1.5 Re-plan Interaction
**What goes wrong:** Checker runs on a plan that was loaded from disk (re-plan or "giu nguyen" flow), potentially after tracking was already updated.
**Why it happens:** Step 1.5 can jump to Step 8 (skip planning, just update tracking), which means Step 8.1 would run on existing plan content.
**How to avoid:** Step 8.1 should work the same regardless -- read current PLAN.md + TASKS.md from disk, run checks. The checker is idempotent and pure. If plan was kept unchanged, checker results should be same as before (or better if issues were fixed).
**Warning signs:** None if implemented correctly -- the pure function nature of runAllChecks handles this naturally.

### Pitfall 5: STATE.md Write Conflicts
**What goes wrong:** Step 8 already writes to STATE.md, then Step 8.1 also writes to STATE.md, potentially overwriting.
**Why it happens:** Both steps modify the same file.
**How to avoid:** Step 8 writes to "Vị trí hiện tại" section. Step 8.1 writes to "Bối cảnh tích lũy" section only. Different sections, so append-only to Accumulated Context.
**Warning signs:** STATE.md entries from Step 8 disappear after Step 8.1.

### Pitfall 6: Cancel Path Not Updating Tracking
**What goes wrong:** User cancels after Step 8 already updated tracking (CURRENT_MILESTONE, ROADMAP).
**Why it happens:** Step 8 runs before Step 8.1. If user cancels at Step 8.1, tracking files still show plan as complete.
**How to avoid:** D-11 says keep PLAN.md + TASKS.md on disk but note cancel in STATE.md. The tracking update from Step 8 is still valid (files exist on disk). Cancel just means the plan has known issues and wasn't committed. The STATE.md note provides context for next session.
**Warning signs:** Mismatch between "plan cancelled" note and tracking showing plan complete.

## Code Examples

### Example 1: Step 8.1 PASS Report Format (D-01)
```markdown
### Kiem tra plan

| Check | Ket qua |
|-------|---------|
| CHECK-01: Requirement Coverage | PASS |
| CHECK-02: Task Completeness | PASS |
| CHECK-03: Dependency Correctness | PASS |
| CHECK-04: Truth-Task Coverage | PASS |

**Ket qua: PASS** -- Plan dat chat luong, tiep tuc commit.
```

### Example 2: Step 8.1 ISSUES FOUND Report Format (D-02, D-03, D-04)
```markdown
### Kiem tra plan

**Ket qua: ISSUES FOUND**

#### CHECK-01: Requirement Coverage -- BLOCK
- Requirement INTG-01 khong xuat hien trong PLAN.md
- Requirement INTG-02 khong xuat hien trong PLAN.md

#### CHECK-02: Task Completeness -- WARN
- Task 2 thieu truong Trang thai (warn)
- Task 3 thieu truong Loai (warn)
- +5 more issues

#### CHECK-03: Dependency Correctness -- PASS
#### CHECK-04: Truth-Task Coverage -- PASS
```
Note: fixHint is NOT shown (D-03). Max 10 issues total, then "+N more" (D-04).

### Example 3: User Choice When Issues Found (D-08)
```
AskUserQuestion({
  questions: [{
    question: "Plan co issues. Ban muon xu ly the nao?",
    header: "Kiem tra plan",
    multiSelect: false,
    options: [
      { label: "Fix (De xuat)", description: "Claude tu dong sua issues va kiem tra lai" },
      { label: "Proceed with warnings", description: "Bo qua issues, tiep tuc commit" },
      { label: "Cancel", description: "Giu plan tren disk, ghi note vao STATE.md" }
    ]
  }]
})
```

### Example 4: BLOCK Proceed Confirmation (D-09)
```
AskUserQuestion({
  questions: [{
    question: "Plan co BLOCK issues. Xac nhan force proceed?",
    header: "Canh bao: BLOCK issues",
    multiSelect: false,
    options: [
      { label: "Force proceed", description: "Bo qua BLOCK issues -- se ghi audit vao STATE.md" },
      { label: "Quay lai (De xuat)", description: "Chon lai: Fix hoac Cancel" }
    ]
  }]
})
```

### Example 5: STATE.md Audit Entries (D-10, D-11, D-12)
```markdown
### Decisions
- [Phase 11 Plan Check]: Plan 11-01 proceed with 2 BLOCK overrides: CHECK-01 (INTG-01 missing), CHECK-02 (Task 3 thieu Effort)
- [Phase 11 Plan Check]: Plan 11-01 proceed with 3 warnings acknowledged: CHECK-02 (Task 1 thieu Trang thai, Task 2 thieu Loai), CHECK-04 (Task 3 khong co Truth)
```

Cancel entry:
```markdown
### Decisions
- [Phase 11 Plan Check]: Plan 11-01 cancelled -- 2 BLOCK issues, 1 WARN issue found
```

### Example 6: Cumulative Warning Message (D-13)
```markdown
> Luu y: 3 plans gan day deu co warnings duoc proceed. Review lai chat luong plan neu can.
```
This is a soft notice, not blocking. Shown only when multiple recent plans had warnings.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No plan validation | runAllChecks after plan creation | Phase 10 (2026-03-23) | Plan quality gate before execution |
| Manual plan review | Automated structural checks | Phase 10 (2026-03-23) | 4 checks covering requirements, completeness, dependencies, Truth-Task coverage |

**Already completed (Phase 10):**
- plan-checker.js: 4 checks, 12 helpers, 18 exports
- Tested against 22 historical plans with zero false positives
- Pure functions, no file I/O

## Open Questions

1. **How to count cumulative warnings across plans (D-13)?**
   - What we know: STATE.md stores audit entries per plan. Claude can read previous entries.
   - What's unclear: Exact mechanism to count "recent plans with warnings". Is it all plans in current milestone? Last N plans?
   - Recommendation: Claude reads Accumulated Context section, counts entries matching `[Phase N Plan Check]: Plan X proceed with * warnings`. Simple string matching in workflow instructions. "Recent" = current milestone's plans (since STATE.md resets per milestone context).

2. **Re-plan flow: does checker re-run on kept plans (Step 1.5)?**
   - What we know: Step 1.5 "Giu nguyen" jumps to Step 8. Step 8.1 sits after Step 8.
   - What's unclear: Should checker run on a kept-unchanged plan? Previous check results may already be in STATE.md.
   - Recommendation: Yes, run checker. It's idempotent and fast. If plan was already checked and issues were already in STATE.md, it just confirms status. No harm.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node:test) |
| Config file | none -- uses `node --test 'test/*.test.js'` |
| Quick run command | `node --test 'test/smoke-plan-checker.test.js'` |
| Full suite command | `node --test 'test/*.test.js'` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INTG-01 | Report format PASS/ISSUES with actionable hints | manual-only | N/A -- workflow output formatting is Claude's text, not testable code | N/A |
| INTG-02 | Auto-run in workflow plan.md | manual-only | N/A -- workflow modification is markdown instructions, not executable code | N/A |

**Justification for manual-only:** Phase 11 modifies `workflows/plan.md`, which is a markdown instruction file read by Claude. It does not create or modify JavaScript code. The plan-checker module itself is already thoroughly tested (60 test cases in Phase 10). The workflow integration is verified by running `/pd:plan` and observing the checker output.

### Sampling Rate
- **Per task commit:** `node --test 'test/smoke-plan-checker.test.js'` (ensure no regressions to existing module)
- **Per wave merge:** `node --test 'test/*.test.js'` (full suite)
- **Phase gate:** Full suite green + manual run of `/pd:plan` to verify Step 8.1 behavior

### Wave 0 Gaps
None -- no new test infrastructure needed. Existing test suite covers plan-checker.js. Phase 11 is workflow-only modification.

## Sources

### Primary (HIGH confidence)
- `bin/lib/plan-checker.js` -- Full source read, 643 lines, 18 exports. API: `runAllChecks({ planContent, tasksContent, requirementIds })` returns `{ overall, checks }`
- `workflows/plan.md` -- Full source read, 357 lines. Steps 1-9 with insertion point between Step 8 (line 283) and Step 8.5 (line 298)
- `workflows/new-milestone.md` lines 77-104 -- AskUserQuestion pattern verified: single-select, "(De xuat)" convention, label + description format
- `references/plan-checker.md` -- Rules spec, severity mapping, result format contract
- `.planning/phases/11-workflow-integration/11-CONTEXT.md` -- 13 locked decisions (D-01 through D-13), 5 discretion areas, canonical references
- `.planning/phases/10-core-plan-checks/10-CONTEXT.md` -- Data structure decisions (D-13/D-14/D-15), check result contract
- `.planning/STATE.md` -- Current Accumulated Context format verified
- `templates/state.md` -- STATE.md template: "Boi canh tich luy" section structure

### Secondary (MEDIUM confidence)
- `.planning/ROADMAP.md` -- Phase 11 `**Requirements**: INTG-01, INTG-02` format verified
- `test/smoke-plan-checker.test.js` -- 60 test cases exist for plan-checker module

### Tertiary (LOW confidence)
None -- all findings verified from primary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, using existing Phase 10 module
- Architecture: HIGH -- single workflow file modification with well-established patterns (decimal steps, AskUserQuestion)
- Pitfalls: HIGH -- all pitfalls derived from reading actual code and CONTEXT.md decisions

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable domain -- workflow patterns don't change frequently)
