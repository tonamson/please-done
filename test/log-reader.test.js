const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const {
  readJsonlLastN,
  readJsonlAll,
  filterLogEntries,
  getErrorStatsByAgent,
  getMostRecentError,
  getErrorPatterns,
  cleanupOldEntries
} = require('../bin/lib/log-reader');

const TEST_LOG_FILE = path.join(__dirname, 'test-logs.jsonl');

function cleanup() {
  if (fs.existsSync(TEST_LOG_FILE)) {
    fs.unlinkSync(TEST_LOG_FILE);
  }
}

function createTestEntries() {
  const now = Date.now();
  const entries = [
    {
      timestamp: new Date(now - 3600000).toISOString(), // 1 hour ago
      level: 'ERROR',
      phase: '89',
      step: 'step1',
      agent: 'pd:fix-bug',
      error: 'First error',
      context: {}
    },
    {
      timestamp: new Date(now - 1800000).toISOString(), // 30 minutes ago
      level: 'WARN',
      phase: '89',
      step: 'step2',
      agent: 'pd:write-code',
      error: 'Warning message',
      context: {}
    },
    {
      timestamp: new Date(now - 900000).toISOString(), // 15 minutes ago
      level: 'ERROR',
      phase: '89',
      step: 'step3',
      agent: 'pd:test',
      error: 'Test failure',
      context: {}
    },
    {
      timestamp: new Date(now).toISOString(), // now
      level: 'INFO',
      phase: '90',
      step: 'step4',
      agent: 'pd:plan',
      error: 'Info message',
      context: {}
    }
  ];

  const content = entries.map(e => JSON.stringify(e)).join('\n') + '\n';
  fs.writeFileSync(TEST_LOG_FILE, content, 'utf8');
  return entries;
}

test('readJsonlLastN - reads last N entries correctly', () => {
  cleanup();
  createTestEntries();

  const entries = readJsonlLastN(TEST_LOG_FILE, 2);

  assert.strictEqual(entries.length, 2);
  assert.strictEqual(entries[0].error, 'Test failure');
  assert.strictEqual(entries[1].error, 'Info message');
});

test('readJsonlLastN - returns empty array for missing file', () => {
  cleanup();

  const entries = readJsonlLastN(TEST_LOG_FILE, 10);

  assert.strictEqual(entries.length, 0);
});

test('readJsonlLastN - handles invalid JSON gracefully', () => {
  cleanup();
  fs.writeFileSync(TEST_LOG_FILE, '{"valid": true}\n{invalid json}\n{"also": "valid"}\n');

  const entries = readJsonlLastN(TEST_LOG_FILE, 10);

  assert.strictEqual(entries.length, 2);
  assert.strictEqual(entries[0].valid, true);
  assert.strictEqual(entries[1].also, 'valid');
});

test('readJsonlAll - reads all entries', () => {
  cleanup();
  createTestEntries();

  const entries = readJsonlAll(TEST_LOG_FILE);

  assert.strictEqual(entries.length, 4);
});

test('filterLogEntries - filters by agent', () => {
  cleanup();
  createTestEntries();

  const entries = filterLogEntries(TEST_LOG_FILE, { agent: 'pd:fix-bug' });

  assert.strictEqual(entries.length, 1);
  assert.strictEqual(entries[0].agent, 'pd:fix-bug');
  assert.strictEqual(entries[0].error, 'First error');
});

test('filterLogEntries - filters by level', () => {
  cleanup();
  createTestEntries();

  const entries = filterLogEntries(TEST_LOG_FILE, { level: 'ERROR' });

  assert.strictEqual(entries.length, 2);
  entries.forEach(entry => {
    assert.strictEqual(entry.level, 'ERROR');
  });
});

test('filterLogEntries - filters by time range', () => {
  cleanup();
  createTestEntries();

  const entries = filterLogEntries(TEST_LOG_FILE, { sinceHours: 0.5 }); // Last 30 minutes

  assert.strictEqual(entries.length, 2);
  // Should only include entries from last 30 minutes
  entries.forEach(entry => {
    const entryTime = new Date(entry.timestamp).getTime();
    const cutoffTime = Date.now() - (0.5 * 60 * 60 * 1000);
    assert.ok(entryTime >= cutoffTime);
  });
});

test('filterLogEntries - combines multiple filters', () => {
  cleanup();
  createTestEntries();

  const entries = filterLogEntries(TEST_LOG_FILE, {
    level: 'ERROR',
    agent: 'pd:fix-bug'
  });

  assert.strictEqual(entries.length, 1);
  assert.strictEqual(entries[0].level, 'ERROR');
  assert.strictEqual(entries[0].agent, 'pd:fix-bug');
});

