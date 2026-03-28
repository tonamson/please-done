# Prioritization Guide

> Used by: `/pd:new-milestone`, `/pd:plan`, `/pd:fix-bug`
> Framework for prioritizing features, phases, tasks, bugs

## Priority Levels

| Level | Meaning | Examples |
|-------|---------|---------|
| Critical | Project does not work without it | Authentication, core CRUD |
| High | Required for minimum experience | Authorization, validation, main UI |
| Medium | Significant improvement but can be deferred | Advanced search, reports |
| Low | Enhancement, nice to have | Dark mode, export PDF |

## Ordering Rules

### Between milestones
1. MVP (v1.0) always first
2. Foundation features (auth, data model) before dependents
3. High technical risk → resolve early

### Between phases
1. **Backend API before Frontend** (when frontend needs data from new API)
2. **Frontend-only tasks** (UI, SEO, layout) planned independently
3. **Core logic before Validation/Edge cases**
4. **Authentication/Security** always first milestone/phase
5. New project: first phase = setup

### Between tasks
1. Entity/Model → Service → Controller → DTO (Backend)
2. New module = separate task
3. No dependencies → parallel
4. Each task: atomic, maximum 5-7 files

## Bug Risk Classification

| Type | Symbol | Examples | Testing strategy | Commit strategy |
|------|--------|---------|-----------------|-----------------|
| Quick fix | 🟢 | Typo, CSS, wrong config value | Lint + build sufficient | Direct commit |
| Logic error | 🟡 | Wrong code logic, missing exception, off-by-one | Unit + integration test required | Commit + test together |
| Data error | 🟠 | Corrupt data, wrong migration, DB mismatch | Backup first, verify after | Separate commit for migration |
| Security sensitive | 🔴 | Privilege escalation, injection, leaked secret | User approval + review | Separate commit, no bundling |
| Infrastructure/config | 🔵 | Environment variable, deploy config, third-party service | Verify correct environment | Summarize changes |

## Decision Matrix

| Criterion | Weight |
|-----------|--------|
| User impact | High |
| Technical risk | High |
| Implementation effort | Medium |
| Future extensibility | Low |

Priority: low risk + positive user impact + simplest.
