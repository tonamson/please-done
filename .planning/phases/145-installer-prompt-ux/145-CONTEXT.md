# Phase 145: Installer Prompt UX - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 145 delivers three tightly-coupled improvements to the installer's interactive prompts:

1. **TTY guard on `colorize()`** — zero ANSI escape codes emitted when stdout is not a TTY (or `NO_COLOR` is set)
2. **Numbered platform selector with descriptions** — `promptRuntime()` shows platform names + one-line descriptions instead of bare keys
3. **Confirmation line after selection** — the chosen platform is echoed back before install proceeds
4. **Non-TTY announcement** — piped/CI runs print an explicit "Non-interactive mode" notice instead of silently defaulting

This phase does NOT touch step progress labels (Phase 146), error catalog (Phase 147), or docs.

</domain>

<decisions>
## Implementation Decisions

### TTY Guard

- **D-01:** Add TTY detection to `colorize()` in `bin/lib/utils.js` — single function, zero per-call changes needed
- **D-02:** Guard condition: `process.stdout.isTTY && !process.env.NO_COLOR` — both POSIX TTY check and `NO_COLOR` standard honored
- **D-03:** When guard fires, return bare text (strip ANSI entirely, do not substitute with spaces or brackets)
- **D-04:** The guard applies to ALL `colorize()` callers transitively: `log.success`, `log.warn`, `log.error`, `log.step`, `log.banner` — no per-function changes needed

### Prompt Extraction

- **D-05:** Extract `promptRuntime()` and `promptLocation()` from `bin/install.js` (lines ~129–165) into a new module `bin/lib/prompt.js`
- **D-06:** `bin/lib/prompt.js` exports: `{ promptRuntime, promptLocation }` — both functions, same signatures
- **D-07:** `bin/install.js` imports from `./lib/prompt` — replace inline definitions with a single require
- **D-08:** `createRL()` and `ask()` helpers move to `bin/lib/prompt.js` (private, not exported)

### Platform Descriptions

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

### Non-TTY Behavior

- **D-12:** Detect non-TTY: `!process.stdin.isTTY` at the top of `promptRuntime()` and `promptLocation()`
- **D-13:** Non-TTY platform selection: print `"Non-interactive mode: installing for all platforms"` then return `getAllRuntimes()` (safe, comprehensive default)
- **D-14:** Non-TTY location selection: print `"Non-interactive mode: using global install"` then return `true`
- **D-15:** Non-TTY messages use `log.info()` — no color (consistent with TTY guard), no `process.exit(1)`

### Confirmation After Selection

- **D-16:** After `promptRuntime()` returns, caller in `main()` prints: `log.info(\`Installing for: \${platformNames.join(', ')}\`)` before proceeding — this replaces silent continuation

### the agent's Discretion

- Whether to add `isTTY` checks for `process.stdin` vs `process.stdout` — use `stdout.isTTY` for color guard (output-side), `stdin.isTTY` for prompt detection (input-side)
- Exact wording of non-TTY messages (D-13, D-14) — suggestions above are preferred but agent may adjust for clarity
- Whether `prompt.js` also exports `ask()` for future use — no need, keep private

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Installer Core
- `bin/install.js` — Main installer (415 lines); `promptRuntime()` at ~line 128, `promptLocation()` at ~line 153; `main()` at end; imports from `./lib/utils`, `./lib/platforms`, `./lib/manifest`
- `bin/lib/utils.js` — Has `colorize()` (no TTY guard), `log.*` helpers, `isWSL()`; **must fix `colorize()` FIRST before adding any new colored output**
- `bin/lib/platforms.js` — Has `PLATFORMS` object with `name` but no `description`; `getAllRuntimes()` exported

### Requirements
- `.planning/REQUIREMENTS.md` §INSTALL-04 — "Arrow-key navigation (or numbered choice fallback for non-TTY); each platform shows a one-line description; selected platform confirmed before proceeding"
- `.planning/ROADMAP.md` §Phase 145 — Success criteria #1–4 (numbered choices with descriptions; confirmation line; non-TTY notice; zero ANSI in piped output)

### Research
- `.planning/research/SUMMARY.md` — Key findings: zero-dep constraint, arrow-key deferred (risky), numbered selector is sufficient, `colorize()` is the single fix point

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bin/lib/utils.js` `colorize(color, text)` — already exists, just needs TTY guard added (lines 16–19)
- `bin/lib/utils.js` `log.*` — all callers go through `colorize()` so the guard is inherited automatically
- `bin/lib/platforms.js` `getAllRuntimes()` — use as the non-TTY default return value in `promptRuntime()`
- `bin/lib/platforms.js` `PLATFORMS` — add `description` field per entry; already has `name` field as model

### Established Patterns
- Zero external dependencies: `bin/install.js` uses only `fs`, `path`, `readline` — no new npm deps
- Module exports: `module.exports = { fn1, fn2 }` pattern (consistent throughout `bin/lib/`)
- `"use strict"` at top of every `.js` file in `bin/lib/`
- 2-space indent, semicolons required throughout

### Integration Points
- `bin/install.js` line ~35: `require('./lib/utils')` — add `require('./lib/prompt')` alongside
- `promptRuntime()` return value flows directly into `main()` → `install()` call loop — no type change needed (returns array of runtime strings)
- After extraction, the inline `createRL()` and `ask()` in `install.js` can be deleted (they serve only the two prompt functions)

</code_context>

<specifics>
## Specific Ideas

- Display format for numbered list: `  1. Claude Code — AI-powered dev assistant by Anthropic` (consistent 2-space indent, em dash, description)
- The "All" option should appear last: `  N+1. All platforms` with no description needed
- `log.info()` confirmation: `Installing for: Claude Code` (or comma-separated for multi-platform)
- TTY guard: single ternary in `colorize()` — `return process.stdout.isTTY && !process.env.NO_COLOR ? \`...\` : text`

</specifics>

<deferred>
## Deferred Ideas

- Arrow-key / raw-mode interactive selector — deferred, risky in cross-platform readline; numbered selector satisfies INSTALL-04
- `ask()` exported from `prompt.js` for reuse elsewhere — defer until a caller needs it
- `log.step()` progress labels throughout install — Phase 146 scope

</deferred>

---

*Phase: 145-installer-prompt-ux*
*Context gathered: 2026-04-07*
