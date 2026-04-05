/**
 * Business Logic Mapper - Detects state machines and identifies business logic flaws
 * Phase 115: Advanced Reconnaissance
 *
 * Requirements: RECON-06
 * Decisions: D-01, D-03, D-04, D-17-D-21
 */

const fs = require('fs').promises;
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { ReconCache } = require('./recon-cache');

/**
 * Detects state machines and identifies business logic flaws
 */
class BusinessLogicMapper {
  constructor(options = {}) {
    this.cache = options.cache || new ReconCache();
    this.stateMachines = [];
    this.logicFlaws = [];
  }

  /**
   * Analyze project for state machines and business logic flaws
   * @param {string} projectPath - Path to project root
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis results
   */
  async analyze(projectPath, options = {}) {
    const cacheKey = this.cache.getKey(`business-logic:${projectPath}`);
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      this.stateMachines = cached.stateMachines;
      this.logicFlaws = cached.logicFlaws;
      return this.getAnalysisResult();
    }

    const files = await this.findSourceFiles(projectPath);

    for (const file of files) {
      try {
        await this.analyzeFile(file);
      } catch (err) {
        // Skip files that can't be parsed
        continue;
      }
    }

    // Analyze business logic flaws
    this.analyzeLogicFlaws();

    const result = this.getAnalysisResult();
    await this.cache.set(cacheKey, {
      stateMachines: this.stateMachines,
      logicFlaws: this.logicFlaws
    });

