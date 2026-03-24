/**
 * Repro Test Generator — Tao skeleton test tai hien loi.
 *
 * Pure function: nhan params, tra ve test code string.
 * KHONG doc file — tat ca content truyen qua tham so.
 * Zero dependencies — self-contained.
 */

'use strict';

// ─── Main Function ────────────────────────────────────────

/**
 * Tao skeleton test tai hien loi tu symptoms va bugTitle.
 *
 * @param {object} params
 * @param {object} params.symptoms - { expected, actual, errorMessage, timeline, reproduce }
 * @param {string} params.bugTitle - Ten tat cua bug (vi du: 'login-timeout')
 * @param {string} params.filePath - Duong dan file bi loi
 * @param {string} [params.functionName] - Ten function bi loi (optional)
 * @returns {{ testCode: string, testFileName: string }}
 */
function generateReproTest(params) {
  // ─── Validate ──────────────────────────────────────────
  if (!params) {
    throw new Error('generateReproTest: thieu params.symptoms hoac params.bugTitle');
  }
  if (!params.symptoms) {
    throw new Error('generateReproTest: thieu params.symptoms hoac params.bugTitle');
  }
  if (!params.bugTitle) {
    throw new Error('generateReproTest: thieu params.symptoms hoac params.bugTitle');
  }

  // ─── Sanitize bugTitle ─────────────────────────────────
  const safeBugTitle = params.bugTitle.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const testFileName = 'repro-' + safeBugTitle + '.test.js';

  // ─── Extract params ────────────────────────────────────
  const { symptoms, bugTitle, filePath, functionName } = params;
  const fnName = functionName || 'chua xac dinh';

  // ─── Build test code ───────────────────────────────────
  const testCode = `/**
 * Repro Test — ${bugTitle}
 * File loi: ${filePath || 'chua xac dinh'}
 * Function: ${fnName}
 *
 * Test nay la skeleton — AI se dien logic tai hien loi.
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

describe('Tai hien: ${bugTitle}', () => {
  it('phai tai hien duoc loi', () => {
    // Ket qua mong doi: ${symptoms.expected || ''}
    // Ket qua thuc te: ${symptoms.actual || ''}
    // Error message: ${symptoms.errorMessage || ''}

    // --- Arrange ---
    // TODO: Thiet lap du lieu va dieu kien

    // --- Act ---
    // TODO: Goi function hoac thao tac gay loi

    // --- Assert ---
    assert.fail('TODO: Dien logic tai hien loi');
  });
});
`;

  return { testCode, testFileName };
}

// ─── Exports ──────────────────────────────────────────────

module.exports = { generateReproTest };
