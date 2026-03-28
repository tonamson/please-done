# Vietnamese to English Migration Plan

> Purpose: Document the scope and strategy for translating the entire please-done repo from Vietnamese to English
> Date: March 2026

## Scope Analysis

| Category              | Files    | Est. Lines   | Translation Weight                                |
| --------------------- | -------- | ------------ | ------------------------------------------------ |
| workflows/            | 13       | 3,610        | Heavy — main workflow content                    |
| commands/pd/ (skills) | 14       | 1,155        | Heavy — descriptions, prerequisites, rules       |
| commands/pd/rules/    | 8        | 1,196        | Medium — coding rules, security checklists       |
| commands/pd/agents/   | 16       | 968          | Medium — ~8 files have Vietnamese                |
| references/           | 15       | 1,472        | Medium — reference docs, checklists              |
| templates/            | 12       | 789          | Medium — placeholder text, section headers       |
| bin/ (JS source)      | 43       | ~3,166       | Light — JSDoc, comments, template strings        |
| test/ (JS)            | 40       | varies       | Light — test descriptions, assertion strings     |
| test/snapshots/       | 56       | —            | Auto-generated from skills → regenerate          |
| docs/                 | 14       | 398          | Medium — command reference, workflow overview    |
| Root \*.md            | 12       | varies       | Medium — README, guides, changelog               |
| evals/                | 4        | varies       | Light — config, wrapper scripts                  |
| **TOTAL**             | **~247** | **~14,000+** |                                                  |

## Key Dependencies

```
commands/pd/*.md ──→ test/snapshots/*/*.md (auto-generated via node test/generate-snapshots.js)
bin/lib/*.js strings ──→ test/*.test.js assertions (must update together)
CLAUDE.md ──→ all skills read this for language convention
```

## Phase Plan (6 phases)

### Phase 65: Skills + Config Foundation

**Why first:** Skills are the source of truth for 56 auto-generated snapshot files. Translating skills first lets us regenerate all snapshots in one step.

**Plan 01 — Translate 14 skill files + CLAUDE.md** (Wave 1)

- Task 1: Update `CLAUDE.md` to English convention. Translate 7 smaller skills: `scan.md`, `init.md`, `conventions.md`, `what-next.md`, `update.md`, `fetch-doc.md`, `research.md`
- Task 2: Translate 7 larger skills: `plan.md`, `write-code.md`, `test.md`, `fix-bug.md`, `audit.md`, `complete-milestone.md`, `new-milestone.md`

**Plan 02 — Regenerate snapshots** (Wave 2)

- Task 1: Run `node test/generate-snapshots.js` → verify 56 snapshots updated
- Task 2: Run `node --test test/smoke-snapshot.test.js` → all snapshot tests pass

---

### Phase 66: Workflow Translation

**Why:** Workflows contain the heaviest Vietnamese content (3,610 lines total). Two plans split by file size.

**Plan 01 — 7 smaller workflows** (Wave 1)

- Task 1: Translate `init.md` (168L), `scan.md` (108L), `conventions.md` (81L), `what-next.md` (91L)
- Task 2: Translate `research.md` (91L), `complete-milestone.md` (272L), `test.md` (247L)

**Plan 02 — 6 larger workflows** (Wave 1, parallel)

- Task 1: Translate `write-code.md` (471L), `fix-bug.md` (408L)
- Task 2: Translate `fix-bug-v1.5.md` (438L), `plan.md` (524L), `new-milestone.md` (404L), `audit.md` (307L)

---

### Phase 67: Agents + Rules + References

**Why:** Supporting definition files. All independent of each other.

**Plan 01 — Agents + Rules** (Wave 1)

- Task 1: Translate 8 agent files with Vietnamese content (pd-bug-janitor, pd-code-detective, pd-doc-specialist, pd-fact-checker, pd-fix-architect, pd-repro-engineer, pd-sec-reporter, pd-sec-scanner)
- Task 2: Translate 8 rules files (general.md, nestjs.md, nextjs.md, wordpress.md, flutter.md, solidity.md, solidity-refs/templates.md, solidity-refs/audit-checklist.md)

**Plan 02 — References** (Wave 1, parallel)

