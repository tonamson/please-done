# Requirements: Please-Done v2.1 Detective Orchestrator

**Defined:** 2026-03-24
**Core Value:** Every workflow step must produce the highest quality code output while consuming the minimum tokens and time

## v2.1 Requirements

Requirements for Detective Orchestrator milestone. Each maps to roadmap phases.

### Dieu phoi Tai nguyen (ORCH)

- [ ] **ORCH-01**: Orchestrator anh xa Tier (Scout/Builder/Architect) sang model cu the (haiku/sonnet/opus) qua YAML frontmatter trong 5 agent files
- [ ] **ORCH-02**: Orchestrator gioi han toi da 2 sub-agents chay song song tai moi thoi diem
- [x] **ORCH-03**: Orchestrator ap dung Heavy Lock — chi 1 tac vu nang (FastCode indexing hoac test suite) chay tai moi thoi diem
- [x] **ORCH-04**: Orchestrator tu dong ha cap sang tuan tu khi spawn song song that bai (timeout/error), ghi warning vao SESSION

### Giao thuc Tham tu (PROT)

- [x] **PROT-01**: User thay danh sach phien debug danh so ID khi khoi dong, co the nhap so de tiep tuc hoac mo ta moi de tao session moi
- [ ] **PROT-02**: Moi agent tra ket qua theo 1 trong 3 outcomes chuan: ROOT CAUSE FOUND, CHECKPOINT REACHED, hoac INVESTIGATION INCONCLUSIVE
- [ ] **PROT-03**: Khi ROOT CAUSE duoc tim thay, user duoc chon 1 trong 3: Sua ngay, Len ke hoach, hoac Tu sua
- [ ] **PROT-04**: Khi agent ghi CHECKPOINT REACHED, orchestrator hien cau hoi cho user va truyen cau tra loi cho agent tiep theo
- [ ] **PROT-05**: Khi INCONCLUSIVE, agent PHAI ghi Elimination Log liet ke files/logic da kiem tra va xac nhan binh thuong
- [ ] **PROT-06**: Khi user tra loi CHECKPOINT, orchestrator spawn agent moi tiep nhan context tu evidence files (Continuation Agent)
- [x] **PROT-07**: Evidence file tu agent truoc la input chinh thuc cua agent sau — agent khong doc lai toan bo codebase
- [x] **PROT-08**: Code Detective va Doc Specialist chay song song vi khong phu thuoc nhau, ca 2 doc evidence_janitor.md

### Tri nho Du an (MEM)

- [ ] **MEM-01**: Janitor luc lai .planning/bugs/ tim bug tuong tu bang keyword matching khi bat dau dieu tra
- [ ] **MEM-02**: Orchestrator canh bao regression khi loi hien tai khop >= 2/3 tieu chi voi bug cu (file, function, error message)
- [ ] **MEM-03**: Architect kiem tra fix moi khong pha vo cac fix cu lien quan truoc khi ra phan quyet
- [ ] **MEM-04**: He thong tu dong tao va cap nhat .planning/bugs/INDEX.md liet ke tat ca bug theo file/function/keyword

### Vong lap Thuc thi (FLOW)

- [ ] **FLOW-01**: Buoc 1 — Orchestrator spawn Janitor agent (scout/haiku) thu thap trieu chung va kiem tra session cu
- [ ] **FLOW-02**: Buoc 2 — Orchestrator spawn Code Detective (builder/sonnet) va Doc Specialist (scout/haiku) doc lap sau khi Janitor hoan tat (tuan tu do rang buoc Claude Code Agent tool, logical parallel qua buildParallelPlan)
- [ ] **FLOW-03**: Buoc 3 — Orchestrator spawn Repro Engineer (builder/sonnet) tao Red Test tu evidence cua Buoc 2
- [ ] **FLOW-04**: Buoc 4 — Orchestrator spawn Fix Architect (architect/opus) tong hop tat ca evidence va ra phan quyet
- [ ] **FLOW-05**: Buoc 5 — Orchestrator truc tiep sua code, chay test, commit [LOI], tai su dung logic v1.5 (debug-cleanup, logic-sync, regression-analyzer)
- [x] **FLOW-06**: Khi INCONCLUSIVE o Buoc 4, orchestrator quay lai Buoc 2 voi Elimination Log va thong tin moi tu user (max 3 vong)
- [x] **FLOW-07**: User co the chay single-agent mode (v1.5 cu) khi khong co agent configs hoac truyen --single flag
- [x] **FLOW-08**: Orchestrator an chi tiet agent spawning, chi hien ket qua cuoi cung cho user (progressive disclosure)

