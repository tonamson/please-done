# Skill: audit

## Purpose

Perform security and code quality audits using OWASP guidelines and best practices to identify vulnerabilities, anti-patterns, and maintainability issues.

## When to Use

- **Security review:** Pre-release security assessment before shipping
- **Code quality:** Code quality and maintainability evaluation
- **Compliance:** Meeting security compliance requirements
- **Regular maintenance:** Scheduled audit cycles for ongoing projects
- **Post-incident:** After security incidents to identify gaps

## Prerequisites

- [ ] Codebase accessible with read permissions
- [ ] `.planning/` directory initialized
- [ ] Understanding of audit scope
- [ ] Optional: Specific areas to focus on

## Basic Command

```
/pd:audit
```

**Example:**
```
/pd:audit --security
```

**What it does:**
1. Scans code for security vulnerabilities
2. Checks against OWASP Top 10 categories
3. Identifies code quality issues
4. Creates AUDIT_REPORT.md with findings
5. Prioritizes findings by severity level
6. Suggests remediation steps

## Common Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--security` | Security-focused audit | `/pd:audit --security` |
| `--quality` | Code quality audit | `/pd:audit --quality` |
| `--owasp` | OWASP Top 10 check | `/pd:audit --owasp` |

## See Also

- [fix-bug](fix-bug.md) — Fix audit findings
- [test](test.md) — Verify fixes pass tests
- [research](research.md) — Research security patterns
