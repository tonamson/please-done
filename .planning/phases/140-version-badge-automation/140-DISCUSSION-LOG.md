# Phase 140: Version Badge Automation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-06
**Phase:** 140-version-badge-automation
**Mode:** Auto (--auto flag)

---

## Version Source

| Option | Description | Selected |
|--------|-------------|----------|
| package.json | Single source of truth via require() or JSON parse | ✓ |
| git tags | Parse version from latest git tag | |
| manual input | User provides version as argument | |

**Mode:** Auto-selected (recommended)

## Target Files

| Option | Description | Selected |
|--------|-------------|----------|
| README.md + doc headers | Badge URL + text line + <!-- Source version --> comments | ✓ |
| All .md files | Scan every markdown file for version patterns | |
| README.md only | Just the badge and text | |

**Mode:** Auto-selected (recommended)

## Check vs Sync

| Option | Description | Selected |
|--------|-------------|----------|
| Default sync + --check flag | Sync by default, validate-only with --check | ✓ |
| Check only | Read-only validation only (like pd:health) | |
| Sync only | Always modify files | |

**Mode:** Auto-selected (recommended) — note this is NOT read-only like pd:stats/pd:health; it does write files in sync mode

## Milestone Integration

| Option | Description | Selected |
|--------|-------------|----------|
| Non-blocking on completion | Warn on failure, don't halt | ✓ |
| Blocking gate | Fail milestone completion if sync fails | |
| No integration | Standalone command only | |

**Mode:** Auto-selected (recommended)

## Claude's Discretion

- Exact regex patterns for version detection
- Table formatting details
- --json flag inclusion
- --dry-run alias for --check

## Deferred Ideas

None — discussion stayed within phase scope.
