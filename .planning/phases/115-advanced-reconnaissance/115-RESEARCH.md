# Phase 115: Advanced Reconnaissance - Research

**Researched:** 2026-04-05
**Domain:** Static Analysis, Business Logic Mapping, Taint Analysis, AST Traversal
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions (Decisions)
**Business Logic Mapping (RECON-06):**
- D-01: Detect state machines by analyzing state variables, switch statements on state enums, Redux/Vuex/Pinia stores, React useState patterns
- D-02: Map workflow sequences by tracing API call chains, database transaction flows, async/await patterns, event-driven architectures
- D-03: Identify business logic flaws: missing authorization checks, race condition patterns, workflow bypass opportunities, state validation gaps
- D-04: Output format: Mermaid state diagrams + JSON workflow descriptions with risk annotations
- D-05: Focus on authentication flows, checkout/payment flows, admin operations, data export/import workflows

**Taint Analysis (RECON-07):**
- D-06: Track data flow: sources (user input) → transformations → sinks (dangerous operations)
- D-07: Source categories: URL parameters, HTTP body, headers, cookies, file uploads, WebSocket messages, GraphQL inputs
- D-08: Sink categories: SQL queries, shell commands, eval/Function, file system operations, HTTP responses, DOM manipulation
- D-09: Track sanitization: identify validation functions, encoding patterns, ORM parameterized queries
- D-10: Analysis depth: multi-hop tracking (through function calls, assignments, object properties) with 5-level depth limit
- D-11: Output format: Data flow graph (DOT format) + taint report with path visualization

**Integration Points:**
- D-12: Extend ReconAggregator from Phase 114 with business logic and taint analysis modules
- D-13: Run in `redteam` tier only (highest level reconnaissance)
- D-14: Consume Phase 113 source-mapper.js sources as taint analysis starting points
- D-15: Use Phase 113 target-enumerator.js routes to identify workflow entry points
- D-16: Cache taint results using recon-cache.js for performance

**Risk Scoring:**
- D-17: Critical: Unsanitized user input → SQL/command execution sinks
- D-18: Critical: Business workflow bypass (skip payment, escalate privilege)
- D D-19: High: Multi-hop taint to response sinks, Missing auth in state transitions
- D-20: Medium: Single-hop taint with partial sanitization, Workflow timing issues
- D-21: Low: Taint to logging sinks, State machine complexity warnings

### Claude's Discretion
- Exact AST traversal algorithms for state detection
- Taint propagation heuristics (property tracking, array element tracking)
- DOT graph layout options and styling
- False positive filtering for business logic patterns

### Deferred Ideas (OUT OF SCOPE)
- Dynamic/runtime taint analysis (currently static only)
- Symbolic execution for complex condition tracking (Phase 123)
- Machine learning for business logic pattern recognition (backlog)
- Interactive taint path exploration UI (Phase 123)
- Real-time taint analysis during request handling (future milestone)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RECON-06 | Business Logic Mapping - Workflow discovery, state machine analysis, logic flaw identification | State detection patterns, Workflow graph generation, Risk annotation framework |
| RECON-07 | Taint Analysis - Data flow graph, source-to-sink tracking, sanitization detection | Multi-hop taint engine, DOT graph output, Sanitization pattern recognition |
</phase_requirements>

---

## Summary

Phase 115 implements advanced static analysis capabilities for security reconnaissance, focusing on two critical areas: **Business Logic Mapping** and **Taint Analysis**. This phase builds upon the AST-based analysis foundation established in Phases 113-114, extending the recon-aggregator architecture with deep code analysis capabilities.

**Business Logic Mapping** requires detecting state machines from various patterns (React useState, Redux reducers, XState, Vuex) and tracing workflow sequences through API chains and async flows. The output must be actionable security intelligence in Mermaid diagram format with risk annotations.

**Taint Analysis** requires implementing a multi-hop data flow tracker that can follow tainted data through function calls, property accesses, and transformations. The key challenge is balancing analysis depth (5 levels per D-10) with performance on large codebases, while accurately identifying sanitization points.

**Primary recommendation:** Implement a unified analysis engine that traverses AST once to collect both business logic and taint information, using a shared scope-tracking system. Leverage the existing ReconCache for memoization and integrate seamlessly with ReconAggregator's redteam tier.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @babel/parser | ^7.29.2 | AST generation | Already in use (Phase 113), supports TypeScript, JSX, modern JS [VERIFIED: package.json] |
| @babel/traverse | ^7.29.0 | AST traversal | Established pattern in source-mapper.js, auth-analyzer.js [VERIFIED: codebase grep] |
| @babel/types | ^7.29.0 | AST node validation | Type-safe node checking, used with traverse [ASSUMED] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| glob | ^13.0.6 | File discovery | Already used in target-enumerator.js [VERIFIED: package.json] |
| fs/promises | Node native | File I/O | Standard for async file operations [VERIFIED: existing code] |

