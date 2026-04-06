# Phase 123: Integration - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire all reconnaissance modules (112-122) into the pd:audit workflow. Ensure the three main commands work:
- `pd:audit --recon` triggers full reconnaissance workflow
- `pd:audit --poc` triggers DAST verification workflow
- `pd:audit --redteam` triggers red team workflow

</domain>

<decisions>
## Implementation Decisions

### Tiered Command System
- FREE tier: Basic service discovery only
- STANDARD tier: Adds source mapping, target enumeration
- DEEP tier: Adds workflow analysis, taint analysis, OSINT, token analysis
- REDTEAM tier: Adds all modules including post-exploitation

### Integration Points
- bin/commands/audit.js (main command)
- bin/lib/recon-aggregator.js (aggregates all modules)
- bin/lib/resource-config.js (tier configuration)

</decisions>

<canonical_refs>
## Canonical References

### Completed Phases
- Phase 112: PTES Foundation (tiered commands)
- Phase 113: Source Mapping
- Phase 114: Asset Discovery
- Phase 115: Workflow/Taint Analysis
- Phase 116: OSINT
- Phase 117: Payload Generation
- Phase 118: Token Analysis
- Phase 119: Post-Exploitation
- Phase 120: Code Libraries
- Phase 121: AI Agents
- Phase 122: Data Files

### Requirements
- .planning/REQUIREMENTS.md - INT-01, INT-02, INT-03

</canonical_refs>

<codebase>
## Existing Code Insights

### Integration Pattern
All modules follow the ReconAggregator pattern:
- Constructor accepts cache
- Each module is instantiated in constructor
- runFullRecon() calls each module based on tier
- generateSummary/Risks/Recommendations aggregate results

### Command Structure
- bin/commands/audit.js parses tier flags
- Passes tier to ReconAggregator.runFullRecon()

</codebase>

<deferred>
## Deferred Ideas

None — this is the final integration phase.

</deferred>

---

*Phase: 123-integration*
*Context gathered: 2026-04-05*
