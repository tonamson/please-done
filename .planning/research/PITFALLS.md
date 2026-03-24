# Pitfalls Research

**Domain:** Adding Mermaid diagram generation + PDF export to existing Node.js AI coding skill framework
**Researched:** 2026-03-24
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Node.js Version Incompatibility -- mermaid-cli Requires Node 18+

**What goes wrong:**
`@mermaid-js/mermaid-cli` (mmdc) requires Node.js `^18.19 || >=20.0`. The project declares `"engines": { "node": ">=16.7.0" }`. Installing mermaid-cli as a production dependency breaks the minimum version contract. Users on Node 16 or 17 get install failures or runtime crashes.

**Why it happens:**
mermaid-cli depends on Puppeteer 23+ which itself requires Node 18+. This is a hard constraint -- not configurable. The entire mermaid-cli -> puppeteer -> chromium chain enforces Node 18+.

**How to avoid:**
1. Do NOT add `@mermaid-js/mermaid-cli` or `puppeteer` to `dependencies` or `devDependencies` in the project's package.json.
2. Treat `generate-pdf-report.js` as a standalone script with runtime dependency detection. The script checks at execution time: "Is mmdc available? Is puppeteer available?" and fails gracefully with install instructions if not.
3. Use `npx @mermaid-js/mermaid-cli mmdc` for on-demand rendering -- no permanent dependency footprint.
4. Alternative approach: generate Mermaid syntax only (text in .md files). The PDF step is optional and documented as requiring Node 18+.
5. Keep the project's `engines.node >= 16.7.0` contract intact -- the 12 skills, 10 workflows, 5 converters must remain runnable on Node 16.

**Warning signs:**
- `package.json` engines field changes to `>=18`
- CI or user reports "Cannot find module" or engine incompatibility warnings
- `npm install` triggers 300MB+ Chromium binary download as a top-level dependency

**Phase to address:**
Phase 1 (Architecture/Script setup) -- decide dependency isolation strategy before writing any code.

---

### Pitfall 2: Puppeteer/Chromium Binary Bloat Destroys Install Experience

