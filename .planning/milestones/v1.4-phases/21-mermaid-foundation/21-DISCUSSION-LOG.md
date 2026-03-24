# Phase 21: Mermaid Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 21-mermaid-foundation
**Areas discussed:** Visual Style, Validator Scope, Report Template, Diagram Language

---

## Visual Style

### Color Palette

| Option | Description | Selected |
|--------|-------------|----------|
| Corporate Blue | Xanh duong chu dao + xam phu, chuyen nghiep, phu hop bao cao cho Manager | ✓ |
| Neutral Monochrome | Chi dung trang/den/xam — toi gian, de in | |
| Semantic Colors | Mau theo y nghia: xanh=success, vang=warning, do=error | |

**User's choice:** Corporate Blue
**Notes:** Primary #2563EB, Secondary #64748B, Accent #10B981, Warning #F59E0B, Error #DC2626

### Node Shapes

| Option | Description | Selected |
|--------|-------------|----------|
| Shape-by-Role | Moi loai concept co shape rieng: Service=rectangle, DB=cylinder, API=rounded, Decision=diamond | ✓ |
| Minimal Shapes | Chi dung 2 shapes: rectangle va diamond. Phan biet bang mau sac | |
| Ban quyet dinh | Claude chon mapping shape phu hop | |

**User's choice:** Shape-by-Role
**Notes:** Service=rectangle, Database=cylinder, API=rounded, Decision=diamond, Start/End=stadium, External=subroutine

### Label Conventions

| Option | Description | Selected |
|--------|-------------|----------|
| Ngan gon 3-5 tu | Labels toi da 5 tu, edge labels 1-3 tu | ✓ |
| Chi tiet day du | Labels co the dai hon, chap nhan 1-2 cau ngan | |
| Ban quyet dinh | Claude chon quy tac label phu hop | |

**User's choice:** Ngan gon 3-5 tu
**Notes:** Khong viet tat kho hieu

### Max Nodes

| Option | Description | Selected |
|--------|-------------|----------|
| 15 nodes | Vua du chi tiet, khong qua roi cho Manager | ✓ |
| 20 nodes | Cho phep diagram phuc tap hon | |
| 10 nodes | Rat toi gian, buoc phai abstract | |

**User's choice:** 15 nodes
**Notes:** Vuot qua thi tach thanh subgraphs hoac diagrams rieng

---

## Validator Scope

### Validate What

| Option | Description | Selected |
|--------|-------------|----------|
| Syntax + Style | Check ca syntax LAN style compliance. Syntax errors = invalid, style = warnings | ✓ |
| Syntax only | Chi check loi syntax co ban. Style compliance de cho AI tu tuan thu | |
| Ban quyet dinh | Claude chon scope phu hop | |

**User's choice:** Syntax + Style
**Notes:** Return { valid, errors, warnings } — errors cho syntax, warnings cho style

### Error Detail

| Option | Description | Selected |
|--------|-------------|----------|
| Line + message | Moi error/warning co: { line, message, type } | ✓ |
| Message only | Chi tra ve message string, khong can line number | |
| Ban quyet dinh | Claude chon format phu hop | |

**User's choice:** Line + message
**Notes:** { line, message, type } de AI tu sua duoc

---

## Report Template

### 7 Sections

| Option | Description | Selected |
|--------|-------------|----------|
| Business-focused | Executive Summary, Milestone Overview, Business Logic Flow, Architecture Overview, Key Achievements, Quality Metrics, Next Steps | ✓ |
| Technical-detailed | Summary, Truths Table, Business Flow, Architecture, Code Changes, Test Results, Tech Debt | |
| Ban quyet dinh | Claude chon cau truc phu hop | |

**User's choice:** Business-focused
**Notes:** Tap trung ket qua kinh doanh, Manager doc duoc

### Report Language

| Option | Description | Selected |
|--------|-------------|----------|
| Tieng Viet | Toan bo tieng Viet — nhat quan voi phong cach du an | ✓ |
| English | Tieng Anh toan bo | |
| Song ngu | Headings English, noi dung Viet | |

**User's choice:** Tieng Viet
**Notes:** Nhat quan voi PROJECT.md, comments, va phong cach du an

---

## Diagram Language

### Label Language

| Option | Description | Selected |
|--------|-------------|----------|
| Tieng Viet | Nhat quan voi report. Can quoting rules dac biet cho dau tieng Viet | ✓ |
| English | Tranh van de encoding | |
| Ban quyet dinh | Claude chon dua tren doi tuong doc | |

**User's choice:** Tieng Viet
**Notes:** VD: node="Xu ly don hang", edge="thanh cong"

### Quoting Rules

| Option | Description | Selected |
|--------|-------------|----------|
| Luon dung double quotes | Tat ca labels deu boc trong "..." — an toan cho dau tieng Viet | ✓ |
| Chi quote khi can | Chi dung quotes cho labels co ky tu dac biet/dau | |

**User's choice:** Luon dung double quotes
**Notes:** VD: A["Xu ly don hang"] --> B["Thanh cong"]

---

## Claude's Discretion

- Direction rules cho flowcharts (TD vs LR)
- Anti-patterns list cu the
- Validator internal implementation approach
- Test case selection

## Deferred Ideas

None — discussion stayed within phase scope
