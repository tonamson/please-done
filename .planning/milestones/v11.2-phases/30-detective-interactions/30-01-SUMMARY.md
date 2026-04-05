---
phase: 30-detective-interactions
plan: 01
subsystem: workflow
tags: [outcome-routing, root-cause, pure-functions, evidence-protocol]

# Dependency graph
requires:
  - phase: 29-detective-protocols
    provides: evidence-protocol.js (parseEvidence, OUTCOME_TYPES), utils.js (assembleMd)
provides:
  - "outcome-router.js: 4 pure functions routing ROOT CAUSE actions (buildRootCauseMenu, prepareFixNow, prepareFixPlan, prepareSelfFix)"
  - "ROOT_CAUSE_CHOICES constant: 3 entries (fix_now, fix_plan, self_fix)"
affects: [32-orchestrator-workflow]

# Tech tracking
tech-stack:
  added: []
  patterns: [action-descriptor-pattern, menu-from-evidence-pattern]

key-files:
  created:
    - bin/lib/outcome-router.js
    - test/smoke-outcome-router.test.js
  modified: []

key-decisions:
  - "Pure function pattern nhat quan voi evidence-protocol.js va session-manager.js"
  - "prepareFixNow KHONG tra agentName — orchestrator truc tiep sua code (D-02)"
  - "prepareFixPlan tra planPath relative (FIX-PLAN.md) khong phai absolute (D-03, Pitfall 4)"

patterns-established:
  - "Action descriptor: moi function tra ve { action, ...data, warnings } de orchestrator xu ly"
  - "Menu from evidence: parse evidence -> extract sections -> build structured choices"

requirements-completed: [PROT-03]

# Metrics
duration: 2min
completed: 2026-03-25
---

# Phase 30 Plan 01: Outcome Router Summary

**4 pure functions routing ROOT CAUSE choices (Sua ngay/Len ke hoach/Tu sua) tu evidence content, 8 tests pass**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-25T02:42:35Z
- **Completed:** 2026-03-25T02:44:33Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- buildRootCauseMenu() tao menu 3 lua chon tu evidence root_cause, tra choices rong khi outcome khac
- prepareFixNow() tra action descriptor voi reusableModules v1.5 va commitPrefix [LOI]
- prepareFixPlan() tao FIX-PLAN.md content co YAML frontmatter va 5 sections (Nguyen nhan, Files, Test, De xuat, Risk)
- prepareSelfFix() tra sessionUpdate status=paused va resumeHint pd:fix-bug
- TDD flow hoan chinh: RED (8 tests fail) -> GREEN (8 tests pass)

## Task Commits

Each task was committed atomically:

1. **Task 1: Tao test file smoke-outcome-router.test.js** - `b83f3e7` (test — TDD RED)
2. **Task 2: Tao module outcome-router.js** - `ed75777` (feat — TDD GREEN)

_Note: TDD tasks have RED commit (tests fail) then GREEN commit (implementation pass)_

## Files Created/Modified
- `bin/lib/outcome-router.js` — Module chinh: 4 pure functions + 1 constant, routing ROOT CAUSE outcomes
- `test/smoke-outcome-router.test.js` — 8 tests kiem tra toan bo behaviors cua 4 functions

## Decisions Made
- Pure function pattern nhat quan voi evidence-protocol.js va session-manager.js — truyen content qua tham so, tra structured object voi warnings
- prepareFixNow KHONG tra agentName — orchestrator truc tiep sua code (D-02)
- prepareFixPlan tra planPath relative ('FIX-PLAN.md') khong phai absolute (D-03, Pitfall 4)

## Deviations from Plan

None — plan thuc thi chinh xac nhu thiet ke.

## Issues Encountered
None

## User Setup Required
None — khong can cau hinh dich vu ben ngoai.

## Next Phase Readiness
- outcome-router.js san sang cho Phase 32 (Orchestrator Workflow) su dung
- 4 functions export co the goi truc tiep tu orchestrator loop
- ROOT_CAUSE_CHOICES constant co the dung cho UI rendering

---
*Phase: 30-detective-interactions*
*Completed: 2026-03-25*
