### Project Language Convention
- Use English throughout, with standard grammar and spelling

### Command Reference: pd:onboard

The `pd:onboard` skill orients AI to an unfamiliar codebase in one command.

**Usage:**
- `/pd:onboard` — Onboard current directory
- `/pd:onboard /path/to/project` — Onboard specific project

**What it does:**
1. Runs `pd:init` internally (creates CONTEXT.md, framework rules)
2. Analyzes git history to derive project vision
3. Runs `pd:scan` internally (creates SCAN_REPORT.md)
4. Creates PROJECT.md, ROADMAP.md, CURRENT_MILESTONE.md, STATE.md, REQUIREMENTS.md

**Output:**
- `.planning/CONTEXT.md` — tech stack and project context
- `.planning/PROJECT.md` — vision from git analysis
- `.planning/ROADMAP.md` — initial v1.0 milestone placeholder
- `.planning/CURRENT_MILESTONE.md` — status: Not started
- `.planning/STATE.md` — initial working state
- `.planning/REQUIREMENTS.md` — placeholder for requirements

**Next step:** `/pd:new-milestone` or `/pd:plan`

**Error Handling:**
- Uses enhanced error handler for structured logging
- Logs to `.planning/logs/agent-errors.jsonl`

---

### Command Reference: pd:map-codebase

The `pd:map-codebase` skill creates a structure map of the codebase for reference by other agents.

**Usage:**
- `/pd:map-codebase` — Map current codebase
- Auto-triggered by `/pd:init` when codebase not yet mapped

**What it does:**
1. Scans directory structure (up to 3 levels deep)
2. Detects tech stack from config files
3. Identifies entry points (main, bin, exports)
4. Analyzes internal dependencies (require/import)
5. Creates output files in `.planning/codebase/`:
   - `STRUCTURE.md` — directory tree with annotations
   - `STACK.md` (or `TECH_STACK.md`) — detected technologies
   - `ENTRY_POINTS.md` — main entry points
   - `DEPENDENCIES.md` — internal dependency graph
   - `META.json` — mapping metadata (commit SHA, timestamp)

**Staleness Detection:**
- `META.json` stores `mapped_at_commit` (40-char SHA)
- `pd:status` checks staleness against current HEAD
- Staleness threshold: 20 commits
- Levels: fresh (<20), aging (20-49), stale (50+)
- Recommendations displayed in status dashboard

**Integration with pd:init:**
- If map is aging/stale, init prompts: "Codebase map is [level]. Refresh now?"
- Non-blocking: init continues even if user declines
- User options: "Yes, refresh now" | "Skip this time"

---

### Command Reference: pd:status

The `pd:status` skill displays a read-only project status dashboard.

**Usage:**
- `/pd:status` — Display current status
- `/pd:status --auto-refresh` — Enable staleness detection
- `/pd:status --refresh-threshold=5` — Set custom threshold (minutes)

**Output fields:**
- Milestone, Phase, Plan
- Task completion status
- Bug count, Recent errors
- Blocking issues
- Last commit info
- Staleness indicator

**Auto-refresh logic:**
- Default threshold: 10 minutes
- Staleness levels: fresh (<50%), aging (50-100%), stale (>100%)
- Suggests refresh when idle and data is stale
- Respects active tasks (defers refresh when work in progress)

**Map staleness detection:**
- `pd:status` displays codebase map staleness (fresh/aging/stale)
- Map is considered stale after 20 commits since last mapping
- Threshold: 20 commits (configurable via code)
- Staleness levels:
  - `fresh`: <20 commits behind
  - `aging`: 20-49 commits behind
  - `stale`: 50+ commits behind
- Recommendation shown in Map field of status dashboard
