# Phase 113: Intelligence Gathering Core - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement foundational reconnaissance capabilities: source mapping (untrusted data sources, input vectors), target enumeration (endpoints, hidden APIs), and service discovery (tech stack fingerprinting). Focuses on static analysis of codebase to build attack surface map.

Phase 113 delivers the core reconnaissance engine that subsequent phases will extend.
</domain>

<decisions>
## Implementation Decisions

### Source Mapping Approach
- **D-01:** Implement AST-based source mapping using Babel/TypeScript parser for JavaScript/TypeScript codebases
- **D-02:** Identify untrusted data sources: req.body, req.query, req.params, headers, cookies, file uploads, environment variables
- **D-03:** Map input vectors to their consumption points (controllers, services, database queries)
- **D-04:** Output format: JSON with source type, location (file:line), and sink destinations

### Target Enumeration Strategy
- **D-05:** Static route discovery: analyze framework routers (Express, Fastify, NestJS, Next.js)
- **D-06:** Dynamic endpoint discovery via file system scanning (pages/, routes/, controllers/)
- **D-07:** Hidden API detection: find undocumented endpoints not in official route definitions
- **D-08:** Output format: OpenAPI-like specification with methods, paths, parameters, and authentication requirements

### Service Discovery Method
- **D-09:** Framework fingerprinting: detect framework and version from package.json and import patterns
- **D-10:** Dependency version checking: compare installed versions against known vulnerable versions database
- **D-11:** Technology stack mapping: identify databases, ORMs, authentication libraries, and external services
- **D-12:** Output format: Tech stack report with versions and security advisories

### Claude's Discretion
- Exact AST traversal implementation details
- Caching strategy for repeated analysis
- CLI output formatting (table vs JSON)
- Severity scoring algorithm for findings
</decisions>

<canonical_refs>
## Canonical References

### Reconnaissance Standards
- `.planning/REQUIREMENTS.md` §RECON-01, RECON-02, RECON-03 - Core reconnaissance requirements
- `commands/pd/audit.md` - Audit skill integration point
- Phase 112 artifacts: `bin/lib/recon-cache.js`, `bin/lib/flag-parser.js` - Foundation libraries to build upon

### OWASP & PTES References
- OWASP Testing Guide v4.2: Information Gathering
- PTES v2.0: Intelligence Gathering phase
- MITRE ATT&CK T1593 (Gather Victim Network Information)

</canonical_refs>

<specifics>
## Specific Ideas

- Source-to-sink mapping should identify potential injection points (SQLi, XSS, Command Injection)
- Route discovery should include middleware chains and their security implications
- Framework fingerprinting should flag outdated versions with known CVEs
- Integration with Phase 112's recon-cache.js for token optimization
- Support for JavaScript, TypeScript, and common Node.js frameworks
</specifics>

<deferred>
## Deferred Ideas

- Dynamic/runtime analysis (Phase 114)
- Hidden asset discovery (Phase 114)
- Authentication mechanism analysis (Phase 114)
- Business logic mapping (Phase 115)

</deferred>
