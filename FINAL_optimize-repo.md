# Full Repo Optimization Plan for Please-Done

A comprehensive optimization plan — executed in a single batch. Includes: Agent restructuring, Model tiering, file deduplication, token optimization, and runtime code DRY.

> **Current repo state**: 11 agents in registry (8 agent files at `commands/pd/agents/` + 7 agent files at `.claude/agents/`), 14 commands + 13 workflows (commands are routers), 16 reference specs (including 2 YAMLs from 4_AUDIT), 12 templates (including `security-fix-phase.md` from 4_AUDIT), 7 rules (general + 6 framework), 10 converter+installer files, 29 runtime libs (`bin/lib/` including `session-delta.js`, `smart-selection.js`, `gadget-chain.js` from 4_AUDIT), 5 bin scripts, 34 test files, 4 eval files, 14 docs, FastCode subsystem (Python). Total ~100+ markdown, ~70+ JS, ~15 Python.

---

## ⚠️ Audit Review — Workflow Breakage Risks

Cross-reference audit results across the entire repo before executing the plan:

### Key Findings

1. **Commands ARE already routers** — Commands (`commands/pd/*.md`) do NOT duplicate workflow content. Each command only contains: YAML frontmatter + guards + 1 line `Execute @workflows/xxx.md from start to finish`. **→ Previous item E1 was WRONG, corrected.**

2. **Guard files are 1 line each** — 4 guard files (`guard-context.md`, `guard-context7.md`, `guard-valid-path.md`, `guard-fastcode.md`) each have only **1 checklist line**. Merging them saves NEGLIGIBLE (~4 lines) while **breaking 48 references** across 12 command files. **→ Item E2 guard merging DROPPED.**

3. **Converter base.js is already a factory** — 4 platform converters already delegate everything through `baseConvert()` with a config object. Each converter only overrides `{ runtime, pathReplace, toolMap, buildFrontmatter }`. **→ Item F1 doesn't need a new factory, only a review.**

4. **Installers ARE genuinely different** — Claude installer installs Python/FastCode local, Copilot only copy+convert skills. Cannot merge into a base class. **→ Item F2 corrected.**

5. **`getAdaptiveParallelLimit()` is implemented but NOBODY uses it** — `parallel-dispatch.js` hardcodes spawning 2 agents, doesn't call the adaptive function. **→ Added item C for actual integration.**

6. **`fix-bug-v1.5.md` is a fallback** when 5 agent files are missing (Janitor, Detective, DocSpec, Repro, Architect in `.claude/agents/`) → MUST NOT be deleted/renamed. **→ Documented in A4.**

7. **Complete-milestone has NO security gate** — `workflows/complete-milestone.md` Step 3 only checks bugs in general, does NOT require a security scan. **→ Will be fixed by the `4_AUDIT_MILESTONE.md` milestone (runs before FINAL).**

8. **`pd-evidence-collector` + `pd-fact-checker` were overlooked** — These 2 agents exist in `AGENT_REGISTRY` (`resource-config.js`) + smoke tests but plan A4 didn't mention them. **→ Added to A4 migration table.**

9. **D2 `TECHNICAL_STRATEGY.md` guard depends on milestone 3** — This file is created by `3_PROJECT_RESEARCHER.md`. If milestone 3 hasn't shipped and a hard-block is used → breaks all `/pd:plan` calls. **→ Changed to soft-guard (warning).**

---

## A. Agent Restructuring (Agent Reform)

### A1. Model Tiering (Tier Strategy)

Replace hardcoded model names with 3 tiers, compatible across all platforms:

| Tier          | Role                        | Characteristics            | Example Models                                |
| ------------- | --------------------------- | ------------------------- | -------------------------------------------- |
| **Scout**     | Mapper, Security, Feature   | Fast, Cheap, Wide context | Haiku 4.5, Gemini 3 Flash, GPT-5.3 Small     |
| **Builder**   | Executor, Repro, Regression | Balanced, Good at code    | Sonnet 4.6, Composer 2, GPT-5.4              |
| **Architect** | Synthesizer, Planner        | Thinking, High reasoning  | Opus 4.6, Gemini 3.1 Pro, GPT-5.4 (Thinking) |

### A2. Agent Registry (New Agent Library)

Location: `commands/pd/agents/`. Clear assignment by Tier:

| Agent                        | Tier          | Calling Skill                   | Notes                                                                    |
| ---------------------------- | ------------- | ------------------------------- | ------------------------------------------------------------------------ |
| `pd-codebase-mapper.md`      | **Scout**     | `init`, `scan`, `new-milestone` | New — quickly scans codebase structure, updates `.planning/codebase/`     |
| `pd-security-researcher.md`  | **Scout**     | `research`, `plan`              | New — adds deep security research capability                             |
| `pd-feature-analyst.md`      | **Scout**     | `research`, `plan`              | New — feature analysis                                                   |
| `pd-research-synthesizer.md` | **Architect** | `research`                      | New — synthesizes research from multiple agents                          |
| `pd-planner.md`              | **Architect** | `plan`                          | New — dedicated planning agent for PD phases                             |
| `pd-regression-analyzer.md`  | **Builder**   | `fix-bug`                       | New — promotes `regression-analyzer.js` to an agent with dispatch        |

> **Removed from new registry:**
> - ~~`pd-repro-generator`~~ — **Already exists** under the name `pd-repro-engineer` (Builder tier), working well in the fix-bug flow. Renaming is unnecessary.

### A3. Security Agent — ✅ ALREADY DONE IN 4_AUDIT

> **Fully handled by the `4_AUDIT_MILESTONE.md` milestone.**
>
> Milestone 4 ships a **1 template + dispatch** architecture from the start:
>
> - `pd-sec-scanner.md` — 1 template agent receiving `--category` parameter
> - `config/security-rules.yaml` — centralized rules for 13 OWASP categories
> - `pd-sec-reporter.md` — aggregation reporter
> - Total: **3 files** (not 13 files then merge later)
> - Pipeline: FastCode MCP discovery → AI analysis → evidence
> - Function-Level Checklist, security gate, smart selection, gadget chain — all in 4_AUDIT
>
> **No additional optimization needed here. Previous A3 (merge 13→3) was already implemented in 4_AUDIT.**

### A4. Agent Migration (Old → New Comparison)

Repo has 11 agents in registry, 8 agent files at `commands/pd/agents/`, 7 agent files at `.claude/agents/`. Plan defines 6 new agents. Comparison table:

| Agent (keep/merge/create new)                                                                            | Action                                                            |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `pd-bug-janitor` + `pd-code-detective` + `pd-doc-specialist` + `pd-fix-architect` + `pd-repro-engineer` | ✅ Keep as-is — working well in the fix-bug flow                  |
| `pd-evidence-collector` + `pd-fact-checker`                                                              | ✅ Keep as-is — present in registry + smoke tests, used in research flow |
| `pd-sec-scanner` + `pd-sec-reporter` + `pd-sec-fixer`                                                   | ✅ Already created by 4_AUDIT (scanner template + reporter + fixer) |
| 6 new agents (mapper, researcher, analyst, synthesizer, planner, regression)                             | Create per registry A2                                           |

- [ ] Ensure backward compatibility — old agents must still work during transition
- [ ] Each new agent must have a test in `test/smoke-agent-files.test.js`
- [ ] Add `pd-regression-analyzer` to `AGENT_REGISTRY` in `resource-config.js`
- **⚠️ DO NOT DELETE/RENAME `fix-bug-v1.5.md`** — this is a fallback workflow when the 5 agent files for fix-bug v2.1 are missing. Deleting/renaming = fix-bug loses its fallback → workflow crashes if agents are missing.

---

## B. Platform-Aware Mapping (Platform Detection)

### B1. Automatic Tier → Model Mapping

The `init` skill identifies the current platform to load the appropriate configuration:

| Platform              | Scout              | Builder             | Architect            |
| --------------------- | ------------------ | ------------------- | -------------------- |
| **Claude Code (CLI)** | `claude-4-5-haiku` | `claude-4-6-sonnet` | `claude-4-6-opus`    |
| **Gemini CLI**        | `gemini-3-flash`   | _(fallback Scout)_  | `gemini-3.1-pro`     |
| **Cursor/Windsurf**   | `cursor-small`     | `claude-3-5-sonnet` | _(fallback Builder)_ |
| **Copilot (VS Code)** | _(inherit)_        | _(inherit)_         | _(inherit)_          |

### B2. Fallback

If the platform doesn't support a higher Tier → automatically downgrade to the highest available model → workflow never breaks.


---

## C. Parallelism & Handoff (Parallel + Handoff)

### C1. Concurrency Limits (Resource Guard)

More parallelism isn't always better — must be throttled based on actual resources:

| Parameter       | Value   | Reason                                          |
| --------------- | ------- | ---------------------------------------------- |
| **Max workers** | **4**   | Hard ceiling — never exceed, even on powerful machines |
| **Min workers** | **2**   | Hard floor — below 2, run sequentially for stability |
| **Default**     | **3**   | Balance between speed and stability             |

