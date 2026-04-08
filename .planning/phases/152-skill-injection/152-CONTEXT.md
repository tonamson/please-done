# Phase 152 Context — Skill Injection

> Created: 2026-04-08
> Phase: 152 — Skill Injection
> Requirements: CONV-03, CONV-04, CONV-05

## Domain
Inject CONVENTIONS.md reading into the 3 code-writing skill command files so any AI model follows project conventions before writing/fixing/planning code.

## Decisions

### D1: Injection form — BOTH
Add BOTH approaches to each skill:
1. `@CONVENTIONS.md (optional)` — adds it to execution_context alongside existing `@references/` entries (for models that follow @ syntax)
2. A text instruction in execution_context — e.g. "If `CONVENTIONS.md` exists at project root, read it before writing any code" (for all models)

### D2: Injection location — command files only
Inject into `commands/pd/write-code.md`, `commands/pd/fix-bug.md`, `commands/pd/plan.md` only.
Do NOT modify workflow files (`workflows/write-code.md`, etc.).
Rationale: command files are the model-agnostic entry points every model reads first.

### D3: Text instruction placement — inside execution_context block
The text instruction goes inside the `<execution_context>` block, directly below the `@CONVENTIONS.md (optional)` line.
Example format:
```
@CONVENTIONS.md (optional)
<!-- If CONVENTIONS.md exists at project root, read it before writing code -->
```
Or as a separate rule-style line within execution_context.

## Files to Modify
- `commands/pd/write-code.md` — add to execution_context (after existing @references block)
- `commands/pd/fix-bug.md` — add to execution_context (after existing @references block)
- `commands/pd/plan.md` — add to execution_context (after existing @references block)

## Out of Scope
- Workflow files (workflows/*.md) — NOT to be modified
- Other skill files (execute-phase, discuss-phase, etc.) — NOT in scope
- CLAUDE.vi.md — NOT in scope (Phase 151 decision carried forward)

## Canonical Refs
- .planning/REQUIREMENTS.md (CONV-03, CONV-04, CONV-05)
- .planning/phases/151-convention-file-migration/151-01-SUMMARY.md (prior phase context)
- commands/pd/write-code.md
- commands/pd/fix-bug.md
- commands/pd/plan.md
