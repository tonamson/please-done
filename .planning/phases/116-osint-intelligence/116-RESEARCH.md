---
phase: 116
plan: all
date: 2026-04-05
---

# Phase 116: OSINT Intelligence - Research

## Objective
Research implementation approaches for OSINT (Open Source Intelligence) gathering in the pd:audit skill.

## Research Findings

### Google Dorks Implementation

**Standard Categories:**
- Site enumeration: `site:{target}` based searches
- Admin panels: `inurl:admin|login|dashboard`
- Exposed files: `ext:sql|bak|config|env`
- Sensitive info: `intitle:"index of"`, `intext:password`
- Error messages: Stack traces, debug info

**Implementation Pattern:**
```javascript
class GoogleDorks {
  constructor() {
    this.patterns = {
      admin: ['site:{t} inurl:admin', 'site:{t} inurl:login'],
      files: ['site:{t} ext:sql', 'site:{t} filetype:env'],
      // ...
    };
  }
  generate(target, categories) { /* ... */ }
}
```

**Rate Limits:**
- Google Search: No API rate limit for dorks (search via browser/CLI)
- Tooling: Use responsibly, add delays between queries

### Certificate Transparency Logs

**Primary Sources:**
1. **crt.sh** - Free, no API key required
   - Endpoint: https://crt.sh/?q=%.{domain}&output=json
   - Rate limit: Be polite (~1 req/sec)
   - Returns: JSON array of certificate entries

2. **Censys** - API key required (free tier available)
   - Endpoint: https://search.censys.io/api/v2/certificates/search
   - Rate limit: Depends on API tier
   - Returns: Rich certificate data

3. **CertSpotter** - API key optional
   - Endpoint: https://api.certspotter.org/v1/issuances
   - Rate limit: 100 req/hour (free)
   - Returns: Certificate transparency entries

**Implementation Pattern:**
```javascript
class CrtShProvider {
  async query(domain) {
    const url = `https://crt.sh/?q=%25.${domain}&output=json`;
    // Handle rate limiting, parse JSON, extract subdomains
  }
}
```

### Secret Detection Patterns

**High-Confidence Patterns:**
- AWS Access Key: `AKIA[0-9A-Z]{16}`
- AWS Secret Key: `(?i)aws(.{0,20})?(?-i)['\"][0-9a-zA-Z\/+]{40}['\"]`
- GitHub Token: `ghp_[a-zA-Z0-9]{36}`
- Slack Token: `xox[baprs]-[0-9]{10,13}-[0-9]{10,13}`
- Generic API Key: `(?i)(api[_-]?key|apikey)[\s]*[=:][\s]*['"][a-z0-9]{16,}`
- JWT Token: `eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*`
- Private Key: `-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----`
- DB Connection: `(?i)(postgres|mysql|mongodb)://[^:]+:[^@]+@`

**Implementation Pattern:**
```javascript
const PATTERNS = {
  aws_key: { regex: /AKIA[0-9A-Z]{16}/g, confidence: 'high' },
  github_token: { regex: /ghp_[a-zA-Z0-9]{36}/g, confidence: 'high' },
  // ...
};

class SecretDetector {
  scan(text) {
    const findings = [];
    for (const [name, {regex, confidence}] of Object.entries(PATTERNS)) {
      const matches = text.matchAll(regex);
      for (const match of matches) {
        findings.push({type: name, match: match[0], confidence});
      }
    }
    return findings;
  }
}
```

### Subdomain Enumeration

**Aggregation Strategy:**
1. Query multiple CT log providers
2. Deduplicate (case-insensitive)
3. Score confidence by source count
4. Store in recon-cache

**Confidence Scoring:**
- 1 source: low confidence
- 2 sources: medium confidence
- 3+ sources: high confidence

**Output Format:**
```javascript
{
  subdomain: "api.example.com",
  sources: ["crt.sh", "censys"],
  confidence: "medium",
  first_seen: "2026-04-05T10:00:00Z",
  last_seen: "2026-04-05T10:00:00Z"
}
```

### Integration with Existing Code

**Recon Cache:**
- Use existing `recon-cache.js` from Phase 112
- Cache key: `osint:{domain}:{scope}` (basic|full)
- TTL: 24 hours (OSINT data changes slowly)

**Flag Parser:**
- Use existing `flag-parser.js` from Phase 112
- Add `--osint` and `--osint-full` flags
- Tier mapping: FREE/STANDARD=--osint, DEEP/REDTEAM=--osint-full

## Technical Risks

| Risk | Mitigation |
|------|------------|
| External API rate limits | Implement exponential backoff, respect 429s |
| API keys not configured | Degrade gracefully, use free sources only |
| False positive secrets | Confidence scoring, validation patterns |
| Large domain results | Pagination, streaming, timeout handling |
| Cache staleness | 24h TTL, --fresh flag to bypass |

## Recommendations

1. **Start with free sources** - crt.sh doesn't require API keys
2. **Make API keys optional** - Censys/CertSpotter enhance but aren't required
3. **Cache aggressively** - Minimize external API calls
4. **Score confidence** - Help users prioritize findings
5. **Handle errors gracefully** - Continue if one source fails

## External Dependencies

- `node-fetch` or native `fetch` for HTTP requests
- Existing recon-cache.js (Phase 112)
- Existing flag-parser.js (Phase 112)

## References

- MITRE ATT&CK T1593.002 - Search Open Websites/Domains
- MITRE ATT&CK T1596.003 - Digital Certificates
- crt.sh API: https://crt.sh/
- Censys API docs: https://search.censys.io/api
- Google Dorks database: https://www.exploit-db.com/google-hacking-database