test('getErrorStatsByAgent - returns correct statistics', () => {
  cleanup();
  createTestEntries();

  const stats = getErrorStatsByAgent(TEST_LOG_FILE);

  assert.strictEqual(stats['pd:fix-bug'].count, 1);
  assert.strictEqual(stats['pd:test'].count, 1);
  assert.ok(stats['pd:fix-bug'].firstSeen);
  assert.ok(stats['pd:fix-bug'].lastSeen);
});

test('getErrorStatsByAgent - filters by time range', () => {
  cleanup();
  createTestEntries();

  const stats = getErrorStatsByAgent(TEST_LOG_FILE, { sinceHours: 0.25 }); // Last 15 minutes

  // Should only include recent errors
  assert.strictEqual(Object.keys(stats).length, 1);
  assert.strictEqual(stats['pd:test'].count, 1);
});

test('getMostRecentError - returns most recent error', () => {
  cleanup();
  const entries = createTestEntries();

  const mostRecent = getMostRecentError(TEST_LOG_FILE);

  assert.ok(mostRecent);
  assert.strictEqual(mostRecent.level, 'INFO');
  assert.strictEqual(mostRecent.agent, 'pd:plan');
});

test('getErrorPatterns - finds unique error patterns', () => {
  cleanup();

  const entries = [
    { timestamp: new Date().toISOString(), level: 'ERROR', agent: 'pd:test', error: 'Test failed', context: {} },
    { timestamp: new Date().toISOString(), level: 'ERROR', agent: 'pd:test', error: 'Test failed', context: {} },
    { timestamp: new Date().toISOString(), level: 'ERROR', agent: 'pd:test', error: 'Different error', context: {} }
  ];

  const content = entries.map(e => JSON.stringify(e)).join('\n') + '\n';
  fs.writeFileSync(TEST_LOG_FILE, content, 'utf8');

  const patterns = getErrorPatterns(TEST_LOG_FILE);

  assert.strictEqual(patterns.length, 2);
  assert.strictEqual(patterns[0].error, 'Test failed');
  assert.strictEqual(patterns[0].count, 2);
  assert.strictEqual(patterns[1].error, 'Different error');
  assert.strictEqual(patterns[1].count, 1);
});

test('cleanupOldEntries - removes old entries', () => {
  cleanup();
  createTestEntries();

  const report = cleanupOldEntries(TEST_LOG_FILE, 0.5); // Remove entries older than 30 minutes

  assert.strictEqual(report.deleted, 2); // First two entries are older
  assert.strictEqual(report.remaining, 2); // Last two entries are recent

  const remainingEntries = readJsonlAll(TEST_LOG_FILE);
  assert.strictEqual(remainingEntries.length, 2);
});

test('cleanupOldEntries - handles empty file', () => {
  cleanup();

  const report = cleanupOldEntries(TEST_LOG_FILE, 24);

  assert.strictEqual(report.deleted, 0);
  assert.strictEqual(report.remaining, 0);
});

test('Log reader - integration test with actual log format', () => {
  cleanup();

  // Create entries that match actual log format
  const logEntries = [
    {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      phase: '89',
      step: 'task-1',
      agent: 'pd:write-code',
      error: 'Linting failed',
      context: {
        taskNumber: 1,
        filesModified: ['src/test.js'],
        lintPassed: false,
        stack: 'Error: Linting failed\n    at ...'
      }
    },
    {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      phase: '89',
      step: 'task-2',
      agent: 'pd:test',
      error: 'Test failed: expected true but got false',
      context: {
        testType: 'integration',
        stack: 'AssertionError: expected true but got false\n    at ...'
      }
    }
  ];

  const content = logEntries.map(e => JSON.stringify(e)).join('\n') + '\n';
  fs.writeFileSync(TEST_LOG_FILE, content, 'utf8');

  // Test reading and filtering
  const writeCodeErrors = filterLogEntries(TEST_LOG_FILE, { agent: 'pd:write-code' });
  assert.strictEqual(writeCodeErrors.length, 1);
  assert.strictEqual(writeCodeErrors[0].context.lintPassed, false);

  const testErrors = filterLogEntries(TEST_LOG_FILE, { agent: 'pd:test' });
  assert.strictEqual(testErrors.length, 1);
  assert.ok(testErrors[0].error.includes('expected true'));

  const allErrors = filterLogEntries(TEST_LOG_FILE, { level: 'ERROR' });
  assert.strictEqual(allErrors.length, 2);
});
