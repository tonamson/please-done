# Please-Done Workflow Optimization

## What This Is

Please-Done is a cross-platform AI coding skill framework that transpiles workflow skills from Claude Code format to multiple platforms (Codex, Gemini, OpenCode, Copilot). The project provides a complete skill lifecycle (init → scan → plan → write-code → test → fix-bug → complete) with multi-framework rules (NestJS, Next.js, WordPress, Flutter, Solidity), token-optimized prompts, wave-based parallel execution, library-aware code generation via Context7, automated plan quality checking with truth-driven enforcement, verified end-to-end workflow logic with logic re-validation before code changes, automated Mermaid diagram generation with PDF report export, an enhanced fix-bug workflow with automated investigation, a research squad system with structured evidence storage, anti-hallucination audit trails, and automated research pipelines (Evidence Collector → INDEX.md → Fact Checker cross-validation), and an OWASP security audit pipeline with smart scanner selection, session delta, POC/gadget chain analysis, and milestone-integrated security gates.

## Core Value

Every workflow step must produce the highest quality code output while consuming the minimum tokens and time — the AI must never miss critical steps and must always use the correct libraries from the user's project.

## Requirements

### Validated

- ✓ Cross-platform skill transpilation (Claude, Codex, Gemini, OpenCode, Copilot) — existing
- ✓ Skill lifecycle workflow (init → scan → plan → write-code → test → fix-bug → complete) — existing
- ✓ Template-driven planning with PLAN.md and TASKS.md — existing
- ✓ Multi-framework rules (NestJS, Next.js, WordPress, Flutter, Solidity) — existing
- ✓ Manifest-based installation tracking with SHA256 hashing — existing
- ✓ FastCode MCP integration for codebase analysis — existing
- ✓ Context7 MCP integration for library documentation — existing
- ✓ Tech-stack auto-detection during init — existing
- ✓ Installer with prerequisite checks and MCP registration — existing
- ✓ Consistent skill structure across all 12 skills — v1.0 (Phase 1)
- ✓ Cross-skill deduplication via guard micro-templates — v1.0 (Phase 2)
- ✓ 30.6% token reduction across 45 files — v1.0 (Phase 3)
- ✓ Conditional context loading — lazy-load 12,549 tokens of optional refs — v1.0 (Phase 4)
- ✓ Effort-level routing — simple/standard/complex → haiku/sonnet/opus — v1.0 (Phase 5)
- ✓ Context7 standardization — canonical pipeline across all 5 code-generating skills — v1.0 (Phase 6)
- ✓ Library fallback chain — project docs → codebase → training data — v1.0 (Phase 7)
- ✓ Wave-based parallel execution — topological sort, file-conflict detection — v1.0 (Phase 8)
- ✓ Base converter pipeline — shared 9-step logic, 7 silent catches fixed — v1.0 (Phase 9)
- ✓ Plan checker core engine — 4 structural checks, rules spec, 85 tests — v1.1 (Phase 10)
- ✓ Plan checker workflow integration — PASS/ISSUES FOUND reporting, Fix/Proceed/Cancel — v1.1 (Phase 11)
- ✓ Advanced checks — Key Links, Scope Thresholds, Effort Classification — v1.1 (Phase 12)
- ✓ Dynamic PASS table — all checks displayed, future-proof — v1.1 (Phase 13)
- ✓ Comprehensive audit of 12 skills, 10 workflows, 15 JS modules — 27 issues classified — v1.2 (Phase 14)
- ✓ End-to-end verification of 3 critical workflows (new-milestone, write-code, fix-bug) — v1.2 (Phase 15)
- ✓ 22/27 audit issues fixed, 448 tests pass, 48/48 snapshots in sync — v1.2 (Phase 16)
- ✓ Truth Protocol — 5-col Truths table, backward-compat parser, CHECK-04 BLOCK severity — v1.3 (Phase 17)
- ✓ Logic-First Execution — Buoc 1.7 re-validate logic before coding, structured verification report — v1.3 (Phase 18)
- ✓ Knowledge Correction — Buoc 6.5 Logic Update in fix-bug, Logic Changes tracking in both workflows — v1.3 (Phase 19)
- ✓ Logic Audit — CHECK-05 checkLogicCoverage with configurable severity, CHECK-04 refactored — v1.3 (Phase 20)
- ✓ Mermaid aesthetic rules + management report template tieng Viet — v1.4 (Phase 21)
- ✓ mermaidValidator() pure function (6 checks, 16 tests) — v1.4 (Phase 21)
- ✓ generateBusinessLogicDiagram() (Truths → flowchart TD) + generateArchitectureDiagram() (layers → flowchart LR) — v1.4 (Phase 22)
- ✓ pdf-renderer.js pure library (MD→HTML, A4 template, Mermaid CDN) — v1.4 (Phase 23)
- ✓ generate-pdf-report.js CLI (Puppeteer PDF + .md fallback) — v1.4 (Phase 23)
- ✓ fillManagementReport() pure function + Buoc 3.6 non-blocking workflow integration — v1.4 (Phase 24)
- ✓ repro-test-generator.js + regression-analyzer.js pure functions + truths-parser shared helper + workflow sub-steps 5b.1/8a — v1.5 (Phase 25)
- ✓ debug-cleanup.js pure functions (scanDebugMarkers + matchSecurityWarnings) + workflow sub-step 9a — v1.5 (Phase 26)
- ✓ logic-sync.js (detectLogicChanges + updateReportDiagram + suggestClaudeRules + runLogicSync) + workflow Buoc 10a — v1.5 (Phase 27)
- ✓ Dynamic Resource Orchestration — Tier/Model mapping, resource safety rules — v2.1 (Phase 28)
- ✓ Detective Protocols — Resume UI, Evidence Format, Continuation Agent — v2.1 (Phase 29-30)
- ✓ Project Memory & Regression Detection — Bug history recall, regression alerts — v2.1 (Phase 31)
- ✓ Workflow Execution Loop — 5-step orchestrator integrating all agents — v2.1 (Phase 32-33)
- ✓ Integration Wiring — call signatures, enforcement points, encoding, prose gaps — v2.1 (Phase 34-37)
- ✓ Cấu trúc lưu trữ phân tách — internal/ + external/ + research-store.js — v3.0 (Phase 38)
- ✓ Tiêu chuẩn báo cáo Audit — confidence-scorer.js, audit-logger.js, index-generator.js, validateEvidence — v3.0 (Phase 39)
- ✓ Research Squad agents — Evidence Collector (sonnet) + Fact Checker (opus) — v3.0 (Phase 40)
- ✓ Workflow Guards — CHECK-06 Research Backing, CHECK-07 Hedging Language, Strategy Injection — v3.0 (Phase 41)
- ✓ Lệnh pd research — auto-detect internal vs external context, pipeline tự động — v3.0 (Phase 42)
- ✓ Wire INDEX.md vào Pipeline — generateIndex() tự động trong pd:research — v3.0 (Phase 43)
- ✓ Wire routeQuery vào Workflow — thay thế inline heuristic — v3.0 (Phase 44)
- ✓ Claim-Level Confidence API — parseClaims() extract + createEntry() render — v3.0 (Phase 45)
- ✓ Smart Scanner Selection — selectScanners() pure function, 12 signals, 3 base scanners, function checklist, reporter master table — v4.0 (Phase 48)
- ✓ POC pipeline + Gadget Chain Detection + Fix Phases Routing — gadget-chain.js (3 pure functions), 7 chain templates, pd-sec-fixer agent, security-fix-phase template, POC wired vào scanner, gadget chain wired vào reporter B6, fixer wired vào B8 — v4.0 (Phase 50)
- ✓ Lệnh pd:audit (skill + workflow) với 2 chế độ: Độc lập + Tích hợp milestone — v4.0 (Phase 46-47)
- ✓ Template agent pd-sec-scanner.md + security-rules.yaml (1 template → 13 OWASP categories) — v4.0 (Phase 46)
- ✓ Reporter agent pd-sec-reporter.md tổng hợp SECURITY_REPORT.md — v4.0 (Phase 48)
- ✓ Session Delta — đối soát phiên cũ (KNOWN-UNFIXED / RE-VERIFY / NEW) — v4.0 (Phase 49)
- ✓ Batch execution waves (tối đa 2 instance song song) — v4.0 (Phase 47)
- ✓ Tích hợp: security gate trong complete-milestone, what-next priority, state-machine update — v4.0 (Phase 51)
- ✓ FastCode MCP integration (tool-first, AI-last) — v4.0 (Phase 46)
- ✓ Agent Reform — 6 new agents, 3-tier model system, platform-aware getAgentConfig(name, platform) — v5.0 (Phases 52-53, 59)
- ✓ Platform-Aware Mapping — Config-driven tier→model per 7 platforms, automatic fallback, production caller wired — v5.0 (Phases 54, 59)
- ✓ Parallel + Resource Guard — Adaptive workers, heavy agent detection, backpressure, graceful degradation — v5.0 (Phase 55)
- ✓ Skill-Agent Integration — pd-codebase-mapper auto-mapping, Research Squad, soft-guard strategy — v5.0 (Phase 56)
- ✓ Reference Dedup — Merged verification-patterns.md + plan-checker.md → verification.md, zero broken refs — v5.0 (Phase 57)
- ✓ Runtime DRY — installer-utils.js with 6 shared utilities, 4 installers DRY — v5.0 (Phase 57)
- ✓ Token Budget — TOKEN_BUDGET per tier (4K/8K/12K), baseline v5.0 (86,305 tokens), 10 workflows conditional_reading, eval pipeline verified — v5.0 (Phase 58)
- ✓ Integration Wiring + Verification Gaps — Platform wiring production caller, pd-sec-scanner path, Phase 52/53 verification — v5.0 (Phase 59)

