# Architecture: Visual Business Logic Report Integration

**Domain:** Mermaid diagram generation + PDF export integrated into AI coding skill framework
**Researched:** 2026-03-24
**Confidence:** HIGH (existing codebase fully analyzed, all 10 workflows and 11 templates read, npm ecosystem verified)

## System Overview -- Current State (v1.3) with v1.4 Integration Points

```
CURRENT complete-milestone FLOW:
=================================

/pd:complete-milestone
   |
   v
workflows/complete-milestone.md
   |
   +-- Buoc 1: Read CURRENT_MILESTONE.md -> version
   +-- Buoc 2: Check all phase-*/TASKS.md, TEST_REPORT.md, CODE_REPORT_TASK_*.md
   +-- Buoc 3: Check bugs
   +-- Buoc 3.5: Goal-backward verification (4-level) + cross-phase links
   +-- Buoc 4: Compile CODE_REPORTs -> MILESTONE_COMPLETE.md  <--- INSERT HERE
   +-- Buoc 5: CHANGELOG.md
   +-- Buoc 6-6.5: Update ROADMAP, REQUIREMENTS, STATE, PROJECT
   +-- Buoc 7-8: Update CURRENT_MILESTONE, VERSION
   +-- Buoc 9: Git commit + tag
   +-- Buoc 10: Notify


v1.4 NEW FLOW (additions marked with >>>):
=============================================

   +-- Buoc 4: Compile CODE_REPORTs -> MILESTONE_COMPLETE.md
   +-- >>> Buoc 4.5: Generate MANAGEMENT_REPORT.md with Mermaid diagrams
   +-- >>> Buoc 4.6: (Optional) Export PDF via generate-report-pdf.js
   +-- Buoc 5: CHANGELOG.md (unchanged)
   ...
```

## Component Inventory: New vs Modified

### NEW Components (6 files)

| # | Component | Location | Type | Purpose |
|---|-----------|----------|------|---------|
| N1 | Management report template | `templates/management-report.md` | Template | Format definition for MANAGEMENT_REPORT.md with Mermaid diagram scaffolds |
| N2 | Mermaid aesthetics rules | `references/mermaid-rules.md` | Reference | Style rules for Mermaid diagrams (colors, labels, layout direction) |
| N3 | PDF export script | `scripts/generate-report-pdf.js` | Script | Node.js script to render Markdown+Mermaid to PDF |
| N4 | Mermaid validator | `bin/lib/mermaid-validator.js` | Library | Pure-function Mermaid syntax validator (no Puppeteer) |
| N5 | Report generator helper | `bin/lib/report-generator.js` | Library | Pure functions to extract data from CODE_REPORTs and structure into report sections |
| N6 | Mermaid validator tests | `test/smoke-mermaid-validator.test.js` | Test | Unit tests for validator |

### MODIFIED Components (5 files)

| # | Component | Location | Change |
|---|-----------|----------|--------|
| M1 | complete-milestone workflow | `workflows/complete-milestone.md` | Add Buoc 4.5 (diagrams) + Buoc 4.6 (PDF) |
| M2 | complete-milestone command | `commands/pd/complete-milestone.md` | Reference new template + Mermaid rules |
| M3 | conventions reference | `references/conventions.md` | Add Mermaid section (if rules are small enough) OR reference new mermaid-rules.md |
| M4 | Converter snapshots | `test/snapshots/*.txt` | Regenerate after command/workflow changes |
| M5 | package.json | `package.json` | Add optionalDependencies for PDF export |

### NOT MODIFIED (explicitly scoped out)

| Component | Why not |
|-----------|---------|
| `plan-checker.js` | No new checks needed -- report is output, not a plan quality gate |
| `workflows/plan.md` | Report is generated at complete-milestone, not planning time |
| `workflows/write-code.md` | No code-writing changes needed |
| `templates/plan.md` | Truths table unchanged from v1.3 |
| `bin/lib/utils.js` | Existing helpers sufficient |
| Platform converters | New template/reference auto-propagates via existing converter pipeline |

## Recommended Architecture

### Principle: Two-Layer Strategy

The architecture separates **diagram text generation** (AI-driven, zero dependencies) from **PDF rendering** (optional, heavy dependencies).