### DOT Graph Generation (No External Dependencies)
Generate DOT format as plain strings - no library needed. DOT is a simple text format:
```
digraph G {
  node [shape=box];
  source -> transform -> sink;
}
```

**Rationale:** DOT format is human-readable text that can be converted to images by Graphviz or rendered in Mermaid. Adding a dependency like `graphlib` or `vis-network` is unnecessary for static generation.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @babel/* | TypeScript compiler API | Babel is already integrated; TS API adds complexity |
| String-based DOT | graphlib | graphlib adds 50KB+ for features we don't need (layout algorithms) |
| Custom taint engine | Existing tool (CodeQL, Semgrep) | CodeQL requires external binary; Semgrep is separate tool; we need embedded analysis |

---

## Architecture Patterns

### Recommended Module Structure
```
bin/lib/
├── business-logic-mapper.js    # State machine detection, workflow analysis
├── taint-engine.js             # Multi-hop taint tracking
├── data-flow-graph.js          # DOT graph generation, path visualization
├── workflow-analyzer.js        # Workflow sequence extraction
└── sanitization-detector.js    # Validation/sanitization pattern detection
```

### Pattern 1: Unified AST Traversal
**What:** Single traversal pass that collects both business logic and taint data
**When to use:** When analyzing files for Phase 115 to minimize parse overhead
**Why:** Babel parsing is expensive; one traversal is more efficient than multiple passes

**Example:**
```javascript
// Source: Phase 113 source-mapper.js pattern
analyze(ast, filePath) {
  const state = {
    businessLogic: { states: [], workflows: [] },
    taint: { sources: [], sinks: [], flows: [] }
  };

  traverse(ast, {
    // Collect both pattern types in single pass
    VariableDeclarator: (path) => {
      this.detectStateMachine(path, state.businessLogic);
      this.trackTaintSource(path, state.taint);
    },
    CallExpression: (path) => {
      this.detectWorkflowStep(path, state.businessLogic);
      this.trackTaintSink(path, state.taint);
    }
  });

  return state;
}
```

### Pattern 2: Scope-Aware Taint Tracking
**What:** Track variable scope to handle shadowing and closures correctly
**When to use:** Multi-hop taint analysis across function boundaries
**Why:** Variable names alone are insufficient - need scope chain for accuracy

**Example:**
```javascript
// Track scope chain for inter-procedural taint
class TaintEngine {
  constructor() {
    this.scopeChain = new Map(); // scopeId -> variables
    this.taintedVariables = new Map(); // variableId -> taintInfo
  }

  enterScope(path) {
    const scopeId = this.getScopeId(path);
    this.scopeChain.set(scopeId, new Set());
    this.currentScope = scopeId;
  }

  markTainted(variableName, source, scopeId = this.currentScope) {
    const variableId = `${scopeId}:${variableName}`;
    this.taintedVariables.set(variableId, {
      source,
      scopeId,
      hops: 0,
      path: [source]
    });
  }

  isTainted(variableName, scopeId = this.currentScope) {
    // Check current scope and parent scopes
    let current = scopeId;
    while (current) {
      const id = `${current}:${variableName}`;
      if (this.taintedVariables.has(id)) {
        return this.taintedVariables.get(id);
      }
      current = this.getParentScope(current);
    }
    return null;
  }
}
```

### Pattern 3: Workflow Graph Construction
**What:** Build directed graphs of business workflows from API call chains
**When to use:** Mapping checkout flows, admin operations, auth sequences
**Why:** Graph structure reveals bypass opportunities and missing validation steps

**Example:**
```javascript
// Build workflow graph from async chains
class WorkflowAnalyzer {
  constructor() {
    this.graph = {
      nodes: new Map(), // nodeId -> { type, location, metadata }
      edges: []          // { from, to, type, condition }
    };
  }

  addWorkflowStep(path, stepType) {
    const nodeId = this.getNodeId(path);
    this.graph.nodes.set(nodeId, {
      type: stepType,  // 'api-call', 'auth-check', 'validation', 'db-operation'
      file: path.node.loc?.start,
      async: this.isAsyncContext(path)
    });
    return nodeId;
  }

  addEdge(fromId, toId, edgeType) {
    this.graph.edges.push({
      from: fromId,
      to: toId,
      type: edgeType,  // 'sequence', 'conditional', 'error-handler'
      condition: this.extractCondition(fromId, toId)
    });
  }

  // Detect missing auth between sensitive steps
  findAuthGaps() {
    return this.graph.edges.filter(edge => {
      const fromNode = this.graph.nodes.get(edge.from);
      const toNode = this.graph.nodes.get(edge.to);
      return fromNode.type === 'api-call' &&
             toNode.type === 'db-operation' &&
             !this.hasAuthCheck(edge.from, edge.to);
    });
  }
}
```

### Pattern 4: State Machine Detection Heuristics
**What:** Pattern matching for common state machine implementations
**When to use:** Identifying React useState patterns, Redux reducers, XState machines

**Detection Patterns:**

| Pattern | AST Signature | Framework |
|---------|---------------|-----------|
| React useState | `useState(initial)` call + variable assignment | React |
| Redux reducer | Function with switch on `action.type` | Redux |
| XState machine | `createMachine()` or `Machine()` call | XState |
| Vuex store | Object with `state`, `mutations`, `actions` | Vue/Vuex |
| Pinia store | `defineStore()` call with state function | Pinia |
| Manual enum | Variable named `*State` or `*Status` with object/array literal | Generic |

**Example detection:**
```javascript
detectStateMachine(path) {
  // React useState pattern
  if (path.node.callee?.name === 'useState') {
    const parent = path.parent;
    if (parent.type === 'VariableDeclarator') {
      return {
        type: 'react-useState',
        stateVariable: parent.id.elements?.[0]?.name,
        setterFunction: parent.id.elements?.[1]?.name,
        location: path.node.loc
      };
    }
  }

  // Redux reducer pattern
  if (path.isFunction() && path.node.params?.[0]?.name === 'state') {
    const hasActionParam = path.node.params?.[1]?.name === 'action';
    const hasSwitch = path.node.body?.body?.some(
      stmt => stmt.type === 'SwitchStatement' &&
              stmt.discriminant?.object?.name === 'action' &&
              stmt.discriminant?.property?.name === 'type'
    );
    if (hasActionParam && hasSwitch) {
      return { type: 'redux-reducer', /* ... */ };
    }
  }

  // XState pattern
  if (path.node.callee?.name === 'createMachine' ||
      path.node.callee?.name === 'Machine') {
    return { type: 'xstate-machine', /* ... */ };
  }
}
```

### Anti-Patterns to Avoid

**AP-1: Recursive AST Traversal for Taint**
- **Why it's bad:** Infinite loops on circular references, stack overflow on deep nesting
- **What to do instead:** Use iterative BFS/DFS with depth limit (per D-10: 5-level limit)

**AP-2: String Matching for Variable Tracking**
- **Why it's bad:** False positives from variable shadowing, misses flow through destructuring
- **What to do instead:** Use scope-aware identifier resolution via Babel's scope API

**AP-3: Greedy Sanitization Detection**
- **Why it's bad:** Any function named `validate*` or `sanitize*` is treated as sanitizer, missing custom validation
- **What to do instead:** Track data flow through validation functions - if tainted data exits function, it's not sanitized

**AP-4: State Machine False Positives**
- **Why it's bad:** Any switch statement is flagged as state machine
- **What to do instead:** Require state-related variable names + state transitions + validation of state values

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JavaScript/TypeScript parsing | Custom parser | @babel/parser | Full ES2024+ support, error recovery, source maps [VERIFIED: package.json] |
| AST traversal | Recursive visitor | @babel/traverse | Handles node mutations, provides path API, scope tracking [VERIFIED: package.json] |
| File discovery | Custom glob | glob package | Already used in target-enumerator.js [VERIFIED: codebase] |
| DOT graph layout | Custom layout engine | Plain DOT output + Graphviz/Mermaid | Layout algorithms are complex; DOT is declarative [CITED: graphviz.org/doc/info/lang.html] |
| Scope resolution | Manual scope tracking | Babel scope API | `path.scope` provides accurate binding info [CITED: babeljs.io/docs/babel-traverse] |
| Taint propagation | Ad-hoc variable tracking | Data flow analysis with worklist algorithm | Academic proven approach, handles loops/conditionals [ASSUMED: based on standard static analysis] |

---

## Code Examples

### Example 1: Multi-Hop Taint Tracking
```javascript
// Source: adapted from Phase 113 source-mapper.js
// Extended for multi-hop tracking with depth limit

