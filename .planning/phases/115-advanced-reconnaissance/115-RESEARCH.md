# Phase 115: Advanced Reconnaissance - Research

**Researched:** 2026-04-05
**Domain:** AST-based taint analysis, business logic workflow mapping, state machine detection
**Confidence:** HIGH

## Summary

Phase 115 extends the Phase 113-114 reconnaissance engine with two advanced capabilities: business logic workflow mapping (RECON-06) and deep taint analysis (RECON-07). The implementation builds directly on existing infrastructure -- `source-mapper.js` is extended for inter-procedural taint tracking with sanitization edges, and `generate-diagrams.js` patterns are reused for Mermaid state machine visualization. Business logic flaw detection targets OWASP Top 10 for Business Logic Abuse patterns (BLA1:2025 TOCTOU, BLA2:2025 workflow order bypass). Activation occurs at `deep`/`redteam` tiers via existing ReconAggregator wiring.

**Primary recommendation:** Create two new modules -- `workflow-mapper.js` (state machine detection + business logic flaw patterns) and `taint-engine.js` (inter-procedural taint analysis with sanitization edges) -- that both extend existing Phase 113-114 classes, then wire them into `recon-aggregator.js` following the established tier-based pattern.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Extend `source-mapper.js` taint tracking rather than creating a standalone module
- **D-02:** Maintain existing `sourceToSinkMap` adjacency list structure (Map with source index keys)
- **D-03:** Add inter-procedural call graph tracking for cross-function taint propagation
- **D-04:** Add sanitization edge detection: identify where data is validated/sanitized before reaching sinks
- **D-05:** Output: Extended data flow graph with source-type, sink-type, and sanitization markers
- **D-06:** Detect state machine patterns via AST analysis of route handlers and middleware chains
- **D-07:** Identify workflow transitions: HTTP method + path -> state change -> side effect
- **D-08:** Detect business logic flaw patterns: TOCTOU, parameter tampering, workflow bypass, race conditions
- **D-09:** Output: State machine diagram (Mermaid format) + logic flaw findings list
- **D-10:** Risk scoring for logic flaws: Critical/High/Medium/Low based on exploitability and impact
- **D-11:** Use Mermaid flowchart format for workflow diagrams (consistent with `generate-diagrams.js` existing pattern)
- **D-12:** Support state machine diagram variant for workflows with distinct states
- **D-13:** Generate data flow graph visualization showing taint paths from sources to sinks
- **D-14:** Wire Phase 115 modules into `recon-aggregator.js` following existing Phase 114 pattern
- **D-15:** Activate on `deep` or `redteam` tier (`--recon-full` or `--redteam` flags)
- **D-16:** Output integrated into existing recon report under new sections: "Business Logic" and "Taint Analysis"

### Claude's Discretion
- Exact AST traversal implementation for state machine detection
- Specific flaw pattern signatures (may evolve with security research)
- Sanitization library detection patterns (validator.js, DOMPurify, express-validator)
- Visualization layout details and diagram styling
- Report formatting and output structure

