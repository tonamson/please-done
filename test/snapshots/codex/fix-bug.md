---
name: pd-fix-bug
description: Find and fix bugs using a scientific method, investigate, report, patch the code, create a [BUG] commit, and confirm until resolved
---
<codex_skill_adapter>
## How to invoke this skill
Skill name: `$pd-fix-bug`
When the user invokes `$pd-fix-bug {{args}}`, execute all instructions below.
## Tool mapping
- `AskUserQuestion` → `request_user_input`: When you need to ask the user, use request_user_input instead of AskUserQuestion
- `Task()` → `spawn_agent()`: When you need to spawn a sub-agent, use spawn_agent with fork_context
  - Wait for result: `wait(agent_ids)`
  - End agent: `close_agent()`
## Compatibility fallback
- If `request_user_input` is not available in the current mode, ask the user in plain text with a short question and wait for the user to respond
- Anywhere that says "MUST use `request_user_input`" means: prefer using it when the tool is available; otherwise fall back to plain text questions — never guess on behalf of the user
## Conventions
- `$ARGUMENTS` is equivalent to `{{GSD_ARGS}}` — user input when invoking the skill
- All config paths have been converted to `~/.codex/`
- MCP tools (`mcp__*`) work automatically via config.toml
- Read `~/.codex/.pdconfig` (cat ~/.codex/.pdconfig) → get `SKILLS_DIR`
- References to `[SKILLS_DIR]/templates/*`, `[SKILLS_DIR]/references/*` → read from the corresponding source directory
</codex_skill_adapter>
<objective>
Fix bugs through a clear process: symptom -> risk classification -> hypothesis -> verification -> gate check -> fix -> confirmation.
Store the investigation state in `.planning/debug/` so it can be resumed after session loss.
Repeat until the user confirms success. Create a patch version for completed milestones.
**After completion:** `$pd-what-next`
</objective>
<guards>
Stop and instruct the user if any of the following conditions fail:
- [ ] `.planning/CONTEXT.md` exists -> "Run `$pd-init` first."
- [ ] A bug description was provided -> "Please provide a bug description or investigation session name."
- [ ] FastCode MCP connected and available (soft check) → If unavailable: warn "FastCode unavailable — using Grep/Read fallback (slower)." **Do NOT stop — continue with fallback.**
- [ ] Context7 MCP connected and available (soft check) → If unavailable: warn "Context7 unavailable — skipping library docs lookup." **Do NOT stop — continue without library docs.**
- [ ] Use `resolve-library-id` to get library ID before calling `get-library-docs` for each dependency.
</guards>
<context>
User input: {{GSD_ARGS}}
Additional reads:
- `.planning/rules/general.md` -> general rules
- `.planning/rules/{nestjs,nextjs,wordpress,solidity,flutter}.md` -> rules for the bug type (ONLY if they exist)
</context>
<required_reading>
Read .pdconfig → get SKILLS_DIR, then read the following files before starting:
(Claude Code: cat ~/.codex/.pdconfig — other platforms: converter auto-converts paths)
Read before starting:
- [SKILLS_DIR]/references/conventions.md -> version matching, patch version, icons, commit prefixes
</required_reading>
<conditional_reading>
Read ONLY WHEN needed (analyze task description first):
- [SKILLS_DIR]/references/prioritization.md -- WHEN task ordering/ranking multiple tasks or triage
- [SKILLS_DIR]/references/context7-pipeline.md -- WHEN task needs it
</conditional_reading>
<process>
## Step 0: Check operating mode
1. Parse {{GSD_ARGS}} -> check for `--single` flag
2. If NO --single:
   - Check 5 files exist:
     `commands/pd/agents/pd-bug-janitor.md`
     `commands/pd/agents/pd-code-detective.md`
     `commands/pd/agents/pd-doc-specialist.md`
     `commands/pd/agents/pd-repro-engineer.md`
     `commands/pd/agents/pd-fix-architect.md`
   - Missing any file -> auto-fallback = true
3. If --single OR auto-fallback:
   Display: "--- Single agent mode: Missing agent configs, using single agent mode ---"
   Read and execute per content of file `workflows/fix-bug-v1.5.md`. STOP workflow v2.1 here.