class TaintEngine {
  constructor(options = {}) {
    this.maxDepth = options.maxDepth || 5;
    this.taintMap = new Map(); // variable -> { source, hops, path }
    this.worklist = [];        // Pending propagation tasks
  }

  /**
   * Track taint from sources through transformations
   */
  analyzeTaintFlow(ast, sources, sinks) {
    // Initialize worklist with sources
    for (const source of sources) {
      if (source.variable) {
        this.markTainted(source.variable, source, 0);
      }
    }

    // Worklist algorithm for fixed-point iteration
    while (this.worklist.length > 0) {
      const task = this.worklist.shift();
      this.propagateTaint(task, ast);
    }

    // Find tainted sinks
    return this.findTaintedSinks(sinks);
  }

  markTainted(variable, source, hops, path = []) {
    const existing = this.taintMap.get(variable);
    if (existing && existing.hops <= hops) return;

    this.taintMap.set(variable, {
      source,
      hops,
      path: [...path, variable]
    });

    // Queue propagation
    this.worklist.push({ variable, hops });
  }

  propagateTaint({ variable, hops }, ast) {
    if (hops >= this.maxDepth) return;

    traverse(ast, {
      // Assignment: tainted = x -> y = tainted
      AssignmentExpression: (path) => {
        if (this.isVariableReference(path.node.right, variable)) {
          const leftVar = this.extractVariable(path.node.left);
          if (leftVar) {
            this.markTainted(leftVar, this.taintMap.get(variable).source, hops + 1);
          }
        }
      },

      // Property access: tainted.prop -> still tainted
      MemberExpression: (path) => {
        if (this.isVariableReference(path.node.object, variable)) {
          const resultVar = this.getAssignedVariable(path);
          if (resultVar) {
            this.markTainted(resultVar, this.taintMap.get(variable).source, hops + 1, {
              property: path.node.property?.name,
              type: 'property-access'
            });
          }
        }
      },

      // Function call: fn(tainted) -> check if result is tainted
      CallExpression: (path) => {
        const args = path.node.arguments;
        const isTaintedArg = args.some(arg =>
          this.isVariableReference(arg, variable)
        );

        if (isTaintedArg) {
          const resultVar = this.getAssignedVariable(path);
          const callee = this.extractCalleeName(path.node.callee);

          // Check if function sanitizes
          if (this.isSanitizationFunction(callee)) {
            // Taint ends here - don't propagate
            return;
          }

          if (resultVar) {
            this.markTainted(resultVar, this.taintMap.get(variable).source, hops + 1, {
              function: callee,
              type: 'function-call'
            });
          }
        }
      },

      // Destructuring: const { x } = tainted
      VariableDeclarator: (path) => {
        if (path.node.init && this.isVariableReference(path.node.init, variable)) {
          if (path.node.id.type === 'ObjectPattern') {
            // Track property-level taint
            for (const prop of path.node.id.properties) {
              const propName = prop.key?.name || prop.value?.name;
              this.markTainted(prop.value.name, this.taintMap.get(variable).source, hops + 1, {
                property: propName,
                type: 'destructure'
              });
            }
          }
        }
      }
    });
  }

