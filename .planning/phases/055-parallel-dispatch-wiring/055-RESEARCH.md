# Phase 55: Parallel Dispatch Wiring - Research

**Researched:** 2026-03-27
**Domain:** Node.js parallel dispatch, resource-aware scheduling, backpressure
**Confidence:** HIGH

## Summary

Phase 55 wire cac building blocks da co san trong `resource-config.js` vao `parallel-dispatch.js`. Tat ca ham can thiet (`getAdaptiveParallelLimit()`, `isHeavyAgent()`, `shouldDegrade()`) da duoc implement va test. Cong viec chinh la:

1. Sua `buildScannerPlan()` de goi `getAdaptiveParallelLimit().workers` lam default batchSize thay vi hardcode 2
2. Them `isHeavyAgent()` check trong `buildScannerPlan()` de giam worker khi co heavy agent
3. Mo rong `getAdaptiveParallelLimit()` them `os.loadavg()[0]` check (graceful degradation)
4. Them backpressure flag trong `mergeScannerResults()` va `mergeParallelResults()` khi `shouldDegrade()` = true

Day la phase thuan code — khong co external dependency, khong can library moi. Ca 2 file target deu la pure functions, test 100% bang `node:test`.

**Primary recommendation:** Chia 3 plans: (1) adaptive + heavy agent trong dispatch, (2) loadAvg + graceful degradation trong resource-config, (3) backpressure flag trong merge functions + tests.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** `buildScannerPlan()` default `batchSize = getAdaptiveParallelLimit().workers` khi caller khong truyen batchSize (null/undefined). Caller van co the override bang truyen explicit.
- **D-02:** `buildParallelPlan()` (Detective+DocSpec) giu nguyen 2 agents co dinh — khong can adaptive vi 2 <= PARALLEL_MIN. Chi them isHeavyAgent comment/annotation.
- **D-03:** `getAdaptiveParallelLimit()` duoc goi moi lan dispatch (khong cache) — `os.cpus()` va `os.freemem()` rat nhanh (<1ms).
- **D-04:** Moi heavy agent trong wave giam limit di 1. Vi du: adaptive = 3, 1 heavy -> chay 2 worker. Van dam bao >= PARALLEL_MIN.
- **D-05:** Heavy check nam trong `buildScannerPlan()` — goi `isHeavyAgent('pd-sec-scanner')` 1 lan de quyet dinh.
- **D-06:** `buildParallelPlan()` — Detective la heavy (fastcode), DocSpec la light. Ghi chu trong code, khong thay doi logic.
- **D-07:** Khi `shouldDegrade(error)` = true -> set flag `backpressure: true` trong merge result.
- **D-08:** Caller (workflow) doc flag `backpressure` de quyet dinh co tiep wave tiep khong.
- **D-09:** Backpressure = true -> tat ca wave con lai chay `batchSize = 1` (tuan tu). KHONG tu dong resume.
- **D-10:** Mo rong `getAdaptiveParallelLimit()` trong `resource-config.js` — them `os.loadavg()[0]` check.
- **D-11:** Neu loadAvg > cpuCount va workers > PARALLEL_MIN -> giam workers di 1. Append reason.
- **D-12:** Return object them field `loadAvg` de caller co the log.

