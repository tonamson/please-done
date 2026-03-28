# Phase 68 — Discussion Log

## Mode: --auto (all gray areas auto-selected, recommended defaults chosen)

### Gray Areas Identified

| ID | Gray Area | Recommended | Auto-Selected |
|----|-----------|-------------|---------------|
| G-01 | Template placeholders: translate surrounding text or entire template | Translate text, preserve {placeholders} and [variables] | Yes |
| G-02 | Evals scope: roadmap Plan 02 includes evals but TRANS-11 maps to Phase 69 | Include in Phase 68 per roadmap plan structure | Yes |
| G-03 | Change_vietnamese_to_english.md: translate or skip (meta-doc) | Translate like any root file | Yes |
| G-04 | CLAUDE.md: translate or skip | Skip — already English from Phase 65 | Yes |
| G-05 | Test assertions: update or defer | Defer to Phase 69 — current Vietnamese is converter tests, not content checks | Yes |
| G-06 | Batching: 42 files across 2 plans | Keep roadmap Plan01/Plan02 split | Yes |

### Decisions Made (Auto)

- **G-01 → D-08**: Templates have placeholder markers ({N}, [date], <!-- sections -->) that downstream GSD tools populate. Only the Vietnamese description text around placeholders is translated. All placeholder syntax preserved verbatim.

- **G-02 → D-09**: Include evals/ in Phase 68. The roadmap plan explicitly lists "evals/ files" in Plan 02 Task 2. This supersedes the TRANS-11 → Phase 69 mapping in the requirements traceability table, which appears to be an oversight.

- **G-03 → D-10**: Change_vietnamese_to_english.md is a migration planning document. Has 3 diacritical Vietnamese lines. Translate per standard process.

- **G-04 → D-11**: CLAUDE.md was translated in Phase 65 and has 0 Vietnamese content. Skip entirely.

- **G-05 → D-12**: The 34 remaining Vietnamese lines in smoke-integrity.test.js are test descriptions for converter tests. They don't test template/doc content and won't break from Phase 68 translations. Defer to Phase 69 (TRANS-10).

- **G-06**: Keep Plan 01 (templates + docs) / Plan 02 (root + evals) split per roadmap.

### Cross-Reference
- No pending todos matched phase 68
- Prior context loaded from Phase 65, 66, 67