```
Layer 1: AI-Generated Markdown+Mermaid (ZERO dependencies)
===========================================================
AI reads CODE_REPORTs + PLAN.md + TASKS.md
   |
   v
templates/management-report.md (format definition)
   + references/mermaid-rules.md (style rules)
   |
   v
.planning/milestones/[version]/MANAGEMENT_REPORT.md
   (Markdown with embedded ```mermaid code blocks)
   |
   +-- Viewable on GitHub (native Mermaid rendering)
   +-- Viewable in VS Code (Mermaid extensions)
   +-- Viewable in any Markdown viewer with Mermaid support


Layer 2: Optional PDF Export (requires Node >= 18, Puppeteer)
==============================================================
node scripts/generate-report-pdf.js [path/to/MANAGEMENT_REPORT.md]
   |
   v
md-mermaid-to-pdf (npm package)
   |
   +-- Puppeteer (headless Chromium)
   +-- mermaid.js (client-side rendering in Chromium)
   |
   v
.planning/milestones/[version]/MANAGEMENT_REPORT.pdf
```

**Rationale:** This two-layer approach is critical because:
1. The project's minimum Node.js version is 16.7, but Puppeteer/mermaid-cli require Node >= 18.19
2. Mermaid text in Markdown is already renderable on GitHub, VS Code, and most modern viewers
3. PDF export is a "nice to have" for managers who need offline documents
4. The AI generates diagrams as text (its core competency) -- rendering is delegated

### Component Boundaries

| Component | Responsibility | Input | Output | Communicates With |
|-----------|---------------|-------|--------|-------------------|
| `templates/management-report.md` | Define report structure with Mermaid scaffolds | N/A (template) | Format spec | `workflows/complete-milestone.md` reads it |
| `references/mermaid-rules.md` | Mermaid styling conventions (colors, shapes, labels) | N/A (reference) | Style rules | AI follows when generating diagrams |
| `workflows/complete-milestone.md` (Buoc 4.5-4.6) | Orchestrate diagram generation + optional PDF | CODE_REPORTs, PLAN.md, TASKS.md | MANAGEMENT_REPORT.md + optional PDF | Reads template, reads mermaid-rules, calls PDF script |
| `scripts/generate-report-pdf.js` | Render Markdown+Mermaid to PDF | MANAGEMENT_REPORT.md file path | MANAGEMENT_REPORT.pdf | Uses md-mermaid-to-pdf or mermaid-cli + md-to-pdf |
| `bin/lib/mermaid-validator.js` | Validate Mermaid syntax (pure function) | Mermaid text string | { valid, errors[] } | Called by report-generator or directly |
| `bin/lib/report-generator.js` | Extract/structure report data from CODE_REPORTs | Array of CODE_REPORT contents | Structured data object | Called by workflow logic (AI) |

### Data Flow

```
CODE_REPORT_TASK_1.md  --+
CODE_REPORT_TASK_2.md  --+---> AI reads all reports
CODE_REPORT_TASK_N.md  --+          |
                                    v
PLAN.md (Truths table)  ---------> AI analyzes business logic
TASKS.md (task deps)    ---------> AI traces dependencies
                                    |
                                    v
                          templates/management-report.md
                          references/mermaid-rules.md
                                    |
                                    v
                     MANAGEMENT_REPORT.md
                     (Business Logic Flowchart + Architecture Diagram)
                                    |
                          [Optional: Node >= 18]
                                    |
                                    v
                     scripts/generate-report-pdf.js
                                    |
                                    v
                     MANAGEMENT_REPORT.pdf
```

## Detailed Design: New Components

### N1: templates/management-report.md

Template defining the report format. Follows the same pattern as `templates/plan.md` and `templates/verification-report.md`.

```markdown
# Mau MANAGEMENT_REPORT.md

> `/pd:complete-milestone` tao (Buoc 4.5) | Manager doc

Bao cao tong ket milestone danh cho quan ly.
Tap trung vao gia tri kinh doanh va kien truc, KHONG chi tiet ky thuat.

## Mau

