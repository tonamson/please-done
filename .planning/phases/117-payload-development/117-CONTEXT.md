# Phase 117: Payload Development - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Generate WAF-evasive payloads with multi-layer encoding for the pd:audit reconnaissance tool. Payloads are used defensively to test application security, not for actual attacks.

</domain>

<decisions>
## Implementation Decisions

### Payload Generation Strategy
- **D-01:** Generate encoded variants of base payloads to test WAF detection
- **D-02:** Support multiple encoding layers (base64, URL, hex, HTML, Unicode)
- **D-03:** Classify payloads by attack type: XSS, SQLi, Command Injection

### WAF Evasion Techniques
- **D-04:** Case variation obfuscation (T1027.010)
- **D-05:** Double encoding for paths and parameters
- **D-06:** Comment injection to break payload signatures

### File Upload Security
- **D-07:** Detect double extension masquerading (T1036.007)
- **D-08:** Analyze file name parsing vulnerabilities

### Claude's Discretion
- Payload encoding order and combination strategies
- Default WAF profiles to test against

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Context
- `.planning/phases/115-advanced-reconnaissance/115-CONTEXT.md` — Prior reconnaissance decisions
- `.planning/phases/115-advanced-reconnaissance/115-RESEARCH.md` — Taint analysis patterns

### Requirements
- `.planning/REQUIREMENTS.md` — PAYLOAD-01 to PAYLOAD-05

### Standards
- PTES v2.0 (Penetration Testing Execution Standard)
- MITRE ATT&CK T1027.010 (Obfuscated Payloads)
- MITRE ATT&CK T1036.007 (Double File Extension)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bin/lib/recon-aggregator.js` — Already aggregates recon results, could integrate payload generation
- `bin/lib/taint-engine.js` — Data flow analysis could inform payload paths
- `bin/lib/source-mapper.js` — Identifies sinks, useful for targeted payload generation

### Established Patterns
- Tiered command system (free/standard/deep/redteam) from Phase 112
- Cache system for token optimization
- Mermaid diagram generation for visualization

### Integration Points
- pd:audit --recon could trigger payload generation at deep/redteam tiers
- Results integrated into recon aggregator summary

</code_context>

<specifics>
## Specific Ideas

- payloads.js module for encoding and generation
- WAF profile configurations for major WAFs (Cloudflare, AWS, Akamai)
- Payload wordlist format matching existing data file structure

</specifics>

<deferred>
## Deferred Ideas

None — scope is well-defined by requirements.

</deferred>

---

*Phase: 117-payload-development*
*Context gathered: 2026-04-05*