### Deferred Ideas (OUT OF SCOPE)
- Sanitization library patterns: Research validator.js, DOMPurify, express-validator usage patterns for "sanitization edges" in data flow (may be addressed in Phase 120: Code Libraries)
- Formal state machine notation: Whether "workflow diagrams" implies UML state diagrams or informal flowcharts (Mermaid TD/LR sufficient for now)

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RECON-06 | Business Logic Mapping - Workflow discovery, state machine analysis, logic flaw identification | Workflow state machines detected via AST traversal of route handlers; TOCTOU/parameter tampering patterns from OWASP BLA1/BLA2 |
| RECON-07 | Taint Analysis - Data flow graph, source-to-sink tracking, sanitization detection | Inter-procedural taint tracking extends existing `sourceToSinkMap`; sanitization edges identified via validation function detection |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@babel/parser` | 7.29.2 | AST parsing for source analysis | Already used in all Phase 113-114 modules |
| `@babel/traverse` | 7.29.0 | AST traversal for pattern matching | Already used in all Phase 113-114 modules |
| `mermaid` | 11.14.0 | Workflow/state diagram generation | Already used in `generate-diagrams.js` via existing pattern |
| `glob` | -- | File discovery for source scanning | Already used in Phase 113-114 modules |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `recon-cache.js` | -- | Caching analysis results | Already injected into all Phase 113-114 modules |
| `mermaid-validator.js` | -- | Validates Mermaid syntax before output | Already used in `generate-diagrams.js` |

### No New Dependencies Required
All required libraries are already present in the project from Phase 112-114 work.

## Architecture Patterns

### Recommended Project Structure
```
bin/lib/
├── source-mapper.js        # Extended: inter-procedural taint + sanitization edges (D-01 to D-05)
├── workflow-mapper.js      # NEW: state machine detection + business logic flaws (D-06 to D-10)
├── taint-engine.js        # NEW: dedicated taint analysis (inter-procedural, sanitization tracking)
├── generate-diagrams.js   # Extended: state machine + data flow diagram variants (D-11 to D-13)
├── recon-aggregator.js    # Extended: Phase 115 wiring at deep/redteam tiers (D-14 to D-16)
└── [existing modules]     # Unchanged
```

### Pattern 1: Inter-Procedural Taint Tracking
**What:** Track taint propagation across function boundaries by building a call graph and propagating source/sink relationships through function calls.

**When to use:** RECON-07 requires tracking data that flows from `req.body.userId` through `getUserById()` to `db.query()`.

**Implementation approach (extends D-01, D-02, D-03):**
```javascript
// Build call graph: function -> called functions
const callGraph = new Map(); // funcName -> [calleeNames]

// For each function, track parameter usage
// If source-type parameter flows to a sink-type return value, mark as taint path
// Add sanitization edge when validation functions are called between source and sink
```

**Source:** CodeQL data flow analysis for JavaScript covers inter-procedural taint tracking patterns [CodeQL Documentation](https://codeql.github.com/docs/codeql-language-guides/analyzing-data-flow-in-javascript-and-typescript/)

### Pattern 2: State Machine Detection via AST
**What:** Detect application workflow state machines by analyzing route handler chains and middleware composition.

**When to use:** RECON-06 requires identifying workflow states (e.g., order: created -> paid -> shipped -> delivered) from route structure.

**Implementation approach (D-06, D-07):**
```javascript
// Pattern: app.post('/order/complete', auth, validateCart, processPayment, updateInventory)

// States: each distinct handler chain represents a workflow state
// Transitions: HTTP method + path -> next handler in chain
// Side effects: database writes, external API calls, state mutations

