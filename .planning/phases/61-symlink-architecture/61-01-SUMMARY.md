---
phase: 61-symlink-architecture
plan: 01
subsystem: agents
tags: [symlink, agents, centralization]

requires: [60-01]
provides:
  - 16 symlinks trong .claude/agents/ trỏ đến commands/pd/agents/
affects: [agent-loading, smoke-tests]

tech-stack:
  added: []
  patterns: [relative-symlink]

key-files:
  created:
    - .claude/agents/pd-sec-fixer.md (symlink mới)
    - .claude/agents/pd-sec-reporter.md (symlink mới)
  modified:
    - .claude/agents/pd-bug-janitor.md (file thật → symlink)
    - .claude/agents/pd-code-detective.md (file thật → symlink)
    - .claude/agents/pd-codebase-mapper.md (file thật → symlink)
    - .claude/agents/pd-doc-specialist.md (file thật → symlink)
    - .claude/agents/pd-evidence-collector.md (file thật → symlink)
    - .claude/agents/pd-fact-checker.md (file thật → symlink)
    - .claude/agents/pd-feature-analyst.md (file thật → symlink)
    - .claude/agents/pd-fix-architect.md (file thật → symlink)
    - .claude/agents/pd-planner.md (file thật → symlink)
    - .claude/agents/pd-regression-analyzer.md (file thật → symlink)
    - .claude/agents/pd-repro-engineer.md (file thật → symlink)
    - .claude/agents/pd-research-synthesizer.md (file thật → symlink)
    - .claude/agents/pd-sec-scanner.md (file thật → symlink)
    - .claude/agents/pd-security-researcher.md (file thật → symlink)

key-decisions:
  - "Dùng relative symlinks (../../commands/pd/agents/) thay vì absolute paths"
  - "Symlink cả 16 agents bao gồm 2 file chỉ có ở commands/ (pd-sec-fixer, pd-sec-reporter)"

patterns-established:
  - "Source of truth tại commands/pd/agents/, .claude/agents/ chỉ chứa symlinks"

requirements-completed: [SYML-01, SYML-02]

duration: 1min
completed: 2026-03-27
---

# Phase 61: Symlink Architecture Summary

**Thay 14 file thật bằng symlinks + tạo 2 symlinks mới, tổng 16 symlinks trong `.claude/agents/` trỏ về `commands/pd/agents/`.**

## Performance

- **Duration:** 1 min
- **Tasks:** 2/2 completed
- **Files modified:** 16 (14 chuyển file→symlink, 2 symlink mới)

## Accomplishments
- Xoá 14 file thật trong `.claude/agents/`
- Tạo 16 relative symlinks trỏ `../../commands/pd/agents/{name}.md`
- 3 test thực tế đều pass:
  - Test 1: readlink resolve đúng target cho 16/16
  - Test 2: nội dung qua symlink khớp file gốc 16/16
  - Test 3: smoke-agent-files.test.js — 26/26 pass
- 2 symlinks mới: pd-sec-fixer.md, pd-sec-reporter.md (trước đây không có trong .claude/agents/)

## Task Commits

1. **Task 1: Tạo 16 relative symlinks** — `c81ce5a` (feat)
2. **Task 2: Verify symlinks** — verification only, no commit needed
