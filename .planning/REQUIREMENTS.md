# Requirements: Vietnamese → English Migration

**Defined:** 2026-03-28
**Core Value:** Every workflow step must produce the highest quality code output while consuming the minimum tokens and time

## v6.0 Requirements

Requirements for full Vietnamese-to-English migration. Each maps to roadmap phases.

### Translation

- [ ] **TRANS-01**: Translate 14 skill files (commands/pd/*.md) from Vietnamese to English
- [ ] **TRANS-02**: Update CLAUDE.md language convention from Vietnamese to English
- [ ] **TRANS-03**: Translate 13 workflow files (workflows/*.md) from Vietnamese to English
- [ ] **TRANS-04**: Translate 8 agent files with Vietnamese content to English
- [ ] **TRANS-05**: Translate 8 rules files to English
- [ ] **TRANS-06**: Translate 15 reference files (.md + .yaml) to English
- [ ] **TRANS-07**: Translate 12 template files to English
- [ ] **TRANS-08**: Translate 14 docs files to English
- [ ] **TRANS-09**: Translate 12 root .md files to English
- [ ] **TRANS-10**: Translate Vietnamese JSDoc, comments, and string literals in ~43 bin/ JS files to English
- [ ] **TRANS-11**: Translate Vietnamese in ~4 evals/ files to English

### Synchronization

- [ ] **SYNC-01**: Regenerate 56 snapshot files after skill translation
- [ ] **SYNC-02**: Update test assertion strings to match new English JS output

### Verification

- [ ] **VERIF-01**: Zero Vietnamese text remaining outside `.planning/` (grep sweep)
- [ ] **VERIF-02**: Full test suite passes (1103+ tests, 0 failures)
- [ ] **VERIF-03**: Human review confirms translation quality

## Future Requirements

None — this is a one-time migration milestone.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Translate `.planning/` folder | Explicitly excluded per user request — planning artifacts stay in Vietnamese |
| Restructure or rename files | Migration is language-only, not structural |
| Refactor code logic | Only translate text, preserve all behavior |
| Add new features | Pure translation milestone, no functional changes |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TRANS-01 | Pending | Pending |
| TRANS-02 | Pending | Pending |
| TRANS-03 | Pending | Pending |
| TRANS-04 | Pending | Pending |
| TRANS-05 | Pending | Pending |
| TRANS-06 | Pending | Pending |
| TRANS-07 | Pending | Pending |
| TRANS-08 | Pending | Pending |
| TRANS-09 | Pending | Pending |
| TRANS-10 | Pending | Pending |
| TRANS-11 | Pending | Pending |
| SYNC-01 | Pending | Pending |
| SYNC-02 | Pending | Pending |
| VERIF-01 | Pending | Pending |
| VERIF-02 | Pending | Pending |
| VERIF-03 | Pending | Pending |

**Coverage:**
- v6.0 requirements: 16 total
- Mapped to phases: 0
- Unmapped: 16 ⚠️

---
*Requirements defined: 2026-03-28*
*Last updated: 2026-03-28 after milestone v6.0 started*
