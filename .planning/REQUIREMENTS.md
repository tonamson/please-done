# v12.0 Requirements: Pentest & Red Team Enhancement

**Defined:** 2026-04-05
**Core Value:** Bổ sung Reconnaissance Phase đầy đủ theo chuẩn Web Pentest (PTES/OWASP) và Red Team TTPs cho skill `pd:audit`

---

## v12.0 Requirements

### Phase 1: PTES-Compliant Workflow Foundation

- [ ] **PTES-01**: Implement 4-phase PTES architecture (Pre-engagement → Intelligence Gathering → Vulnerability Analysis → Exploitation)
- [ ] **PTES-02**: Add command flags `--recon`, `--poc`, `--redteam` to `pd:audit`
- [ ] **PTES-03**: Create reconnaissance cache system for token optimization
- [ ] **PTES-04**: Implement tiered commands (FREE, STANDARD, DEEP, RED TEAM)

### Phase 2: Intelligence Gathering (PTES Phase 2)

- [ ] **RECON-01**: Source Mapping - Map all untrusted data sources (URL params, HTTP body, headers, cookies, file uploads, WebSocket, GraphQL, gRPC, JWT, OAuth, SAML, API keys)
- [ ] **RECON-02**: Target Enumeration - Discover endpoints via static analysis, dynamic fingerprinting, hidden discovery, content discovery
- [ ] **RECON-03**: Service Discovery - Framework detection, dependency analysis, outdated version flagging
- [ ] **RECON-04**: Hidden Asset Discovery - Admin panels, debug endpoints, backup files, version control exposure
- [ ] **RECON-05**: Authentication Analysis - Mechanism detection, weakness identification, bypass vector mapping
- [ ] **RECON-06**: Business Logic Mapping - Workflow discovery, state machine analysis, logic flaw identification
- [ ] **RECON-07**: Taint Analysis - Data flow graph, source-to-sink tracking, sanitization detection

### Phase 3: OSINT Intelligence (MITRE ATT&CK)

- [ ] **OSINT-01**: Google Dork generation for target reconnaissance (T1593.002)
- [ ] **OSINT-02**: Certificate Transparency log scanning for subdomain enumeration (T1596.003)
- [ ] **OSINT-03**: Repository secret detection (T1552)
- [ ] **OSINT-04**: Subdomain discovery and analysis

### Phase 4: Payload Development (MITRE ATT&CK)

- [ ] **PAYLOAD-01**: WAF evasion payload generation for major WAFs (Cloudflare, ModSecurity, Akamai, AWS WAF)
- [x] **PAYLOAD-02**: Command obfuscation techniques (T1027.010)
- [x] **PAYLOAD-03**: Multi-layer encoding support (base64, URL, hex, HTML, Unicode)
- [x] **PAYLOAD-04**: XSS/SQLi evasion variants (T1027)
- [x] **PAYLOAD-05**: Double file extension masquerading (T1036.007)

### Phase 5: Token Analysis (MITRE ATT&CK)

- [x] **TOKEN-01**: JWT vulnerability analysis (alg_none, weak_secret, exp_validation) (T1606.001)
- [x] **TOKEN-02**: Session cookie security analysis (flags, entropy, predictability) (T1539)
- [x] **TOKEN-03**: Token extraction pattern detection (T1528)
- [x] **TOKEN-04**: Credential access analysis

### Phase 6: Post-Exploitation Planning (MITRE ATT&CK)

- [ ] **POST-01**: Web shell pattern detection (T1505.003)
- [ ] **POST-02**: Persistence strategy planning
- [ ] **POST-03**: Data exfiltration channel planning (T1560)
- [ ] **POST-04**: Lateral movement path mapping

### Phase 7: Code Libraries

- [x] **LIB-01**: `recon-scanner.js` - Shared reconnaissance utilities
- [ ] **LIB-02**: `taint-engine.js` - Taint tracking engine
- [ ] **LIB-03**: `evasion-engine.js` - Red Team evasion techniques
- [ ] **LIB-04**: `dork-engine.js` - Google dork generation
- [ ] **LIB-05**: `ct-scanner.js` - Certificate transparency scanner
- [ ] **LIB-06**: `secret-scanner.js` - Repository secret detection
- [ ] **LIB-07**: `payload-engine.js` - WAF evasion & obfuscation
- [ ] **LIB-08**: `token-analyzer.js` - JWT/SAML/cookie analysis
- [ ] **LIB-09**: `webshell-detector.js` - Web shell pattern detection
- [ ] **LIB-10**: `recon-cache.js` - Caching for token optimization

### Phase 8: AI Agents

