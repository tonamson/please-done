# Plan Checker Rules

> Nguon su that duy nhat cho plan-checker.js
> Doc boi: plan-checker.js (implement), test (validate)

## 1. Format Detection

Plan checker ho tro 2 format chinh:

### v1.0 Format
- YAML frontmatter co key `must_haves:` (nested truths/artifacts)
- Noi dung chua `<tasks>` XML tag hoac `<task` elements
- Tasks nhung truc tiep trong PLAN.md duoi dang XML `<task>...</task>`
- Truths nam trong frontmatter `must_haves: truths:` block
- Dependencies nam trong frontmatter `depends_on:` field

### v1.1 Format
- Truths table dang markdown: `| T1 | [mo ta] | [kiem chung] |`
- Tasks tach ra file TASKS.md rieng voi summary table va detail blocks
- Metadata task dung format `> Trang thai: ... | Effort: ...`
- Truth mapping qua `> Truths: [T1, T2]` trong task detail

### Unknown Format
- Khong khop v1.0 hoac v1.1 -> tra ve 'unknown'
- Tat ca checks -> graceful PASS (khong false positive)

## 2. CHECK-01: Requirement Coverage

> Per D-01, D-09, D-10, D-11, D-12

**Input:** PLAN.md content + requirement IDs tu ROADMAP `**Requirements**:` field

**Rule:** Moi requirement ID phai xuat hien dang literal text o dau do trong PLAN.md content

**Logic:**
1. Nhan danh sach requirement IDs (VD: `['CHECK-01', 'CHECK-02']`)
2. Voi moi ID, kiem tra co xuat hien trong toan bo noi dung PLAN.md
3. Matching bang regex literal, escaped cho special chars (hyphen trong IDs nhu `CHECK-01`)
4. Neu phase khong co `Requirements:` field trong ROADMAP -> tu dong PASS (D-10)
5. Requirement ID khong xuat hien o dau trong PLAN.md -> BLOCK voi message chi ro requirement nao bi thieu (D-12)

**Severity:**
| Dieu kien | Severity |
|-----------|----------|
| Requirement ID khong co trong PLAN.md | BLOCK |
| Phase khong co Requirements field | PASS (skip) |

## 3. CHECK-02: Task Completeness

> Per D-02, D-05, D-06, D-07, D-08

### v1.0 Format
Parse task XML elements (`<task>...</task>`). Required cho moi task:
- `<files>` tag (non-empty) -> thieu = BLOCK
- `<action>` hoac `<behavior>` tag (mo ta) -> thieu = BLOCK
- `<verify>` hoac `<done>` hoac `<acceptance_criteria>` tag (tieu chi) -> thieu = BLOCK

### v1.1 Format
Parse TASKS.md detail blocks (`## Task N:`):

**Required metadata fields (D-05) -> thieu = BLOCK:**
- `Effort:` trong metadata line
- `Files:` trong metadata
- `Truths:` trong metadata (VD: `> Truths: [T1, T2]`)

**Required sections (D-06) -> thieu/rong = BLOCK:**
- `### Mo ta` (hoac `### Mo ta` voi dau) — phai ton tai va khong rong
- `### Tieu chi chap nhan` (hoac voi dau) — phai ton tai va khong rong

**Summary table Truths column (D-07) -> thieu = BLOCK:**
- Bang tong quan phai co cot `Truths`

**Optional metadata (D-08) -> thieu = WARN:**
- Trang thai
- Uu tien
- Phu thuoc
- Loai

**Khong check:** "Ghi chu ky thuat" section (template ghi ro "Chi khi can thiet")

### Khong co TASKS.md va v1.0 format
Chi check v1.0 rules (parse XML tasks tu PLAN.md)

**Severity:**
| Dieu kien | Severity |
|-----------|----------|
| Task thieu Effort/Files/Truths (v1.1) | BLOCK |
| Task thieu Mo ta/Tieu chi chap nhan (v1.1) | BLOCK |
| Summary table thieu cot Truths (v1.1) | BLOCK |
| Task thieu files/action/criteria (v1.0) | BLOCK |
| Task thieu Trang thai/Uu tien/Phu thuoc/Loai | WARN |

## 4. CHECK-03: Dependency Correctness

> Per D-03

### v1.0 Format
- Parse `depends_on:` tu frontmatter
- Handle formats: `[]` (empty), `[02-01]` (bracket string), `["05-01"]` (quoted bracket string), YAML array (`- 01-01`)
- Cho v1.0 single-plan context: graceful PASS (plan-level deps reference other plans khong available cho checker)

