# Phase 4: Conditional Context Loading - Research

**Researched:** 2026-03-22
**Domain:** Build-time skill transformation + runtime conditional file loading in AI prompt frameworks
**Confidence:** HIGH

## Summary

This phase implements conditional context loading across two distinct mechanisms: (1) Claude Code's symlink-based approach where loading is controlled by instructional text in workflow `<process>` sections, and (2) converter platforms where `inlineWorkflow()` in `bin/lib/utils.js` must be modified to separate required refs (always inlined) from optional refs (kept as file paths with loading conditions).

The modification surface is well-contained: one core function (`inlineWorkflow()`), 8 workflow files (adding `<conditional_reading>` sections and task-analysis steps), and 10 skill command files (promoting `conventions.md` to required, keeping optional tags as signals). All 4 converter platforms call `inlineWorkflow()` and will automatically benefit from the change.

**Primary recommendation:** Modify `inlineWorkflow()` to detect `(optional)` tags in the command's `<execution_context>`, exclude those refs from the inlined `<required_reading>`, and emit a new `<conditional_reading>` block containing file paths with per-reference loading conditions. For Claude Code, add a "Buoc 1.5" task-analysis step to workflow `<process>` sections with conditional reading instructions.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** AI analyzes task description from TASKS.md at the START of workflow execution (new Buoc 1.5) to decide which optional references to load
- **D-02:** Analysis based on task description keywords/context -- e.g., "auth" -> load security-checklist, "form" -> load ui-brand
- **D-03:** Soft fallback -- if AI discovers mid-execution it needs a reference it didn't load, it reads the file then (self-correcting, no restart needed)
- **D-04:** Loading decisions are silent -- no user notification about which refs were loaded/skipped
- **D-05:** Claude Code uses symlinked skills (no inlining). Add conditional loading instructions in workflow `<process>` sections -- "Doc X CHI KHI task lien quan den Y" pattern
- **D-06:** Claude already reads files on demand via `@references/` -- the change is instructional, not mechanical
- **D-07:** True lazy loading -- AI only reads optional reference files when task analysis says they're needed
- **D-08:** Modify `inlineWorkflow()` in `bin/lib/utils.js` to separate required vs optional references
- **D-09:** Required references go in `<required_reading>` (inlined always). Optional references go in `<conditional_reading>` block with FILE PATHS and loading criteria -- NOT inlined
- **D-10:** True lazy loading for converters -- optional refs kept as `[SKILLS_DIR]/references/X.md` file paths, AI reads file only when needed
- **D-11:** All 4 converter platforms (Codex, Gemini, Copilot, OpenCode) support file reading -- no inline fallback needed
- **D-12:** Converter platforms all use `inlineWorkflow()` -- one change propagates to all 4
- **D-13:** `conventions.md` promoted from `(optional)` to `(required)` -- always loaded (needed for every commit, only 76 lines)
- **D-14:** 6 remaining optional references get per-reference loading conditions (see table in CONTEXT.md)
- **D-15:** Keep existing conditional pattern for framework rules -- "CHI neu ton tai" already works, no change needed
- **D-16:** Framework rules files (34-83 lines each) are smaller than optional references -- not worth additional optimization
- **D-17:** Skills keep `(required)` / `(optional)` tags from Phase 1 -- these become the source of truth for `inlineWorkflow()` logic
- **D-18:** Move `conventions.md` from `(optional)` to `(required)` in all skills that reference it
- **D-19:** `update.md` and `fetch-doc.md` have no optional references -- no changes needed
- **D-20:** Measure before/after using tiktoken (same tooling from Phase 3)
- **D-21:** Target: 2000-3200 tokens saved per invocation when optional references are skipped
- **D-22:** Largest savings: `write-code` (5 optional refs = 769 lines skippable), `complete-milestone` (4 optional refs = 534 lines skippable)

