# Phase 22: Diagram Generation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 22-diagram-generation
**Areas discussed:** Nguon du lieu, Co che tao diagram, Business Logic mapping, Architecture extraction

---

## Nguon du lieu

### Business Logic Flowchart source

| Option | Description | Selected |
|--------|-------------|----------|
| Truths table tu PLANs | Moi Truth = 1 node, lien ket theo dependency. Da co du lieu structured. | |
| PLAN.md objectives + tasks | Plan objectives lam high-level nodes, tasks lam sub-nodes. Chi tiet hon. | |
| Ket hop ca hai | Truths lam main flow, tasks bo sung chi tiet khi can. Linh hoat nhung phuc tap hon. | ✓ |

**User's choice:** Ket hop ca hai
**Notes:** Truths la main flow, tasks bo sung chi tiet khi can

### Architecture Diagram source

| Option | Description | Selected |
|--------|-------------|----------|
| .planning/codebase/ maps | Dung ARCHITECTURE.md, STRUCTURE.md, INTEGRATIONS.md da co san. | |
| Source code scan | Truc tiep scan src/ de detect modules. Chinh xac hon nhung ton token. | |
| Codebase maps + PLAN artifacts | Ket hop codebase maps voi thong tin tu PLANs (files_modified, dependencies). | ✓ |

**User's choice:** Codebase maps + PLAN artifacts
**Notes:** Balanced approach

---

## Co che tao diagram

### Generation mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Script JS generate | Pure function doc data, output Mermaid text. Nhat quan, testable. | |
| AI prompt instructions | AI tu phan tich data va viet Mermaid. Linh hoat hon. | |
| Hybrid: Script scaffold + AI fill | Script tao cau truc co ban, AI bo sung connections. Tan dung ca hai. | ✓ |

**User's choice:** Hybrid: Script scaffold + AI fill
**Notes:** None

### Validation

| Option | Description | Selected |
|--------|-------------|----------|
| Luon validate | Goi mermaid-validator.js, retry max 2 lan neu loi. | ✓ |
| Validate nhung khong retry | Chi warning, khong tu sua. | |
| Bo qua validation | Tin tuong output truc tiep. | |

**User's choice:** Luon validate
**Notes:** Da co validator san tu Phase 21

### Module structure

| Option | Description | Selected |
|--------|-------------|----------|
| Module JS rieng | bin/lib/generate-diagrams.js, export functions. Testable, reusable. | ✓ |
| Inline trong workflow | Script trong workflow prompt. Kho test. | |

**User's choice:** Module JS rieng
**Notes:** Tuong tu pattern mermaid-validator.js, plan-checker.js

---

## Business Logic mapping

### Truth-to-node mapping

| Option | Description | Selected |
|--------|-------------|----------|
| 1 Truth = 1 node | Moi Truth ID la process node. Description lam label. | ✓ |
| Group Truths theo plan | Moi plan la subgraph chua Truths. | |
| Truths + Edge Cases | Truths la main nodes, Edge Cases them decision diamonds. | |

**User's choice:** 1 Truth = 1 node
**Notes:** Don gian, ro rang

### Arrow/flow determination

| Option | Description | Selected |
|--------|-------------|----------|
| Thu tu trong plan | Truths noi theo thu tu xuat hien trong PLANs. Predictable. | ✓ |
| AI suy luan tu context | AI tu suy ra logic flow. Linh hoat nhung khong doan truoc duoc. | |
| depends_on tu plan frontmatter | Dung depends_on. Chinh xac nhung chi plan-level. | |

**User's choice:** Thu tu trong plan
**Notes:** None

### Scale handling (>15 Truths)

| Option | Description | Selected |
|--------|-------------|----------|
| Subgraphs theo wave/plan | Tach thanh subgraphs, moi subgraph = 1 wave hoac group plans. | ✓ |
| Chi lay top Truths | Chon 10-12 Truths quan trong nhat. Don gian nhung mat thong tin. | |
| Nhieu diagrams | Tu dong tach thanh 2-3 diagrams rieng. | |

**User's choice:** Subgraphs theo wave/plan
**Notes:** Giu duoi 15 nodes moi level

---

## Architecture extraction

### Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Layered (LR) voi subgraphs | Tach theo layers: CLI → Lib → Converters → Platforms. | ✓ |
| Component-based | Moi component chinh la 1 node. Flat, don gian hon. | |
| Ban quyet dinh | Claude chon layout phu hop. | |

**User's choice:** Layered (LR) voi subgraphs
**Notes:** Ro rang cho Manager

### Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Milestone-scoped | Chi modules bi thay doi trong milestone. Gon, relevant. | ✓ |
| Full project | Toan bo cau truc du an. Day du nhung co the qua lon. | |
| Configurable | Mac dinh milestone-scoped, option full. | |

**User's choice:** Milestone-scoped
**Notes:** None

### Shapes

| Option | Description | Selected |
|--------|-------------|----------|
| Theo mermaid-rules.md | Shape-by-Role da dinh. Nhat quan voi Phase 21. | ✓ |
| Tu detect tu code | Phan loai tu dong. Thong minh hon nhung co the sai. | |

**User's choice:** Theo mermaid-rules.md
**Notes:** Nhat quan voi Phase 21

---

## Claude's Discretion

- Chi tiet implementation cua scaffold function
- Edge labels cu the
- Subgraph naming convention
- Cach detect module role tu codebase maps
- Start/End node placement

## Deferred Ideas

None — discussion stayed within phase scope
