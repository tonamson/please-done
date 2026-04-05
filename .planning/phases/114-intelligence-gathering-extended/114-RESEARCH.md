# Phase 114: Intelligence Gathering Extended - Research

**Researched:** 2026-04-05
**Domain:** Web Application Security Reconnaissance (Hidden Asset Discovery, Authentication Analysis)
**Confidence:** HIGH

## Summary

Phase 114 extends Phase 113's reconnaissance capabilities with two critical security assessment features: **Hidden Asset Discovery** (RECON-04) and **Authentication Analysis** (RECON-05). This research covers technical implementation approaches, integration patterns with existing Phase 113 code, and security best practices derived from current CVEs and PTES/OWASP standards.

**Primary Recommendation:** Build two new modules (`asset-discoverer.js` and `auth-analyzer.js`) that extend the existing `ReconAggregator` pattern, leveraging `ReconCache` for token optimization and AST-based analysis from `SourceMapper` for credential detection.

**Key Technical Findings:**
1. JWT algorithm confusion vulnerabilities remain critical in 2024 (CVE-2024-54150, CVE-2026-27804) - the `none` algorithm and RS256/HS256 confusion attacks require explicit algorithm pinning detection
2. Static analysis for authentication middleware requires pattern matching across multiple patterns (Passport, JWT, Session, OAuth) and framework-specific implementations
3. Wordlist-based asset discovery requires rate limiting and false positive filtering to be effective
4. Hardcoded credential detection via AST traversal should target variable declarations with sensitive naming patterns and string literals

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Scan for common admin panel paths (/admin, /administrator, /dashboard, /manage, /panel, /backend)
- **D-02:** Detect debug endpoints (/debug, /__debug__, /test, /api-docs when undocumented, /dev, /staging)
- **D-03:** Find backup files (.bak, .backup, .old, .zip, .tar.gz of source code, .sql dumps)
- **D-04:** Discover configuration file exposures (.env, .env.local, config.json, database.yml, .git/)
- **D-05:** Check for source map files (.js.map, .css.map) that expose original source
- **D-06:** Output format: Risk-scored list with exposure severity (Critical/High/Medium/Low)
- **D-07:** Detect authentication middleware patterns (JWT, Session, OAuth, API Key, Basic Auth)
- **D-08:** Identify routes protected by authentication vs unprotected (from Phase 113 target-enumerator.js)
- **D-09:** Map authentication bypass patterns (missing auth, weak validation, parameter pollution, verb tampering)
- **D-10:** Analyze JWT implementation (algorithm confusion, weak secrets, expiration, sensitive data in payload)
- **D-11:** Check for hardcoded credentials in source code (password, secret, key patterns)
- **D-12:** Output format: Auth coverage matrix with bypass vectors
- **D-13:** Critical: Admin panel without auth, Debug enabled in production, Backup files exposed, Hardcoded credentials
- **D-14:** High: Config files accessible, Source maps exposed, Weak JWT implementation, Sensitive routes unprotected
- **D-15:** Medium: Undocumented API endpoints, Test pages accessible, Missing auth on non-sensitive routes
- **D-16:** Low: Development routes, Internal documentation, Version disclosure
- **D-17:** Extend ReconAggregator from Phase 113 to include hidden asset and auth analysis
- **D-18:** Consume target-enumerator.js routes output for auth gap analysis
- **D-19:** Use recon-cache.js for token optimization across analysis phases
- **D-20:** Wire into pd:audit --recon workflow via flag-parser.js tier detection

### Claude's Discretion
- Exact wordlist for asset discovery (build from common-paths.txt data file)
- Request timeout thresholds for path scanning
- False positive filtering criteria for auth detection
- Report formatting details and output styling

### Deferred Ideas (OUT OF SCOPE)
- Business logic mapping (Phase 115: RECON-06, RECON-07)
- Taint analysis engine (Phase 115)
- OSINT intelligence gathering (Phase 116: OSINT-01 to OSINT-04)
- Payload development and WAF evasion (Phase 117: PAYLOAD-01 to PAYLOAD-05)
- Session token analysis (Phase 118: TOKEN-01 to TOKEN-04)
- Post-exploitation planning (Phase 119: POST-01 to POST-04)
- Active scanning with request fuzzing (Phase 123)

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RECON-04 | Hidden Asset Discovery - Admin panels, debug endpoints, backup files, version control exposure | Common path wordlists, backup file patterns, source map detection patterns identified. Rate limiting strategies determined. |
| RECON-05 | Authentication Analysis - Mechanism detection, weakness identification, bypass vector mapping | JWT vulnerability patterns (CVE-2024-54150), middleware detection patterns for Express/Passport/NestJS, AST-based credential detection approach defined. |

