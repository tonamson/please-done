# Phase 2: Cross-Skill Deduplication - Research

**Researched:** 2026-03-22
**Domain:** Markdown skill files -- content deduplication via micro-templates in references/
**Confidence:** HIGH

## Summary

Phase 2 extracts duplicated guard checks and reference loading patterns from 12 skill files into shared micro-templates under `references/`. The project is a cross-platform AI coding skills system ("please-done") with 12 commands under `commands/pd/`, each containing XML-structured sections (objective, guards, context, execution_context, process, output, rules). Content duplication is concentrated in the `<guards>` section, where identical checklist items repeat across multiple skills.

Detailed analysis of all 12 skills reveals 3 primary guard patterns that repeat frequently: the CONTEXT.md existence check (9/12 skills), the FastCode MCP connectivity check (7/12 skills), and the Context7 MCP connectivity check (5/12 skills). The existing `inlineWorkflow()` function in `bin/lib/utils.js` already handles `@references/` and `@templates/` path resolution, so new guard files placed in `references/` will be picked up automatically by the converter pipeline. The primary challenge is defining a referencing mechanism within `<guards>` sections that converters can process correctly.

**Primary recommendation:** Create 3 guard micro-template files in `references/`, update each skill's `<guards>` section to reference them via `@references/guard-*.md`, and update `inlineWorkflow()` or add a new function to handle guard inlining during conversion. Test changes against all 189 existing tests plus new deduplication-specific tests.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Shared content goes in separate files under `references/` directory
- Skills reference them via `@references/filename.md` in `<execution_context>`
- Content appearing in 2+ skills qualifies for extraction
- Multiple small files, one per guard type:
  - `references/guard-context.md` -- CONTEXT.md existence check
  - `references/guard-fastcode.md` -- FastCode MCP connectivity check
  - `references/guard-context7.md` -- Context7 MCP connectivity check
  - (Claude may identify and create additional guard files)
- Each skill's `<guards>` section references the common guard files + lists ONLY its own unique guards
- Common guard files contain the check condition + failure message
- ONLY guards and reference patterns are deduplicated
- `<context>` and `<process>` sections stay per-skill (they contain unique business logic)
- `<objective>` and `<output>` sections stay per-skill

### Claude's Discretion
- Exact list of guard files to create (may be more than 3 listed above)
- How skills reference common guards (inline include vs explicit reference)
- Whether to extract common reference loading patterns (e.g., "load rules based on tech stack")
- Format and structure of each guard micro-template file
- How converters handle the new reference files across platforms

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TOKN-01 | Eliminate redundancy across 12 skill files -- extract shared content into micro-templates | Guard duplication analysis (see Architecture Patterns), reference pattern analysis, converter pipeline compatibility findings, and micro-template format design all directly enable implementation |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | >=16.7.0 | Runtime for install/converter pipeline | Already required by package.json engines |
| node:test | built-in | Test framework | Already used by all 189 existing tests |
| node:assert/strict | built-in | Assertions | Already used throughout test suite |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node:fs | built-in | File I/O for guard templates | Reading/writing micro-templates |
| node:path | built-in | Path resolution | Resolving references/ paths |
| node:crypto | built-in | SHA256 hashing | Manifest tracking of new files |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Separate guard files | Single guards.md with sections | User explicitly decided many small files |
| New template engine | Extend existing inlineWorkflow() | Leveraging existing code is safer |

**Installation:**
No new dependencies needed. This phase modifies only markdown content files and existing JavaScript utilities.

## Architecture Patterns

### Current Duplication Analysis (HIGH confidence -- from direct file reading)

**Guard Duplication Matrix:**