### Claude's Discretion
- Test strategy va test file naming
- Exact return object fields khi backpressure
- Warning message wording
- JSDoc va comment formatting

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PARA-01 | `parallel-dispatch.js` goi `getAdaptiveParallelLimit()` thay vi hardcode 2 workers | D-01: `buildScannerPlan()` default batchSize = adaptive. `buildParallelPlan()` giu 2 (D-02). Wire import `getAdaptiveParallelLimit` tu resource-config.js |
| PARA-02 | `isHeavyAgent()` check truoc khi spawn — agent nang giam 1 worker | D-04/D-05: `buildScannerPlan()` goi `isHeavyAgent('pd-sec-scanner')`, neu heavy va batchSize > PARALLEL_MIN -> giam 1. D-06: `buildParallelPlan()` chi ghi chu. Wire import `isHeavyAgent`, `PARALLEL_MIN` |
| PARA-03 | `PARALLEL_MIN=2` va `PARALLEL_MAX=4` enforce | Clamp trong `buildScannerPlan()` sau adaptive + heavy adjustment: `Math.max(PARALLEL_MIN, Math.min(PARALLEL_MAX, batchSize))`. Constants da export tu resource-config.js |
| PARA-04 | Backpressure — worker timeout >120s -> khong spawn them | D-07/D-08/D-09: `mergeScannerResults()` va `mergeParallelResults()` check `shouldDegrade(error)` tren moi result, set `backpressure: true` tren return object. Caller doc flag |
| PARA-05 | Graceful degradation — load average > CPU count -> giam 1 worker | D-10/D-11/D-12: Mo rong `getAdaptiveParallelLimit()` trong resource-config.js: them `os.loadavg()[0]`, neu > cpuCount va workers > PARALLEL_MIN -> giam 1, append reason, them field loadAvg |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node:os | built-in | CPU count, free memory, load average | Da dung trong getAdaptiveParallelLimit(), them loadavg() |
| node:test | built-in | Test framework | Da dung trong toan bo project (1070 tests pass) |
| node:assert/strict | built-in | Assertions | Da dung trong toan bo project |

### Supporting
Khong can library moi. Tat ca building blocks da co trong `resource-config.js`.

### Alternatives Considered
Khong ap dung — phase nay chi wire code da co, khong can chon library.

## Architecture Patterns

### Target File Structure (khong thay doi)
```
bin/lib/
  resource-config.js    # Mo rong getAdaptiveParallelLimit() them loadAvg
  parallel-dispatch.js  # Wire adaptive + heavy + backpressure
test/
  smoke-parallel-dispatch.test.js  # Mo rong tests cho features moi
```

### Pattern 1: Adaptive Default with Caller Override
**What:** `buildScannerPlan(categories, batchSize, scanPath)` — khi `batchSize` la `null`/`undefined`, goi `getAdaptiveParallelLimit().workers`. Caller van co the override.
**When to use:** Moi khi can default thong minh nhung van cho phep explicit control.
**Example:**
```javascript
// parallel-dispatch.js
const { getAdaptiveParallelLimit, isHeavyAgent, PARALLEL_MIN, PARALLEL_MAX } = require('./resource-config');

function buildScannerPlan(categories, batchSize = null, scanPath = '.') {
  // D-01: adaptive default khi caller khong truyen
  if (batchSize == null) {
    batchSize = getAdaptiveParallelLimit().workers;
  }

  // D-05: heavy agent check
  if (isHeavyAgent('pd-sec-scanner') && batchSize > PARALLEL_MIN) {
    batchSize -= 1;
  }

  // PARA-03: enforce min/max
  batchSize = Math.max(PARALLEL_MIN, Math.min(PARALLEL_MAX, batchSize));

  // ... rest of wave logic unchanged
}
```

### Pattern 2: Backpressure Flag on Merge Result
**What:** Merge functions check `shouldDegrade(error)` tren moi result item, set `backpressure: true` tren return object.
**When to use:** Khi can bao hieu caller giam tai.
**Example:**
```javascript
// trong mergeScannerResults()
function mergeScannerResults(scanResults) {
  // ... existing logic ...
  let backpressure = false;

  for (const item of scanResults) {
    if (item.error && shouldDegrade(item.error)) {
      backpressure = true;
    }
    // ... existing processing ...
  }

  return { results, completedCount, failedCount, warnings, backpressure };
}
```

### Pattern 3: LoadAvg Extension in getAdaptiveParallelLimit
**What:** Them `os.loadavg()[0]` check sau CPU/RAM logic hien tai.
**When to use:** Detect he thong dang tai nang (nhieu process khac chay).
**Example:**
```javascript
// resource-config.js — mo rong getAdaptiveParallelLimit()
function getAdaptiveParallelLimit() {
  const os = require('os');
  const cpuCount = os.cpus().length;
  const freeMemBytes = os.freemem();
  const freeMemGB = (freeMemBytes / 1024 ** 3).toFixed(1);
  const loadAvg = os.loadavg()[0]; // 1-minute average

  let workers = PARALLEL_DEFAULT;
  let reason = 'default';

  // ... existing CPU/RAM logic ...

  // D-10/D-11: loadAvg check — giam 1 worker neu he thong qua tai
  if (loadAvg > cpuCount && workers > PARALLEL_MIN) {
    workers -= 1;
    reason += ` + loadAvg ${loadAvg.toFixed(1)} > ${cpuCount} CPU — giam 1`;
  }

  return { workers, reason, cpu: cpuCount, freeMemGB, loadAvg }; // D-12
}
```

