# State Machine — Project State Flow

> Used by: all commands (validation), `/pd:what-next` (suggestions)
> Defines valid states, transitions, conditions

## Main Flow

```
Not initialized
  → [/pd:init] → Initialized
    → [/pd:scan] → Scanned (optional)
    → [/pd:new-milestone] → Has roadmap
      → [/pd:plan] → Has plan
        → [/pd:write-code] → Coding
          → [/pd:test] → Tested (optional)
          → [/pd:complete-milestone] → Milestone complete
            → [/pd:new-milestone] → Has roadmap (new cycle)
```

**Side branches** (anytime after init):

- `/pd:fix-bug` → investigate + fix bug
- `/pd:what-next` → check progress
- `/pd:fetch-doc` → cache documentation
- `/pd:update` → update skills
- `/pd:audit` → security audit milestone
- `/pd:test --standalone` → standalone test (no prerequisites)

## Phase States

```
⬜ Not planned
  → [/pd:plan] → Planned (has RESEARCH.md + PLAN.md + TASKS.md + Success criteria) → commit plan
    → [/pd:write-code] → Coding (has task 🔄)
      → [all tasks ✅] → 4-level verification (Exists → Substantive → Connected → Truths)
        → [verification passed] → Phase complete → auto-advance
        → [has gaps] → Auto-fix code (max 2 rounds) → Re-verify
          → [still fails after 2 rounds] → STOP, ask user (fix-bug / re-plan / skip)
        → auto-advance CURRENT_MILESTONE (if next phase is already planned)
          → [/pd:test] → auto-detect untested previous phase
```

## Prerequisites

| Command                  | Required to exist                                              | Logging readiness check                                  | If missing                               |
| ------------------------ | -------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------- |
| `/pd:init`               | —                                                              | Create `.planning/logs/` directory                       | Always runnable                          |
| `/pd:scan`               | CONTEXT.md                                                     | Verify log-writer can write to `.planning/logs/`         | "Run `/pd:init` first"                   |
| `/pd:new-milestone`      | CONTEXT.md + rules/general.md                                  | Verify log directory exists                              | "Run `/pd:init` first"                   |
| `/pd:plan`               | CONTEXT.md + ROADMAP.md + CURRENT_MILESTONE.md                 | Verify log directory exists                              | Suggest appropriate command              |
| `/pd:write-code`         | CONTEXT.md + PLAN.md + TASKS.md                                | Check available disk space for logs (warn if < 100MB)    | "Run `/pd:plan` first"                   |
| `/pd:test`               | CONTEXT.md + PLAN.md + TASKS.md (≥1 task ✅)                   | Check available disk space for logs                      | "Run `/pd:write-code` first"             |
| `/pd:test --standalone`  | —                                                              | Create `.planning/logs/` if missing                      | —                                        |
| `/pd:fix-bug`            | CONTEXT.md                                                     | Verify debug directory exists for investigation state    | "Run `/pd:init` first"                   |
| `/pd:complete-milestone` | CONTEXT.md + CURRENT_MILESTONE.md + all tasks ✅ + bugs closed | Check log rotation status (warn if > 50MB)               | List blockers                            |
| `/pd:what-next`          | —                                                              | Read error logs to display recent errors                 | Suggest `/pd:init` if missing CONTEXT.md |
| `/pd:fetch-doc`          | CONTEXT.md                                                     | Verify log directory exists                              | "Run `/pd:init` first"                   |
| `/pd:update`             | —                                                              | Verify log directory exists                              | Always runnable                          |
| `/pd:audit`              | CONTEXT.md                                                     | Check available disk space (security scans generate logs)| "Run `/pd:init` first"                   |

### Logging Readiness Checks

Before executing any command, the state machine validates:

1. **Log Directory Exists**: `.planning/logs/` directory is present and writable
   - Check: `fs.existsSync('.planning/logs') && fs.accessSync('.planning/logs', fs.constants.W_OK)`
   - Auto-creates if missing (with gitignore entry)

2. **Log Writer Available**: `bin/lib/log-writer.js` can be imported
   - Check: `require('./bin/lib/log-writer.js')` succeeds
   - Prevents silent failures

3. **Disk Space Available**: Sufficient space for log files
   - Warn if < 100MB available in partition
   - Prevents log write failures

4. **Error Handler Registered**: Skill error logger is initialized
   - Check: Handler can be created for the skill
   - Ensures errors will be captured

### Logging Failure Handling

If logging readiness checks fail:
- **Missing log directory**: Auto-create with appropriate permissions
- **Permission denied**: Log to console with warning, continue execution
- **Disk full**: Rotate logs automatically, delete oldest entries
- **Corrupt log file**: Create new file with timestamp suffix

The system ensures: **Skills always execute even if logging fails** - errors are still displayed to user via console.

## Phase Transition (Auto-advance)

When ALL tasks ✅:

1. Check ROADMAP → next phase exists?
2. Next phase has TASKS.md? → auto-advance `phase` in CURRENT_MILESTONE.md
3. Not planned? → keep as-is, suggest `/pd:plan [next phase]`

**Auto-advance + test:**

- Auto-advance happens immediately when phase completes, BEFORE `/pd:test`
- `/pd:test` auto-detects untested previous phase: new phase has no ✅ tasks → scans other phases for completed phase without TEST_REPORT
- `/pd:what-next` also scans phases for untested phases (Priority 5.5)

## Edge Cases

### Skip phase

- NO automatic skip
- User wants to skip → `/pd:plan [later phase]` directly
- Skipped phase shows in ROADMAP with deliverables `- [ ]`
- `/pd:complete-milestone` warns about unimplemented phases → user chooses to skip/plan more

### Rollback phase

- NO automatic rollback
- User wants to redo → `/pd:plan [old phase]` → warn about completed tasks → user chooses to overwrite
- Already committed code keeps git history

### Re-plan phase during coding

- `/pd:plan [current phase]` when tasks are 🔄/✅ → warn user
- User confirms overwrite → old tasks lose status

### Test discovers bug (✅ → 🐛)

- `/pd:write-code` marks ✅ after code + build + commit
- `/pd:test` → test fails → change ✅ → 🐛
- Valid transition: code passes build but fails test logic
- `/pd:complete-milestone` blocks if 🐛 exists → run `/pd:fix-bug` first

### Plan --discuss interrupted

- State saved to `.planning/milestones/[version]/phase-[phase]/DISCUSS_STATE.md`
- Re-run → read DISCUSS_STATE.md → resume unresolved issues
- No DISCUSS_STATE.md → start over

### Mid-process error

- Build fails → keep 🔄, don't mark ✅
- `.planning/` corrupt → `/pd:what-next` detects missing files → suggest command
- Session interrupted → STATE.md + CURRENT_MILESTONE.md keep context → `/pd:what-next`

### Circular dependency

- Tasks depend on each other → `/pd:write-code` detects → notify user
- DO NOT auto-pick task when all are blocked
- **STOP** flow — user fixes TASKS.md (remove/reorder dependency) then re-run
