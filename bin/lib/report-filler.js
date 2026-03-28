/**
 * Report Filler Module — Fill data into management report template.
 *
 * Pure function: receives template content and data strings, returns filled markdown.
 * Does NOT read files — all content is passed via parameters.
 * Non-blocking: diagram generation errors only log warnings, do not throw.
 */

'use strict';

const { parseFrontmatter } = require('./utils');
const { generateBusinessLogicDiagram, generateArchitectureDiagram } = require('./generate-diagrams');

// ─── Helpers ─────────────────────────────────────────────

/**
 * Replace the nearest Mermaid code block after a section heading.
 * If no new diagram or section not found, keeps content unchanged.
 * @param {string} content - Markdown content
 * @param {string} sectionPrefix - e.g., '## 3.' or '## 4.'
 * @param {string} newDiagram - New Mermaid content (without fence)
 * @returns {string} - Content with replacement applied
 */
function replaceMermaidBlock(content, sectionPrefix, newDiagram) {
  if (!newDiagram) return content;

  const sectionIdx = content.indexOf(sectionPrefix);
  if (sectionIdx === -1) return content;

  // Find nearest mermaid code block AFTER section heading
  const afterSection = content.slice(sectionIdx);
  const mermaidRegex = /```mermaid\n[\s\S]*?```/;
  const mermaidMatch = afterSection.match(mermaidRegex);

  if (!mermaidMatch) return content;

  // Calculate absolute position
  const blockStart = sectionIdx + mermaidMatch.index;
  const blockEnd = blockStart + mermaidMatch[0].length;

  // Replace only that block
  const newBlock = '```mermaid\n' + newDiagram + '\n```';
  return content.slice(0, blockStart) + newBlock + content.slice(blockEnd);
}

/**
 * Extract data from STATE.md body.
 * Gets velocity and metrics information.
 * @param {string} stateContent - STATE.md content
 * @returns {object} - { milestone, version, velocity, phaseMetrics: [] }
 */
function parseStateData(stateContent) {
  if (!stateContent) {
    return { milestone: '', version: '', velocity: '', phaseMetrics: [] };
  }

  const { frontmatter, body } = parseFrontmatter(stateContent);

  // Get velocity info
  const velocityMatch = body.match(/Total plans completed:\s*(.+)/);
  const durationMatch = body.match(/Average duration:\s*(.+)/);
  const velocity = velocityMatch ? velocityMatch[1].trim() : '';
  const avgDuration = durationMatch ? durationMatch[1].trim() : '';

  // Get phase metrics from table (format: | Phase XX PYY | duration | tasks | files |)
  const phaseMetrics = [];
  const metricRegex = /\|\s*(Phase\s+\S+\s+P\d+)\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|/g;
  let match;
  while ((match = metricRegex.exec(body)) !== null) {
    phaseMetrics.push({
      name: match[1].trim(),
      duration: match[2].trim(),
      tasks: match[3].trim(),
      files: match[4].trim(),
    });
  }

  return {
    milestone: frontmatter.milestone_name || frontmatter.milestone || '',
    version: frontmatter.milestone || '',
    velocity: velocity ? `${velocity} (average ${avgDuration})` : '',
    phaseMetrics,
  };
}

/**
 * Fill phase table in Section 2.
 * Replaces placeholder table rows with actual data.
 * @param {string} filled - Markdown content
 * @param {object} stateData - Data from parseStateData()
 * @returns {string} - Filled content
 */
function fillPhaseTable(filled, stateData) {
  // Replace placeholder table rows
  const placeholderRow = /\|\s*\{\{phase_name\}\}\s*\|\s*\{\{status\}\}\s*\|\s*\{\{plan_count\}\}\s*\|\s*\{\{duration\}\}\s*\|/g;

  if (stateData.phaseMetrics.length > 0) {
    // Create table rows from phaseMetrics
    const rows = stateData.phaseMetrics.map(m =>
      `| ${m.name} | Completed | ${m.tasks} | ${m.duration} |`
    ).join('\n');
    filled = filled.replace(placeholderRow, rows);
  } else {
    filled = filled.replace(placeholderRow, '| (No phase data available) | - | - | - |');
  }

  return filled;
}

/**
 * Fill sections 1, 5, 6, 7 with data from summaryContents and stateData.
 * @param {string} filled - Markdown content
 * @param {Array} summaryContents - Array of SUMMARY.md contents
 * @param {object} stateData - Data from parseStateData()
 * @returns {string} - Filled content
 */
