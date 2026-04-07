# Phase 145: Installer Prompt UX — Research

**Researched:** 2026-04-07
**Domain:** Node.js CLI installer prompt UX, TTY detection, module extraction
**Confidence:** HIGH — all findings based on direct source inspection of actual codebase files

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Add TTY detection to `colorize()` in `bin/lib/utils.js` — single function, zero per-call changes needed
- **D-02:** Guard condition: `process.stdout.isTTY && !process.env.NO_COLOR` — both POSIX TTY check and `NO_COLOR` standard honored
- **D-03:** When guard fires, return bare text (strip ANSI entirely, do not substitute with spaces or brackets)
- **D-04:** The guard applies to ALL `colorize()` callers transitively: `log.success`, `log.warn`, `log.error`, `log.step`, `log.banner` — no per-function changes needed
- **D-05:** Extract `promptRuntime()` and `promptLocation()` from `bin/install.js` (lines ~129–165) into a new module `bin/lib/prompt.js`
- **D-06:** `bin/lib/prompt.js` exports: `{ promptRuntime, promptLocation }` — both functions, same signatures
- **D-07:** `bin/install.js` imports from `./lib/prompt` — replace inline definitions with a single require
- **D-08:** `createRL()` and `ask()` helpers move to `bin/lib/prompt.js` (private, not exported)
- **D-09:** Add `description` field to each platform entry in `bin/lib/platforms.js` — one-line summary per platform
- **D-10:** Descriptions (final):
  - Claude Code → `"AI-powered dev assistant by Anthropic"`
  - Codex CLI → `"OpenAI's terminal coding agent"`
  - Gemini CLI → `"Google's AI coding assistant"`
  - OpenCode → `"Open-source AI coding agent"`
  - GitHub Copilot → `"GitHub's AI pair programmer"`
  - Cursor → `"AI-first code editor"`
  - Windsurf → `"Agentic IDE by Codeium"`
- **D-11:** `promptRuntime()` display format: `  N. Platform Name — Description` (em dash separator, 2-space indent)
- **D-12:** Detect non-TTY: `!process.stdin.isTTY` at the top of `promptRuntime()` and `promptLocation()`
- **D-13:** Non-TTY platform selection: print `"Non-interactive mode: installing for all platforms"` then return `getAllRuntimes()` (safe, comprehensive default)
- **D-14:** Non-TTY location selection: print `"Non-interactive mode: using global install"` then return `true`
- **D-15:** Non-TTY messages use `log.info()` — no color (consistent with TTY guard), no `process.exit(1)`
- **D-16:** After `promptRuntime()` returns, caller in `main()` prints: `log.info(\`Installing for: \${platformNames.join(', ')}\`)` before proceeding — this replaces silent continuation

### the agent's Discretion
- Whether to add `isTTY` checks for `process.stdin` vs `process.stdout` — use `stdout.isTTY` for color guard (output-side), `stdin.isTTY` for prompt detection (input-side)
- Exact wording of non-TTY messages (D-13, D-14) — suggestions above are preferred but agent may adjust for clarity
- Whether `prompt.js` also exports `ask()` for future use — no need, keep private

### Deferred Ideas (OUT OF SCOPE)
- Arrow-key / raw-mode interactive selector — deferred, risky in cross-platform readline; numbered selector satisfies INSTALL-04
- `ask()` exported from `prompt.js` for reuse elsewhere — defer until a caller needs it
- `log.step()` progress labels throughout install — Phase 146 scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INSTALL-04 | Interactive platform selector is intuitive — arrow-key navigation (or numbered choice fallback for non-TTY); each platform shows a one-line description; selected platform confirmed before proceeding | Numbered selector + descriptions in `promptRuntime()`, confirmation in `main()`, non-TTY announcement |
</phase_requirements>

---

## Summary

