# Requirements: Please-Done Visual Business Logic Reports

**Defined:** 2026-03-24
**Core Value:** Every workflow step must produce the highest quality code output while consuming the minimum tokens and time

## v1.4 Requirements

Requirements for visual business logic reporting. Each maps to roadmap phases.

### Mermaid Foundation

- [ ] **MERM-01**: AI tuan thu quy tac tham my Mermaid (mau sac, mui ten, nhan, layout) khi ve so do
- [x] **MERM-02**: Mermaid syntax duoc validate truoc khi dua vao bao cao (pure function, zero deps)

### Diagram Generation

- [ ] **DIAG-01**: AI tu dong ve Business Logic Flowchart tu Truths/PLAN.md cua milestone
- [ ] **DIAG-02**: AI tu dong ve Architecture Diagram minh hoa Module/Service/DB/APIs cua du an

### Report

- [ ] **REPT-01**: Template MANAGEMENT_REPORT.md chuyen nghiep tap trung ket qua kinh doanh, tich hop so do Mermaid

### PDF Export

- [ ] **PDF-01**: Script generate-pdf-report.js xuat Markdown+Mermaid sang PDF voi hinh anh ro net
- [ ] **PDF-02**: Script hoat dong graceful khi khong co Puppeteer/Node 18+ (fallback sang Markdown-only)

### Workflow Integration

- [ ] **INTG-01**: Workflow complete-milestone tu dong goi buoc ve so do va tao bao cao quan ly
- [ ] **INTG-02**: Buoc ve so do la non-blocking — milestone completion khong bi fail neu PDF generation loi

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Visual Enhancements

- **VIS-01**: Truth-to-Diagram tracing — lien ket truc tiep tu Truth ID toi node tren so do
- **VIS-02**: Quality dashboard diagrams — bieu do test coverage, code quality metrics
- **VIS-03**: Sequence Diagrams cho API interaction flows
- **VIS-04**: Interactive HTML diagrams voi click-to-expand

### Advanced PDF

- **APDF-01**: Tu dong chon so luong diagram phu hop theo kich thuoc milestone
- **APDF-02**: Custom branding/logo trong PDF output

## Out of Scope

| Feature | Reason |
|---------|--------|
| Interactive HTML diagrams | Phuc tap, can web server — defer sang v2 |
| Real-time diagram updates | Cost-benefit am cho prompt-based system |
| Full code-to-flowchart conversion | Qua phuc tap, khong phai core value |
| Experimental Mermaid syntax (C4, architecture-beta) | Khong on dinh, chi dung flowchart/sequence stable |
| Puppeteer trong package.json | Giu zero production deps — runtime detection only |
| Semantic AI validation of diagram quality | Circular — AI judge AI output |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| MERM-01 | Phase 21 | Pending |
| MERM-02 | Phase 21 | Complete |
| DIAG-01 | Phase 22 | Pending |
| DIAG-02 | Phase 22 | Pending |
| REPT-01 | Phase 21 | Pending |
| PDF-01 | Phase 23 | Pending |
| PDF-02 | Phase 23 | Pending |
| INTG-01 | Phase 24 | Pending |
| INTG-02 | Phase 24 | Pending |

**Coverage:**
- v1.4 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0

---
*Requirements defined: 2026-03-24*
*Last updated: 2026-03-24 after 21-02 plan completion*
