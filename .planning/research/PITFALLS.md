# Pitfalls: Installation UX & Documentation

**Milestone:** v12.3 — Installation & Documentation UX
**Researched:** 2026-04-07
**Confidence:** HIGH (direct source analysis: bin/install.js, bin/lib/utils.js, bin/lib/installer-utils.js, docs/cheatsheet.md, .planning/REQUIREMENTS.md, test/smoke-installer-utils.test.js)

---

> **Scope note:** This file supersedes the v8.0 pitfalls research for the purposes of milestone v12.3 roadmapping.
> The v12.3 milestone scope is limited to: (1) installer UX layer in `bin/install.js`, and (2) documentation rewrites in `docs/`. No new CLI commands, no skill-file changes.

---

## Risk Matrix

| ID | Area | Risk | Severity | Mitigation |
|----|------|------|----------|------------|
| TTY-01 | Installer | ANSI codes always emitted — break CI log parsers | HIGH | Add `NO_COLOR` / `process.stdout.isTTY` guard to `colorize()` |
| TTY-02 | Installer | Silent fallback to `claude`-only in non-TTY is invisible | MEDIUM | Log fallback reason before proceeding |
| TTY-03 | Installer | `readline` hangs if stdin is closed/piped without data | HIGH | Add `process.stdin.isTTY` guard before creating RL interface |
| IDEM-01 | Installer | No "already installed" status shown on re-run | MEDIUM | Check manifest before overwriting; show "already installed / updated" |
| IDEM-02 | Installer | Partial install leaves no recovery signal | HIGH | Write manifest only after all steps complete; detect partial manifest on re-run |
| PERM-01 | Installer | Cryptic `EACCES` shown instead of actionable fix hint | MEDIUM | Catch permission errors explicitly; show `sudo`/`chmod` fix hint |
| DOCS-01 | Docs | Cheatsheet says "16 commands" but v12.3 targets 21 | CRITICAL | Automated command count check in CI |
| DOCS-02 | Docs | New commands (pd:stats, pd:health etc.) absent from all 4 doc files | HIGH | Docs audit checklist against `ls commands/pd/` |
| DOCS-03 | Docs | COMMAND_REFERENCE links to missing `commands/` subdirectory | MEDIUM | Remove all subdirectory links; inline everything |
| DOCS-04 | Docs | WORKFLOW_OVERVIEW grows back above 60-line limit post-edit | LOW | Add line-count lint check for that file |

---

## Installer UX Pitfalls

### CRITICAL — TTY-01: ANSI Escape Codes Always Emitted (No TTY Guard)

**What goes wrong:**
`bin/lib/utils.js` `colorize()` always wraps output in ANSI codes. There is no check against `process.stdout.isTTY`, `NO_COLOR`, or `FORCE_COLOR`. In CI environments (GitHub Actions, Jenkins, Docker build logs), raw `\x1b[0;32m` sequences appear in logs, breaking log parsers and making output unreadable.

**Current code:**
```js
// utils.js — line 22-24
function colorize(color, text) {
  return `${COLORS[color] || ""}${text}${COLORS.reset}`;  // always applies color
}
```

**Why it happens:**
The utility was written for interactive use. No CI usage was tested at the time.

**Consequences:**
- CI log search (grep for errors) matches ANSI codes, not text content
- Log-aggregation tools (Datadog, Splunk) show garbled installer output
- `npx please-done --claude` in a GitHub Actions workflow prints junk

**Prevention:**
```js
// Fix: add TTY check + NO_COLOR support
const NO_COLOR = process.env.NO_COLOR !== undefined ||
                 !process.stdout.isTTY;
function colorize(color, text) {
  if (NO_COLOR) return text;
  return `${COLORS[color] || ""}${text}${COLORS.reset}`;
}
```
Test: run installer with `stdout` piped to a file — output must contain no `\x1b` characters.

---

### HIGH — TTY-03: `readline` Hangs in Piped/Scripted Environments

**What goes wrong:**
`promptRuntime()` calls `readline.createInterface({ input: process.stdin, output: process.stdout })`. When stdin is piped (e.g., `echo "" | npx please-done`), the interface is created but `rl.question()` resolves with empty string `""`. `parseInt("", 10)` returns `NaN`. The code path hits `log.error("Invalid selection.")` and `process.exit(1)` — but only after a delay that feels like a hang.

