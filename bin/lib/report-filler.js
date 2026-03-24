/**
 * Report Filler Module — Điền dữ liệu vào template báo cáo quản lý.
 *
 * Pure function: nhận template content và data strings, trả về filled markdown.
 * KHÔNG đọc file — tất cả content được truyền qua tham số.
 * Non-blocking: lỗi diagram generation chỉ log warning, không throw.
 */

'use strict';

const { parseFrontmatter } = require('./utils');
const { generateBusinessLogicDiagram, generateArchitectureDiagram } = require('./generate-diagrams');

// ─── Helpers ─────────────────────────────────────────────

/**
 * Thay thế Mermaid code block gần nhất sau section heading.
 * Nếu không có diagram mới hoặc section không tìm thấy, giữ nguyên content.
 * @param {string} content - Nội dung markdown
 * @param {string} sectionPrefix - Ví dụ: '## 3.' hoặc '## 4.'
 * @param {string} newDiagram - Nội dung Mermaid mới (không bao gồm fence)
 * @returns {string} - Content đã thay thế
 */
function replaceMermaidBlock(content, sectionPrefix, newDiagram) {
  if (!newDiagram) return content;

  const sectionIdx = content.indexOf(sectionPrefix);
  if (sectionIdx === -1) return content;

  // Tìm mermaid code block gần nhất SAU section heading
  const afterSection = content.slice(sectionIdx);
  const mermaidRegex = /```mermaid\n[\s\S]*?```/;
  const mermaidMatch = afterSection.match(mermaidRegex);

  if (!mermaidMatch) return content;

  // Tính vị trí tuyệt đối
  const blockStart = sectionIdx + mermaidMatch.index;
  const blockEnd = blockStart + mermaidMatch[0].length;

  // Thay thế chỉ block đó
  const newBlock = '```mermaid\n' + newDiagram + '\n```';
  return content.slice(0, blockStart) + newBlock + content.slice(blockEnd);
}

/**
 * Trích xuất dữ liệu từ STATE.md body.
 * Lấy thông tin velocity và metrics.
 * @param {string} stateContent - Nội dung STATE.md
 * @returns {object} - { milestone, version, velocity, phaseMetrics: [] }
 */
function parseStateData(stateContent) {
  if (!stateContent) {
    return { milestone: '', version: '', velocity: '', phaseMetrics: [] };
  }

  const { frontmatter, body } = parseFrontmatter(stateContent);

  // Lấy velocity info
  const velocityMatch = body.match(/Total plans completed:\s*(.+)/);
  const durationMatch = body.match(/Average duration:\s*(.+)/);
  const velocity = velocityMatch ? velocityMatch[1].trim() : '';
  const avgDuration = durationMatch ? durationMatch[1].trim() : '';

  // Lấy phase metrics từ bảng (format: | Phase XX PYY | duration | tasks | files |)
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
    velocity: velocity ? `${velocity} (trung bình ${avgDuration})` : '',
    phaseMetrics,
  };
}

/**
 * Điền bảng phase trong Section 2.
 * Thay thế dòng placeholder bảng bằng dữ liệu thực tế.
 * @param {string} filled - Nội dung markdown
 * @param {object} stateData - Dữ liệu từ parseStateData()
 * @returns {string} - Nội dung đã điền
 */
function fillPhaseTable(filled, stateData) {
  // Thay thế dòng placeholder bảng
  const placeholderRow = /\|\s*\{\{phase_name\}\}\s*\|\s*\{\{status\}\}\s*\|\s*\{\{plan_count\}\}\s*\|\s*\{\{duration\}\}\s*\|/g;

  if (stateData.phaseMetrics.length > 0) {
    // Tạo các dòng bảng từ phaseMetrics
    const rows = stateData.phaseMetrics.map(m =>
      `| ${m.name} | Hoàn tất | ${m.tasks} | ${m.duration} |`
    ).join('\n');
    filled = filled.replace(placeholderRow, rows);
  } else {
    filled = filled.replace(placeholderRow, '| (Không có dữ liệu phases) | - | - | - |');
  }

  return filled;
}