### v1.1 Format
- Parse `Phu thuoc` column tu TASKS.md summary table + `> Phu thuoc:` metadata
- Extract `Task N` references
- Validate tat ca referenced tasks ton tai -> khong ton tai = BLOCK
- Chay cycle detection tren task dependency graph (Kahn's algorithm / topological sort)
- Circular dependency -> BLOCK

**Kahn's Algorithm:**
1. Build in-degree map va adjacency list tu danh sach tasks va edges
2. Queue tat ca nodes co in-degree = 0
3. Process queue: moi node duoc process, giam in-degree cua neighbors
4. Neu sorted count < total nodes -> co cycle -> BLOCK

**Severity:**
| Dieu kien | Severity |
|-----------|----------|
| Circular dependency | BLOCK |
| Invalid task/plan reference | BLOCK |
| v1.0 plan-level deps (single-plan context) | PASS (skip) |

## 5. CHECK-04: Truth-Task Coverage

> Per D-04

### v1.0 Format
- Parse truths tu frontmatter `must_haves: truths:` (nested YAML — parse raw frontmatter string voi regex, khong dung parseFrontmatter vi no flatten nested keys)
- Tasks khong co explicit Truth refs trong v1.0 -> tu dong PASS cho bidirectional check
- Follows D-10 graceful-skip principle, tranh false positives per D-17

### v1.1 Format
- Parse Truths tu PLAN.md Truths table (`| T1 | [mo ta] | [kiem chung] |`)
- Parse task Truth refs tu `> Truths: [T1, T2]` metadata trong TASKS.md
- Check ca hai chieu:
  - Truth khong co task nao map -> BLOCK (success criterion se khong dat duoc)
  - Task khong co Truth nao map -> WARN (co the la infrastructure/setup task hop le)

**Severity:**
| Dieu kien | Severity |
|-----------|----------|
| Truth khong co task nao map (v1.1) | BLOCK |
| Task khong co Truth nao map (v1.1) | WARN |
| v1.0 format (khong co Truth-Task mapping) | PASS (skip) |

## 6. Result Format

### Per-check result (D-13)
```json
{
  "checkId": "CHECK-01",
  "status": "pass|block|warn",
  "issues": [
    {
      "message": "Requirement CHECK-01 khong xuat hien trong PLAN.md",
      "location": "PLAN.md",
      "fixHint": "Them CHECK-01 vao objectives, truths, hoac task descriptions"
    }
  ]
}
```

### Combined result (D-14, D-15)
```json
{
  "overall": "pass|block|warn",
  "checks": [
    { "checkId": "CHECK-01", "status": "pass", "issues": [] },
    { "checkId": "CHECK-02", "status": "block", "issues": [{ "message": "...", "location": "...", "fixHint": "..." }] },
    { "checkId": "CHECK-03", "status": "pass", "issues": [] },
    { "checkId": "CHECK-04", "status": "warn", "issues": [{ "message": "...", "location": "...", "fixHint": "..." }] }
  ]
}
```

**Logic xac dinh `overall`:**
- `overall = 'block'` neu BAT KY check nao co status `'block'`
- `overall = 'warn'` neu co warn nhung KHONG co block
- `overall = 'pass'` neu TAT CA checks la `'pass'`

## 7. Severity Summary Table

| Check | Dieu kien | Severity |
|-------|-----------|----------|
| CHECK-01 | Requirement ID khong co trong PLAN.md | BLOCK |
| CHECK-01 | Phase khong co Requirements field | PASS (skip) |
| CHECK-02 | Task thieu Effort/Files/Truths (v1.1) | BLOCK |
| CHECK-02 | Task thieu Mo ta/Tieu chi chap nhan (v1.1) | BLOCK |
| CHECK-02 | Summary table thieu cot Truths (v1.1) | BLOCK |
| CHECK-02 | Task thieu files/action/criteria (v1.0) | BLOCK |
| CHECK-02 | Task thieu Trang thai/Uu tien/Phu thuoc/Loai | WARN |
| CHECK-03 | Circular dependency | BLOCK |
| CHECK-03 | Invalid task/plan reference | BLOCK |
| CHECK-03 | v1.0 plan-level deps (single-plan context) | PASS (skip) |
| CHECK-04 | Truth khong co task nao map (v1.1) | BLOCK |
| CHECK-04 | Task khong co Truth nao map (v1.1) | WARN |
| CHECK-04 | v1.0 format (khong co Truth-Task mapping) | PASS (skip) |

---
*Plan Checker Rules v1.0*
*Created: 23_03_2026*