4. If all 5 files present -> continue to Step 0.5 (Resume UI below)
## Step 0.5: Resume UI
`git rev-parse --git-dir 2>/dev/null` -> store `HAS_GIT`
`mkdir -p .planning/debug`
1. Glob `.planning/debug/S*` -> get list of folder names
2. For each folder, Read `{folder}/SESSION.md` -> get content
3. Call `listSessions(folderNames, sessionContents)` from `bin/lib/session-manager.js`
   - folderNames: array of folder names (e.g.: `['S001-login-timeout', 'S002-cart-empty']`)
   - sessionContents: array of `[{folderName, sessionMdContent}]`
   - Returns list of unresolved sessions, containing { number, id, slug, status, outcome, updated }
4. If there are active/paused sessions:
   Display table:
   ```
   Open investigation sessions:
   | # | ID   | Description      | Status     |
   |---|------|------------------|------------|
   | 1 | S001 | login-timeout    | active     |
   | 2 | S003 | cart-empty       | paused     |
   ```
   Ask: "Enter number to continue, or describe a new bug to create a session."
5. User enters number -> read SESSION.md of that session -> determine next step from status:
   - status=active -> Step 1 (continue with current session, pass session_dir)
   - status=paused -> read existing evidence files -> jump to appropriate step
6. User enters new description -> Step 0.6
7. No sessions AND has {{GSD_ARGS}} -> Step 0.6
8. No sessions AND no {{GSD_ARGS}} -> ask user for bug description -> Step 0.6
## Step 0.6: Analyze bug — determine reference documents
- Multiple bugs need prioritization? -> read [SKILLS_DIR]/references/prioritization.md
If only 1 bug -> SKIP.
### Create new session (per D-09)
Call `createSession({ existingSessions, description })` from `bin/lib/session-manager.js`
- existingSessions: session list from Step 0 (array of { number })
- description: bug description from user ({{GSD_ARGS}} or input)
- Result: { id, slug, folderName, sessionMd }
- `mkdir -p .planning/debug/{folderName}`
- Write sessionMd to `.planning/debug/{folderName}/SESSION.md`
- Store `session_dir` = absolute path to `.planning/debug/{folderName}` to pass to subsequent steps
## Step 1: Collect symptoms
--- Step 1/5: Collect symptoms ---
Spawn Agent `pd-bug-janitor`:
  "Session dir: {absolute_session_dir}.
   Bug description: {user_description}.
   Collect 5 core symptoms and write evidence_janitor.md to session dir."
After agent completes:
1. Read `{session_dir}/evidence_janitor.md`
2. Call `validateEvidence(content)` from `bin/lib/evidence-protocol.js`
3. Check result:
   - valid=true -> continue to Step 2
   - valid=false AND content has symptoms (grep "Symptoms" or "Expected") -> WARNING, write to SESSION.md, continue to Step 2
   - valid=false AND NO symptoms -> STOP: "Insufficient information to investigate. Please describe the bug in more detail."
4. Call `updateSession(currentMd, { status: 'active', appendToBody: '- evidence_janitor.md: recorded' })` from `bin/lib/session-manager.js`
   - Write resulting sessionMd to `{session_dir}/SESSION.md`
Janitor FAIL (agent throw/timeout):
- Has {{GSD_ARGS}} with sufficient symptoms -> WARNING: "Janitor did not respond. Continuing with initial information."
  Manually create evidence_janitor.md from {{GSD_ARGS}} (5 symptoms in evidence format), continue to Step 2.
- NO symptoms -> STOP: "Unable to collect symptoms. Please try again."
## Step 2: Analyze code and documentation
--- Step 2/5: Analyze code and documentation ---
0. Call `isHeavyAgent('pd-code-detective')` from `bin/lib/resource-config.js`
   - true -> WARNING: "Detective uses heavy tool (FastCode). Only 1 heavy task at a time."
   - Read `{session_dir}/SESSION.md` -> currentMd
     Call `updateSession(currentMd, { appendToBody: 'WARNING: Detective uses heavy tool. Only 1 heavy task at a time.' })` from `bin/lib/session-manager.js`
     Write resulting sessionMd to `{session_dir}/SESSION.md`
1. Call `buildParallelPlan(sessionDir, janitorEvidencePath)` from `bin/lib/parallel-dispatch.js`
   - sessionDir: session_dir value from Step 0.6
   - janitorEvidencePath: `{session_dir}/evidence_janitor.md`
   - Result: { agents, warnings } — agents include pd-code-detective (critical) and pd-doc-specialist (optional)
   If this is an INCONCLUSIVE loop-back (user_input_round_N.md exists in session_dir):
     Call `buildInconclusiveContext({ evidenceContent: old_evidence_architect_content, userInputPath: '{session_dir}/user_input_round_{N}.md', sessionDir: session_dir, currentRound: N })` from `bin/lib/outcome-router.js`
     Add prompt to Detective and DocSpec prompts so agents know the Elimination Log and new information from user.