- [ ] **AGENT-01**: `pd-recon-analyzer.md` - Attack surface analysis, risk scoring
- [ ] **AGENT-02**: `pd-taint-tracker.md` - Deep taint analysis (on-demand)
- [ ] **AGENT-03**: `pd-osint-intel.md` - OSINT intelligence gathering
- [ ] **AGENT-04**: `pd-payload-dev.md` - Payload strategy, evasion recommendations
- [ ] **AGENT-05**: `pd-post-exploit.md` - Post-exploitation planning

### Phase 9: Data Files

- [ ] **DATA-01**: `references/wordlists/common-paths.txt`
- [ ] **DATA-02**: `references/wordlists/parameters.txt`
- [ ] **DATA-03**: `references/wordlists/dorks.txt`
- [ ] **DATA-04**: `references/wordlists/waf-bypass.txt`
- [ ] **DATA-05**: `references/wordlists/encodings.txt`
- [ ] **DATA-06**: `references/mitremap/techniques.yaml`

### Phase 10: Integration & Testing

- [ ] **INT-01**: Wire reconnaissance into `pd:audit --recon` workflow
- [ ] **INT-02**: Wire DAST verification into `pd:audit --poc` workflow
- [ ] **INT-03**: Wire Red Team into `pd:audit --redteam` workflow
- [ ] **INT-04**: Unit tests for all code libraries
- [ ] **INT-05**: Integration tests for full recon chain
- [ ] **INT-06**: Documentation updates

---

## Deferred (Future Milestones)

- Real-time collaboration for Red Team operations
- Automated exploitation beyond verification
- Cloud-specific reconnaissance (AWS/Azure/GCP)
- Mobile app pentest capabilities
- IoT device testing

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Actual exploitation of production systems | Security and legal constraints |
| Zero-day discovery | Out of scope for this framework |
| Physical security testing | Focus on web application security |
| Social engineering | Technical security only |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PTES-01 | Phase 112 | Pending |
| PTES-02 | Phase 112 | Pending |
| PTES-03 | Phase 112 | Pending |
| PTES-04 | Phase 112 | Pending |
| RECON-01 | Phase 113 | Pending |
| RECON-02 | Phase 113 | Pending |
| RECON-03 | Phase 113 | Pending |
| RECON-04 | Phase 114 | Pending |
| RECON-05 | Phase 114 | Pending |
| RECON-06 | Phase 115 | Pending |
| RECON-07 | Phase 115 | Pending |
| OSINT-01 | Phase 116 | Pending |
| OSINT-02 | Phase 116 | Pending |
| OSINT-03 | Phase 116 | Pending |
| OSINT-04 | Phase 116 | Pending |
| PAYLOAD-01 | Phase 117 | Pending |
| PAYLOAD-02 | Phase 117 | Complete |
| PAYLOAD-03 | Phase 117 | Complete |
| PAYLOAD-04 | Phase 117 | Complete |
| PAYLOAD-05 | Phase 117 | Complete |
| TOKEN-01 | Phase 118 | Complete |
| TOKEN-02 | Phase 118 | Complete |
| TOKEN-03 | Phase 118 | Complete |
| TOKEN-04 | Phase 118 | Complete |
| POST-01 | Phase 119 | Pending |
| POST-02 | Phase 119 | Pending |
| POST-03 | Phase 119 | Pending |
| POST-04 | Phase 119 | Pending |
| LIB-01 | Phase 120 | Complete |
| LIB-02 | Phase 120 | Pending |
| LIB-03 | Phase 120 | Pending |
| LIB-04 | Phase 120 | Pending |
| LIB-05 | Phase 120 | Pending |
| LIB-06 | Phase 120 | Pending |
| LIB-07 | Phase 120 | Pending |
| LIB-08 | Phase 120 | Pending |
| LIB-09 | Phase 120 | Pending |
| LIB-10 | Phase 120 | Pending |
| AGENT-01 | Phase 121 | Pending |
| AGENT-02 | Phase 121 | Pending |
| AGENT-03 | Phase 121 | Pending |
| AGENT-04 | Phase 121 | Pending |
| AGENT-05 | Phase 121 | Pending |
| DATA-01 | Phase 122 | Pending |
| DATA-02 | Phase 122 | Pending |
| DATA-03 | Phase 122 | Pending |
| DATA-04 | Phase 122 | Pending |
| DATA-05 | Phase 122 | Pending |
| DATA-06 | Phase 122 | Pending |
| INT-01 | Phase 123 | Pending |
| INT-02 | Phase 123 | Pending |
| INT-03 | Phase 123 | Pending |
| INT-04 | Phase 124 | Pending |
| INT-05 | Phase 124 | Pending |
| INT-06 | Phase 124 | Pending |

**Coverage:**
- v12.0 requirements: 47 total
- Phases: 112-124 (13 phases)
- Unmapped: 0

---

*Defined: 2026-04-05*
*Source: ke-hoach-pentest-online.md*
*Standards: PTES v2.0, OWASP Testing Guide v4.2, MITRE ATT&CK v14.0*