Worse: `promptLocation()` creates its **own separate** `readline` interface. If stdin was consumed by the first `rl`, the second `rl.question()` never fires.

**The exact guard exists** (line 348: `if (!process.stdin.isTTY)`), but the guard only protects the case where no runtime flag was given. If a user provides `--claude` but omits `--global/--local`, `promptLocation()` is called without a TTY check.

**Wait — is this actually the case?**
Looking at lines 346-355:
```js
if (runtimes.length === 0 && !flags.help) {
  if (!process.stdin.isTTY) {
    runtimes = ["claude"];          // non-TTY fallback
  } else {
    runtimes = await promptRuntime();
    isGlobal = await promptLocation();  // both prompts only in TTY path
  }
}
```
`promptLocation()` is only called in the TTY branch — so the hang risk is contained. **However**, this means that `npx please-done --codex` in a non-TTY environment always installs globally without asking, which is correct behavior but is **never announced**. The user sees no indication that the global default was applied.

**Prevention:**
Add a log line before the install loop:
```js
if (!process.stdin.isTTY && runtimes.length > 0) {
  log.info("Non-interactive mode: installing globally (use --local to override).");
}
```

---

### MEDIUM — TTY-02: Non-TTY Fallback to Claude-Only is Silent

**What goes wrong:**
When `runtimes.length === 0` and `!process.stdin.isTTY`, the installer silently picks `["claude"]` and installs only Claude Code. A user running `npx please-done` in a CI environment expecting `--all` behavior gets a partial install with no explanation.

**Prevention:**
Before executing, emit:
```
Non-interactive mode detected. Defaulting to: Claude Code (global).
To install a different platform, pass a flag: --codex, --gemini, --all, etc.
```

---

### HIGH — IDEM-02: Partial Install Leaves Undetectable State

**What goes wrong:**
The manifest is written **after** all install steps succeed (line 224: `writeManifest(targetDir, VERSION, installedDirs)`). If the installer crashes mid-run (e.g., permission error on file 8 of 21), no manifest is written. On re-run, the installer has no record of the previous partial attempt — it re-installs from scratch.

For single-platform installs this is acceptable. But for `--all` (5 platforms), if platforms 1-3 succeed and platform 4 fails, all 5 re-run on the next attempt. This is wasteful but not catastrophic.

The real risk: the `saveLocalPatches()` call (line 202) runs BEFORE the install. On a partial install, patches may be saved but never reported (since `reportLocalPatches()` at line 238 only runs after full install). User's customizations are silently backed up but they don't know it.

**Prevention:**
- Write a per-platform partial manifest immediately after each platform installs
- On re-run, detect partial manifests and show "resuming from checkpoint"
- At minimum: emit a clear message if `saveLocalPatches` finds files and the install subsequently fails

---

### MEDIUM — PERM-01: Permission Errors Show Raw `EACCES` Stack

**What goes wrong:**
Line 406-409:
```js
main().catch((err) => {
  log.error(err.message);
  if (process.env.PD_DEBUG) console.error(err.stack);
  process.exit(1);
});
```
`err.message` for `EACCES` is:
`EACCES: permission denied, mkdir '/usr/local/share/.../claude'`

No hint about how to fix it. The user sees an error and guesses.

**Prevention:**
Catch `EACCES` explicitly in `install()`:
```js
} catch (err) {
  if (err.code === 'EACCES') {
    log.error(`Permission denied: ${err.path}`);
    log.info(`  Fix: sudo npx please-done ${flags.join(' ')}`);
    log.info(`  Or use --local to install in the current project instead.`);
    process.exit(1);
  }
  throw err;
}
```

---

### LOW — INSTALL-04 Scope Creep: Arrow-Key Navigation is a Platform Risk

**What goes wrong:**
REQUIREMENTS.md INSTALL-04 asks for "arrow-key navigation" for the platform selector. `readline` in Node.js does not natively support arrow-key selection menus — that requires a library like `@inquirer/select` or `enquirer`. Adding a dependency just for the interactive mode:
- Adds ~500KB to the npm package
- May fail in restricted environments (offline npm, proxy issues)
- Creates a runtime dependency that must be maintained

The numbered fallback (already implemented) works everywhere. Arrow-key adds polish but risks breaking the currently-functional non-TTY fallback.

