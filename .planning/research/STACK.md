# Stack Research

**Domain:** Visual business logic reports (Mermaid diagrams + PDF generation) for Node.js AI coding framework
**Researched:** 2026-03-24
**Confidence:** HIGH
**Scope:** NEW stack additions for v1.4 only. Existing stack (Node.js 16.7+, CommonJS, zero runtime deps, plan-checker with 8 checks, 12 skills, 10 workflows, 5 converters) is validated and NOT re-researched.

## Executive Decision

Use `puppeteer` + `marked` + Mermaid CDN injection in a single custom script (`generate-pdf-report.js`). This avoids heavy wrapper packages, keeps the "pure scripts" philosophy, and handles both Mermaid rendering and PDF generation in one Puppeteer browser session.

**Node.js minimum must be raised from 16.7+ to 18+** because:
- Node 16 reached end-of-life September 2023 (2.5 years ago)
- Puppeteer requires Node 18+ (no workaround)
- `@mermaid-js/mermaid-cli` requires Node ^18.19 or >=20
- `marked` only supports current/LTS Node versions
- Node 18 LTS itself ends April 2025; Node 20 LTS active until April 2026

This is not optional. Every library in the Mermaid/PDF ecosystem requires Node 18+.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| puppeteer | ^24.x | PDF generation + Mermaid rendering | Industry standard headless Chrome. One browser session handles both Mermaid diagram rendering (via CDN script injection) and `page.pdf()` generation. Used by md-to-pdf, mermaid-cli, and every serious Markdown-to-PDF solution. Node 18+ required. |
| marked | ^17.x | Markdown to HTML conversion | 11,484 dependents, actively maintained (17.0.5 released days ago), lightweight (~250 lines core), fast. Custom renderer API allows intercepting Mermaid code blocks to wrap them as `<pre class="mermaid">`. |
| mermaid (CDN) | 11.x | Diagram rendering inside Puppeteer page | Injected via `page.addScriptTag({ url: CDN_URL })` into the Puppeteer page. No npm install needed for the rendering library itself -- it runs in the browser context. Avoids Node.js-side DOM dependency issues (Mermaid requires SVGTextElement.getBBox which JSDOM does not support). |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @mermaid-js/mermaid-cli | ^11.x | Standalone diagram-to-SVG/PNG generation | ONLY if standalone Mermaid file rendering is needed (e.g., generating individual `.svg` files for architecture diagrams outside of PDF context). Provides programmatic `run()` API. Requires puppeteer as peer dependency. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Node.js built-in test runner | Testing generate-pdf-report.js | Already used by project (`node --test`). Mock Puppeteer for unit tests; integration tests generate actual PDFs and verify existence/size. |

## Architecture: Why a Custom Script (Not a Wrapper Package)

Three reasons to write `generate-pdf-report.js` directly instead of using md-to-pdf or similar:

1. **md-to-pdf does NOT natively support Mermaid.** Adding it requires a custom `marked` renderer + CDN injection + `mermaid.run()` call -- the exact same code we would write directly. Extra dependency for zero benefit.

2. **mermaid-md-to-pdf (klokie)** has only 5 commits, no releases. Not production-ready.

3. **The project philosophy is "pure scripts, no bundler."** A ~100-line custom script using puppeteer + marked directly is more aligned than adding a wrapper package that itself wraps puppeteer + marked.

### Script Flow (generate-pdf-report.js)

```
Input: MANAGEMENT_REPORT.md (Markdown with ```mermaid code blocks)
  |
  v
[1] Read Markdown file (fs.readFileSync)
  |
  v
[2] Convert Markdown to HTML (marked.parse with custom renderer)
     - Custom renderer wraps ```mermaid blocks as <pre class="mermaid">
     - Wraps HTML in styled template with CSS for print layout
  |
  v
[3] Launch Puppeteer (headless Chrome)
  |
  v
[4] Set HTML content (page.setContent)
  |
  v
[5] Inject Mermaid.js from CDN (page.addScriptTag)
  |
  v
[6] Execute mermaid.initialize + mermaid.run (page.evaluate)
  |
  v
[7] Wait for diagrams to render (page.waitForSelector)
  |
  v
[8] Generate PDF (page.pdf with A4 format/margin options)
  |
  v
[9] Close browser, output PDF path
```

### Key Code Pattern

