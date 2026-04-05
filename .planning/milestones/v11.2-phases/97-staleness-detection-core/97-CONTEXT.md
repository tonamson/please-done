---
name: STALE-01 Staleness Detection Core
description: Create staleness detection for codebase maps
type: context
phase: 97
---

# Phase 97: STALE-01 — Staleness Detection Core

## Goal
Create staleness detection for codebase maps that identifies when maps are outdated relative to git history.

## Gray Areas Decided

### Detection Criteria
**Decision:** Staleness is determined by commit count delta, not time.

- **Threshold:** 20 commits since last mapping
- **Rationale:** Commit frequency varies; commit count is more reliable than timestamps
- **Scope:** Check against the commit stored in map metadata (to be added in Phase 98)

### Output Format
**Decision:** Return structured object with score and recommendation.

```javascript
{
  isStale: boolean,        // true if delta > threshold
  commitDelta: number,     // actual commit count
  threshold: number,       // 20 (configurable)
  lastMappedCommit: string, // sha from metadata
  currentCommit: string,   // HEAD
  recommendation: string     // human-readable suggestion
}
```

### Git Integration
**Decision:** Use child_process to run git commands.

- `git rev-parse HEAD` — get current commit
- `git rev-list --count [lastMapped]..HEAD` — count commits since mapping
- Pure function: accepts lastMappedCommit as parameter, returns analysis

### Testing Strategy
**Decision:** Mock git responses for unit tests.

- Don't test actual git history (flaky, environment-dependent)
- Mock `execSync` to return predetermined values
- Test edge cases: exactly 20 commits, 21 commits, 0 commits

### Staleness Levels
**Decision:** Three-tier staleness classification.

| Delta | Level | Action |
|-------|-------|--------|
| 0-19 | fresh | None |
| 20-49 | aging | Suggest refresh |
| 50+ | stale | Strong recommendation |

## Implementation Boundaries

### In Scope
- Pure function in `bin/lib/staleness-detector.js`
- Commit delta calculation
- Staleness score computation
- Recommendation message generation
- Unit tests with mocked git

### Out of Scope (Phase 98)
- Reading/writing map metadata
- Auto-refresh workflow
- Integration with `pd:map-codebase`
- Status dashboard UI

## Constraints
- Must be pure function (no side effects)
- No external dependencies beyond Node.js built-ins
- Synchronous API (matches existing patterns)
- TypeJSDoc comments for IDE support

## Deferred Ideas
- Time-based staleness check (commit count is more reliable)
- File-specific staleness (overkill for current use case)
- Configurable threshold per map type (can add later if needed)

## References
- Existing pattern: `bin/lib/progress-tracker.js` for similar utilities
- Requirements: `.planning/REQUIREMENTS.md` section STALE-01
