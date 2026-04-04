---
description: OWASP security audit - dispatch 13 scanners in parallel and consolidate the report
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - mcp__fastcode__code_qa
  - SubAgent
---
<objective>
Run a comprehensive security audit based on the OWASP Top 10. Dispatch 13 scanners in parallel (2 per wave), consolidate the report, and perform cross-analysis.
</objective>
<guards>
Automatically detect the operating mode BEFORE running guards:
1. Check whether `.planning/PROJECT.md` exists (use Bash: `test -f .planning/PROJECT.md`)
2. Exists -> mode = "integrated": run all 3 guards below
3. Missing -> mode = "standalone": skip guard-context and run only the remaining 2 guards (guard-valid-path, guard-fastcode)
Stop and instruct the user if any guard fails:
@references/guard-context.md (integrated mode only)
- [ ] Path parameter valid (if provided) -> "Path does not exist or is not a directory."
- [ ] FastCode MCP connected and available (soft check) → If unavailable: warn "FastCode unavailable — using Grep/Read fallback (slower)." **Do NOT stop — continue with fallback.**
</guards>
<context>
User input: $ARGUMENTS
</context>
<process>
## Step 1: Detect mode
Automatically detect operating mode:
1. Run: `test -f .planning/PROJECT.md`
2. Exists → mode = "integrated", output_dir = ".planning/audit/"
3. Does not exist → mode = "standalone", output_dir = "./"
4. Create session dir: `/tmp/pd-audit-{hash}/` where hash = md5 of scanPath + Date.now()
   ```bash
   SESSION_HASH=$(node -e "console.log(require('crypto').createHash('md5').update('${SCAN_PATH}' + Date.now()).digest('hex').slice(0,8))")
   SESSION_DIR="/tmp/pd-audit-${SESSION_HASH}"
   mkdir -p "$SESSION_DIR"
   ```
5. Write `{session_dir}/01-detect.md` with content: mode, output_dir, ISO timestamp
6. Log: "Mode: {mode} — output will be written to {output_dir}"
## Step 2: Delta-aware
Classify functions from prior session evidence to only re-scan what has changed.
1. Find prior evidence in output_dir:
   ```bash
   ls ${OUTPUT_DIR}/evidence_sec_*.md 2>/dev/null
   ```
2. If NO prior evidence found:
   - delta_mode = "full-scan"
   - Log: "No prior session evidence found — running full scan"
   - Write `{session_dir}/02-delta.md` with: status=full-scan, reason="no prior evidence"
   - Move to Step 3
3. If prior evidence EXISTS:
   a. For EACH evidence file `evidence_sec_{cat}.md`:
      - Read file content using Read
      - Parse frontmatter to get commit_sha:
        ```bash
        node -e "const {parseFrontmatter}=require('./bin/lib/utils');const fm=parseFrontmatter(require('fs').readFileSync('${OUTPUT_DIR}/evidence_sec_${cat}.md','utf8'));console.log(fm.frontmatter.commit_sha||'')"
        ```
      - If commit_sha exists:
        ```bash
        git diff --name-only ${COMMIT_SHA}..HEAD
        ```
        Pass the result (file list) into changedFiles
      - If NO commit_sha (prior evidence from before Phase 49):
        Treat as full scan for this category — classifyDelta('', [])
   b. Call classifyDelta:
      ```bash
      node -e "
        const {classifyDelta}=require('./bin/lib/session-delta');
        const evidence=require('fs').readFileSync('${EVIDENCE_PATH}','utf8');
        const changed=${CHANGED_FILES_JSON};
        const result=classifyDelta(evidence, changed);
        // Convert Map to object for JSON output
        const fns=Object.fromEntries(result.functions);
        console.log(JSON.stringify({...result, functions: fns}));
      "
      ```
   c. Save classification results to `{session_dir}/02-delta.md`:
      - Per category: count of SKIP, RE-SCAN, KNOWN-UNFIXED functions
      - Total: delta_mode="delta", summary counts
4. Pass classification results to Step 5:
   - Step 5 dispatches scanner with additional context: list of functions to re-scan (RE-SCAN) and new functions (NEW)
   - SKIP and KNOWN-UNFIXED functions do not need re-scanning — scanner receives this list to skip them
