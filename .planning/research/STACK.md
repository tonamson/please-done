# Stack Research: Installation UX & Docs (v12.3)

**Project:** please-done v12.3 Installation UX & Documentation
**Researched:** 2026-04-07
**Confidence:** HIGH — based on direct code inspection of bin/install.js, bin/lib/utils.js, package.json, and REQUIREMENTS.md

---

## Installer UX

### Current State (verified from code)

`bin/install.js` (415 lines) already has a functional `log` utility in `bin/lib/utils.js` with:
- `log.step(num, total, msg)` → yellow `[N/M] msg`
- `log.success(msg)` → green `✓ msg`
- `log.error(msg)` → red `✗ msg`
- `log.warn(msg)` → yellow `⚠ msg`
- `log.banner(lines)` → cyan box

**Gap:** The `install()` dispatcher calls `log.info()` for the platform name and a final `log.success()`, but individual sub-operations (backup check, installer run, manifest write, path leak scan, agent sync) emit no step labels. Users see a wall of silence between "Installing for Claude Code" and "Claude Code — done!".

### Recommended approach: Enhance existing `log.step` calls — no new libraries

Add `log.step(N, TOTAL, label)` calls around each named sub-operation inside `install()`. The primitives are already built; only the call-sites are missing.

**Pattern to implement in `install()`:**
```javascript
const STEPS = ['Backup check', 'Install files', 'Write manifest', 'Verify paths', 'Sync agents'];

log.step(1, 5, 'Checking for local modifications...');
const patchCount = saveLocalPatches(targetDir);

log.step(2, 5, `Installing ${platform.name} skills → ${targetDir}`);
// installer.install(...)

log.step(3, 5, 'Writing manifest...');
writeManifest(targetDir, VERSION, installedDirs);
// etc.
```

Each step fires `log.step()` before the operation and `log.success()` or `log.error()` after, creating the per-step ✓/✗ output required by INSTALL-01.

**For individual platform installers** (`bin/lib/installers/claude.js` etc.), pass a `progress` callback:
```javascript
await installer.install(SCRIPT_DIR, targetDir, {
  isGlobal, version: VERSION,
  onProgress: (msg) => log.success(msg)  // ← new
});
```

This lets installers surface individual file operations (e.g., "Copied pd:plan") without requiring them to import `log` directly.

### Actionable errors (INSTALL-02)

**Current:** `main().catch(err => { log.error(err.message); process.exit(1) })` — raw message, no fix hint.

**Recommended:** Add `InstallError` class with `hint` field (10 lines in `bin/lib/utils.js`):
```javascript
class InstallError extends Error {
  constructor(message, { hint = null, code = 'INSTALL_FAILED' } = {}) {
    super(message);
    this.name = 'InstallError';
    this.hint = hint;
    this.code = code;
  }
}
```

Error categories and hints:
| Category | Code | Example hint |
|----------|------|--------------|
| Missing CLI | `MISSING_DEP` | `Install with: npm install -g @anthropic-ai/claude-code` |
| Permission denied | `PERMISSION` | `Run with sudo or change ownership of ~/.config/claude/` |
| Unknown platform | `BAD_PLATFORM` | `Valid platforms: --claude --codex --gemini --opencode --copilot` |
| Already up-to-date | `NO_CHANGE` | (info, not error) |

**In `main().catch`:**
```javascript
main().catch((err) => {
  log.error(err.message);
  if (err.hint) console.log(colorize('cyan', `  → Fix: ${err.hint}`));
  if (process.env.PD_DEBUG) console.error(err.stack);
  process.exit(err.code === 'NO_CHANGE' ? 0 : 1);
});
```

### Idempotency (INSTALL-03)

The manifest system already tracks installed files via SHA256. Gap: installers do not check the manifest before overwriting — they always copy.

**Recommended:** In each platform installer, before `fs.copyFileSync(src, dest)`, call `fileHash()` on both. If equal, skip and report "already up to date". If changed, copy and report "updated". This requires no new APIs — `fileHash` already exists in `bin/lib/utils.js`.

---

## Interactive Selector

### Current state

`promptRuntime()` in `bin/install.js` (line 129-151) shows a numbered list and reads input via `readline.question()`. Non-TTY case is handled in `main()` by defaulting to `["claude"]`.

### Recommended: Node.js raw mode — zero external dependencies

Node.js ≥16.7 (already required by `package.json` `engines`) provides everything needed for arrow-key navigation via:
1. `readline.emitKeypressEvents(process.stdin)` — parses ANSI escape sequences into named key events
2. `process.stdin.setRawMode(true)` — captures keystrokes without Enter

