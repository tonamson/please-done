---
phase: 28-agent-infrastructure-resource-rules
plan: 02
subsystem: infra
tags: [agent-files, claude-code-native, yaml-frontmatter, tier-mapping, integration-test]

# Dependency graph
requires:
  - phase: 28-01
    provides: "resource-config.js voi TIER_MAP, AGENT_REGISTRY, 5 exported functions"
provides:
  - "5 agent files tai .claude/agents/ theo Claude Code native format"
  - "Integration test verify agent files khop voi resource-config.js"
affects: [29, 30, 32, 33]

# Tech tracking
tech-stack:
  added: []
  patterns: [claude-code-native-agent-format, yaml-frontmatter-parsing, integration-test-disk-io]

key-files:
  created:
    - .claude/agents/pd-bug-janitor.md
    - .claude/agents/pd-code-detective.md
    - .claude/agents/pd-doc-specialist.md
    - .claude/agents/pd-repro-engineer.md
    - .claude/agents/pd-fix-architect.md
    - test/smoke-agent-files.test.js
  modified:
    - .claude/.gitignore

key-decisions:
  - "Cap nhat .claude/.gitignore de cho phep agents/*.md — gitignore goc ignore * trong .claude/"
  - "Tools field dung comma-separated string (Claude Code native), khong dung YAML array"
  - "parseAgentFrontmatter helper dung regex don gian, khong can js-yaml dependency"
  - "Bi-directional tool verification — kiem tra ca 2 chieu (file→registry va registry→file)"

patterns-established:
  - "Claude Code native agent format: YAML frontmatter (name, description, tools, model, maxTurns, effort) + markdown body"
  - "Integration test pattern: doc file tu disk + verify consistency voi hardcoded config"

requirements-completed: [ORCH-01]

# Metrics
duration: 2min
completed: 2026-03-24
---

# Phase 28 Plan 02: Agent Files Summary

**5 agent files tai .claude/agents/ voi Claude Code native YAML frontmatter (haiku/sonnet/opus) va 10 integration tests verify consistency voi resource-config.js**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-24T15:49:22Z
- **Completed:** 2026-03-24T15:52:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- 5 agent files tao tai .claude/agents/ voi dung tier mapping: Janitor+DocSpec = haiku, Detective+Repro = sonnet, Architect = opus
- YAML frontmatter co day du 6 fields: name, description, tools, model, maxTurns, effort
- Markdown body giu nguyen noi dung tu commands/pd/agents/ (objective, process, rules)
- 10 integration tests pass — verify existence, frontmatter, body, consistency voi resource-config.js, no-inherit

## Task Commits

Each task was committed atomically:

1. **Task 1: Tao 5 agent files tai .claude/agents/** - `5f9e519` (feat)
2. **Task 2: Integration test verify agent files khop voi resource-config.js** - `781773e` (test)

## Files Created/Modified
- `.claude/agents/pd-bug-janitor.md` — Scout agent (haiku, 15 turns, low effort)
- `.claude/agents/pd-code-detective.md` — Builder agent (sonnet, 25 turns, medium effort)
- `.claude/agents/pd-doc-specialist.md` — Scout agent (haiku, 15 turns, low effort)
- `.claude/agents/pd-repro-engineer.md` — Builder agent (sonnet, 25 turns, medium effort)
- `.claude/agents/pd-fix-architect.md` — Architect agent (opus, 30 turns, high effort)
- `test/smoke-agent-files.test.js` — 10 test cases: existence, 5 frontmatter, body, 2 consistency, no-inherit
- `.claude/.gitignore` — Them exception cho agents/*.md

## Decisions Made
- Cap nhat .claude/.gitignore de cho phep agents/*.md — gitignore goc co `*` ignore tat ca trong .claude/
- Tools field dung comma-separated string theo Claude Code native format, khong dung YAML array syntax
- parseAgentFrontmatter helper dung regex don gian `/^(\w+):\s*(.+)$/` — khong can them js-yaml dependency
- Bi-directional tool verification: kiem tra tools tu file co trong AGENT_REGISTRY VA nguoc lai

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Cap nhat .claude/.gitignore cho phep agent files**
- **Found during:** Task 1 (tao agent files)
- **Issue:** `.claude/.gitignore` co rule `*` ignore tat ca files, git add bi reject
- **Fix:** Them `!agents/` va `!agents/*.md` vao .claude/.gitignore
- **Files modified:** .claude/.gitignore
- **Verification:** git add thanh cong, 5 files staged
- **Committed in:** 5f9e519 (Task 1 commit)

**2. [Rule 3 - Blocking] Copy resource-config.js vao worktree**
- **Found during:** Task 2 (chay integration tests)
- **Issue:** resource-config.js tu Plan 01 chua merge vao worktree branch, tests fail voi MODULE_NOT_FOUND
- **Fix:** git show cca8911:bin/lib/resource-config.js de copy file vao worktree
- **Files modified:** bin/lib/resource-config.js (copy tu commit Plan 01)
- **Verification:** node --test test/smoke-agent-files.test.js — 10/10 pass
- **Committed in:** 781773e (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Ca 2 auto-fix can thiet de hoan thanh plan. Khong co scope creep.

## Issues Encountered
None — ngoai 2 blocking issues da auto-fix o tren.

## User Setup Required
None — khong can cau hinh dich vu ben ngoai.

## Next Phase Readiness
- 5 agent files san sang cho Claude Code runtime dispatch (Agent tool voi name parameter)
- Integration tests dam bao agent files va resource-config.js luon dong bo
- San sang cho Phase 29+ (workflow orchestrator) tich hop Agent tool calls

## Self-Check: PASSED

- [x] .claude/agents/pd-bug-janitor.md ton tai
- [x] .claude/agents/pd-code-detective.md ton tai
- [x] .claude/agents/pd-doc-specialist.md ton tai
- [x] .claude/agents/pd-repro-engineer.md ton tai
- [x] .claude/agents/pd-fix-architect.md ton tai
- [x] test/smoke-agent-files.test.js ton tai
- [x] Commit 5f9e519 ton tai
- [x] Commit 781773e ton tai
- [x] 10/10 agent tests pass
- [x] 29/29 resource-config tests pass (regression)

---
*Phase: 28-agent-infrastructure-resource-rules*
*Completed: 2026-03-24*