### Anti-Patterns to Avoid
- **Cache getAdaptiveParallelLimit():** D-03 yeu cau goi moi lan — os.cpus() + os.freemem() < 1ms, data luon tuoi.
- **Thay doi buildParallelPlan() logic:** D-02 — Detective+DocSpec giu 2 co dinh vi 2 <= PARALLEL_MIN.
- **Tu dong resume sau backpressure:** D-09 — mot khi backpressure = true, wave con lai sequential. Dispatch moi re-evaluate.
- **Giam duoi PARALLEL_MIN:** Heavy agent check va loadAvg check deu phai `clamp >= PARALLEL_MIN`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Adaptive worker count | Custom CPU detection | `getAdaptiveParallelLimit()` | Da implement, da co CPU/RAM logic |
| Heavy agent detection | Custom tool scanning | `isHeavyAgent()` | Da implement, match HEAVY_TOOL_PATTERNS |
| Degradation detection | Custom error parsing | `shouldDegrade()` | Da implement, check code + duration + message pattern |
| Min/max enforcement | Custom clamping | `PARALLEL_MIN`, `PARALLEL_MAX` | Da export tu resource-config.js |

**Key insight:** Moi building block da co va da test. Phase nay chi la WIRING — import va goi ham, khong viet logic moi.

## Common Pitfalls

### Pitfall 1: Breaking Default batchSize Signature
**What goes wrong:** Thay doi `batchSize = 2` thanh `batchSize = null` se break callers truyen `undefined` (hoac khong truyen).
**Why it happens:** Default parameter `= 2` hien tai nghia la caller khong truyen se nhan 2.
**How to avoid:** Doi signature thanh `batchSize = null`, kiem tra `batchSize == null` (loose equality bat ca null va undefined). Tests hien tai truyen explicit batchSize nen khong bi anh huong.
**Warning signs:** Test `buildScannerPlan(ALL_13, 2)` van pass nhung test khong truyen batchSize fail.

### Pitfall 2: Heavy Agent Check Lam Giam Duoi PARALLEL_MIN
**What goes wrong:** adaptive = 2 (PARALLEL_MIN), heavy giam 1 → batchSize = 1 < PARALLEL_MIN.
**Why it happens:** Giam truoc khi clamp.
**How to avoid:** Clamp sau tat ca adjustments: `Math.max(PARALLEL_MIN, ...)`.
**Warning signs:** batchSize < 2 trong wave output.

### Pitfall 3: Backpressure Flag Khong Duoc Doc
**What goes wrong:** Them backpressure flag nhung workflow khong doc no.
**Why it happens:** D-08 noi caller doc flag, nhung workflow la markdown file khong co runtime code.
**How to avoid:** Phase nay chi set flag — workflow update la phan rieng (ghi chu cho tuong lai). Dam bao return type thay doi duoc document ro.
**Warning signs:** Backpressure field co nhung workflow van dispatch binh thuong.

### Pitfall 4: os.loadavg() Return 0 Tren Mot So OS
**What goes wrong:** Windows tra ve `[0, 0, 0]` cho os.loadavg().
**Why it happens:** Load average la concept cua Unix/Linux.
**How to avoid:** Check `loadAvg > 0` truoc khi so sanh voi cpuCount. Neu 0, skip check.
**Warning signs:** Test fail tren Windows CI.

### Pitfall 5: Existing Tests Expect Exact Return Shape
**What goes wrong:** `getAdaptiveParallelLimit()` them field `loadAvg` → callers expect exact shape may break.
**Why it happens:** Destructuring `{ workers, reason, cpu, freeMemGB }` se bo qua loadAvg — khong van de. Nhung strict equality test se fail.
**How to avoid:** Tests moi kiem tra loadAvg. Tests cu khong can update vi JavaScript destructuring ignore extra fields.

## Code Examples

