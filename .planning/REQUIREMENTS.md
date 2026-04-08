# Requirements: v12.4 Convention-Aware Skill Execution

> Milestone: v12.4
> Status: Active
> Created: 2026-04-08

## Context

The `pd` framework is designed for any AI model (Claude, Kimi, GLM, Gemini, etc.).
Currently `pd:conventions` generates `CLAUDE.md` — a Claude-specific file that only
Claude Code auto-reads. Other models never see project conventions unless explicitly
told to read them.

**Goal:** Replace `CLAUDE.md` with a universal `CONVENTIONS.md` and inject it
explicitly into code-writing skill prompts so all models follow project conventions.

---

## Active Requirements

### Convention File

- [ ] **CONV-01**: `pd:conventions` creates/updates `CONVENTIONS.md` instead of `CLAUDE.md`
  - File lives at project root: `CONVENTIONS.md`
  - Same content as current CLAUDE.md output (naming, style, patterns)
  - Works with any AI model — no model-specific auto-read needed

- [ ] **CONV-02**: `CLAUDE.md` is removed from the project or replaced by `CONVENTIONS.md`
  - The project should not have a Claude-specific conventions file

### Skill Injection

- [ ] **CONV-03**: `pd:write-code` reads `CONVENTIONS.md` (if exists) in execution_context
  - Explicit instruction: "Read `CONVENTIONS.md` if it exists before writing code"
  - Any model reading the skill prompt will follow this instruction

- [ ] **CONV-04**: `pd:fix-bug` reads `CONVENTIONS.md` (if exists) in execution_context
  - Same pattern as CONV-03

- [ ] **CONV-05**: `pd:plan` reads `CONVENTIONS.md` (if exists) in execution_context
  - Planner should be aware of conventions when structuring tasks

---

## Out of Scope

- Syncing to IDE-specific files (.cursorrules, .windsurfrules, GEMINI.md) — deferred
- Auto-detection of which model is running — not needed with explicit injection
- Modifying GSD framework skills (gsd-executor etc.) — separate concern

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| CONV-01 | TBD | Pending |
| CONV-02 | TBD | Pending |
| CONV-03 | TBD | Pending |
| CONV-04 | TBD | Pending |
| CONV-05 | TBD | Pending |
