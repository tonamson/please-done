<purpose>
Find and fix bugs using the scientific method: collect symptoms → risk classification → hypothesis → verification → gate check → fix → confirm.
Save investigation state (.planning/debug/) to resume when conversation is lost. Loop until user confirms. Create patch version for completed milestones.
</purpose>

<required_reading>
Read before starting:
- @references/conventions.md → version matching, patch version, icons, commit prefixes
</required_reading>

<conditional_reading>
Read ONLY WHEN needed:
- @references/prioritization.md -> bug risk classification — WHEN multiple bugs need prioritization
</conditional_reading>

<process>

## Step 0.5: Analyze bug — determine reference documents
- Multiple bugs need prioritization? → read @references/prioritization.md
If only 1 bug → SKIP.

## Step 1: Check investigation session + collect symptoms

`git rev-parse --git-dir 2>/dev/null` → store `HAS_GIT`
`mkdir -p .planning/debug`

### 1a. Check for open investigation sessions
Glob `.planning/debug/SESSION_*.md` → Grep `> Status:` → filter **resumable**:
- `Investigating`, `Checkpoint`, `Awaiting decision`, `Paused`

Statuses **NOT self-listed** (only open when user explicitly mentions):
- `Root cause found`, `Resolved`, `Inconclusive` (→ jump **Step 5c** with new information)

- Has resumable session AND no $ARGUMENTS → list (status + hypothesis + next action):
  - `Investigating` / `Paused` → **Step 5c**
  - `Checkpoint` → display question, wait for answer → **Step 5c**
  - `Awaiting decision` → display options, wait for selection → **Step 6b** then **6c**
- Has $ARGUMENTS → continue collecting new symptoms

Has open bug report (`.planning/bugs/BUG_*.md` → Grep `Status: (Unresolved|Fixing)`):
- List → user selects → read report → fill in symptoms → jump Step 3

### 1b. Collect symptoms (new bug)
Collect 5 pieces of information — from $ARGUMENTS or ask:
1. **Expected** — What should have happened?
2. **Actual** — What happened instead?
3. **Error message** — Specific log/error?
4. **Timeline** — When? Was it working before? Recent changes?
5. **Reproduction** — Steps to reproduce?

