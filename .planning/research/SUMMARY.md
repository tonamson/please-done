# Research Summary: v12.3 Installation & Documentation UX

**Project:** please-done  
**Milestone:** v12.3 — Installation & Documentation UX  
**Synthesized:** 2026-04-07  
**Sources:** STACK.md · FEATURES-DOC-UX.md · ARCHITECTURE.md · PITFALLS.md · REQUIREMENTS.md  
**Overall Confidence:** HIGH — all findings based on direct source inspection of the actual codebase

---

## Executive Summary

v12.3 is a polish and documentation milestone with narrow, well-scoped goals: improve the UX of `bin/install.js` for new users (clearer progress, actionable errors, idempotency, better platform selector) and bring all docs in sync with the v12.2 command set (5 missing commands, one new guide, one full rewrite, two restructures, one surgical update). There are no new commands, no skill file changes, and no new npm dependencies required — this is the defining architectural insight of the milestone.

The recommended path is deliberately conservative. Every installer UX requirement (INSTALL-01 through INSTALL-04) can be satisfied using primitives that **already exist** in the codebase: `log.step()` in `bin/lib/utils.js`, `readManifest()`/`detectChanges()` in `bin/lib/manifest.js`, and Node.js core `readline` plus raw mode. The only real structural change is extracting `promptRuntime()`/`promptLocation()` out of `install.js` into a new `bin/lib/prompt.js` module. Two new lib files (`prompt.js`, `errors.js`) and additive changes to two existing lib files (`platforms.js`, `manifest.js`) cover all four INSTALL requirements with no changes to platform installers.

The key risk is not technical complexity — it is drift and omission. Three failure modes dominate: ANSI codes always emit to CI (TTY-01, currently unguarded in `colorize()`), the cheatsheet hardcodes "16 commands" when v12.3 targets 21 (DOCS-01), and new commands will be added to one doc file but missed in others (DOCS-02). All three are preventable with CI guards that take fewer than 20 lines of test code each. Arrow-key navigation (INSTALL-04) is the only requirement with genuine risk — implement numbered-list-with-descriptions first, defer raw-mode stdin to a fast-follow.

---

## Stack Decisions

### Zero External Runtime Dependencies — Confirmed Policy

`package.json` has **no `dependencies` field** at all. Zero-dep is existing policy, not a preference. Adding any entry to `dependencies` increases `npx please-done` download size for every new user install. All v12.3 requirements are achievable without it.

| Requirement | Implementation | Confidence |
|-------------|---------------|------------|
| Progress steps (INSTALL-01) | `log.step(n, total, msg)` — already in `bin/lib/utils.js` | HIGH |
| Actionable errors (INSTALL-02) | New `bin/lib/errors.js`: `InstallError` class + `formatError()` (~40 lines) | HIGH |
| Idempotency (INSTALL-03) | `checkExistingInstall()` added to `manifest.js` using existing `readManifest()` + `detectChanges()` | HIGH |
| Selector with descriptions (INSTALL-04) | Enhanced `promptRuntime()` in new `bin/lib/prompt.js` — numbered list with `PLATFORMS[rt].description` | HIGH |
| Arrow-key navigation (INSTALL-04) | Node.js `readline.emitKeypressEvents` + `process.stdin.setRawMode` — no library | HIGH (feasible; risk is edge cases) |
| Mermaid diagrams (DOCS-04) | Native GitHub rendering since 2022 — no build step | HIGH |
| All doc rewrites | Pure Markdown edits — no tooling needed | HIGH |

### Why NOT to Add Libraries

| Library | Purpose | Verdict |
|---------|---------|---------|
| `@inquirer/prompts` | Arrow-key select | ~1.2MB transitive deps; ESM issues in v9+; overkill for 6-item menu |
| `ora` | Animated spinner | 200KB for operations that complete in <1s — no real value |
| `chalk` | Terminal colors | `bin/lib/utils.js` already has a 10-line ANSI implementation |
| `listr2` | Task runner | Requires structural rewrite of `install()` to fit task-object API |

