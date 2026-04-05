/**
 * Workflow Mapper - State machine detection and business logic flaw analysis
 * Phase 115: Advanced Reconnaissance (RECON-06)
 */

const fs = require('fs').promises;
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { ReconCache } = require('./recon-cache');

/**
 * Maps workflow state machines from route handler chains
 * Detects business logic flaws: TOCTOU, WORKFLOW_BYPASS, PARAMETER_TAMPERING
 */
class WorkflowMapper {
  constructor(options = {}) {
    this.cache = options.cache || new ReconCache();
    this.workflows = { states: [], transitions: [] };
    this.flaws = [];
  }

  /**
   * Analyze a file for workflow state machines and business logic flaws
   * @param {string} filePath - Path to JavaScript/TypeScript file
   * @returns {Promise<Object>} Analysis results with workflows and flaws
   */
  async analyze(filePath) {
    const cacheKey = this.cache.getKey(`workflow:${filePath}`);
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const code = await fs.readFile(filePath, 'utf-8');
    const ast = this.parseAST(code, filePath);

    const states = [];
    const transitions = [];
    this.detectStateMachine(ast, filePath, states, transitions);
    this.workflows = { states, transitions };

    this.flaws = this.detectBusinessLogicFlaws(ast, filePath);

    const result = {
      workflows: this.workflows,
      flaws: this.flaws,
      filePath
    };

    await this.cache.set(cacheKey, result);
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
   * Detect state machine from route handler AST
   * Express/Fastify/Koa pattern: app.get('/path', middleware1, middleware2, handler)
   */
  detectStateMachine(ast, filePath, states, transitions) {
    const stateMap = new Map();
    let stateIdCounter = 0;

    // Track route patterns: app.get, app.post, etc.
    const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];

    traverse(ast, {
      CallExpression(nodePath) {
        const { callee } = nodePath.node;

        // Check for app.METHOD pattern (Express/Fastify)
        if (
          callee.type === 'MemberExpression' &&
          callee.property.type === 'Identifier' &&
          httpMethods.includes(callee.property.name)
        ) {
          const args = nodePath.node.arguments;
          if (args.length < 2) return;

          // Extract route path from first argument
          const routePath = args[0]?.value || '/';
          const method = callee.property.name.toUpperCase();

          // Extract middleware/handler chain from remaining arguments
          const handlers = args.slice(1).map((arg, idx) => {
            let handlerName = 'anonymous';
            let handlerType = 'action';

            if (arg.type === 'Identifier') {
              handlerName = arg.name;
            } else if (arg.type === 'MemberExpression') {
              handlerName = nodePath.scope.getBinding(arg.object.name)?.path?.node?.id?.name || arg.toString();
            }

            // Classify handler type
            const lname = handlerName.toLowerCase();
            if (lname.includes('auth') || lname.includes('valid') || lname.includes('check') || lname.includes('guard')) {
              handlerType = 'guard';
            } else if (lname.includes('render') || lname.includes('redirect') || lname.includes('send') || lname.includes('json')) {
              handlerType = 'transition';
            } else {
              handlerType = 'action';
            }

            return { id: `state_${stateIdCounter++}`, name: handlerName, type: handlerType };
          });

          // Add states for unique handlers
          handlers.forEach(h => {
            if (!stateMap.has(h.name)) {
              stateMap.set(h.name, h);
              states.push(h);
            }
          });

          // Create transitions between adjacent handlers
          for (let i = 0; i < handlers.length - 1; i++) {
            const from = handlers[i];
            const to = handlers[i + 1];
            transitions.push({
              from: from.id,
              to: to.id,
              trigger: `${method} ${routePath}`,
              type: to.type
            });
          }
        }

        // Check for router.METHOD pattern (only if not already matched as app.METHOD)
        else if (
          callee.type === 'MemberExpression' &&
          callee.property.type === 'Identifier' &&
          httpMethods.includes(callee.property.name) &&
          callee.object.type === 'Identifier'
        ) {
          const routerName = callee.object.name;
          const args = nodePath.node.arguments;
          if (args.length < 2) return;

          const routePath = args[0]?.value || '/';
          const method = callee.property.name.toUpperCase();

          const handlers = args.slice(1).map((arg) => {
            let handlerName = 'anonymous';
            let handlerType = 'action';

            if (arg.type === 'Identifier') {
              handlerName = arg.name;
            }

            const lname = handlerName.toLowerCase();
            if (lname.includes('auth') || lname.includes('valid') || lname.includes('check') || lname.includes('guard')) {
              handlerType = 'guard';
            } else if (lname.includes('render') || lname.includes('redirect') || lname.includes('send') || lname.includes('json')) {
              handlerType = 'transition';
            } else {
              handlerType = 'action';
            }

            return { id: `state_${stateIdCounter++}`, name: handlerName, type: handlerType };
          });

          handlers.forEach(h => {
            if (!stateMap.has(h.name)) {
              stateMap.set(h.name, h);
              states.push(h);
            }
          });

          for (let i = 0; i < handlers.length - 1; i++) {
            const from = handlers[i];
            const to = handlers[i + 1];
            transitions.push({
              from: from.id,
              to: to.id,
              trigger: `${method} ${routePath}`,
              type: to.type
            });
          }
        }
      }
    });
  }