**Prevention:**
Before implementing arrow-key navigation, verify that the chosen library (`@inquirer/prompts` or `enquirer`) degrades gracefully in non-TTY environments. Test: `echo "1" | npx please-done` must still work after the library is added.

---

## Documentation Pitfalls

### CRITICAL — DOCS-01: Cheatsheet Command Count Drift (16 vs 21)

**What goes wrong:**
`docs/cheatsheet.md` line 6 reads:
```
Quick reference for all 16 Please Done (PD) commands.
```
REQUIREMENTS.md DOCS-02 requires covering **21 commands**. The delta of 5 commands (`pd:stats`, `pd:health`, `pd:discover`, `pd:audit`, `pd:sync-version`) are entirely absent.

This is the most concrete pre-existing drift in the codebase. A user reading the cheatsheet after v12.3 ships will still see "16 commands" even if all 5 new sections are added — because the hardcoded count in the intro paragraph is easy to forget.

**Prevention:**
Add a CI check that counts `pd:` command headings in cheatsheet.md and compares against `ls commands/pd/*.md | wc -l`:
```bash
# In a test file or Makefile
CHEATSHEET_COUNT=$(grep -c "^### \`/pd:" docs/cheatsheet.md)
COMMAND_COUNT=$(ls commands/pd/*.md | wc -l)
[ "$CHEATSHEET_COUNT" -eq "$COMMAND_COUNT" ] || exit 1
```
Or a simpler Node.js test that validates the hardcoded number in the intro matches the actual heading count.

---

### HIGH — DOCS-02: New Commands Absent from Multiple Doc Files

**What goes wrong:**
REQUIREMENTS.md identifies 5 new commands that must appear in:
- `docs/cheatsheet.md` (DOCS-02)
- `README.md` quick start section (DOCS-01)
- `docs/COMMAND_REFERENCE.md` (DOCS-03)
- `docs/GETTING_STARTED.md` (DOCS-05, new file)

The common failure mode: the author adds the commands to the cheatsheet and forgets the other three files. Each file update is treated as an independent task, so the check "did I update all files?" must be explicit.

**Why it happens:**
Docs are written sequentially. The writer updates what they're focused on and declares success after one file. No cross-file consistency check exists.

**Prevention:**
Create a single "command inventory" check: a list of all 21 commands that is validated against each doc file. Implement as a test:
```js
// test: each command in COMMAND_LIST appears in each doc file
const COMMAND_LIST = ['pd:stats', 'pd:health', 'pd:discover', 'pd:audit', 'pd:sync-version', ...];
const DOC_FILES = ['README.md', 'docs/cheatsheet.md', 'docs/COMMAND_REFERENCE.md'];
for (const cmd of COMMAND_LIST) {
  for (const file of DOC_FILES) {
    assert(fs.readFileSync(file, 'utf8').includes(cmd), `${cmd} missing from ${file}`);
  }
}
```

---

### HIGH — DOCS-03: COMMAND_REFERENCE Links to a Missing Subdirectory

**What goes wrong:**
REQUIREMENTS.md DOCS-03 explicitly calls out: "Inline — no links to missing `commands/` subdirectory." This implies the current COMMAND_REFERENCE.md contains links to a `commands/` path that doesn't exist in the npm package (only the source repo). Users clicking doc links in the published README hit 404s.

**Prevention:**
Before writing the new COMMAND_REFERENCE, audit for any `[...](commands/...)` or `[...](../commands/...)` links. Search pattern:
```bash
grep -rn "](commands/" docs/ README.md
```
Every hit is a broken link that must be inlined or removed.

---

### MEDIUM — DOCS-04: WORKFLOW_OVERVIEW Length Regression

**What goes wrong:**
REQUIREMENTS.md DOCS-04 sets a hard limit: "Maximum 60 lines." This is easy to exceed during review cycles when stakeholders request "just one more clarification" or when someone adds edge-case callouts. The 60-line limit gets violated incrementally.

**Prevention:**
Enforce via test:
```js
const lines = fs.readFileSync('docs/WORKFLOW_OVERVIEW.md', 'utf8').split('\n');
assert(lines.length <= 60, `WORKFLOW_OVERVIEW.md exceeds 60 lines: ${lines.length}`);
```
Add to the existing smoke-test suite so it fails CI automatically.

