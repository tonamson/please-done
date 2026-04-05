# Phase 38: Nen tang Luu tru Nghien cuu - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 38-nen-tang-luu-tru-nghien-cuu
**Areas discussed:** Frontmatter schema, RES-ID numbering, research-store.js API, Xu ly research hien co

---

## Frontmatter Schema

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal (5 fields) | agent, created, source, topic, confidence | |
| Extended (8 fields) | + scope, expires, tags — ho tro freshness v3.1 | ✓ |
| Ban quyet dinh | Claude chon | |

**User's choice:** Extended (8 fields)
**Notes:** Ho tro freshness tracking san cho v3.1

---

## RES-ID Numbering

| Option | Description | Selected |
|--------|-------------|----------|
| 3-digit padding | RES-001, RES-002... RES-999 | ✓ |
| 4-digit padding | RES-0001, RES-0002... | |
| No padding | RES-1, RES-2... | |

**User's choice:** 3-digit padding
**Notes:** Du cho hau het du an

---

## research-store.js API

| Option | Description | Selected |
|--------|-------------|----------|
| Core (4 functions) | createEntry, parseEntry, nextResId, listEntries | |
| Full (6 functions) | + generateIndex, appendAuditLog | ✓ |
| Ban quyet dinh | Claude chon | |

**User's choice:** Full (6 functions)
**Notes:** Bao gom ca Phase 39 functions de module day du tu dau

---

## Xu ly Research Hien Co

| Option | Description | Selected |
|--------|-------------|----------|
| Giu nguyen o root | Khong di chuyen | |
| Di chuyen vao internal/ | Coi la research noi bo | |
| Archive vao milestones/ | Giu sach .planning/research/ | ✓ |

**User's choice:** Archive vao milestones/
**Notes:** Di chuyen vao .planning/milestones/v3.0-research/

---

## Claude's Discretion

- So luong plans va task breakdown
- Test data fixtures
- Error handling chi tiet

## Deferred Ideas

None
