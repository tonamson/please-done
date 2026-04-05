# Phase 55: Parallel Dispatch Wiring - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 55 wire cac building blocks da co trong `resource-config.js` (`getAdaptiveParallelLimit()`, `isHeavyAgent()`, `shouldDegrade()`) vao `parallel-dispatch.js` de dispatch thong minh hon. Cu the:

1. `buildScannerPlan()` dung adaptive worker count thay vi hardcode `batchSize = 2`
2. `isHeavyAgent()` check truoc khi spawn — agent nang giam 1 worker
3. Enforce `PARALLEL_MIN=2` va `PARALLEL_MAX=4`
4. Backpressure: worker timeout >120s → khong spawn them, cho xong
5. Graceful degradation: load average > CPU count → giam 1 worker

Phase nay KHONG handle: tao agent moi (Phase 53 — done), platform mapping (Phase 54 — done), skill-agent integration (Phase 56).

</domain>

<decisions>
## Implementation Decisions

### Adaptive Worker Count
- **D-01:** `buildScannerPlan()` default `batchSize = getAdaptiveParallelLimit().workers` khi caller khong truyen batchSize (null/undefined). Caller van co the override bang truyen explicit.
- **D-02:** `buildParallelPlan()` (Detective+DocSpec) giu nguyen 2 agents co dinh — khong can adaptive vi 2 ≤ PARALLEL_MIN. Chi them isHeavyAgent comment/annotation.
- **D-03:** `getAdaptiveParallelLimit()` duoc goi moi lan dispatch (khong cache) — `os.cpus()` va `os.freemem()` rat nhanh (<1ms), dam bao data luon tuoi.

### Heavy Agent Handling
- **D-04:** Moi heavy agent trong wave giam limit di 1. Vi du: adaptive = 3, 1 heavy → chay 2 worker. Van dam bao ≥ PARALLEL_MIN.
- **D-05:** Heavy check nam trong `buildScannerPlan()` — goi `isHeavyAgent('pd-sec-scanner')` 1 lan de quyet dinh. Neu heavy va batchSize > PARALLEL_MIN → giam batchSize di 1.
- **D-06:** `buildParallelPlan()` — Detective la heavy (fastcode), DocSpec la light. Ghi chu trong code, khong thay doi logic vi chi co 2 agents.

### Backpressure Strategy
- **D-07:** Khi `shouldDegrade(error)` = true → set flag `backpressure: true` trong merge result. Khong spawn worker moi cho den khi wave hien tai hoan thanh.
- **D-08:** Caller (workflow) doc flag `backpressure` de quyet dinh co tiep wave tiep khong.
- **D-09:** Mot khi backpressure = true, tat ca wave con lai chay `batchSize = 1` (tuan tu). KHONG tu dong resume song song. Tai dispatch moi se re-evaluate adaptive.

### Graceful Degradation
- **D-10:** Mo rong `getAdaptiveParallelLimit()` trong `resource-config.js` — them `os.loadavg()[0]` check (1-minute average).
- **D-11:** Neu loadAvg > cpuCount va workers > PARALLEL_MIN → giam workers di 1. Append reason vao ket qua.
- **D-12:** Return object them field `loadAvg` de caller co the log.

### Claude's Discretion
- Test strategy va test file naming
- Exact return object fields khi backpressure
- Warning message wording
- JSDoc va comment formatting

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source Code
- `bin/lib/resource-config.js` — Source of truth cho `getAdaptiveParallelLimit()`, `isHeavyAgent()`, `shouldDegrade()`, `PARALLEL_MIN/MAX`, `TIER_MAP`, `AGENT_REGISTRY`
- `bin/lib/parallel-dispatch.js` — Target chinh: `buildParallelPlan()`, `buildScannerPlan()`, `mergeParallelResults()`, `mergeScannerResults()`

### Tests
- `test/smoke-agent-files.test.js` — Integration tests cho agent files + registry consistency
- `test/resource-config.test.js` — Unit tests cho resource-config pure functions (neu ton tai)

### Prior Context
- `.planning/phases/52-agent-tier-system/52-CONTEXT.md` — D-01 (generic TIER_MAP), D-03/D-04 (fallback behavior)
- `.planning/phases/54-platform-mapping-fallback/54-CONTEXT.md` — D-07/D-08 (getModelForTier platform param, silent downgrade)
- `.planning/phases/08-wave-based-parallel-execution/08-CONTEXT.md` — D-05 (auto-serialize), D-07 (build check per wave)

### Requirements
- `.planning/REQUIREMENTS.md` — PARA-01 through PARA-05

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getAdaptiveParallelLimit()` (resource-config.js:307-330) — Da co, tra ve `{ workers, reason, cpu, freeMemGB }`. Can mo rong them loadAvg.
- `isHeavyAgent()` (resource-config.js:341-348) — Da co, check HEAVY_TOOL_PATTERNS (fastcode)
- `shouldDegrade()` (resource-config.js:362-379) — Da co, detect timeout/resource_exhausted/rate_limit
- `PARALLEL_MIN=2`, `PARALLEL_MAX=4`, `PARALLEL_DEFAULT=3` (resource-config.js:176-178) — Da co

### Established Patterns
- Pure functions, khong side effects — ca 2 files deu khong doc file truc tiep
- `{ ...entry }` copy pattern — prevent mutation
- `validateEvidence()` goi trong merge functions — pattern validation co san

### Integration Points
- `buildScannerPlan()` — wire adaptive batchSize + heavy agent check
- `mergeScannerResults()` / `mergeParallelResults()` — wire backpressure flag khi shouldDegrade
- `getAdaptiveParallelLimit()` — mo rong them loadAvg check

</code_context>

<specifics>
## Specific Ideas

- `buildScannerPlan(categories, batchSize, scanPath)` — khi batchSize == null, goi `getAdaptiveParallelLimit().workers` lam default
- `getAdaptiveParallelLimit()` them `os.loadavg()[0]` check sau CPU/RAM logic hien tai
- Backpressure flag la property tren merge result object — caller doc flag de quyet dinh
- Recovery strategy don gian: backpressure = true → sequential den het. Dispatch moi re-evaluate.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 055-parallel-dispatch-wiring*
*Context gathered: 2026-03-27*