---

## Implementation Approach

### Files Modified

| File | Change Type | What Changes |
|------|------------|--------------|
| `bin/install.js` | Additive + refactor | Remove inline prompt functions; add 4 `log.step()` calls; update `main().catch()` to use `formatError()` |
| `bin/lib/platforms.js` | Additive | Add `description` field to each PLATFORMS entry |
| `bin/lib/manifest.js` | Additive | Add `checkExistingInstall(configDir, currentVersion)` helper |
| `bin/lib/utils.js` | **Unchanged** | `log.step()` already present — only call-sites are missing |

### New Files

| File | Purpose |
|------|---------|
| `bin/lib/prompt.js` | Extracted + enhanced `promptRuntime()` and `promptLocation()` |
| `bin/lib/errors.js` | `InstallError` class, `formatError()`, `ERROR_HINTS` catalog |

**Platform installers (`bin/lib/installers/*.js`) — UNTOUCHED.**  
**Skill files (`commands/`, `workflows/`) — UNTOUCHED.**

### Phased Build Order (from ARCHITECTURE.md — optimized for low regression risk)

Each step is independently testable and releasable:

1. **Extract prompts → `bin/lib/prompt.js`** — pure refactor, zero behavior change (LOW risk)
2. **Add `description` to `platforms.js`** — data-only, no readers yet (VERY LOW risk)
3. **Add TTY guard to `colorize()`** — fix ANSI-in-CI immediately (LOW risk, HIGH value)
4. **Enhance `promptRuntime()` with descriptions + non-TTY announcement** — isolated to TTY path (LOW risk)
5. **Add `checkExistingInstall()` to `manifest.js`; add early-return in `install()`** — verify --all path (LOW-MEDIUM risk)
6. **Add 4 `log.step()` calls to outer `install()`** — visual only (VERY LOW risk)
7. **Create `bin/lib/errors.js`; update `main().catch()`** — last, only affects error paths (LOW risk)

### Progress Display Design (two-level)

```
[1/4] Backing up locally modified files...
[2/4] Running platform installer...
  [1/6] Checking prerequisites...
    ✓ Claude Code CLI
    ✓ Python 3.12.2
  [2/6] Setting up skills directory...
[3/4] Writing installation manifest...
[4/4] Verifying installed files...
  ✓ Claude Code — done!
```

The inner `[n/6]` steps already exist in platform installers. Only the 4 outer `install()` call-sites are missing.

### Idempotency States

`checkExistingInstall()` returns one of four states:

| State | Meaning | Behavior |
|-------|---------|----------|
| `fresh` | No manifest — first install | Fall through to normal install |
| `current` | Same version, no user changes | Early return — "already at vX.Y, no changes" |
| `upgrade` | Different version | Log upgrade message, proceed |
| `dirty` | Same version, user-modified files | Warn about backup, proceed |

---

## Documentation Approach

### Write in This Dependency Order

Each doc depends on the previous being authoritative — do not skip ahead:

1. **`docs/cheatsheet.md`** — authoritative command list (LOW complexity — additive)
2. **`docs/COMMAND_REFERENCE.md`** — full rewrite with complete flag details (HIGH complexity)
3. **`docs/WORKFLOW_OVERVIEW.md`** — Mermaid flow diagram + "when to use" table (MEDIUM complexity)
4. **`docs/GETTING_STARTED.md`** — new file linking all three above (MEDIUM complexity)
5. **`README.md`** — 5 surgical fixes only (LOW complexity)

### Format Decisions

