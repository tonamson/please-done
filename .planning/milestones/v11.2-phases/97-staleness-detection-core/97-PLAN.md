---
name: STALE-01 Plan
description: Implementation plan for staleness detection core
type: plan
phase: 97
version: 1.0
---

# Phase 97 Plan: STALE-01 Staleness Detection Core

## Goal
Create `bin/lib/staleness-detector.js` with pure function for detecting codebase map staleness based on git commit delta.

## Architecture

```
┌─────────────────────────────────────────┐
│     bin/lib/staleness-detector.js      │
│  ┌─────────────────────────────────┐    │
│  │  detectStaleness(lastCommit)  │    │
│  │  ├─ getCurrentCommit()         │    │
│  │  ├─ countCommitsSince()        │    │
│  │  ├─ calculateLevel()           │    │
│  │  └─ generateRecommendation()   │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

## Implementation Plan

### Task 1: Create Staleness Detector Module

**File:** `bin/lib/staleness-detector.js`

**Requirements:**
- Pure function `detectStaleness(lastMappedCommit, options = {})`
- Default threshold: 20 commits
- Return structured result with isStale, commitDelta, level, recommendation
- Use `child_process.execSync` for git commands
- Handle errors gracefully

**API:**
```javascript
/**
 * Detect staleness of codebase map based on git commit delta
 * @param {string} lastMappedCommit - SHA when map was created
 * @param {Object} options
 * @param {number} options.threshold - Staleness threshold (default: 20)
 * @returns {StalenessResult}
 */
function detectStaleness(lastMappedCommit, options = {})
```

### Task 2: Create Unit Tests

**File:** `test/staleness-detector.test.js`

**Test Coverage:**
- [ ] Fresh state: 0 commits (level: 'fresh')
- [ ] Fresh state: 19 commits (level: 'fresh')
- [ ] Aging state: exactly 20 commits (level: 'aging')
- [ ] Aging state: 49 commits (level: 'aging')
- [ ] Stale state: 50 commits (level: 'stale')
- [ ] Stale state: 100+ commits (level: 'stale')
- [ ] Custom threshold override
- [ ] Invalid commit SHA handling
- [ ] Non-git repository handling
- [ ] Git command failure handling

**Mock Strategy:**
- Mock `child_process.execSync` to return predetermined values
- Mock current commit as 'abc123'
- Test commit delta by mocking rev-list count

### Task 3: Update Package Scripts (if needed)

**Check:** Ensure test file is picked up by `npm test`

## Success Criteria

1. ✅ `bin/lib/staleness-detector.js` exports pure function
2. ✅ Returns correct staleness level for all ranges
3. ✅ Unit tests achieve 90%+ coverage
4. ✅ All tests pass
5. ✅ No external dependencies added

## Test Commands

```bash
# Run specific tests
npm test -- test/staleness-detector.test.js

# Run all tests
npm test
```

## Notes

- Follow existing code style from `progress-tracker.js`
- Use TypeJSDoc comments for IDE support
- Keep implementation synchronous (matches existing patterns)
- Error messages should be actionable