Phase 145 makes three surgical improvements to `bin/install.js` without adding any new npm dependencies. The work is fully self-contained: one TTY guard added to `colorize()`, two functions extracted into a new `bin/lib/prompt.js` module, `description` fields added to `bin/lib/platforms.js`, and one confirmation line added in `main()`.

All source files have been directly inspected. `bin/lib/prompt.js` does **not** exist yet — confirmed. `colorize()` has **no TTY guard** — confirmed. `PLATFORMS` has **no `description` field** — confirmed. The non-TTY path in `main()` silently defaults to `["claude"]` with no announcement — confirmed. The test suite uses Node.js built-in `node:test` with no TTY-scenario coverage — confirmed.

**Primary recommendation:** Implement in strict task order: (1) TTY guard on `colorize()`, (2) descriptions in `platforms.js`, (3) create `bin/lib/prompt.js` with enhanced prompt functions, (4) update `bin/install.js` to import from prompt.js and add confirmation line. This order ensures each step is testable in isolation and that ANSI-in-CI is fixed before any new colored output is added.

---

## Standard Stack

### Core (all already present — zero new deps)
| Module | Version | Purpose | Source |
|--------|---------|---------|--------|
| `readline` (Node built-in) | Node ≥16.7 | `createRL()`, `ask()` — prompt input/output | [VERIFIED: bin/install.js line 8] |
| `process.stdout.isTTY` | Node built-in | TTY detection for color guard | [VERIFIED: Node.js docs, used in install.js] |
| `process.stdin.isTTY` | Node built-in | TTY detection for prompt detection | [VERIFIED: bin/install.js line 348] |
| `process.env.NO_COLOR` | Convention | Disable color per NO_COLOR spec | [CITED: no-color.org] |

**Installation:** None required. All Node.js builtins. `package.json` has no `dependencies` field — zero-dep policy confirmed. [VERIFIED: package.json]

---

## Architecture Patterns

### Recommended Project Structure (after Phase 145)
```
bin/
├── install.js             # Main installer (415 lines) — remove inline prompts, add require('./lib/prompt')
└── lib/
    ├── utils.js           # colorize() gets TTY guard (line 22)
    ├── platforms.js       # PLATFORMS entries get description field
    ├── prompt.js          # NEW — exports { promptRuntime, promptLocation }
    └── manifest.js        # Unchanged this phase
```

### Pattern 1: TTY Guard on `colorize()`

**What:** Single ternary wrapping ANSI output — returns bare text if not TTY or NO_COLOR set.

**Current code** (`bin/lib/utils.js` lines 21–23): [VERIFIED: direct inspection]
```javascript
function colorize(color, text) {
  return `${COLORS[color] || ""}${text}${COLORS.reset}`;
}
```

**After fix** (guard added, D-02, D-03):
```javascript
function colorize(color, text) {
  if (!process.stdout.isTTY || process.env.NO_COLOR) return text;
  return `${COLORS[color] || ""}${text}${COLORS.reset}`;
}
```

**Key insight:** `log.success`, `log.warn`, `log.error`, `log.step`, `log.banner` all call `colorize()` — the guard is inherited transitively with zero per-call changes. [VERIFIED: bin/lib/utils.js lines 26–47]

---

### Pattern 2: New `bin/lib/prompt.js` Module

**What:** Extract `createRL()`, `ask()`, `promptRuntime()`, `promptLocation()` from `bin/install.js` into a dedicated module. Enhance with TTY detection, descriptions, and non-TTY announcement.

**Source functions to move** (exact lines from `bin/install.js`): [VERIFIED: direct inspection]
- `createRL()` — lines 116–121
- `ask()` — lines 123–127
- `promptRuntime()` — lines 129–151
- `promptLocation()` — lines 153–165

