---
name: STALE-01 Map Metadata & Refresh Plan
description: Implementation plan for integrating staleness detection into workflows
type: plan
phase: 98
version: 1.0
---

# Phase 98 Plan: STALE-01 — Map Metadata & Refresh

## Goal
Integrate staleness detection into codebase mapping workflow (init) and add staleness indicator to status dashboard.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  workflows/init.md Step 3b                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Check META.json exists?                              │  │
│  │   ├─ No → Continue with normal mapping               │  │
│  │   └─ Yes → Read mapped_at_commit                     │  │
│  │         → detectStaleness(mapped_at_commit)            │  │
│  │         → If aging/stale → AskUserQuestion           │  │
│  │         → Continue (non-blocking)                   │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  workflows/status.md Step 1/2                               │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Read META.json → detectStaleness()                 │  │
│  │ Display Map: field with staleness status           │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Task 1: Update init.md with Staleness Check

**File:** `workflows/init.md`

**Step 3b Modification:**
After "Check .planning/codebase/STRUCTURE.md exists", add staleness check logic:

```
### Step 3b.1: Check for existing map staleness
If META.json exists:
  - Read mapped_at_commit
  - Call detectStaleness(mapped_at_commit)
  - If level === 'aging' || level === 'stale':
    - Display: "Codebase map is [level] (X commits behind). Refresh now?"
    - AskUserQuestion: ["Yes, refresh now", "Skip this time"]
    - If "Yes":
      - Remove STRUCTURE.md check constraint temporarily
      - Trigger pd-codebase-mapper (Step 3b continues after refresh)
    - If "Skip": Continue normally
  - If level === 'fresh': Continue normally (skip mapping)
```

**Requirements:**
- Non-blocking: always continue with init workflow
- Graceful handling: META.json missing → continue
- Graceful handling: not git repo → continue
- Must import/use staleness-detector.js logic

### Task 2: Update status.md with Map Field

**File:** `workflows/status.md`

**Step 1 Modification:**
Add new data source (after Step 6 - git log):

```
7. Read `.planning/codebase/META.json`:
   - Missing → map_status = "No map"
   - Exists → extract mapped_at_commit
   - Call detectStaleness(mapped_at_commit)
   - map_status = format based on level
```

**Step 2 Modification:**
Add Map field to dashboard output (between Lint and Blockers):

```
**Map Status format:**
- No META.json or no map:
  Map:        — No codebase map (run `/pd:map-codebase`)
- Fresh (level === 'fresh'):
  Map:        ✓ Current (commit abc123, 5 commits behind)
- Aging (level === 'aging'):
  Map:        ~ Aging (commit abc123, 25 commits behind) — Consider refresh
- Stale (level === 'stale'):
  Map:        ✗ Stale (commit abc123, 50+ commits behind) — Run /pd:map-codebase
- Error (error !== null):
  Map:        ⚠ Error checking staleness: [error message]
```

**Requirements:**
- Read-only: never modify META.json
- Handle errors gracefully (invalid SHA, not git repo)
- Truncate commit SHA to first 7 characters for display
- Keep existing 8-field structure, Map becomes field #7

### Task 3: Create Integration Tests

**File:** `test/staleness-workflow.integration.test.js`

**Test Scenarios:**
- [ ] init.md flow: Fresh map → no prompt, continues
- [ ] init.md flow: Aging map → prompt shown, user skips → continues
- [ ] init.md flow: Stale map → prompt shown, user refreshes → mapper spawned
- [ ] init.md flow: No META.json → no staleness check, normal mapping
- [ ] status.md: Fresh map → displays ✓ Current
- [ ] status.md: Aging map → displays ~ Aging with consider refresh
- [ ] status.md: Stale map → displays ✗ Stale with run command
- [ ] status.md: No META.json → displays — No codebase map
- [ ] status.md: Invalid commit SHA → displays ⚠ Error
- [ ] status.md: Not git repo → displays — No codebase map

**Mock Strategy:**
- Mock fs.readFile for META.json
- Mock staleness-detector.js return values
- Mock AskUserQuestion responses

### Task 4: Update CLAUDE.md Documentation

**File:** `CLAUDE.md`

Add section under "Available Skills" for `pd:map-codebase` with staleness information:

```
### pd:map-codebase Integration
- `pd:init` checks map staleness before running
- `pd:status` displays staleness level (fresh/aging/stale)
- Threshold: 20 commits (configurable)
- Suggestions appear at 'aging' (20-49 commits) and 'stale' (50+)
```

### Task 5: Regenerate Snapshots (if needed)

**Check:** Run smoke tests to detect any snapshot mismatches

**Command:**
```bash
npm test -- test/smoke/*.test.js
```

## Success Criteria

1. ✅ `workflows/init.md` has staleness check in Step 3b
2. ✅ `workflows/status.md` displays Map field with staleness info
3. ✅ Non-blocking: init always continues even if user skips refresh
4. ✅ Status remains read-only (no file modifications)
5. ✅ Integration tests pass (10 scenarios)
6. ✅ No regressions in existing flows
7. ✅ Documentation updated

## Test Commands

```bash
# Run integration tests
npm test -- test/staleness-workflow.integration.test.js

# Run all tests
npm test

# Check smoke tests
npm test -- test/smoke/*.test.js
```

## Dependencies

- Phase 97: `bin/lib/staleness-detector.js` must exist
- Current: `commands/pd/agents/pd-codebase-mapper.md` (META.json writer)
- Current: `workflows/init.md` (integration point)
- Current: `workflows/status.md` (dashboard display)

## Notes

- Workflow prose uses existing patterns (AskUserQuestion, Tool calls)
- No new library files needed (reuse staleness-detector.js)
- Keep changes minimal and focused
- Follow existing workflow style and formatting