  isSanitizationFunction(name) {
    const patterns = [
      /^sanitize/i, /^validate/i, /^escape/i,
      /^encodeURIComponent?$/, /^DOMPurify/
    ];
    return patterns.some(p => p.test(name));
  }

  findTaintedSinks(sinks) {
    return sinks.filter(sink => {
      // Check if any argument to sink is tainted
      const sinkCode = sink.code;
      for (const [variable, taintInfo] of this.taintMap) {
        if (sinkCode.includes(variable)) {
          return {
            ...sink,
            taintSource: taintInfo.source,
            taintPath: taintInfo.path,
            hops: taintInfo.hops
          };
        }
      }
      return false;
    }).filter(Boolean);
  }
}
```

### Example 2: Business Logic Workflow Extraction
```javascript
// Extract workflow sequences from API chains

class WorkflowAnalyzer {
  constructor() {
    this.workflows = [];
    this.currentWorkflow = null;
  }

  analyzeWorkflows(ast, filePath) {
    traverse(ast, {
      // Detect workflow entry points (routes)
      CallExpression: (path) => {
        const route = this.extractRouteInfo(path);
        if (route) {
          this.startWorkflow(route, filePath);
        }

        // Detect workflow steps within handler
        const step = this.extractWorkflowStep(path);
        if (step && this.currentWorkflow) {
          this.addStepToWorkflow(step);
        }
      },

      Function: {
        enter(path) {
          // Track if this is a route handler
          if (this.isRouteHandler(path)) {
            this.currentWorkflow = {
              id: this.generateWorkflowId(path),
              steps: [],
              entryPoint: this.extractRouteFromHandler(path)
            };
          }
        },
        exit(path) {
          if (this.isRouteHandler(path) && this.currentWorkflow) {
            this.workflows.push(this.currentWorkflow);
            this.currentWorkflow = null;
          }
        }
      }
    });

    return this.analyzeWorkflowRisks();
  }

