# Requirements: Please-Done v4.0 OWASP Security Audit

**Defined:** 2026-03-26
**Core Value:** Every workflow step must produce the highest quality code output while consuming the minimum tokens and time

## v4.0 Requirements

Requirements for OWASP Security Audit milestone. Each maps to roadmap phases.

### Audit Core

- [x] **CORE-01**: User co the chay `pd:audit` voi tham so [path] [--full|--only|--poc|--auto-fix]
- [x] **CORE-02**: Workflow audit thuc thi 9 buoc: detect → delta → scope → smart selection → dispatch → reporter → analyze → fix → save
- [x] **CORE-03**: He thong tu phat hien che do Doc lap (khong co .planning/) hoac Tich hop milestone (co .planning/)

### Template Agent Dispatch

- [x] **AGENT-01**: Template agent `pd-sec-scanner.md` nhan --category parameter, load rules tu YAML, output evidence chuan
- [x] **AGENT-02**: Config `security-rules.yaml` tap trung rules 13 OWASP category (patterns, severity, fixes, FastCode queries)
- [x] **AGENT-03**: Reporter agent `pd-sec-reporter.md` tong hop N evidence files thanh 1 SECURITY_REPORT.md
- [x] **AGENT-04**: 9 agents (7 cu + pd-sec-scanner + pd-sec-reporter) dang ky trong resource-config.js AGENT_REGISTRY, pd-sec-scanner co categories[13] thay 13 scanner rieng le

### Smart Scanner Selection

- [x] **SMART-01**: Context analysis engine phan tich milestone/code patterns de chon scanner lien quan
- [x] **SMART-02**: Bang anh xa tin hieu → scanner (12 patterns → 10 scanner co dieu kien + 3 base luon chay)
- [x] **SMART-03**: Fallback logic: --full chay 13, --only chay user chi dinh + 3 base, < 2 tin hieu hoi user

### Batch Execution

- [x] **BATCH-01**: Wave-based parallel dispatch toi da 2 scanner song song, backpressure cho ca wave xong
- [x] **BATCH-02**: Failure isolation — 1 scanner loi/timeout ghi inconclusive, tiep tuc wave tiep

### Evidence

- [x] **EVID-01**: Moi scanner xuat bang kiem tra TUNG HAM voi PASS/FLAG/FAIL + ghi ro ham bi bo qua
- [x] **EVID-02**: SECURITY_REPORT.md tong hop bang master sap theo severity + OWASP coverage + hot spots

### Session Delta

- [ ] **DELTA-01**: Doc evidence cu, phan loai KNOWN-UNFIXED (skip) / RE-VERIFY (scan lai) / NEW
- [ ] **DELTA-02**: Git diff scope — ham da PASS + code doi → RE-SCAN, khong doi → SKIP
- [ ] **DELTA-03**: Audit history append-only table cuoi evidence file

### POC / Gadget Chain

- [ ] **POC-01**: POC don le khi --poc: input vector, payload mau, buoc tai hien, ket qua du kien
- [ ] **POC-02**: Gadget Chain POC lien ket FAIL/FLAG tu moi category thanh chuoi tan cong + severity danh lai

### Fix Phases

- [ ] **FIX-01**: Tu dong tao fix phases decimal (3.1, 3.2...) sap theo nguoc gadget chain (P0→P1→P2)
- [ ] **FIX-02**: Template security-fix-phase.md voi evidence trich dan, huong sua, tieu chi hoan thanh
- [ ] **FIX-03**: Phase cuoi [SEC-VERIFY] chay lai audit tren files da fix

### Tich hop Ecosystem

- [x] **WIRE-04**: pd-sec-scanner su dung FastCode tool-first voi Grep fallback khi FastCode khong kha dung
- [ ] **WIRE-01**: Security gate trong complete-milestone: chua co SECURITY_REPORT → chan
- [ ] **WIRE-02**: Uu tien 7.5 trong what-next: goi y pd:audit truoc complete-milestone
- [ ] **WIRE-03**: State machine update: them pd:audit vao luong trang thai

## Future Requirements

### Deferred

- **DAST-01**: Dynamic Application Security Testing (quet runtime) — defer vi can chay server, vuot scope AI coding tool
- **AST-01**: AST-based analysis thay vi regex — FastCode MCP da cung cap tree-sitter, khong can tu build parser
- **CVE-01**: CVE database lookup real-time — npm audit/pip audit da mapping CVE san
- **AUTOFIX-01**: Auto-fix code truc tiep khong qua fix phase — nguy hiem, fix khong qua test

## Out of Scope

| Feature | Reason |
|---------|--------|
| DAST (Dynamic Testing) | Can chay server — vuot scope AI coding tool. Ghi note trong report: "Nen bo sung DAST voi ZAP/Burp Suite" |
| AST parser tu build | FastCode MCP da cung cap tree-sitter. "No Build Step" constraint |
| CVE database real-time | npm audit / pip audit da co CVE mapping. Khong can external API |
| Auto-fix code truc tiep | Fix khong qua test = nguy hiem. Tao fix phases thay the |
| Blocking audit moi phase | Qua nghiem ngat — chi gate truoc complete-milestone |
| Giu 13 agent files rieng le | 1 template + 1 YAML config DRY hon. Migrate patterns roi xoa |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORE-01 | Phase 47 | Complete |
| CORE-02 | Phase 47 | Complete |
| CORE-03 | Phase 47 | Complete |
| AGENT-01 | Phase 46 | Complete |
| AGENT-02 | Phase 46 | Complete |
| AGENT-03 | Phase 48 | Complete |
| AGENT-04 | Phase 46 | Complete |
| SMART-01 | Phase 48 | Complete |
| SMART-02 | Phase 48 | Complete |
| SMART-03 | Phase 48 | Complete |
| BATCH-01 | Phase 47 | Complete |
| BATCH-02 | Phase 47 | Complete |
| EVID-01 | Phase 48 | Complete |
| EVID-02 | Phase 48 | Complete |
| DELTA-01 | Phase 49 | Pending |
| DELTA-02 | Phase 49 | Pending |
| DELTA-03 | Phase 49 | Pending |
| POC-01 | Phase 50 | Pending |
| POC-02 | Phase 50 | Pending |
| FIX-01 | Phase 50 | Pending |
| FIX-02 | Phase 50 | Pending |
| FIX-03 | Phase 50 | Pending |
| WIRE-01 | Phase 51 | Pending |
| WIRE-02 | Phase 51 | Pending |
| WIRE-03 | Phase 51 | Pending |
| WIRE-04 | Phase 46 | Complete |

**Coverage:**
- v4.0 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0

---
*Requirements defined: 2026-03-26*
*Last updated: 2026-03-26 after Phase 46 completion*