**New `bin/lib/prompt.js` structure:**
```javascript
"use strict";

const readline = require("readline");
const { PLATFORMS, getAllRuntimes } = require("./platforms");
const { log } = require("./utils");

function createRL() { /* ... private */ }
async function ask(rl, question) { /* ... private */ }

async function promptRuntime() {
  if (!process.stdin.isTTY) {
    log.info("Non-interactive mode: installing for all platforms");
    return getAllRuntimes();
  }
  const rl = createRL();
  const runtimes = getAllRuntimes();
  console.log("");
  console.log("Choose a platform to install skills:");
  console.log("");
  runtimes.forEach((rt, i) => {
    console.log(`  ${i + 1}. ${PLATFORMS[rt].name} — ${PLATFORMS[rt].description}`);
  });
  console.log(`  ${runtimes.length + 1}. All`);
  console.log("");
  const answer = await ask(rl, `Choose (1-${runtimes.length + 1}): `);
  rl.close();
  const num = parseInt(answer, 10);
  if (num === runtimes.length + 1) return runtimes;
  if (num >= 1 && num <= runtimes.length) return [runtimes[num - 1]];
  log.error("Invalid selection.");
  process.exit(1);
}

async function promptLocation() {
  if (!process.stdin.isTTY) {
    log.info("Non-interactive mode: using global install");
    return true;
  }
  const rl = createRL();
  console.log("");
  console.log("Installation scope:");
  console.log("  1. Global (for all projects)");
  console.log("  2. Local (current project only)");
  console.log("");
  const answer = await ask(rl, "Choose (1-2, default: 1): ");
  rl.close();
  return answer === "2" ? false : true;
}

module.exports = { promptRuntime, promptLocation };
```

---

### Pattern 3: `description` Field in `bin/lib/platforms.js`

**Current state** — `PLATFORMS` entries have: `name`, `dirName`, `commandPrefix`, `commandSeparator`, `envVar`, `skillFormat`, `frontmatterFormat`, `toolMap`. **No `description` field.** [VERIFIED: direct inspection of bin/lib/platforms.js]

**7 platforms confirmed** (order in `PLATFORMS` object): `claude`, `codex`, `gemini`, `opencode`, `copilot`, `cursor`, `windsurf` [VERIFIED: direct inspection]

**Addition pattern** (D-09, D-10 — add after `name` in each entry):
```javascript
claude: {
  name: 'Claude Code',
  description: 'AI-powered dev assistant by Anthropic',
  // ...existing fields unchanged...
},
codex: {
  name: 'Codex CLI',
  description: "OpenAI's terminal coding agent",
  // ...
},
```

---

### Pattern 4: `bin/install.js` Changes After Extraction

**Remove:** lines 116–165 (createRL, ask, promptRuntime, promptLocation) [VERIFIED: lines confirmed]

**Add import** near line 35 (alongside existing lib requires):
```javascript
const { promptRuntime, promptLocation } = require("./lib/prompt");
```

**Current non-TTY block in `main()`** (lines 346–354): [VERIFIED: direct inspection]
```javascript
if (runtimes.length === 0 && !flags.help) {
  if (!process.stdin.isTTY) {
    // Non-interactive: default to claude global
    runtimes = ["claude"];            // ← SILENT, wrong default
  } else {
    runtimes = await promptRuntime(); // ← already calls promptRuntime()
    isGlobal = await promptLocation();
  }
}
```

**After extraction**, the non-TTY branch in `main()` becomes redundant because `promptRuntime()` and `promptLocation()` now handle the non-TTY case internally. The block becomes:
```javascript
if (runtimes.length === 0 && !flags.help) {
  runtimes = await promptRuntime();   // handles TTY and non-TTY
  isGlobal = await promptLocation();  // handles TTY and non-TTY
}
```

**Add confirmation line** (D-16) after the `runtimes.length === 0` block:
```javascript
if (runtimes.length === 0 && !flags.help) {
  runtimes = await promptRuntime();
  isGlobal = await promptLocation();
  const platformNames = runtimes.map((r) => PLATFORMS[r].name);
  log.info(`Installing for: ${platformNames.join(', ')}`);
}
```

