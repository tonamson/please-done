/**
 * Source Mapper - Identifies untrusted data sources and maps them to sinks
 * Phase 113: Intelligence Gathering Core
 */

const fs = require('fs').promises;
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { ReconCache } = require('./recon-cache');

/**
 * Maps untrusted input sources to their consumption points (sinks)
 */
class SourceMapper {
  constructor(options = {}) {
    this.cache = options.cache || new ReconCache();
    this.sources = [];
    this.sinks = [];
    this.sourceToSinkMap = new Map();
    this.sanitizationEdges = new Map(); // Track sanitization between source and sink
  }

  /**
   * Parse file and identify sources/sinks
   * @param {string} filePath - Path to JavaScript/TypeScript file
   * @returns {Promise<Object>} Analysis results
   */
  async analyze(filePath) {
    const cacheKey = this.cache.getKey(`source-map:${filePath}`);
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      this.sources = cached.sources;
      this.sinks = cached.sinks;
      this.sourceToSinkMap = new Map(cached.sourceToSinkMap);
      return this.getAnalysisResult();
    }

    const code = await fs.readFile(filePath, 'utf-8');
    const ast = this.parseAST(code, filePath);

    this.sources = this.findSources(ast, filePath);
    this.sinks = this.findSinks(ast, filePath);
    const { sourceToSink, sanitizationEdges } = this.mapSourcesToSinks(ast);
    this.sourceToSinkMap = sourceToSink;
    this.sanitizationEdges = sanitizationEdges;

    const result = this.getAnalysisResult();
    await this.cache.set(cacheKey, {
      sources: this.sources,
      sinks: this.sinks,
      sourceToSinkMap: Array.from(this.sourceToSinkMap.entries()),
      sanitizationEdges: Array.from(this.sanitizationEdges.entries())
    });

    return result;
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
   * Find untrusted input sources
   */
  findSources(ast, filePath) {
    const sources = [];
    const sourcePatterns = [
      { type: 'req.body', pattern: /^req\.body$/ },
      { type: 'req.query', pattern: /^req\.query$/ },
      { type: 'req.params', pattern: /^req\.params$/ },
      { type: 'req.headers', pattern: /^req\.headers$/ },
      { type: 'req.cookies', pattern: /^req\.cookies$/ },
      { type: 'req.files', pattern: /^req\.files$/ },
      { type: 'req.ip', pattern: /^req\.ip$/ },
      { type: 'req.hostname', pattern: /^req\.hostname$/ },
      { type: 'req.path', pattern: /^req\.path$/ },
      { type: 'process.env', pattern: /^process\.env$/ },
      { type: 'fetch.response', pattern: /fetch\(.*\)/ }
    ];

    traverse(ast, {
      MemberExpression: (nodePath) => {
        const code = nodePath.toString();
        const loc = nodePath.node.loc;

        for (const { type, pattern } of sourcePatterns) {
          if (pattern.test(code)) {
            sources.push({
              type,
              code,
              location: {
                file: filePath,
                line: loc?.start?.line || 0,
                column: loc?.start?.column || 0
              },
              variable: this.extractVariableName(nodePath)
            });
          }
        }
      },

      CallExpression: (nodePath) => {
        const { callee } = nodePath.node;
        if (callee.type === 'Identifier' && callee.name === 'fetch') {
          const loc = nodePath.node.loc;
          sources.push({
            type: 'fetch.response',
            code: nodePath.toString(),
            location: {
              file: filePath,
              line: loc?.start?.line || 0,
              column: loc?.start?.column || 0
            },
            variable: this.extractFetchVariable(nodePath)
          });
        }
      }
    });

    return sources;
  }

