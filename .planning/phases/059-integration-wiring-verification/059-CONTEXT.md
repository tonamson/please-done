# Phase 59: Integration Wiring & Verification Gaps - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 59 closes integration + verification gaps remaining in v5.0:
1. Wire `getModelForTier(tier, platform)` into production dispatch flow (at least 1 caller)
2. Fix `pd-sec-scanner` agent path — copy to `.claude/agents/`
3. Create VERIFICATION.md for Phase 52 (AGEN-01, AGEN-09)
4. Update 053-VERIFICATION.md to reflect current state (3 gaps from initial verification)

This phase does NOT handle: creating new agents (Phase 53 — done), platform mapping logic (Phase 54 — done), parallel dispatch wiring (Phase 55 — done), skill-agent integration (Phase 56 — done).

</domain>

<decisions>
## Implementation Decisions

### Production Caller Wiring
- **D-01:** Wire `getModelForTier(tier, platform)` thong qua `getAgentConfig()` — them optional `platform` param vao `getAgentConfig(agentName, platform?)`. Khi co platform, goi `getModelForTier(tier, platform)` de resolve model cu the. Tat ca callers (`buildParallelPlan`, `buildScannerPlan`, `buildResearchSquadPlan`) tu dong huong loi.
- **D-02:** Backward compatible — `getAgentConfig('pd-code-detective')` khong truyen platform van tra ve generic model nhu hien tai.
- **D-03:** It nhat 1 production caller trong `parallel-dispatch.js` phai truyen platform param de satisfy PLAT-01/PLAT-02.

### pd-sec-scanner Path Fix
- **D-04:** Copy `commands/pd/agents/pd-sec-scanner.md` sang `.claude/agents/pd-sec-scanner.md` — nhat quan voi 6 agents khac da o `.claude/agents/`.
- **D-05:** Giu nguyen file goc tai `commands/pd/agents/` de khong break references hien co trong workflows.
- **D-06:** Cap nhat AGENT_REGISTRY neu can — dam bao path consistency.

### Phase 52 VERIFICATION.md
- **D-07:** Verify trang thai HIEN TAI cua TIER_MAP va AGENT_REGISTRY — phan anh dung thuc te sau tat ca phases da chay.
- **D-08:** Scope verification: AGEN-01 (3-tier model system) va AGEN-09 (pd-regression-analyzer in registry).
- **D-09:** Format nhat quan voi cac VERIFICATION.md khac trong project (YAML frontmatter + Observable Truths table).

### 053-VERIFICATION.md Update
- **D-10:** Re-verify 3 gaps tu initial verification: pd-codebase-mapper (Write tool), pd-feature-analyst (Bash + Context7), pd-regression-analyzer (wrap library functions).
- **D-11:** Cap nhat status dua tren trang thai hien tai — neu gap da duoc fix o phase sau thi danh dau resolved.
- **D-12:** Neu gap van con → giu nguyen status, ghi chu "not addressed in subsequent phases".

### Claude's Discretion
- Test strategy cho verification (manual check vs automated)
- Exact wording trong VERIFICATION.md reports
- Whether to add platform param to specific callers beyond minimum requirement

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source Code
- `bin/lib/resource-config.js` — Source of truth cho TIER_MAP, AGENT_REGISTRY, getModelForTier(), getAgentConfig()
- `bin/lib/parallel-dispatch.js` — Production callers: buildParallelPlan(), buildScannerPlan(), buildResearchSquadPlan()
- `commands/pd/agents/pd-sec-scanner.md` — File hien tai cua pd-sec-scanner agent
- `.claude/agents/` — Target directory cho pd-sec-scanner copy

### Tests
- `test/smoke-agent-files.test.js` — Agent files + registry consistency
- `test/smoke-resource-config.test.js` — Resource config pure functions
- `test/platform-models.test.js` — Platform x tier combinations

### Prior Verification
- `.planning/phases/053-new-agent-files/053-VERIFICATION.md` — 3 gaps can re-verify
- `.planning/v5.0-MILESTONE-AUDIT.md` — Audit report voi gap summary

### Prior Context
- `.planning/phases/52-agent-tier-system/52-CONTEXT.md` — D-01 generic TIER_MAP, D-09/D-10 backward compat
- `.planning/phases/54-platform-mapping-fallback/54-CONTEXT.md` — D-07 getModelForTier(tier, platform?), D-08 silent downgrade
- `.planning/phases/055-parallel-dispatch-wiring/055-CONTEXT.md` — D-05 heavy check in buildScannerPlan

### Requirements
- `.planning/REQUIREMENTS.md` — AGEN-01, AGEN-09, PLAT-01, PLAT-02, PARA-02

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getModelForTier(tier, platform)` (resource-config.js:214) — Da co platform param, logic resolve da implement tu Phase 54
- `getAgentConfig(agentName)` (resource-config.js) — Can mo rong them platform param
- `PLATFORM_MODEL_MAP` (resource-config.js) — Da co mapping cho 7 platforms
- `AGENT_REGISTRY` (resource-config.js) — 16 agents da registered

### Established Patterns
- Pure functions, khong side effects trong resource-config.js
- Copy truoc khi return — `{ ...entry }` prevent mutation
- `getAgentConfig()` merge registry + tier config — diem wire platform param tu nhien nhat

### Integration Points
- `parallel-dispatch.js:32-33` — `getAgentConfig('pd-code-detective')` va `getAgentConfig('pd-doc-specialist')` — production callers co the truyen platform
- `parallel-dispatch.js:227-230` — `getAgentConfig()` cho research squad agents — them production callers
- `workflows/audit.md` — references `pd-sec-scanner` — can verify path

</code_context>

<specifics>
## Specific Ideas

- `getAgentConfig(name, platform?)` la diem wire tu nhien nhat — getModelForTier da co platform support, chi can pipe through
- pd-sec-scanner copy (khong move) de khong break `commands/pd/agents/` references trong workflow files
- Phase 52 VERIFICATION.md can verify AGEN-01 (TIER_MAP co 3 tiers) va AGEN-09 (pd-regression-analyzer in registry) — straightforward

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 059-integration-wiring-verification*
*Context gathered: 2026-03-27*