## Step 3: Scope / parse args
Parse $ARGUMENTS:
1. **path** — path to scan, default "."
2. **--full** — run all 13 categories
3. **--only cat1,cat2** — run only specified categories + validate slugs
4. **--poc** — parse and save poc_enabled=true. This flag will be passed to Step 5 dispatch so scanners create a ## POC section in evidence.
5. **--auto-fix** — parse but report "Not supported in this version" (per D-04)
Get list of 13 valid slugs via Bash:
```bash
node -e "const {getAgentConfig}=require('./bin/lib/resource-config');console.log(JSON.stringify(getAgentConfig('pd-sec-scanner').categories))"
```
Determine categories_to_scan:
- --full → 13 categories, SKIP Step 4
- --only cat1,cat2 → validate slugs + ADD 3 base (secrets, misconfig, logging) + de-dup, SKIP Step 4 (per D-06, D-15). Invalid slug → warning and skip
- No flag → move to Step 4 Smart Selection
Write `{session_dir}/02-scope.md` with: scan_path, mode (full|only), categories list, flags (poc/auto-fix status), warnings
## Step 4: Smart selection
If --full or --only: SKIP this step (categories already set from Step 3).
No flag → run smart selection (this entire step does NOT spawn AI — only Bash/Glob/Grep):
1. **Gather project context:**
   a. Read package.json (if exists) → get deps:
      ```bash
      node -e "try{const p=JSON.parse(require('fs').readFileSync('package.json','utf8'));console.log(JSON.stringify([...Object.keys(p.dependencies||{}),...Object.keys(p.devDependencies||{})]))}catch(e){console.log('[]')}"
      ```
   b. Read requirements.txt (if exists) → get Python deps:
      ```bash
      grep -v '^#' requirements.txt 2>/dev/null | sed 's/[>=<].*//' | tr -d ' ' || echo ""
      ```
   c. Glob file extensions: check for existence of *.jsx, *.tsx, *.vue, *.svelte, *.php, *.ejs, *.pug, *.hbs
   d. Grep code patterns (3-4 grouped commands):
      - `grep -rl "req\.\(body\|params\|query\)" --include="*.js" --include="*.ts" . 2>/dev/null | head -1`
      - `grep -rl "child_process\|exec(\|spawn(" --include="*.js" --include="*.ts" . 2>/dev/null | head -1`
      - `grep -rl "createHash\|createCipher\|jwt\.sign" --include="*.js" --include="*.ts" . 2>/dev/null | head -1`
      - `grep -rl "app\.\(get\|post\|put\|delete\)(\|router\.\(get\|post\)" --include="*.js" --include="*.ts" . 2>/dev/null | head -1`
   e. Check lockfile: test -f package-lock.json || test -f yarn.lock || test -f pnpm-lock.yaml || test -f requirements.txt
2. **Call selectScanners():**
   ```bash
   node -e "
     const {selectScanners}=require('./bin/lib/smart-selection');
     const ctx={
       deps: $DEPS_JSON,
       fileExtensions: $EXTENSIONS_JSON,
       codePatterns: $CODE_PATTERNS_JSON,
       hasLockfile: $HAS_LOCKFILE
     };
     console.log(JSON.stringify(selectScanners(ctx)));
   "
   ```
3. **Process results:**
   a. If lowConfidence=false:
      - Log: "Smart Selection: {selected.length}/{13} scanners, {skipped.length} skipped"
      - Log each signal: "  - {signal.id}: {signal.description}"
      - Use selected as categories_to_scan
   b. If lowConfidence=true (< 2 signals — per D-05):
      - Display prompt:
        ```
        Smart Selection results:
          Signals found: {signals.length}/12
          {List each signal}
          Scanners to run ({selected.length}):
          {List selected, mark base}
          Scanners skipped ({skipped.length}): {list skipped}
          [1] Run {selected.length} selected scanners
          [2] Run --full (13 scanners)
        Choose (1/2):
        ```
      - If user chooses 1: use selected
      - If user chooses 2: use ALL_CATEGORIES (13)
      - If no interactive (cannot ask user): default run selected + log warning "Cannot ask user — running {selected.length} selected scanners"
4. **Write {session_dir}/03-selection.md** with:
   - status: completed
   - signals: [{id, description, categories}]
   - selected_categories: [...]
   - skipped_categories: [...]
   - lowConfidence: true/false
   - user_choice: (if lowConfidence=true)
