---
phase: 67-agents-rules-references
plan: 01
subsystem: commands/pd/agents, commands/pd/rules
tags: [translation, agents, rules, english-migration]
dependency-graph:
  requires: [65-01]
  provides: [TRANS-04, TRANS-05]
  affects: [test/smoke-snapshot, test/smoke-integrity]
tech-stack:
  added: []
  patterns: [temp-file-mv-strategy]
key-files:
  created: []
  modified:
    - commands/pd/agents/pd-bug-janitor.md
    - commands/pd/agents/pd-code-detective.md
    - commands/pd/agents/pd-doc-specialist.md
    - commands/pd/agents/pd-fix-architect.md
    - commands/pd/agents/pd-repro-engineer.md
    - commands/pd/agents/pd-codebase-mapper.md
    - commands/pd/agents/pd-evidence-collector.md
    - commands/pd/agents/pd-fact-checker.md
    - commands/pd/agents/pd-feature-analyst.md
    - commands/pd/agents/pd-planner.md
    - commands/pd/agents/pd-regression-analyzer.md
    - commands/pd/agents/pd-research-synthesizer.md
    - commands/pd/agents/pd-sec-fixer.md
    - commands/pd/agents/pd-sec-reporter.md
    - commands/pd/agents/pd-sec-scanner.md
    - commands/pd/agents/pd-security-researcher.md
    - commands/pd/rules/general.md
    - commands/pd/rules/nestjs.md
    - commands/pd/rules/nextjs.md
    - commands/pd/rules/wordpress.md
    - commands/pd/rules/flutter.md
    - commands/pd/rules/solidity.md
    - commands/pd/rules/solidity-refs/audit-checklist.md
    - commands/pd/rules/solidity-refs/templates.md
decisions:
  - "Language convention in general.md updated from Vietnamese to English"
  - "Commit messages translated from Vietnamese tags to English tags"
  - "agent rules updated from Vietnamese to English"
metrics:
  duration: "12m 23s"
  completed: "2026-03-28"
---

# Phase 67 Plan 01: Translate Agents and Rules Files Summary

**One-liner:** Full Vietnamese-to-English translation of 16 agent definition files and 8 coding rules files with zero diacritics remaining

## What Was Done

### Task 1: Translate 16 agent files to English
- Translated all 5 files with diacritical Vietnamese: pd-bug-janitor, pd-code-detective, pd-doc-specialist, pd-fix-architect, pd-repro-engineer
- Translated all 11 files with non-diacritical Vietnamese: pd-codebase-mapper, pd-evidence-collector, pd-fact-checker, pd-feature-analyst, pd-planner, pd-regression-analyzer, pd-research-synthesizer, pd-sec-fixer, pd-sec-reporter, pd-sec-scanner, pd-security-researcher
- Preserved: frontmatter keys (name, tools, model, maxTurns, effort), XML tags, tool names, file paths, @references, placeholder variables
- Standardized terminology: "Nguyên nhân" → "Root Cause", "Bằng chứng" → "Evidence", "Đề xuất" → "Suggestion", section headers translated consistently
- Commit: ec5d76d

### Task 2: Translate 8 rules files to English
- general.md: Updated language convention from "TIẾNG VIỆT CÓ DẤU" to "ENGLISH", status icons translated, all section headers translated
- nestjs.md, nextjs.md, wordpress.md, flutter.md: Framework-specific rules translated, preserving framework identifiers
- solidity.md: Smart contract rules translated, preserving Solidity keywords and security patterns
- solidity-refs/audit-checklist.md: Full 113-line audit checklist translated, preserving code blocks verbatim
- solidity-refs/templates.md: Contract templates translated, preserving all Solidity code blocks
- Commit: 543eebd

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Verification Results

- `grep -rn '[diacritics]' commands/pd/agents/` → zero matches
- `grep -rn '[diacritics]' commands/pd/rules/` → zero matches
- `find commands/pd/agents/ -name '*.md' | wc -l` → 16
- `find commands/pd/rules/ -name '*.md' | wc -l` → 8
- pd-bug-janitor.md contains `name: pd-bug-janitor` (unchanged)
- pd-bug-janitor.md contains `<objective>` (preserved)
- general.md contains `## Code style` (translated)
- general.md contains `Status:` pattern (translated from `Trạng thái:`)
- general.md does NOT contain "TIẾNG VIỆT CÓ DẤU"

## Self-Check: PASSED

- [x] commands/pd/agents/pd-bug-janitor.md exists
- [x] commands/pd/agents/pd-sec-scanner.md exists
- [x] commands/pd/rules/general.md exists
- [x] commands/pd/rules/solidity-refs/audit-checklist.md exists
- [x] Commit ec5d76d exists
- [x] Commit 543eebd exists