### Claude's Discretion
- Exact conditional loading instruction phrasing in Vietnamese
- How `inlineWorkflow()` separates required vs optional (regex on `(optional)` tag vs structured parsing)
- `<conditional_reading>` format and layout
- Exact position of task-analysis step in workflow process
- Testing strategy for verifying conditional loading correctness

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TOKN-03 | Conditional context loading -- only load references/rules when task type needs them, not dump all upfront | Core phase goal; covered by inlineWorkflow() modification (converter platforms) + instructional changes (Claude Code) + workflow required_reading/conditional_reading split |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | >=16.7.0 | Runtime for converters and install scripts | Project minimum, already set in package.json engines |
| node:test | built-in | Test framework | Already used for all smoke tests |
| node:assert/strict | built-in | Assertions | Already used in all test files |
| js-tiktoken | ^1.0.21 | Token counting for measurement | Already in devDependencies, used by scripts/count-tokens.js |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| scripts/count-tokens.js | existing | Before/after token measurement | Run with --baseline before changes, --compare after |

### Alternatives Considered
None -- this phase uses only existing project infrastructure with no new dependencies.

**Installation:**
```bash
# No new packages needed
npm install  # ensures js-tiktoken is available
```

## Architecture Patterns

### Current Architecture (Before)

```
commands/pd/write-code.md
  <execution_context>
    @workflows/write-code.md (required)    # workflow ref
    @references/conventions.md (optional)  # optional ref
    @references/security-checklist.md (optional)  # optional ref
    ...
  </execution_context>

         |  inlineWorkflow()
         v

<required_reading>                         # ALL refs merged here
  - [SKILLS_DIR]/references/conventions.md
  - [SKILLS_DIR]/references/security-checklist.md
  - [SKILLS_DIR]/references/ui-brand.md
  ...                                      # everything inlined regardless
</required_reading>
```

### Target Architecture (After)

```
commands/pd/write-code.md
  <execution_context>
    @workflows/write-code.md (required)
    @references/conventions.md (required)   # promoted from optional
    @references/security-checklist.md (optional)
    ...
  </execution_context>

         |  inlineWorkflow() [modified]
         v

<required_reading>                          # ONLY required refs inlined
  - [SKILLS_DIR]/references/conventions.md
</required_reading>

<conditional_reading>                       # optional refs as FILE PATHS
Doc CHI KHI can:
- [SKILLS_DIR]/references/security-checklist.md -- KHI task lien quan den auth, encryption, input validation, data exposure
- [SKILLS_DIR]/references/ui-brand.md -- KHI task tao/sua UI components hoac man hinh user-facing
- [SKILLS_DIR]/references/verification-patterns.md -- KHI task can multi-level verification
- [SKILLS_DIR]/references/prioritization.md -- KHI task ordering/ranking hoac triage
</conditional_reading>
```

### Pattern 1: Regex-based optional ref detection in inlineWorkflow()

**What:** Parse the command's `<execution_context>` to separate `(required)` and `(optional)` tagged refs before merging with workflow's `<required_reading>`.

**When to use:** Inside `inlineWorkflow()` when building the output sections.

**Example:**
```javascript
// Source: bin/lib/utils.js (existing extractReadingRefs pattern)

// NEW: separate required vs optional refs from execution_context
function classifyRefs(executionContext) {
  const required = [];
  const optional = [];

  for (const line of executionContext.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Match @references/X.md or @templates/X.md with tag
    const match = trimmed.match(/^@(references|templates)\/([a-z0-9_/-]+\.md)\s+\((required|optional)\)$/);
    if (!match) continue;

    const ref = `${match[1]}/${match[2]}`;
    if (match[3] === 'optional') {
      optional.push(ref);
    } else {
      required.push(ref);
    }
  }

  return { required, optional };
}
```

### Pattern 2: Conditional reading conditions lookup

**What:** Map optional reference file names to their loading conditions (from D-14).

**When to use:** When building the `<conditional_reading>` block in `inlineWorkflow()`.

