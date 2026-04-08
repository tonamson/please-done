---
phase: 146
plan: 02
subsystem: installer
tags: [install, progress-ui, idempotent, step-labels]
dependency-graph:
  requires: [bin/lib/manifest.js:checkUpToDate]
  provides: [bin/install.js:step-labels, bin/install.js:idempotent-check]
  affects: []
tech-stack:
  added: []
  patterns: [step-progress-indicator, early-bail-idempotent]
key-files:
  created: []
  modified: [bin/install.js]
decisions:
  - D-01: 4 fixed steps with log.step labels [1/4] through [4/4]
  - D-03: checkUpToDate called at top of install() before any side effects
  - D-04: Up-to-date returns early with 'Already at vX.Y, no changes needed.'
  - D-05: Upgrade notice logs 'Upgrading {platform} from vX → vY...'
  - D-12: Removed redundant 'done!' banner at end of install()
  - D-15: INSTALL_STEPS = 4 as local const inside install() function
metrics:
  duration: 1m 45s
  completed: "2026-04-08T03:19:33Z"
---

# Phase 146 Plan 02: Step Labels & Idempotent Check Summary

**One-liner:** Added [1/4]-[4/4] progress step labels to install() and idempotent re-run detection that returns early when already up-to-date.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `8d06b59` | Add checkUpToDate import to install.js |
| 2 | `72668d5` | Add step labels and idempotent check to install() |

## Changes Made

### Task 1: Add checkUpToDate import to install.js

Added `checkUpToDate` to the manifest.js import destructure:

```javascript
const {
  saveLocalPatches,
  writeManifest,
  reportLocalPatches,
  scanLeakedPaths,
  checkUpToDate,  // NEW
} = require("./lib/manifest");
```

### Task 2: Add idempotent check and step labels to install()

**Idempotent check (D-03, D-04):** At the very top of `install()`, before any side effects:

```javascript
const { upToDate, installedVersion } = checkUpToDate(targetDir, VERSION);
if (upToDate) {
  log.info(`Already at v${VERSION}, no changes needed.`);
  return;
}
```

**Upgrade notice (D-05):** If re-installing a different version:

```javascript
if (installedVersion) {
  log.info(`Upgrading ${platform.name} from v${installedVersion} → v${VERSION}...`);
}
```

**Step labels (D-01, D-15):** Added `INSTALL_STEPS = 4` constant and wrapped each operation:

- `[1/4] Backing up locally modified files...` → `log.success("Backed up N file(s)")` or `"No local modifications to back up"`
- `[2/4] Installing {platform} skills...` → `log.success("{platform} skills installed")`
- `[3/4] Writing install manifest...` → `log.success("Manifest written")` (includes leaked path scan + patch report)
- `[4/4] Syncing agent instructions...` → `log.success("Agent instructions synced")` or `"Agent sync skipped (no AGENTS.md found)"`

**Removed (D-12):** The redundant `log.success(\`${platform.name} — done!\`)` at end of function — each step now shows its own outcome.

## Verification Results

| Check | Result |
|-------|--------|
| `checkUpToDate` imported | ✅ Line 40 |
| `INSTALL_STEPS = 4` inside install() | ✅ |
| `log.step(1, INSTALL_STEPS, ...)` | ✅ |
| `log.step(2, INSTALL_STEPS, ...)` | ✅ |
| `log.step(3, INSTALL_STEPS, ...)` | ✅ |
| `log.step(4, INSTALL_STEPS, ...)` | ✅ |
| Early return "Already at v..." | ✅ |
| Upgrade notice "Upgrading ... from v..." | ✅ |
| No "done!" banner at end | ✅ |
| `node --check bin/install.js` | ✅ Syntax OK |

## Deviations from Plan

None - plan executed exactly as written.

## Requirements Addressed

| Requirement | Contribution |
|-------------|--------------|
| INSTALL-01 | Step labels [1/4]-[4/4] provide visible progress during installation |
| INSTALL-03 | Idempotent check returns early when already up-to-date, preventing duplicate work |

## Next Steps

Plan 03 will add smoke tests for `checkUpToDate` and the idempotent early-return behavior.

## Self-Check: PASSED

- [x] `bin/install.js` exists with `checkUpToDate` import
- [x] `bin/install.js` has step labels 1-4
- [x] Commit `8d06b59` exists
- [x] Commit `72668d5` exists
