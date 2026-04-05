# Phase 5: Effort-Level Routing - Research

**Researched:** 2026-03-22
**Domain:** Model routing / task classification / Claude Code subagent configuration
**Confidence:** HIGH

## Summary

Phase 5 implements effort-level routing: the planner assigns an `effort` field (`simple|standard|complex`) to each task in PLAN.md, and the executor reads that field to spawn subagents with the appropriate model (haiku/sonnet/opus). This phase modifies markdown-based workflow files and templates -- no new JavaScript modules or library dependencies are needed.

The project is a cross-platform AI coding skills framework where skill files (`.md` with YAML frontmatter) define commands, workflows define step-by-step processes, and templates define output structures. The three skills targeted for routing (`write-code`, `fix-bug`, `test`) all currently have `model: sonnet` in frontmatter. The routing mechanism operates at the PLAN.md task level, not at the skill level -- the `model:` frontmatter field in skill files is irrelevant to this phase. Instead, the workflow instructions that spawn subagents (write-code Buoc 10 parallel mode) and that select tasks (Buoc 1) need to be updated to read the `effort` field and pass the corresponding model to the Agent tool.

Claude Code's Agent tool (formerly Task tool) supports a `model` parameter that accepts values like `haiku`, `sonnet`, `opus`, or full model IDs. This is the mechanism that enables per-task model routing without any changes to the installer or converter infrastructure.

**Primary recommendation:** Add `effort` field to PLAN.md task template, add effort classification guidelines to the plan workflow, and update write-code/fix-bug/test workflows to read the effort field and pass the corresponding model when spawning agents or selecting execution behavior.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Planner (gsd-planner) assigns `effort: simple|standard|complex` to each task when creating PLAN.md
- **D-02:** Planner uses guidelines but can override based on context understanding
- **D-03:** Classification guidelines for planner:

| Signal | simple | standard | complex |
|--------|--------|----------|---------|
| Files modified | 1-2 | 3-4 | 5+ |
| Truths/criteria | 1 | 2-3 | 4+ |
| Dependencies | 0 | 1-2 | 3+ |
| Multi-domain | no | no | yes |

- **D-04:** Three effort levels map to three models:

| Effort | Model | Example tasks |
|--------|-------|---------------|
| simple | haiku | rename variable, add import, fix typo, update config |
| standard | sonnet | new component, API endpoint, unit test suite |
| complex | opus | multi-file refactor, architecture decisions, integration |

- **D-05:** Default effort level is `standard` (sonnet) -- backward compatible with existing PLAN.md files that don't have effort field
- **D-06:** Effort-level routing applies to 3 skills: `write-code`, `fix-bug`, `test`
- **D-07:** Other skills keep their current static model assignment:
  - plan, new-milestone -> opus (always complex reasoning)
  - scan, init, fetch-doc, update, what-next, conventions -> haiku (always simple)
- **D-08:** Routing decision happens at planning time -- effort level is written into PLAN.md, executor reads it
- **D-09:** Executor reads `effort` field from task in PLAN.md and spawns agent with corresponding model
- **D-10:** If `effort` field is missing (old PLAN.md), default to `standard` (sonnet) -- no breaking change
- **D-11:** Executor logs 1 line per task when spawning: "Spawning {model} agent for {task_id} ({effort})..."
- **D-12:** Effort level visible in PLAN.md task frontmatter -- user sees it when reviewing plans
- **D-13:** Override by editing PLAN.md directly -- change `effort: simple` to `effort: complex` before executing
- **D-14:** PLAN.md is the single source of truth for effort routing -- no config file, no flag needed
- **D-15:** No global --model flag -- per-task granularity only via PLAN.md

### Claude's Discretion
- Exact field name and position in task XML structure (e.g., attribute vs child element)
- How executor resolves effort->model mapping (hardcoded map vs config lookup)
- Whether to add effort guidelines to planner's workflow or as a reference file
- How fix-bug and test skills integrate effort routing (they may not use PLAN.md the same way as write-code)
- Testing strategy for verifying correct model selection

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TOKN-04 | Effort-level routing -- use smaller models for simple tasks, Opus only for planning/complex | Effort field in PLAN.md + Agent tool `model` parameter enables per-task model routing. Classification guidelines (D-03) and model mapping (D-04) define the routing rules. |
</phase_requirements>