**Implementation pattern** (drop-in replacement for `promptRuntime()`):
```javascript
async function promptArrow(title, options) {
  // Non-TTY: fall back to numbered list (CI-safe)
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    return numberedPrompt(title, options);  // existing readline approach
  }

  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);

  let idx = 0;
  const render = () => {
    // Clear N lines, redraw with › on selected item
    process.stdout.write(`\n${title}\n`);
    options.forEach((opt, i) => {
      const prefix = i === idx ? '› ' : '  ';
      const desc = opt.description ? colorize('dim', `  ${opt.description}`) : '';
      console.log(`  ${prefix}${opt.label}${desc}`);
    });
  };

  render();
  return new Promise((resolve) => {
    process.stdin.on('keypress', function handler(_, key) {
      if (!key) return;
      if (key.name === 'up')   idx = (idx - 1 + options.length) % options.length;
      if (key.name === 'down') idx = (idx + 1) % options.length;
      if (key.name === 'return') {
        process.stdin.setRawMode(false);
        process.stdin.removeListener('keypress', handler);
        resolve(options[idx].value);
      }
      if (key.ctrl && key.name === 'c') { process.exit(0); }
      render();
    });
  });
}
```

**Each option object:**
```javascript
{ label: 'Claude Code', description: 'Best for Claude Code CLI', value: 'claude' }
```

This satisfies INSTALL-04 requirements:
- Arrow-key navigation ✓
- One-line description per platform ✓
- Confirmation via Enter ✓
- Non-TTY numbered fallback ✓ (already in place, preserved)

**ANSI cursor clearing** for clean re-render: use `process.stdout.write('\x1b[' + N + 'A\x1b[J')` to move cursor up and clear before redrawing. N = number of options + 2 (title + blank).

---

## Zero-dep constraint

**Recommendation: KEEP ZERO EXTERNAL RUNTIME DEPENDENCIES. Strong.**

### Evidence

1. `package.json` has **no `dependencies` field** at all — only `devDependencies` (`c8`, `js-tiktoken`, `js-yaml`). The zero-dep posture is already established policy.
2. `bin/install.js` requires: `fs`, `path`, `readline`, `crypto`, `child_process` — all Node.js core.
3. The tool is consumed via `npx please-done`. Any entry in `dependencies` gets downloaded on first npx run, adding latency for every new-user install.
4. Node.js 16.7+ (already required) provides every primitive needed for this milestone: `readline.emitKeypressEvents`, raw mode, ANSI escapes, `fs.copyFileSync`, SHA256 via `crypto`.

### Library analysis (why NOT to add them)

| Library | Purpose | Why avoid |
|---------|---------|-----------|
| `@inquirer/prompts` | Arrow-key select + confirm | ~1.2MB transitive deps; adds to `npx` download; overkill for 6-item menus |
| `inquirer` v9 | Same | ESM-only in v9+; would require `"type": "module"` change or dynamic import hack |
| `ora` | Animated spinner | Useful polish, but file copies complete in <1s; spinner adds 200KB for no real value |
| `listr2` | Task runner with progress tree | Requires structural rewrite of `install()` to fit task-object API; high effort, low gain |
| `chalk` | Terminal colors | `bin/lib/utils.js` already has a 10-line ANSI colors implementation — redundant |

### What zero-dep means for the implementation

All INSTALL-01 through INSTALL-04 requirements are achievable with:
- Existing `log.step/success/error/warn` in `bin/lib/utils.js`
- New `InstallError` class (~15 lines in `bin/lib/utils.js`)
- Raw mode arrow-key selector (~50 lines replacing `promptRuntime()`)
- Per-step `log.step()` call sites added to `install()` and platform installers

**Estimated complexity:** LOW-MEDIUM. Purely additive changes to existing functions. No new files required beyond the enhanced `install()`. All changes testable with existing `test/smoke-installers.test.js` patterns.

---

## Documentation tooling

**None required.** All documentation work (DOCS-01 through DOCS-05) is pure Markdown content editing:

| Doc | Action | Tooling needed |
|-----|--------|----------------|
| `README.md` | Content update (commands, version badge) | None — edit in place |
| `docs/cheatsheet.md` | Add 5 commands, update format | None |
| `docs/COMMAND_REFERENCE.md` | Full rewrite as table format | None |
| `docs/WORKFLOW_OVERVIEW.md` | Shorten to ≤60 lines + ASCII/Mermaid diagram | Mermaid render optional (already in `bin/lib/mermaid-validator.js` if needed) |
| `docs/GETTING_STARTED.md` | New file — step-by-step guide | None |

