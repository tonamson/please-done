# Phase 136 Research: Fix Deprecated Command References

**Gathered:** 2026-04-06
**Phase:** 136
**Status:** Research Complete

## Problem Statement

Phase 125 successfully fixed deprecated `/pd:map-codebase` references in `CLAUDE.md`, but missed **4 references** in workflow documentation files that are still user-facing.

## Discovery

### Affected Files (4 total)

| File | Line | Current Reference | Target |
|------|------|------------------|--------|
| `CLAUDE.vi.md` | 113 | `/pd:map-codebase` | `/pd:scan` |
| `CLAUDE.vi.md` | 253-258 | Section title + 3 references | `/pd:scan` (entire section) |
| `docs/workflows/getting-started.md` | 220 | `/pd:map-codebase` | `/pd:scan` |
| `docs/workflows/getting-started.vi.md` | 224 | `/pd:map-codebase` | `/pd:scan` |

### Test Snapshots (Also Need Update)

These files are auto-generated snapshots used for testing. While they're not user-facing, they should be updated for consistency:

- `test/snapshots/copilot/status.md` (lines 79, 91)
- `workflows/status.md` (lines 72, 84)

## Context

**Historical Background:**
- Phase 98 (Staleness Detection) introduced the staleness feature to `pd:map-codebase`
- Phase 125 was supposed to fix all deprecated command references but only updated `CLAUDE.md`
- The Phase 125 plan specifically mentioned updating lines 106 and 250-251 in CLAUDE.md
- **What was missed:** Workflow documentation files that reference the command

**Current State:**
- ✅ `CLAUDE.md` - Fixed (Phase 125)
- ✅ `AGENTS.md` - Uses `pd:scan` (created in Phase 131)
- ❌ `CLAUDE.vi.md` - Vietnamese translation still has old references
- ❌ `docs/workflows/*.md` - Workflow guides still reference old command
- ❌ Test snapshots - Still reference old command

## Standard Stack

**This is a documentation-only phase. No code changes required.**

### Tools
- `grep` - Search for remaining references
- Text editor - Replace deprecated references

### Files to Modify
1. `CLAUDE.vi.md` - Vietnamese documentation
2. `docs/workflows/getting-started.md` - English workflow guide
3. `docs/workflows/getting-started.vi.md` - Vietnamese workflow guide
4. `test/snapshots/*.md` - Test snapshots (optional but recommended)
5. `workflows/status.md` - Template file (optional but recommended)

## Architecture Patterns

**Pattern:**
1. Find all occurrences of `pd:map-codebase` in user-facing documentation
2. Replace with `pd:scan`
3. Update section titles if they reference the old command name
4. Run grep verification to ensure zero references remain

**Files Priority:**
1. **HIGH PRIORITY:** User-facing docs (`CLAUDE.vi.md`, `docs/workflows/*.md`)
2. **MEDIUM PRIORITY:** Template files (`workflows/status.md`)
3. **LOW PRIORITY:** Test snapshots (cosmetic, but improves consistency)

## Common Pitfalls

1. **Missing Vietnamese translations:** Phase 125 only fixed English docs, leaving Vietnamese equivalents behind
2. **Snapshot drift:** Test snapshots weren't updated, creating inconsistency
3. **Template files hidden:** Files in `workflows/` and `test/snapshots/` are often overlooked
4. **Section titles:** Not just command references, but also section headers need updating

## Verification Criteria

After the fix:
```bash
# Should return 0 (no matches)
grep -r "pd:map-codebase" CLAUDE.vi.md docs/workflows/getting-started.md docs/workflows/getting-started.vi.md

# Should return multiple matches (new command exists)
grep -r "pd:scan" CLAUDE.vi.md docs/workflows/getting-started.md docs/workflows/getting-started.vi.md
```

## Impact Analysis

**Files Modified:** 3-5 files (minimum)
**Lines Changed:** ~10 lines
**Risk Level:** LOW (text replacement only)
**Dependencies:** None (Phase 125 already fixed `CLAUDE.md`)

## Historical References (Informational)

These files contain historical references to `pd:map-codebase` in the context of past phases and shouldn't be modified:
- `.planning/v12.1-MILESTONE-AUDIT.md` (audit report)
- `.planning/phases/125-command-reference-fixes/*` (Phase 125 documentation)
- `.planning/phases/133-add-missing-verification/*` (verification documentation)
- `.planning/milestones/v11.2-phases/*` (historical phase documentation)

**Do NOT modify historical planning files — they document what happened in those phases.**

---

**Research Status:** ✅ Complete
**Confidence Level:** HIGH
**Files Identified:** 3 user-facing + 2 test-related
**Estimated Effort:** <15 minutes