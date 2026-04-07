# Codebase Concerns

**Analysis Date:** 2026-04-07

## Tech Debt

**Converter Duplication:**
- **Location:** `bin/lib/converters/codex.js`, `copilot.js`, `gemini.js`, `opencode.js`
- **Issue:** Each converter implements similar transformation logic (path rewriting, skill reference conversion, tool name mapping) with platform-specific variations. Shared patterns are not abstracted.
- **Impact:** Adding a new platform requires duplicating ~80% of logic. Bug fixes must be applied to all 4 converters.
- **Files affected:** All converter files

**Silent Error Handling:**
- **Location:** Multiple files in `bin/lib/`
- **Issue:** Some operations silently catch and ignore errors rather than propagating or logging them.
- **Impact:** Failed installations or conversions may appear successful.
- **Files:** `installers/*.js`, `converters/*.js`

**No Uninstall Verification:**
- **Location:** `bin/install.js` (uninstall scripts)
- **Issue:** Uninstall operations don't verify that artifacts were actually removed.
- **Impact:** Partial uninstalls may leave orphaned files.
- **Files:** `bin/install.js`, `bin/lib/installers/*.js`

**Library Module Proliferation:**
- **Location:** `bin/lib/` - 80+ modules
- **Issue:** Number of modules has grown significantly. Some may have overlapping responsibilities (e.g., multiple logging modules: `log-writer.js`, `audit-logger.js`, `skill-error-logger.js`, `audit-trail.js`).
- **Impact:** Maintenance burden, potential confusion about which module to use.
- **Files:** `bin/lib/*.js`

**TODO Comments in Code:**
- **Location:** `bin/lib/repro-test-generator.js:64,67,70`
- **Issue:** Unfinished implementation with TODO markers.
- **Impact:** Incomplete functionality that may not work as expected.

## Known Issues

**Audit Trail File Paths:**
- **Location:** `bin/lib/audit-trail.js`
- **Issue:** Path matching and double-count issues identified in recent commits.
- **Files:** `bin/lib/audit-trail.js`, `test/audit-trail.test.js`
- **Status:** Recently addressed in commit `9875f13`

**Scope Checker Integration:**
- **Location:** `commands/pd/health.md`, `bin/lib/scope-checker.js`
- **Issue:** New scope-checker module needs integration into health checking workflow.
- **Files:** `bin/lib/scope-checker.js`, `commands/pd/health.md`
- **Status:** Recently added in commit `a3d6059`

## Security Considerations

**Symlink-Based Installation (Claude):**
- **Location:** `bin/lib/installers/claude.js`
- **Issue:** Claude installer uses symlinks pointing to absolute paths. If the source repo is moved or deleted, symlinks break silently.
- **Impact:** Skills stop working without clear error messages.
- **Current mitigation:** None

**Git Submodule (FastCode):**
- **Location:** `FastCode/` directory
- **Issue:** FastCode is a git submodule. Updates pull external code without validation.
- **Impact:** Supply chain risk if submodule source is compromised.
- **Current mitigation:** Manual review of submodule updates required.

**Secret Detection:**
- **Location:** `bin/lib/secret-detector.js`
- **Current mitigation:** Module exists for detecting secrets in code.
- **Risk:** Not integrated into all workflows by default.

## Performance Bottlenecks

**Sequential Manifest Hashing:**
- **Location:** `bin/lib/manifest.js`
- **Issue:** Manifest generation hashes files sequentially.
- **Impact:** Slow for large skill sets. Could be parallelized with `Promise.all`.
- **Files:** `bin/lib/manifest.js`

**Multiple Regex Passes in Converters:**
- **Location:** `bin/lib/converters/*.js`
- **Issue:** Converters make multiple regex passes over the same content for different transformations.
- **Impact:** Could be combined into fewer passes for better performance.
- **Files:** `bin/lib/converters/*.js`

**Large File Processing:**
- **Issue:** Some modules are large (1000+ lines) which may impact maintainability.
- **Largest files:**
  - `bin/lib/plan-checker.js` (~1117 lines)
  - `bin/lib/payloads.js` (~1050 lines)
  - `bin/lib/post-exploit.js` (~1048 lines)
  - `bin/lib/recon-aggregator.js` (~1033 lines)

## Fragile Areas

**Platform Path Resolution:**
- **Location:** `bin/lib/platforms.js`, `bin/lib/installers/*.js`
- **Issue:** Path resolution depends on OS-specific conventions (`~/.claude/`, `~/.codex/`, etc.). Cross-platform edge cases (Windows WSL, non-standard home dirs) may not be handled.
- **Impact:** Installation may fail on non-standard environments.
- **Safe modification:** Test on target platforms before changes.
- **Test coverage:** No Windows/WSL CI testing detected.