2. Spawn Agent `pd-code-detective`:
   "Session dir: {absolute_session_dir}.
    Read evidence_janitor.md and analyze source code. Write evidence_code.md."
3. Read `{session_dir}/evidence_code.md` -> detectiveContent
   - Call `validateEvidence(detectiveContent)` from `bin/lib/evidence-protocol.js` -> detectiveValidation
   - Construct detectiveResult: { evidenceContent: detectiveContent }
4. Spawn Agent `pd-doc-specialist`:
   "Session dir: {absolute_session_dir}.
    Read evidence_janitor.md and look up library documentation. Write evidence_docs.md."
5. Read `{session_dir}/evidence_docs.md` -> docSpecContent (may not exist)
   - If file exists: validateEvidence(docSpecContent) -> docSpecValidation
   - Construct docSpecResult: { evidenceContent: docSpecContent }
   - If file DOES NOT exist or invalid: docSpecResult = null
6. Call `mergeParallelResults({ detectiveResult, docSpecResult })` from `bin/lib/parallel-dispatch.js`
   - detectiveResult: { evidenceContent: detectiveContent } or { error: { message: '...' } }
   - docSpecResult: { evidenceContent: docSpecContent } or { error: { message: '...' } } or null
   - Result: { results, allSucceeded, warnings }
7. Write warnings to SESSION.md (if any):
   - Read `{session_dir}/SESSION.md` -> currentMd
   - Call `updateSession(currentMd, { appendToBody: '\n' + warnings.join('\n') })` from `bin/lib/session-manager.js`
   - Write resulting sessionMd to `{session_dir}/SESSION.md`
8. Check:
   - Detective SUCCEEDED -> continue to Step 3
   - Detective FAILED + DocSpec SUCCEEDED -> WARNING: "Code Detective returned no results. Only documentation available." Continue to Step 3 with evidence_docs.md.
   - BOTH FAILED -> STOP: "Unable to analyze. Please check the bug description."
   - Detective FAILED due to timeout/spawn error:
     Call `shouldDegrade(error)` from `bin/lib/resource-config.js`
     true -> WARNING: "Degrading to sequential mode." Spawn DocSpec first, use evidence_docs.md to re-spawn Detective.
     false -> handle as above (STOP if both fail)
DocSpec failure is NON-BLOCKING (per D-06). Only Detective failure can block the workflow.
### Progressive Disclosure (FLOW-08)
Each step starts with a banner in this format:
```
--- Step N/5: [Short description] ---
```
Banner list:
- `--- Step 1/5: Collect symptoms ---`
- `--- Step 2/5: Analyze code and documentation ---`
- `--- Step 3/5: Create reproduction test ---`
- `--- Step 4/5: Synthesize and render verdict ---`
- `--- Step 5/5: Fix code and commit ---`
Only show banner and final results. DO NOT show detailed agent output to user.
## Step 3: Create reproduction test
--- Step 3/5: Create reproduction test ---
Spawn Agent `pd-repro-engineer`:
  "Session dir: {absolute_session_dir}.
   Read evidence_janitor.md and evidence_code.md (and evidence_docs.md if available).
   Create reproduction test and write evidence_repro.md."
After agent completes:
1. Read `{session_dir}/evidence_repro.md`
2. Call `validateEvidence(content)` from `bin/lib/evidence-protocol.js`
3. Check:
   - valid=true -> continue to Step 4
   - valid=false -> WARNING: "Repro Engineer could not create reproduction test." Continue to Step 4 with evidence from Step 2.
4. Read `{session_dir}/SESSION.md` -> currentMd
   Call `updateSession(currentMd, { appendToBody: '- evidence_repro.md: recorded' })` from `bin/lib/session-manager.js`
   Write resulting sessionMd to `{session_dir}/SESSION.md`
Repro FAIL (agent throw/timeout):
- WARNING: "Could not create reproduction test. Continuing with analysis evidence."
- Read `{session_dir}/SESSION.md` -> currentMd
  Call `updateSession(currentMd, { appendToBody: 'WARNING: Repro Engineer failed. Continuing with analysis evidence.' })` from `bin/lib/session-manager.js`
  Write resulting sessionMd to `{session_dir}/SESSION.md`
