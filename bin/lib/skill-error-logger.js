/**
 * Skill Error Logger - Centralized error logging for PD skills
 * @module skill-error-logger
 */

const { writeLog, createLogBuilder } = require('./log-writer');

// Global registry to track skill invocations
const skillRegistry = new Map();

/**
 * Registers a skill execution for error tracking
 * @param {string} skillName - Name of the skill
 * @param {string} phase - Current phase
 * @param {Object} context - Additional context
 */
function registerSkillExecution(skillName, phase, context = {}) {
  const key = skillName + ':' + phase;
  const execution = {
    skillName,
    phase,
    startTime: new Date().toISOString(),
    context,
    errors: []
  };

  skillRegistry.set(key, execution);
  return key;
}

/**
 * Logs an error for a registered skill execution
 * @param {string} executionKey - Key from registerSkillExecution
 * @param {Error|string} error - The error to log
 * @param {Object} context - Additional context
 */
function logSkillError(executionKey, error, context = {}) {
  const execution = skillRegistry.get(executionKey);
  if (!execution) {
    console.error('[skill-error-logger] No execution found for key: ' + executionKey);
    return false;
  }

  const errorMessage = error.message || String(error);
  const errorDetails = {
    timestamp: new Date().toISOString(),
    stack: error.stack,
    ...context
  };

  // Log using log-writer
  const success = writeLog({
    level: 'ERROR',
    phase: execution.phase,
    step: 'skill-' + execution.skillName,
    agent: execution.skillName,
    error: errorMessage,
    context: errorDetails
  });

  // Also track in registry
  execution.errors.push({
    message: errorMessage,
    timestamp: errorDetails.timestamp,
    context: errorDetails
  });

  return success;
}

/**
 * Gets the current execution statistics
 * @returns {Object} Statistics about skill executions
 */
function getExecutionStats() {
  const stats = {
    totalExecutions: skillRegistry.size,
    totalErrors: 0,
    executions: []
  };

  for (const [key, execution] of skillRegistry) {
    stats.totalErrors += execution.errors.length;
    stats.executions.push({
      skillName: execution.skillName,
      phase: execution.phase,
      errorCount: execution.errors.length,
      startTime: execution.startTime
    });
  }

  return stats;
}

/**
 * Clears the execution registry
 */
function clearRegistry() {
  skillRegistry.clear();
}

/**
 * Creates an error handler for a specific skill
 * @param {string} skillName - Name of the skill
 * @param {string} phase - Current phase
 * @returns {Object} Error handler with methods
 */
function createSkillErrorHandler(skillName, phase) {
  const executionKey = registerSkillExecution(skillName, phase);

  return {
    /**
     * Handle an error - log it and re-throw
     */
    handle(error, context = {}) {
      logSkillError(executionKey, error, context);

      // Re-throw to maintain existing behavior
      throw error;
    },

    /**
     * Wrap a function with error handling
     */
    wrap(fn, step = 'execution') {
      return async (...args) => {
        try {
          return await fn(...args);
        } catch (error) {
          this.handle(error, { step, args });
        }
      };
    },

    /**
     * Execute a function with error handling
     */
    execute(fn, step = 'execution', ...args) {
      return this.wrap(fn, step)(...args);
    },

    /**
     * Get the execution key for this handler
     */
    getExecutionKey() {
      return executionKey;
    }
  };
}

module.exports = {
  registerSkillExecution,
  logSkillError,
  getExecutionStats,
  clearRegistry,
  createSkillErrorHandler
};