  extractWorkflowStep(path) {
    const { callee } = path.node;

    // Database operations
    if (callee.type === 'MemberExpression') {
      const method = callee.property?.name;
      if (['findOne', 'findAll', 'create', 'update', 'destroy', 'query'].includes(method)) {
        return {
          type: 'database',
          operation: method,
          location: path.node.loc,
          async: path.context?.parentPath?.node?.type === 'AwaitExpression'
        };
      }
    }

    // HTTP/API calls
    if (callee.name === 'fetch' ||
        callee.name === 'axios' ||
        callee.name === 'request') {
      return {
        type: 'api-call',
        client: callee.name,
        location: path.node.loc,
        async: true
      };
    }

    // Authentication checks
    if (callee.name?.match(/auth|verify|check.*permission/i)) {
      return {
        type: 'auth-check',
        function: callee.name,
        location: path.node.loc
      };
    }

    // Validation
    if (callee.name?.match(/validate|sanitize|schema/i)) {
      return {
        type: 'validation',
        function: callee.name,
        location: path.node.loc
      };
    }

    return null;
  }

  analyzeWorkflowRisks() {
    return this.workflows.map(workflow => {
      const risks = [];

      // Check for auth gaps
      const hasAuth = workflow.steps.some(s => s.type === 'auth-check');
      const hasSensitiveOp = workflow.steps.some(s =>
        s.type === 'database' || s.type === 'api-call'
      );

      if (hasSensitiveOp && !hasAuth) {
        risks.push({
          type: 'missing-auth',
          severity: 'HIGH',
          description: 'Sensitive operations without authentication'
        });
      }

      // Check for validation gaps
      const hasValidation = workflow.steps.some(s => s.type === 'validation');
      const dataSources = workflow.steps.filter(s => s.type === 'data-source');

      if (dataSources.length > 0 && !hasValidation) {
        risks.push({
          type: 'missing-validation',
          severity: 'MEDIUM',
          description: 'User input without validation'
        });
      }

      // Check for race conditions (async operations without proper sequencing)
      const asyncSteps = workflow.steps.filter(s => s.async);
      if (asyncSteps.length > 1) {
        risks.push({
          type: 'potential-race-condition',
          severity: 'MEDIUM',
          description: 'Multiple async operations - verify proper sequencing'
        });
      }

      return { ...workflow, risks };
    });
  }
}
```

### Example 3: DOT Graph Generation for Taint Paths
```javascript
// Generate DOT format data flow graphs

class DataFlowGraph {
  constructor() {
    this.nodes = new Map();
    this.edges = [];
    this.nodeCounter = 0;
  }

  addNode(label, type, metadata = {}) {
    const id = `node${++this.nodeCounter}`;
    this.nodes.set(id, {
      id,
      label: this.escapeLabel(label),
      type,  // 'source', 'transform', 'sink', 'sanitizer'
      ...metadata
    });
    return id;
  }

  addEdge(from, to, label = '') {
    this.edges.push({ from, to, label: this.escapeLabel(label) });
  }

  escapeLabel(label) {
    // DOT label escaping rules
    return label
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .substring(0, 50); // Truncate long labels
  }

  generateDOT() {
    const lines = ['digraph TaintGraph {'];

    // Graph attributes
    lines.push('  rankdir=LR;');
    lines.push('  node [fontname="Arial", fontsize=12];');
    lines.push('  edge [fontname="Arial", fontsize=10];');

    // Node definitions with styling
    for (const [id, node] of this.nodes) {
      const style = this.getNodeStyle(node.type);
      lines.push(`  "${id}" [label="${node.label}", ${style}];`);
    }

    // Edge definitions
    for (const edge of this.edges) {
      const label = edge.label ? ` [label="${edge.label}"]` : '';
      lines.push(`  "${edge.from}" -> "${edge.to}"${label};`);
    }

    lines.push('}');
    return lines.join('\n');
  }

