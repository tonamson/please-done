# Phase 115: Advanced Reconnaissance - Discussion Log (Assumptions Mode)

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the analysis.

**Date:** 2026-04-05
**Phase:** 115-advanced-reconnaissance
**Mode:** assumptions (--auto)
**Areas analyzed:** Taint Analysis Architecture, Business Logic Mapping, Visualization Approach, Integration with ReconAggregator

## Assumptions Presented

| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Extend source-mapper.js taint tracking rather than new standalone module | Likely | `bin/lib/source-mapper.js` lines 206-236, `sourceToSinkMap` structure |
| AST-based state machine pattern detection for business logic | Unclear | AST analysis patterns from target-enumerator.js, generate-diagrams.js |
| Adjacency list graph structure (extend existing sourceToSinkMap) | Likely | `source-mapper.js` line 20 Map structure |
| Mermaid format for workflow diagrams | Confident | `bin/lib/generate-diagrams.js` existing pattern |
| ReconAggregator conditional activation (deep/redteam tiers) | Confident | `recon-aggregator.js` lines 57-66 |

## Corrections Made

No corrections — all assumptions confirmed.

## Auto-Resolved

- Business Logic Detection (Unclear): auto-selected "AST-based state machine pattern detection" — codebase has existing AST patterns to build upon; formal state machine formalism deferred to diagram complexity budget.

## External Research

- Business logic flaw patterns: Flagged for Phase 120 (Code Libraries) - specific patterns may require security research
- Sanitization detection: Flagged for Phase 120 - validator.js/DOMPurify/express-validator patterns to be researched there

---

*Discussion mode: assumptions (--auto)*
*Generated: 2026-04-05*
