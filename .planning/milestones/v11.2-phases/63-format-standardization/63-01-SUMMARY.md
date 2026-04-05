---
phase: 63-format-standardization
plan: 01
subsystem: agents
tags: [frontmatter, agents, standardization]

requires:
  - phase: 61-symlink-architecture
    provides: symlinks trỏ đến commands/pd/agents/

provides:
  - pd-sec-fixer.md và pd-sec-reporter.md với format mới (tools/model/maxTurns/effort)
  - Tất cả 16 agents dùng cùng frontmatter format

affects: [smoke-tests, agent-registry]

tech-stack:
  added: []
  patterns: [unified-agent-frontmatter]

key-files:
  created: []
  modified:
    - commands/pd/agents/pd-sec-fixer.md
    - commands/pd/agents/pd-sec-reporter.md
    - test/smoke-agent-files.test.js

key-decisions:
  - "Xóa tier + allowed-tools, thay bằng tools/model/maxTurns/effort theo TIER_MAP"
  - "Cập nhật test assertion từ tier: architect sang model: opus"

patterns-established:
  - "Tất cả agents dùng format: name, description, tools (comma-sep), model, maxTurns, effort"

requirements-completed: [AGNT-03]

duration: 2min
completed: 2026-03-27
---

# Phase 63: Format Standardization Summary

**Converted 2 security agents (pd-sec-fixer, pd-sec-reporter) từ legacy frontmatter sang format mới — tất cả 16 agents giờ dùng cùng format.**

## What was done

1. **pd-sec-fixer.md**: `tier: architect` + `allowed-tools` array → `tools: Read, Write, Glob, Grep`, `model: opus`, `maxTurns: 30`, `effort: high`
2. **pd-sec-reporter.md**: `tier: builder` + `allowed-tools` array → `tools: Read, Write, Glob`, `model: sonnet`, `maxTurns: 25`, `effort: medium`
3. **smoke-agent-files.test.js**: Updated assertion từ `tier: architect` → `model: opus`

## Verification

- `node --test test/smoke-agent-files.test.js`: 26/26 pass, 0 fail
- Zero `allowed-tools` hoặc `^tier:` references trong 2 agent files
