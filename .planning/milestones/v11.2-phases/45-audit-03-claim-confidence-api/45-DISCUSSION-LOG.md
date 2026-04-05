# Phase 45: AUDIT-03 Claim-Level Confidence API - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 45-audit-03-claim-confidence-api
**Areas discussed:** Claims data structure, Inline confidence format, Quan he voi validateEvidence, Default khi thieu tag

---

## Claims Data Structure — Input (createEntry)

| Option | Description | Selected |
|--------|-------------|----------|
| claims[] parameter | Them parameter `claims: [{ text, source, confidence }]` — createEntry tu render markdown voi inline tags. Body va claims co the dung song song. | ✓ |
| Body chua inline tags | Giu nguyen body la string — caller tu viet inline confidence tags trong body. createEntry khong can thay doi. | |
| Ca hai | claims[] parameter render markdown, nhung body cung duoc chap nhan voi inline tags. | |

**User's choice:** claims[] parameter
**Notes:** None

---

## Claims Data Structure — Output (parseEntry)

| Option | Description | Selected |
|--------|-------------|----------|
| Them field claims[] vao parseEntry | parseEntry tra them `claims: [{ text, source, confidence }]`. Backward-compatible vi chi them field moi. | |
| Rieng function parseClaims() | Tach rieng parseClaims(content) — parseEntry giu nguyen, caller goi them parseClaims khi can claim-level. | ✓ |

**User's choice:** Rieng function parseClaims()
**Notes:** parseEntry() giu nguyen API hien co, parseClaims() la function doc lap moi.

---

## Inline Confidence Format

| Option | Description | Selected |
|--------|-------------|----------|
| (confidence: HIGH) | Nhat quan voi comment trong validateEvidence hien co. De parse bang regex. | ✓ |
| [HIGH] prefix | Prefix confidence o dau claim. Ngan hon, de scan bang mat. | |

**User's choice:** (confidence: HIGH)
**Notes:** Nhat quan voi codebase hien tai.

---

## Quan he voi validateEvidence

| Option | Description | Selected |
|--------|-------------|----------|
| parseClaims core, validateEvidence goi lai | parseClaims() la ham cot loi extract claims. validateEvidence() refactor de goi parseClaims() thay vi tu parse. Giam code trung. | ✓ |
| Hoan toan tach biet | parseClaims() va validateEvidence() tu parse rieng. Khong refactor code hien co. | |
| Shared helper extractClaimLines() | Tao helper nho extractClaimLines() dung chung. Ca parseClaims va validateEvidence deu goi helper. | |

**User's choice:** parseClaims core, validateEvidence goi lai
**Notes:** None

---

## Default khi thieu tag

| Option | Description | Selected |
|--------|-------------|----------|
| null | confidence: null — caller tu quyet dinh fallback. Khong gia dinh thay user. | ✓ |
| File-level confidence | Tu dong ke thua confidence tu frontmatter. Tien nhung giau viec thieu tag. | |

**User's choice:** null
**Notes:** Caller co the fallback ve file-level confidence neu can.

---

## Claude's Discretion

- Test data fixtures va edge cases
- So luong plans va task breakdown
- Chi tiet regex pattern cho parseClaims
- Cach render claims khi createEntry co ca body va claims[]

## Deferred Ideas

None — discussion stayed within phase scope.
