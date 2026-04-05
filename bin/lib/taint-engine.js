/**
 * Taint Engine - Multi-hop data flow tracking from sources to sinks
 * Phase 115: Advanced Reconnaissance - RECON-07
 *
 * Implements worklist algorithm for fixed-point iteration with 5-level depth limit.
 */

const fs = require('fs').promises;
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { ReconCache } = require('./recon-cache');

/**
 * Tracks data flow from untrusted sources to dangerous sinks
 */
class TaintEngine {
  constructor(options = {}) {
    this.maxDepth = options.maxDepth || 5; // Per D-10: 5-level depth limit
    this.taintMap = new Map(); // variable -> { source, hops, path, scopeId }
    this.worklist = []; // BFS worklist for fixed-point iteration
    this.scopeChain = new Map(); // scopeId -> variables
    this.currentScope = 'global';
    this.scopeCounter = 0;
    this.cache = options.cache || new ReconCache();
    this.sources = [];
    this.sinks = [];
    this.flows = [];
  }

  /**
   * Main analysis entry point
   * @param {Object} options - Analysis options
   * @param {string} options.code - Source code to analyze
   * @param {string} options.filePath - Path to file (optional)
   * @returns {Promise<Object>} Analysis results
   */
  async analyze(options = {}) {
    const { code, filePath } = options;

    if (!code && !filePath) {
      return { error: 'No code or filePath provided', sources: [], sinks: [], flows: [] };
    }

    try {
      const sourceCode = code || await fs.readFile(filePath, 'utf-8');
      return this.analyzeCode(sourceCode, filePath || 'inline');
    } catch (error) {
      return { error: error.message, sources: [], sinks: [], flows: [] };
    }
  }

  /**
   * Analyze file with caching
   * @param {string} filePath - Path to JavaScript/TypeScript file
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeFile(filePath) {
    const cacheKey = this.cache.getKey(`taint:${filePath}`);
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.analyze({ filePath });
    await this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Parse and analyze source code
   */
  analyzeCode(code, filePath) {
    try {
      const ast = this.parseAST(code, filePath);
      this.sources = this.findSources(ast, filePath);
      this.sinks = this.findSinks(ast, filePath);
      this.flows = this.analyzeTaintFlow(ast, this.sources, this.sinks);

      return {
        sources: this.sources,
        sinks: this.sinks,
        flows: this.flows,
        summary: {
          totalSources: this.sources.length,
          totalSinks: this.sinks.length,
          totalFlows: this.flows.length,
          riskyFlows: this.flows.filter(f => f.risk === 'critical' || f.risk === 'high').length
        }
      };
    } catch (error) {
      return { error: error.message, sources: [], sinks: [], flows: [] };
    }
  }

  /**
   * Parse source code into AST
   */
  parseAST(code, filePath) {
    const isTypeScript = filePath.endsWith('.ts') || filePath.endsWith('.tsx');

    return parse(code, {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      plugins: [
        'jsx',
        'classProperties',
        'decorators-legacy',
        'dynamicImport',
        'optionalChaining',
        'nullishCoalescingOperator',
        ...(isTypeScript ? ['typescript'] : [])
      ]
    });
  }

