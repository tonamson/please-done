# Phase 140: Version Badge Automation - Research

**Researched:** 2026-04-07
**Domain:** Version synchronization tooling — file scanning, regex matching, pure-function library
**Confidence:** HIGH

## Summary

This phase creates a `pd:sync-version` skill that keeps version numbers synchronized across the project. The version source is `package.json` (currently `4.0.0`). The tool must sync three distinct patterns: (1) README.md badge URL containing `version-X.Y.Z-blue`, (2) README.md version text `**Current version: vX.Y.Z**`, and (3) `<!-- Source version: X.Y.Z -->` HTML comments found in 28 doc files across `docs/skills/`, `docs/workflows/`, root-level translated files, and `CLAUDE.vi.md`.

The implementation follows the established pure-function pattern from `health-checker.js` and `stats-collector.js`: all version reading, comparison, and formatting logic lives in `bin/lib/version-sync.js` with content passed as arguments (zero I/O). The skill definition goes in `commands/pd/sync-version.md` with an inlined workflow. Tests use `node:test` + `node:assert/strict` per project convention.

**Primary recommendation:** Build `version-sync.js` as a pure-function library with three extraction functions (one per pattern), a comparison function that returns structured results, and a formatting function for the check-mode table. The skill file handles file discovery (Glob) and I/O (Read/Write), delegating all parsing to the library.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** `package.json` is the single source of truth for the current version number
- **D-02:** Read version via JSON parse of `package.json` — no git tag parsing
- **D-03:** Sync README.md: version badge (shields.io URL pattern `version-X.Y.Z-blue`) and version text line (`**Current version: vX.Y.Z**`)
- **D-04:** Sync doc files with `<!-- Source version: X.Y.Z -->` comment headers: `docs/skills/*.md`, `docs/workflows/*.md`, `CLAUDE.vi.md`, `CLAUDE.md` (if it has the header)
- **D-05:** Do NOT sync `.planning/` files — those have their own versioning semantics
- **D-06:** Default behavior: sync — actually update all files to match `package.json` version
- **D-07:** `--check` flag: validation-only — report mismatches without modifying files
- **D-08:** Output mismatches as a table: File | Current | Expected | Status
- **D-09:** complete-milestone workflow calls sync-version after archiving
- **D-10:** Sync is non-blocking — failures produce warnings, do not halt milestone completion
- **D-11:** New pure-function library: `bin/lib/version-sync.js` — all version reading/comparison/formatting as pure functions (content passed as args, no I/O in library)
- **D-12:** New skill file: `commands/pd/sync-version.md` — skill definition with frontmatter
- **D-13:** Workflow inlined in skill (following pattern for simpler tools)
- **D-14:** New test file: `test/version-sync.test.js` — unit tests for pure functions using `node:test`

### Agent's Discretion
- Exact regex patterns for version extraction from each file type
- Error handling for unreadable or missing target files
- Whether to include `--verbose` flag
- Whether to add a `pd:version` alias command

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| L-01 | Automated version badge sync: sync version number across README.md, CLAUDE.md, package.json; update version badge on milestone completion; detect version mismatches; add `--check` flag | Pure-function library extracts versions from 3 patterns (badge URL, text line, HTML comment); skill file handles file discovery and I/O; `--check` reports mismatches in boxed table format |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node:test | v24.13.0 (built-in) | Test framework | Project standard — all test files use `node:test` + `node:assert/strict` [VERIFIED: codebase] |
| node:assert | v24.13.0 (built-in) | Assertions | Paired with `node:test` across all `test/*.test.js` files [VERIFIED: codebase] |
| node:fs | v24.13.0 (built-in) | File reading in skill only | I/O isolated to skill file, not library [VERIFIED: codebase] |

### No External Dependencies
This phase requires **zero** new npm packages. All functionality uses Node.js built-in modules (`fs`, `path`, `JSON.parse`, `RegExp`). This is intentional — the project avoids runtime dependencies per CONVENTIONS.md.

