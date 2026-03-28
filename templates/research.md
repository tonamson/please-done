# RESEARCH.md Template

> `/pd:plan` creates (Step 3) | `/pd:plan` (Step 4), `/pd:write-code` reads

Phase-level research results — existing code + ecosystem. Stored at `.planning/milestones/[version]/phase-[phase]/RESEARCH.md`.

- `.planning/research/SUMMARY.md` = milestone-level research overview (`/pd:new-milestone`)
- `RESEARCH.md` = detailed research for 1 phase (`/pd:plan`)

## Template

```markdown
# Research Phase [x.x]
> Date: [DD_MM_YYYY]
> Deliverables: [summary from ROADMAP]
> Overall Confidence: [HIGH | MEDIUM | LOW]

## Existing Code

### Installed Libraries
| Name | Version | Relevant to Phase |
|------|---------|-------------------|

### Reusable Code
| Function/Service | File | Description |
|------------------|------|-------------|

### Current Patterns
[Current backend/frontend/DB patterns that the phase should follow]

## Ecosystem

### Recommended Libraries
| Library | Version | Purpose | Reason for Choice | Rejected Alternatives |
|---------|---------|---------|--------------------|-----------------------|

### Do Not Implement From Scratch
| Problem | Do Not Write | Use Instead | Reason |
|---------|--------------|-------------|--------|

### Common Pitfalls
| Pitfall | Consequence | Prevention | Warning Signs |
|---------|-------------|------------|---------------|

### New Trends
| Old Approach | New Approach | Impact |
|--------------|--------------|--------|

## References
| Source | Confidence | Notes |
|--------|------------|-------|
| [Context7: library-id] | HIGH | [topics queried] |
| [FastCode: query] | HIGH | [code patterns found] |
| [Local docs: file] | HIGH | [sections read] |
| [Claude knowledge] | LOW | [needs verification when coding] |
```

## Rules

- **ONLY create sections with data** — omit empty sections
- **Existing Code** ALWAYS create if project already has code
- **Ecosystem** ONLY when using new libraries / complex domain. Simple phase → "Using existing stack."
- Keep concise — reference material, not tutorials
- Confidence: **HIGH** = Context7/FastCode/official docs | **MEDIUM** = WebSearch + verified | **LOW** = Claude knowledge unverified
