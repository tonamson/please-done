---
name: pd:audit
description: OWASP/PTES security audit - dispatch 13 scanners in parallel and consolidate the report
argument-hint: "[path] [--full|--only cat1,cat2|--recon|--recon-light|--recon-full|--osint|--osint-full|--osint-output json|table|markdown|--osint-timeout seconds|--poc|--redteam|--auto-fix]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - mcp__fastcode__code_qa
  - SubAgent
---

<objective>
Run a comprehensive security audit based on the OWASP Top 10 with optional PTES reconnaissance and OSINT intelligence. Dispatch 13 scanners in parallel (2 per wave), consolidate the report, and perform cross-analysis.

**OSINT Modes:**
- `--osint`: Quick OSINT scan (Google Dorks + Certificate Transparency logs)
- `--osint-full`: Comprehensive OSINT (all sources + secret detection)
- `--osint-output`: Output format (json, table, markdown)
- `--osint-timeout`: Timeout per source in seconds (default: 300)
</objective>

<guards>
Automatically detect the operating mode BEFORE running guards:

1. Check whether `.planning/PROJECT.md` exists (use Bash: `test -f .planning/PROJECT.md`)
2. Exists -> mode = "integrated": run all 3 guards below
3. Missing -> mode = "standalone": skip guard-context and run only the remaining 2 guards (guard-valid-path, guard-fastcode)

Stop and instruct the user if any guard fails:

@references/guard-context.md (integrated mode only)
@references/guard-valid-path.md
@references/guard-fastcode.md
</guards>

<context>
User input: $ARGUMENTS
</context>

<execution_context>
@workflows/audit.md (required)
</execution_context>

<process>
Execute @workflows/audit.md from start to finish. Pass $ARGUMENTS to the workflow.
</process>

<output>
**Create:**
- SECURITY_REPORT.md (location depends on mode: standalone -> `./`, integrated -> `.planning/audit/`)
- Evidence files in a temp directory
- When PTES/recon flags are used: reconnaissance data may be cached under `.planning/recon-cache/`
- When OSINT flags are used: OSINT results cached for 24h under `osint:{domain}:{scope}` key
- Token budget line: `[Token Budget] Used: X/Y (Z%)` when a PTES tier applies

**Next step:** Read SECURITY_REPORT.md to review the results

**Success when:**
- All scanners were dispatched and returned a result (or inconclusive)
- SECURITY_REPORT.md was created in the correct location

**Common errors:**
- FastCode MCP is not connected -> check that Docker is running
- SubAgent is unavailable -> check tool configuration for SubAgent access
</output>

<rules>
- All output MUST be in English.
- DO NOT modify project code - only scan and report.
- When `--poc` is passed: pass the `--poc` flag to the scanner in the Step 6 dispatch prompt.
- When `--auto-fix` is passed: report "Not supported in this version yet" and continue.
- When `--recon` is passed: enable reconnaissance phase (Step 0) before SAST.
- When `--recon-light` is passed: enable code-only reconnaissance (0 tokens).
- When `--recon-full` is passed: enable deep reconnaissance with taint analysis.
- When `--redteam` is passed: enable Red Team TTPs (recon + SAST + DAST + evasion).
- When multiple recon flags are passed: highest tier wins (`--redteam` > `--recon-full` > `--recon` > `--recon-light`).
- When `--osint` is passed: enable quick OSINT scan (Google Dorks + CT logs).
- When `--osint-full` is passed: enable comprehensive OSINT (all sources + secret detection).
- When `--osint-output` is passed: use specified format (json, table, markdown). Default: table.
- When `--osint-timeout` is passed: set timeout per source in seconds. Default: 300.
- When OSINT and recon flags are both passed: run OSINT first, then reconnaissance.
- OSINT results respect tier system: `--osint-full` available for DEEP and RED TEAM tiers.
</rules>

<!-- OSINT Documentation Section -->

## OSINT Intelligence Gathering

### Overview

OSINT (Open Source Intelligence) gathering performs reconnaissance on external-facing infrastructure:

1. **Google Dorks**: Generate targeted search queries to discover sensitive information
2. **Certificate Transparency Logs**: Discover subdomains via CT log providers (crt.sh, Censys, CertSpotter)
3. **Secret Detection**: Scan for exposed API keys, tokens, and credentials (full mode only)
4. **Subdomain Aggregation**: Correlate findings across multiple sources

### Tiered Command System

| Tier | Flags Available | Description |
|------|-----------------|-------------|
| FREE | `--osint` | Basic dorks + CT logs |
| STANDARD | `--osint` | Basic dorks + CT logs |
| DEEP | `--osint`, `--osint-full` | Full OSINT with secret detection |
| RED TEAM | `--osint`, `--osint-full` | Extended OSINT with longer timeouts |

### Command Examples

```bash
# Quick OSINT scan
pd:audit example.com --osint

# Full OSINT with JSON output
pd:audit example.com --osint-full --osint-output json

# OSINT with custom timeout (10 minutes)
pd:audit example.com --osint-full --osint-timeout 600

# Combined recon + OSINT
pd:audit example.com --recon --osint

# Red Team mode (includes full OSINT)
pd:audit example.com --redteam
```

### Cache Behavior

- OSINT results are cached for 24 hours
- Cache key: `osint:{domain}:{scope}` (quick or full)
- Use `--fresh` to bypass cache
- Cache location: `.planning/recon-cache/`

### Success Criteria

OSINT operations are successful when:
- At least 3 Google Dorks are generated
- Subdomains are discovered via CT logs (if available)
- Results are properly aggregated and deduplicated
- Rate limits are respected across all sources
- Report is generated in requested format

### Risk Scoring

| Risk Level | Criteria | Example |
|------------|----------|---------|
| Critical | Live credentials | AWS keys, private keys |
| High | Exposed services | Admin panels, API endpoints |
| Medium | Information disclosure | Directory listings, config files |
| Low | Generic patterns | Error messages, version info |
| Info | Reconnaissance data | Subdomain lists |

