# Feature Research

**Domain:** Visual business logic reporting for AI coding skill framework
**Researched:** 2026-03-24
**Confidence:** HIGH

## Context

v1.4 adds Visual Business Logic Reports to the existing please-done framework. The framework already has a complete milestone lifecycle that produces text-based summaries (MILESTONE_COMPLETE.md), truth tables tracking business logic correctness (5-column Truths with Business Value and Edge Cases), and structured CODE_REPORTs per task. The complete-milestone workflow (10 steps) already compiles all phase data, verifies goal-backward Truths, checks cross-phase integration, and produces MILESTONE_COMPLETE.md.

The gap: all outputs are text-only Markdown. Managers receiving MILESTONE_COMPLETE.md see task lists and bug tables, not visual representations of business logic flows or system architecture. The v1.4 milestone bridges this by generating Mermaid diagrams from existing structured data (Truths, Key Links, Artifacts, CODE_REPORTs) and packaging them into a professional MANAGEMENT_REPORT.md with PDF export.

The 6 target features from PROJECT.md Active requirements:
1. **Business Logic Flowchart** -- Mermaid flowchart from Truths + Key Links
2. **Architecture Diagram** -- Module/Service/DB/API visualization
3. **Management Report Template** -- professional, manager-facing, product language
4. **PDF Export Script** -- Markdown+Mermaid to PDF via Node.js
5. **Workflow Integration** -- complete-milestone auto-generates diagrams
6. **Mermaid Aesthetics Rules** -- consistent diagram styling conventions

---

## Table Stakes

Features explicitly requested in PROJECT.md Active requirements. All 6 must ship for v1.4 to be complete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **TS-1: Mermaid Aesthetics Rules** | Without style rules, AI generates inconsistent diagrams per invocation -- random colors, unclear labels, inconsistent direction. Every subsequent diagram feature depends on having rules to follow. | LOW | New `references/diagram-rules.md`. Define: color palette (node type -> color), node shapes per component type (service=rounded, database=cylinder, API=hexagon), label conventions (Vietnamese, sentence case), max 25-30 nodes per diagram, default direction (TD for logic flows, LR for architecture). Also covers: subgraph naming, edge label rules, when to split into multiple diagrams. ~60 lines. |
| **TS-2: Business Logic Flowchart** | Core deliverable. Managers need to see HOW features connect without reading code. Truths table already contains structured data (Description, Business Value, Edge Cases) that maps directly to flowchart nodes and decision diamonds. Replaces mental model construction with a visual artifact. | MEDIUM | Use `flowchart TD` syntax (top-down, universally supported). Data source: Truths table + Key Links from ALL phase PLAN.md files in the milestone. AI reads Truths descriptions as process nodes, Edge Cases as decision branches, Key Links as edges. Output: 1-2 flowcharts per milestone embedded in MANAGEMENT_REPORT.md. Each flowchart captures one major user flow. ~80 lines of workflow instruction + examples. **Dependency:** TS-1 (rules). |
| **TS-3: Architecture Diagram** | Managers need system-level understanding: what components exist, how they connect, what external systems are involved. Current CODE_REPORTs list files modified but do not visualize relationships. Architecture diagrams answer "What does the system look like?" | MEDIUM | Use `flowchart LR` with subgraphs (left-right for system layout, subgraphs for module boundaries). Prefer over `architecture-beta` (v11.1+ only, experimental) and `C4Context` (also experimental in Mermaid). Data source: Artifacts table (file paths imply module structure), Key Links (connections), CODE_REPORT files (actual components created). Subgraph per major module/layer (API, Service, Database, External). ~60 lines of workflow instruction. **Dependency:** TS-1 (rules). |
| **TS-4: Management Report Template** | Current MILESTONE_COMPLETE.md is developer-focused: task lists, bug tables, artifact paths. Managers need business outcomes, risk overview, architecture at a glance, and next steps -- in product language. Industry standard: Executive Summary + Business Outcomes + Visual Overview + Quality + Risk + Next Steps. | LOW | New `templates/visual-report.md` with 7 sections. Written following ui-brand.md Layer 1 principles ("User duoc gi?"). Embeds Mermaid diagram code blocks inline. Language: Vietnamese, product-oriented per existing conventions. ~80 lines template. Sections: (1) Executive Summary, (2) Business Outcomes (from Truths "Business Value" column), (3) Architecture Overview (embedded diagram), (4) Key Feature Flows (embedded flowchart), (5) Quality Metrics (tests, bugs, verification), (6) Risk & Tech Debt, (7) Next Steps. **Dependency:** TS-2, TS-3 (diagrams to embed). |
| **TS-5: PDF Export Script** | Mermaid in Markdown renders in GitHub/VS Code but is not shareable with non-technical stakeholders who use email, Slack, or printed reports. PDF is the universal document format. Script must handle Mermaid rendering (requires JavaScript execution) which plain Markdown-to-PDF converters cannot do. | HIGH | New `scripts/generate-pdf-report.js`. Uses Puppeteer (headless Chromium) because Mermaid diagrams require JavaScript execution for rendering -- no simpler alternative exists. Pipeline: (1) Read .md file, (2) Convert Markdown to HTML with marked/markdown-it, (3) Inject Mermaid.js CDN script, (4) Open in Puppeteer, (5) Wait for Mermaid render, (6) Generate PDF with page.pdf(). Output to same directory as source file. New devDependency: `puppeteer` (~400MB Chromium download on first install). Consider `puppeteer-core` + system Chrome to reduce footprint. ~120 lines. **Dependency:** TS-4 (template to render). |
| **TS-6: Workflow Integration** | Diagrams must be generated automatically during milestone completion, not as a manual step. The complete-milestone workflow already has all needed data at Step 4 (all CODE_REPORTs read, all phases verified). Integration point is clear: after verification, before git commit. | LOW | Update `workflows/complete-milestone.md`. Insert new Step 4.5 between current Step 4 (summary report) and Step 5 (CHANGELOG). Step 4.5: (1) AI generates Mermaid flowchart from Truths across all phases, (2) AI generates architecture diagram from Artifacts + Key Links, (3) Write MANAGEMENT_REPORT.md using template, (4) Call `node scripts/generate-pdf-report.js [path]`, (5) Report PDF path. Also update Step 10 notification to include PDF path. ~40 lines added to workflow. **Dependency:** TS-2, TS-3, TS-4, TS-5 (all upstream features). |

