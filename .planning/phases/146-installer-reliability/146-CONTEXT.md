# Phase 146 Context — Installer Reliability

> Phase: 146
> Name: Installer Reliability
> Status: Discussed
> Auto-mode: true
> Discussed: 2026-04-07
> Requirements: INSTALL-01, INSTALL-03
> Depends on: Phase 145 (bin/lib/prompt.js — ✅ satisfied)

## Goal

Users see a labeled progress step for every outer install action, and re-running the installer on an up-to-date system exits cleanly without errors or duplicate work.

## Locked Decisions

### D-01 — Step count per platform install
**Decision**: 4 steps fixed (`INSTALL_STEPS = 4`)
**Steps**:
- `[1/4] Backing up locally modified files...`
- `[2/4] Installing {platform.name} skills...`
- `[3/4] Writing install manifest...`
- `[4/4] Syncing agent instructions...`
**Rationale**: The 4 outer actions in `install()` map cleanly to 4 user-visible steps. Leaked-path scan and patch reporting are folded into step 3 (post-manifest, same phase). Matches success criteria example `[1/4]`.

### D-02 — Step indicator style
**Decision**: `log.step(N, INSTALL_STEPS, "Label...")` at start of step; `log.success("Label complete")` or `log.error("Label failed")` at end of each step
**Rationale**: `log.step` already in `utils.js`. Per-step success indicator satisfies success criteria. Existing `log.success(\`${platform.name} — done!\`)` at end of `install()` is removed (replaced by per-step indicators).

### D-03 — Idempotent check location
**Decision**: Add `checkUpToDate(configDir, currentVersion)` utility to `bin/lib/manifest.js`; call at the very top of `install()` before any side effects
**Returns**: `{ upToDate: boolean, installedVersion: string | null }`
**Rationale**: Early bail prevents patches from being saved, platform installers from running, etc. `manifest.js` already has `readManifest()` — natural home for version comparison.

### D-04 — Up-to-date message
**Decision**: `log.info(\`Already at v${VERSION}, no changes needed.\`); return;`
**Rationale**: Matches success criteria exact wording ("Already at vX.Y, no changes needed"). Uses `log.info` (not warn/success) — informational, not an error or achievement.

### D-05 — Upgrade notice
**Decision**: If manifest exists with a different version: `log.info(\`Upgrading ${platform.name} from v${installedVersion} → v${VERSION}...\`)` then proceed normally
**Rationale**: Success criteria requires "logs an upgrade notice and proceeds normally". Single `log.info` line before step 1 is sufficient.

### D-06 — First install (no manifest)
**Decision**: Proceed without any notice (no "fresh install" log line needed). `checkUpToDate` returns `{ upToDate: false, installedVersion: null }` when no manifest exists.
**Rationale**: Upgrade notice only applies to re-runs. First install is silent on this front.

### D-07 — `checkUpToDate` signature
**Decision**:
```js
function checkUpToDate(configDir, currentVersion) {
  const manifest = readManifest(configDir);
  if (!manifest) return { upToDate: false, installedVersion: null };
  return {
    upToDate: manifest.version === currentVersion,
    installedVersion: manifest.version,
  };
}
```
Export as `checkUpToDate` from `manifest.js`.
**Rationale**: Pure function, reuses existing `readManifest()`. Simple string comparison on `manifest.version`.

### D-08 — Scope: install only, not uninstall
**Decision**: Step labels and idempotency check apply only to `install()`, not `uninstall()`
**Rationale**: Success criteria mentions "outer install actions". Uninstall already has its own success log.

### D-09 — Step 4 edge case (no AGENTS.md)
**Decision**: Print `[4/4] Syncing agent instructions...` regardless; if `AGENTS.md` doesn't exist, log `log.success("Agent sync skipped (no AGENTS.md found).")`; on success `log.success("Agent instructions synced.")`; on error `log.warn("Agent sync failed: " + err.message)` — the step still shows
**Rationale**: Step should always appear so user sees 4/4 complete. Non-fatal — installation succeeded.

### D-10 — Test location and scope
**Decision**: New file `test/smoke-install.test.js`
**Tests needed**:
1. `checkUpToDate` returns `{ upToDate: false, installedVersion: null }` with no manifest
2. `checkUpToDate` returns `{ upToDate: true, installedVersion: "X" }` when version matches
3. `checkUpToDate` returns `{ upToDate: false, installedVersion: "X" }` when version differs
4. `install()` logs `[1/4]` step label (spy on console.log in PD_TEST_MODE)
5. `install()` returns early with "Already at v..." message when up-to-date
**Rationale**: Unit tests for `checkUpToDate` in isolation; smoke test for early-return path reusing `PD_TEST_MODE` test export pattern from `install.js`.

### D-11 — `log.step` color
**Decision**: `log.step` uses `colorize("cyan", ...)` — more visually distinct from `log.warn` (yellow)
**Current**: `log.step` uses `yellow`. Change to `cyan` to match the banner color.
**Rationale**: Steps are progress indicators, not warnings. Cyan better matches banner style and avoids confusion with `log.warn`.

### D-12 — Removal of end-of-function `log.success` banner line
**Decision**: Remove `log.success(\`${platform.name} — done!\`)` at end of `install()` — each step shows its own outcome
**Rationale**: With 4 per-step indicators, the redundant "done!" message adds noise. The final summary banner in `main()` still shows "Installation complete!".

### D-13 — Files to modify
- `bin/lib/manifest.js` — add `checkUpToDate()` function + export
- `bin/lib/utils.js` — change `log.step` color from yellow → cyan
- `bin/install.js` — add `checkUpToDate` import; add step labels in `install()`; remove end banner line

### D-14 — Files to create
- `test/smoke-install.test.js` — new smoke tests for INSTALL-01 + INSTALL-03

### D-15 — Constant for step count
**Decision**: Local `const INSTALL_STEPS = 4;` at top of `install()` function (not module-level)
**Rationale**: Only used in `install()`. Module-level constant would be over-engineering.

### D-16 — Backward compatibility
**Decision**: No breaking changes — `manifest.js` exports are additive (`checkUpToDate` added); `install.js` interface unchanged; existing manifest files remain compatible
**Rationale**: `manifest.version` field already exists in `writeManifest()` output. No schema changes.

## Key Codebase Facts

- `log.step(num, total, msg)` already in `utils.js` line ~35 — uses yellow (to change to cyan)
- `readManifest(configDir)` in `manifest.js` — returns `{ version, timestamp, fileCount, files }` or `null`
- `install()` in `install.js` — 4 natural steps: backup → run installer → write manifest → sync AGENTS.md
- `INSTALL_STEPS = 4` — fixed count; leaked-paths scan folded into step 3
- `PD_TEST_MODE` export pattern in `install.js` — available for smoke test use
- No external dependencies (zero-dep constraint) — Node.js built-ins only

## Out of Scope (deferred)

- Per-file progress (verbose mode) — could be added later with `--verbose` flag
- `uninstall()` step labels — not in success criteria for this phase
- Step timing measurements — not requested