- Task 1: Translate 9 reference .md files (conventions, context7-pipeline, prioritization, questioning, security-checklist, state-machine, ui-brand, verification, mermaid-rules)
- Task 2: Translate 2 reference .yaml files (security-rules.yaml, gadget-chain-templates.yaml) + 4 guard files (guard-context.md, guard-fastcode.md, guard-context7.md, guard-valid-path.md)

---

### Phase 68: Templates + Docs + Root Files

**Why:** Documentation and template files. Independent of code.

**Plan 01 — Templates + Docs** (Wave 1)

- Task 1: Translate 12 template files (current-milestone, management-report, plan, progress, project, requirements, research, roadmap, state, tasks, verification-report, security-fix-phase)
- Task 2: Translate 14 docs files (COMMAND_REFERENCE.md, WORKFLOW_OVERVIEW.md, docs/commands/\*.md)

**Plan 02 — Root MD files** (Wave 1, parallel)

- Task 1: Translate root files: README.md, INTRODUCTION.md, INTEGRATION_GUIDE.md, CHANGELOG.md, VERSION_BUMP_GUIDE.md, BENCHMARK_RESULTS.md
- Task 2: Translate remaining: BEFORE_END_FIX_INSTALL.md, FINAL_optimize-repo.md, N_FIGMA_TO_HTML_NOTES.md, Update_test_skills.md + evals/ files (4)

---

### Phase 69: JS Source Code + Tests

**Why:** JS files have Vietnamese in JSDoc, comments, and string literals. Tests have assertions matching those strings. Must update together.

**Plan 01 — JS source batch 1** (Wave 1)

- Task 1: Translate bin/lib/ core modules: utils.js, report-filler.js, outcome-router.js, research-store.js, index-generator.js, audit-logger.js, bug-memory.js
- Task 2: Translate bin/lib/ remaining: regression-analyzer.js, manifest.js, evidence-protocol.js, confidence-scorer.js, installer-utils.js + converters/codex.js

**Plan 02 — JS source batch 2 + installers** (Wave 1, parallel)

- Task 1: Translate bin/ top-level: install.js, plan-check.js, route-query.js, update-research-index.js, generate-pdf-report.js
- Task 2: Translate bin/lib/installers/ (claude.js, copilot.js, gemini.js) + evals/\*.js

**Plan 03 — Test files** (Wave 2, after JS source)

- Task 1: Update test assertion strings to match new English JS output (~12 affected test files)
- Task 2: Run full test suite `node --test` → verify 1103+ tests pass

---

### Phase 70: Final Verification + Cleanup

**Why:** Confirm zero Vietnamese remaining and everything works.

**Plan 01 — Verification** (Wave 1)

- Task 1: Run comprehensive grep for Vietnamese patterns across entire project (excluding .planning). List any remaining files. Fix stragglers.
- Task 2: Regenerate snapshots (`node test/generate-snapshots.js`). Run full test suite (`node --test`). Confirm 0 fail.
- Task 3: checkpoint:human-verify — user reviews sample files to confirm translation quality

---

## Translation Rules

1. **Preserve meaning exactly** — translate Vietnamese to natural English, don't paraphrase or restructure
2. **Keep technical terms** — `commit`, `lint`, `build`, `deploy`, `phase`, `milestone`, `task` stay English
3. **Keep code identifiers** — variable names, function names, class names, file paths unchanged
4. **Step numbering** — Vietnamese step labels → `Step 1:`, `Step 1.5:`, etc.
5. **Section headers** — Vietnamese section headers → `## Step 1: Identify task`
6. **Error messages** — Translate Vietnamese in string literals to English equivalents
7. **JSDoc** — Translate Vietnamese descriptions to English
8. **Comments** — Translate inline Vietnamese comments to English
9. **YAML frontmatter `description:`** — Translate to English
10. **DO NOT translate** file paths, CLI commands, regex patterns, code blocks

## Estimated Effort

- 6 phases, 11 plans, ~25 tasks
- Phases 65–68: Translation work (can heavily parallelize)
- Phase 69: Code + tests (some sequencing needed)
- Phase 70: Verification

## Risk Mitigation

- **Snapshot drift**: Regenerate after skill translation → tests catch issues
- **Test breakage**: JS string changes must align with test assertions → Phase 69 handles together
- **Missed files**: Phase 70 grep sweep catches stragglers
- **Meaning loss**: CLAUDE.md convention update prevents future Vietnamese, checkpoint for quality review