## Differentiators

Features not explicitly requested but would significantly increase the value of visual reporting. These leverage please-done's unique structured data (Truths, Key Links, verification results).

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **D-1: Truth-to-Diagram Tracing** | Each flowchart node annotated with Truth ID (T1, T2...) showing which business logic each visual element validates. Unique to please-done's truth-driven approach. Makes the connection between "what we promised" and "what we built" visible. | LOW | Add Truth IDs as node labels or annotations in flowchart. Data already available. Truths table has ID + Description. Flowchart node text = `T1: [Description]`. Minimal additional complexity over TS-2. Can be included in TS-2 implementation. |
| **D-2: Cross-Phase Dependency Diagram** | Visualize how phases connect -- which phase outputs feed which phase inputs. Currently computed as text table in Step 3.5b but never visualized. | LOW | Use `flowchart LR` with phase nodes. Data source: cross-phase integration table already computed during complete-milestone Step 3.5b. Just needs Mermaid generation from existing data. Could be a third diagram in MANAGEMENT_REPORT.md or optional section. |
| **D-3: Sequence Diagram for API Flows** | Show request/response flow for key API interactions. Managers understand "User does X, system responds Y" better than static architecture boxes. Especially valuable for milestones with user-facing API features. | MEDIUM | Use `sequenceDiagram` syntax. AI decides when appropriate based on milestone content (e.g., milestones with API endpoints in Thiết kế kỹ thuật section). Not every milestone needs one. Optional section in MANAGEMENT_REPORT.md. |
| **D-4: Quality Dashboard Diagram** | Pie chart or bar chart showing test pass rates, bug distribution, verification results. Quick visual health check for managers. | LOW | Use Mermaid `pie` or `xychart-beta`. Data: TEST_REPORT pass/fail counts, bug counts by severity, verification pass rates. Simple aggregation. Optional section in MANAGEMENT_REPORT.md. |
| **D-5: Milestone Timeline** | Gantt-style view showing phase durations and overlaps. Managers care about time investment per feature area. | LOW | Use Mermaid `gantt` syntax. Data: phase start/end dates from PLAN.md headers. Shows duration proportions. Optional section in MANAGEMENT_REPORT.md. |