```javascript
const puppeteer = require('puppeteer');
const { marked } = require('marked');
const fs = require('fs');

// Custom renderer: wrap mermaid code blocks for browser rendering
const renderer = {
  code({ text, lang }) {
    if (lang === 'mermaid') {
      return `<pre class="mermaid">${text}</pre>`;
    }
    return false; // fallback to default renderer
  }
};
marked.use({ renderer });

async function generatePdf(inputMd, outputPdf) {
  const markdown = fs.readFileSync(inputMd, 'utf8');
  const html = marked.parse(markdown);
  const fullHtml = wrapInTemplate(html); // Add CSS, page structure

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

  // Inject Mermaid from CDN
  await page.addScriptTag({
    url: 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js'
  });

  // Initialize and render all diagrams
  await page.evaluate(async () => {
    mermaid.initialize({ startOnLoad: false, theme: 'default' });
    await mermaid.run();
  });

  // Generate PDF
  await page.pdf({
    path: outputPdf,
    format: 'A4',
    margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    printBackground: true
  });

  await browser.close();
}
```

## Installation

```bash
# Core dependencies for PDF report generation (v1.4 feature)
npm install puppeteer marked
```

**Note on install size:** Puppeteer downloads Chromium (~170-280MB depending on OS). This is a one-time cost. The script runs on developer machines, not in production servers -- the Chromium download is acceptable for a dev tool.

**Why `puppeteer` not `puppeteer-core`:** `puppeteer-core` requires users to manually configure the Chrome/Chromium executable path. For a dev tool that should "just work," auto-downloading Chromium is the right tradeoff.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| puppeteer + marked (custom script) | md-to-pdf package | Never for this project. md-to-pdf lacks native Mermaid support; adding it requires the same custom code we write directly. Extra dependency for no benefit. |
| puppeteer + marked (custom script) | @mermaid-js/mermaid-cli + separate PDF step | Only if you need standalone .svg/.png diagram files (not embedded in PDF). Two-step process adds complexity. |
| puppeteer (full) | puppeteer-core | Only if install size is critical and users can be trusted to configure Chrome path manually. Not worth the DX cost for a dev tool. |
| marked | markdown-it | If you need a rich plugins ecosystem. Marked is simpler, faster, and sufficient for this use case (render Markdown + intercept mermaid blocks). |
| Mermaid CDN injection | mermaid npm package (server-side) | Never. Mermaid requires DOM (SVGTextElement.getBBox). JSDOM does not support this. Server-side rendering without a browser is not viable. |
| Mermaid CDN injection | @rendermaid/core (pure TS renderer) | Unproven, limited diagram type support, not from official Mermaid team. Risk of rendering differences vs real Mermaid. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| mermaid npm package in Node.js | Requires DOM (SVGTextElement.getBBox). JSDOM fails. Cannot render server-side without browser. | CDN injection into Puppeteer page |
| mermaid-isomorphic | Still uses Playwright under the hood (another browser engine, different from Puppeteer). Adds complexity. | Direct Puppeteer + CDN approach |
| node-mermaid-render | Only 4 releases, last v1.0.3 in July 2023. Core code from mermaid-cli but less maintained. | @mermaid-js/mermaid-cli if standalone rendering needed |
| markdown-pdf (npm) | Abandoned. Uses phantom.js which is deprecated. | puppeteer + marked |
| mermaid.cli (old package name) | Deprecated. Development moved to @mermaid-js/mermaid-cli. | @mermaid-js/mermaid-cli |
| Any Python-based solution | Project is pure Node.js. Adding Python dependency breaks stack consistency. | Node.js puppeteer + marked |
| sebastianjs (pure SVG renderer) | Wrapper around custom SVG generation. Not official Mermaid, may miss diagram types or render differently. | Puppeteer + CDN (uses real Mermaid.js) |

## Stack Patterns by Variant

