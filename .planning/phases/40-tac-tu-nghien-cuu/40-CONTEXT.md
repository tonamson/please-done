# Phase 40: Tac tu Nghien cuu - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Tao 2 agent definitions (Evidence Collector + Fact Checker) va dang ky trong resource-config.js. Agents su dung research-store.js va confidence-scorer.js tu Phase 38-39 de ghi ket qua theo format chuan.

</domain>

<decisions>
## Implementation Decisions

### Evidence Collector Agent (AGENT-01)
- **D-01:** File: `.claude/agents/pd-evidence-collector.md` voi Claude Code native YAML frontmatter.
- **D-02:** Tier: builder/sonnet. Effort: medium. MaxTurns: 25. Nhat quan voi pd-code-detective.
- **D-03:** Allowed tools: Read, Grep, Glob, Bash, mcp__context7__resolve-library-id, mcp__context7__query-docs. KHONG co WebSearch (de cho Fact Checker).
- **D-04:** Process: (1) Nhan topic + routing (internal/external) tu orchestrator, (2) Thu thap tu 2+ nguon doc lap, (3) Ghi ket qua vao internal/ hoac external/ theo research-store.js createEntry format, (4) Moi claim PHAI co source citation — claim khong co source = KHONG DUOC ghi (source-or-skip rule).
- **D-05:** Output format: Research file voi frontmatter 8 fields + section `## Bang chung` + inline confidence markers `(confidence: HIGH|MEDIUM|LOW)`.

### Fact Checker Agent (AGENT-02)
- **D-06:** File: `.claude/agents/pd-fact-checker.md` voi Claude Code native YAML frontmatter.
- **D-07:** Tier: architect/opus. Effort: high. MaxTurns: 15. Can suy luan sau de phat hien inconsistencies.
- **D-08:** Allowed tools: Read, Grep, Glob, WebSearch, mcp__context7__resolve-library-id, mcp__context7__query-docs. Co WebSearch de cross-verify.
- **D-09:** Process: (1) Doc research file tu Evidence Collector, (2) Voi moi claim co source — xac minh source con valid, (3) Voi claim confidence LOW — tim them source hoac danh dau "KHONG XAC MINH DUOC", (4) Ghi ket qua vao section `## Kiem tra Thuc te` trong cung file.
- **D-10:** KHONG ghi de noi dung cua Evidence Collector — chi THEM section kiem tra.

### Agent Registration (resource-config.js)
- **D-11:** Them 2 entries vao AGENT_REGISTRY:
  - `'pd-evidence-collector': { tier: 'builder', model: 'sonnet', effort: 'medium', maxTurns: 25 }`
  - `'pd-fact-checker': { tier: 'architect', model: 'opus', effort: 'high', maxTurns: 15 }`
- **D-12:** Them 2 agent names vao integration tests (smoke-integrity.test.js).

### Agent Prompt Structure
- **D-13:** Follow pattern tu pd-code-detective.md: YAML frontmatter + `<purpose>` + `<process>` (steps) + `<rules>` + `<success_criteria>`.
- **D-14:** Agent process buoc cuoi PHAI goi appendAuditLog pattern (agent ghi vao evidence, orchestrator goi appendAuditLog sau).

### Carrying Forward
- Frontmatter 8 fields (P38 D-01) — locked
- Confidence 3 bac (P38 D-03) — locked
- research-store.js API (P38 D-07) — locked
- confidence-scorer.js rule-based (P39 D-12-D-15) — locked
- validateEvidence (P39 D-01-D-04) — locked

### Claude's Discretion
- So luong plans va task breakdown
- Exact prompt wording cho agent definitions
- Test strategy cho agent registration

</decisions>

<canonical_refs>
## Canonical References

### Existing agent patterns (follow structure)
- `.claude/agents/pd-code-detective.md` — Reference agent definition pattern
- `.claude/agents/pd-bug-janitor.md` — Simpler agent example

### Modules agents will use
- `bin/lib/research-store.js` — createEntry, parseEntry, validateEvidence
- `bin/lib/confidence-scorer.js` — scoreConfidence
- `bin/lib/audit-logger.js` — appendLogEntry
- `bin/lib/resource-config.js` — AGENT_REGISTRY (extend)

### Research
- `.planning/milestones/v3.0-research/FEATURES.md` — C-TS1, C-TS2 agent specs
- `.planning/milestones/v3.0-research/PITFALLS.md` — Circular verification risk, separation of concerns

### Requirements
- `.planning/REQUIREMENTS.md` — AGENT-01, AGENT-02

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- 5 existing agent definitions in .claude/agents/ — direct pattern to follow
- AGENT_REGISTRY in resource-config.js — extend with 2 new entries
- smoke-integrity.test.js — extend agent file consistency checks

### Established Patterns
- Agent YAML frontmatter: model, effort, maxTurns, tools (comma-separated string)
- Agent process as numbered steps with explicit file reads
- Evidence chain: agent reads prior evidence, writes structured output

### Integration Points
- `.claude/agents/pd-evidence-collector.md` — new file
- `.claude/agents/pd-fact-checker.md` — new file
- `bin/lib/resource-config.js` — extend AGENT_REGISTRY
- `test/smoke-integrity.test.js` — extend agent checks

</code_context>

<specifics>
## Specific Ideas

- Evidence Collector KHONG co WebSearch — separation of concerns voi Fact Checker
- Fact Checker KHONG ghi de Collector output — chi THEM verification section
- Ca 2 agents deu reference research-store.js format trong prompt de dam bao output nhat quan

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 40-tac-tu-nghien-cuu*
*Context gathered: 2026-03-25*