**What goes wrong:**
Puppeteer downloads a Chromium binary (~170-350MB) during `npm install`. This:
1. Triples the project install time for ALL users
2. Fails in network-restricted or air-gapped environments
3. Fails on platforms without matching Chromium binaries (ARM Linux, some macOS setups)
4. Makes `npm install please-done` prohibitively slow for users who only want the AI skills
5. CrowdStrike and corporate antivirus software flags Chromium spawning and kills the process (documented in mermaid-cli Issue #958)

**Why it happens:**
`puppeteer` (not `puppeteer-core`) auto-downloads Chromium. If added as a regular dependency, every `npm install` triggers the download -- even for users who never use PDF export. The project currently has ZERO production dependencies and only one devDependency (`js-tiktoken`). Adding Puppeteer would be a 10,000x increase in dependency weight.

**How to avoid:**
- Never add `puppeteer` to the main `package.json` dependencies.
- The PDF generation script should check for Puppeteer at runtime and provide a clear error message with install instructions if missing:
  ```javascript
  let puppeteer;
  try { puppeteer = require('puppeteer'); }
  catch { console.error('PDF export requires puppeteer. Install: npm install -g puppeteer'); process.exit(1); }
  ```
- Consider `puppeteer-core` + system Chrome detection as a lighter alternative for users who already have Chrome installed.
- Document: "PDF export is optional. Install puppeteer separately if needed."

**Warning signs:**
- `package-lock.json` grows by 50MB+
- `node_modules` exceeds 500MB
- CI pipeline install step takes 3x longer
- Users report install failures on non-x86 platforms

**Phase to address:**
Phase 1 (Script architecture) -- make Puppeteer an opt-in runtime dependency, never a package dependency.

---

### Pitfall 3: AI-Generated Mermaid Syntax Errors Crash the Render Pipeline

**What goes wrong:**
AI models (Claude/Codex/Gemini) generate Mermaid syntax that looks correct but fails to render due to:
- Special characters in node labels: parentheses `()`, brackets `[]`, curly braces `{}`
- Reserved keywords as node names: `end`, `graph`, `subgraph`, `call`
- Non-breaking spaces or zero-width characters (U+200B, U+FEFF) injected by LLMs
- Missing arrows between nodes (`-->`)
- Inconsistent indentation in subgraphs
- Node labels containing colons, semicolons, or pipe characters

When the render fails, the entire `complete-milestone` workflow could break at the diagram step -- no report diagrams, potentially no milestone completion.

**Why it happens:**
Mermaid's parser is strict about syntax but has no partial-render mode. One bad character in one node label crashes the entire diagram. LLMs have inconsistent training on Mermaid syntax rules and frequently produce syntactically invalid output. Microsoft's GenAIScript blog documents this as a known pattern: "syntax matters and LLMs sometimes get it wrong."

**How to avoid:**
1. **Validation before rendering:** Use `merval` (zero-dependency Mermaid validator, pure JS, supports 13 diagram types) to validate syntax before passing to mmdc. Catches errors in milliseconds without Puppeteer.
2. **Quoting rule in templates/rules:** ALL node labels MUST use double quotes: `A["Label with (special) chars"]`. Enforce this in the Mermaid aesthetics rules added to `rules/general.md`.
3. **Sanitization function:** Write a `sanitizeMermaid(code)` utility that:
   - Strips zero-width characters (U+200B, U+FEFF, U+200C, U+200D)
   - Replaces non-breaking spaces with regular spaces
   - Wraps unquoted labels containing special chars in double quotes
   - Escapes semicolons as `#59;` (Mermaid's HTML entity syntax)
4. **Graceful degradation:** If Mermaid render fails, fall back to including the raw Mermaid code block in the report (readable in GitHub, VS Code, Obsidian -- any Markdown viewer that supports Mermaid natively).
5. **Never block milestone completion on diagram rendering failure.** The diagram is supplementary -- the milestone report is essential.

**Warning signs:**
- `mmdc` exits with non-zero code
- SVG output is empty or contains error text
- AI prompt templates do not include explicit Mermaid syntax rules
- Node labels in generated diagrams lack double quotes

**Phase to address:**
Phase 2 (Mermaid template + rules) for syntax rules. Phase 3 (script) for validation + sanitization.

---

### Pitfall 4: complete-milestone Workflow Becomes Fragile After Diagram Integration

**What goes wrong:**
Adding diagram generation to Buoc 4 of `complete-milestone.md` introduces a new failure mode in a critical workflow path. If the diagram step fails (Puppeteer crash, syntax error, timeout, missing dependency), the entire milestone completion blocks. The existing 10-step workflow has been battle-tested through v1.0-v1.3 (4 milestones, 20 phases). Adding a step that depends on external binaries (Chromium) breaks the reliability contract.

**Why it happens:**
The diagram/PDF step requires a headless browser -- fundamentally different from everything else in the workflow (which is pure text/Markdown manipulation). This is a category shift: from deterministic file operations to browser-dependent rendering. The current workflow has ZERO external binary dependencies.

**How to avoid:**
1. **Make the diagram step non-blocking and optional.** If rendering fails, log a warning and continue. MILESTONE_COMPLETE.md must always be generated regardless.
2. **Separate the diagram step from the report step.** Buoc 4 writes MILESTONE_COMPLETE.md (text). A new optional Buoc 4.5 generates MANAGEMENT_REPORT.md with diagrams. A separate Buoc 4.7 runs PDF export. Failure in 4.5 or 4.7 does not prevent Buoc 5-10.
3. **Feature-flag the entire diagram pipeline.** Check: does `scripts/generate-pdf-report.js` exist? Is `puppeteer` available? Only attempt rendering if both are true. No dependency = skip gracefully.
4. **Timeout protection.** Puppeteer can hang indefinitely on malformed input. The script must set a 30-second timeout on the render process. Kill and continue on timeout.
5. **The workflow instruction must say "attempt" not "must."** Use language: "If diagram tools are available, generate Mermaid diagrams. Otherwise, include raw Mermaid code blocks."

**Warning signs:**
- `complete-milestone` workflow gains `DUNG` (STOP/BLOCK) conditions related to diagrams
- The workflow has no fallback path when rendering fails
- Tests for complete-milestone don't cover the "no Puppeteer installed" scenario
- Buoc 4 now requires external binary availability

**Phase to address:**
Phase 4 (Workflow integration) -- must be the LAST integration point, after script and templates are proven stable independently.

---

### Pitfall 5: Existing 448+ Tests Break Due to New Dependencies or Import Side Effects

**What goes wrong:**
Adding new modules (`scripts/generate-pdf-report.js`, Mermaid utilities) can break existing tests if:
- New modules import Puppeteer at module load time (fails when Puppeteer is not installed)
- New test files are picked up by the glob `test/*.test.js` and fail in CI without Puppeteer
- Snapshot tests (48 snapshots via `test/smoke-snapshot.test.js`) detect new/changed files in `commands/`, `workflows/`, `templates/`
- The integrity test (`smoke-integrity.test.js`, 704 lines) validates file structures and may fail if new files don't match expected patterns
- Changes to `complete-milestone.md` (adding Buoc 4.5) alter converter snapshot output for all 5 platforms

**Why it happens:**
The test suite uses `node --test 'test/*.test.js'` which discovers all test files. The snapshot system compares converter output byte-for-byte. The integrity test validates structural consistency of the entire `commands/`, `workflows/`, `templates/` tree. Any of these can trigger unexpectedly from seemingly unrelated file additions.

**How to avoid:**
1. **Isolate PDF-related tests:** If creating `test/smoke-pdf-report.test.js`, add a guard at the top that skips all tests if Puppeteer is not available. Use `node:test`'s skip mechanism.
2. **Never import Puppeteer at module top-level.** Always use lazy `require()` inside the function that needs it.
3. **Update snapshots deliberately.** If `templates/visual-report.md` or `workflows/complete-milestone.md` changes, regenerate snapshots (`node test/generate-snapshots.js`) and verify that ONLY expected snapshots changed. Commit snapshot updates in a separate, clearly labeled commit.
4. **Check converter output for all 5 platforms** after ANY template or workflow file change. The converters inline workflow content -- any word change propagates to Claude, Codex, Gemini, OpenCode, and Copilot outputs.
5. **Run `npm test` early and often.** After each file addition or modification, run the full suite. The 448+ tests are the project's primary safety net.

**Warning signs:**
- `npm test` fails on machines without Puppeteer installed
- Snapshot test count changes unexpectedly (48 becomes 50+)
- `smoke-integrity.test.js` reports unexpected files or missing expected patterns
- CI pipeline requires Puppeteer installation as a new mandatory step

**Phase to address:**
Every phase -- run `npm test` (all 448+ tests) after each change. Especially critical in Phase 3 (script creation) and Phase 4 (workflow integration where complete-milestone.md changes).

---

### Pitfall 6: Headless Chromium Fails in CI/Server/Docker Environments

**What goes wrong:**
Puppeteer's headless Chrome fails to launch in many environments:
- Missing shared libraries (`libnss3.so`, `libatk-bridge-2.0.so`, `libgbm.so`) on minimal Linux images
- No sandbox available in Docker (requires `--no-sandbox --disable-setuid-sandbox` flags)
- CrowdStrike/antivirus blocks Chromium process spawn on corporate machines (documented Issue #958 -- not flagged consistently, intermittent failures)
- ARM-based CI runners (Apple Silicon macOS, AWS Graviton) may lack compatible Chromium binaries
- `chrome-headless-shell` binary not found (documented Issue #842, Jan 2025)

**Why it happens:**
Chromium requires a full set of system libraries and optionally a display server. Minimal Docker images and CI environments strip these to save space. Security software flags headless browser spawning as suspicious behavior. The Puppeteer team frequently changes the default Chrome variant downloaded.

**How to avoid:**
1. **PDF generation must NEVER be a required CI step.** It is a developer/manager convenience, not a test gate.
2. **Provide puppeteerConfigFile support** in the script. Allow users to pass `--no-sandbox`, custom executable paths, etc. via a JSON config.
3. **Document system requirements clearly** in the script's `--help` output: "PDF export requires: Chromium or Chrome installed, or run `npx puppeteer browsers install chrome`."
4. **Test Mermaid SYNTAX in CI (using merval), not rendered output.** Syntax validation is zero-dependency and fast.
5. **Provide a Docker example** only if users specifically request CI-based PDF generation. This is not part of the core workflow.

**Warning signs:**
- "Failed to launch the browser process" errors
- Timeout during `mmdc` or Puppeteer execution
- Tests that pass locally but fail in CI
- Binary download failures during CI `npm install`

**Phase to address:**
Phase 3 (Script implementation) -- build with graceful failure from day one. The script must handle "no browser" as a normal exit path, not an exception.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Add puppeteer to main package.json | Simpler install for PDF users | 300MB+ install bloat, Node 16 breakage, all users affected | Never -- use runtime detection or npx |
| Hardcode Mermaid theme/colors in script | Quick visual result | Cannot adapt to different project branding | MVP only -- make configurable via JSON by Phase 2 |
| Skip Mermaid syntax validation | Fewer files to write | Silent failures, broken diagrams in reports | Never -- merval is zero-dependency, trivial to add |
| Inline diagram generation in complete-milestone workflow | One-step workflow | Tightly coupled, cannot generate diagrams outside milestone completion | Never -- separate script with CLI interface, reusable |
| Skip snapshot regeneration after template changes | Faster development | Snapshot tests fail for next contributor, regression masked | Never -- always regenerate and commit separately |
| Synchronous Puppeteer calls in script | Simpler code | Blocks Node.js event loop, no timeout support | Acceptable ONLY because generate-pdf-report.js is a CLI script, not a library |
| Generate PNG instead of SVG | Simpler embedding | Blurry text in PDF, 5-10x larger file size | Never for diagrams with text -- always SVG |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| mermaid-cli + Node 16 project | Adding as dependency breaks `engines.node` contract | Use `npx` or isolated script with runtime detection; project's package.json unchanged |
| Puppeteer in test suite | Top-level `require('puppeteer')` crashes when not installed | Lazy require inside function body; skip test if `require` throws |
| complete-milestone + diagrams | Making diagrams a blocking prerequisite for milestone completion | Non-blocking optional step (new Buoc 4.5); MILESTONE_COMPLETE.md generated regardless |
| Mermaid code in MANAGEMENT_REPORT.md | Expecting all recipients to have Mermaid-capable viewers | Export to SVG and embed as image in PDF; keep Mermaid source in .md as fallback for devs |
| Template changes + 5 converters | Forgetting that converters inline workflow content | Test all converter outputs after modifying complete-milestone.md or adding visual-report.md |
| Vietnamese text in diagrams | Default Chromium fonts may not render Vietnamese diacritics correctly | Specify `fontFamily` with Vietnamese support (e.g., "Noto Sans", "Roboto") in Mermaid config |
| PDF page layout | Default A4 portrait truncates wide flowcharts | Use landscape orientation for diagrams, or limit diagram width in Mermaid config |
| Script output path | Hardcoding output to `scripts/output/` | Output alongside the source report (e.g., same directory as MANAGEMENT_REPORT.md) |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Launching Puppeteer per diagram | 2-5 second cold start per diagram; 5+ diagrams = 25 sec | Launch browser once, render all diagrams in same instance, then close | >2 diagrams per report |
| Large Mermaid diagrams (50+ nodes) | Render timeout, truncated text, overlapping labels, node labels disappear | Limit diagram complexity in rules (max 15-20 nodes); split into overview + detail diagrams | >30 nodes in a single diagram |
| No timeout on mmdc/Puppeteer | Process hangs forever on malformed input; CI job never completes | Set 30-second timeout, kill process on expiry, continue with fallback | Any malformed Mermaid syntax |
| Re-rendering unchanged diagrams | Script always re-renders even if Mermaid source hasn't changed | Hash Mermaid code blocks, skip render if hash matches cached SVG | Report with 5+ diagrams, run repeatedly |
| Chromium download on every CI run | 170-350MB download adds 30-60 seconds per CI pipeline | Cache Chromium binary in CI, or don't run PDF generation in CI at all | Every CI pipeline execution |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Running Puppeteer with `--no-sandbox` without awareness | Reduced browser isolation; malicious Mermaid input could escape sandbox | Only use in Docker/CI with documented tradeoff; never in interactive use |
| Storing generated PDFs in git | Repository bloat with binary files; git history grows permanently | Add `*.pdf`, `scripts/output/` to `.gitignore` before first PDF is generated |
| User-supplied Mermaid input without sanitization | XSS via Mermaid's HTML entity support (Mermaid official docs warn: "it is hard to guarantee no loop holes") | Sanitize input; only accept Mermaid from trusted sources (AI-generated from project plans) |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Requiring Puppeteer for ALL workflow usage | Users who don't need PDF can't complete milestones | Feature-flag: diagrams generated only when dependencies available; milestone completion never blocked |
| Silent diagram generation failure | User thinks report is complete but diagrams are missing or broken | Clear console output: "Diagram rendered: [path]" or "SKIP: Diagram skipped (puppeteer not installed)" |
| Mermaid diagrams only viewable in specific tools | Manager opens .md file in Notepad, sees raw code | Generate standalone PDF with rendered diagrams; the PDF IS the manager deliverable |
| Vietnamese labels in diagrams garbled | Diacritics appear as boxes or question marks in rendered SVG/PDF | Configure Mermaid + Puppeteer with Vietnamese-compatible fonts; test with real Vietnamese text |
| Overly complex diagrams unintelligible | Manager receives a 50-node spaghetti flowchart | Rules limit to 15-20 nodes per diagram; use hierarchy: 1 overview diagram + N detail diagrams |
| PDF generation requires manual steps | Developer must remember to run separate script after milestone | Integrate as optional step in workflow with clear skip behavior; provide `--skip-pdf` flag |

## "Looks Done But Isn't" Checklist

- [ ] **PDF script:** Often missing error handling for "puppeteer not installed" -- verify script exits gracefully with install instructions, not a stack trace
- [ ] **Mermaid in report:** Often missing double-quote wrapping on labels with special chars -- verify ALL node labels are quoted in template examples
- [ ] **complete-milestone integration:** Often missing fallback path when render fails -- verify milestone completes successfully when Puppeteer is NOT installed
- [ ] **Template visual-report.md:** Often missing from converter test snapshots -- verify all 5 platform converters handle the new template file correctly
- [ ] **Vietnamese font rendering:** Often missing font configuration in Puppeteer/Mermaid -- verify diacritics (e.g., "Luong nghiep vu" vs "Luong nghiep vu") render correctly in PDF output
- [ ] **Mermaid syntax validation:** Often missing pre-render validation -- verify merval or equivalent checks syntax before mmdc rendering
- [ ] **Git ignore:** Often missing PDF and image outputs from .gitignore -- verify binary artifacts are excluded from git tracking
- [ ] **Node 16 compatibility:** Often broken by importing new modules that transitively require Node 18 -- verify `npm test` passes without mermaid-cli or puppeteer installed
- [ ] **Timeout handling:** Often missing for Puppeteer processes -- verify 30-second timeout kills hung processes and script continues
- [ ] **Browser cleanup:** Often missing `browser.close()` in error paths -- verify no orphan Chromium processes after script errors (check with `finally` block)
- [ ] **Landscape PDF for wide diagrams:** Often using default portrait -- verify wide flowcharts are not truncated in PDF output

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Puppeteer added to main dependencies | LOW | Remove from dependencies, move to runtime detection in script, regenerate package-lock.json, verify `npm install` is fast again |
| Existing tests broken by new imports | LOW | Add lazy `require()` pattern, isolate test file with skip guard, re-run full 448+ test suite |
| complete-milestone blocks on diagram failure | MEDIUM | Add try/catch around diagram step in workflow, add explicit fallback path, test both "with Puppeteer" and "without Puppeteer" scenarios |
| Node 16 support broken by transitive dependency | HIGH | Revert the dependency addition, restructure as runtime-detected separate install, update all documentation, test on Node 16 |
| Snapshot tests out of sync after workflow change | LOW | Run `node test/generate-snapshots.js`, diff to confirm only expected changes, commit updated snapshots separately |
| Vietnamese text garbled in PDF | LOW | Add `fontFamily: "Noto Sans"` CSS override in Puppeteer page styles, embed font or reference system font |
| Mermaid syntax errors in generated report | LOW | Add merval validation step in script, auto-fix common issues (quote unquoted labels), re-render |
| CI pipeline broken by Chromium dependency | MEDIUM | Remove Puppeteer from CI requirements, test syntax only in CI, provide Docker config for optional PDF CI |
| Orphan Chromium processes after error | LOW | Add `finally { await browser.close(); }` block in script, add process exit handler |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Node.js version incompatibility (mermaid-cli needs 18+) | Phase 1 (Architecture) | `engines.node` in package.json unchanged at `>=16.7.0`; `npm test` passes without mermaid-cli installed |
| Chromium binary bloat | Phase 1 (Architecture) | `puppeteer` NOT in package.json dependencies; project install size unchanged; `npm install` speed unchanged |
| AI-generated Mermaid syntax errors | Phase 2 (Templates + Rules) | Template includes explicit quoting rules and examples; merval validates before render in script |
| complete-milestone workflow fragility | Phase 4 (Workflow integration) | Milestone completes successfully when Puppeteer is NOT installed; diagram step is explicitly optional |
| Existing 448+ test breakage | Every phase | `npm test` passes all tests after each change; no new mandatory dependencies added |
| Headless Chrome in CI/Docker | Phase 3 (Script) | Script provides clear error message and exits gracefully without Puppeteer; no CI dependency on Chromium |
| Vietnamese font rendering in PDF | Phase 3 (Script) | PDF output displays Vietnamese diacritics correctly with configured fonts |
| Diagram complexity overflow | Phase 2 (Templates + Rules) | Rules limit nodes per diagram to 15-20; template provides split-diagram hierarchy example |
| PDF/image artifacts in git | Phase 1 (Architecture) | `.gitignore` includes `*.pdf`, `*.svg` (generated), `scripts/output/` before first generation |
| Browser process cleanup | Phase 3 (Script) | Script closes browser in `finally` block; no orphan processes after error; verified with error injection test |

## Phase-Specific Risk Summary

### Phase 1: Architecture/Setup (MEDIUM RISK)
Establishes the dependency isolation strategy that all other phases depend on. Getting this wrong (adding puppeteer to package.json) cascades to every user. The primary decision -- runtime detection vs. package dependency -- must be made here and must be "runtime detection."
- **Primary risks:** Pitfall 1 (Node version), Pitfall 2 (binary bloat)
- **Mitigation:** Zero new entries in package.json dependencies. Script uses `try/require` pattern. .gitignore updated.

### Phase 2: Templates + Mermaid Rules (LOW-MEDIUM RISK)
Adds template files and rules. Lower risk because templates are additive (new files, not modified existing). Main risk is that poorly specified Mermaid syntax rules lead to AI generating invalid diagrams in all subsequent milestones.
- **Primary risks:** Pitfall 3 (syntax errors from AI)
- **Mitigation:** Template includes comprehensive quoting rules with positive and negative examples. Rules include a "Mermaid Syntax Checklist" the AI must follow.

### Phase 3: Script Implementation (HIGH RISK)
The most technically risky phase because it touches Puppeteer, Chromium, file I/O, and must work across macOS/Linux/Windows while gracefully handling missing dependencies. This is where most integration issues surface.
- **Primary risks:** Pitfall 5 (test breakage), Pitfall 6 (headless Chrome failures), Vietnamese fonts
- **Mitigation:** Lazy require pattern. Comprehensive error handling. 30-second timeout. `finally` cleanup. Skip-guard in tests.

### Phase 4: Workflow Integration (MEDIUM-HIGH RISK)
Modifies `complete-milestone.md` -- a battle-tested workflow with 10 steps verified across 4 milestones. Any change here affects all 5 platform converters (48 snapshots). The integration must be additive and non-blocking.
- **Primary risks:** Pitfall 4 (workflow fragility), Pitfall 5 (snapshot breakage)
- **Mitigation:** New Buoc 4.5 (optional, non-blocking). Snapshot regeneration in isolated commit. Full converter test pass for all 5 platforms.

## Sources

- [mermaid-cli browser launch failures -- Issue #842](https://github.com/mermaid-js/mermaid-cli/issues/842)
- [mermaid-cli Puppeteer timeout/crash -- Issue #556](https://github.com/mermaid-js/mermaid-cli/issues/556)
- [mermaid-cli CrowdStrike interference -- Issue #958](https://github.com/mermaid-js/mermaid-cli/issues/958)
- [md-to-pdf Docker/CI browser process failures -- Issue #92](https://github.com/simonhaenisch/md-to-pdf/issues/92)
- [Puppeteer system requirements (Node 18+)](https://pptr.dev/guides/system-requirements)
- [Puppeteer troubleshooting](https://pptr.dev/troubleshooting)
- [Puppeteer Chromium binary size discussion -- Issue #3027](https://github.com/puppeteer/puppeteer/issues/3027)
- [Mermaid special characters break parsing -- Issue #54](https://github.com/mermaid-js/mermaid/issues/54)
- [Mermaid character escaping -- Issue #170](https://github.com/mermaid-js/mermaid/issues/170)
- [Mermaid text truncation -- Issue #6379](https://github.com/mermaid-js/mermaid/issues/6379)
- [Mermaid node labels disappear when too wide -- Issue #5785](https://github.com/mermaid-js/mermaid/issues/5785)
- [Mermaid subgraph title overlap -- Issue #3806](https://github.com/mermaid-js/mermaid/issues/3806)
- [Mermaid reserved keywords cause syntax error -- Issue #4645](https://github.com/mermaid-js/mermaid/issues/4645)
- [Merval -- zero-dependency Mermaid validator](https://github.com/aj-archipelago/merval)
- [GenAIScript: fixing AI-generated Mermaid errors](https://microsoft.github.io/genaiscript/blog/mermaids/)
- [Preventing Arrow Errors in Mermaid Syntax](https://robiriu.github.io/blog/2026-01-23-preventing-arrow-errors-in-diagrams-with-mermaid-s/)
- [mermaid-cli npm -- Node ^18.19 or >=20.0 requirement](https://www.npmjs.com/package/@mermaid-js/mermaid-cli)
- [md-to-pdf GitHub -- engines node >=12, puppeteer >=8.0.0](https://github.com/simonhaenisch/md-to-pdf)
- [Server-side Mermaid rendering without browser -- Issue #3650](https://github.com/mermaid-js/mermaid/issues/3650)
- Direct codebase analysis: `package.json` (zero production dependencies, engines node >=16.7.0)
- Direct codebase analysis: `workflows/complete-milestone.md` (10-step workflow, Buoc 4 is report generation)
- Direct codebase analysis: `test/` (448+ tests across 8 test files, 48 converter snapshots)

---
*Pitfalls research for: Mermaid + PDF integration into Please-Done v1.4*
*Researched: 2026-03-24*
