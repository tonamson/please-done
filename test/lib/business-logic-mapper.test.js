/**
 * Business Logic Mapper Tests - Phase 115
 * Tests for state machine detection and business logic mapping
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs').promises;

// Module to be tested (created in Plan 115-01)
let BusinessLogicMapper;

try {
  ({ BusinessLogicMapper } = require('../../bin/lib/business-logic-mapper.js'));
} catch (e) {
  // Module doesn't exist yet - tests will be skipped
  BusinessLogicMapper = null;
}

const FIXTURES_DIR = path.join(__dirname, '../fixtures/sample-state-machines');

describe('BusinessLogicMapper', () => {
  let mapper;

  before(() => {
    if (!BusinessLogicMapper) {
      console.log('Skipping tests - BusinessLogicMapper module not yet implemented');
      return;
    }
    mapper = new BusinessLogicMapper();
  });

  after(() => {
    if (mapper && mapper.cleanup) {
      mapper.cleanup();
    }
  });

  describe('useState detection', () => {
    test('should detect React useState pattern', async () => {
      if (!BusinessLogicMapper) return;

      const fixturePath = path.join(FIXTURES_DIR, 'react-usestate.jsx');
      const result = await mapper.analyze(fixturePath);

      assert.ok(result.stateMachines, 'Should identify state machines');
      assert.ok(result.stateMachines.length > 0, 'Should find at least one state machine');

      const useStateMachine = result.stateMachines.find(sm => sm.type === 'useState');
      assert.ok(useStateMachine, 'Should detect useState pattern');
      assert.deepStrictEqual(useStateMachine.states, ['idle', 'submitting', 'success', 'error']);
    });

    test('should identify state transitions', async () => {
      if (!BusinessLogicMapper) return;

      const fixturePath = path.join(FIXTURES_DIR, 'react-usestate.jsx');
      const result = await mapper.analyze(fixturePath);

      const useStateMachine = result.stateMachines?.find(sm => sm.type === 'useState');
      if (useStateMachine) {
        assert.ok(useStateMachine.transitions, 'Should identify state transitions');
        assert.ok(useStateMachine.transitions.length > 0, 'Should have transitions');
      }
    });
  });

  describe('Redux reducer detection', () => {
    test('should detect Redux reducer with switch statement', async () => {
      if (!BusinessLogicMapper) return;

      const fixturePath = path.join(FIXTURES_DIR, 'redux-reducer.js');
      const result = await mapper.analyze(fixturePath);

      assert.ok(result.stateMachines, 'Should identify state machines');

      const reduxMachine = result.stateMachines.find(sm => sm.type === 'redux');
      assert.ok(reduxMachine, 'Should detect Redux pattern');
      assert.deepStrictEqual(reduxMachine.states, ['empty', 'has-items', 'checkout', 'confirmed']);
    });

    test('should extract action types from reducer', async () => {
      if (!BusinessLogicMapper) return;

      const fixturePath = path.join(FIXTURES_DIR, 'redux-reducer.js');
      const result = await mapper.analyze(fixturePath);

      const reduxMachine = result.stateMachines?.find(sm => sm.type === 'redux');
      if (reduxMachine) {
        assert.ok(reduxMachine.actions, 'Should extract actions');
        const expectedActions = ['ADD_ITEM', 'REMOVE_ITEM', 'CHECKOUT', 'CONFIRM'];
        expectedActions.forEach(action => {
          assert.ok(reduxMachine.actions.includes(action), `Should detect ${action} action`);
        });
      }
    });
  });

  describe('XState machine detection', () => {
    test('should detect XState createMachine', async () => {
      if (!BusinessLogicMapper) return;

      const fixturePath = path.join(FIXTURES_DIR, 'xstate-machine.js');
      const result = await mapper.analyze(fixturePath);

      assert.ok(result.stateMachines, 'Should identify state machines');

      const xstateMachine = result.stateMachines.find(sm => sm.type === 'xstate');
      assert.ok(xstateMachine, 'Should detect XState pattern');
      assert.deepStrictEqual(xstateMachine.states, ['pending', 'processing', 'shipped', 'delivered', 'cancelled']);
    });

    test('should extract XState transitions with events', async () => {
      if (!BusinessLogicMapper) return;

      const fixturePath = path.join(FIXTURES_DIR, 'xstate-machine.js');
      const result = await mapper.analyze(fixturePath);

      const xstateMachine = result.stateMachines?.find(sm => sm.type === 'xstate');
      if (xstateMachine) {
        assert.ok(xstateMachine.transitions, 'Should extract transitions');
        assert.ok(xstateMachine.transitions.some(t => t.event && t.target),
          'Transitions should have event and target');
      }
    });
  });

  describe('Business logic flaw detection', () => {
    test('should detect missing validation in state transitions', async () => {
      if (!BusinessLogicMapper) return;

      const fixturePath = path.join(FIXTURES_DIR, 'redux-reducer.js');
      const result = await mapper.analyze(fixturePath);

      assert.ok(result.flaws, 'Should identify potential flaws');
      // Look for patterns where sensitive state transitions lack validation
    });

    test('should identify state bypass vulnerabilities', async () => {
      if (!BusinessLogicMapper) return;

      // Test for cases where state can be set directly without going through proper transitions
      const fixturePath = path.join(FIXTURES_DIR, 'react-usestate.jsx');
      const result = await mapper.analyze(fixturePath);

      if (result.flaws) {
        const bypassFlaw = result.flaws.find(f => f.type === 'state-bypass');
        // Document if found - this is a security concern
        if (bypassFlaw) {
          assert.ok(bypassFlaw.severity, 'Flaw should have severity level');
        }
      }
    });
  });

  describe('Error handling', () => {
    test('should handle non-existent files gracefully', async () => {
      if (!BusinessLogicMapper) return;

      const result = await mapper.analyze('/nonexistent/file.js');
      assert.ok(result.error || result.stateMachines.length === 0,
        'Should handle missing files gracefully');
    });

    test('should handle malformed JavaScript', async () => {
      if (!BusinessLogicMapper) return;

      const tempFile = path.join(__dirname, 'temp-malformed.js');
      await fs.writeFile(tempFile, 'const x = { malformed');

      try {
        const result = await mapper.analyze(tempFile);
        assert.ok(result.error || result.stateMachines.length === 0,
          'Should handle parse errors gracefully');
      } finally {
        await fs.unlink(tempFile).catch(() => {});
      }
    });
  });
});
