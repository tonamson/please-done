# Please-Done Workflow Optimization

## What This Is

Please-Done is a cross-platform AI coding skill framework that transpiles workflow skills from Claude Code format to multiple platforms (Codex, Gemini, OpenCode, Copilot). The project provides a complete skill lifecycle (init → scan → plan → write-code → test → fix-bug → complete) with multi-framework rules (NestJS, Next.js, WordPress, Flutter, Solidity), token-optimized prompts, wave-based parallel execution, library-aware code generation via Context7, and automated plan quality checking before execution.

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

### Active

None — v1.2 milestone complete.

### Recently Validated (v1.2)

- [x] Audit toàn bộ 12 skills và 10 workflows tìm logic gaps, lỗi tiềm ẩn — Validated in Phase 14
- [x] Verify workflow new-milestone end-to-end logic — Validated in Phase 15
- [x] Verify workflow write-code end-to-end logic — Validated in Phase 15
- [x] Verify workflow fix-bug end-to-end logic — Validated in Phase 15
- [x] Đảm bảo snapshots/converters sync với source files hiện tại — Validated in Phase 16 (48/48 match)
- [x] Fix tất cả bugs phát hiện được — Validated in Phase 16 (448 tests pass, 0 failures)

### Out of Scope

- Rewriting skills from scratch — improve existing, don't replace
- Breaking changes to skill names or invocation flow — maintain backward compatibility
- Adding new platform targets — focus on improving existing workflow quality
- New framework rules — focus on optimizing the workflow engine, not adding more rules
- Code-level verification — plan checker only checks plan documents, not code
- LLM-as-judge review — plan already in context, calling another LLM is circular

## Current Milestone: v1.2 Skill Audit & Bug Fixes

**Goal:** Audit toàn diện bộ skill/workflow hiện tại, tìm và fix lỗi tiềm ẩn, verify logic gaps trong các workflow chính (new-milestone, write-code, fix-bug)

**Target features:**
- Scan 12 skills + 10 workflows tìm logic gaps, dead code, sai logic
- Verify 3 workflow chính (new-milestone, write-code, fix-bug) end-to-end
- Đảm bảo converter snapshots sync với source
- Fix tất cả bugs phát hiện được

## Context

Shipped v1.0 with 303 tests, 125 files modified, +12,706 net LOC.
Shipped v1.1 with 140 plan checker tests, 68 files modified, +2,630 net LOC.
Tech stack: Node.js (pure scripts, no bundler), 5 platform converters, 12 skills, 10 workflows.

Post-v1.1 state:
- Plan checker with 7 structural checks runs automatically in plan workflow
- 140 tests with zero false positives on 22 historical plans
- 48 converter snapshot tests ensuring cross-platform consistency
- Total test count: 443+ across all test suites

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
*Last updated: 2026-03-23 after v1.2 milestone started*