(template content with placeholder sections:)
- Executive Summary
- Business Logic Flowchart (```mermaid flowchart TD ...)
- Architecture Diagram (```mermaid graph LR ...)
- Key Metrics table
- Risk/Debt section
```

**Key design decisions:**
- Template provides **scaffold Mermaid blocks** with comments showing the AI what to generate, not hardcoded diagrams
- Two mandatory diagrams: Business Logic Flowchart (user journey), Architecture Diagram (module/service connections)
- Optional diagrams: Sequence Diagram (for API-heavy milestones), State Diagram (for state machine changes)
- Template language follows existing Vietnamese convention with `@references/mermaid-rules.md` reference

### N2: references/mermaid-rules.md

Style reference for Mermaid diagrams. Follows the pattern of `references/ui-brand.md`.

```markdown
Structure:
- Direction rules: flowchart TD for logic, graph LR for architecture
- Node shape rules: rectangles for processes, diamonds for decisions, cylinders for DB
- Color palette: 3-4 named styles (classDef) for consistency
- Label rules: Vietnamese labels for manager-facing, max 20 chars per node
- Subgraph rules: group by domain/module
- Anti-patterns: no more than 15 nodes per diagram, no crossing edges
```

**Rationale for separate file (not inline in conventions.md):**
- conventions.md is already 99 lines and referenced by ALL workflows
- Mermaid rules are only relevant to complete-milestone
- Separate file = conditional loading (only read when generating report)

### N3: scripts/generate-report-pdf.js

Pure Node.js script following the pattern of `scripts/count-tokens.js`.

```javascript
// Architecture:
// 1. Read MANAGEMENT_REPORT.md from argv[1]
// 2. Check Node.js version >= 18 (warn + exit gracefully if not)
// 3. Try require('md-mermaid-to-pdf') or dynamic import
// 4. Convert Markdown+Mermaid to PDF
// 5. Write PDF to same directory as input file
// 6. Print success message with file path

// Key constraints:
// - MUST handle missing dependency gracefully (not crash)
// - MUST check Node version before attempting import
// - Output path: same directory, same name, .pdf extension
// - Uses process.exit(0) on success, process.exit(1) on error
```

**Node version handling strategy:**
```javascript
const [major] = process.versions.node.split('.').map(Number);
if (major < 18) {
  console.log('PDF export yeu cau Node.js >= 18.');
  console.log('MANAGEMENT_REPORT.md da duoc tao thanh cong.');
  console.log('Mo file Markdown de xem so do Mermaid (GitHub/VS Code ho tro render).');
  process.exit(0); // Graceful, not error
}
```

**Dependency strategy:**
- `md-mermaid-to-pdf` as optionalDependency in package.json (not required for install)
- Script checks for dependency at runtime, provides install instructions if missing
- This preserves the "no build step" constraint while enabling PDF for users who want it

### N4: bin/lib/mermaid-validator.js

Pure-function library (same pattern as plan-checker.js: no file I/O, content passed as args).

```javascript
// Core function:
// validateMermaid(mermaidText) -> { valid: boolean, errors: string[] }
//
// Validates:
// - Has valid diagram type declaration (flowchart/graph/sequenceDiagram/stateDiagram)
// - Balanced brackets/parentheses
// - No empty node labels
// - Direction is valid (TD/TB/BT/LR/RL)
// - Node IDs don't contain spaces
//
// Does NOT render -- just syntax validation (like merval approach)
// Zero dependencies -- pure regex/string parsing
```

**Rationale:** Validation without rendering avoids the Puppeteer/Node-18 dependency. The AI can validate its own output before writing the file.

### N5: bin/lib/report-generator.js

Pure-function helpers for extracting report data.

```javascript
// extractFeatures(codeReportContents[]) -> Feature[]
// extractMetrics(codeReportContents[], tasksContent) -> Metrics
// generateFlowchartSkeleton(features, truthsTable) -> string (Mermaid text)
// generateArchitectureSkeleton(features) -> string (Mermaid text)
//
// These provide DATA to the AI, not final diagrams.
// The AI uses these skeletons as starting points and enriches them.
```

**Important:** These helpers are optional acceleration for the AI. The AI CAN generate diagrams purely from reading CODE_REPORTs + PLAN.md. The helpers reduce token cost by pre-structuring data.

## Detailed Design: Modified Components

### M1: workflows/complete-milestone.md -- Buoc 4.5 + 4.6

Insert after existing Buoc 4, before Buoc 5:

```markdown
## Buoc 4.5: Bao cao quan ly voi so do Mermaid

