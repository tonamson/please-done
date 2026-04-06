---
phase: 137-workflow-command-merge
verified: 2026-04-06T14:15:00Z
status: passed
score: 4/4 must-haves verified
gaps: []
human_verification:
  - test: "Run /pd:what-next without flags and verify it shows progress + suggested command without executing anything"
    expected: "Advisory report displayed, no commands invoked, READ ONLY behavior preserved"
    why_human: "Requires running the agent runtime and observing command behavior — cannot verify programmatic execution path from static analysis"
  - test: "Run /pd:what-next --execute and verify it auto-invokes the suggested command"
    expected: "Progress report displayed, then SlashCommand fires with the correct suggested command"
    why_human: "SlashCommand invocation is a runtime behavior — static analysis confirms the wiring exists but cannot verify execution flow"
---

# Phase 137: Workflow Command Merge Verification Report

**Phase Goal:** Users get a unified next-action command that can show suggestions or auto-execute the appropriate workflow step
**Verified:** 2026-04-06T14:15:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Running `pd:what-next` (no flags) shows current project state and suggested next action without executing | ✓ VERIFIED | `commands/pd/what-next.md` lines 27-29: context documents advisory-only mode; `workflows/what-next.md` lines 160-164: rules enforce "Without --execute flag: READ ONLY — no file modifications, no command execution". Advisory path flows Step 1→2→3→4→5→6 with no SlashCommand invocation. |
| 2 | Running `pd:what-next --execute` auto-detects state and runs the recommended command | ✓ VERIFIED | `commands/pd/what-next.md` line 11: `SlashCommand` in allowed-tools; `workflows/what-next.md` lines 96-110: Step 4.5 execute branch extracts SUGGESTION from Step 4, displays report (Step 5) FIRST, then invokes via SlashCommand. All 4 test snapshots include Step 4.5 with identical logic. |
| 3 | Advisory mode (default) preserves all existing behavior — shows suggestion, waits for user | ✓ VERIFIED | `commands/pd/what-next.md` lines 66-67: "Without --execute: READ ONLY. DO NOT edit any files". `workflows/what-next.md` lines 108-110: "If `$ARGUMENTS` does NOT contain `--execute`: Skip this step entirely. Continue to Step 5 and Step 6 as normal." No behavioral changes to existing Steps 1-6. |
| 4 | All pd:next behavior is fully subsumed — no functionality lost | ✓ VERIFIED | `commands/pd/next.md` does not exist (file removed). `AGENTS.md` line 42: `pd:what-next` row with `[--execute]` syntax. Zero references to `pd:next` in commands/, workflows/, docs/skills/, test/snapshots/, or AGENTS.md. The --execute flag provides the auto-advance behavior that was pd:next's purpose. |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `commands/pd/what-next.md` | Command definition with --execute flag | ✓ VERIFIED | 82 lines. Contains: `argument-hint: "[--execute]"` (line 5), `SlashCommand` in allowed-tools (line 11), --execute context (line 29), --execute process (lines 41-43), --execute output (lines 49-50), --execute rules (lines 66-67). 9 occurrences of `--execute`. |
| `workflows/what-next.md` | Workflow with state detection + auto-execute branch | ✓ VERIFIED | 171 lines. Contains: Step 4.5 execute branch (lines 96-110) with SlashCommand invocation, conditional rules for --execute (lines 163-164). 6 occurrences of `--execute`. |
| `docs/skills/what-next.md` | Updated skill documentation | ✓ VERIFIED | 64 lines. Contains: Purpose with --execute (line 5), Auto-advance scenario (line 15), Auto-Execute Mode section (lines 39-50), --execute in flags table (line 56). 3 occurrences of `--execute`. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `commands/pd/what-next.md` | `workflows/what-next.md` | execution_context reference | ✓ WIRED | Line 33: `@workflows/what-next.md (required)` |
| `workflows/what-next.md` | pd commands | SlashCommand invocation when --execute | ✓ WIRED | Lines 102-106: Step 4.5 extracts suggestion, invokes via `SlashCommand(command)`. Suggestion table (lines 75-89) maps to concrete /pd:* commands. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `workflows/what-next.md` Step 4 | SUGGESTION | Priority table (lines 75-89) mapping conditions to commands | ✓ FLOWING | Priority table has 12 concrete condition→command mappings, each referencing real /pd:* commands |
| `workflows/what-next.md` Step 4.5 | SUGGESTION | Taken from Step 4 output | ✓ FLOWING | Line 101: "Take the `SUGGESTION` determined in Step 4" — flows directly into SlashCommand(command) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Step 4.5 exists in all 5 files (workflow + 4 snapshots) | `grep -c "Step 4.5" workflows/what-next.md test/snapshots/*/what-next.md` | 5 matches | ✓ PASS |
| SlashCommand in all 5 files | `grep -c "SlashCommand" commands/pd/what-next.md test/snapshots/*/what-next.md` | 3+ per file | ✓ PASS |
| pd:next removed from command files and AGENTS.md | `grep -rn "pd:next" commands/ workflows/ docs/skills/ AGENTS.md test/snapshots/` | 0 results | ✓ PASS |
| Step 7b: SKIPPED (no runnable entry points) — this phase modifies markdown skill definitions, not executable code | - | - | ? SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| L-02 | 137-01-PLAN | Merge pd:next into pd:what-next: auto-execute logic, state detection, advisory mode preservation, --execute flag | ✓ SATISFIED | All 4 sub-items verified: (1) --execute flag in command/workflow, (2) state detection via Steps 1-4 preserved, (3) advisory mode READ ONLY rules, (4) pd:next fully removed with behavior subsumed |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | - | - | - | No anti-patterns detected. All files clean of TODO/FIXME/placeholder/stub patterns. |

