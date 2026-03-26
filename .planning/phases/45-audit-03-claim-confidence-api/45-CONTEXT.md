# Phase 45: AUDIT-03 Claim-Level Confidence API - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Mo rong research-store.js de ho tro confidence o cap claim — createEntry() render claims voi inline tags, parseClaims() extract claim-level confidence tu research file content. Refactor validateEvidence() de reuse parseClaims() noi bo.

</domain>

<decisions>
## Implementation Decisions

### Claims input (createEntry)
- **D-01:** Them parameter `claims: [{ text, source, confidence }]` vao createEntry(). createEntry tu dong render markdown voi inline confidence tags trong section `## Bang chung`.
- **D-02:** `claims` va `body` co the dung song song — neu co claims[], createEntry append rendered claims vao body. Neu khong co claims[], body giu nguyen nhu cu (backward-compatible).

### Claims output (parseClaims)
- **D-03:** Tao function `parseClaims(content)` TACH RIENG — khong them vao parseEntry(). parseEntry() giu nguyen API hien co.
- **D-04:** parseClaims() tra ve `[{ text, source, confidence }]` — extract tu section `## Bang chung` trong content.

### Inline confidence tag format
- **D-05:** Format: `- [text] — [source] (confidence: LEVEL)` — nhat quan voi comment trong validateEvidence hien co (dong 231).
- **D-06:** Parse bang regex, chap nhan ca em dash (—) va double dash (--) lam source separator (giu nhat quan voi validateEvidence).

### Quan he voi validateEvidence
- **D-07:** parseClaims() la ham core extract claims. validateEvidence() REFACTOR de goi parseClaims() thay vi tu parse `## Bang chung` section.
- **D-08:** validateEvidence() giu nguyen API output `{ valid, warnings }` — chi thay doi noi bo implementation.

### Default khi thieu confidence tag
- **D-09:** Claim khong co inline `(confidence: LEVEL)` => parseClaims tra `confidence: null`. Caller tu quyet dinh fallback (vd: dung file-level confidence).

### Carrying Forward
- Confidence 3 bac: HIGH/MEDIUM/LOW (Phase 38 D-03) — locked
- TDD pattern: test truoc, code sau (Phase 38 D-08) — locked
- createEntry/parseEntry API shape (Phase 38 D-07) — locked, parseEntry khong thay doi
- Claim format `- [text] — [source] (confidence: LEVEL)` tu validateEvidence (Phase 38) — locked
- CLI script pattern: bin/*.js goi bin/lib/*.js (Phase 43 D-05) — khong ap dung, phase nay chi sua module

### Claude's Discretion
- Test data fixtures va edge cases
- So luong plans va task breakdown
- Chi tiet regex pattern cho parseClaims
- Cach render claims khi createEntry co ca body va claims[]

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### research-store.js (modify)
- `bin/lib/research-store.js` — createEntry (dong 130), parseEntry (dong 186), validateEvidence (dong 238) — ca 3 functions can sua/them

### confidence-scorer.js (reference)
- `bin/lib/confidence-scorer.js` — scoreConfidence, classifySource — rule-based confidence logic hien co

### Tests (verify + extend)
- `test/smoke-research-store.test.js` — Tests hien co cho createEntry, parseEntry, validateEvidence — can mo rong cho claims

### Requirements
- `.planning/REQUIREMENTS.md` — AUDIT-03: confidence 3 bac gan o ca cap file va cap claim

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `validateEvidence()` dong 238 — da co logic parse `## Bang chung` section va check source separator, se refactor de goi parseClaims()
- `parseFrontmatter()` tu utils.js — reuse trong parseEntry, khong can thay doi
- `buildFrontmatter()` tu utils.js — reuse trong createEntry, khong can thay doi
- `CONFIDENCE_LEVELS` constant — da co, reuse cho validation

### Established Patterns
- Pure function pattern: KHONG doc file, KHONG require('fs'), content truyen qua tham so
- Validation pattern: return `{ valid, errors/warnings }` thay vi throw
- TDD: test file `test/smoke-*.test.js`

### Integration Points
- `validateEvidence()` se goi `parseClaims()` noi bo — backward-compatible refactor
- `createEntry()` them optional `claims[]` — backward-compatible (khong co claims = giu nguyen)
- Callers hien co cua validateEvidence khong can thay doi (API output khong doi)

</code_context>

<specifics>
## Specific Ideas

Khong co yeu cau cu the — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 45-audit-03-claim-confidence-api*
*Context gathered: 2026-03-26*
