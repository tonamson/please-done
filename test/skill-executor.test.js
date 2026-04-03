/**
 * Tests for skill-executor.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { writeLog, createLogBuilder } from '../bin/lib/log-writer.js';
import {
  wrapSkillExecution,
  executeSkill,
  createSkillExecutor
} from '../bin/lib/skill-executor.js';
import { join } from 'path';
import { readFileSync, unlinkSync, existsSync } from 'fs';

const LOGS_DIR = join(process.cwd(), '.planning/logs');
const LOG_FILE = join(LOGS_DIR, 'agent-errors.jsonl');

describe('skill-executor', () => {
  // Clean up log file before each test
  function cleanupLog() {
    if (existsSync(LOG_FILE)) {
      unlinkSync(LOG_FILE);
    }
  }

  // Helper to read and parse log entries
  function readLogEntries() {
    if (!existsSync(LOG_FILE)) {
      return [];
    }
    const content = readFileSync(LOG_FILE, 'utf8');
    return content
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
  }

  describe('wrapSkillExecution', () => {
    it('should execute skill function successfully', async () => {
      cleanupLog();

      const skillFn = async (x, y) => x + y;
      const wrapped = wrapSkillExecution(skillFn, {
        phase: '89',
        step: 'test-add',
        agent: 'test-agent'
      });

      const result = await wrapped(2, 3);
      assert.strictEqual(result, 5);

      // No errors should be logged
      const entries = readLogEntries();
      assert.strictEqual(entries.length, 0);
    });

    it('should log errors and re-throw them', async () => {
      cleanupLog();

      const skillFn = async () => {
        throw new Error('Test error');
      };
      const wrapped = wrapSkillExecution(skillFn, {
        phase: '89',
        step: 'test-error',
        agent: 'test-agent'
      });

      try {
        await wrapped();
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.strictEqual(error.message, 'Test error');
      }

      // Error should be logged
      const entries = readLogEntries();
      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0].level, 'ERROR');
      assert.strictEqual(entries[0].phase, '89');
      assert.strictEqual(entries[0].step, 'test-error');
      assert.strictEqual(entries[0].agent, 'test-agent');
      assert.strictEqual(entries[0].error, 'Test error');
      assert.ok(entries[0].context.stack);
    });

    it('should include function arguments in error context', async () => {
      cleanupLog();

      const skillFn = async (arg1, arg2) => {
        throw new Error('Error with args');
      };
      const wrapped = wrapSkillExecution(skillFn, {
        phase: '89',
        step: 'test-args',
        agent: 'test-agent'
      });

      try {
        await wrapped('test', { foo: 'bar' });
        assert.fail('Should have thrown error');
      } catch (error) {
        // Expected
      }

      const entries = readLogEntries();
      assert.strictEqual(entries.length, 1);
      assert.deepStrictEqual(entries[0].context.args, ['test', { foo: 'bar' }]);
    });

    it('should use log builder correctly for warnings', async () => {
      cleanupLog();

      const skillFn = async () => {
        // Create a warning log manually
        const logBuilder = createLogBuilder({
          phase: '89',
          step: 'test-warning',
          agent: 'test-agent'
        });
        logBuilder.warn('Test warning', { reason: 'test' });
        return 'success';
      };

      const wrapped = wrapSkillExecution(skillFn, {
        phase: '89',
        step: 'test-warning',
        agent: 'test-agent'
      });

      const result = await wrapped();
      assert.strictEqual(result, 'success');

      const entries = readLogEntries();
      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0].level, 'WARN');
      assert.strictEqual(entries[0].error, 'Test warning');
      assert.deepStrictEqual(entries[0].context.reason, 'test');
    });
  });

  describe('executeSkill', () => {
    it('should execute skill and return result', async () => {
      cleanupLog();

      const skillFn = async (name) => `Hello, ${name}!`;
      const result = await executeSkill(skillFn, {
        phase: '89',
        step: 'test-execute',
        agent: 'test-agent'
      }, 'World');

      assert.strictEqual(result, 'Hello, World!');
    });

    it('should log and re-throw errors', async () => {
      cleanupLog();

      const skillFn = async () => {
        throw new Error('Execute error');
      };

      try {
        await executeSkill(skillFn, {
          phase: '89',
          step: 'test-execute-error',
          agent: 'test-agent'
        });
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.strictEqual(error.message, 'Execute error');
      }

      const entries = readLogEntries();
      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0].level, 'ERROR');
      assert.strictEqual(entries[0].error, 'Execute error');
    });
  });

  describe('createSkillExecutor', () => {
    it('should create executor with wrap method', async () => {
      cleanupLog();

      const executor = createSkillExecutor('test-agent', '89');
      const skillFn = async (x) => x * 2;

      const wrapped = executor.wrap(skillFn, 'multiply-step');
      const result = await wrapped(5);

      assert.strictEqual(result, 10);
    });

    it('should create executor with execute method', async () => {
      cleanupLog();

      const executor = createSkillExecutor('test-agent', '89');
      const skillFn = async (a, b) => a + b;

      const result = await executor.execute(skillFn, 'add-step', 3, 4);
      assert.strictEqual(result, 7);
    });

    it('should use defaults in all log entries', async () => {
      cleanupLog();

      const executor = createSkillExecutor('test-agent', '89', {
        environment: 'test',
        version: '1.0'
      });

      const skillFn = async () => {
        throw new Error('Default test error');
      };

      try {
        await executor.execute(skillFn, 'default-test');
        assert.fail('Should have thrown error');
      } catch (error) {
        // Expected
      }

      const entries = readLogEntries();
      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0].context.environment, 'test');
      assert.strictEqual(entries[0].context.version, '1.0');
    });

    it('should handle multiple executions with same executor', async () => {
      cleanupLog();

      const executor = createSkillExecutor('multi-agent', '89');

      // First execution succeeds
      const skill1 = async () => 'first';
      const result1 = await executor.execute(skill1, 'step-1');
      assert.strictEqual(result1, 'first');

      // Second execution fails
      const skill2 = async () => {
        throw new Error('Second error');
      };
      try {
        await executor.execute(skill2, 'step-2');
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.strictEqual(error.message, 'Second error');
      }

      // Third execution succeeds
      const skill3 = async () => 'third';
      const result3 = await executor.execute(skill3, 'step-3');
      assert.strictEqual(result3, 'third');

      // Only one error should be logged
      const entries = readLogEntries();
      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0].step, 'step-2');
    });
  });

  describe('error handling edge cases', () => {
    it('should handle non-Error exceptions', async () => {
      cleanupLog();

      const skillFn = async () => {
        throw 'String error';
      };
      const wrapped = wrapSkillExecution(skillFn, {
        phase: '89',
        step: 'non-error-test',
        agent: 'test-agent'
      });

      try {
        await wrapped();
        assert.fail('Should have thrown');
      } catch (error) {
        assert.strictEqual(error, 'String error');
      }

      const entries = readLogEntries();
      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0].error, 'String error');
    });

    it('should handle errors without messages', async () => {
      cleanupLog();

      const skillFn = async () => {
        throw {}; // Empty object
      };
      const wrapped = wrapSkillExecution(skillFn, {
        phase: '89',
        step: 'empty-error-test',
        agent: 'test-agent'
      });

      try {
        await wrapped();
        assert.fail('Should have thrown');
      } catch (error) {
        assert.deepStrictEqual(error, {});
      }

      const entries = readLogEntries();
      assert.strictEqual(entries.length, 1);
      // Should convert to string
      assert.ok(entries[0].error.length > 0);
    });

    it('should log to console.error on log write failure', async () => {
      // This test checks the fallback behavior
      const originalConsoleError = console.error;
      const consoleErrors = [];
      console.error = (...args) => consoleErrors.push(args.join(' '));

      cleanupLog();

      const skillFn = async () => {
        throw new Error('Test for console fallback');
      };

      const wrapped = wrapSkillExecution(skillFn, {
        phase: '89',
        step: 'console-fallback-test',
        agent: 'test-agent'
      });

      try {
        await wrapped();
      } catch (error) {
        // Expected
      }

      // Restore console.error
      console.error = originalConsoleError;

      // Check that error was logged to console
      assert.ok(consoleErrors.some(msg => msg.includes('test-agent')));
      assert.ok(consoleErrors.some(msg => msg.includes('console-fallback-test')));
    });
  });
});
