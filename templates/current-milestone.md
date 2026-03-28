# CURRENT_MILESTONE.md Template

> `/pd:new-milestone` creates | `/pd:plan`, `/pd:write-code`, `/pd:complete-milestone` updates | All commands read

Active milestone/phase pointer (4 fields). Different from STATE.md (detailed state + accumulated context — @templates/state.md).

## Template — Active

```markdown
# Current Milestone
- milestone: [milestone name]
- version: [x.x]
- phase: [x.x]
- status: [Not started | In progress]
```

## Template — Fully Completed

```markdown
# Current Milestone
- milestone: All completed
- version: [final version]
- phase: -
- status: Fully completed
```

## Update Rules

| When | Action |
|------|--------|
| Create milestone (overwrite) | Create new, status = `Not started` |
| Create milestone (append) | **Keep unchanged** if already exists |
| Plan new phase | Update `phase` ONLY IF current phase is not planned/already done. NOT if in progress. `status` → `In progress` if `Not started` |
| Phase done + next already planned | Auto-advance `phase` |
| Phase done + next not planned | Keep unchanged, suggest `/pd:plan` |
| Close (more remaining) | Switch to next milestone, `Not started` |
| Close (none remaining) | `All completed`, final version, `-`, `Fully completed` |

Compare version using semver (split major.minor into numbers), NOT string comparison. First phase = smallest number in milestone.
