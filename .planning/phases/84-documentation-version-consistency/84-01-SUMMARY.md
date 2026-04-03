---
phase: 84-documentation-version-consistency
plan: 01
subsystem: documentation
tags: [documentation, version-consistency, readme, changelog]
dependency_graph:
  requires: []
  provides:
    - README version badge fixed to 4.0.0
    - README Supported Tech Stacks section
    - CHANGELOG deprecation notice
  affects:
    - README.md
    - CHANGELOG.md
tech_stack:
  added: []
  patterns: [markdown-documentation, badge-versioning]
key_files:
  created: []
  modified:
    - README.md
    - CHANGELOG.md
decisions:
  - Placed Supported Tech Stacks section after stack detection table (lines 486-490) to match ToC entry
  - Used existing "Extending with a new stack" text in new section to maintain continuity
metrics:
  duration: ~3m
  completed: 2026-04-03T09:39:11Z
  tasks_completed: 3
  files_modified: 2
---

# Phase 84 Plan 01: Fix README.md version badge and add Supported Stacks section; add deprecation notice to CHANGELOG.md Summary

**One-liner:** Fixed README version badge to 4.0.0, added Supported Tech Stacks table with all 6 frameworks, and added CHANGELOG deprecation notice pointing to MILESTONES.md

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix README.md version badge (DOC-01) | 56a6582 | README.md |
| 2 | Add Supported Stacks section to README.md (D-04) | 4f9c484 | README.md |
| 3 | Add deprecation notice to CHANGELOG.md (DOC-04) | 9e5ddf0 | CHANGELOG.md |

## Changes Made

### Task 1: Fix README.md version badge (DOC-01)
- Changed badge URL from `version-2.8.0-blue.svg` to `version-4.0.0-blue.svg` on line 3
- Updated version text from `**Current version: v2.8.0**` to `**Current version: v4.0.0**` on line 14
- Now consistent with VERSION file (source of truth: 4.0.0)

### Task 2: Add Supported Stacks section to README.md (D-04)
- Added `### Supported Tech Stacks` heading
- Created table with all 6 stacks from `commands/pd/rules/`:
  - Flutter: Dart conventions, GetX state management, Dio HTTP
  - NestJS: TypeScript decorators, dependency injection, guards
  - NextJS: App Router patterns, server components, data fetching
  - Solidity: OpenZeppelin v5, SafeERC20, gas optimization
  - WordPress: WP coding standards, sanitize/escape, REST API
  - General: Fallback conventions for unlisted frameworks
- Added note about auto-detection by `/pd:init`
- Preserved "Extending with a new stack" guidance

### Task 3: Add deprecation notice to CHANGELOG.md (DOC-04)
- Added deprecation note as first line: `> **Note:** This changelog is frozen at v2.8.0. For history from v3.0 onward, see [MILESTONES.md](.planning/MILESTONES.md).`
- Links to `.planning/MILESTONES.md` for modern history
- All existing changelog entries preserved intact (file now 310+ lines)

## Verification Results

```
DOC-01: PASS - Badge shows version-4.0.0
D-04 heading: PASS - ### Supported Tech Stacks exists
D-04 stacks: PASS - flutter.md and general.md in table
DOC-04: PASS - "frozen at v2.8.0" on line 1
CHANGELOG link: PASS - MILESTONES.md link present
```

## Deviations from Plan

None - plan executed exactly as written.

## Requirements Closed

- **DOC-01**: README version badge displays incorrect version (2.8.0 instead of 4.0.0) — FIXED
- **DOC-04**: CHANGELOG.md has no deprecation notice — FIXED
- **D-04**: Add Supported Stacks section listing all 6 stacks — IMPLEMENTED

## Self-Check: PASSED

- [x] README.md exists and contains version-4.0.0
- [x] README.md contains ### Supported Tech Stacks section
- [x] CHANGELOG.md exists and line 1 contains "frozen at v2.8.0"
- [x] Commit 56a6582 exists (version badge fix)
- [x] Commit 4f9c484 exists (Supported Tech Stacks)
- [x] Commit 9e5ddf0 exists (CHANGELOG deprecation)
