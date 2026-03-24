/**
 * Truths Parser — Parse Truths table tu plan body content.
 *
 * Shared helper — duoc import boi generate-diagrams.js va cac module khac.
 * KHONG doc file — tat ca content truyen qua tham so.
 */

'use strict';

/**
 * Parse Truths table tu plan body content.
 * Hoat dong voi ca 3-col (v1.1) va 5-col (v1.3) Truths tables.
 * @param {string} content - Plan body content (sau frontmatter)
 * @returns {Array<{id: string, description: string}>}
 */
function parseTruthsFromContent(content) {
  const truths = [];
  const tableRegex = /\|\s*(T\d+)\s*\|\s*([^|\n]+)\s*\|(?:\s*[^|\n]+\s*\|)+/g;
  let match;
  while ((match = tableRegex.exec(content)) !== null) {
    truths.push({
      id: match[1].trim(),
      description: match[2].trim(),
    });
  }
  return truths;
}

module.exports = { parseTruthsFromContent };
