# Phase 41: Bao ve Workflow - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Them 3 workflow guards: CHECK-06 Plan-Gate (research backing), Mandatory Suggestion (hedging detection), Strategy Injection (auto-load research context). Tat ca NON-BLOCKING — WARN default, khong BLOCK.

</domain>

<decisions>
## Implementation Decisions

### CHECK-06: Plan-Gate Research Backing (GUARD-01)
- **D-01:** Extend plan-checker.js voi function `checkResearchBacking(planContent, researchDir)`.
- **D-02:** Logic: doc Key Links / References section trong PLAN.md -> kiem tra co lien ket den `.planning/research/` files khong. Neu khong co ref nao -> WARN.
- **D-03:** Severity: WARN default. Configurable qua `config.json` key `checks.research_backing.severity` (WARN/BLOCK/OFF). Nhat quan voi CHECK-05 pattern.
- **D-04:** Chi fire khi `.planning/research/internal/` hoac `.planning/research/external/` co files (khong fire khi research dir rong).
- **D-05:** Register trong CHECK_REGISTRY nhu CHECK-06 voi name "Research Backing".

### CHECK-07: Mandatory Suggestion — Hedging Detection (GUARD-02)
- **D-06:** Extend plan-checker.js voi function `checkHedgingLanguage(planContent)`.
- **D-07:** Regex patterns: `/chua ro|can tim hieu|co the.*hoac|khong chac|chua xac dinh|can nghien cuu/gi`. Phat hien >= 2 matches -> WARN voi goi y `pd research`.
- **D-08:** Severity: WARN default, configurable qua `checks.hedging_language.severity`.
- **D-09:** Register trong CHECK_REGISTRY nhu CHECK-07 voi name "Hedging Language".

### Strategy Injection (GUARD-03)
- **D-10:** Them guard vao `workflows/write-code.md` va `workflows/plan.md` — tu dong doc INDEX.md va inject research context.
- **D-11:** Logic: (1) Doc `.planning/research/INDEX.md`, (2) Keyword match topic voi task/plan dang lam, (3) Doc toi da 2 matching files, (4) Inject noi dung (toi da 2000 tokens) vao agent prompt nhu `<research-context>` block.
- **D-12:** Fallback: neu INDEX.md khong ton tai hoac khong co match -> skip silently (khong loi, khong canh bao).
- **D-13:** Implement nhu guard micro-template (reuse pattern tu Phase 2 v1.0).

### Carrying Forward
- plan-checker.js CHECK_REGISTRY pattern (8 existing checks) — locked
- Severity configurable pattern tu CHECK-05 — locked
- Guard micro-template pattern tu Phase 2 — locked
- INDEX.md format tu Phase 39 — locked

### Claude's Discretion
- So luong plans va task breakdown
- Exact regex patterns cho hedging detection
- Token counting strategy cho Strategy Injection (character count vs word count)

</decisions>

<canonical_refs>
## Canonical References

### Plan checker (extend)
- `bin/lib/plan-checker.js` — CHECK_REGISTRY, existing 8 checks pattern
- `test/smoke-plan-checker.test.js` — Existing plan checker tests

### Workflow files (modify for Strategy Injection)
- `workflows/write-code.md` — Add research context injection
- `workflows/plan.md` — Add research context injection

### Research modules (read for integration)
- `bin/lib/research-store.js` — generateIndex, parseEntry
- `bin/lib/index-generator.js` — generateIndex function

### Research
- `.planning/milestones/v3.0-research/FEATURES.md` — D-TS1, D-TS2, D-TS3
- `.planning/milestones/v3.0-research/PITFALLS.md` — Guard overblocking pitfall

### Requirements
- `.planning/REQUIREMENTS.md` — GUARD-01, GUARD-02, GUARD-03

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- plan-checker.js CHECK_REGISTRY — extend with 2 new checks
- Guard micro-template pattern — reuse for Strategy Injection
- INDEX.md format — keyword matching against topic field

### Established Patterns
- Check functions return `{ passed, issues }` array
- Severity configurable via config.json
- Non-blocking WARN = show in table, don't block execution
- Guard micro-templates = conditional context loading blocks in workflow markdown

### Integration Points
- `bin/lib/plan-checker.js` — Add CHECK-06 + CHECK-07
- `test/smoke-plan-checker.test.js` — Add tests for new checks
- `workflows/write-code.md` — Add Strategy Injection guard
- `workflows/plan.md` — Add Strategy Injection guard
- `test/snapshots/` — Regenerate after workflow changes

</code_context>

<specifics>
## Specific Ideas

- CHECK-06 va CHECK-07 la 2 functions rieng trong plan-checker.js — nhat quan voi 8 checks hien co
- Strategy Injection la text block trong workflow — khong phai JS module
- False positive rate test: chay CHECK-06 tren existing plans tu Phase 38-40 de verify < 5%

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 41-bao-ve-workflow*
*Context gathered: 2026-03-25*
