# Phase 70: Final Verification + Cleanup — Context

## Phase Goal

Confirm zero Vietnamese remaining anywhere outside `.planning/` and run final test suite verification.

## Scope Assessment

### Verification targets

1. **All source files** (bin/, test/, commands/, scripts/, templates/, docs/, references/, workflows/, evals/, FastCode/)
2. **Root markdown files** (README.md, CHANGELOG.md, etc.)
3. **Config files** (package.json, promptfooconfig.yaml, etc.)
4. **Snapshot files** (test/snapshots/\*_/_)

### Exclusions

- `.planning/` directory (contains Vietnamese context docs by design)
- `node_modules/` (third-party code)

## Decisions (--auto defaults)

| ID   | Decision                    | Choice                                                 |
| ---- | --------------------------- | ------------------------------------------------------ |
| D-01 | Search scope                | All files except .planning/ and node_modules/          |
| D-02 | Vietnamese detection method | Diacritical character regex + known Vietnamese phrases |
| D-03 | Fix strategy                | Fix any remaining stragglers inline                    |
| D-04 | Test verification           | Run full test suite, confirm no new failures           |
| D-05 | Human review                | checkpoint:human-verify for quality review             |
