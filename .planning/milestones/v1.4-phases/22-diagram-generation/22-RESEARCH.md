# Phase 22: Diagram Generation - Research

**Researched:** 2026-03-24
**Domain:** Mermaid diagram generation from PLAN.md Truths + codebase maps
**Confidence:** HIGH

## Summary

Phase 22 builds a pure JS module `bin/lib/generate-diagrams.js` that generates two Mermaid diagrams: a Business Logic Flowchart (from Truths tables in PLAN.md files) and an Architecture Diagram (from `.planning/codebase/` maps and PLAN.md artifacts). The module follows the exact same pattern as `bin/lib/mermaid-validator.js` and `bin/lib/plan-checker.js` -- pure functions, no file I/O, content passed as args, validated output.

All foundation pieces exist from Phase 21: `mermaid-rules.md` (color palette, shapes, label conventions, max 15 nodes), `mermaid-validator.js` (validate() API), and `management-report.md` (Section 3 + 4 placeholders). The generator fills those placeholders. The Truths table parser `parseTruthsV11()` from plan-checker.js already extracts `{ id, description }` from both 3-col and 5-col formats -- this is the data source for Business Logic nodes.

**Primary recommendation:** Build two pure functions `generateBusinessLogicDiagram(planContents, options)` and `generateArchitectureDiagram(codebaseMaps, planMeta, options)` that return Mermaid text strings. Validate output with `mermaidValidator()` internally. Retry logic (max 2) handles validation failures by stripping problematic characters.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Business Logic Flowchart dung Truths table (main flow) ket hop tasks (bo sung chi tiet khi can)
- **D-02:** Architecture Diagram dung .planning/codebase/ maps (ARCHITECTURE.md, STRUCTURE.md, INTEGRATIONS.md) ket hop PLAN artifacts (files_modified, dependencies)
- **D-03:** Hybrid approach: Script JS scaffold tao cau truc co ban (nodes, subgraphs), AI bo sung connections va tinh chinh
- **D-04:** Module JS rieng `bin/lib/generate-diagrams.js` -- export generateBusinessLogicDiagram() va generateArchitectureDiagram(). Tuong tu pattern mermaid-validator.js
- **D-05:** Luon validate output bang mermaid-validator.js sau khi generate. Neu loi syntax -- thu lai max 2 lan
- **D-06:** 1 Truth = 1 node. Truth Description lam label. VD: T01["Xu ly don hang"]
- **D-07:** Arrows theo thu tu plan: Plan 1 -> Plan 2 -> Plan 3. Dung depends_on de xac dinh flow direction
- **D-08:** Milestone lon (>15 Truths): tach thanh subgraphs theo wave/plan. Moi subgraph giu duoi 15 nodes
- **D-09:** Layered layout (flowchart LR) voi subgraphs theo layers: CLI -> Lib -> Converters -> Platforms
- **D-10:** Milestone-scoped: chi hien thi modules/files bi thay doi trong milestone do. Khong ve toan bo project
- **D-11:** Shapes theo mermaid-rules.md Shape-by-Role: Service=rectangle, DB=cylinder, API=rounded, External=subroutine

### Claude's Discretion
- Chi tiet implementation cua scaffold function (regex parsing vs structured parsing)
- Edge labels cu the cho arrows giua nodes
- Subgraph naming convention
- Cach detect module role (service vs db vs api) tu codebase maps
- Start/End node placement trong flowchart

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DIAG-01 | AI tu dong ve Business Logic Flowchart tu Truths/PLAN.md cua milestone | generateBusinessLogicDiagram() parses Truths via parseTruthsV11() pattern, creates flowchart TD with 1 node per Truth, arrows from depends_on, subgraphs when >15 nodes |
| DIAG-02 | AI tu dong ve Architecture Diagram minh hoa Module/Service/DB/APIs cua du an | generateArchitectureDiagram() reads codebase maps + files_modified from PLAN.md frontmatter, creates flowchart LR with layered subgraphs, shapes by role |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

No CLAUDE.md file found in project root. Constraints derived from PROJECT.md and established patterns:

- **No Build Step:** Pure Node.js scripts, no bundler
- **Node.js 16.7+ minimum:** All code must work on this version
- **Backward Compatibility:** Existing function signatures must not break
- **Pure Functions:** Library code has no file I/O -- content passed as args
- **Zero Production Dependencies:** No npm packages in production code
- **Module Pattern:** `'use strict'`, `require()` imports, `module.exports = { ... }`
- **Test Pattern:** `smoke-*.test.js` using `node:test` + `node:assert/strict`
- **Vietnamese Labels:** All node labels in diagrams must be Vietnamese (per mermaid-rules.md)

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-ins | 16.7+ | String manipulation, regex parsing | Zero deps requirement |
| mermaid-validator.js | local | Validate generated Mermaid output | Phase 21 output, mandatory per D-05 |
| parseFrontmatter (utils.js) | local | Parse PLAN.md frontmatter for depends_on, files_modified | Existing utility, proven stable |
| parseTruthsV11 (plan-checker.js) | local | Extract Truths {id, description} from plan body | Existing parser, handles 3-col and 5-col |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| extractXmlSection (utils.js) | local | Extract XML sections from plan content | Parsing <objective>, <tasks> if needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom Truths parser | parseTruthsV11 from plan-checker.js | Reuse existing proven parser -- no reason to hand-roll |
| External Mermaid renderer | mermaid-validator.js only | Rendering is Phase 23 (PDF) concern; Phase 22 only generates text |

**Installation:**
```bash
# No installation needed -- all dependencies are local project files
```

## Architecture Patterns

### Recommended Project Structure
```
bin/lib/
  generate-diagrams.js     # NEW: Pure function module (D-04)
test/
  smoke-generate-diagrams.test.js  # NEW: Tests for diagram generation
```

### Pattern 1: Pure Function Module (from mermaid-validator.js)
**What:** Module exports pure functions that take content strings, return structured results. No file I/O.
**When to use:** Always for library code in this project.
**Example:**
```javascript
// Source: bin/lib/mermaid-validator.js (existing pattern)
'use strict';

const { mermaidValidator } = require('./mermaid-validator');

/**
 * Generate Business Logic Flowchart tu PLAN.md contents cua 1 milestone.
 * @param {Array<{planNumber: number, content: string}>} planContents - Sorted PLAN.md contents
 * @param {object} [options] - { maxRetries: 2 }
 * @returns {{ diagram: string, valid: boolean, errors: Array, warnings: Array }}
 */
function generateBusinessLogicDiagram(planContents, options = {}) {
  // 1. Parse Truths from each plan
  // 2. Parse depends_on from frontmatter
  // 3. Build Mermaid flowchart TD
  // 4. Validate with mermaidValidator()
  // 5. If errors, retry with sanitization (max 2)
  // 6. Return { diagram, valid, errors, warnings }
}

module.exports = { generateBusinessLogicDiagram, generateArchitectureDiagram };
```

### Pattern 2: Truths Parsing for Flowchart Nodes (D-06)
**What:** Each Truth becomes a Mermaid node. Truth ID = node ID, Truth Description = label.
**When to use:** Building Business Logic Flowchart.
**Example:**
```javascript
// Input: parseTruthsV11(planContent) returns [{ id: 'T1', description: 'Xu ly don hang' }, ...]
// Output Mermaid:
// T1["Xu ly don hang"]
// T2["Thanh toan"]
// T1 --> T2

// Node ID format: Truth ID (T1, T2, etc.)
// Label format: Vietnamese description from Truths table, in double quotes
// Arrow: depends_on determines direction; sequential plan order as fallback
```

### Pattern 3: Architecture Layered Layout (D-09)
**What:** Architecture diagram uses flowchart LR with subgraphs for layers.
**When to use:** Building Architecture Diagram.
**Example:**
```javascript
// Source: mermaid-rules.md Shape-by-Role table
// Output Mermaid:
// flowchart LR
//   subgraph CLI["CLI Layer"]
//     install["install.js"]
//   end
//   subgraph Lib["Library Layer"]
//     utils["utils.js"]
//     validator["mermaid-validator.js"]
//   end
//   CLI --> Lib
```

### Pattern 4: Validate-and-Retry Loop (D-05)
**What:** After generating Mermaid text, validate with mermaidValidator(). If syntax errors, sanitize and retry up to 2 times.
**When to use:** Every diagram generation call.
**Example:**
```javascript
function validateAndRetry(mermaidText, maxRetries = 2) {
  let text = mermaidText;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = mermaidValidator(text);
    if (result.valid) {
      return { diagram: text, valid: true, errors: [], warnings: result.warnings };
    }
    if (attempt < maxRetries) {
      text = sanitizeMermaidText(text, result.errors);
    }
  }
  // Return last attempt even if invalid
  const lastResult = mermaidValidator(text);
  return { diagram: text, valid: false, errors: lastResult.errors, warnings: lastResult.warnings };
}
```

