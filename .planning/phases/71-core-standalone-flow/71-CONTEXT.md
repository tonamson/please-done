# Phase 71: Core Standalone Flow - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Add `--standalone` mode to `pd:test` skill and workflow — users can run tests on any module without requiring the full milestone/plan/write-code pipeline. Standard test flow remains 100% unchanged.

</domain>

<decisions>
## Implementation Decisions

### Standalone Argument Parsing
- **D-01:** `--standalone [path]` accepts an optional file or directory path (relative or absolute). If path is a directory, scan and test all source files in it. If path is a single file, test that file specifically.
- **D-02:** `--standalone --all` scans all project source and generates/runs tests for everything.
- **D-03:** `--standalone` alone (no path, no --all) prompts user to provide a path or use --all.
- **D-04:** Invalid/nonexistent path produces a clear error message and stops.

### Guard Implementation
- **D-05:** No new guard files created. Shared guard files (`guard-context.md`, `guard-fastcode.md`, `guard-context7.md`) remain unchanged — only `test.md` changes how it references them.
- **D-06:** Standalone mode: skip `guard-context.md` (CONTEXT.md not required), skip task status check (no tasks exist in standalone).
- **D-07:** FastCode and Context7 changed from hard guards to soft warnings with fallback in standalone mode (FastCode → Grep/Read fallback, Context7 → skip).
- **D-08:** Standard flow guards remain 100% unchanged — identical behavior to current implementation.

### Auto-Detection Strategy
- **D-09:** When CONTEXT.md is missing (standalone mode), auto-detect tech stack via file markers in this priority order:
  1. `nest-cli.json` or `@nestjs/core` in package.json → NestJS
  2. `composer.json` with `wordpress` dependency or `wp-content/` directory → WordPress
  3. `hardhat.config.*` or `foundry.toml` → Solidity
  4. `pubspec.yaml` with `flutter` SDK → Flutter
  5. `package.json` with frontend frameworks (react, vue, angular, next) → Frontend-only
  6. No match → error: "Cannot auto-detect stack."
- **D-10:** Auto-detection is implemented inline in standalone flow Steps S1–S2, not as a separate module or utility.

### Report & Bug Format
- **D-11:** Standalone reports saved as `STANDALONE_TEST_REPORT_[YYYYMMDD_HHMMSS].md` in `.planning/reports/` directory.
- **D-12:** Report content follows the same table structure as standard TEST_REPORT.md, with added header fields: `Mode: Standalone` and `Target: [path or --all]`. No milestone/phase references.
- **D-13:** Standalone bugs use literal `Patch version: standalone` format — not tied to any milestone version.

### Agent's Discretion
- Exact error message wording for auto-detection failures
- How deeply to scan directories when `[path]` points to a directory (shallow vs recursive)
- Ordering of test cases within standalone report

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Skill & Workflow Files (primary targets)
- `commands/pd/test.md` — Current test skill file; Plan 01 modifies this
- `workflows/test.md` — Current test workflow; Plan 02 modifies this

### Guard Files (read-only, behavior reference)
- `references/guard-context.md` — Hard guard for CONTEXT.md; standalone skips this
- `references/guard-fastcode.md` — Hard guard for FastCode MCP; standalone softens to warning
- `references/guard-context7.md` — Hard guard for Context7 MCP; standalone softens to warning

### System References
- `references/state-machine.md` — Prerequisites table and phase states (Phase 72 updates this)
- `references/conventions.md` — Status icons, commit prefixes, patch version format

### Requirements
- `.planning/REQUIREMENTS.md` — TEST-01 through RECOV-01 acceptance criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `workflows/test.md` Steps 1–10: Complete standard test flow that must remain unchanged
- `workflows/test.md` Step 1.5: Recovery mechanism (TEST_REPORT exists / uncommitted test files) — pattern reusable for standalone recovery (RECOV-01)
- `workflows/test.md` Step 2: Test infrastructure check table — reusable for standalone stack setup
- `workflows/test.md` Steps 4–5: Test writing and running logic per stack — reusable for standalone flow

### Established Patterns
- Guard pattern: `@references/guard-*.md` micro-templates included via `<guards>` section in skill files
- Workflow routing: No existing `--mode` routing pattern; Step 0 will be the first instance of mode-based routing in test.md
- Bug reports: Structured header format with `Patch version` field — standalone uses `standalone` literal

### Integration Points
- `commands/pd/test.md` `<guards>` section: Where conditional guard logic is added
- `workflows/test.md` before Step 1: Where Step 0 (route by mode) is inserted
- `workflows/test.md` after Step 10: Where standalone Steps S1–S8 are appended
- `.planning/reports/` directory: Where standalone reports are written (may need creation)

</code_context>

<specifics>
## Specific Ideas

- Standalone flow steps should be numbered S1–S8 (per roadmap success criteria) to clearly distinguish from standard flow Steps 1–10
- Step 0 should be a simple flag check — if `--standalone` present, jump to S1; otherwise continue to Step 1 as normal
- Standard flow Steps 1–10 must NOT be modified in any way (requirement from roadmap Plan 02 Task 3)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 71-core-standalone-flow*
*Context gathered: 2026-03-29*