Doc tat ca `phase-*/PLAN.md` (Truths table) + `phase-*/reports/CODE_REPORT_TASK_*.md`.
Phan tich:
1. Luong nghiep vu chinh (user actions -> system responses -> outcomes)
2. Kien truc he thong (modules, services, databases, APIs)

Viet `.planning/milestones/[version]/MANAGEMENT_REPORT.md`:
- Theo mau @templates/management-report.md
- Tuan thu @references/mermaid-rules.md
- IT NHAT 2 so do Mermaid: Business Logic Flowchart + Architecture Diagram
- Ngon ngu: Tieng Viet huong san pham (nhu MILESTONE_COMPLETE.md)

## Buoc 4.6: Xuat PDF (tuy chon)

Kiem tra:
1. `node -v` >= 18? -> tiep tuc | < 18 -> bo qua, thong bao user
2. `scripts/generate-report-pdf.js` ton tai?
3. Chay: `node scripts/generate-report-pdf.js .planning/milestones/[version]/MANAGEMENT_REPORT.md`
4. Thanh cong -> thong bao duong dan PDF
5. That bai -> canh bao, KHONG chan workflow (PDF la optional)
```

**Integration pattern:** Same as how Buoc 3.5 was added in v1.2 -- insert between existing steps, non-blocking.

### M2: commands/pd/complete-milestone.md

Add to `<required_reading>` or `<conditional_reading>`:

```markdown
<conditional_reading>
- @templates/management-report.md -> format bao cao quan ly -- KHI tao MANAGEMENT_REPORT.md
- @references/mermaid-rules.md -> quy tac ve so do Mermaid -- KHI tao so do
</conditional_reading>
```

This follows the established conditional loading pattern from v1.0 Phase 4.

### M5: package.json

```json
{
  "optionalDependencies": {
    "md-mermaid-to-pdf": "^1.0.0"
  },
  "scripts": {
    "report:pdf": "node scripts/generate-report-pdf.js"
  }
}
```

**Why optionalDependencies (not dependencies or devDependencies):**
- `npm install` succeeds even if md-mermaid-to-pdf fails to install
- Users on Node 16 are not blocked
- Users who want PDF can `npm install md-mermaid-to-pdf` manually
- Preserves existing install experience

## Patterns to Follow

### Pattern 1: Template-Driven Output

**What:** All structured output is defined by a template file in `templates/`.
**Why:** This is the established pattern. The AI reads the template to know what format to produce.
**Example from existing code:** `templates/plan.md` defines PLAN.md format, `workflows/plan.md` references it as `@templates/plan.md`.

Apply to: `templates/management-report.md` defines MANAGEMENT_REPORT.md format.

### Pattern 2: Conditional Reading

**What:** Optional references loaded only when needed, declared in `<conditional_reading>`.
**Why:** Token optimization (v1.0 Phase 4). Mermaid rules are only needed during report generation.
**Example from existing code:**
```markdown
<conditional_reading>
- @references/ui-brand.md -> viet bao cao huong san pham -- KHI milestone co UI deliverables
</conditional_reading>
```

Apply to: Mermaid rules reference.

### Pattern 3: Pure Functions for Library Code

**What:** Library code in `bin/lib/` takes content as args, returns results, no file I/O.
**Why:** Testable, composable, side-effect free. Established by plan-checker.js.
**Example:** `runAllChecks({ planContent, tasksContent, requirementIds })` in plan-checker.js.

Apply to: `mermaid-validator.js` and `report-generator.js`.

### Pattern 4: CLI Wrapper for Scripts

**What:** Separate file I/O from logic. Script reads files, calls library, writes output.
**Why:** Same separation as `bin/plan-check.js` wrapping `bin/lib/plan-checker.js`.

Apply to: `scripts/generate-report-pdf.js` handles file I/O, calls rendering library.

### Pattern 5: Graceful Degradation

**What:** Optional features fail gracefully with informative messages, never block the workflow.
**Why:** The project supports Node 16.7+. PDF export requires Node 18+. Must not break existing users.

Apply to: PDF export step. Missing dependency or wrong Node version -> inform user, continue workflow.

### Pattern 6: Non-Blocking Workflow Steps

**What:** New workflow steps that can fail without blocking milestone completion.
**Why:** Buoc 3.5 (goal-backward verification) already follows this pattern -- issues are WARNINGS, not BLOCKS.

Apply to: Buoc 4.5 (report generation) and 4.6 (PDF export) are both non-blocking.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Hardcoded Diagram Content in Templates

**What:** Putting actual Mermaid diagrams in the template file.
**Why bad:** Every milestone has different features. Hardcoded diagrams would be wrong for any real project.
**Instead:** Template provides scaffold/instructions with comments. AI generates actual diagram content based on CODE_REPORTs.

### Anti-Pattern 2: Requiring Puppeteer/Chromium for Core Flow

**What:** Making PDF export a required step in complete-milestone.
**Why bad:** Breaks Node 16.7 compatibility. Adds 200+ MB Chromium download. Fails in CI without Chrome.
**Instead:** Mermaid-in-Markdown is the primary output. PDF is optional Layer 2.

### Anti-Pattern 3: AI Rendering Diagrams to Images

**What:** Having the AI call mermaid-cli or generate SVG files directly.
**Why bad:** AI cannot execute commands reliably across platforms. The converter pipeline would need to handle binary files.
**Instead:** AI writes Mermaid text in Markdown. A separate script handles rendering.

### Anti-Pattern 4: Modifying plan-checker for Report Validation

**What:** Adding CHECK-06 to validate MANAGEMENT_REPORT.md.
**Why bad:** Plan checker runs BEFORE coding (at plan time). Report is generated AFTER coding (at complete-milestone time). Wrong lifecycle stage.
**Instead:** Mermaid validator is a standalone library, called inline during Buoc 4.5.

### Anti-Pattern 5: Creating a New Workflow File

**What:** Adding `workflows/generate-report.md` as a separate workflow.
**Why bad:** Report generation is part of the complete-milestone lifecycle, not a standalone action. Adding a workflow would require a new command, new converter entries, etc.
**Instead:** Extend existing complete-milestone workflow with new steps.

## Integration Impact Analysis

### Converter Pipeline Propagation

When `workflows/complete-milestone.md` and `commands/pd/complete-milestone.md` are modified:
1. The converter pipeline (`bin/lib/converters/`) auto-inlines workflow content into commands
2. All 5 platform outputs (Claude, Codex, Gemini, OpenCode, Copilot) are updated automatically
3. 48 converter snapshots need regeneration (verified via `test/smoke-snapshot.test.js`)

**No converter code changes needed** -- the existing pipeline handles this automatically.

### Template/Reference Auto-Discovery

New files in `templates/` and `references/` directories:
- Are automatically included in `package.json` `"files"` array (directory-level inclusion)
- Are automatically counted by `scripts/count-tokens.js`
- Are automatically part of the install manifest (`bin/lib/manifest.js`)

**No manifest/install code changes needed.**

### Test Impact

| Test File | Impact | Action |
|-----------|--------|--------|
| `smoke-snapshot.test.js` | Snapshots change due to workflow modification | Regenerate via `node test/generate-snapshots.js` |
| `smoke-integrity.test.js` | May check file counts or directory structure | Verify no hardcoded counts |
| `smoke-plan-checker.test.js` | No impact -- plan checker unchanged | None |
| New: `smoke-mermaid-validator.test.js` | New test file | Write tests for mermaid-validator.js |
| New: `smoke-report-generator.test.js` | New test file | Write tests for report-generator.js |

## Scalability Considerations

| Concern | Current (1 milestone) | At 10 milestones | At 50 milestones |
|---------|----------------------|-------------------|-------------------|
| Report generation time | < 1 min (AI generates text) | Same -- each milestone independent | Same |
| PDF export time | 5-10 sec per report | 5-10 sec per report | 5-10 sec per report |
| Disk space (Markdown) | ~5-10 KB per report | ~50-100 KB total | ~250-500 KB total |
| Disk space (PDF) | ~200-500 KB per report | ~2-5 MB total | ~10-25 MB total |
| Chromium download | ~200 MB (one-time) | Same | Same |

No scalability concerns. Reports are per-milestone and independent.

## Build Order (Dependency-Driven)

```
Phase 1: Foundation (no dependencies on other new components)
  1.1 references/mermaid-rules.md  -- standalone reference
  1.2 templates/management-report.md  -- standalone template (references mermaid-rules)
  1.3 bin/lib/mermaid-validator.js + tests  -- standalone library

