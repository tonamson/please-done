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
- ✓ Skills + Config Foundation — 14 skill files + CLAUDE.md translated, 56 snapshots regenerated — v6.0 (Phase 65)
- ✓ Workflow Translation — 13 workflow files (3,610 lines) translated to English — v6.0 (Phase 66)
- ✓ Agents + Rules + References — 39 agent/rules/reference files translated — v6.0 (Phase 67)
- ✓ Templates + Docs + Root Files — 41 files (templates, docs, root MDs, evals) translated — v6.0 (Phase 68)
- ✓ JS Source Code + Tests — 33 JS source files translated, 12 test files synced — v6.0 (Phase 69)
- ✓ Final Verification — Zero Vietnamese outside .planning/, 1101/1102 tests pass — v6.0 (Phase 70)
- ✓ **TEST-01**: Standalone test flow — `pd:test --standalone` mode — v7.0 (Phase 71)
- ✓ **TEST-02**: Conditional guards — bypass task/CONTEXT.md in standalone mode — v7.0 (Phase 71)
- ✓ **TEST-03**: State-machine sync — new prerequisites row + side branch for standalone — v7.0 (Phase 73)
- ✓ **TEST-04**: what-next integration — detect standalone test reports and standalone bugs — v7.0 (Phase 74)
- ✓ **TEST-05**: complete-milestone sync — skip standalone bugs during milestone completion — v7.0 (Phase 74)
- ✓ **TEST-06**: Recovery path — detect interrupted standalone sessions, resume or rewrite — v7.0 (Phase 75)
- ✓ **LOG-01**: Agent Error Structured Logging — log-writer.js với structured JSONL, 16 skills wired — v11.0 (Phase 88-89)
- ✓ **STATUS-01**: Status Dashboard Core — read-only dashboard với auto-refresh, staleness detection — v11.0 (Phase 90-91)
- ✓ **ONBOARD-01**: Auto-Onboarding Skill — pd:onboard với CONTEXT.md generation, 35 doc mappings — v11.0 (Phase 92-94)
- ✓ **LINT-01**: Lint Fail Recovery — progress-tracker.js, 3-strike threshold, soft guards — v11.0 (Phase 95-96)
- ✓ **STALE-01**: Codebase Mapper Staleness — staleness-detector.js với 3-level detection — v11.0 (Phase 97-98)
- ✓ **INTEG-01**: Integration Contract Tests — contract test foundation cho skill chain — v11.0 (Phase 99)

### Active (v11.0)

- [ ] **LOG-01**: Agent error structured logging — JSONL at `.planning/logs/agent-errors.jsonl` (timestamp, level, phase, step, agent, error) — Phase 88-89
- [ ] **STATUS-01**: pd:status dashboard — view current phase, plan, pending tasks, blockers at a glance (read-only Haiku skill) — Phase 90-91
- [ ] **ONBOARD-01**: pd:onboard skill — auto-orient AI to unfamiliar codebase (calls init+scan internally, creates PROJECT.md baseline) — Phase 92-94
- [ ] **LINT-01**: 3-strike lint fail recovery — save lint_fail_count to PROGRESS.md, suggest pd:fix-bug, resume-only-lint mode — Phase 95-96
- [ ] **STALE-01**: Codebase mapper staleness detection — git commit-delta >20 triggers refresh; maps store `Mapped at commit: [sha]` — Phase 97-98
- [ ] **INTEG-01**: Integration contract tests — verify CONTEXT.md/TASKS.md/PROGRESS.md schema contracts across skill chain — Phase 99-100

### Deferred (Future Milestones)

- ⏸ **REPLAY-01**: pd:replay skill — re-run a failed phase with context *(depends on LOG-01 stable ≥1 milestone)*
- ⏸ **DIFF-01**: pd:diff-milestone — compare two milestone archive outputs *(depends on archive format definition)*
- ⏸ **HOTREL-01**: Hot-reload config.json — *(already ~80% free; zero documented user blockers)*

### Out of Scope

- Rewriting skills from scratch — improve existing, don't replace
- Breaking changes to skill names or invocation flow — maintain backward compatibility
- Adding new platform targets — focus on improving existing workflow quality
- New framework rules — focus on optimizing the workflow engine, not adding more rules
- Code-level verification — plan checker only checks plan documents, not code
- LLM-as-judge review — plan already in context, calling another LLM is circular

## Current Milestone: v11.1 Documentation Improvements

**Goal:** Cải thiện tài liệu hướng dẫn sử dụng các command skill hiện có trong repo để developer dễ dàng sử dụng.

**Target features:**
- Cải thiện README.md với hướng dẫn sử dụng rõ ràng cho các skill chính
- Tạo command cheat sheet nhanh cho các lệnh thường dùng
- Cập nhật CLAUDE.md với ví dụ sử dụng thực tế
- Tạo text-based walkthrough guides cho workflow phổ biến
- Cải thiện error messages để user biết cách khắc phục

**Status:** Defining requirements

**Scope:** 4-6 requirements, 4-6 phases, ~4-6 plans

## Previous Milestone: v11.0 Developer Tooling & Observability

**Shipped:** 2026-04-04 | **Phases:** 12 (88-99) | **Plans:** 12

**Key accomplishments:**
- Agent Error Structured Logging (LOG-01) — log-writer.js với JSONL
- Status Dashboard Core (STATUS-01) — read-only dashboard
- Auto-Onboarding Skill (ONBOARD-01) — pd:onboard với CONTEXT.md
- Lint Fail Recovery (LINT-01) — progress-tracker.js
- Staleness Detection (STALE-01) — staleness-detector.js
- Contract Test Foundation (INTEG-01) — schema validation

