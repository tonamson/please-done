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