## Anti-Features

Features that seem appealing but create problems in this context.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **AF-1: Interactive HTML Diagrams** | "Click nodes to see code details" | Adds web server dependency. Breaks offline use. Mermaid HTML output is fragile across browsers. Please-done is CLI-based, not a web app. Maintenance burden outweighs benefit. | Static PDF + Mermaid in GitHub Markdown (renders natively). VS Code Mermaid extension for dev preview. |
| **AF-2: Real-time Diagrams During write-code** | "See architecture evolve as I code" | Requires file watchers + incremental Mermaid regeneration. Extremely complex for a prompt-based system. Diagrams are summary artifacts, not real-time monitoring tools. | Generate diagrams at milestone completion only -- when all code is stable and all phases are verified. |
| **AF-3: Full Code-to-Flowchart Conversion** | "Convert every function to a flowchart" | Produces massive, unreadable diagrams. Business logic is NOT the same as all code. AST-level flowcharts show implementation, not business intent. Managers do not need to see every if/else branch. | Focus on business-facing logic from Truths table. AI selects which flows to visualize based on "Business Value" column. Quality over quantity. |
| **AF-4: AI-Powered Diagram Layout Optimization** | "Make diagrams look professional with AI layout" | Mermaid layout is deterministic (dagre algorithm). LLMs cannot control pixel placement. Attempting to override layout creates brittle, non-reproducible output. "Beautify" is subjective and unverifiable. | Define clear, opinionated rules in diagram-rules.md. Use subgraphs for logical grouping. Keep diagrams under 30 nodes. Consistent rules produce consistent output. |
| **AF-5: Multiple PDF Themes/Branding** | "Match company brand colors" | Scope creep. Every organization has different branding. Maintaining a theme engine is a product unto itself. Distracts from core value. | Single professional theme with neutral colors (grays, blues). Hardcoded CSS in script. Users can fork and customize if needed. |
| **AF-6: Mermaid Live Editor Integration** | "Preview diagrams before generating PDF" | External dependency (mermaid.live), requires browser, breaks CLI workflow. Adds manual step to an automated process. Not reproducible. | Use `mmdc` CLI (`@mermaid-js/mermaid-cli`) for validation if needed. But primary validation is visual: PDF output IS the preview. |
| **AF-7: Diagram Diff Between Milestones** | "Show architecture changes from v1.3 to v1.4" | Requires serializing diagram structure, computing graph diffs, and rendering change visualization. Research-level complexity for minimal value at this stage. | Each milestone gets its own diagrams. Managers can visually compare PDFs side by side. Consider for v2+ if demand emerges. |
| **AF-8: `architecture-beta` or `C4Context` Syntax** | "Use proper architecture diagram notation" | Both are experimental in Mermaid (syntax may change between versions). `architecture-beta` requires v11.1+. C4 has limited styling options. Puppeteer/mmdc may not render experimental syntax reliably. Compatibility risk. | Use `flowchart LR` with subgraphs. Universally supported since Mermaid v8+. Subgraphs provide grouping semantics equivalent to C4 containers. Upgrade to `architecture-beta` in future when syntax stabilizes. |

---

## Feature Dependencies

```
TS-1: Mermaid Aesthetics Rules (references/diagram-rules.md)
   |
   +---> TS-2: Business Logic Flowchart (flowchart TD from Truths)
   |        |
   |        +---> D-1: Truth-to-Diagram Tracing (annotate nodes with T1, T2...)
   |
   +---> TS-3: Architecture Diagram (flowchart LR from Artifacts + Key Links)
   |        |
   |        +---> D-2: Cross-Phase Dependency Diagram (phase-level flowchart)
   |        +---> D-3: Sequence Diagram (optional API flows)
   |
   +---> TS-4: Management Report Template (templates/visual-report.md)
            |     (embeds TS-2 and TS-3 diagrams)
            |
            +---> D-4: Quality Dashboard Diagram (pie/chart in report)
            +---> D-5: Milestone Timeline (gantt in report)
            |
            +---> TS-5: PDF Export Script (scripts/generate-pdf-report.js)
                     |
                     +---> TS-6: Workflow Integration (complete-milestone Step 4.5)
```

