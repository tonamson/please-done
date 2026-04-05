---
phase: 91
milestone: v11.0
---

# Phase 91 Tasks: STATUS-01 — Workflow Integration

## Active Tasks

None - planning phase only.

## Pending Tasks

### P91-T1: Update State Machine with Status Prerequisites
- **Status:** ⏳ Pending
- **Priority:** High
- **Est. Time:** 25 minutes
- **Assignee:** TBD
- **Files:** `.planning/STATE.md`
- **Notes:** Add pd:status to available skills, update capabilities section

### P91-T2: Update what-next.md with Status Suggestions
- **Status:** ⏳ Pending
- **Priority:** High
- **Est. Time:** 30 minutes
- **Assignee:** TBD
- **Files:** `workflows/what-next.md`
- **Notes:** Add idle detection and status suggestion logic

### P91-T3: Implement Auto-Refresh Logic
- **Status:** ⏳ Pending
- **Priority:** Medium
- **Est. Time:** 40 minutes
- **Assignee:** TBD
- **Files:** `bin/lib/refresh-detector.js`, `test/refresh-detector.test.js`
- **Notes:** Pure functions for staleness detection, 10min threshold default

### P91-T4: Update Documentation with Status Examples
- **Status:** ⏳ Pending
- **Priority:** Medium
- **Est. Time:** 25 minutes
- **Assignee:** TBD
- **Files:** `CLAUDE.md`, `README.md`
- **Notes:** Add usage examples and flag documentation

### P91-T5: Create Integration Tests
- **Status:** ⏳ Pending
- **Priority:** High
- **Est. Time:** 35 minutes
- **Assignee:** TBD
- **Files:** `test/pd-status-workflow.integration.test.js`
- **Notes:** Test what-next suggestions, auto-refresh, state machine

### P91-T6: Update Skill Registry
- **Status:** ⏳ Pending
- **Priority:** Medium
- **Est. Time:** 15 minutes
- **Assignee:** TBD
- **Files:** Skill index/registry
- **Notes:** Ensure pd:status is discoverable

### P91-T7: Smoke Test and Validation
- **Status:** ⏳ Pending
- **Priority:** High
- **Est. Time:** 20 minutes
- **Assignee:** TBD
- **Files:** None (validation only)
- **Notes:** Full test suite, regression check

## Task Summary

| Status | Count |
|--------|-------|
| ⏳ Pending | 7 |
| 🔄 In Progress | 0 |
| ✅ Completed | 0 |
| **Total** | **7** |

## Execution Order

```
P91-T1 → P91-T2 → P91-T3 → P91-T4 → P91-T5 → P91-T6 → P91-T7
   │        │        │        │        │        │        │
   └────────┴────────┴────────┴────────┴────────┴────────┘
                              Sequential
```

## Deliverables (Planned)

1. **bin/lib/refresh-detector.js** - Pure function library for staleness detection
2. **test/refresh-detector.test.js** - Unit tests (target: 90%+ coverage)
3. **test/pd-status-workflow.integration.test.js** - Integration tests
4. **Updated STATE.md** - With status skill reference
5. **Updated what-next.md** - With idle suggestions
6. **Updated documentation** - CLAUDE.md, README.md

## Estimates

- **Total Est. Time:** ~3 hours
- **High Priority Tasks:** 4 (T1, T2, T5, T7)
- **Medium Priority Tasks:** 3 (T3, T4, T6)
