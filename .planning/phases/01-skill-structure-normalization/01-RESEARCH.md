# Phase 1: Skill Structure Normalization - Research

**Researched:** 2026-03-22
**Domain:** Markdown skill file structure standardization (12 files in commands/pd/)
**Confidence:** HIGH

## Summary

This phase restructures all 12 skill files in `commands/pd/` to follow an identical section order with clear separation between the shell layer (guards/validation) and the execution layer (business logic). The work is purely structural -- no behavioral changes. Every skill must have the same mandatory sections in the same order, including a new `<output>` section and a `<guards>` section.

The current state shows significant inconsistency: skills have 4-6 XML sections in varying order, only 2 of 12 have `<rules>` sections, none have `<guards>` or `<output>`, frontmatter field sets differ (some missing `argument-hint`), and `<execution_context>` appears before `<objective>` in 2 skills (`update`, `fetch-doc`). The `update` skill is the most divergent -- it has a full inline process (164 lines) rather than delegating to a workflow, and is the only skill where `<execution_context>` is empty.

**Primary recommendation:** Define a single canonical section order, apply it to all 12 skills, add the new `<guards>` and `<output>` sections to each, and update the smoke-integrity test to enforce the new structure. Use `extractXmlSection()` from utils.js for programmatic validation.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Section Ordering:** Claude decides optimal order; all sections MANDATORY in every skill
- **New `<output>` section:** Must contain files/artifacts created, next step suggestion, success criteria, error cases; Claude decides position
- **Frontmatter:** Standardize and enforce fields: name, description, model, argument-hint, allowed-tools; consistent field ordering
- **Guard Layer:** Separate guards from execution; guards include file existence, argument validation, MCP connectivity + Claude-proposed checks; on failure STOP + guide user
- **Reference Loading:** Each skill decides its own refs; refs stay in `<execution_context>`; tag refs as required vs optional (e.g., `@workflows/plan.md (required)`)
- **Naming/Language:** Vietnamese for content, English for XML tag names; XML tags stay as-is; frontmatter description free-form

### Claude's Discretion
- Exact section ordering (pick optimal order based on analysis)
- Guard placement strategy (separate `<guards>` section vs labeled subsection)
- Guard listing format (checklist vs table)
- Position of `<output>` section
- What additional guard checks to add
- Structural micro-decisions

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| READ-01 | Consistent structure across all 12 skills -- format thong nhat: frontmatter, guards, execution, output | Current state audit (section inventory per skill), recommended canonical section order, frontmatter field audit, smoke test enforcement pattern |
| READ-02 | Tach ro shell layer (argument parsing, validation, prerequisites) vs execution layer (business logic) | Guard extraction analysis per skill, recommended guard section format, guard-to-execution boundary pattern |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in `node:test` | >=16.7 | Test runner for smoke tests | Already used, zero dependencies |
| Node.js built-in `node:assert/strict` | >=16.7 | Assertions | Already used |
| `bin/lib/utils.js` | internal | `parseFrontmatter()`, `extractXmlSection()`, `listSkillFiles()` | Existing utilities, already used by tests and converters |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `bin/lib/converters/*.js` | internal | Platform converters read skill structure | Must remain compatible after normalization |
| `bin/lib/utils.js` `inlineWorkflow()` | internal | Inlines workflow content into skills | Must still find `<execution_context>` and `<process>` sections |

### Alternatives Considered
None -- this phase modifies only markdown files and their smoke tests. No new libraries needed.

## Architecture Patterns

### Current Skill File Structure (Inconsistent)

Analysis of all 12 skills reveals this variation:

| Skill | Lines | Sections (in order) | Has `argument-hint` | Has `<rules>` |
|-------|-------|---------------------|---------------------|----------------|
| init | 40 | objective, execution_context, context, process | Yes | No |
| scan | 35 | objective, execution_context, context, process | Yes | No |
| plan | 68 | objective, execution_context, context, process | Yes | No |
| write-code | 66 | objective, execution_context, context, process | Yes | No |
| test | 52 | objective, execution_context, context, process | Yes | No |
| fix-bug | 47 | objective, execution_context, context, process | Yes | No |
| what-next | 33 | objective, execution_context, context, process | No | No |
| new-milestone | 67 | objective, execution_context, context, process | Yes | No |
| complete-milestone | 46 | objective, execution_context, context, process | No | No |
| fetch-doc | 126 | **execution_context, objective**, context, process, rules | Yes | **Yes** |
| update | 164 | **execution_context, objective**, context, process, rules | Yes | **Yes** |
| conventions | 30 | objective, execution_context, context, process | No | No |

