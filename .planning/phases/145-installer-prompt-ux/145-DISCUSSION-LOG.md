# Phase 145: Installer Prompt UX - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-07
**Phase:** 145-installer-prompt-ux
**Mode:** --auto (all decisions selected by agent using recommended defaults)
**Areas discussed:** TTY Guard, Prompt Extraction, Platform Descriptions, Non-TTY Behavior, Confirmation After Selection

---

## TTY Guard

| Option | Description | Selected |
|--------|-------------|----------|
| Guard in `colorize()` | Single fix point — all log callers inherit | ✓ |
| Guard per-log-function | 5 changes instead of 1 | |
| Honor `NO_COLOR` env var | POSIX standard alongside TTY check | ✓ |

**Agent's choice:** Guard in `colorize()` with `process.stdout.isTTY && !process.env.NO_COLOR`
**Notes:** Single point of change, zero per-caller updates. Must be done FIRST before any new colored output is added.

---

## Prompt Extraction

| Option | Description | Selected |
|--------|-------------|----------|
| Extract to `bin/lib/prompt.js` | New focused module, clean separation | ✓ |
| Keep inline in `install.js` | No refactor risk, but file stays large | |
| Extract to `bin/lib/utils.js` | Too general-purpose for prompts | |

**Agent's choice:** Extract `promptRuntime()` + `promptLocation()` to `bin/lib/prompt.js`
**Notes:** `createRL()` and `ask()` helpers move too (private). Single `require('./lib/prompt')` replaces both inline definitions.

---

## Platform Descriptions

| Option | Description | Selected |
|--------|-------------|----------|
| Add `description` to `platforms.js` | Source of truth for descriptions | ✓ |
| Hardcode in `prompt.js` | Duplication, harder to maintain | |
| Skip descriptions (names only) | Does not satisfy INSTALL-04 requirement | |

**Agent's choice:** Add `description` field to `PLATFORMS` in `bin/lib/platforms.js`
**Notes:** Format: `  N. Platform Name — Description` with em dash. "All" option at end without description.

---

## Non-TTY Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Silent default (current) | No output — CI unfriendly | |
| Print notice + default to all platforms | Transparent, CI-safe | ✓ |
| Exit with error in non-TTY | Breaks piped installs | |

**Agent's choice:** Print `"Non-interactive mode: installing for all platforms"` and return `getAllRuntimes()`
**Notes:** `log.info()` for notice (no color, works in CI). Location defaults to global with a similar notice.

---

## Confirmation After Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Print selected platform before install | Transparent, satisfies INSTALL-04 SC | ✓ |
| No confirmation (silent continue) | User sees no feedback | |
| Re-prompt to confirm | Over-engineered for a simple selector | |

**Agent's choice:** `log.info(\`Installing for: \${platformNames.join(', ')}\`)` in `main()` after `promptRuntime()` returns
**Notes:** Single `log.info()` line, no re-prompting.

---

## the agent's Discretion

- Exact wording of non-TTY messages (D-13, D-14)
- Whether `ask()` helper is exported from `prompt.js`

## Deferred Ideas

- Arrow-key / raw-mode interactive selector
- `ask()` exported for external reuse
- `log.step()` progress labels (Phase 146)
