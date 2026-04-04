# Skill: scan

## Purpose

Analyze codebase structure and generate PROJECT.md with comprehensive technical context including stack, entry points, and dependencies.

## When to Use

- **Codebase discovery:** Understanding unfamiliar project architecture
- **Pre-planning:** Gathering tech stack info before creating plans
- **Documentation refresh:** Updating outdated PROJECT.md after major changes
- **Dependency analysis:** Understanding internal module relationships
- **Tech audit:** Cataloging frameworks and libraries in use

## Prerequisites

- [ ] Git repository initialized
- [ ] Codebase has source files to analyze
- [ ] `.planning/` directory exists (run `init` first if not)
- [ ] Read access to project files

## Basic Command

```
/pd:scan
```

**Example:**
```
/pd:scan --deep
```

**What it does:**
1. Scans directory structure (configurable depth)
2. Detects tech stack from package files
3. Identifies entry points (main, bin, exports)
4. Maps internal dependencies (require/import)
5. Generates `PROJECT.md` with findings
6. Creates `CONTEXT.md` with project overview

## Common Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--deep` | Deep analysis including dependencies | `/pd:scan --deep` |
| `--output <file>` | Custom output file | `/pd:scan --output custom.md` |

## See Also

- [onboard](onboard.md) — Complete project orientation
- [research](research.md) — Research specific technologies found
- [init](init.md) — Initialize planning structure first
