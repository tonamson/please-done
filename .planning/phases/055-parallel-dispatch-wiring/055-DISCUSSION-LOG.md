# Phase 55: Parallel Dispatch Wiring - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 055-parallel-dispatch-wiring
**Areas discussed:** Adaptive worker count, Heavy agent handling, Backpressure strategy, Graceful degradation

---

## Adaptive Worker Count

### Q1: Cach wire getAdaptiveParallelLimit() vao dispatch

| Option | Description | Selected |
|--------|-------------|----------|
| Tat ca dung adaptive | buildScannerPlan default batchSize = adaptive. buildParallelPlan giu 2. | ✓ |
| Wrapper function moi | Tao getDispatchConfig() wrap adaptive + heavy + load check | |
| Ban quyet dinh | Claude chon | |

**User's choice:** Tat ca dung adaptive
**Notes:** buildScannerPlan default batchSize = getAdaptiveParallelLimit().workers khi caller khong truyen

### Q2: Caching strategy cho getAdaptiveParallelLimit()

| Option | Description | Selected |
|--------|-------------|----------|
| Call moi lan | os.cpus() va os.freemem() rat nhanh (<1ms), data luon tuoi | ✓ |
| Cache 60 giay | Luu ket qua, refresh sau 60s | |
| Ban quyet dinh | Claude chon | |

**User's choice:** Call moi lan
**Notes:** RAM co the thay doi giua cac wave, nen call moi lan la hop ly

### Q3: buildParallelPlan (Detective+DocSpec) dung adaptive khong?

| Option | Description | Selected |
|--------|-------------|----------|
| Giu nguyen 2 | 2 ≤ PARALLEL_MIN, chi them isHeavyAgent comment | ✓ |
| Dong nhat goi adaptive | Goi adaptive du chi 2 agents — code path nhat quan | |
| Ban quyet dinh | Claude chon | |

**User's choice:** Giu nguyen 2
**Notes:** Khong can adaptive vi luon chi co 2 agents co dinh

---

## Heavy Agent Handling

### Q1: Xu ly khi co heavy agent trong wave

| Option | Description | Selected |
|--------|-------------|----------|
| Giam 1 worker | Moi heavy agent giam limit di 1, van ≥ PARALLEL_MIN | ✓ |
| Block 2 heavy cung luc | Khong cho 2 heavy chay song song, serialize | |
| Ban quyet dinh | Claude chon | |

**User's choice:** Giam 1 worker
**Notes:** Math.max(PARALLEL_MIN, workers - heavyCount)

### Q2: Heavy check o dau?

| Option | Description | Selected |
|--------|-------------|----------|
| Scanner: check agent name | buildScannerPlan goi isHeavyAgent('pd-sec-scanner') 1 lan | ✓ |
| Caller tu check | Workflow tu goi isHeavyAgent() va truyen batchSize da adjust | |
| Ban quyet dinh | Claude chon | |

**User's choice:** Scanner: check agent name
**Notes:** buildScannerPlan biet agent la pd-sec-scanner — check truc tiep trong function

---

## Backpressure Strategy

### Q1: Phan ung khi shouldDegrade() = true

| Option | Description | Selected |
|--------|-------------|----------|
| Pause spawn | Khong spawn worker moi, set backpressure: true flag | ✓ |
| Giam worker so luong | Giam batchSize con PARALLEL_MIN cho cac wave tiep | |
| Sequential fallback | batchSize = 1 cho tat ca wave con lai | |
| Ban quyet dinh | Claude chon | |

**User's choice:** Pause spawn
**Notes:** Tra ve flag backpressure: true trong merge result de caller biet

### Q2: Recovery sau backpressure

| Option | Description | Selected |
|--------|-------------|----------|
| Giu tuan tu den het | Backpressure = true → tat ca wave con lai batchSize = 1 | ✓ |
| Tu dong resume | Sau wave tuan tu thanh cong, thu tang lai batchSize | |
| Ban quyet dinh | Claude chon | |

**User's choice:** Giu tuan tu den het
**Notes:** Don gian, an toan. Tai dispatch moi se re-evaluate adaptive.

---

## Graceful Degradation

### Q1: Load check nam o dau?

| Option | Description | Selected |
|--------|-------------|----------|
| Trong getAdaptiveParallelLimit() | Mo rong function hien co — them os.loadavg()[0] check | ✓ |
| Function rieng | Tao checkSystemLoad() rieng, caller goi ket hop | |
| Ban quyet dinh | Claude chon | |

**User's choice:** Trong getAdaptiveParallelLimit()
**Notes:** Ket qua tu dong ap dung cho moi caller

### Q2: Load average metric index

| Option | Description | Selected |
|--------|-------------|----------|
| 1-min average [0] | Phan ung nhanh voi spike gan day | ✓ |
| 5-min average [1] | On dinh hon, loc bot spike tam thoi | |
| Ban quyet dinh | Claude chon | |

**User's choice:** 1-min average [0]
**Notes:** Phu hop cho dispatch dang chay (session ngan)

---

## Claude's Discretion

- Test strategy va test file naming
- Exact return object fields khi backpressure
- Warning message wording
- JSDoc va comment formatting

## Deferred Ideas

None — discussion stayed within phase scope.
