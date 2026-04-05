# Phase 8: Wave-Based Parallel Execution - Research

**Researched:** 2026-03-22
**Domain:** Parallel task execution / dependency graph analysis / file-conflict detection / Claude Code Agent tool orchestration
**Confidence:** HIGH

## Summary

Phase 8 upgrades the existing `--parallel` mode in `write-code.md` from a loose description (Buoc 1.5 + Buoc 10) into a robust, framework-aware parallel execution system. The core work involves three areas: (1) enhancing Buoc 1.5 with a proper topological sort algorithm and two-layer shared-file detection (static hotspot patterns + dynamic `> Files:` cross-reference), (2) improving Buoc 10's conflict handling from "DUNG bao user" to "auto-serialize conflicting tasks to the next wave," and (3) adding `> Files:` enforcement instructions to `plan.md` so the planner provides the metadata that conflict detection depends on.

This project is a cross-platform AI coding skills framework where all logic lives in markdown workflow instructions -- there are NO JavaScript utility modules to create. The parallel execution engine is implemented entirely as AI instructions: the orchestrating Claude agent reads TASKS.md, builds a dependency graph mentally, groups tasks into waves, spawns Agent tool calls for each wave member, waits for completion, then proceeds to the next wave. The key challenge is that these instructions must be precise enough for the AI to execute correctly, yet compact enough to fit within the project's prose compression philosophy.

Claude Code's Agent tool supports a `model` parameter (haiku/sonnet/opus) and runs each subagent in an isolated context. Subagents cannot spawn other subagents, which means the orchestrator pattern (one main agent coordinating multiple subagents) is the correct architecture. Background subagents run concurrently. The existing Phase 5 effort-to-model mapping (simple->haiku, standard->sonnet, complex->opus) is reused directly.

**Primary recommendation:** Enhance `write-code.md` Buoc 1.5 with static hotspot patterns table and `> Files:` cross-reference algorithm, upgrade Buoc 10 with auto-serialize logic and wave summary display, and add `> Files:` enforcement to `plan.md` for plans with 3+ tasks. Add smoke tests verifying the presence of hotspot patterns, `> Files:` enforcement, and parallel-specific instructions.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Two-layer detection: (1) Static hotspot pattern list for known conflict-prone files, (2) Dynamic cross-reference of `> Files:` fields across all tasks in the same wave.
- **D-02:** Static hotspot patterns -- framework-specific:
  - Chung: `index.ts`, `index.js` (barrel exports), `package.json`, `tsconfig.json`, `*.config.*` (vite, webpack, next, tailwind)
  - NestJS: `app.module.ts`, `main.ts`, `*.module.ts`
  - Next.js: `layout.tsx`, `middleware.ts`, `next.config.*`
  - Flutter: `pubspec.yaml`, `main.dart`, `routes.dart`
  - WordPress: `functions.php`, `style.css`
  - Solidity: `hardhat.config.*`, migration files
- **D-03:** Pattern list them vao `write-code.md` Buoc 1.5 -- KHONG tao file moi. Dang bang compact trong workflow.
- **D-04:** Dynamic detection: so sanh `> Files:` cua tat ca tasks trong cung wave -> giao nhau > 0 -> serialize. Neu task thieu `> Files:` -> canh bao nhung van cho chay song song.
- **D-05:** Pre-wave auto-serialize: khi phat hien 2+ tasks sua cung file -> tu dong doi task sau sang wave tiep. KHONG hard-stop. Hien thi: "Task X doi sang wave N+1 (conflict: shared-file.ts)"
- **D-06:** Post-wave conflict check van giu: sau wave xong, neu phat hien 2 agents vo tinh sua cung file (khong du doan duoc) -> DUNG bao user. Day la safety net, khong phai flow chinh.
- **D-07:** Build check sau moi wave: build fail -> DUNG bao task cu the + output loi. KHONG chay wave tiep khi wave truoc fail.
- **D-08:** Deadlock detection: neu tat ca tasks con lai trong wave deu conflict lan nhau -> chuyen sang sequential (tuan tu) thay vi dung.
- **D-09:** Hien thi wave plan dang bang compact truoc khi chay:
  ```
  Wave 1: Task 1 (simple/haiku), Task 3 (standard/sonnet) -- 2 song song
  Wave 2: Task 2 (complex/opus) -- phu thuoc Task 1
  Conflict: Task 4 doi W1->W2 (shared: app.module.ts)
  ```
