# Phase 114: Intelligence Gathering Extended - Research

**Phase:** 114-intelligence-gathering-extended
**Date:** 2026-04-05

## Hidden Asset Discovery

### Common Admin Panel Paths
- /admin, /administrator, /admin/login
- /dashboard, /manage, /management
- /panel, /control, /backend
- /wp-admin (WordPress), /phpmyadmin
- /api/admin, /internal/admin

### Debug Endpoint Patterns
- /debug, /__debug__, /debugger
- /test, /testing, /test-api
- /dev, /development, /staging
- /swagger, /api-docs, /openapi (when undocumented)
- /graphql, /playground (GraphQL introspection)

### Backup File Patterns
- Source code: .zip, .tar.gz, .7z
- Database: .sql, .sql.gz, .dump
- Config: .env, .env.local, .env.backup
- Version control: .git/, .svn/, .hg/

## Authentication Analysis

### JWT Vulnerability Patterns
- Algorithm confusion (alg: none)
- Weak secrets (crackable with wordlist)
- Missing expiration (exp claim)
- Sensitive data in payload

### Hardcoded Credential Patterns
```javascript
const password = '...'
const apiKey = '...'
const secret = '...'
process.env.SECRET || 'fallback'
```

## Risk Scoring Matrix

| Finding | Severity | CVSS-like Score |
|---------|----------|-----------------|
| Admin panel without auth | Critical | 9.0-10.0 |
| Debug enabled production | Critical | 8.0-9.0 |
| Backup files exposed | High | 7.0-8.0 |
| Config files accessible | High | 6.5-7.5 |
| Source maps exposed | Medium | 5.0-6.0 |
| Undocumented APIs | Low-Medium | 3.0-5.0 |