**Installation:**
```bash
# No installs needed — pure built-in Node.js
```

## Architecture Patterns

### Recommended Project Structure
```
bin/lib/version-sync.js       # NEW: Pure-function library (zero I/O)
commands/pd/sync-version.md   # NEW: Skill definition with inlined workflow
test/version-sync.test.js     # NEW: Unit tests for pure functions
```

### Pattern 1: Pure Function Library (following health-checker.js)

**What:** All version extraction, comparison, and formatting logic as pure functions. Content passed as arguments, no file I/O.

**When to use:** This is the locked pattern (D-11) — must follow exactly.

**Example:**
```javascript
// Source: [VERIFIED: bin/lib/health-checker.js pattern]

'use strict';

/**
 * Extract version from package.json content.
 * @param {string} content - package.json file content
 * @returns {{ version: string } | null}
 */
function extractPackageVersion(content) {
  if (!content || typeof content !== 'string') return null;
  try {
    const pkg = JSON.parse(content);
    if (pkg.version && typeof pkg.version === 'string') {
      return { version: pkg.version };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Extract version from <!-- Source version: X.Y.Z --> comment.
 * @param {string} content - Doc file content
 * @returns {string | null}
 */
function extractDocVersion(content) {
  if (!content) return null;
  const match = content.match(/<!-- Source version: (\d+\.\d+\.\d+) -->/);
  return match ? match[1] : null;
}

/**
 * Replace version in <!-- Source version: X.Y.Z --> comment.
 * @param {string} content - Doc file content
 * @param {string} newVersion - Target version
 * @returns {string}
 */
function replaceDocVersion(content, newVersion) {
  return content.replace(
    /<!-- Source version: \d+\.\d+\.\d+ -->/,
    `<!-- Source version: ${newVersion} -->`
  );
}

module.exports = {
  extractPackageVersion,
  extractDocVersion,
  replaceDocVersion,
  // ... more functions
};
```

### Pattern 2: Skill File with Inlined Workflow (following stats.md)

**What:** Skill definition in `commands/pd/sync-version.md` with frontmatter, XML sections, and inlined `<process>`. No separate workflow file (D-13).

**Example:**
```markdown
---
name: pd:sync-version
description: Sync version number from package.json across README badge, version text, and doc file headers
model: haiku
argument-hint: "[--check]"
allowed-tools:
  - Read
  - Glob
  - Edit
  - Bash
---

<objective>Sync version from package.json to all project files.</objective>

<process>
1. Read package.json → extract version
2. Glob target files → scan for version references
3. For each file: extract current version, compare to package.json
4. If --check: output mismatch table only
5. If sync (default): update all mismatched files
</process>
```

### Anti-Patterns to Avoid
- **File I/O in library module:** `version-sync.js` must NOT import `fs` or `path` — pure functions only. All I/O happens in the skill file via agent tools. [VERIFIED: health-checker.js has zero fs imports]
- **Hardcoded file list:** The set of files with `<!-- Source version: -->` changes over time. Use Glob to discover files dynamically rather than maintaining a hardcoded list.
- **Syncing `.planning/` files:** Explicitly excluded by D-05. Must filter out `.planning/` paths from glob results.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Version extraction | Custom parser per file type | Regex patterns per file category | 3 distinct patterns, each needs its own regex — but they're simple and well-defined |
| Table formatting | Custom table renderer | `padRight()` + box-drawing chars pattern from stats-collector.js | Established project pattern, consistent with pd:health output |
| File discovery | Hardcoded file list | Glob tool in skill file | Files change over time — 28 currently, more will be added |

**Key insight:** This is a simple tool — extract version from JSON, match 3 regex patterns, report/update. The complexity is in the file discovery (28+ files) and the two README patterns, not in any individual operation.

## Common Pitfalls