### Human Verification Required

### 1. Advisory Mode Behavioral Test

**Test:** Run `/pd:what-next` without any flags in a project with active planning state
**Expected:** Progress report displayed showing current milestone, phase status, and a suggested command. No commands are executed. Output is READ ONLY.
**Why human:** Requires running the agent runtime and observing command behavior — static analysis confirms the rules are present but cannot verify the runtime execution path.

### 2. Auto-Execute Mode Behavioral Test

**Test:** Run `/pd:what-next --execute` in a project with active planning state
**Expected:** Progress report displayed first (transparency), then the suggested command is automatically invoked via SlashCommand. No confirmation prompt — the flag IS the confirmation.
**Why human:** SlashCommand invocation is a runtime behavior. Static analysis confirms wiring (Step 4.5 exists, SlashCommand in allowed-tools), but the actual invocation chain can only be verified at runtime.

### 3. Backward Compatibility Test

**Test:** Compare output of `/pd:what-next` before and after Phase 137 changes in a known project state
**Expected:** Identical advisory output — same steps executed, same suggestion logic, same report format.
**Why human:** Requires side-by-side runtime comparison to confirm no behavioral regressions in advisory mode.

### Gaps Summary

No gaps found. All 4 observable truths verified through static analysis:

1. **Advisory mode preserved:** Rules and conditional branches explicitly guard READ ONLY behavior when no `--execute` flag is present.
2. **Auto-execute wired:** Step 4.5 in workflow + all 4 snapshots implement the SlashCommand invocation path with proper sequencing (report first, then execute).
3. **Command properly configured:** `allowed-tools` includes SlashCommand, `argument-hint` documents the flag, context/rules sections cover both modes.
4. **pd:next fully removed:** Command file deleted, AGENTS.md row removed, zero references in command/workflow/doc/snapshot files.

All 9 files modified as documented in SUMMARY.md. Both task commits (6d67c31, 152f792) referenced. No anti-patterns detected.

---

_Verified: 2026-04-06T14:15:00Z_
_Verifier: the agent (gsd-verifier)_