| Guard Pattern | Skills Using It | Current Wording |
|---------------|----------------|-----------------|
| CONTEXT.md existence | complete-milestone, fetch-doc, fix-bug, new-milestone, plan, scan, test, write-code (8) + what-next checks `.planning/` (1) | `- [ ] .planning/CONTEXT.md ton tai -> "Chay /pd:init truoc."` |
| FastCode MCP check | init, fix-bug, plan, scan, test, write-code (6) + init has different wording (7 total) | `- [ ] FastCode MCP ket noi thanh cong -> "Kiem tra Docker dang chay va FastCode MCP da duoc cau hinh."` |
| Context7 MCP check | fix-bug, new-milestone, plan, test, write-code (5) | `- [ ] Context7 MCP ket noi thanh cong -> "Kiem tra Context7 MCP da duoc cau hinh."` |
| Valid path parameter | init, scan (2) | `- [ ] Tham so path hop le (neu co) -> "Path khong ton tai hoac khong phai thu muc."` |

**Note:** The CONTEXT.md check has slight wording variations between skills (Vietnamese with diacritics vs without), but the semantic content is identical. The user decision says 2+ skills qualifies for extraction, so the "valid path" guard (2 skills) also qualifies.

**Rule-Loading Pattern Duplication:**

The `<context>` section in 5 skills (fix-bug, init, plan, test, write-code) contains a nearly identical block listing conditional rule files:
```
- `.planning/rules/general.md` -> quy tac chung
- `.planning/rules/nestjs.md` -> (CHI neu file ton tai)
- `.planning/rules/nextjs.md` -> (CHI neu file ton tai)
- `.planning/rules/wordpress.md` -> (CHI neu file ton tai)
- `.planning/rules/solidity.md` -> (CHI neu file ton tai)
- `.planning/rules/flutter.md` -> (CHI neu file ton tai)
```

This is a candidate for extraction per user's discretion area. However, each skill uses it slightly differently (different conditions on when to load which rules). **Recommendation:** Extract a `references/rules-loading.md` micro-template with the full list, and have each skill reference it. This is within Claude's discretion.

### Recommended Guard Micro-Template Files

Based on the duplication analysis:

| File | Content | Used By (count) |
|------|---------|-----------------|
| `references/guard-context.md` | CONTEXT.md existence check + failure message | 8 skills |
| `references/guard-fastcode.md` | FastCode MCP connectivity check + failure message | 7 skills |
| `references/guard-context7.md` | Context7 MCP connectivity check + failure message | 5 skills |
| `references/guard-valid-path.md` | Path parameter validation + failure message | 2 skills |
| `references/rules-loading.md` | Conditional rules file list pattern | 5 skills (discretion) |

### Recommended Guard File Format

Each guard micro-template should contain exactly one check in the established format:

```markdown
- [ ] `.planning/CONTEXT.md` ton tai -> "Chay `/pd:init` truoc."
```

Keep it minimal -- just the checklist line(s). No YAML frontmatter, no XML tags, no commentary. The skill's `<guards>` section provides the framing; the micro-template provides only the reusable checklist item(s).

### Recommended Referencing Mechanism

**Option A (recommended): `@references/guard-*.md` inline in `<guards>` section**

```xml
<guards>
DUNG va huong dan user neu bat ky dieu kien nao that bai:

@references/guard-context.md
@references/guard-fastcode.md
@references/guard-context7.md
- [ ] Task number hop le hoac co flag -> "Cung cap so task."
</guards>
```

This aligns with the existing `@references/` pattern already used in `<execution_context>`. The `extractReadingRefs()` utility already parses `@references/` patterns. During conversion, `inlineWorkflow()` (or a new companion function) resolves these references.

**Option B: Keep references in `<execution_context>` only, guards reference by description**

This option is weaker because it does not actually deduplicate the guard text -- it only lists the reference as something to read.

**Recommendation: Option A.** It is the most natural extension of the existing `@references/` pattern and achieves actual text deduplication.

### How Converters Handle New References

The existing converter pipeline processes skills as follows:
1. `inlineWorkflow()` in `utils.js` handles `@workflows/`, `@templates/`, `@references/` in `<execution_context>` and transforms them to `[SKILLS_DIR]/references/...` paths
2. `extractReadingRefs()` already matches `@(templates|references)/([a-z0-9_/-]+\.md)`
3. Each platform converter calls `inlineWorkflow()` before applying platform-specific transforms