  /**
   * Find untrusted input sources (D-07)
   */
  findSources(ast, filePath) {
    const sources = [];
    const sourcePatterns = [
      { type: 'req.body', pattern: /^req\.body/, variablePattern: /req\.body(?:\.(.+))?/ },
      { type: 'req.query', pattern: /^req\.query/, variablePattern: /req\.query(?:\.(.+))?/ },
      { type: 'req.params', pattern: /^req\.params/, variablePattern: /req\.params(?:\.(.+))?/ },
      { type: 'req.headers', pattern: /^req\.headers/, variablePattern: /req\.headers(?:\.(.+))?/ },
      { type: 'req.cookies', pattern: /^req\.cookies/, variablePattern: /req\.cookies(?:\.(.+))?/ },
      { type: 'req.files', pattern: /^req\.files/, variablePattern: /req\.files(?:\.(.+))?/ },
      { type: 'req.ip', pattern: /^req\.ip$/ },
      { type: 'req.hostname', pattern: /^req\.hostname$/ },
      { type: 'req.path', pattern: /^req\.path$/ },
      { type: 'process.env', pattern: /^process\.env/, variablePattern: /process\.env\.(.+)/ }
    ];

    const seen = new Set();

    traverse(ast, {
      MemberExpression: (nodePath) => {
        const code = nodePath.toString();
        const loc = nodePath.node.loc;

        for (const { type, pattern, variablePattern } of sourcePatterns) {
          if (pattern.test(code)) {
            const variable = this.extractVariableName(nodePath);
            const path = variablePattern ? this.extractSourcePath(code, variablePattern) : null;

            // Deduplicate based on code + line + column
            const key = `${code}:${loc?.start?.line}:${loc?.start?.column}`;
            if (seen.has(key)) return;
            seen.add(key);

            sources.push({
              type,
              code,
              path: path || code,
              location: {
                file: filePath,
                line: loc?.start?.line || 0,
                column: loc?.start?.column || 0
              },
              variable,
              scopeId: this.getScopeId(nodePath)
            });
          }
        }
      }
    });

    // Post-filter: remove intermediate expressions that are part of larger sources
    // e.g., remove "req.body" when "req.body.name" is also present
    return this.filterIntermediateSources(sources);
  }

  /**
   * Filter out intermediate sources that are part of larger expressions
   * e.g., "req.body" is intermediate when "req.body.name" exists
   */
  filterIntermediateSources(sources) {
    const filtered = [];

    for (const source of sources) {
      // Check if this source is a prefix of any other source
      const isIntermediate = sources.some(other => {
        if (other === source) return false;
        // Check if other.code starts with source.code + "."
        return other.code.startsWith(source.code + '.');
      });

      if (!isIntermediate) {
        filtered.push(source);
      }
    }

    return filtered;
  }

  /**
   * Extract source path from code
   */
  extractSourcePath(code, pattern) {
    const match = code.match(pattern);
    return match ? match[1] || code : code;
  }

