# Phase 114: Intelligence Gathering Extended - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend Phase 113's reconnaissance with hidden asset discovery and authentication analysis. Focus on finding undocumented endpoints, analyzing authentication mechanisms, and identifying bypass vectors. Builds on Phase 113's attack surface map.

Phase 114 delivers deep reconnaissance capabilities for comprehensive security assessment.
</domain>

<decisions>
## Implementation Decisions

### Hidden Asset Discovery
- **D-01:** Scan for common admin panel paths (/admin, /administrator, /dashboard, /manage)
- **D-02:** Detect debug endpoints (/debug, /__debug__, /test, /api-docs when not documented)
- **D-03:** Find backup files (.bak, .backup, .old, .zip of source code)
- **D-04:** Discover configuration file exposures (.env, config.json, database.yml)
- **D-05:** Check for source map files (.js.map) that expose original source
- **D-06:** Output format: Risk-scored list with exposure severity

### Authentication Analysis
- **D-07:** Detect authentication middleware patterns (JWT, Session, OAuth, API Key)
- **D-08:** Identify routes protected by authentication vs unprotected
- **D-09:** Map authentication bypass patterns (missing auth, weak validation, parameter pollution)
- **D-10:** Analyze JWT implementation (algorithm confusion, weak secrets, expiration)
- **D-11:** Check for hardcoded credentials in source code
- **D-12:** Output format: Auth coverage matrix with bypass vectors

### Risk Scoring
- **D-13:** Critical: Admin panel without auth, Debug enabled in production, Backup files exposed
- **D-14:** High: Config files accessible, Source maps exposed, Weak JWT implementation
- **D-15:** Medium: Undocumented API endpoints, Test pages accessible
- **D-16:** Low: Development routes, Internal documentation

### Claude's Discretion
- Exact wordlist for asset discovery
- Request timeout thresholds
- False positive filtering criteria
- Report formatting details
</decisions>

<canonical_refs>
## Canonical References

### Reconnaissance Standards
- `.planning/REQUIREMENTS.md` §RECON-04, RECON-05 - Extended reconnaissance requirements
- Phase 113 artifacts: source-mapper.js, target-enumerator.js - Foundation to build upon
- OWASP Testing Guide: Authentication Testing, Configuration Testing

### Security References
- OWASP Top 10: A07 (Identification and Authentication Failures)
- OWASP Top 10: A05 (Security Misconfiguration)
- PTES v2.0: Vulnerability Analysis phase
- MITRE ATT&CK T1552 (Unsecured Credentials)

</canonical_refs>

<specifics>
## Specific Ideas

- Hidden asset discovery should include rate limiting to avoid overwhelming target
- Authentication analysis should identify JWT libraries and their common vulnerabilities
- Look for patterns like 'password', 'secret', 'key' in variable names for credential exposure
- Check for commented-out code that may contain sensitive information
- Analyze middleware chains to identify auth gaps
- Support both static analysis (code-based) and dynamic analysis (HTTP requests)
</specifics>

<deferred>
## Deferred Ideas

- Brute force attack simulation (Phase 117)
- Session token analysis (Phase 118)
- Post-exploitation persistence (Phase 119)
- Active scanning with request fuzzing (Phase 123)

</deferred>
