# Skill: test

## Purpose

Run test suite and generate coverage reports to verify implementation quality and catch regressions before completion.

## When to Use

- **Post-implementation:** After implementing code changes
- **Pre-commit:** Before committing changes
- **Pre-completion:** Before completing milestone
- **Regression check:** Verifying no regressions introduced
- **Quality gate:** Need coverage report for approval
- **CI/CD:** Automated testing in pipeline

## Prerequisites

- [ ] Code written and staged or committed
- [ ] Test files exist for the project
- [ ] Test environment configured
- [ ] Dependencies installed

## Basic Command

```
/pd:test
```

**Example:**
```
/pd:test --coverage
```

**What it does:**
1. Runs project test suite
2. Generates coverage report (with --coverage)
3. Checks for regressions
4. Reports test results with pass/fail status
5. Updates STATE.md with test status

## Common Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--coverage` | Generate coverage report | `/pd:test --coverage` |
| `--watch` | Run tests in watch mode | `/pd:test --watch` |
| `--grep <pattern>` | Run matching tests only | `/pd:test --grep "auth"` |

## See Also

- [write-code](write-code.md) — Execute code changes
- [fix-bug](fix-bug.md) — Debug failing tests
- [complete-milestone](complete-milestone.md) — Finalize after tests pass