    return result;
  }

  /**
   * Find source files to analyze
   */
  async findSourceFiles(projectPath) {
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
    return files.slice(0, 100);
  }

  /**
   * Analyze a single file for state machines
   */
  async analyzeFile(filePath) {
    const code = await fs.readFile(filePath, 'utf-8');
    const ast = this.parseAST(code, filePath);

    this.detectStateMachines(ast, filePath);
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
   * Detect state machines from various patterns (D-01)
   */
  detectStateMachines(ast, filePath) {
    const stateMachines = [];

    traverse(ast, {
      // React useState pattern
      CallExpression: (path) => {
        const sm = this.detectReactUseState(path, filePath);
        if (sm) stateMachines.push(sm);

        const xstateSm = this.detectXStateMachine(path, filePath);
        if (xstateSm) stateMachines.push(xstateSm);

        const piniaSm = this.detectPiniaStore(path, filePath);
        if (piniaSm) stateMachines.push(piniaSm);
      },

      // Redux reducer and manual state enum patterns
      FunctionDeclaration: (path) => {
        const reduxSm = this.detectReduxReducer(path, filePath);
        if (reduxSm) stateMachines.push(reduxSm);
      },

      FunctionExpression: (path) => {
        const reduxSm = this.detectReduxReducer(path, filePath);
        if (reduxSm) stateMachines.push(reduxSm);
      },

      ArrowFunctionExpression: (path) => {
        const reduxSm = this.detectReduxReducer(path, filePath);
        if (reduxSm) stateMachines.push(reduxSm);
      },

      // Vuex store pattern
      ObjectExpression: (path) => {
        const vuexSm = this.detectVuexStore(path, filePath);
        if (vuexSm) stateMachines.push(vuexSm);
      },

      // Manual state enum pattern
      VariableDeclarator: (path) => {
        const enumSm = this.detectManualStateEnum(path, filePath);
        if (enumSm) stateMachines.push(enumSm);
      }
    });

    this.stateMachines.push(...stateMachines);
  }

  /**
   * Detect React useState pattern
   * Pattern: const [state, setState] = useState(initial)
   */
  detectReactUseState(path, filePath) {
    const { node } = path;

    if (node.callee?.name !== 'useState') {
      return null;
    }

    const parent = path.parent;
    if (parent?.type !== 'VariableDeclarator') {
      return null;
    }

    // Check for array destructuring pattern
    if (parent.id?.type !== 'ArrayPattern' || parent.id.elements.length < 2) {
      return null;
    }

    const stateVariable = parent.id.elements[0]?.name;
    const setterFunction = parent.id.elements[1]?.name;
    const initialValue = node.arguments[0];

    // Extract states from initial value if it's a string literal (enum pattern)
    const states = this.extractReactStates(initialValue, stateVariable);
    const transitions = this.extractReactTransitions(setterFunction, states);

    const loc = node.loc;

    return {
      name: `${stateVariable}State`,
      type: 'react-useState',
      states,
      transitions,
      location: {
        file: filePath,
        line: loc?.start?.line || 0,
        column: loc?.start?.column || 0
      },
      metadata: {
        stateVariable,
        setterFunction,
        initialValue: this.getInitialValueString(initialValue)
      }
    };
  }

  /**
   * Extract states from React useState initial value
   */
  extractReactStates(initialValue, stateVariable) {
    const states = [];

    // If initial value is a string, treat it as a state
    if (initialValue?.type === 'StringLiteral') {
      states.push({
        name: initialValue.value,
        isInitial: true,
        isFinal: false
      });
    } else {
      // Default state
      states.push({
        name: 'initial',
        isInitial: true,
        isFinal: false
      });
    }

    // Common state patterns based on variable name
    const commonStates = this.inferStatesFromVariableName(stateVariable);
    for (const stateName of commonStates) {
      if (!states.find(s => s.name === stateName)) {
        states.push({
          name: stateName,
          isInitial: false,
          isFinal: stateName === 'success' || stateName === 'error'
        });
      }
    }

    return states;
  }

  /**
   * Infer common states from variable name
   */
  inferStatesFromVariableName(variableName) {
    const patterns = {
      status: ['idle', 'loading', 'success', 'error'],
      state: ['active', 'inactive', 'pending'],
      mode: ['edit', 'view', 'create'],
      step: ['step1', 'step2', 'step3', 'complete']
    };

    for (const [key, states] of Object.entries(patterns)) {
      if (variableName?.toLowerCase().includes(key)) {
        return states;
      }
    }

    return ['idle', 'active', 'complete'];
  }

  /**
   * Extract transitions for React useState
   */
  extractReactTransitions(setterFunction, states) {
    const transitions = [];

    // Generate potential transitions between states
    for (let i = 0; i < states.length - 1; i++) {
      transitions.push({
        from: states[i].name,
        to: states[i + 1].name,
        event: `${setterFunction}`,
        type: 'react-setState'
      });
    }

    return transitions;
  }

  /**
   * Detect Redux reducer pattern
   * Pattern: function reducer(state, action) { switch(action.type) {...} }
   */
  detectReduxReducer(path, filePath) {
    const { node } = path;

    // Check for state and action parameters
    const params = node.params;
    if (params.length < 2) return null;

    const hasStateParam = params[0]?.name === 'state';
    const hasActionParam = params[1]?.name === 'action';

    if (!hasStateParam || !hasActionParam) return null;

    // Check for switch statement on action.type
    const body = node.body;
    if (body?.type !== 'BlockStatement') return null;

    const hasSwitchOnActionType = body.body?.some(stmt =>
      stmt.type === 'SwitchStatement' &&
      stmt.discriminant?.type === 'MemberExpression' &&
      stmt.discriminant.object?.name === 'action' &&
      stmt.discriminant.property?.name === 'type'
    );

    if (!hasSwitchOnActionType) return null;

    // Extract reducer name
    let reducerName = 'anonymousReducer';
    if (path.parent?.type === 'VariableDeclarator' && path.parent.id?.name) {
      reducerName = path.parent.id.name;
    } else if (node.id?.name) {
      reducerName = node.id.name;
    }

    const loc = node.loc;

    // Extract states from switch cases
    const states = this.extractReduxStates(body);
    const transitions = this.extractReduxTransitions(body, states);

    return {
      name: reducerName,
      type: 'redux-reducer',
      states,
      transitions,
      location: {
        file: filePath,
        line: loc?.start?.line || 0,
        column: loc?.start?.column || 0
      },
      metadata: {
        actions: transitions.map(t => t.event).filter((v, i, a) => a.indexOf(v) === i)
      }
    };
  }

  /**
   * Extract states from Redux reducer
   */
  extractReduxStates(body) {
    const states = [];
    const stateNames = new Set();

    // Look at default parameter value for initial state
    const func = body;
    if (func?.type === 'BlockStatement') {
      // Try to extract from return statements in switch cases
      traverse(func, {
        ReturnStatement: (path) => {
          const returnValue = path.node.argument;
          if (returnValue?.type === 'ObjectExpression') {
            // Extract state property if present
            const stateProp = returnValue.properties?.find(
              p => p.key?.name === 'status' || p.key?.name === 'state'
            );
            if (stateProp?.value?.type === 'StringLiteral') {
              stateNames.add(stateProp.value.value);
            }
          }
        }
      }, { noScope: true });
    }

    // Add default states
    const defaultStates = ['initial', 'loading', 'success', 'error'];
    for (const state of defaultStates) {
      stateNames.add(state);
    }

    let isFirst = true;
    for (const name of stateNames) {
      states.push({
        name,
        isInitial: isFirst,
        isFinal: name === 'success' || name === 'error'
      });
      isFirst = false;
    }

    return states;
  }

  /**
   * Extract transitions from Redux reducer
   */
  extractReduxTransitions(body, states) {
    const transitions = [];

    traverse(body, {
      SwitchCase: (path) => {
        const actionType = path.node.test?.value;
        if (!actionType) return;

        // Look for state transitions in case body
        path.node.consequent.forEach(stmt => {
          if (stmt.type === 'ReturnStatement') {
            transitions.push({
              from: '*',
              to: actionType.toLowerCase().replace(/_/g, '-'),
              event: actionType,
              type: 'redux-action'
            });
          }
        });
      }
    }, { noScope: true });

    return transitions;
  }

  /**
   * Detect XState machine pattern
   * Pattern: createMachine({...}) or Machine({...})
   */
  detectXStateMachine(path, filePath) {
    const { node } = path;

    const calleeName = node.callee?.name;
    if (calleeName !== 'createMachine' && calleeName !== 'Machine') {
      return null;
    }

    const configArg = node.arguments[0];
    if (!configArg || configArg.type !== 'ObjectExpression') {
      return null;
    }

    // Extract machine config
    const machineId = this.extractPropertyValue(configArg, 'id') || 'unnamed';
    const initialState = this.extractPropertyValue(configArg, 'initial');
    const statesConfig = this.extractPropertyObject(configArg, 'states');

    const states = [];
    const transitions = [];

    if (statesConfig) {
      for (const prop of statesConfig.properties || []) {
        const stateName = prop.key?.name || prop.key?.value;
        if (!stateName) continue;

        const isInitial = stateName === initialState;
        const hasOn = prop.value?.properties?.some(p => p.key?.name === 'on');
        const isFinal = !hasOn && prop.value?.type === 'ObjectExpression';

        states.push({ name: stateName, isInitial, isFinal });

        // Extract transitions
        const onProp = prop.value?.properties?.find(p => p.key?.name === 'on');
        if (onProp?.value?.properties) {
          for (const transProp of onProp.value.properties) {
            const event = transProp.key?.name || transProp.key?.value;
            const target = transProp.value?.value || transProp.value?.properties?.find(
              p => p.key?.name === 'target'
            )?.value?.value;

            if (event && target) {
              transitions.push({
                from: stateName,
                to: target,
                event,
                type: 'xstate-transition'
              });
            }
          }
        }
      }
    }

    const loc = node.loc;

    return {
      name: machineId,
      type: 'xstate-machine',
      states,
      transitions,
      location: {
        file: filePath,
        line: loc?.start?.line || 0,
        column: loc?.start?.column || 0
      },
      metadata: {
        initial: initialState,
        framework: 'xstate'
      }
    };
  }

  /**
   * Detect Vuex store pattern
   * Pattern: { state: {...}, mutations: {...}, actions: {...} }
   */
  detectVuexStore(path, filePath) {
    const { node } = path;

    const hasState = node.properties?.some(p => p.key?.name === 'state');
    const hasMutations = node.properties?.some(p => p.key?.name === 'mutations');
    const hasActions = node.properties?.some(p => p.key?.name === 'actions');

    // Require at least state + mutations for Vuex pattern
    if (!hasState || !hasMutations) return null;

    // Get store name from parent variable
    let storeName = 'vuexStore';
    if (path.parent?.type === 'VariableDeclarator' && path.parent.id?.name) {
      storeName = path.parent.id.name;
    }

    const loc = node.loc;

    // Extract states from state object
    const stateObj = node.properties?.find(p => p.key?.name === 'state')?.value;
    const states = this.extractVuexStates(stateObj);
    const transitions = this.extractVuexTransitions(
      node.properties?.find(p => p.key?.name === 'mutations')?.value
    );

    return {
      name: storeName,
      type: 'vuex-store',
      states,
      transitions,
      location: {
        file: filePath,
        line: loc?.start?.line || 0,
        column: loc?.start?.column || 0
      },
      metadata: {
        hasActions,
        hasGetters: node.properties?.some(p => p.key?.name === 'getters')
      }
    };
  }

  /**
   * Extract Vuex states
   */
  extractVuexStates(stateObj) {
    const states = [];
    if (!stateObj || stateObj.type !== 'ObjectExpression') {
      return [{ name: 'default', isInitial: true, isFinal: false }];
    }

    // If state is a function (Vuex module pattern)
    if (stateObj.type === 'FunctionExpression' || stateObj.type === 'ArrowFunctionExpression') {
      return [{ name: 'default', isInitial: true, isFinal: false }];
    }

    let isFirst = true;
    for (const prop of stateObj.properties || []) {
      const stateName = prop.key?.name || prop.key?.value;
      if (stateName) {
        states.push({
          name: stateName,
          isInitial: isFirst,
          isFinal: false
        });
        isFirst = false;
      }
    }

    return states.length > 0 ? states : [{ name: 'default', isInitial: true, isFinal: false }];
  }

  /**
   * Extract Vuex transitions from mutations
   */
  extractVuexTransitions(mutationsObj) {
    const transitions = [];
    if (!mutationsObj || mutationsObj.type !== 'ObjectExpression') {
      return transitions;
    }

    for (const prop of mutationsObj.properties || []) {
      const mutationName = prop.key?.name || prop.key?.value;
      if (mutationName) {
        transitions.push({
          from: '*',
          to: mutationName,
          event: mutationName,
          type: 'vuex-mutation'
        });
      }
    }

    return transitions;
  }

  /**
   * Detect Pinia store pattern
   * Pattern: defineStore('id', { state: () => ({...}), actions: {...} })
   */
  detectPiniaStore(path, filePath) {
    const { node } = path;

    if (node.callee?.name !== 'defineStore') {
      return null;
    }

    const storeId = node.arguments[0]?.value || 'unnamed';
    const storeConfig = node.arguments[1];

    if (!storeConfig || storeConfig.type !== 'ObjectExpression') {
      return null;
    }

    const loc = node.loc;

    // Extract state
    const stateFn = storeConfig.properties?.find(p => p.key?.name === 'state')?.value;
    const states = [{ name: 'default', isInitial: true, isFinal: false }];

    // Extract actions as transitions
    const actionsObj = storeConfig.properties?.find(p => p.key?.name === 'actions')?.value;
    const transitions = [];

    if (actionsObj?.type === 'ObjectExpression') {
      for (const prop of actionsObj.properties || []) {
        const actionName = prop.key?.name;
        if (actionName) {
          transitions.push({
            from: '*',
            to: actionName,
            event: actionName,
            type: 'pinia-action'
          });
        }
      }
    }

    return {
      name: storeId,
      type: 'pinia-store',
      states,
      transitions,
      location: {
        file: filePath,
        line: loc?.start?.line || 0,
        column: loc?.start?.column || 0
      },
      metadata: {
        framework: 'pinia'
      }
    };
  }

  /**
   * Detect manual state enum pattern
   * Pattern: const STATUS = { PENDING: 'pending', DONE: 'done' }
   */
  detectManualStateEnum(path, filePath) {
    const { node } = path;

    const varName = node.id?.name || '';
    const isStateNamed = /(state|status|step|phase|mode)$/i.test(varName);

    if (!isStateNamed) return null;

    // Check if init is an object or array literal
    if (node.init?.type !== 'ObjectExpression' && node.init?.type !== 'ArrayExpression') {
      return null;
    }

    const loc = node.loc;
    const states = [];

    if (node.init.type === 'ObjectExpression') {
      let isFirst = true;
      for (const prop of node.init.properties || []) {
        const stateName = prop.value?.value || prop.key?.name;
        if (stateName) {
          states.push({
            name: String(stateName),
            isInitial: isFirst,
            isFinal: false
          });
          isFirst = false;
        }
      }
    } else if (node.init.type === 'ArrayExpression') {
      let isFirst = true;
      for (const elem of node.init.elements || []) {
        if (elem?.value) {
          states.push({
            name: String(elem.value),
            isInitial: isFirst,
            isFinal: false
          });
          isFirst = false;
        }
      }
    }

    if (states.length < 2) return null;

    // Mark last state as final
    states[states.length - 1].isFinal = true;

    // Generate transitions
    const transitions = [];
    for (let i = 0; i < states.length - 1; i++) {
      transitions.push({
        from: states[i].name,
        to: states[i + 1].name,
        event: 'transition',
        type: 'manual-enum'
      });
    }

    return {
      name: varName,
      type: 'manual-enum',
      states,
      transitions,
      location: {
        file: filePath,
        line: loc?.start?.line || 0,
        column: loc?.start?.column || 0
      },
      metadata: {
        isConst: path.parent?.kind === 'const'
      }
    };
  }

  /**
   * Extract property value from object
   */
  extractPropertyValue(obj, propName) {
    const prop = obj.properties?.find(p => p.key?.name === propName);
    return prop?.value?.value;
  }

  /**
   * Extract property object from object
   */
  extractPropertyObject(obj, propName) {
    const prop = obj.properties?.find(p => p.key?.name === propName);
    return prop?.value;
  }

  /**
   * Get initial value as string
   */
  getInitialValueString(node) {
    if (!node) return 'undefined';
    if (node.type === 'StringLiteral') return node.value;
    if (node.type === 'NumericLiteral') return String(node.value);
    if (node.type === 'BooleanLiteral') return String(node.value);
    return node.type;
  }

  /**
   * Analyze business logic flaws (D-03)
   */
  analyzeLogicFlaws() {
    const flaws = [];

    for (const sm of this.stateMachines) {
      // Check for missing auth in state transitions (D-19: High)
      const authMissing = this.checkMissingAuth(sm);
      if (authMissing) {
        flaws.push({
          type: 'missing-auth-transition',
          severity: 'HIGH',
          description: `State machine "${sm.name}" has transitions without authentication checks`,
          stateMachine: sm.name,
          location: sm.location,
          mitigation: 'Add authentication validation before sensitive state transitions'
        });
      }

      // Check for race condition patterns (D-20: Medium)
      const raceConditions = this.checkRaceConditions(sm);
      if (raceConditions) {
        flaws.push({
          type: 'potential-race-condition',
          severity: 'MEDIUM',
          description: `State machine "${sm.name}" may have race condition vulnerabilities`,
          stateMachine: sm.name,
          location: sm.location,
          mitigation: 'Implement proper locking or atomic state transitions'
        });
      }

      // Check for bypass opportunities (D-18: Critical)
      const bypassOpportunity = this.checkBypassOpportunity(sm);
      if (bypassOpportunity) {
        flaws.push({
          type: 'bypass-opportunity',
          severity: 'CRITICAL',
          description: `State machine "${sm.name}" may allow workflow bypass`,
          stateMachine: sm.name,
          location: sm.location,
          mitigation: 'Add validation at each state transition entry point'
        });
      }

      // Check for state validation gaps
      const validationGap = this.checkValidationGap(sm);
      if (validationGap) {
        flaws.push({
          type: 'state-validation-gap',
          severity: 'MEDIUM',
          description: `State machine "${sm.name}" lacks state transition validation`,
          stateMachine: sm.name,
          location: sm.location,
          mitigation: 'Validate state transitions against allowed transitions'
        });
      }
    }

    this.logicFlaws = flaws;
  }

  /**
   * Check for missing authentication in state machine
   */
  checkMissingAuth(stateMachine) {
    // Heuristic: State machines dealing with sensitive data should have auth
    const sensitivePatterns = /(user|auth|admin|payment|order|account)/i;
    if (!sensitivePatterns.test(stateMachine.name)) return false;

    // Check if transitions have any auth-related events
    const hasAuthTransition = stateMachine.transitions.some(t =>
      /auth|verify|check|login|logout/i.test(t.event)
    );

    return !hasAuthTransition;
  }

  /**
   * Check for race condition patterns
   */
  checkRaceConditions(stateMachine) {
    // Heuristic: Multiple async transitions to same state
    const stateTargets = {};
    for (const t of stateMachine.transitions) {
      stateTargets[t.to] = (stateTargets[t.to] || 0) + 1;
    }

    // If any state has multiple incoming transitions, potential race condition
    return Object.values(stateTargets).some(count => count > 2);
  }

  /**
   * Check for bypass opportunities
   */
  checkBypassOpportunity(stateMachine) {
    // Heuristic: Check if can jump to final state from initial without intermediate
    const initialState = stateMachine.states.find(s => s.isInitial)?.name;
    const finalStates = stateMachine.states.filter(s => s.isFinal).map(s => s.name);

    if (!initialState || finalStates.length === 0) return false;

    // Check for direct transition from initial to final
    const directToFinal = stateMachine.transitions.some(t =>
      t.from === initialState && finalStates.includes(t.to)
    );

    return directToFinal;
  }

  /**
   * Check for validation gaps
   */
  checkValidationGap(stateMachine) {
    // Heuristic: No validation events in transitions
    return !stateMachine.transitions.some(t =>
      /validate|check|verify|confirm/i.test(t.event)
    );
  }

  /**
   * Generate Mermaid state diagram (D-04)
   */
  generateMermaid(stateMachine) {
    const lines = ['stateDiagram-v2'];

    // Add initial state connection
    const initialState = stateMachine.states.find(s => s.isInitial);
    if (initialState) {
      lines.push(`  [*] --> ${this.sanitizeStateName(initialState.name)}`);
    }

    // Add transitions
    for (const transition of stateMachine.transitions) {
      const fromName = this.sanitizeStateName(transition.from);
      const toName = this.sanitizeStateName(transition.to);
      const event = transition.event ? ` : ${transition.event}` : '';
      lines.push(`  ${fromName} --> ${toName}${event}`);
    }

    // Add final state connections
    for (const finalState of stateMachine.states.filter(s => s.isFinal)) {
      lines.push(`  ${this.sanitizeStateName(finalState.name)} --> [*]`);
    }

    // Add risk annotations
    const risks = this.getStateRisks(stateMachine);
    for (const risk of risks) {
      lines.push(`  note right of ${risk.state} : ${risk.description}`);
    }

    return lines.join('\n');
  }

  /**
   * Sanitize state name for Mermaid
   */
  sanitizeStateName(name) {
    if (!name || name === '*') return 'AnyState';
    return name.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  /**
   * Get risks for state annotation
   */
  getStateRisks(stateMachine) {
    const risks = [];

    // Check for sensitive states
    const sensitiveStates = stateMachine.states.filter(s =>
      /admin|payment|delete|remove/i.test(s.name)
    );

    for (const state of sensitiveStates) {
      risks.push({
        state: this.sanitizeStateName(state.name),
        description: 'Sensitive operation - requires validation'
      });
    }

    return risks;
  }

  /**
   * Get analysis result
   */
  getAnalysisResult() {
    // Generate Mermaid diagrams for all state machines
    const diagrams = this.stateMachines.map(sm => ({
      name: sm.name,
      mermaid: this.generateMermaid(sm),
      risks: this.getStateMachineRisks(sm)
    }));

    // Calculate risk distribution per D-17 through D-21
    const riskDistribution = {
      critical: this.logicFlaws.filter(f => f.severity === 'CRITICAL').length,
      high: this.logicFlaws.filter(f => f.severity === 'HIGH').length,
      medium: this.logicFlaws.filter(f => f.severity === 'MEDIUM').length,
      low: this.logicFlaws.filter(f => f.severity === 'LOW').length
    };

    return {
      stateMachines: this.stateMachines,
      stateMachineCount: this.stateMachines.length,
      logicFlaws: this.logicFlaws,
      flawCount: this.logicFlaws.length,
      mermaidDiagrams: diagrams,
      riskDistribution,
      summary: {
        reactUseState: this.stateMachines.filter(sm => sm.type === 'react-useState').length,
        reduxReducer: this.stateMachines.filter(sm => sm.type === 'redux-reducer').length,
        xstateMachine: this.stateMachines.filter(sm => sm.type === 'xstate-machine').length,
        vuexStore: this.stateMachines.filter(sm => sm.type === 'vuex-store').length,
        piniaStore: this.stateMachines.filter(sm => sm.type === 'pinia-store').length,
        manualEnum: this.stateMachines.filter(sm => sm.type === 'manual-enum').length,
        criticalFlaws: riskDistribution.critical,
        highFlaws: riskDistribution.high
      }
    };
  }

  /**
   * Get risks for a specific state machine
   */
  getStateMachineRisks(stateMachine) {
    return this.logicFlaws.filter(f => f.stateMachine === stateMachine.name);
  }

  /**
   * Get state machines by type
   */
  getStateMachinesByType(type) {
    return this.stateMachines.filter(sm => sm.type === type);
  }

  /**
   * Get flaws by severity
   */
  getFlawsBySeverity(severity) {
    return this.logicFlaws.filter(f => f.severity === severity);
  }
}

// Export module
module.exports = {
  BusinessLogicMapper,
  detectStateMachines: async (projectPath, options) => {
    const mapper = new BusinessLogicMapper(options);
    return mapper.analyze(projectPath, options);
  },
  analyzeLogicFlaws: async (projectPath, options) => {
    const mapper = new BusinessLogicMapper(options);
    const result = await mapper.analyze(projectPath, options);
    return result.logicFlaws;
  }
};