### Dependency Notes

- **TS-1 is the root dependency.** All diagram features reference aesthetics rules for consistent output. Must be built first.
- **TS-2 and TS-3 are parallel after TS-1.** Both produce Mermaid diagrams using rules from TS-1. No dependency between them. Can be built in same phase.
- **TS-4 depends on TS-2 and TS-3.** Template references and embeds the generated diagrams. Must know diagram output format to define embedding structure.
- **TS-5 depends on TS-4.** PDF script renders the MANAGEMENT_REPORT.md file. Must know template structure (sections, Mermaid blocks, page break hints) to render correctly.
- **TS-6 depends on TS-5 (and transitively all upstream).** Workflow integration wires everything together. Must be last.
- **D-1 enhances TS-2.** Can be included in TS-2 implementation or added later. Low marginal cost.
- **D-2, D-3 enhance TS-3.** Additional diagram types that follow same patterns. Can be added in same phase or deferred.
- **D-4, D-5 enhance TS-4.** Additional report sections with embedded diagrams. Can be added in same phase or deferred.

---

## MVP Definition

### Launch With (v1.4)

All 6 explicitly requested features. The dependency chain requires them in this build order:

- [ ] **TS-1: Mermaid Aesthetics Rules** -- foundation, defines visual language for all diagrams
- [ ] **TS-2: Business Logic Flowchart** -- core visual deliverable, maps Truths to process flow
- [ ] **TS-3: Architecture Diagram** -- system structure visualization from CODE_REPORTs
- [ ] **TS-4: Management Report Template** -- professional report embedding diagrams
- [ ] **TS-5: PDF Export Script** -- renders Markdown+Mermaid to shareable PDF
- [ ] **TS-6: Workflow Integration** -- automates diagram generation in complete-milestone

### Add After Validation (v1.4.x)

Add once core diagram generation works reliably across a few real milestone completions:

- [ ] **D-1: Truth-to-Diagram Tracing** -- annotate flowchart nodes with Truth IDs. Trigger: when first real flowcharts are generated successfully.
- [ ] **D-2: Cross-Phase Dependency Diagram** -- visualize phase relationships. Trigger: when architecture diagram pattern is proven.
- [ ] **D-4: Quality Dashboard** -- pie charts for test/bug metrics. Trigger: when PDF rendering handles basic diagrams.

### Future Consideration (v1.5+)

Features to defer until visual reporting has proven its value:

- [ ] **D-3: Sequence Diagrams** -- useful for API-heavy milestones only. Wait for demand.
- [ ] **D-5: Milestone Timeline** -- gantt charts. Requires date tracking not currently captured.
- [ ] **Cumulative Architecture Diagrams** -- builds on previous milestones. Requires cross-milestone state.
- [ ] **Upgrade to `architecture-beta` syntax** -- when Mermaid stabilizes the API (currently experimental).

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Risk | Priority |
|---------|------------|---------------------|------|----------|
| TS-1: Mermaid Aesthetics Rules | MEDIUM | LOW | LOW | P1 |
| TS-2: Business Logic Flowchart | HIGH | MEDIUM | LOW | P1 |
| TS-3: Architecture Diagram | HIGH | MEDIUM | LOW | P1 |
| TS-4: Management Report Template | HIGH | LOW | LOW | P1 |
| TS-5: PDF Export Script | MEDIUM | HIGH | MEDIUM | P1 |
| TS-6: Workflow Integration | HIGH | LOW | LOW | P1 |
| D-1: Truth-to-Diagram Tracing | MEDIUM | LOW | LOW | P2 |
| D-2: Cross-Phase Dependency Diagram | LOW | LOW | LOW | P2 |
| D-3: Sequence Diagrams | MEDIUM | MEDIUM | LOW | P3 |
| D-4: Quality Dashboard | LOW | LOW | LOW | P2 |
| D-5: Milestone Timeline | LOW | LOW | MEDIUM | P3 |

