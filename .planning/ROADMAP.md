# Roadmap: Please-Done Workflow Optimization

## Overview

This optimization cycle transforms Please-Done from a functional but token-heavy workflow framework into a lean, fast, library-aware system. The work progresses from structural cleanup (compression, readability) through architectural changes (conditional loading, library integration) to capability additions (parallel execution) and finally stabilizes the platform layer (converter pipeline). Each phase delivers measurable improvements while maintaining full backward compatibility.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Skill Structure Normalization** - Standardize all 12 skill files to a consistent format with clear layer separation
- [x] **Phase 2: Cross-Skill Deduplication** - Extract shared content from 12 skills into reusable micro-templates (completed 2026-03-22)
- [ ] **Phase 3: Prompt Prose Compression** - Reduce 30-40% of structural text across all skills and workflows
- [ ] **Phase 4: Conditional Context Loading** - Load references and rules only when the task type requires them
- [ ] **Phase 5: Effort-Level Routing** - Route simple tasks to smaller models, reserve Opus for planning and complex work
- [ ] **Phase 6: Context7 Standardization** - Standardize library-aware generation pipeline across all skills
- [ ] **Phase 7: Library Fallback and Version Detection** - Add fallback chain when Context7 fails and auto-detect library versions
- [ ] **Phase 8: Wave-Based Parallel Execution** - Enable concurrent task execution with file-conflict detection

## Phase Details

### Phase 1: Skill Structure Normalization
**Goal**: Every skill file follows the same readable structure, making the codebase maintainable and ready for systematic optimization
**Depends on**: Nothing (first phase)
**Requirements**: READ-01, READ-02
**Success Criteria** (what must be TRUE):
  1. All 12 skill files follow the same section order: frontmatter, guards, execution steps, output format
  2. Each skill clearly separates its shell layer (argument parsing, validation, prerequisites) from its execution layer (business logic)
  3. A developer forking the project can understand any skill's structure by reading one skill first
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Add canonical structure enforcement tests to smoke-integrity.test.js
- [x] 01-02-PLAN.md — Normalize batch 1: init, scan, write-code, test, fix-bug, conventions
- [x] 01-03-PLAN.md — Normalize batch 2: plan, new-milestone, complete-milestone, what-next, fetch-doc, update

### Phase 2: Cross-Skill Deduplication
**Goal**: Shared content that currently repeats across 12 skills is extracted into micro-templates, eliminating redundant token consumption at the source
**Depends on**: Phase 1
**Requirements**: TOKN-01
**Success Criteria** (what must be TRUE):
  1. Common instructions that appeared in 3+ skills are extracted into shared micro-templates referenced by all applicable skills
  2. No skill file contains duplicated blocks of text that exist identically in another skill
  3. Updating a shared instruction requires changing exactly one file, not 12
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md — Create guard micro-templates, inlineGuardRefs utility, and TDD tests
- [ ] 02-02-PLAN.md — Apply guard deduplication to all 12 skill files

### Phase 3: Prompt Prose Compression
**Goal**: Workflow prose is trimmed by 30-40% without losing any behavioral instructions, reducing token cost on every invocation
**Depends on**: Phase 2
**Requirements**: TOKN-02
**Success Criteria** (what must be TRUE):
  1. Total token count across all skill files is reduced by at least 30% compared to pre-optimization baseline
  2. All behavioral instructions (things the AI must DO) are preserved -- only structural prose, filler text, and redundant explanations are removed
  3. Skills produce identical outputs on a set of representative test invocations before and after compression
**Plans**: 6 plans

Plans:
- [x] 03-01-PLAN.md — Install js-tiktoken, create token counting script, capture baseline
- [x] 03-02-PLAN.md — Compress 4 largest workflows (new-milestone, write-code, plan, fix-bug)
- [x] 03-03-PLAN.md — Compress remaining 6 workflows (test, complete-milestone, scan, init, what-next, conventions)
- [x] 03-04-PLAN.md — Compress 12 command/skill files
- [x] 03-05-PLAN.md — Compress 7 non-guard reference files
- [ ] 03-06-PLAN.md — Compress 10 template files, final measurement, and human verification

### Phase 4: Conditional Context Loading
**Goal**: Skills load references and rules only when the current task type requires them, eliminating the eager-loading anti-pattern
**Depends on**: Phase 3
**Requirements**: TOKN-03
**Success Criteria** (what must be TRUE):
  1. Reference files (rules, workflows, templates) are loaded conditionally based on task type, not dumped upfront
  2. A task that does not need framework rules (e.g., a pure utility function) does not load any framework rule files
  3. Token savings of 2000-3200 tokens per invocation are achieved for tasks that skip unnecessary references
  4. Skills that DO need references still load them correctly and produce the same quality output
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

