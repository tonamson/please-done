/**
 * Workflow Analyzer - Extracts workflow sequences from API chains and async flows
 * Phase 115: Advanced Reconnaissance
 *
 * Requirements: RECON-06
 * Decisions: D-02, D-05
 */

const fs = require('fs').promises;
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { ReconCache } = require('./recon-cache');

/**
 * Analyzes workflows from API chains and async flows
 */
class WorkflowAnalyzer {
  constructor(options = {}) {
    this.cache = options.cache || new ReconCache();
    this.workflows = [];
    this.graph = {
      nodes: new Map(),
      edges: []
    };
    this.nodeCounter = 0;
  }

  /**
   * Analyze workflows from project
   * @param {string} projectPath - Path to project root
   * @param {Object} targetInfo - Route information from target-enumerator.js
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Workflow analysis results
   */
  async analyzeWorkflows(projectPath, targetInfo, options = {}) {
    const cacheKey = this.cache.getKey(`workflows:${projectPath}`);
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      this.workflows = cached.workflows;
      this.graph = cached.graph;
      return this.getAnalysisResult();
    }

    // Find route handler files from targetInfo
    const routeFiles = this.extractRouteFiles(targetInfo);

    // Also search for workflow files
    const workflowFiles = await this.findWorkflowFiles(projectPath);

    // Combine unique files
    const allFiles = [...new Set([...routeFiles, ...workflowFiles])];

    for (const file of allFiles.slice(0, 100)) {
      try {
        await this.analyzeFile(file, targetInfo);
      } catch (err) {
        // Skip files that can't be parsed
        continue;
      }
    }

    // Analyze risks in workflows
    this.analyzeWorkflowRisks();

    const result = this.getAnalysisResult();
    await this.cache.set(cacheKey, {
      workflows: this.workflows,
      graph: {
        nodes: Array.from(this.graph.nodes.entries()),
        edges: this.graph.edges
      }
    });