Mermaid diagrams in `WORKFLOW_OVERVIEW.md` render natively in GitHub, VS Code, and the Claude/Codex viewers. No build step needed. `bin/lib/mermaid-validator.js` exists if syntax validation is wanted during development.

---

## Sources

- `bin/install.js` (direct inspection, all 415 lines)
- `bin/lib/utils.js` (direct inspection — confirmed existing `log.*` API)
- `package.json` (direct inspection — confirmed zero runtime deps)
- `.planning/REQUIREMENTS.md` (v12.3 requirements, INSTALL-01 through DOCS-05)
- Node.js docs: `readline.emitKeypressEvents`, `process.stdin.setRawMode` — available since Node.js 0.7.7, confirmed stable in ≥16.7
- npm size analysis: `@inquirer/prompts` ~1.2MB install, `ora` ~200KB, `listr2` ~400KB (training data, LOW confidence on exact sizes — but "deps add weight" is HIGH confidence)

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Current install.js state | HIGH | Direct code inspection |
| Zero-dep recommendation | HIGH | No `dependencies` in package.json is explicit policy; Node.js primitives confirmed sufficient |
| Arrow-key selector (raw mode) | HIGH | `readline.emitKeypressEvents` + `setRawMode` are stable Node.js core APIs since v0.x |
| Actionable error pattern | HIGH | Simple class extension, well-established pattern |
| Step display approach | HIGH | `log.step()` already exists; only call-sites need adding |
| Docs tooling (none) | HIGH | Pure content edits; no pipeline needed |
| External lib sizes | LOW | From training data, not verified at time of research |

---

# Technology Stack: Code Quality & Patterns for v12.1

**Project:** please-done v12.1 Quality Hardening
**Researched:** 2026-04-06
**Confidence:** HIGH

## Executive Summary

The v12.1 milestone focuses on bug fixes and quality hardening. This research identifies established patterns in the codebase for error handling, testing, documentation, and cross-platform support. The project follows Node.js native testing (`node --test`), pure function libraries, and consistent error reporting via the `log` module.

## v12.1 Milestone Items & Quality Patterns

### C-01: Fix 5 Broken Command References

**Pattern:** Reference validation must verify file existence before documentation links.

**Code Quality Patterns:**
- Use `fs.existsSync()` to validate referenced paths exist
- CLI scripts should use graceful error messages with `process.exit(1)` for missing references
- Maintain a reference registry in `bin/lib/platforms.js` to track valid command names

**Testing Best Practices:**
- Create smoke tests that verify all documented command references resolve to existing files
- Pattern from `test/smoke-error-handling.test.js`: use regex to scan for broken references
- Add integration tests that parse command docs and validate all `@command/` and `@workflow/` references

**Example Fix Pattern:**
```javascript
// Verify command reference exists
const commandPath = path.join(skillsDir, `commands/pd/${commandName}.md`);
if (!fs.existsSync(commandPath)) {
  console.error(`Command not found: ${commandName}`);
  process.exit(1);
}
```

---

### C-02: Fix Test Script for Complete Coverage

**Current Issue:** `package.json` test script only runs `test/*.test.js`, missing:
- `test/smoke/*.test.js` (40 files)
- `test/integration/*.test.js` (7 files)

**Established Pattern:**
The codebase uses Node.js native test runner with glob patterns:
```javascript
// package.json scripts
"test": "node --test 'test/**/*.test.js'"
```

**Testing Best Practices:**
1. **Comprehensive test discovery:** Use `'test/**/*.test.js'` recursive glob
2. **Separation of concerns:**
   - `test/*.test.js` — unit tests for core libraries
   - `test/smoke/*.test.js` — smoke tests for installers, converters
   - `test/integration/*.test.js` — integration tests for workflows
3. **Coverage threshold:** Add `c8 --check-coverage --lines 70` for quality gate
4. **Test organization:** Each test file uses `describe/it` from `node:test`

**Recommended package.json changes:**
```json
{
  "scripts": {
    "test": "node --test 'test/**/*.test.js'",
    "test:smoke": "node --test 'test/smoke/*.test.js'",
    "test:integration": "node --test 'test/integration/*.test.js'",
    "test:coverage": "c8 --check-coverage --lines 70 node --test 'test/**/*.test.js'"
  },
  "devDependencies": {
    "c8": "^11.0.0"
  }
}
```

---

### C-04: Update CHANGELOG

**Pattern:** CHANGELOG entries follow semver with date-based entries.

