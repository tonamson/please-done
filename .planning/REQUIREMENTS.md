# Requirements: Please-Done v1.5

**Defined:** 2026-03-24
**Core Value:** Every workflow step must produce the highest quality code output while consuming the minimum tokens and time

## v1.5 Requirements

Requirements cho milestone Nang cap Skill Fix-Bug. Moi requirement map vao roadmap phases.

### Dieu tra & Tai hien

- [x] **REPRO-01**: AI tu dong tao skeleton test case tai hien loi theo stack (NestJS/Flutter/Generic) trong `.planning/debug/repro/`
- [x] **REGR-01**: AI phan tich module phu thuoc qua FastCode call chain (fallback BFS) va bao cao toi da 5-10 files bi anh huong

### Don dep & An toan

- [x] **CLEAN-01**: AI don dep debug log co marker `[PD-DEBUG]` truoc commit, hoi user truoc khi xoa
- [ ] **LOGIC-01**: AI danh gia ban sua co thay doi business logic/kien truc khong bang heuristics
- [x] **SEC-01**: AI lien ket canh bao bao mat tu pd:scan cho file bi loi (max 3 canh bao, freshness 7 ngay)

### Bao cao & Kien thuc

- [ ] **RPT-01**: Khi logic thay doi (LOGIC-01 = CO), tu dong cap nhat Mermaid diagram trong report + tuy chon PDF re-render
- [ ] **PM-01**: AI de xuat 1-2 rule moi cho CLAUDE.md sau khi fix, hoi user truoc khi append

## v2 Requirements

Deferred sang milestone sau. Tracked nhung khong trong roadmap hien tai.

### Mo rong Stack

- **REPRO-02**: Reproduction test cho WordPress (PHPUnit) va Solidity (Hardhat test)
- **REGR-02**: Auto-fix cascade khi regression analysis da chung minh gia tri

### Nang cao

- **LOGIC-02**: AST-based change detection thay heuristics khi can do chinh xac cao hon
- **RPT-02**: Tu dong chay reproduction test khi co test infrastructure chuan

## Out of Scope

| Feature | Reason |
|---------|--------|
| Tu dong chay reproduction test | Test runner khac nhau moi stack, false negative nguy hiem |
| Auto-fix regression modules | Scope creep, co the gay them bug |
| AST-based change detection | Maintenance burden cho 5 stacks, heuristics du cho v1.5 |
| Bug tracking dashboard web | Ngoai scope CLI tool |
| ML-based bug prediction | Qua som cho please-done |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| REPRO-01 | Phase 25 | Complete |
| REGR-01 | Phase 25 | Complete |
| CLEAN-01 | Phase 26 | Complete |
| SEC-01 | Phase 26 | Complete |
| LOGIC-01 | Phase 27 | Pending |
| RPT-01 | Phase 27 | Pending |
| PM-01 | Phase 27 | Pending |

**Coverage:**
- v1.5 requirements: 7 total
- Mapped to phases: 7
- Unmapped: 0

---
*Requirements defined: 2026-03-24*
*Last updated: 2026-03-24 after roadmap creation*