    return result;
  }

  /**
   * Extract route files from targetInfo
   */
  extractRouteFiles(targetInfo) {
    if (!Array.isArray(targetInfo)) return [];

    const files = new Set();
    for (const route of targetInfo) {
      if (route.file) {
        files.add(route.file);
      }
    }
    return Array.from(files);
  }

  /**
   * Find workflow-related source files
   */
  async findWorkflowFiles(projectPath) {
    const { glob } = require('glob');

    const patterns = [
      '**/*.{js,ts,jsx,tsx}',
      '!**/node_modules/**',
      '!**/*.test.{js,ts}',
      '!**/*.spec.{js,ts}',
      '!**/dist/**',
      '!**/build/**',
      '!**/.*/**'
    ];

    const files = await glob(patterns, { cwd: projectPath, absolute: true });
    return files.slice(0, 50);
  }

  /**
   * Analyze a single file for workflows
   */
  async analyzeFile(filePath, targetInfo) {
    const code = await fs.readFile(filePath, 'utf-8');
    const ast = this.parseAST(code, filePath);

    this.extractWorkflows(ast, filePath, targetInfo);
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
   * Extract workflows from AST
   */
  extractWorkflows(ast, filePath, targetInfo) {
    const currentWorkflows = [];
    let currentWorkflow = null;

    traverse(ast, {
      // Detect route handlers (entry points)
      Function: {
        enter: (path) => {
          const routeInfo = this.isRouteHandler(path, filePath, targetInfo);
          if (routeInfo) {
            currentWorkflow = {
              id: this.generateWorkflowId(path, routeInfo),
              name: routeInfo.name || `workflow_${this.workflows.length}`,
              entryPoint: {
                type: 'route',
                path: routeInfo.path,
                method: routeInfo.method,
                file: filePath,
                line: path.node.loc?.start?.line || 0
              },
              steps: [],
              risks: [],
              async: false
            };
            currentWorkflows.push(currentWorkflow);

            // Add entry point node
            const nodeId = this.addWorkflowNode({
              type: 'entry-point',
              file: filePath,
              line: path.node.loc?.start?.line || 0,
              metadata: { route: routeInfo }
            });

            if (currentWorkflow) {
              currentWorkflow.entryNodeId = nodeId;
            }
          }
        },
        exit: (path) => {
          if (currentWorkflow && this.isRouteHandler(path, filePath, targetInfo)) {
            // Workflow complete
            currentWorkflow = null;
          }
        }
      },

      // Detect workflow steps within functions
      CallExpression: (path) => {
        const step = this.extractWorkflowStep(path, filePath);
        if (step && currentWorkflow) {
          currentWorkflow.steps.push(step);

          // Add node and edge to graph
          const nodeId = this.addWorkflowNode({
            type: step.type,
            file: filePath,
            line: step.line,
            async: step.async,
            metadata: step.metadata
          });

          step.nodeId = nodeId;

          // Connect to previous step
          const prevStep = currentWorkflow.steps[currentWorkflow.steps.length - 2];
          if (prevStep?.nodeId) {
            this.addWorkflowEdge(prevStep.nodeId, nodeId, 'sequence');
          } else if (currentWorkflow.entryNodeId) {
            this.addWorkflowEdge(currentWorkflow.entryNodeId, nodeId, 'entry');
          }
        }
      }
    });

    this.workflows.push(...currentWorkflows);
  }

  /**
   * Check if function is a route handler
   */
  isRouteHandler(path, filePath, targetInfo) {
    // Check against targetInfo routes
    if (Array.isArray(targetInfo)) {
      for (const route of targetInfo) {
        if (route.file === filePath) {
          // Check if this function is in the right location
          const line = path.node.loc?.start?.line;
          if (line && route.handlerLine === line) {
            return {
              path: route.path,
              method: route.method,
              authRequired: route.authRequired,
              name: `${route.method}_${route.path}`
            };
          }
        }
      }
    }

    // Detect Express/HTTP handler patterns
    const parent = path.parent;
    if (parent?.type === 'CallExpression') {
      const callee = parent.callee;
      if (callee?.type === 'MemberExpression') {
        const method = callee.property?.name;
        const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'options'];

        if (httpMethods.includes(method)) {
          // Extract route path from arguments
          const routePath = parent.arguments?.[0]?.value;
          if (routePath) {
            return {
              path: routePath,
              method: method.toUpperCase(),
              authRequired: false,
              name: `${method.toUpperCase()}_${routePath}`
            };
          }
        }
      }
    }

    // Detect based on function name patterns
    const funcName = path.node.id?.name ||
                    (path.parent?.id?.name) ||
                    (path.parent?.type === 'ObjectMethod' ? path.parent.key?.name : null);

    if (funcName) {
      const handlerPatterns = /(handler|controller|action|endpoint|route)$/i;
      if (handlerPatterns.test(funcName)) {
        return {
          path: `/${funcName}`,
          method: 'GET',
          authRequired: false,
          name: funcName
        };
      }
    }

    return null;
  }

  /**
   * Extract a workflow step from a call expression
   */
  extractWorkflowStep(path, filePath) {
    const { node } = path;
    const { callee } = node;
    const loc = node.loc;

    // Database operations
    if (callee?.type === 'MemberExpression') {
      const objectName = callee.object?.name;
      const methodName = callee.property?.name;

      const dbMethods = ['findOne', 'findAll', 'find', 'create', 'update', 'destroy', 'delete', 'query', 'execute', 'save'];

      if (dbMethods.includes(methodName)) {
        const isAsync = this.isAsyncContext(path);
        return {
          type: 'db-operation',
          operation: methodName,
          target: objectName,
          line: loc?.start?.line || 0,
          column: loc?.start?.column || 0,
          async: isAsync,
          metadata: {
            code: this.truncateCode(path.toString(), 80)
          }
        };
      }
    }

    // HTTP/API calls
    if (callee?.type === 'Identifier') {
      const callName = callee.name;

      // Fetch/axios patterns
      if (['fetch', 'axios', 'request', 'http', 'https'].includes(callName)) {
        return {
          type: 'api-call',
          client: callName,
          line: loc?.start?.line || 0,
          column: loc?.start?.column || 0,
          async: true,
          metadata: {
            code: this.truncateCode(path.toString(), 80)
          }
        };
      }

      // Auth checks (D-19)
      if (/auth|verify|check.*permission|isAuthenticated|requireAuth/i.test(callName)) {
        return {
          type: 'auth-check',
          function: callName,
          line: loc?.start?.line || 0,
          column: loc?.start?.column || 0,
          async: false,
          metadata: {
            code: this.truncateCode(path.toString(), 60)
          }
        };
      }

      // Validation (sanitization detection D-09)
      if (/validate|sanitize|escape|encode|schema|joi|yup|zod/i.test(callName)) {
        return {
          type: 'validation',
          function: callName,
          line: loc?.start?.line || 0,
          column: loc?.start?.column || 0,
          async: false,
          metadata: {
            code: this.truncateCode(path.toString(), 60)
          }
        };
      }
    }

    // Data sources (user input per D-07)
    if (callee?.type === 'MemberExpression') {
      const methodName = callee.property?.name;
      if (/body|query|params|headers|cookies/.test(methodName)) {
        return {
          type: 'data-source',
          source: methodName,
          line: loc?.start?.line || 0,
          column: loc?.start?.column || 0,
          async: false,
          metadata: {
            code: this.truncateCode(path.toString(), 60),
            risk: 'tainted-input'
          }
        };
      }
    }

    return null;
  }

  /**
   * Check if context is async
   */
  isAsyncContext(path) {
    // Check if wrapped in AwaitExpression
    if (path.parent?.type === 'AwaitExpression') {
      return true;
    }

    // Check if function is async
    let current = path;
    while (current) {
      if (current.node?.async) {
        return true;
      }
      current = current.parentPath;
    }

    return false;
  }

  /**
   * Add node to workflow graph
   */
  addWorkflowNode(nodeInfo) {
    this.nodeCounter++;
    const nodeId = `node_${this.nodeCounter}`;
    this.graph.nodes.set(nodeId, {
      id: nodeId,
      ...nodeInfo
    });
    return nodeId;
  }

  /**
   * Add edge to workflow graph
   */
  addWorkflowEdge(fromId, toId, edgeType, condition = null) {
    this.graph.edges.push({
      from: fromId,
      to: toId,
      type: edgeType,
      condition
    });
  }

  /**
   * Generate workflow ID
   */
  generateWorkflowId(path, routeInfo) {
    const fileName = path.node.loc?.source || 'unknown';
    const line = path.node.loc?.start?.line || 0;
    return `${fileName}_${line}_${routeInfo.path}`;
  }

  /**
   * Truncate code string for display
   */
  truncateCode(code, maxLen) {
    if (!code || code.length <= maxLen) return code;
    return code.substring(0, maxLen - 3) + '...';
  }

  /**
   * Analyze workflow risks (D-03)
   */
  analyzeWorkflowRisks() {
    for (const workflow of this.workflows) {
      const risks = [];

      // Check for missing auth (D-19: High)
      const hasAuth = workflow.steps.some(s => s.type === 'auth-check');
      const hasSensitiveOp = workflow.steps.some(s =>
        s.type === 'db-operation' || s.type === 'api-call'
      );

      if (hasSensitiveOp && !hasAuth && !workflow.entryPoint?.authRequired) {
        risks.push({
          type: 'missing-auth',
          severity: 'HIGH',
          description: 'Sensitive operations without authentication check',
          affectedSteps: workflow.steps
            .filter(s => s.type === 'db-operation' || s.type === 'api-call')
            .map(s => s.line)
        });
      }

      // Check for missing validation (D-09 related)
      const hasValidation = workflow.steps.some(s => s.type === 'validation');
      const dataSources = workflow.steps.filter(s => s.type === 'data-source');

      if (dataSources.length > 0 && !hasValidation) {
        risks.push({
          type: 'missing-validation',
          severity: 'MEDIUM',
          description: 'User input from data sources without validation',
          affectedSteps: dataSources.map(s => s.line)
        });
      }

      // Check for race conditions (D-20: Medium)
      const asyncSteps = workflow.steps.filter(s => s.async);
      if (asyncSteps.length > 1) {
        // Check if properly sequenced
        const dbOps = asyncSteps.filter(s => s.type === 'db-operation');
        if (dbOps.length > 1) {
          risks.push({
            type: 'potential-race-condition',
            severity: 'MEDIUM',
            description: 'Multiple async database operations - verify proper sequencing',
            affectedSteps: dbOps.map(s => s.line)
          });
        }
      }

      // Check for tainted data flow to sinks (D-17: Critical, D-18: Critical)
      const taintedSinks = this.findTaintedSinks(workflow);
      if (taintedSinks.length > 0) {
        risks.push({
          type: 'tainted-flow-to-sink',
          severity: 'CRITICAL',
          description: 'User input flows to sensitive operation without sanitization',
          affectedSteps: taintedSinks
        });
      }

      workflow.risks = risks;

      // Update graph with risk annotations
      for (const risk of risks) {
        for (const stepLine of risk.affectedSteps || []) {
          const step = workflow.steps.find(s => s.line === stepLine);
          if (step?.nodeId) {
            const node = this.graph.nodes.get(step.nodeId);
            if (node) {
              node.risk = risk.type;
              node.riskSeverity = risk.severity;
            }
          }
        }
      }
    }
  }

  /**
   * Find tainted data flows to sinks
   */
  findTaintedSinks(workflow) {
    const taintedLines = [];
    const dataSourceSteps = workflow.steps.filter(s => s.type === 'data-source');
    const sinkSteps = workflow.steps.filter(s =>
      s.type === 'db-operation' || s.type === 'api-call'
    );
    const validationSteps = workflow.steps.filter(s => s.type === 'validation');

    for (const dataStep of dataSourceSteps) {
      const dataLine = dataStep.line;
      const hasValidationBefore = validationSteps.some(v => v.line > dataLine);

      if (!hasValidationBefore) {
        for (const sinkStep of sinkSteps) {
          if (sinkStep.line > dataLine) {
            taintedLines.push(sinkStep.line);
          }
        }
      }
    }

    return taintedLines;
  }

  /**
   * Build workflow graph (for external consumption)
   */
  buildWorkflowGraph() {
    const nodes = {};
    for (const [id, node] of this.graph.nodes) {
      nodes[id] = node;
    }

    return {
      nodes,
      edges: this.graph.edges
    };
  }

  /**
   * Get analysis result
   */
  getAnalysisResult() {
    const graph = this.buildWorkflowGraph();

    // Calculate risk distribution
    const riskDistribution = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    for (const workflow of this.workflows) {
      for (const risk of workflow.risks) {
        riskDistribution[risk.severity.toLowerCase()]++;
      }
    }

    // Generate JSON workflow descriptions with risk annotations (D-04)
    const workflowDescriptions = this.workflows.map(w => ({
      id: w.id,
      name: w.name,
      entryPoint: w.entryPoint,
      steps: w.steps.map(s => ({
        type: s.type,
        operation: s.operation || s.function || s.source,
        line: s.line,
        async: s.async
      })),
      risks: w.risks,
      riskCount: w.risks.length
    }));

    return {
      workflows: this.workflows,
      workflowCount: this.workflows.length,
      workflowDescriptions,
      graph,
      riskDistribution,
      summary: {
        totalWorkflows: this.workflows.length,
        workflowsWithRisks: this.workflows.filter(w => w.risks.length > 0).length,
        criticalRisks: riskDistribution.critical,
        highRisks: riskDistribution.high,
        mediumRisks: riskDistribution.medium,
        dbOperations: this.countStepsByType('db-operation'),
        apiCalls: this.countStepsByType('api-call'),
        authChecks: this.countStepsByType('auth-check'),
        validations: this.countStepsByType('validation')
      }
    };
  }

  /**
   * Count steps by type across all workflows
   */
  countStepsByType(stepType) {
    let count = 0;
    for (const workflow of this.workflows) {
      count += workflow.steps.filter(s => s.type === stepType).length;
    }
    return count;
  }

  /**
   * Get workflows with specific risk type
   */
  getWorkflowsByRisk(riskType) {
    return this.workflows.filter(w =>
      w.risks.some(r => r.type === riskType)
    );
  }

  /**
   * Get workflows by entry method
   */
  getWorkflowsByMethod(method) {
    return this.workflows.filter(w =>
      w.entryPoint?.method?.toUpperCase() === method.toUpperCase()
    );
  }

  /**
   * Extract workflows from API chains
   */
  extractWorkflowsFromAPIChains(ast, filePath) {
    const chains = [];

    traverse(ast, {
      CallExpression: (path) => {
        const chain = this.extractPromiseChain(path);
        if (chain && chain.length > 1) {
          chains.push({
            file: filePath,
            chain
          });
        }
      }
    });

    return chains;
  }

  /**
   * Extract promise chain
   */
  extractPromiseChain(path) {
    const chain = [];
    let current = path;

    // Walk up the chain
    while (current && current.node?.type === 'CallExpression') {
      const step = this.extractWorkflowStep(current, path.node.loc?.source);
      if (step) {
        chain.unshift(step);
      }

      // Check for .then() or .catch()
      if (current.parent?.type === 'MemberExpression') {
        current = current.parentPath?.parentPath;
      } else {
        break;
      }
    }

    return chain.length > 0 ? chain : null;
  }
}

// Export module
module.exports = {
  WorkflowAnalyzer,
  extractWorkflows: async (projectPath, targetInfo, options) => {
    const analyzer = new WorkflowAnalyzer(options);
    const result = await analyzer.analyzeWorkflows(projectPath, targetInfo, options);
    return result.workflows;
  },
  buildWorkflowGraph: async (projectPath, targetInfo, options) => {
    const analyzer = new WorkflowAnalyzer(options);
    const result = await analyzer.analyzeWorkflows(projectPath, targetInfo, options);
    return result.graph;
  }
};