**Risk assessment:**
- **TS-5 MEDIUM risk:** Puppeteer dependency is heavy (~400MB). Mermaid rendering timing in headless Chrome can be flaky (need explicit waits). PDF page breaks around diagrams need careful CSS. Consider `puppeteer-core` + system Chrome to reduce install size. Fallback: if PDF generation fails, MANAGEMENT_REPORT.md in Markdown is still valuable.
- **TS-2/TS-3 LOW risk:** Mermaid `flowchart` syntax is stable (since v8). AI already generates Mermaid in many contexts. The structured data sources (Truths, Key Links, Artifacts) provide clear inputs. Risk is in diagram quality/readability, not in technical feasibility. Rules (TS-1) mitigate quality risk.

---

## Existing Workflow Integration Points

The complete-milestone workflow has clear, well-defined integration points.

| Workflow Step | Current Behavior | v1.4 Integration |
|---------------|------------------|------------------|
| Step 2: Status check | Scans all phase-*/TASKS.md, TEST_REPORT.md, CODE_REPORT_TASK_*.md | **No change** -- data source for diagram generation |
| Step 3.5a: Goal-backward verification | Verifies Truths per phase using 4-level verification | **No change** -- verification results feed Quality Metrics section |
| Step 3.5b: Cross-phase links | Checks export/import match across phases | **No change** -- data feeds architecture diagram edges |
| Step 4: Summary report | Writes MILESTONE_COMPLETE.md from CODE_REPORTs | **No change** -- MILESTONE_COMPLETE.md still generated for dev audience |
| **NEW Step 4.5** | Does not exist | **ADD:** Generate MANAGEMENT_REPORT.md: (1) Read all Truths + Key Links + Artifacts from PLANs, (2) Generate flowchart per diagram-rules.md, (3) Generate architecture diagram, (4) Fill MANAGEMENT_REPORT.md template, (5) Call PDF script, (6) Report PDF path |
| Step 5: CHANGELOG.md | Creates/updates changelog | **No change** |
| Step 10: Notification | Summarizes milestone, git tag, suggests scan | **UPDATE:** Add PDF file path to notification output |

### Data Sources Already Available for Diagram Generation

| Data Source | Location | Feeds Into | Extraction Complexity |
|-------------|----------|------------|----------------------|
| Truths table (5-col) | phase-*/PLAN.md "Su that phai dat" | Flowchart nodes (Description), annotations (Business Value), decision points (Edge Cases) | LOW -- parseTruthsV11() already exists in plan-checker.js |
| Key Links | phase-*/PLAN.md "Lien ket then chot" | Flowchart edges, Architecture connections | LOW -- structured table format |
| Artifacts table | phase-*/PLAN.md "San pham can co" | Architecture Diagram components (file paths imply module structure) | LOW -- structured table format |
| CODE_REPORT_TASK_*.md | phase-*/reports/ | Architecture Diagram (actual modules, APIs, services created) | MEDIUM -- semi-structured, AI must interpret |
| Cross-phase integration | Computed at Step 3.5b | Cross-phase dependency diagram | LOW -- already computed, just needs Mermaid generation |
| TEST_REPORT.md | phase-*/ | Quality Metrics (pass/fail counts) | LOW -- structured test results |
| BUG_*.md | .planning/bugs/ | Risk section (open/resolved bugs) | LOW -- already scanned at Step 3 |
| VERIFICATION_REPORT.md | phase-*/ | Verification status annotations | LOW -- structured pass/gap data |

---

## Diagram Type Analysis

Which Mermaid diagram types provide the most value to managers?

