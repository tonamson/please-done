# Phase 115: Advanced Reconnaissance - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning
**Mode:** Auto (assumptions mode)

<domain>
## Phase Boundary

Extend Phase 113-114 reconnaissance capabilities with business logic workflow mapping (RECON-06) and deep taint analysis (RECON-07). Deliverables: workflow/state machine diagrams, business logic flaw detection, data flow graph with source-to-sink taint paths. Depends on Phase 114's hidden asset and auth analysis.

Phase 115 delivers the advanced reconnaissance engine for business logic understanding.

</domain>

<decisions>
## Implementation Decisions

### Taint Analysis Architecture
- **D-01:** Extend `source-mapper.js` taint tracking rather than creating a standalone module
- **D-02:** Maintain existing `sourceToSinkMap` adjacency list structure (Map with source index keys → array of sinks)
- **D-03:** Add inter-procedural call graph tracking for cross-function taint propagation
- **D-04:** Add sanitization edge detection: identify where data is validated/sanitized before reaching sinks
- **D-05:** Output: Extended data flow graph with source-type, sink-type, and sanitization markers

### Business Logic Mapping
- **D-06:** Detect state machine patterns via AST analysis of route handlers and middleware chains
- **D-07:** Identify workflow transitions: HTTP method + path → state change → side effect
- **D-08:** Detect business logic flaw patterns: TOCTOU, parameter tampering, workflow bypass, race conditions
- **D-09:** Output: State machine diagram (Mermaid format) + logic flaw findings list
- **D-10:** Risk scoring for logic flaws: Critical/High/Medium/Low based on exploitability and impact

### Visualization Approach
- **D-11:** Use Mermaid flowchart format for workflow diagrams (consistent with `generate-diagrams.js` existing pattern)
- **D-12:** Support state machine diagram variant for workflows with distinct states
- **D-13:** Generate data flow graph visualization showing taint paths from sources to sinks

### Integration with ReconAggregator
- **D-14:** Wire Phase 115 modules into `recon-aggregator.js` following existing Phase 114 pattern
- **D-15:** Activate on `deep` or `redteam` tier (`--recon-full` or `--redteam` flags)
- **D-16:** Output integrated into existing recon report under new sections: "Business Logic" and "Taint Analysis"

### Claude's Discretion
- Exact AST traversal implementation for state machine detection
- Specific flaw pattern signatures (may evolve with security research)
- Sanitization library detection patterns (validator.js, DOMPurify, express-validator)
- Visualization layout details and diagram styling
- Report formatting and output structure

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Reconnaissance Standards
- `.planning/REQUIREMENTS.md` §RECON-06, RECON-07 - Phase 115 requirements
- Phase 112 artifacts: `bin/lib/flag-parser.js`, `bin/lib/recon-cache.js` - PTES foundation
- Phase 113 artifacts: `bin/lib/source-mapper.js`, `bin/lib/target-enumerator.js`, `bin/lib/recon-aggregator.js`
- Phase 114 artifacts: `bin/lib/asset-discoverer.js`, `bin/lib/auth-analyzer.js`

### Security References
- OWASP Testing Guide v4.2: Business Logic Testing (OTG-BUSLOGIC)
- PTES v2.0: Intelligence Gathering phase
- MITRE ATT&CK T1556 (Modify Authentication Process)
- MITRE ATT&CK T1078 (Valid Accounts)
- OWASP Top 10: A04 (Insecure Design)

### Code Integration Points
- `bin/lib/source-mapper.js` lines 206-236 - existing `mapSourcesToSinks()` and `sourceToSinkMap` structure
- `bin/lib/recon-aggregator.js` lines 28-66 - `runFullRecon()` with tier-based conditional activation
- `bin/lib/generate-diagrams.js` - existing Mermaid flowchart generation pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **SourceMapper** (`bin/lib/source-mapper.js`): Already has taint tracking with `sourceToSinkMap` - extend for inter-procedural analysis
- **TargetEnumerator** (`bin/lib/target-enumerator.js`): Route discovery patterns - extend for state transition detection
- **ReconAggregator** (`bin/lib/recon-aggregator.js`): Orchestrator pattern - add Phase 115 modules as conditional phases
- **generate-diagrams.js**: Mermaid flowchart generation - extend for state machine and data flow diagrams
- **AuthAnalyzer** (`bin/lib/auth-analyzer.js`): Workflow pattern analysis - extend for business logic flaw detection

### Established Patterns
- **AST-based traversal**: Consistent across all Phase 113-114 analyzers - use for state machine pattern detection
- **Adjacency list graph**: `sourceToSinkMap` Map structure - extend for richer graph operations
- **Risk scoring**: Critical/High/Medium/Low from Phase 114 - apply to business logic flaws
- **Tier-based activation**: `deep`/`redteam` conditional in `runFullRecon()` - extend pattern

### Integration Points
- **ReconAggregator.runFullRecon()**: Add Phase 115 modules as lines 67+ (after Phase 114 modules)
- **generateRisks()**: Extend with business logic risk categories
- **generateRecommendations()**: Extend with logic-specific guidance
- **pd:audit --recon-full**: Wire via flag-parser.js deep tier detection
- **pd:audit --redteam**: Wire via flag-parser.js redteam tier detection

</code_context>

<specifics>
## Specific Ideas

- Taint analysis should track both explicit flows (variable assignments) and implicit flows (conditionals, exceptions)
- Business logic flaw detection should look for: workflow state not validated, action ordering violations, missing authorization checks in logic chains
- State machine detection should identify: initial state, transition events, guard conditions, final states
- Consider detection of "workflow bypass" patterns where normal flow can be circumvented
- Sanitization detection should identify: validator.js, express-validator, DOMPurify, custom sanitization functions

</specifics>

<deferred>
## Deferred Ideas

### External Research (flagged for later)
- **Sanitization library patterns**: Research validator.js, DOMPurify, express-validator usage patterns for "sanitization edges" in data flow (may be addressed in Phase 120: Code Libraries)
- **Formal state machine notation**: Whether "workflow diagrams" implies UML state diagrams or informal flowcharts (Mermaid TD/LR sufficient for now)

None — all phase requirements addressed within scope.

</deferred>

---

*Phase: 115-advanced-reconnaissance*
*Context gathered: 2026-04-05*
*Depends on: Phase 112 (PTES Foundation), Phase 114 (Intelligence Gathering Extended)*