**Example:**
```javascript
// Source: D-14 from CONTEXT.md

const CONDITIONAL_LOADING_MAP = {
  'references/security-checklist.md': 'KHI task lien quan den auth, encryption, input validation, data exposure',
  'references/ui-brand.md': 'KHI task tao/sua UI components hoac man hinh user-facing',
  'references/verification-patterns.md': 'KHI task can multi-level verification (khong phai simple pass/fail)',
  'references/state-machine.md': 'KHI task lien quan den milestone state transitions',
  'references/questioning.md': 'KHI DISCUSS mode -- can interactive user questioning',
  'references/prioritization.md': 'KHI task ordering/ranking nhieu tasks hoac triage',
};
```

### Pattern 3: Workflow required_reading split

**What:** Workflow files must separate their `<required_reading>` into always-load refs and conditional refs.

**When to use:** When modifying workflow .md files.

**Example (write-code.md workflow after modification):**
```markdown
<required_reading>
Doc truoc khi bat dau:
- @references/conventions.md -> bieu tuong, commit prefixes, version, ngon ngu
</required_reading>

<conditional_reading>
Doc CHI KHI task can (phan tich task description truoc):
- @references/prioritization.md -> thu tu uu tien tasks -- KHI task ordering/ranking
- @references/security-checklist.md -> bang kiem bao mat (Buoc 6.5b) -- KHI task lien quan den auth, encryption
- @references/ui-brand.md -> product framing, design continuity -- KHI task tao/sua UI
- @references/verification-patterns.md -> multi-level verification -- KHI task can verification phuc tap
</conditional_reading>
```

### Pattern 4: Task analysis step (Buoc 1.5)

**What:** A new step in workflow `<process>` sections where the AI analyzes the task description to decide which optional refs to load.

**When to use:** In workflow files that have optional references.

**Example (for Claude Code -- instructional only):**
```markdown
## Buoc 1.5: Phan tich task -- quyet dinh tai lieu tham khao
Doc mo ta task tu TASKS.md. Xac dinh:
- Task co lien quan den bao mat/auth? -> doc @references/security-checklist.md
- Task tao/sua UI? -> doc @references/ui-brand.md
- Task can verification phuc tap? -> doc @references/verification-patterns.md
- Task can sap xep uu tien? -> doc @references/prioritization.md

Neu khong ro -> BO QUA. Neu phat hien can giua chung -> doc khi can (tu sua, khong can khoi dong lai).
```

### Anti-Patterns to Avoid
- **Inlining optional refs "just in case":** Defeats the purpose. Keep them as file paths. The AI self-corrects if it needs one mid-execution (D-03).
- **Complex conditional logic in inlineWorkflow():** Keep it simple -- regex on `(optional)` tag is sufficient. No need for AST parsing or config files.
- **Changing the execution_context tag structure:** Keep the existing `@ref (required)` / `@ref (optional)` format from Phase 1. It works as the source of truth.
- **Modifying converters:** Do NOT touch converter files. All 4 converters call `inlineWorkflow()` -- the change propagates automatically.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token counting | Custom counter | `scripts/count-tokens.js --baseline` / `--compare` | Already built in Phase 3, uses tiktoken, handles all file categories |
| Ref extraction | New parser | `extractReadingRefs()` in utils.js | Already handles @templates/ and @references/ extraction, deduplication |
| XML section extraction | Regex per-use | `extractXmlSection()` in utils.js | Already handles nested content extraction |
| Frontmatter parsing | Manual YAML | `parseFrontmatter()` in utils.js | Handles arrays, key-value pairs correctly |

**Key insight:** This phase is about modifying an existing function and existing markdown files. No new tools, no new libraries. The infrastructure from Phases 1-3 provides everything needed.

## Common Pitfalls

