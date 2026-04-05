# Phase 38: Nen tang Luu tru Nghien cuu - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Tao nen tang luu tru nghien cuu: thu muc phan tach internal/external, frontmatter chuan 8 fields, confidence conventions, va research-store.js pure function module voi 6 functions. Day la nen tang cho toan bo v3.0 — moi phase sau phu thuoc vao cau truc nay.

</domain>

<decisions>
## Implementation Decisions

### Frontmatter Schema (AUDIT-01, AUDIT-03)
- **D-01:** Extended schema 8 fields: `agent`, `created` (ISO-8601), `source` (internal/external), `topic`, `confidence` (HIGH/MEDIUM/LOW), `scope` (project name), `expires` (ISO-8601), `tags` (YAML array).
- **D-02:** Tat ca 8 fields bat buoc trong moi research file. `parseFrontmatter()` tu utils.js co the parse — chi can validate them cac fields moi.
- **D-03:** Confidence 3 bac: HIGH = Context7/official docs/codebase truc tiep, MEDIUM = nhieu nguon web dong y, LOW = 1 nguon duy nhat hoac khong xac minh duoc.

### RES-ID Numbering (STORE-02)
- **D-04:** Format: `RES-[3-digit]-[SLUG].md` (VD: `RES-001-CVE-NESTJS.md`).
- **D-05:** Auto-increment: scan existing files trong external/, tim so lon nhat, +1. Dung `nextResId(existingFiles)`.
- **D-06:** Slug generation: normalize tieng Viet (NFD + regex), lowercase, replace spaces voi dash, gioi han 40 ky tu. Reuse pattern tu session-manager.js.

### research-store.js API
- **D-07:** 6 functions trong 1 module pure function:
  - `createEntry({ source, topic, content, agent, confidence, tags, scope })` -> `{ filePath, fileName, frontmatter }`
  - `parseEntry(content)` -> `{ frontmatter, body, sections }` (reuse parseFrontmatter internally)
  - `nextResId(existingFiles)` -> `'RES-004'` (3-digit padded)
  - `listEntries(dir)` -> `[{ id, source, topic, confidence, created, filePath }]`
  - `generateIndex(entries)` -> markdown table string
  - `appendAuditLog({ agent, action, topic, sourceCount, confidence })` -> updated log string
- **D-08:** TDD pattern nhat quan voi v2.1 — test truoc, code sau. File: `bin/lib/research-store.js`, test: `test/smoke-research-store.test.js`.

### Xu ly Research Hien Co
- **D-09:** Di chuyen 5 files research milestone (STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md, SUMMARY.md) tu `.planning/research/` vao `.planning/milestones/v3.0-research/`. Giu sach `.planning/research/` cho he thong moi.
- **D-10:** Sau khi di chuyen, tao `.planning/research/internal/` va `.planning/research/external/` rong.

### Internal Directory Structure (STORE-01)
- **D-11:** Internal files dung ten mo ta: `TECHNICAL_STRATEGY.md`, `CODEBASE_MAP.md`, etc. Khong dung RES-ID numbering.
- **D-12:** Frontmatter internal files co `source: internal`, `scope: [project-name]`.

### Claude's Discretion
- So luong plans va task breakdown
- Test data fixtures
- Error handling chi tiet cho edge cases (empty dir, corrupt frontmatter, etc.)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Research (domain knowledge)
- `.planning/research/STACK.md` — Zero dependencies, reuse parseFrontmatter, pure function pattern
- `.planning/research/ARCHITECTURE.md` — Component design, integration points, data flows
- `.planning/research/PITFALLS.md` — Anti-hallucination pitfalls, INDEX must be generated not maintained

### Existing modules (patterns to follow)
- `bin/lib/utils.js` — parseFrontmatter() function (reuse internally)
- `bin/lib/bug-memory.js` — createBugRecord/buildIndex pattern (similar API shape)
- `bin/lib/session-manager.js` — slug generation pattern (normalize tieng Viet)
- `bin/lib/evidence-protocol.js` — validateEvidence pattern (frontmatter validation)

### Requirements
- `.planning/REQUIREMENTS.md` — STORE-01, STORE-02, AUDIT-01, AUDIT-03

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `parseFrontmatter(content)` tu utils.js — parse YAML frontmatter tu markdown
- `createBugRecord` pattern tu bug-memory.js — similar create + auto-increment ID
- `buildIndex` pattern tu bug-memory.js — similar generate INDEX.md
- Session slug generation tu session-manager.js — normalize tieng Viet

### Established Patterns
- Pure function modules trong bin/lib/ voi TDD
- YAML frontmatter cho structured metadata
- Markdown tables cho index/listing
- Module exports + unit tests trong test/smoke-*.test.js

### Integration Points
- `.planning/research/internal/` — new directory
- `.planning/research/external/` — new directory
- `.planning/research/INDEX.md` — new auto-generated file
- `.planning/research/AUDIT_LOG.md` — new append-only file
- `bin/lib/research-store.js` — new module

</code_context>

<specifics>
## Specific Ideas

- Frontmatter validation nen non-blocking (warnings thay vi throw) — nhat quan voi evidence-protocol.js
- generateIndex nen return string (pure function), KHONG ghi file truc tiep
- appendAuditLog nen return updated string, caller ghi file

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 38-nen-tang-luu-tru-nghien-cuu*
*Context gathered: 2026-03-25*
