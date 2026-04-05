# Phase 27: Dong bo Logic & Bao cao - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 27-dong-bo-logic-bao-cao
**Areas discussed:** Workflow size strategy, Logic detection heuristics, Report update pipeline, Post-mortem rules, Workflow wiring
**Mode:** auto (all recommended defaults selected)

---

## Workflow size strategy

| Option | Description | Selected |
|--------|-------------|----------|
| External orchestrator module | Tao logic-sync.js chua toan bo logic, workflow chi them 1 sub-step ngan | ✓ |
| Tang limit dong | Tang tu 420 len 450+ de co room inline | |
| Compress existing text | Nen workflow text hien tai de giai phong dong | |

**User's choice:** [auto] External orchestrator module (recommended)
**Notes:** fix-bug.md at 419/420 — no room for inline. Module approach consistent with prior phases.

---

## Logic detection heuristics

| Option | Description | Selected |
|--------|-------------|----------|
| Diff-based heuristics | Phan tich git diff tim condition/arithmetic/endpoint/database signals | ✓ |
| AST-based detection | Parse AST cua ca old/new code | |
| LLM self-assessment | AI tu danh gia ban than | |

**User's choice:** [auto] Diff-based heuristics (recommended, AST deferred to v2)
**Notes:** Heuristics du cho v1.5 per Out of Scope doc.

---

## Report update pipeline

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse existing modules | generate-diagrams + report-filler + pdf-renderer | ✓ |
| New report generator | Tao module moi cho fix-bug reports | |
| Skip report update | Chi ghi vao BUG report | |

**User's choice:** [auto] Reuse existing modules (recommended, 3 modules da co san)
**Notes:** Non-blocking, tim report moi nhat, chi cap nhat khong tao moi.

---

## Post-mortem rules

| Option | Description | Selected |
|--------|-------------|----------|
| Plain text + Y/N | Hien de xuat text, hoi confirm truoc append | ✓ |
| Structured proposal | Bang so sanh voi uu/nhuoc | |
| Auto-append | Tu dong them khong can confirm | |

**User's choice:** [auto] Plain text + Y/N (recommended, per PM-01 success criteria)
**Notes:** Non-blocking, user co the skip.

---

## Workflow wiring

| Option | Description | Selected |
|--------|-------------|----------|
| Buoc 10a (sau confirm) | Chen sau Buoc 10, chi co y nghia sau khi user xac nhan fix | ✓ |
| Buoc 9c (truoc commit) | Chen truoc commit cung voi cleanup | |
| Buoc rieng (Buoc 11) | Tao buoc so moi | |

**User's choice:** [auto] Buoc 10a (recommended, logic chi relevant sau confirm)
**Notes:** Consistent voi D-10 Phase 25 (chen vao buoc hien co).

---

## Claude's Discretion

- Regex patterns cu the cho heuristic signals
- Glob pattern + sort strategy tim report moi nhat
- Noi dung rule de xuat (phu thuoc bug context)
- Error messages va warning format

## Deferred Ideas

None — discussion stayed within phase scope
