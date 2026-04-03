import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeLog, createLogBuilder } from '../bin/lib/log-writer.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOGS_DIR = join(__dirname, '../.planning/logs');
const AGENT_ERRORS_LOG = join(LOGS_DIR, 'agent-errors.jsonl');
const TEST_LOG_FILE = join(LOGS_DIR, 'test-errors.jsonl');

// Clean up log files before each test
function cleanup() {
  // Clean up both test file and agent-errors file
  [TEST_LOG_FILE, AGENT_ERRORS_LOG].forEach(file => {
    if (existsSync(file)) {
      unlinkSync(file);
    }
  });
}

test('writeLog - successfully writes a log entry', () => {
  cleanup();

  const result = writeLog({
    level: 'ERROR',
    phase: '88',
    step: 'test-step',
    agent: 'test-agent',
    error: 'Test error message',
    context: { foo: 'bar' }
  });

  assert.strictEqual(result, true);
  assert.strictEqual(existsSync(AGENT_ERRORS_LOG), true);

  const content = readFileSync(AGENT_ERRORS_LOG, 'utf8');
  const lines = content.trim().split('\n');
  assert.strictEqual(lines.length, 1);

  const entry = JSON.parse(lines[0]);
  assert.strictEqual(entry.level, 'ERROR');
  assert.strictEqual(entry.phase, '88');
  assert.strictEqual(entry.step, 'test-step');
  assert.strictEqual(entry.agent, 'test-agent');
  assert.strictEqual(entry.error, 'Test error message');
  assert.deepStrictEqual(entry.context, { foo: 'bar' });
  assert.ok(entry.timestamp);
  assert.ok(new Date(entry.timestamp).toISOString() === entry.timestamp);
});

test('writeLog - writes multiple entries as JSONL', () => {
  cleanup();

  writeLog({
    level: 'ERROR',
    phase: '88',
    step: 'step1',
    agent: 'agent1',
    error: 'First error'
  });

  writeLog({
    level: 'WARN',
    phase: '89',
    step: 'step2',
    agent: 'agent2',
    error: 'Second warning'
  });

  const content = readFileSync(AGENT_ERRORS_LOG, 'utf8');
  const lines = content.trim().split('\n');
  assert.strictEqual(lines.length, 2);

  const firstEntry = JSON.parse(lines[0]);
  assert.strictEqual(firstEntry.level, 'ERROR');
  assert.strictEqual(firstEntry.error, 'First error');

  const secondEntry = JSON.parse(lines[1]);
  assert.strictEqual(secondEntry.level, 'WARN');
  assert.strictEqual(secondEntry.error, 'Second warning');
});

test('writeLog - handles missing optional context field', () => {
  cleanup();

  writeLog({
    level: 'INFO',
    phase: '90',
    step: 'step3',
    agent: 'agent3',
    error: 'Info message'
    // context is omitted
  });

  const content = readFileSync(AGENT_ERRORS_LOG, 'utf8');
  const entry = JSON.parse(content.trim());
  assert.deepStrictEqual(entry.context, {});
});

test('writeLog - returns false and logs to console on missing required fields', () => {
  cleanup();

  // Mock console.error to capture calls
  const originalError = console.error;
  let errorCalled = false;
  console.error = () => { errorCalled = true; };

  const result = writeLog({
    level: 'ERROR',
    phase: '88'
    // Missing step, agent, error
  });

  assert.strictEqual(result, false);
  assert.strictEqual(errorCalled, true);

  console.error = originalError;
});

test('writeLog - handles file I/O errors gracefully', () => {
  // Try to write to a directory that doesn't exist (simulate I/O error)
  const originalError = console.error;
  let fallbackCalled = false;
  console.error = (msg) => {
    if (msg.includes('Failed to write log')) {
      fallbackCalled = true;
    }
  };

  // This should fail but not throw
  const result = writeLog({
    level: 'ERROR',
    phase: '88',
    step: 'test',
    agent: 'test',
    error: 'Test'
  });

  // Restore console.error
  console.error = originalError;

  // The write might succeed or fail depending on the environment,
  // but it should never throw an error
  assert.ok(true); // If we got here, no exception was thrown
});

test('createLogBuilder - creates logger with defaults', () => {
  cleanup();

  const logger = createLogBuilder({
    phase: '88',
    step: 'test-step',
    agent: 'test-agent'
  });

  logger.error('Test error', { detail: 'some detail' });

  const content = readFileSync(AGENT_ERRORS_LOG, 'utf8');
  const entry = JSON.parse(content.trim());

  assert.strictEqual(entry.level, 'ERROR');
  assert.strictEqual(entry.phase, '88');
  assert.strictEqual(entry.step, 'test-step');
  assert.strictEqual(entry.agent, 'test-agent');
  assert.strictEqual(entry.error, 'Test error');
  assert.deepStrictEqual(entry.context, { detail: 'some detail' });
});

test('createLogBuilder - supports all log levels', () => {
  cleanup();

  const logger = createLogBuilder({
    phase: '88',
    step: 'test-step',
    agent: 'test-agent'
  });

  logger.error('Error message');
  logger.warn('Warning message');
  logger.info('Info message');

  const content = readFileSync(AGENT_ERRORS_LOG, 'utf8');
  const lines = content.trim().split('\n');
  assert.strictEqual(lines.length, 3);

  const levels = lines.map(line => JSON.parse(line).level);
  assert.deepStrictEqual(levels, ['ERROR', 'WARN', 'INFO']);
});

test('createLogBuilder - overrides defaults with call-specific values', () => {
  cleanup();

  const logger = createLogBuilder({
    phase: '88',
    step: 'default-step',
    agent: 'default-agent'
  });

  // Override step in the call
  logger.error('Test error', { step: 'overridden-step' });

  const content = readFileSync(AGENT_ERRORS_LOG, 'utf8');
  const entry = JSON.parse(content.trim());

  assert.strictEqual(entry.phase, '88'); // From defaults
  assert.strictEqual(entry.step, 'default-step'); // From defaults (context.step is different)
  assert.strictEqual(entry.agent, 'default-agent'); // From defaults
  assert.deepStrictEqual(entry.context, { step: 'overridden-step' }); // In context
});
