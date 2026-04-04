---
phase: 92
name: ONBOARD-01 — Onboarding Skill Foundation
requirement: ONBOARD-01
milestone: v11.0
status: discuss-complete
---

# Phase 92 Context: ONBOARD-01 — Onboarding Skill Foundation

> **Status:** Discuss complete — ready for research/planning  
> **Decision Mode:** Auto (all choices logged inline)

---

## Phase Summary

Enhance existing `pd:onboard` skill (created in Phase 78) with:
1. **State machine integration** — define prerequisites and transitions
2. **Error handling** — wire to structured logging infrastructure (LOG-01)
3. **what-next integration** — suggest onboard for new projects
4. **Verification** — ensure skill works end-to-end with new infrastructure

---

## Background

The `pd:onboard` skill was created in **Phase 78 (v8.0)** with these deliverables:
- `commands/pd/onboard.md` — skill definition (Sonnet tier)
- `workflows/onboard.md` — 6-step orchestration workflow
- Auto-runs `init` → git analysis → `scan` → planning files creation

Now in **v11.0**, we need to integrate this skill with the new infrastructure:
- **Phase 88-89 (LOG-01):** Structured JSONL error logging
- **Phase 90-91 (STATUS-01):** Status dashboard with state machine

---

## Gray Areas Decided

### 1. State Machine Integration
**Decision:** Add `pd:onboard` to state machine with no prerequisites

**Rationale:**
- Onboard is the *entry point* for new projects — it cannot have prerequisites
- After onboard completes, state becomes "Ready to plan" (same as current init)
- Follows same pattern as `pd:status` (no prerequisites, read-only)

**State Transition:**
```
(any) → pd:onboard → planning-ready
```

### 2. Error Handling Enhancement
**Decision:** Wire `pd:onboard` to structured logging using existing error handlers

**Rationale:**
- Phase 89 created `basic-error-handler.js` and `enhanced-error-handler.js`
- Onboard is a Sonnet-tier skill — use enhanced error handler
- Error logs written to `.planning/logs/agent-errors.jsonl`

**Implementation:**
- Import error handler in skill file
- Wrap workflow execution with error logging
- Follow pattern from Phase 89 gap closure

### 3. what-next Integration
**Decision:** Suggest `pd:onboard` when no `.planning/` directory exists

**Rationale:**
- Currently what-next suggests `pd:init` for new projects
- With `pd:onboard` available, this is the better recommendation
- Onboard does init + scan + PROJECT.md in one command

**Detection Logic:**
- If `.planning/` missing → suggest `pd:onboard`
- If `.planning/` exists but PROJECT.md missing → suggest `pd:init` or `pd:onboard`

### 4. Scope Boundaries
**In Scope:**
- State machine entry for `pd:onboard`
- Error handler wiring
- what-next.md update
- Smoke tests verification

**Out of Scope:**
- Changing onboard workflow steps (already complete)
- New features for onboard (deferred to backlog if needed)
- Refactoring init/scan workflows (not needed)

---

## Prior Decisions Applied

From **Phase 78:**
- Onboard uses Sonnet tier (complex git analysis + multi-step)
- No user prompts — fully automated
- FastCode guard is soft check (warn + continue)

From **Phase 89:**
- All skills must import error handlers for structured logging
- Error logs: timestamp, level, phase, step, agent, error, context

From **Phase 91:**
- `pd:status` has no prerequisites — onboard follows same pattern

---

## Deferred Ideas

None — Phase 92 is focused on integration only.

---

## Research Gaps

1. **State machine format** — Verify current state machine location and format
2. **what-next.md structure** — Confirm how to add onboard detection
3. **Error handler pattern** — Review exact import pattern from Phase 89

---

## Success Criteria

Per ROADMAP.md:

1. ✅ `skills/pd/onboard.md` skill file exists (from Phase 78)
2. ✅ Calls `init` workflow internally (already done)
3. ✅ Calls `scan` workflow internally (already done)
4. ✅ Generates PROJECT.md baseline (already done)
5. 🔄 **NEW:** State machine updated with onboard prerequisites
6. 🔄 **NEW:** Error handler wired for structured logging
7. 🔄 **NEW:** what-next suggests onboard for new projects

---

## Next Steps

1. **Research:** Verify state machine location, what-next.md format, error handler pattern
2. **Plan:** Create PLAN.md with tasks for integration work
3. **Execute:** Update state machine, wire error handlers, update what-next.md
4. **Verify:** Run smoke tests, verify end-to-end flow

---

## Auto-Selected Choices Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State prerequisites | None | Onboard is entry point, cannot block itself |
| Error handler tier | Enhanced | Sonnet skill, complex orchestration |
| what-next trigger | No `.planning/` dir | Clear signal of new project |
| Scope | Integration only | Core onboard already built in Phase 78 |

---

## References

- Phase 78: `.planning/phases/78-pd-onboard-skill/`
- `commands/pd/onboard.md` — existing skill file
- `workflows/onboard.md` — existing workflow file
- Phase 89: Error handler wiring pattern
- Phase 91: State machine integration pattern (from `pd:status`)