| Doc | Format | Hard Constraint |
|-----|--------|----------------|
| `cheatsheet.md` | Existing table-per-category — keep it | Add 4 commands; fix 3 stale count refs (16→21) |
| `COMMAND_REFERENCE.md` | 3-column max tables + per-command detail blocks | No links to `commands/` subdirectory (404s) |
| `WORKFLOW_OVERVIEW.md` | Mermaid `flowchart TD` + "When to use" table | ≤60 lines — hard limit, enforce in CI |
| `GETTING_STARTED.md` | 5 numbered steps with time ranges + expected output | 70–80 lines max |
| `README.md` | Surgical edits only | Do not bloat beyond ~730 lines |

### COMMAND_REFERENCE Per-Command Pattern

```markdown
## Category Name
| Command | Syntax | What it does |
|---------|--------|--------------|
| `/pd:foo` | `/pd:foo [--bar]` | One sentence. |

### `/pd:foo` — Short Title
**Purpose:** One sentence.
**Syntax:** `/pd:foo [--bar] [--baz value]`
**Example:** `/pd:foo --bar` → does X
**Flags:** `--bar` skip verification · `--baz N` set threshold
```

Rules: no links to `commands/` subdirectory; purpose = exactly 1 sentence; real examples only (matching actual v12.2 output); flags separated by `·` (middle dot) to save vertical space.

### 5 Commands Missing from Current Docs

`pd:stats` · `pd:health` · `pd:discover` · `pd:sync-version` · `pd:audit` (already in cheatsheet but missing elsewhere)

These must appear in: `cheatsheet.md`, `COMMAND_REFERENCE.md`, `README.md`, and the new `GETTING_STARTED.md`.

### Mermaid for WORKFLOW_OVERVIEW

Renders natively on GitHub.com, VS Code, and Claude/Codex viewers. No build step. `bin/lib/mermaid-validator.js` already exists for development-time syntax validation.

---

## Critical Pitfalls to Address

### CRITICAL — TTY-01: ANSI Codes Always Emitted (No TTY Guard)

`colorize()` in `bin/lib/utils.js` always applies ANSI escape codes. No check against `process.stdout.isTTY` or `NO_COLOR`. CI environments (GitHub Actions, Docker) receive raw `\x1b[0;32m` sequences — log parsers break, log aggregators show garbled output.

**Fix in Step 3 of build order:**
```js
const NO_COLOR = process.env.NO_COLOR !== undefined || !process.stdout.isTTY;
function colorize(color, text) {
  if (NO_COLOR) return text;
  return `${COLORS[color] || ""}${text}${COLORS.reset}`;
}
```
**Automated test:** `node bin/install.js --claude 2>&1 | cat | grep -c $'\\x1b'` must return 0 when stdout is piped.

---

### CRITICAL — DOCS-01: Cheatsheet Hardcodes "16 Commands"

`docs/cheatsheet.md` line 6 says "16 commands." v12.3 targets 21. Even after adding 5 command sections, the hardcoded number in the intro paragraph will still be wrong unless explicitly changed — classic last-10% omission.

**Add CI check:**
```bash
CHEATSHEET_COUNT=$(grep -c "^### \`/pd:" docs/cheatsheet.md)
COMMAND_COUNT=$(ls commands/pd/*.md | wc -l)
[ "$CHEATSHEET_COUNT" -eq "$COMMAND_COUNT" ] || exit 1
```

---

### HIGH — DOCS-02: New Commands Added to One Doc, Missed in Others

Sequential doc updates create checklist blindness. Author updates cheatsheet, declares done, misses README + COMMAND_REFERENCE + GETTING_STARTED.

**Add to test suite:**
```js
const COMMAND_LIST = ['pd:stats', 'pd:health', 'pd:discover', 'pd:audit', 'pd:sync-version' /* + all 16 existing */];
const DOC_FILES = ['README.md', 'docs/cheatsheet.md', 'docs/COMMAND_REFERENCE.md'];
for (const cmd of COMMAND_LIST) {
  for (const file of DOC_FILES) {
    assert(fs.readFileSync(file, 'utf8').includes(cmd), `${cmd} missing from ${file}`);
  }
}
```

