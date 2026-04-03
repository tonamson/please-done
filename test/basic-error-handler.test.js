const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const {
  createBasicErrorHandler,
  createRemainingSkillHandlers
} = require('../bin/lib/basic-error-handler');

const LOGS_DIR = path.join(__dirname, '../.planning/logs');
const AGENT_ERRORS_LOG = path.join(LOGS_DIR, 'agent-errors.jsonl');

function cleanup() {
  if (fs.existsSync(AGENT_ERRORS_LOG)) {
    fs.unlinkSync(AGENT_ERRORS_LOG);
  }
}

test('createBasicErrorHandler - logs error for any skill', () => {
  cleanup();

  const handler = createBasicErrorHandler('pd:init', '89');

  try {
    throw new Error('Failed to initialize project');
  } catch (error) {
    handler.handle(error, {
      step: 'creating-context',
      projectDir: '/tmp/test-project'
    });
  }

  const content = fs.readFileSync(AGENT_ERRORS_LOG, 'utf8');
  const entry = JSON.parse(content.trim());

  assert.strictEqual(entry.agent, 'pd:init');
  assert.strictEqual(entry.phase, '89');
  assert.strictEqual(entry.error, 'Failed to initialize project');
  assert.strictEqual(entry.context.step, 'creating-context');
  assert.strictEqual(entry.context.projectDir, '/tmp/test-project');
  assert.ok(entry.context.stack);
});

test('createBasicErrorHandler - wraps functions and re-throws', async () => {
  cleanup();

  const handler = createBasicErrorHandler('pd:scan', '89');

  let errorCaught = false;
  try {
    await handler.execute(async () => {
      throw new Error('Scan failed');
    }, 'scanning-files');
  } catch (error) {
    errorCaught = true;
    assert.strictEqual(error.message, 'Scan failed');
  }

  assert.strictEqual(errorCaught, true);

  const content = fs.readFileSync(AGENT_ERRORS_LOG, 'utf8');
  const entry = JSON.parse(content.trim());
  assert.strictEqual(entry.agent, 'pd:scan');
  assert.strictEqual(entry.context.step, 'scanning-files');
});

test('createRemainingSkillHandlers - creates handlers for all 11 skills', () => {
  const handlers = createRemainingSkillHandlers('89');

  const expectedSkills = [
    'pd:complete-milestone',
    'pd:conventions',
    'pd:fetch-doc',
    'pd:init',
    'pd:new-milestone',
    'pd:onboard',
    'pd:research',
    'pd:scan',
    'pd:status',
    'pd:update',
    'pd:what-next'
  ];

  expectedSkills.forEach(skillName => {
    assert.ok(handlers[skillName], `Handler for ${skillName} should exist`);
    assert.strictEqual(typeof handlers[skillName].handle, 'function');
    assert.strictEqual(typeof handlers[skillName].wrap, 'function');
    assert.strictEqual(typeof handlers[skillName].execute, 'function');
  });

  assert.strictEqual(Object.keys(handlers).length, 11);
});

test('createRemainingSkillHandlers - each handler logs errors correctly', () => {
  cleanup();

  const handlers = createRemainingSkillHandlers('89');
  const testSkill = 'pd:status';
  const handler = handlers[testSkill];

  try {
    throw new Error('Status check failed');
  } catch (error) {
    handler.handle(error, {
      step: 'checking-phase-state'
    });
  }

  const content = fs.readFileSync(AGENT_ERRORS_LOG, 'utf8');
  const entry = JSON.parse(content.trim());

  assert.strictEqual(entry.agent, testSkill);
  assert.strictEqual(entry.phase, '89');
  assert.strictEqual(entry.error, 'Status check failed');
  assert.strictEqual(entry.context.step, 'checking-phase-state');
});

test('createBasicErrorHandler - accepts default context values', () => {
  cleanup();

  const handler = createBasicErrorHandler('pd:research', '89', {
    executionMode: 'quick',
    queryType: 'context7'
  });

  try {
    throw new Error('Research query failed');
  } catch (error) {
    handler.handle(error, {
      library: 'unknown-package'
    });
  }

  const content = fs.readFileSync(AGENT_ERRORS_LOG, 'utf8');
  const entry = JSON.parse(content.trim());

  assert.strictEqual(entry.agent, 'pd:research');
  assert.strictEqual(entry.context.executionMode, 'quick');
  assert.strictEqual(entry.context.queryType, 'context7');
  assert.strictEqual(entry.context.library, 'unknown-package');
});
