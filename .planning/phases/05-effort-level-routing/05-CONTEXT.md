# Phase 5: Effort-Level Routing - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Simple tasks are routed to smaller/faster models while Opus is reserved for planning and complex reasoning, reducing cost and latency. The planner classifies each task's effort level at planning time, and the executor uses this to select the appropriate model when spawning agents. This phase does NOT change which model runs the skill itself — only which model runs individual tasks within plan execution.

</domain>

<decisions>
## Implementation Decisions

### Classification mechanism
- **D-01:** Planner (gsd-planner) assigns `effort: simple|standard|complex` to each task when creating PLAN.md
- **D-02:** Planner uses guidelines but can override based on context understanding
- **D-03:** Classification guidelines for planner:

| Signal | simple | standard | complex |
|--------|--------|----------|---------|
| Files modified | 1-2 | 3-4 | 5+ |
| Truths/criteria | 1 | 2-3 | 4+ |
| Dependencies | 0 | 1-2 | 3+ |
| Multi-domain | no | no | yes |

### Model mapping
- **D-04:** Three effort levels map to three models:

| Effort | Model | Example tasks |
|--------|-------|---------------|
| simple | haiku | rename variable, add import, fix typo, update config |
| standard | sonnet | new component, API endpoint, unit test suite |
| complex | opus | multi-file refactor, architecture decisions, integration |

- **D-05:** Default effort level is `standard` (sonnet) — backward compatible with existing PLAN.md files that don't have effort field

### Routing scope
- **D-06:** Effort-level routing applies to 3 skills: `write-code`, `fix-bug`, `test`
- **D-07:** Other skills keep their current static model assignment:
  - plan, new-milestone → opus (always complex reasoning)
  - scan, init, fetch-doc, update, what-next, complete-milestone → haiku (always simple)
  - conventions → haiku (simple)
- **D-08:** Routing decision happens at planning time — effort level is written into PLAN.md, executor reads it

### Executor behavior
- **D-09:** Executor reads `effort` field from task in PLAN.md and spawns agent with corresponding model
- **D-10:** If `effort` field is missing (old PLAN.md), default to `standard` (sonnet) — no breaking change
- **D-11:** Executor logs 1 line per task when spawning: "Spawning {model} agent for {task_id} ({effort})..."

### Visibility & override
- **D-12:** Effort level visible in PLAN.md task frontmatter — user sees it when reviewing plans
- **D-13:** Override by editing PLAN.md directly — change `effort: simple` to `effort: complex` before executing
- **D-14:** PLAN.md is the single source of truth for effort routing — no config file, no flag needed
- **D-15:** No global --model flag — per-task granularity only via PLAN.md

### Claude's Discretion
- Exact field name and position in task XML structure (e.g., attribute vs child element)
- How executor resolves effort→model mapping (hardcoded map vs config lookup)
- Whether to add effort guidelines to planner's workflow or as a reference file
- How fix-bug and test skills integrate effort routing (they may not use PLAN.md the same way as write-code)
- Testing strategy for verifying correct model selection

</decisions>

<specifics>
## Specific Ideas

- Phase 4's Bước 1.5 task analysis step in workflows could be extended to also handle effort routing at execution time — but decision D-08 says routing is at planning time, so Bước 1.5 is NOT the mechanism
- Current write-code already spawns subagents with `subagent_type: "general-purpose"` — the model parameter needs to be added to agent spawning
- fix-bug and test workflows may need different integration since they don't always execute from PLAN.md tasks the same way write-code does

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Skill files (model field targets)
- `commands/pd/write-code.md` — Current model: sonnet, main routing target
- `commands/pd/fix-bug.md` — Current model: sonnet, routing target
- `commands/pd/test.md` — Current model: sonnet, routing target

### Workflows (agent spawning logic)
- `workflows/write-code.md` §Bước 10 — Current parallel agent spawning with `subagent_type: "general-purpose"`
- `workflows/fix-bug.md` — Bug diagnosis and fix flow
- `workflows/test.md` — Test creation flow

### Templates (task structure)
- `templates/plan.md` — PLAN.md structure, where effort field will be added
- `templates/tasks.md` — TASKS.md structure with Files, Truths fields

### References
- `references/prioritization.md` — Existing priority/complexity signals

### Prior phase decisions
- `04-CONTEXT.md` §Loading trigger mechanism — Bước 1.5 task analysis (different from effort routing)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Skill frontmatter `model:` field — already parsed by converters and installers
- `subagent_type` parameter in Agent spawning — currently hardcoded to "general-purpose"
- `parseFrontmatter()` in utils.js — can extract effort field from PLAN.md frontmatter
- Phase 4's `classifyRefs()` pattern — similar classification approach could inspire effort classification

### Established Patterns
- PLAN.md frontmatter has `wave`, `depends_on`, `files_modified`, `autonomous` — effort fits naturally here
- Agent spawning in write-code Bước 10 already handles parallel execution
- Vietnamese instructional text convention for workflow changes

### Integration Points
- gsd-planner agent — needs guidelines for assigning effort levels
- gsd-executor agent — needs to read effort field and pass model to agent spawning
- execute-phase orchestrator — spawns executors with model parameter, currently from init config
- PLAN.md template — needs effort field added to task structure

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-effort-level-routing*
*Context gathered: 2026-03-22*