function fillSummarySections(filled, summaryContents, stateData) {
  // Section 6: Replace metric placeholder table
  const metricPlaceholder = /\|\s*\{\{metric_name\}\}\s*\|\s*\{\{metric_value\}\}\s*\|/g;
  if (stateData.velocity) {
    const metricRows = [
      `| Total plans completed | ${stateData.velocity} |`,
      `| Total phases | ${stateData.phaseMetrics.length} |`,
    ].join('\n');
    filled = filled.replace(metricPlaceholder, metricRows);
  } else {
    filled = filled.replace(metricPlaceholder, '| (No data available) | - |');
  }

  return filled;
}

// ─── Main function ───────────────────────────────────────

/**
 * Fill data into management report template.
 *
 * @param {object} params
 * @param {string} params.templateContent - management-report.md template content
 * @param {string} [params.stateContent=''] - STATE.md content
 * @param {Array<{planNumber: number, content: string, phase: string}>} [params.planContents=[]] - PLAN.md contents
 * @param {Array<string>} [params.summaryContents=[]] - SUMMARY.md contents
 * @param {object} [params.codebaseMaps={}] - { architecture: string }
 * @param {object} [params.planMeta={}] - { filesModified: string[] }
 * @param {string} [params.version=''] - Version (e.g., 'v1.4')
 * @param {string} [params.milestoneName=''] - Milestone name
 * @param {string} [params.date] - Report date (default: today)
 * @returns {{ filledMarkdown: string, diagramResults: { business: object, architecture: object } }}
 */
function fillManagementReport(params) {
  const {
    templateContent,
    stateContent = '',
    planContents = [],
    summaryContents = [],
    codebaseMaps = {},
    planMeta = {},
    version = '',
    milestoneName = '',
    date = new Date().toISOString().split('T')[0],
  } = params || {};

  let filled = templateContent || '';

  // Default diagram results
  let businessResult = { diagram: '', valid: false, errors: [], warnings: [] };
  let archResult = { diagram: '', valid: false, errors: [], warnings: [] };

  // ─── Step 1: Replace header placeholders ─────────────────
  filled = filled.replace(/\{\{milestone_name\}\}/g, milestoneName);
  filled = filled.replace(/\{\{version\}\}/g, version);
  filled = filled.replace(/\{\{date\}\}/g, date);

  // ─── Step 2: Parse STATE.md to get data ───────────────────
  const stateData = parseStateData(stateContent);

  // ─── Step 3: Fill Section 2 — phase table ──────────────────
  filled = fillPhaseTable(filled, stateData);

  // ─── Step 4: Fill Section 3 — Business Logic Diagram ──────
  try {
    businessResult = generateBusinessLogicDiagram(planContents);
    if (businessResult && businessResult.diagram) {
      filled = replaceMermaidBlock(filled, '## 3.', businessResult.diagram);
    }
  } catch (e) {
    // Non-blocking: keep original placeholder, log warning
    businessResult = { diagram: '', valid: false, errors: [String(e)], warnings: [`Error generating business logic diagram: ${e.message || e}`] };
  }

  // ─── Step 5: Fill Section 4 — Architecture Diagram ────────
  try {
    const safeMaps = codebaseMaps || {};
    const safeMeta = planMeta || {};
    archResult = generateArchitectureDiagram(safeMaps, safeMeta);
    if (archResult && archResult.diagram) {
      filled = replaceMermaidBlock(filled, '## 4.', archResult.diagram);
    }
  } catch (e) {
    // Non-blocking: keep original placeholder, log warning
    archResult = { diagram: '', valid: false, errors: [String(e)], warnings: [`Error generating architecture diagram: ${e.message || e}`] };
  }

  // ─── Step 6: Fill Sections 1, 5, 6, 7 ─────────────────────
  filled = fillSummarySections(filled, summaryContents, stateData);

  // ─── Step 7: Remove all remaining AI fill comments ─────────
  filled = filled.replace(/<!--\s*AI fill[^>]*-->\n?/g, '');

  return {
    filledMarkdown: filled,
    diagramResults: {
      business: businessResult,
      architecture: archResult,
    },
  };
}

module.exports = { fillManagementReport, replaceMermaidBlock };