- **D-10:** Hoi xac nhan 1 lan truoc wave dau tien. Sau do chay lien tuc khong hoi lai.
- **D-11:** Moi agent nhan: task detail tu TASKS.md + relevant PLAN.md sections + applicable rules + CONTEXT.md path. KHONG dump toan bo PLAN.md -- chi sections lien quan den task.
- **D-12:** Agent instructions: Buoc 2->3->4->5 (research -> code -> lint/build -> test). KHONG report, KHONG commit, KHONG cap nhat TASKS.md -- orchestrator lam sau wave.
- **D-13:** Effort->model routing tai su dung Phase 5: `simple->haiku`, `standard->sonnet`, `complex->opus`. Mac dinh `sonnet` neu khong co effort field.
- **D-14:** Them huong dan vao `plan.md` workflow: planner PHAI ghi day du `> Files:` field cho moi task khi plan co >= 3 tasks. Thieu `> Files:` -> parallel mode khong the phan tich conflict -> kem hieu qua.
- **D-15:** Planner ghi `> Files:` dua tren Ghi chu ky thuat + mo ta task. Khong can chinh xac 100% -- heuristic du cho conflict detection.

### Claude's Discretion
- Exact topological sort implementation (da co huong dan trong Buoc 1.5)
- Cach Grep kiem tra import chung (bo sung cho `> Files:` cross-reference)
- Format chinh xac wave summary report sau khi het waves
- Cach handle monorepo voi multiple packages
- Agent timeout/retry strategy
- Testing approach cho parallel scenarios

### Deferred Ideas (OUT OF SCOPE)
- Agent Teams API integration (PARA-04 v2) -- evaluate neu API on dinh hon
- Optimistic parallel execution with rollback (PARA-05 v2) -- phuc tap, can conflict resolution engine
- Wave execution metrics/telemetry -- dem thoi gian tiet kiem per wave
- Cross-plan parallelism -- chay nhieu plans song song (khong chi tasks trong 1 plan)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PARA-01 | Wave-based parallel execution -- topological sort tasks, nhom independent tasks thanh waves chay dong thoi | Kahn's algorithm for topological sort (BFS-based, natural wave grouping), Claude Code Agent tool supports concurrent subagent spawning with model parameter, existing Buoc 1.5 skeleton provides foundation |
| PARA-02 | File-conflict detection -- phan tich affected files, ngan 2 agents sua cung 1 file trong cung wave | Two-layer detection: static hotspot patterns (framework-specific) + dynamic `> Files:` cross-reference; pre-wave auto-serialize conflicting tasks; post-wave safety net via git diff |
| PARA-03 | Enhanced shared-file detection -- phat hien barrel exports, config files, shared modules, framework hotspots (app.module.ts, layout.tsx) | Static hotspot pattern list covering 6 frameworks/stacks; `> Files:` metadata field already exists in TASKS.md template; plan.md enforcement for >= 3 tasks |
</phase_requirements>

## Standard Stack

### Core
| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| Claude Code Agent tool | Current | Subagent spawning with model param | Built-in tool, supports `model: haiku/sonnet/opus`, concurrent execution |
| Markdown workflow files | N/A | All parallel logic lives in instructions | Project philosophy: AI-driven analysis, no utility scripts |
| Node.js test runner | Built-in | `node --test` for smoke tests | Already used across all phases, no additional dependencies |

### Supporting
| Component | Version | Purpose | When to Use |
|-----------|---------|---------|-------------|
| `> Files:` metadata | Existing | Task-level file listing for conflict detection | Every task in plans with >= 3 tasks |
| Effort->model routing | Phase 5 | Determines which model each agent uses | Every parallel agent spawn |
| TASKS.md dependency types | Existing | code/design/file dependency classification | Topological sort input |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| AI-driven topological sort | JavaScript utility script | Violates project philosophy; instructions are sufficient for < 20 task graphs |
| Static hotspot patterns | Dynamic AST analysis | Over-engineering; patterns cover 95%+ of real conflicts |
| Agent tool subagents | Agent Teams API | Agent Teams is newer (Feb 2026), deferred to PARA-04 v2 |

## Architecture Patterns

### Files Modified (No New Files)
```
workflows/
  write-code.md        # Buoc 1.5 (expand) + Buoc 10 (improve)
  plan.md              # Add > Files: enforcement for plans >= 3 tasks
test/
  smoke-integrity.test.js  # Add parallel-specific tests
```

