/**
 * Enhanced Error Handler - Rich context error logging for critical skills
 * @module enhanced-error-handler
 */

const { createSkillErrorHandler } = require('./skill-error-logger');
const { createLogBuilder } = require('./log-writer');

/**
 * Creates an error handler for fix-bug skill with rich context
 * @param {string} phase - Current phase
 * @param {Object} context - Additional context about the bug investigation
 * @returns {Object} Enhanced error handler
 */
function createFixBugErrorHandler(phase, context = {}) {
  const { bugDescription, sessionId, currentStep } = context;
  const handler = createSkillErrorHandler('pd:fix-bug', phase);

  return {
    /**
     * Handle error with fix-bug specific context
     */
    handle(error, additionalContext = {}) {
      const enrichedContext = {
        bugDescription,
        sessionId,
        currentStep,
        evidenceCollected: additionalContext.evidenceCollected || false,
        agentsInvoked: additionalContext.agentsInvoked || [],
        ...additionalContext
      };

      handler.handle(error, enrichedContext);
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
    execute(fn, step, ...args) {
      return this.wrap(fn, step)(...args);
    }
  };
}

/**
 * Creates an error handler for plan skill with rich context
 * @param {string} phase - Current phase
 * @param {Object} context - Planning context
 * @returns {Object} Enhanced error handler
 */
function createPlanErrorHandler(phase, context = {}) {
  const { phaseNumber, requirements, researchComplete } = context;
  const handler = createSkillErrorHandler('pd:plan', phase);

  return {
    handle(error, additionalContext = {}) {
      const enrichedContext = {
        phaseNumber,
        requirementsCount: requirements?.length || 0,
        researchComplete,
        planningMode: additionalContext.planningMode || 'auto',
        tasksCreated: additionalContext.tasksCreated || 0,
        ...additionalContext
      };

      handler.handle(error, enrichedContext);
    },

    wrap(fn, step = 'execution') {
      return handler.wrap(fn, step);
    },

    execute(fn, step, ...args) {
      return handler.execute(fn, step, ...args);
    }
  };
}

/**
 * Creates an error handler for write-code skill with rich context
 * @param {string} phase - Current phase
 * @param {Object} context - Code writing context
 * @returns {Object} Enhanced error handler
 */
function createWriteCodeErrorHandler(phase, context = {}) {
  const { taskNumber, filesModified, lintPassed, buildPassed } = context;
  const handler = createSkillErrorHandler('pd:write-code', phase);

  return {
    handle(error, additionalContext = {}) {
      const enrichedContext = {
        taskNumber,
        filesModified: filesModified || [],
        filesModifiedCount: filesModified?.length || 0,
        lintPassed,
        buildPassed,
        executionMode: additionalContext.executionMode || 'single',
        ...additionalContext
      };

      handler.handle(error, enrichedContext);
    },

    wrap(fn, step = 'execution') {
      return handler.wrap(fn, step);
    },

    execute(fn, step, ...args) {
      return handler.execute(fn, step, ...args);
    }
  };
}

/**
 * Creates an error handler for test skill with rich context
 * @param {string} phase - Current phase
 * @param {Object} context - Testing context
 * @returns {Object} Enhanced error handler
 */
function createTestErrorHandler(phase, context = {}) {
  const { testType, testFiles, testsRun, testsPassed } = context;
  const handler = createSkillErrorHandler('pd:test', phase);

  return {
    handle(error, additionalContext = {}) {
      const enrichedContext = {
        testType: testType || 'standard',
        testFiles: testFiles || [],
        testFilesCount: testFiles?.length || 0,
        testsRun,
        testsPassed,
        testRunner: additionalContext.testRunner || 'node:test',
        ...additionalContext
      };

      handler.handle(error, enrichedContext);
    },

    wrap(fn, step = 'execution') {
      return handler.wrap(fn, step);
    },

    execute(fn, step, ...args) {
      return handler.execute(fn, step, ...args);
    }
  };
}

/**
 * Creates an error handler for audit skill with rich context
 * @param {string} phase - Current phase
 * @param {Object} context - Audit context
 * @returns {Object} Enhanced error handler
 */
function createAuditErrorHandler(phase, context = {}) {
  const { auditType, scannersUsed, findingsCount, sessionDelta } = context;
  const handler = createSkillErrorHandler('pd:audit', phase);

  return {
    handle(error, additionalContext = {}) {
      const enrichedContext = {
        auditType: auditType || 'security',
        scannersUsed: scannersUsed || [],
        scannersUsedCount: scannersUsed?.length || 0,
        findingsCount,
        hasSessionDelta: !!sessionDelta,
        auditMode: additionalContext.auditMode || 'milestone',
        ...additionalContext
      };

      handler.handle(error, enrichedContext);
    },

    wrap(fn, step = 'execution') {
      return handler.wrap(fn, step);
    },

    execute(fn, step, ...args) {
      return handler.execute(fn, step, ...args);
    }
  };
}

module.exports = {
  createFixBugErrorHandler,
  createPlanErrorHandler,
  createWriteCodeErrorHandler,
  createTestErrorHandler,
  createAuditErrorHandler
};