  /**
   * Find dangerous sinks
   */
  findSinks(ast, filePath) {
    const sinks = [];

    const sinkPatterns = [
      { type: 'sql.query', pattern: /\.query\s*\(/, risk: 'high' },
      { type: 'sql.execute', pattern: /\.execute\s*\(/, risk: 'high' },
      { type: 'eval', pattern: /eval\s*\(/, risk: 'critical' },
      { type: 'function.constructor', pattern: /new\s+Function\s*\(/, risk: 'critical' },
      { type: 'setTimeout.string', pattern: /setTimeout\s*\(\s*['"`]/, risk: 'high' },
      { type: 'setInterval.string', pattern: /setInterval\s*\(\s*['"`]/, risk: 'high' },
      { type: 'child_process.exec', pattern: /exec\s*\(/, risk: 'critical' },
      { type: 'child_process.spawn', pattern: /spawn\s*\(/, risk: 'high' },
      { type: 'innerHTML', pattern: /\.innerHTML\s*=/, risk: 'high' },
      { type: 'outerHTML', pattern: /\.outerHTML\s*=/, risk: 'high' },
      { type: 'document.write', pattern: /document\.write\s*\(/, risk: 'high' },
      { type: 'require.dynamic', pattern: /require\s*\(\s*[^'"`]/, risk: 'medium' },
      { type: 'fs.readFile', pattern: /fs\.readFile\s*\(/, risk: 'medium' },
      { type: 'res.send', pattern: /res\.send\s*\(/, risk: 'medium' }
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
              }
            });
          }
        }
      },

      AssignmentExpression: (nodePath) => {
        const code = nodePath.toString();
        const loc = nodePath.node.loc;

        if (/\.innerHTML\s*=/.test(code) || /\.outerHTML\s*=/.test(code)) {
          sinks.push({
            type: code.includes('innerHTML') ? 'innerHTML' : 'outerHTML',
            code,
            risk: 'high',
            location: {
              file: filePath,
              line: loc?.start?.line || 0,
              column: loc?.start?.column || 0
            }
          });
        }
      }
    });

    return sinks;
  }

  /**
   * Map sources to their sinks through taint analysis (extended with inter-procedural + sanitization)
   * @returns {{ sourceToSink: Map, sanitizationEdges: Map }}
   */
  mapSourcesToSinks(ast) {
    const sourceToSink = new Map();
    const sanitizationEdges = new Map();
    const variableDeclarations = new Map();

    // Track variable assignments
    traverse(ast, {
      VariableDeclarator: (nodePath) => {
        const { id, init } = nodePath.node;
        if (id.type === 'Identifier' && init) {
          variableDeclarations.set(id.name, nodePath.toString());
        }
      }
    });

    // Build call graph for inter-procedural analysis
    const callGraph = this.buildCallGraph(ast);

    // Simple taint tracking
    this.sources.forEach((source, index) => {
      const variable = source.variable;
      if (variable) {
        const affectedSinks = this.sinks.filter(sink => {
          const directTaint = sink.code.includes(variable) ||
            this.isVariableUsedInSink(variable, sink, variableDeclarations);

          // Check inter-procedural taint
          const interProceduralTaint = this.checkInterProceduralTaint(
            source, sink, callGraph, variableDeclarations
          );

          // Check sanitization
          const sanitization = this.checkSanitization(
            source, sink, callGraph, variableDeclarations
          );

          if (sanitization.sanitized) {
            // Track sanitization edge
            const key = `${index}-${sink.code}`;
            sanitizationEdges.set(key, sanitization);
          }

          return directTaint || interProceduralTaint;
        });

        if (affectedSinks.length > 0) {
          sourceToSink.set(index, affectedSinks);
        }
      }
    });

    // Store sanitizationEdges
    this.sanitizationEdges = sanitizationEdges;

    return { sourceToSink, sanitizationEdges };
  }

  /**
   * Build inter-procedural call graph from AST
   * @returns {Map} function name -> [called function names]
   */
  buildCallGraph(ast) {
    const callGraph = new Map();
    const functionDeclarations = new Map();

    // First pass: collect all function declarations
    traverse(ast, {
      FunctionDeclaration: (nodePath) => {
        const name = nodePath.node.id?.name;
        if (name) {
          functionDeclarations.set(name, nodePath);
        }
      },
      VariableDeclarator: (nodePath) => {
        if (nodePath.node.id?.type === 'Identifier' &&
            (nodePath.node.init?.type === 'FunctionExpression' ||
             nodePath.node.init?.type === 'ArrowFunctionExpression')) {
          const name = nodePath.node.id.name;
          functionDeclarations.set(name, nodePath);
        }
      }
    });

    // Second pass: collect function calls
    traverse(ast, {
      CallExpression: (nodePath) => {
        const callee = nodePath.node.callee;
        let funcName = null;

        if (callee.type === 'Identifier') {
          funcName = callee.name;
        } else if (callee.type === 'MemberExpression') {
          // Skip method calls like obj.method()
          return;
        }

        if (funcName) {
          // Find parent function
          const parentFunc = nodePath.findParent(p =>
            p.isFunctionDeclaration() ||
            p.isVariableDeclarator() ||
            p.isFunctionExpression() ||
            p.isArrowFunctionExpression()
          );

          let parentName = 'global';
          if (parentFunc) {
            if (parentFunc.isFunctionDeclaration()) {
              parentName = parentFunc.node.id?.name || 'anonymous';
            } else if (parentFunc.isVariableDeclarator()) {
              parentName = parentFunc.node.id?.name || 'anonymous';
            } else if (parentFunc.node.type === 'FunctionExpression' ||
                       parentFunc.node.type === 'ArrowFunctionExpression') {
              // Anonymous function - check grandparent
              const grandParent = parentFunc.parent;
              if (grandParent?.isVariableDeclarator()) {
                parentName = grandParent.node.id?.name || 'anonymous';
              }
            }
          }

          if (!callGraph.has(parentName)) {
            callGraph.set(parentName, []);
          }
          if (!callGraph.get(parentName).includes(funcName)) {
            callGraph.get(parentName).push(funcName);
          }
        }
      }
    });

    return callGraph;
  }

  /**
   * Check if source flows to sink through function calls (inter-procedural)
   */
  checkInterProceduralTaint(source, sink, callGraph, variableDeclarations) {
    const sourceVar = source.variable;
    if (!sourceVar) return false;

    // For each function in call graph, check if source variable is passed as argument
    // and if sink is called within that function chain
    for (const [caller, callees] of callGraph.entries()) {
      // Check if any callee ultimately leads to sink
      const visited = new Set();
      const queue = [...callees];

      while (queue.length > 0) {
        const func = queue.shift();
        if (visited.has(func)) continue;
        visited.add(func);

        // Check if this function uses the source variable and eventually calls sink-related code
        const funcCalls = callGraph.get(func) || [];
        queue.push(...funcCalls);

        // Simple heuristic: if function name suggests handling of the source type
        // e.g., getUserId -> uses userId, processOrder -> uses orderId
        if (func.toLowerCase().includes(sourceVar.toLowerCase().replace(/req/g, ''))) {
          // Function name suggests it handles this type of data
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if source->sink path passes through sanitization function
   * @returns {{ sanitized: boolean, sanitizer: string|null, location: object|null }}
   */
  checkSanitization(source, sink, callGraph, variableDeclarations) {
    const sanitizationPatterns = [
      { type: 'validator.js', functions: ['isEmail', 'isInt', 'isFloat', 'isURL', 'isMobilePhone', 'isUUID', 'isAlpha', 'isAlphanumeric'] },
      { type: 'express-validator', functions: ['body', 'param', 'query', 'header', 'cookie'] },
      { type: 'DOMPurify', functions: ['sanitize'] },
      { type: 'escape', functions: ['escape', 'encodeURI', 'encodeURIComponent'] },
      { type: 'custom', patterns: [/function\s+validate\w*\(/, /sanitize\w*\(/, /check\w*\(/] }
    ];

    let sanitized = false;
    let sanitizer = null;
    let location = null;

    traverse(ast, {
      CallExpression(nodePath) {
        const callee = nodePath.node.callee;
        let funcName = null;

        if (callee.type === 'Identifier') {
          funcName = callee.name;
        } else if (callee.type === 'MemberExpression') {
          // Check for obj.sanitize() pattern
          if (callee.property?.name) {
            funcName = callee.property.name;
          }
        }

        if (funcName) {
          for (const pattern of sanitizationPatterns) {
            if (pattern.functions && pattern.functions.includes(funcName)) {
              sanitized = true;
              sanitizer = `${pattern.type}.${funcName}`;
              location = {
                file: source.location?.file || '',
                line: nodePath.node.loc?.start?.line || 0
              };
              nodePath.stop();
              return;
            }
            if (pattern.patterns) {
              for (const p of pattern.patterns) {
                if (p.test(nodePath.toString())) {
                  sanitized = true;
                  sanitizer = `custom.${funcName}`;
                  location = {
                    file: source.location?.file || '',
                    line: nodePath.node.loc?.start?.line || 0
                  };
                  nodePath.stop();
                  return;
                }
              }
            }
          }
        }
      }
    });

    return { sanitized, sanitizer, location };
  }

  /**
   * Get all identified sanitization edges
   * @returns {Array} Array of { source, sink, sanitizer, location }
   */
  getSanitizationEdges() {
    const edges = [];
    for (const [key, data] of this.sanitizationEdges.entries()) {
      const [sourceIdx, sinkCode] = key.split('-');
      const source = this.sources[parseInt(sourceIdx)];
      edges.push({
        source,
        sink: { code: sinkCode },
        sanitizer: data.sanitizer,
        location: data.location
      });
    }
    return edges;
  }

  /**
   * Extract variable name from source node
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
   * Extract variable from fetch call
   */
  extractFetchVariable(nodePath) {
    const parent = nodePath.parent;
    if (parent?.type === 'AwaitExpression') {
      const grandParent = parent.parent;
      if (grandParent?.type === 'VariableDeclarator' && grandParent.id?.type === 'Identifier') {
        return grandParent.id.name;
      }
    }
    return null;
  }

  /**
   * Check if variable is used in sink
   */
  isVariableUsedInSink(variable, sink, variableDeclarations) {
    if (!variable) return false;

    // Direct usage in sink
    if (sink.code.includes(variable)) return true;

    // Check if variable is assigned to another variable used in sink
    for (const [varName, declaration] of variableDeclarations.entries()) {
      if (declaration.includes(variable)) {
        if (sink.code.includes(varName)) return true;
      }
    }

    return false;
  }

  /**
   * Get all identified sources
   */
  getSources() {
    return this.sources;
  }

  /**
   * Get source to sink mapping (with sanitization info)
   */
  getSourceToSinkMap() {
    const result = [];
    for (const [sourceIndex, sinks] of this.sourceToSinkMap.entries()) {
      const source = this.sources[sourceIndex];
      // Check if any sink has sanitization
      const sinksWithSanitization = sinks.map(sink => {
        const key = `${sourceIndex}-${sink.code}`;
        const sanitization = this.sanitizationEdges.get(key);
        return {
          ...sink,
          sanitized: sanitization?.sanitized || false,
          sanitizer: sanitization?.sanitizer || null
        };
      });
      result.push({ source, sinks: sinksWithSanitization });
    }
    return result;
  }

  /**
   * Get high-risk data flows
   */
  getRiskyFlows(minRisk = 'medium') {
    const riskLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    const minLevel = riskLevels[minRisk] || 2;

    const risky = [];
    for (const [sourceIndex, sinks] of this.sourceToSinkMap.entries()) {
      const highRiskSinks = sinks.filter(sink =>
        riskLevels[sink.risk] >= minLevel
      );

      if (highRiskSinks.length > 0) {
        risky.push({
          source: this.sources[sourceIndex],
          sinks: highRiskSinks,
          riskLevel: Math.max(...highRiskSinks.map(s => riskLevels[s.risk]))
        });
      }
    }

    return risky.sort((a, b) => b.riskLevel - a.riskLevel);
  }

  /**
   * Get complete analysis result
   */
  getAnalysisResult() {
    return {
      sources: this.sources,
      sinks: this.sinks,
      sourceToSinkMap: this.getSourceToSinkMap(),
      sanitizationEdges: this.getSanitizationEdges(),
      riskyFlows: this.getRiskyFlows(),
      summary: {
        totalSources: this.sources.length,
        totalSinks: this.sinks.length,
        riskyFlows: this.getRiskyFlows().length,
        sanitizedFlows: this.getSanitizationEdges().length
      }
    };
  }
}

module.exports = { SourceMapper };