### Pattern 1: Kahn's Algorithm for Wave Grouping (PARA-01)
**What:** BFS-based topological sort that naturally produces execution "levels" (waves). Tasks with in-degree 0 form Wave 1, removing them exposes Wave 2, etc.
**When to use:** Every `--parallel` invocation at Buoc 1.5.
**Why Kahn's over DFS:** Kahn's algorithm inherently groups nodes by dependency depth, which maps directly to parallel waves. DFS requires additional post-processing to identify parallelizable groups.

**Algorithm in AI instruction form:**
```
1. Build adjacency list from TASKS.md "Phu thuoc" column
   - Code dependency ("Task A") -> edge A->B (B depends on A)
   - Design dependency ("Khong") -> no edge (parallel-safe)
   - File dependency ("Task A (shared file)") -> edge A->B
2. Calculate in-degree for each task
3. Wave 1 = all tasks with in-degree 0 AND status = "white square"
4. For each subsequent wave:
   - Remove completed wave's tasks from graph
   - Recalculate in-degree
   - New in-degree 0 tasks = next wave
5. No tasks with in-degree 0 but tasks remain = circular dependency -> DUNG
```

### Pattern 2: Two-Layer Shared-File Detection (PARA-02 + PARA-03)
**What:** Combine static pattern matching with dynamic cross-reference to detect file conflicts before spawning agents.
**When to use:** After wave grouping, before spawning agents for each wave.

**Layer 1 -- Static Hotspot Patterns:**
```
Check each task's > Files: against hotspot pattern list:
- Match by exact filename (index.ts, app.module.ts)
- Match by glob pattern (*.config.*, *.module.ts)
- If ANY file in > Files: matches a hotspot AND appears in 2+ tasks
  within the same wave -> conflict detected
```

**Layer 2 -- Dynamic Cross-Reference:**
```
For all tasks in the same wave:
1. Collect > Files: sets: A = {files of task 1}, B = {files of task 2}, ...
2. Compute pairwise intersections: A intersect B, A intersect C, ...
3. Non-empty intersection -> conflict -> auto-serialize later task to next wave
4. Task missing > Files: -> warn but allow parallel (degraded detection)
```

### Pattern 3: Pre-Wave Auto-Serialize (PARA-02)
**What:** When conflict detected, automatically move later task to next wave instead of stopping.
**When to use:** After two-layer detection identifies conflicts.

```
For each conflict (task_X, task_Y share file_Z):
1. Keep task with lower number in current wave
2. Move task with higher number to wave N+1
3. Display: "Task Y doi sang wave N+1 (conflict: file_Z)"
4. If ALL remaining tasks in a wave conflict with each other:
   -> Deadlock -> switch to sequential execution for those tasks
```

### Pattern 4: Agent Context Minimization (D-11)
**What:** Each spawned agent receives only relevant context, not entire PLAN.md.
**When to use:** Every Agent tool spawn in Buoc 10.

```
Agent receives:
1. Task detail block from TASKS.md (description + acceptance criteria + technical notes)
2. PLAN.md sections referenced by task (design decisions, API endpoints for that task)
3. Applicable .planning/rules/ files (general + stack-specific)
4. CONTEXT.md path for project context
5. Effort model assignment

Agent does NOT receive:
- Other tasks' details
- Unrelated PLAN.md sections
- Tracking/status information
```

### Pattern 5: Post-Wave Orchestration (D-06, D-07)
**What:** After all agents in a wave complete, orchestrator performs safety checks and bookkeeping.
**When to use:** After every wave completion.

```
Post-wave sequence:
1. Collect results from all agents
2. Safety net: git diff --name-only -> check if 2 agents modified same file
   - Yes -> DUNG, show conflict details to user
3. Run build: build fail -> DUNG, show failing task + error output
4. For each completed task:
   - Create CODE_REPORT (Buoc 6)
   - Update TASKS.md (Buoc 7a)
   - Git commit (Buoc 7b)
5. Proceed to next wave
```

### Anti-Patterns to Avoid
- **Dumping full PLAN.md to each agent:** Wastes tokens, confuses agents with irrelevant context. Send only task-relevant sections.
- **Hard-stopping on first conflict:** Ruins UX. Auto-serialize to next wave instead.
- **Nested subagent spawning:** Agent tool subagents cannot spawn other subagents. The orchestrator must handle all spawning.
- **Skipping build check between waves:** A broken build in wave N cascades errors into wave N+1. Always verify between waves.
- **Running agents without > Files: metadata:** Conflict detection degrades significantly. Warn but continue.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Topological sort | JavaScript graph library | AI-driven Kahn's algorithm in workflow instructions | Project philosophy: no new utility scripts. Task graphs are small (< 20 nodes). AI can handle this reliably |
| File conflict detection | File-watching system | Static patterns + `> Files:` metadata cross-reference | AI instructions with a lookup table are sufficient. Real-time file watching would require a daemon |
| Agent spawning | Custom process manager | Claude Code Agent tool | Built-in, handles context isolation, model routing, concurrent execution |
| Deadlock detection | Cycle detection library | Simple check: "all remaining tasks conflict with each other" | Binary check is enough -- either some can run or none can |

