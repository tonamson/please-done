/**
 * PDF Renderer Module — Markdown-to-HTML, HTML template, Puppeteer detection, fallback.
 *
 * Pure function module: zero file I/O, zero external deps.
 * Consumed by bin/generate-pdf-report.js (CLI wrapper — Plan 02).
 */

'use strict';

// ─── CSS Template ────────────────────────────────────────────

const CSS_TEMPLATE = `
  @page { size: A4; margin: 20mm 15mm; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12pt;
    line-height: 1.6;
    color: #1a1a1a;
    max-width: 100%;
  }
  h1 { color: #2563EB; font-size: 22pt; border-bottom: 2px solid #2563EB; padding-bottom: 8px; }
  h2 { color: #2563EB; font-size: 16pt; margin-top: 24px; page-break-after: avoid; }
  h3 { color: #1e40af; font-size: 13pt; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; page-break-inside: avoid; }
  th { background: #2563EB; color: #fff; padding: 8px 12px; text-align: left; font-weight: 600; }
  td { padding: 8px 12px; border: 1px solid #e2e8f0; }
  tr:nth-child(even) { background: #f8fafc; }
  blockquote { border-left: 4px solid #2563EB; padding: 8px 16px; background: #eff6ff; margin: 12px 0; }
  .mermaid { page-break-inside: avoid; margin: 16px 0; text-align: center; }
  .mermaid svg { max-width: 100%; height: auto; }
  pre { background: #f1f5f9; padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 10pt; }
  code { font-family: 'SF Mono', 'Fira Code', monospace; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
  ul, ol { padding-left: 24px; }
  li { margin: 4px 0; }
`;

// ─── Markdown to HTML ────────────────────────────────────────

/**
 * Convert Markdown subset to HTML using regex.
 * Covers: headings, bold, italic, tables, code blocks (incl. mermaid),
 * blockquotes, unordered lists, horizontal rules.
 *
 * @param {string} md — Markdown content
 * @returns {string} — HTML content
 */
function markdownToHtml(md) {
  let html = md;

  // 1. Mermaid code blocks -> <pre class="mermaid">
  html = html.replace(/```mermaid\n([\s\S]*?)```/g, '<pre class="mermaid">$1</pre>');

  // 2. Other code blocks -> <pre><code>
  html = html.replace(/```(?:\w*)\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // 3. Horizontal rules (before headings to avoid conflict)
  html = html.replace(/^---$/gm, '<hr>');

  // 4. Headings h6->h1 (process h6 first to avoid h1 matching ##)
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // 5. Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // 6. Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // 7. Tables — parse line-by-line
  html = _convertTables(html);

  // 8. Blockquotes
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');

  // 9. Unordered lists: convert - items to <li>, then wrap consecutive <li> in <ul>
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

  return html;
}

/**
 * Convert markdown table blocks to HTML tables.
 * Detects | delimited rows, skips alignment row (|---|), builds proper <table>.
 * @param {string} html
 * @returns {string}
 */
function _convertTables(html) {
  const lines = html.split('\n');
  const result = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Detect table start: line contains | and next line is alignment row
    if (_isTableRow(line) && i + 1 < lines.length && _isAlignmentRow(lines[i + 1])) {
      // Parse header row
      const headers = _parseCells(line);
      let tableHtml = '<table><thead><tr>';
      for (const h of headers) {
        tableHtml += `<th>${h.trim()}</th>`;
      }
      tableHtml += '</tr></thead><tbody>';

      // Skip alignment row
      i += 2;

      // Parse data rows
      while (i < lines.length && _isTableRow(lines[i])) {
        const cells = _parseCells(lines[i]);
        tableHtml += '<tr>';
        for (const c of cells) {
          tableHtml += `<td>${c.trim()}</td>`;
        }
        tableHtml += '</tr>';
        i++;
      }

      tableHtml += '</tbody></table>';
      result.push(tableHtml);
    } else {
      result.push(line);
      i++;
    }
  }

  return result.join('\n');
}

/**
 * Check if a line is a table row (contains |).
 */
function _isTableRow(line) {
  return line.includes('|') && line.trim().startsWith('|');
}

/**
 * Check if a line is a table alignment row (e.g., |---|---|).
 */
function _isAlignmentRow(line) {
  if (!line.includes('|')) return false;
  const stripped = line.replace(/\|/g, '').replace(/[-:\s]/g, '');
  return stripped.length === 0;
}

/**
 * Parse cells from a table row.
 */
function _parseCells(line) {
  // Remove leading and trailing |, then split by |
  const trimmed = line.trim();
  const inner = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed;
  const cleaned = inner.endsWith('|') ? inner.slice(0, -1) : inner;
  return cleaned.split('|');
}

// ─── Build Full HTML ─────────────────────────────────────────

/**
 * Wrap body HTML in a full HTML document with CSS and Mermaid CDN.
 *
 * @param {string} bodyHtml — HTML content for <body>
 * @returns {string} — Complete HTML document
 */
function buildHtml(bodyHtml) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <style>${CSS_TEMPLATE}</style>
</head>
<body>
  ${bodyHtml}
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: true, theme: 'default' });
  </script>
</body>
</html>`;
}

// ─── Puppeteer Detection ─────────────────────────────────────

/**
 * Check if Puppeteer is available at runtime.
 * Does NOT add puppeteer to package.json — user installs manually.
 *
 * @returns {{ available: boolean, reason?: string }}
 */
function canUsePuppeteer() {
  const nodeVersion = parseInt(process.versions.node, 10);
  if (nodeVersion < 18) {
    return {
      available: false,
      reason: `Node.js ${process.versions.node} < 18. Can Node >= 18 de render PDF.`,
    };
  }
  try {
    require.resolve('puppeteer');
    return { available: true };
  } catch {
    return {
      available: false,
      reason: 'PDF export can Puppeteer. Chay: npm install puppeteer',
    };
  }
}

// ─── Fallback ────────────────────────────────────────────────

/**
 * Return markdown content unchanged for fallback file write.
 * Per D-09: fallback outputs filled Markdown — user reads on GitHub/VS Code.
 *
 * @param {string} markdownContent
 * @returns {string}
 */
function renderMarkdownFallback(markdownContent) {
  return markdownContent;
}

// ─── Exports ─────────────────────────────────────────────────

module.exports = {
  markdownToHtml,
  buildHtml,
  CSS_TEMPLATE,
  canUsePuppeteer,
  renderMarkdownFallback,
};