- [x] **Adaptive Throttle (Script, no AI)**: Already implemented `getAdaptiveParallelLimit()` in `bin/lib/resource-config.js`. Uses `os.cpus()` and `os.freemem()` — runs instantly, no AI token cost. Returns `{ workers, reason, cpu, freeMemGB }` for the orchestrator to use directly.
- [ ] **⚠️ Actual Integration**: `parallel-dispatch.js` currently HARDCODES spawning 2 agents (Detective + DocSpec), doesn't call `getAdaptiveParallelLimit()` or `isHeavyAgent()`. Needs:
  - Fix `parallel-dispatch.js` to call `getAdaptiveParallelLimit()` instead of hardcoding
  - Wire `isHeavyAgent()` check before spawning (heavy agent → reduce 1 worker)
  - Ensure `PARALLEL_MIN=2` and `PARALLEL_MAX=4` are enforced
- [ ] **Backpressure**: If a worker times out (> 120s) → don't spawn more, wait for current worker to finish before continuing. (Logic `shouldDegrade()` already exists in `resource-config.js`)
- [ ] **Graceful Degradation**: If system overload detected (load average > CPU count) → automatically reduce 1 worker, log warning.

### C2. Handoff & State

- [ ] **Unified Handoff**: All results submitted in standard Markdown format in `.planning/research/raw/`
- [ ] **State-First**: Agent always reads `STATE.md` first — no context loss when switching models
- [ ] **Audit Citations**: Workers must cite links/files → Lead verifies cross-references, preventing hallucinations

---

## D. Skill-Agent Integration (Workflow Integration)

### D1. Update `init` & `new-milestone`

- [ ] **Automatic Mapping**: Summon `pd-codebase-mapper` (Scout) to quickly scan structure and update `.planning/codebase/`
- [ ] **Squad Activation**: Activate Research Squad simultaneously (Mapper + Security + Feature + Synthesizer) instead of manual research

### D2. Update `plan` (Strategy Guard)

- [ ] **Soft-Guard (Warning, not Block)**: `plan` checks for `TECHNICAL_STRATEGY.md` — if missing → display warning "No TECHNICAL_STRATEGY.md found. Run `/pd:research` first for a technical strategy." but **allow continuation**. Reason: `TECHNICAL_STRATEGY.md` is created by milestone 3 (`3_PROJECT_RESEARCHER.md`) — if milestone 3 hasn't shipped and a hard-block is used, it will **break all `/pd:plan` calls**.
- [ ] **Auto-Injection**: If `TECHNICAL_STRATEGY.md` exists → load compressed Strategy into `pd-planner` context. If not → skip, use existing RESEARCH.md.

### D3. Security Gate for Complete-Milestone → ALREADY IN 4_AUDIT

> **Fully handled by the `4_AUDIT_MILESTONE.md` milestone.**
>
> File `4_AUDIT` already defines:
>
> - **Step 0.5 Security Gate** in `workflows/complete-milestone.md` (BLOCKING)
> - Checks that `SECURITY_REPORT.md` exists + no remaining CRITICAL issues
> - Guard in `commands/pd/complete-milestone.md`
> - Severity classification: CRITICAL = block, WARNING = ask user fix/accept, PASS = allow
> - Auto-create fix phases by gadget chain if CRITICAL found (milestone mode)
> - Cross-check functions in sec-report vs new/modified functions in milestone
>
> **No need to redo here. Milestone 4 will ship before FINAL.**

### Overall Coordination Table:

| Stage         | Agent             | Tier          | Goal                     |
| ------------- | ----------------- | ------------- | ----------------------- |
| **Init**      | `codebase-mapper` | **Scout**     | Quick structure scan     |
| **Research**  | `Scout Squad`     | **Scout**     | Parallel, raw gathering  |
| **Synthesis** | `synthesizer`     | **Architect** | Reasoning, context compression |
| **Plan**      | `planner`         | **Architect** | Solution design          |
| **Coding**    | `executor`        | **Builder**   | Code, lint/build         |

---

## E. File Deduplication (Dedup & Consolidation)

### E1. Commands ↔ Workflows — ✅ ALREADY CORRECT

> **Audit conclusion**: Commands (`commands/pd/*.md`) ALREADY contain only YAML frontmatter + guards + 1 pointer line `@workflows/xxx.md`. NO changes needed.

- [x] Source of Truth = `workflows/` — ALREADY correct
- [x] `commands/pd/*.md` → ALREADY contain only metadata + pointer, no content duplication
- **⚠️ NOTE**: DO NOT rename workflow files — 12 commands reference by exact filename (`@workflows/fix-bug.md`). Renaming = breaking 12 commands.

