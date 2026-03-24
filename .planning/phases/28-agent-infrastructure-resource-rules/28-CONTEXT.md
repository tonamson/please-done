# Phase 28: Agent Infrastructure & Resource Rules - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

5 agent files chay duoc voi dung model (haiku/sonnet/opus theo tier Scout/Builder/Architect), resource-config module kiem soat tai nguyen (parallel limit 2, heavy lock, ha cap tu dong khi loi).

</domain>

<decisions>
## Implementation Decisions

### Vi tri Agent Files
- **D-01:** Tao 5 agent files tai `.claude/agents/` theo format NATIVE Claude Code (khong phai custom format). Fields: `name`, `description`, `model`, `tools`, `maxTurns`.
- **D-02:** Giu `commands/pd/agents/` lam reference/documentation cho cross-platform — KHONG xoa, nhung `.claude/agents/` la source-of-truth cho Claude Code runtime.
- **D-03:** Workflow fix-bug.md spawn agents bang Agent tool voi agent name (vd: `Agent(name="pd-bug-janitor")`).

### Tier-to-Model Mapping
- **D-04:** Scout (Janitor, DocSpec) = haiku. Builder (Detective, Repro) = sonnet. Architect (Fix Architect) = opus. Ghi truc tiep trong YAML `model:` field cua moi agent file.
- **D-05:** KHONG tao bang mapping rieng — model field nam trong agent file, resource-config.js doc tu do.

### Module resource-config.js
- **D-06:** Pure function module tai `bin/lib/resource-config.js`. Exports:
  - `getModelForTier(tier)` — tra model name tu tier string
  - `getAgentConfig(agentName)` — tra full config object (model, tools, maxTurns)
  - `getParallelLimit()` — tra 2 (hardcoded v2.1, co the config sau)
  - `shouldDegrade(error)` — tra boolean: true khi error la timeout/resource exhaustion
- **D-07:** Module KHONG doc file. Config truyen qua tham so hoac hardcoded defaults. Nhat quan voi pattern 12 modules hien tai.

### Heavy Lock Tracking
- **D-08:** Heavy Lock la LOGIC trong workflow orchestrator, KHONG phai module rieng. Orchestrator biet agent nao dang chay vi no la nguoi spawn.
- **D-09:** Quy tac: khi FastCode indexing hoac test suite dang chay (agent co `mcp__fastcode__*` trong tools), khong spawn agent nang thu 2. Orchestrator kiem tra truoc khi spawn.
- **D-10:** KHONG can lock file, KHONG can in-memory state — workflow markdown ghi logic truc tiep.

### Ha cap Thong minh (Degradation)
- **D-11:** Khi spawn 2 background agents fail (timeout > 120s hoac Agent tool error), orchestrator tu dong:
  1. Ghi warning vao SESSION file: `> [WARN] Ha cap sang tuan tu do [ly do]`
  2. Chay agents tuan tu (Detective truoc, DocSpec sau)
  3. Tiep tuc workflow binh thuong
- **D-12:** KHONG hoi user khi ha cap — tu dong, non-blocking. User thay warning trong output.

### Converter Pipeline
- **D-13:** Agent files tai `.claude/agents/` KHONG can converter pipeline — la Claude Code native format. Converter chi xu ly skills va workflows.
- **D-14:** Workflow fix-bug.md se can converter update khi rewrite thanh orchestrator (Phase 32-33), KHONG phai Phase 28.
- **D-15:** Phase 28 chi tao agent files va resource-config.js — KHONG sua workflow.

### Claude's Discretion
- maxTurns cho tung agent (khoi diem hop ly, tinh chinh sau)
- Error message format khi degradation
- Unit test structure cho resource-config.js

</decisions>

<specifics>
## Specific Ideas

- User muon "tu tim giai phap tot nhat cho repo" — tin tuong Claude quyet dinh ky thuat
- Agent files theo dung Claude Code native subagent spec, khong tu che format
- Gio giong nhu gsd-debugger va gsd-executor — dong cap voi GSD agents

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Agent format
- `commands/pd/agents/pd-bug-janitor.md` — Agent config hien tai (tham khao tier, tools)
- `commands/pd/agents/pd-code-detective.md` — Builder tier example
- `commands/pd/agents/pd-doc-specialist.md` — Scout tier voi MCP tools
- `commands/pd/agents/pd-repro-engineer.md` — Builder tier voi write access
- `commands/pd/agents/pd-fix-architect.md` — Architect tier voi full access

### Pure function patterns
- `bin/lib/logic-sync.js` — Orchestrator pure function pattern (runLogicSync)
- `bin/lib/repro-test-generator.js` — Simple pure function pattern
- `bin/lib/debug-cleanup.js` — Pure function voi array output

### Research
- `.planning/research/STACK.md` — Stack decisions, agent frontmatter format verified
- `.planning/research/ARCHITECTURE.md` — Build order, component boundaries
- `.planning/research/PITFALLS.md` — No-nesting constraint, context window limits

### Strategy document
- `2.1_UPGRADE_DEBUG.md` — Chien luoc tong the cua milestone v2.1

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `commands/pd/agents/*.md` (5 files): Chua tier, tools, role descriptions — dung lam input de generate `.claude/agents/` files
- `bin/lib/logic-sync.js`: Pattern orchestrator pure function voi warnings array
- `bin/lib/converters/base.js`: Pipeline architecture (khong truc tiep dung nhung tham khao pattern)

### Established Patterns
- Pure function: KHONG doc file, content truyen qua tham so, return structured object
- Non-blocking warnings: `warnings: []` array trong return value
- TDD: Viet test truoc, module sau (601 tests hien tai)
- YAML frontmatter: Da co parseFrontmatter() trong converter pipeline

### Integration Points
- `.claude/agents/` directory: Tao moi (chua ton tai)
- `bin/lib/resource-config.js`: Module moi
- `test/resource-config.test.js`: Tests moi
- Workflow fix-bug.md: KHONG sua trong Phase 28 (de Phase 32)

</code_context>

<deferred>
## Deferred Ideas

- Converter pipeline update cho agent files — Phase 32-33 khi rewrite workflow
- Agent memory (`memory: project`) — v2.2 (MEM-05)
- Auto-detect RAM/CPU — v2.2 (ORCH-05)
- Cost estimation — v2.2 (ORCH-06)

</deferred>

---

*Phase: 28-agent-infrastructure-resource-rules*
*Context gathered: 2026-03-24*
