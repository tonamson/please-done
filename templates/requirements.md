# REQUIREMENTS.md Template

> `/pd:new-milestone` creates | `/pd:plan`, `/pd:write-code`, `/pd:complete-milestone` reads

## Template

```markdown
# Requirements: [Project Name]
> Created: [DD_MM_YYYY]
> Milestone: v[X.Y] — [Milestone name]

## Requirements v1
Current milestone requirements. Each requirement is mapped to 1 phase.

### [Group 1]
- [ ] **GROUP1-01**: User can [specific, testable action]
- [ ] **GROUP1-02**: User can [specific, testable action]

### [Group 2]
- [ ] **GROUP2-01**: User can [specific, testable action]

## Future Requirements
Deferred to next milestone.

- **GROUP-XX**: [description]

## Out of Scope
| Feature | Reason for Exclusion |
|---------|---------------------|

## Traceability Table
| Requirement | Phase | Status |
|-------------|-------|--------|

**Coverage:**
- Requirements v1: [X] total
- Mapped to phase: —
- Unmapped: [X] (map when creating roadmap)

---
*Created: [DD_MM_YYYY]*
*Last updated: [DD_MM_YYYY]*
```

## Requirement Codes

Format: `[GROUP]-[NUMBER]` uppercase, no diacritics (e.g., `AUTH-01`, `NOTIF-02`).
If existing REQUIREMENTS.md → continue numbering. Group name 3-10 characters.

## Good Requirement Criteria

| Criterion | Good | Bad |
|-----------|------|-----|
| Specific, testable | "Reset password via email" | "Handle passwords" |
| User-oriented | "User can X" | "System does Y" |
| Singular | "Login with email" | "Login and manage profile" |
| Independent | Few dependencies | Needs 3 other requirements |