### E2. Reference Consolidation (Only merge truly duplicate content)

> **Audit conclusion**: Guard files are 1 line each. Merging them saves ~4 lines but breaks 48 inline `@references/guard-*.md` across 12 command files. **→ DROP guard merging.**

- ~~Merge guard files~~ → **KEEP AS-IS** guard files (1 line/file, already optimized)
- [ ] Merge `verification-patterns.md` + `plan-checker.md` → `verification.md` (these 2 files truly have duplicate logic)
- **Actual reduction**: 16 → 15 files (only merge the verification pair, don't merge guards)

**2 new reference files from 4_AUDIT (keep as-is):**

| Reference                     | Role                                      | Used by            |
| ----------------------------- | ----------------------------------------- | ------------------ |
| `security-rules.yaml` (51KB)  | Centralized rules for 13 OWASP categories | `pd-sec-scanner`   |
| `gadget-chain-templates.yaml` | Templates for gadget chain analysis       | `gadget-chain.js`  |

**8 remaining references — already optimized, keep as-is:**

| Reference               | Role                                                    | Used by                                         |
| ----------------------- | ------------------------------------------------------- | ----------------------------------------------- |
| `conventions.md`        | Version filtering, commit prefix, status symbols        | All commands/workflows                          |
| `state-machine.md`      | State flow, prerequisites, auto-advance                 | `what-next`, `complete-milestone`, `write-code` |
| `questioning.md`        | Adaptive questioning framework                          | `new-milestone`, `plan`                         |
| `prioritization.md`     | Requirement priority sorting                            | `new-milestone`                                 |
| `ui-brand.md`           | UI design system, visual standards                      | `ui-phase`, `complete-milestone` (report)       |
| `context7-pipeline.md`  | Version-aware library lookup pipeline                   | `fetch-doc`, `plan`, `new-milestone`            |
| `mermaid-rules.md`      | Diagramming standard (5-color palette, node shapes)     | `generate-diagrams.js`, `plan`                  |
| `security-checklist.md` | Pre-coding security context per endpoint type           | `write-code`, `plan`                            |

Each file handles 1 concern, no overlap. NO merging or modification needed.

### E3. Template DRY (Cautious Approach)

**12 template files** (full list for survey):

| Template                 | Role                                        | Used by                       |
| ------------------------ | ------------------------------------------- | ----------------------------- |
| `plan.md`                | Phase plan format (Truths, tasks, criteria)  | `pd:plan`                     |
| `tasks.md`               | Task checklist format                       | `pd:plan` → `pd:write-code`   |
| `project.md`             | Project vision, milestone history           | `pd:new-milestone`            |
| `requirements.md`        | Requirements with identifiers               | `pd:new-milestone`            |
| `roadmap.md`             | Phase roadmap                               | `pd:new-milestone`            |
| `state.md`               | Current working state                       | All commands (read/write)     |
| `current-milestone.md`   | Current milestone tracking                  | All commands (read)           |
| `research.md`            | Research results format                     | `pd:research`                 |
| `progress.md`            | Recovery checkpoint (interrupted session)   | `pd:write-code`               |
| `verification-report.md` | Phase verification report                   | `pd:write-code` (post-verify) |
| `management-report.md`   | Milestone management report (PDF)           | `pd:complete-milestone`       |
| `security-fix-phase.md`  | Fix phase template for security findings    | `pd:audit` (from 4_AUDIT)     |

Actual check:

- [ ] Survey which templates truly share header patterns (`plan.md`, `tasks.md` have similar headers)
- [ ] If ≥3 templates share a header → create `_base-header.md`. If not → **DROP, don't over-engineer**
- **⚠️**: Templates DO NOT share a footer — each file has a unique ending. Don't force footer merging.

---

## F. Runtime Code DRY (Converter & Installer)

### F1. Converter — ✅ ALREADY HAS Factory Pattern

> **Audit conclusion**: `bin/lib/converters/base.js` IS already a factory. 4 platform converters all delegate through `baseConvert()` passing only a config object `{ runtime, pathReplace, toolMap, buildFrontmatter }`. Factory pattern IS working.

- [x] Factory pattern already exists (`base.js` + 4 platform configs)
- [ ] **Review only**: Check if 4 converter configs are consistent (key names, format). If inconsistency found → fix, no need to create new files.
- **File reduction**: 0 (already optimized). **Quality improvement**: consistency may improve.

### F2. Installer — Keep Separate, Only DRY Utilities

> **Audit conclusion**: Installers ARE genuinely different. Claude = install Python + pip + FastCode local. Copilot = only copy skills + run converter. OpenCode/Gemini = copy + symlink. **Cannot merge into a base class.**

- ~~Create installer-base.js~~ → **KEEP SEPARATE** per-platform installers
- [ ] **DRY shared utilities**: Extract `ensureDir()`, `validateGitRoot()`, `copyWithBackup()` into `installer-utils.js`
- [ ] Each installer imports utils, keeps platform-specific logic intact
- **Reduction**: 0 fewer files, but ~20-30% duplicate code DRY'd through utils

---

## G. Token Budget & Measurement

Repo already has `test/baseline-tokens.json` + `scripts/count-tokens.js` but not yet integrated into the process.

- [ ] **Token Budget per Tier**: Scout ≤ 4K, Builder ≤ 8K, Architect ≤ 12K prompt tokens
- [ ] **Before/After Benchmark**: Run `count-tokens.js` before and after optimization, record in `BENCHMARK_RESULTS.md`
- [ ] **Eval Integration**: Use `evals/` + `promptfooconfig.yaml` to measure output quality after token reduction
- [ ] **Lazy-Load References**: Agent only loads references when needed, not all 16 files at once. Note: `workflows/plan.md` **HAS already implemented** `<conditional_reading>` for 3/8 reference texts (questioning, prioritization, ui-brand). Extend this pattern to other workflows.

---

## Overall Impact Summary

| Group | Work                        | Estimated Impact                                                  |
| ----- | --------------------------- | ----------------------------------------------------------------- |
| **A** | Agent Reform                | 11 agents kept + 6 new agents. Sec: ✅ already DRY'd by 4_AUDIT  |
| **B** | Platform Mapping            | Config-driven, no hardcoded models, automatic fallback            |
| **C** | Parallel + Resource Guard   | 2-4 adaptive workers, backpressure, no resource hogging           |
| **D** | Skill Integration           | `pd-codebase-mapper` + soft-guard strategy, automated workflow    |
| **E** | File Dedup                  | 16 → 15 references (merge verification), keep everything else    |
| **F** | Runtime DRY                 | 0 fewer files, but DRY ~20-30% duplicate code through utils      |
| **G** | Token Budget                | Measurement + extend conditional_reading pattern                  |

**Actual total impact**:

- **Agent count**: 11 existing agents (kept) + 6 new agents = 17 agents total. No renaming `pd-repro-engineer`.
- **Code dedup**: ~20-30% duplicate code in installers DRY'd through `installer-utils.js`.
- **Token reduction per run**: Each security run loads only ~3-4KB instead of 30KB+. Adaptive throttle self-adjusts workers. Conditional reading extended.
- **No workflow breakage**: All filename references preserved. v1.5 fallback protected. 1-line guards preserved. D2 uses soft-guard (warning) instead of hard-block.

---

## Out of Optimization Scope (keep as-is)

| Group                   | Files                                                                                                                                                                                                                                                                                                                                                                      | Reason not to optimize                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **FastCode/**           | ~15 Python files (MCP server, tree-sitter, embeddings)                                                                                                                                                                                                                                                                                                                     | Independent subsystem — separate Python stack, doesn't affect JS/MD repo     |
| **docs/**               | 14 files (COMMAND_REFERENCE + 12 command docs + WORKFLOW_OVERVIEW)                                                                                                                                                                                                                                                                                                         | User documentation, doesn't affect runtime                                   |
| **rules/**              | 7 files (`general.md` + 6 framework: flutter, nestjs, nextjs, solidity, wordpress)                                                                                                                                                                                                                                                                                         | Copied per user project, platform-specific — no overlap                     |
| **bin/lib/** (29 files) | Runtime utilities (audit-logger, bug-memory, checkpoint-handler, confidence-scorer, debug-cleanup, evidence-protocol, session-manager, research-store, logic-sync, manifest, platforms, truths-parser, utils, index-generator, generate-diagrams, report-filler, mermaid-validator, pdf-renderer, plan-checker, outcome-router, repro-test-generator, regression-analyzer, session-delta, smart-selection, gadget-chain) + 2 subdirs (converters/, installers/) | Pure utilities, 1 concern per file, no overlap — already covered by smoke tests |
| **bin/\*.js**           | 5 entry points (install, plan-check, generate-pdf-report, route-query, update-research-index)                                                                                                                                                                                                                                                                              | CLI scripts, no overlap                                                     |
| **evals/**              | 4 files (prompt-wrapper, run, trigger-config, trigger-wrapper)                                                                                                                                                                                                                                                                                                             | Eval infra — G mentions integration but no code changes needed               |