## Standard Stack

### Core (New Modules)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@babel/parser` | ^7.x | AST parsing for credential detection | Already used in Phase 113 source-mapper.js [VERIFIED: codebase] |
| `@babel/traverse` | ^7.x | AST traversal for pattern matching | Already used in Phase 113 source-mapper.js [VERIFIED: codebase] |
| `glob` | ^10.x | File pattern matching for wordlist loading | Already used in Phase 113 target-enumerator.js [VERIFIED: codebase] |

### Supporting (Data Files)
| File | Purpose | When to Use |
|------|---------|-------------|
| `references/wordlists/common-paths.txt` | Admin/debug path wordlist | Asset discovery scanning |
| `references/wordlists/backup-extensions.txt` | Backup file extensions | Backup file discovery |
| `references/wordlists/credential-patterns.txt` | Hardcoded credential regex patterns | Static analysis credential detection |

### Integration (Existing)
| Module | Purpose | Integration Point |
|--------|---------|-----------------|
| `recon-cache.js` | Result caching | Cache asset discovery results between runs |
| `recon-aggregator.js` | Result aggregation | Extend runFullRecon() with Phase 114 modules |
| `target-enumerator.js` | Route discovery | Consume authRequired flags for gap analysis |
| `flag-parser.js` | Tier detection | deep/redteam tier triggers extended recon |

**No additional npm packages required** - Phase 114 builds entirely on existing Phase 113 dependencies.

## Architecture Patterns

### Recommended Module Structure
```
bin/lib/
├── asset-discoverer.js      # Hidden asset discovery (RECON-04)
├── auth-analyzer.js         # Authentication analysis (RECON-05)
└── recon-aggregator.js      # Extended with Phase 114 integration

references/wordlists/
├── common-paths.txt         # Admin panel, debug paths
├── backup-extensions.txt    # Backup file patterns
└── credential-patterns.txt  # Regex patterns for credential detection
```

### Pattern 1: Asset Discovery Workflow
**What:** Scan for hidden assets using wordlist-based path enumeration combined with response analysis
**When to use:** Deep and Red Team reconnaissance tiers
**Example:**
```javascript
// Source: Pattern derived from target-enumerator.js + research
class AssetDiscoverer {
  async discoverHiddenAssets(projectPath, options = {}) {
    const { tier = 'standard', baseUrl } = options;
    const findings = [];

    // Load wordlists based on tier
    const paths = await this.loadWordlist('common-paths', tier);

    // Rate-limited scanning with cache
    for (const path of paths) {
      const cached = await this.cache.get(`asset:${path}`);
      if (cached) {
        findings.push(cached);
        continue;
      }

      const result = await this.checkPath(baseUrl, path);
      if (result.exists) {
        const finding = this.classifyFinding(result);
        findings.push(finding);
        await this.cache.set(`asset:${path}`, finding);
      }

      // Rate limiting
      await this.delay(100); // 100ms between requests
    }

    return findings;
  }
}
```

