---
description: Check for a new version of the skill set on GitHub, show the changelog, and update it
tools:
  - Read
  - Write
  - Edit
  - Bash
  - AskUserQuestion
---
<objective>
Check for a newer version on GitHub, display the changelog, update the skill set, and suggest restarting the session.
</objective>
<guards>
Stop and instruct the user if any of the following conditions fail:
- [ ] `.pdconfig` exists -> "The skill set is not installed yet. Run `node bin/install.js` first."
- [ ] Network connectivity is available (`git fetch` succeeds) -> "Cannot reach GitHub. Check the network connection."
      </guards>
<context>
User input: $ARGUMENTS
- No flag or `--check` -> check only, DO NOT update
- `--apply` -> check and update immediately
`.pdconfig` -> `SKILLS_DIR`
(cat `~/.opencode/.pdconfig` -- path is auto-converted per platform)
</context>
<execution_context>
None -- this skill is handled directly and does not use a separate workflow.
<!-- Audit 2026-03-23: Intentional -- self-contained skill without workflow (lightweight/utility pattern). See Phase 14 Audit I2. -->
</execution_context>
<process>
## Step 1: Read the current version
`.pdconfig` -> `SKILLS_DIR` -> `[SKILLS_DIR]/VERSION` -> `LOCAL_VERSION`
If VERSION does not exist -> `LOCAL_VERSION = unknown`
## Step 2: Check the remote
```bash
cd [SKILLS_DIR] && git fetch origin main --quiet 2>/dev/null
```
If it fails -> STOP: "Cannot reach GitHub."
## Step 3: Compare versions
```bash
cd [SKILLS_DIR] && git show origin/main:VERSION 2>/dev/null
```
| Comparison                        | Action                                                       |
| --------------------------------- | ------------------------------------------------------------ |
| SAME                              | "Already up to date (v[x.x.x])." -> STOP                     |
| REMOTE > LOCAL (or LOCAL=unknown) | Continue to Step 4                                           |
| LOCAL > REMOTE                    | "Local (v[LOCAL]) is newer than remote (v[REMOTE])." -> STOP |
| REMOTE is empty                   | "Remote has no VERSION file." -> STOP                        |
Semver: split `[major, minor, patch]` to compare, or use `sort -V`.
## Step 4: Show changelog
```bash
cd [SKILLS_DIR] && git show origin/main:CHANGELOG.md 2>/dev/null
```
Only show entries newer than `LOCAL_VERSION`.
```
+--------------------------------------+
|        SKILLS UPDATE                 |
| Current: v[LOCAL] | New: v[REMOTE]   |
| Changes: [changelog entries]         |
+--------------------------------------+
```
## Step 5: Branch by flag
- `--apply` -> Step 6
- No flag/`--check` -> ask "Update now? (y/n)" -> y: Step 6 | n: STOP, suggest `/pd-update --apply`
## Step 6: Update
Check branch: `git -C [SKILLS_DIR] branch --show-current` -> if not `main`, checkout main (if it fails because of uncommitted changes -> STOP with warning)
```bash
OLD_COMMIT=$(git -C [SKILLS_DIR] rev-parse HEAD)
cd [SKILLS_DIR] && git pull origin main
```
If pull fails -> show error + suggest `git stash && git pull && git stash pop` -> STOP
If successful -> read the new VERSION to confirm
## Step 7: Submodules
If `.gitmodules` exists -> `git submodule update --init --recursive`
If FastCode changed -> "FastCode was updated as well."
## Step 8: Update `.pdconfig` and clear cache
- Set `CURRENT_VERSION=[REMOTE_VERSION]` in `.pdconfig` (replace if present, add if missing)
- `rm -f ~/.opencode/cache/pd-update-check.json`
## Step 9: Notify
```
+--------------------------------------+
|         UPDATE SUCCESSFUL!           |
| v[OLD] -> v[NEW]                     |
| Close and restart the work session   |
| Ctrl+C -> reopen the AI assistant    |
| Rollback: cd [SKILLS_DIR] &&         |
|   git checkout [OLD_COMMIT]          |
+--------------------------------------+
```
</process>
<output>
**Create/Update:**
- `[SKILLS_DIR]/` -- updated skill set from GitHub
- `.pdconfig` -- updated `CURRENT_VERSION`
- Delete `~/.opencode/cache/pd-update-check.json`
**Next step:** Restart your AI assistant
**Success when:**
- `VERSION` is updated correctly
- `.pdconfig` contains the new `CURRENT_VERSION`
- The notification cache has been cleared
**Common errors:**
- No network -> check connectivity
- Git conflict -> `git stash && git pull && git stash pop`
- `.pdconfig` does not exist -> run `node bin/install.js`
  </output>
<rules>
- DO NOT change project code, only update the skill set
- DO NOT push, only pull
- DO NOT restart automatically, only suggest that the user restart
- If `git pull` conflicts -> STOP and instruct the user to resolve it manually
- If there is no network -> STOP and report it clearly
- `--check` (default): check only and ask before updating
- `--apply`: update immediately without asking
- You MUST show the changelog before updating
- You MUST remove `~/.opencode/cache/pd-update-check.json` after updating
- You MUST suggest restarting after the update
- All output MUST be in English
</rules>
