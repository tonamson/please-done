---
phase: 136-fix-deprecated-commands
verified: 2026-04-06T00:00:00Z
status: passed
score: 3/3 must-haves verified
gaps: []
---

# Phase 136: Fix Deprecated Commands Verification Report

**Phase Goal:** Replace deprecated /pd:map-codebase references with /pd:scan in user-facing documentation
**Verified:** 2026-04-06
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                       | Status       | Evidence                                      |
| --- | ----------------------------------------------------------- | ------------ | --------------------------------------------- |
| 1   | User can read Vietnamese documentation without deprecated command references | ✓ VERIFIED | `grep -r "pd:map-codebase" CLAUDE.vi.md` returns 0 results, 5 `pd:scan` references found at lines 113, 234, 253, 255, 258 |
| 2   | User can read English workflow guides without deprecated command references | ✓ VERIFIED | `grep -r "pd:map-codebase" docs/workflows/getting-started.md docs/workflows/getting-started.vi.md` returns 0 results, 2 `pd:scan` references found |
| 3   | All pd:map-codebase references replaced with pd:scan         | ✓ VERIFIED | All verification commands pass: 7 total pd:scan references across all files, 0 pd:map-codebase references |

**Score:** 3/3 truths verified

### Required Artifacts

| Artifact                                           | Expected                                   | Status       | Details                                                       |
| -------------------------------------------------- | ------------------------------------------ | ------------ | ------------------------------------------------------------- |
| `CLAUDE.vi.md`                                     | Vietnamese main documentation              | ✓ VERIFIED   | File exists, contains `pd:scan` (5 refs), excludes `pd:map-codebase` |
| `docs/workflows/getting-started.md`                | English workflow guide                     | ✓ VERIFIED   | File exists, contains `pd:scan` (1 ref), excludes `pd:map-codebase` |
| `docs/workflows/getting-started.vi.md`             | Vietnamese workflow guide                  | ✓ VERIFIED   | File exists, contains `pd:scan` (1 ref), excludes `pd:map-codebase` |

**Artifact Verification (gsd-tools):**
- All passed: 3/3
- Issues: None

### Key Link Verification

| From                                      | To              | Via               | Status       | Details                           |
| ----------------------------------------- | --------------- | ----------------- | ------------ | --------------------------------- |
| `CLAUDE.vi.md`                            | pd:scan command | text replacement | ✓ WIRED     | Pattern `/pd:scan` found in source |
| `docs/workflows/getting-started.md`       | pd:scan command | text replacement | ✓ WIRED     | Pattern `/pd:scan` found in source |
| `docs/workflows/getting-started.vi.md`    | pd:scan command | text replacement | ✓ WIRED     | Pattern `/pd:scan` found in source |

**Key Links Verification (gsd-tools):**
- All verified: 3/3
- Links with issues: None

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| N/A | N/A | N/A | N/A | ⚠️ SKIP — Documentation phase, no dynamic data flows |

*Note: This phase involves static text replacement in documentation files. Level 4 data-flow verification is not applicable.*

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| No deprecated references in user-facing docs | `grep -r "pd:map-codebase" CLAUDE.vi.md docs/workflows/getting-started.md docs/workflows/getting-started.vi.md` | No results (exit 1) | ✓ PASS |
| New command references present | `grep -c "pd:scan"` across all files | 7 references found | ✓ PASS |

*Note: Step 7b skipped — documentation phase with no runnable entry points.*

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------  | ----------- | ------ | -------- |
| None (Phase 136) | N/A | Gap closure for Phase 125 | ✓ SATISFIED | All deprecated references replaced in Vietnamese docs and workflow guides |

*Note: Phase 136 has no formal requirements in REQUIREMENTS.md. This is a gap-closure phase for Phase 125 (requirement C-01).*

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| None found | — | — | — | — |

**Scan Results:**
- Files scanned: CLAUDE.vi.md, docs/workflows/getting-started.md, docs/workflows/getting-started.vi.md
- TODO/FIXME patterns: None found
- Placeholder/coming-soon patterns: None found
- Empty implementations: None found

### Human Verification Required

None. This is a text replacement phase with no visual UI, real-time behavior, or external service dependencies. All verification is programmatic:

1. ✅ Deprecated command references removed (grep verified)
2. ✅ New command references present (grep verified)
3. ✅ Line numbers match plan specifications (file reads verified)
4. ✅ Commits created and documented (git log verified)

### Commits Verified

| Commit   | Message                                                         | Status |
| -------- | --------------------------------------------------------------- | ------ |
| 8a632d0  | docs(136-01): complete fix-deprecated-commands plan summary     | ✓ Present |
| 43636a9  | fix(136-01): replace pd:map-codebase with pd:scan in Vietnamese workflow guide | ✓ Present |
| dc89ed9  | fix(136-01): replace pd:map-codebase with pd:scan in English workflow guide | ✓ Present |

### Gaps Summary

**None.** All must-haves verified successfully.

---

## Verification Details

### Verification Commands Executed

```bash
# Command 1: Verify no deprecated references remain
grep -r "pd:map-codebase" CLAUDE.vi.md docs/workflows/getting-started.md docs/workflows/getting-started.vi.md
# Result: PASS - No deprecated references found

# Command 2: Verify new command references exist
grep -c "pd:scan" CLAUDE.vi.md docs/workflows/getting-started.md docs/workflows/getting-started.vi.md | awk -F: '{sum+=$2} END {print sum}'
# Result: PASS - 7 pd:scan references found (≥5 required)

# Command 3: Artifact verification (gsd-tools)
node "$HOME/.config/opencode/get-shit-done/bin/gsd-tools.cjs" verify artifacts .planning/phases/136-fix-deprecated-commands/136-01-PLAN.md
# Result: PASS - All 3 artifacts exist and pass validation

# Command 4: Key links verification (gsd-tools)
node "$HOME/.config/opencode/get-shit-done/bin/gsd-tools.cjs" verify key-links .planning/phases/136-fix-deprecated-commands/136-01-PLAN.md
# Result: PASS - All 3 key links verified
```

### File Content Verification

**CLAUDE.vi.md:**
- Line 113: `/pd:scan` reference updated ✓
- Lines 253-258: Command reference section updated to `/pd:scan` ✓
- Total references: 5 ✓

**docs/workflows/getting-started.md:**
- Line 220: `/pd:scan` reference updated ✓
- Total references: 1 ✓

**docs/workflows/getting-started.vi.md:**
- Line 224: `/pd:scan` reference updated ✓
- Total references: 1 ✓

### Threat Model Verification

| Threat ID | Category | Component | Disposition | Status |
| --------- | -------- | --------- | ----------- | ------ |
| T-136-01  | Tampering | docs/workflows/*.md | accept | ✅ Mitigated — text replacement only |
| T-136-02  | Information Disclosure | docs/workflows/*.md | accept | ✅ Mitigated — public documentation |
| T-136-03  | Spoofing | CLAUDE.vi.md | accept | ✅ Mitigated — authenticity verified by commit |

All threats mitigated as planned. No security-relevant changes.

---

## Related Work

- **Phase 125:** Fixed deprecated references in `CLAUDE.md` (English main documentation)
- **Phase 131:** Created `AGENTS.md` with correct `pd:scan` command references
- **Phase 136-01 (this plan):** Fixed remaining references in Vietnamese docs and workflow guides

This completes the full command reference migration from `pd:map-codebase` to `pd:scan` across all user-facing documentation.

---

_Verified: 2026-04-06_
_Verifier: the agent (gsd-verifier)_