- ✓ Agent Consolidation — 16 agents into commands/pd/agents/ as single source of truth — v5.1 (Phase 60)
- ✓ Symlink Architecture — 16 symlinks in .claude/agents/ pointing to commands/pd/agents/ — v5.1 (Phase 61)
- ✓ Reference Migration — smoke-agent-files.test.js and fix-bug.md updated — v5.1 (Phase 62)
- ✓ Format Standardization — legacy security agents converted to new YAML frontmatter — v5.1 (Phase 63)
- ✓ Registry & Test Updates — AGENT_REGISTRY 14→16, all smoke tests pass — v5.1 (Phase 64)

### Active

- ✓ Translate 14 skill files + CLAUDE.md to English — v6.0 (Phase 65)
- ✓ Regenerate 56 snapshots after skill translation — v6.0 (Phase 65)
- [ ] Translate 13 workflow files to English — v6.0 (Phase 66)
- [ ] Translate agents, rules, references to English — v6.0 (Phase 67)
- [ ] Translate templates, docs, root MD files to English — v6.0 (Phase 68)
- [ ] Translate JS source code + update test assertions — v6.0 (Phase 69)
- [ ] Final verification: zero Vietnamese remaining + full test suite pass — v6.0 (Phase 70)

### Out of Scope

- Rewriting skills from scratch — improve existing, don't replace
- Breaking changes to skill names or invocation flow — maintain backward compatibility
- Adding new platform targets — focus on improving existing workflow quality
- New framework rules — focus on optimizing the workflow engine, not adding more rules
- Code-level verification — plan checker only checks plan documents, not code
- LLM-as-judge review — plan already in context, calling another LLM is circular

