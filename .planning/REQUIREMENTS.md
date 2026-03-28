# Requirements: Standalone Test Mode

**Defined:** 2026-03-29
**Core Value:** Every workflow step must produce the highest quality code output while consuming the minimum tokens and time

## v7.0 Requirements

Requirements for adding `pd:test --standalone` mode. Each maps to roadmap phases.

### Standalone Flow

- [ ] **TEST-01**: User can run `pd:test --standalone [path]` to test a specific module without milestone/plan/write-code
- [ ] **TEST-02**: User can run `pd:test --standalone --all` to test entire project source
- [ ] **TEST-03**: Standalone flow auto-detects tech stack when CONTEXT.md is missing (NestJS/WordPress/Solidity/Flutter/Frontend)

### Guards & Routing

- [ ] **GUARD-01**: `pd:test` standard flow guards remain unchanged — task ✅ required, CONTEXT.md required
- [ ] **GUARD-02**: `pd:test --standalone` bypasses task status guards + uses conditional CONTEXT.md check
- [ ] **GUARD-03**: FastCode/Context7 changed to soft warnings with fallback (Grep/Read for FastCode, skip for Context7)

### Reporting & Bugs

- [ ] **REPORT-01**: Standalone flow creates `STANDALONE_TEST_REPORT_[timestamp].md` in `.planning/reports/`
- [ ] **REPORT-02**: Standalone bugs use `Patch version: standalone` format — not tied to any milestone

### System Integration

- [ ] **SYNC-01**: `state-machine.md` updated with standalone prerequisites row + side branch
- [ ] **SYNC-02**: `what-next.md` detects standalone test reports and standalone bugs
- [ ] **SYNC-03**: `complete-milestone.md` skips standalone bugs (doesn't block milestone completion)

### Recovery

- [ ] **RECOV-01**: Standalone flow detects interrupted sessions (uncommitted test files, existing reports) and offers resume/rewrite

## Future Requirements

- `pd:onboard` skill for joining existing projects mid-stream (from de_xuat_cai_tien.md P1-1)
- Integration test for skill chains (from de_xuat_cai_tien.md P1-5)
- `pd:status` dashboard skill (from de_xuat_cai_tien.md P2-2)

## Out of Scope

| Feature | Reason |
| --- | --- |
| Modify standard test flow | `--standalone` is a parallel flow, standard flow stays 100% unchanged |
| Modify shared guard files | `guard-context.md`, `guard-fastcode.md`, `guard-context7.md` are shared — only change how test.md references them |
| Add new JS library modules | This milestone only modifies markdown skill/workflow/reference files |
| Guard fixes for scan/plan/write-code | P0-1 from de_xuat_cai_tien.md — deferred to separate milestone |

## Traceability

| REQ-ID | Phase | Status |
| --- | --- | --- |
| TEST-01 | — | — |
| TEST-02 | — | — |
| TEST-03 | — | — |
| GUARD-01 | — | — |
| GUARD-02 | — | — |
| GUARD-03 | — | — |
| REPORT-01 | — | — |
| REPORT-02 | — | — |
| SYNC-01 | — | — |
| SYNC-02 | — | — |
| SYNC-03 | — | — |
| RECOV-01 | — | — |