- Continue to Step 4 (Repro is supplementary, does not block workflow)
## Step 4: Synthesize and render verdict
--- Step 4/5: Synthesize and render verdict ---
Spawn Agent `pd-fix-architect`:
  "Session dir: {absolute_session_dir}.
   Read ALL evidence files (evidence_janitor.md, evidence_code.md, evidence_docs.md, evidence_repro.md).
   Synthesize and render verdict. Write evidence_architect.md."
After agent completes:
1. Read `{session_dir}/evidence_architect.md`
2. Call `validateEvidence(content)` from `bin/lib/evidence-protocol.js` -> { valid, outcome }
3. Call `parseEvidence(content)` from `bin/lib/evidence-protocol.js` -> { frontmatter, body, sections }
### Routing by outcome:
Initialize roundNumber = 1 (default for first time). If returning to Step 4 after continuation, increment roundNumber by 1.
**IF outcome = 'root_cause':**
  1. Call `buildRootCauseMenu(content)` from `bin/lib/outcome-router.js`
     -> { question, choices } (3 choices: fix_now, fix_plan, self_fix)
  2. Display question and 3 choices to user (use direct question, DO NOT show agent output)
  3. User selects:
     - fix_now -> Call `prepareFixNow(content)` from `bin/lib/outcome-router.js`
       -> { action, reusableModules, evidence, suggestion, commitPrefix, warnings } -> Step 5
     - fix_plan -> Call `prepareFixPlan(content, sessionDir)` from `bin/lib/outcome-router.js`
       -> { planPath, planContent }
       Write planContent to {session_dir}/FIX-PLAN.md (planPath already contains full path from prepareFixPlan). Notify: "Fix plan created at {planPath}."
       Read `{session_dir}/SESSION.md` -> currentMd
       Call `updateSession(currentMd, { status: 'paused' })` from `bin/lib/session-manager.js`
       Write result to `{session_dir}/SESSION.md`. STOP workflow.
     - self_fix -> Call `prepareSelfFix(content)` from `bin/lib/outcome-router.js`
       -> { action, sessionUpdate, summary, filesForReview, resumeHint, warnings }
       Display summary, filesForReview and resumeHint to user.
       Read `{session_dir}/SESSION.md` -> currentMd
       Call `updateSession(currentMd, { status: 'paused' })` from `bin/lib/session-manager.js`
       Write result to `{session_dir}/SESSION.md`. STOP workflow.
**IF outcome = 'checkpoint':**
  1. Call `extractCheckpointQuestion(content)` from `bin/lib/checkpoint-handler.js`
     -> { question, context }
  2. Display question to user, wait for answer
  3. User answers -> Call `buildContinuationContext({ evidencePath: '{session_dir}/evidence_architect.md', userAnswer, sessionDir: session_dir, currentRound: roundNumber, agentName: 'pd-fix-architect' })` from `bin/lib/checkpoint-handler.js`
     -> { canContinue, prompt, agentName, round, warnings }
  4. canContinue = true -> Re-spawn `pd-fix-architect` with continuation prompt. Return to beginning of Step 4.
  5. canContinue = false (exceeded MAX_CONTINUATION_ROUNDS = 2) ->
     Notify: "Exceeded 2 Q&A rounds. Human review needed."
     Read `{session_dir}/SESSION.md` -> currentMd
     Call `updateSession(currentMd, { status: 'paused' })` from `bin/lib/session-manager.js`
     Write result to `{session_dir}/SESSION.md`. STOP workflow.
**IF outcome = 'inconclusive':**
  1. Call `buildInconclusiveContext({ evidenceContent: content, userInputPath: null, sessionDir: session_dir, currentRound })` from `bin/lib/outcome-router.js`
     - currentRound: read from SESSION.md body — count "## Round" headings + 1 (default 1 if no headings)
     -> { eliminationLog, canContinue, prompt, warnings }
  2. Display Elimination Log to user
  3. IF canContinue = false (reached 3 rounds):
     Notify: "Investigated 3 rounds. Here is the complete Elimination Log:\n{eliminationLog}"
     Read `{session_dir}/SESSION.md` -> currentMd
     Call `updateSession(currentMd, { status: 'paused' })` from `bin/lib/session-manager.js`
     Write result to `{session_dir}/SESSION.md`. STOP workflow.
  4. IF canContinue = true:
     Ask user for additional information via direct question (free-text)
     Write response to `{session_dir}/user_input_round_{currentRound}.md`
     Read `{session_dir}/SESSION.md` -> currentMd
     Call `updateSession(currentMd, { appendToBody: '\n## Round ' + currentRound + ': INCONCLUSIVE\n' })` from `bin/lib/session-manager.js`
     Write result to `{session_dir}/SESSION.md`
     Display banner: "--- Round {currentRound}/3: Investigating further with new information ---"
     Return to Step 2 (spawn Detective + DocSpec with new context from prompt)