### Pitfall 1: Forgetting the 'v' Prefix in Version Text
**What goes wrong:** README.md line 16 has `v4.0.0` (with 'v' prefix) while package.json has `4.0.0` (without). Badge URL has `4.0.0` (without).
**Why it happens:** Two different conventions coexist — bare semver in code/badges, prefixed semver in display text.
**How to avoid:** Each extraction function handles its own format. The text-line extractor must handle the optional `v` prefix. Replacement functions must preserve the `v` when present.
**Warning signs:** After sync, README shows `**Current version: 4.0.0**` instead of `**Current version: v4.0.0**`.

### Pitfall 2: Syncing .planning/ Files
**What goes wrong:** The glob discovers version headers in `.planning/milestones/` archived phase files and tries to update them.
**Why it happens:** 13+ files in `.planning/milestones/` contain `<!-- Source version: -->` headers.
**How to avoid:** Explicitly exclude any path containing `.planning/` from the file scan. This is a locked decision (D-05).
**Warning signs:** Tool reports updating files in `.planning/milestones/v11.2-phases/...`.

### Pitfall 3: Missing Files Treated as Errors
**What goes wrong:** Tool fails when a file from CONTEXT.md (e.g., `CLAUDE.md`) doesn't have the version header.
**Why it happens:** CLAUDE.md does NOT have the header — only CLAUDE.vi.md does. The tool tries to extract version from CLAUDE.md and gets confused.
**How to avoid:** Only attempt extraction on files that actually contain the target pattern. If no version found in a file, skip it silently (or report as "no version header" in check mode). Don't assume every target file has the header.
**Warning signs:** Tool reports "version mismatch" for files that don't have the header, or crashes trying to extract from non-existent patterns.

### Pitfall 4: English Doc Files Without Headers
**What goes wrong:** Tool expects all `docs/skills/*.md` files to have version headers, but 13 of 17 English skill docs don't.
**Why it happens:** Only 4 English skill docs (audit, conventions, onboard, status) have the `<!-- Source version: -->` header. The other 13 were added before the versioning convention was established.
**How to avoid:** Glob + grep approach: scan for files that CONTAIN the pattern, not all files in the directory. This naturally filters to only versioned files.
**Warning signs:** Tool reports "missing version" for files that were never intended to have one.

## Code Examples

Verified patterns from the codebase:

### Version Extraction: Package.json
```javascript
// Source: [VERIFIED: package.json has "version": "4.0.0" on line 3]
function extractPackageVersion(content) {
  if (!content || typeof content !== 'string') return null;
  try {
    const pkg = JSON.parse(content);
    return pkg.version || null;
  } catch {
    return null;
  }
}
```

### Version Extraction: README Badge URL
```javascript
// Source: [VERIFIED: README.md line 3 has version-4.0.0-blue.svg]
// Pattern: version-X.Y.Z-blue (in shields.io URL)
function extractBadgeVersion(content) {
  const match = content.match(/version-(\d+\.\d+\.\d+)-blue/);
  return match ? match[1] : null;
}
```

### Version Extraction: README Text Line
```javascript
// Source: [VERIFIED: README.md line 16 has **Current version: v4.0.0**]
function extractTextVersion(content) {
  const match = content.match(/\*\*Current version: v?(\d+\.\d+\.\d+)\*\*/);
  return match ? match[1] : null;
}
```

### Version Extraction: Doc Header Comment
```javascript
// Source: [VERIFIED: 28 files have <!-- Source version: 4.0.0 -->]
function extractDocVersion(content) {
  const match = content.match(/<!-- Source version: (\d+\.\d+\.\d+) -->/);
  return match ? match[1] : null;
}
```

