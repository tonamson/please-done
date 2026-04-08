# Phase 151 Context: Convention File Migration

> Phase: 151
> Name: Convention File Migration
> Created: 2026-04-08
> Status: Ready for planning

---

## Phase Goal

Replace the Claude-specific `CLAUDE.md` conventions output with a universal `CONVENTIONS.md`
that any AI model can read when instructed by skill prompts.

---

## Decisions

### 1. Target file name
**Decision:** `CONVENTIONS.md` (at project root)
**Rationale:** Simple, universally understood, no model-specific naming

### 2. Backward compatibility
**Decision:** No backward compatibility needed
**Rationale:** `pd:conventions` will simply write to `CONVENTIONS.md` going forward.
Users with existing `CLAUDE.md` are not automatically migrated — they can delete it manually.
The skill will not check for or offer to migrate existing `CLAUDE.md`.

### 3. This repo's CLAUDE.md
**Decision:** Delete `CLAUDE.md` from this repo
**Rationale:** The file contains GSD workflow docs injected as custom instructions — it is
Claude-specific and the project aims to be model-agnostic. Remove it entirely.

---

## Files to Change

### commands/pd/conventions.md (skill file)
- `description:` → change "create CLAUDE.md" → "create CONVENTIONS.md"
- `<output>` section → change `CLAUDE.md` → `CONVENTIONS.md`
- `<rules>` section → change `CLAUDE.md` → `CONVENTIONS.md` (2 occurrences)

### workflows/conventions.md (workflow logic)
- Step 1: Change check from `CLAUDE.md` → `CONVENTIONS.md`
  - "CLAUDE.md at root" → "CONVENTIONS.md at root"
  - "(1) Supplement... (2) Recreate" options remain the same
- Step 5: Change output filename `CLAUDE.md` → `CONVENTIONS.md`
  - "Create/Update CONVENTIONS.md" in the markdown template header

### CLAUDE.md (repo root)
- **Delete** — this file is Claude-specific and not needed in a cross-model framework

---

## Canonical Refs

- `commands/pd/conventions.md` — skill file (description, output, rules)
- `workflows/conventions.md` — workflow logic (Step 1: check existing, Step 5: create file)
- `CLAUDE.md` — file to delete from repo root

---

## Out of Scope

- Migrating existing user CLAUDE.md files (no backward compat)
- Updating any other skill that might reference CLAUDE.md (that's Phase 152 scope or separate)
- Changes to pd:write-code, pd:fix-bug, pd:plan injection (those are Phase 152)
