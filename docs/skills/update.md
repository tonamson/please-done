# Skill: update

## Purpose

Update PD/GSD tooling to latest version with changelog display and optional local patch reapplication for your workflow.

## When to Use

- **New features:** New features or important bug fixes available in newer version
- **Version check:** Outdated tooling detected and needs updating
- **Pre-milestone:** Before starting new milestone to ensure latest tools
- **Maintenance:** Regular maintenance schedule for tooling updates
- **Bug fixes:** Critical bug fixes released that affect your workflow

## Prerequisites

- [ ] Git repository with PD tooling
- [ ] Clean working tree or committed changes
- [ ] Internet connection available

## Basic Command

```
/pd:update
```

**Example:**
```
/pd:update --check
```

**What it does:**
1. Checks for available updates to tooling
2. Displays changelog with all changes
3. Updates tooling files to new version
4. Reapplies local patches (with flag)
5. Updates version markers in files

## Common Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--check` | Check for updates only | `/pd:update --check` |
| `--force` | Force update | `/pd:update --force` |
| `--reapply-patches` | Reapply local patches | `/pd:update --reapply-patches` |

## See Also

- [status](status.md) — Check current version
- [fetch-doc](fetch-doc.md) — Update documentation
- [conventions](conventions.md) — Check for new conventions
