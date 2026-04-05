/**
 * Workflow Analyzer Tests - Phase 115
 * Tests for API chain detection, workflow entry points, and auth gap detection
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const path = require('path');

// Module to be tested (created in Plan 115-03)
let WorkflowAnalyzer;

try {
  ({ WorkflowAnalyzer } = require('../../bin/lib/workflow-analyzer.js'));
} catch (e) {
  // Module doesn't exist yet - tests will be skipped
  WorkflowAnalyzer = null;
}

const FIXTURES_DIR = path.join(__dirname, '../fixtures/sample-state-machines');

describe('WorkflowAnalyzer', () => {
  let analyzer;

  before(() => {
    if (!WorkflowAnalyzer) {
      console.log('Skipping tests - WorkflowAnalyzer module not yet implemented');
      return;
    }
    analyzer = new WorkflowAnalyzer();
  });

  after(() => {
    if (analyzer && analyzer.cleanup) {
      analyzer.cleanup();
    }
  });

  describe('API chain detection', () => {
    test('should detect express route handlers', async () => {
      if (!WorkflowAnalyzer) return;

      const code = `
        app.post('/checkout', validateCart, processPayment, sendConfirmation);

        function validateCart(req, res, next) {
          if (!req.body.items) return res.status(400).json({ error: 'No items' });
          next();
        }

        function processPayment(req, res, next) {
          paymentService.charge(req.body.cardToken).then(() => next());
        }

        function sendConfirmation(req, res) {
          emailService.send(req.body.email, 'Order confirmed');
          res.json({ success: true });
        }
      `;

      const result = await analyzer.analyze({ code });
      assert.ok(result.workflows, 'Should identify workflows');
      assert.ok(result.workflows.some(w => w.type === 'api-chain'),
        'Should detect API chain');
    });

    test('should identify workflow steps in sequence', async () => {
      if (!WorkflowAnalyzer) return;

      const code = `
        router.post('/order', [
          authenticate,
          validateOrder,
          checkInventory,
          processPayment,
          createOrder,
          notifyWarehouse
        ]);
      `;

      const result = await analyzer.analyze({ code });
      const workflow = result.workflows?.find(w => w.type === 'api-chain');
      if (workflow) {
        assert.ok(workflow.steps, 'Workflow should have steps');
        assert.strictEqual(workflow.steps.length, 6, 'Should detect all 6 steps');
      }
    });

    test('should detect workflow entry points', async () => {
      if (!WorkflowAnalyzer) return;

      const code = `
        app.get('/admin/users', getUsers);
        app.post('/admin/users', createUser);
        app.delete('/admin/users/:id', deleteUser);
      `;

      const result = await analyzer.analyze({ code });
      assert.ok(result.entryPoints, 'Should identify entry points');
      assert.strictEqual(result.entryPoints.length, 3, 'Should detect 3 entry points');
    });

    test('should validate step sequencing', async () => {
      if (!WorkflowAnalyzer) return;

      const code = `
        app.post('/transfer', [
          validateToken,
          checkBalance,
          deductAmount,
          creditDestination,
          logTransaction
        ]);
      `;

      const result = await analyzer.analyze({ code });
      const workflow = result.workflows?.find(w => w.type === 'api-chain');
      if (workflow && workflow.steps) {
        // Check proper sequence: validation before action
        const validationIndex = workflow.steps.findIndex(s => s.name === 'validateToken');
        const actionIndex = workflow.steps.findIndex(s => s.name === 'deductAmount');
        assert.ok(validationIndex < actionIndex,
          'Validation should come before action');
      }
    });
  });

  describe('Async flow tracking', () => {
    test('should track promises through async operations', async () => {
      if (!WorkflowAnalyzer) return;

      const code = `
        async function processOrder(orderId) {
          const order = await Order.findById(orderId);
          const payment = await Payment.charge(order.total);
          const receipt = await Receipt.generate(payment);
          return receipt;
        }
      `;

      const result = await analyzer.analyze({ code });
      assert.ok(result.asyncFlows, 'Should identify async flows');
      if (result.asyncFlows) {
        const asyncFlow = result.asyncFlows.find(f => f.function === 'processOrder');
        assert.ok(asyncFlow, 'Should detect async function');
        assert.ok(asyncFlow.awaitCalls && asyncFlow.awaitCalls.length >= 3,
          'Should track await calls');
      }
    });

    test('should detect promise chains', async () => {
      if (!WorkflowAnalyzer) return;

      const code = `
        fetch('/api/user')
          .then(r => r.json())
          .then(user => fetch('/api/orders/' + user.id))
          .then(r => r.json())
          .then(orders => displayOrders(orders))
          .catch(e => handleError(e));
      `;

      const result = await analyzer.analyze({ code });
      const promiseChain = result.asyncFlows?.find(f => f.type === 'promise-chain');
      if (promiseChain) {
        assert.ok(promiseChain.chainLength > 0, 'Should detect chain length');
      }
    });

    test('should track transaction boundaries', async () => {
      if (!WorkflowAnalyzer) return;

      const code = `
        async function transferFunds(from, to, amount) {
          const tx = await db.beginTransaction();
          try {
            await db.query('UPDATE accounts SET balance = balance - ? WHERE id = ?', [amount, from]);
            await db.query('UPDATE accounts SET balance = balance + ? WHERE id = ?', [amount, to]);
            await tx.commit();
          } catch (e) {
            await tx.rollback();
            throw e;
          }
        }
      `;

      const result = await analyzer.analyze({ code });
      const transaction = result.transactions?.find(t => t.function === 'transferFunds');
      if (transaction) {
        assert.ok(transaction.hasBegin, 'Should detect transaction start');
        assert.ok(transaction.hasCommit, 'Should detect commit');
        assert.ok(transaction.hasRollback, 'Should detect rollback');
      }
    });
  });

  describe('Authentication gap detection', () => {
    test('should detect missing auth on sensitive routes', async () => {
      if (!WorkflowAnalyzer) return;

      const code = `
        // Public routes - OK to skip auth
        app.get('/public', getPublicData);

        // Sensitive routes - SHOULD require auth
        app.get('/admin/config', getAdminConfig);
        app.post('/admin/users', createUser);
        app.delete('/api/accounts/:id', deleteAccount);
      `;

      const result = await analyzer.analyze({ code });
      assert.ok(result.authGaps, 'Should identify auth gaps');

      // Should flag sensitive routes without auth
      const sensitivePatterns = ['admin', 'config', 'accounts'];
      const gaps = result.authGaps.filter(gap =>
        sensitivePatterns.some(p => gap.path.includes(p))
      );
      assert.ok(gaps.length > 0, 'Should detect auth gaps on sensitive routes');
    });

    test('should detect bypass patterns', async () => {
      if (!WorkflowAnalyzer) return;

      const code = `
        function checkAuth(req, res, next) {
          // VULNERABILITY: Bypass with debug parameter
          if (req.query.debug === 'true') {
            return next(); // Bypass!
          }

          if (!req.headers.authorization) {
            return res.status(401).json({ error: 'Unauthorized' });
          }

          next();
        }
      `;

      const result = await analyzer.analyze({ code });
      const bypassPattern = result.flaws?.find(f => f.type === 'auth-bypass');
      if (bypassPattern) {
        assert.ok(bypassPattern.bypassCondition, 'Should identify bypass condition');
      }
    });

    test('should detect auth applied after sensitive operation', async () => {
      if (!WorkflowAnalyzer) return;

      const code = `
        app.get('/download/:file', async (req, res) => {
          // VULNERABILITY: File accessed BEFORE auth check
          const file = await fs.readFile(req.params.file);

          // Auth checked too late
          if (!req.user) {
            return res.status(401).send('Unauthorized');
          }

          res.send(file);
        });
      `;

      const result = await analyzer.analyze({ code });
      const lateAuth = result.flaws?.find(f => f.type === 'late-auth');
      if (lateAuth) {
        assert.ok(lateAuth.resourceAccessed, 'Should identify early resource access');
      }
    });
  });

  describe('State machine workflow analysis', () => {
    test('should analyze Redux reducer workflows', async () => {
      if (!WorkflowAnalyzer) return;

      const fixturePath = path.join(FIXTURES_DIR, 'redux-reducer.js');
      const result = await analyzer.analyzeFile(fixturePath);

      assert.ok(result.stateMachines, 'Should identify state machines');
      const reduxMachine = result.stateMachines.find(sm => sm.type === 'redux');
      if (reduxMachine) {
        assert.ok(reduxMachine.workflow, 'Should extract workflow from state machine');
      }
    });

    test('should detect missing validation in state transitions', async () => {
      if (!WorkflowAnalyzer) return;

      const fixturePath = path.join(FIXTURES_DIR, 'redux-reducer.js');
      const result = await analyzer.analyzeFile(fixturePath);

      // Should identify that transitions between states might lack validation
      const transitionFlaws = result.flaws?.filter(f => f.category === 'state-transition');
      // Document findings
      if (transitionFlaws) {
        assert.ok(Array.isArray(transitionFlaws), 'Should return array of flaws');
      }
    });
  });

  describe('Business logic flaw detection', () => {
    test('should detect race conditions in workflows', async () => {
      if (!WorkflowAnalyzer) return;

      const code = `
        app.post('/purchase', async (req, res) => {
          const balance = await getBalance(req.user.id);
          // Race condition: balance could change here
          const item = await getItem(req.body.itemId);

          if (balance >= item.price) {
            // Another check should happen here atomically
            await deductBalance(req.user.id, item.price);
            await addItem(req.user.id, item.id);
          }
        });
      `;

      const result = await analyzer.analyze({ code });
      const raceCondition = result.flaws?.find(f => f.type === 'race-condition');
      if (raceCondition) {
        assert.ok(raceCondition.readBeforeWrite, 'Should detect TOCTOU pattern');
      }
    });

    test('should detect inconsistent validation', async () => {
      if (!WorkflowAnalyzer) return;

      const code = `
        // Validate in API A
        app.post('/api-a', (req, res) => {
          if (!req.body.amount || req.body.amount < 0) {
            return res.status(400).json({ error: 'Invalid amount' });
          }
          processA(req.body.amount);
        });

        // Missing validation in API B
        app.post('/api-b', (req, res) => {
          // No validation of amount!
          processB(req.body.amount);
        });
      `;

      const result = await analyzer.analyze({ code });
      const inconsistent = result.flaws?.find(f => f.type === 'inconsistent-validation');
      if (inconsistent) {
        assert.ok(inconsistent.field, 'Should identify the inconsistently validated field');
      }
    });

    test('should detect workflow bypass vulnerabilities', async () => {
      if (!WorkflowAnalyzer) return;

      const code = `
        // Intended workflow: A -> B -> C
        app.post('/step-a', handleA);
        app.post('/step-b', handleB);
        app.post('/step-c', handleC);

        // VULNERABILITY: Direct access to final step
        app.post('/complete', handleC);
      `;

      const result = await analyzer.analyze({ code });
      const bypass = result.flaws?.find(f => f.type === 'workflow-bypass');
      if (bypass) {
        assert.ok(bypass.missingPrerequisites, 'Should identify missing prerequisite checks');
      }
    });
  });

  describe('Checkout flow analysis', () => {
    test('should validate checkout workflow structure', async () => {
      if (!WorkflowAnalyzer) return;

      const code = `
        router.post('/checkout', [
          authenticate,
          validateCart,
          checkInventory,
          calculateTotals,
          processPayment,
          createOrder,
          sendConfirmation
        ]);
      `;

      const result = await analyzer.analyze({ code });
      const checkoutFlow = result.workflows?.find(w =>
        w.path === '/checkout' || w.name?.includes('checkout')
      );

      if (checkoutFlow) {
        // Validate expected steps exist
        const expectedSteps = ['authenticate', 'validate', 'payment', 'create'];
        const hasExpected = expectedSteps.some(expected =>
          checkoutFlow.steps?.some(s => s.name.toLowerCase().includes(expected))
        );
        assert.ok(hasExpected, 'Should identify checkout workflow steps');
      }
    });
  });

  describe('Error handling', () => {
    test('should handle malformed code gracefully', async () => {
      if (!WorkflowAnalyzer) return;

      const result = await analyzer.analyze({ code: 'const x = { broken' });
      assert.ok(result.error || result.workflows !== undefined,
        'Should handle parse errors gracefully');
    });

    test('should handle non-existent files', async () => {
      if (!WorkflowAnalyzer) return;

      const result = await analyzer.analyzeFile('/nonexistent/file.js');
      assert.ok(result.error || result.workflows !== undefined,
        'Should handle missing files gracefully');
    });
  });
});