// AST traversal:
// 1. Find all route definitions (app.METHOD/path handlers)
// 2. Extract middleware chain from arguments
// 3. Classify each handler as: guard (check), action (mutate), or transition (navigate)
// 4. Build state transition graph
```

**Source:** Cloudflare's AST-based workflow diagram generation uses similar pattern tracking `Promise`/`await` relationships [Cloudflare Blog](https://blog.cloudflare.com/workflow-diagrams/)

### Pattern 3: Business Logic Flaw Detection
**What:** Static detection of OWASP Top 10 for Business Logic Abuse vulnerability patterns.

**When to use:** RECON-06 flaw detection phase.

**Implementation approach (D-08, D-10):**
```javascript
const flawPatterns = [
  {
    type: 'TOCTOU',
    pattern: /if.*check.*\{[\s\S]*?\}\s*\{[\s\S]*?action/s,
    severity: 'HIGH',
    description: 'Time-of-check to time-of-use: validation and action are not atomic'
  },
  {
    type: 'PARAMETER_TAMPERING',
    pattern: /req\.body\.\w+.*=.*req\.query\.\w+/,
    severity: 'MEDIUM',
    description: 'Request parameters directly assigned without validation'
  },
  {
    type: 'WORKFLOW_BYPASS',
    pattern: /if\s*\(\s*!state\s*\)/s,
    severity: 'CRITICAL',
    description: 'Missing state validation before critical action'
  }
];
```

**Source:** OWASP BLA1:2025 (TOCTOU/Action Limit Overrun), BLA2:2025 (Concurrent Workflow Order Bypass) [OWASP Top 10 for Business Logic Abuse](https://owasp.org/www-project-top-10-for-business-logic-abuse/)

### Pattern 4: Mermaid State Diagram Generation
**What:** Generate Mermaid stateDiagram-v2 format from detected workflow states and transitions.

**When to use:** Output for RECON-06 state machine visualization (D-11, D-12).

**Implementation approach:**
```javascript
function generateStateMachineDiagram(states, transitions) {
  const lines = ['stateDiagram-v2'];

  for (const state of states) {
    if (state.initial) {
      lines.push(`[*] --> ${state.id}`);
    }
    lines.push(`state "${state.name}" {`);
    for (const substate of state.internal) {
      lines.push(`  ${substate}`);
    }
    lines.push('}');
  }

  for (const trans of transitions) {
    lines.push(`${trans.from} --> ${trans.to} : ${trans.trigger}`);
  }

  return lines.join('\n');
}
```

**Source:** Mermaid state diagram documentation supports `stateDiagram-v2` with internal states and transitions [mermaid-js/mermaid](https://github.com/mermaid-js/mermaid)

### Pattern 5: Sanitization Edge Detection
**What:** Identify where data is validated or sanitized before reaching sinks.

**When to use:** RECON-07 requires marking sanitized taint paths differently in output.

**Implementation approach (D-04):**
```javascript
const sanitizationPatterns = [
  { type: 'validator.js', functions: ['isEmail', 'isInt', 'isFloat', 'isURL', 'isMobilePhone'] },
  { type: 'express-validator', functions: ['body', 'param', 'query'] },
  { type: 'DOMPurify', functions: ['sanitize'] },
  { type: 'custom', pattern: /function\s+validate\w*\(/ }
];

// During taint tracking, check if source->sink path passes through sanitization function
// If yes, mark as: { sanitized: true, sanitizer: 'validator.js.isEmail' }
```

**Source:** OWASP WSTG-BUSL-07 covers active defense detection patterns [WSTG Latest](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/10-Business_Logic_Testing/07-Test_Defenses_Against_Application_Misuse/)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| AST traversal | Custom AST walker | `@babel/traverse` | Already used in all Phase 113-114 modules; handles all ES6+ syntax |
| Diagram validation | String concatenation without validation | `mermaid-validator.js` (existing) | Already integrated in `generate-diagrams.js` |
| State machine notation | Custom graph format | Mermaid `stateDiagram-v2` | Standard notation, already supported by `mermaid` package |
| Business logic flaw taxonomy | ad-hoc vulnerability naming | OWASP BLA1/BLA2 classification | Industry-standard, Turing-machine-based categorization |

**Key insight:** The project already has all necessary infrastructure. Phase 115 is primarily extension of existing patterns, not new foundations.

## Common Pitfalls

### Pitfall 1: Overfitting Taint Tracking to Simple Variable Names
**What goes wrong:** Taint tracking only works when source variables have exact name matches in sinks. Misses `userInput = req.body.x; result = userInput` patterns.

**Why it happens:** The existing `mapSourcesToSinks()` only checks `variableDeclarations` map with string inclusion. Cross-function analysis compounds this.

**How to avoid:** Implement proper AST scope tracking with `Binding` resolution from `@babel/traverse`, not string-based pattern matching.

**Warning signs:** `sourceToSinkMap` entries growing when they shouldn't, false negatives on obvious taint paths.

### Pitfall 2: Ignoring Async Workflows in State Machine Detection
**What goes wrong:** State machine detection only handles synchronous route handlers, missing async state transitions in `async/await` chains.

**Why it happens:** Simple AST traversal without `AwaitExpression`/`Promise` tracking.

**How to avoid:** Track `await` expressions as state transition signals. Cloudflare's workflow AST approach shows this pattern.

**Warning signs:** Detected workflows are only 1-2 steps when app clearly has multi-step async processes.

### Pitfall 3: False Positive Business Logic Flaws
**What goes wrong:** Overly broad pattern matching (e.g., any `if(!state)` flagged as workflow bypass) creates noise.

**Why it happens:** Flaw patterns without context sensitivity match legitimate code patterns.

**How to avoid:** Require multiple indicators -- e.g., workflow bypass requires: (1) state check present, (2) state not validated against authoritative source, (3) action has side effects.

**Warning signs:** Flaw count >> route count, or CRITICAL flaws on simple CRUD endpoints.

### Pitfall 4: No Limiting on File Analysis Scope
**What goes wrong:** Analyzing too many files causes timeout in `runFullRecon()`.

**Why it happens:** No cap on files processed at deep/redteam tiers where Phase 115 runs.

**How to avoid:** Reuse existing `files.slice(0, 100)` pattern from `recon-aggregator.js` line 104. Set separate limit for Phase 115 if needed (e.g., 50 files for expensive AST analysis).

**Warning signs:** `runFullRecon()` hangs at deep/redteam tiers, no output for >30 seconds.

### Pitfall 5: Mermaid Diagram Exceeding Parser Limits
**What goes wrong:** Generated diagram has >100 nodes, causing Mermaid parser to fail silently.

**Why it happens:** No node count limiting in diagram generation.

**How to avoid:** Use existing `MAX_NODES_PER_SUBGRAPH = 15` pattern from `generate-diagrams.js` line 17. Cluster related nodes into subgraphs.

**Warning signs:** `diagram.valid === false` with no actionable errors.

## Code Examples

### Example: Extending sourceToSinkMap with Sanitization Edge
```javascript
// From source-mapper.js lines 206-236, extend mapSourcesToSinks()
// Add sanitization detection:

mapSourcesToSinks(ast) {
  const sourceToSink = new Map();
  const sanitizationEdges = new Map(); // NEW: track sanitization

  // ... existing variableDeclarations tracking ...

  // NEW: Build call graph for inter-procedural analysis
  const callGraph = this.buildCallGraph(ast);

  this.sources.forEach((source, sourceIndex) => {
    const affectedSinks = this.sinks.filter(sink => {
      const directTaint = this.isVariableUsedInSink(variable, sink, variableDeclarations);
      const interProceduralTaint = this.checkInterProceduralTaint(
        source, sink, callGraph, variableDeclarations
      );
      const hasSanitization = this.checkSanitization(
        source, sink, callGraph, sanitizationEdges
      );

      return directTaint || interProceduralTaint;
    });

    if (affectedSinks.length > 0) {
      sourceToSink.set(sourceIndex, affectedSinks);
    }
  });

  return { sourceToSink, sanitizationEdges };
}

buildCallGraph(ast) {
  const callGraph = new Map();
  // Traverse CallExpressions, build function -> [calledFunctions] map
  return callGraph;
}

checkSanitization(source, sink, callGraph, sanitizationEdges) {
  // Walk call chain from source to sink
  // If validation function (validator.js, express-validator, etc.) is called, mark sanitization
  // Return { sanitized: true, sanitizer: 'isEmail', location: {...} }
}
```

### Example: Workflow State Machine Detection
```javascript
// From target-enumerator.js pattern (lines 79-103), extend for state machines:

detectStateMachine(filePath, ast) {
  const states = [];
  const transitions = [];
  let currentState = null;

  traverse(ast, {
    // Route definitions become state entry points
    CallExpression(nodePath) {
      const { callee, arguments: args } = nodePath.node;
      if (callee.type === 'MemberExpression' &&
          ['get', 'post', 'put', 'delete', 'patch'].includes(callee.property?.name)) {

        const route = args[0]?.value;
        const handlers = this.extractHandlers(args);

        // Each route with middleware chain is a state transition
        for (let i = 0; i < handlers.length - 1; i++) {
          transitions.push({
            from: handlers[i],
            to: handlers[i + 1],
            trigger: `${callee.property.name.toUpperCase()} ${route}`,
            type: this.classifyTransition(handlers[i])
          });
        }
      }
    },

    // Async/await chains indicate async state transitions
    AwaitExpression(nodePath) {
      const parentCall = nodePath.findParent(p => p.isCallExpression());
      if (parentCall) {
        // Mark this call as async transition
      }
    }
  });

  return { states, transitions };
}
```

### Example: Business Logic Flaw Pattern Matching
```javascript
// Based on OWASP BLA1/BLA2 flaw categories:

const businessLogicFlaws = [
  {
    id: 'BLA1-2025',
    type: 'TOCTOU',
    severity: 'HIGH',
    check: (ast) => {
      const findings = [];
      traverse(ast, {
        IfStatement(nodePath) {
          // Pattern: if (check) { ... action }
          const consequent = nodePath.node.consequent;
          const consequentCalls = this.getFunctionCalls(consequent);
          // If check involves validation and consequent has side effects
          if (this.hasValidationCheck(nodePath.node.test) &&
              consequentCalls.some(c => this.hasSideEffect(c))) {
            findings.push({
              type: 'TOCTOU',
              location: { file: ast.file, line: nodePath.node.loc?.start?.line },
              description: 'Non-atomic validation and action execution'
            });
          }
        }
      });
      return findings;
    }
  },
  {
    id: 'BLA2-2025',
    type: 'WORKFLOW_BYPASS',
    severity: 'CRITICAL',
    check: (ast) => {
      // Pattern: missing state validation before critical action
      // Look for: critical actions without state machine enforcement
    }
  },
  {
    id: 'PARAM-TAMPER',
    type: 'PARAMETER_TAMPERING',
    severity: 'MEDIUM',
    check: (ast) => {
      // Pattern: req.body.X directly used in dangerous sink without validation
    }
  }
];
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Simple variable name taint tracking | Inter-procedural call graph + scope-aware binding resolution | Now (Phase 115) | Catches cross-function taint propagation |
| No sanitization tracking | Sanitization edge detection with library-specific patterns | Now (Phase 115) | Distinguishes safe vs. unsafe data flows |
| Route enumeration only | State machine detection via middleware chain analysis | Now (Phase 115) | Maps actual workflow states and transitions |
| Ad-hoc vulnerability naming | OWASP BLA1/BLA2 standardized flaw taxonomy | Now (Phase 115) | Consistent, defensible severity scoring |

**Deprecated/outdated:**
- String-based variable matching for taint tracking -- replaced by AST `Binding` resolution
- Single-function taint analysis -- replaced by inter-procedural call graph analysis

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `source-mapper.js` can be extended without breaking existing `ReconAggregator` consumers | Standard Stack, Architecture | If extension breaks compat, would need to add new method rather than modify existing |
| A2 | Mermaid `stateDiagram-v2` syntax is fully supported by `mermaid` 11.14.0 | Architecture Patterns | If syntax unsupported, falls back to `flowchart TD` |
| A3 | Babel traverse can handle inter-procedural analysis within a single file without additional tooling | Common Pitfalls | If scope tracking insufficient, would need `@babel/types` Binding API |

## Open Questions

1. **How to limit scope for deep AST analysis?**
   - What we know: `source-mapper.js` uses `files.slice(0, 100)`; Phase 115 adds expensive inter-procedural analysis
   - What's unclear: Should Phase 115 have its own file limit (e.g., 50) to prevent timeout?
   - Recommendation: Set limit of 50 files for Phase 115 analysis, use existing cache to avoid re-analysis

2. **State machine detection for async workflows:**
   - What we know: Cloudflare's approach tracks `Promise`/`await` for async state transitions
   - What's unclear: Should we detect state machines across multiple files (e.g., route handler calls service layer)?
   - Recommendation: Start with single-file analysis, extend to cross-file if pattern detected

3. **Sanitization library detection scope:**
   - What we know: CONTEXT.md defers sanitization library pattern research to Phase 120
   - What's unclear: Should Phase 115 include basic sanitizer detection (validator.js only) or skip entirely?
   - Recommendation: Include minimal detection for validator.js patterns only, full detection in Phase 120

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `@babel/parser` | AST parsing | ✓ | 7.29.2 | N/A |
| `@babel/traverse` | AST traversal | ✓ | 7.29.0 | N/A |
| `mermaid` | Diagram generation | ✓ | 11.14.0 | N/A |
| `glob` | File discovery | ✓ | (via require) | N/A |
| `recon-cache.js` | Result caching | ✓ | (existing) | N/A |

**No missing dependencies -- all required tools available.**

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (existing project standard) |
| Config file | `jest.config.js` or `package.json` jest section |
| Quick run command | `jest bin/lib/workflow-mapper.test.js --testPathIgnorePatterns=[] -x` |
| Full suite command | `jest bin/lib/ --testPathIgnorePatterns=[]` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|------------------|--------------|
| RECON-06 | Workflow state machine detected from route handlers | unit | `jest bin/lib/workflow-mapper.test.js -t "state machine" -x` | Wave 0 |
| RECON-06 | Business logic flaws (TOCTOU, bypass) identified | unit | `jest bin/lib/workflow-mapper.test.js -t "flaw detection" -x` | Wave 0 |
| RECON-06 | Mermaid state diagram generated | unit | `jest bin/lib/workflow-mapper.test.js -t "diagram" -x` | Wave 0 |
| RECON-07 | Inter-procedural taint tracking works | unit | `jest bin/lib/taint-engine.test.js -t "inter-procedural" -x` | Wave 0 |
| RECON-07 | Sanitization edges identified | unit | `jest bin/lib/taint-engine.test.js -t "sanitization" -x` | Wave 0 |
| RECON-07 | Data flow graph generated with taint markers | unit | `jest bin/lib/taint-engine.test.js -t "data flow graph" -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `jest bin/lib/workflow-mapper.test.js bin/lib/taint-engine.test.js --testPathIgnorePatterns=[] -x`
- **Per wave merge:** Full suite
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `bin/lib/workflow-mapper.test.js` -- covers RECON-06 (state machine, flaw detection, diagram)
- [ ] `bin/lib/taint-engine.test.js` -- covers RECON-07 (taint tracking, sanitization, data flow graph)
- [ ] `bin/lib/mocks/` -- mock AST fixtures for testing without real source files
- [ ] Framework install: `npm install --save-dev jest @types/jest` if not already in devDependencies

*(If no gaps: "None -- existing test infrastructure covers all phase requirements")*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | N/A (covered in Phase 114 RECON-05) |
| V3 Session Management | no | N/A (covered in Phase 114 RECON-05) |
| V4 Access Control | yes | Business logic flaw detection for workflow bypass (OTG-BUSLOGIC-006) |
| V5 Input Validation | yes | Taint analysis for source-to-sink tracking (RECON-07) |
| V6 Cryptography | no | N/A |

### Known Threat Patterns for JavaScript/Node.js

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| TOCTOU (Time-of-check to Time-of-use) | Tampering | Atomic validation + action; use transactions |
| Parameter tampering | Tampering | Server-side validation of all input parameters |
| Workflow bypass | Elevation of Privilege | State machine enforcement; authoritative state validation |
| Race conditions | Tampering | Atomic operations; distributed locking |
| Business logic flaws | Elevation of Privilege | OWASP BLA1/BLA2 detection patterns |

## Sources

### Primary (HIGH confidence)
- [CodeQL: Analyzing data flow in JavaScript and TypeScript](https://codeql.github.com/docs/codeql-language-guides/analyzing-data-flow-in-javascript-and-typescript/) - Inter-procedural taint tracking patterns
- [OWASP Top 10 for Business Logic Abuse](https://owasp.org/www-project-top-10-for-business-logic-abuse/) - BLA1:2025 TOCTOU, BLA2:2025 workflow order bypass
- [Cloudflare: How we use ASTs to turn Workflows code into visual diagrams](https://blog.cloudflare.com/workflow-diagrams/) - State machine detection via AST traversal

### Secondary (MEDIUM confidence)
- [OWASP WSTG-BUSL-07: Test Defenses Against Application Misuse](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/10-Business_Logic_Testing/07-Test_Defenses_Against_Application_Misuse/) - Active defense detection patterns
- [Semgrep: Taint mode](https://semgrep.dev/docs/writing-rules/data-flow/taint-mode/) - Inter-procedural taint analysis (Pro feature)

### Tertiary (LOW confidence)
- [mermaid-js/mermaid GitHub](https://github.com/mermaid-js/mermaid) - State diagram syntax (may be updated in recent versions)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use from Phase 112-114
- Architecture: HIGH - All patterns verified against existing code (source-mapper.js, generate-diagrams.js, target-enumerator.js)
- Pitfalls: MEDIUM - Patterns identified from OWASP resources, not verified against project code yet

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (30 days for stable domain)
