/**
 * Base converter — shared conversion pipeline.
 *
 * All platform converters delegate to this module.
 * Pipeline order (D-03): parseFrontmatter -> inlineGuardRefs -> inlineWorkflow
 *   -> convertCommandRef -> pathReplace -> pdconfigFix -> toolMap
 *   -> mcpToolConvert -> postProcess -> rebuildFrontmatter
 *
 * Note: inlineGuardRefs is called INSIDE inlineWorkflow() automatically.
 */

'use strict';

const { parseFrontmatter, buildFrontmatter, inlineWorkflow } = require('../utils');
const { convertCommandRef } = require('../platforms');

/**
 * Shared conversion pipeline.
 *
 * @param {string} content — raw skill markdown
 * @param {object} config — platform-specific config object
 * @param {string} config.runtime — platform name ('codex', 'copilot', 'gemini', 'opencode')
 * @param {string} [config.skillsDir] — repo root for workflow inlining
 * @param {string} [config.pathReplace] — replacement for ~/.claude/ paths
 * @param {object} [config.toolMap] — { sourceName: platformName } tool mapping
 * @param {function} [config.buildFrontmatter] — (fm) => newFm object
 * @param {function} [config.pdconfigFix] — (body) => body with .pdconfig path fixed
 * @param {function} [config.mcpToolConvert] — (body) => body with MCP refs converted
 * @param {function} [config.postProcess] — (body) => body with platform-specific transforms
 * @param {string} [config.prependBody] — content to insert between frontmatter and body (Codex adapter)
 * @returns {string} — converted skill markdown
 */
function convertSkill(content, config) {
  const { frontmatter, body } = parseFrontmatter(content);

  // 1. Build platform frontmatter (platform decides which fields to keep)
  const newFm = config.buildFrontmatter
    ? config.buildFrontmatter(frontmatter)
    : { ...frontmatter };

  // 2. Inline workflow content (includes inlineGuardRefs) — MUST run BEFORE text replacements
  let newBody = body;
  if (config.skillsDir) {
    newBody = inlineWorkflow(newBody, config.skillsDir);
  }

  // 3. Replace command references (/pd:xxx -> platform format)
  if (config.runtime && config.runtime !== 'claude') {
    newBody = convertCommandRef(config.runtime, newBody);
  }

  // 4. Path replacement (~/.claude/ -> platform path)
  if (config.pathReplace) {
    newBody = newBody.replace(/~\/\.claude\//g, config.pathReplace);
  }

  // 5. Fix .pdconfig path if needed
  if (config.pdconfigFix) {
    newBody = config.pdconfigFix(newBody);
  }

  // 6. Tool name mapping (word-boundary regex, skip function calls)
  if (config.toolMap && Object.keys(config.toolMap).length > 0) {
    for (const [source, platform] of Object.entries(config.toolMap)) {
      const regex = new RegExp(`\\b${source}\\b(?!\\()`, 'g');
      newBody = newBody.replace(regex, platform);
    }
  }

  // 7. MCP tool conversion
  if (config.mcpToolConvert) {
    newBody = config.mcpToolConvert(newBody);
  }

  // 8. Platform-specific post-processing hooks
  if (config.postProcess) {
    newBody = config.postProcess(newBody);
  }

  // 9. Rebuild output
  return `---\n${buildFrontmatter(newFm)}\n---\n${config.prependBody || ''}${newBody}`;
}

module.exports = { convertSkill };
