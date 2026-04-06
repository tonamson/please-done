# Phase 139: Planning Health Diagnostics - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-06
**Phase:** 139-planning-health-diagnostics
**Areas discussed:** Issue detection scope, Severity classification, Fix suggestion format, Output format, Repair mode

---

## Issue Detection Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Core checks | Missing VERIFICATION.md/SUMMARY.md, STATE.md fields, orphaned phase dirs | ✓ |
| Core + extended | + stale maps, empty dirs, orphaned files, checkpoints | |
| Comprehensive | + cross-file consistency, requirement-to-phase mapping | |

**User's choice:** Core checks
**Notes:** Extended and cross-file checks deferred to keep scope tight. Cross-file consistency aligns with Phase 144 (Schema Drift Detection).

## Severity Classification

| Option | Description | Selected |
|--------|-------------|----------|
| 3 levels | critical / warning / info | ✓ |
| 2 levels | error / warning | |
| 4 levels | critical / error / warning / info | |

**User's choice:** 3 levels (critical/warning/info)
**Notes:** Matches staleness-detector pattern. Simple but sufficient granularity.

## Fix Suggestion Format

| Option | Description | Selected |
|--------|-------------|----------|
| Actionable command | Concrete CLI command per issue | ✓ |
| Descriptive guidance | General remediation direction | |
| Hybrid | Command when possible, description as fallback | |

**User's choice:** Actionable command
**Notes:** Each issue should show a runnable command or specific action step.

## Output Format

| Option | Description | Selected |
|--------|-------------|----------|
| Summary + grouped tables | Counts at top, boxed tables by category | ✓ |
| Single flat table | All issues in one table sorted by severity | |
| Grouped by phase | Issues listed under each phase | |

**User's choice:** Summary + grouped tables
**Notes:** Consistent with pd:stats boxed table pattern. Category grouping makes scanning easy.

## Repair Mode

| Option | Description | Selected |
|--------|-------------|----------|
| Read-only only | Diagnose and report only, no --fix | ✓ |
| Safe repairs only | --fix for delete empty dirs, remove checkpoints | |
| Safe + forced repairs | --fix + --force-fix for schema corrections | |

**User's choice:** Read-only only
**Notes:** Consistent with pd:stats pattern. Keeps scope tight. Phases 143/144 will build on detection patterns.

## Claude's Discretion

- Exact table formatting details
- --json flag inclusion
- Regex patterns for STATE.md parsing
- Error handling specifics

## Deferred Ideas

None — discussion stayed within phase scope.
