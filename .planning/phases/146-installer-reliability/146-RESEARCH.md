# Phase 146: Installer Reliability - Research

**Researched:** 2026-04-07
**Domain:** Node.js CLI, Installer UX, Idempotent Operations
**Confidence:** HIGH

## Summary

This phase implements progress step labels for the installer's 4 outer actions and adds an idempotent check to prevent duplicate work on re-runs. The implementation is straightforward: add `checkUpToDate()` to `manifest.js`, change `log.step` color from yellow → cyan in `utils.js`, and modify `install()` in `install.js` to include step labels and early-return logic.

All decisions are locked in CONTEXT.md. The code changes touch 3 existing files and create 1 new test file. Zero external dependencies are required — only Node.js built-ins.

**Primary recommendation:** Implement in a single plan with 3 waves: (1) add `checkUpToDate` to manifest.js, (2) modify utils.js + install.js for step labels, (3) add smoke tests.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01**: 4 steps fixed: `[1/4] Backing up...`, `[2/4] Installing...`, `[3/4] Writing manifest...`, `[4/4] Syncing agent instructions...`
- **D-02**: `log.step()` at start of step; `log.success()`/`log.error()` at end; remove end "done!" line
- **D-03**: Add `checkUpToDate(configDir, currentVersion)` to `manifest.js`; returns `{ upToDate, installedVersion }`
- **D-04**: Up-to-date message: `log.info(\`Already at v${VERSION}, no changes needed.\`); return;`
- **D-05**: Upgrade notice: `log.info(\`Upgrading ${platform.name} from v${installedVersion} → v${VERSION}...\`)`
- **D-06**: First install (no manifest) → proceed without notice
- **D-07**: `checkUpToDate` signature is fully specified
- **D-08**: Scope: install only, not uninstall
- **D-09**: Step 4 edge case — always show `[4/4]`, log appropriate success/warn for AGENTS.md presence
- **D-10**: New test file `test/smoke-install.test.js` with 5 specified tests
- **D-11**: `log.step` color change: yellow → cyan
- **D-12**: Remove end-of-function `log.success(\`${platform.name} — done!\`)`
- **D-13**: Files to modify: `bin/lib/manifest.js`, `bin/lib/utils.js`, `bin/install.js`
- **D-14**: Files to create: `test/smoke-install.test.js`
- **D-15**: `INSTALL_STEPS = 4` as local const at top of `install()` function
- **D-16**: No breaking changes — additive exports only

### Agent Discretion
None specified — all decisions are locked.

### Deferred Ideas (OUT OF SCOPE)
- Per-file progress (verbose mode)
- `uninstall()` step labels
- Step timing measurements
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INSTALL-01 | User sees clear progress steps during installation — each step has label, per-step success/failure indicator, no silent operations | Implemented via `log.step(N, 4, msg)` at step start + `log.success()`/`log.error()` at step end per D-01, D-02 |
| INSTALL-03 | Running installer again does not break existing install — already-installed shows status, re-run updates only changed, version upgrade handled gracefully | Implemented via `checkUpToDate()` returning early when same version (D-03, D-04), upgrade notice when different version (D-05) |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | 24.14.1 | Runtime | Already installed, zero-dep constraint |
| node:fs | built-in | File operations | Read/write manifest |
| node:path | built-in | Path manipulation | Join config paths |
| node:test | built-in | Test runner | Project standard (see existing tests) |
| node:assert/strict | built-in | Assertions | Project standard (see smoke-prompt.test.js) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node:child_process | built-in | execSync | Test subprocess execution |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| node:test | Jest/Mocha | Would add dependencies — zero-dep constraint prohibits |
| Manual version compare | semver | Would add dependency — simple string equality sufficient per D-07 |

**Installation:**
```bash
# No installation needed — all Node.js built-ins
```

**Version verification:** [VERIFIED: system check] Node.js v24.14.1 available

## Architecture Patterns

### Recommended Project Structure
```
bin/
├── install.js            # Main installer — add step labels, checkUpToDate call
├── lib/
│   ├── manifest.js       # Add checkUpToDate() function
│   └── utils.js          # Change log.step color yellow → cyan
test/
└── smoke-install.test.js # NEW: 5 tests per D-10
```

### Pattern 1: Early Bail with Pure Check Function
**What:** `checkUpToDate()` is a pure function that reads manifest and compares versions, returning a result object. The caller (`install()`) decides what to do.
**When to use:** When you want testable, side-effect-free version checking
**Example:**
```javascript
// Source: D-07 from CONTEXT.md
function checkUpToDate(configDir, currentVersion) {
  const manifest = readManifest(configDir);
  if (!manifest) return { upToDate: false, installedVersion: null };
  return {
    upToDate: manifest.version === currentVersion,
    installedVersion: manifest.version,
  };
}
```