**Key inconsistencies found:**
1. **Section order varies:** `fetch-doc` and `update` put `<execution_context>` BEFORE `<objective>`
2. **`<rules>` present in only 2/12:** `fetch-doc` and `update`
3. **`argument-hint` missing in 3/12:** `what-next`, `complete-milestone`, `conventions`
4. **`<execution_context>` empty in 2/12:** `update` and `fetch-doc` have empty `<execution_context>` tags
5. **No `<guards>` section exists yet** -- guard logic is embedded in `<context>` as prose
6. **No `<output>` section exists yet** -- next-step suggestions are scattered in `<objective>`
7. **`update` has full inline process** (no workflow delegation) -- 120+ lines in `<process>`

### Recommended Canonical Section Order

Based on analysis of how skills are consumed (by AI models reading top-to-bottom) and the need for clear layer separation:

```
---
name: pd:skill-name
description: Vietnamese description
model: haiku|sonnet|opus
argument-hint: "[hint text]"
allowed-tools:
  - Tool1
  - Tool2
---

<objective>
What this skill does and why.
</objective>

<guards>
Shell layer: prerequisites, validation, stop conditions.
</guards>

<context>
Runtime context: user input, file reads, configuration.
</context>

<execution_context>
@workflows/skill-name.md (required)
@references/conventions.md (optional)
</execution_context>

<process>
Business logic: step-by-step execution.
</process>

<output>
Files created, next step, success criteria, error cases.
</output>

<rules>
Constraints and invariants.
</rules>
```

**Rationale for this order:**
1. **Frontmatter** -- parsed by converters/installers, must come first (YAML requirement)
2. **`<objective>`** -- AI reads "what am I doing?" first; sets context for everything below
3. **`<guards>`** -- check prerequisites BEFORE doing any work; fail-fast principle
4. **`<context>`** -- what data the skill needs (arguments, files, state)
5. **`<execution_context>`** -- which references to load; tagged required/optional
6. **`<process>`** -- the actual business logic; biggest section, comes after all setup
7. **`<output>`** -- what the skill produces; naturally follows process
8. **`<rules>`** -- constraints that apply throughout; closing section for reference

### Guard Extraction Pattern

Guards are currently embedded as prose in `<context>`. They need to be extracted into `<guards>`:

**Current pattern (mixed in `<context>`):**
```markdown
<context>
User input: $ARGUMENTS

**Tu kiem tra truoc khi bat dau** (DUNG neu thieu):
1. `.planning/CONTEXT.md` -> neu khong co -> "Chay `/pd:init` truoc."
2. `.planning/ROADMAP.md` -> neu khong co -> "Chay `/pd:new-milestone` truoc."

Doc them:
- `.planning/PROJECT.md` (neu co) -> tam nhin du an
</context>
```

**Normalized pattern (separated):**
```markdown
<guards>
DUNG va huong dan user neu bat ky dieu kien nao that bai:

- [ ] `.planning/CONTEXT.md` ton tai -> "Chay `/pd:init` truoc."
- [ ] `.planning/ROADMAP.md` ton tai -> "Chay `/pd:new-milestone` truoc."
- [ ] FastCode MCP ket noi thanh cong (chi khi skill can FastCode)
</guards>

<context>
User input: $ARGUMENTS

Doc them:
- `.planning/PROJECT.md` (neu co) -> tam nhin du an
</context>
```

### Guard Inventory Per Skill

| Skill | File Existence Guards | Arg Validation | MCP Guards | Additional Proposed |
|-------|----------------------|----------------|------------|---------------------|
| init | None (first skill) | Path arg validation | FastCode MCP connectivity | None |
| scan | CONTEXT.md | Path arg | FastCode MCP | None |
| plan | CONTEXT.md, ROADMAP.md, CURRENT_MILESTONE.md | --auto/--discuss parse | FastCode, Context7 | None |
| write-code | CONTEXT.md | Task number, --auto/--parallel | FastCode, Context7 | PLAN.md + TASKS.md for current phase |
| test | CONTEXT.md | Task number, --all | FastCode, Context7 | At least 1 task with status done |
| fix-bug | CONTEXT.md | Bug description | FastCode, Context7 | None |
| what-next | None | None | None | .planning/ directory exists |
| new-milestone | CONTEXT.md, rules/general.md | Milestone name | Context7, WebSearch | None |
| complete-milestone | CONTEXT.md | None | None | All tasks done, no open bugs |
| fetch-doc | CONTEXT.md | URL validation | WebFetch available | None |
| update | .pdconfig | --check/--apply parse | None | Network connectivity |
| conventions | None | None | None | Project directory has source code |

