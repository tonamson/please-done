# Phase 54: Platform Mapping & Fallback - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 54 delivers platform-specific model resolution for the 3-tier system (Scout/Builder/Architect). Each platform gets a mapping from generic tier names (haiku/sonnet/opus) to platform-specific model names, with automatic fallback when a platform doesn't support a tier.

This phase does NOT handle: parallel dispatch wiring (Phase 55), skill-agent integration (Phase 56), or creating new agents (Phase 53 — complete).

</domain>

<decisions>
## Implementation Decisions

### Platform List
- **D-01:** Map ALL platforms — 5 hiện có (claude, codex, gemini, opencode, copilot) + thêm cursor và windsurf vào `platforms.js` như platform entries mới.
- **D-02:** Cursor và Windsurf được thêm vào `PLATFORMS` object trong `platforms.js` với đầy đủ config (dirName, commandPrefix, toolMap, etc.).

### Model Resolution Strategy
- **D-03:** Generic + runtime resolve — giữ `TIER_MAP` với generic names (haiku/sonnet/opus). Tạo `PLATFORM_MODEL_MAP` map generic → model thực tế per platform.
- **D-04:** `PLATFORM_MODEL_MAP` chứa mapping cho mỗi platform: `{ haiku: 'model-name', sonnet: 'model-name', opus: 'model-name' }`. Platform nào thiếu tier thì không có key đó → trigger fallback.

### Code Location
- **D-05:** `PLATFORM_MODEL_MAP` nằm trong `resource-config.js`, gần `TIER_MAP` và `getModelForTier()`.
- **D-06:** `platforms.js` chỉ export platform names/definitions, không chứa model mapping.

### Fallback API
- **D-07:** Mở rộng `getModelForTier(tier, platform?)` — thêm optional parameter `platform`. Không truyền = trả về generic (backward compatible).
- **D-08:** Silent downgrade — khi platform không hỗ trợ tier, tự động hạ xuống tier thấp hơn (architect→builder→scout). Trả về kèm trường `fallback: true` khi xảy ra downgrade.
- **D-09:** Workflow không bao giờ đứt gãy do thiếu tier — luôn có model để dùng.

### Test Strategy
- **D-10:** File test riêng `test/platform-models.test.js` — test tất cả platform×tier combinations + fallback cases.
- **D-11:** Backward compatibility bắt buộc — `getModelForTier('scout')` không truyền platform vẫn trả về `{ model: 'haiku', effort: 'low', maxTurns: 15 }` đúng như hiện tại.
- **D-12:** Existing tests (resource-config.test.js, smoke-agent-files.test.js) phải pass không sửa đổi.

### Claude's Discretion
- Model names cụ thể cho từng platform (research trong giai đoạn research)
- Cursor/Windsurf platform config details (dirName, commandPrefix, toolMap)
- Return object structure khi có fallback (thêm fields nào)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source Code
- `bin/lib/resource-config.js` — Source of truth cho TIER_MAP, AGENT_REGISTRY, getModelForTier(), getAgentConfig()
- `bin/lib/platforms.js` — Platform definitions (PLATFORMS, TOOL_MAP, getGlobalDir, getLocalDir)

### Tests
- `test/smoke-agent-files.test.js` — Integration tests cho agent files + registry consistency
- `test/resource-config.test.js` — Unit tests cho pure functions (nếu tồn tại)

### Planning
- `.planning/phases/52-agent-tier-system/52-CONTEXT.md` — Prior decisions: D-01 (generic TIER_MAP), D-02 (Phase 54 tạo PLATFORM_MODEL_MAP), D-03/D-04 (fallback logic)
- `.planning/REQUIREMENTS.md` — PLAT-01, PLAT-02 requirements

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TIER_MAP` (resource-config.js:22-26) — 3 tier definitions với generic model names
- `getModelForTier()` (resource-config.js:153-167) — Pure function, sẽ được mở rộng thêm parameter platform
- `getAgentConfig()` (resource-config.js:178-201) — Merges registry + tier, gọi TIER_MAP internally
- `PLATFORMS` (platforms.js:42-93) — 5 platform definitions hiện có

### Established Patterns
- Pure functions, không side effects — resource-config.js không import fs
- Copy trước khi return — `{ ...entry }` prevent mutation
- Case-insensitive tier lookup — `tier.toLowerCase()`

### Integration Points
- `getAgentConfig()` gọi `TIER_MAP[tier]` internally — cần đảm bảo platform resolution hoạt động xuyên suốt
- `platforms.js` export `getAllRuntimes()` — có thể dùng để validate platform names

</code_context>

<specifics>
## Specific Ideas

- Từ Phase 52 D-02: "Phase 54 sẽ tạo riêng `PLATFORM_MODEL_MAP`" — confirmed approach
- Từ ROADMAP success criteria: "Missing tier → fallback to next lower tier" — confirmed as silent downgrade
- Copilot inherits platform defaults — cần xác định default platform nào

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 54-platform-mapping-fallback*
*Context gathered: 2026-03-27*