### Boxed Table Output (for --check mode)
```javascript
// Source: [VERIFIED: bin/lib/health-checker.js formatHealthReport pattern]
function padRight(str, length) {
  const s = String(str || '');
  if (s.length >= length) return s;
  return s + ' '.repeat(length - s.length);
}

function formatVersionCheck(results) {
  // results: [{ file, current, expected, status }]
  const W = 70;
  const lines = [];
  lines.push(`╔${'═'.repeat(W)}╗`);
  lines.push(`║ ${padRight('VERSION SYNC CHECK', W - 1)}║`);
  lines.push(`║ ${padRight('─'.repeat(W - 2), W - 1)}║`);
  lines.push(`║ ${padRight('File', 40)} ${padRight('Current', 12)} ${padRight('Status', 14)}║`);
  for (const r of results) {
    const status = r.status === 'match' ? '✓ OK' : '✗ MISMATCH';
    lines.push(`║ ${padRight(r.file, 40)} ${padRight(r.current || 'none', 12)} ${padRight(status, 14)}║`);
  }
  lines.push(`╚${'═'.repeat(W)}╝`);
  return lines.join('\n');
}
```

## Current State: Version Locations

### Verified version references in codebase (as of 2026-04-07):

| File | Line | Pattern | Current Value |
|------|------|---------|---------------|
| `package.json` | 3 | `"version": "X.Y.Z"` | `4.0.0` |
| `README.md` | 3 | `version-X.Y.Z-blue` in badge URL | `4.0.0` |
| `README.md` | 16 | `**Current version: vX.Y.Z**` | `v4.0.0` |
| `CLAUDE.vi.md` | 2 | `<!-- Source version: X.Y.Z -->` | `4.0.0` |
| `README.vi.md` | 2 | `<!-- Source version: X.Y.Z -->` | `4.0.0` |
| `docs/skills/status.md` | 1 | `<!-- Source version: X.Y.Z -->` | `4.0.0` |
| `docs/skills/onboard.md` | 1 | `<!-- Source version: X.Y.Z -->` | `4.0.0` |
| `docs/skills/conventions.md` | 1 | `<!-- Source version: X.Y.Z -->` | `4.0.0` |
| `docs/skills/audit.md` | 1 | `<!-- Source version: X.Y.Z -->` | `4.0.0` |
| + 17 `.vi.md` skill docs | varies | `<!-- Source version: X.Y.Z -->` | `4.0.0` |
| + 3 `.vi.md` workflow docs | 2 | `<!-- Source version: X.Y.Z -->` | `4.0.0` |
| `docs/cheatsheet.vi.md` | 2 | `<!-- Source version: X.Y.Z -->` | `4.0.0` |
| `docs/error-troubleshooting.vi.md` | 2 | `<!-- Source version: X.Y.Z -->` | `4.0.0` |

**Total: 28 doc files + 2 README patterns = 30 sync targets**

### Files explicitly WITHOUT version headers (do not sync):
- `CLAUDE.md` — no version header (only CLAUDE.vi.md has it)
- 13 English skill docs (research, plan, scan, init, new-milestone, complete-milestone, write-code, test, fix-bug, what-next, update, fetch-doc, index)
- 3 English workflow docs (getting-started, milestone-management, bug-fixing)
- `docs/workflows/README.md`

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual version bumps | Automated sync from package.json | This phase | Eliminates human error in version updates |

**No deprecated approaches** — this is a new feature with no predecessor.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `node:test` and `node:assert/strict` are the correct test framework (no migration to vitest/jest planned) | Standard Stack | Tests need rewrite if framework changes |
| A2 | The `<!-- Source version: -->` pattern is stable and won't be reformatted | Architecture | Regex would need updating |
| A3 | `model: haiku` is appropriate for this skill (as used by stats.md and health.md) | Architecture | Wrong model may cause quality issues |
| A4 | The skill file won't need a separate workflow file (D-13 inlines it) | Architecture | Need to create workflow file if D-13 changes |

**Low risk:** All assumptions are directly supported by verified codebase patterns.

## Open Questions

1. **Should the tool also sync README.vi.md badge/text?**
   - What we know: README.vi.md has `<!-- Source version: -->` header (line 2) but may also have a badge URL and version text line
   - What's unclear: Whether README.vi.md has the same badge/text patterns as README.md
   - Recommendation: Check README.vi.md content during implementation; if it has badge/text patterns, include them in sync targets

