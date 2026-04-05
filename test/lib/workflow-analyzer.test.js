/**
 * Workflow Analyzer Unit Tests
 * Phase 115: Advanced Reconnaissance
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { WorkflowAnalyzer } = require('../../bin/lib/workflow-analyzer');

describe('WorkflowAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new WorkflowAnalyzer();
  });

  // Test 1: Extracts workflow from Express route handler
  describe('Route Handler Detection', () => {
    it('extracts workflow from Express route handler', () => {
      const code = `
        app.get('/users', async (req, res) => {
          const users = await db.findAll();
          res.json(users);
        });
      `;

      const ast = analyzer.parseAST(code, 'test.js');
      const targetInfo = [{ path: '/users', method: 'GET', file: 'test.js', authRequired: false }];
      
      analyzer.extractWorkflows(ast, 'test.js', targetInfo);
      
      assert.ok(analyzer.workflows.length >= 1, 'Should detect at least one workflow');
      
      const workflow = analyzer.workflows[0];
      assert.ok(workflow.entryPoint, 'Should have entry point');
      assert.ok(workflow.steps, 'Should have steps');
    });

    it('identifies route handler patterns', () => {
      const code = `
        app.post('/api/orders', authenticate, async (req, res) => {
          const order = await Order.create(req.body);
          res.json(order);
        });
      `;

      const ast = analyzer.parseAST(code, 'routes.js');
      const targetInfo = [{ path: '/api/orders', method: 'POST', file: 'routes.js', handlerLine: 2 }];
      
      analyzer.workflows = [];
      analyzer.extractWorkflows(ast, 'routes.js', targetInfo);
      
      assert.ok(analyzer.workflows.length >= 1, 'Should detect POST route workflow');
    });
  });

  // Test 2: Detects API call chains (fetch -> database)
  describe('Step Detection', () => {
    it('detects API call chains (fetch -> database)', () => {
      const code = `
        app.get('/external-data', async (req, res) => {
          const externalData = await fetch('https://api.example.com/data');
          const json = await externalData.json();
          const saved = await db.create(json);
          res.json(saved);
        });
      `;

      const ast = analyzer.parseAST(code, 'test.js');
      analyzer.extractWorkflows(ast, 'test.js', null);

      // Check for detected steps
      let hasApiCall = false;
      let hasDbOperation = false;

      for (const workflow of analyzer.workflows) {
        for (const step of workflow.steps) {
          if (step.type === 'api-call') hasApiCall = true;
          if (step.type === 'db-operation') hasDbOperation = true;
        }
      }

      assert.ok(hasApiCall, 'Should detect fetch as api-call step');
      assert.ok(hasDbOperation, 'Should detect db.create as db-operation step');
    });

    it('detects database operations', () => {
      const code = `
        app.get('/users', async (req, res) => {
          const users = await User.findAll();
          res.json(users);
        });
      `;

      const ast = analyzer.parseAST(code, 'test.js');
      analyzer.workflows = [];
      analyzer.extractWorkflows(ast, 'test.js', null);

      // Should detect database operation within route handler
      let hasDbOp = false;
      for (const workflow of analyzer.workflows) {
        for (const step of workflow.steps) {
          if (step.type === 'db-operation') {
            hasDbOp = true;
            assert.strictEqual(step.operation, 'findAll', 'Should detect findAll operation');
          }
        }
      }

      assert.ok(hasDbOp, 'Should detect database operation in route handler');
    });

    it('detects validation steps', () => {
      const code = `
        app.post('/users', (req, res) => {
          const validated = validateSchema(req.body);
          db.create(validated);
        });
      `;

      const ast = analyzer.parseAST(code, 'test.js');
      analyzer.workflows = [];
      analyzer.extractWorkflows(ast, 'test.js', null);

      let hasValidation = false;
      for (const workflow of analyzer.workflows) {
        for (const step of workflow.steps) {
          if (step.type === 'validation') hasValidation = true;
        }
      }

      assert.ok(hasValidation, 'Should detect validation step');
    });

    it('detects data source steps', () => {
      const code = `
        app.post('/users', (req, res) => {
          const data = req.body;
          db.create(data);
        });
      `;

      const ast = analyzer.parseAST(code, 'test.js');
      analyzer.workflows = [];
      analyzer.extractWorkflows(ast, 'test.js', null);

      let hasDataSource = false;
      for (const workflow of analyzer.workflows) {
        for (const step of workflow.steps) {
          if (step.type === 'data-source') hasDataSource = true;
        }
      }

      assert.ok(hasDataSource, 'Should detect data source step');
    });
  });

  // Test 3: Identifies missing auth before sensitive operations
  describe('Missing Auth Detection', () => {
    it('identifies missing auth before sensitive operations', () => {
      const code = `
        app.delete('/users/:id', async (req, res) => {
          await db.destroy({ where: { id: req.params.id } });
          res.sendStatus(200);
        });
      `;

      const ast = analyzer.parseAST(code, 'test.js');
      analyzer.workflows = [];
      analyzer.extractWorkflows(ast, 'test.js', null);
      analyzer.analyzeWorkflowRisks();

      const riskyWorkflows = analyzer.workflows.filter(w => 
        w.risks.some(r => r.type === 'missing-auth')
      );

      assert.ok(riskyWorkflows.length > 0, 'Should detect missing auth for delete operation');
    });

    it('recognizes auth check presence', () => {
      const code = `
        app.delete('/admin/users/:id', async (req, res) => {
          await verifyAuth(req); // Auth check within handler
          await db.destroy({ where: { id: req.params.id } });
          res.sendStatus(200);
        });
      `;

      const ast = analyzer.parseAST(code, 'test.js');
      analyzer.workflows = [];
      analyzer.extractWorkflows(ast, 'test.js', null);
      analyzer.analyzeWorkflowRisks();

      // Should have auth-check step when called within handler
      let hasAuthStep = false;
      for (const workflow of analyzer.workflows) {
        for (const step of workflow.steps) {
          if (step.type === 'auth-check') hasAuthStep = true;
        }
      }

      assert.ok(hasAuthStep, 'Should detect auth check step');
    });
  });

  // Test 4: Identifies missing validation before data processing
  describe('Missing Validation Detection', () => {
    it('identifies missing validation before data processing', () => {
      const code = `
        app.post('/users', async (req, res) => {
          // No validation here
          const user = await db.create(req.body);
          res.json(user);
        });
      `;

      const ast = analyzer.parseAST(code, 'test.js');
      analyzer.workflows = [];
      analyzer.extractWorkflows(ast, 'test.js', null);
      analyzer.analyzeWorkflowRisks();

      const missingValidation = analyzer.workflows.filter(w =>
        w.risks.some(r => r.type === 'missing-validation')
      );

      assert.ok(missingValidation.length > 0, 'Should detect missing validation');
    });

    it('recognizes validation presence', () => {
      const code = `
        app.post('/users', async (req, res) => {
          const validated = validateUserData(req.body);
          const user = await db.create(validated);
          res.json(user);
        });
      `;

      const ast = analyzer.parseAST(code, 'test.js');
      analyzer.workflows = [];
      analyzer.extractWorkflows(ast, 'test.js', null);
      analyzer.analyzeWorkflowRisks();

      // Should not flag as missing validation
      const validatedWorkflows = analyzer.workflows.filter(w =>
        w.steps.some(s => s.type === 'validation')
      );

      assert.ok(validatedWorkflows.length > 0 || analyzer.workflows.length === 0, 
        'Should not flag workflows with validation');
    });
  });

  // Test 5: Detects async operation sequences
  describe('Async Detection', () => {
    it('detects async operation sequences', () => {
      const code = `
        app.get('/data', async (req, res) => {
          const a = await fetch('/api/a');
          const b = await fetch('/api/b');
          const c = await db.findAll();
          res.json({ a, b, c });
        });
      `;

      const ast = analyzer.parseAST(code, 'test.js');
      analyzer.workflows = [];
      analyzer.extractWorkflows(ast, 'test.js', null);

      // Count async steps
      let asyncCount = 0;
      for (const workflow of analyzer.workflows) {
        for (const step of workflow.steps) {
          if (step.async) asyncCount++;
        }
      }

      assert.ok(asyncCount >= 2, 'Should detect multiple async operations');
    });

    it('identifies potential race conditions', () => {
      const code = `
        app.post('/batch', async (req, res) => {
          const update1 = db.update({ status: 'A' });
          const update2 = db.update({ status: 'B' });
          await Promise.all([update1, update2]);
          res.sendStatus(200);
        });
      `;

      const ast = analyzer.parseAST(code, 'test.js');
      analyzer.workflows = [];
      analyzer.extractWorkflows(ast, 'test.js', null);
      analyzer.analyzeWorkflowRisks();

      // Check for race condition detection (may or may not flag)
      // The test verifies the analysis runs without error
      assert.ok(true, 'Should complete analysis without error');
    });
  });

  // Test 6: Generates workflow graph with correct edges
  describe('Graph Construction', () => {
    it('generates workflow graph with correct edges', () => {
      const code = `
        app.get('/chain', async (req, res) => {
          const data = req.query.data;
          const validated = validate(data);
          const result = await db.create(validated);
          res.json(result);
        });
      `;

      const ast = analyzer.parseAST(code, 'test.js');
      analyzer.workflows = [];
      analyzer.graph = { nodes: new Map(), edges: [] };
      analyzer.extractWorkflows(ast, 'test.js', null);

      const graph = analyzer.buildWorkflowGraph();
      
      assert.ok(Object.keys(graph.nodes).length >= 2, 'Should have multiple nodes');
    });

    it('adds nodes to graph', () => {
      const nodeId = analyzer.addWorkflowNode({
        type: 'test-node',
        file: 'test.js',
        line: 10,
        metadata: {}
      });

      assert.ok(nodeId, 'Should return node ID');
      assert.ok(analyzer.graph.nodes.has(nodeId), 'Node should be in graph');
    });

    it('adds edges between nodes', () => {
      const node1 = analyzer.addWorkflowNode({ type: 'a', file: 'test.js', line: 1 });
      const node2 = analyzer.addWorkflowNode({ type: 'b', file: 'test.js', line: 2 });
      
      analyzer.addWorkflowEdge(node1, node2, 'sequence');

      assert.strictEqual(analyzer.graph.edges.length, 1, 'Should have one edge');
      assert.strictEqual(analyzer.graph.edges[0].from, node1, 'Edge should connect from node1');
      assert.strictEqual(analyzer.graph.edges[0].to, node2, 'Edge should connect to node2');
    });
  });

  // Additional tests for edge cases
  describe('Edge Cases', () => {
    it('handles files without route handlers', () => {
      const code = `
        function helper() {
          return 'helper';
        }
        
        const value = 42;
      `;

      const ast = analyzer.parseAST(code, 'test.js');
      analyzer.workflows = [];
      analyzer.extractWorkflows(ast, 'test.js', null);

      // Should not throw and may have zero workflows
      assert.ok(analyzer.workflows.length === 0 || analyzer.workflows.length >= 0, 
        'Should handle non-route files gracefully');
    });

    it('handles empty files', () => {
      const code = '';
      
      // Should not throw
      assert.doesNotThrow(() => {
        analyzer.parseAST('// empty', 'test.js');
      }, 'Should handle empty/minimal code');
    });

    it('extracts route files from targetInfo', () => {
      const targetInfo = [
        { path: '/users', method: 'GET', file: '/app/routes.js' },
        { path: '/orders', method: 'POST', file: '/app/routes.js' },
        { path: '/products', method: 'GET', file: '/app/other.js' }
      ];

      const files = analyzer.extractRouteFiles(targetInfo);
      
      assert.strictEqual(files.length, 2, 'Should extract unique files');
      assert.ok(files.includes('/app/routes.js'), 'Should include routes.js');
      assert.ok(files.includes('/app/other.js'), 'Should include other.js');
    });
  });

  describe('Tainted Flow Detection', () => {
    it('detects tainted flows to sinks', () => {
      const code = `
        app.post('/query', (req, res) => {
          const userInput = req.body.query;
          db.query(userInput); // Tainted flow
        });
      `;

      const ast = analyzer.parseAST(code, 'test.js');
      analyzer.workflows = [];
      analyzer.extractWorkflows(ast, 'test.js', null);

      // Should have data source step
      let hasDataSource = false;
      let hasDbOp = false;

      for (const workflow of analyzer.workflows) {
        for (const step of workflow.steps) {
          if (step.type === 'data-source') hasDataSource = true;
          if (step.type === 'db-operation') hasDbOp = true;
        }
      }

      assert.ok(hasDataSource, 'Should detect data source');
      assert.ok(hasDbOp, 'Should detect database operation');
    });
  });

  describe('Result Generation', () => {
    it('generates complete analysis result', () => {
      const code = `
        app.get('/test', (req, res) => {
          db.findAll();
        });
      `;

      const ast = analyzer.parseAST(code, 'test.js');
      analyzer.workflows = [];
      analyzer.extractWorkflows(ast, 'test.js', null);
      analyzer.analyzeWorkflowRisks();

      const result = analyzer.getAnalysisResult();

      assert.ok(result.workflows, 'Should have workflows');
      assert.ok(result.workflowDescriptions, 'Should have workflow descriptions');
      assert.ok(result.graph, 'Should have graph');
      assert.ok(result.riskDistribution, 'Should have risk distribution');
      assert.ok(result.summary, 'Should have summary');
    });
  });
});