| Diagram Type | Manager Value | Technical Stability | Recommended Use |
|--------------|--------------|---------------------|-----------------|
| `flowchart TD` | HIGH -- shows process/decision flow | HIGH -- stable since v8 | **Primary:** Business logic flows from Truths |
| `flowchart LR` | HIGH -- shows system architecture | HIGH -- stable since v8 | **Primary:** Architecture overview with subgraphs |
| `sequenceDiagram` | MEDIUM -- shows interactions | HIGH -- stable | **Secondary:** API flows when milestone has API features |
| `pie` | MEDIUM -- proportions at a glance | HIGH -- stable | **Optional:** Quality dashboard |
| `gantt` | MEDIUM -- timeline view | HIGH -- stable | **Optional:** Phase timeline |
| `C4Context` / `C4Container` | HIGH notation value | LOW -- experimental | **Avoid:** Syntax may change. Use flowchart+subgraphs instead. |
| `architecture-beta` | HIGH -- native arch support | LOW -- experimental, v11.1+ only | **Avoid:** Too new. PDF rendering untested. |
| `classDiagram` | LOW -- too technical | HIGH -- stable | **Skip:** Not business-facing |
| `erDiagram` | LOW -- database detail | HIGH -- stable | **Skip:** Not business-facing |
| `stateDiagram-v2` | MEDIUM -- state transitions | HIGH -- stable | **Defer:** Useful for workflow visualization in v1.5+ |

### Management Report Section Design

| Section | Content | Data Source | Audience Value |
|---------|---------|-------------|----------------|
| Executive Summary | 3-5 sentence business overview: what was built, why it matters, what's next | AI synthesis from Truths "Business Value" column + ROADMAP context | HIGH -- first thing managers read |
| Business Outcomes | Bullet list of user-facing capabilities delivered | Truths table Descriptions, rewritten in product language per ui-brand.md | HIGH -- answers "What did we get?" |
| Architecture Overview | Embedded `flowchart LR` + 2-3 sentence explanation | Generated from Artifacts + Key Links + CODE_REPORTs | HIGH -- answers "What does the system look like?" |
| Key Feature Flows | Embedded `flowchart TD` + descriptions per flow | Generated from Truths + Key Links (user journey perspective) | HIGH -- answers "How does it work?" |
| Quality Metrics | Tests passed/failed, bugs found/fixed, verification results | TEST_REPORT.md + BUG_*.md + Step 3.5a results | MEDIUM -- managers want confidence signal |
| Risk & Tech Debt | Open issues, deferred items, areas needing attention | MILESTONE_COMPLETE.md "No ky thuat" section | MEDIUM -- answers "What should I worry about?" |
| Next Steps | What's planned for next milestone | ROADMAP.md next milestone description | MEDIUM -- answers "What's coming?" |

---

## Competitor Feature Analysis

| Feature | Generic Report Tools (Asana, Jira) | Code-to-Diagram Tools (Eraser, CodeToFlow) | Please-Done v1.4 |
|---------|-------------------------------------|---------------------------------------------|-------------------|
| Diagram source | Manual creation, templates | Code AST parsing | **AI + structured Truths/Key Links/Artifacts data** |
| Business context in diagrams | None -- generic project data | None -- pure code visualization | **Truths "Business Value" column annotates every node** |
| Automation level | Manual updates | One-shot generation | **Fully automated in milestone completion workflow** |
| Output format | Web dashboard (vendor lock-in) | Web-only, proprietary format | **Markdown + PDF (portable, version-controlled, offline)** |
| Integration with code workflow | Separate tool, manual sync | Standalone tool | **Built into same workflow that produces code** |
| Consistency across reports | Template-based but manual | N/A (single use) | **Convention rules + template ensure every milestone looks the same** |
| Cost | SaaS subscription ($10-25/user/month) | SaaS subscription ($8-20/user/month) | **Open source, zero marginal cost** |

**Key insight:** Please-Done v1.4's unique advantage is that diagrams are generated FROM the same structured data (Truths, Artifacts, Key Links) that DRIVES development. This creates a direct traceability link from business requirement -> implementation plan -> visual diagram -> PDF report. No other tool provides this end-to-end chain in a single automated workflow.

---

## Infrastructure Dependencies (Existing Components Reused, Not Modified)