**Critical insight:** Currently `inlineWorkflow()` only processes `@references/` paths inside `<execution_context>`. Guard references (`@references/guard-*.md` inside `<guards>`) would NOT be processed by the current code. Two approaches:

**Approach 1 (recommended):** Extend `inlineWorkflow()` to also resolve `@references/` patterns found inside `<guards>` sections. This means reading the guard file content and inlining it directly into the `<guards>` block during conversion. This is transparent to all 4 converters since they all call `inlineWorkflow()`.

**Approach 2:** Create a separate `inlineGuards()` function that runs before `inlineWorkflow()`. Each converter would need to call this.

**Recommendation: Approach 1** -- extend `inlineWorkflow()` with a general-purpose `@references/` inline expansion that works in ANY section, not just `<execution_context>`. This can be a simple regex replace: find all `@references/guard-*.md` lines, read file content, replace inline.

### Updated Skill Structure After Deduplication

**Before (write-code.md guards):**
```xml
<guards>
DUNG va huong dan user neu bat ky dieu kien nao that bai:

- [ ] `.planning/CONTEXT.md` ton tai -> "Chay `/pd:init` truoc."
- [ ] Task number hop le hoac co flag --auto/--parallel -> "Cung cap so task hoac flag che do."
- [ ] PLAN.md + TASKS.md ton tai cho phase hien tai -> "Chay `/pd:plan` truoc de tao plan."
- [ ] FastCode MCP ket noi thanh cong -> "Kiem tra Docker dang chay va FastCode MCP da duoc cau hinh."
- [ ] Context7 MCP ket noi thanh cong -> "Kiem tra Context7 MCP da duoc cau hinh."
</guards>
```

**After:**
```xml
<guards>
DUNG va huong dan user neu bat ky dieu kien nao that bai:

@references/guard-context.md
- [ ] Task number hop le hoac co flag --auto/--parallel -> "Cung cap so task hoac flag che do."
- [ ] PLAN.md + TASKS.md ton tai cho phase hien tai -> "Chay `/pd:plan` truoc de tao plan."
@references/guard-fastcode.md
@references/guard-context7.md
</guards>
```

This removes 3 duplicated lines per skill while keeping skill-specific guards inline.

### Recommended Project Structure Changes

```
references/
  conventions.md         # existing
  prioritization.md      # existing
  questioning.md         # existing
  security-checklist.md  # existing
  state-machine.md       # existing
  ui-brand.md            # existing
  verification-patterns.md # existing
  guard-context.md       # NEW -- CONTEXT.md existence check
  guard-fastcode.md      # NEW -- FastCode MCP connectivity check
  guard-context7.md      # NEW -- Context7 MCP connectivity check
  guard-valid-path.md    # NEW -- path parameter validation
  rules-loading.md       # NEW (discretion) -- conditional rules file list
```

### Anti-Patterns to Avoid
- **Over-extraction:** Do NOT extract guards that appear in only 1 skill (e.g., "Tat ca tasks trong milestone co status hoan thanh" is unique to complete-milestone)
- **Changing guard semantics:** The deduplicated text must be byte-identical to the original. Do not "improve" wording during extraction.
- **Breaking Vietnamese encoding:** Some guards use non-diacritical Vietnamese (per Phase 1 decision). Keep the exact encoding per skill context -- the guard templates should use the non-diacritical form since that is what was standardized.
- **Modifying `<context>` or `<process>`:** Per user locked decision, these sections stay per-skill even if they contain similar patterns.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Reference path resolution | Custom path parser | Extend existing `extractReadingRefs()` regex | Already handles `@(templates\|references)/` pattern matching |
| Workflow/reference inlining | New inlining system | Extend existing `inlineWorkflow()` | All 4 converters already call this function |
| File manifest tracking | Manual file list | Existing `generateManifest()` scans `references/` recursively | New guard files auto-included |
| Cross-platform path mapping | Per-converter guard handling | Existing `@references/` -> `[SKILLS_DIR]/references/` transform in `inlineWorkflow()` | Already proven for 7 existing reference files |

