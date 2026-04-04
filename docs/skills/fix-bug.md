# Skill: fix-bug

## Purpose

Systematically investigate and fix bugs using structured debugging with root cause analysis and test verification.

## When to Use

- **Test failures:** Tests are failing and root cause unknown
- **Error reports:** Specific error messages indicate problem
- **Unexpected behavior:** Production or development issues
- **Regressions:** Bugs detected after recent changes
- **User reports:** External bug reports with symptoms

## Prerequisites

- [ ] Bug description or error message
- [ ] Reproduction steps (if known)
- [ ] Affected codebase accessible
- [ ] Test environment available

## Basic Command

```
/pd:fix-bug "description"
```

**Example:**
```
/pd:fix-bug "login fails with 500 error on OAuth callback"
```

**What it does:**
1. Analyzes error symptoms and context
2. Investigates root cause in code
3. Creates reproduction test case
4. Applies fix with verification
5. Runs tests to confirm fix
6. Documents fix in BUG_REPORT.md

## Common Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--quick` | Skip deep analysis | `/pd:fix-bug "typo" --quick` |
| `--research` | Include external research | `/pd:fix-bug "issue" --research` |

## See Also

- [test](test.md) — Verify fix works
- [audit](audit.md) — Broader code review
- [research](research.md) — Research error patterns
- [Bug Fixing Workflow](../workflows/bug-fixing.md) — Step-by-step guide
