# Phase 137: Workflow Command Merge — Research

**Phase:** 137
**Researcher:** planner (inline)
**Date:** 2026-04-06

---

## Domain Analysis

### Current State

**`pd:what-next`** (commands/pd/what-next.md + workflows/what-next.md):
- READ-ONLY command that scans `.planning/` and suggests the next action
- Shows a progress dashboard with milestone/phase/task status
- Uses priority-based suggestion table (Priority 1-9) to recommend commands
- Does NOT execute anything — purely advisory
- Arguments: none (future: `--text` for plain output)
- Model: haiku (lightweight, read-only)

**`gsd-next`** (upstream GSD skill — NOT in this project):
- Auto-detects project state and immediately invokes the next GSD workflow step
- Uses 8 routing rules: no phases → discuss, no context → discuss, no plans → plan, etc.
- Invokes commands immediately without confirmation
- Reads STATE.md, ROADMAP.md, and phase directories

**`pd:next`** (listed in AGENTS.md but does NOT exist as a file):
- AGENTS.md references `/pd:next` as "Advance to next step"
- No command file, workflow file, or skill file exists
- This is the command being "merged" — its intended behavior is auto-execute

### What Needs to Happen

Merge the auto-execute behavior into `pd:what-next` via a `--execute` flag:
1. **Default (no flag)**: Existing advisory behavior preserved exactly as-is
2. **With `--execute`**: Auto-detect state and run the appropriate next command

### Technical Approach

The GSD upstream's `gsd-next` routing logic maps well to the existing `pd:what-next` priority table. The key difference:

| Aspect | gsd-next | pd:what-next (current) |
|--------|----------|----------------------|
| State detection | 8 route rules based on phase dir artifacts | 9-priority table based on task/bug status |
| Execution | Immediately invokes command | Only displays suggestion |
| Scope | GSD workflow only (discuss/plan/execute/verify/complete) | Broader (write-code, fix-bug, test, plan, etc.) |

**Design:** The existing priority table in `pd:what-next` already determines the correct next action. With `--execute`, instead of just displaying the suggestion, the command also invokes it. This is simpler than importing gsd-next's routing — the logic already exists.

### Files to Modify

| File | Change Type | Complexity |
|------|-------------|------------|
| `commands/pd/what-next.md` | Add `--execute` flag, update model, add tools | Low |
| `workflows/what-next.md` | Add execution branch after Step 4 | Medium |
| `docs/skills/what-next.md` | Add `--execute` documentation | Low |
| `docs/skills/what-next.vi.md` | Update Vietnamese docs | Low |
| `test/snapshots/opencode/what-next.md` | Update snapshot | Low |
| `test/snapshots/gemini/what-next.md` | Update snapshot | Low |
| `test/snapshots/copilot/what-next.md` | Update snapshot | Low |
| `test/snapshots/codex/what-next.md` | Update snapshot | Low |
| `AGENTS.md` | Remove `pd:next` row, update `pd:what-next` description | Low |

### Key Design Decisions

1. **Keep haiku model** for advisory mode — the read-only scan is lightweight
2. **Execution uses SlashCommand** — the `--execute` flag triggers command invocation
3. **State detection stays in workflow** — no new library needed, the workflow already has the logic
4. **Priority table unchanged** — same routing rules, just add execution on top

### Common Pitfalls

- Don't break existing advisory behavior — `--execute` is additive
- Don't import GSD-specific paths (`~/.claude/get-shit-done/`) — this project uses its own `commands/pd/` structure
- Ensure test snapshots reflect the new `--execute` flag in argument-hint and process sections

---

## Validation Architecture

No validation strategy needed — this is a command/workflow change, not a data model or API.
