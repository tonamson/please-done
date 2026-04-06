# Phase 118: Token Analysis - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Analyze JWT, session cookies, and tokens for vulnerabilities in the pd:audit reconnaissance tool. Detects authentication weaknesses and credential access patterns.

</domain>

<decisions>
## Implementation Decisions

### JWT Analysis
- **D-01:** Detect alg:none vulnerability in JWT header
- **D-02:** Detect weak secret keys (short, common passwords)
- **D-03:** Detect missing algorithm verification
- **D-04:** Report JWT age and expiration issues

### Session Cookie Analysis
- **D-05:** Analyze security flags (HttpOnly, Secure, SameSite)
- **D-06:** Calculate cookie entropy for session tokens
- **D-07:** Detect predictable session IDs

### Token Extraction
- **D-08:** Extract Bearer tokens from Authorization headers
- **D-09:** Extract API keys from headers and environment
- **D-10:** Detect token patterns in source code

### Claude's Discretion
- Severity thresholds for entropy calculations
- Default weak secret wordlist location

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Context
- `.planning/phases/115-advanced-reconnaissance/115-CONTEXT.md` — Prior taint analysis
- `.planning/phases/117-payload-development/117-CONTEXT.md` — Payload generation patterns

### Requirements
- `.planning/REQUIREMENTS.md` — TOKEN-01 to TOKEN-04

### Standards
- MITRE ATT&CK T1606.001 (JWT Verification Bypass)
- MITRE ATT&CK T1539 (Session Hijacking via Cookie)
- MITRE ATT&CK T1528 (Application Access Token)

</canonical_refs>

<codebase>
## Existing Code Insights

### Reusable Assets
- `bin/lib/recon-aggregator.js` — Already aggregates recon results
- `bin/lib/source-mapper.js` — Identifies untrusted input sources
- `bin/lib/taint-engine.js` — Taint tracking for data flow

### Established Patterns
- Tiered command system from Phase 112
- Module pattern: constructor with cache, analyze() method
- Mermaid diagram generation for visualization

### Integration Points
- pd:audit --recon triggers token analysis at deep/redteam tiers
- Results integrated into recon aggregator summary

</codebase>

<deferred>
## Deferred Ideas

None — scope is well-defined by requirements.

</deferred>

---

*Phase: 118-token-analysis*
*Context gathered: 2026-04-05*
