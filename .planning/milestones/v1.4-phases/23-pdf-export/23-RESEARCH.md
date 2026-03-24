# Phase 23: PDF Export - Research

**Researched:** 2026-03-24
**Domain:** Markdown+Mermaid to PDF conversion with Puppeteer headless Chrome
**Confidence:** HIGH

## Summary

Phase 23 creates `bin/generate-pdf-report.js` -- a script that converts a filled management report (Markdown with Mermaid diagrams) into a professional A4 PDF. The script uses Puppeteer headless Chrome to render Mermaid inline SVG via CDN and print to PDF. When Puppeteer is unavailable or Node < 18, it falls back gracefully to outputting the Markdown file directly.

The architecture follows the established CLI wrapper pattern: `bin/generate-pdf-report.js` handles file I/O and CLI concerns, while a pure library module `bin/lib/pdf-renderer.js` handles HTML template construction, Markdown-to-HTML conversion, and Puppeteer orchestration. Mermaid.js v11 is loaded from jsDelivr CDN as an ESM module within the rendered HTML page -- no npm dependency required.

**Primary recommendation:** Use `page.setContent()` with `waitUntil: 'networkidle0'` to render HTML containing `<pre class="mermaid">` blocks and `<script type="module">` importing Mermaid from CDN. After Mermaid auto-initializes and renders SVG inline, call `page.pdf({ format: 'A4', printBackground: true })` to produce the final PDF.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Render Mermaid truc tiep trong Puppeteer page -- load mermaid.js tu CDN (cdn.jsdelivr.net), render inline SVG, roi print toan bo page sang PDF. Khong dung mermaid-cli hay pre-render rieng.
- **D-02:** Mermaid la SVG inline trong HTML -- sac net o moi zoom level, khong bi pixel.
- **D-03:** Mermaid.js load tu CDN -- khong bundle local, khong them npm dependency. Can internet khi generate.
- **D-04:** Professional styling: font sans-serif, margin rong, heading colors theo Corporate Blue (#2563EB), table borders, page breaks hop ly. Giong bao cao tu van.
- **D-05:** CSS la template string inline trong script generate-pdf-report.js -- tat ca trong 1 file, khong tach CSS rieng.
- **D-06:** Page size A4 (210x297mm) -- chuan van phong Viet Nam.
- **D-07:** Puppeteer KHONG them vao package.json. Runtime detection: try/catch require('puppeteer'). User tu install khi can. Giu zero production deps.
- **D-08:** Khi Puppeteer khong co: log message ro rang voi install command cu the: "PDF export can Puppeteer. Chay: npm install puppeteer". Roi fallback.
- **D-09:** Fallback output la Markdown file (.md) da duoc fill day du data (Mermaid text giu nguyen). User doc duoc tren GitHub/VS Code, Mermaid render duoc tren GitHub.
- **D-10:** Node.js < 18: same fallback nhu thieu Puppeteer -- log warning + xuat Markdown. Logic chung cho ca 2 truong hop.
- **D-11:** Exit code 0 khi fallback + warning log. Non-blocking cho CI/CD va workflow (Phase 24). Chi exit non-zero khi that bai that su (file write error, etc.)

### Claude's Discretion
- Script CLI interface (args, options, output path)
- HTML template structure cho Puppeteer page
- Markdown-to-HTML conversion approach (marked, markdown-it, hoac regex)
- Test strategy va test cases cu the
- Error handling chi tiet trong render pipeline

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PDF-01 | Script generate-pdf-report.js xuat Markdown+Mermaid sang PDF voi hinh anh ro net | Puppeteer page.pdf() with format A4, printBackground: true renders Mermaid SVG inline at vector quality. Mermaid loaded from CDN via ESM module auto-renders into SVG. |
| PDF-02 | Script hoat dong graceful khi khong co Puppeteer/Node 18+ (fallback sang Markdown-only) | Runtime detection via try/catch require('puppeteer'), Node version check parseInt(process.versions.node) < 18, shared fallback logic outputs .md file with exit code 0. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| puppeteer | 24.40.0 | Headless Chrome for PDF generation | Industry standard for programmatic PDF from HTML. NOT added to package.json -- runtime detection only. User installs manually. |
| mermaid | 11.13.0 | Diagram rendering in browser | Loaded from CDN (jsdelivr), renders Mermaid code blocks to inline SVG. v11 uses ESM module format. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node.js built-in `fs` | -- | File I/O | Read input markdown, write output PDF/MD |
| Node.js built-in `path` | -- | Path resolution | Resolve input/output file paths |
| Node.js built-in `process` | -- | Version detection, exit codes | Check Node version, CLI args |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Regex MD-to-HTML | marked / markdown-it | External dep adds complexity. Regex covers the subset needed (headings, tables, bold, italic, lists, code blocks, blockquotes). Management report template is simple enough for regex. **Recommendation: Use regex** -- keeps zero-dependency promise and the template is controlled/predictable. |
| Puppeteer | Playwright | Larger install, less Node.js ecosystem integration. Puppeteer is the established pattern for mermaid-cli. |
| CDN Mermaid | Bundled mermaid | Would add ~5MB npm dep. CDN approach matches D-03 decision. |

**Installation (user-facing, not in package.json):**
```bash
npm install puppeteer
```

**Version verification:** Versions confirmed via npm registry on 2026-03-24:
- puppeteer: 24.40.0
- mermaid (CDN): 11.13.0

## Architecture Patterns

### Recommended Project Structure
```
bin/
  generate-pdf-report.js    # CLI wrapper -- file I/O, args, orchestration
  lib/
    pdf-renderer.js          # Pure library -- HTML template, MD-to-HTML, PDF rendering
```

### Pattern 1: CLI Wrapper + Pure Library (Established)
**What:** Separate CLI concerns (file I/O, args, process.exit) from library logic (pure functions).
**When to use:** Always -- this is the established pattern in this codebase (plan-check.js + plan-checker.js).
**Example:**
```javascript
// bin/generate-pdf-report.js (CLI wrapper)
'use strict';
const fs = require('fs');
const path = require('path');
const { log } = require('./lib/utils');
const { renderPdf, renderMarkdownFallback, canUsePuppeteer } = require('./lib/pdf-renderer');

const args = process.argv.slice(2);
// ... parse args, read input file, call library, write output
```

### Pattern 2: Runtime Dependency Detection
**What:** Try/catch require() to detect optional dependency at runtime without adding to package.json.
**When to use:** When a heavy dependency (Puppeteer ~300MB) should be optional.
**Example:**
```javascript
// Source: Established Node.js pattern for optional deps
function canUsePuppeteer() {
  // Check Node version first
  const nodeVersion = parseInt(process.versions.node, 10);
  if (nodeVersion < 18) {
    return { available: false, reason: `Node.js ${process.versions.node} < 18. Can Node >= 18 de render PDF.` };
  }
  try {
    require.resolve('puppeteer');
    return { available: true };
  } catch {
    return { available: false, reason: 'PDF export can Puppeteer. Chay: npm install puppeteer' };
  }
}
```

### Pattern 3: Mermaid CDN Rendering in Puppeteer
**What:** Build HTML with `<pre class="mermaid">` blocks and `<script type="module">` importing Mermaid ESM from CDN. Mermaid auto-initializes on page load, renders all diagrams to inline SVG.
**When to use:** Converting Mermaid code blocks to rendered SVG in PDF.
**Critical detail:** `page.setContent()` with `waitUntil: 'networkidle0'` ensures CDN script is fully loaded before proceeding. The `networkidle0` option waits for zero network connections for 500ms.
**Example:**
```javascript
// Source: Mermaid official docs (mermaid.js.org/config/usage.html) + Puppeteer docs
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
```

### Pattern 4: Markdown-to-HTML via Regex (Zero Dependencies)
**What:** Convert the management report's Markdown subset to HTML using regex replacements. The template structure is known and controlled -- no arbitrary Markdown needed.
**When to use:** When the input is a predictable template (management-report.md) with limited Markdown features.
**Supported conversions:** headings (h1-h6), tables, bold, italic, blockquotes, unordered/ordered lists, code blocks (including mermaid), horizontal rules.
**Example:**
```javascript
function markdownToHtml(md) {
  let html = md;
  // Mermaid code blocks -> <pre class="mermaid">
  html = html.replace(/```mermaid\n([\s\S]*?)```/g, '<pre class="mermaid">$1</pre>');
  // Other code blocks -> <pre><code>
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  // Headings
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
  // Bold, italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Tables (parse | delimited rows)
  // ... table parsing logic
  // Blockquotes
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
  // Paragraphs (remaining text lines)
  // ... paragraph wrapping
  return html;
}
```

### Anti-Patterns to Avoid
- **Adding puppeteer to package.json:** Violates D-07. Use runtime detection only.
- **Using mermaid-cli:** Violates D-01. Render directly in Puppeteer page, not through external tool.
- **Pre-rendering Mermaid to PNG:** Violates D-02. SVG inline is vector-quality at all zoom levels.
- **Separate CSS file:** Violates D-05. CSS must be template string inline in the script.
- **Using page.evaluate() to load Mermaid ESM:** ESM modules cannot be loaded via evaluate() due to module scope restrictions. Use `<script type="module">` in the HTML content instead.
- **Exit code non-zero on fallback:** Violates D-11. Fallback is a valid output path, exit 0 with warning.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF rendering | Custom PDF generation (PDFKit, jsPDF) | Puppeteer page.pdf() | Chrome's print-to-PDF is the most accurate HTML-to-PDF renderer. Handles CSS, SVG, page breaks natively. |
| Mermaid rendering | Custom Mermaid parser | Mermaid.js from CDN in browser context | Mermaid.js is 50K+ lines of rendering logic. No alternative works as well. |
| Chromium download | Manual Chrome install | Puppeteer auto-downloads Chromium | Puppeteer manages its own browser binary. |

**Key insight:** The entire PDF pipeline relies on Chrome's built-in print-to-PDF engine. Building custom PDF generation would be thousands of lines for inferior results.

## Common Pitfalls

### Pitfall 1: printBackground Must Be True
**What goes wrong:** CSS background colors (heading backgrounds, table header colors) don't appear in PDF.
**Why it happens:** Puppeteer's page.pdf() defaults printBackground to false, matching Chrome's default print behavior.
**How to avoid:** Always set `printBackground: true` in page.pdf() options.
**Warning signs:** PDF output has no colors, all backgrounds are white.

### Pitfall 2: Mermaid ESM Module Load Timing
**What goes wrong:** PDF renders before Mermaid diagrams are converted to SVG, resulting in raw text or empty diagram areas.
**Why it happens:** Mermaid loads asynchronously from CDN. Without proper wait, page.pdf() fires before rendering completes.
**How to avoid:** Use `page.setContent(html, { waitUntil: 'networkidle0' })` to wait for CDN fetch completion. Then use `page.waitForFunction()` to verify all `.mermaid` elements have been processed (contain `<svg>` children).
**Warning signs:** Diagrams show as text blocks or are missing from PDF.

### Pitfall 3: page.setContent vs page.goto for ESM Modules
**What goes wrong:** `page.setContent()` may have issues loading `<script type="module">` from CDN in some Puppeteer versions.
**Why it happens:** ESM module loading requires proper origin context. `setContent()` uses `about:blank` origin which may restrict CDN fetches in certain configurations.
**How to avoid:** Primary approach: use `page.setContent()` with `waitUntil: 'networkidle0'`. If ESM loading fails, fallback approach: write HTML to a temp file and use `page.goto('file://' + tmpPath)`. Both approaches should be tested.
**Warning signs:** Mermaid script fails to load, console errors about CORS or module loading.

### Pitfall 4: SVG Height Overflow in PDF Pages
**What goes wrong:** Large Mermaid diagrams overflow page boundaries, getting cut off between pages.
**Why it happens:** Mermaid SVGs can be taller than A4 page height. CSS page-break rules don't always work with SVG.
**How to avoid:** Add CSS `page-break-inside: avoid` on `.mermaid` containers. For very large diagrams, consider setting max-width and letting SVG scale proportionally.
**Warning signs:** Diagrams split across pages with missing portions.

### Pitfall 5: Node Version Detection Edge Cases
**What goes wrong:** Version check fails or produces incorrect results.
**Why it happens:** `process.versions.node` returns string like "24.13.0". Naive string comparison fails ("8" > "18" alphabetically).
**How to avoid:** Use `parseInt(process.versions.node, 10)` for numeric major version comparison.
**Warning signs:** Script runs on Node 16 without triggering fallback.

### Pitfall 6: Markdown Table Regex Complexity
**What goes wrong:** Tables don't convert properly to HTML, especially with alignment rows (|---|) or cells containing special characters.
**Why it happens:** Markdown tables are the hardest element to parse with regex.
**How to avoid:** Parse tables line-by-line: detect header row, skip alignment row, process data rows. Don't try a single regex for the entire table. Handle pipe characters inside cells.
**Warning signs:** Tables render as raw text or with broken columns.

## Code Examples

Verified patterns from official sources:

### Puppeteer PDF Generation
```javascript
// Source: https://pptr.dev/api/puppeteer.page.pdf + https://pptr.dev/api/puppeteer.pdfoptions
const puppeteer = require('puppeteer');

async function generatePdf(html, outputPath) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'networkidle0' });

  // Wait for all Mermaid diagrams to render
  const hasMermaid = html.includes('class="mermaid"');
  if (hasMermaid) {
    await page.waitForFunction(() => {
      const diagrams = document.querySelectorAll('.mermaid');
      return Array.from(diagrams).every(d => d.querySelector('svg'));
    }, { timeout: 15000 });
  }

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
  });

  await browser.close();
}
```

### Mermaid in HTML (Official Docs Pattern)
```html
<!-- Source: https://mermaid.js.org/config/usage.html -->
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"></head>
<body>
  <pre class="mermaid">
    flowchart TD
      A["Bat dau"] --> B["Xu ly"]
      B --> C["Ket thuc"]
  </pre>
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: true, theme: 'default' });
  </script>
</body>
</html>
```

### Runtime Puppeteer Detection
```javascript
// Source: Established Node.js pattern for optional deps
function canUsePuppeteer() {
  const nodeVersion = parseInt(process.versions.node, 10);
  if (nodeVersion < 18) {
    return { available: false, reason: `Node.js ${process.versions.node} < 18. Can Node >= 18.` };
  }
  try {
    require.resolve('puppeteer');
    return { available: true };
  } catch {
    return { available: false, reason: 'PDF export can Puppeteer. Chay: npm install puppeteer' };
  }
}
```

### CSS Template for Professional Report
```javascript
// Source: D-04 Corporate Blue (#2563EB) + A4 print conventions
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
`;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Mermaid UMD bundle via addScriptTag | Mermaid ESM module via `<script type="module">` | Mermaid v10.4+ (2023) | Must use ESM import, not evaluate() injection |
| page.pdf() default letter format | Explicit format: 'A4' | Puppeteer 20+ | Must specify format explicitly for non-US paper |
| mermaid.init() | mermaid.initialize() + startOnLoad | Mermaid v10+ | init() deprecated, use initialize() |

**Deprecated/outdated:**
- `mermaid.init()`: Replaced by `mermaid.initialize()` + `mermaid.run()` in Mermaid v10+
- Mermaid UMD bundle: While still available, ESM is the recommended approach for Mermaid v11
- `waitUntil: 'networkidle'`: Deprecated in Puppeteer, use `'networkidle0'` or `'networkidle2'`

## Open Questions

1. **page.setContent() ESM module loading reliability**
   - What we know: `page.setContent()` with `waitUntil: 'networkidle0'` should load CDN scripts. Mermaid official docs use `<script type="module">` approach.
   - What's unclear: Whether `page.setContent()` reliably supports `<script type="module">` with CDN imports in Puppeteer 24.x, or if a temp file + `page.goto()` is needed as fallback.
   - Recommendation: Implement with `page.setContent()` first. If ESM loading fails during testing, add temp file fallback with `page.goto('file://' + tmpPath)`.

2. **Mermaid rendering timeout**
   - What we know: Mermaid renders asynchronously. `waitForFunction` can check for SVG presence.
   - What's unclear: How long complex diagrams take to render (15-node flowcharts with subgraphs).
   - Recommendation: Use 15-second timeout for `waitForFunction`. This is generous for CDN load + render. Log timeout as warning, still attempt PDF generation.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in, Node.js 18+) |