**If generating PDF reports with embedded Mermaid (primary use case):**
- Use custom script with `puppeteer` + `marked` + Mermaid CDN
- Input: `.md` file with ` ```mermaid ` code blocks
- Output: `.pdf` file with rendered diagrams
- Because: single browser session, no intermediate files, full CSS control

**If generating standalone Mermaid diagrams (SVG/PNG files):**
- Use `@mermaid-js/mermaid-cli` with programmatic `run()` API
- Input: `.mmd` file with Mermaid syntax
- Output: `.svg` or `.png` file
- Because: official tool, well-tested, handles all diagram types

**If generating both:**
- The PDF script handles embedded diagrams
- `@mermaid-js/mermaid-cli` handles standalone exports
- Both share Puppeteer (mermaid-cli uses it as peer dependency)

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| puppeteer@24.x | Node.js >=18 | Downloads Chromium ~170-280MB on install |
| marked@17.x | Node.js >=18 (current/LTS only) | Pure JS, no native modules, fast |
| @mermaid-js/mermaid-cli@11.x | Node.js ^18.19 or >=20, puppeteer ^23 | Puppeteer is peer dependency |
| mermaid@11.x (CDN) | Any browser | Loaded at runtime in Puppeteer page context, not installed via npm |

### Node.js Version Upgrade Impact

The existing project has:
- `"engines": { "node": ">=16.7.0" }` in package.json
- Only `js-tiktoken` as devDependency (no runtime deps)
- Pure Node.js scripts, `node --test` for testing

Upgrading to `"node": ">=18"` affects:
- **package.json engines field** -- must update
- **Existing code** -- zero changes needed (Node 18 is fully backward compatible with 16)
- **User installations** -- users on Node 16 (EOL since Sep 2023) must upgrade
- **CI/CD** -- if any, update matrix to test Node 18/20/22

## Integration Points with Existing Project

| Existing Component | Integration | Notes |
|-------------------|-------------|-------|
| `bin/` directory | Add `bin/generate-pdf-report.js` | Follows existing pattern (bin/plan-check.js handles CLI args + file I/O) |
| `bin/lib/` | Add `bin/lib/pdf-generator.js` | Pure function module: markdown content in, PDF buffer out. Follows plan-checker pattern: separate I/O from logic. |
| package.json scripts | Add `"report:pdf": "node bin/generate-pdf-report.js"` | Consistent with existing npm scripts |
| package.json dependencies | Add `puppeteer` + `marked` to `dependencies` (not devDependencies) | These are runtime deps needed by `generate-pdf-report.js` |
| `workflows/complete-milestone.md` | Add step to generate report | Skill instructs AI to run the script after milestone completion |
| `templates/` | Add `templates/MANAGEMENT_REPORT.md` | Template with Mermaid placeholders that AI fills in |
| `references/` | Add `references/mermaid-style-rules.md` | Aesthetic rules for diagram generation (colors, node shapes, edge labels) |
| Test suite | Add `test/smoke-pdf-generator.test.js` | Test marked rendering logic (unit), mock puppeteer; optionally test full PDF generation (integration) |

## Dependency Strategy

```
Runtime dependencies (npm install --save):
  puppeteer   -- PDF generation + browser for Mermaid rendering
  marked      -- Markdown to HTML conversion

No new dev dependencies needed.

Optional (install separately if standalone diagrams needed):
  @mermaid-js/mermaid-cli  -- mmdc command for .mmd -> .svg/.png
```

Total new runtime dependencies: **2 packages** (plus Puppeteer's transitive deps including Chromium download).

The project currently has zero runtime dependencies, so adding 2 for a major new capability (visual PDF report generation) is the minimum viable addition.

## Known Risks

| Risk | Mitigation |
|------|------------|
| Puppeteer Chromium download is ~200MB | One-time cost. Document in README. Consider `PUPPETEER_SKIP_DOWNLOAD=true` for CI if Chromium already available. |
| CDN dependency for Mermaid.js | Pin specific CDN version (`mermaid@11.13.0`). Fallback: bundle mermaid.min.js locally (~2MB). |
| Mermaid rendering timing issues | Use `page.waitForSelector('.mermaid svg')` after `mermaid.run()` to ensure diagrams are fully rendered before PDF generation. |
| ESM vs CommonJS conflict | Mermaid CDN runs in browser context (not Node.js), so module system is irrelevant. `marked@17` supports CommonJS `require()`. `puppeteer@24` supports CommonJS `require()`. |
| Node 18+ version bump breaks users on Node 16 | Node 16 is EOL since Sep 2023. This is a necessary migration. Document in CHANGELOG. |

## Sources

- [Puppeteer system requirements](https://pptr.dev/guides/system-requirements) -- Node 18+ requirement (HIGH confidence)
- [@mermaid-js/mermaid-cli npm](https://www.npmjs.com/package/@mermaid-js/mermaid-cli) -- v11.12.0, Node ^18.19 || >=20 (HIGH confidence)
- [@mermaid-js/mermaid-cli GitHub](https://github.com/mermaid-js/mermaid-cli) -- programmatic `run()` API (HIGH confidence)
- [marked npm](https://www.npmjs.com/package/marked) -- v17.0.5, current/LTS Node only (HIGH confidence)
- [mermaid npm](https://www.npmjs.com/package/mermaid) -- v11.13.0 latest (HIGH confidence)
- [md-to-pdf GitHub](https://github.com/simonhaenisch/md-to-pdf) -- no native Mermaid support (HIGH confidence)
- [md-to-pdf Mermaid config gist](https://gist.github.com/danishcake/d045c867594d6be175cb394995c90e2c) -- custom renderer approach (MEDIUM confidence)
- [Mermaid server-side rendering issue #3650](https://github.com/mermaid-js/mermaid/issues/3650) -- DOM required, JSDOM insufficient (HIGH confidence)
- [Node.js EOL dates](https://endoflife.date/nodejs) -- Node 16 EOL Sep 2023, Node 18 EOL Apr 2025, Node 20 EOL Apr 2026 (HIGH confidence)
- [Puppeteer vs puppeteer-core](https://pptr.dev/guides/installation) -- Chromium bundling differences (HIGH confidence)

---
*Stack research for: Visual Business Logic Reports (Mermaid + PDF) in please-done v1.4*
*Researched: 2026-03-24*
