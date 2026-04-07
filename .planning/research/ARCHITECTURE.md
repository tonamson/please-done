# Architecture Research: Installer UX (v12.3)

**Researched:** 2026-04-07
**Milestone:** v12.3 — Installation & Documentation UX
**Confidence:** HIGH — based on direct source inspection of all five files listed in milestone context

---

## Integration Points

### Files to Modify

| File | What Changes | Why |
|------|-------------|-----|
| `bin/install.js` | (1) Remove inline prompt functions; (2) Add idempotency banner; (3) Update `main().catch()` handler | Prompt extraction reduces file to pure orchestration; catch handler gains actionable hints |
| `bin/lib/platforms.js` | Add `description` field to each entry in `PLATFORMS` map | Needed by the enhanced selector to show one-line platform description per INSTALL-04 |
| `bin/lib/manifest.js` | Add `checkExistingInstall(configDir, currentVersion)` helper | Exposes version-comparison logic cleanly without duplicating manifest reads |

### Functions to Touch in `bin/install.js`

| Function | Lines | Change Type | Notes |
|----------|-------|-------------|-------|
| `promptRuntime()` | 129–151 | **Remove** → extract to `bin/lib/prompt.js` | Logic moves intact; install.js just requires it |
| `promptLocation()` | 153–165 | **Remove** → extract to `bin/lib/prompt.js` | Same — pure extraction |
| `install()` | 190–251 | **Additive** — prepend idempotency check; optional step-label calls | No existing lines deleted; only additions |
| `main().catch()` | 406–409 | **Replace** — swap `log.error(err.message)` with `formatError(err)` | One-line change; `formatError` from new errors module |

### Critical Observation: `log.step()` Already Exists

`bin/lib/utils.js` already exports `log.step(num, total, msg)` (line 31–32). It is already consumed by individual platform installers (e.g., `bin/lib/installers/claude.js` declares `TOTAL_STEPS = 6` and calls `log.step()` for each sub-step). The outer `install()` function in `bin/install.js` does NOT use it — it calls raw `log.info()`. **No new step infrastructure is needed.** INSTALL-01 is a matter of calling the already-present `log.step()` at the right points inside `install()`.

---

## New Components

### `bin/lib/prompt.js` — Extracted + Enhanced Interactive Selector

**New file.** Extracts `promptRuntime()` and `promptLocation()` from `install.js` and enhances them.

**Exports:**
```js
module.exports = { promptRuntime, promptLocation };
```

**`promptRuntime()` enhancement for INSTALL-04:**

The current implementation (install.js lines 129–151) shows only platform names. The enhanced version adds descriptions sourced from `PLATFORMS[rt].description` (new field added to platforms.js):

```
Choose a platform to install skills:

  1. Claude Code       — Anthropic's terminal AI coding agent
  2. Codex CLI         — OpenAI's CLI coding agent
  3. Gemini CLI        — Google's terminal AI coding agent
  4. OpenCode          — Open-source multi-model coding agent
  5. GitHub Copilot    — VS Code / JetBrains AI pair programmer
  6. All platforms

Choose (1-6):
```

**Arrow-key support decision:** Implementing true arrow-key navigation requires `process.stdin.setRawMode(true)` and manual keypress handling. This has non-trivial edge cases (SIGINT, Windows, non-TTY, piped input). Given the zero-external-deps constraint and the requirement that "numbered choice fallback for non-TTY" must also work, the recommendation is:

> **Do NOT implement arrow keys in Phase 1.** The numbered selector WITH descriptions satisfies INSTALL-04 at minimal risk. Arrow-key navigation should be an optional Phase 2 enhancement only if user feedback demands it.

The non-TTY fallback already exists (install.js lines 348–350: `if (!process.stdin.isTTY)` defaults to `["claude"]`). Keep that path unchanged.

**`promptLocation()` enhancement:** Add scope explanations inline:

```
Installation scope:
  1. Global (for all projects — installs to ~/.claude)
  2. Local  (this project only — installs to ./.claude)

Choose (1-2, default: 1):
```

---

### `bin/lib/errors.js` — Error Catalog

**New file.** Provides structured error formatting for INSTALL-02.

```js
'use strict';

// Error categories with fix hints
const ERROR_HINTS = {
  MODULE_NOT_FOUND: 'Installer module missing. Re-download the package: npm install -g please-done',
  EACCES:           'Permission denied. Try: sudo npx please-done, or install locally with --local',
  ENOENT:           'File or directory not found. Check --config-dir path is correct.',
  ENOTDIR:          'Expected a directory but found a file. Check config dir path.',
  PYTHON_VERSION:   'Python 3.12+ required. Upgrade: https://python.org/downloads',
  CLAUDE_MISSING:   'Claude Code CLI not installed. Install: https://claude.ai/download',
  DEFAULT:          'Run with PD_DEBUG=1 for full stack trace.'
};

class InstallError extends Error {
  constructor(message, code, hint) {
    super(message);
    this.name  = 'InstallError';
    this.code  = code;
    this.hint  = hint;
  }
}

function formatError(err) {
  const hint = err.hint
    || ERROR_HINTS[err.code]
    || (Object.keys(ERROR_HINTS).find(k => err.message.includes(k)) && ERROR_HINTS[err.message.match(new RegExp(k))[0]])
    || ERROR_HINTS.DEFAULT;

  const { log } = require('./utils');
  log.error(err.message);
  if (hint) log.warn(`Fix: ${hint}`);
}

module.exports = { InstallError, formatError, ERROR_HINTS };
```

**Integration in `main().catch()`** (single-line change):
```js
// Before:
main().catch((err) => {
  log.error(err.message);
  if (process.env.PD_DEBUG) console.error(err.stack);
  process.exit(1);
});

// After:
main().catch((err) => {
  const { formatError } = require('./lib/errors');
  formatError(err);
  if (process.env.PD_DEBUG) console.error(err.stack);
  process.exit(1);
});
```

No changes to any error *throw* sites — installers throw plain `Error` objects. `formatError` pattern-matches on `err.code` and `err.message` to select the right hint. This is backward-compatible with all existing throws.

---

## Idempotency Design

### Existing Infrastructure (Do Not Duplicate)

`bin/lib/manifest.js` already has everything needed:
- `readManifest(configDir)` → returns `{ version, timestamp, fileCount, files }` or `null`
- `detectChanges(configDir)` → returns array of `{ relPath, status }` for modified/deleted files
- `saveLocalPatches(configDir)` → already called at the start of `install()` (line 203)

### What to Add: `checkExistingInstall(configDir, currentVersion)`

Add to `manifest.js`:

```js
/**
 * Check installation state before re-installing.
 * Returns { state, prevVersion } where state is:
 *   'fresh'   — no manifest, first install
 *   'current' — manifest exists, same version, no changes
 *   'upgrade' — manifest exists, different version
 *   'dirty'   — manifest exists, same version, files were modified by user
 */
function checkExistingInstall(configDir, currentVersion) {
  const manifest = readManifest(configDir);
  if (!manifest) return { state: 'fresh', prevVersion: null };

  const changes = detectChanges(configDir);
  const modified = changes.filter(c => c.status === 'modified');

  if (manifest.version !== currentVersion) {
    return { state: 'upgrade', prevVersion: manifest.version };
  }
  if (modified.length > 0) {
    return { state: 'dirty', prevVersion: manifest.version, modifiedCount: modified.length };
  }
  return { state: 'current', prevVersion: manifest.version };
}
```

### Usage in `install()` — Additive Prepend

At the top of `install()` (before `saveLocalPatches`), add:

```js
const { state, prevVersion } = checkExistingInstall(targetDir, VERSION);

if (state === 'current') {
  log.success(`${platform.name} — already at v${VERSION}, no changes.`);
  return;  // skip re-install
}
if (state === 'upgrade') {
  log.info(`Upgrading ${platform.name} from v${prevVersion} → v${VERSION}`);
}
if (state === 'dirty') {
  log.warn(`Re-installing ${platform.name} v${VERSION} (user-modified files will be backed up)`);
}
// state === 'fresh' falls through silently to normal install path
```

**Key behavior:** `state === 'current'` returns early — no file writes, no manifest update, no output except the "already at vX" line. This satisfies INSTALL-03 ("already-installed files show 'already installed' status, not errors").

**Re-run updates only changed files:** The individual platform installers (e.g., `claude.js`) use `fs.writeFileSync` unconditionally. Making them file-diff-aware would require changes inside each of the 5 installer modules — high regression risk. The pragmatic approach: keep `saveLocalPatches` as the safety net (backs up user changes before overwrite), and rely on the early-return for the "same version, no changes" case. Per-file skip logic is a future improvement.

---

## Error Catalog Design

### Categorization

Three error categories cover all realistic failure modes:

| Category | `err.code` / Pattern | Fix Hint |
|----------|---------------------|----------|
| **Missing dependency** | `ENOENT` on binary, `err.message` contains "not installed" | Install URL for the specific tool |
| **Permission error** | `EACCES`, `EPERM` | Suggest `--local` or `sudo` |
| **Platform not implemented** | `MODULE_NOT_FOUND` for `./lib/installers/X` | Re-download package |
| **Wrong directory** | `ENOTDIR`, `ENOENT` on `--config-dir` | Check path argument |
| **Version mismatch** | Python/Node version check in installer | Upgrade link |

### Design Principle: Pattern-Match on Existing Throws

The individual installers already throw `new Error("Claude Code CLI not installed. Install first: https://claude.ai/download")` — the URL is already in the message. `formatError` should NOT duplicate these messages. It should ONLY add a hint when the throw is a bare system error (e.g., `EACCES`). Check `err.code` first; only fall through to message-pattern-matching if `err.code` is undefined or `DEFAULT`.

### No Typed Error Subclasses Required

Installers throw `new Error()` with descriptive messages. `formatError` in `errors.js` is purely a formatting function on `main().catch()`. No changes to installer throw sites are needed. This is the minimal-regression path.

---

## Progress Steps (INSTALL-01)

### Where to Add `log.step()` in `install()`

The outer `install()` function in `bin/install.js` has 4 logical outer-level steps that are currently silent:

```
[1/4] Backing up locally modified files...    ← before saveLocalPatches()
[2/4] Running platform installer...           ← before require(installer).install()
[3/4] Writing installation manifest...        ← before writeManifest()
[4/4] Verifying installed files...            ← before scanLeakedPaths() + reportLocalPatches()
```

The individual installers already have their own internal `log.step(1/6, ...)` calls. These outer steps appear ABOVE the inner steps, forming a two-level progress display:

```
[1/4] Backing up locally modified files...
[2/4] Running platform installer...
  [1/6] Checking prerequisites...
    ✓ Claude Code CLI
    ✓ Python 3.12.2 (python3)
  [2/6] Setting up skills directory...
  ...
[3/4] Writing installation manifest...
[4/4] Verifying installed files...
  ✓ Claude Code — done!
```

**Implementation:** 4 `log.step()` calls added to `install()`. No structural change.

---

## Build Order

Safest sequence, each step independently releasable and verifiable:

### Step 1: Extract Prompts → `bin/lib/prompt.js` (lowest risk)

**What:** Move `promptRuntime()` and `promptLocation()` verbatim from `install.js` into new `bin/lib/prompt.js`. Update `install.js` to `require('./lib/prompt')`.

**Why first:** Pure refactor — zero behavior change. If this breaks something, it's a require path bug that's immediately obvious. Reduces `install.js` by ~40 lines, making subsequent edits cleaner.

**Risk:** LOW — copy-paste extraction with one require change.

**Test:** Run `npx please-done` in interactive mode — must behave identically.