**Key insight:** The infrastructure to handle new `references/` files already exists. The main work is (a) creating the guard files, (b) updating the 12 skill files, and (c) extending `inlineWorkflow()` to resolve `@references/` inline in all sections (not just `<execution_context>`).

## Common Pitfalls

### Pitfall 1: Guard Wording Inconsistency
**What goes wrong:** Some skills use Vietnamese with diacritics in guards (plan, new-milestone, complete-milestone, fetch-doc), while others use non-diacritical Vietnamese (init, scan, test, write-code, fix-bug). Extracting to a shared template forces one encoding.
**Why it happens:** Phase 1 standardized guards to use non-diacritical Vietnamese, but some skills that had full process sections kept diacritical text.
**How to avoid:** The guard micro-template MUST use the non-diacritical form (the Phase 1 canonical form). Skills that currently use diacritical form in their guards should be updated to match. Verify with the existing test `'moi skill co guards section tach biet khoi context'`.
**Warning signs:** Test failure in `smoke-integrity.test.js` guards section tests.

### Pitfall 2: Breaking inlineWorkflow() for Existing Behavior
**What goes wrong:** Extending `inlineWorkflow()` to handle guard references changes behavior for all existing skills, potentially breaking converter output.
**Why it happens:** The function currently only processes `<execution_context>` section content. Adding general `@references/` expansion could accidentally transform references in other sections (like inside code blocks or documentation text).
**How to avoid:** The expansion should ONLY target lines that are exactly `@references/guard-*.md` (or more generally, lines matching `^@references/[a-z0-9_-]+\.md$` that are standalone, not inside code fences). Write tests that verify existing converter output is unchanged for skills that don't use guard references.
**Warning signs:** Existing 189 tests failing after modification.

### Pitfall 3: Manifest Not Picking Up New Files
**What goes wrong:** New `references/guard-*.md` files exist in the repo but are not included in platform installations.
**Why it happens:** The manifest system (`generateManifest()`) scans installed directories recursively, and the installer copies from `references/`. So this should work automatically. But if the installer has a whitelist or exclusion pattern, new files could be missed.
**How to avoid:** Verify that `package.json` "files" array includes `"references"` (confirmed: it does). Run `smoke-installers.test.js` after adding files.
**Warning signs:** Tests in `smoke-all-platforms.test.js` or `smoke-installers.test.js` failing.

### Pitfall 4: Converter Tests Expecting Exact Output
**What goes wrong:** Integrity tests like `'inlineWorkflow xu ly duoc moi command co workflow'` check that inlined output matches certain patterns. Changing guards content changes the output.
**Why it happens:** The test checks for `/<process>[\s\S]*Buoc [0-9]+[\s\S]*<\/process>/` which should still pass, but any test that does exact string matching on guards would break.
**How to avoid:** Review all tests in `smoke-integrity.test.js` before modifying skill files. The current tests check structure (section presence, ordering, frontmatter fields) not exact content, so most should pass.
**Warning signs:** Test output showing unexpected assertion failures in integrity suite.

### Pitfall 5: Rules-Loading Extraction Scope Creep
**What goes wrong:** Extracting the rules-loading pattern from `<context>` sections violates the user's locked decision that `<context>` stays per-skill.
**Why it happens:** The rules-loading pattern IS duplicated across 5 skills in `<context>`, and it is tempting to extract it.
**How to avoid:** The user explicitly locked: "`<context>` and `<process>` sections stay per-skill." The rules-loading extraction is within Claude's discretion but ONLY if implemented as a reference file that skills list in `<execution_context>`, not by modifying `<context>` sections. Alternatively, skip rules-loading extraction entirely in Phase 2 and address it in Phase 4 (Conditional Context Loading) where it is more appropriate.
**Recommendation:** Do NOT extract rules-loading in this phase. It belongs in Phase 4 (TOKN-03).

## Code Examples

### Guard Micro-Template File Format
```markdown
- [ ] `.planning/CONTEXT.md` ton tai -> "Chay `/pd:init` truoc."
```

Single checklist line. No frontmatter. No XML tags. Just the reusable guard item.