## Current State

**Current:** v11.1 — started 2026-04-04  
**Shipped:** v10.0 Skill Repo Audit Fixes (2026-04-03), v9.0 Bug Audit & Robustness (2026-04-03), v8.0 Developer Experience & Quality Hardening (2026-04-03)  
**Previous:** v7.0 Standalone Test Mode (2026-04-02), v6.0 Vietnamese → English Migration (2026-03-29), v5.1 Agent Sync & Reference Update (2026-03-27)

v11.0 scope: Developer tooling & observability — logs, status, onboarding, lint recovery, staleness detection, contract tests. 6 requirements, 15 phases, ~20-25 plans.

Tech stack: Node.js (pure scripts, no bundler), 5 platform converters, 16 skills, 15 workflows, 31 JS library modules, ~27,500+ LOC JavaScript.

## Constraints

- **Backward Compatibility**: Skill names, invocation patterns, and overall flow must remain stable — users have existing installations
- **Platform Support**: Changes must work across all 5 supported platforms after transpilation
- **No Build Step**: Project uses pure Node.js/Python scripts, no bundler — keep it that way
- **Node.js 16.7+**: Minimum Node.js version must be maintained

## Key Decisions

| Decision                                         | Rationale                                                        | Outcome                                                            |
| ------------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| Audit + implement in same cycle                  | User wants concrete improvements, not just a report              | ✓ Good — shipped 9 phases in 1 day                                 |
| Keep backward compatibility                      | Active user base with existing installations                     | ✓ Good — all 5 platform outputs verified identical                 |
| Optimize all token vectors                       | Prompt size, tool calls, and lazy loading all contribute to cost | ✓ Good — 30.6% compression + 12,549 lazy tokens                    |
| Parallel execution priority                      | User specifically requested parallel tasks for speed             | ✓ Good — wave-based execution with conflict detection              |
| Template method over class inheritance           | Codebase uses pure functions, no classes                         | ✓ Good — base.js config-driven, easy to extend                     |
| Snapshot testing for converter refactoring       | 48 comparisons guarantee zero behavioral regression              | ✓ Good — caught no regressions, high confidence                    |
| Pure functions for plan checker                  | No file I/O in check functions — content passed as args         | ✓ Good — testable, composable, no side effects                     |
| Historical validation gate (D-17)                | Zero false positives on all 22 v1.0 plans required               | ✓ Good — caught regressions early, built confidence                |
| Dynamic PASS table over hardcoded                | Future checks auto-included via name mapping                     | ✓ Good — Phase 13 was needed to fix Phase 11's hardcoded table     |
| Audit + fix in same milestone (v1.2)             | Scan first (Phase 14-15), fix after (Phase 16)                   | ✓ Good — found 27 issues, fixed 22, deferred 5 with docs           |
| CLI wrapper for plan-check                       | Separate file I/O from library logic                             | ✓ Good — bin/plan-check.js reads files, calls library              |
| Defer re-export cleanup to v2.0                  | COPILOT/GEMINI_TOOL_MAP re-exports are harmless                  | ✓ Good — low risk, tracked as tech debt                            |
| Buoc 1.7 ~100 token budget                       | Keep logic validation concise, not verbose                       | ✓ Good — bullet paraphrase format effective                        |
| Buoc 6.5 before code fix                         | Correct Truth before fixing code prevents drift                  | ✓ Good — logic stays in sync with implementation                   |
| CHECK-05 default WARN severity                   | Orphan tasks are tech debt, not blockers                         | ✓ Good — configurable per project needs                            |
| Pure function pattern for all v1.4 modules       | No file I/O in library code — content passed as args             | ✓ Good — testable, composable, consistent with plan-checker        |
| Section-specific Mermaid replacement             | Avoid cross-section pollution in template fill                   | ✓ Good — Section 3 (TD) and Section 4 (LR) never mix               |
| Non-blocking pipeline for report generation      | Milestone completion must never fail due to report errors        | ✓ Good — try/catch per sub-step, warnings only                     |
| External module for v1.5 features (D-02)         | fix-bug.md at 419/420 line limit — cannot inline                 | ✓ Good — logic-sync.js orchestrates 3 features in 1 call           |
| Diff-based heuristics over AST (D-08)            | Regex on diff sufficient for v1.5, AST deferred to v2            | ✓ Good — 4 signal types cover common cases                         |
| Non-blocking for cleanup + security + logic sync | User workflow must never be blocked by optional features         | ✓ Good — consistent non-blocking pattern across 9a and 10a         |
| 1 template + 1 YAML instead of 13 scanner files  | DRY, easier maintenance, YAML-driven extension                   | ✓ Good — reduced 13 files to 2, same functionality                 |
| Pure functions for all v4.0 modules              | TDD, no side effects, composable                                 | ✓ Good — smart-selection, session-delta, gadget-chain all testable |
| Security gate non-blocking                       | Don't block workflow, just warn                                  | ✓ Good — aligns with "recommend, don't enforce" philosophy         |
| Path source of truth: audit.md B9                | .planning/audit/SECURITY_REPORT.md                               | ✓ Good — unified after gap closure 51-02                           |
| Translation-only migration (v6.0)                | Language-only change, no structural or behavioral modifications  | ✓ Good — zero regressions, all tests pass                          |
| .planning/ excluded from translation             | Planning artifacts are internal, can stay Vietnamese             | ✓ Good — reduced scope significantly, preserved history            |

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

_Last updated: 2026-04-03 — v11.0 started: Developer Tooling & Observability (6 requirements, 15 phases)_
