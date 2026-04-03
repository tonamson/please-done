# Command `pd audit`

## Purpose

Run a comprehensive OWASP Top 10 security audit, dispatching 13 parallel scanners to analyze your codebase for vulnerabilities.

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `path` | No | Path to audit (default: current directory) |
| `--full` | No | Run all 13 scanners (default behavior) |
| `--only cat1,cat2` | No | Run only specified scanner categories |
| `--poc` | No | Generate proof-of-concept exploits for findings |
| `--auto-fix` | No | Not yet supported in this version |

## How It Works

1. **Detect mode:** Check for `.planning/PROJECT.md` — if present, run in "integrated" mode; otherwise "standalone" mode
2. **Dispatch scanners:** Launch 13 OWASP scanners in parallel (2 per wave)
3. **Consolidate results:** Collect findings from all scanners
4. **Cross-analysis:** Identify patterns across multiple vulnerability categories
5. **Generate report:** Create SECURITY_REPORT.md with all findings and evidence

## When to run this command?

- Before deploying to production
- After adding authentication or payment features
- During security review sprints
- When onboarding a new codebase with unknown security posture

## Output

- `SECURITY_REPORT.md` — Consolidated security findings
  - Standalone mode: Created at `./SECURITY_REPORT.md`
  - Integrated mode: Created at `.planning/audit/SECURITY_REPORT.md`
- Evidence files — Supporting data in a temp directory

## Examples

```bash
pd audit                     # Full audit of current directory
pd audit src/                # Audit specific path
pd audit --only injection,auth  # Run only injection and auth scanners
pd audit --poc               # Generate proof-of-concept exploits
```

***

**Next step:** Review `SECURITY_REPORT.md` and fix high-severity findings, or [pd fix-bug](fix-bug.md) to address issues.
