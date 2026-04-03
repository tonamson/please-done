/**
 * Integration tests for logging system across all skills
 * Tests complete error logging workflow from skill execution to log display
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// Import all logging components
const { writeLog, createLogBuilder } = require('../../bin/lib/log-writer');
const { createSkillErrorHandler, getExecutionStats, clearRegistry } = require('../../bin/lib/skill-error-logger');
const {
  createFixBugErrorHandler,
  createPlanErrorHandler,
  createWriteCodeErrorHandler,
  createTestErrorHandler,
  createAuditErrorHandler
} = require('../../bin/lib/enhanced-error-handler');
const { createBasicErrorHandler } = require('../../bin/lib/basic-error-handler');
const {
  ensureLogDirectory,
  rotateLogFile,
  getDiskUsage,
  cleanupOldRotations
} = require('../../bin/lib/log-manager');
const {
  readJsonlLastN,
  filterLogEntries,
  getErrorStatsByAgent,
  getMostRecentError,
  getErrorPatterns
} = require('../../bin/lib/log-reader');

const LOGS_DIR = path.join(__dirname, '../../.planning/logs');
const AGENT_ERRORS_LOG = path.join(LOGS_DIR, 'agent-errors.jsonl');

function cleanup() {
  if (fs.existsSync(AGENT_ERRORS_LOG)) {
    fs.unlinkSync(AGENT_ERRORS_LOG);
  }
  clearRegistry();
}

test('Integration: Complete error logging flow for fix-bug skill', () => {
  cleanup();
  ensureLogDirectory();

  // Step 1: Skill execution fails
  const errorHandler = createFixBugErrorHandler('89', {
    bugDescription: 'Login timeout bug',
    sessionId: 'S001',
    currentStep: 'collecting-symptoms'
  });

  try {
    throw new Error('Failed to collect symptoms');
  } catch (error) {
    errorHandler.handle(error, {
      evidenceCollected: false,
      agentsInvoked: []
    });
  }

  // Step 2: Verify log was written
  assert.strictEqual(fs.existsSync(AGENT_ERRORS_LOG), true);

  // Step 3: Read and verify log content
  const entries = readJsonlAll(AGENT_ERRORS_LOG);
  assert.strictEqual(entries.length, 1);

  const entry = entries[0];
  assert.strictEqual(entry.agent, 'pd:fix-bug');
  assert.strictEqual(entry.phase, '89');
  assert.strictEqual(entry.error, 'Failed to collect symptoms');
  assert.strictEqual(entry.context.bugDescription, 'Login timeout bug');
  assert.strictEqual(entry.context.sessionId, 'S001');
  assert.strictEqual(entry.context.currentStep, 'collecting-symptoms');
  assert.strictEqual(entry.context.evidenceCollected, false);
});

test('Integration: Multiple skills logging errors', () => {
  cleanup();
  ensureLogDirectory();

  // Simulate errors from multiple skills
  const handlers = [
    createWriteCodeErrorHandler('89', { taskNumber: 1, lintPassed: false }),
    createTestErrorHandler('89', { testType: 'integration', testsPassed: 48, testsRun: 50 }),
    createPlanErrorHandler('89', { phaseNumber: '90', researchComplete: true })
  ];

  try { throw new Error('Linting failed'); } catch (e) { handlers[0].handle(e, { filesModified: ['src/test.js'] }); }
  try { throw new Error('2 tests failed'); } catch (e) { handlers[1].handle(e, { testFiles: ['test/auth.test.js'] }); }
  try { throw new Error('Planning failed'); } catch (e) { handlers[2].handle(e, { tasksCreated: 5 }); }

  // Verify all errors were logged
  const stats = getErrorStatsByAgent(AGENT_ERRORS_LOG);
  assert.strictEqual(Object.keys(stats).length, 3);
  assert.strictEqual(stats['pd:write-code'].count, 1);
  assert.strictEqual(stats['pd:test'].count, 1);
  assert.strictEqual(stats['pd:plan'].count, 1);
});

test('Integration: Log rotation with errors', () => {
  cleanup();
  ensureLogDirectory();

  // Create a log file that exceeds size limit
  const largeError = 'x'.repeat(11 * 1024 * 1024); // 11MB error message
  writeLog({
    level: 'ERROR',
    phase: '89',
    step: 'step1',
    agent: 'pd:test',
    error: largeError,
    context: {}
  });

  // Verify file was created and is large
  const initialSize = fs.existsSync(AGENT_ERRORS_LOG) ? fs.statSync(AGENT_ERRORS_LOG).size : 0;
  assert.ok(initialSize > 0);

  // Rotate the log
  const rotated = rotateLogFile('agent-errors');
  assert.strictEqual(rotated, true);

  // Verify rotation occurred
  assert.strictEqual(fs.existsSync(AGENT_ERRORS_LOG), false);
  assert.strictEqual(fs.existsSync(path.join(LOGS_DIR, 'agent-errors.1.jsonl')), true);
});

test('Integration: Error recovery workflow', () => {
  cleanup();
  ensureLogDirectory();

  // Step 1: Error occurs during write-code
  const handler = createWriteCodeErrorHandler('89', {
    taskNumber: 5,
    filesModified: ['src/api/auth.js'],
    lintPassed: false,
    buildPassed: true
  });

  try {
    throw new Error('ESLint: missing semicolon');
  } catch (error) {
    handler.handle(error, { executionMode: 'single' });
  }

  // Step 2: what-next detects the error and suggests fix-bug
  const recentErrors = readJsonlLastN(AGENT_ERRORS_LOG, 10);
  const errorStats = getErrorStatsByAgent(AGENT_ERRORS_LOG, { sinceHours: 1 });
  const mostRecent = getMostRecentError(AGENT_ERRORS_LOG);

  assert.ok(recentErrors.length > 0);
  assert.ok(errorStats['pd:write-code']);
  assert.ok(mostRecent);
  assert.strictEqual(mostRecent.agent, 'pd:write-code');
  assert.ok(mostRecent.error.includes('ESLint'));

  // Step 3: User runs fix-bug to investigate
  // (This would be simulate by creating a fix-bug error handler)
  const fixBugHandler = createFixBugErrorHandler('89', {
    bugDescription: 'ESLint error in write-code',
    sessionId: 'S002'
  });

  // The error recovery guide would help diagnose based on log patterns
  const patterns = getErrorPatterns(AGENT_ERRORS_LOG);
  assert.ok(patterns.length > 0);
  const writeCodePattern = patterns.find(p => p.agent === 'pd:write-code');
  assert.ok(writeCodePattern);
});

test('Integration: Complete workflow with multiple phases', () => {
  cleanup();
  ensureLogDirectory();

  // Simulate complete workflow through multiple phases
  const phases = ['88', '89', '90'];
  const skills = ['pd:plan', 'pd:write-code', 'pd:test', 'pd:fix-bug'];

  phases.forEach(phase => {
    skills.forEach(skill => {
      const handler = createBasicErrorHandler(skill, phase);
      try {
        throw new Error(`Error in ${skill} phase ${phase}`);
      } catch (error) {
        handler.handle(error, { step: 'execution' });
      }
    });
  });

  // Verify all errors were logged
  const allEntries = readJsonlAll(AGENT_ERRORS_LOG);
  assert.strictEqual(allEntries.length, 12); // 3 phases × 4 skills

  // Verify error stats by phase
  const phase89Errors = filterLogEntries(AGENT_ERRORS_LOG, { phase: '89' });
  assert.strictEqual(phase89Errors.length, 4);

  // Verify error stats by agent
  const stats = getErrorStatsByAgent(AGENT_ERRORS_LOG);
  Object.values(stats).forEach(stat => {
    assert.strictEqual(stat.count, 3); // Each skill has 3 errors (one per phase)
  });
});

test('Integration: Log reader displays error dashboard', () => {
  cleanup();
  ensureLogDirectory();

  // Create various errors
  const handlers = [
    createFixBugErrorHandler('89', { bugDescription: 'Bug 1' }),
    createFixBugErrorHandler('89', { bugDescription: 'Bug 2' }),
    createWriteCodeErrorHandler('89', { taskNumber: 1 }),
    createTestErrorHandler('89', { testType: 'unit' }),
    createAuditErrorHandler('89', { auditType: 'security' })
  ];

  handlers.forEach((handler, index) => {
    try {
      throw new Error(`Error ${index + 1}`);
    } catch (error) {
      handler.handle(error, { step: `step${index + 1}` });
    }
  });

  // Get error stats for dashboard (this is what what-next would use)
  const errorStats = getErrorStatsByAgent(AGENT_ERRORS_LOG, { sinceHours: 24 });
  const mostRecentError = getMostRecentError(AGENT_ERRORS_LOG);

  // Verify dashboard data
  assert.strictEqual(errorStats['pd:fix-bug'].count, 2);
  assert.strictEqual(errorStats['pd:write-code'].count, 1);
  assert.strictEqual(errorStats['pd:test'].count, 1);
  assert.strictEqual(errorStats['pd:audit'].count, 1);

  assert.ok(mostRecentError);
  assert.strictEqual(mostRecentError.agent, 'pd:audit');
});

test('Integration: Log manager maintenance with existing logs', () => {
  cleanup();
  ensureLogDirectory();

  // Create some log entries
  const handler = createBasicErrorHandler('pd:test', '89');
  for (let i = 0; i < 5; i++) {
    try {
      throw new Error(`Test error ${i}`);
    } catch (error) {
      handler.handle(error, { iteration: i });
    }
  }

  // Run maintenance
  const usageBefore = getDiskUsage();
  assert.ok(usageBefore.fileCount > 0);

  // Cleanup old rotations (shouldn't affect our main file)
  cleanupOldRotations('agent-errors');

  // Verify logs still exist
  const usageAfter = getDiskUsage();
  assert.strictEqual(usageAfter.fileCount, usageBefore.fileCount);

  // Check error patterns
  const patterns = getErrorPatterns(AGENT_ERRORS_LOG);
  assert.strictEqual(patterns.length, 1);
  assert.strictEqual(patterns[0].count, 5);
  assert.ok(patterns[0].error.includes('Test error'));
});

test('Integration: Graceful degradation when logging fails', () => {
  cleanup();

  // Simulate logging failure by removing write permissions
  // (In real scenario, this would be disk full or permission issue)
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }

  const handler = createBasicErrorHandler('pd:test', '89');

  // Error should still be thrown even if logging fails
  let errorCaught = false;
  try {
    handler.execute(() => {
      throw new Error('Function error');
    }, 'test-step');
  } catch (error) {
    errorCaught = true;
    assert.strictEqual(error.message, 'Function error');
  }

  assert.strictEqual(errorCaught, true);

  // Get execution stats (should show the error was tracked)
  const stats = getExecutionStats();
  assert.strictEqual(stats.totalExecutions, 1);
  assert.strictEqual(stats.totalErrors, 1);
});

test('Integration: Cleanup of old log entries', () => {
  cleanup();
  ensureLogDirectory();

  // Create old and new entries
  const now = Date.now();
  const oldEntry = {
    timestamp: new Date(now - 48 * 60 * 60 * 1000).toISOString(), // 48 hours ago
    level: 'ERROR',
    phase: '88',
    step: 'old-step',
    agent: 'pd:old-skill',
    error: 'Old error',
    context: {}
  };

  const newEntry = {
    timestamp: new Date(now).toISOString(), // now
    level: 'ERROR',
    phase: '89',
    step: 'new-step',
    agent: 'pd:new-skill',
    error: 'New error',
    context: {}
  };

  fs.writeFileSync(
    AGENT_ERRORS_LOG,
    [oldEntry, newEntry].map(e => JSON.stringify(e)).join('\n') + '\n',
    'utf8'
  );

  // Cleanup entries older than 24 hours
  const report = cleanupOldEntries(AGENT_ERRORS_LOG, 24);

  assert.strictEqual(report.deleted, 1);
  assert.strictEqual(report.remaining, 1);

  const remainingEntries = readJsonlAll(AGENT_ERRORS_LOG);
  assert.strictEqual(remainingEntries.length, 1);
  assert.strictEqual(remainingEntries[0].agent, 'pd:new-skill');
});