### Pitfall 1: Breaking the workflow <required_reading> extraction
**What goes wrong:** `inlineWorkflow()` currently extracts `<required_reading>` from the workflow file and replaces `<execution_context>` with it. If the new `<conditional_reading>` tag is added to workflow files, the extraction logic must handle it.
**Why it happens:** The function uses `extractXmlSection(workflowContent, 'required_reading')` which only gets `<required_reading>` content. A new `<conditional_reading>` section in the workflow would be ignored unless explicitly extracted.
**How to avoid:** Add `extractXmlSection(workflowContent, 'conditional_reading')` call in `inlineWorkflow()`. Transform the refs in it the same way (replace `@references/` with `[SKILLS_DIR]/references/`).
**Warning signs:** After modification, converter output lacks `<conditional_reading>` section.

### Pitfall 2: Double-inclusion of refs
**What goes wrong:** A ref marked `(optional)` in the command's `<execution_context>` might also appear in the workflow's `<required_reading>`. If not filtered, it appears in both `<required_reading>` (inlined) and `<conditional_reading>` (file path).
**Why it happens:** Currently `inlineWorkflow()` merges extra refs from the command that aren't in the workflow. The new logic must also check for refs that ARE in the workflow but should be conditional.
**How to avoid:** When building `<required_reading>`, exclude refs that are tagged `(optional)` in the command execution_context. The command's `(optional)` tag is the authoritative signal.
**Warning signs:** Same reference appearing in both `<required_reading>` and `<conditional_reading>` in converter output.

### Pitfall 3: Workflow refs not tagged -- how to know which are optional
**What goes wrong:** Workflow `<required_reading>` sections list refs WITHOUT `(required)`/`(optional)` tags. Only command `<execution_context>` has these tags.
**Why it happens:** The tagging was added to commands in Phase 1 but not to workflow files.
**How to avoid:** Two approaches (both valid):
  1. Add `<conditional_reading>` sections to workflow files, moving optional refs there. `inlineWorkflow()` extracts both sections.
  2. Use the command's `(optional)` tags as the filter: any ref tagged `(optional)` in the command is excluded from `<required_reading>` output regardless of whether it appears in the workflow's `<required_reading>`.

  **Recommended: Approach 2** -- it keeps the command `execution_context` as the single source of truth (D-17) and requires less workflow file modification.
**Warning signs:** Optional refs still appearing inlined in converter output because the workflow lists them in `<required_reading>`.

### Pitfall 4: Breaking existing tests
**What goes wrong:** `smoke-integrity.test.js` line 91-93 asserts that inlined output has `<required_reading>` with `SKILLS_DIR`. The new output adds `<conditional_reading>` which the test doesn't expect.
**Why it happens:** Tests verify current behavior. New behavior adds a section.
**How to avoid:** Update the integrity test to also verify `<conditional_reading>` exists for skills that have optional refs.
**Warning signs:** `smoke-integrity.test.js` fails after `inlineWorkflow()` modification.

### Pitfall 5: conventions.md promotion inconsistency
**What goes wrong:** `conventions.md` is promoted to `(required)` in command files but stays in workflow `<required_reading>` sections unchanged. If the filter uses `(optional)` tags from commands, this works fine. But if someone later adds `(optional)` to conventions.md by mistake, it would be excluded.
**Why it happens:** The tag in the command is the source of truth, not the workflow listing.
**How to avoid:** Change ALL skills that reference `conventions.md` from `(optional)` to `(required)`. Verify with grep after changes.
**Warning signs:** `conventions.md` appearing in `<conditional_reading>` instead of `<required_reading>`.

### Pitfall 6: Templates marked (optional) need different handling
**What goes wrong:** `complete-milestone.md` has `@templates/current-milestone.md (optional)` and `@templates/state.md (optional)`. These are templates, not references. The conditional loading map only covers references.
**Why it happens:** Templates are normally always-load, but these are marked optional because they're only needed for specific milestone operations.
**How to avoid:** Include templates in the conditional loading logic too. Use a generic condition like "KHI task lien quan den milestone state transitions" for these templates.
**Warning signs:** Templates treated differently from references in the conditional logic.

