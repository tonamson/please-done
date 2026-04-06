# v12.1 Requirements: Quality Hardening

**Defined:** 2026-04-06
**Core Value:** Improve developer experience and match GSD quality standards across the please-done project

---

## v12.1 Requirements

### Phase 1: Command Reference Fixes

- [ ] **C-01**: Fix 5 broken command references in CLAUDE.md
  - Replace `pd:map-codebase` with `pd:scan`
  - Replace `pd:verify` with `pd:test`
  - Create lint rule for `pd:fix-bug` usage
  - Fix `lib/key-file-selector.js` path in pd:onboard
  - Fix `lib/doc-link-mapper.js` path in pd:onboard

### Phase 2: Test Infrastructure

- [ ] **C-02**: Fix test script for complete coverage
  - Update `package.json` test script to `'test/**/*.test.js'`
  - Add `test:smoke` and `test:integration` scripts
  - Add `c8` coverage tool

### Phase 3: Documentation

- [x] **C-04**: Update CHANGELOG
  - Unfreeze CHANGELOG.md or auto-generate from MILESTONES.md
  - Document v3.0 through v12.0 milestones

- [x] **H-03**: Create 4 missing command docs
  - `docs/skills/audit.md`
  - `docs/skills/conventions.md`
  - `docs/skills/onboard.md`
  - `docs/skills/status.md`

### Phase 4: Code Quality

- [ ] **H-01**: Fix bare catch blocks with proper logging
  - Add `log.warn` for consistency across catch blocks
  - Ensure all catch blocks have debug logging

- [ ] **H-02**: Refactor `process.exit(1)` in claude.js installer
  - Replace with `throw new Error()`
  - Let `bin/install.js` handle exit

### Phase 5: Project Hygiene

- [ ] **H-06**: Cleanup orphaned files
  - Archive `workflows/legacy/fix-bug-v1.5.md`
  - Wire or remove `references/mermaid-rules.md`
  - Archive `de_xuat_cai_tien.md`
  - Move `N_FIGMA_TO_HTML_NOTES.md` to `docs/notes/`
  - Create or remove `INTEGRATION_GUIDE.md` reference

### Phase 6: Cross-Platform Support

- [ ] **H-07**: Universal Cross-Runtime Support
  - Create `AGENTS.md` as source of truth
  - Create `bin/sync-instructions.js` script
  - Integrate sync into installer and postinstall
  - Add support for Cursor, Windsurf, Cline, Trae, Augment, Kilo, Antigravity

---

## Deferred (Future Milestones)

- M-01: Wave Execution (parallel plans)
- M-02: Additional runtime support (beyond initial 7)
- M-03: TypeScript SDK
- M-04: Git Branching Strategies
- M-05: Context Window Monitoring
- M-06: Developer Profiling
- M-07: Verification Debt Tracking
- M-08: Ship Command
- L-01: Automated version badge sync
- L-02: Gộp pd:next into pd:what-next
- L-03: pd:stats command
- L-04: pd:health command
- L-05: MCP Tool Discovery
- L-06: Discussion Audit Trail
- L-07: Scope Reduction Detection
- L-08: Schema Drift Detection

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| CI/CD Pipeline | Not aligned with project goals |
| Breaking changes | Must maintain backward compatibility |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| C-01 | Phase 125 | Pending |
| C-02 | Phase 126 | Pending |
| C-04 | Phase 127 | Complete |
| H-01 | Phase 128 | Pending |
| H-02 | Phase 129 | Pending |
| H-03 | Phase 130 | Complete |
| H-06 | Phase 131 | Pending |
| H-07 | Phase 132 | Pending |

**Coverage:**
- v12.1 requirements: 8 total
- Phases: 125-132 (8 phases)
- Unmapped: 0

---

*Defined: 2026-04-06*
*Source: list-cai-thien.md*
