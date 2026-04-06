# Phase 131: Universal Runtime Support (H-07) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-06
**Phase:** 131-universal-runtime-support-h-07
**Areas discussed:** AGENTS.md Structure, Sync Script Design, Runtime Detection, Installation Integration

---

## Area: AGENTS.md Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Central markdown | Single AGENTS.md file with all runtime sections | ✓ |
| Per-runtime files | Separate file per runtime in agents/ directory | |
| JSON configuration | JSON-based configuration with templates | |

**User's choice:** Central markdown — AGENTS.md as source of truth
**Notes:** [auto] Selected recommended default for simplicity and maintainability.

---

## Area: Sync Script Design

| Option | Description | Selected |
|--------|-------------|----------|
| Central-to-platforms | Read AGENTS.md, generate platform-specific files | ✓ |
| Platform-to-central | Collect from each runtime, merge to AGENTS.md | |
| Bidirectional | Two-way sync with conflict resolution | |

**User's choice:** Central-to-platforms — AGENTS.md is source of truth
**Notes:** [auto] Selected recommended default for clear ownership model.

---

## Area: Runtime Detection

| Option | Description | Selected |
|--------|-------------|----------|
| Directory existence | Check ~/.runtime/commands/ for each runtime | ✓ |
| Registry file | Check for platform-specific registry in project | |
| CLI detection | Run each runtime's CLI with version flag | |

**User's choice:** Directory existence — simple and reliable
**Notes:** [auto] Selected recommended default for minimal overhead.

---

## Area: Installation Integration

| Option | Description | Selected |
|--------|-------------|----------|
| Post-install + installer hook | Sync in both bin/install.js and package.json postinstall | ✓ |
| Installer only | Sync only during bin/install.js run | |
| Manual only | Require users to run sync manually | |

**User's choice:** Post-install + installer hook — automatic sync on install
**Notes:** [auto] Selected recommended default for seamless user experience.

---

## Claude's Discretion

The following areas were delegated to Claude's judgment during implementation:
- Exact file structure within AGENTS.md (section organization)
- Sync mechanism details (push vs pull, file-per-runtime vs centralized)
- Conflict resolution if runtime-specific overrides exist

## Deferred Ideas

None — discussion stayed within phase scope.