### Pattern 2: Authentication Middleware Detection
**What:** AST-based analysis to identify authentication middleware patterns
**When to use:** All reconnaissance tiers (identifies auth gaps)
**Example:**
```javascript
// Source: Pattern from source-mapper.js + web research [CITED: thelinuxcode.com]
class AuthAnalyzer {
  detectAuthMiddleware(ast, filePath) {
    const patterns = [];

    traverse(ast, {
      // Express: app.use(authMiddleware)
      CallExpression: (nodePath) => {
        const { callee, arguments: args } = nodePath.node;

        // Pattern: app.use(authFunction)
        if (callee.type === 'MemberExpression' &&
            callee.property?.name === 'use') {
          const middleware = args[0];
          if (middleware?.type === 'Identifier') {
            const authType = this.classifyAuthMiddleware(middleware.name);
            if (authType) {
              patterns.push({
                type: authType,
                file: filePath,
                line: nodePath.node.loc?.start?.line || 0,
                pattern: 'express-use'
              });
            }
          }
        }

        // Pattern: jwt.verify() direct calls
        if (callee.type === 'MemberExpression' &&
            callee.object?.name === 'jwt' &&
            callee.property?.name === 'verify') {
          patterns.push(this.analyzeJwtVerification(nodePath, filePath));
        }
      },

      // Passport: passport.authenticate('jwt', ...)
      CallExpression: (nodePath) => {
        const { callee } = nodePath.node;
        if (callee.type === 'MemberExpression' &&
            callee.object?.name === 'passport' &&
            callee.property?.name === 'authenticate') {
          patterns.push({
            type: 'passport',
            file: filePath,
            line: nodePath.node.loc?.start?.line || 0,
            pattern: 'passport-authenticate'
          });
        }
      }
    });

    return patterns;
  }

  classifyAuthMiddleware(name) {
    const authPatterns = [
      { pattern: /auth/i, type: 'custom-auth' },
      { pattern: /jwt/i, type: 'jwt' },
      { pattern: /passport/i, type: 'passport' },
      { pattern: /session/i, type: 'session' },
      { pattern: /bearer/i, type: 'bearer-token' },
      { pattern: /api.?key/i, type: 'api-key' }
    ];

    for (const { pattern, type } of authPatterns) {
      if (pattern.test(name)) return type;
    }
    return null;
  }
}
```

### Pattern 3: JWT Vulnerability Analysis
**What:** Analyze JWT implementation for algorithm confusion, weak secrets, and missing validation
**When to use:** Standard tier and above when JWT library detected
**Example:**
```javascript
// Source: Based on CVE-2024-54150 research [CITED: iamdevbox.com, pinusx.com]
class AuthAnalyzer {
  analyzeJwtImplementation(ast, filePath) {
    const vulnerabilities = [];

    traverse(ast, {
      CallExpression: (nodePath) => {
        const { callee, arguments: args } = nodePath.node;

        // Pattern: jwt.verify(token, secret) without algorithm
        if (callee.type === 'MemberExpression' &&
            callee.object?.name === 'jwt' &&
            callee.property?.name === 'verify') {

          // Check if options object with algorithms is provided
          const optionsArg = args[2]; // jwt.verify(token, secret, options)
          if (!optionsArg || optionsArg.type !== 'ObjectExpression') {
            vulnerabilities.push({
              type: 'jwt-algorithm-not-pinned',
              severity: 'HIGH',
              file: filePath,
              line: nodePath.node.loc?.start?.line || 0,
              description: 'JWT verification without explicit algorithm pinning - vulnerable to algorithm confusion',
              remediation: 'Add { algorithms: ["RS256"] } option to jwt.verify()'
            });
          }
        }

        // Pattern: jwt.sign with sensitive data
        if (callee.type === 'MemberExpression' &&
            callee.object?.name === 'jwt' &&
            callee.property?.name === 'sign') {
          const payloadArg = args[0];
          if (this.containsSensitiveData(payloadArg)) {
            vulnerabilities.push({
              type: 'jwt-sensitive-payload',
              severity: 'MEDIUM',
              file: filePath,
              line: nodePath.node.loc?.start?.line || 0,
              description: 'JWT payload may contain sensitive data'
            });
          }
        }
      }
    });

    return vulnerabilities;
  }
}
```

### Pattern 4: Hardcoded Credential Detection
**What:** AST-based pattern matching for hardcoded secrets in source code
**When to use:** Deep and Red Team tiers (source code exposure)
**Example:**
```javascript
// Source: Pattern derived from source-mapper.js + security research
class AuthAnalyzer {
  findHardcodedCredentials(ast, filePath) {
    const findings = [];
    const credentialPatterns = [
      { pattern: /password|passwd|pwd/i, type: 'password' },
      { pattern: /secret|private.?key/i, type: 'secret' },
      { pattern: /api.?key|access.?token/i, type: 'api-key' },
      { pattern: /auth.?token|bearer/i, type: 'token' }
    ];

    traverse(ast, {
      // Pattern: const password = 'hardcoded'
      VariableDeclarator: (nodePath) => {
        const { id, init } = nodePath.node;
        if (id.type === 'Identifier' && init?.type === 'StringLiteral') {
          const varName = id.name;
          for (const { pattern, type } of credentialPatterns) {
            if (pattern.test(varName)) {
              findings.push({
                type: 'hardcoded-credential',
                credentialType: type,
                variable: varName,
                file: filePath,
                line: nodePath.node.loc?.start?.line || 0,
                severity: type === 'password' ? 'CRITICAL' : 'HIGH',
                description: `Hardcoded ${type} in source code`
              });
            }
          }
        }
      },

      // Pattern: process.env.SECRET || 'fallback'
      LogicalExpression: (nodePath) => {
        const { operator, right } = nodePath.node;
        if (operator === '||' && right?.type === 'StringLiteral') {
          const parent = nodePath.parent;
          if (parent?.type === 'VariableDeclarator' &&
              parent.id?.type === 'Identifier') {
            const varName = parent.id.name;
            for (const { pattern, type } of credentialPatterns) {
              if (pattern.test(varName)) {
                findings.push({
                  type: 'fallback-credential',
                  credentialType: type,
                  variable: varName,
                  file: filePath,
                  line: nodePath.node.loc?.start?.line || 0,
                  severity: 'HIGH',
                  description: `Fallback ${type} may expose hardcoded value`
                });
              }
            }
          }
        }
      }
    });

    return findings;
  }
}
```

