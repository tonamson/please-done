/**
 * Repro Test Generator — Create skeleton test to reproduce a bug.
 *
 * Pure function: receives params, returns test code string.
 * Does NOT read files — all content passed as parameters.
 * Zero dependencies — self-contained.
 */

'use strict';

// ─── Main Function ────────────────────────────────────────

/**
 * Create skeleton test to reproduce a bug from symptoms and bugTitle.
 *
 * @param {object} params
 * @param {object} params.symptoms - { expected, actual, errorMessage, timeline, reproduce }
 * @param {string} params.bugTitle - Short bug name (e.g. 'login-timeout')
 * @param {string} params.filePath - Path to the buggy file
 * @param {string} [params.functionName] - Name of the buggy function (optional)
 * @returns {{ testCode: string, testFileName: string }}
 */
function generateReproTest(params) {
  // ─── Validate ──────────────────────────────────────────
  if (!params) {
    throw new Error('generateReproTest: missing params.symptoms or params.bugTitle');
  }
  if (!params.symptoms) {
    throw new Error('generateReproTest: missing params.symptoms or params.bugTitle');
  }
  if (!params.bugTitle) {
    throw new Error('generateReproTest: missing params.symptoms or params.bugTitle');
  }

  // ─── Sanitize bugTitle ─────────────────────────────────
  const safeBugTitle = params.bugTitle.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const testFileName = 'repro-' + safeBugTitle + '.test.js';

  // ─── Extract params ────────────────────────────────────
  const { symptoms, bugTitle, filePath, functionName } = params;
  const fnName = functionName || 'unknown';

  // ─── Build test code ───────────────────────────────────
  const testCode = `/**
 * Repro Test — ${bugTitle}
 * Buggy file: ${filePath || 'unknown'}
 * Function: ${fnName}
 *
 * This test is a skeleton — AI will fill in the reproduction logic.
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

describe('Reproduce: ${bugTitle}', () => {
  it('should reproduce the bug', () => {
    // Expected result: ${symptoms.expected || ''}
    // Actual result: ${symptoms.actual || ''}
    // Error message: ${symptoms.errorMessage || ''}

    // --- Arrange ---
    // TODO: Set up data and conditions

    // --- Act ---
    // TODO: Call function or perform action that causes the bug

    // --- Assert ---
    assert.fail('TODO: Fill in reproduction logic');
  });
});
`;

  return { testCode, testFileName };
}

// ─── Exports ──────────────────────────────────────────────

module.exports = { generateReproTest };