---

### MEDIUM — DOCS-05: GETTING_STARTED.md Estimates Becoming Stale Immediately

**What goes wrong:**
REQUIREMENTS.md DOCS-05 requires "Estimated time for each step." Time estimates in docs go stale the moment they're written. "3 minutes to install" becomes wrong when the install adds a new platform check. Users who follow the guide and exceed the estimate lose trust in the docs.

**Prevention:**
Use ranges, not exact times: "2–5 minutes" not "3 minutes."
Flag estimates as `<!-- update-if-install-steps-change -->` comments so future devs know to update them.
Don't include estimates for steps that depend on network speed (npm install).

---

### LOW — DOCS-06: Over-Documentation Syndrome on COMMAND_REFERENCE

**What goes wrong:**
REQUIREMENTS.md DOCS-03 asks for "1 sentence purpose + syntax + real example" per command. The temptation is to add: caveats, `--flag` combinations, "see also" links, error conditions, and platform-specific notes. The result is a reference doc that takes longer to scan than the original commands themselves.

**Why it happens:**
The author knows the edge cases and feels responsible for communicating them. The mental model is "more complete = better doc."

**Prevention:**
Strict format contract per command. If it doesn't fit in the table row, it doesn't go in COMMAND_REFERENCE — it goes in GETTING_STARTED.md or as inline comments in the skill file itself. Use a reviewer checklist: "Does this row have more than 3 cells of content? Cut it."

---

## Prevention Strategies

### Per-Pitfall Actionable Checks

| Pitfall | When to Check | Automated? | How |
|---------|--------------|-----------|-----|
| TTY-01 (ANSI in CI) | Before shipping UX changes | YES | `node bin/install.js --claude 2>&1 \| cat \| grep -c $'\\x1b'` must return 0 when stdout is not a TTY |
| TTY-02 (silent fallback) | Code review | Partial | Log line presence verified in smoke test |
| IDEM-02 (partial install) | Manual test | Partial | Kill installer mid-run, re-run, verify clean recovery |
| PERM-01 (EACCES) | Code review | YES | Unit test: mock `fs.mkdirSync` to throw `EACCES`, verify error message contains fix hint |
| DOCS-01 (command count) | Pre-merge CI | YES | Line count test: grep `^### \`/pd:` in cheatsheet, compare to command dir |
| DOCS-02 (multi-file gaps) | Pre-merge CI | YES | Command inventory test across all 4 doc files |
| DOCS-03 (broken links) | Pre-merge CI | YES | `grep -rn "](commands/" docs/ README.md` must return empty |
| DOCS-04 (60-line limit) | Pre-merge CI | YES | Line count assert in smoke tests |
| DOCS-05 (stale estimates) | On install step changes | NO | Manual — add a CHANGELOG note when install timing changes |
| INSTALL-04 (arrow-key deps) | Before library install | Partial | `echo "1" \| npx please-done` must still work after adding interactive library |

---

## Test Approach — Installer UX Without Running a Full Install

### Problem
You cannot integration-test the installer against real filesystem targets in CI without side effects (writing to `~/.claude/`, `~/.codex/`, etc.) and platform dependencies (Codex CLI may not be installed).

### Solution: Three Layers of Testable Behavior

**Layer 1 — Unit tests for pure logic** (already exists, extend it)
`test/smoke-installer-utils.test.js` already tests `ensureDir`, `copyWithBackup`, `validateGitRoot` etc. Extend with:
- `parseArgs` edge cases: `--all --claude` deduplication, `--uninstall --local` combinations
- `promptRuntime` logic: mock readline, assert correct runtime returned for each numeric input
- Error message content: mock `fs.mkdirSync` throwing `EACCES`, assert error message includes "Permission denied" and a fix hint

```js
// Example: test parseArgs deduplication
const { parseArgs } = (() => {
  process.env.PD_TEST_MODE = '1';
  return require('../bin/install.js');
})();
const flags = parseArgs(['node', 'install.js', '--all', '--claude']);
assert.deepEqual([...new Set(flags.runtimes)].length, flags.runtimes.length);
```

**Layer 2 — Output format tests** (new, no file system writes)
Capture `console.log` output and assert:
- No ANSI escape codes when `process.stdout.isTTY = false`
- Non-TTY fallback log message is present
- Banner fits within 40 character width

