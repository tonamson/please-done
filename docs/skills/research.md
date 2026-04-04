# Skill: research

## Purpose

Research libraries, patterns, and technologies before implementation using authoritative documentation sources like Context7.

## When to Use

- **Unfamiliar tech:** Using unfamiliar library or framework
- **Approach evaluation:** Evaluating technical approaches or patterns
- **Current docs:** Need up-to-date documentation or best practices
- **Pre-planning:** Before planning to understand available options
- **Technology comparison:** Comparing similar technologies for decision

## Prerequisites

- [ ] Research topic identified clearly
- [ ] Access to documentation sources
- [ ] Understanding of use case and requirements
- [ ] Optional: Specific questions to answer

## Basic Command

```
/pd:research "topic"
```

**Example:**
```
/pd:research "React Server Components"
```

**What it does:**
1. Searches documentation sources
2. Retrieves current best practices
3. Creates RESEARCH.md with findings
4. Maps options with trade-offs
5. Identifies potential pitfalls

## Common Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--library <name>` | Specific library | `/pd:research --library express` |
| `--pattern` | Design patterns | `/pd:research --pattern "factory"` |
| `--docs` | Fetch official docs | `/pd:research --docs next.js` |

## See Also

- [plan](plan.md) — Use research in planning
- [write-code](write-code.md) — Implement findings
- [fetch-doc](fetch-doc.md) — Get specific documentation
