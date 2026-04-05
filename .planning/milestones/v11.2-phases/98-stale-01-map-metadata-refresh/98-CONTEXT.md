---
name: STALE-01 Map Metadata & Refresh
description: Add commit metadata to maps and refresh workflow
type: context
phase: 98
---

# Phase 98: STALE-01 — Map Metadata & Refresh

## Goal
Integrate staleness detection into codebase mapping workflow and add refresh suggestions to status dashboard.

## Gray Areas Decided

### Metadata Storage
**Decision:** Use META.json for commit metadata (already implemented in pd-codebase-mapper).

- **Location:** `.planning/codebase/META.json`
- **Format:**
  ```json
  {
    "schema_version": 1,
    "mapped_at_commit": "abc123...",
    "mapped_at": "2026-04-04T21:00:00.000Z"
  }
  ```
- **Rationale:** JSON is easy to parse, versioned schema allows evolution

### Staleness Check Integration Point
**Decision:** Check staleness in init workflow Step 3b (before mapping).

- **Logic:**
  1. If `META.json` exists → read `mapped_at_commit`
  2. Call `detectStaleness(mapped_at_commit)` from `staleness-detector.js`
  3. If `isStale === true` → display recommendation and AskUserQuestion
  4. User chooses: Refresh now | Skip | Refresh after init
- **Non-blocking:** Continue with init even if user declines refresh

### Status Dashboard Integration
**Decision:** Add staleness indicator to `pd:status` output.

- **New field:** `Map:` between `Lint:` and `Blockers:`
- **Format:**
  - Fresh: `✓ Current (commit abc123, 5 commits behind)`
  - Aging: `~ Aging (commit abc123, 25 commits behind) — Consider refresh`
  - Stale: `✗ Stale (commit abc123, 50+ commits behind) — Run /pd:map-codebase`
  - No map: `— No codebase map (run /pd:map-codebase)`
- **Read-only:** Status never modifies files, only displays current state

### User Prompt Behavior
**Decision:** Non-blocking with clear options.

- **Prompt text:** "Codebase map is [aging/stale] (X commits behind). Refresh now?"
- **Options:**
  1. "Yes, refresh now" → Trigger `pd:map-codebase` before continuing
  2. "Skip this time" → Continue without refreshing
  3. "Refresh after init" → Queue refresh to run post-init (deferred to future)
- **Default:** Skip (user can manually refresh anytime)

### Refresh Trigger Logic
**Decision:** Only suggest refresh, never auto-refresh.

- **Why:** Mapping can be expensive and user may have local changes
- **Threshold for prompt:** `level === 'aging' || level === 'stale'`
- **No silent refresh:** Always require explicit user confirmation

## Implementation Boundaries

### In Scope
1. Update `workflows/init.md` Step 3b with staleness check
2. Update `workflows/status.md` with Map field and staleness display
3. Read META.json and parse mapped_at_commit
4. Integration with `staleness-detector.js` (from Phase 97)
5. AskUserQuestion for refresh prompt (non-blocking)

### Out of Scope (Future Phases)
- Auto-refresh after init completion (Phase 99+)
- File-specific staleness detection
- Background refresh jobs
- Staleness webhook notifications

## Constraints
- Must be non-blocking (never stop init workflow)
- Graceful handling when META.json missing
- Graceful handling when not in git repo
- Follow existing workflow prose patterns
- Status dashboard remains read-only

## Deferred Ideas
- Configurable staleness threshold per project
- Background/auto refresh option
- Map versioning with incremental updates
- Staleness badges in other commands

## References
- Phase 97: `bin/lib/staleness-detector.js` — detection logic
- Phase 97: `test/staleness-detector.test.js` — usage patterns
- Current: `commands/pd/agents/pd-codebase-mapper.md` — META.json writer
- Current: `workflows/init.md` — integration point
- Current: `workflows/status.md` — dashboard display
- Requirements: `.planning/REQUIREMENTS.md` section STALE-01