## Standard Stack

### Core
| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| PLAN.md template | N/A | Task metadata structure where `effort` field is added | Single source of truth for task configuration (D-14) |
| TASKS.md template | N/A | Task list with effort field visible in summary table | User visibility for effort assignments (D-12) |
| plan.md workflow | N/A | Planner workflow where effort classification guidelines are added | Planner is the classification authority (D-01) |
| write-code.md workflow | N/A | Primary executor workflow, Buoc 10 parallel spawning | Main routing target -- Agent tool with model param |
| fix-bug.md workflow | N/A | Bug diagnosis workflow | Secondary routing target |
| test.md workflow | N/A | Test creation workflow | Secondary routing target |

### Supporting
| Component | Version | Purpose | When to Use |
|-----------|---------|---------|-------------|
| Claude Code Agent tool | Current | Subagent spawning with `model` parameter | When spawning per-task agents with effort-based model |
| references/conventions.md | N/A | Shared conventions -- effort level enum documentation | Reference for valid effort values |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| PLAN.md effort field | Config file mapping | PLAN.md is simpler, user-visible, editable -- config adds complexity |
| Planning-time classification | Runtime classification in Buoc 1.5 | D-08 locks planning-time; runtime would need task analysis overhead |
| Hardcoded effort->model map | External config lookup | Hardcoded is simpler for 3 values; config adds unnecessary indirection |

**Installation:** No new dependencies. All changes are to markdown workflow/template files.

## Architecture Patterns

### Recommended Change Structure
```
templates/
  plan.md         # Add effort field to task template frontmatter
  tasks.md        # Add Effort column to summary table template
workflows/
  plan.md         # Add effort classification guidelines (Buoc 5)
  write-code.md   # Read effort field, pass model to Agent tool (Buoc 1, 10)
  fix-bug.md      # Read effort field for model selection
  test.md         # Read effort field for model selection
references/
  conventions.md  # Document effort level enum
```

### Pattern 1: Effort Field in PLAN.md Task Structure
**What:** Each task in PLAN.md includes an `effort` field in its frontmatter/header
**When to use:** Every task created by the planner
**Current task structure in TASKS.md:**
```markdown
## Task 1: [Ten]
> Trang thai: ⬜ | Uu tien: Cao | Phu thuoc: Khong | Loai: Backend
> Files: [danh sach files du kien]
> Truths: [T1, T2]
```
**Proposed task structure:**
```markdown
## Task 1: [Ten]
> Trang thai: ⬜ | Uu tien: Cao | Phu thuoc: Khong | Loai: Backend | Effort: standard
> Files: [danh sach files du kien]
> Truths: [T1, T2]
```
**Rationale:** Adding `Effort:` to the existing metadata line keeps it visible without changing the structure. The planner writes it; the executor reads it. User can edit PLAN.md to override.

### Pattern 2: Effort Classification in Planner Workflow
**What:** Guidelines table added to plan.md workflow Buoc 5 (task splitting step)
**When to use:** Every planning session
**Implementation:** Add classification heuristic table directly to Buoc 5 instructions, alongside existing task-splitting rules. The planner uses these signals but can override based on understanding.
**Rationale:** Keeping guidelines in the workflow (not a separate reference file) reduces context loading overhead -- the planner already reads this workflow.

### Pattern 3: Model Resolution in Executor Workflows
**What:** Effort-to-model mapping as a simple inline lookup
**When to use:** When spawning agents for task execution
**Implementation:**
```
Effort -> Model:
| simple   | haiku  |
| standard | sonnet |
| complex  | opus   |
| (missing)| sonnet | (backward compatibility, D-10)
```
**Rationale:** 3-value mapping is too simple for an external config. Hardcode in workflow instructions.

