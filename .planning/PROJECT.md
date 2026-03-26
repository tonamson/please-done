# Please-Done Workflow Optimization

## What This Is

Please-Done is a cross-platform AI coding skill framework that transpiles workflow skills from Claude Code format to multiple platforms (Codex, Gemini, OpenCode, Copilot). The project provides a complete skill lifecycle (init → scan → plan → write-code → test → fix-bug → complete) with multi-framework rules (NestJS, Next.js, WordPress, Flutter, Solidity), token-optimized prompts, wave-based parallel execution, library-aware code generation via Context7, automated plan quality checking with truth-driven enforcement, verified end-to-end workflow logic with logic re-validation before code changes, automated Mermaid diagram generation with PDF report export, an enhanced fix-bug workflow with automated investigation, and a research squad system with structured evidence storage, anti-hallucination audit trails, and automated research pipelines (Evidence Collector → INDEX.md → Fact Checker cross-validation).

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

### Active

- [ ] Lệnh `pd:audit` (skill + workflow) với 2 chế độ: Độc lập + Tích hợp milestone
- [ ] Template agent `pd-sec-scanner.md` + `security-rules.yaml` (1 template → 13 OWASP categories)
- [ ] Reporter agent `pd-sec-reporter.md` tổng hợp SECURITY_REPORT.md
- [ ] Smart Scanner Selection — phân tích ngữ cảnh tự chọn scanner liên quan
- [ ] Session Delta — đối soát phiên cũ (KNOWN-UNFIXED / RE-VERIFY / NEW)
- [ ] POC pipeline (đơn lẻ + Gadget Chain) khi dùng --poc
- [ ] Function-Level Checklist evidence format
- [ ] Batch execution waves (tối đa 2 instance song song)
- [ ] Tự động tạo fix phases theo gadget chain order (chế độ milestone)
- [ ] Tích hợp: security gate trong complete-milestone, what-next priority, state-machine update
- [ ] Template `security-fix-phase.md` cho fix phases tự động
- [ ] FastCode MCP integration (tool-first, AI-last)

## Current Milestone: v4.0 OWASP Security Audit

**Goal:** Thêm lệnh `pd:audit` quét bảo mật OWASP Top 10 với template agent dispatch, smart scanner selection, session delta, POC/gadget chain analysis, và tích hợp milestone workflow.

**Target features:**
- Lệnh `pd:audit` (skill + workflow) với 2 chế độ: Độc lập + Tích hợp milestone
- Template agent `pd-sec-scanner.md` + `security-rules.yaml` (1 template → 13 OWASP categories)
- Reporter agent `pd-sec-reporter.md` tổng hợp SECURITY_REPORT.md
- Smart Scanner Selection — phân tích ngữ cảnh tự chọn scanner liên quan
- Session Delta — đối soát phiên cũ (KNOWN-UNFIXED / RE-VERIFY / NEW)
- POC pipeline (đơn lẻ + Gadget Chain) khi dùng --poc
- Function-Level Checklist evidence format
- Batch execution waves (tối đa 2 instance song song)
- Tự động tạo fix phases theo gadget chain order (chế độ milestone)
- Tích hợp: security gate trong complete-milestone, what-next priority, state-machine update
- Template `security-fix-phase.md` cho fix phases tự động
- FastCode MCP integration (tool-first, AI-last)

### Out of Scope

- Rewriting skills from scratch — improve existing, don't replace
- Breaking changes to skill names or invocation flow — maintain backward compatibility
- Adding new platform targets — focus on improving existing workflow quality
- New framework rules — focus on optimizing the workflow engine, not adding more rules
- Code-level verification — plan checker only checks plan documents, not code
- LLM-as-judge review — plan already in context, calling another LLM is circular

## Current State

**Current:** v4.0 OWASP Security Audit (started 2026-03-26)
**Shipped:** v3.0 Research Squad (2026-03-26)
**Previous:** v2.1 Detective Orchestrator (2026-03-25), v1.5 Nang cap Skill Fix-Bug (2026-03-24)

v3.0 added: Research Squad — research-store.js (7 pure functions), 3 audit modules (confidence-scorer, audit-logger, index-generator), 2 research agents (Evidence Collector + Fact Checker), 3 workflow guards (CHECK-06, CHECK-07, Strategy Injection), pd:research command with auto-routing pipeline. 8 phases, 14 plans, 115 files modified, +14,504 net LOC.

Tech stack: Node.js (pure scripts, no bundler), 5 platform converters, 13 skills, 11 workflows, 22 JS library modules.

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
*Last updated: 2026-03-26 after v4.0 OWASP Security Audit milestone started*