```js
// Mock TTY and capture output
const originalIsTTY = process.stdout.isTTY;
process.stdout.isTTY = false;
const lines = [];
const orig = console.log;
console.log = (msg) => lines.push(msg);
// run log.banner(...) or log.success(...)
console.log = orig;
process.stdout.isTTY = originalIsTTY;
assert(!lines.some(l => l.includes('\x1b')), 'ANSI codes leaked in non-TTY mode');
```

**Layer 3 — Filesystem sandbox tests** (tmpdir, no real install targets)
Use `os.tmpdir()` as the install target directory. Verify:
- Manifest is written after successful install
- Re-run shows "already installed" for unchanged files
- Re-run after partial install (simulate by writing partial manifest) recovers cleanly

```js
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-install-test-'));
// Run install() with configDir: tmp
// Assert: tmp/.pd-manifest.json exists and has expected structure
// Assert: second run completes without error and shows "no changes"
```

**What NOT to test in unit/integration tests:**
- Actual writing to `~/.claude/`, `~/.codex/` etc.
- Real platform detection (whether Claude Code is installed)
- Network operations or `npx` cache behavior
- Arrow-key input in interactive mode (requires real TTY; test in manual QA only)

### Docs Accuracy Testing Without Manual Command Testing

**Automated checks (add to existing test suite):**
1. **Command inventory test** — every `pd:*` command in `commands/pd/` appears by name in each doc file
2. **Broken link detector** — no `](commands/...)` links in doc files
3. **Line count guards** — WORKFLOW_OVERVIEW.md ≤ 60 lines, per REQUIREMENTS.md
4. **Hardcoded count accuracy** — any "X commands" string in docs matches actual command file count

**Manual QA checklist for docs (run once per phase, not automated):**
- [ ] Follow GETTING_STARTED.md on a clean machine — every step works as written
- [ ] Copy-paste each code block from README quick start — no errors
- [ ] Check version badge in README matches `cat VERSION`
- [ ] Verify no command in cheatsheet references a flag that was removed or renamed

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Adding progress steps (INSTALL-01) | ANSI codes in CI output (TTY-01) | Implement TTY/NO_COLOR guard FIRST, before adding any new colored output |
| Non-TTY fallback messaging (INSTALL-04) | Silent fallback confuses CI users (TTY-02) | Add fallback log line in same PR as TTY guard |
| Idempotency (INSTALL-03) | Partial install recovery (IDEM-02) | Write per-step manifest, not end-of-run manifest |
| Error messages (INSTALL-02) | Raw `EACCES` without fix hint (PERM-01) | Add `err.code` switch in catch block before other UX work |
| Cheatsheet update (DOCS-02) | Command count frozen at "16" (DOCS-01) | Add CI count-check as first task in docs phase |
| COMMAND_REFERENCE rewrite (DOCS-03) | Broken subdirectory links survive the rewrite | Run `grep -rn "](commands/"` as pre-commit check |
| WORKFLOW_OVERVIEW rewrite (DOCS-04) | Length creep past 60 lines | Add line-count smoke test before writing the file |
| GETTING_STARTED.md (DOCS-05) | Time estimates go stale | Use ranges; mark with `<!-- update-on-install-change -->` |
| Adding @inquirer/prompts for arrow-key UX | Non-TTY installs break (INSTALL-04) | Verify `echo "1" \| node bin/install.js --claude` works with new dep |

---

## Sources

- `bin/install.js` — direct inspection, HIGH confidence
- `bin/lib/utils.js` — color/TTY handling, HIGH confidence
- `bin/lib/installer-utils.js` — partial install state, HIGH confidence
- `docs/cheatsheet.md` — command count drift (line 6: "16 commands"), HIGH confidence
- `.planning/REQUIREMENTS.md` — v12.3 requirements, feature scope, HIGH confidence
- `test/smoke-installer-utils.test.js` — existing test patterns, HIGH confidence
- Node.js docs: `readline` non-TTY behavior, `process.stdout.isTTY`, HIGH confidence
- [NO_COLOR standard](https://no-color.org/) — MEDIUM confidence (industry standard, not Node-specific)

---
*Pitfalls research for: v12.3 Installation & Documentation UX*
*Researched: 2026-04-07*