Architect FAIL (agent throw/timeout):
- Display all collected evidence (janitor, detective, docs, repro) directly to user
- Ask: "Architect did not render a verdict. Would you like to: (1) Review evidence and decide, (2) Stop?"
- User selects (1) -> display evidence, let user decide fix_now/fix_plan/self_fix
  If fix_now -> manually create evidence and suggestion from evidence files -> Step 5
- User selects (2) -> Read `{session_dir}/SESSION.md` -> currentMd
  Call `updateSession(currentMd, { status: 'paused' })`. Write result. STOP workflow.
## Step 5: Fix code and commit
--- Step 5/5: Fix code and commit ---
### 5a: Regression analysis (before fixing)
1. Read evidence and suggestion from prepareFixNow() (Step 4) -> parse targetFiles and targetFunction from evidence content
2. Try:
   - Use FastCode `code_qa`: "List files that import or call {targetFunction} in {targetFile}"
   - Success -> call `analyzeFromCallChain({ callChainText, targetFile, targetFunction })` from `bin/lib/regression-analyzer.js`
   - FastCode error -> read source files around targetFile -> call `analyzeFromSourceFiles({ sourceFiles, targetFile, targetFunction })` from `bin/lib/regression-analyzer.js`
   Catch: WARNING: "Could not analyze regression: {error.message}". Continue.
3. Result affectedFiles -> Read `{session_dir}/SESSION.md` -> currentMd
   Call `updateSession(currentMd, { appendToBody: 'Regression: {N} affected files: {list}' })` from `bin/lib/session-manager.js`
   Write result to `{session_dir}/SESSION.md`
### 5b: Fix code
1. Read evidence and suggestion from prepareFixNow() output — evidence contains proof, suggestion contains fix proposal
2. Apply fix per guidance
3. Run tests: determine test command from project (package.json scripts or .planning rules)
4. Test FAIL -> read error, adjust fix, rerun (max 3 times)
5. Test PASS -> continue to 5c
### 5c: Debug cleanup (before commit)
1. `git diff --cached --name-only` -> list of staged files
2. Read content of each staged file -> create array [{path, content}]
3. Try: call `scanDebugMarkers(stagedFiles)` from `bin/lib/debug-cleanup.js`
   Catch: WARNING: "Debug cleanup error: {error.message}". Continue.
4. Result has markers -> display list by file:
   ```
   [PD-DEBUG] Found debug markers:
     {file}: Line {line}: {content}
   Remove all debug markers? (Y/n)
   ```
   User Y -> remove markers, git add files again
   User n -> WARNING: "Debug markers still present in commit."
5. Try: read `.planning/scan/SCAN_REPORT.md` (if exists and < 7 days old)
   -> call `matchSecurityWarnings(reportContent, filePaths)` from `bin/lib/debug-cleanup.js`
   Catch: skip.
   Has warnings -> display non-blocking (max 3):
   ```
   Related security warnings:
   - {file}: [{severity}] {message}
   ```
### 5d: Commit
```
git add {fixed files} {session_dir}/SESSION.md {session_dir}/evidence_*.md
git commit -m "fix([BUG]): {short_description}"
```
### 5e: User verify (per D-10)
Ask: "Fixed {description}. Please check and confirm."
**User confirms FIXED:**
  1. Glob `.planning/bugs/BUG-*.md` -> parse number from each filename (e.g.: BUG-003.md -> {number: 3}) -> create existingBugs array
  2. Call `createBugRecord({ existingBugs, file: targetFile, functionName: targetFunction, errorMessage: originalError, rootCause, fix: fixDescription, sessionId: folderName })` from `bin/lib/bug-memory.js`
     -> bugRecord (object with { id, fileName, content, number })
  3. Write bugRecord.content to `.planning/bugs/${bugRecord.fileName}`
  3. Glob `.planning/bugs/BUG-*.md` -> Read all
     For each BUG-*.md file:
       - Call `parseFrontmatter(content)` from `bin/lib/utils.js` -> { frontmatter }
       - Parse number from filename (e.g.: BUG-003.md -> 'BUG-003')
       - Construct object: { id: 'BUG-003', frontmatter: parsed.frontmatter }
     Create bugRecords array from all objects above
     Call `buildIndex(bugRecords)` from `bin/lib/bug-memory.js` -> indexMd
     Write indexMd to `.planning/bugs/INDEX.md`
  4. Read `{session_dir}/SESSION.md` -> currentMd
     Call `updateSession(currentMd, { status: 'resolved' })` from `bin/lib/session-manager.js`
     Write result to `{session_dir}/SESSION.md`
  5. Git add and commit:
     ```
     git add .planning/bugs/BUG-{NNN}.md .planning/bugs/INDEX.md {session_dir}/SESSION.md
     git commit -m "fix([BUG]): record bug and close session {sessionId}"
     ```
