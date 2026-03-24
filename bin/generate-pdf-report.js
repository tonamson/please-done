#!/usr/bin/env node
/**
 * PDF Report Generator CLI — converts filled management report Markdown
 * (with Mermaid diagrams) to professional A4 PDF via Puppeteer.
 *
 * Falls back to Markdown output when Puppeteer unavailable or Node < 18.
 *
 * Usage: node bin/generate-pdf-report.js <input.md>
 * Output: process.cwd()/.planning/reports/<basename>.pdf (or .md fallback)
 *
 * Exit codes:
 *   0 — PDF created successfully
 *   0 — Fallback markdown created (with warning log)
 *   1 — Real failure (no input arg, file not found, write error)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { markdownToHtml, buildHtml, canUsePuppeteer, renderMarkdownFallback } = require('./lib/pdf-renderer');
const { log } = require('./lib/utils');

// ─── CLI Args ───────────────────────────────────────────────

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node bin/generate-pdf-report.js <input.md>');
  process.exit(1);
}

// ─── generatePdf ────────────────────────────────────────────

/**
 * Render HTML to PDF using Puppeteer headless Chrome.
 * Waits for Mermaid diagrams to render as inline SVG before printing.
 *
 * @param {string} html — Full HTML document (from buildHtml)
 * @param {string} outputPath — Absolute path for output PDF file
 */
async function generatePdf(html, outputPath) {
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'networkidle0' });

  // Wait for Mermaid diagrams to render (per D-01, D-02)
  const hasMermaid = html.includes('class="mermaid"');
  if (hasMermaid) {
    await page.waitForFunction(() => {
      const diagrams = document.querySelectorAll('.mermaid');
      return Array.from(diagrams).every(d => d.querySelector('svg'));
    }, { timeout: 15000 });
  }

  await page.pdf({
    path: outputPath,
    format: 'A4',           // per D-06
    printBackground: true,  // CRITICAL per Pitfall 1
    margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
  });

  await browser.close();
}

// ─── Main ───────────────────────────────────────────────────

(async () => {
  const inputPath = path.resolve(process.argv[2]);
  if (!fs.existsSync(inputPath)) {
    log.error(`File khong ton tai: ${inputPath}`);
    process.exit(1);
  }

  const markdown = fs.readFileSync(inputPath, 'utf8');
  const reportsDir = path.join(process.cwd(), '.planning', 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });
  const baseName = path.basename(inputPath, '.md');

  // Check Puppeteer availability (per D-07, D-08, D-10)
  const puppeteerCheck = canUsePuppeteer();

  if (!puppeteerCheck.available) {
    // Fallback path (per D-09, D-11)
    log.warn(puppeteerCheck.reason);
    const fallbackContent = renderMarkdownFallback(markdown);
    const fallbackPath = path.join(reportsDir, `${baseName}.md`);
    fs.writeFileSync(fallbackPath, fallbackContent, 'utf8');
    log.info(`Fallback: Markdown created: ${fallbackPath} (install puppeteer for PDF)`);
    process.exit(0); // per D-11: exit 0 on fallback
  }

  // PDF path (per D-01, D-02, D-04, D-06)
  try {
    const bodyHtml = markdownToHtml(markdown);
    const fullHtml = buildHtml(bodyHtml);
    const pdfPath = path.join(reportsDir, `${baseName}.pdf`);
    await generatePdf(fullHtml, pdfPath);
    log.success(`PDF created: ${pdfPath}`);
    process.exit(0);
  } catch (err) {
    log.error(`PDF generation failed: ${err.message}`);
    // Fallback to markdown on PDF error
    const fallbackContent = renderMarkdownFallback(markdown);
    const fallbackPath = path.join(reportsDir, `${baseName}.md`);
    fs.writeFileSync(fallbackPath, fallbackContent, 'utf8');
    log.warn(`Fallback: Markdown created: ${fallbackPath}`);
    process.exit(0); // per D-11: still exit 0
  }
})();