---

### Step 2: Add Platform Descriptions to `platforms.js`

**What:** Add `description` field to each of the 7 entries in `PLATFORMS`. Example:
```js
claude: { name: 'Claude Code', description: "Anthropic's terminal AI coding agent", ... }
```

**Why second:** Needed by the enhanced prompt in Step 1b (below). Data-only change to platforms.js — zero logic change.

**Risk:** LOW — additive field, no existing code reads it yet.

---

### Step 3: Enhance `promptRuntime()` with Descriptions

**What:** Update the extracted `promptRuntime()` in `prompt.js` to display `PLATFORMS[rt].description` next to each platform name.

**Why third:** Now that descriptions exist (Step 2) and prompt is isolated (Step 1), this is a one-function change in an isolated file.

**Risk:** LOW — affects only interactive TTY path.

---

### Step 4: Add Idempotency Check to `install()`

**What:** Add `checkExistingInstall()` to `manifest.js`. Add the 8-line prepend to `install()` in `install.js`.

**Why fourth:** Infrastructure (manifest.js) has no side effects on non-reinstall paths. The early-return behavior is the only behavior change, and only triggers when `state === 'current'`.

**Risk:** LOW–MEDIUM. The early-return skips manifest write on re-run — verify this doesn't break anything for `--all` multi-platform installs.

**Test:** Install once, run installer again immediately — must show "already at vX.Y" and exit 0.

---

### Step 5: Add Progress Step Labels to `install()`

**What:** Add 4 `log.step(n, 4, "...")` calls inside `install()` at the 4 outer phases.

**Why fifth:** Visual-only change. Correct behavior already exists; steps just add labels.

**Risk:** VERY LOW — `console.log` additions.

---

### Step 6: Error Catalog — `bin/lib/errors.js` + catch handler

**What:** Create `errors.js`. Replace single-line `log.error(err.message)` in `main().catch()` with `formatError(err)`.

**Why last:** Last because it changes error *display* behavior. If error catalog has a bug, it should affect only error cases, not the happy path. By this point all other changes are proven stable.

**Risk:** LOW — isolated to catch handler; no changes to any throw sites.

---

## Component Boundary Summary

```
bin/install.js           ← orchestration only; no prompt logic; no error formatting
  │
  ├── bin/lib/prompt.js  ← NEW: all readline/interactive logic
  ├── bin/lib/errors.js  ← NEW: error catalog + formatError()
  ├── bin/lib/platforms.js  ← MODIFIED: +description field per platform
  ├── bin/lib/manifest.js   ← MODIFIED: +checkExistingInstall()
  └── bin/lib/utils.js      ← UNCHANGED: log.step() already present
```

**No changes to:**
- `bin/lib/installers/*.js` — 5 platform installer files remain untouched
- `bin/lib/converter.js` — unrelated to UX layer
- Any commands/ or workflows/ skill files

---

## Regression Risk Assessment

| Change | Risk | Rationale |
|--------|------|-----------|
| Extract prompts to prompt.js | LOW | Pure copy-move, one require() change |
| Add `description` to platforms.js | VERY LOW | Additive data field, no readers yet |
| Enhanced promptRuntime() display | LOW | Only affects interactive TTY |
| checkExistingInstall() + early return | LOW-MEDIUM | Early return skips install — must verify --all path |
| log.step() in install() | VERY LOW | Console output only |
| errors.js + catch handler | LOW | Only affects error paths |
| Arrow-key navigation | HIGH | Raw mode stdin has many edge cases — defer |

---

## Sources

- Direct file inspection: `bin/install.js` (415 lines), `bin/lib/utils.js`, `bin/lib/platforms.js`, `bin/lib/manifest.js`, `bin/lib/installers/claude.js`
- Requirements: `.planning/REQUIREMENTS.md` (INSTALL-01 through INSTALL-04)
- Confidence: **HIGH** — all integration points based on direct code reads, no speculation