  getNodeStyle(type) {
    const styles = {
      source: 'shape=ellipse, fillcolor=lightcoral, style=filled',
      transform: 'shape=box, fillcolor=lightblue, style=filled',
      sink: 'shape=diamond, fillcolor=lightgoldenrod1, style=filled',
      sanitizer: 'shape=hexagon, fillcolor=lightgreen, style=filled'
    };
    return styles[type] || 'shape=box';
  }

  // Build graph from taint analysis results
  buildFromTaintResults(taintFlows) {
    for (const flow of taintFlows) {
      const sourceId = this.addNode(
        `${flow.source.type}\n${flow.source.code.substring(0, 30)}`,
        'source',
        { location: flow.source.location }
      );

      let prevId = sourceId;

      // Add intermediate transformations
      for (const transform of flow.path || []) {
        const transformId = this.addNode(
          `${transform.type}\n${transform.variable || 'unnamed'}`,
          'transform'
        );
        this.addEdge(prevId, transformId, transform.type);
        prevId = transformId;
      }

      // Add sink node
      for (const sink of flow.sinks) {
        const sinkId = this.addNode(
          `${sink.type}\n${sink.code.substring(0, 30)}`,
          'sink',
          { risk: sink.risk }
        );
        this.addEdge(prevId, sinkId);
      }
    }

    return this.generateDOT();
  }
}
```

### Example 4: State Machine Visualization (Mermaid)
```javascript
// Generate Mermaid state diagrams from detected state machines

class StateDiagramGenerator {
  generateMermaid(stateMachines) {
    const diagrams = [];

    for (const sm of stateMachines) {
      const lines = ['stateDiagram-v2'];

      // Add states
      for (const state of sm.states) {
        if (state.isInitial) {
          lines.push(`  [*] --> ${state.name}`);
        }
        if (state.isFinal) {
          lines.push(`  ${state.name} --> [*]`);
        }
      }

      // Add transitions
      for (const transition of sm.transitions) {
        const event = transition.event ? ` : ${transition.event}` : '';
        lines.push(`  ${transition.from} --> ${transition.to}${event}`);
      }

      // Add risk annotations as notes
      for (const risk of sm.risks || []) {
        lines.push(`  note right of ${risk.state} : ${risk.description}`);
      }

      diagrams.push({
        name: sm.name,
        mermaid: lines.join('\n'),
        risks: sm.risks
      });
    }

    return diagrams;
  }

