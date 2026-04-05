# Phase 42: Lenh pd research - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 42-lenh-pd-research
**Areas discussed:** Routing logic, Pipeline orchestration, Cross-validation, Skill & converter

---

## Routing Logic

### Q1: Cach phan loai cau hoi research internal vs external?

| Option | Description | Selected |
|--------|-------------|----------|
| Keyword heuristic | Regex don gian: ten file/function/class/variable → internal, ten thu vien/API/protocol → external. Nhat quan voi STORE-04. | ✓ |
| User chon explicit | User truyen flag --internal hoac --external. Khong can heuristic. | |
| Hybrid | Heuristic auto-detect + cho phep user override bang --internal/--external. | |

**User's choice:** Keyword heuristic (Recommended)
**Notes:** None

### Q2: Khi heuristic khong chac chan (khong match pattern nao)?

| Option | Description | Selected |
|--------|-------------|----------|
| Default external | Mac dinh la external research (an toan hon). | ✓ |
| Hoi user | Khi khong chac, dung lai hoi user chon. | |
| Chay ca hai | Research ca internal lan external, gop ket qua. | |

**User's choice:** Default external (Recommended)
**Notes:** None

### Q3: Keyword heuristic nen nam o dau?

| Option | Description | Selected |
|--------|-------------|----------|
| Pure function trong research-store.js | Them routeQuery(query) vao research-store.js — testable, reuse duoc. | ✓ |
| Inline trong workflow | Logic nam truc tiep trong workflow — don gian nhung khong test duoc. | |

**User's choice:** Pure function trong research-store.js (Recommended)
**Notes:** None

### Q4: User co can thay routing decision khong?

| Option | Description | Selected |
|--------|-------------|----------|
| Hien ngan gon | In 1 dong: "Da phan loai: external research" truoc khi chay pipeline. | ✓ |
| Im lang | Khong hien, chi chay. | |

**User's choice:** Hien ngan gon (Recommended)
**Notes:** None

---

## Pipeline Orchestration

### Q1: Ai orchestrate pipeline Evidence Collector → Fact Checker?

| Option | Description | Selected |
|--------|-------------|----------|
| Workflow research.md | Workflow file chua logic orchestration. Nhat quan voi fix-bug.md. | ✓ |
| JS orchestrator module | Tao bin/lib/research-pipeline.js. Nhung agents spawn trong Claude Code. | |
| Skill file truc tiep | Logic nam het trong commands/pd/research.md. | |

**User's choice:** Workflow research.md (Recommended)
**Notes:** None

### Q2: Khi Evidence Collector fail, xu ly the nao?

| Option | Description | Selected |
|--------|-------------|----------|
| Van chay Fact Checker | Ghi file voi confidence LOW, Fact Checker van verify. Non-blocking. | ✓ |
| Dung pipeline | Bao loi, khong chay Fact Checker. | |

**User's choice:** Van chay Fact Checker (Recommended)
**Notes:** None

### Q3: Output cuoi cung cho user?

| Option | Description | Selected |
|--------|-------------|----------|
| Tom tat ngan | Topic, source type, confidence, so claims verified, path file. | ✓ |
| In toan bo | Hien thi noi dung research file truc tiep. | |

**User's choice:** Tom tat ngan (Recommended)
**Notes:** None

### Q4: Fact Checker chay tu dong hay hoi user truoc?

| Option | Description | Selected |
|--------|-------------|----------|
| Tu dong | Evidence Collector xong → tu dong spawn Fact Checker. Seamless. | ✓ |
| Hoi user | Sau Evidence Collector, hoi user co muon verify khong. | |

**User's choice:** Tu dong (Recommended)
**Notes:** None

---

## Cross-validation

### Q1: Khi nao Fact Checker chay cross-validation?

| Option | Description | Selected |
|--------|-------------|----------|
| Tu dong khi co ca 2 loai | Fact Checker tu scan INDEX.md tim files cung topic o ca internal/ va external/. | ✓ |
| Chi khi user yeu cau | Them flag --cross-validate. Mac dinh chi verify file vua tao. | |

**User's choice:** Tu dong khi co ca 2 loai (Recommended)
**Notes:** None

### Q2: Output cross-validation ghi o dau?

| Option | Description | Selected |
|--------|-------------|----------|
| Section trong file verify | Them section `## Xung dot phat hien` trong file verification. | ✓ |
| File rieng | Tao file CROSS-VALIDATION.md rieng. | |

**User's choice:** Section trong file verify (Recommended)
**Notes:** None

### Q3: Khi phat hien xung dot, xu ly the nao?

| Option | Description | Selected |
|--------|-------------|----------|
| Ghi nhan, khong resolve | Liet ke xung dot voi evidence tu ca 2 phia. User tu quyet dinh. | ✓ |
| Uu tien internal | Codebase la source of truth — giam confidence cua external claim. | |

**User's choice:** Ghi nhan, khong resolve (Recommended)
**Notes:** None

---

## Skill & Converter

### Q1: Argument cua lenh pd research?

| Option | Description | Selected |
|--------|-------------|----------|
| Topic bat buoc, khong flags | /pd:research "topic" — don gian, routing tu dong. | ✓ |
| Topic + optional flags | /pd:research "topic" --internal — cho phep override routing. | |

**User's choice:** Topic bat buoc, khong flags (Recommended)
**Notes:** None

### Q2: Cau truc tach skill vs workflow?

| Option | Description | Selected |
|--------|-------------|----------|
| Skill + workflow tach | commands/pd/research.md + workflows/research.md. Nhat quan voi 12 skills. | ✓ |
| Skill only | Tat ca logic trong commands/pd/research.md. | |

**User's choice:** Skill + workflow tach (Recommended)
**Notes:** None

### Q3: Converter pipeline?

| Option | Description | Selected |
|--------|-------------|----------|
| Them vao pipeline + snapshot | Them research.md vao converter pipeline. Regenerate snapshots. | ✓ |
| Skip converter | Chi ho tro Claude Code truoc. | |

**User's choice:** Them vao pipeline + snapshot (Recommended)
**Notes:** None

---

## Claude's Discretion

- So luong plans va task breakdown
- Exact regex patterns cho routeQuery heuristic
- Workflow prompt wording cho agent spawn
- Converter template cho research skill

## Deferred Ideas

None — discussion stayed within phase scope
