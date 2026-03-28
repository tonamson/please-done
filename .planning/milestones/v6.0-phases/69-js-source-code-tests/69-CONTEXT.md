# Phase 69: JS Source Code + Tests — Context

## Phase Goal
Translate Vietnamese in JS source code (comments, JSDoc, string literals) and synchronize test assertions to match new English output.

## Scope Assessment

### JS Source Files with Diacritical Vietnamese (18 files, ~4505 lines)
| File | Diacritics | Lines |
|------|-----------|-------|
| bin/install.js | 48 | 342 |
| bin/lib/report-filler.js | 58 | 219 |
| bin/lib/regression-analyzer.js | 38 | 204 |
| bin/lib/utils.js | 35 | 439 |
| bin/lib/installers/claude.js | 36 | 355 |
| bin/lib/manifest.js | 15 | 228 |
| bin/lib/converters/codex.js | 15 | 146 |
| bin/lib/plan-checker.js | 12 | 1071 |
| bin/lib/outcome-router.js | 9 | 211 |
| bin/lib/platforms.js | 7 | 192 |
| bin/lib/installers/copilot.js | 6 | 140 |
| bin/lib/installers/codex.js | 6 | 121 |
| bin/lib/installers/gemini.js | 5 | 143 |
| bin/lib/installers/opencode.js | 4 | 87 |
| bin/lib/checkpoint-handler.js | 3 | 89 |
| bin/lib/evidence-protocol.js | 3 | 172 |
| bin/lib/logic-sync.js | 2 | 254 |
| bin/lib/debug-cleanup.js | 1 | 92 |

### JS Source Files with Non-Diacritical Vietnamese Only (15 files)
| File | Non-Diacritical Matches |
|------|------------------------|
| bin/lib/research-store.js | 21 |
| bin/lib/resource-config.js | 16 |
| bin/lib/parallel-dispatch.js | 13 |
| bin/lib/smart-selection.js | 9 |
| bin/lib/session-delta.js | 6 |
| bin/lib/bug-memory.js | 5 |
| bin/lib/confidence-scorer.js | 4 |
| bin/lib/generate-diagrams.js | 4 |
| bin/lib/installer-utils.js | 4 |
| bin/lib/repro-test-generator.js | 4 |
| bin/lib/audit-logger.js | 3 |
| bin/lib/session-manager.js | 3 |
| bin/lib/gadget-chain.js | 1 |
| bin/lib/index-generator.js | 1 |
| bin/lib/mermaid-validator.js | 1 |

### Files Confirmed Clean (0 diacritics, 0 non-diacritical)
- bin/lib/converters/base.js, copilot.js, gemini.js, opencode.js
- bin/lib/pdf-renderer.js, truths-parser.js
- bin/generate-pdf-report.js, plan-check.js, route-query.js, update-research-index.js

### Test Files with Vietnamese (14 files, ~6435 lines)
| File | Diacritics | Lines |
|------|-----------|-------|
| test/smoke-state-machine.test.js | 459 | 1737 |
| test/smoke-all-platforms.test.js | 84 | 558 |
| test/smoke-converters.test.js | 81 | 349 |
| test/smoke-installers.test.js | 80 | 313 |
| test/benchmark.js | 54 | 259 |
| test/smoke-report-filler.test.js | 55 | 244 |
| test/smoke-utils.test.js | 53 | 438 |
| test/smoke-integrity.test.js | 34 | 1199 |
| test/smoke-regression-analyzer.test.js | 32 | 261 |
| test/smoke-evidence-protocol.test.js | 21 | 241 |
| test/smoke-outcome-router.test.js | 7 | 192 |
| test/smoke-parallel-dispatch.test.js | 5 | 321 |
| test/smoke-checkpoint-handler.test.js | 2 | 108 |
| test/smoke-debug-cleanup.test.js | 1 | 215 |

### Grand Total
- **33 JS source files** (18 diacritical + 15 non-diacritical only)
- **14 test files**
- **~10,940 lines total**

## Decisions

<decisions>

### D-01: Translate comments, JSDoc, and string literals only
Preserve all code logic, variable names, function names, module exports, require paths. Only translate human-readable text in comments (// and /* */), JSDoc blocks, and string literals that contain Vietnamese.

### D-02: Non-diacritical Vietnamese requires full file review
15 source files have Vietnamese without diacritics. Grep-based verification alone is insufficient — full review required for these files. (Carries forward from Phase 65-68 D-07.)

### D-03: Test assertions must match translated source output
When source code string literals change (e.g., error messages, status messages), corresponding test assertions must be updated. Source and test changes should happen together to maintain passing tests.

### D-04: TRANS-11 already completed — skip evals/
evals/ files were translated in Phase 68 per D-09. Phase 69 scope excludes evals/ entirely.

### D-05: Terminology consistency
"Bước N" → "Step N", and all other established terminology from Phase 65-68 carries forward.

### D-06: smoke-state-machine.test.js special handling
Largest test file (459 diacritics, 1737 lines). Contains extensive Vietnamese in test descriptions and assertion strings. Must be handled carefully — may need dedicated task.

### D-07: Converter/installer source+test co-translation
converters/codex.js changes affect smoke-converters.test.js assertions. installer changes affect smoke-installers.test.js. These should be translated together.

### D-08: Clean files skip
Files confirmed clean (0 diacritics, 0 non-diacritical Vietnamese) are excluded from translation scope: converters/base.js, copilot.js, gemini.js, opencode.js, pdf-renderer.js, truths-parser.js, generate-pdf-report.js, plan-check.js, route-query.js, update-research-index.js.

### D-09: Test descriptions translate to English
All `describe()` and `it()` string arguments should be translated to English. This is cosmetic but aligns with the project language convention.

### D-10: Non-diacritical matches may include false positives
The heuristic grep for non-diacritical Vietnamese catches common Vietnamese words without diacritics. Some matches may be English words that happen to match (e.g., "nap" in English). Each file needs human-level review.

### D-11: Roadmap plan structure governs task breakdown
Follow ROADMAP.md's 3-plan structure: Plan 01 (core modules), Plan 02 (top-level + installers), Plan 03 (test files).

### D-12: Full test suite validation after all plans
After Plan 03, run `node --test` to verify all 1103+ tests pass with 0 failures.

</decisions>

## Deferred Ideas
None.

## Canonical Refs
- .planning/ROADMAP.md (Phase 69 section)
- .planning/REQUIREMENTS.md (TRANS-10, SYNC-02)
- CLAUDE.md (project language convention)
