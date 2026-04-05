---
phase: 115-advanced-reconnaissance
plan: 01
subsystem: Business Logic Mapping
status: completed
tags: [RECON-06, state-machines, workflow-analysis, AST-traversal]
tech-stack:
  added: ["@babel/parser", "@babel/traverse"]
  patterns: ["AST-based detection", "State machine extraction", "Workflow graph construction"]
decisions:
  - D-01: State machine detection via AST patterns
  - D-02: Workflow sequence extraction from API chains
  - D-03: Business logic flaw identification
  - D-04: Mermaid state diagram + JSON output
key-files:
  created:
    - bin/lib/business-logic-mapper.js
    - bin/lib/workflow-analyzer.js
    - test/lib/business-logic-mapper.test.js
    - test/lib/workflow-analyzer.test.js
    - test/fixtures/sample-state-machines/react-usestate.jsx
    - test/fixtures/sample-state-machines/redux-reducer.js
    - test/fixtures/sample-state-machines/xstate-machine.js
metrics:
  duration: "22 minutes"
  completed-date: "2026-04-05"
  tasks-completed: 3/3
  tests-passing: 37/37
---

# Phase 115 Plan 01: Business Logic Mapping Summary

**One-liner:** Implemented Business Logic Mapper with state machine detection (React useState, Redux, XState, Vuex, Pinia) and Workflow Analyzer with risk identification.

## Overview

This plan implements the Business Logic Mapping module (RECON-06) for Phase 115 Advanced Reconnaissance. The module enables security teams to understand application workflows, identify state transition vulnerabilities, and detect business logic bypass opportunities.

## Implementation Summary

### Task 1: Business Logic Mapper Core Module

Created `bin/lib/business-logic-mapper.js` with:

- **BusinessLogicMapper class** - Main analysis orchestrator
- **State Machine Detection** (D-01):
  - React useState pattern detection
  - Redux reducer pattern detection
  - XState createMachine/Machine pattern detection
  - Vuex store detection
  - Pinia store detection
  - Manual state enum detection
- **Business Logic Flaw Detection** (D-03):
  - Missing auth checks in state transitions
  - Race condition patterns
  - State bypass opportunities
  - Validation gaps
- **Mermaid State Diagram Generation** (D-04):
  - Generates stateDiagram-v2 format
  - Includes state transitions and events
  - Risk annotations as notes
- **Risk Scoring** per D-17 through D-21:
  - Critical: Business workflow bypass
  - High: Missing auth in transitions
  - Medium: Race conditions, timing issues
  - Low: Complexity warnings

### Task 2: Workflow Analyzer Module

Created `bin/lib/workflow-analyzer.js` with:

- **WorkflowAnalyzer class** - Workflow extraction engine
- **Workflow Graph Construction**:
  - Nodes: api-call, auth-check, validation, db-operation, data-source
  - Edges: sequence, conditional, error-handler, entry
- **Step Detection** (D-02):
  - Database operations: findOne, findAll, create, update, destroy, query
  - HTTP/API calls: fetch, axios, request
  - Auth checks: auth, verify, check.*permission patterns
  - Validation: validate, sanitize, schema, joi, yup, zod
  - Data sources: req.body, req.query, req.params, req.headers, req.cookies
- **Risk Analysis** (D-05):
  - Missing auth before sensitive operations
  - Missing validation before data processing
  - Potential race conditions in async flows
  - Tainted data flows to sinks

### Task 3: Unit Tests and Test Fixtures

Created comprehensive test suite:

- **business-logic-mapper.test.js** (16 test cases):
  - React useState pattern detection
  - Redux reducer pattern handling
  - XState machine pattern handling
  - Mermaid diagram generation
  - Missing auth detection
  - Race condition detection
  - Bypass opportunity detection
  - Validation gap detection
  - Graceful error handling
  - Caching integration

- **workflow-analyzer.test.js** (21 test cases):
  - Route handler detection
  - API call chain detection
  - Database operation detection
  - Validation step detection
  - Data source step detection
  - Missing auth detection
  - Auth check presence recognition
  - Missing validation detection
  - Async operation detection
  - Race condition detection
  - Graph construction
  - Tainted flow detection

**Test Fixtures:**
- `react-usestate.jsx` - Form and payment state machines
- `redux-reducer.js` - Cart, auth, and order reducers
- `xstate-machine.js` - Order, auth, payment machines

## Key Design Decisions

1. **AST-based Detection** - Using @babel/parser and @babel/traverse for accurate pattern matching
2. **Unified Analysis** - Single AST traversal collecting multiple data types
3. **Integration Pattern** - Following ReconCache and Phase 114 integration patterns
4. **Risk-based Output** - Severity classification per research document D-17 through D-21

## Module Exports

### business-logic-mapper.js
```javascript
{
  BusinessLogicMapper,
  detectStateMachines,
  analyzeLogicFlaws
}
```

### workflow-analyzer.js
```javascript
{
  WorkflowAnalyzer,
  extractWorkflows,
  buildWorkflowGraph
}
```

## Verification Results

```bash
# Module existence
ls -la bin/lib/business-logic-mapper.js bin/lib/workflow-analyzer.js
# Both files exist

# Test execution
node --test test/lib/business-logic-mapper.test.js
node --test test/lib/workflow-analyzer.test.js
# All 37 tests pass

# Integration check
node -e "const { BusinessLogicMapper } = require('./bin/lib/business-logic-mapper'); console.log('OK');"
node -e "const { WorkflowAnalyzer } = require('./bin/lib/workflow-analyzer'); console.log('OK');"
# Both modules load successfully
```

## Deviations from Plan

None - plan executed as written.

## Known Limitations

1. **Redux Detection** - Requires specific AST structure; may miss some variations
2. **XState Detection** - Object literal createMachine calls may not always be detected
3. **Middleware Auth** - Express middleware auth (verifyAuth in route definition) not detected; must be called within handler

## Commits

| Commit | Description |
|--------|-------------|
| b85c11d | feat(115-01): create BusinessLogicMapper module |
| 0ef696e | feat(115-01): create WorkflowAnalyzer module |
| 6105408 | test(115-01): add unit tests and test fixtures |

## Files Modified/Created

- `bin/lib/business-logic-mapper.js` (1021 lines, new)
- `bin/lib/workflow-analyzer.js` (719 lines, new)
- `test/lib/business-logic-mapper.test.js` (new)
- `test/lib/workflow-analyzer.test.js` (new)
- `test/fixtures/sample-state-machines/react-usestate.jsx` (new)
- `test/fixtures/sample-state-machines/redux-reducer.js` (new)
- `test/fixtures/sample-state-machines/xstate-machine.js` (new)

---

*Plan 115-01 completed successfully*

## Self-Check: PASSED

- [x] bin/lib/business-logic-mapper.js exists
- [x] bin/lib/workflow-analyzer.js exists
- [x] test/lib/business-logic-mapper.test.js exists
- [x] test/lib/workflow-analyzer.test.js exists
- [x] test/fixtures/sample-state-machines/react-usestate.jsx exists
- [x] test/fixtures/sample-state-machines/redux-reducer.js exists
- [x] test/fixtures/sample-state-machines/xstate-machine.js exists
- [x] BusinessLogicMapper module loads correctly
- [x] WorkflowAnalyzer module loads correctly
- [x] generateMermaid method exists and is callable
- [x] All 37 unit tests pass
- [x] Commit b85c11d exists
- [x] Commit 0ef696e exists
- [x] Commit 6105408 exists
