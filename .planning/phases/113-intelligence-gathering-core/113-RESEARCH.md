# Phase 113: Intelligence Gathering Core - Research

**Phase:** 113-intelligence-gathering-core
**Date:** 2026-04-05
**Researcher:** gsd-phase-researcher

## Research Scope

Foundational reconnaissance capabilities for the pd:audit skill, focusing on three core areas:
1. Source mapping (untrusted data identification)
2. Target enumeration (endpoint discovery)
3. Service discovery (tech stack fingerprinting)

---

## 1. Source Mapping Research

### AST Parsing Options

| Library | Pros | Cons | Recommendation |
|---------|------|------|----------------|
| @babel/parser | Fast, widely used, supports TypeScript | Requires plugins for modern syntax | Primary choice |
| @typescript-eslint/parser | TypeScript-native, type-aware | Slower, heavier dependency | For TS-specific analysis |
| acorn | Lightweight, fast | Limited TypeScript support | Fallback for JS-only |
| tree-sitter | Multi-language, incremental parsing | Complex setup | Future enhancement |

**Decision:** Use `@babel/parser` with TypeScript plugin for broad compatibility.

### Input Vector Patterns

Common untrusted input sources in Node.js/Express applications:

```javascript
// Express request object
req.body          // POST/PUT body
req.query         // URL query parameters
req.params        // Route parameters
req.headers       // HTTP headers (including authorization)
req.cookies       // Cookies
req.files         // File uploads
req.ip            // Client IP

// Environment (often overlooked)
process.env       // Environment variables (can be injected)

// External data
fetch()           // API responses
fs.readFile()     // File system reads
database.query()  // Database results
```

### Sink Identification Patterns

Dangerous sinks to map sources to:

```javascript
// SQL Injection
connection.query(sql, callback)
model.find({ where: rawQuery })

// Command Injection
exec(command)
spawn(command)
eval(code)

// XSS
res.send(html)
innerHTML = content
template.render(data)

// Path Traversal
fs.readFile(path)
require(module)
```

---

## 2. Target Enumeration Research

### Framework Router Detection

| Framework | Router Location | Detection Pattern |
|-----------|-----------------|-------------------|
| Express | `app.get/post/put/delete()` | `app.<method>(path, handler)` |
| Fastify | `fastify.route({method, url})` | `fastify.route()` or method aliases |
| NestJS | `@Controller()` + `@Get/Post()` | Decorator metadata analysis |
| Next.js | `pages/` or `app/` directory | File-based routing convention |
| Koa | `router.get/post/put/delete()` | `@koa/router` patterns |
| Hapi | `server.route({method, path})` | Route configuration objects |

### Route Discovery Strategy

1. **Static Analysis (Primary)**
   - Parse AST to find route registrations
   - Extract method, path, handler reference
   - Identify middleware chain
   - Map authentication requirements

2. **File System Scanning (Secondary)**
   - Next.js: Scan `pages/` directory structure
   - Nuxt.js: Scan `pages/` for Vue routes
   - SvelteKit: Scan `src/routes/`

### Hidden Endpoint Detection

Patterns indicating undocumented endpoints:

```javascript
// Internal/debug routes
app.get('/_debug/health', ...)
app.get('/internal/*', ...)
app.get('/admin', ...)  // Without auth middleware

// Legacy/versioned routes
app.get('/api/v1/...', ...)
app.get('/api/v2/...', ...)

// Development routes
if (process.env.NODE_ENV === 'development') {
  app.get('/dev/...', ...)
}
```

---

## 3. Service Discovery Research

### Framework Detection

Detect framework from imports and patterns:

```javascript
// Express
import express from 'express';
const app = express();

// Fastify
import fastify from 'fastify';
const server = fastify();

// NestJS
import { NestFactory } from '@nestjs/core';

// Next.js
import next from 'next';
```

### Dependency Vulnerability Checking

**Approach 1: npm audit integration**
- Run `npm audit --json` programmatically
- Parse results for vulnerabilities
- Pros: Built-in, comprehensive
- Cons: Requires node_modules, slow

**Approach 2: osv.dev API**
- Query Open Source Vulnerabilities database
- Pros: Standardized, no local dependencies needed
- Cons: Requires network, rate limits

**Approach 3: Local advisory database**
- Maintain cache of known vulnerable versions
- Pros: Fast, offline capable
- Cons: Requires updates

**Decision:** Use osv.dev API with caching for accuracy and performance.

### Technology Stack Mapping

Common patterns to identify:

```javascript
// Databases
'mongoose'           // MongoDB
'sequelize'          // SQL ORM
'pg'                 // PostgreSQL
'mysql2'             // MySQL
'redis'              // Redis
'@prisma/client'     // Prisma

// Authentication
'passport'           // Passport.js
'@auth0/*'           // Auth0
'jsonwebtoken'       // JWT
'bcrypt'             // Password hashing

// Frameworks
'express'            // Express.js
'fastify'            // Fastify
'@nestjs/*'          // NestJS
'next'               // Next.js
'hapi'               // Hapi

// External Services
'@aws-sdk/*'         // AWS
'@azure/*'           // Azure
'@google-cloud/*'    // GCP
'stripe'             // Stripe
'twilio'             // Twilio
```

---

## 4. Implementation Patterns

### Source-to-Sink Taint Analysis

```
Source → Parser → AST → Identifier → Sink
  ↓         ↓       ↓       ↓         ↓
req.body → Babel → CallExpr → eval() → Risk!
```

Key considerations:
- Track variable assignments
- Follow function returns
- Handle async/await patterns
- Account for destructuring

### Caching Strategy

Leverage Phase 112's recon-cache.js:
- Cache key: `git-commit-hash + file-list-hash`
- TTL: 24 hours
- Store parsed ASTs, route maps, and findings
- Invalidate on code changes

### CLI Integration

```bash
pd:audit --recon
├── Phase 113: Source Map, Routes, Tech Stack
├── Phase 114: Hidden Assets, Auth Analysis
├── Phase 115: Business Logic, Taint Analysis
└── Phase 116: OSINT Intelligence
```

---

## 5. Pitfalls & Mitigations

| Pitfall | Mitigation |
|---------|------------|
| False positives from AST analysis | Implement confidence scoring, allowlist patterns |
| Dynamic route generation | Flag for manual review, document limitation |
| Minified/obfuscated code | Skip analysis, report as "needs manual review" |
| Large codebases | Implement incremental analysis, progress reporting |
| Framework version detection | Check both package.json and lockfile versions |
| Monorepos with multiple apps | Support --app flag to target specific app |

---

## 6. Success Metrics

- Source mapping: >90% coverage of req.body/query/param usage
- Route enumeration: Discover all static routes, flag dynamic routes
- Tech stack: Identify framework + top 20 dependencies with versions
- Performance: Complete analysis of 10k line codebase in <30 seconds
- Accuracy: <5% false positive rate on source-to-sink mapping

---

## References

- [Babel Parser Documentation](https://babeljs.io/docs/en/babel-parser)
- [OWASP Information Gathering](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/01-Information_Gathering/)
- [osv.dev API](https://osv.dev/docs/)
- [PTES Technical Guidelines](http://www.pentest-standard.org/index.php/PTES_Technical_Guidelines)