  /**
   * Find dangerous sinks (D-08)
   */
  findSinks(ast, filePath) {
    const sinks = [];

    const sinkPatterns = [
      { type: 'sql-execution', pattern: /\.(query|execute|run)\s*\(/, risk: 'critical' },
      { type: 'eval', pattern: /eval\s*\(/, risk: 'critical' },
      { type: 'function-constructor', pattern: /new\s+Function\s*\(/, risk: 'critical' },
      { type: 'setTimeout-string', pattern: /setTimeout\s*\(\s*['"`]/, risk: 'high' },
      { type: 'setInterval-string', pattern: /setInterval\s*\(\s*['"`]/, risk: 'high' },
      { type: 'command-execution', pattern: /(exec|spawn|execFile)\s*\(/, risk: 'critical' },
      { type: 'xss', pattern: /(\.(innerHTML|outerHTML)\s*=|document\.write\s*\()/, risk: 'high' },
      { type: 'file-system', pattern: /fs\.(readFile|writeFile|appendFile)\s*\(/, risk: 'medium' }
    ];

    traverse(ast, {
      CallExpression: (nodePath) => {
        const code = nodePath.toString();
        const loc = nodePath.node.loc;

        for (const { type, pattern, risk } of sinkPatterns) {
          if (pattern.test(code)) {
            sinks.push({
              type,
              code,
              risk,
              location: {
                file: filePath,
                line: loc?.start?.line || 0,
                column: loc?.start?.column || 0
              },
              scopeId: this.getScopeId(nodePath)
            });
          }
        }
      },

      AssignmentExpression: (nodePath) => {
        const code = nodePath.toString();
        const loc = nodePath.node.loc;

        if (/\.(innerHTML|outerHTML)\s*=/.test(code)) {
          sinks.push({
            type: 'xss',
            code,
            risk: 'high',
            location: {
              file: filePath,
              line: loc?.start?.line || 0,
              column: loc?.start?.column || 0
            },
            scopeId: this.getScopeId(nodePath)
          });
        }
      }
    });

    return sinks;
  }

  /**
   * Multi-hop taint analysis using worklist algorithm (D-10)
   */
  analyzeTaintFlow(ast, sources, sinks) {
    // Initialize worklist with sources
    for (const source of sources) {
      if (source.variable) {
        this.markTainted(source.variable, source, 0, [], source.scopeId);
      }
    }

    // Worklist iteration for fixed-point
    while (this.worklist.length > 0) {
      const task = this.worklist.shift();
      this.propagateTaint(task, ast);
    }

    return this.findTaintedSinks(sinks);
  }

  /**
   * Mark a variable as tainted
   */
  markTainted(variable, source, hops, path = [], scopeId = this.currentScope) {
    const variableId = `${scopeId}:${variable}`;
    const existing = this.taintMap.get(variableId);

    // Only update if this is a shorter path
    if (existing && existing.hops <= hops) {
      return;
    }

    if (hops >= this.maxDepth) {
      return; // Respect depth limit
    }

    this.taintMap.set(variableId, {
      source,
      hops,
      path: [...path, { variable, scopeId, hops }],
      scopeId
    });

    // Queue for propagation
    this.worklist.push({ variable, hops, scopeId, source });
  }

  /**
   * Propagate taint through the AST
   */
  propagateTaint({ variable, hops, scopeId, source }, ast) {
    if (hops >= this.maxDepth) {
      return;
    }

    const self = this;

    traverse(ast, {
      // Track scope entry/exit
      Function: {
        enter(nodePath) {
          self.enterScope(nodePath);
        },
        exit(nodePath) {
          self.exitScope(nodePath);
        }
      },

      // Assignment: y = taintedVar
      AssignmentExpression(nodePath) {
        const { left, right } = nodePath.node;
        if (self.isVariableReference(right, variable, scopeId)) {
          const leftVar = self.extractVariableFromNode(left);
          if (leftVar) {
            self.markTainted(leftVar, source, hops + 1,
              self.getTaintPath(scopeId, variable), self.currentScope);
          }
        }
      },

      // Variable declaration with init: const x = taintedVar
      VariableDeclarator(nodePath) {
        const { id, init } = nodePath.node;
        if (!init) return;

        // Direct assignment: const x = taintedVar
        if (self.isVariableReference(init, variable, scopeId)) {
          const varName = id.type === 'Identifier' ? id.name : null;
          if (varName) {
            self.markTainted(varName, source, hops + 1,
              self.getTaintPath(scopeId, variable), self.currentScope);
          }
        }

        // Destructuring: const { x } = taintedVar
        if (id.type === 'ObjectPattern' && self.isVariableReference(init, variable, scopeId)) {
          for (const prop of id.properties) {
            if (prop.type === 'ObjectProperty' || prop.type === 'Property') {
              const propName = prop.value?.name || prop.key?.name;
              if (propName) {
                self.markTainted(propName, source, hops + 1,
                  [...self.getTaintPath(scopeId, variable), { type: 'destructure', property: prop.key?.name }],
                  self.currentScope
                );
              }
            }
          }
        }

        // Array destructuring: const [x] = taintedVar
        if (id.type === 'ArrayPattern' && self.isVariableReference(init, variable, scopeId)) {
          for (let i = 0; i < id.elements.length; i++) {
            const elem = id.elements[i];
            if (elem?.type === 'Identifier') {
              self.markTainted(elem.name, source, hops + 1,
                [...self.getTaintPath(scopeId, variable), { type: 'array-destructure', index: i }],
                self.currentScope
              );
            }
          }
        }
      },

      // Property access: tainted.prop
      MemberExpression(nodePath) {
        if (self.isVariableReference(nodePath.node.object, variable, scopeId)) {
          const resultVar = self.getAssignedVariable(nodePath);
          if (resultVar) {
            const propName = nodePath.node.property?.name || nodePath.node.property?.value;
            self.markTainted(resultVar, source, hops + 1,
              [...self.getTaintPath(scopeId, variable), { type: 'property-access', property: propName }],
              self.currentScope
            );
          }
        }
      },

      // Function calls: fn(tainted) or tainted.method()
      CallExpression(nodePath) {
        const args = nodePath.node.arguments;
        const callee = nodePath.node.callee;

        // Check if any argument is tainted
        const isTaintedArg = args.some(arg => self.isVariableReference(arg, variable, scopeId));

        // Check if this is a method call on tainted object: tainted.method()
        const isMethodOnTainted = callee.type === 'MemberExpression' &&
          self.isVariableReference(callee.object, variable, scopeId);

        if (isTaintedArg || isMethodOnTainted) {
          const resultVar = self.getAssignedVariable(nodePath);
          const calleeName = self.extractCalleeName(callee);

          // Check for sanitization functions (stops taint)
          if (self.isSanitizationFunction(calleeName)) {
            // Taint ends here - mark as sanitized but don't propagate
            return;
          }

          if (resultVar) {
            self.markTainted(resultVar, source, hops + 1,
              [...self.getTaintPath(scopeId, variable), { type: 'function-call', function: calleeName }],
              self.currentScope
            );
          }
        }
      },

      // Spread operator: const y = { ...tainted }
      SpreadElement(nodePath) {
        if (self.isVariableReference(nodePath.node.argument, variable, scopeId)) {
          const parent = nodePath.parent;
          if (parent.type === 'ObjectExpression' || parent.type === 'ArrayExpression') {
            const resultVar = self.getAssignedVariable(nodePath);
            if (resultVar) {
              self.markTainted(resultVar, source, hops + 1,
                [...self.getTaintPath(scopeId, variable), { type: 'spread' }],
                self.currentScope
              );
            }
          }
        }
      },

      // Template literals: `...${tainted}...`
      TemplateLiteral(nodePath) {
        const hasTainted = nodePath.node.expressions.some(
          expr => self.isVariableReference(expr, variable, scopeId)
        );
        if (hasTainted) {
          const resultVar = self.getAssignedVariable(nodePath);
          if (resultVar) {
            self.markTainted(resultVar, source, hops + 1,
              [...self.getTaintPath(scopeId, variable), { type: 'template-literal' }],
              self.currentScope
            );
          }
        }
      },

      // Binary expressions: tainted + something
      BinaryExpression(nodePath) {
        const { left, right } = nodePath.node;
        if (self.isVariableReference(left, variable, scopeId) ||
            self.isVariableReference(right, variable, scopeId)) {
          const resultVar = self.getAssignedVariable(nodePath);
          if (resultVar) {
            self.markTainted(resultVar, source, hops + 1,
              [...self.getTaintPath(scopeId, variable), { type: 'binary-op', operator: nodePath.node.operator }],
              self.currentScope
            );
          }
        }
      }
    });
  }

  /**
   * Enter a new scope
   */
  enterScope(nodePath) {
    this.scopeCounter++;
    const scopeId = `scope_${this.scopeCounter}`;
    this.scopeChain.set(scopeId, { parent: this.currentScope, variables: new Set() });
    this.currentScope = scopeId;
  }

  /**
   * Exit current scope
   */
  exitScope(nodePath) {
    const current = this.scopeChain.get(this.currentScope);
    if (current) {
      this.currentScope = current.parent || 'global';
    }
  }

  /**
   * Get scope ID for a node path
   */
  getScopeId(nodePath) {
    // Try to get scope from Babel's scope API
    if (nodePath.scope) {
      return `scope_${nodePath.scope.uid}`;
    }
    return this.currentScope;
  }

  /**
   * Check if a node references a tainted variable
   */
  isVariableReference(node, variableName, scopeId) {
    if (!node) return false;

    if (node.type === 'Identifier' && node.name === variableName) {
      return true;
    }

    // Handle member expressions: variable.property
    if (node.type === 'MemberExpression') {
      const root = this.getRootObject(node);
      return root === variableName;
    }

    return false;
  }

  /**
   * Get root object from member expression
   */
  getRootObject(node) {
    if (node.type === 'Identifier') {
      return node.name;
    }
    if (node.type === 'MemberExpression') {
      return this.getRootObject(node.object);
    }
    return null;
  }

  /**
   * Extract variable name from source node path
   */
  extractVariableName(nodePath) {
    // Check if this is assigned to a variable
    const parent = nodePath.parent;
    if (parent?.type === 'VariableDeclarator' && parent.id?.type === 'Identifier') {
      return parent.id.name;
    }
    if (parent?.type === 'AssignmentExpression' && parent.left?.type === 'Identifier') {
      return parent.left.name;
    }
    return null;
  }

  /**
   * Extract variable name from a node
   */
  extractVariableFromNode(node) {
    if (node.type === 'Identifier') {
      return node.name;
    }
    return null;
  }

  /**
   * Get variable that receives the result of an expression
   */
  getAssignedVariable(nodePath) {
    const parent = nodePath.parent;

    // const x = expr
    if (parent?.type === 'VariableDeclarator' && parent.id?.type === 'Identifier') {
      return parent.id.name;
    }

    // x = expr
    if (parent?.type === 'AssignmentExpression' && parent.left?.type === 'Identifier') {
      return parent.left.name;
    }

    // return expr (track as special return variable)
    if (parent?.type === 'ReturnStatement') {
      return '__return__';
    }

    // x += expr, etc.
    if (parent?.type === 'AssignmentExpression' && parent.operator !== '=') {
      return this.extractVariableFromNode(parent.left);
    }

    return null;
  }

  /**
   * Extract callee name from call expression
   */
  extractCalleeName(callee) {
    if (callee.type === 'Identifier') {
      return callee.name;
    }
    if (callee.type === 'MemberExpression') {
      const object = callee.object?.name || '';
      const property = callee.property?.name || '';
      return `${object}.${property}`;
    }
    return 'anonymous';
  }

  /**
   * Check if a function is a sanitization function (stops taint)
   */
  isSanitizationFunction(name) {
    if (!name) return false;

    const patterns = [
      /^sanitize/i,
      /^validate/i,
      /^escape/i,
      /^encode/i,
      /^encodeURIComponent$/,
      /^encodeURI$/,
      /^DOMPurify/i,
      /^validator\./,
      /^htmlspecialchars/i,
      /^strip_tags/i,
      /^purify/i,
      /^clean/i,
      /^normalize/i
    ];

    return patterns.some(p => p.test(name));
  }

  /**
   * Get taint path for a variable
   */
  getTaintPath(scopeId, variable) {
    const variableId = `${scopeId}:${variable}`;
    const taintInfo = this.taintMap.get(variableId);
    return taintInfo?.path || [];
  }

  /**
   * Check if a variable is tainted in current or parent scope
   */
  isTainted(variableName, scopeId = this.currentScope) {
    // Check current scope and parent scopes
    let current = scopeId;
    const visited = new Set();

    while (current && !visited.has(current)) {
      visited.add(current);
      const variableId = `${current}:${variableName}`;
      const taintInfo = this.taintMap.get(variableId);
      if (taintInfo) {
        return taintInfo;
      }

      // Move to parent scope
      const scopeInfo = this.scopeChain.get(current);
      current = scopeInfo?.parent;
    }

    return null;
  }

  /**
   * Find tainted sinks (flows from sources to sinks)
   */
  findTaintedSinks(sinks) {
    const flows = [];
    const riskLevels = { low: 1, medium: 2, high: 3, critical: 4 };

    for (const sink of sinks) {
      // Check if any argument to sink is tainted
      const sinkCode = sink.code;
      const taintedVars = this.getTaintedVariablesInSink(sinkCode, sink.scopeId);

      for (const { variable, taintInfo } of taintedVars) {
        // Check if sanitization occurred between source and sink
        const isSanitized = this.checkSanitization(taintInfo.path);

        // Calculate risk based on source type and sink type
        const risk = this.calculateRisk(taintInfo.source, sink, isSanitized);

        flows.push({
          source: taintInfo.source,
          sink,
          path: taintInfo.path,
          hops: taintInfo.hops,
          sanitized: isSanitized,
          risk,
          riskLevel: riskLevels[risk] || 1
        });
      }
    }

    // Sort by risk level (highest first)
    return flows.sort((a, b) => b.riskLevel - a.riskLevel);
  }

  /**
   * Get all tainted variables used in a sink
   */
  getTaintedVariablesInSink(sinkCode, sinkScopeId) {
    const taintedVars = [];

    for (const [variableId, taintInfo] of this.taintMap) {
      const [scopeId, variableName] = variableId.split(':');

      // Check if variable is used in sink code
      if (sinkCode.includes(variableName)) {
        // Check scope compatibility (same scope or parent scope)
        if (this.isScopeCompatible(scopeId, sinkScopeId)) {
          taintedVars.push({ variable: variableName, taintInfo });
        }
      }
    }

    return taintedVars;
  }

  /**
   * Check if scope is compatible (same or parent)
   */
  isScopeCompatible(sourceScope, targetScope) {
    if (sourceScope === targetScope) return true;

    // Check if sourceScope is an ancestor of targetScope
    let current = targetScope;
    const visited = new Set();

    while (current && !visited.has(current)) {
      visited.add(current);
      const scopeInfo = this.scopeChain.get(current);
      if (scopeInfo?.parent === sourceScope) {
        return true;
      }
      current = scopeInfo?.parent;
    }

    return false;
  }

  /**
   * Check if sanitization occurred in the taint path
   */
  checkSanitization(path) {
    if (!path || path.length === 0) return false;

    // Check each step in the path for sanitization
    for (const step of path) {
      if (step.type === 'function-call') {
        const funcName = step.function || '';
        if (this.isSanitizationFunction(funcName)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Calculate risk level for a flow (D-17 through D-21)
   */
  calculateRisk(source, sink, isSanitized) {
    const criticalSinks = ['eval', 'function-constructor', 'command-execution', 'sql-execution'];
    const highSinks = ['xss', 'setTimeout-string', 'setInterval-string'];
    const mediumSinks = ['file-system', 'res.send'];

    // Critical: Unsanitized user input -> SQL/command execution (D-17)
    if (criticalSinks.includes(sink.type) && !isSanitized) {
      return 'critical';
    }

    // High: Multi-hop taint to response sinks (D-19)
    if (highSinks.includes(sink.type) && !isSanitized) {
      return 'high';
    }

    // Medium: Single-hop with partial sanitization (D-20)
    if (isSanitized && criticalSinks.includes(sink.type)) {
      return 'medium';
    }

    // Low: Taint to logging sinks (D-21)
    if (mediumSinks.includes(sink.type)) {
      return 'low';
    }

    return 'medium';
  }

  /**
   * Mark a variable as tainted (public API)
   */
  markTaintedPublic(variable, source, hops = 0) {
    this.markTainted(variable, source, hops, [], this.currentScope);
  }

  /**
   * Check if a variable is tainted (public API)
   */
  isTaintedPublic(variable) {
    return this.isTainted(variable, this.currentScope) !== null;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.taintMap.clear();
    this.worklist = [];
    this.scopeChain.clear();
    this.sources = [];
    this.sinks = [];
    this.flows = [];
  }
}

/**
 * Convenience function to track taint flow
 */
async function trackTaintFlow(code, options = {}) {
  const engine = new TaintEngine(options);
  const result = await engine.analyze({ code });
  engine.cleanup();
  return result;
}

/**
 * Mark a variable as tainted (standalone function)
 */
function markTainted(variable, source) {
  return { variable, source, tainted: true, timestamp: Date.now() };
}

/**
 * Check if a variable is tainted (standalone function)
 */
function isTainted(variable, taintSet) {
  return taintSet.has(variable);
}

module.exports = {
  TaintEngine,
  trackTaintFlow,
  markTainted,
  isTainted
};
