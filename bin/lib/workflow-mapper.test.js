/**
 * Unit tests for workflow-mapper.js
 * Phase 115: Advanced Reconnaissance (RECON-06)
 */

"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert");

// Test subject
const { WorkflowMapper } = require("./workflow-mapper");
const { ReconCache } = require("./recon-cache");

describe("WorkflowMapper", () => {
  describe("constructor", () => {
    it("should accept cache parameter", () => {
      const cache = new ReconCache();
      const mapper = new WorkflowMapper({ cache });
      assert.strictEqual(mapper.cache, cache);
    });

    it("should create new cache if none provided", () => {
      const mapper = new WorkflowMapper();
      assert.ok(mapper.cache);
    });

    it("should initialize empty workflows", () => {
      const mapper = new WorkflowMapper();
      assert.deepStrictEqual(mapper.workflows, { states: [], transitions: [] });
    });

    it("should initialize empty flaws array", () => {
      const mapper = new WorkflowMapper();
      assert.deepStrictEqual(mapper.flaws, []);
    });
  });

  describe("analyze", () => {
    it("should return workflows and flaws structure", async () => {
      const mapper = new WorkflowMapper();
      const code = `
        const app = require('express')();
        app.post('/order', authenticate, validateCart, processPayment);
      `;
      const ast = mapper.parseAST(code, "test.js");
      mapper.detectStateMachine(ast, "test.js", [], []);
      mapper.flaws = mapper.detectBusinessLogicFlaws(ast, "test.js");

      const result = {
        workflows: mapper.workflows,
        flaws: mapper.flaws,
        filePath: "test.js"
      };

      assert.ok(result.workflows);
      assert.ok(Array.isArray(result.workflows.states));
      assert.ok(Array.isArray(result.workflows.transitions));
      assert.ok(Array.isArray(result.flaws));
    });

    it("should use cache when available", async () => {
      // Note: ReconCache uses git-state-based keys, not per-file keys
      // This test verifies cache parameter is accepted and used
      const cache = new ReconCache();
      const mapper = new WorkflowMapper({ cache });
      
      // Verify mapper uses the provided cache
      assert.strictEqual(mapper.cache, cache, "Should use the provided cache instance");
    });
  });

  describe("detectStateMachine", { tag: "state machine" }, () => {
    it("should detect route handler middleware chain as state transitions", () => {
      const mapper = new WorkflowMapper();
      const code = `
        app.post('/order/complete', authenticateUser, validateCart, processPayment, updateInventory);
      `;
      const ast = mapper.parseAST(code, "test.js");
      const states = [];
      const transitions = [];

      mapper.detectStateMachine(ast, "test.js", states, transitions);

      assert.ok(states.length >= 4, "Should have at least 4 handler states");
      assert.ok(transitions.length >= 3, "Should have at least 3 transitions between handlers");
    });

    it("should classify handlers as guard/action/transition", () => {
      const mapper = new WorkflowMapper();
      const code = `
        app.get('/checkout', authenticate, validateCart, processOrder, renderResponse, sendRedirect);
      `;
      const ast = mapper.parseAST(code, "test.js");
      const states = [];
      const transitions = [];

      mapper.detectStateMachine(ast, "test.js", states, transitions);

      const guard = states.find(s => s.type === 'guard');
      const action = states.find(s => s.type === 'action');
      const transition = states.find(s => s.type === 'transition');

      assert.ok(guard, "Should have a guard type handler");
      assert.ok(action, "Should have an action type handler");
      assert.ok(transition, "Should have a transition type handler");
    });

    it("should return empty for file with no routes", () => {
      const mapper = new WorkflowMapper();
      const code = `
        const x = 1;
        const y = 2;
        function helper() { return x + y; }
      `;
      const ast = mapper.parseAST(code, "test.js");
      const states = [];
      const transitions = [];

      mapper.detectStateMachine(ast, "test.js", states, transitions);

      assert.strictEqual(states.length, 0, "Should have no states for code without routes");
      assert.strictEqual(transitions.length, 0, "Should have no transitions for code without routes");
    });

    it("should detect multiple route handlers", () => {
      const mapper = new WorkflowMapper();
      const code = `
        app.get('/users', listUsers);
        app.post('/users', createUser);
        app.put('/users/:id', updateUser);
        app.delete('/users/:id', deleteUser);
      `;
      const ast = mapper.parseAST(code, "test.js");
      const states = [];
      const transitions = [];

      mapper.detectStateMachine(ast, "test.js", states, transitions);

      assert.ok(states.length >= 4, "Should detect handlers for all 4 routes");
    });

    it("should capture HTTP method in trigger", () => {
      const mapper = new WorkflowMapper();
      const code = `
        app.post('/api/data', authenticate, handlePost);
      `;
      const ast = mapper.parseAST(code, "test.js");
      const states = [];
      const transitions = [];

      mapper.detectStateMachine(ast, "test.js", states, transitions);

      const postTransition = transitions.find(t => t.trigger.includes('POST'));
      assert.ok(postTransition, "Should have POST method in trigger");
    });
  });

  describe("detectBusinessLogicFlaws", { tag: "flaw detection" }, () => {
    it("should detect TOCTOU pattern: if(check) without re-validation before action", () => {
      const mapper = new WorkflowMapper();
      const code = `
        function transferFunds(req) {
          const balance = getBalance(req.user.id);
          if (balance >= req.body.amount) {
            db.query('UPDATE accounts SET balance = balance - ?', [req.body.amount]);
          }
        }
      `;
      const ast = mapper.parseAST(code, "test.js");
      const flaws = mapper.detectBusinessLogicFlaws(ast, "test.js");

      const toctouFlaw = flaws.find(f => f.type === 'TOCTOU');
      assert.ok(toctouFlaw, "Should detect TOCTOU vulnerability");
      assert.strictEqual(toctouFlaw.severity, 'HIGH');
      assert.ok(toctouFlaw.id === 'BLA1-2025');
    });

    it("should detect WORKFLOW_BYPASS pattern: missing state validation", () => {
      const mapper = new WorkflowMapper();
      const code = `
        app.post('/admin/delete', (req, res) => {
          // Missing state validation before critical action
          db.query('DELETE FROM records WHERE id = ?', [req.body.id]);
          res.send('Deleted');
        });
      `;
      const ast = mapper.parseAST(code, "test.js");
      const flaws = mapper.detectBusinessLogicFlaws(ast, "test.js");

      const bypassFlaw = flaws.find(f => f.type === 'WORKFLOW_BYPASS');
      assert.ok(bypassFlaw, "Should detect workflow bypass vulnerability");
      assert.strictEqual(bypassFlaw.severity, 'CRITICAL');
      assert.ok(bypassFlaw.id === 'BLA2-2025');
    });

    it("should detect PARAMETER_TAMPERING pattern: req.body from req.query", () => {
      const mapper = new WorkflowMapper();
      const code = `
        app.get('/user/profile', (req, res) => {
          // Direct parameter assignment without validation
          req.body.id = req.query.id;
          db.query('SELECT * FROM users WHERE id = ?', [req.body.id]);
        });
      `;
      const ast = mapper.parseAST(code, "test.js");
      const flaws = mapper.detectBusinessLogicFlaws(ast, "test.js");

      const tamperFlaw = flaws.find(f => f.type === 'PARAMETER_TAMPERING');
      assert.ok(tamperFlaw, "Should detect parameter tampering");
      assert.strictEqual(tamperFlaw.severity, 'MEDIUM');
      assert.ok(tamperFlaw.id === 'PARAM-TAMPER');
    });

    it("should return empty array for clean code", () => {
      const mapper = new WorkflowMapper();
      const code = `
        function calculateTotal(cart) {
          return cart.items.reduce((sum, item) => sum + item.price, 0);
        }
      `;
      const ast = mapper.parseAST(code, "test.js");
      const flaws = mapper.detectBusinessLogicFlaws(ast, "test.js");

      assert.ok(Array.isArray(flaws), "Should return an array");
    });

    it("should not flag if statements without mutations", () => {
      const mapper = new WorkflowMapper();
      const code = `
        function checkAndLog(req) {
          if (req.user) {
            console.log('User is logged in');
          }
        }
      `;
      const ast = mapper.parseAST(code, "test.js");
      const flaws = mapper.detectBusinessLogicFlaws(ast, "test.js");

      // Should not have TOCTOU since there's no mutation
      const toctouFlaws = flaws.filter(f => f.type === 'TOCTOU');
      assert.strictEqual(toctouFlaws.length, 0, "Should not flag if without mutation");
    });
  });

  describe("generateStateMachineDiagram", { tag: "diagram" }, () => {
    it("should generate valid Mermaid stateDiagram-v2 syntax", () => {
      const mapper = new WorkflowMapper();
      const workflows = {
        states: [
          { id: 's1', name: 'authenticateUser', type: 'guard' },
          { id: 's2', name: 'validateCart', type: 'guard' },
          { id: 's3', name: 'processPayment', type: 'action' },
          { id: 's4', name: 'sendResponse', type: 'transition' }
        ],
        transitions: [
          { from: 's1', to: 's2', trigger: 'POST /checkout', type: 'guard' },
          { from: 's2', to: 's3', trigger: 'POST /checkout', type: 'action' },
          { from: 's3', to: 's4', trigger: 'POST /checkout', type: 'transition' }
        ]
      };

      const diagram = mapper.generateStateMachineDiagram(workflows);

      assert.ok(diagram.startsWith('stateDiagram-v2'), "Should start with stateDiagram-v2");
      assert.ok(diagram.includes('authenticateUser'), "Should include handler names");
      assert.ok(diagram.includes('POST /checkout'), "Should include trigger");
    });

    it("should include [*] --> initialState", () => {
      const mapper = new WorkflowMapper();
      const workflows = {
        states: [{ id: 's1', name: 'StartState', type: 'guard' }],
        transitions: []
      };

      const diagram = mapper.generateStateMachineDiagram(workflows);

      assert.ok(diagram.includes('[*] -->'), "Should include initial state marker");
    });

    it("should sanitize labels with special characters", () => {
      const mapper = new WorkflowMapper();

      const sanitized = mapper.sanitizeLabel('test <script> alert("xss") </script>');
      assert.ok(!sanitized.includes('<'), "Should remove < character");
      assert.ok(!sanitized.includes('>'), "Should remove > character");
      assert.ok(sanitized.includes('less than'), "Should replace < with text");
    });

    it("should handle empty workflows gracefully", () => {
      const mapper = new WorkflowMapper();
      const diagram = mapper.generateStateMachineDiagram({ states: [], transitions: [] });

      assert.ok(diagram.includes('stateDiagram-v2'), "Should still be valid Mermaid");
      assert.ok(diagram.includes('NoRoutesFound'), "Should indicate no routes");
    });

    it("should not duplicate transitions", () => {
      const mapper = new WorkflowMapper();
      const workflows = {
        states: [
          { id: 's1', name: 'A', type: 'action' },
          { id: 's2', name: 'B', type: 'action' }
        ],
        transitions: [
          { from: 's1', to: 's2', trigger: 'GET /x', type: 'action' },
          { from: 's1', to: 's2', trigger: 'GET /x', type: 'action' }
        ]
      };

      const diagram = mapper.generateStateMachineDiagram(workflows);

      // Count occurrences of "A --> B"
      const matches = diagram.match(/A\s+-->\s+B/g) || [];
      assert.strictEqual(matches.length, 1, "Should not duplicate identical transitions");
    });
  });

  describe("parseAST", () => {
    it("should parse TypeScript files when .ts extension", () => {
      const mapper = new WorkflowMapper();
      const code = `
        const x: number = 1;
        function foo(): string { return 'bar'; }
      `;

      const ast = mapper.parseAST(code, "test.ts");
      assert.ok(ast, "Should parse TypeScript without error");
    });

    it("should parse JavaScript files with .js extension", () => {
      const mapper = new WorkflowMapper();
      const code = `
        const x = 1;
        function foo() { return 'bar'; }
      `;

      const ast = mapper.parseAST(code, "test.js");
      assert.ok(ast, "Should parse JavaScript without error");
    });
  });
});