## Current Milestone: v6.0 Vietnamese → English Migration

**Goal:** Convert all Vietnamese text to English across the entire project, excluding `.planning/`.

**Target features:**
- **Skills + Config Foundation:** Translate 14 skill files + CLAUDE.md, regenerate 56 auto-generated snapshots.
- **Workflow Translation:** Translate 13 workflow files (3,610 lines total).
- **Agents + Rules + References:** Translate agent definitions, coding rules, and reference docs.
- **Templates + Docs + Root Files:** Translate template files, documentation, and root markdown files.
- **JS Source + Tests:** Update Vietnamese strings in JS source code and synchronize test assertions.
- **Final Verification:** Comprehensive grep sweep, full test suite, human review.

## Current State

**Current:** v6.0 Vietnamese → English Migration — DEFINING (2026-03-28)
**Shipped:** v5.1 Agent Sync & Reference Update (2026-03-27), v5.0 Repo Optimization (2026-03-27)
**Previous:** v4.0 OWASP Security Audit (2026-03-27), v3.0 Research Squad (2026-03-26)

v5.1 delivered: Agent Consolidation (16 agents into commands/pd/agents/), Symlink Architecture (16 symlinks), Reference Migration, Format Standardization, Registry & Test Updates.

Tech stack: Node.js (pure scripts, no bundler), 5 platform converters, 14 skills, 13 workflows, 29 JS library modules.

