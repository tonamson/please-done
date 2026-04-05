# Phase 116: OSINT Intelligence - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement OSINT (Open Source Intelligence) gathering capabilities for the pd:audit skill following MITRE ATT&CK framework. This phase delivers external reconnaissance features that gather intelligence from public sources without direct interaction with the target system.

**Scope:**
- Google Dorks generation for target reconnaissance (T1593.002)
- Certificate Transparency log scanning for subdomain discovery (T1596.003)
- Repository secrets detection in exposed code (T1552)
- Subdomain enumeration via OSINT sources

**Out of scope:**
- Active scanning (covered in Phase 113-115)
- Payload generation (Phase 117)
- Token analysis (Phase 118)

</domain>

<decisions>
## Implementation Decisions

### OSINT Data Sources
- **D-01:** Use public CT logs (crt.sh, Censys, Certificate Transparency)
- **D-02:** Support Google Dorks with categorized query templates
- **D-03:** GitHub/GitLab API for repository secret scanning (with rate limiting)
- **D-04:** Subdomain enumeration via OSINT sources (not brute force)

### Command Interface
- **D-05:** Extend pd:audit with --osint flag
- **D-06:** Results cached in recon-cache for cross-phase reuse
- **D-07:** Output formats: JSON (default), table for CLI readability

### Rate Limiting & Ethics
- **D-08:** Respect rate limits for all external APIs
- **D-09:** Add delay between requests (configurable, default 1s)
- **D-10:** Document ethical usage guidelines

### Claude's Discretion
- Specific CT log providers to integrate
- Google Dork query categories and templates
- Secret detection regex patterns beyond common ones
- Output formatting details

</decisions>

<canonical_refs>
## Canonical References

### OSINT Standards
- `docs/pentest/OSINT.md` — OSINT methodology and data sources
- `docs/mitre/T1593.002.md` — Search Open Websites/Domains: Search Engines
- `docs/mitre/T1596.003.md` — Gather Victim Network Information: Digital Certificates
- `docs/mitre/T1552.md` — Unsecured Credentials

### Project References
- `bin/lib/recon-cache.js` — Reconnaissance caching system (from Phase 112)
- `skills/audit.md` — pd:audit skill specification
- `.planning/milestones/v12.0-ROADMAP.md` — v12.0 milestone details

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **recon-cache.js**: Caching system from Phase 112 for storing OSINT results
- **flag-parser.js**: PTES flag parsing from Phase 112
- **BusinessLogicMapper**: Code analysis patterns from Phase 115

### Integration Points
- Extend pd:audit skill with --osint flag
- Hook into recon-cache for result persistence
- Output to stdout and/or structured JSON files

### Established Patterns
- Tiered commands: --osint (light), --osint-full (comprehensive)
- Cache invalidation: 24h default for OSINT data
- Error handling: Graceful degradation when APIs rate limit

</code_context>

<specifics>
## Specific Ideas

**Google Dorks Categories:**
- Site enumeration: `site:target.com inurl:admin`
- Exposed files: `site:target.com ext:sql|bak|config`
- Sensitive info: `site:target.com intitle:"index of"`
- Error pages: `site:target.com error|warning`

**Secret Patterns to Detect:**
- API keys: AWS, GCP, Azure, GitHub, Slack
- Database connection strings
- JWT tokens (with weak secrets)
- Private keys (RSA, ECDSA, ed25519)
- Password patterns in code

**CT Log Sources:**
- crt.sh (primary)
- Censys (if API key available)
- CertSpotter
- Facebook CT logs

</specifics>

<deferred>
## Deferred Ideas

- Shodan integration — could be Phase 116.x or future enhancement
- TheHarvester-style email harvesting — out of scope for v12.0
- Social media OSINT — add to backlog
- Dark web monitoring — separate phase entirely

</deferred>

---

*Phase: 116-osint-intelligence*
*Context gathered: 2026-04-05*