## v2.2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Dieu phoi Tai nguyen

- **ORCH-05**: Tu dong do RAM/CPU truoc khi quyet dinh parallel vs sequential
- **ORCH-06**: Hien thi uoc tinh token cost truoc khi spawn agent team

### Tri nho Du an

- **MEM-05**: Agent nho pattern tu cac session debug truoc qua persistent memory cross-session

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Agent Teams (TeammateTool) | Experimental, chua stable, token cost cao — dung subagent pattern |
| Nested subagent spawning | Claude Code cam tuyet doi — subagents khong the spawn subagents |
| Unlimited parallel agents (>2) | Context window bung no, diminishing returns sau 2 agent |
| Real-time agent communication | Chi Agent Teams ho tro, khong stable — dung file-based handoff |
| Auto-retry agent vo han | Tieu hao token vo ich, cung input → cung ket qua fail |
| Agent voting/consensus | Over-engineering — debug can bang chung, khong can dan chu |
| Database bug tracking (SQLite) | Them dependency, pha vo pattern "no build step" — dung Markdown+Grep |
| AI-powered bug similarity scoring | Can embedding API, chi phi cao, khong dam bao tot hon keyword match |
| Auto-fix tu lich su bug | Cuc ky nguy hiem — cung trieu chung khong chac cung nguyen nhan |
| Toan bo workflow trong JS module | Pha vo pattern cot loi: workflow = markdown, module = pure JS |
| Real-time progress bar | Claude Code khong co API cho custom UI rendering |
| Auto-select investigation depth | AI chua du tot de tu danh gia do kho truoc khi dieu tra |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ORCH-01 | Phase 28, Phase 35 (doc sync) | Pending |
| ORCH-02 | Phase 28, Phase 35 (doc sync) | Pending |
| ORCH-03 | Phase 34 (gap closure) | Complete |
| ORCH-04 | Phase 34 (gap closure) | Complete |
| PROT-01 | Phase 29 | Complete |
| PROT-02 | Phase 29, Phase 35 (encoding fix) | Pending |
| PROT-05 | Phase 29, Phase 35 (encoding fix) | Pending |
| PROT-07 | Phase 34 (gap closure) | Complete |
| PROT-03 | Phase 34, Phase 35 (path fix) | Pending |
| PROT-04 | Phase 30, Phase 35 (roundNumber fix) | Pending |
| PROT-06 | Phase 34, Phase 35 (roundNumber fix) | Pending |
| PROT-08 | Phase 34 (gap closure) | Complete |
| MEM-01 | Phase 31, Phase 35 (doc sync) | Pending |
| MEM-02 | Phase 31, Phase 35 (doc sync) | Pending |
| MEM-03 | Phase 31, Phase 35 (doc sync) | Pending |
| MEM-04 | Phase 31, Phase 35 (bug-record fix) | Pending |
| FLOW-01 | Phase 32, Phase 35 (encoding fix) | Pending |
| FLOW-02 | Phase 34, Phase 35 (encoding fix) | Pending |
| FLOW-03 | Phase 32, Phase 35 (write-back fix) | Pending |
| FLOW-04 | Phase 32, Phase 35 (encoding fix) | Pending |
| FLOW-05 | Phase 34, Phase 35 (bug-record fix) | Pending |
| FLOW-08 | Phase 32 | Complete |
| FLOW-06 | Phase 33 | Complete |
| FLOW-07 | Phase 33 | Complete |

**Coverage:**
- v2.1 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0

---
*Requirements defined: 2026-03-24*
*Last updated: 2026-03-25 after Phase 35 gap closure planning (reset 11 requirements to Pending for re-verification)*
