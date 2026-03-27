# Phase 56: Skill-Agent Integration - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 56 wire 4 agent mới vào workflow hiện tại:
1. pd-codebase-mapper tự động chạy sau init brownfield
2. Research Squad (Mapper + Security + Feature + Synthesizer) chạy đồng thời
3. plan workflow soft-guard TECHNICAL_STRATEGY.md
4. Auto-inject TECHNICAL_STRATEGY.md vào pd-planner context

Phase này KHÔNG tạo agent files mới (đã có từ Phase 53), KHÔNG sửa agent logic, KHÔNG thêm workflow mới.

</domain>

<decisions>
## Implementation Decisions

### Mapper Auto-Run (SKIL-01)
- **D-01:** pd-codebase-mapper chạy tự động sau init brownfield — KHÔNG hỏi user. Lý do: mapping là lightweight (Scout tier, haiku), chỉ đọc code, không sửa gì.
- **D-02:** Thêm logic sau Bước 3a (FastCode indexing) trong `workflows/init.md`. Điều kiện: `isNewProject === false`.
- **D-03:** Nếu mapping fail → warning + tiếp tục. Init không bị block bởi mapper failure.
- **D-04:** Nếu `.planning/codebase/STRUCTURE.md` đã tồn tại → skip mapper (đã map rồi).

### Research Squad Activation (SKIL-02)
- **D-05:** Research Squad kích hoạt trong GSD workflow `new-milestone` hoặc `new-project` — SAU khi REQUIREMENTS.md được tạo.
- **D-06:** 3 agents chạy song song: pd-codebase-mapper, pd-security-researcher, pd-feature-analyst. Dùng `buildParallelPlan()` từ `parallel-dispatch.js`.
- **D-07:** pd-research-synthesizer chạy SAU khi 3 agents kia hoàn thành (sequential step 2). Output: `.planning/research/TECHNICAL_STRATEGY.md`.
- **D-08:** Nếu 1 trong 3 agent fail → synthesizer vẫn chạy với evidence có sẵn (đã xử lý trong agent file).

### TECHNICAL_STRATEGY.md Soft-Guard (SKIL-03)
- **D-09:** Thêm check vào `workflows/plan.md` Bước 1 (đọc context). Kiểm tra `.planning/research/TECHNICAL_STRATEGY.md` tồn tại.
- **D-10:** Nếu THIẾU → hiển thị warning: "TECHNICAL_STRATEGY.md không tồn tại. Plan sẽ thiếu chiến lược kỹ thuật. Chạy Research Squad để tạo." Cho phép tiếp tục — KHÔNG block.
- **D-11:** Warning chỉ hiển thị 1 lần, không lặp lại trong cùng session.

### Auto-Injection (SKIL-04)
- **D-12:** Inject TECHNICAL_STRATEGY.md chỉ vào pd-planner (không inject vào researcher — researcher tự scout).
- **D-13:** Inject toàn bộ file (không cắt summary) — pd-planner cần full context để plan chính xác.
- **D-14:** Nếu file không tồn tại → skip injection, không warning (soft-guard đã xử lý ở D-10).
- **D-15:** Injection point: thêm vào `<files_to_read>` block trong planner prompt (workflow `plan-phase.md` step 8).

### Claude's Discretion
- Thứ tự chính xác của Research Squad agents trong parallel plan
- Warning message wording và formatting
- Cách detect "đã map rồi" (check 1 file hay nhiều files)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Workflows cần sửa
- `workflows/init.md` — Init workflow, brownfield detection tại Bước 3, FastCode indexing tại Bước 3a
- `workflows/plan.md` — Plan workflow, context loading tại Bước 1, research injection section

### GSD Workflows cần sửa
- `$HOME/.claude/get-shit-done/workflows/plan-phase.md` §8 — Planner prompt `<files_to_read>` block, nơi inject TECHNICAL_STRATEGY.md
- `$HOME/.claude/get-shit-done/workflows/plan-milestone-gaps.md` — Nếu Research Squad cũng trigger từ đây

### Agent Files (đọc, không sửa)
- `.claude/agents/pd-codebase-mapper.md` — Agent config, tools, output paths
- `.claude/agents/pd-security-researcher.md` — Agent config
- `.claude/agents/pd-feature-analyst.md` — Agent config
- `.claude/agents/pd-research-synthesizer.md` — Agent config, output: TECHNICAL_STRATEGY.md

### Infrastructure
- `bin/lib/parallel-dispatch.js` — `buildParallelPlan()`, `mergeParallelResults()` — reuse cho Research Squad
- `bin/lib/resource-config.js` — `getAgentConfig()`, `AGENT_REGISTRY` — resolve agent tier/model

### Requirements
- `.planning/REQUIREMENTS.md` — SKIL-01, SKIL-02, SKIL-03, SKIL-04

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `buildParallelPlan()` trong parallel-dispatch.js — tạo parallel spawning plan cho N agents
- `mergeParallelResults()` — merge results, handle partial failures
- `getAgentConfig()` trong resource-config.js — resolve agent config từ AGENT_REGISTRY
- `getAdaptiveParallelLimit()` — tính worker count dựa trên resource availability

### Established Patterns
- Brownfield detection: Glob `**/*.{ts,tsx,js,jsx,...}` trừ node_modules — kết quả `isNewProject` boolean
- Research injection: Đọc INDEX.md → keyword match → load top 2 entries (plan.md pattern)
- Agent spawning: fix-bug.md spawns Detective + DocSpec parallel — pattern tái sử dụng được

### Integration Points
- `workflows/init.md` line ~34: Sau FastCode indexing — thêm mapper spawning
- `workflows/plan.md` Bước 1: Đọc context — thêm TECHNICAL_STRATEGY.md check
- `plan-phase.md` step 8: Planner prompt — thêm TECHNICAL_STRATEGY.md vào files_to_read
- GSD new-project/new-milestone workflow: Thêm Research Squad activation step

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 056-skill-agent-integration*
*Context gathered: 2026-03-27 — Claude's discretion (user deferred all decisions)*