/**
 * Điền các section 1, 5, 6, 7 với dữ liệu từ summaryContents và stateData.
 * @param {string} filled - Nội dung markdown
 * @param {Array} summaryContents - Mảng nội dung SUMMARY.md
 * @param {object} stateData - Dữ liệu từ parseStateData()
 * @returns {string} - Nội dung đã điền
 */
function fillSummarySections(filled, summaryContents, stateData) {
  // Section 6: Thay thế bảng metric placeholders
  const metricPlaceholder = /\|\s*\{\{metric_name\}\}\s*\|\s*\{\{metric_value\}\}\s*\|/g;
  if (stateData.velocity) {
    const metricRows = [
      `| Tổng plans hoàn tất | ${stateData.velocity} |`,
      `| Tổng phases | ${stateData.phaseMetrics.length} |`,
    ].join('\n');
    filled = filled.replace(metricPlaceholder, metricRows);
  } else {
    filled = filled.replace(metricPlaceholder, '| (Không có dữ liệu) | - |');
  }

  return filled;
}

// ─── Hàm chính ───────────────────────────────────────────

/**
 * Điền dữ liệu vào template báo cáo quản lý.
 *
 * @param {object} params
 * @param {string} params.templateContent - Nội dung template management-report.md
 * @param {string} [params.stateContent=''] - Nội dung STATE.md
 * @param {Array<{planNumber: number, content: string, phase: string}>} [params.planContents=[]] - Nội dung PLAN.md
 * @param {Array<string>} [params.summaryContents=[]] - Nội dung SUMMARY.md
 * @param {object} [params.codebaseMaps={}] - { architecture: string }
 * @param {object} [params.planMeta={}] - { filesModified: string[] }
 * @param {string} [params.version=''] - Phiên bản (ví dụ: 'v1.4')
 * @param {string} [params.milestoneName=''] - Tên milestone
 * @param {string} [params.date] - Ngày báo cáo (mặc định: hôm nay)
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

  // Kết quả diagram mặc định
  let businessResult = { diagram: '', valid: false, errors: [], warnings: [] };
  let archResult = { diagram: '', valid: false, errors: [], warnings: [] };

  // ─── Bước 1: Thay thế header placeholders ─────────────────
  filled = filled.replace(/\{\{milestone_name\}\}/g, milestoneName);
  filled = filled.replace(/\{\{version\}\}/g, version);
  filled = filled.replace(/\{\{date\}\}/g, date);

  // ─── Bước 2: Parse STATE.md để lấy dữ liệu ───────────────
  const stateData = parseStateData(stateContent);

  // ─── Bước 3: Điền Section 2 — bảng phase ──────────────────
  filled = fillPhaseTable(filled, stateData);

  // ─── Bước 4: Điền Section 3 — Business Logic Diagram ──────
  try {
    businessResult = generateBusinessLogicDiagram(planContents);
    if (businessResult && businessResult.diagram) {
      filled = replaceMermaidBlock(filled, '## 3.', businessResult.diagram);
    }
  } catch (e) {
    // Non-blocking: giữ placeholder gốc, ghi warning
    businessResult = { diagram: '', valid: false, errors: [String(e)], warnings: [`Lỗi tạo sơ đồ nghiệp vụ: ${e.message || e}`] };
  }

  // ─── Bước 5: Điền Section 4 — Architecture Diagram ────────
  try {
    const safeMaps = codebaseMaps || {};
    const safeMeta = planMeta || {};
    archResult = generateArchitectureDiagram(safeMaps, safeMeta);
    if (archResult && archResult.diagram) {
      filled = replaceMermaidBlock(filled, '## 4.', archResult.diagram);
    }
  } catch (e) {
    // Non-blocking: giữ placeholder gốc, ghi warning
    archResult = { diagram: '', valid: false, errors: [String(e)], warnings: [`Lỗi tạo sơ đồ kiến trúc: ${e.message || e}`] };
  }

  // ─── Bước 6: Điền Sections 1, 5, 6, 7 ─────────────────────
  filled = fillSummarySections(filled, summaryContents, stateData);

  // ─── Bước 7: Xóa tất cả AI fill comments còn lại ──────────
  filled = filled.replace(/<!--\s*AI fill[^>]*-->\n?/g, '');

  return {
    filledMarkdown: filled,
    diagramResults: {
      business: businessResult,
      architecture: archResult,
    },
  };
}

module.exports = { fillManagementReport };