### Pattern 5: Subgraph Splitting for Large Milestones (D-08)
**What:** When a milestone has >15 Truths, split into subgraphs by plan/wave. Each subgraph holds <=15 nodes.
**When to use:** When total Truth count exceeds 15.
**Example:**
```javascript
// If milestone has 20 Truths across 3 plans:
// flowchart TD
//   subgraph Plan01["Ke hoach 01"]
//     T1["..."] --> T2["..."]
//   end
//   subgraph Plan02["Ke hoach 02"]
//     T3["..."] --> T4["..."]
//   end
//   Plan01 --> Plan02
```

### Anti-Patterns to Avoid
- **Building a Mermaid parser:** Don't parse Mermaid syntax. Only generate it. Validation is mermaid-validator's job.
- **Reading files in library code:** Don't use fs.readFileSync(). Content is passed as arguments by the caller.
- **Generating HTML entities or special chars in labels:** Vietnamese diacritics are fine in double-quoted labels, but avoid `<`, `>`, `&` which Mermaid interprets as HTML.
- **Node IDs with single characters 'o' or 'x':** Mermaid interprets these as edge decorators per mermaid-rules.md anti-pattern #3.
- **Using reserved keywords as node IDs:** Per mermaid-rules.md anti-pattern #2, avoid `end`, `graph`, `subgraph`, `default`, etc.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Truths table parsing | Custom regex for Truths | `parseTruthsV11()` from plan-checker.js | Already handles 3-col and 5-col, tested with 150+ tests |
| Frontmatter parsing | Custom YAML parser | `parseFrontmatter()` from utils.js | Handles arrays, key-value, nested values |
| Mermaid validation | Custom syntax checker | `mermaidValidator()` from mermaid-validator.js | 16 tests, checks all rules from mermaid-rules.md |
| Color palette constants | Hardcoded color values | Import from mermaid-rules.md or define constants matching it | Single source of truth in mermaid-rules.md |

**Key insight:** Phase 21 already built the validation layer. Phase 22 only needs to generate valid Mermaid text and validate it. Don't re-implement validation logic.

## Common Pitfalls

### Pitfall 1: Vietnamese Characters Breaking Mermaid Syntax
**What goes wrong:** Vietnamese diacritics (e.g., don hang, xu ly) can break Mermaid if labels aren't properly quoted.
**Why it happens:** Mermaid parser treats unquoted text as identifiers; special characters cause parse failures.
**How to avoid:** ALWAYS wrap labels in double quotes per mermaid-rules.md Rule 6. The validator already checks this.
**Warning signs:** mermaidValidator() returns unquoted label warnings.

### Pitfall 2: Node ID Collisions Across Plans
**What goes wrong:** Multiple plans may have Truths with the same ID (T1, T2). If combined into one diagram, IDs collide.
**Why it happens:** Each PLAN.md independently numbers Truths starting from T1.
**How to avoid:** Prefix node IDs with plan number: `P01T1`, `P02T1`. This ensures uniqueness across plans in a milestone-level diagram.
**Warning signs:** Diagram shows fewer nodes than expected; Mermaid silently merges same-ID nodes.

### Pitfall 3: depends_on References Plan Numbers, Not Truth IDs
**What goes wrong:** D-07 says "arrows theo thu tu plan" using depends_on. But depends_on is plan-level (`[17-01]`), not Truth-level.
**Why it happens:** depends_on is a PLAN.md frontmatter field linking plans, not individual Truths.
**How to avoid:** Use depends_on to determine plan-to-plan flow direction. Within a plan, Truths flow sequentially (T1 -> T2 -> T3). Between plans, the last Truth of a dependency plan connects to the first Truth of the dependent plan.
**Warning signs:** Arrows point in wrong direction or create disconnected subgraphs.

### Pitfall 4: Exceeding 15 Nodes Without Subgraphs
**What goes wrong:** mermaidValidator() warns when >15 nodes. If a milestone has many Truths, the generated diagram will get a warning.
**Why it happens:** Large milestones (e.g., v1.0 with 9 phases, v1.2 with 11 plans) can have 20+ Truths.
**How to avoid:** Per D-08, when total nodes >15, automatically group into subgraphs by plan. Each subgraph keeps <=15 nodes.
**Warning signs:** checkNodeCount() warning in validator output.