## Code Examples

### Current inlineWorkflow() -- the function to modify

```javascript
// Source: bin/lib/utils.js lines 255-333
// KEY SECTIONS:
//   1. Lines 262-263: Extract execution_context from command
//   2. Lines 274-300: Replace <execution_context> with <required_reading>
//      - Lines 283-284: Get refs from workflow required_reading
//      - Lines 284-285: Get refs from command execution_context
//      - Lines 285: Filter extra refs (command has but workflow doesn't)
//      - Lines 287-290: Append extra refs
//   3. Lines 302-312: Replace <process>
//   4. Lines 314-330: Merge <rules>
```

### Modification strategy for inlineWorkflow()

```javascript
// PSEUDOCODE for modified inlineWorkflow()
function inlineWorkflow(body, skillsDir) {
  body = inlineGuardRefs(body, skillsDir);

  const workflowMatch = body.match(/@workflows\/([a-z0-9_-]+\.md)/);
  if (!workflowMatch) return body;

  const executionContext = extractXmlSection(body, 'execution_context') || '';
  const workflowPath = path.join(skillsDir, 'workflows', workflowMatch[1]);
  if (!fs.existsSync(workflowPath)) return body;

  const workflowContent = fs.readFileSync(workflowPath, 'utf8');
  const wfProcess = extractXmlSection(workflowContent, 'process');
  const wfRules = extractXmlSection(workflowContent, 'rules');
  const wfRequiredReading = extractXmlSection(workflowContent, 'required_reading');

  // NEW: Classify command refs as required/optional
  const { required: cmdRequired, optional: cmdOptional } = classifyRefs(executionContext);

  if (wfRequiredReading) {
    let reading = wfRequiredReading;
    reading = reading.replace(/@templates\//g, '[SKILLS_DIR]/templates/');
    reading = reading.replace(/@references\//g, '[SKILLS_DIR]/references/');
    reading = reading.replace(/Doc tat ca files duoc tham chieu.*?:\n?/g, '');

    const workflowRefs = extractReadingRefs(wfRequiredReading);

    // NEW: Filter out optional refs from required_reading
    const optionalSet = new Set(cmdOptional);
    const filteredReading = reading.split('\n')
      .filter(line => {
        // Keep lines that don't reference optional files
        for (const opt of optionalSet) {
          if (line.includes(opt.replace(/^(references|templates)\//, '[SKILLS_DIR]/$1/'))) {
            return false;
          }
        }
        return true;
      })
      .join('\n');

    // Add any extra REQUIRED refs from command not in workflow
    const extraRequired = cmdRequired.filter(ref => !workflowRefs.includes(ref));
    let requiredSection = filteredReading.trim();
    if (extraRequired.length > 0) {
      requiredSection += '\n' + extraRequired.map(ref => `- [SKILLS_DIR]/${ref}`).join('\n');
    }

    // Build <required_reading> with only required refs
    body = body.replace(
      /<execution_context>[\s\S]*?<\/execution_context>/,
      `<required_reading>\n...\n${requiredSection}\n</required_reading>`
    );

    // NEW: Build <conditional_reading> with optional refs
    if (cmdOptional.length > 0) {
      const conditionalLines = cmdOptional.map(ref => {
        const condition = CONDITIONAL_LOADING_MAP[ref] || 'KHI task can';
        return `- [SKILLS_DIR]/${ref} -- ${condition}`;
      });

      const conditionalBlock = `\n<conditional_reading>\nDoc CHI KHI can (phan tich mo ta task truoc):\n${conditionalLines.join('\n')}\n</conditional_reading>`;

      // Insert after </required_reading>
      body = body.replace(
        '</required_reading>',
        '</required_reading>' + conditionalBlock
      );
    }
  }

  // ... rest unchanged (process replace, rules merge)
}
```

