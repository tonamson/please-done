# Requirements: please-done

**Defined:** 2026-04-03
**Core Value:** Consistency — all documentation, error handling, and test coverage follow established patterns

## v10.0 Requirements — Skill Repo Audit Fixes

Requirements from `SKILL_REPO_AUDIT.md`. Each maps to roadmap phases (84–87).

### Documentation & Version Consistency (Phase 84)

- [x] **DOC-01**: README.md version badge updated from `2.8.0` to match `VERSION` file (`4.0.0`)
- [x] **DOC-02**: `INTEGRATION_GUIDE.md` reference in README.md either resolves to a real file or is removed
- [x] **DOC-03**: Command docs exist in `docs/commands/` for all 16 commands — currently missing: `audit.md`, `conventions.md`, `onboard.md`, `status.md`
- [x] **DOC-04**: CHANGELOG.md updated with entries for v3.0 through v9.0 (or deprecated in favor of MILESTONES.md)

### Language & Content Cleanup (Phase 85)

- [x] **LANG-01**: `workflows/write-code.md` line 471 changed from "Vietnamese with diacritics" to "English following conventions.md prefixes"
- [x] **CLEAN-01**: `references/mermaid-rules.md` either wired into a command or removed
- [x] **CLEAN-02**: `workflows/fix-bug-v1.5.md` archived to `workflows/legacy/` or removed, with reference in `fix-bug.md:32` updated accordingly

### Error Handling Hardening (Phase 86)

- [x] **ERR-01**: `bin/plan-check.js` bare `catch {}` blocks (lines 66, 76) replaced with conditional debug logging
- [x] **ERR-02**: `bin/lib/utils.js` bare `catch` blocks (lines 140, 169, 200) replaced with conditional debug logging
- [x] **ERR-03**: `bin/lib/installers/claude.js` — all 6 `process.exit(1)` calls replaced with `throw new Error(...)`, exit handling moved to `bin/install.js`

### Test Coverage (Phase 87)

- [x] **TEST-01**: `test/smoke-onboard.test.js` created with skill structure + workflow reference + guard checks
- [x] **TEST-02**: `test/smoke-error-handling.test.js` `TARGET_FILES` expanded to include `bin/plan-check.js` and `bin/lib/utils.js` (or explicit exemptions documented)
- [x] **TEST-03**: All 1224+ existing tests still pass after all changes (0 regressions)

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| DOC-01 | 84 | Complete |
| DOC-02 | 84 | Complete |
| DOC-03 | 84 | Complete |
| DOC-04 | 84 | Complete |
| LANG-01 | 85 | Complete |
| CLEAN-01 | 85 | Complete |
| CLEAN-02 | 85 | Complete |
| ERR-01 | 86 | Complete |
| ERR-02 | 86 | Complete |
| ERR-03 | 86 | Complete |
| TEST-01 | 87 | Complete |
| TEST-02 | 87 | Complete |
| TEST-03 | 87 | Complete |