$ARGUMENTS sufficient → DO NOT ask more, extract directly.
Missing (#2, #5) → ask for additional info.
Ask with common answer suggestions + allow custom input.
After 5 symptoms still missing context → flexibly ask more (route, payload, log...).

## Step 2: Determine patch version

See @references/conventions.md → 'Patch version'.

- `.planning/CURRENT_MILESTONE.md` → current version
- Does not exist → ask user for version, skip comparison logic
- Compare bug version with current:

| Case | Patch version |
|------|--------------|
| Bug in OLD version (milestone completed) | Glob bugs/ → Grep patch version → find highest → +1 or `[base-version].1` |
| Bug in CURRENT version | `[version].0` or find highest → +1 |

- User does not specify version → ask
- `.planning/milestones/[base-version]/` does not exist → "Check version." → **STOP**

## Step 3: Read technical documentation (ONLY RELEVANT PARTS)
Use **base version** (NOT patch version):

**Find related phase FIRST:**
1. Grep the buggy feature in `.planning/milestones/[base-version]/phase-*/PLAN.md`
2. ONLY read PLAN.md + CODE_REPORT of related phase(s)
3. Grep no match → expand search to all PLAN.md files

- PLAN.md → design, API, database
- CODE_REPORT → files created, technical decisions
- `.planning/rules/` → code conventions

## Step 4: Investigate related files
`mcp__fastcode__code_qa`:
1. Files related to [buggy feature]?
2. Backend: controller → service → database flow?
3. Frontend: components, stores, API calls?

FastCode error → Grep/Read. Warning: "FastCode unavailable."

**Library-related bug** → Follow @references/context7-pipeline.md

## Step 5: Analyze using the scientific method

### 5a. Create/update investigation session
`.planning/debug/SESSION_[short-name].md`
**Short-name**: lowercase, hyphenated, max 30 characters (e.g.: `login-timeout`, `cart-empty`)

```markdown
# Investigation session: [short-name]
> Started: [DD_MM_YYYY HH:MM] | Status: Investigating
> Classification: [🟢/🟡/🟠/🔴/🔵 — see Step 6a]
> Bug report: BUG_[timestamp].md (linked after Step 7)

## Symptoms
- **Expected:** [...]
- **Actual:** [...]
- **Error message:** [...]
- **Timeline:** [...]
- **Reproduction:** [...]

## Minimal reproduction (if needed)
## Hypotheses
### H1: [description]
- **Test by:** [...]
- **Evidence:** [...]
- **Result:** ✅ Correct / ❌ Wrong / ⏳ Not yet tested

## Files examined
- `[file:line]`: [finding]

## Conclusion
```

### 5b. Minimal reproduction (for difficult bugs)
**When needed:** reproduction steps unclear, intermittent, or 5+ steps.
Find shortest path → eliminate noise factors → record in SESSION → use as basis for hypotheses.
Obvious error (message points directly to file/line) → skip.

### 5b.1: Create Reproduction Test (AFTER hypothesis, BEFORE fix)

**ONLY WHEN** symptoms are sufficient (Step 1b) AND buggy file identified (Step 4).

1. `mkdir -p .planning/debug/repro`
2. Call `generateReproTest()` from `bin/lib/repro-test-generator.js`:
   - Input: `{ symptoms }` (from Step 1b), `bugTitle` (from SESSION short-name), `filePath` (from Step 4), `functionName` (if available)
   - **Error → STOP.** Report: "Could not create reproduction test: [error]"
3. Write file `.planning/debug/repro/[testFileName]`
4. Record in SESSION: `Reproduction test: .planning/debug/repro/[testFileName]`

### 5c. Form + verify hypotheses

CONTEXT.md → stack → read `.planning/rules/[stack].md` → trace flow:
Cannot determine stack from CONTEXT.md → use generic trace flow: entry point → handler → business logic → data layer → response. Note: "Stack unidentified, using generic flow."

| Stack | Flow |
|-------|------|
| NestJS | request → controller → service → database → response |
| NextJS | page/component → store → API call → display |
| WordPress | hook/action → callback → $wpdb → output |
| Solidity | function → require → state change → external → events |
| Flutter | View (Obx) → Logic (GetxController) → Repository → API → Response |
| Generic/Other | entry point → handler → business logic → data layer → response |

**Process:**
1. Symptoms + trace → 1-3 hypotheses
2. Each hypothesis: determine how to test → gather evidence → ✅ Correct (root cause) / ❌ Wrong (eliminate, record reason)
3. Update SESSION after each hypothesis
4. All wrong → expand scope, new hypotheses

**Checkpoint** (needs user verification):
- SESSION: `> Status: Checkpoint`
- Add section `## Checkpoint [N]` (Type, Question, Answer)
- User answers → update → `Investigating` → continue

**General:** find file + line causing the bug, explain why, assess impact.

## Step 6: Evaluate investigation results

### 6a. Risk classification
Classify per @references/prioritization.md → 'Bug risk classification'. Update SESSION.
Impact: report format (Step 7), test level (Step 8), commit strategy (Step 9).

### 6a.1. Effort routing for fix-bug

fix-bug always runs with sonnet (per skill file `commands/pd/fix-bug.md` line 4: `model: sonnet`). Effort routing does not apply to fix-bug — the agent is already spawned with a fixed model before the workflow runs.

### 6b. Evaluate results

**✅ Root cause found, fix is clear** → SESSION `Root cause found` + fill Conclusion → Step 6c

**⚠️ Found but NEEDS USER DECISION** (data migration, auth/payment/contract logic, breaking old API, multiple fix options):
- SESSION `Awaiting decision`
- Present: root cause + option A/B (pros/cons)
- User selects → Step 6c

**❌ Not found** → SESSION `Inconclusive`:
- Report: "[N] hypotheses tested, root cause not identified."
- Suggest: (1) Provide more information, (2) Expand scope, (3) Add temporary logs
- User provides more → update SESSION → **Step 5c**
- User stops → SESSION `Paused`
- DO NOT create BUG_*.md when root cause not found

### 6c. Gate check before fixing
**3 REQUIRED conditions:**
1. Reproduced OR sufficiently strong alternative evidence (clear logs, obvious logic error, trace points directly to line)
2. Specific file + logic identified
3. Post-fix testing plan in place

Missing condition → go back to Step 5b/5c. All met → Step 6.5 (if logic bug) or Step 7.

## Step 6.5: Logic Update — update Truth when bug is caused by wrong logic

**Classification:** Root cause (from Step 6b) related to business logic / Truth in PLAN.md?
- Typo, off-by-one, missing import, syntax error → NOT a logic bug → **skip 6.5, go to Step 7**
- Wrong calculation logic, wrong business condition, missing edge case, wrong threshold value → **logic bug → continue 6.5**

### 6.5a. Find related PLAN.md
Use same strategy as Step 3: Grep `.planning/milestones/[base-version]/phase-*/PLAN.md` → find 5-column Truths table.
No PLAN.md found → record in BUG report: "No PLAN.md to update Truth". Skip 6.5, go to Step 7.

### 6.5b. Identify Truth to fix
- ONLY modify existing Truths, DO NOT add new Truths
- ONLY modify relevant columns (Truth, Edge cases, How to verify — or multiple columns)
- Logic completely missing → record Deferred, DO NOT add new Truth

### 6.5c. Confirm with user

```
This bug is caused by a wrong Truth — need to update PLAN.md:

| Truth | Current | Change to |
|-------|---------|-----------|
| T[x] | [old value] | [new value] |

Agree to update PLAN.md? (Y/n)
```

- User agrees → 6.5d
- User rejects ("not a logic bug") → skip 6.5, record in SESSION: "User rejected logic bug classification" → Step 7

### 6.5d. Update PLAN.md + commit
- Fix Truths table in PLAN.md (ONLY PLAN.md, DO NOT modify TASKS.md)
- Old value recorded in BUG report "Root cause analysis"
- Separate commit:
  ```
  git add [PLAN.md path]
  git commit -m "[BUG] Update Truth [TX]: [change summary]"
  ```
- Continue to Step 7

## Step 7: Write bug report
`.planning/bugs/BUG_[DD_MM_YYYY_HH_MM_SS].md`:

```markdown
# Bug report
> Date: [DD_MM_YYYY HH:MM:SS] | Severity: Critical/High/Medium/Low
> Status: Fixing | Feature: [Name] | Task: [N] (if known)
> Patch version: [x.x.x] | Fix attempt: 1
> Classification: [🟢/🟡/🟠/🔴/🔵 classification name]
> Investigation session: SESSION_[short-name].md

## Bug description
## Symptoms
- **Expected:** | **Actual:** | **Timeline:**
## Reproduction steps
1. → 2. → Error

## Root cause analysis
### Hypotheses tested:
- H1: [description] → ❌ Eliminated because [reason]
- H2: [description] → ✅ **Root cause**

### [Code/change section — DEPENDS ON classification]:
🟢🟡🟠🔴 Code bug → Code BEFORE/AFTER (file, original code → cause, fixed code)
🔵 Infrastructure/config → Summary (file, old value → new, reason)

## Logic Changes (if any)
| Truth ID | Change | Reason |
|----------|--------|--------|

## Impact
## Testing plan
## Confirmation
- [ ] Fix applied
- [ ] User confirmed correct
- [ ] No new bugs introduced
```

Update link in SESSION file.

## Step 8: Fix code

### 8a: Regression analysis (BEFORE fixing)

**ONLY WHEN** buggy file identified (Step 4).

1. Try FastCode `code_qa` asking: "List files that import or call [function] in [targetFile]"
   - Success → call `analyzeFromCallChain()` from `bin/lib/regression-analyzer.js`:
     Input: `{ callChainText, targetFile, targetFunction }`
   - FastCode error → read source files around targetFile → call `analyzeFromSourceFiles()`:
     Input: `{ sourceFiles: [{path, content}], targetFile, targetFunction }`
   - **Error → STOP.** Report: "Could not analyze regression: [error]"
2. Result `affectedFiles` (max 5) → record in BUG report "Impact" section
3. Record in SESSION: `Regression: [count] affected files`

- Apply fix, follow `.planning/rules/`
- Update JSDoc if logic changes (Vietnamese with diacritics)
- Lint + build in correct directory (see rules/[stack].md → **Build & Lint**)

**Testing by classification:**

| Classification | Requirements |
|---------------|-------------|
| 🟢 Quick fix | lint + build pass is sufficient |
| 🟡 Logic bug | MUST add/update tests |
| 🟠 Data bug | backup first, verify integrity after |
| 🔴 Security | tests REQUIRED + user confirmation before applying |
| 🔵 Infrastructure | verify config in correct environment |

## Step 9: Git commit (ONLY HAS_GIT = true)

### 9a: Debug log cleanup + Security warnings (BEFORE commit)

**1. Debug cleanup:**
`git diff --cached --name-only` → Read content of each staged file → call `scanDebugMarkers(stagedFiles)` from `bin/lib/debug-cleanup.js`
- Input: `[{path, content}]` from staged files
- Empty result → skip, show nothing (D-06)
- Has results → display list grouped by file (D-04):
  ```
  [PD-DEBUG] Found debug markers:
    src/app.js:
      Line 15: console.log('[PD-DEBUG] value x:', x)
      Line 42: // [PD-DEBUG] temporary
    src/utils.js:
      Line 8: logger.info('[PD-DEBUG] check')
  Remove all debug markers? (Y/n)
  ```
- User selects Y → use Edit tool to remove each line with marker → `git add` modified files again
- User selects n → display: "⚠️ Debug markers still present in commit" → continue (D-07, non-blocking)

**2. Security check:**
`.planning/scan/SCAN_REPORT.md` exists AND mtime < 7 days?
- No → skip, show nothing (D-08)
- Yes → Read content → call `matchSecurityWarnings(reportContent, filePaths)` from `bin/lib/debug-cleanup.js`
  - Empty result → skip
  - Has warnings (max 3, D-09) → display non-blocking (D-10):
    ```
    ⚠️ Related security warnings:
    - src/auth.js: [high] SQL injection risk in query builder
    - src/api.js: [moderate] Missing input validation
    ```
  - Continue with commit (non-blocking)

### 9b: Git commit

**Commit by classification:**
- 🟢🟡🔵: code fix + report + investigation session in 1 commit
- 🟠: separate commit for migration/data fix, separate commit for code fix
- 🔴: separate commit, DO NOT bundle unrelated changes

```
git add [fixed files] .planning/bugs/BUG_[...].md .planning/debug/SESSION_[...].md
git commit -m "[BUG] Fix [summary]

Classification: [🟢/🟡/🟠/🔴/🔵]
Root cause: [...]
Files: [file]: [change]"
```

## Step 10: Request confirmation
> "Fixed [description]. Please check and confirm."

### User confirms FIXED:
- Report: Status → Resolved, tick checklist
- Investigation session: `Resolved`
- TASKS.md: use BASE version (NOT current version) → Glob `.planning/milestones/[base-version]/phase-*/TASKS.md` → Grep task → 🐛 → ✅ BOTH places (table + detail)
- HAS_GIT:
```
git add .planning/bugs/BUG_[...].md .planning/debug/SESSION_[...].md .planning/milestones/[...]/TASKS.md
git commit -m '[BUG] Confirmed fix [summary]'
```

### 10a. Sync logic and reports (non-blocking)

> This entire step is non-blocking — errors only create warnings, DO NOT block workflow.

**1. Logic detection (LOGIC-01):**
`git diff HEAD~1` → call `detectLogicChanges(diffText)` from `bin/lib/logic-sync.js`
- Record in BUG report: "Logic changes: YES/NO" + signals (if any)

**2. Report update (RPT-01) — ONLY WHEN hasLogicChange = YES:**
Glob `.planning/reports/*.md` + `.planning/milestones/*/` → newest file by mtime
- No report → warning: "No report found to update"
- Found → call `updateReportDiagram({reportContent, planContents})` → write file
- Ask: "Update PDF? (Y/n)" → Y: `node bin/generate-pdf-report.js [path]`

**3. Rule suggestion (PM-01):**
Read SESSION + BUG report + CLAUDE.md → call `suggestClaudeRules({sessionContent, bugReportContent, claudeContent})`
- Has suggestions → display: "[Rule suggestion] ..." → ask "Add to CLAUDE.md? (Y/n)"
- Y → append rules to end of CLAUDE.md → `git add CLAUDE.md && git commit -m '[BUG] Add rule from post-mortem'`

### User reports NOT FIXED:
- Collect more info (new symptoms?)
- Report: increment "Fix attempt", add section "Fix attempt [N]"
- Investigation session: new hypotheses, new evidence
- Return to **Step 5c** — new hypotheses from new evidence
- Each fix attempt committed with [BUG]
- 3+ attempts → suggest: re-analyze, change approach, add temporary logs
- **CONTINUE until user confirms**

</process>

<rules>
- Follow `.planning/rules/` (general + stack-specific)
- FORBIDDEN to read/display sensitive files (`.env`, `credentials.*`, `*.pem`, `*.key`, `*secret*`, `wp-config.php`)
- MUST read PLAN.md + CODE_REPORT before fixing (ONLY related phase)
- MUST investigate before fixing — DO NOT guess
- MUST form hypotheses before fixing — DO NOT fix blindly
- MUST pass gate check (reproduction/evidence + specific file/logic + post-fix testing plan) before fixing
- MUST classify risk → determines testing + commit strategy
- MUST write bug report: code BEFORE/AFTER (code bug) or summary (infrastructure)
- MUST maintain investigation session (.planning/debug/) — update after each step
- DO NOT create BUG_*.md before passing gate check
- DO NOT self-close bugs — MUST wait for user confirmation
- DO NOT limit fix attempts — loop until confirmed
- Each fix attempt: separate commit [BUG]
- Patch version increments: 1.0 → 1.0.1 → 1.0.2
- Fix affects other features → NOTIFY user
- 🔴 security: MUST have user approval before applying
- ⚠️ trade-offs: MUST present options + pros/cons, wait for selection
- FastCode error → Grep/Read, DO NOT STOP
- Resuming session → read SESSION FIRST, do not start over
</rules>

<success_criteria>
- [ ] Symptoms collected (5 pieces of information)
- [ ] Technical documentation read (PLAN.md + CODE_REPORT of related phase)
- [ ] Investigation completed before fixing
- [ ] Risk classification determined
- [ ] Hypotheses formed and verified systematically
- [ ] Gate check passed (3 conditions)
- [ ] Investigation session created + updated throughout
- [ ] Bug report in correct format
- [ ] Tests + build pass per classification
- [ ] User confirmed fix was successful
</success_criteria>
