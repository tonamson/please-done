# Phase 58: Token Budget & Benchmark - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Define token budgets per agent tier, run before/after benchmark with `count-tokens.js`, expand `conditional_reading` to more workflows, and integrate eval pipeline for quality measurement. Phase delivers measurable token optimization results documented in `BENCHMARK_RESULTS.md`.

</domain>

<decisions>
## Implementation Decisions

### Token budget thresholds
- **D-01:** Enforce token caps from REQUIREMENTS.md: Scout ≤ 4K, Builder ≤ 8K, Architect ≤ 12K prompt tokens
- **D-02:** Caps are enforcement limits in `resource-config.js`, not just documentation — add `TOKEN_BUDGET` constant per tier
- **D-03:** Benchmark thực tế dùng để validate caps (nếu agent vượt budget → warning log, không hard fail)

### Benchmark scope & methodology
- **D-04:** Cập nhật baseline mới từ trạng thái hiện tại (post-v5.0) bằng `node scripts/count-tokens.js --baseline`
- **D-05:** Đo toàn bộ 39+ files trong 4 target directories (commands/pd, workflows, references, templates)
- **D-06:** So sánh per-tier: nhóm files theo tier tiêu thụ (scout agents đọc files nào, builder đọc files nào)
- **D-07:** Kết quả ghi vào `BENCHMARK_RESULTS.md` tại project root — bảng before/after với delta % per directory

### Conditional reading expansion
- **D-08:** Scan tất cả workflows chưa có `<conditional_reading>` block
- **D-09:** Ưu tiên workflows có references nặng (token count cao) — sắp xếp theo tiềm năng tiết kiệm
- **D-10:** Target: ít nhất 2 workflows mới có conditional_reading (per TOKN-03)
- **D-11:** Giữ nguyên format XML tags hiện có (`<required_reading>` + `<conditional_reading>`)

### Eval quality integration
- **D-12:** Chạy `npm run eval:full` trước và sau khi thay đổi — so sánh pass rate + token count
- **D-13:** Thêm token tracking per eval run vào benchmark history (`evals/benchmarks/`)
- **D-14:** `promptfooconfig.yaml` đã tồn tại và đủ test cases — chỉ verify nó chạy đúng, không cần thêm tests mới

### Claude's Discretion
- Format cụ thể của `BENCHMARK_RESULTS.md` (bảng markdown, headers, sections)
- Thứ tự scan workflows cho conditional_reading expansion
- Chi tiết implementation của TOKEN_BUDGET enforcement (warning vs log vs metric)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Token counting
- `scripts/count-tokens.js` — Token counter with baseline/compare modes, js-tiktoken GPT-4o encoding
- `test/baseline-tokens.json` — Current baseline (84,899 tokens, 39 files, captured 2026-03-22)

### Resource config
- `bin/lib/resource-config.js` — TIER_MAP, AGENT_REGISTRY, TOKEN_BUDGET targets, PLATFORM_MODEL_MAP

### Conditional reading
- `bin/lib/utils.js` lines 362-385 — `conditionalBlock` generation infrastructure
- `workflows/plan.md` — Reference implementation of conditional_reading pattern

### Eval pipeline
- `evals/run.js` — Eval runner with benchmark history, compareBenchmarks()
- `evals/prompt-wrapper.js` — PromptFoo integration wrapper
- `promptfooconfig.yaml` — Full eval suite configuration

### Requirements
- `.planning/REQUIREMENTS.md` §Token Budget (TOKN-01 through TOKN-04) — Acceptance criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `count-tokens.js`: Đã có đầy đủ baseline capture + compare + table display — chỉ cần chạy
- `evals/run.js`: Có `compareBenchmarks()` sẵn — chỉ cần verify hoạt động đúng
- `baseline-tokens.json`: Baseline v1.0 (84,899 tokens) — cần cập nhật cho v5.0

### Established Patterns
- `<conditional_reading>` XML tags: 8 workflows đã dùng, `utils.js` hỗ trợ generate
- TIER_MAP structure: `{ model, effort, maxTurns }` — thêm `tokenBudget` field
- Benchmark history: JSON entries trong `evals/benchmarks/` với timestamp

### Integration Points
- `resource-config.js` exports: Thêm `TOKEN_BUDGET` constant hoặc field trong TIER_MAP
- `count-tokens.js`: Có thể thêm `--tier` flag để nhóm kết quả theo tier
- Workflows thiếu conditional_reading: Cần scan `workflows/*.md` tìm candidates

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Các tools và infrastructure đã sẵn sàng, phase này chủ yếu là chạy benchmark, document kết quả, và mở rộng pattern đã có.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 058-token-budget-benchmark*
*Context gathered: 2026-03-27*