Phase 2: Workflow Integration (depends on Phase 1 templates/references)
  2.1 workflows/complete-milestone.md Buoc 4.5  -- references template + mermaid-rules
  2.2 commands/pd/complete-milestone.md update  -- conditional_reading for new refs
  2.3 Regenerate 48 converter snapshots

Phase 3: PDF Export (depends on Phase 1 + Phase 2 for testing)
  3.1 scripts/generate-report-pdf.js  -- standalone script
  3.2 package.json optionalDependencies update
  3.3 workflows/complete-milestone.md Buoc 4.6 (add after 4.5)

Phase 4: Optional Helpers (independent, can defer)
  4.1 bin/lib/report-generator.js + tests  -- data extraction helpers
```

**Ordering rationale:**
- Phase 1 has zero dependencies -- all components are standalone
- Phase 2 requires Phase 1 templates/references to exist (workflow references them)
- Phase 3 requires Phase 2 so the PDF script can be tested end-to-end with a real MANAGEMENT_REPORT.md
- Phase 4 is optional acceleration -- AI can generate reports without helpers

## Node.js Version Compatibility Strategy

```
Node 16.7+ (project minimum):
  [x] Mermaid text in Markdown (no dependencies)
  [x] Mermaid syntax validation (pure string parsing)
  [x] MANAGEMENT_REPORT.md generation
  [ ] PDF export (gracefully unavailable)

