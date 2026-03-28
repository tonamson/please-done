# Phase 67 — Agents + Rules + References — Context

## Phase Goal
Translate supporting definition files — agents, coding rules, and reference docs — from Vietnamese to English.

## Requirements Coverage
- **TRANS-04**: Agent definition files (commands/pd/agents/)
- **TRANS-05**: Coding rules files (commands/pd/rules/)
- **TRANS-06**: Reference documentation (references/)

## Scope Assessment

### Agent Files (commands/pd/agents/) — 16 files, ~968 lines
Roadmap listed 8 agent files, but scouting reveals **all 16** contain Vietnamese:
- 5 files with diacritics: pd-bug-janitor(42), pd-code-detective(16), pd-doc-specialist(17), pd-fix-architect(27), pd-repro-engineer(14)
- 11 files with non-diacritical Vietnamese only: pd-codebase-mapper(16), pd-evidence-collector(25), pd-fact-checker(21), pd-feature-analyst(14), pd-planner(22), pd-regression-analyzer(18), pd-research-synthesizer(20), pd-sec-fixer(16), pd-sec-reporter(40), pd-sec-scanner(43), pd-security-researcher(13)

### Rules Files (commands/pd/rules/) — 8 files, ~1196 lines
All 8 have Vietnamese diacritics: flutter(22), general(51), nestjs(20), nextjs(29), solidity(44), wordpress(26), audit-checklist(113), templates(57)

### Reference Files (references/) — 15 files, ~2713 lines
- 7 with diacritics: conventions(58), prioritization(38), questioning(43), security-checklist(170), security-rules.yaml(288), state-machine(77), ui-brand(124)
- 7 with non-diacritical Vietnamese only: context7-pipeline(17), gadget-chain-templates.yaml(7), guard-context7(2), guard-fastcode(1), guard-valid-path(1), mermaid-rules(42), verification(125)
- 1 with non-diacritical Vietnamese (1 line): guard-context.md

**Grand total: 39 files, ~4877 lines**

## Decisions

### Carried Forward from Phase 65/66

- **D-01: Scope boundaries** — Translate only user-facing Vietnamese text. Preserve code identifiers, file paths, XML tags, frontmatter keys, and placeholder variables.
- **D-02: Preserve structure** — Keep frontmatter, XML tags, markdown formatting, YAML keys, and template placeholders exactly as-is.
- **D-03: No file renames** — File names stay unchanged (Vietnamese or otherwise).
- **D-04: Step numbering** — "Bước N" → "Step N" consistently.
- **D-05: Terminology** — Standardize recurring terms: "Kiểm tra" → "Check/Verify", "Kết quả" → "Result", "Yêu cầu" → "Requirement", "Ghi nhận" → "Record/Note", etc.
- **D-06: Diacritic verification** — Post-translation grep for diacritics to confirm zero remain.

### New for Phase 67

- **D-07: Agent scope expansion** — Translate all 16 agent files (not roadmap's 8). The roadmap underestimated because 11 files use non-diacritical Vietnamese.
- **D-08: YAML translation approach** — For security-rules.yaml (288 diacritics) and gadget-chain-templates.yaml (7 non-diacritical): translate human-readable string values and comments only. Preserve YAML keys, structure, anchors, and aliases.
- **D-09: Guard file translation** — Translate all 4 guard files regardless of size. guard-context.md is only 1 line but contains Vietnamese.
- **D-10: Batching strategy** — Keep roadmap's Plan 01 (agents + rules) / Plan 02 (references) split. Update Plan 01 Task 1 from 8 → 16 agent files.
- **D-11: Test assertion updates** — smoke-integrity.test.js has ~35 diacritical Vietnamese lines + many non-diacritical Vietnamese assertions. Key areas to update:
  - Lines 390-415: guard micro-template assertions check for Vietnamese content (`ton tai|ket noi|hop le`) — must update to match English translations
  - Lines 420-459: guard reference/deduplication test descriptions in Vietnamese
  - Lines 579-684: template/convention test messages in Vietnamese
  - All assert message strings with Vietnamese text
- **D-12: Non-diacritical detection** — Use full file review for all files, not just diacritic-based detection (lesson from Phase 66 fix-bug.md).

## Plan Structure (from Roadmap)
- **Plan 01 — Agents + Rules**: Task 1 = 16 agent files, Task 2 = 8 rules files
- **Plan 02 — References**: Task 1 = 9 .md reference files, Task 2 = 2 .yaml + 4 guard files
- **Test updates**: Include in each plan as final task

## Prior Art
- Phase 65: Established translation patterns for skills + config files
- Phase 66: Refined patterns for larger workflow files (write-code.md, fix-bug.md, etc.)
- Temp file strategy: create `.tmp` then `mv` to avoid partial writes