| Config file | None -- uses `node --test 'test/*.test.js'` |
| Quick run command | `node --test test/smoke-pdf-renderer.test.js` |
| Full suite command | `node --test 'test/*.test.js'` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PDF-01 | markdownToHtml converts headings, tables, bold, code blocks | unit | `node --test test/smoke-pdf-renderer.test.js` | Wave 0 |
| PDF-01 | markdownToHtml converts mermaid code blocks to `<pre class="mermaid">` | unit | `node --test test/smoke-pdf-renderer.test.js` | Wave 0 |
| PDF-01 | buildHtml wraps body with DOCTYPE, CSS, Mermaid CDN script | unit | `node --test test/smoke-pdf-renderer.test.js` | Wave 0 |
| PDF-01 | CSS_TEMPLATE contains Corporate Blue #2563EB | unit | `node --test test/smoke-pdf-renderer.test.js` | Wave 0 |
| PDF-01 | PDF generation with Puppeteer (page.pdf) | manual-only | Manual -- requires Puppeteer installed + internet | N/A |
| PDF-02 | canUsePuppeteer returns { available: false } when require.resolve fails | unit | `node --test test/smoke-pdf-renderer.test.js` | Wave 0 |
| PDF-02 | canUsePuppeteer returns { available: false } reason message with install command | unit | `node --test test/smoke-pdf-renderer.test.js` | Wave 0 |
| PDF-02 | renderMarkdownFallback writes .md file to output path | unit | `node --test test/smoke-pdf-renderer.test.js` | Wave 0 |
| PDF-02 | CLI wrapper exits 0 on fallback path | unit | `node --test test/smoke-pdf-renderer.test.js` | Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-pdf-renderer.test.js`
- **Per wave merge:** `node --test 'test/*.test.js'`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `test/smoke-pdf-renderer.test.js` -- covers PDF-01 (markdownToHtml, buildHtml, CSS) and PDF-02 (canUsePuppeteer, fallback)
- [ ] No framework install needed -- node:test is built-in

## Sources

### Primary (HIGH confidence)
- [Puppeteer PDFOptions API](https://pptr.dev/api/puppeteer.pdfoptions) -- format, margin, printBackground, preferCSSPageSize options verified
- [Puppeteer page.pdf() API](https://pptr.dev/api/puppeteer.page.pdf) -- method signature and behavior
- [Mermaid Usage Guide](https://mermaid.js.org/config/usage.html) -- ESM CDN import pattern, startOnLoad, auto-rendering
- [jsDelivr Mermaid CDN](https://www.jsdelivr.com/package/npm/mermaid) -- CDN URL pattern for v11
- npm registry (2026-03-24) -- puppeteer 24.40.0, mermaid 11.13.0, marked 17.0.5, markdown-it 14.1.1

### Secondary (MEDIUM confidence)
- [Puppeteer GitHub Issue #907](https://github.com/puppeteer/puppeteer/issues/907) -- page.setContent waitUntil networkidle0 confirmed working for external resources
- [mermaid-cli DeepWiki](https://deepwiki.com/mermaid-js/mermaid-cli/3.3-rendering-engine) -- Mermaid rendering architecture in Puppeteer context
- [Puppeteer GitHub Issue #3382](https://github.com/puppeteer/puppeteer/issues/3382) -- ESM module challenges with page.evaluate(), confirms need for `<script type="module">` approach

### Tertiary (LOW confidence)
- page.setContent() + `<script type="module">` CDN import interaction in Puppeteer 24.x -- needs validation during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Puppeteer page.pdf() is well-documented, Mermaid CDN usage is official
- Architecture: HIGH -- Follows established codebase patterns (CLI wrapper + pure library)
- Pitfalls: HIGH -- printBackground, ESM timing, table regex are well-documented issues
- Markdown-to-HTML regex: MEDIUM -- Regex approach is adequate for predictable template but table parsing needs careful implementation

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable domain, Puppeteer/Mermaid APIs are mature)