### Pitfall 5: Architecture Diagram Scope Creep
**What goes wrong:** Generating a diagram of the ENTIRE project architecture instead of just the milestone-scoped changes.
**Why it happens:** ARCHITECTURE.md describes the full project.
**How to avoid:** Per D-10, only include modules/files that appear in `files_modified` across the milestone's PLAN.md frontmatter. Filter ARCHITECTURE.md layers to only show touched modules.
**Warning signs:** Diagram has too many nodes, unrelated modules appearing.

### Pitfall 6: Sanitization Loop Creates Invalid Mermaid
**What goes wrong:** The retry-after-validation loop (D-05) tries to "fix" errors automatically but introduces new errors.
**Why it happens:** Naive sanitization (e.g., removing characters) can break Mermaid syntax in unexpected ways.
**How to avoid:** Keep sanitization simple and conservative: (1) ensure all labels are double-quoted, (2) replace problematic characters in labels (< > & with Vietnamese equivalents), (3) ensure node IDs are safe alphanumeric. Don't try to fix structural errors.
**Warning signs:** Retry count exhausted (all 3 attempts fail).

## Code Examples

Verified patterns from existing project code:

### Truths Parsing (from plan-checker.js)
```javascript
// Source: bin/lib/plan-checker.js line 126-136
function parseTruthsV11(planContent) {
  const truths = [];
  // Match: | T\d+ | description | ...remaining columns... |
  // Works for both 3-col and 5-col (and any future column count)
  const tableRegex = /\|\s*(T\d+)\s*\|\s*([^|\n]+)\s*\|(?:\s*[^|\n]+\s*\|)+/g;
  let match;
  while ((match = tableRegex.exec(planContent)) !== null) {
    truths.push({ id: match[1].trim(), description: match[2].trim() });
  }
  return truths;
}
```

### Frontmatter Parsing (from utils.js)
```javascript
// Source: bin/lib/utils.js line 50-101
// Returns: { frontmatter: { depends_on: [...], files_modified: [...], ... }, body: string }
const { parseFrontmatter } = require('./utils');
const { frontmatter, body } = parseFrontmatter(planContent);
// frontmatter.depends_on -> ['17-01'] or []
// frontmatter.files_modified -> ['bin/lib/utils.js', 'templates/plan.md']
```

### Mermaid Validation (from mermaid-validator.js)
```javascript
// Source: bin/lib/mermaid-validator.js line 355-383
const { mermaidValidator } = require('./mermaid-validator');
const result = mermaidValidator(mermaidText);
// result.valid -> boolean
// result.errors -> [{ line, message, type: 'syntax' }]
// result.warnings -> [{ line, message, type: 'style' }]
```

### Module Structure Pattern (from mermaid-validator.js)
```javascript
// Source: bin/lib/mermaid-validator.js structure
'use strict';

// Constants
const MAX_NODES = 15;

// Internal helpers
function helperFunction(lines) { /* ... */ }

// Exported functions
function mainFunction(input, options = {}) {
  // validate input
  // process
  // return structured result
}

module.exports = { mainFunction };
```

### Test Pattern (from smoke-mermaid-validator.test.js)
```javascript
// Source: test/smoke-mermaid-validator.test.js
'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { mermaidValidator } = require('../bin/lib/mermaid-validator');

// Helper to build test data
function makeFlowchart(overrides = {}) { /* ... */ }

describe('featureName -- valid cases', () => {
  it('description', () => {
    const result = fn(input);
    assert.equal(result.valid, true);
  });
});
```

## Data Source Analysis

### Business Logic Flowchart Data (DIAG-01)

**Primary source:** PLAN.md body - Truths table
- Format: `| T1 | Su that | Gia tri nghiep vu | Truong hop bien | Cach kiem chung |`
- Parser: `parseTruthsV11()` returns `[{ id: 'T1', description: 'Su that' }]`
- Per D-06: 1 Truth = 1 node, description = label

**Secondary source:** PLAN.md frontmatter
- `depends_on: [17-01]` -- plan-level dependency for arrow direction (D-07)
- `plan: 01` -- plan number for sequencing
- `phase: 17-truth-protocol` -- phase name for context

**Flow logic (D-07):**
- Within a plan: Truths flow sequentially T1 -> T2 -> T3
- Between plans: Use depends_on to connect last Truth of dependency to first Truth of dependent
- If depends_on is empty `[]`, plan starts from Start node

