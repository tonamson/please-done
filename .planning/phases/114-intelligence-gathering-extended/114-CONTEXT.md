# Phase 114: Intelligence Gathering Extended - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend Phase 113's reconnaissance with hidden asset discovery and authentication analysis. Focus on finding undocumented endpoints, analyzing authentication mechanisms, and identifying bypass vectors. Builds on Phase 113's attack surface map and Phase 112's PTES foundation.

Phase 114 delivers deep reconnaissance capabilities for comprehensive security assessment (RECON-04, RECON-05).
</domain>

<decisions>
## Implementation Decisions

### Hidden Asset Discovery
- **D-01:** Scan for common admin panel paths (/admin, /administrator, /dashboard, /manage, /panel, /backend)
- **D-02:** Detect debug endpoints (/debug, /__debug__, /test, /api-docs when undocumented, /dev, /staging)
- **D-03:** Find backup files (.bak, .backup, .old, .zip, .tar.gz of source code, .sql dumps)
- **D-04:** Discover configuration file exposures (.env, .env.local, config.json, database.yml, .git/)
- **D-05:** Check for source map files (.js.map, .css.map) that expose original source
- **D-06:** Output format: Risk-scored list with exposure severity (Critical/High/Medium/Low)

### Authentication Analysis
- **D-07:** Detect authentication middleware patterns (JWT, Session, OAuth, API Key, Basic Auth)
- **D-08:** Identify routes protected by authentication vs unprotected (from Phase 113 target-enumerator.js)
- **D-09:** Map authentication bypass patterns (missing auth, weak validation, parameter pollution, verb tampering)
- **D-10:** Analyze JWT implementation (algorithm confusion, weak secrets, expiration, sensitive data in payload)
- **D-11:** Check for hardcoded credentials in source code (password, secret, key patterns)
- **D-12:** Output format: Auth coverage matrix with bypass vectors

### Risk Scoring
- **D-13:** Critical: Admin panel without auth, Debug enabled in production, Backup files exposed, Hardcoded credentials
- **D-14:** High: Config files accessible, Source maps exposed, Weak JWT implementation, Sensitive routes unprotected
- **D-15:** Medium: Undocumented API endpoints, Test pages accessible, Missing auth on non-sensitive routes
- **D-16:** Low: Development routes, Internal documentation, Version disclosure

### Integration Points
- **D-17:** Extend ReconAggregator from Phase 113 to include hidden asset and auth analysis
- **D-18:** Consume target-enumerator.js routes output for auth gap analysis
- **D-19:** Use recon-cache.js for token optimization across analysis phases
- **D-20:** Wire into pd:audit --recon workflow via flag-parser.js tier detection

### Claude's Discretion
- Exact wordlist for asset discovery (build from common-paths.txt data file)
- Request timeout thresholds for path scanning
- False positive filtering criteria for auth detection
- Report formatting details and output styling
</decisions>

<canonical_refs>
## Canonical References

### Reconnaissance Standards
- `.planning/REQUIREMENTS.md` §RECON-04, RECON-05 - Extended reconnaissance requirements
- Phase 112 artifacts: `bin/lib/flag-parser.js`, `bin/lib/recon-cache.js` - PTES foundation
- Phase 113 artifacts: `bin/lib/source-mapper.js`, `bin/lib/target-enumerator.js`, `bin/lib/recon-aggregator.js` - Foundation to build upon
- OWASP Testing Guide: Authentication Testing (OTG-AUTHN), Configuration Testing (OTG-CONFIG)

### Security References
- OWASP Top 10: A07 (Identification and Authentication Failures)
- OWASP Top 10: A05 (Security Misconfiguration)
- PTES v2.0: Intelligence Gathering phase
- MITRE ATT&CK T1552 (Unsecured Credentials)
- MITRE ATT&CK T1078 (Valid Accounts)

### Code Integration Points
- `bin/lib/target-enumerator.js` lines 335-365 - detectAuthRequirement() and isInternalRoute() patterns
- `bin/lib/recon-aggregator.js` - Integration point for extended recon
- `bin/lib/flag-parser.js` - PTES tier detection (free/standard/deep/redteam)
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **TargetEnumerator** (`bin/lib/target-enumerator.js`): Already identifies authRequired and isDocumented flags - extend for auth analysis
- **ReconAggregator** (`bin/lib/recon-aggregator.js`): Has generateRisks() with authentication category - extend with new risk types
- **ReconCache** (`bin/lib/recon-cache.js`): Use for caching asset discovery results across runs
- **flag-parser.js** (`bin/lib/flag-parser.js`): PTES tier parsing - use to conditionally run extended recon

### Established Patterns
- **AST-based analysis**: Pattern from source-mapper.js - use for credential pattern detection
- **Route detection**: Pattern from target-enumerator.js (lines 79-143) - extend for hidden route discovery
- **Risk scoring**: Pattern from recon-aggregator.js (lines 148-174) - extend with new scoring factors
- **Framework detection**: Pattern from target-enumerator.js (lines 169-186) - use for auth middleware detection

### Integration Points
- **ReconAggregator.runFullRecon()**: Add Phase 114 modules as new phases (lines 28-66)
- **Risk generation**: Extend generateRisks() (lines 179-274) with hidden asset and auth risks
- **Recommendations**: Extend generateRecommendations() (lines 279-339) with auth-specific guidance
- **pd:audit --recon**: Wire via flag-parser.js tier detection
</code_context>

<specifics>
## Specific Ideas

- Hidden asset discovery should include rate limiting to avoid overwhelming target (use recon-cache.js to track request timing)
- Authentication analysis should identify JWT libraries (jsonwebtoken, passport-jwt) and their common vulnerabilities
- Look for patterns like 'password', 'secret', 'key', 'token', 'auth' in variable names for credential exposure
- Check for commented-out code that may contain sensitive information (TODO, FIXME, DEBUG blocks)
- Analyze middleware chains to identify auth gaps (express middleware pattern analysis)
- Support both static analysis (code-based) and dynamic analysis (HTTP requests) for auth detection
- Build wordlist data files under `references/wordlists/` for extensible asset discovery
</specifics>

<deferred>
## Deferred Ideas

- Business logic mapping (Phase 115: RECON-06, RECON-07)
- Taint analysis engine (Phase 115)
- OSINT intelligence gathering (Phase 116: OSINT-01 to OSINT-04)
- Payload development and WAF evasion (Phase 117: PAYLOAD-01 to PAYLOAD-05)
- Session token analysis (Phase 118: TOKEN-01 to TOKEN-04)
- Post-exploitation planning (Phase 119: POST-01 to POST-04)
- Active scanning with request fuzzing (Phase 123)
</deferred>

---

*Phase: 114-intelligence-gathering-extended*
*Context gathered: 2026-04-05*
*Depends on: Phase 112 (PTES Foundation), Phase 113 (Intelligence Gathering Core)*
