# Phase 28: Agent Infrastructure & Resource Rules - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 28-agent-infrastructure-resource-rules
**Areas discussed:** Vi tri agent files, Module resource-config, Heavy Lock tracking, Converter pipeline

---

## Vi tri Agent Files

| Option | Description | Selected |
|--------|-------------|----------|
| `.claude/agents/` (native) | Claude Code tu dong load, spawn bang ten | ✓ |
| `commands/pd/agents/` (custom) | Giu vi tri hien tai, spawn bang prompt | |
| Ca hai (dual) | Native cho CC, custom cho cross-platform | ✓ (giu reference) |

**User's choice:** Tat ca 4 areas — user noi "tu tim giai phap tot nhat, chay auto"
**Notes:** Research HIGH confidence rang Claude Code chi load tu `.claude/agents/`. Giu ban cu lam reference.

---

## Module resource-config.js

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal (tier→model only) | Chi mapping function | |
| Full scope | Mapping + parallel + degradation | ✓ |
| Config-driven | Doc tu config.json | |

**User's choice:** Auto-selected full scope
**Notes:** Nhat quan voi pure function pattern. 4 exports du cho v2.1.

---

## Heavy Lock Tracking

| Option | Description | Selected |
|--------|-------------|----------|
| SESSION file field | Ghi vao SESSION markdown | |
| Lock file rieng | `.planning/debug/LOCK` | |
| Workflow logic | Orchestrator biet vi no spawn | ✓ |

**User's choice:** Auto-selected workflow logic
**Notes:** Don gian nhat, khong can file I/O them. Orchestrator la nguoi duy nhat spawn.

---

## Converter Pipeline

| Option | Description | Selected |
|--------|-------------|----------|
| Update now | Them agent converter | |
| Defer to Phase 32-33 | Agent files native, khong can converter | ✓ |
| Hybrid | Converter cho workflow, khong cho agents | ✓ |

**User's choice:** Auto-selected defer
**Notes:** `.claude/agents/` la Claude Code native — converter pipeline chi xu ly skills/workflows.

---

## Claude's Discretion

- maxTurns toi uu cho tung agent
- Error message format khi degradation
- Test structure cho resource-config.js

## Deferred Ideas

- Converter pipeline update — Phase 32-33
- Agent memory (memory: project) — v2.2
- Auto-detect RAM/CPU — v2.2