2. **Should `--check` exit with non-zero code on mismatches?**
   - What we know: CONTEXT.md doesn't specify exit behavior
   - What's unclear: Whether CI integration is planned
   - Recommendation: Agent's discretion — implement as simple output for now; exit code can be added later

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified)

This phase uses only Node.js built-in modules. No external tools, services, or runtimes are required.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | ✓ | v24.13.0 | — |
| npm | Dev scripts | ✓ | v11.6.2 | — |

**Missing dependencies with no fallback:** None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in) |
| Config file | none — standard `node --test` |
| Quick run command | `node --test test/version-sync.test.js` |
| Full suite command | `node --test test/version-sync.test.js` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| L-01 | Extract version from package.json content | unit | `node --test test/version-sync.test.js` | ❌ Wave 0 |
| L-01 | Extract version from badge URL pattern | unit | `node --test test/version-sync.test.js` | ❌ Wave 0 |
| L-01 | Extract version from text line pattern | unit | `node --test test/version-sync.test.js` | ❌ Wave 0 |
| L-01 | Extract version from doc comment pattern | unit | `node --test test/version-sync.test.js` | ❌ Wave 0 |
| L-01 | Replace version in all 3 patterns | unit | `node --test test/version-sync.test.js` | ❌ Wave 0 |
| L-01 | Compare versions and report mismatches | unit | `node --test test/version-sync.test.js` | ❌ Wave 0 |
| L-01 | Format check results as boxed table | unit | `node --test test/version-sync.test.js` | ❌ Wave 0 |
| L-01 | Handle missing/null content gracefully | unit | `node --test test/version-sync.test.js` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test test/version-sync.test.js`
- **Per wave merge:** `node --test test/version-sync.test.js`
- **Phase gate:** Full test suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `test/version-sync.test.js` — covers all L-01 unit tests for pure functions
- [ ] `bin/lib/version-sync.js` — library module to test against

*(No existing test infrastructure gaps — the project already uses node:test extensively)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | N/A — no auth |
| V3 Session Management | no | N/A — no sessions |
| V4 Access Control | no | N/A — no access control |
| V5 Input Validation | yes | Regex validation on version strings (semver pattern `\d+\.\d+\.\d+`) |
| V6 Cryptography | no | N/A — no crypto |

### Known Threat Patterns for Node.js File Processing

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal | Tampering | Glob tool constrains file paths; no user-supplied paths |
| ReDoS | Denial of Service | Simple anchored regex patterns — no catastrophic backtracking possible |
| JSON injection | Tampering | JSON.parse on controlled file (package.json), not user input |

**Low security surface:** This tool reads project files and updates version strings. No user input flows into file paths or regex patterns.

## Sources

### Primary (HIGH confidence)
- `bin/lib/health-checker.js` — pure-function pattern, SEVERITY_LEVEL enum, boxed table output
- `bin/lib/stats-collector.js` — padRight, formatStatsTable pattern
- `bin/lib/utils.js` — log object, colorize, COLORS, parseFrontmatter
- `commands/pd/stats.md` — skill file structure, frontmatter format, model: haiku
- `commands/pd/health.md` — skill file structure, read-only diagnostic pattern
- `test/health-checker.test.js` — test file structure, describe/test pattern, assertion style
- `.planning/codebase/CONVENTIONS.md` — naming, exports, error handling, logging patterns
- `.planning/codebase/STRUCTURE.md` — where to add new code

### Secondary (MEDIUM confidence)
- Direct codebase verification of version patterns in README.md, package.json, CLAUDE.vi.md
- Grep scan confirming 28 files with `<!-- Source version: -->` header

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero external dependencies, all built-in Node.js
- Architecture: HIGH — directly following verified patterns from health-checker.js and stats.md
- Pitfalls: HIGH — all verified by codebase inspection (file counts, pattern locations)

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable — no fast-moving dependencies)