### Pattern 2: Step Label with Outcome Indicator
**What:** Each step starts with `log.step(N, TOTAL, msg)` and ends with `log.success(msg)` or `log.error(msg)`
**When to use:** When user needs to know progress through multi-step operations
**Example:**
```javascript
// Source: D-01, D-02 from CONTEXT.md
const INSTALL_STEPS = 4;

// Step 1
log.step(1, INSTALL_STEPS, "Backing up locally modified files...");
const patchCount = saveLocalPatches(targetDir);
if (patchCount > 0) {
  log.success(`Backed up ${patchCount} file(s)`);
} else {
  log.success("No local modifications to back up");
}
```

### Pattern 3: Test Export Guard
**What:** Module exports test helpers only when `PD_TEST_MODE` env var is set
**When to use:** When you need to test internal functions without polluting public API
**Example:**
```javascript
// Source: bin/install.js lines 359-361 [VERIFIED: codebase]
if (process.env.PD_TEST_MODE) {
  module.exports = { parseArgs, install, uninstall };
}
```

### Anti-Patterns to Avoid
- **Silent operations:** Every action must have a visible log line (INSTALL-01)
- **Modifying PD_TEST_MODE export list:** The existing exports (`parseArgs, install, uninstall`) are sufficient for testing step labels via console spy
- **Throwing on up-to-date:** Should return early with `log.info`, not throw error

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Semantic version comparison | Full semver parser | Simple string equality | D-07 specifies `manifest.version === currentVersion` — no semver parsing needed |
| Progress bar | ASCII progress bar lib | Simple `[N/4]` step counter | Matches success criteria exactly, no complexity needed |
| Manifest reading | New JSON parser | Existing `readManifest()` | Already in manifest.js line 84-100 [VERIFIED: codebase] |

**Key insight:** All required functionality already exists in the codebase — this phase only adds a thin wrapper (`checkUpToDate`) and modifies existing functions.

## Common Pitfalls

### Pitfall 1: Forgetting to Remove End Banner
**What goes wrong:** Step labels added but old `log.success(\`${platform.name} — done!\`)` remains, creating duplicate "done" messages
**Why it happens:** Easy to miss the removal instruction (D-12) when focused on additions
**How to avoid:** Explicitly search for and remove `log.success(\`${platform.name} — done!\`)` on line 199 of install.js
**Warning signs:** Test output shows "done!" after step 4/4 success message

### Pitfall 2: Step 4 Missing When AGENTS.md Absent
**What goes wrong:** Step `[4/4]` never prints if AGENTS.md doesn't exist, user sees only 3 steps
**Why it happens:** Early return or skip logic before step label
**How to avoid:** Print `[4/4]` label BEFORE checking AGENTS.md existence per D-09
**Warning signs:** Test with no AGENTS.md shows only 3 steps

### Pitfall 3: checkUpToDate Called After Side Effects
**What goes wrong:** Patches backed up before version check, then "Already up-to-date" message prints
**Why it happens:** `checkUpToDate` placed after `saveLocalPatches` call
**How to avoid:** `checkUpToDate` must be FIRST thing in `install()`, before any other operations
**Warning signs:** Re-running up-to-date install still backs up files

### Pitfall 4: Wrong log.step Color Change
**What goes wrong:** Changing the wrong color constant or not updating log.step specifically
**Why it happens:** utils.js has multiple color uses
**How to avoid:** Only change line 33: `colorize("yellow", ...)` → `colorize("cyan", ...)`
**Warning signs:** Steps show wrong color or other log functions affected

### Pitfall 5: Test Module Import Without PD_TEST_MODE
**What goes wrong:** Tests fail with "Cannot read property 'install' of undefined"
**Why it happens:** Forgetting to set `PD_TEST_MODE=1` before requiring install.js
**How to avoid:** Set `process.env.PD_TEST_MODE = '1'` at top of test file before any require
**Warning signs:** Test file can't access install() function

## Code Examples

Verified patterns from official sources:

### checkUpToDate Implementation
```javascript
// Source: D-07 from CONTEXT.md
function checkUpToDate(configDir, currentVersion) {
  const manifest = readManifest(configDir);
  if (!manifest) return { upToDate: false, installedVersion: null };
  return {
    upToDate: manifest.version === currentVersion,
    installedVersion: manifest.version,
  };
}
```

