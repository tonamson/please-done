# Requirements: please-done

**Defined:** 2026-04-03
**Core Value:** Reliability — skills run without silent failures or uncaught exceptions

## v9.0 Requirements — Bug Audit & Robustness

Requirements for the v9.0 milestone. Each maps to roadmap phases (81–83).

### Input Robustness (Phase 81)

- [ ] **ROBUST-01**: `extractReadingRefs(content)` in `utils.js` guards against null/undefined `content` input — returns `[]` instead of throwing
- [ ] **ROBUST-02**: `classifyRefs(executionContext)` in `utils.js` guards against null/undefined `executionContext` — returns `[]` instead of throwing
- [ ] **ROBUST-03**: All public-facing utility functions in `utils.js` have consistent input validation for required string parameters

### Error Handling (Phase 82)

- [ ] **ERR-01**: `fileHash()` in `manifest.js`/`utils.js` wraps `fs.readFileSync()` with try-catch; returns `null` and logs warning on I/O failure
- [ ] **ERR-02**: `inlineWorkflow()` wraps `fs.readFileSync()` calls with try-catch; throws descriptive error on missing file instead of crashing with raw ENOENT

### Nyquist Validation Debt (Phase 82)

- [ ] **NYQUIST-01**: VALIDATION.md created for Phase 77 (3-strike lint recovery) with `nyquist_compliant: true`
- [ ] **NYQUIST-02**: VALIDATION.md created for Phase 78 (codebase map staleness) with `nyquist_compliant: true`
- [ ] **NYQUIST-03**: Phase 76 VALIDATION.md updated — `nyquist_compliant: false` → `true` after test coverage confirmed
- [ ] **NYQUIST-04**: Phase 79 VALIDATION.md updated — `nyquist_compliant: false` → `true` after test coverage confirmed
- [ ] **NYQUIST-05**: Phase 80 VALIDATION.md updated — `nyquist_compliant: false` → `true` after test coverage confirmed

### Log Infrastructure Wiring (Phase 83)

- [ ] **LOG-WIRE-01**: `appendLogEntry()` called at execution start in `write-code.md` agent path (log event: `agent_start`)
- [ ] **LOG-WIRE-02**: `appendLogEntry()` called at execution end in `write-code.md` agent path (log event: `agent_complete`)
- [ ] **LOG-WIRE-03**: `appendLogEntry()` called at execution start + end in `fix-bug.md` agent path
- [ ] **LOG-WIRE-04**: Log wiring does not break any existing test (1224 passing baseline preserved)