  /**
   * Detect business logic flaws from AST
   * Implements OWASP BLA1/BLA2 patterns
   */
  detectBusinessLogicFlaws(ast, filePath) {
    const flaws = [];

    // BLA1-2025: TOCTOU - Time-of-Check to Time-of-Use
    // Pattern: if(check) { ... action without re-validation }
    this.detectTOCTOU(ast, filePath, flaws);

    // BLA2-2025: WORKFLOW_BYPASS - Missing state validation
    // Pattern: !state or missing state validation before critical action
    this.detectWorkflowBypass(ast, filePath, flaws);

    // PARAM-TAMPER: Parameter tampering
    // Pattern: req.body.X = req.query.Y without validation
    this.detectParameterTampering(ast, filePath, flaws);

    return flaws;
  }

  /**
   * Detect TOCTOU (Time-of-Check to Time-of-Use) vulnerabilities
   * BLA1-2025: Check performed, but action happens without re-validation
   */
  detectTOCTOU(ast, filePath, flaws) {
    traverse(ast, {
      IfStatement(nodePath) {
        const test = nodePath.node.test;
        const consequent = nodePath.node.consequent;

        // Check if condition involves a validation/check pattern
        const testCode = nodePath.get('test').toString() || '';
        const hasCheckPattern = /balance|permission|auth|valid|check|exists|available/.test(testCode);

        if (!hasCheckPattern) return;

        // Look for database mutations in consequent without re-validation
        const consequentCode = nodePath.get('consequent').toString() || '';

        // Patterns indicating mutations after check
        const mutationPatterns = [
          /UPDATE\s+\w+\s+SET/i,
          /DELETE\s+FROM/i,
          /INSERT\s+INTO/i,
          /\$\.query/,
          /\.execute\s*\(/,
          /db\./,
          /await\s+\w+\.(query|execute|insert|update|delete)/i
        ];

        const hasMutation = mutationPatterns.some(p => p.test(consequentCode));
        const hasRevalidation = /re-?check|re-?valid|again|second|verify/.test(consequentCode);

        if (hasMutation && !hasRevalidation) {
          const loc = nodePath.node.loc;
          flaws.push({
            id: 'BLA1-2025',
            type: 'TOCTOU',
            severity: 'HIGH',
            location: {
              file: filePath,
              line: loc?.start?.line || 0
            },
            description: `Potential TOCTOU: validation in if(${testCode.slice(0, 30)}...) without re-validation before database mutation`
          });
        }
      }
    });
  }

  /**
   * Detect Workflow Bypass vulnerabilities
   * BLA2-2025: Missing state validation before critical action
   */
  detectWorkflowBypass(ast, filePath, flaws) {
    // Pattern 1: Missing auth/state check before critical operation
    traverse(ast, {
      CallExpression(nodePath) {
        const code = nodePath.toString();
        const loc = nodePath.node.loc;

        // Critical operations that need state validation
        const criticalOps = [
          /DELETE\s+FROM/i,
          /DROP\s+TABLE/i,
          /DROP\s+DATABASE/i,
          /TRUNCATE/i,
          /\.delete\s*\(/,
          /rm\s*[\(-]/,
          /unlink\s*\(/,
          /process\.exit/
        ];

        const isCritical = criticalOps.some(p => p.test(code));

        if (!isCritical) return;

        // Check if there's an if statement guarding this before it
        let hasGuard = false;
        let current = nodePath.parent;

        while (current) {
          if (current.node?.type === 'IfStatement') {
            const testCode = current.node.test?.toString() || '';
            if (/user|auth|admin|permission|role|state|valid|check/.test(testCode)) {
              hasGuard = true;
              break;
            }
          }
          if (current.node?.type === 'FunctionDeclaration' || current.node?.type === 'FunctionExpression') {
            break;
          }
          current = current.parent;
        }

        if (!hasGuard) {
          flaws.push({
            id: 'BLA2-2025',
            type: 'WORKFLOW_BYPASS',
            severity: 'CRITICAL',
            location: {
              file: filePath,
              line: loc?.start?.line || 0
            },
            description: `Critical operation ${code.slice(0, 40)}... lacks state validation guard`
          });
        }
      }
    });

    // Pattern 2: Check for role-based access without proper enforcement
    traverse(ast, {
      ConditionalExpression(nodePath) {
        const code = nodePath.toString();
        const loc = nodePath.node.loc;

        // Check for missing role validation patterns
        if (/isAdmin|isUser|hasRole|hasPermission/.test(code)) {
          // Look for usage without proper validation
          const parent = nodePath.parent;
          if (parent?.type !== 'IfStatement' && parent?.type !== 'ConditionalExpression') {
            flaws.push({
              id: 'BLA2-2025',
              type: 'WORKFLOW_BYPASS',
              severity: 'HIGH',
              location: {
                file: filePath,
                line: loc?.start?.line || 0
              },
              description: `Role/permission check result used without proper conditional enforcement`
            });
          }
        }
      }
    });
  }

  /**
   * Detect Parameter Tampering vulnerabilities
   * Pattern: Direct assignment from req.query to req.body without validation
   */
  detectParameterTampering(ast, filePath, flaws) {
    traverse(ast, {
      AssignmentExpression(nodePath) {
        const code = nodePath.toString();
        const loc = nodePath.node.loc;

        // Pattern: req.body.X = req.query.Y or req.body.X = req.params.Y
        const paramTamperingPattern = /req\.body\.\w+\s*=\s*req\.(query|params|headers)/;

        if (paramTamperingPattern.test(code)) {
          // Check if there's validation between assignment and usage
          let hasValidation = false;
          let current = nodePath.parent;

          while (current) {
            if (current.node?.type === 'IfStatement') {
              const testCode = current.node.test?.toString() || '';
              if (/valid|sanitize|encode|check|test/.test(testCode)) {
                hasValidation = true;
                break;
              }
            }
            if (current.node?.type === 'FunctionDeclaration') break;
            current = current.parent;
          }

          if (!hasValidation) {
            flaws.push({
              id: 'PARAM-TAMPER',
              type: 'PARAMETER_TAMPERING',
              severity: 'MEDIUM',
              location: {
                file: filePath,
                line: loc?.start?.line || 0
              },
              description: `Unvalidated parameter assignment: ${code.slice(0, 50)} - attacker-controlled input flows directly to storage`
            });
          }
        }
      }
    });
  }

  /**
   * Generate Mermaid stateDiagram-v2 from workflow data
   * @param {Object} workflows - { states: [], transitions: [] }
   * @returns {string} Mermaid stateDiagram-v2 markup
   */
  generateStateMachineDiagram(workflows) {
    if (!workflows || !workflows.states || workflows.states.length === 0) {
      return 'stateDiagram-v2\n    [*] --> NoRoutesFound';
    }

    const lines = ['stateDiagram-v2'];

    // Group states by type
    const guards = workflows.states.filter(s => s.type === 'guard');
    const actions = workflows.states.filter(s => s.type === 'action');
    const transitions = workflows.states.filter(s => s.type === 'transition');

    // Add transition states (render/redirect/send) inline
    const inlineStates = transitions.slice(0, 5);

    if (guards.length > 0) {
      lines.push('  state "Guards" {');
      guards.forEach(state => {
        const label = this.sanitizeLabel(state.name);
        lines.push(`    [*] --> ${label}`);
      });
      lines.push('  }');
    }

    if (actions.length > 0) {
      lines.push('  state "Actions" {');
      actions.forEach(state => {
        const label = this.sanitizeLabel(state.name);
        lines.push(`    [*] --> ${label}`);
      });
      lines.push('  }');
    }

    // Add transitions
    const seen = new Set();
    workflows.transitions.forEach(t => {
      const key = `${t.from}-->${t.to}`;
      if (!seen.has(key)) {
        seen.add(key);
        const fromLabel = workflows.states.find(s => s.id === t.from)?.name || t.from;
        const toLabel = workflows.states.find(s => s.id === t.to)?.name || t.to;
        lines.push(`${this.sanitizeLabel(fromLabel)} --> ${this.sanitizeLabel(toLabel)} : ${t.trigger}`);
      }
    });

    return lines.join('\n');
  }

  /**
   * Sanitize label for Mermaid diagram
   */
  sanitizeLabel(text) {
    if (!text) return '';
    return text
      .replace(/</g, 'less than')
      .replace(/>/g, 'greater than')
      .replace(/&/g, 'and')
      .replace(/"/g, "'")
      .replace(/\\/g, '/')
      .replace(/\n/g, ' ')
      .trim();
  }
}

module.exports = { WorkflowMapper };
