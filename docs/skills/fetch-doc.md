# Skill: fetch-doc

## Purpose

Download and cache documentation for offline reference using Context7 and authoritative web sources for libraries and frameworks.

## When to Use

- **Offline work:** Working offline or with poor connectivity and need reference docs
- **Library docs:** Need specific library documentation for implementation reference
- **Pre-research:** Researching technology options before planning phase
- **Documentation building:** Building documentation references for team use
- **Version specific:** Need particular version documentation for compatibility

## Prerequisites

- [ ] Library or technology name specified
- [ ] Internet connection for initial fetch
- [ ] Storage space for cached documentation

## Basic Command

```
/pd:fetch-doc <library>
```

**Example:**
```
/pd:fetch-doc react
```

**What it does:**
1. Searches Context7 for library documentation
2. Downloads and caches documentation locally
3. Makes docs available offline for future reference
4. Returns most relevant sections immediately

## Common Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--version <v>` | Specific version | `/pd:fetch-doc react --version 18.2` |
| `--output <dir>` | Custom output directory | `/pd:fetch-doc express --output ./docs` |

## See Also

- [research](research.md) — Research topics using fetched docs
- [plan](plan.md) — Use docs in planning phases
- [update](update.md) — Refresh cached documentation