> **Note:** The confirmation only makes sense when the user just chose interactively. When `--claude` flag was passed directly, no confirmation needed (user already specified).

---

### Anti-Patterns to Avoid

- **Adding ANSI output before fixing `colorize()`:** Any new `log.*` call before the TTY guard is in place would leak ANSI in piped output. Fix `colorize()` FIRST (Task 1 in plan).
- **Non-TTY announcement in `main()` instead of `promptRuntime()`:** The announcement belongs in the prompt function so it is testable in isolation and doesn't scatter TTY logic across files.
- **Exporting `ask()` from `prompt.js`:** Deferred by design (D-08). Keep private.
- **Changing `promptRuntime()` return type:** It returns `string[]` in both TTY and non-TTY paths — callers don't need to change.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TTY detection | Custom `isatty` logic | `process.stdout.isTTY` / `process.stdin.isTTY` | Node built-in, cross-platform |
| NO_COLOR standard | Custom env-var parsing | `process.env.NO_COLOR` truthy check | Standard per no-color.org |
| Arrow-key menu | Raw stdin / keypress | DEFERRED (Phase 145 does numbered list) | Too risky cross-platform |
| ANSI stripping | Regex on colored strings | Guard at source in `colorize()` | Simpler, no regex, no per-caller changes |

**Key insight:** Every feature in this phase uses Node.js builtins that ship with Node ≥16.7 (the project's minimum engine). Zero new installs, zero added download size, zero new failure modes.

---

## Common Pitfalls

### Pitfall 1: `colorize()` called before TTY guard is added
**What goes wrong:** New log lines added to `promptRuntime()` (e.g., `log.info(...)` non-TTY announcement) emit ANSI even in non-TTY if `colorize()` is not guarded yet.
**Why it happens:** Work starts on prompts before fixing the color function.
**How to avoid:** Strict task order — TTY guard on `colorize()` MUST be the first code change.
**Warning signs:** `\x1b` appears in piped output in tests.

### Pitfall 2: Non-TTY announcement left in `main()` instead of prompt module
**What goes wrong:** The announcement is in `main()`, but `promptRuntime()` is called directly (non-TTY path bypasses `main()` entirely in tests). Tests can't easily assert the message.
**Why it happens:** Putting the check in `main()` feels natural since that's where `!process.stdin.isTTY` currently lives.
**How to avoid:** Per D-12, the check lives at the top of `promptRuntime()` and `promptLocation()`, not in `main()`.

### Pitfall 3: Removing the `!process.stdin.isTTY` guard from `main()` too early
**What goes wrong:** The block at lines 346–354 that checks `!process.stdin.isTTY` must be updated (not just deleted). If deleted without updating `promptRuntime()`, non-TTY runs hang waiting for stdin input.
**Why it happens:** Refactoring sequence error — prompt module not yet handling non-TTY when the guard in main() is removed.
**How to avoid:** Write `prompt.js` with TTY guards BEFORE updating `main()`. Then the `main()` change is safe.

### Pitfall 4: `log.info()` for non-TTY announcement calls `colorize()` (which would now return bare text)
**What goes wrong:** None — this is correct behavior by design. `log.info()` does NOT call `colorize()` (verified: `log.info: (msg) => console.log(msg)`). [VERIFIED: bin/lib/utils.js line 26]
**Why it matters:** Non-TTY announcements will always be plain text even if `colorize()` guard isn't present — but being explicit helps reasoning about the system.

### Pitfall 5: `"All platforms"` option display format inconsistency
**What goes wrong:** "All" entry has no description but the format string includes `— Description`. Results in `  8. All — ` with dangling em dash.
**Why it happens:** Forgetting the "All" option when adding description formatting.
**How to avoid:** The "All" entry is a special case; render it separately without the em dash: `  ${runtimes.length + 1}. All platforms`.

---

## Code Examples

### Current `colorize()` (bin/lib/utils.js lines 21–23)
```javascript
// Source: direct inspection [VERIFIED]
function colorize(color, text) {
  return `${COLORS[color] || ""}${text}${COLORS.reset}`;
}
```

### Fixed `colorize()` with TTY guard
```javascript
// Implements D-02, D-03
function colorize(color, text) {
  if (!process.stdout.isTTY || process.env.NO_COLOR) return text;
  return `${COLORS[color] || ""}${text}${COLORS.reset}`;
}
```

### Current `promptRuntime()` display (bin/install.js lines 136–139)
```javascript
// Source: direct inspection [VERIFIED]
runtimes.forEach((rt, i) => {
  console.log(`  ${i + 1}. ${PLATFORMS[rt].name}`);  // bare name, no description
});
console.log(`  ${runtimes.length + 1}. All`);
```

### New `promptRuntime()` display (implements D-11)
```javascript
runtimes.forEach((rt, i) => {
  console.log(`  ${i + 1}. ${PLATFORMS[rt].name} — ${PLATFORMS[rt].description}`);
});
console.log(`  ${runtimes.length + 1}. All platforms`);
```

### Non-TTY path in `promptRuntime()` (implements D-12, D-13)
```javascript
async function promptRuntime() {
  if (!process.stdin.isTTY) {
    log.info("Non-interactive mode: installing for all platforms");
    return getAllRuntimes();
  }
  // ... TTY path ...
}
```

### Module exports pattern (matches bin/lib/ convention)
```javascript
// Source: pattern verified across bin/lib/utils.js, platforms.js, manifest.js [VERIFIED]
"use strict";
// ... code ...
module.exports = { promptRuntime, promptLocation };
```

---

## Exact Code Locations

> All line numbers verified by direct file inspection [VERIFIED: 2026-04-07]

| Location | Content | Action Required |
|----------|---------|-----------------|
| `bin/lib/utils.js` line 21–23 | `colorize()` — no TTY guard | Add guard (D-02) |
| `bin/lib/utils.js` line 26 | `log.info: (msg) => console.log(msg)` | No change — already plain text |
| `bin/lib/utils.js` line 27 | `log.success` calls `colorize("green", ...)` | Guard inherited from colorize() |
| `bin/lib/platforms.js` line 46+ | `PLATFORMS.claude` — no `description` field | Add `description` per D-10 (7 entries) |
| `bin/install.js` line 116–121 | `createRL()` | Move to `bin/lib/prompt.js` (private) |
| `bin/install.js` line 123–127 | `ask()` | Move to `bin/lib/prompt.js` (private) |
| `bin/install.js` line 129–151 | `promptRuntime()` — no TTY check, no descriptions | Move + enhance in `bin/lib/prompt.js` |
| `bin/install.js` line 153–165 | `promptLocation()` — no TTY check | Move + enhance in `bin/lib/prompt.js` |
| `bin/install.js` line 346–354 | Non-TTY silently defaults to `["claude"]` | Replace with call to `promptRuntime()` (which handles non-TTY internally) |
| `bin/install.js` line 352 | `runtimes = await promptRuntime()` | Add confirmation line after (D-16) |
| `bin/lib/prompt.js` | Does NOT exist | Create new file |

---

## Test Infrastructure

### Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` (no Jest/Mocha) |
| Config file | None — invoked via `node --test 'test/**/*.test.js'` |
| Quick run command | `node --test test/smoke-utils.test.js` |
| Full suite command | `npm test` (`node --test 'test/**/*.test.js'`) |
| Test for install.js | **None exists** [VERIFIED: checked test/ directory] |
| Test for utils colorize | **None exists** — smoke-utils.test.js tests parseFrontmatter, buildFrontmatter, etc. but NOT colorize() [VERIFIED] |
| Test naming pattern | `test/{area}.test.js` or `test/smoke-{area}.test.js` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INSTALL-04 | TTY output has zero ANSI in piped mode | unit | `node --test test/smoke-prompt.test.js` | ❌ Wave 0 |
| INSTALL-04 | Numbered choices include descriptions | unit | `node --test test/smoke-prompt.test.js` | ❌ Wave 0 |
| INSTALL-04 | Non-TTY prints announcement and returns all runtimes | unit | `node --test test/smoke-prompt.test.js` | ❌ Wave 0 |
| INSTALL-04 | Confirmation line printed after selection | unit | `node --test test/smoke-prompt.test.js` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-prompt.test.js` (once created in Wave 0)
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `test/smoke-prompt.test.js` — covers INSTALL-04 (TTY guard, descriptions, non-TTY, confirmation)

**Testing non-TTY scenarios pattern** (no existing examples in test suite — implement from scratch):
```javascript
// Simulate non-TTY by temporarily overriding stdin.isTTY
const orig = process.stdin.isTTY;
process.stdin.isTTY = false;
try {
  const result = await promptRuntime();
  assert.deepEqual(result, getAllRuntimes());
} finally {
  process.stdin.isTTY = orig;
}
```

**Testing ANSI guard pattern**:
```javascript
// Simulate non-TTY stdout
const origTTY = process.stdout.isTTY;
process.stdout.isTTY = false;
try {
  const result = colorize("green", "hello");
  assert.strictEqual(result, "hello"); // no ANSI codes
  assert.ok(!result.includes("\x1b"));
} finally {
  process.stdout.isTTY = origTTY;
}
```

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — this phase is pure code/config changes using Node.js builtins already in use throughout the codebase).

---

## Security Domain

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | N/A — installer has no auth |
| V3 Session Management | no | N/A |
| V4 Access Control | no | N/A |
| V5 Input Validation | yes (minor) | `parseInt(answer, 10)` + range check already in promptRuntime() [VERIFIED: line 145–147] |
| V6 Cryptography | no | N/A |

**Threat patterns relevant to this phase:**
- **Malicious `NO_COLOR` env var:** Not a threat — stripping ANSI is the desired behavior, not a security bypass.
- **Invalid menu input causing process.exit(1):** Existing behavior preserved — out-of-range selection still exits with error.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `log.info()` does not call `colorize()` (already plain text) | Code Examples | Trivial — verified by reading utils.js line 26 directly [VERIFIED] |

**All other claims in this research were verified by direct file inspection.**

---

## Open Questions (RESOLVED)

1. **Confirmation line scope: only after interactive selection, or also after flag-based selection?** — RESOLVED: Interactive only. Add confirmation inside the `if (runtimes.length === 0)` block in `main()`, which only runs when no `--platform` flag was passed.

2. **`"All platforms"` label: `"All"` or `"All platforms"`?** — RESOLVED: Use `"All platforms"` per CONTEXT.md specifics section.

---

## Sources

### Primary (HIGH confidence — direct file inspection)
- `bin/install.js` — complete file read (415 lines), line numbers verified for all functions
- `bin/lib/utils.js` — complete file read, colorize() confirmed without TTY guard
- `bin/lib/platforms.js` — complete file read, 7 platforms confirmed, no description field
- `test/` directory listing — no prompt.js or install.js tests confirmed
- `package.json` — zero-dep policy confirmed, `node:test` framework confirmed
- `.planning/config.json` — `nyquist_validation: true` confirmed

### Secondary (HIGH confidence — from CONTEXT.md and SUMMARY.md)
- `.planning/phases/145-installer-prompt-ux/145-CONTEXT.md` — all locked decisions
- `.planning/research/SUMMARY.md` — milestone research summary

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Node.js builtins, all verified in codebase
- Architecture: HIGH — exact line numbers from direct inspection
- Pitfalls: HIGH — derived from actual code state, not speculation
- Test patterns: MEDIUM — non-TTY test mocking pattern is standard Node.js but no existing example in this test suite to reference

**Research date:** 2026-04-07
**Valid until:** Stable — no external dependencies to drift. Valid until codebase changes.