**Documentation Standards:**
- Format: `## [version] - YYYY-MM-DD`
- Use imperative mood ("Add", "Fix", "Update")
- Group by: Added, Changed, Fixed, Removed
- Reference phase numbers for tracking

**Existing Pattern from CHANGELOG.md:**
```markdown
## [2.8.0] - 21_03_2026
### Changed
- **Rules**: Reduced token cost -79%...
### Added
- **Skill `/pd:conventions`**: ...
```

---

### H-01: Fix Bare Catch Blocks with Logging

**Established Pattern:** The codebase uses two error handling patterns:

**Pattern A — PD_DEBUG logging (CLI utilities):**
```javascript
// bin/plan-check.js:66-68
} catch (err) {
  if (process.env.PD_DEBUG) console.error('[plan-check] research dir read error:', err);
}
```

**Pattern B — log.warn (library modules):**
```javascript
// bin/lib/manifest.js style
} catch (err) {
  log.warn(`Failed to read manifest: ${err.message}`);
  return null;
}
```

**Code Quality Rules:**
1. **Never use empty `catch {}`** — always log or handle the error
2. **For library code:** Use `log.warn()` from `bin/lib/utils.js`
3. **For CLI code:** Use `console.error()` with `PD_DEBUG` guard
4. **For recoverable errors:** Return null/default value with warning
5. **For fatal errors:** Throw with descriptive message

**Testing Best Practices:**
- `test/smoke-error-handling.test.js` already checks for bare catches using regex
- Extend TARGET_FILES array to include any new files with catch blocks
- Verify logging exists with pattern matching:
```javascript
const hasLogging = block.includes('log.warn') || block.includes('throw');
```

---

### H-02: Refactor process.exit(1) in Installers

**Current Issue:** `bin/lib/installers/claude.js` has 6 `process.exit(1)` calls making it:
- Non-reusable in non-CLI contexts
- Hard to test properly

**Established Pattern:** Other installers (codex, gemini, opencode, copilot) use `throw new Error()` and let `bin/install.js` handle exit.

**Code Quality Patterns:**
1. **Replace `process.exit(1)` with `throw new Error(...)`**
2. **Let caller (bin/install.js) handle exit code**
3. **installer-utils.js provides shared utilities** — use `ensureDir()`, `savePdconfig()`, `cleanOldFiles()`

**Refactoring Pattern:**
```javascript
// BEFORE (claude.js)
if (!commandExists("claude")) {
  throw new Error("Claude Code CLI not installed..."); // Already throws - good
}
// But some places use process.exit(1) directly

// AFTER
// All error conditions should throw, not call process.exit()
// bin/install.js wraps installer calls with try/catch + process.exit(1)
```

**Testing Best Practices:**
- `test/smoke-installers.test.js` tests installers to temp directories
- Use `before/after` hooks for setup/teardown
- Test idempotency (install twice, verify no duplication)
- Test uninstall cleans all artifacts

---

### H-03: Create 4 Missing Command Docs

**Documentation Standards:** Docs follow consistent structure in `docs/skills/`:

**Required Sections:**
1. `# Skill: [name]` — Title
2. `## Purpose` — One paragraph summary
3. `## When to Use` — Bulleted list of use cases
4. `## Prerequisites` — Checkbox list
5. `## Basic Command` — Code block with command syntax
6. `## Common Flags` — Table with Flag, Description, Example
7. `## See Also` — Links to related docs

**Existing Examples:**
- `docs/skills/onboard.md` (50 lines) — simple skill
- `docs/skills/audit.md` (144 lines) — complex skill with multiple modes

**Pattern for Missing Docs:**
| Missing Doc | Based On | Complexity |
|------------|----------|------------|
| `docs/skills/audit.md` | Already exists in `commands/pd/audit.md` | Copy from commands |
| `docs/skills/conventions.md` | Already exists | Update if outdated |
| `docs/skills/onboard.md` | Already exists | Update if outdated |
| `docs/skills/status.md` | Already exists | Update if outdated |

**Note:** `docs/skills/audit.md` already exists at 144 lines with comprehensive PTES documentation. Verify if `commands/pd/audit.md` matches `docs/skills/audit.md` or if they serve different purposes.

---

### H-06: Cleanup Orphaned Files

**Pattern:** File categorization from `list-cai-thien.md`:

| File | Status | Action |
|------|--------|--------|
| `workflows/legacy/fix-bug-v1.5.md` | Orphaned | Archive to `docs/archive/` or remove |
| `references/mermaid-rules.md` | Unused reference | Wire into command or remove |
| `de_xuat_cai_tien.md` | Vietnamese improvement doc | Translate to English or archive |
| `N_FIGMA_TO_HTML_NOTES.md` |杂 Notes | Move to `docs/notes/` |
| `INTEGRATION_GUIDE.md` | Has references but file exists | Verify or create |

**Code Quality Patterns:**
1. **Reference tracking:** Use `grep` to find which files reference orphaned files
2. **Gradual removal:** Move to `docs/archive/` before deleting (git preserves history)
3. **Documentation consistency:** All docs should be in `docs/` directory

**Verification Pattern:**
```bash
# Find files not referenced by any command
for file in workflows/legacy/*; do
  grep -r "$(basename $file)" commands/ references/ docs/ || echo "ORPHANED: $file"
done
```

---

### H-07: Universal Cross-Runtime Support

**Current State:**
- `CLAUDE.md` exists — Claude Code specific
- Missing `AGENTS.md` — universal source of truth
- Various runtime configs exist but may not be synchronized

**Pattern for Cross-Runtime:**

**1. Universal Command Names:**
- Use `/pd:` prefix (runtime-agnostic)
- Avoid runtime-specific references like "Claude will..."

**2. File Structure:**
```
AGENTS.md (source of truth)
├── CLAUDE.md → symlink or copy
├── GEMINI.md → symlink or copy
├── .cursorrules → copy
├── .clinerules → copy
└── .github/copilot-instructions.md → copy
```

**3. Sync Pattern (from `list-cai-thien.md`):**
```javascript
// bin/sync-instructions.js
const SOURCE = path.join(process.cwd(), 'CLAUDE.md');
const TARGETS = [
  { path: 'AGENTS.md', format: 'universal' },
  { path: 'GEMINI.md', format: 'universal' },
  // ...
];

function sync() {
  const content = fs.readFileSync(SOURCE, 'utf8');
  for (const target of TARGETS) {
    fs.writeFileSync(target.path, content);
  }
}
```

**Code Quality Patterns:**
1. **Runtime detection:** `bin/lib/platforms.js` already handles multi-platform
2. **Graceful degradation:** Check tool availability before using
3. **Tool constraints:** Each runtime has different tool support

**Testing Best Practices:**
- Test on multiple runtimes (at least 3: Claude, Gemini, OpenCode)
- Smoke tests for each platform: `test/smoke-installers.test.js`
- Path leak detection: verify no `~/.claude/` in non-Claude outputs

---

## Cross-Cutting Quality Standards

### Error Handling
| Context | Pattern | Example |
|---------|---------|---------|
| Library code | `log.warn()` | `bin/lib/utils.js` |
| CLI code | `console.error()` + `PD_DEBUG` | `bin/plan-check.js` |
| Recoverable | Return null/default | `fileHash()` returns null on error |
| Fatal | Throw Error | Installer prerequisite checks |

### Testing Patterns
| Type | Location | Runner |
|------|----------|--------|
| Unit | `test/*.test.js` | `node --test` |
| Smoke | `test/smoke/*.test.js` | `node --test` |
| Integration | `test/integration/*.test.js` | `node --test` |

### Documentation Patterns
| Doc Type | Location | Format |
|----------|----------|--------|
| Skill Docs | `docs/skills/*.md` | Markdown with sections |
| Command Docs | `commands/pd/*.md` | XML frontmatter + markdown |
| References | `references/*.md` | Markdown |
| Workflows | `workflows/*.md` | XML sections |

---

## Sources

- **Error handling:** `bin/plan-check.js`, `bin/lib/utils.js`, `bin/lib/manifest.js`
- **Testing:** `test/smoke-error-handling.test.js`, `test/smoke-installers.test.js`
- **Documentation:** `docs/skills/onboard.md`, `docs/skills/audit.md`, `docs/skills/conventions.md`, `docs/skills/status.md`
- **Installer patterns:** `bin/lib/installers/codex.js`, `bin/lib/installers/gemini.js`, `bin/lib/installer-utils.js`
- **Package.json:** `package.json` scripts section
- **Cross-runtime:** `list-cai-thien.md` Section H-07

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|-------|
| Error handling patterns | HIGH | Established patterns in 15+ JS files, verified with smoke tests |
| Testing patterns | HIGH | Consistent use of `node --test`, 40+ test files exist |
| Documentation standards | HIGH | 16 skill docs follow consistent structure |
| Cross-runtime patterns | MEDIUM | Patterns documented but AGENTS.md not yet created |
| Installer refactoring | HIGH | installer-utils.js already extracted, other installers show pattern |