### Phase 5: Effort-Level Routing
**Goal**: Simple tasks are routed to smaller/faster models while Opus is reserved for planning and complex reasoning, reducing cost and latency
**Depends on**: Phase 4
**Requirements**: TOKN-04
**Success Criteria** (what must be TRUE):
  1. The workflow can classify tasks by complexity level (simple, standard, complex) based on observable signals
  2. Simple tasks (e.g., rename variable, add import, fix typo) are dispatched to a smaller model
  3. Complex tasks (e.g., multi-file refactoring, architecture decisions) are routed to Opus
  4. Routing decisions are visible in plan/task output so the user can understand and override them
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Context7 Standardization
**Goal**: Every skill that generates code using external libraries follows a consistent Context7 pipeline, eliminating hallucinated API calls
**Depends on**: Phase 1
**Requirements**: LIBR-01
**Success Criteria** (what must be TRUE):
  1. Every skill that writes code using external libraries includes resolve-library-id + query-docs steps in its execution flow
  2. Context7 integration is consistent across all 12 skills -- same invocation pattern, same error handling
  3. Generated code uses correct, current API signatures for external libraries instead of hallucinated or outdated ones
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

### Phase 7: Library Fallback and Version Detection
**Goal**: Library-aware generation works reliably even when Context7 is unavailable, and library versions are automatically detected from project manifests
**Depends on**: Phase 6
**Requirements**: LIBR-02, LIBR-03
**Success Criteria** (what must be TRUE):
  1. When Context7 is unreachable or returns no results, the system falls back to project docs, then codebase examples, then training data -- in that order
  2. Library versions are automatically read from package.json, pubspec.yaml, or composer.json and passed to Context7 queries
  3. The fallback chain is transparent -- the user can see which source was used for library documentation
**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD

### Phase 8: Wave-Based Parallel Execution
**Goal**: Independent tasks within a plan execute concurrently in waves, with file-conflict detection preventing two agents from modifying the same file
**Depends on**: Phase 4
**Requirements**: PARA-01, PARA-02, PARA-03
**Success Criteria** (what must be TRUE):
  1. Tasks within a plan are topologically sorted and grouped into waves of independent tasks that can execute concurrently
  2. File-conflict detection prevents two parallel agents from modifying the same file within the same wave
  3. Shared files (barrel exports, config files, app.module.ts, layout.tsx) are correctly identified as conflict hotspots and serialized
  4. A plan with 10 independent tasks executes significantly faster (target: 50%+ time reduction) than sequential execution
  5. Wave results are correctly merged and reported as if they executed sequentially
**Plans**: TBD

Plans:
- [ ] 08-01: TBD
- [ ] 08-02: TBD

## Converter Pipeline

**Note:** Installer/Converter optimization (INST-01, INST-02) is deliberately placed last. The converter layer must handle the final skill format that emerges from Phases 1-5. Premature converter refactoring creates rework.

### Phase 9: Converter Pipeline Optimization
**Goal**: The converter layer is deduplicated with shared logic extracted into a base converter, and errors propagate clearly instead of being silently swallowed
**Depends on**: Phase 3, Phase 6
**Requirements**: INST-01, INST-02
**Success Criteria** (what must be TRUE):
  1. A base converter contains the ~80% shared logic, and platform-specific converters only override their differences
  2. Converter errors propagate clearly with descriptive messages -- no silent catches that mask failures
  3. All 5 platform outputs (Codex, Gemini, OpenCode, Copilot, Claude) are verified correct after refactoring
  4. Adding support for a new skill format change requires updating only the base converter, not all 4 platform converters
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9
Note: Phase 6 can begin after Phase 1 (does not depend on Phases 2-5).

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Skill Structure Normalization | 3/3 | Complete    | 2026-03-22 |
| 2. Cross-Skill Deduplication | 0/2 | Complete    | 2026-03-22 |
| 3. Prompt Prose Compression | 1/6 | In Progress | - |
| 4. Conditional Context Loading | 0/TBD | Not started | - |
| 5. Effort-Level Routing | 0/TBD | Not started | - |
| 6. Context7 Standardization | 0/TBD | Not started | - |
| 7. Library Fallback and Version Detection | 0/TBD | Not started | - |
| 8. Wave-Based Parallel Execution | 0/TBD | Not started | - |
| 9. Converter Pipeline Optimization | 0/TBD | Not started | - |
