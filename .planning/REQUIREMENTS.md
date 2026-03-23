# Requirements: Please-Done Skill Audit & Bug Fixes

**Defined:** 2026-03-23
**Core Value:** Every workflow step must produce the highest quality code output while consuming the minimum tokens and time

## v1.2 Requirements

Requirements for audit and bug fix milestone. Each maps to roadmap phases.

### Skill Audit

- [x] **AUDIT-01**: Scan 12 skills tìm logic gaps, dead code, outdated references, stale version mentions
- [x] **AUDIT-02**: Scan 10 workflows tìm logic gaps, missing error handling, stale instructions, broken step references
- [x] **AUDIT-03**: Verify converter snapshots sync với source files — tất cả 48 snapshots phải match source hiện tại

### Workflow Verification

- [x] **WFLOW-01**: Verify workflow new-milestone end-to-end — init context, questioning, research spawn, requirements definition, roadmap creation, state updates
- [ ] **WFLOW-02**: Verify workflow write-code end-to-end — plan reading, task execution, effort routing, Context7 pipeline, commit flow, verification
- [x] **WFLOW-03**: Verify workflow fix-bug end-to-end — bug reproduction, diagnosis, fix application, test verification, commit flow

### Bug Fixes

- [ ] **BFIX-01**: Fix tất cả logic gaps phát hiện từ skill audit (AUDIT-01, AUDIT-02)
- [ ] **BFIX-02**: Fix tất cả sync issues phát hiện từ snapshot audit (AUDIT-03)
- [ ] **BFIX-03**: Fix tất cả logic gaps phát hiện từ workflow verification (WFLOW-01, WFLOW-02, WFLOW-03)

## v2 Requirements

Deferred to future release.

### Verification Quality

- **VQUAL-01**: Plan checker kiểm tra Truths dạng user-observable, không implementation-focused
- **VQUAL-02**: Plan checker kiểm tra mỗi Artifact có kiểm tra tự động criteria
- **VQUAL-03**: Plan checker kiểm tra design decisions được phản ánh trong task descriptions

## Out of Scope

| Feature | Reason |
|---------|--------|
| New skill creation | Milestone này audit existing, không tạo mới |
| New platform targets | Focus on quality, không mở rộng |
| Performance optimization | Audit focus, performance nếu cần sẽ là milestone riêng |
| Plan checker improvements | v1.1 just shipped, stabilize trước khi mở rộng |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUDIT-01 | Phase 14 | Complete |
| AUDIT-02 | Phase 14 | Complete |
| AUDIT-03 | Phase 14 | Complete |
| WFLOW-01 | Phase 15 | Complete |
| WFLOW-02 | Phase 15 | Pending |
| WFLOW-03 | Phase 15 | Complete |
| BFIX-01 | Phase 16 | Pending |
| BFIX-02 | Phase 16 | Pending |
| BFIX-03 | Phase 16 | Pending |

**Coverage:**
- v1.2 requirements: 9 total
- Mapped to phases: 9/9
- Unmapped: 0

---
*Requirements defined: 2026-03-23*
*Last updated: 2026-03-23 after roadmap creation*
