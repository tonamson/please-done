# v11.0 Requirements: Developer Tooling & Observability

## Goal
Improve developer experience and observability across the Please-Done workflow with onboarding assistance, status dashboards, lint recovery, staleness detection, integration contracts, and structured logging.

## Requirements

### ONBOARD-01: Auto-Onboarding Skill
**Requirement:** Create `pd:onboard` skill that auto-orients AI to unfamiliar codebase  
**Details:**
- Calls `init` + `scan` internally
- Creates PROJECT.md baseline with stack detection
- Generates initial CONTEXT.md with key files
- Outputs onboarding summary with next steps

### STATUS-01: Status Dashboard Skill
**Requirement:** Create `pd:status` dashboard skill for read-only project overview  
**Details:**
- View current phase, plan, pending tasks, blockers
- Read-only skill (Haiku tier)
- Parses STATE.md, ROADMAP.md, TASKS.md
- Shows milestone progress and recent activity

### LINT-01: Lint Fail Recovery
**Requirement:** Implement 3-strike lint fail recovery system  
**Details:**
- Track lint_fail_count in PROGRESS.md
- After 3 failures, suggest `pd:fix-bug` workflow
- Add resume-only-lint mode to bypass planning
- Soft guard that guides rather than blocks

### STALE-01: Codebase Mapper Staleness Detection
**Requirement:** Detect when codebase maps are stale and trigger refresh  
**Details:**
- Compare git commit-delta >20 commits
- Maps store "Mapped at commit: [sha]" metadata
- Auto-refresh suggestion in status dashboard
- Non-blocking detection with user prompt

### INTEG-01: Integration Contract Tests
**Requirement:** Add contract tests for CONTEXT.md/TASKS.md/PROGRESS.md schemas  
**Details:**
- Verify schema consistency across skill chain
- Test all 12 skills produce valid artifacts
- Run in CI or as pre-commit hook
- Fail fast on schema violations

### LOG-01: Agent Error Structured Logging
**Requirement:** Implement structured JSONL logging for agent errors  
**Details:**
- Log to `.planning/logs/agent-errors.jsonl`
- Fields: timestamp, level, phase, step, agent, error
- Enable log analysis and debugging
- Non-blocking, write-only on errors

## Deferred (Future Milestones)

- **REPLAY-01**: pd:replay skill — re-run failed phase with context (depends on LOG-01 stable ≥1 milestone)
- **DIFF-01**: pd:diff-milestone — compare two milestone archive outputs (depends on archive format definition)
- **HOTREL-01**: Hot-reload config.json — (already ~80% free; zero documented user blockers)

## Success Criteria

1. All 6 requirements implemented and tested
2. New skills integrated into state machine
3. Zero regressions in existing functionality
4. Documentation updated for all new features
5. Observability improved: logs, status, onboarding

## Effort Estimate

**Size:** Medium (6 features, ~12-15 phases expected)  
**Complexity:** Medium-High (cross-cutting concerns: logging, status, contracts)  
**Risk:** Low (additive features, no breaking changes)
