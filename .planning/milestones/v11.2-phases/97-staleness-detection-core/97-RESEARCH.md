---
name: STALE-01 Research
description: Research patterns for staleness detection implementation
type: research
phase: 97
---

# Phase 97 Research: Staleness Detection Patterns

## Domain Understanding

Staleness detection for codebase maps requires comparing git state between when the map was created and current HEAD.

## Key Technical Decisions

### Git Commands for Commit Delta

```bash
# Get current commit SHA
git rev-parse HEAD
# Returns: abc123def456...

# Count commits between two SHAs
git rev-list --count <old-sha>..<old-sha>
# Returns: integer count
```

### Implementation Pattern

Following existing pattern in `bin/lib/progress-tracker.js`:
- Pure utility function
- Sync API using `child_process.execSync`
- No external dependencies
- Return structured object

### Testing Approach

Mock `child_process` module to avoid flaky tests dependent on actual git history:
- Use `jest.mock('child_process')` or proxyquire
- Test boundary conditions (exactly at threshold)
- Test error cases (invalid commit SHA)

## Schema Design

```javascript
/**
 * @typedef {Object} StalenessResult
 * @property {boolean} isStale - Whether map exceeds staleness threshold
 * @property {number} commitDelta - Number of commits since last mapping
 * @property {number} threshold - Configurable threshold (default: 20)
 * @property {string} lastMappedCommit - SHA when map was created
 * @property {string} currentCommit - Current HEAD SHA
 * @property {string} level - 'fresh' | 'aging' | 'stale'
 * @property {string} recommendation - Human-readable suggestion
 */
```

## Error Handling

- Invalid commit SHA: Return error result with `isStale: null`
- Not a git repo: Return error result
- Git command failure: Wrap and return structured error

## References

- Existing pattern: `bin/lib/progress-tracker.js`
- Similar tests: `test/progress-tracker.test.js`
