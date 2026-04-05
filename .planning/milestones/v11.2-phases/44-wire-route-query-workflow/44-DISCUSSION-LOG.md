# Phase 44: Wire routeQuery vao Workflow - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 44-wire-route-query-workflow
**Areas discussed:** Cach goi routeQuery, Xu ly ket qua khac biet, Cleanup inline heuristic

---

## Cach goi routeQuery tu workflow

| Option | Description | Selected |
|--------|-------------|----------|
| CLI script rieng (Recommended) | Tao bin/route-query.js — nhat quan voi Phase 43 pattern. Workflow goi: ROUTE=$(node bin/route-query.js "$TOPIC"). De test, de debug. | ✓ |
| Inline node -e | Khong tao file moi. Workflow goi: ROUTE=$(node -e "console.log(require('./bin/lib/research-store').routeQuery('$TOPIC'))"). Gon hon nhung kho doc. | |
| Claude quyet dinh | Dua vao research de chon cach phu hop nhat. | |

**User's choice:** CLI script rieng (Recommended)
**Notes:** Nhat quan voi Phase 43 pattern da thiet lap.

---

## Xu ly ket qua khac biet

| Option | Description | Selected |
|--------|-------------|----------|
| Trust routeQuery hoan toan (Recommended) | routeQuery da co 20+ tests, chiem 10+ patterns. No chinh xac hon inline. Khong can fallback. | ✓ |
| Log khi khac biet | Trust routeQuery nhung log warning khi ket qua khac voi inline cu — de theo doi trong giai doan chuyen doi. | |
| Claude quyet dinh | Dua vao research de chon. | |

**User's choice:** Trust routeQuery hoan toan (Recommended)
**Notes:** routeQuery chinh xac hon inline, khong can comparison.

---

## Cleanup inline heuristic

| Option | Description | Selected |
|--------|-------------|----------|
| Xoa hoan toan (Recommended) | Thay inline heuristic bang 1 dong: ROUTE=$(node bin/route-query.js "$TOPIC"). Xoa sach code cu. Khong giu comment. | ✓ |
| Giu comment ghi chu | Xoa inline code nhung giu comment "Truoc day dung inline heuristic, nay dung routeQuery()" de giai thich lich su. | |
| Claude quyet dinh | Dua vao research de chon. | |

**User's choice:** Xoa hoan toan (Recommended)
**Notes:** Clean replacement, khong can lich su trong code.

---

## Claude's Discretion

- Error handling cho route-query.js (missing argument, empty string)
- Test data fixtures
- So luong plans va task breakdown

## Deferred Ideas

None — discussion stayed within phase scope.
