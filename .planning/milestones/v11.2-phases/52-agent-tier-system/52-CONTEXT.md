# Phase 52: Agent Tier System & Registry - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 52 delivers 2 things:
1. Validate and confirm the existing 3-tier model system (Scout/Builder/Architect) in `resource-config.js` — currently already implemented with generic names
2. Add `pd-regression-analyzer` to `AGENT_REGISTRY` with correct tier and tools

This phase does NOT handle: per-platform model mapping (Phase 54), creating new agent files (Phase 53), or wiring parallel dispatch (Phase 55).

</domain>

<decisions>
## Implementation Decisions

### TIER_MAP Structure
- **D-01:** Giữ `TIER_MAP` đơn giản — 3 tiers map sang generic model names (`haiku/sonnet/opus`). KHÔNG mở rộng thành per-platform mapping trong phase này.
- **D-02:** Phase 54 sẽ tạo riêng `PLATFORM_MODEL_MAP` để resolve generic names sang platform-specific models (VD: `haiku` → `claude-4-5-haiku` / `gemini-3-flash`).
- **Lý do:** Separation of concerns — `TIER_MAP` định nghĩa tier behavior (effort, maxTurns), `PLATFORM_MODEL_MAP` xử lý platform resolution. Tối ưu token vì không cần refactor `getModelForTier()`.

### Tier Fallback Behavior
- **D-03:** Khi platform không support 1 tier → **luôn xuống tier thấp hơn** (Builder→Scout, Architect→Builder).
- **D-04:** Fallback logic nằm trong Phase 54 (Platform Mapping), nhưng Phase 52 cần document convention này trong code comments.
- **Lý do:** Từ `FINAL_optimize-repo.md` B2: "hạ cấp xuống model cao nhất hiện có → workflow không bao giờ đứt gãy."

### AGENT_REGISTRY Scope
- **D-05:** Phase 52 chỉ thêm `pd-regression-analyzer` vào registry. KHÔNG prep slots cho 5 agents còn lại.
- **D-06:** Phase 53 sẽ thêm 5 agents còn lại + tạo files + tests.
- **Lý do:** Mỗi phase ship independently, tests phải pass sau mỗi phase. Thêm agents chưa có file = smoke tests fail = broken build.

### pd-regression-analyzer Config
- **D-07:** Tier = `builder` (Builder). Tools = `['Read', 'Glob', 'Grep', 'Bash', 'mcp__fastcode__code_qa']`.
- **D-08:** Agent nâng cấp từ `regression-analyzer.js` (pure function) thành agent có dispatch — cần FastCode tool để trace call chain.
- **Lý do:** Từ `FINAL_optimize-repo.md` A2: "Mới — nâng `regression-analyzer.js` thành agent có dispatch."

### Backward Compatibility
- **D-09:** `getModelForTier('scout')` vẫn trả `{ model: 'haiku', effort: 'low', maxTurns: 15 }` — KHÔNG thay đổi output format.
- **D-10:** `getAgentConfig()` tự động kế thừa tier config cho agent mới, zero API change.
- **Lý do:** Tối ưu token — không cần sửa bất kỳ caller nào. Tất cả existing tests pass without modification.

### Agent's Discretion
- Comment style và JSDoc formatting
- Test naming conventions (giữ pattern hiện tại)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source Code
- `bin/lib/resource-config.js` — Source of truth cho TIER_MAP, AGENT_REGISTRY, và tất cả pure functions
- `bin/lib/parallel-dispatch.js` — Consumer chính (Phase 55 sẽ wire), cần biết registry API

### Tests
- `test/smoke-agent-files.test.js` — Integration tests cho agent files + registry consistency
- `test/resource-config.test.js` — Unit tests cho pure functions (nếu tồn tại)

### Planning
- `FINAL_optimize-repo.md` §A1 (Tier Strategy), §A4 (Agent Migration) — Chi tiết tier mapping và migration table
- `.planning/REQUIREMENTS.md` — AGEN-01, AGEN-09 requirements

</canonical_refs>

<deferred>
## Deferred Ideas

None — discussions stayed within phase scope.

</deferred>
