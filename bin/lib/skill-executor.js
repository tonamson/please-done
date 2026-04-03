/**
 * Skill Executor - Centralized skill execution with error logging
 * @module skill-executor
 */

import { writeLog, createLogBuilder } from './log-writer.js';

/**
 * Wraps a skill execution function with error logging
 * @param {Function} skillFn - The skill function to wrap
 * @param {Object} context - Execution context
 * @param {string} context.phase - Phase number or identifier
 * @param {string} context.step - Step identifier
 * @param {string} context.agent - Agent/skill name
 * @param {Object} [context.defaults] - Default values for log entries
 * @returns {Function} - Wrapped skill function
 */
export function wrapSkillExecution(skillFn, context) {
  const { phase, step, agent, defaults = {} } = context;

  // Create log builder with defaults
  const logBuilder = createLogBuilder({
    phase,
    step,
    agent,
    ...defaults
  });

  return async (...args) => {
    try {
      // Execute the skill function
      const result = await skillFn(...args);
      return result;
    } catch (error) {
      // Log the error with full context
      const errorMessage = error.message || String(error);
      const errorContext = {
        ...defaults, // Include defaults in context
        stack: error.stack,
        args: args.length > 0 ? args : undefined,
        timestamp: new Date().toISOString()
      };

      // Use log builder to log the error
      logBuilder.error(errorMessage, errorContext);

      // Also log to console to maintain existing behavior
      console.error(`[${agent}] Error in ${step}:`, errorMessage);
      if (error.stack) {
        console.error(error.stack);
      }

      // Re-throw the error to maintain existing error handling
      throw error;
    }
  };
}

/**
 * Executes a skill function with automatic error logging
 * @param {Function} skillFn - The skill function to execute
 * @param {Object} context - Execution context
 * @param {...any} args - Arguments to pass to the skill function
 * @returns {Promise<any>} - Result of the skill function
 */
export async function executeSkill(skillFn, context, ...args) {
  const wrappedFn = wrapSkillExecution(skillFn, context);
  return await wrappedFn(...args);
}

/**
 * Creates a skill executor for a specific agent/phase combination
 * @param {string} agent - Agent/skill name
 * @param {string} phase - Phase number or identifier
 * @param {Object} [defaults] - Default values for log entries
 * @returns {Object} - Executor with wrap and execute methods
 */
export function createSkillExecutor(agent, phase, defaults = {}) {
  return {
    /**
     * Wrap a skill function with logging
     */
    wrap(skillFn, step) {
      return wrapSkillExecution(skillFn, {
        agent,
        phase,
        step,
        defaults
      });
    },

    /**
     * Execute a skill function with logging
     */
    async execute(skillFn, step, ...args) {
      return await executeSkill(skillFn, {
        agent,
        phase,
        step,
        defaults
      }, ...args);
    }
  };
}

export default {
  wrapSkillExecution,
  executeSkill,
  createSkillExecutor
};
