# Requirements: Please-Done v3.0 Research Squad

**Defined:** 2026-03-25
**Core Value:** Every workflow step must produce the highest quality code output while consuming the minimum tokens and time

## v3.0 Requirements

Requirements for Research Squad milestone. Each maps to roadmap phases.

### Luu tru Phan tach (STORE)

- [ ] **STORE-01**: Thu muc internal/ luu ket qua phan tich codebase voi frontmatter `source: internal`, `scope: [project-name]`, `created: ISO-8601`
- [ ] **STORE-02**: Thu muc external/ luu ket qua tra cuu web/docs voi ten `RES-[ID]-[SLUG].md`, KHONG GHI DE — moi ban la file rieng biet co so tang dan
- [x] **STORE-03**: INDEX.md duoc auto-generate tu frontmatter cua tat ca research files — bang markdown voi cot [File, Source Type, Topic, Confidence, Created]
- [ ] **STORE-04**: Lenh `pd research` tu dong route internal vs external dua tren noi dung cau hoi (heuristic: ten file/function -> internal, ten thu vien/API -> external)

### Kiem chung Chong Ao Giac (AUDIT)

- [ ] **AUDIT-01**: Moi research file co YAML frontmatter bat buoc: agent, created, source (internal/external), topic, confidence (HIGH/MEDIUM/LOW)
- [x] **AUDIT-02**: Moi research file co section `## Bang chung` voi source citation cho tung claim — claim khong co source = khong duoc ghi
- [ ] **AUDIT-03**: Confidence 3 bac (HIGH = official docs/codebase, MEDIUM = nhieu nguon dong y, LOW = 1 nguon/khong xac minh) gan o ca cap file va cap claim
- [x] **AUDIT-04**: AUDIT_LOG.md append-only ghi lai moi hanh dong research (timestamp, agent, action, topic, source-count, confidence)

### Tac tu Nghien cuu (AGENT)

- [x] **AGENT-01**: Evidence Collector (builder/sonnet) thu thap bang chung tu 2+ nguon doc lap, ghi ket qua theo format chuan vao internal/ hoac external/
- [x] **AGENT-02**: Fact Checker (architect/opus) xac minh source con valid, phat hien claim thieu bang chung, danh dau "KHONG XAC MINH DUOC" cho confidence LOW
- [ ] **AGENT-03**: pd research tu dong chay pipeline Evidence Collector -> Fact Checker (spawn tuan tu, output Collector la input Checker)

### Bao ve Workflow (GUARD)

- [ ] **GUARD-01**: CHECK-06 trong plan-checker kiem tra plan co research backing — kiem tra Key Links/References den `.planning/research/` files (severity: WARN default, configurable)
- [ ] **GUARD-02**: Mandatory Suggestion phat hien >= 2 hedging patterns (chua ro, can tim hieu, co the...hoac, khong chac) trong plan body va goi y chay `pd research`
- [x] **GUARD-03**: Strategy Injection tu dong load research context (max 2 files, 2000 tokens) vao agent prompts khi spawn — keyword match tu INDEX.md

### Nang cao (EXTRA)

- [ ] **EXTRA-01**: Cross-validation tu dong — Fact Checker doc ca internal/ va external/ files cung topic, phat hien xung dot, ghi vao `## Xung dot phat hien` section

## v3.1 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Nang cao

- **EXTRA-02**: Research freshness tracking — danh dau STALE khi qua 14 ngay, canh bao trong Plan-Gate
- **EXTRA-03**: Research diff khi cap nhat — hien thay doi so voi lan truoc (reuse detectLogicChanges pattern)
- **EXTRA-04**: Confidence aggregation — tinh trung binh confidence cua research backing 1 plan

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| LLM-as-judge cho confidence | Circular — LLM tu danh gia minh = khong co gia tri. Dung rule-based |
| Embedding/vector search cho research | Overkill, them dependency, pha vo "no build step" constraint |
| Database (SQLite) cho research storage | Them dependency, markdown + grep du tot cho quy mo nay |
| Real-time research (tu dong chay khi code) | Token waste, khong dam bao chat luong, user nen trigger explicitly |
| Auto-research truoc moi plan | Phung phi neu user da co context. Guard chi GOI Y, khong cuong che |
| Blocking enforcement (BLOCK default) | Qua nghiem ngat, user se bypass. WARN default, BLOCK optional |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| STORE-01 | Phase 38 | Pending |
| STORE-02 | Phase 38 | Pending |
| STORE-03 | Phase 39 | Complete |
| STORE-04 | Phase 42 | Pending |
| AUDIT-01 | Phase 38 | Pending |
| AUDIT-02 | Phase 39 | Complete |
| AUDIT-03 | Phase 38 | Pending |
| AUDIT-04 | Phase 39 | Complete |
| AGENT-01 | Phase 40 | Complete |
| AGENT-02 | Phase 40 | Complete |
| AGENT-03 | Phase 42 | Pending |
| GUARD-01 | Phase 41 | Pending |
| GUARD-02 | Phase 41 | Pending |
| GUARD-03 | Phase 41 | Complete |
| EXTRA-01 | Phase 42 | Pending |

**Coverage:**
- v3.0 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---
*Requirements defined: 2026-03-25*
*Last updated: 2026-03-25 after Phase 40 Plan 01*