### Example 1: buildScannerPlan() sau khi wire (day du)
```javascript
// Source: D-01, D-04, D-05 tu CONTEXT.md
const {
  getAdaptiveParallelLimit, isHeavyAgent,
  PARALLEL_MIN, PARALLEL_MAX
} = require('./resource-config');

function buildScannerPlan(categories, batchSize = null, scanPath = '.') {
  if (!Array.isArray(categories) || categories.length === 0) {
    return {
      waves: [], totalWaves: 0, totalScanners: 0,
      warnings: ['Danh sach categories rong — khong co scanner nao de dispatch'],
    };
  }

  // D-01: adaptive default
  if (batchSize == null) {
    batchSize = getAdaptiveParallelLimit().workers;
  }

  // D-05: heavy agent reduces by 1
  if (isHeavyAgent('pd-sec-scanner') && batchSize > PARALLEL_MIN) {
    batchSize -= 1;
  }

  // PARA-03: enforce bounds
  batchSize = Math.max(PARALLEL_MIN, Math.min(PARALLEL_MAX, batchSize));

  // Clamp < 1 (edge case — should not happen after PARALLEL_MIN clamp)
  if (batchSize < 1) batchSize = 1;

  const waves = [];
  for (let i = 0; i < categories.length; i += batchSize) {
    const batch = categories.slice(i, i + batchSize);
    const wave = batch.map(cat => ({
      category: cat, agentName: 'pd-sec-scanner',
      outputFile: `evidence_sec_${cat}.md`,
    }));
    waves.push(wave);
  }

  return { waves, totalWaves: waves.length, totalScanners: categories.length, warnings: [] };
}
```

### Example 2: mergeScannerResults() voi backpressure flag
```javascript
// Source: D-07 tu CONTEXT.md
const { shouldDegrade } = require('./resource-config');

function mergeScannerResults(scanResults) {
  const warnings = [];
  const results = [];
  let completedCount = 0;
  let failedCount = 0;
  let backpressure = false;

  for (const item of scanResults) {
    // D-07: check shouldDegrade tren moi error
    if (item.error && shouldDegrade(item.error)) {
      backpressure = true;
    }

    // ... existing processing logic unchanged ...
  }

  return { results, completedCount, failedCount, warnings, backpressure };
}
```

### Example 3: getAdaptiveParallelLimit() mo rong loadAvg
```javascript
// Source: D-10, D-11, D-12 tu CONTEXT.md
function getAdaptiveParallelLimit() {
  const os = require('os');
  const cpuCount = os.cpus().length;
  const freeMemBytes = os.freemem();
  const freeMemGB = (freeMemBytes / 1024 ** 3).toFixed(1);
  const loadAvg = os.loadavg()[0];

  let workers = PARALLEL_DEFAULT;
  let reason = 'default';

  // ... existing CPU/RAM logic (unchanged) ...

  // D-10/D-11: loadAvg degradation
  if (loadAvg > 0 && loadAvg > cpuCount && workers > PARALLEL_MIN) {
    workers -= 1;
    reason += ` + loadAvg ${loadAvg.toFixed(1)} vuot ${cpuCount} CPU`;
  }

  return { workers, reason, cpu: cpuCount, freeMemGB, loadAvg };
}
```

## Caller Impact Analysis

### Workflow callers hien tai
| Caller | Ham goi | Cach goi | Impact |
|--------|---------|----------|--------|
| `workflows/audit.md` | `buildScannerPlan(categories, 2, scanPath)` | Truyen explicit `batchSize=2` | **Khong thay doi** — explicit override van hoat dong (D-01) |
| `workflows/audit.md` | `mergeScannerResults(scanResults)` | Doc return object | **Them field backpressure** — khong break vi JS ignore extra fields |
| `workflows/fix-bug.md` | `buildParallelPlan(sessionDir, path)` | Standard call | **Khong thay doi** — D-02 giu nguyen 2 agents |
| `workflows/fix-bug.md` | `mergeParallelResults({...})` | Doc return object | **Them field backpressure** — khong break |

