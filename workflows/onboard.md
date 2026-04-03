<purpose>
Orient AI to an unfamiliar codebase in one pass. Run init (CONTEXT.md + rules), analyze git history, create PROJECT.md, run scan (SCAN_REPORT.md), then create ROADMAP.md + CURRENT_MILESTONE.md + STATE.md + REQUIREMENTS.md so .planning/ is ready for pd:plan.
</purpose>

<process>

## Step 1: Guard — check for existing onboard

Check if `.planning/PROJECT.md` AND `.planning/ROADMAP.md` AND `.planning/CURRENT_MILESTONE.md` all exist:
- **ALL EXIST** → Display warning:
  > ⚠️ Onboarding files already exist (PROJECT.md, ROADMAP.md, CURRENT_MILESTONE.md). Re-running will overwrite them. CONTEXT.md and scan data will be preserved if init is skipped.
  Continue with onboarding (do not stop — user invoked pd:onboard intentionally).
- **ANY MISSING** → Continue (first-time onboarding).

## Step 2: Initialize project (auto-skip if CONTEXT.md exists)

Check `.planning/CONTEXT.md`:
- **EXISTS** → Log "CONTEXT.md found — skipping init." Continue to Step 3.
- **NOT EXISTS** → Run all steps from @workflows/init.md with these modifications:
  - Step 2.5 (existing CONTEXT.md check): SKIP — already confirmed CONTEXT.md does not exist.
  - Step 4.5 (language policy): Default to all-English (UI: English, Logs: English, Exceptions: English). Do NOT prompt the user.
  - FastCode MCP unavailable → continue with warning, do not stop.

After init completes, verify `.planning/CONTEXT.md` was created. If not → STOP with error: "Init failed to create CONTEXT.md."

## Step 3: Analyze git history and create PROJECT.md

### 3a: Check git availability
```bash
git rev-parse --git-dir 2>/dev/null && echo "HAS_GIT" || echo "NO_GIT"
```

- **NO_GIT** → Set `HAS_GIT=false`. Skip to Step 3c (create PROJECT.md from CONTEXT.md only).
- **HAS_GIT** → Continue to Step 3b.

### 3b: Ingest git history

```bash
# Recent history (last 6 months, up to 500 commits)
git log --oneline --since="180 days ago" | head -500
```

If fewer than 10 commits returned, fall back to all-time history:
```bash
git log --oneline | head -500
```

Also gather date range:
```bash
git log --format="%ad" --date=short | tail -1   # first commit date
git log --format="%ad" --date=short | head -1   # last commit date
```

### 3c: Create PROJECT.md

Read `.planning/CONTEXT.md` for tech stack information.

Write `.planning/PROJECT.md` following @templates/project.md format:

```markdown
# [Project Name — from package.json or directory name]
> Created: [DD_MM_YYYY]
> Updated: [DD_MM_YYYY]

## Vision
[Synthesize from git commit messages — identify feature areas, patterns, project purpose.
 If HAS_GIT=false, derive from CONTEXT.md tech stack description only.
 1-3 sentences describing what the project does and who it serves.]

## Target Audience
- [Infer from project type and features. If unclear: "To be defined."]

## Constraints
[From CONTEXT.md tech stack — e.g., "Node.js >=18", framework versions, or "No special constraints identified."]

## Language & Error Reporting Policy
- **UI:** English
- **Logs:** English
- **Exceptions:** English
- **Notes:** Standard international configuration

## Milestone History
| Version | Name | Completion Date | Summary |
|---------|------|-----------------|---------|

## Lessons Learned
- No lessons recorded yet — project just onboarded.
```

**Important:** Milestone History table is empty — do NOT fabricate milestones. Onboard does not assume any prior milestone exists.

## Step 4: Scan project

Execute all steps from @workflows/scan.md.
- FastCode MCP unavailable → continue with Grep/Read fallback (do not stop).
- If CONTEXT.md was just created by Step 2, scan will update it with detailed library info.

## Step 5: Create planning files for pd:plan readiness

Create the following files so pd:plan guards pass (CONTEXT.md + ROADMAP.md + CURRENT_MILESTONE.md must exist).

### 5a: ROADMAP.md

Write `.planning/ROADMAP.md` following @templates/roadmap.md format:

```markdown
# Project Roadmap
> Project: [name from PROJECT.md]
> Created: [DD_MM_YYYY]
> Last updated: [DD_MM_YYYY]

## Project Goal
[Copy Vision from PROJECT.md]

## Milestones

### Milestone 1: [Project name] v1.0 (v1.0)
> Status: ⬜ | Priority: Critical

Phases and requirements to be defined. Run `/pd:new-milestone` to plan v1.0.

## Strategic Decisions
| # | Issue | Decision | Reason | Alternatives Rejected |
|---|-------|----------|--------|-----------------------|

## Risks & Notes
- Project onboarded with pd:onboard on [DD_MM_YYYY]
```

### 5b: CURRENT_MILESTONE.md

Write `.planning/CURRENT_MILESTONE.md`:

```markdown
# Current Milestone
- milestone: v1.0
- version: 1.0
- phase: -
- status: Not started
```

### 5c: STATE.md

Write `.planning/STATE.md` following @templates/state.md format:

```markdown
# Working State
> Updated: [DD_MM_YYYY]

## Current Position
- Milestone: v1.0 — [project name]
- Phase: Not started
- Plan: —
- Status: Ready to plan
- Last activity: [DD_MM_YYYY] — Onboarded with pd:onboard

## Accumulated Context
No accumulated context yet.

## Blockers
None
```

### 5d: REQUIREMENTS.md

Write `.planning/REQUIREMENTS.md` following @templates/requirements.md format:

```markdown
# Requirements: [Project Name]
> Created: [DD_MM_YYYY]
> Milestone: v1.0 — [project name]

## Requirements v1
To be defined. Run `/pd:new-milestone` to specify requirements.

## Future Requirements
None defined yet.

## Out of Scope
| Feature | Reason for Exclusion |
|---------|---------------------|

## Traceability Table
| Requirement | Phase | Status |
|-------------|-------|--------|

**Coverage:**
- Requirements v1: 0 total
- Mapped to phase: —
- Unmapped: 0

---
*Created: [DD_MM_YYYY]*
*Last updated: [DD_MM_YYYY]*
```

## Step 6: Success summary

Display onboarding result:

```
╔══════════════════════════════════════╗
║       Onboarding complete!           ║
╠══════════════════════════════════════╣
║ Project: [name]                      ║
║ Tech:    [stacks from CONTEXT.md]    ║
║ Git:     [N commits analyzed | no git]║
║ Context: .planning/CONTEXT.md        ║
║ Project: .planning/PROJECT.md        ║
║ Roadmap: .planning/ROADMAP.md        ║
║ Milestone: v1.0 (Not started)       ║
╠══════════════════════════════════════╣
║ Next: /pd:new-milestone              ║
║   or: /pd:plan (if reqs are set)    ║
╚══════════════════════════════════════╝
```

</process>

<rules>
- DO NOT prompt the user — onboard is fully automated
- DO NOT modify source code — only create/update files in `.planning/`
- Default language policy: all English (UI, Logs, Exceptions)
- If git unavailable → skip git history, derive PROJECT.md from CONTEXT.md alone
- Milestone History in PROJECT.md: leave empty (do not fabricate milestones)
- Date format: DD_MM_YYYY per @references/conventions.md
- Output MUST be in English
</rules>