### Pattern 4: Agent Tool Model Parameter
**What:** Claude Code's Agent tool accepts a `model` parameter
**When to use:** When spawning subagents in --parallel mode (Buoc 10) and potentially in single-task mode
**Source:** Official Claude Code docs at code.claude.com/docs/en/sub-agents
**Key detail:** The Agent tool (formerly Task tool) supports `model` parameter with values: `haiku`, `sonnet`, `opus`, full model IDs, or `inherit`. Default is `inherit`.
**Example from docs:**
```json
{
  "model": "sonnet",
  "description": "Expert code reviewer"
}
```

### Anti-Patterns to Avoid
- **Runtime classification at Buoc 1.5:** D-08 explicitly says routing is at planning time. Do NOT add effort classification to the task-analysis step from Phase 4.
- **Changing skill frontmatter `model:` field:** The `model:` field in commands/pd/*.md is for the skill-level default model. Effort routing is per-task within a skill invocation, not per-skill. These are separate concerns.
- **Config file for effort->model mapping:** Over-engineering for 3 static values. The mapping should be inline in workflow instructions.
- **Modifying converters/installers:** No changes needed. The `model:` frontmatter field in skill files is unchanged. Effort routing lives entirely in workflow markdown instructions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Subagent model selection | Custom model selection logic | Agent tool `model` parameter | Built into Claude Code, officially supported |
| Task metadata parsing | Custom parser for effort field | Existing TASKS.md metadata line convention | Already established pattern with Trang thai, Uu tien, Loai fields |
| Effort->model mapping | External config/lookup system | Inline 3-row table in workflow | 3 static values don't warrant infrastructure |

**Key insight:** This phase is purely a workflow instruction change. The "routing" is Claude reading markdown instructions and passing a parameter. No code, no config files, no new modules.

## Common Pitfalls

### Pitfall 1: Breaking Backward Compatibility with Old PLAN.md Files
**What goes wrong:** Old PLAN.md files without `effort` field cause errors or unexpected behavior
**Why it happens:** Executor tries to read a field that doesn't exist
**How to avoid:** D-10 mandates default to `standard` (sonnet) when effort is missing. Workflow instructions MUST include: "If effort field missing, default to standard."
**Warning signs:** Test with a PLAN.md that lacks effort fields

### Pitfall 2: Planner Assigns Wrong Effort Level
**What goes wrong:** Simple tasks assigned to opus (wasted cost) or complex tasks assigned to haiku (poor quality)
**Why it happens:** Classification heuristics are guidelines, not rules. Planner may misjudge.
**How to avoid:** D-02 allows planner to override guidelines. D-13 allows user to edit PLAN.md. Include example tasks in guidelines (D-04 table).
**Warning signs:** Review PLAN.md effort assignments before executing

### Pitfall 3: fix-bug and test Skills Don't Use PLAN.md the Same Way
**What goes wrong:** Effort routing only works for write-code but not fix-bug/test
**Why it happens:** fix-bug operates on bug reports, not PLAN.md tasks. test operates on completed tasks.
**How to avoid:** For fix-bug: effort can be inferred from bug classification (🟢 simple -> haiku, 🟡🟠 standard -> sonnet, 🔴 complex -> opus). For test: effort mirrors the task being tested. Document these mappings in each workflow.
**Warning signs:** fix-bug and test always using sonnet regardless of task complexity

### Pitfall 4: Effort Field Position Inconsistency
**What goes wrong:** PLAN.md and TASKS.md show effort differently, causing confusion
**Why it happens:** Templates not aligned
**How to avoid:** Add effort to BOTH plan.md template AND tasks.md template in the same position (metadata line)
**Warning signs:** grep for "Effort:" across templates to verify consistency

### Pitfall 5: Parallel Mode Agent Spawning Ignores Effort
**What goes wrong:** write-code Buoc 10 spawns agents without passing model parameter
**Why it happens:** Current Buoc 10 says "Spawn Agent tool for each task" without mentioning model selection
**How to avoid:** Explicitly update Buoc 10 instructions to: (1) read effort from task, (2) resolve model, (3) pass model to Agent tool
**Warning signs:** All parallel agents running on same model regardless of task effort

### Pitfall 6: Logging Not Added
**What goes wrong:** No visibility into which model was used for each task
**Why it happens:** D-11 requires logging but is easy to overlook
**How to avoid:** Add logging instruction to each workflow's task selection step: "Thong bao: Spawning {model} agent for {task_id} ({effort})..."
**Warning signs:** Running tasks without seeing model selection in output

## Code Examples

### Example 1: TASKS.md Task Header with Effort Field
```markdown
## Task 1: Tao entity User voi validation
> Trang thai: ⬜ | Uu tien: Cao | Phu thuoc: Khong | Loai: Backend | Effort: standard
> Files: src/users/user.entity.ts, src/users/dto/create-user.dto.ts
> Truths: T1, T2

## Task 2: Sua ten bien authToken thanh accessToken
> Trang thai: ⬜ | Uu tien: Thap | Phu thuoc: Task 1 | Loai: Backend | Effort: simple
> Files: src/auth/auth.service.ts
> Truths: T3
```

### Example 2: Effort Classification Guidelines for Planner
```markdown
### Phan loai effort cho task

Moi task PHAI co truong `Effort:` trong metadata. Mac dinh: `standard`.

| Tin hieu | simple | standard | complex |
|----------|--------|----------|---------|
| Files sua/tao | 1-2 | 3-4 | 5+ |
| So Truths | 1 | 2-3 | 4+ |
| Phu thuoc | 0 | 1-2 | 3+ |
| Da domain | khong | khong | co |

Vi du:
- simple: doi ten bien, them import, sua typo, cap nhat config
- standard: tao component moi, API endpoint, bo unit test
- complex: refactor nhieu file, quyet dinh kien truc, tich hop

Planner CO THE override guidelines dua tren hieu biet context.
```

### Example 3: Effort-to-Model Resolution in Executor Workflow
```markdown
### Doc effort va chon model

Doc `Effort:` tu metadata task trong TASKS.md:
| Effort | Model |
|--------|-------|
| simple | haiku |
| standard | sonnet |
| complex | opus |
| (thieu/khong ro) | sonnet |

Thong bao: "Spawning {model} agent cho {task_id} ({effort})..."
```

### Example 4: Parallel Agent Spawning with Model (Buoc 10)
```markdown
1. **Spawn Agent tool** cho moi task song song -- moi agent nhan: PLAN.md, task detail, rules, CONTEXT.md, docs.
   - Doc `Effort:` tu task metadata -> chon model tuong ung (simple->haiku, standard->sonnet, complex->opus, mac dinh->sonnet)
   - Truyen model vao Agent tool: `model: {resolved_model}`
   - Thong bao: "Spawning {model} agent cho {task_id} ({effort})..."
   - Chi dan: Buoc 2->3->4->5 (KHONG report/TASKS/commit)
```

### Example 5: fix-bug Effort Mapping from Bug Classification
```markdown
### Effort routing cho fix-bug

fix-bug khong doc tu PLAN.md. Thay vao do, effort duoc suy ra tu phan loai rui ro:

| Phan loai bug | Effort | Model |
|---------------|--------|-------|
| 🟢 Sua nhanh | simple | haiku |
| 🟡 Loi logic | standard | sonnet |
| 🟠 Loi du lieu | standard | sonnet |
| 🔴 Bao mat | complex | opus |
| 🔵 Ha tang | simple | haiku |
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Task tool | Agent tool (renamed) | Claude Code 2.1.63 | `subagent_type` still works, but `Agent` is current name |
| No model param on Agent | `model` parameter supported | Current | Enables per-subagent model selection |
| Skill-level `model:` only | Per-task model via Agent tool | This phase | Granular model routing within a single skill |

**Deprecated/outdated:**
- `Task` tool name: Still works as alias, but `Agent` is the current name in Claude Code docs
- `subagent_type: "general-purpose"`: Still valid, but the newer Agent tool also supports `model` directly

## Open Questions

1. **How does the `model` parameter interact with `subagent_type` in the Agent tool?**
   - What we know: Agent tool supports both `model` and `subagent_type` parameters. Built-in subagent types (Explore, Plan, general-purpose) have default models.
   - What's unclear: Whether specifying `model` overrides the subagent type's default model, or if they conflict.
   - Recommendation: Use `model` parameter explicitly alongside `subagent_type: "general-purpose"`. The official docs show `model` as a direct override. Test with a simple task to verify.

2. **How should `complete-milestone` and `conventions` skills handle effort?**
   - What we know: D-06 says routing applies to write-code, fix-bug, test only. D-07 says complete-milestone and conventions keep static model.
   - What's unclear: complete-milestone is currently `model: sonnet` and conventions is `model: sonnet` -- neither is in the haiku or opus list from D-07.
   - Recommendation: Leave complete-milestone and conventions at their current `model: sonnet`. D-07's list is guidance for the routing targets; static skills stay as-is.

3. **Does effort routing apply to single-task (non-parallel) execution mode?**
   - What we know: D-09 says executor reads effort field and spawns agent with model. Buoc 10 is explicit about --parallel. But single-task mode (default, no flag) runs in the SAME agent context, not a spawned agent.
   - What's unclear: In single-task mode (default), write-code runs the task directly in its own context (sonnet). Can it change its own model mid-execution? No -- the model is set at session start.
   - Recommendation: For single-task mode, effort routing is advisory/visibility only. The executing skill already has its `model: sonnet`. Effort routing only takes effect when subagents are spawned (--parallel mode). Document this limitation clearly. Users wanting effort-based routing should use --parallel.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node:test) |
| Config file | none -- uses package.json `test` script |
| Quick run command | `node --test test/smoke-utils.test.js` |
| Full suite command | `node --test 'test/*.test.js'` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TOKN-04a | TASKS.md template includes Effort field | unit | `node --test test/smoke-integrity.test.js -x` | Needs update |
| TOKN-04b | Plan workflow includes effort classification guidelines | unit | `node --test test/smoke-integrity.test.js -x` | Needs update |
| TOKN-04c | write-code workflow references effort->model mapping | unit | `node --test test/smoke-integrity.test.js -x` | Needs update |
| TOKN-04d | fix-bug workflow references effort->model mapping | unit | `node --test test/smoke-integrity.test.js -x` | Needs update |
| TOKN-04e | test workflow references effort->model mapping | unit | `node --test test/smoke-integrity.test.js -x` | Needs update |
| TOKN-04f | Backward compatibility: missing effort defaults to standard | unit | `node --test test/smoke-utils.test.js -x` | Needs new test |
| TOKN-04g | All 5 converters handle updated templates/workflows without error | integration | `node --test test/smoke-converters.test.js` | Exists (auto-covers) |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-integrity.test.js`
- **Per wave merge:** `node --test 'test/*.test.js'`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- [ ] `test/smoke-integrity.test.js` -- add tests for Effort field presence in templates and effort->model mapping presence in workflows
- [ ] `test/smoke-utils.test.js` -- add test for effort field parsing/default behavior from task metadata line

## Sources

### Primary (HIGH confidence)
- [Claude Code subagent docs](https://code.claude.com/docs/en/sub-agents) -- Agent tool `model` parameter, subagent configuration, all frontmatter fields
- Project source files: commands/pd/*.md, workflows/*.md, templates/*.md, bin/lib/utils.js -- current codebase structure and patterns

### Secondary (MEDIUM confidence)
- [Claude Code changelog/blog](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) -- Agent tool evolution from Task tool

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all changes are to existing markdown files, no new dependencies
- Architecture: HIGH -- patterns directly follow from CONTEXT.md decisions (D-01 through D-15)
- Pitfalls: HIGH -- pitfalls identified from direct analysis of workflow code and fix-bug/test integration points

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable -- workflow markdown format unlikely to change)