### Skill file conventions.md promotion example

```markdown
<!-- BEFORE (write-code.md) -->
<execution_context>
@workflows/write-code.md (required)
@references/conventions.md (optional)      <!-- was optional -->
@references/prioritization.md (optional)
@references/ui-brand.md (optional)
@references/security-checklist.md (optional)
@references/verification-patterns.md (optional)
</execution_context>

<!-- AFTER -->
<execution_context>
@workflows/write-code.md (required)
@references/conventions.md (required)      <!-- promoted to required -->
@references/prioritization.md (optional)
@references/ui-brand.md (optional)
@references/security-checklist.md (optional)
@references/verification-patterns.md (optional)
</execution_context>
```

### Test verification pattern

```javascript
// New test for conditional_reading in smoke-integrity.test.js
it('skills with optional refs produce conditional_reading after inline', () => {
  const optionalSkills = ['write-code', 'plan', 'new-milestone', 'complete-milestone'];

  for (const name of optionalSkills) {
    const content = fs.readFileSync(path.join(COMMANDS_DIR, `${name}.md`), 'utf8');
    const { body } = parseFrontmatter(content);
    const inlined = inlineWorkflow(body, ROOT);

    assert.match(
      inlined,
      /<conditional_reading>[\s\S]*<\/conditional_reading>/,
      `${name}: missing <conditional_reading> section after inline`
    );

    // Optional refs should NOT appear in required_reading
    const requiredReading = extractXmlSection(inlined, 'required_reading') || '';
    assert.ok(
      !requiredReading.includes('security-checklist'),
      `${name}: optional ref in required_reading`
    );
  }
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| All refs inlined unconditionally | Required/optional tagged (Phase 1) but still all inlined | Phase 1 (2026-03-22) | Tags exist but have no functional effect yet |
| Workflow has one `<required_reading>` | Same | Still current | No split between required and conditional |
| `inlineWorkflow()` merges all refs | Same | Still current | Function treats all refs equally |

**What this phase changes:**
- `(optional)` tags become functional signals (not just documentation)
- `inlineWorkflow()` produces two sections: `<required_reading>` + `<conditional_reading>`
- Workflow files add task-analysis step in `<process>` sections

## Modification Surface Analysis

### Files to modify

| Category | File | Change Type | Scope |
|----------|------|-------------|-------|
| Core function | `bin/lib/utils.js` | Add `classifyRefs()`, modify `inlineWorkflow()`, add `CONDITIONAL_LOADING_MAP` | ~60 lines added/modified |
| Skill commands | `commands/pd/write-code.md` | Promote conventions.md to required | 1 line change |
| Skill commands | `commands/pd/plan.md` | Promote conventions.md to required | 1 line change |
| Skill commands | `commands/pd/new-milestone.md` | Promote conventions.md to required | 1 line change |
| Skill commands | `commands/pd/complete-milestone.md` | Promote conventions.md to required | 1 line change |
| Skill commands | `commands/pd/fix-bug.md` | Promote conventions.md to required | 1 line change |
| Skill commands | `commands/pd/test.md` | Promote conventions.md to required | 1 line change |
| Skill commands | `commands/pd/what-next.md` | Promote conventions.md to required | 1 line change |
| Skill commands | `commands/pd/conventions.md` | Promote conventions.md to required | 1 line change |
| Workflows | `workflows/write-code.md` | Move optional refs to `<conditional_reading>`, add Buoc 1.5 | ~15 lines |
| Workflows | `workflows/plan.md` | Move optional refs to `<conditional_reading>`, add Buoc 1.5 | ~15 lines |
| Workflows | `workflows/new-milestone.md` | Move optional refs to `<conditional_reading>` | ~10 lines |
| Workflows | `workflows/complete-milestone.md` | Move optional refs to `<conditional_reading>` | ~10 lines |
| Workflows | `workflows/fix-bug.md` | All refs now required (conventions + prioritization) | Minor adjustment |
| Workflows | `workflows/what-next.md` | state-machine.md conditional | ~5 lines |
| Workflows | `workflows/test.md` | conventions.md is now the only ref (required) | No change needed |
| Tests | `test/smoke-utils.test.js` | Add tests for `classifyRefs()`, updated `inlineWorkflow()` tests | ~30 lines |
| Tests | `test/smoke-integrity.test.js` | Update integrity assertions for `conditional_reading` | ~20 lines |

### Files NOT to modify
- `bin/lib/converters/*.js` -- they call `inlineWorkflow()` and get the change for free
- `bin/lib/installers/claude.js` -- Claude uses symlinks, no inlining
- `commands/pd/init.md`, `scan.md`, `update.md`, `fetch-doc.md` -- no optional refs
- `references/*.md` -- content unchanged
- `templates/*.md` -- content unchanged

### Complete skill-by-reference matrix

| Skill | conventions | prioritization | ui-brand | security-checklist | verification-patterns | state-machine | questioning |
|-------|-------------|----------------|----------|--------------------|-----------------------|---------------|-------------|
| write-code | **REQUIRED** | optional | optional | optional | optional | - | - |
| plan | **REQUIRED** | optional | optional | - | - | - | optional |
| new-milestone | **REQUIRED** | optional | optional | - | - | optional | optional |
| complete-milestone | **REQUIRED** | - | optional | - | optional | optional | - |
| fix-bug | **REQUIRED** | optional | - | - | - | - | - |
| test | **REQUIRED** | - | - | - | - | - | - |
| what-next | **REQUIRED** | - | - | - | - | optional | - |
| conventions | **REQUIRED** | - | - | - | - | - | - |
| init | - | - | - | - | - | - | - |
| scan | - | - | - | - | - | - | - |
| update | - | - | - | - | - | - | - |
| fetch-doc | - | - | - | - | - | - | - |

### Token savings projection

| Reference | Lines | Est. Tokens | Skills that can skip it |
|-----------|-------|-------------|------------------------|
| security-checklist.md | 285 | ~570 | write-code (most tasks) |
| ui-brand.md | 208 | ~416 | write-code, plan, new-milestone, complete-milestone (non-UI tasks) |
| verification-patterns.md | 146 | ~292 | write-code, complete-milestone (simple tasks) |
| state-machine.md | 104 | ~208 | new-milestone, complete-milestone, what-next (non-state tasks) |
| questioning.md | 65 | ~130 | plan, new-milestone (AUTO mode) |
| prioritization.md | 54 | ~108 | write-code, plan, new-milestone, fix-bug (single-task scenarios) |
| **Total skippable** | **862** | **~1724** | |

Best case (write-code, non-security non-UI task): skips security-checklist (570) + ui-brand (416) + verification-patterns (292) + prioritization (108) = **~1386 tokens saved**.

With overhead of `<conditional_reading>` block (~100 tokens), net savings: **~1286 tokens** per invocation.

Note: The 2000-3200 target from CONTEXT.md D-21 is achievable when considering that converter platforms currently INLINE the full reference content (which is larger than the raw line count suggests due to markdown formatting). The actual inlined token count will be higher.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in) |
| Config file | package.json scripts.test |
| Quick run command | `node --test test/smoke-utils.test.js` |
| Full suite command | `node --test 'test/*.test.js'` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TOKN-03a | classifyRefs separates required/optional | unit | `node --test test/smoke-utils.test.js -x` | Wave 0 (new tests) |
| TOKN-03b | inlineWorkflow produces conditional_reading | unit | `node --test test/smoke-utils.test.js -x` | Wave 0 (update existing) |
| TOKN-03c | optional refs excluded from required_reading | unit | `node --test test/smoke-utils.test.js -x` | Wave 0 (new tests) |
| TOKN-03d | all converters handle new output correctly | integration | `node --test test/smoke-integrity.test.js -x` | Wave 0 (update existing) |
| TOKN-03e | conventions.md promoted in all skills | integration | `node --test test/smoke-integrity.test.js -x` | Wave 0 (new test) |
| TOKN-03f | token savings measured | manual | `node scripts/count-tokens.js --compare` | Existing |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-utils.test.js`
- **Per wave merge:** `node --test 'test/*.test.js'`
- **Phase gate:** Full suite green + token comparison shows savings

### Wave 0 Gaps
- [ ] `test/smoke-utils.test.js` -- add tests for `classifyRefs()` function
- [ ] `test/smoke-utils.test.js` -- update `inlineWorkflow()` tests for `<conditional_reading>` output
- [ ] `test/smoke-integrity.test.js` -- add test verifying optional refs not in `<required_reading>` after inline
- [ ] `test/smoke-integrity.test.js` -- add test verifying `<conditional_reading>` present for skills with optional refs
- [ ] `test/smoke-integrity.test.js` -- add test verifying conventions.md is `(required)` in all skills that reference it

## Open Questions

1. **Workflow file modification approach**
   - What we know: Option A = add `<conditional_reading>` to workflow files. Option B = use command `(optional)` tags as the sole filter.
   - What's unclear: Whether to modify workflow files' `<required_reading>` sections to remove optional refs, or let `inlineWorkflow()` handle the filtering.
   - Recommendation: Use Option B (command tags as source of truth) with minimal workflow changes. This keeps the command `execution_context` as the single source of truth per D-17 and minimizes workflow file modifications. Add the task-analysis Buoc 1.5 to workflow `<process>` sections since Claude Code needs it (instructional approach), but don't restructure workflow `<required_reading>`.

2. **complete-milestone optional templates**
   - What we know: `complete-milestone.md` has `@templates/current-milestone.md (optional)` and `@templates/state.md (optional)`. These templates are marked optional.
   - What's unclear: Should templates have loading conditions in `CONDITIONAL_LOADING_MAP`?
   - Recommendation: Yes, add them with condition "KHI task lien quan den milestone state management". The conditional_reading format handles both references and templates.

3. **Token measurement timing**
   - What we know: `scripts/count-tokens.js` measures source file tokens, but the real savings are in converter OUTPUT (which inlines workflows).
   - What's unclear: Should we measure source tokens or converter output tokens?
   - Recommendation: Measure converter output tokens for actual savings. Run a converter (e.g., codex.convertSkill) on write-code.md before and after, count tokens in the output. The source file changes are minimal -- the savings come from the converter no longer inlining optional content.

## Sources

### Primary (HIGH confidence)
- `bin/lib/utils.js` lines 255-333 -- current `inlineWorkflow()` implementation, read and analyzed directly
- `bin/lib/converters/*.js` -- all 4 converters confirmed to call `inlineWorkflow()` with `skillsDir` parameter
- `commands/pd/*.md` -- all 12 skill files read, optional/required tags verified
- `workflows/*.md` -- all 10 workflow files read, `<required_reading>` sections analyzed
- `test/smoke-utils.test.js` -- existing test structure for `inlineWorkflow()` verified
- `test/smoke-integrity.test.js` -- existing integrity tests including converter output verification
- `.planning/phases/04-conditional-context-loading/04-CONTEXT.md` -- locked decisions D-01 through D-22

### Secondary (MEDIUM confidence)
- Token savings estimates based on line counts and ~2 tokens/line heuristic (verified against tiktoken patterns from Phase 3 results)

### Tertiary (LOW confidence)
- None -- all findings verified from source code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all existing infrastructure
- Architecture: HIGH -- single function modification, well-understood codebase, clear patterns
- Pitfalls: HIGH -- identified from direct code analysis of the function and its callers
- Token savings: MEDIUM -- estimates based on line counts, actual measurement needed

**Research date:** 2026-03-22
**Valid until:** No expiry -- this is project-internal code research, not external library research