### Anti-Patterns to Avoid
- **Timing-based enumeration:** Do not rely on response timing differences for path enumeration (unreliable, network-dependent)
- **Aggressive scanning:** Avoid parallel requests without rate limiting (may trigger WAF/rate limiting)
- **Single-pattern detection:** Do not rely on a single AST pattern for auth detection (false negatives)
- **Credential regex on non-AST sources:** Do not use regex on raw code (false positives from comments/strings)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT parsing | Custom JWT decoder | Use existing jsonwebtoken patterns via AST detection | JWT has complex header/payload validation - focus on detecting insecure usage patterns |
| Wordlist management | Custom wordlist format | Simple line-delimited text files | Industry standard, easy to extend, SecLists compatible |
| Path validation | URL joining for path construction | Path validation from recon-cache.js filePathInTrustedDir | Prevents path traversal (CWE-22) |
| AST parsing | Custom parser | @babel/parser already in project | Babel parser handles all modern JS/TS features |

**Key insight:** The Phase 113 codebase already provides robust AST parsing (`SourceMapper`), caching (`ReconCache`), and route detection (`TargetEnumerator`). Phase 114 should extend these rather than building parallel implementations.

## Common Pitfalls

### Pitfall 1: JWT Algorithm Confusion False Negatives
**What goes wrong:** Only checking for `alg: 'none'` misses RS256/HS256 confusion attacks
**Why it happens:** Developers only check for the obvious `none` algorithm
**How to avoid:** Check for:
1. Missing `algorithms` option in `jwt.verify()`
2. Use of `jwt.decode()` without verification
3. Dynamic algorithm selection based on token header
**Warning signs:** `jwt.verify()` calls with only 2 arguments (token, secret)

### Pitfall 2: Rate Limiting Trigger
**What goes wrong:** Aggressive path scanning triggers target WAF/rate limiting
**Why it happens:** No delays between requests, too many parallel connections
**How to avoid:**
1. Implement 100-200ms delay between requests
2. Add jitter to prevent pattern detection
3. Respect 429/403 responses and back off
4. Use ReconCache to avoid re-checking paths
**Warning signs:** Multiple 429/403 responses in succession

### Pitfall 3: False Positive Credential Detection
**What goes wrong:** Commented code or test fixtures flagged as hardcoded credentials
**Why it happens:** Regex patterns match in comments, test files, or example code
**How to avoid:**
1. Use AST traversal (not regex) to find actual variable assignments
2. Filter out test files (*.test.js, *.spec.js, __tests__)
3. Check for placeholder patterns (`***`, `xxx`, `changeme`)
4. Require minimum entropy for detected strings
**Warning signs:** Matches in files with `.test.` or `.spec.` in name

### Pitfall 4: Auth Bypass Pattern Misses
**What goes wrong:** Missing authentication gaps due to middleware ordering issues
**Why it happens:** Express middleware order matters - auth middleware might be mounted after routes
**How to avoid:**
1. Analyze middleware mounting order in app.js/server.js
2. Look for routes defined before auth middleware
3. Check for conditional auth (auth only in production)
4. Detect `next()` called without return in auth middleware
**Warning signs:** Routes with auth middleware in chain but no auth patterns in the middleware itself

### Pitfall 5: Wordlist Coverage Gaps
**What goes wrong:** Missing hidden assets due to incomplete wordlist
**Why it happens:** Framework-specific paths not included in generic wordlists
**How to avoid:**
1. Include framework-specific paths (e.g., Next.js: `/_next/`, Laravel: `/phpmyadmin`)
2. Generate paths from detected dependencies (package.json analysis)
3. Include case variants (Admin, ADMIN, admin)
**Warning signs:** No findings from common paths despite target having admin interface

