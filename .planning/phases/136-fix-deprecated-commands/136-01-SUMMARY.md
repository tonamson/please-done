---
phase: 136-fix-deprecated-commands
plan: 01
subsystem: documentation
tags: [deprecated-commands, documentation, i18n, vietnamese]
completed: 2026-04-06
duration: ~5 minutes
dependencies:
  requires: []
  provides: [clean-documentation]
  affects: [CLAUDE.vi.md, docs/workflows/*.md]
key-files:
  created: []
  modified:
    - CLAUDE.vi.md
    - docs/workflows/getting-started.md
    - docs/workflows/getting-started.vi.md
key-decisions:
  - Preserved all Vietnamese text context while updating command references
tech-stack:
  added: []
  patterns: [text-replacement, i18n-consistency]
---

# Phase 136 Plan 01: Fix Deprecated Command References

## One-Liner

Replaced all deprecated `/pd:map-codebase` references with `/pd:scan` in Vietnamese documentation and workflow guides, completing the command reference fix missed in Phase 125.

## Execution Summary

Successfully updated 3 user-facing documentation files to replace deprecated command references with the canonical `pd:scan` command name, ensuring consistency across English and Vietnamese documentation.

## Tasks Completed

### Task 1: Fix Vietnamese Documentation (CLAUDE.vi.md)

**Status:** ✅ Complete
**Commit:** 45c15f7

**Changes:**
- Line 113: Updated workflow decision point reference from `/pd:map-codebase` to `/pd:scan`
- Lines 253-258: Replaced entire "Tài Liệu Tham Khảo Lệnh: pd:map-codebase" section with "Tài Liệu Tham Khảo Lệnh: pd:scan"
  - Updated section title
  - Updated skill description
  - Updated command usage example

**Verification:**
- `grep -c "pd:map-codebase" CLAUDE.vi.md` returns 0 ✅
- `grep -c "pd:scan" CLAUDE.vi.md` returns 5 ✅

---

### Task 2: Fix English Workflow Guide (docs/workflows/getting-started.md)

**Status:** ✅ Complete
**Commit:** dc89ed9

**Changes:**
- Line 220: Updated status dashboard decision point from `/pd:map-codebase` to `/pd:scan`

**Verification:**
- `grep -c "pd:map-codebase" docs/workflows/getting-started.md` returns 0 ✅

---

### Task 3: Fix Vietnamese Workflow Guide (docs/workflows/getting-started.vi.md)

**Status:** ✅ Complete
**Commit:** 43636a9

**Changes:**
- Line 224: Updated status dashboard decision point from `/pd:map-codebase` to `/pd:scan`

**Verification:**
- `grep -c "pd:map-codebase" docs/workflows/getting-started.vi.md` returns 0 ✅

---

## Deviations from Plan

**None.** Plan executed exactly as specified.

---

## Verification Results

### Final Verification Commands

```bash
# Verify no deprecated references remain in user-facing docs
grep -r "pd:map-codebase" CLAUDE.vi.md docs/workflows/getting-started.md docs/workflows/getting-started.vi.md
# Result: PASS - No deprecated references found

# Verify new command references exist
grep -c "pd:scan" CLAUDE.vi.md docs/workflows/getting-started.md docs/workflows/getting-started.vi.md | awk -F: '{sum+=$2} END {print sum}'
# Result: PASS - 7 pd:scan references found (≥5 required)
```

### Must-Haves Verification

| Must-Have | Status | Evidence |
|-----------|--------|----------|
| User can read Vietnamese documentation without deprecated references | ✅ | 0 deprecated refs in CLAUDE.vi.md |
| User can read English workflow guides without deprecated references | ✅ | 0 deprecated refs in getting-started.md |
| All pd:map-codebase references replaced with pd:scan | ✅ | Verified by grep across all files |

---

## Final State

### Files Modified (3)

1. **CLAUDE.vi.md** — Vietnamese main documentation
   - Line 113: workflow decision point
   - Lines 253-258: command reference section
   - Total changes: 4 lines

2. **docs/workflows/getting-started.md** — English workflow guide
   - Line 220: status dashboard decision point
   - Total changes: 1 line

3. **docs/workflows/getting-started.vi.md** — Vietnamese workflow guide
   - Line 224: status dashboard decision point
   - Total changes: 1 line

### Commits Created

1. `45c15f7` — fix(136-01): replace deprecated pd:map-codebase with pd:scan in Vietnamese docs
2. `dc89ed9` — fix(136-01): replace pd:map-codebase with pd:scan in English workflow guide
3. `43636a9` — fix(136-01): replace pd:map-codebase with pd:scan in Vietnamese workflow guide

---

## Impact Analysis

**Documentation Consistency:** Users now see consistent command references across all documentation (English and Vietnamese) after Phase 125 fixed CLAUDE.md and Phase 136 fixed the remaining files.

**Breaking Changes:** None — this is a documentation-only fix aligning with the existing `pd:scan` command.

**User Impact:** Low — documentation clarifications only, no functional changes.

---

## Threat Model Verification

| Threat ID | Category | Component | Disposition | Mitigated |
|-----------|----------|-----------|-------------|-----------|
| T-136-01 | Tampering | docs/workflows/*.md | accept | ✅ Text replacement only, no executable content |
| T-136-02 | Information Disclosure | docs/workflows/*.md | accept | ✅ Public documentation, no secrets |
| T-136-03 | Spoofing | CLAUDE.vi.md | accept | ✅ Language translation, authenticity verified by commit |

All threats mitigated as planned. No security-relevant changes.

---

## Related Work

- **Phase 125:** Fixed deprecated references in `CLAUDE.md` (English main documentation)
- **Phase 131:** Created `AGENTS.md` with correct `pd:scan` command references
- **Phase 136-01 (this plan):** Fixed remaining references in Vietnamese docs and workflow guides

This completes the full command reference migration from `pd:map-codebase` to `pd:scan` across all user-facing documentation.