---

### HIGH — IDEM-02: Partial Install Leaves No Recovery Signal

Manifest is written only after all steps succeed. A crash mid-run (e.g., EACCES on file 8 of 21) leaves no manifest. `saveLocalPatches()` may have backed up user customizations without `reportLocalPatches()` ever running — user edits are silently gone.

**Prevention:** Write a per-platform checkpoint immediately after each platform installs. At minimum: emit an explicit warning message if `saveLocalPatches()` finds modified files and the subsequent install fails.

---

### HIGH — TTY-03: Non-TTY Fallback is Silent

When `!process.stdin.isTTY`, the installer defaults to Claude Code global install with no announcement. The TTY guard already exists (line 348), but the non-TTY path is completely silent.

**Fix:**
```js
if (!process.stdin.isTTY && runtimes.length > 0) {
  log.info("Non-interactive mode: installing globally (use --local to override).");
}
```

---

### LOW — Arrow-Key Scope Creep Risk

REQUIREMENTS.md asks for "arrow-key navigation." STACK.md confirms it is technically feasible with Node.js raw mode. ARCHITECTURE.md rates it HIGH regression risk due to `setRawMode` edge cases (SIGINT handling, Windows, non-TTY, piped input). Attempting it in the same phase as the numbered-list enhancement risks breaking the currently-functional non-TTY fallback.

**Decision:** Deliver numbered-list-with-descriptions first. It satisfies INSTALL-04 functionally. Add arrow-key navigation as an explicit fast-follow task only if user feedback demands it.

---

## Phase Structure Recommendation

Two phases recommended. Installer UX and documentation are independent workstreams — can run in parallel or sequentially.

### Phase 1: Installer UX (INSTALL-01 through INSTALL-04)

**Goal:** A new user running `npx please-done` sees clear progress, gets actionable errors, can re-run safely, and understands what each platform does before choosing.

**Requirements:** INSTALL-01, INSTALL-02, INSTALL-03, INSTALL-04

**Tasks (in build order):**
1. Extract `promptRuntime()`/`promptLocation()` → `bin/lib/prompt.js`
2. Add `description` field to `bin/lib/platforms.js`
3. Add `NO_COLOR`/`isTTY` guard to `colorize()` in `bin/lib/utils.js`
4. Enhance `promptRuntime()` with per-platform descriptions + non-TTY announcement
5. Add `checkExistingInstall()` to `manifest.js`; add early-return prepend to `install()`
6. Add 4 `log.step()` calls to outer `install()` in `install.js`
7. Create `bin/lib/errors.js`; update `main().catch()` to use `formatError()`

**Research flag:** NONE — architecture fully specified, all integration points confirmed from direct code inspection.

**Defer:** Arrow-key raw mode — ship as Phase 1b after user validation.

---

### Phase 2: Documentation (DOCS-01 through DOCS-05)

**Goal:** A user reading any of the 4 doc files sees all 21 current commands accurately described, and a new user can go from zero to first phase completion in under 5 minutes following GETTING_STARTED.md.

**Requirements:** DOCS-01, DOCS-02, DOCS-03, DOCS-04, DOCS-05

**Tasks (in write-order):**
1. `docs/cheatsheet.md` — add 4 missing commands; fix 3 stale count references (16→21)
2. `docs/COMMAND_REFERENCE.md` — full rewrite (highest-effort task in milestone)
3. `docs/WORKFLOW_OVERVIEW.md` — restructure with Mermaid `flowchart TD`; cut to ≤60 lines
4. `docs/GETTING_STARTED.md` — new file, 70–80 lines, 5 steps with time ranges + expected output
5. `README.md` — 5 surgical edits: version badge, 3× command count refs, new commands to Skills Reference

**Research flag:** NONE — content format fully specified.

---

### Phase 3 (Optional): CI Quality Guards