## Step 5: Dispatch scanners
This is the main step — dispatch scanners in parallel 2/wave.
1. Get categories_to_scan from Step 3 (--full/--only) or Step 4 (smart selection)
2. Split categories into waves of 2 using buildScannerPlan logic:
   ```bash
   node -e "const {buildScannerPlan}=require('./bin/lib/parallel-dispatch');const plan=buildScannerPlan(categories, 2, scanPath);console.log(JSON.stringify(plan))"
   ```
   13 categories → 7 waves. Example: wave 1 = [sql-injection, xss], wave 2 = [cmd-injection, path-traversal], ...
3. Initialize variable `scanResults = []` to accumulate results from all waves (array of objects `{category, evidenceContent, error}`)
4. Agent pd-sec-scanner uses FastCode tool-first, Grep fallback (per D-14 Phase 46)
5. Create directory `{session_dir}/03-dispatch/` before dispatch:
   ```bash
   mkdir -p "${SESSION_DIR}/03-dispatch"
   ```
6. For EACH WAVE (sequential — previous wave MUST complete before starting next):
   a. Spawn up to 2 scanner agents IN PARALLEL using SubAgent tool:
      - Agent name: pd-sec-scanner (per D-12, from getAgentConfig)
      - Parameters for agent: `--category {slug} --path {scanPath}`
      - Prompt for each scanner: "Scan security category {slug} at path {scanPath}. Session dir: {session_dir}/03-dispatch/. Write evidence file to session dir.{if poc_enabled: ' --poc: Create ## POC section for each FAIL/FLAG finding.'}"
      - Tier: scout / Haiku (per D-13)
      - Each scanner reads references/security-rules.yaml and scans by category
   b. Wait for ALL scanners in wave to complete (backpressure per D-10)
   c. Collect results from each scanner:
      - Success → read evidence file output from scanner, add `{category, evidenceContent: <evidence content>, error: null}` to `scanResults`
      - Failure / timeout → add `{category, evidenceContent: null, error: <error message>}` to `scanResults`, DO NOT stop (per D-11 — failure isolation, write inconclusive)
   d. Write `{session_dir}/03-dispatch/{category}.md` for each scanner result
7. Log after each wave: "Wave {N}/{totalWaves} completed: {completed} successful, {failed} failed"
**IMPORTANT:** Wait for ALL scanners in wave to complete before starting next wave (backpressure per D-10). DO NOT dispatch all 13 scanners simultaneously.
## Step 5b: Update evidence metadata
After ALL dispatch waves complete (Step 5 done):
1. Get current commit SHA:
   ```bash
   CURRENT_SHA=$(git rev-parse --short HEAD)
   ```
2. For EACH new evidence file from Step 5 (in session_dir/03-dispatch/):
   a. Read evidence file content
   b. Add/update `commit_sha: ${CURRENT_SHA}` in YAML frontmatter:
      - If evidence has frontmatter (---...---): add commit_sha field
      - If not: create new frontmatter with commit_sha
   c. Call appendAuditHistory to add history line:
      ```bash
      node -e "
        const {appendAuditHistory}=require('./bin/lib/session-delta');
        const content=require('fs').readFileSync('${EVIDENCE_PATH}','utf8');
        const entry={
          date: new Date().toISOString().split('T')[0],
          commit: '${CURRENT_SHA}',
          verdictSummary: '${PASS_COUNT} PASS, ${FLAG_COUNT} FLAG, ${FAIL_COUNT} FAIL',
          deltaSummary: '${NEW_COUNT} new, ${RESCAN_COUNT} re-scan, ${SKIP_COUNT} skip'
        };
        const updated=appendAuditHistory(content, entry);
        require('fs').writeFileSync('${EVIDENCE_PATH}', updated);
      "
      ```
   d. Copy evidence file to output_dir (overwrite old file)
