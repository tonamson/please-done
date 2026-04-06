# Phase 121: AI Agents - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Create specialized agents for the pd:audit skill. Agents are Claude Code agent definitions that can be invoked for specific reconnaissance tasks.

</domain>

<decisions>
## Implementation Decisions

### Agent Definitions
- **AGENT-01:** pd-recon-analyzer.md - Attack surface analysis, risk scoring
- **AGENT-02:** pd-taint-tracker.md - Deep taint analysis (on-demand)
- **AGENT-03:** pd-osint-intel.md - OSINT intelligence gathering
- **AGENT-04:** pd-payload-dev.md - Payload strategy, evasion recommendations
- **AGENT-05:** pd-post-exploit.md - Post-exploitation planning

### Agent Pattern
- Each agent is a .md file in .claude/agents/
- Frontmatter: name, description, model, tier
- Process: numbered steps for the agent to follow

</decisions>

<canonical_refs>
## Canonical References

- .claude/skills/pd-audit/SKILL.md (Agent invocation patterns)
- bin/lib/resource-config.js (AGENT_REGISTRY)
- Existing agent files in .claude/agents/

</canonical_refs>

<codebase>
## Existing Code Insights

### Agent Pattern
Based on existing agents in the codebase, agents follow a standard format:
- Frontmatter with name, description, tier, model
- Process section with numbered steps
- Exit conditions and output format

</codebase>

<deferred>
## Deferred Ideas

None — scope is well-defined by requirements.

</deferred>

---

*Phase: 121-ai-agents*
*Context gathered: 2026-04-05*