## Code Examples

### Hidden Asset Discovery with Risk Scoring
```javascript
// Source: Pattern from target-enumerator.js + research
async function discoverHiddenAssets(projectPath, baseUrl, options = {}) {
  const wordlist = await loadWordlist('common-paths');
  const findings = [];

  for (const path of wordlist) {
    const result = await checkAsset(baseUrl, path, options);
    if (result.exists) {
      findings.push({
        path: result.path,
        type: classifyAssetType(result),
        severity: calculateAssetRisk(result),
        evidence: result.evidence
      });
    }
  }

  return findings.sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity));
}

function classifyAssetType(result) {
  const patterns = [
    { pattern: /\/(admin|dashboard|panel)/, type: 'admin-panel' },
    { pattern: /\/(debug|test|dev)/, type: 'debug-endpoint' },
    { pattern: /\.(env|config)/, type: 'config-exposure' },
    { pattern: /\.(zip|tar|sql)/, type: 'backup-file' },
    { pattern: /\.(js|css)\.map/, type: 'source-map' }
  ];

  for (const { pattern, type } of patterns) {
    if (pattern.test(result.path)) return type;
  }
  return 'unknown';
}

function calculateAssetRisk(result) {
  const severityMap = {
    'admin-panel': result.requiresAuth ? 'MEDIUM' : 'CRITICAL',
    'debug-endpoint': result.isProduction ? 'CRITICAL' : 'HIGH',
    'config-exposure': 'HIGH',
    'backup-file': 'HIGH',
    'source-map': 'MEDIUM'
  };
  return severityMap[classifyAssetType(result)] || 'LOW';
}
```

### Auth Coverage Matrix Generation
```javascript
// Source: Pattern from target-enumerator.js lines 335-365 + auth analysis
function generateAuthCoverageMatrix(routes, authPatterns) {
  const matrix = {
    protected: [],
    unprotected: [],
    bypassCandidates: [],
    summary: {
      total: routes.length,
      protected: 0,
      unprotected: 0,
      sensitiveUnprotected: 0
    }
  };

  const sensitivePatterns = /admin|user|account|password|token|api|internal|debug/i;

  for (const route of routes) {
    const isSensitive = sensitivePatterns.test(route.path);

    if (route.authRequired) {
      matrix.protected.push(route);
      matrix.summary.protected++;
    } else {
      matrix.unprotected.push(route);
      matrix.summary.unprotected++;

      if (isSensitive) {
        matrix.bypassCandidates.push({
          ...route,
          bypassType: 'missing-auth-on-sensitive-route',
          severity: 'HIGH'
        });
        matrix.summary.sensitiveUnprotected++;
      }
    }
  }

  return matrix;
}
```

### ReconAggregator Extension Pattern
```javascript
// Source: Pattern from recon-aggregator.js lines 28-66
async runFullRecon(projectPath, options = {}) {
  const { tier = 'standard' } = options;

  // Phase 113 modules
  const serviceInfo = await this.serviceDiscovery.analyzeDependencies(projectPath);
  const sourceInfo = tier !== 'free' ? await this.runSourceAnalysis(...) : null;
  const targetInfo = tier !== 'free' ? await this.targetEnumerator.discoverRoutes(projectPath) : null;

  // Phase 114 modules (deep/redteam tiers)
  let assetInfo = null;
  let authInfo = null;
  if (tier === 'deep' || tier === 'redteam') {
    console.log('  → Discovering hidden assets...');
    assetInfo = await this.assetDiscoverer.discoverHiddenAssets(projectPath, options);

    console.log('  → Analyzing authentication...');
    authInfo = await this.authAnalyzer.analyze(projectPath, targetInfo, options);
  }

  this.results = {
    summary: this.generateSummary(serviceInfo, sourceInfo, targetInfo, assetInfo, authInfo),
    serviceInfo,
    sourceInfo,
    targetInfo,
    assetInfo,
    authInfo,
    risks: this.generateRisks(serviceInfo, sourceInfo, targetInfo, assetInfo, authInfo),
    recommendations: this.generateRecommendations(...)
  };

  return this.results;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JWT verification without algorithm pinning | Explicit algorithm whitelist | CVE-2024-54150 (Dec 2024) | Security critical - prevents algorithm confusion attacks |
| Regex-based credential detection | AST-based detection | Phase 114 | Reduces false positives, handles code context |
| Status code only enumeration | Content-length + heuristic analysis | Modern tooling | Reduces false positives from custom error pages |
| Single wordlist | Tiered wordlists (light/standard/deep) | Phase 114 | Performance optimization based on recon depth |
| No rate limiting | Rate-limited with jitter | Best practice 2024 | Prevents detection and blocking |

**Deprecated/outdated:**
- Manual JWT header parsing without library validation
- Regex-based secret scanning on raw source (use AST instead)
- Timing-based path enumeration (unreliable with modern WAFs)

## Wordlist Data Files

### Common Paths (references/wordlists/common-paths.txt)
```
# Admin Panels
admin
administrator
admin/login
admin/dashboard
dashboard
manage
management
panel
backend
control

