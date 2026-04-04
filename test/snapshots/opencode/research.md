---
description: Automated research - classify internal vs external, collect evidence, verify, and cross-validate
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
---
<objective>
Research a single topic automatically: classify it as internal/external, run the Evidence Collector -> Fact Checker pipeline, and cross-validate when both types exist. After completion: display a summary of the results.
**After completion:** `/pd-what-next`
</objective>
<guards>
Stop and instruct the user if any of the following conditions fail:
- [ ] `.planning/CONTEXT.md` exists -> "Run `/pd-init` first."
- [ ] A research topic was provided -> "Please provide a topic to research."
      </guards>
<context>
User input: $ARGUMENTS
</context>
<required_reading>
Read .pdconfig → get SKILLS_DIR, then read the following files before starting:
(Claude Code: cat ~/.config/opencode/.pdconfig — other platforms: converter auto-converts paths)
Read before starting:
- [SKILLS_DIR]/references/conventions.md -> output rules, commit prefix
</required_reading>
<process>
## Step 1: Classify query
1. Get topic from $ARGUMENTS (full text user entered).
2. Determine absolute research directory: `path.resolve('.planning/research')`.
3. Classify topic:
   ```
   ROUTE=$(node bin/route-query.js "$TOPIC")
   ```
4. Display: `"Classified: [internal|external] research"`
5. Determine subdirectory: `{research_dir}/internal/` or `{research_dir}/external/`
## Step 2: Collect evidence
1. Spawn Agent `pd-evidence-collector` with prompt:
   ```
   Research directory: {absolute_research_dir}/{source_type}/.
   Topic: {topic}.
   Scope: {source_type}.
   Collect evidence from at least 2 independent sources and write files to the directory above.
   ```
2. After agent completes:
   - Find newest file in `{research_dir}/{source_type}/` directory (glob *.md, sort by modified time)
   - If file found -> save path as `collector_output_path`
   - If NO file found (Collector failed): display WARNING "Evidence Collector did not produce output. Continuing with Fact Checker — confidence will be LOW." Still continue Step 3. Set `collector_output_path = null`.
## Step 3: Verify and cross-validate
1. Spawn Agent `pd-fact-checker` with prompt:
   ```
   Research directory: {absolute_research_dir}.
   File to verify: {collector_output_path or "None — Evidence Collector failed. Mark confidence LOW."}.
   Topic: {topic}.
   Tasks:
   1. Verify the file above (if exists).
   2. Cross-validate: read INDEX.md in {absolute_research_dir}, find all files with similar topic in BOTH internal/ and external/ directories. If files found with same topic on both sides -> compare content, detect conflicts, write to "## Conflicts Detected" section in verification file. ONLY RECORD conflicts with evidence from both sides, DO NOT self-resolve.
   ```
2. After agent completes:
   - Read verification output file
   - Extract information: confidence level, number of claims verified, conflicts found
   - Display summary for user:
     ```
     === Research Results ===
     Topic: {topic}
     Classification: {internal|external}
     Confidence: {HIGH|MEDIUM|LOW}
     Claims verified: {N} claims
     Conflicts: {yes/no}
     Result file: {collector_output_path}
     Verification file: {checker_output_path}
     ```
## Step 4: Update INDEX.md
After Fact Checker completes (per D-01 — call only once at end of pipeline):
1. Run:
   ```
   node bin/update-research-index.js
   ```
2. Check output: script prints number of entries indexed.
3. Confirm `.planning/research/INDEX.md` exists and has content.
This step ensures:
- Strategy Injection (in write-code.md, plan.md) reads INDEX.md successfully instead of silent fallback
- Fact Checker cross-validate on NEXT run will have INDEX.md to find files with same topic
</process>
<output>
**Create/Update:**
- Research file in `.planning/research/internal/` or `external/`
- Verification file from Fact Checker
- `INDEX.md` updated
- `AUDIT_LOG.md` updated
**Next step:** `/pd-what-next`
**Success when:**
- The research file has complete frontmatter
- Fact Checker has verified the findings
- A summary is shown to the user
**Common errors:**
- The topic cannot be classified -> default to external
- Evidence Collector cannot find sources -> continue with confidence LOW
- MCP is not connected -> check configuration
  </output>
<rules>
- All output MUST be in English
- You MUST run the full pipeline: route -> collect -> verify
- DO NOT skip Fact Checker when Collector fails - run it with confidence LOW
- ONLY orchestrator spawns agents — agents DO NOT spawn other agents
- MUST pass absolute paths when spawning agents
- DO NOT block when Evidence Collector fails — continue with Fact Checker
- DO NOT ask user during pipeline — run seamlessly
- Cross-validate automatically when Fact Checker finds files with same topic
- When conflicts detected: record with evidence from both sides, DO NOT self-resolve
- MUST run `node bin/update-research-index.js` AFTER Fact Checker completes — INDEX.md reflects verified state
- [ ] INDEX.md is created/updated after each pipeline run
- All output MUST be in English
</rules>
<script type="error-handler">
const { createBasicErrorHandler } = require('../../../bin/lib/basic-error-handler');
// Create error handler for research skill
const errorHandler = createBasicErrorHandler('pd:research', '$CURRENT_PHASE', {
  operation: 'research'
});
// Export for skill executor
module.exports = { errorHandler };
</script>