**Frontmatter Parsing:**
- **Location:** `bin/lib/utils.js` — `parseFrontmatter`, `buildFrontmatter`
- **Issue:** Custom YAML-like frontmatter parser (not using a YAML library). Handles basic key-value and arrays but may not cover all edge cases.
- **Impact:** Complex frontmatter values could parse incorrectly.
- **Safe modification:** Add test cases for new frontmatter patterns.
- **Test coverage:** Tests exist in `smoke-utils.test.js`.

**Workflow Inlining:**
- **Location:** `bin/lib/utils.js` — `inlineWorkflow`
- **Issue:** Commands reference workflows that get inlined during installation. If workflow structure changes, inlining logic may produce malformed output.
- **Impact:** Broken skill content after installation.
- **Safe modification:** Test converters after workflow changes.
- **Test coverage:** `smoke-converters.test.js` covers basic cases.

**Staleness Detection:**
- **Location:** `bin/lib/refresh-detector.js`, `bin/lib/staleness-detector.js`
- **Issue:** Two similar modules for staleness detection may have overlapping responsibilities.
- **Impact:** Confusion about which to use, potential inconsistent behavior.
- **Files:** `bin/lib/refresh-detector.js`, `bin/lib/staleness-detector.js`

## Scaling Limits

**Test Suite Size:**
- **Current:** 74+ test files
- **Limit:** May slow down CI as tests grow
- **Scaling path:** Parallel test execution, selective test running

**Library Module Count:**
- **Current:** 80+ modules in `bin/lib/`
- **Limit:** Navigation and maintenance burden
- **Scaling path:** Consolidation, clearer module boundaries

**Phase Directory Structure:**
- **Current:** `.planning/milestones/v11.2-phases/` contains many phase subdirectories
- **Limit:** File system performance with many directories
- **Scaling path:** Archive completed milestones

## Dependencies at Risk

**FastCode Submodule:**
- **Risk:** External dependency not under direct control
- **Impact:** If FastCode repository changes significantly, integration may break
- **Migration plan:** Pin to specific commit, monitor for breaking changes

**Platform CLI Dependencies:**
- **Risk:** Claude Code, Codex CLI, Gemini CLI, etc. may change their APIs
- **Impact:** Converter logic may need updates
- **Migration plan:** Version detection in converters, graceful degradation

## Missing Critical Features

**Rollback Mechanism:**
- **Problem:** Failed installations leave partial state. No automatic rollback to previous working state.
- **Blocks:** Safe experimentation with new features

**Skill Dependency Resolution:**
- **Problem:** Skills can reference other skills (`/pd:init` before `/pd:scan`) but there's no formal dependency graph or validation.
- **Blocks:** Complex skill workflows with prerequisites

**Cross-Platform Test Gap:**
- **Problem:** `smoke-all-platforms.test.js` exists but actual cross-platform CI is not configured.
- **Blocks:** Confidence in Windows/WSL support

**Update Diff Preview:**
- **Problem:** `/pd:update` pulls latest but doesn't show what changed before applying.
- **Blocks:** Informed update decisions

**Code Coverage Integration:**
- **Problem:** c8 exists but coverage not enforced or tracked over time.
- **Blocks:** Visibility into untested code

## Test Coverage Gaps

**Real Platform Integration:**
- **What's not tested:** Actual installation into real platform directories
- **Files:** Integration tests simulate but don't test real Claude/Codex/Gemini environments
- **Risk:** Converter output may work in theory but fail in practice
- **Priority:** Medium

**Windows/WSL Testing:**
- **What's not tested:** All tests assume Unix-like paths
- **Files:** Path resolution in `platforms.js`, `installers/*.js`
- **Risk:** Installation failures on Windows
- **Priority:** Medium

**Converter Edge Cases:**
- **What's not tested:** All real-world skill content variations (deeply nested XML, special characters in frontmatter, etc.)
- **Files:** `converters/*.js`
- **Risk:** Rare skill content may break conversion
- **Priority:** Low

**Rollback Testing:**
- **What's not tested:** Failed installation cleanup
- **Files:** `bin/install.js`
- **Risk:** Partial installations leave system in broken state
- **Priority:** Medium

## Codebase Map Staleness

**Current Status:**
- Last mapped: 2026-03-22
- Commits since: 17+ commits
- Staleness level: **aging** (approaching stale threshold of 20 commits)

**Recommendation:**
- Refresh codebase map before next major planning phase
- Current map is functional but may miss recent additions (scope-checker, audit-trail v14, etc.)

---

*Concerns audit: 2026-04-07*