# Debug Endpoints
debug
__debug__
test
testing
dev
development
staging
api-docs
swagger
openapi

# Framework Specific
wp-admin
phpmyadmin
api/admin
internal/admin
_next
```

### Backup Extensions (references/wordlists/backup-extensions.txt)
```
.bak
.backup
.old
.orig
.zip
.tar.gz
.tgz
.sql
.sql.gz
.dump
```

### Credential Patterns (references/wordlists/credential-patterns.txt)
```
# Variable name patterns (case insensitive)
password
passwd
secret
api_key
apikey
access_token
token
auth_token
private_key
```

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | 100-200ms delay between path checks sufficient for rate limiting | Architecture Patterns | May still trigger rate limiting on sensitive targets; user may need to configure delay |
| A2 | AST-based credential detection catches >80% of hardcoded secrets | Code Examples | May miss credentials in complex expressions or dynamically constructed strings |
| A3 | framework detection from package.json sufficient for framework-specific paths | Wordlist Data Files | May miss custom/framework forks; may need additional detection from file structure |
| A4 | JWT algorithm confusion still primary JWT vulnerability in 2024 | State of the Art | New vulnerability classes may emerge; research should be re-verified during implementation |

## Open Questions

1. **Wordlist Size vs Performance Tradeoff**
   - What we know: Larger wordlists increase coverage but slow scanning
   - What's unclear: Optimal wordlist size for each tier (free/standard/deep/redteam)
   - Recommendation: Start with ~500 paths for standard, ~2000 for deep/redteam, measure performance

2. **False Positive Threshold**
   - What we know: Source maps and config files often have legitimate access
   - What's unclear: Threshold for flagging findings (all findings vs high-confidence only)
   - Recommendation: Include all findings with confidence scores, let user filter in report

3. **Dynamic vs Static Auth Detection**
   - What we know: Some auth patterns only visible at runtime (DB checks, external services)
   - What's unclear: Whether to attempt dynamic verification or stay purely static
   - Recommendation: Stay static for Phase 114, defer dynamic verification to Phase 123 (active scanning)

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| @babel/parser | AST analysis | ✓ | ^7.x | None - core requirement |
| @babel/traverse | AST traversal | ✓ | ^7.x | None - core requirement |
| glob | File discovery | ✓ | ^10.x | Use fs.readdir with recursion |
| fs/promises | File I/O | ✓ | Node built-in | None |

**Missing dependencies with no fallback:** None - Phase 114 uses existing Phase 113 dependencies only.

**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node:test) |
| Config file | None - see Phase 113 Wave 0 |
| Quick run command | `node --test bin/lib/*.test.js` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RECON-04 | Asset discovery finds admin panels | unit | `node --test bin/lib/asset-discoverer.test.js` | ❌ Wave 0 |
| RECON-04 | Asset discovery finds backup files | unit | `node --test bin/lib/asset-discoverer.test.js` | ❌ Wave 0 |
| RECON-04 | Asset discovery rate limiting works | unit | `node --test bin/lib/asset-discoverer.test.js` | ❌ Wave 0 |
| RECON-05 | JWT algorithm pinning detection | unit | `node --test bin/lib/auth-analyzer.test.js` | ❌ Wave 0 |
| RECON-05 | Hardcoded credential detection | unit | `node --test bin/lib/auth-analyzer.test.js` | ❌ Wave 0 |
| RECON-05 | Auth coverage matrix generation | unit | `node --test bin/lib/auth-analyzer.test.js` | ❌ Wave 0 |
| RECON-04/05 | Integration with ReconAggregator | integration | `node --test bin/lib/recon-aggregator.test.js` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test bin/lib/asset-discoverer.test.js -x`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `bin/lib/asset-discoverer.test.js` - covers RECON-04
- [ ] `bin/lib/auth-analyzer.test.js` - covers RECON-05
- [ ] `bin/lib/recon-aggregator.test.js` - extended for Phase 114 integration
- [ ] `references/wordlists/common-paths.txt` - data file
- [ ] `references/wordlists/backup-extensions.txt` - data file
- [ ] `references/wordlists/credential-patterns.txt` - data file

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | JWT pattern detection, middleware analysis |
| V3 Session Management | Yes | Session-based auth detection |
| V4 Access Control | Yes | Admin panel exposure detection |
| V5 Input Validation | No | Not in scope for Phase 114 |
| V6 Cryptography | Yes | JWT algorithm confusion detection |
| V7 Error Handling | Partial | Debug endpoint detection |
| V9 Data Protection | Yes | Backup file/config exposure detection |
| V10 Malicious Code | Yes | Hardcoded credential detection |
| V11 Business Logic | No | Phase 115 scope |
| V12 Files and Resources | Yes | Backup file discovery |
| V13 API | Partial | Auth coverage for API routes |

### Known Threat Patterns for Node.js/Web Applications

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| JWT Algorithm Confusion (alg: none) | Tampering/Spoofing | Explicit algorithm pinning in jwt.verify() |
| JWT Algorithm Confusion (RS256/HS256) | Tampering/Spoofing | Algorithm whitelist, separate key types |
| Hardcoded Credentials | Information Disclosure | Environment variables, secret management |
| Admin Panel Exposure | Elevation of Privilege | IP whitelisting, strong auth, rate limiting |
| Source Map Exposure | Information Disclosure | Exclude from production builds |
| Config File Exposure | Information Disclosure | Proper web server configuration, deny access |
| Missing Auth on Sensitive Routes | Elevation of Privilege | Middleware chain audit, automated testing |
| Backup File Exposure | Information Disclosure | Proper deployment hygiene, .gitignore |

## Sources

### Primary (HIGH confidence)
- `bin/lib/target-enumerator.js` - lines 79-143 (route detection), lines 335-365 (auth detection)
- `bin/lib/source-mapper.js` - AST traversal patterns for analysis
- `bin/lib/recon-aggregator.js` - integration patterns, risk scoring
- `bin/lib/recon-cache.js` - caching patterns for optimization
- `bin/lib/flag-parser.js` - tier detection implementation

### Secondary (MEDIUM confidence)
- [OWASP Testing Guide v4.2 - OTG-AUTHN](https://owasp.org/www-project-web-security-testing-guide/) - Authentication testing methodology
- [OWASP Testing Guide v4.2 - OTG-CONFIG](https://owasp.org/www-project-web-security-testing-guide/) - Configuration testing
- [PTES v2.0 - Intelligence Gathering Phase](http://www.pentest-standard.org/) - Reconnaissance methodology
- [MITRE ATT&CK T1552 - Unsecured Credentials](https://attack.mitre.org/techniques/T1552/) - Credential access techniques
- [MITRE ATT&CK T1078 - Valid Accounts](https://attack.mitre.org/techniques/T1078/) - Account abuse techniques

### Tertiary (LOW confidence - web search)
- [JWT Algorithm Confusion CVE-2024-54150](https://pentesterlab.com/blog/another-jwt-algorithm-confusion-cve-2024-54150) - JWT vulnerability patterns [VERIFIED: multiple sources]
- [SecLists - Security Wordlists](https://github.com/danielmiessler/SecLists) - Industry standard wordlists [VERIFIED: security community standard]
- [Express.js Middleware Security](https://thelinuxcode.com/authentication-strategies-in-express-practical-patterns-pitfalls-and-production-ready-defaults/) - Auth patterns [CITED: thelinuxcode.com]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - builds on Phase 113 verified dependencies
- Architecture: HIGH - extends established patterns from Phase 113
- Pitfalls: MEDIUM-HIGH - based on current CVEs and known vulnerability classes

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (30 days for stable security patterns, JWT vulnerabilities may require more frequent updates)

**Next Review Triggers:**
- New JWT-related CVEs affecting Node.js libraries
- Changes to Phase 113 recon-aggregator.js API
- Updates to OWASP Testing Guide or PTES standards