3. Log: "Evidence metadata updated: commit_sha=${CURRENT_SHA}, {N} files have audit history"
## Step 6: Reporter
Spawn pd-sec-reporter agent:
- Input: session_dir (contains all evidence files from Step 5 in 03-dispatch/)
- Prompt: "Synthesize security report from evidence files in {session_dir}/03-dispatch/. Write SECURITY_REPORT.md to {session_dir}/SECURITY_REPORT.md."
- Output: {session_dir}/SECURITY_REPORT.md
- Reporter reads all {session_dir}/03-dispatch/*.md and synthesizes into 1 report
If reporter fails: create a simple SECURITY_REPORT.md listing collected evidence files and basic statistics.
## Step 7: Analyze / merge
Use `scanResults` accumulated from Step 5 (array of `{category, evidenceContent, error}`). Pass to mergeScannerResults(scanResults) to synthesize:
1. Count completedCount (successful scanners), failedCount (failed/inconclusive scanners)
2. List categories with findings (FAIL/FLAG)
3. List clean categories (PASS)
4. List inconclusive categories (fail/timeout)
5. Write {session_dir}/04-analysis.md with: total_scanners, completed, failed, categories_with_findings, categories_clean, categories_inconclusive
6. Log summary statistics for user
## Step 8: Fix routing
Spawn pd-sec-fixer agent to analyze findings and create fix phase proposals.
1. Get agent config:
   ```bash
   node -e "const {getAgentConfig}=require('./bin/lib/resource-config');console.log(JSON.stringify(getAgentConfig('pd-sec-fixer')))"
   ```
2. Spawn pd-sec-fixer agent:
   - Input: session_dir (contains SECURITY_REPORT.md and evidence files)
   - Prompt: "Analyze SECURITY_REPORT.md and evidence files in {session_dir}. Create fix phase proposals. Mode: {mode}. Output dir: {output_dir}. Audit phase number: {current_phase_number}."
   - Agent reads SECURITY_REPORT.md + evidence files + gadget-chain-templates.yaml
   - Agent calls detectChains() and orderFixPriority() to determine fix order
3. Agent output:
   - Mode "integrated": display proposal, ask user to approve, if approved write to ROADMAP.md
   - Mode "standalone": write proposal to {session_dir}/fix-phases-proposal.md
4. Write {session_dir}/05-fix-routing.md with:
   - status: completed
   - mode: {mode}
   - chains_detected: {number of chains detected}
   - fix_phases_proposed: {number of fix phases proposed}
   - user_approved: {true/false} (integrated mode only)
5. If pd-sec-fixer fails: write {session_dir}/05-fix-routing.md with status=error, continue to Step 9 (do not block audit)
## Step 9: Save report
1. Read {session_dir}/SECURITY_REPORT.md (from Step 6)
2. Copy to output_dir (from Step 1):
   - mode "standalone" → ./SECURITY_REPORT.md
   - mode "integrated" → .planning/audit/SECURITY_REPORT.md (create .planning/audit/ directory if not exists using `mkdir -p`)
3. Log: "Security report saved at: {output_path}"
4. Print brief summary for user: number of findings by severity (CRITICAL/HIGH/MEDIUM/LOW), number of categories scanned, number of inconclusive categories (if any)
</process>
<output>
**Create:**
- SECURITY_REPORT.md (location depends on mode: standalone -> `./`, integrated -> `.planning/audit/`)
- Evidence files in a temp directory
**Next step:** Read SECURITY_REPORT.md to review the results
**Success when:**
- All scanners were dispatched and returned a result (or inconclusive)
- SECURITY_REPORT.md was created in the correct location
**Common errors:**
- FastCode MCP is not connected -> check that Docker is running
- SubAgent is unavailable -> check tool configuration for SubAgent access
</output>
<rules>
- All output MUST be in English.
- DO NOT modify project code - only scan and report.
- When `--poc` is passed: pass the `--poc` flag to the scanner in the B5 dispatch prompt.
- When `--auto-fix` is passed: report "Not supported in this version yet" and continue.
- All output MUST be in English
- DO NOT modify project code — scan and report only
- When --poc is passed: pass --poc flag to scanner in Step 5 dispatch prompt
- When --auto-fix is passed: report "Not supported in this version" and continue
- Previous wave MUST complete before starting next wave — follow backpressure
- Failed scanner writes inconclusive, does not stop the entire audit
</rules>
<script type="error-handler">
const { createAuditErrorHandler } = require('../../../bin/lib/enhanced-error-handler');
// Create error handler for audit skill
const errorHandler = createAuditErrorHandler('$CURRENT_PHASE', {
  auditType: 'security',
  scannersUsed: [],
  findingsCount: 0,
  sessionDelta: null
});
// Export for skill executor
module.exports = { errorHandler };
</script>
