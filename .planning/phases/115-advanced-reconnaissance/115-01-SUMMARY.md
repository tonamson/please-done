---
phase: "115"
plan: "01"
subsystem: "reconnaissance"
tags:
  - "RECON-06"
  - "business-logic-mapping"
  - "state-machine"
  - "workflow-analysis"
dependency_graph:
  requires: []
  provides:
    - "workflow-mapper.js"
    - "workflow-mapper.test.js"
    - "recon-aggregator-115"
  affects:
    - "bin/lib/recon-aggregator.js"
tech_stack:
  added:
    - "@babel/parser"
    - "@babel/traverse"
  patterns:
    - "OWASP BLA1/BLA2 flaw detection"
    - "AST-based state machine analysis"
    - "Mermaid stateDiagram-v2 generation"
key_files:
  created:
    - path: "bin/lib/workflow-mapper.js"
      lines: 479
      provides: "State machine detection + business logic flaw analysis"
    - path: "bin/lib/workflow-mapper.test.js"
      lines: 344
      provides: "Unit tests for RECON-06 behaviors"
  modified:
    - path: "bin/lib/recon-aggregator.js"
      lines: "+93/-9"
      provides: "Phase 115 wiring at deep/redteam tiers"
decisions: []
metrics:
  duration_seconds: 1308
  completed_date: "2026-04-05T15:44:30Z"
---

# Phase 115 Plan 01: RECON-06 Business Logic Mapping Summary

## One-liner

JWT auth with refresh rotation using jose library

## What Was Built

Implemented RECON-06: Business Logic Mapping - workflow discovery, state machine analysis, and business logic flaw identification for the Please-Done project.

### Components Created

**bin/lib/workflow-mapper.js** (479 lines)
- `WorkflowMapper` class with `analyze()`, `detectStateMachine()`, `detectBusinessLogicFlaws()`, `generateStateMachineDiagram()`
- State machine detection from Express/Fastify/Koa route handler chains
- Business logic flaw detection patterns:
  - BLA1-2025: TOCTOU (Time-of-Check to Time-of-Use)
  - BLA2-2025: WORKFLOW_BYPASS (Missing state validation)
  - PARAM-TAMPER: Parameter Tampering
- Mermaid stateDiagram-v2 format generation
- Severity levels: CRITICAL, HIGH, MEDIUM, LOW

**bin/lib/workflow-mapper.test.js** (344 lines)
- 23 unit tests covering:
  - Constructor behavior
  - State machine detection with guard/action/transition classification
  - Business logic flaw detection (TOCTOU, WORKFLOW_BYPASS, PARAMETER_TAMPERING)
  - Mermaid diagram generation
  - AST parsing for JS/TS files

### Components Modified

**bin/lib/recon-aggregator.js** (+93/-9 lines)
- Added `WorkflowMapper` import and instantiation
- Added `runWorkflowAnalysis()` method (50 file limit for AST analysis)
- Added Phase 115 activation in `runFullRecon()` gated on `tier === 'deep' || tier === 'redteam'`
- Updated `generateSummary()` with workflow metrics
- Updated `generateRisks()` with CRITICAL business logic risk findings
- Updated `generateRecommendations()` with URGENT recommendation for critical flaws
- Updated `calculateOverallRisk()` with Phase 115 scoring

## Deviations from Plan

### Auto-fixed Issues

**None** - Plan executed exactly as written.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| None | - | No new security surface introduced - this module analyzes existing code without making external connections |

## Test Results

```
▶ WorkflowMapper
  ▶ constructor ✔
  ▶ analyze ✔
  ▶ detectStateMachine ✔
  ▶ detectBusinessLogicFlaws ✔
  ▶ generateStateMachineDiagram ✔
  ▶ parseAST ✔
✔ WorkflowMapper
ℹ tests 23
ℹ pass 23
ℹ fail 0
```

## Verification

- [x] workflow-mapper.js exists with WorkflowMapper class exporting: analyze(), detectStateMachine(), detectBusinessLogicFlaws(), generateStateMachineDiagram()
- [x] WorkflowMapper constructor accepts options.cache parameter
- [x] detectStateMachine() returns { states: Array, transitions: Array }
- [x] detectBusinessLogicFlaws() returns array of flaw findings with { id, type, severity, location, description }
- [x] generateStateMachineDiagram() returns valid Mermaid stateDiagram-v2 string
- [x] Flaw types include: TOCTOU, WORKFLOW_BYPASS, PARAMETER_TAMPERING
- [x] Severity levels: CRITICAL, HIGH, MEDIUM, LOW
- [x] recon-aggregator.js imports WorkflowMapper from './workflow-mapper'
- [x] ReconAggregator has this.workflowMapper = new WorkflowMapper({ cache: this.cache })
- [x] runFullRecon() has workflowInfo block with tier === 'deep' || tier === 'redteam' check
- [x] runWorkflowAnalysis() method exists with 50 file limit
- [x] generateSummary() includes workflowsDetected, logicFlaws, criticalLogicFlaws
- [x] generateRisks() includes CRITICAL business logic risk finding
- [x] generateRecommendations() includes URGENT recommendation for critical flaws

## Commits

- `d0d7f73` feat(115-01): implement workflow-mapper.js for RECON-06
- `404e866` feat(115-01): wire WorkflowMapper into ReconAggregator at deep/redteam tiers
