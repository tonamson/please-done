---
phase: 77-codebase-map-staleness-detection
verified: 2025-07-15T00:00:00Z
status: passed
score: 4/4 must-haves verified
re_verification: false
gaps: []
human_verification: []
---

# Phase 77: Codebase Map Staleness Detection — Verification Report

**Phase Goal:** Developers are always warned before using a stale codebase map.
**Verified:** 2025-07-15
**Status:** ✅ PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | After every pd-codebase-mapper run, META.json written with `mapped_at_commit` SHA | ✓ VERIFIED | Step 6 in pd-codebase-mapper.md (lines 41–52): runs `git rev-parse HEAD`, writes `.planning/codebase/META.json` with `schema_version`, `mapped_at_commit` (40-char hex), `mapped_at` (ISO-8601) |
| 2 | scan.md Step 0 reads META.json and warns when commits since map > 20 | ✓ VERIFIED | scan.md lines 15–25: reads META.json, extracts `mapped_at_commit`, runs `git rev-list <sha>..HEAD --count`, warns if N > 20 with exact count |
| 3 | Warning names exact commit count and prompts user to re-run pd:scan | ✓ VERIFIED | scan.md line 22–23: `⚠️ **Codebase map is stale** — generated **N commits ago** (where N is the actual count). Run \`/pd:scan\` to refresh` |
| 4 | No META.json or no git history → skip without error | ✓ VERIFIED | scan.md lines 16–19: missing file → skip to Step 1; missing `mapped_at_commit` → skip to Step 1; git command fails → skip silently to Step 1. Mapper line 42: `git rev-parse HEAD` failure → skip META.json write entirely |

**Score:** 4/4 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `commands/pd/agents/pd-codebase-mapper.md` | Step 6 with META.json write + `git rev-parse HEAD` | ✓ VERIFIED | Lines 41–52: full Step 6 present with correct schema, SHA requirement, ISO-8601 timestamp, error-skip logic |
| `workflows/scan.md` | Step 0 before Step 1 with staleness logic | ✓ VERIFIED | Lines 15–25: Step 0 is the first step in `<process>`, before Step 1 (line 27); threshold=20, git rev-list, pd:scan prompt, non-blocking |
| `test/smoke-codebase-staleness.test.js` | Exists with 11 tests | ✓ VERIFIED | File exists at `test/smoke-codebase-staleness.test.js`; 11 test cases across 4 suites (META.json schema, mapper contract, scan.md Step 0, git command syntax) |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `pd-codebase-mapper.md` Step 6 | `.planning/codebase/META.json` | `git rev-parse HEAD` + Write instruction | ✓ WIRED | Step 6 explicitly instructs writing META.json with SHA captured from git |
| `scan.md` Step 0 | `META.json` → `git rev-list` → warning | Read META.json → extract SHA → run git command → conditional warn | ✓ WIRED | Full chain present: read file → extract field → run rev-list → parse N → if N>20 emit warning with N → always continue to Step 1 |
| Warning text | `pd:scan` re-run prompt | Inline in warning message | ✓ WIRED | Warning text directly references `/pd:scan` for the user to act |

---

### Behavioral Spot-Checks

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| All 11 smoke tests pass | `node --test test/smoke-codebase-staleness.test.js` | 11 pass, 0 fail | ✓ PASS |
| No new test regressions | `npm test` | 1148/1151 pass; 3 failures = pre-existing known failures | ✓ PASS |

**Pre-existing failures (not regressions):**
- `guard micro-templates exist in references/`
- `guard-context7.md has operation check (D-09)`
- `test/smoke-security-rules.test.js` (js-yaml missing)

---

### Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| STALE-01-A | pd-codebase-mapper writes META.json with `mapped_at_commit` SHA after every run | ✓ SATISFIED | pd-codebase-mapper.md Step 6 (lines 41–52) |
| STALE-01-B | scan.md Step 0 reads META.json and runs `git rev-list <sha>..HEAD --count` | ✓ SATISFIED | scan.md Step 0 (lines 15–25) |
| STALE-01-C | Warning names exact commit count (N > 20 threshold) | ✓ SATISFIED | scan.md line 22: "generated **N commits ago**" |
| STALE-01-D | Warning prompts user to re-run pd:scan | ✓ SATISFIED | scan.md line 23: "Run `/pd:scan` to refresh" |
| STALE-01-E | Missing META.json / git failure → skip silently, no error | ✓ SATISFIED | scan.md lines 16–19; mapper line 42 |

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| — | None detected | — | — |

No stubs, placeholders, empty handlers, or hardcoded returns found in the modified files.

---

### Human Verification Required

None. All success criteria are verifiable programmatically via file content inspection and test execution.

---

## Summary

Phase 77 is **fully delivered**. All four observable truths hold:

1. **META.json write** — `pd-codebase-mapper.md` Step 6 correctly captures `git rev-parse HEAD`, writes the required JSON schema (`schema_version`, `mapped_at_commit`, `mapped_at`) and skips gracefully if git is unavailable.

2. **Staleness check in scan.md** — Step 0 is correctly positioned as the first step before Step 1, reads META.json, extracts `mapped_at_commit`, runs `git rev-list <sha>..HEAD --count`, and fires the warning when N > 20.

3. **Warning quality** — The warning message explicitly names the exact commit count (N) and directs the user to run `/pd:scan` to refresh. Always non-blocking.

4. **Safe failure modes** — Missing META.json, missing `mapped_at_commit` field, and git command failures all silently skip to Step 1 with no errors.

All 11 contract tests pass. Full test suite remains at 3 pre-existing failures (unchanged).

---

_Verified: 2025-07-15_
_Verifier: the agent (gsd-verifier)_
