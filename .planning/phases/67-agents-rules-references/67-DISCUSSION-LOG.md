# Phase 67 — Discussion Log

## Mode: --auto (all gray areas auto-selected, recommended defaults chosen)

### Gray Areas Identified

| ID | Gray Area | Recommended | Auto-Selected |
|----|-----------|-------------|---------------|
| G-01 | Agent file count: roadmap says 8, actually 16 have Vietnamese | Translate all 16 | Yes |
| G-02 | YAML file translation: preserve structure vs translate all | Translate values/comments only, preserve keys/structure | Yes |
| G-03 | Guard file scope: some are 1-line with minimal Vietnamese | Translate all regardless of size | Yes |
| G-04 | Batching: 39 files across 2 plans | Keep Plan01/Plan02 split, update agent count to 16 | Yes |
| G-05 | Test impact: ~35+ Vietnamese assertions in smoke-integrity | Update all Vietnamese test assertions to English | Yes |
| G-06 | Non-diacritical detection strategy | Full file review, not diacritic-based only | Yes |

### Decisions Made (Auto)

- **G-01 → D-07**: All 16 agent files will be translated. The roadmap's count of 8 was based on diacritic scans only. Scouting revealed 11 additional files with non-diacritical Vietnamese (same pattern as Phase 66's fix-bug.md).

- **G-02 → D-08**: YAML files (security-rules.yaml, gadget-chain-templates.yaml) will have only human-readable values and comments translated. YAML keys, anchors, aliases, and structural elements preserved.

- **G-03 → D-09**: All 4 guard files translated. Even guard-context.md (1 line) contains Vietnamese text that should be English.

- **G-04 → D-10**: Retain roadmap's Plan 01 (agents+rules) / Plan 02 (references) structure. Plan 01 Task 1 scope updated from 8 to 16 agent files.

- **G-05 → D-11**: Test assertions in smoke-integrity.test.js will be updated alongside translations. Guard-related tests (lines 390-459) and template/convention tests (lines 579-684) have Vietnamese strings.

- **G-06 → D-12**: Apply full-file translation review to all files, including those showing zero diacritics. Phase 66 demonstrated that non-diacritical Vietnamese is a significant presence.

### Cross-Reference
- No pending todos matched phase 67
- Prior context loaded from Phase 65 (D-01 through D-10) and Phase 66 (D-01 through D-12)