### Reference Tagging Pattern

Current `<execution_context>` just lists refs. Normalized version tags required vs optional:

```markdown
<execution_context>
@workflows/plan.md (required)
@templates/plan.md (required)
@templates/tasks.md (required)
@templates/research.md (required)
@references/questioning.md (optional)
@references/conventions.md (optional)
@references/prioritization.md (optional)
@references/ui-brand.md (optional)
</execution_context>
```

**Tagging rule:** The workflow file is always `(required)`. Templates used in output are `(required)`. Reference docs for style/guidance are `(optional)`.

### `<output>` Section Pattern

New section to add to all 12 skills:

```markdown
<output>
**Tao/Cap nhat:**
- `.planning/CONTEXT.md` -- project context
- `.planning/rules/*.md` -- framework rules (conditional)

**Buoc tiep theo:** `/pd:scan` hoac `/pd:plan`

**Thanh cong khi:**
- CONTEXT.md co day du thong tin tech stack
- FastCode MCP da xac nhan ket noi

**Loi thuong gap:**
- FastCode MCP khong ket noi -> kiem tra Docker dang chay
- Khong phat hien tech stack -> user can them thong tin thu cong
</output>
```

### Anti-Patterns to Avoid
- **Mixing guards with context:** Guards are stop conditions; context is data. Do not combine them.
- **Inconsistent frontmatter field order:** All skills must use the same field order (name, description, model, argument-hint, allowed-tools).
- **Empty sections:** If a skill truly has no guards (e.g., `what-next`), still include the section with "Khong co dieu kien tien quyet." Do not omit sections.
- **Changing behavior:** This phase is structure-only. Do not rewrite process steps, add new features, or change workflow references.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Frontmatter parsing | Custom regex parser | `parseFrontmatter()` from utils.js | Already handles YAML arrays, tested in 184 tests |
| Section extraction | Manual string splitting | `extractXmlSection()` from utils.js | Handles multiline, trim, null safety |
| Skill enumeration | Manual `fs.readdirSync` | `listSkillFiles()` from utils.js | Returns `{ name, filePath, content }` objects |
| Structure validation | Manual file-by-file checks | Extend `smoke-integrity.test.js` | Already runs in CI, enforces invariants |

**Key insight:** All validation infrastructure already exists in utils.js. The test suite already checks frontmatter validity and section presence. The work is to define the canonical structure, apply it to 12 files, and tighten the test assertions.

## Common Pitfalls

### Pitfall 1: Breaking the Converter Pipeline
**What goes wrong:** Renaming or reordering sections breaks `inlineWorkflow()` which expects `<execution_context>` and `<process>` by name.
**Why it happens:** Converters use `extractXmlSection()` to find specific tags.
**How to avoid:** Keep all existing tag names exactly as-is. Add new tags (`<guards>`, `<output>`) but never rename existing ones. Run `npm test` after every skill modification.
**Warning signs:** Converter tests fail; `inlineWorkflow` returns content with unreplaced `@workflows/` refs.

### Pitfall 2: Changing Behavior While Normalizing Structure
**What goes wrong:** While reorganizing sections, accidentally rewriting process steps or changing guard behavior.
**Why it happens:** Temptation to "improve" content while touching every file.
**How to avoid:** Strict rule: move content between sections, never rewrite it. The only new content is the `<output>` section body and `<guards>` checklist formatting.
**Warning signs:** `git diff` shows content changes beyond section tags and indentation.

### Pitfall 3: Inconsistent Guard Formatting
**What goes wrong:** Each skill ends up with slightly different guard checklist format.
**Why it happens:** Guards are extracted from different prose styles across 12 skills.
**How to avoid:** Define the guard format ONCE (checklist with `- [ ]` items), then apply it uniformly. Write the `init` skill first as the canonical example, then replicate the format.
**Warning signs:** Visual review shows different indentation, bullet styles, or condition phrasing across skills.

### Pitfall 4: Empty `<execution_context>` in Inline Skills
**What goes wrong:** `update` and `fetch-doc` have empty `<execution_context>` tags. After normalization, these must stay empty (or contain a comment) since they have no workflow to reference.
**Why it happens:** These skills inline their entire process directly rather than referencing a workflow.
**How to avoid:** For skills with no workflow reference, use `<execution_context>` with explicit "Khong co -- skill nay khong dung workflow rieng." rather than leaving empty tags.
**Warning signs:** `inlineWorkflow()` silently returns unchanged body for these skills (expected behavior).

### Pitfall 5: Not Updating `ALLOWED_NO_WORKFLOW` Set
**What goes wrong:** Integrity test has hardcoded `ALLOWED_NO_WORKFLOW = new Set(['fetch-doc', 'update'])`. If normalization changes which skills have workflows, this set must be updated.
**Why it happens:** Hardcoded allowlists in tests.
**How to avoid:** Review and update test allowlists as part of the normalization work.

## Code Examples

### Reading Current Skill Structure (from utils.js)
```javascript
// Source: bin/lib/utils.js
const { parseFrontmatter, extractXmlSection, listSkillFiles } = require('../bin/lib/utils');

const skills = listSkillFiles('commands/pd');
for (const skill of skills) {
  const { frontmatter, body } = parseFrontmatter(skill.content);
  const objective = extractXmlSection(body, 'objective');
  const guards = extractXmlSection(body, 'guards'); // null for current skills
  const context = extractXmlSection(body, 'context');
  const execCtx = extractXmlSection(body, 'execution_context');
  const process = extractXmlSection(body, 'process');
  const output = extractXmlSection(body, 'output'); // null for current skills
  const rules = extractXmlSection(body, 'rules'); // null for 10/12 skills
}
```

### Smoke Test for Section Order Enforcement
```javascript
// Pattern for extending smoke-integrity.test.js
const REQUIRED_SECTIONS = ['objective', 'guards', 'context', 'execution_context', 'process', 'output', 'rules'];
const REQUIRED_FM_FIELDS = ['name', 'description', 'model', 'allowed-tools'];

it('moi skill co day du sections theo thu tu chuan', () => {
  const skills = listSkillFiles(COMMANDS_DIR);
  for (const skill of skills) {
    const { frontmatter, body } = parseFrontmatter(skill.content);

    // Check frontmatter fields
    for (const field of REQUIRED_FM_FIELDS) {
      assert.ok(frontmatter[field], `${skill.name}: thieu frontmatter.${field}`);
    }

    // Check all sections present
    for (const section of REQUIRED_SECTIONS) {
      const content = extractXmlSection(body, section);
      assert.ok(content !== null, `${skill.name}: thieu <${section}>`);
    }

    // Check section ordering
    const positions = REQUIRED_SECTIONS.map(s => {
      const idx = body.indexOf(`<${s}>`);
      return { section: s, position: idx };
    });
    for (let i = 1; i < positions.length; i++) {
      assert.ok(
        positions[i].position > positions[i - 1].position,
        `${skill.name}: <${positions[i].section}> phai sau <${positions[i - 1].section}>`
      );
    }
  }
});
```

### Canonical Skill File Template
```markdown
---
name: pd:skill-name
description: Mo ta bang tieng Viet
model: haiku|sonnet|opus
argument-hint: "[goi y tham so]"
allowed-tools:
  - Read
  - Write
---

<objective>
Muc tieu cua skill. Mo ta ngan gon skill lam gi va tai sao.
Sau khi xong: goi y command tiep theo.
</objective>

<guards>
DUNG va huong dan user neu bat ky dieu kien nao that bai:

- [ ] `.planning/CONTEXT.md` ton tai -> "Chay `/pd:init` truoc."
- [ ] Tham so hop le -> thong bao cu the neu sai
</guards>

<context>
User input: $ARGUMENTS
Phan tich tham so va doc them files can thiet.
</context>

<execution_context>
@workflows/skill-name.md (required)
@references/conventions.md (optional)
</execution_context>

<process>
Thuc thi quy trinh tu @workflows/skill-name.md tu dau den cuoi.
</process>

<output>
**Tao/Cap nhat:**
- List files duoc tao hoac cap nhat

**Buoc tiep theo:** `/pd:next-command`

**Thanh cong khi:**
- Dieu kien 1
- Dieu kien 2

**Loi thuong gap:**
- Loi 1 -> huong xu ly
- Loi 2 -> huong xu ly
</output>

<rules>
- Rang buoc 1
- Rang buoc 2
</rules>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No guard section | Guards mixed into `<context>` | Since project inception | Hard to distinguish validation from data |
| No output spec | Next-step hints in `<objective>` | Since project inception | AI models miss output expectations |
| Inconsistent section order | Varies per skill | Since project inception | Cannot learn structure from one skill |
| Optional frontmatter fields | Some skills omit `argument-hint` | Since project inception | Inconsistent CLI help |

## Open Questions

1. **`argument-hint` for skills with no arguments**
   - What we know: `what-next`, `complete-milestone`, `conventions` have no `argument-hint`
   - What's unclear: Should they have `argument-hint: ""` (empty) or `argument-hint: "(khong can tham so)"`?
   - Recommendation: Use `argument-hint: "(khong can tham so)"` for consistency -- every skill has the field, always populated

2. **`<rules>` section for skills with no constraints**
   - What we know: 10/12 skills have no `<rules>` section currently
   - What's unclear: Whether all skills truly need rules or some have none
   - Recommendation: Every skill MUST have `<rules>` (per CONTEXT.md: all sections mandatory). For skills without specific rules, use a minimal set like "- Moi output PHAI bang tieng Viet co dau"

3. **`update` skill's inline process**
   - What we know: `update` has 120+ lines of inline process, no workflow file
   - What's unclear: Whether to extract this into a workflow (would add `workflows/update.md`) or leave inline
   - Recommendation: Leave inline for now -- extracting to workflow is a behavior change, out of scope. Just normalize the section order and add missing sections. Update `ALLOWED_NO_WORKFLOW` in tests if needed.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` (>=16.7) |
| Config file | `package.json` scripts section |
| Quick run command | `node --test test/smoke-integrity.test.js` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| READ-01 | All 12 skills have identical section order | unit | `node --test test/smoke-integrity.test.js` | Yes (needs new assertions) |
| READ-01 | All 12 skills have consistent frontmatter fields | unit | `node --test test/smoke-integrity.test.js` | Yes (needs new assertions) |
| READ-01 | New `<output>` section present in all skills | unit | `node --test test/smoke-integrity.test.js` | Yes (needs new assertions) |
| READ-02 | Guards separated from context in all skills | unit | `node --test test/smoke-integrity.test.js` | Yes (needs new assertions) |
| READ-02 | `<guards>` section present in all 12 skills | unit | `node --test test/smoke-integrity.test.js` | Yes (needs new assertions) |
| READ-01 | Converters still work after normalization | integration | `npm test` (runs all 184 tests) | Yes |
| READ-01 | `inlineWorkflow()` still works after normalization | integration | `node --test test/smoke-integrity.test.js` | Yes |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-integrity.test.js` (fast, ~100ms)
- **Per wave merge:** `npm test` (full suite, ~500ms, 184 tests)
- **Phase gate:** Full suite green before verify-work

### Wave 0 Gaps
- [ ] New test assertions in `test/smoke-integrity.test.js` -- enforce canonical section order, required sections, frontmatter fields
- [ ] No new test files needed -- extend existing integrity test

## Sources

### Primary (HIGH confidence)
- Direct file analysis of all 12 skill files in `commands/pd/` -- read every file, extracted section inventory
- `bin/lib/utils.js` source code -- verified `parseFrontmatter()`, `extractXmlSection()`, `inlineWorkflow()` signatures and behavior
- `test/smoke-integrity.test.js` source code -- verified existing test structure and assertion patterns
- `npm test` run -- all 184 tests pass on current codebase

### Secondary (MEDIUM confidence)
- `.planning/codebase/ARCHITECTURE.md` -- project architecture analysis from 2026-03-22
- `.planning/codebase/CONVENTIONS.md` -- coding convention analysis from 2026-03-22
- `.planning/codebase/TESTING.md` -- test framework documentation from 2026-03-22

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- this is an internal project with no external dependencies; all code was read directly
- Architecture: HIGH -- all 12 skill files read, all sections inventoried, all inconsistencies catalogued
- Pitfalls: HIGH -- converter pipeline and test infrastructure examined; integration points documented from source code

**Research date:** 2026-03-22
**Valid until:** 2026-05-22 (stable -- markdown files change slowly)