**Key insight:** Caller `audit.md` truyen `batchSize=2` explicit nen se KHONG tu dong dung adaptive. De dung adaptive, caller can truyen `null` hoac khong truyen. Day la by design (D-01). Workflow update la pham vi phase khac hoac future work.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in) |
| Config file | none — chay truc tiep bang `node --run test` |
| Quick run command | `node --test test/smoke-parallel-dispatch.test.js` |
| Full suite command | `node --run test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PARA-01 | buildScannerPlan() default adaptive khi khong truyen batchSize | unit | `node --test test/smoke-parallel-dispatch.test.js` | Co file, can them tests |
| PARA-02 | isHeavyAgent check giam batchSize | unit | `node --test test/smoke-parallel-dispatch.test.js` | Can them tests |
| PARA-03 | Min/max enforce [2,4] | unit | `node --test test/smoke-parallel-dispatch.test.js` | Can them tests |
| PARA-04 | Backpressure flag khi shouldDegrade=true | unit | `node --test test/smoke-parallel-dispatch.test.js` | Can them tests |
| PARA-05 | loadAvg > cpuCount giam workers | unit | `node --test test/smoke-parallel-dispatch.test.js` | Can them tests (co the tach file) |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-parallel-dispatch.test.js`
- **Per wave merge:** `node --run test`
- **Phase gate:** Full suite green (1070+ tests)

### Wave 0 Gaps
- [ ] Tests cho `buildScannerPlan()` khong truyen batchSize (adaptive default) — PARA-01
- [ ] Tests cho heavy agent giam worker — PARA-02
- [ ] Tests cho min/max clamp — PARA-03
- [ ] Tests cho backpressure flag tren merge results — PARA-04
- [ ] Tests cho loadAvg extension cua `getAdaptiveParallelLimit()` — PARA-05

## Environment Availability

Khong can external dependency. Ca hai file target la pure JavaScript modules dung `node:os` (built-in).

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | Yes | v22+ (inferred tu node:test usage) | — |
| node:os | loadavg(), cpus(), freemem() | Yes | built-in | — |
| node:test | Test framework | Yes | built-in | — |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcode `batchSize = 2` | Adaptive via `getAdaptiveParallelLimit()` | Phase 55 | Workers scale voi may: 2-4 |
| Khong co heavy agent awareness | `isHeavyAgent()` giam worker | Phase 55 | Tranh overload khi dung FastCode |
| Khong co backpressure | Flag + sequential fallback | Phase 55 | Tu dong giam tai khi timeout/OOM |
| Khong co loadAvg check | `os.loadavg()[0]` check | Phase 55 | Phan ung voi system load thuc te |

## Open Questions

1. **Workflow caller update**
   - What we know: `audit.md` hien truyen `batchSize=2` explicit — se khong tu dong dung adaptive
   - What's unclear: Co can update workflow truyen `null` de dung adaptive khong?
   - Recommendation: De workflow update cho Phase 56 hoac sau. Phase 55 chi wire code, khong thay doi workflow prose.

2. **Test isolation cho os.loadavg()**
   - What we know: `os.loadavg()` la real system call, khong mock duoc de dang trong node:test (khong co sinon)
   - What's unclear: Lam sao test loadAvg > cpuCount scenario?
   - Recommendation: Extract logic thanh internal function nhan loadAvg param, test function do. Hoac dung dependency injection pattern (truyen os object).

## Sources

### Primary (HIGH confidence)
- `bin/lib/resource-config.js` — Da doc toan bo, xac nhan API: getAdaptiveParallelLimit, isHeavyAgent, shouldDegrade, PARALLEL_MIN/MAX
- `bin/lib/parallel-dispatch.js` — Da doc toan bo, xac nhan 4 functions can wire
- `test/smoke-parallel-dispatch.test.js` — Da doc, xac nhan 1070 tests pass (full suite)
- `workflows/audit.md` — Xac nhan caller truyen batchSize=2 explicit
- `workflows/fix-bug.md` — Xac nhan caller pattern

### Secondary (MEDIUM confidence)
- Node.js `os.loadavg()` — Returns [0,0,0] tren Windows. Verified qua Node.js docs knowledge.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — khong can library moi, tat ca da co
- Architecture: HIGH — patterns ro rang tu CONTEXT.md decisions, code da doc
- Pitfalls: HIGH — da verify callers, return shapes, edge cases

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable — pure functions, no external deps)