| Component | File | Used By | v1.4 Usage |
|-----------|------|---------|------------|
| Truths parser | `bin/lib/plan-checker.js` (parseTruthsV11) | TS-2 (flowchart generation) | Read Truths to generate flowchart nodes. Reuse parser, do NOT modify. |
| ui-brand.md Layer 1 | `references/ui-brand.md` | TS-4 (report template) | Report language follows product framing rules. Reference, do NOT modify. |
| complete-milestone | `workflows/complete-milestone.md` | TS-6 (workflow integration) | Add Step 4.5. MODIFY workflow file. |
| conventions.md | `references/conventions.md` | TS-1 (rules may extend this) | Either add diagram rules section here OR create separate `references/diagram-rules.md`. Decision at plan time. |
| Plan template | `templates/plan.md` | TS-2, TS-3 (data source) | Read Truths/Artifacts/Key Links tables. Do NOT modify template. |
| Progress template | `templates/progress.md` | Not directly impacted | No change needed. |
| Converter pipeline | `bin/lib/converters/*.js` | TS-6 (workflow changes need converter update) | complete-milestone.md changes will be transpiled to all 5 platforms. Need snapshot regeneration. |
| Test suite | `test/*.test.js` | TS-5 (new script needs tests) | Add tests for generate-pdf-report.js. Plan-checker tests NOT impacted (no parser changes). |

---

## Sources

- [Mermaid.js Flowchart Syntax](https://mermaid.js.org/syntax/flowchart.html) -- official docs, HIGH confidence
- [Mermaid Syntax Reference](https://mermaid.js.org/intro/syntax-reference.html) -- all diagram types, HIGH confidence
- [Mermaid Architecture Diagrams v11.1+](https://mermaid.js.org/syntax/architecture.html) -- experimental feature, MEDIUM confidence
- [Mermaid C4 Diagrams](https://mermaid.js.org/syntax/c4.html) -- experimental, MEDIUM confidence
- [@mermaid-js/mermaid-cli npm](https://www.npmjs.com/package/@mermaid-js/mermaid-cli) -- official CLI for rendering, HIGH confidence
- [mermaid-cli GitHub](https://github.com/mermaid-js/mermaid-cli) -- API docs, HIGH confidence
- [md-mermaid-to-pdf npm](https://www.npmjs.com/package/md-mermaid-to-pdf) -- Puppeteer-based PDF with Mermaid, MEDIUM confidence
- [@ml-lubich/markpdf npm](https://www.npmjs.com/package/@ml-lubich/markpdf) -- modern Markdown+Mermaid to PDF, MEDIUM confidence
- [Asana: Project Status Reports](https://asana.com/resources/how-project-status-reports) -- management report structure, MEDIUM confidence
- [FineReport: Project Management Report](https://www.finereport.com/en/reporting-tools/project-management-report.html) -- report structure, MEDIUM confidence
- [TheProjectGroup: Project Status Report 2025](https://www.theprojectgroup.com/blog/en/project-status-report/) -- report sections best practices, MEDIUM confidence
- [Sourcegraph: Flowcharting Code with Mermaid](https://sourcegraph.com/blog/using-cody-and-mermaid-to-generate-flowcharts) -- AI + Mermaid patterns, MEDIUM confidence
- [Zencoder: Generate Architecture Diagrams](https://docs.zencoder.ai/user-guides/tutorials/generate-codebase-diagrams) -- diagram generation patterns, MEDIUM confidence
- [Puppeteer HTML to PDF](https://blog.risingstack.com/pdf-from-html-node-js-puppeteer/) -- PDF generation patterns, MEDIUM confidence
- [How to Generate PDFs in 2025](https://dev.to/michal_szymanowski/how-to-generate-pdfs-in-2025-26gi) -- modern PDF approaches, MEDIUM confidence
- Please-Done codebase: `workflows/complete-milestone.md`, `templates/plan.md`, `references/ui-brand.md`, `references/conventions.md`, `bin/lib/plan-checker.js`, `package.json` -- PRIMARY, HIGH confidence

---
*Feature research for: Visual Business Logic Reports (please-done v1.4)*
*Researched: 2026-03-24*