**Key insight:** This project operates entirely through AI workflow instructions in markdown. The "engine" is the Claude agent reading and following instructions. All complexity lives in the instructions, not in code.

## Common Pitfalls

### Pitfall 1: Incomplete > Files: Metadata
**What goes wrong:** Planner creates tasks without `> Files:` field, conflict detection cannot analyze file overlaps, parallel execution runs with no protection against two agents editing the same file.
**Why it happens:** `> Files:` is currently optional in the template. Without enforcement, planners skip it.
**How to avoid:** Add explicit enforcement instruction in `plan.md` workflow: "Plans with >= 3 tasks PHAI ghi `> Files:` cho moi task." D-14 addresses this directly.
**Warning signs:** Tasks in TASKS.md with empty or missing `> Files:` lines.

### Pitfall 2: Barrel Export Conflicts
**What goes wrong:** Two agents independently create new modules that both need to add exports to the same `index.ts` barrel file. Both write to the file, causing merge conflicts or lost exports.
**Why it happens:** Barrel exports are implicit shared files -- each task thinks it's only modifying "its own" module but also touches the shared index.
**How to avoid:** Static hotspot patterns include `index.ts`/`index.js`. When detected in multiple tasks' `> Files:`, auto-serialize those tasks.
**Warning signs:** Multiple tasks in the same wave creating new modules in the same directory.

### Pitfall 3: Module Registration Files
**What goes wrong:** NestJS `app.module.ts`, Next.js `layout.tsx`, Flutter `routes.dart` -- these files register new modules/components. Two agents adding different modules both modify the same registration file.
**Why it happens:** Framework architecture concentrates registration in a single file.
**How to avoid:** Framework-specific hotspot patterns explicitly list these files. Auto-serialize any tasks touching them.
**Warning signs:** Tasks creating new features in the same framework often need to update registration files.

### Pitfall 4: Agent Context Overflow
**What goes wrong:** Orchestrator dumps entire PLAN.md + all TASKS.md into each agent, consuming excessive tokens and confusing agents with irrelevant information.
**Why it happens:** Easier to "send everything" than to select relevant sections.
**How to avoid:** D-11 specifies: only task detail + relevant PLAN.md sections + applicable rules. Instructions must be explicit about what to include.
**Warning signs:** Agents producing output that references other tasks or unrelated plan sections.

### Pitfall 5: Build Cascade Failures
**What goes wrong:** Wave N produces a build failure. Orchestrator continues to Wave N+1, which fails worse because it depends on Wave N's output.
**Why it happens:** Missing build verification between waves.
**How to avoid:** D-07 mandates build check after each wave. Build fail -> DUNG, do NOT proceed.
**Warning signs:** Multiple wave failures in succession, each with increasing error counts.

### Pitfall 6: Circular Dependency Detection Failure
**What goes wrong:** TASKS.md has circular dependencies (Task A depends on B, B depends on A). Topological sort produces no Wave 1 candidates. System hangs.
**Why it happens:** Planner made an error in dependency specification.
**How to avoid:** After computing in-degree, check if any tasks have in-degree 0. If not, report circular dependency and DUNG.
**Warning signs:** Kahn's algorithm produces empty wave with remaining unprocessed tasks.

## Code Examples

### Example 1: Static Hotspot Patterns Table (for Buoc 1.5)

```markdown
**Bang phat hien shared files (hotspot):**

| Stack | Files | Pattern |
|-------|-------|---------|
| Chung | Barrel exports | `index.ts`, `index.js` |
| Chung | Config | `package.json`, `tsconfig.json`, `*.config.*` |
| NestJS | Registration | `app.module.ts`, `main.ts`, `*.module.ts` |
| Next.js | Layout/Middleware | `layout.tsx`, `middleware.ts`, `next.config.*` |
| Flutter | Core | `pubspec.yaml`, `main.dart`, `routes.dart` |
| WordPress | Theme/Plugin | `functions.php`, `style.css` |
| Solidity | Config | `hardhat.config.*`, migration files |
```