  // Detect state transitions from code patterns
  detectTransitions(ast, stateMachine) {
    const transitions = [];

    traverse(ast, {
      // Switch statement transitions
      SwitchStatement: (path) => {
        const discriminant = path.node.discriminant;
        if (discriminant.property?.name === 'type') {
          // Redux reducer pattern
          for (const case_ of path.node.cases) {
            const event = case_.test?.value;
            const consequence = case_.consequent;

            // Look for state transitions
            for (const stmt of consequence) {
              if (stmt.type === 'ReturnStatement') {
                const newState = this.extractStateFromReturn(stmt);
                transitions.push({
                  from: '*',  // Any state
                  to: newState,
                  event,
                  type: 'redux-action'
                });
              }
            }
          }
        }
      },

      // React setState calls
      CallExpression: (path) => {
        const { callee } = path.node;
        if (callee.name === stateMachine.setterFunction) {
          const arg = path.node.arguments[0];
          const newState = this.extractStateValue(arg);
          transitions.push({
            from: '*',
            to: newState,
            event: 'setState',
            type: 'react-setState'
          });
        }
      }
    });

    return transitions;
  }
}
```

---

## Common Pitfalls

### Pitfall 1: Imprecise Taint Propagation
**What goes wrong:** Marking all variables as tainted when only specific properties should be, or missing taint through property chains like `req.body.user.name`
**Why it happens:** Simple string matching treats `user` and `user.name` as different, missing object property tainting
**How to avoid:** Implement property-level taint tracking; when `obj` is tainted, mark `obj.prop` as tainted with parent reference
**Warning signs:** High false positive rate on taint reports, or missed vulnerabilities in nested object access

### Pitfall 2: Scope Confusion
**What goes wrong:** Taint from one function affects variables with the same name in different scopes
**Why it happens:** Not using Babel's scope API; treating all variables with name `data` as the same
**How to avoid:** Use `path.scope.getBinding(identifier)` to resolve unique variable bindings across scopes
**Warning signs:** Taint flows reported between unrelated functions

### Pitfall 3: State Machine Over-Detection
**What goes wrong:** Every switch statement flagged as state machine, every boolean flag as state
**Why it happens:** Insufficient filtering - need multiple indicators (state variable name + transitions + validation)
**How to avoid:** Require at least 2 of: state-named variable, transition patterns, validation checks, entry/exit actions
**Warning signs:** State diagrams for simple conditional logic; too many "state machines" in report

### Pitfall 4: Async Flow Breakdown
**What goes wrong:** Missing workflow steps across async boundaries; broken chains in promise.then()
**Why it happens:** AST traversal doesn't follow promise chains; callbacks in `.then()` are separate function scopes
**How to avoid:** Track promise chains explicitly; link `.then()` callbacks to parent workflow
**Warning signs:** Incomplete workflows ending at async operations; missing database calls in workflow diagrams

### Pitfall 5: Sanitization False Negatives
**What goes wrong:** Custom validation functions not recognized; taint reported through validator
**Why it happens:** Only checking for common names like `sanitize`; not analyzing validation function bodies
**How to avoid:** Track if function returns original value (unsanitized) vs new value (sanitized); whitelist known validators
**Warning signs:** Vulnerabilities reported through obvious validation functions

### Pitfall 6: Performance on Large Codebases
**What goes wrong:** Analysis takes too long; O(n²) or worse complexity on many files
**Why it happens:** Re-parsing same files, redundant traversals, no caching of intermediate results
**How to avoid:** Cache parsed ASTs per file; single-pass analysis; limit analysis to 100 files (per existing pattern in Phase 113-114)
**Warning signs:** Analysis timeout on moderate-sized projects; memory issues

---

## State of the Art

### Static Analysis Evolution

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Regex-based source/sink detection | AST-based with scope resolution | Phase 113 | More accurate, fewer false positives |
| Single-file analysis | Cross-file reference tracking | Phase 115 | Inter-procedural taint analysis |
| String-based variable tracking | Binding-based with scope chain | Phase 115 | Handles shadowing, closures correctly |
| Manual workflow documentation | Automated extraction | Phase 115 | Scalable to large codebases |

### Academic Foundations

The taint analysis approach recommended follows established academic patterns:

1. **Worklist Algorithm** for fixed-point iteration on data flow (Aho et al., Compilers: Principles, Techniques, and Tools)
2. **Scope-chain based variable resolution** (ES6 specification for lexical scoping)
3. **Property-level tainting** (Taj et al., "Efficient Taint Analysis for JavaScript")

### Industry Standards

| Standard | Relevance to Phase 115 |
|----------|------------------------|
| OWASP Testing Guide v4.2 | OTG-BUSLOGIC-001 to 009: Business logic testing methodology |
| PTES v2.0 | Intelligence Gathering phase: application analysis |
| MITRE ATT&CK T1190 | Exploit Public-Facing Application: supports taint-to-exploit mapping |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Babel scope API provides accurate variable binding | Architecture Patterns | Taint analysis will have false positives from scope confusion |
| A2 | 5-level depth limit is sufficient for meaningful taint analysis | User Constraints (D-10) | May miss deep propagation chains; user specified this limit |
| A3 | Property-level taint tracking is needed for accuracy | Common Pitfalls | Object property flows will be missed |
| A4 | DOT format can be converted to Mermaid for display | Standard Stack | May need adapter if Mermaid doesn't support all DOT features |
| A5 | 100 file limit balances coverage vs performance | Common Pitfalls | Large projects may have incomplete analysis |

---

## Open Questions

### Q1: How to handle dynamic imports and require() with variable paths?
- **What we know:** `require('./' + variable)` can't be statically analyzed
- **What's unclear:** Should we flag as potential taint source? Ignore?
- **Recommendation:** Flag as "dynamic import" in taint report with LOW confidence

### Q2: What sanitization patterns should be recognized beyond common names?
- **What we know:** `sanitizeXSS`, `escapeHTML`, `validateSchema` are common
- **What's unclear:** Framework-specific validators (Joi, Yup, Zod) detection
- **Recommendation:** Add detection for popular validation libraries; make extensible

### Q3: How to distinguish workflow branches from separate workflows?
- **What we know:** Conditional logic creates branches
- **What's unclear:** When to split into separate workflow vs conditional branch
- **Recommendation:** Use entry point as workflow boundary; internal conditionals are branches

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All modules | ✓ | >=16.7.0 | - |
| @babel/parser | AST parsing | ✓ | ^7.29.2 | - |
| @babel/traverse | AST traversal | ✓ | ^7.29.0 | - |
| glob | File discovery | ✓ | ^13.0.6 | - |
| Graphviz | DOT visualization | ✗ | - | Use Mermaid online converter |

**Missing dependencies with no fallback:** None - all runtime dependencies are already in package.json

**Missing dependencies with fallback:**
- Graphviz binary for rendering DOT to images - can use web-based converters or Mermaid.js

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node --test) |
| Config file | None - uses package.json scripts |
| Quick run command | `node --test test/business-logic-mapper.test.js` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| RECON-06 | State machine detection | unit | `node --test test/business-logic-mapper.test.js` | ❌ Wave 0 |
| RECON-06 | Workflow extraction | unit | `node --test test/workflow-analyzer.test.js` | ❌ Wave 0 |
| RECON-07 | Multi-hop taint tracking | unit | `node --test test/taint-engine.test.js` | ❌ Wave 0 |
| RECON-07 | Sanitization detection | unit | `node --test test/sanitization-detector.test.js` | ❌ Wave 0 |
| RECON-06/07 | DOT graph generation | unit | `node --test test/data-flow-graph.test.js` | ❌ Wave 0 |
| RECON-06/07 | Integration with ReconAggregator | integration | `node --test test/recon-aggregator-115.test.js` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test test/<specific-module>.test.js`
- **Per wave merge:** `npm test` (runs all tests)
- **Phase gate:** All new test files green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `test/business-logic-mapper.test.js` — covers RECON-06 state detection
- [ ] `test/workflow-analyzer.test.js` — covers RECON-06 workflow extraction
- [ ] `test/taint-engine.test.js` — covers RECON-07 multi-hop taint
- [ ] `test/sanitization-detector.test.js` — covers RECON-07 sanitization
- [ ] `test/data-flow-graph.test.js` — covers DOT generation
- [ ] `test/fixtures/sample-state-machines/` — test fixtures for React/Redux/XState
- [ ] `test/fixtures/taint-flows/` — test fixtures for various taint patterns

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V1 Architecture | Yes | Business logic workflow documentation |
| V2 Authentication | Yes | Auth gap detection in workflows |
| V3 Session Management | Yes | Session handling in state machines |
| V4 Access Control | Yes | Workflow authorization checks |
| V5 Input Validation | Yes | Taint analysis + sanitization detection |
| V6 Cryptography | No | Not in scope for this phase |