### Modified install() Function Start
```javascript
// Source: D-01 through D-06 from CONTEXT.md
async function install(runtime, isGlobal, configDir) {
  const platform = PLATFORMS[runtime];
  const targetDir = configDir
    ? path.resolve(configDir)
    : isGlobal
      ? getGlobalDir(runtime)
      : getLocalDir(runtime);

  // Idempotent check — early bail if already up-to-date
  const { upToDate, installedVersion } = checkUpToDate(targetDir, VERSION);
  if (upToDate) {
    log.info(`Already at v${VERSION}, no changes needed.`);
    return;
  }
  if (installedVersion) {
    log.info(`Upgrading ${platform.name} from v${installedVersion} → v${VERSION}...`);
  }

  const INSTALL_STEPS = 4;
  console.log("");
  log.info(`Installing for ${platform.name} → ${targetDir}`);

  // Step 1: Backup
  log.step(1, INSTALL_STEPS, "Backing up locally modified files...");
  const patchCount = saveLocalPatches(targetDir);
  if (patchCount > 0) {
    log.success(`Backed up ${patchCount} file(s)`);
  } else {
    log.success("No local modifications");
  }

  // ... remaining steps
}
```

### log.step Color Change
```javascript
// Source: D-11 from CONTEXT.md
// bin/lib/utils.js line 33
// BEFORE:
step: (num, total, msg) =>
  console.log(colorize("yellow", `[${num}/${total}] ${msg}`)),
// AFTER:
step: (num, total, msg) =>
  console.log(colorize("cyan", `[${num}/${total}] ${msg}`)),
```

### Test Pattern (from smoke-prompt.test.js)
```javascript
// Source: test/smoke-prompt.test.js [VERIFIED: codebase]
"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");

describe("checkUpToDate", () => {
  it("returns upToDate false with no manifest", () => {
    process.env.PD_TEST_MODE = "1";
    const { checkUpToDate } = require("../bin/lib/manifest");
    const result = checkUpToDate("/nonexistent/path", "1.0.0");
    assert.deepStrictEqual(result, { upToDate: false, installedVersion: null });
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Silent install | Step labels with `[N/4]` prefix | This phase | User sees progress |
| Re-run always re-installs | Idempotent check with early return | This phase | No duplicate work |
| Yellow step color | Cyan step color | This phase | Visual distinction from warnings |

**Deprecated/outdated:**
- None — this is additive functionality

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this
> section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | None | — | — |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **None** — All decisions are locked in CONTEXT.md with full implementation details.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node:test) |
| Config file | None — uses package.json scripts |
| Quick run command | `node --test test/smoke-install.test.js` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INSTALL-01 | Step labels visible | smoke | `node --test test/smoke-install.test.js` | ❌ Wave 0 |
| INSTALL-03a | checkUpToDate no manifest | unit | `node --test test/smoke-install.test.js` | ❌ Wave 0 |
| INSTALL-03b | checkUpToDate same version | unit | `node --test test/smoke-install.test.js` | ❌ Wave 0 |
| INSTALL-03c | checkUpToDate different version | unit | `node --test test/smoke-install.test.js` | ❌ Wave 0 |
| INSTALL-03d | install() early return | smoke | `node --test test/smoke-install.test.js` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-install.test.js`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `test/smoke-install.test.js` — covers INSTALL-01 + INSTALL-03 (5 tests per D-10)

## Security Domain

> Not applicable — this phase modifies installer UX only, no auth/session/crypto/input validation.

| ASVS Category | Applies | Rationale |
|---------------|---------|-----------|
| V2 Authentication | no | Installer has no auth |
| V3 Session Management | no | No sessions |
| V4 Access Control | no | No access control changes |
| V5 Input Validation | no | No new user input paths |
| V6 Cryptography | no | Uses existing fileHash, no changes |

## Sources

### Primary (HIGH confidence)
- **CONTEXT.md** — All 16 locked decisions (D-01 through D-16) define exact implementation
- **bin/install.js** — Current implementation structure [VERIFIED: codebase view]
- **bin/lib/manifest.js** — Existing `readManifest()` function [VERIFIED: codebase view]
- **bin/lib/utils.js** — Existing `log.step` implementation at line 32-33 [VERIFIED: codebase view]
- **test/smoke-prompt.test.js** — Test pattern reference [VERIFIED: codebase view]
- **package.json** — Test scripts use `node --test` [VERIFIED: codebase view]

### Secondary (MEDIUM confidence)
- None needed — all implementation details specified in CONTEXT.md

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - zero-dep constraint means only Node.js built-ins, all verified available
- Architecture: HIGH - exact function signatures and code patterns specified in CONTEXT.md
- Pitfalls: HIGH - derived directly from locked decisions and existing codebase

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (30 days — stable phase, no external dependencies)