### Example 2: Wave Plan Display Format (for Buoc 1.5)

```markdown
**Hien thi wave plan:**
```
Wave 1: Task 1 (simple/haiku), Task 3 (standard/sonnet) -- 2 song song
Wave 2: Task 2 (complex/opus) -- phu thuoc Task 1
Wave 3: Task 4 (standard/sonnet), Task 5 (simple/haiku) -- 2 song song
Conflict: Task 4 doi W1->W3 (shared: app.module.ts)
Tong: 5 tasks, 3 waves, toi da 2 song song/wave
```
Xac nhan chay? (Y/n)
```

### Example 3: Auto-Serialize Logic (for Buoc 1.5)

```markdown
**Xu ly conflict (auto-serialize):**
1. Thu thap `> Files:` cua tat ca tasks trong wave
2. So sanh tung cap:
   - Giao nhau > 0 files -> conflict
   - File match hotspot pattern -> conflict
3. Conflict: giu task so nho, doi task so lon sang wave tiep
4. Hien thi: "Task X doi sang wave N+1 (conflict: file_Z)"
5. TAT CA tasks con lai conflict lan nhau -> chuyen sequential
```

### Example 4: Agent Spawn Instructions (for Buoc 10)

```markdown
**Spawn agent cho moi task trong wave:**
- Doc `Effort:` tu task metadata -> chon model (simple->haiku, standard->sonnet, complex->opus, mac dinh->sonnet)
- Truyen vao Agent tool:
  - model: {resolved_model}
  - Noi dung: task detail + PLAN.md sections lien quan + rules
  - Chi dan: Buoc 2->3->4->5 (research -> code -> lint/build). KHONG report, KHONG commit, KHONG cap nhat TASKS.md
```

### Example 5: Post-Wave Safety Net (for Buoc 10)

```markdown
**Sau wave (orchestrator):**
1. `git diff --name-only` -> danh sach files da sua
2. Kiem tra: 2+ agents sua cung file?
   - Co -> **DUNG**: "Conflict phat hien: [file] bi sua boi Task X va Task Y. Can resolve thu cong."
3. Build check: chay lint + build
   - Fail -> **DUNG**: "Build fail sau wave N. Task [X] co the la nguyen nhan. Output: [loi]"
   - KHONG chay wave tiep khi build fail
4. OK -> tao report (Buoc 6) + cap nhat TASKS.md (Buoc 7a) + commit (Buoc 7b) cho TUNG task
```

### Example 6: > Files: Enforcement in plan.md (for Buoc 5)

```markdown
**> Files: bat buoc (plans >= 3 tasks):**
Plan co >= 3 tasks -> planner PHAI ghi `> Files:` day du cho moi task.
- Dua tren Ghi chu ky thuat + mo ta task
- Khong can chinh xac 100% -- heuristic du cho conflict detection
- Thieu `> Files:` -> parallel mode khong the phan tich conflict -> kem hieu qua
- Ghi CA files tao moi VA files sua
```

## State of the Art

| Old Approach (Current) | New Approach (Phase 8) | Impact |
|------------------------|------------------------|--------|
| Buoc 1.5: Basic "Grep kiem tra import chung" | Two-layer detection: static hotspot + dynamic `> Files:` cross-reference | Much more reliable conflict detection, framework-aware |
| Buoc 10: Hard-stop on conflict ("DUNG bao user") | Pre-wave auto-serialize + post-wave safety net | Better UX, only stops on unresolvable conflicts |
| No wave plan display | Compact table showing waves, tasks, models, conflicts | User sees execution plan before confirming |
| `> Files:` optional | `> Files:` enforced for plans >= 3 tasks | Enables reliable conflict detection |
| No deadlock handling | Deadlock -> sequential fallback | Prevents complete halt on all-conflict scenarios |
| Full PLAN.md dumped to agents | Selective context: only task-relevant sections | Token savings, focused agent behavior |

**Deprecated/outdated:**
- Current Buoc 1.5 instructions are too vague ("Grep kiem tra import chung") -- will be replaced with explicit algorithm
- Current Buoc 10 hard-stop behavior ("DUNG bao user" on any conflict) -- replaced with auto-serialize

## Open Questions

1. **Monorepo handling**
   - What we know: CONTEXT.md lists tech stack with directory paths. D-02 includes patterns for multiple stacks.
   - What's unclear: How to determine which hotspot patterns apply when a monorepo has both NestJS and Next.js.
   - Recommendation: Read CONTEXT.md tech stack to determine active frameworks. Apply hotspot patterns for all detected stacks. This is Claude's discretion per CONTEXT.md.

