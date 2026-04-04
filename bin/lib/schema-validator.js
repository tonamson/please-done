/**
 * Schema Validator Module — Pure functions for validating artifact files.
 *
 * Pure functions: does NOT read files, zero fs imports, NO side effects.
 * Content passed via parameters, returns validation result.
 *
 * - validateContext: validate CONTEXT.md content
 * - validateTasks: validate TASKS.md content
 * - validateProgress: validate PROGRESS.md content
 * - validateArtifact: generic validation by type
 */

'use strict';

// ─── Schema Definitions ───────────────────────────────────

const CONTEXT_SCHEMA = {
  name: 'CONTEXT.md',
  requiredHeaders: [
    { name: 'Project Context', pattern: /^# Project Context/m }
  ],
  requiredFields: [
    { name: 'Initialized', pattern: /^> Initialized:/m },
    { name: 'New project', pattern: /^> New project:/m },
  ],
  requiredSections: [
    { name: 'Tech Stack', pattern: /^## Tech Stack/m },
    { name: 'Rules', pattern: /^## Rules/m },
  ],
};

const TASKS_SCHEMA = {
  name: 'TASKS.md',
  requiredHeaders: [
    { name: 'Task List', pattern: /^# Task List/m }
  ],
  requiredFields: [
    { name: 'Milestone', pattern: /^> Milestone:/m },
    { name: 'Created', pattern: /^> Created:/m },
  ],
  requiredSections: [
    { name: 'Overview', pattern: /^## Overview/m },
    { name: 'Task sections', pattern: /^## Task \d+:/m },
  ],
  requiredTables: [
    { name: 'Overview table', pattern: /\| # \| Task \| Status \|/ },
  ],
};

const PROGRESS_SCHEMA = {
  name: 'PROGRESS.md',
  requiredHeaders: [
    { name: 'Execution Progress', pattern: /^# Execution Progress/m }
  ],
  requiredFields: [
    { name: 'Updated', pattern: /^> Updated:/m },
    { name: 'Task', pattern: /^> Task:/m },
    { name: 'Stage', pattern: /^> Stage:/m },
    { name: 'lint_fail_count', pattern: /^> lint_fail_count:/m },
    { name: 'last_lint_error', pattern: /^> last_lint_error:/m },
  ],
  requiredSections: [
    { name: 'Steps', pattern: /^## Steps/m },
    { name: 'Expected Files', pattern: /^## Expected Files/m },
    { name: 'Files Written', pattern: /^## Files Written/m },
  ],
};

const SCHEMA_DEFINITIONS = {
  context: CONTEXT_SCHEMA,
  tasks: TASKS_SCHEMA,
  progress: PROGRESS_SCHEMA,
};

// ─── Helper Functions ─────────────────────────────────────

/**
 * Check if content has a pattern
 * @param {string} content
 * @param {RegExp} pattern
 * @returns {boolean}
 */
function hasPattern(content, pattern) {
  return pattern.test(content);
}

/**
 * Validate content against schema
 * @param {object} schema
 * @param {string} content
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
function validateAgainstSchema(schema, content) {
  if (!content || typeof content !== 'string') {
    return { ok: false, error: `${schema.name}: content must be a non-empty string` };
  }

  // Check required headers
  if (schema.requiredHeaders) {
    for (const header of schema.requiredHeaders) {
      if (!hasPattern(content, header.pattern)) {
        return { ok: false, error: `${schema.name}: missing required header: ${header.name}` };
      }
    }
  }

  // Check required fields
  if (schema.requiredFields) {
    for (const field of schema.requiredFields) {
      if (!hasPattern(content, field.pattern)) {
        return { ok: false, error: `${schema.name}: missing required field: ${field.name}` };
      }
    }
  }

  // Check required sections
  if (schema.requiredSections) {
    for (const section of schema.requiredSections) {
      if (!hasPattern(content, section.pattern)) {
        return { ok: false, error: `${schema.name}: missing required section: ${section.name}` };
      }
    }
  }

  // Check required tables
  if (schema.requiredTables) {
    for (const table of schema.requiredTables) {
      if (!hasPattern(content, table.pattern)) {
        return { ok: false, error: `${schema.name}: missing required table: ${table.name}` };
      }
    }
  }

  return { ok: true };
}

// ─── Validation Functions ─────────────────────────────────

/**
 * Validate CONTEXT.md content
 * @param {string} content - File content
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
function validateContext(content) {
  return validateAgainstSchema(CONTEXT_SCHEMA, content);
}

/**
 * Validate TASKS.md content
 * @param {string} content - File content
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
function validateTasks(content) {
  return validateAgainstSchema(TASKS_SCHEMA, content);
}

/**
 * Validate PROGRESS.md content
 * @param {string} content - File content
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
function validateProgress(content) {
  return validateAgainstSchema(PROGRESS_SCHEMA, content);
}

/**
 * Validate artifact by type
 * @param {'context'|'tasks'|'progress'} type
 * @param {string} content
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
function validateArtifact(type, content) {
  const validTypes = ['context', 'tasks', 'progress'];
  if (!validTypes.includes(type)) {
    return { ok: false, error: `Invalid artifact type: ${type}. Must be one of: ${validTypes.join(', ')}` };
  }

  const schema = SCHEMA_DEFINITIONS[type];
  return validateAgainstSchema(schema, content);
}

// ─── Exports ────────────────────────────────────────────────

module.exports = {
  SCHEMA_DEFINITIONS,
  CONTEXT_SCHEMA,
  TASKS_SCHEMA,
  PROGRESS_SCHEMA,
  validateContext,
  validateTasks,
  validateProgress,
  validateArtifact,
};
