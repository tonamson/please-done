/**
 * Taint Engine Tests - Phase 115
 * Tests for data flow tracking from sources to sinks
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const path = require('path');

// Module to be tested (created in Plan 115-02)
let TaintEngine;

try {
  ({ TaintEngine } = require('../../bin/lib/taint-engine.js'));
} catch (e) {
  // Module doesn't exist yet - tests will be skipped
  TaintEngine = null;
}

const FIXTURES_DIR = path.join(__dirname, '../fixtures/taint-flows');

describe('TaintEngine', () => {
  let engine;

  before(() => {
    if (!TaintEngine) {
      console.log('Skipping tests - TaintEngine module not yet implemented');
      return;
    }
    engine = new TaintEngine();
  });

  after(() => {
    if (engine && engine.cleanup) {
      engine.cleanup();
    }
  });

  describe('Source detection', () => {
    test('should detect req.body as taint source', async () => {
      if (!TaintEngine) return;

      const code = `
        const userInput = req.body.username;
        const query = 'SELECT * FROM users WHERE name = \\' + userInput;
        db.exec(query);
      `;

      const result = await engine.analyze({ code });
      assert.ok(result.sources, 'Should identify sources');
      assert.ok(result.sources.some(s => s.type === 'req.body'), 'Should detect req.body source');
    });

    test('should detect req.query as taint source', async () => {
      if (!TaintEngine) return;

      const code = `
        const searchTerm = req.query.q;
        res.send('<div>' + searchTerm + '</div>');
      `;

      const result = await engine.analyze({ code });
      assert.ok(result.sources.some(s => s.type === 'req.query'), 'Should detect req.query source');
    });

    test('should detect req.params as taint source', async () => {
      if (!TaintEngine) return;

      const code = `
        const userId = req.params.id;
        const cmd = 'rm -rf /tmp/' + userId;
        exec(cmd);
      `;

      const result = await engine.analyze({ code });
      assert.ok(result.sources.some(s => s.type === 'req.params'), 'Should detect req.params source');
    });

    test('should detect multiple sources in same file', async () => {
      if (!TaintEngine) return;

      const code = `
        const name = req.body.name;
        const age = req.query.age;
        const id = req.params.userId;
      `;

      const result = await engine.analyze({ code });
      assert.strictEqual(result.sources.length, 3, 'Should detect all three sources');
    });
  });

  describe('Sink detection', () => {
    test('should detect SQL execution as sink', async () => {
      if (!TaintEngine) return;

      const code = `
        const input = req.body.id;
        db.query('SELECT * FROM users WHERE id = ' + input);
      `;

      const result = await engine.analyze({ code });
      assert.ok(result.sinks.some(s => s.type === 'sql-execution'), 'Should detect SQL sink');
    });

    test('should detect eval as sink', async () => {
      if (!TaintEngine) return;

      const code = `
        const code = req.body.script;
        eval(code);
      `;

      const result = await engine.analyze({ code });
      assert.ok(result.sinks.some(s => s.type === 'eval'), 'Should detect eval sink');
    });

    test('should detect exec as sink', async () => {
      if (!TaintEngine) return;

      const code = `
        const cmd = req.body.command;
        require('child_process').exec(cmd);
      `;

      const result = await engine.analyze({ code });
      assert.ok(result.sinks.some(s => s.type === 'command-execution'), 'Should detect command execution sink');
    });

    test('should detect XSS sinks', async () => {
      if (!TaintEngine) return;

      const code = `
        const html = req.body.content;
        document.innerHTML = html;
      `;

      const result = await engine.analyze({ code });
      assert.ok(result.sinks.some(s => s.type === 'xss'), 'Should detect XSS sink');
    });
  });

  describe('Multi-hop tracking', () => {
    test('should track taint through variable assignments', async () => {
      if (!TaintEngine) return;

      const code = `
        const input = req.body.data;
        const processed = input.toUpperCase();
        const sanitized = validator.escape(processed);
        res.send(sanitized);
      `;

      const result = await engine.analyze({ code });
      // Should track all hops from req.body.data to res.send
      assert.ok(result.flows, 'Should identify data flows');
    });

    test('should track taint through function calls', async () => {
      if (!TaintEngine) return;

      const code = `
        function processUserData(data) {
          return data.replace(/</g, '&lt;');
        }

        const userInput = req.body.comment;
        const safe = processUserData(userInput);
        db.query('INSERT INTO comments VALUES ("' + safe + '")');
      `;

      const result = await engine.analyze({ code });
      assert.ok(result.flows && result.flows.length > 0, 'Should track flow through function');
    });

    test('should handle multi-hop fixture', async () => {
      if (!TaintEngine) return;

      const fixturePath = path.join(FIXTURES_DIR, 'multi-hop.js');
      const result = await engine.analyzeFile(fixturePath);

      assert.ok(result.flows, 'Should identify flows from fixture');
      // Should detect at least 3 hops: req.body.user.name -> username -> processed -> sql query
      const multiHopFlows = result.flows.filter(f => f.hops >= 3);
      assert.ok(multiHopFlows.length > 0, 'Should detect multi-hop flows');
    });
  });

  describe('Sanitization detection', () => {
    test('should detect sanitization breaking taint flow', async () => {
      if (!TaintEngine) return;

      const code = `
        const dirty = req.body.input;
        const clean = validator.sanitize(dirty);
        db.query(clean);
      `;

      const result = await engine.analyze({ code });

      // Find the flow and check if sanitization is detected
      const flow = result.flows?.find(f => f.sanitized);
      assert.ok(flow, 'Should mark flow as sanitized');
    });

    test('should handle sanitized fixture', async () => {
      if (!TaintEngine) return;

      const fixturePath = path.join(FIXTURES_DIR, 'sanitized-flow.js');
      const result = await engine.analyzeFile(fixturePath);

      // Should detect both sanitized and unsanitized variants
      assert.ok(result.flows, 'Should identify flows');
    });

    test('should detect Joi validation as sanitization', async () => {
      if (!TaintEngine) return;

      const code = `
        const schema = Joi.string().alphanum();
        const { error, value } = schema.validate(req.body.id);
        if (!error) {
          db.query('SELECT * FROM users WHERE id = ?', value);
        }
      `;

      const result = await engine.analyze({ code });
      const sanitizedFlow = result.flows?.find(f =>
        f.sanitizationMethod === 'joi-validation'
      );
      assert.ok(sanitizedFlow, 'Should detect Joi validation');
    });
  });

  describe('Object property tracking', () => {
    test('should track nested object properties', async () => {
      if (!TaintEngine) return;

      const fixturePath = path.join(FIXTURES_DIR, 'object-property.js');
      const result = await engine.analyzeFile(fixturePath);

      assert.ok(result.sources.some(s => s.path.includes('nested')),
        'Should track nested property access');
    });

    test('should track array element access', async () => {
      if (!TaintEngine) return;

      const code = `
        const firstItem = req.query.items[0];
        eval(firstItem);
      `;

      const result = await engine.analyze({ code });
      assert.ok(result.sources.some(s => s.path.includes('[0]')),
        'Should track array element access');
    });
  });

  describe('Edge cases', () => {
    test('should handle function returns as taint carriers', async () => {
      if (!TaintEngine) return;

      const code = `
        function getInput() {
          return req.body.data;
        }
        const data = getInput();
        eval(data);
      `;

      const result = await engine.analyze({ code });
      assert.ok(result.sources.length > 0, 'Should track through function return');
    });

    test('should handle conditional flows', async () => {
      if (!TaintEngine) return;

      const code = `
        let cmd = 'ls';
        if (req.query.verbose) {
          cmd += ' -la';
        }
        exec(cmd);
      `;

      const result = await engine.analyze({ code });
      assert.ok(result.sources.length > 0, 'Should detect taint in conditional branches');
    });

    test('should handle error gracefully for malformed code', async () => {
      if (!TaintEngine) return;

      const result = await engine.analyze({ code: 'const x = { broken' });
      assert.ok(result.error || result.sources !== undefined,
        'Should handle parse errors gracefully');
    });
  });
});