2. **Agent timeout/retry strategy**
   - What we know: Claude Code Agent tool has no explicit timeout parameter in the current API. Background agents run until completion.
   - What's unclear: What happens if an agent hangs or runs extremely long. How to handle partial failures within a wave.
   - Recommendation: Rely on Claude Code's built-in timeout mechanisms. If an agent fails, mark its task as failed and stop the wave. Do not retry automatically -- report to user. This is Claude's discretion per CONTEXT.md.

3. **Wave summary report format**
   - What we know: D-09 specifies wave plan display. No specific format for post-execution summary.
   - What's unclear: Exact format for the final summary after all waves complete.
   - Recommendation: Simple summary table: total tasks, waves executed, time estimate, conflicts resolved. This is Claude's discretion per CONTEXT.md.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node:test) |
| Config file | None needed -- uses `node --test` |
| Quick run command | `node --test test/smoke-integrity.test.js` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PARA-01 | write-code.md has topological sort instructions in Buoc 1.5 | smoke | `node --test test/smoke-integrity.test.js -x` | Wave 0 (new tests) |
| PARA-01 | write-code.md has wave grouping instructions | smoke | `node --test test/smoke-integrity.test.js -x` | Wave 0 (new tests) |
| PARA-02 | write-code.md has auto-serialize conflict handling | smoke | `node --test test/smoke-integrity.test.js -x` | Wave 0 (new tests) |
| PARA-02 | write-code.md has post-wave safety net instructions | smoke | `node --test test/smoke-integrity.test.js -x` | Wave 0 (new tests) |
| PARA-03 | write-code.md has static hotspot patterns table | smoke | `node --test test/smoke-integrity.test.js -x` | Wave 0 (new tests) |
| PARA-03 | write-code.md has `> Files:` cross-reference instructions | smoke | `node --test test/smoke-integrity.test.js -x` | Wave 0 (new tests) |
| PARA-03 | plan.md enforces `> Files:` for plans >= 3 tasks | smoke | `node --test test/smoke-integrity.test.js -x` | Wave 0 (new tests) |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-integrity.test.js`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `test/smoke-integrity.test.js` -- add new `describe('Repo integrity -- wave-based parallel execution')` block with tests for:
  - Hotspot patterns presence in write-code.md
  - Auto-serialize instructions presence
  - Wave grouping / topological sort instructions
  - `> Files:` enforcement in plan.md for >= 3 tasks
  - Post-wave build check instructions
  - Agent context minimization instructions (KHONG dump toan bo PLAN.md)

*(No new test files needed -- extend existing smoke-integrity.test.js)*

## Sources

### Primary (HIGH confidence)
- [Claude Code Subagents Documentation](https://code.claude.com/docs/en/sub-agents) -- Complete docs on Agent tool parameters, model field, concurrent execution, background subagents, isolation modes
- `/Volumes/Code/Nodejs/please-done/workflows/write-code.md` -- Current Buoc 1.5 and Buoc 10 parallel instructions (the code being modified)
- `/Volumes/Code/Nodejs/please-done/workflows/plan.md` -- Current plan workflow (adding `> Files:` enforcement)
- `/Volumes/Code/Nodejs/please-done/templates/tasks.md` -- TASKS.md template with `> Files:`, dependency types

### Secondary (MEDIUM confidence)
- [Topological sorting - Wikipedia](https://en.wikipedia.org/wiki/Topological_sorting) -- Kahn's algorithm description, wave-based parallelism from topological levels
- [Tim Dietrich - Claude Code Parallel Subagents](https://timdietrich.me/blog/claude-code-parallel-subagents/) -- Practical patterns for coordinating parallel subagents
- [Parallelizing Tasks with Dependencies - DZone](https://dzone.com/articles/parallelizing-tasks-with-dependencies-design-your) -- DAG-based task parallelization patterns

### Tertiary (LOW confidence)
- None -- all findings verified through primary or secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Project uses only built-in Claude Code tools and markdown workflows, no external libraries needed
- Architecture: HIGH -- All patterns verified against existing codebase structure and Claude Code Agent tool capabilities
- Pitfalls: HIGH -- Based on direct analysis of real framework patterns (NestJS modules, Next.js layouts, barrel exports) and existing project history
- Topological sort: HIGH -- Well-established algorithm, Kahn's variant naturally produces waves

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable domain -- markdown workflow instructions, no rapidly evolving dependencies)