## Constraints

- **Backward Compatibility**: Skill names, invocation patterns, and overall flow must remain stable — users have existing installations
- **Platform Support**: Changes must work across all 5 supported platforms after transpilation
- **No Build Step**: Project uses pure Node.js/Python scripts, no bundler — keep it that way
- **Node.js 16.7+**: Minimum Node.js version must be maintained

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Audit + implement in same cycle | User wants concrete improvements, not just a report | ✓ Good — shipped 9 phases in 1 day |
| Keep backward compatibility | Active user base with existing installations | ✓ Good — all 5 platform outputs verified identical |
| Optimize all token vectors | Prompt size, tool calls, and lazy loading all contribute to cost | ✓ Good — 30.6% compression + 12,549 lazy tokens |
| Parallel execution priority | User specifically requested parallel tasks for speed | ✓ Good — wave-based execution with conflict detection |
| Template method over class inheritance | Codebase uses pure functions, no classes | ✓ Good — base.js config-driven, easy to extend |
| Snapshot testing for converter refactoring | 48 comparisons guarantee zero behavioral regression | ✓ Good — caught no regressions, high confidence |
| Pure functions for plan checker | No file I/O in check functions — content passed as args | ✓ Good — testable, composable, no side effects |
| Historical validation gate (D-17) | Zero false positives on all 22 v1.0 plans required | ✓ Good — caught regressions early, built confidence |
| Dynamic PASS table over hardcoded | Future checks auto-included via name mapping | ✓ Good — Phase 13 was needed to fix Phase 11's hardcoded table |
| Audit + fix in same milestone (v1.2) | Scan first (Phase 14-15), fix after (Phase 16) | ✓ Good — found 27 issues, fixed 22, deferred 5 with docs |
| CLI wrapper for plan-check | Separate file I/O from library logic | ✓ Good — bin/plan-check.js reads files, calls library |
| Defer re-export cleanup to v2.0 | COPILOT/GEMINI_TOOL_MAP re-exports are harmless | ✓ Good — low risk, tracked as tech debt |
| Buoc 1.7 ~100 token budget | Keep logic validation concise, not verbose | ✓ Good — bullet paraphrase format effective |
| Buoc 6.5 before code fix | Correct Truth before fixing code prevents drift | ✓ Good — logic stays in sync with implementation |
| CHECK-05 default WARN severity | Orphan tasks are tech debt, not blockers | ✓ Good — configurable per project needs |
| Pure function pattern for all v1.4 modules | No file I/O in library code — content passed as args | ✓ Good — testable, composable, consistent with plan-checker |
| Section-specific Mermaid replacement | Avoid cross-section pollution in template fill | ✓ Good — Section 3 (TD) and Section 4 (LR) never mix |
| Non-blocking pipeline for report generation | Milestone completion must never fail due to report errors | ✓ Good — try/catch per sub-step, warnings only |
| External module for v1.5 features (D-02) | fix-bug.md at 419/420 line limit — cannot inline | ✓ Good — logic-sync.js orchestrates 3 features in 1 call |
| Diff-based heuristics over AST (D-08) | Regex on diff sufficient for v1.5, AST deferred to v2 | ✓ Good — 4 signal types cover common cases |
| Non-blocking for cleanup + security + logic sync | User workflow must never be blocked by optional features | ✓ Good — consistent non-blocking pattern across 9a and 10a |
| 1 template + 1 YAML thay 13 scanner files | DRY, dễ bảo trì, mở rộng bằng YAML | ✓ Good — giảm 13 files thành 2, cùng chức năng |
| Pure functions cho tất cả v4.0 modules | TDD, no side effects, composable | ✓ Good — smart-selection, session-delta, gadget-chain đều testable |
| Security gate non-blocking | Không chặn workflow, chỉ cảnh báo | ✓ Good — phù hợp với triết lý "khuyến nghị, không ép buộc" |
| Path source of truth: audit.md B9 | .planning/audit/SECURITY_REPORT.md | ✓ Good — thống nhất sau gap closure 51-02 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-28 after v6.0 Vietnamese → English Migration milestone started*
