/**
 * Basic Error Handler - Simple error logging for remaining skills
 * @module basic-error-handler
 */

const { createSkillErrorHandler } = require('./skill-error-logger');

/**
 * Creates a basic error handler for any skill
 * @param {string} skillName - Name of the skill
 * @param {string} phase - Current phase
 * @param {Object} defaults - Default context values
 * @returns {Object} Basic error handler
 */
function createBasicErrorHandler(skillName, phase, defaults = {}) {
  const handler = createSkillErrorHandler(skillName, phase);

  return {
    /**
     * Handle an error with context
     */
    handle(error, context = {}) {
      handler.handle(error, { ...defaults, ...context });
    },

    /**
     * Wrap a function with error handling
     */
    wrap(fn, step = 'execution') {
      return handler.wrap(fn, step);
    },

    /**
     * Execute a function with error handling
     */
    execute(fn, step, ...args) {
      return handler.execute(fn, step, ...args);
    },

    /**
     * Get the execution stats
     */
    getStats() {
      const { getExecutionStats } = require('./skill-error-logger');
      return getExecutionStats();
    }
  };
}

/**
 * Creates error handlers for all remaining skills
 * @param {string} phase - Current phase
 * @returns {Object} Map of skill names to error handlers
 */
function createRemainingSkillHandlers(phase) {
  const skills = [
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

  const handlers = {};
  skills.forEach(skillName => {
    handlers[skillName] = createBasicErrorHandler(skillName, phase);
  });

  return handlers;
}

module.exports = {
  createBasicErrorHandler,
  createRemainingSkillHandlers
};
