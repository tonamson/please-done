# Phase 46: Nen tang Scanner - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 46-nen-tang-scanner
**Areas discussed:** Cau truc YAML, Template agent, AGENT_REGISTRY, FastCode pattern

---

## Cau truc YAML

### YAML layout

| Option | Description | Selected |
|--------|-------------|----------|
| Nested theo category (Khuyen nghi) | Top-level key la category slug, moi category chua owasp, severity, patterns[], fixes[], fastcode_queries[] | ✓ |
| Flat list | Moi rule la 1 entry trong array voi field category | |
| Ban quyet dinh | Claude chon cau truc phu hop nhat | |

**User's choice:** Nested theo category
**Notes:** None

### YAML fields

| Option | Description | Selected |
|--------|-------------|----------|
| 5 truong co ban (Khuyen nghi) | owasp, severity, patterns[], fixes[], fastcode_queries[] | ✓ |
| 7 truong mo rong | Them description, references[] | |
| Ban quyet dinh | Claude chon | |

**User's choice:** 5 truong co ban
**Notes:** None

### Vi tri file

| Option | Description | Selected |
|--------|-------------|----------|
| references/ (Khuyen nghi) | Nhat quan voi references/security-checklist.md | ✓ |
| commands/pd/agents/ | Canh template agent | |
| Ban quyet dinh | Claude chon | |

**User's choice:** references/
**Notes:** None

---

## Template agent

### Category handling

| Option | Description | Selected |
|--------|-------------|----------|
| YAML lookup (Khuyen nghi) | Agent nhan --category slug, doc YAML, extract rules | ✓ |
| Inline rules + YAML override | Template co base rules, YAML bo sung/override | |
| Ban quyet dinh | Claude chon | |

**User's choice:** YAML lookup
**Notes:** None

### Migration strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Migrate roi xoa (Khuyen nghi) | Trich xuat rules tu 13 files vao YAML, xoa files cu | ✓ |
| Giu song song | Giu 13 files cu + them template moi | |
| Ban quyet dinh | Claude chon | |

**User's choice:** Migrate roi xoa
**Notes:** None

### Evidence format

| Option | Description | Selected |
|--------|-------------|----------|
| Giu format hien tai (Khuyen nghi) | YAML frontmatter + markdown body | ✓ |
| Them function-level checklist | Bo sung bang kiem tra tung ham — thuoc Phase 48 | |
| Ban quyet dinh | Claude chon | |

**User's choice:** Giu format hien tai
**Notes:** None

---

## AGENT_REGISTRY

### Registry structure

| Option | Description | Selected |
|--------|-------------|----------|
| 1 entry + category list (Khuyen nghi) | 1 entry pd-sec-scanner voi categories[] + 1 entry pd-sec-reporter | ✓ |
| 14 entries rieng | 13 entries rieng + 1 reporter | |
| Ban quyet dinh | Claude chon | |

**User's choice:** 1 entry + category list
**Notes:** None

### Tier assignment

| Option | Description | Selected |
|--------|-------------|----------|
| Cung scout (Khuyen nghi) | Tat ca scanner dung Haiku | ✓ |
| Phan theo do phuc tap | Categories don gian dung scout, phuc tap dung builder | |
| Ban quyet dinh | Claude chon | |

**User's choice:** Cung scout
**Notes:** None

---

## FastCode pattern

### Tool-first flow

| Option | Description | Selected |
|--------|-------------|----------|
| FastCode truoc, AI sau (Khuyen nghi) | FastCode discovery truoc, AI phan tich sau | ✓ |
| Grep + FastCode hon hop | Grep cho pattern don gian, FastCode cho phuc tap | |
| Ban quyet dinh | Claude chon | |

**User's choice:** FastCode truoc, AI sau
**Notes:** None

### Fallback strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Fallback Grep (Khuyen nghi) | FastCode loi → dung Grep + Glob thay the, ghi note | ✓ |
| Ghi inconclusive | Khong fallback, danh dau inconclusive | |
| Ban quyet dinh | Claude chon | |

**User's choice:** Fallback Grep
**Notes:** None

---

## Claude's Discretion

- Chi tiet YAML schema (field names, value types)
- Thu tu migrate 13 files
- Cach ghi categories list trong AGENT_REGISTRY

## Deferred Ideas

None — discussion stayed within phase scope