Node 18.19+ (optional upgrade):
  [x] All of the above
  [x] PDF export via md-mermaid-to-pdf
  [x] mermaid-cli for standalone SVG/PNG generation
```

The strategy preserves backward compatibility while enabling PDF for users on modern Node.

## File System Layout After v1.4

```
please-done/
  bin/
    lib/
      mermaid-validator.js    [NEW]
      report-generator.js     [NEW - optional]
      plan-checker.js         (unchanged)
      utils.js                (unchanged)
    plan-check.js             (unchanged)
    install.js                (unchanged)
  scripts/
    generate-report-pdf.js    [NEW]
    count-tokens.js           (unchanged)
  templates/
    management-report.md      [NEW]
    plan.md                   (unchanged)
    tasks.md                  (unchanged)
    ...                       (unchanged)
  references/
    mermaid-rules.md          [NEW]
    conventions.md            (unchanged)
    plan-checker.md           (unchanged)
    ...                       (unchanged)
  workflows/
    complete-milestone.md     [MODIFIED - Buoc 4.5 + 4.6]
    plan.md                   (unchanged)
    ...                       (unchanged)
  commands/pd/
    complete-milestone.md     [MODIFIED - conditional_reading]
    ...                       (unchanged)
  test/
    smoke-mermaid-validator.test.js  [NEW]
    smoke-report-generator.test.js   [NEW - if Phase 4 built]
    snapshots/                       [REGENERATED]
  .planning/milestones/[version]/
    MANAGEMENT_REPORT.md      [NEW - generated per milestone]
    MANAGEMENT_REPORT.pdf     [NEW - optional, generated per milestone]
    MILESTONE_COMPLETE.md     (unchanged)
```

## Sources

- [mermaid-js/mermaid-cli GitHub](https://github.com/mermaid-js/mermaid-cli) -- CLI tool, Node API, Node >= 18.19 requirement
- [@mermaid-js/mermaid-cli npm](https://www.npmjs.com/package/@mermaid-js/mermaid-cli) -- Package details, version info
- [md-mermaid-to-pdf npm](https://www.npmjs.com/package/md-mermaid-to-pdf) -- Markdown+Mermaid to PDF conversion
- [merval - zero-dependency validator](https://github.com/aj-archipelago/merval) -- Validation without Puppeteer pattern
- [Mermaid Flowchart Syntax](https://mermaid.ai/open-source/syntax/flowchart.html) -- Official syntax reference
- [Puppeteer System Requirements](https://pptr.dev/guides/system-requirements) -- Node >= 18 requirement
- [mermaid.ink](https://mermaid.ink/) -- Online rendering API (alternative for PDF)
- [Mermaid.js Official](https://mermaid.js.org/) -- Core library documentation
- Codebase analysis: all files in workflows/, templates/, bin/lib/, references/, commands/pd/, test/
