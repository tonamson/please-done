/**
 * Tests for skill-error-logger.js
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const {
  registerSkillExecution,
  logSkillError,
  getExecutionStats,
  clearRegistry,
  createSkillErrorHandler
} = require('../bin/lib/skill-error-logger');

const LOGS_DIR = path.join(process.cwd(), '.planning/logs');
const LOG_FILE = path.join(LOGS_DIR, 'agent-errors.jsonl');

describe('skill-error-logger', () => {
  beforeEach(() => {
    // Clear registry before each test
    clearRegistry();

    // Clean up log file
    if (fs.existsSync(LOG_FILE)) {
      fs.unlinkSync(LOG_FILE);
    }
  });

  describe('registerSkillExecution', () => {
    it('should register a skill execution and return a key', () => {
      const key = registerSkillExecution('test-skill', '89', { foo: 'bar' });

      assert.ok(key);
      assert.strictEqual(key, 'test-skill:89');

      const stats = getExecutionStats();
      assert.strictEqual(stats.totalExecutions, 1);
      assert.strictEqual(stats.executions[0].skillName, 'test-skill');
      assert.strictEqual(stats.executions[0].phase, '89');
    });
  });

  describe('logSkillError', () => {
    it('should log an error for registered execution', () => {
      const key = registerSkillExecution('test-skill', '89');
      const error = new Error('Test error');

      const result = logSkillError(key, error, { step: 'test-step' });
      assert.strictEqual(result, true);

      // Check log file
      assert.ok(fs.existsSync(LOG_FILE));
      const logContent = fs.readFileSync(LOG_FILE, 'utf8');
      const entries = logContent.split('\n').filter(line => line.trim()).map(JSON.parse);

      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0].level, 'ERROR');
      assert.strictEqual(entries[0].phase, '89');
      assert.strictEqual(entries[0].agent, 'test-skill');
      assert.strictEqual(entries[0].error, 'Test error');
      assert.ok(entries[0].context.stack);
      assert.strictEqual(entries[0].context.step, 'test-step');
    });

    it('should handle errors for unregistered execution', () => {
      const error = new Error('Test error');
      const result = logSkillError('non-existent-key', error);

      assert.strictEqual(result, false);
      // Should log to console.error (we can't easily test this without mocking)
    });

    it('should handle string errors', () => {
      const key = registerSkillExecution('test-skill', '89');
      const result = logSkillError(key, 'String error');

      assert.strictEqual(result, true);

      const stats = getExecutionStats();
      assert.strictEqual(stats.totalErrors, 1);
    });
  });

  describe('createSkillErrorHandler', () => {
    it('should create an error handler for a skill', () => {
      const handler = createSkillErrorHandler('test-skill', '89');

      assert.ok(handler);
      assert.ok(handler.handle);
      assert.ok(handler.wrap);
      assert.ok(handler.execute);
      assert.ok(handler.getExecutionKey);
    });

    it('should handle errors and re-throw them', () => {
      const handler = createSkillErrorHandler('test-skill', '89');
      const error = new Error('Handler test error');

      try {
        handler.handle(error, { custom: 'context' });
        assert.fail('Should have thrown error');
      } catch (thrownError) {
        assert.strictEqual(thrownError, error);
      }

      // Check stats
      const stats = getExecutionStats();
      assert.strictEqual(stats.totalErrors, 1);
      assert.strictEqual(stats.executions[0].errorCount, 1);
    });

    it('should wrap functions with error handling', async () => {
      const handler = createSkillErrorHandler('test-skill', '89');
      let errorCaught = false;

      const failingFn = async () => {
        throw new Error('Wrapped function error');
      };

      const wrappedFn = handler.wrap(failingFn, 'test-step');

      try {
        await wrappedFn();
      } catch (error) {
        errorCaught = true;
        assert.strictEqual(error.message, 'Wrapped function error');
      }

      assert.ok(errorCaught);

      const stats = getExecutionStats();
      assert.strictEqual(stats.totalErrors, 1);
    });

    it('should execute functions with error handling', async () => {
      const handler = createSkillErrorHandler('test-skill', '89');

      const successFn = async (x, y) => x + y;
      const result = await handler.execute(successFn, 'add-step', 2, 3);
      assert.strictEqual(result, 5);

      // No errors should be logged
      const stats = getExecutionStats();
      assert.strictEqual(stats.totalErrors, 0);
    });

    it('should track multiple errors', async () => {
      const handler = createSkillErrorHandler('test-skill', '89');

      const errorFn1 = async () => {
        throw new Error('First error');
      };
      const errorFn2 = async () => {
        throw new Error('Second error');
      };

      try { await handler.execute(errorFn1, 'step-1'); } catch (e) { /* expected */ }
      try { await handler.execute(errorFn2, 'step-2'); } catch (e) { /* expected */ }

      const stats = getExecutionStats();
      assert.strictEqual(stats.totalErrors, 2);
      assert.strictEqual(stats.executions[0].errorCount, 2);
    });
  });

  describe('getExecutionStats', () => {
    it('should return accurate statistics', () => {
      // Register multiple executions
      registerSkillExecution('skill-1', '89');
      registerSkillExecution('skill-2', '89');
      registerSkillExecution('skill-3', '90');

      // Log some errors
      logSkillError('skill-1:89', new Error('Error 1'));
      logSkillError('skill-1:89', new Error('Error 2'));
      logSkillError('skill-2:89', new Error('Error 3'));

      const stats = getExecutionStats();

      assert.strictEqual(stats.totalExecutions, 3);
      assert.strictEqual(stats.totalErrors, 3);
      assert.strictEqual(stats.executions.length, 3);

      // Find specific execution
      const skill1Execution = stats.executions.find(e => e.skillName === 'skill-1');
      assert.ok(skill1Execution);
      assert.strictEqual(skill1Execution.errorCount, 2);
    });
  });

  describe('clearRegistry', () => {
    it('should clear all executions', () => {
      registerSkillExecution('skill-1', '89');
      registerSkillExecution('skill-2', '89');

      let stats = getExecutionStats();
      assert.strictEqual(stats.totalExecutions, 2);

      clearRegistry();

      stats = getExecutionStats();
      assert.strictEqual(stats.totalExecutions, 0);
      assert.strictEqual(stats.totalErrors, 0);
    });
  });
});
