const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const {
  createFixBugErrorHandler,
  createPlanErrorHandler,
  createWriteCodeErrorHandler,
  createTestErrorHandler,
  createAuditErrorHandler
} = require('../bin/lib/enhanced-error-handler');

const LOGS_DIR = path.join(__dirname, '../.planning/logs');
const AGENT_ERRORS_LOG = path.join(LOGS_DIR, 'agent-errors.jsonl');

function cleanup() {
  if (fs.existsSync(AGENT_ERRORS_LOG)) {
    fs.unlinkSync(AGENT_ERRORS_LOG);
  }
}

test('createFixBugErrorHandler - logs error with rich context', () => {
  cleanup();

  const handler = createFixBugErrorHandler('89', {
    bugDescription: 'Login timeout bug',
    sessionId: 'S001',
    currentStep: 'collecting-symptoms'
  });

  try {
    throw new Error('Failed to collect symptoms');
  } catch (error) {
    handler.handle(error, {
      evidenceCollected: true,
      agentsInvoked: ['janitor', 'detective']
    });
  }

  const content = fs.readFileSync(AGENT_ERRORS_LOG, 'utf8');
  const entry = JSON.parse(content.trim());

  assert.strictEqual(entry.agent, 'pd:fix-bug');
  assert.strictEqual(entry.phase, '89');
  assert.strictEqual(entry.error, 'Failed to collect symptoms');
  assert.strictEqual(entry.context.bugDescription, 'Login timeout bug');
  assert.strictEqual(entry.context.sessionId, 'S001');
  assert.strictEqual(entry.context.currentStep, 'collecting-symptoms');
  assert.strictEqual(entry.context.evidenceCollected, true);
  assert.deepStrictEqual(entry.context.agentsInvoked, ['janitor', 'detective']);
  assert.ok(entry.context.stack);
});

test('createPlanErrorHandler - logs planning errors with context', () => {
  cleanup();

  const handler = createPlanErrorHandler('89', {
    phaseNumber: '89',
    requirements: ['LOG-01', 'STATUS-01'],
    researchComplete: true
  });

  try {
    throw new Error('Failed to create tasks');
  } catch (error) {
    handler.handle(error, {
      planningMode: 'auto',
      tasksCreated: 5
    });
  }

  const content = fs.readFileSync(AGENT_ERRORS_LOG, 'utf8');
  const entry = JSON.parse(content.trim());

  assert.strictEqual(entry.agent, 'pd:plan');
  assert.strictEqual(entry.context.phaseNumber, '89');
  assert.strictEqual(entry.context.requirementsCount, 2);
  assert.strictEqual(entry.context.researchComplete, true);
  assert.strictEqual(entry.context.planningMode, 'auto');
  assert.strictEqual(entry.context.tasksCreated, 5);
});

test('createWriteCodeErrorHandler - logs code writing errors with context', () => {
  cleanup();

  const handler = createWriteCodeErrorHandler('89', {
    taskNumber: 3,
    filesModified: ['src/api/auth.js', 'src/types/user.js'],
    lintPassed: false,
    buildPassed: true
  });

  try {
    throw new Error('Linting failed due to syntax error');
  } catch (error) {
    handler.handle(error, {
      executionMode: 'parallel'
    });
  }

  const content = fs.readFileSync(AGENT_ERRORS_LOG, 'utf8');
  const entry = JSON.parse(content.trim());

  assert.strictEqual(entry.agent, 'pd:write-code');
  assert.strictEqual(entry.context.taskNumber, 3);
  assert.strictEqual(entry.context.filesModifiedCount, 2);
  assert.deepStrictEqual(entry.context.filesModified, ['src/api/auth.js', 'src/types/user.js']);
  assert.strictEqual(entry.context.lintPassed, false);
  assert.strictEqual(entry.context.buildPassed, true);
  assert.strictEqual(entry.context.executionMode, 'parallel');
});

test('createTestErrorHandler - logs testing errors with context', () => {
  cleanup();

  const handler = createTestErrorHandler('89', {
    testType: 'integration',
    testFiles: ['test/auth.test.js', 'test/api.test.js'],
    testsRun: 50,
    testsPassed: 48
  });

  try {
    throw new Error('2 tests failed: auth middleware tests');
  } catch (error) {
    handler.handle(error, {
      testRunner: 'jest'
    });
  }

  const content = fs.readFileSync(AGENT_ERRORS_LOG, 'utf8');
  const entry = JSON.parse(content.trim());

  assert.strictEqual(entry.agent, 'pd:test');
  assert.strictEqual(entry.context.testType, 'integration');
  assert.strictEqual(entry.context.testFilesCount, 2);
  assert.strictEqual(entry.context.testsRun, 50);
  assert.strictEqual(entry.context.testsPassed, 48);
  assert.strictEqual(entry.context.testRunner, 'jest');
});

test('createAuditErrorHandler - logs audit errors with context', () => {
  cleanup();

  const handler = createAuditErrorHandler('89', {
    auditType: 'security',
    scannersUsed: ['sql-injection', 'xss', 'auth-bypass'],
    findingsCount: 12,
    sessionDelta: { newFindings: 3 }
  });

  try {
    throw new Error('Scanner sql-injection failed to execute');
  } catch (error) {
    handler.handle(error, {
      auditMode: 'milestone'
    });
  }

  const content = fs.readFileSync(AGENT_ERRORS_LOG, 'utf8');
  const entry = JSON.parse(content.trim());

  assert.strictEqual(entry.agent, 'pd:audit');
  assert.strictEqual(entry.context.auditType, 'security');
  assert.strictEqual(entry.context.scannersUsedCount, 3);
  assert.strictEqual(entry.context.findingsCount, 12);
  assert.strictEqual(entry.context.hasSessionDelta, true);
  assert.strictEqual(entry.context.auditMode, 'milestone');
});

test('Enhanced error handlers - wrap functions and re-throw', async () => {
  cleanup();

  const handler = createFixBugErrorHandler('89', {
    bugDescription: 'Test bug',
    sessionId: 'TEST001'
  });

  let errorCaught = false;
  try {
    await handler.execute(async () => {
      throw new Error('Async error in execution');
    }, 'test-step');
  } catch (error) {
    errorCaught = true;
    assert.strictEqual(error.message, 'Async error in execution');
  }

  assert.strictEqual(errorCaught, true);

  const content = fs.readFileSync(AGENT_ERRORS_LOG, 'utf8');
  const entry = JSON.parse(content.trim());
  assert.strictEqual(entry.context.currentStep, 'test-step');
  assert.strictEqual(entry.context.bugDescription, 'Test bug');
});
