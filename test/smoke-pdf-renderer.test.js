/**
 * PDF Renderer Module Tests
 * Kiem tra markdownToHtml, buildHtml, CSS_TEMPLATE, canUsePuppeteer, renderMarkdownFallback.
 * Pure function tests — zero file I/O.
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  markdownToHtml,
  buildHtml,
  CSS_TEMPLATE,
  canUsePuppeteer,
  renderMarkdownFallback,
} = require('../bin/lib/pdf-renderer');

// ─── markdownToHtml ─────────────────────────────────────────

describe('markdownToHtml', () => {
  it('Test 1: converts headings h1-h6', () => {
    const md = '# Heading 1\n## Heading 2\n### Heading 3\n#### Heading 4\n##### Heading 5\n###### Heading 6';
    const html = markdownToHtml(md);
    assert.ok(html.includes('<h1>Heading 1</h1>'), 'h1 missing');
    assert.ok(html.includes('<h2>Heading 2</h2>'), 'h2 missing');
    assert.ok(html.includes('<h3>Heading 3</h3>'), 'h3 missing');
    assert.ok(html.includes('<h4>Heading 4</h4>'), 'h4 missing');
    assert.ok(html.includes('<h5>Heading 5</h5>'), 'h5 missing');
    assert.ok(html.includes('<h6>Heading 6</h6>'), 'h6 missing');
  });

  it('Test 2: converts bold and italic', () => {
    const md = 'This is **bold** and *italic* text';
    const html = markdownToHtml(md);
    assert.ok(html.includes('<strong>bold</strong>'), 'bold missing');
    assert.ok(html.includes('<em>italic</em>'), 'italic missing');
  });

  it('Test 3: converts mermaid code blocks to <pre class="mermaid">', () => {
    const md = '```mermaid\nflowchart TD\n  A-->B\n```';
    const html = markdownToHtml(md);
    assert.ok(html.includes('<pre class="mermaid">'), 'mermaid pre tag missing');
    assert.ok(html.includes('flowchart TD'), 'mermaid content missing');
    assert.ok(!html.includes('```mermaid'), 'raw mermaid fence should be removed');
  });

  it('Test 4: converts regular code blocks to <pre><code>', () => {
    const md = '```js\nconst x = 1;\n```';
    const html = markdownToHtml(md);
    assert.ok(html.includes('<pre><code>'), 'code block pre/code missing');
    assert.ok(html.includes('const x = 1;'), 'code content missing');
  });

  it('Test 5: converts markdown table to HTML table', () => {
    const md = '| Name | Value |\n|------|-------|\n| A | 1 |\n| B | 2 |';
    const html = markdownToHtml(md);
    assert.ok(html.includes('<table>'), 'table tag missing');
    assert.ok(html.includes('<th>'), 'th tag missing');
    assert.ok(html.includes('<td>'), 'td tag missing');
    assert.ok(html.includes('Name'), 'header content missing');
    assert.ok(html.includes('1'), 'cell content missing');
  });

  it('Test 6: converts blockquotes', () => {
    const md = '> quote text';
    const html = markdownToHtml(md);
    assert.ok(html.includes('<blockquote>'), 'blockquote missing');
    assert.ok(html.includes('quote text'), 'blockquote content missing');
  });

  it('Test 7: converts unordered lists', () => {
    const md = '- item one\n- item two';
    const html = markdownToHtml(md);
    assert.ok(html.includes('<ul>'), 'ul tag missing');
    assert.ok(html.includes('<li>'), 'li tag missing');
    assert.ok(html.includes('item one'), 'list content missing');
    assert.ok(html.includes('item two'), 'second list item missing');
  });

  it('Test 8: converts horizontal rule', () => {
    const md = 'above\n\n---\n\nbelow';
    const html = markdownToHtml(md);
    assert.ok(html.includes('<hr>'), 'hr tag missing');
  });
});

// ─── buildHtml ──────────────────────────────────────────────

describe('buildHtml', () => {
  it('Test 9: starts with <!DOCTYPE html> and contains lang="vi"', () => {
    const html = buildHtml('<p>Hello</p>');
    assert.ok(html.includes('<!DOCTYPE html>'), 'DOCTYPE missing');
    assert.ok(html.includes('lang="vi"'), 'lang="vi" missing');
  });

  it('Test 10: contains CSS_TEMPLATE content with #2563EB', () => {
    const html = buildHtml('<p>Hello</p>');
    assert.ok(html.includes('#2563EB'), 'Corporate Blue #2563EB missing from CSS');
  });

  it('Test 11: contains Mermaid CDN script URL', () => {
    const html = buildHtml('<p>Hello</p>');
    assert.ok(
      html.includes('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs'),
      'Mermaid CDN URL missing'
    );
  });

  it('Test 12: contains mermaid.initialize with startOnLoad: true', () => {
    const html = buildHtml('<p>Hello</p>');
    assert.ok(html.includes('mermaid.initialize'), 'mermaid.initialize missing');
    assert.ok(html.includes('startOnLoad: true'), 'startOnLoad: true missing');
  });

  it('Test 13: body content appears inside <body> tags', () => {
    const html = buildHtml('<p>Test Content Here</p>');
    const bodyMatch = html.match(/<body>([\s\S]*)<\/body>/);
    assert.ok(bodyMatch, '<body> tags missing');
    assert.ok(bodyMatch[1].includes('Test Content Here'), 'body content not inside <body> tags');
  });
});

// ─── CSS_TEMPLATE ───────────────────────────────────────────

describe('CSS_TEMPLATE', () => {
  it('Test 14: contains #2563EB (Corporate Blue)', () => {
    assert.ok(CSS_TEMPLATE.includes('#2563EB'), '#2563EB missing from CSS_TEMPLATE');
  });

  it('Test 15: contains @page rule with A4', () => {
    assert.ok(CSS_TEMPLATE.includes('@page'), '@page rule missing');
    assert.ok(CSS_TEMPLATE.includes('A4'), 'A4 size missing');
  });

  it('Test 16: contains sans-serif font family', () => {
    assert.ok(CSS_TEMPLATE.includes('sans-serif'), 'sans-serif font missing');
  });

  it('Test 17: contains .mermaid rule with page-break-inside: avoid', () => {
    assert.ok(CSS_TEMPLATE.includes('.mermaid'), '.mermaid rule missing');
    assert.ok(CSS_TEMPLATE.includes('page-break-inside: avoid'), 'page-break-inside: avoid missing');
  });
});

// ─── canUsePuppeteer ────────────────────────────────────────

describe('canUsePuppeteer', () => {
  it('Test 18: returns object with available boolean property', () => {
    const result = canUsePuppeteer();
    assert.equal(typeof result, 'object', 'should return object');
    assert.equal(typeof result.available, 'boolean', 'available should be boolean');
  });

  it('Test 19: when puppeteer not installed, returns { available: false, reason: string }', () => {
    // In test environment, puppeteer is not installed
    const result = canUsePuppeteer();
    // Either puppeteer is not installed or Node version check fails
    // Both valid outcomes - we verify structure
    if (!result.available) {
      assert.equal(typeof result.reason, 'string', 'reason should be string when unavailable');
    }
  });

  it('Test 20: reason contains npm install puppeteer when puppeteer missing', () => {
    const result = canUsePuppeteer();
    // In this test environment puppeteer is not installed
    // If Node >= 18, the reason should mention npm install puppeteer
    const nodeVersion = parseInt(process.versions.node, 10);
    if (nodeVersion >= 18 && !result.available) {
      assert.ok(
        result.reason.includes('npm install puppeteer'),
        'reason should contain "npm install puppeteer"'
      );
    }
  });
});

// ─── renderMarkdownFallback ─────────────────────────────────

describe('renderMarkdownFallback', () => {
  it('Test 21: returns input markdown string unchanged', () => {
    const input = '# Hello World\n\nSome content here.';
    const result = renderMarkdownFallback(input);
    assert.equal(result, input, 'should return input unchanged');
  });

  it('Test 22: return type is string', () => {
    const result = renderMarkdownFallback('test content');
    assert.equal(typeof result, 'string', 'should return string');
  });
});

// ─── CLI integration — generate-pdf-report.js ───────────────

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('CLI integration — generate-pdf-report.js', () => {
  it('Test 23: prints usage and exits 1 when no args', () => {
    try {
      execSync('node bin/generate-pdf-report.js', { encoding: 'utf8', stdio: 'pipe' });
      assert.fail('should have exited non-zero');
    } catch (err) {
      assert.ok(err.stderr.includes('Usage:') || err.stdout.includes('Usage:'),
        'output should contain "Usage:"');
    }
  });

  it('Test 24: exits 1 when input file does not exist', () => {
    try {
      execSync('node bin/generate-pdf-report.js nonexistent-file-xyz.md', { encoding: 'utf8', stdio: 'pipe' });
      assert.fail('should have exited non-zero');
    } catch (err) {
      assert.ok(err.status === 1, 'exit code should be 1');
    }
  });

  it('Test 25: fallback path creates output in .planning/reports/ and exits 0', () => {
    // Create a temp directory to act as process.cwd()
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-test-'));
    const inputPath = path.join(tmpDir, 'test-report.md');
    fs.writeFileSync(inputPath, '# Test Report\n\nSome content\n');
    const planningDir = path.join(tmpDir, '.planning', 'reports');

    try {
      // Run from tmpDir so process.cwd() points there
      const output = execSync(`node ${path.resolve('bin/generate-pdf-report.js')} ${inputPath}`, {
        encoding: 'utf8',
        stdio: 'pipe',
        cwd: tmpDir,
      });
      // If puppeteer not installed, fallback .md should exist
      if (fs.existsSync(path.join(planningDir, 'test-report.md'))) {
        assert.ok(true, 'Fallback .md created');
      } else if (fs.existsSync(path.join(planningDir, 'test-report.pdf'))) {
        assert.ok(true, 'PDF created (puppeteer available)');
      } else {
        assert.fail('Neither .md nor .pdf created in .planning/reports/');
      }
    } finally {
      // Cleanup
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('Test 26: output uses process.cwd() not __dirname', () => {
    const script = fs.readFileSync(path.resolve('bin/generate-pdf-report.js'), 'utf8');
    assert.ok(script.includes('process.cwd()'), 'should use process.cwd()');
    assert.ok(!script.includes('__dirname'), 'should NOT use __dirname for output path');
  });
});