### Known Threat Patterns for JavaScript/Node.js

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Workflow bypass | Elevation of Privilege | State validation at each transition |
| Race condition in checkout | Information Disclosure | Proper async sequencing |
| Taint to SQL injection | Tampering | Parameterized queries (detected) |
| Taint to command injection | Tampering | Avoid exec with user input |
| Taint to XSS | Tampering | Output encoding (sanitization) |
| Missing auth transition | Spoofing | Auth check before sensitive ops |

---

## Sources

### Primary (HIGH confidence)
- Phase 113 artifacts: `bin/lib/source-mapper.js` — AST parsing patterns, source/sink detection
- Phase 114 artifacts: `bin/lib/recon-aggregator.js` — Integration pattern (lines 57-66)
- Phase 114 artifacts: `bin/lib/auth-analyzer.js` — AST traversal for security patterns
- `@babel/parser` and `@babel/traverse` — Official Babel documentation [CITED: babeljs.io]

### Secondary (MEDIUM confidence)
- DOT Language Specification — Graphviz documentation [CITED: graphviz.org/doc/info/lang.html]
- OWASP Testing Guide v4.2 — Business Logic Testing chapter [CITED: owasp.org]
- PTES v2.0 Technical Guidelines — Intelligence Gathering phase

### Tertiary (LOW confidence)
- Academic papers on JavaScript taint analysis (general approach, not specific implementation)
- Industry blog posts on state machine detection (patterns may vary)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies already in use, verified from package.json and codebase
- Architecture: HIGH — builds on established Phase 113-114 patterns
- Pitfalls: MEDIUM — based on general static analysis experience, specific JS/Node patterns assumed
- State machine detection: MEDIUM — multiple framework patterns to support, some assumed

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (30 days - stable AST APIs, but framework patterns evolve)

**Integration verified:**
- [x] ReconAggregator extension point identified (lines 57-66)
- [x] ReconCache usage pattern established
- [x] Tier-based execution (redteam only) confirmed
- [x] SourceMapper output format compatible with taint sources