**Subgraph logic (D-08):**
- If total Truths across all plans > 15: group by plan
- Each subgraph: `subgraph PlanXX["Ke hoach XX"]`
- Subgraph connections: `PlanXX --> PlanYY` based on depends_on

### Architecture Diagram Data (DIAG-02)

**Primary source:** `.planning/codebase/ARCHITECTURE.md`
- Contains: Layer definitions with Purpose, Location, Contains, Depends on, Used by
- Layers: Installer, Converter, Platform Abstraction, Manifest, Skill Framework, Workflow, Template/Reference, Skill Definition
- Per D-09: Use layered layout with subgraphs

**Secondary source:** `.planning/codebase/STRUCTURE.md`
- Contains: Directory layout with file purposes
- Use for: Node labels (file names + purpose)

**Tertiary source:** PLAN.md frontmatter `files_modified`
- Contains: List of files changed in each plan
- Per D-10: Only show modules/files touched in milestone

**Role detection (Claude's Discretion):**
- `bin/lib/*.js` -> Service (rectangle)
- `templates/*.md`, `references/*.md` -> External (subroutine) or API (rounded)
- If filename contains "db", "database", "store" -> Database (cylinder)
- `bin/install.js`, `bin/lib/installers/` -> Service (rectangle)
- `bin/lib/converters/` -> Service (rectangle)
- Default: Service (rectangle) -- safe fallback

**Milestone-scoping (D-10):**
1. Collect all `files_modified` from all PLAN.md files in the milestone
2. Map each file to its ARCHITECTURE.md layer
3. Only include layers/modules that have at least one modified file
4. This keeps the diagram focused and readable

## Function Signatures

### generateBusinessLogicDiagram
```javascript
/**
 * Generate Business Logic Flowchart tu PLAN.md contents cua 1 milestone.
 * @param {Array<{planNumber: number, content: string, phase: string}>} planContents
 *   - Moi item la 1 PLAN.md: planNumber (01, 02...), content (full markdown), phase (ten phase)
 * @param {object} [options]
 *   - maxRetries {number} - So lan retry khi validate fail (default: 2)
 * @returns {{
 *   diagram: string,        - Mermaid text
 *   valid: boolean,         - true neu mermaidValidator().valid === true
 *   errors: Array,          - Syntax errors tu validator
 *   warnings: Array,        - Style warnings tu validator
 *   truthCount: number,     - So luong Truths da parse
 *   planCount: number       - So luong plans da xu ly
 * }}
 */
function generateBusinessLogicDiagram(planContents, options = {}) {}
```

### generateArchitectureDiagram
```javascript
/**
 * Generate Architecture Diagram tu codebase maps va plan metadata.
 * @param {object} codebaseMaps
 *   - architecture {string} - Noi dung ARCHITECTURE.md
 *   - structure {string} - Noi dung STRUCTURE.md (optional)
 * @param {object} planMeta
 *   - filesModified {string[]} - Tat ca files bi thay doi trong milestone
 * @param {object} [options]
 *   - maxRetries {number} - So lan retry (default: 2)
 * @returns {{
 *   diagram: string,        - Mermaid text
 *   valid: boolean,
 *   errors: Array,
 *   warnings: Array,
 *   layerCount: number,     - So layers trong diagram
 *   nodeCount: number       - So nodes trong diagram
 * }}
 */
function generateArchitectureDiagram(codebaseMaps, planMeta, options = {}) {}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual diagram creation | Script-scaffolded + AI-refined diagrams | Phase 22 (new) | Automated Business Logic visualization |
| Full-project architecture views | Milestone-scoped architecture diagrams | Phase 22 (new) | Focused, relevant diagrams per D-10 |
| 3-column Truths table | 5-column Truths table | Phase 17 (v1.3) | Richer data for diagram labels |
| No Mermaid validation | mermaid-validator.js | Phase 21 (v1.4) | Syntax + style enforcement |

## Open Questions

1. **How to detect module role from codebase maps?**
   - What we know: ARCHITECTURE.md describes layers by keyword (Installer, Converter, Platform, Manifest, Skill Framework, Workflow, Template, Skill Definition)
   - What's unclear: Exact mapping from layer name to Mermaid shape (mermaid-rules.md Shape-by-Role)
   - Recommendation (Claude's Discretion): Parse layer names with keyword matching: "Installer"/"Converter" -> Service, "Template"/"Reference" -> External/Subroutine, "Platform" -> API. Default to rectangle.

2. **Start/End node placement**
   - What we know: D-06 says 1 Truth = 1 node. mermaid-rules.md has Start/End as stadium shape.
   - What's unclear: Should every diagram have explicit Start/End nodes, or only when it makes the flow clearer?
   - Recommendation (Claude's Discretion): Add Start node `start(["Bat dau"])` before first Truth and End node `done(["Hoan thanh"])` after last Truth. This frames the flow clearly for managers.

3. **Edge labels between Truths**
   - What we know: mermaid-rules.md allows edge labels 1-3 words Vietnamese.
   - What's unclear: What text to use between Truth nodes since Truths don't have explicit relationships.
   - Recommendation (Claude's Discretion): Use no edge labels for sequential Truth flow (T1 --> T2). Use plan name as edge label only for cross-plan connections (Plan01 --"tiep theo"--> Plan02).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in, Node.js 24.13.0) |
| Config file | none -- uses npm script |
| Quick run command | `node --test test/smoke-generate-diagrams.test.js` |
| Full suite command | `node --test 'test/*.test.js'` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DIAG-01 | generateBusinessLogicDiagram returns valid Mermaid flowchart from Truths | unit | `node --test test/smoke-generate-diagrams.test.js -x` | Wave 0 |
| DIAG-01 | Single plan with 3 Truths produces 3 nodes + arrows | unit | `node --test test/smoke-generate-diagrams.test.js -x` | Wave 0 |
| DIAG-01 | Multi-plan with depends_on produces cross-plan arrows | unit | `node --test test/smoke-generate-diagrams.test.js -x` | Wave 0 |
| DIAG-01 | >15 Truths triggers subgraph splitting | unit | `node --test test/smoke-generate-diagrams.test.js -x` | Wave 0 |
| DIAG-01 | Output passes mermaidValidator() | unit | `node --test test/smoke-generate-diagrams.test.js -x` | Wave 0 |
| DIAG-01 | Vietnamese labels properly quoted | unit | `node --test test/smoke-generate-diagrams.test.js -x` | Wave 0 |
| DIAG-02 | generateArchitectureDiagram returns valid Mermaid LR flowchart | unit | `node --test test/smoke-generate-diagrams.test.js -x` | Wave 0 |
| DIAG-02 | Milestone-scoped: only modified files appear | unit | `node --test test/smoke-generate-diagrams.test.js -x` | Wave 0 |
| DIAG-02 | Shapes match role (cylinder for DB, rectangle for service) | unit | `node --test test/smoke-generate-diagrams.test.js -x` | Wave 0 |
| DIAG-02 | Output passes mermaidValidator() | unit | `node --test test/smoke-generate-diagrams.test.js -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-generate-diagrams.test.js`
- **Per wave merge:** `node --test 'test/*.test.js'`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `test/smoke-generate-diagrams.test.js` -- covers DIAG-01, DIAG-02
- [ ] Framework install: none needed (node:test built-in)

## Sources

### Primary (HIGH confidence)
- `bin/lib/mermaid-validator.js` -- verified API: `mermaidValidator(text)` -> `{ valid, errors, warnings }` (16 tests pass)
- `bin/lib/plan-checker.js` -- verified: `parseTruthsV11()` parses both 3-col and 5-col Truths
- `bin/lib/utils.js` -- verified: `parseFrontmatter()` returns `{ frontmatter, body }` with depends_on support
- `references/mermaid-rules.md` -- verified: Color palette, Shape-by-Role, label conventions, max 15 nodes, arrow types
- `templates/management-report.md` -- verified: Section 3 (Business Logic) and Section 4 (Architecture) placeholders
- `.planning/codebase/ARCHITECTURE.md` -- verified: 8 layers with Location, Contains, Depends on
- `test/smoke-mermaid-validator.test.js` -- verified: test pattern with makeFlowchart helper

### Secondary (MEDIUM confidence)
- `.planning/milestones/v1.3-phases/` -- reviewed actual PLAN.md files for Truths table and frontmatter format
- `templates/plan.md` -- reviewed template for 5-column Truths table structure

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries are local project files, verified exports and APIs
- Architecture: HIGH -- follows exact same module pattern as mermaid-validator.js (proven in Phase 21)
- Pitfalls: HIGH -- based on actual mermaid-rules.md anti-patterns and real PLAN.md data analysis

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (30 days -- stable internal project, no external dependency changes)