**User confirms NOT FIXED:**
  - Collect additional new symptoms from user
  - Return to 5b with supplementary information
  - Max 3 times -> suggest: "Tried 3 times. Suggest: re-analyze from Step 2 or stop."
### 5f: Logic sync (non-blocking, AFTER successful user verify)
1. `git diff HEAD~1` -> diffText
2. Read `{session_dir}/SESSION.md` -> sessionContent
3. Read bug report just created (`.planning/bugs/BUG-{NNN}.md`) -> bugReportContent
4. Read `CLAUDE.md` -> claudeContent (if exists)
5. Glob `.planning/reports/*.md` -> reportContent (newest file, if any)
6. Try: call `runLogicSync({ diffText, bugReportContent, sessionContent, claudeContent, reportContent, planContents: [] })` from `bin/lib/logic-sync.js`
   -> { logicResult, reportResult, rulesResult, warnings }
   Catch: WARNING: "Logic sync error: {error.message}". DO NOT block.
7. logicResult?.hasLogicChange = true and reportResult !== null -> ask: "Update PDF? (Y/n)"
   Y -> `node bin/generate-pdf-report.js {reportPath}`
8. rulesResult?.suggestions?.length > 0 -> display rulesResult.suggestions and ask: "Add to CLAUDE.md? (Y/n)"
   Y -> append to CLAUDE.md, git add and commit:
   ```
   git add CLAUDE.md
   git commit -m "fix([BUG]): add rule from post-mortem"
   ```
</process>
<output>
**Create/Update:**
- Fixed source code
- `.planning/debug/` -- investigation session state
- Update `TASKS.md` if relevant
**Next step:** `$pd-what-next`
**Success when:**
- The user confirms the bug is fixed
- Related tests pass if they exist
- A `[BUG]` commit was created
**Common errors:**
- The bug cannot be reproduced -> ask the user for more information
- The issue is in a dependency -> update the package and verify the version
- MCP is not connected -> check Docker and configuration
</output>
<rules>
- All output MUST be in English.
- You MUST store investigation state in `.planning/debug/` for recovery.
- You MUST pass the gate check before changing code.
- You MUST repeat the loop until the user confirms success.
- You MUST NOT change code unrelated to the bug.
- Follow `.planning/rules/` (general + stack-specific)
- FORBIDDEN to read/display sensitive files (`.env`, `credentials.*`, `*.pem`, `*.key`, `*secret*`, `wp-config.php`)
- MUST spawn agents in correct order: Janitor -> Detective+DocSpec -> Repro -> Architect -> Fix
- MUST pass absolute session_dir path when spawning each agent
- MUST call validateEvidence() after each agent completes
- MUST handle all 3 outcomes after Step 4: root_cause, checkpoint, inconclusive
- MUST create bug record AFTER user verify (NOT before) — per D-10
- MUST close session AFTER bug record + INDEX rebuild — per D-11
- DO NOT show detailed agent output to user — only show banners and final results (progressive disclosure)
- DO NOT block workflow when DocSpec or Repro fail — only WARNING and continue
- ONLY STOP when: (1) Janitor fails with no symptoms, (2) Detective fails, (3) User chooses to stop
- Every v1.5 module call (debug-cleanup, logic-sync, regression-analyzer) MUST be wrapped in try/catch — errors only create WARNING
- Commit message format: `fix([BUG]): description` — per D-08
- Resuming old session -> read SESSION.md FIRST, do not start over
- DO NOT let agent spawn agent — only orchestrator (this workflow) spawns agents
</rules>