Can be folded into Phase 1 or Phase 2, or stand alone.

**Delivers:**
- Command count lint (cheatsheet heading count vs. `commands/pd/` file count)
- Cross-file command presence check (all 21 commands in all 4 doc files)
- ANSI emission test (piped installer output contains no `\x1b` characters)
- WORKFLOW_OVERVIEW line count assert (fails CI if file exceeds 60 lines)

**Effort:** ~100 lines total across existing smoke test files.

---

## Confidence Assessment

| Area | Level | Basis |
|------|-------|-------|
| Current installer state | **HIGH** | Direct inspection of all 415 lines of `bin/install.js` + all lib files |
| Zero-dep constraint | **HIGH** | `package.json` has no `dependencies` field — explicit policy |
| `log.step()` already exists | **HIGH** | Confirmed in `bin/lib/utils.js`; consumed by platform installers |
| Idempotency infrastructure | **HIGH** | `readManifest()`, `detectChanges()` confirmed present in `manifest.js` |
| Build sequence safety | **HIGH** | Each step risk-rated from direct code analysis |
| Arrow-key raw mode feasibility | **HIGH** | Node.js primitives confirmed; risk is edge cases, not impossibility |
| Doc format recommendations | **HIGH** | Based on actual reading of existing docs + established patterns |
| Mermaid GitHub rendering | **HIGH** | Confirmed at github.blog/2022-02-14 |
| External library sizes | **LOW** | From training data, not verified at research time |

**Gaps to address during planning:**

1. **Full 21-command list** — FEATURES.md identifies 5 missing but does not enumerate all 21. Validate against `ls commands/pd/*.md` before writing COMMAND_REFERENCE.
2. **`--all` flag + idempotency** — verify multi-platform early-return behavior before shipping INSTALL-03. The `--all` path installs 5 platforms; `state === 'current'` on one should not block the others.
3. **`promptLocation()` non-TTY edge cases** — current analysis confirms the TTY guard at line 348 covers the main path, but a targeted non-TTY test with `--codex` (no `--global/--local`) should be added before Phase 1 ships.

---

## Sources (Aggregated)

- `bin/install.js` (415 lines, direct inspection)
- `bin/lib/utils.js` (direct inspection — confirmed `log.*` API and ANSI implementation)
- `bin/lib/platforms.js` (direct inspection — confirmed PLATFORMS map structure)
- `bin/lib/manifest.js` (direct inspection — confirmed `readManifest`, `detectChanges`, `saveLocalPatches`)
- `bin/lib/installers/claude.js` (direct inspection — confirmed inner `log.step()` usage, TOTAL_STEPS = 6)
- `package.json` (direct inspection — confirmed zero runtime deps)
- `docs/cheatsheet.md` (direct inspection — confirmed "16 commands" on line 6, 204 lines total)
- `docs/COMMAND_REFERENCE.md` (direct inspection — confirmed 34-line stub with broken `commands/` links)
- `docs/WORKFLOW_OVERVIEW.md` (direct inspection — confirmed 53 lines, prose-heavy)
- `README.md` (direct inspection, lines 1–80 — confirmed v4.0.0 badge, stale command counts)
- `.planning/REQUIREMENTS.md` (v12.3 requirements, all 9 req-IDs INSTALL-01 through DOCS-05)
- Node.js docs: `readline.emitKeypressEvents`, `process.stdin.setRawMode` (stable since Node.js 0.7.7)
- GitHub Mermaid support: github.blog/2022-02-14-include-diagrams-markdown-files-mermaid
- CLI documentation patterns: gh CLI (cli.github.com/manual), npm docs (docs.npmjs.com), fastlane docs (docs.fastlane.tools)

---

*Research synthesized: 2026-04-07*  
*Synthesizer: gsd-research-synthesizer*  
*Ready for roadmap: YES — 9 requirements, 2 phases, all patterns documented, all pitfalls mapped*
