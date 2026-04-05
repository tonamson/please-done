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
    this.sourceToSinkMap = this.mapSourcesToSinks(ast);

    const result = this.getAnalysisResult();
    await this.cache.set(cacheKey, {
      sources: this.sources,
      sinks: this.sinks,
      sourceToSinkMap: Array.from(this.sourceToSinkMap.entries())
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
      MemberExpression(nodePath) {
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

      CallExpression(nodePath) {
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
      CallExpression(nodePath) {
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

      AssignmentExpression(nodePath) {
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
   * Map sources to their sinks through taint analysis
   */
  mapSourcesToSinks(ast) {
    const sourceToSink = new Map();
    const variableDeclarations = new Map();

    // Track variable assignments
    traverse(ast, {
      VariableDeclarator(nodePath) {
        const { id, init } = nodePath.node;
        if (id.type === 'Identifier' && init) {
          variableDeclarations.set(id.name, nodePath.toString());
        }
      }
    });

    // Simple taint tracking
    this.sources.forEach((source, index) => {
      const variable = source.variable;
      if (variable) {
        const affectedSinks = this.sinks.filter(sink =>
          sink.code.includes(variable) ||
          this.isVariableUsedInSink(variable, sink, variableDeclarations)
        );

        if (affectedSinks.length > 0) {
          sourceToSink.set(index, affectedSinks);
        }
      }
    });

    return sourceToSink;
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
   * Get source to sink mapping
   */
  getSourceToSinkMap() {
    const result = [];
    for (const [sourceIndex, sinks] of this.sourceToSinkMap.entries()) {
      result.push({
        source: this.sources[sourceIndex],
        sinks
      });
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
      riskyFlows: this.getRiskyFlows(),
      summary: {
        totalSources: this.sources.length,
        totalSinks: this.sinks.length,
        riskyFlows: this.getRiskyFlows().length
      }
    };
  }
}

module.exports = { SourceMapper };
