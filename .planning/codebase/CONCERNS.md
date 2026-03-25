# Concerns

## Technical Debt

### Converter Duplication
- **Location:** `bin/lib/converters/codex.js`, `copilot.js`, `gemini.js`, `opencode.js`
- **Issue:** Each converter implements similar transformation logic (path rewriting, skill reference conversion, tool name mapping) with platform-specific variations. Shared patterns are not abstracted.
- **Impact:** Adding a new platform requires duplicating ~80% of logic. Bug fixes must be applied to all 4 converters.

### Silent Error Handling
- **Location:** Multiple files in `bin/lib/`
- **Issue:** Some operations silently catch and ignore errors rather than propagating or logging them.
- **Impact:** Failed installations or conversions may appear successful.

### No Uninstall Verification
- **Location:** `bin/install.js` (uninstall scripts)
- **Issue:** Uninstall operations don't verify that artifacts were actually removed.
- **Impact:** Partial uninstalls may leave orphaned files.

## Security Considerations

### Symlink-Based Installation (Claude)
- **Location:** `bin/lib/installers/claude.js`
- **Issue:** Claude installer uses symlinks pointing to absolute paths. If the source repo is moved or deleted, symlinks break silently.
- **Impact:** Skills stop working without clear error messages.

### Git Submodule (FastCode)
- **Location:** `FastCode/` directory
- **Issue:** FastCode is a git submodule. Updates pull external code without validation.
- **Impact:** Supply chain risk if submodule source is compromised.

## Performance

### Sequential Manifest Hashing
- **Location:** `bin/lib/manifest.js`
- **Issue:** Manifest generation hashes files sequentially.
- **Impact:** Slow for large skill sets. Could be parallelized with `Promise.all`.

### Multiple Regex Passes in Converters
- **Location:** `bin/lib/converters/*.js`
- **Issue:** Converters make multiple regex passes over the same content for different transformations.
- **Impact:** Could be combined into fewer passes for better performance.

## Fragile Areas

### Platform Path Resolution
- **Location:** `bin/lib/platforms.js`, `bin/lib/installers/*.js`
- **Issue:** Path resolution depends on OS-specific conventions (`~/.claude/`, `~/.codex/`, etc.). Cross-platform edge cases (Windows WSL, non-standard home dirs) may not be handled.
- **Impact:** Installation may fail on non-standard environments.

### Frontmatter Parsing
- **Location:** `bin/lib/utils.js` — `parseFrontmatter`, `buildFrontmatter`
- **Issue:** Custom YAML-like frontmatter parser (not using a YAML library). Handles basic key-value and arrays but may not cover all edge cases.
- **Impact:** Complex frontmatter values could parse incorrectly.

### Workflow Inlining
- **Location:** `bin/lib/utils.js` — `inlineWorkflow`
- **Issue:** Commands reference workflows that get inlined during installation. If workflow structure changes, inlining logic may produce malformed output.
- **Impact:** Broken skill content after installation.

## Test Gaps

### No Integration Tests with Real Platforms
- Tests verify converter/installer logic in isolation but don't test actual installation into real platform directories.

### No Windows Testing
- All tests assume Unix-like paths. No CI/CD for Windows or WSL environments.

### Converter Edge Cases
- Tests use sample data but may not cover all real-world skill content variations (deeply nested XML, special characters in frontmatter, etc.).

### No Rollback Testing
- No tests verify that failed installations are properly cleaned up.

## Missing Features

### No Rollback Mechanism
- Failed installations leave partial state. No automatic rollback to previous working state.

### No Skill Dependency Resolution
- Skills can reference other skills (`/pd:init` before `/pd:scan`) but there's no formal dependency graph or validation.

### Cross-Platform Test Gap
- `smoke-all-platforms.test.js` exists but actual cross-platform CI is not configured.

### No Update Diff Preview
- `/pd:update` pulls latest but doesn't show what changed before applying.