### Extended inlineWorkflow() -- Guard Reference Expansion
```javascript
// Source: Extension of existing bin/lib/utils.js inlineWorkflow()
// Add this BEFORE the existing workflow ref processing:

function inlineGuardRefs(body, skillsDir) {
  // Match standalone @references/guard-*.md lines
  return body.replace(
    /^@references\/(guard-[a-z0-9_-]+\.md)$/gm,
    (match, filename) => {
      const guardPath = path.join(skillsDir, 'references', filename);
      if (!fs.existsSync(guardPath)) return match; // keep original if file missing
      return fs.readFileSync(guardPath, 'utf8').trim();
    }
  );
}
```

This could be integrated into `inlineWorkflow()` or called separately. The key pattern: match `@references/guard-*.md` on its own line, replace with file content.

### Updated Skill File Example (write-code.md guards section)
```xml
<guards>
DUNG va huong dan user neu bat ky dieu kien nao that bai:

@references/guard-context.md
- [ ] Task number hop le hoac co flag --auto/--parallel -> "Cung cap so task hoac flag che do."
- [ ] PLAN.md + TASKS.md ton tai cho phase hien tai -> "Chay `/pd:plan` truoc de tao plan."
@references/guard-fastcode.md
@references/guard-context7.md
</guards>
```

