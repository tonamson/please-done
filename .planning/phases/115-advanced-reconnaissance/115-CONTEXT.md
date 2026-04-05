# Phase 115: Advanced Reconnaissance - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Map business logic workflows and perform taint analysis for comprehensive security assessment. Focus on understanding application state machines, identifying business logic flaws, and tracking data flow from untrusted sources to sensitive sinks.

Phase 115 delivers advanced reconnaissance capabilities for deep security analysis (RECON-06, RECON-07). Builds on Phase 114's hidden asset and auth analysis, using the same AST-based analysis foundation.
</domain>

<decisions>
## Implementation Decisions

### Business Logic Mapping (RECON-06)
- **D-01:** Detect state machines by analyzing: state variables, switch statements on state enums, Redux/Vuex/Pinia stores, React useState patterns
- **D-02:** Map workflow sequences by tracing: API call chains, database transaction flows, async/await patterns, event-driven architectures
- **D-03:** Identify business logic flaws: missing authorization checks, race condition patterns, workflow bypass opportunities, state validation gaps
- **D-04:** Output format: Mermaid state diagrams + JSON workflow descriptions with risk annotations
- **D-05:** Focus on authentication flows, checkout/payment flows, admin operations, data export/import workflows

### Taint Analysis (RECON-07)
- **D-06:** Track data flow: sources (user input) → transformations → sinks (dangerous operations)
- **D-07:** Source categories: URL parameters, HTTP body, headers, cookies, file uploads, WebSocket messages, GraphQL inputs
- **D-08:** Sink categories: SQL queries, shell commands, eval/Function, file system operations, HTTP responses, DOM manipulation
- **D-09:** Track sanitization: identify validation functions, encoding patterns, ORM parameterized queries
- **D-10:** Analysis depth: multi-hop tracking (through function calls, assignments, object properties) with 5-level depth limit
- **D-11:** Output format: Data flow graph (DOT format) + taint report with path visualization

### Integration Points
- **D-12:** Extend ReconAggregator from Phase 114 with business logic and taint analysis modules
- **D-13:** Run in `redteam` tier only (highest level reconnaissance)
- **D-14:** Consume Phase 113 source-mapper.js sources as taint analysis starting points
- **D-15:** Use Phase 113 target-enumerator.js routes to identify workflow entry points
- **D-16:** Cache taint results using recon-cache.js for performance

### Risk Scoring
- **D-17:** Critical: Unsanitized user input → SQL/command execution sinks
- **D-18:** Critical: Business workflow bypass (skip payment, escalate privilege)
- **D-19:** High: Multi-hop taint to response sinks, Missing auth in state transitions
- **D-20:** Medium: Single-hop taint with partial sanitization, Workflow timing issues
- **D-21:** Low: Taint to logging sinks, State machine complexity warnings

### Claude's Discretion
- Exact AST traversal algorithms for state detection
- Taint propagation heuristics (property tracking, array element tracking)
- DOT graph layout options and styling
- False positive filtering for business logic patterns
</decisions>

<canonical_refs>
## Canonical References

### Reconnaissance Standards
- `.planning/REQUIREMENTS.md` §RECON-06, RECON-07 - Advanced reconnaissance requirements
- Phase 113 artifacts: `bin/lib/source-mapper.js` - Source/sink foundation
- Phase 114 artifacts: `bin/lib/asset-discoverer.js`, `bin/lib/auth-analyzer.js` - Extend pattern
- OWASP Testing Guide: Business Logic Testing (OTG-BUSLOGIC)
- PTES v2.0: Vulnerability Analysis phase

### Security References
- OWASP Top 10: A01 (Broken Access Control) - business logic auth gaps
- OWASP Top 10: A03 (Injection) - taint to injection sinks
- MITRE ATT&CK T1190 (Exploit Public-Facing Application)
- MITRE ATT&CK T1071 (Application Layer Protocol)

### Code Integration Points
- `bin/lib/source-mapper.js` lines 42-43 - sourceToSinkMap foundation
- `bin/lib/recon-aggregator.js` lines 57-66 - Phase 114 integration pattern
- `bin/lib/recon-aggregator.js` lines 68-78 - results aggregation pattern
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **SourceMapper** (`bin/lib/source-mapper.js`): Already identifies sources and sinks - extend for taint tracking
- **TargetEnumerator** (`bin/lib/target-enumerator.js`): Route discovery - use as workflow entry points
- **ReconAggregator** (`bin/lib/recon-aggregator.js`): Lines 57-66 show Phase 114 integration pattern
- **AST Parsing**: `@babel/parser` and `@babel/traverse` already used - continue same pattern
- **ReconCache** (`bin/lib/recon-cache.js`): Use for taint analysis memoization

### Established Patterns
- **AST-based analysis**: Pattern from source-mapper.js - traverse AST for pattern detection
- **Multi-phase recon**: Pattern from recon-aggregator.js lines 57-66 - conditional execution by tier
- **Risk scoring**: Pattern from recon-aggregator.js - generateRisks() with category-based scoring
- **Results aggregation**: Pattern from recon-aggregator.js lines 68-78 - compile multi-source results

### Integration Points
- **ReconAggregator.runFullRecon()**: Add Phase 115 after Phase 114 (lines 57-66) for redteam tier
- **Taint Engine**: Extend source-mapper.js sourceToSinkMap with multi-hop tracking
- **Business Logic Detector**: New module following asset-discoverer.js pattern
- **Report Generation**: Extend generateRisks() and generateRecommendations() in recon-aggregator.js
</code_context>

<specifics>
## Specific Ideas

- State machine detection should recognize common patterns: Redux reducers, XState machines, React useState with status enums
- Business logic analysis should flag: operations that change user roles, bypass payment checks, skip verification steps
- Taint analysis should handle: object property tainting (req.body.user.name), array element tainting, inter-procedural flows
- Generate DOT format graphs that can be visualized with Graphviz or converted to Mermaid
- Track taint through: destructuring, spread operators, function parameters, return values
- Identify workflow gaps: routes accessible out of sequence, state transitions without validation
- Support both positive taint (mark everything as tainted) and negative taint (mark only confirmed safe) modes
</specifics>

<deferred>
## Deferred Ideas

- Dynamic/runtime taint analysis (currently static only) — future enhancement
- Symbolic execution for complex condition tracking — Phase 123
- Machine learning for business logic pattern recognition — backlog
- Interactive taint path exploration UI — Phase 123
- Real-time taint analysis during request handling — future milestone
</deferred>

---

*Phase: 115-advanced-reconnaissance*
*Context gathered: 2026-04-05*
*Depends on: Phase 113 (Core), Phase 114 (Extended)*
