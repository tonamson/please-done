# Skill: audit

_Subtitle: OWASP Top 10 and PTES-compliant security auditing._

## Purpose

Perform security and code quality audits using OWASP guidelines, optional PTES (Penetration Testing Execution Standard) reconnaissance, and best practices to identify vulnerabilities, anti-patterns, and maintainability issues.

## When to Use

- **Security review:** Pre-release security assessment before shipping
- **Code quality:** Code quality and maintainability evaluation
- **Compliance:** Meeting security compliance requirements
- **Regular maintenance:** Scheduled audit cycles for ongoing projects
- **Post-incident:** After security incidents to identify gaps
- **PTES / Red Team:** When you need tiered reconnaissance before or alongside SAST

## Prerequisites

- [ ] Codebase accessible with read permissions
- [ ] `.planning/` directory initialized
- [ ] Understanding of audit scope
- [ ] Optional: Specific areas to focus on

## Basic Command

```
/pd:audit
```

Default: Quick SAST (workflow Steps 2–10) — backward compatible with pre-PTES behavior.

## PTES Workflow Support

The audit skill supports PTES-aligned workflows with an optional **Step 0** reconnaissance phase before the standard scanner pipeline.

### Command Flags

| Flag | Tier | Token budget | Description |
|------|------|----------------|-------------|
| _(none)_ | Quick SAST | 0 | Default audit (Steps 2–10, no Step 0) |
| `--recon-light` | FREE | 0 | Code-only reconnaissance |
| `--recon` | STANDARD | ~2000 | Reconnaissance + AI analysis |
| `--recon-full` | DEEP | ~6000 | Deep recon + taint-style analysis |
| `--redteam` | RED TEAM | ~8000 | Full Red Team TTPs |
| `--poc` | — | — | DAST / POC sections in evidence (combinable with recon) |

**Priority:** `--redteam` > `--recon-full` > `--recon` > `--recon-light`.

### PTES Phases (conceptual)

- **Phase 1:** Pre-engagement (scope, rules of engagement) — manual / project policy
- **Phase 2:** Intelligence gathering — **workflow Step 0** when recon/PTES flags apply
- **Phase 3:** Vulnerability analysis — SAST (scanner waves)
- **Phase 4:** Exploitation / verification — DAST when `--poc` or `--redteam` drives POC content

### Token Optimization

Reconnaissance results are cached with a key derived from **git commit + tracked file list** (see `bin/lib/recon-cache.js`):

- Cache directory: `.planning/recon-cache/{md5 key}.json`
- Invalidation when repo state changes (new commit or file set)
- LRU eviction (max 50 JSON entries)
- On hit: `[Token Save] Reusing cached recon (0 AI tokens)`

## OSINT Support

The audit skill supports optional OSINT (Open Source Intelligence) gathering for external reconnaissance.

### OSINT Flags

| Flag | Description |
|------|-------------|
| `--osint` | Quick OSINT scan (passive reconnaissance) |
| `--osint-full` | Comprehensive OSINT with all available sources |
| `--osint-output` | Output format: `json`, `table`, or `markdown` |
| `--osint-timeout` | Timeout per source in seconds (default: 10) |

### OSINT Examples

```bash
# Quick OSINT scan
/pd:audit --osint

# Comprehensive OSINT with JSON output
/pd:audit --osint-full --osint-output json

# OSINT with custom timeout
/pd:audit --osint --osint-timeout 30
```

## What It Does

1. Optionally runs PTES Step 0 (recon) when flags demand it
2. Scans code for security vulnerabilities (13 OWASP-aligned categories)
3. Checks against OWASP Top 10 categories
4. Consolidates evidence and produces **SECURITY_REPORT.md** (not AUDIT_REPORT.md) per workflow
5. Prioritizes findings by severity
6. Suggests remediation paths (and fix routing in integrated mode)

## Common Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--full` | All 13 categories | `/pd:audit --full` |
| `--only` | Subset of categories | `/pd:audit --only sql-injection,xss` |
| `--recon-light` | Code-only reconnaissance (free tier) | `/pd:audit --recon-light` |
| `--recon` | Standard recon + SAST | `/pd:audit --recon` |
| `--recon-full` | Deep recon + taint analysis | `/pd:audit --recon-full` |
| `--redteam` | Full red-team style run | `/pd:audit --redteam` |
| `--poc` | POC sections in evidence | `/pd:audit --poc` |
| `--osint` | Quick OSINT scan | `/pd:audit --osint` |
| `--osint-full` | Comprehensive OSINT | `/pd:audit --osint-full` |

## PTES Examples

```bash
# Standard reconnaissance + SAST
/pd:audit --recon

# Code-only recon (0 AI tokens for recon cache miss path — tier free)
/pd:audit --recon-light

# Deep reconnaissance with taint-style analysis
/pd:audit --recon-full

# Full Red Team assessment
/pd:audit --redteam

# Reconnaissance + DAST-style POC sections
/pd:audit --recon --poc

# Quick OSINT scan
/pd:audit --osint

# Comprehensive OSINT with JSON output
/pd:audit --osint-full --osint-output json
```

## See Also

- [fix-bug](fix-bug.md) — Fix audit findings
- [test](test.md) — Verify fixes pass tests
- [research](research.md) — Research security patterns