### Test Pattern for Deduplication Verification
```javascript
// Source: Extension of existing test/smoke-integrity.test.js
it('guard micro-templates duoc tham chieu dung trong skills', () => {
  const guardFiles = fs.readdirSync(path.join(ROOT, 'references'))
    .filter(f => f.startsWith('guard-'));

  // Each guard file must be referenced by at least 2 skills
  for (const guardFile of guardFiles) {
    const ref = `@references/${guardFile}`;
    let refCount = 0;

    for (const skill of listSkillFiles(COMMANDS_DIR)) {
      if (skill.content.includes(ref)) refCount++;
    }

    assert.ok(refCount >= 2, `${guardFile}: chi duoc tham chieu boi ${refCount} skill (can >= 2)`);
  }
});

it('khong con guard text trung lap giua cac skills', () => {
  // Read each guard template content
  const guardContents = fs.readdirSync(path.join(ROOT, 'references'))
    .filter(f => f.startsWith('guard-'))
    .map(f => fs.readFileSync(path.join(ROOT, 'references', f), 'utf8').trim());

  // No skill should contain the literal guard text if it references the file
  for (const skill of listSkillFiles(COMMANDS_DIR)) {
    const guards = extractXmlSection(skill.content, 'guards') || '';

    for (const guardContent of guardContents) {
      // If skill references ANY guard file, it should NOT also contain that guard's literal text
      if (guards.includes('@references/guard-')) {
        assert.ok(
          !guards.includes(guardContent),
          `${skill.name}: van con guard text trung lap du da dung @references/`
        );
      }
    }
  }
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Guards embedded in each skill | Guards to be extracted into references/ | Phase 2 (this phase) | Reduces ~30 duplicated lines across 12 skills |
| Flat execution_context references | required/optional tagged references | Phase 1 (completed) | Established the tagging pattern guard refs will follow |
| No canonical section order | Fixed order: objective, guards, context, execution_context, process, output, rules | Phase 1 (completed) | Guards section now consistently positioned for extraction |

**Dependency on Phase 1:** Phase 1 normalized all 12 skills to a consistent structure. This is a prerequisite for Phase 2 -- without consistent section ordering and guard formatting, extraction would be error-prone. Phase 1 is confirmed complete (all 189 tests pass).

## Open Questions

1. **Should `@references/` expansion be general or guard-specific?**
   - What we know: Only guard files need inline expansion in `<guards>`. Other `@references/` in `<execution_context>` are already handled differently (transformed to `[SKILLS_DIR]/references/` paths).
   - What's unclear: Should the expansion function handle ALL `@references/*.md` anywhere in the body, or only `@references/guard-*.md` specifically?
   - Recommendation: Start with guard-specific (`guard-*` prefix matching) to minimize risk. Generalize later if needed.

2. **Diacritical vs non-diacritical Vietnamese in guard templates**
   - What we know: Phase 1 decision says "Guards use non-diacritical Vietnamese for checklist items." But some skills (plan, new-milestone, complete-milestone) still have diacritical text in their guards header line ("DUNG" in some, "DUNG" with diacritics in others).
   - What's unclear: Whether the Phase 1 normalization was fully applied to all guard header text or only to checklist items.
   - Recommendation: Use non-diacritical form in guard templates. Normalize all skills' guard headers to non-diacritical during this phase if not already done.

3. **Should the guard template `@references/` pattern also appear in `<execution_context>`?**
   - What we know: User's locked decision says "Skills reference them via `@references/filename.md` in `<execution_context>`". But the actual inline expansion happens in `<guards>`.
   - What's unclear: Whether guard reference files should ALSO be listed in `<execution_context>` as `(required)` references.
   - Recommendation: List them in `<execution_context>` as well, tagged `(required)`, for documentation completeness and to ensure converters pick them up in the required_reading transform. The inline expansion in `<guards>` handles the actual deduplication; the `<execution_context>` listing ensures the file is in the converter's awareness.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in, Node.js >= 16.7.0) |
| Config file | None -- uses `node --test` directly |
| Quick run command | `node --test test/smoke-integrity.test.js` |
| Full suite command | `node --test 'test/*.test.js'` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TOKN-01a | Guard files exist in references/ | smoke | `node --test test/smoke-integrity.test.js` | Needs new test |
| TOKN-01b | Each guard file referenced by 2+ skills | smoke | `node --test test/smoke-integrity.test.js` | Needs new test |
| TOKN-01c | No duplicated guard text in skills that use @references/ | smoke | `node --test test/smoke-integrity.test.js` | Needs new test |
| TOKN-01d | Converters process guard refs correctly (all 4 platforms) | smoke | `node --test test/smoke-converters.test.js` | Needs updated test |
| TOKN-01e | inlineWorkflow/inlineGuardRefs produces correct output | unit | `node --test test/smoke-utils.test.js` | Needs new test |
| TOKN-01f | All existing 189 tests still pass (no regression) | regression | `node --test 'test/*.test.js'` | Existing -- 189 tests |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-integrity.test.js`
- **Per wave merge:** `node --test 'test/*.test.js'`
- **Phase gate:** Full suite green (189 existing + new tests) before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] New test cases in `test/smoke-integrity.test.js` -- guard deduplication verification (TOKN-01a, TOKN-01b, TOKN-01c)
- [ ] New test cases in `test/smoke-utils.test.js` -- inlineGuardRefs function (TOKN-01e)
- [ ] Updated test cases in `test/smoke-converters.test.js` -- guard ref handling (TOKN-01d)

## Sources

### Primary (HIGH confidence)
- Direct file reading: All 12 skill files in `commands/pd/` (guards, context, execution_context, rules sections extracted and analyzed)
- Direct file reading: `bin/lib/utils.js` -- `inlineWorkflow()`, `extractReadingRefs()`, `extractXmlSection()` functions
- Direct file reading: `bin/lib/converters/codex.js`, `bin/lib/converters/gemini.js` -- converter pipeline
- Direct file reading: `test/smoke-integrity.test.js`, `test/smoke-converters.test.js` -- existing test patterns
- Direct file reading: `bin/lib/manifest.js` -- manifest tracking system
- Direct file reading: `bin/lib/platforms.js` -- platform registry and path mapping
- Direct file reading: `references/conventions.md` -- existing shared reference pattern
- Test execution: `node --test 'test/*.test.js'` -- 189 tests, 0 failures (confirmed working baseline)

### Secondary (MEDIUM confidence)
- Phase 1 decisions from `STATE.md` -- canonical section order, guard formatting conventions

### Tertiary (LOW confidence)
- None -- all findings verified from source code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries needed, all existing infrastructure
- Architecture: HIGH -- direct code reading of all 12 skills, converter pipeline, and test suite
- Pitfalls: HIGH -- derived from actual code analysis and test patterns, not speculation

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable -- markdown content files and Node.js built-ins)
