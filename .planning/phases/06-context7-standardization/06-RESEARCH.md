# Phase 6: Context7 Standardization - Research

**Researched:** 2026-03-22
**Domain:** MCP Context7 integration standardization across skill/workflow files
**Confidence:** HIGH

## Summary

Phase 6 standardizes Context7 usage across the 5 skills that generate code using external libraries (write-code, plan, new-milestone, fix-bug, test). Currently, each skill/workflow has its own ad-hoc Context7 integration -- write-code has the most detailed pattern (Buoc 3 with 2-step invocation + trigger rules), while fix-bug has a single line ("Loi lien quan thu vien -> Context7"). The goal is to create a shared reference file (`references/context7-pipeline.md`) containing the canonical pipeline, refactor all 5 workflows to @reference it, and upgrade the guard to verify Context7 actually works (not just check connection).

This is a refactoring/standardization phase operating entirely within the existing `.md` file ecosystem -- no JavaScript code changes needed beyond tests. The pattern is well-established from Phases 1-4 (extract shared content, create references, update skills/workflows, add smoke tests). All 5 target skills already have `mcp__context7__resolve-library-id` and `mcp__context7__query-docs` in their `allowed-tools` frontmatter.

**Primary recommendation:** Extract write-code.md Buoc 3 Context7 pattern as the source-of-truth into `references/context7-pipeline.md`, enhance with multi-lib batching (D-08) and error handling (D-10/D-11), then refactor all 5 workflows to @reference the new pipeline file.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Chi 5 skill can Context7: write-code, plan, new-milestone, fix-bug, test. 7 skill con lai (scan, init, fetch-doc, update, complete-milestone, conventions, what-next) khong them vi khong viet code dung thu vien ngoai.
- **D-02:** Refactor ca 5 skill hien tai cho pattern thong nhat -- hien tai moi skill viet khac nhau (write-code chi tiet, fix-bug so sai).
- **D-03:** Tao `references/context7-pipeline.md` chua pattern chuan. Guard (`guard-context7.md`) giu nguyen vai tro guard check, khong nhoi logic pipeline vao.
- **D-04:** Pattern chuan trong reference gom: 2-step invocation (resolve-library-id -> query-docs) + trigger rules + error handling co ban.
- **D-05:** Luon tu dong -- bat ky task nao lien quan thu vien ngoai -> Context7 tu dong, khong can user yeu cau.
- **D-06:** plan va new-milestone dung Context7 de research API/docs thu vien, dam bao plan dua tren API thuc khong hallucinate.
- **D-07:** Bo rule dac thu stack (antd=bat buoc, auth=bat buoc) khoi workflow. Da "luon tu dong" thi moi thu vien ngoai deu bat buoc -- khong can case-by-case.
- **D-08:** Nhieu thu vien trong cung 1 task -> resolve-library-id tat ca truoc, query-docs sau. Hieu qua hon tuan tu tung cai.
- **D-09:** Guard mo rong -- ngoai check ket noi MCP, thu resolve 1 library (vi du "react" hoac library tu project) de xac nhan Context7 thuc su hoat dong.
- **D-10:** Context7 loi hoac khong co -> dung task va bao user quyet dinh. Khong am tham tiep tuc.
- **D-11:** Khi dung, dua 3 lua chon: (1) Tiep tuc khong docs -- chap nhan rui ro API sai, (2) Dung, sua Context7 roi chay lai, (3) Dung /pd:fetch-doc tai docs thu cong.
- **D-12:** Message loi/warning viet tieng Viet, nhat quan voi style workflow hien tai.

### Claude's Discretion
- Noi dung chinh xac cua `references/context7-pipeline.md` -- cau truc, format, vi du
- Cach refactor Context7 sections trong 5 workflow files de @reference pipeline moi
- Cach guard thu resolve library -- chon library nao de test, xu ly timeout
- Logic phat hien "task lien quan thu vien ngoai" vs "task noi bo"
- Testing strategy cho viec verify Context7 pattern co dung trong moi skill

### Deferred Ideas (OUT OF SCOPE)
- Fallback chain khi Context7 fail (Phase 7: LIBR-02) -- Phase 6 chi dung va bao user, Phase 7 se auto-fallback
- Auto-detect library versions tu package.json (Phase 7: LIBR-03)
- Them Context7 vao 7 skill con lai -- khong can vi khong viet code dung thu vien
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LIBR-01 | Standardize Context7 usage -- moi task dung external library phai resolve-library-id + query-docs | Entire research supports this: pipeline reference file, workflow refactoring, guard enhancement, smoke tests |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js test runner | Built-in (node:test) | Smoke tests | Already used across all existing tests |
| assert/strict | Built-in (node:assert/strict) | Test assertions | Already used in smoke-integrity.test.js |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fs/path | Built-in | File system operations in tests | Reading .md files for pattern verification |

No new libraries needed -- this phase only modifies `.md` files and adds smoke tests using the existing test infrastructure.

## Architecture Patterns

### Existing Project Structure (relevant to this phase)
```
commands/pd/
  write-code.md          # Skill: has Context7 in allowed-tools
  plan.md                # Skill: has Context7 in allowed-tools
  new-milestone.md       # Skill: has Context7 in allowed-tools
  fix-bug.md             # Skill: has Context7 in allowed-tools
  test.md                # Skill: has Context7 in allowed-tools
workflows/
  write-code.md          # Workflow: most detailed Context7 (Buoc 3)
  plan.md                # Workflow: Context7 in Buoc 3B
  new-milestone.md       # Workflow: Context7 in agent contract
  fix-bug.md             # Workflow: Context7 one-liner in Buoc 4
  test.md                # Workflow: no explicit Context7 section
references/
  guard-context7.md      # Current: 1-line MCP connection check
  context7-pipeline.md   # NEW: canonical pipeline pattern
  conventions.md         # May need Context7 conventions addition
```

### Pattern 1: Reference Extraction (established in Phases 1-2)
**What:** Extract shared content from multiple skills/workflows into a single reference file, then @reference it.
**When to use:** When 2+ skills/workflows contain similar logic that should be consistent.
**Existing examples:** guard-context.md, guard-fastcode.md, guard-context7.md, conventions.md

This phase follows the exact same pattern:
1. Identify the best existing implementation (write-code.md Buoc 3)
2. Extract and enhance into `references/context7-pipeline.md`
3. Replace inline Context7 sections in each workflow with `@references/context7-pipeline.md`
4. Add smoke tests to verify the pattern exists

### Pattern 2: Guard Enhancement
**What:** Expand guard-context7.md from a simple connection check to an operational check.
**Current state (1 line):**
```
- [ ] Context7 MCP ket noi thanh cong -> "Kiem tra Context7 MCP da duoc cau hinh."
```
**Target state (2+ lines):**
```
- [ ] Context7 MCP ket noi thanh cong -> "Kiem tra Context7 MCP da duoc cau hinh."
- [ ] Context7 MCP hoat dong (resolve-library-id thanh cong) -> "[error handling per D-10/D-11]"
```

### Pattern 3: Workflow @reference Integration
**What:** How workflows reference shared pipeline files.
**Existing pattern from conditional loading (Phase 4):**
```markdown
<conditional_reading>
- @references/security-checklist.md -> ... -- KHI ...
</conditional_reading>
```
**For Context7 pipeline -- this is ALWAYS loaded when task uses external libraries (D-05), so it belongs in `<required_reading>` or inline within the process step.**

### Current Context7 Integration by Skill/Workflow

| Skill | Workflow Location | Current Pattern | Gap |
|-------|------------------|-----------------|-----|
| write-code | Buoc 3 (lines 124-137) | 2-step + trigger rules + stack-specific rules + fallback | Source of truth -- too stack-specific |
| plan | Buoc 3B (line 103) | 1-line "resolve-library-id -> query-docs. TU DONG tra cuu." | Too brief -- no error handling, no multi-lib |
| new-milestone | Agent contracts (line 389+) | Listed in agent tools, not explicit pipeline | Only in agent tool list |
| fix-bug | Buoc 4 (line 92) | "Loi lien quan thu vien -> Context7: resolve-library-id -> query-docs" | Minimal -- no trigger logic, no error handling |
| test | None explicit | Context7 in allowed-tools but no workflow step | No workflow integration at all |

### Anti-Patterns to Avoid
- **Stack-specific trigger rules in pipeline:** D-07 removes antd=required, auth=required rules. Pipeline should say "all external libraries" not list specific ones.
- **Mixing guard and pipeline logic:** D-03 keeps guard as connection/availability check, pipeline handles invocation flow.
- **Silent continuation on Context7 failure:** D-10 explicitly requires stopping and informing user.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Reference file pattern | New file format | Follow existing reference file conventions (see conventions.md, guard-*.md) | Consistency with project patterns |
| Test infrastructure | New test framework | Node.js built-in test runner + existing utils.js helpers | Already proven across 29 tests |
| Guard template format | New guard format | Follow existing 1-line checklist pattern with `- [ ]` prefix | Phase 1-2 established this |

**Key insight:** This phase is 100% markdown file operations. No JavaScript runtime code changes except test files. Follow established patterns from Phases 1-4 exactly.

## Common Pitfalls

### Pitfall 1: Over-engineering the pipeline reference
**What goes wrong:** Making context7-pipeline.md too complex with every edge case, making it harder for LLMs to follow.
**Why it happens:** Trying to cover all scenarios in one file.
**How to avoid:** Keep the pipeline reference concise and action-oriented. Write-code.md Buoc 3 is ~12 lines of Context7 content -- the reference should be similar length (~15-25 lines) covering: trigger rule, 2-step flow, multi-lib batching, error handling.
**Warning signs:** Pipeline reference exceeds 40 lines.

### Pitfall 2: Breaking workflow step numbering
**What goes wrong:** Refactoring Context7 sections disrupts existing Buoc numbering referenced by other parts of the workflow.
**Why it happens:** Context7 logic is embedded within existing steps (Buoc 3, Buoc 4, etc.).
**How to avoid:** Don't remove or renumber existing steps. Replace CONTENT within steps, or add sub-step references. Example: keep "Buoc 3: Research" but replace the Context7 paragraph with `@references/context7-pipeline.md` or a brief reference to it.
**Warning signs:** Tests for effort-level routing (which reference "Buoc 5", "Buoc 10") start failing.

### Pitfall 3: Forgetting new-milestone's agent-based Context7 usage
**What goes wrong:** new-milestone uses Context7 differently -- inside parallel Agent contracts, not in a sequential workflow step.
**Why it happens:** The Agent contract pattern (`tools_allowed: mcp__context7__*`) is different from direct workflow invocation.
**How to avoid:** The pipeline reference should work for BOTH direct workflow steps AND agent contract contexts. Consider adding a note in the reference about agent usage.
**Warning signs:** new-milestone loses Context7 capability after refactor.

### Pitfall 4: Inconsistent error handling language
**What goes wrong:** Error messages written in English or inconsistent Vietnamese.
**Why it happens:** Copy-paste from different sources.
**How to avoid:** D-12 requires Vietnamese messages. Follow existing workflow message style. All 3 options from D-11 must be in Vietnamese.
**Warning signs:** grep for English error messages in the pipeline reference.

### Pitfall 5: Guard check choosing wrong test library
**What goes wrong:** Guard tries to resolve a library that doesn't exist in Context7, causing false negatives.
**Why it happens:** Using a niche library for the health check.
**How to avoid:** Use a widely-known library like "react" for the resolve test (per D-09 suggestion). If it fails, Context7 is genuinely down, not a library-not-found issue.
**Warning signs:** Guard passes connection check but fails resolve check due to library choice.

## Code Examples

### Example 1: Proposed context7-pipeline.md structure
```markdown
# Context7 Pipeline

> Dung boi: write-code, plan, new-milestone, fix-bug, test
> Nguon su that cho quy trinh tra cuu thu vien ngoai

## Khi nao

BAT KY task nao su dung thu vien ngoai -> TU DONG tra cuu, KHONG can user yeu cau.

## Quy trinh 2 buoc

### Buoc 1: Resolve
`resolve-library-id` cho TUNG thu vien -> lay ID.
Nhieu thu vien -> resolve TAT CA truoc khi query.

### Buoc 2: Query
`query-docs` voi ID da resolve -> docs dung version.

## Xu ly loi

Context7 loi hoac khong co -> **DUNG** task, thong bao user:
1. Tiep tuc khong docs — chap nhan rui ro API sai
2. Dung, sua Context7 roi chay lai
3. Dung /pd:fetch-doc tai docs thu cong

KHONG am tham tiep tuc khi Context7 khong kha dung.
```

### Example 2: Enhanced guard-context7.md
```markdown
- [ ] Context7 MCP ket noi thanh cong -> "Kiem tra Context7 MCP da duoc cau hinh."
- [ ] Context7 MCP hoat dong (thu resolve-library-id "react") -> "Context7 khong phan hoi. Kiem tra ket noi MCP."
```

### Example 3: Workflow refactoring pattern (write-code.md Buoc 3)
Before:
```markdown
**Context7** (task dung thu vien ngoai):
1. `resolve-library-id` -> lay ID
2. `query-docs` -> docs dung version
- TU DONG tra cuu -- KHONG can user yeu cau
- Admin (antd): BAT BUOC tra Context7 moi component moi
- Guard/JWT/Role: BAT BUOC tra Context7 (nestjs) + FastCode pattern
- Context7 khong co -> `.planning/docs/` hoac knowledge san
```
After:
```markdown
**Context7** (task dung thu vien ngoai): Thuc hien theo @references/context7-pipeline.md
```

### Example 4: Smoke test for Context7 pattern presence
```javascript
describe('Repo integrity -- context7 standardization', () => {
  const CONTEXT7_SKILLS = ['write-code', 'plan', 'new-milestone', 'fix-bug', 'test'];
  const NON_CONTEXT7_SKILLS = ['scan', 'init', 'fetch-doc', 'update', 'complete-milestone', 'conventions', 'what-next'];

  it('context7-pipeline.md ton tai trong references/', () => {
    const pipelinePath = path.join(ROOT, 'references', 'context7-pipeline.md');
    assert.ok(fs.existsSync(pipelinePath), 'thieu references/context7-pipeline.md');
    const content = fs.readFileSync(pipelinePath, 'utf8');
    assert.match(content, /resolve-library-id/, 'pipeline thieu resolve-library-id');
    assert.match(content, /query-docs/, 'pipeline thieu query-docs');
  });

  it('5 skills co Context7 trong allowed-tools', () => {
    for (const name of CONTEXT7_SKILLS) {
      const content = fs.readFileSync(path.join(COMMANDS_DIR, `${name}.md`), 'utf8');
      const { frontmatter } = parseFrontmatter(content);
      const tools = frontmatter['allowed-tools'] || [];
      assert.ok(tools.includes('mcp__context7__resolve-library-id'), `${name}: thieu resolve-library-id trong allowed-tools`);
      assert.ok(tools.includes('mcp__context7__query-docs'), `${name}: thieu query-docs trong allowed-tools`);
    }
  });

  it('7 skills KHONG co Context7 trong allowed-tools', () => {
    for (const name of NON_CONTEXT7_SKILLS) {
      const content = fs.readFileSync(path.join(COMMANDS_DIR, `${name}.md`), 'utf8');
      const { frontmatter } = parseFrontmatter(content);
      const tools = frontmatter['allowed-tools'] || [];
      assert.ok(!tools.includes('mcp__context7__resolve-library-id'), `${name}: KHONG nen co resolve-library-id`);
      assert.ok(!tools.includes('mcp__context7__query-docs'), `${name}: KHONG nen co query-docs`);
    }
  });

  it('guard-context7.md co kiem tra hoat dong (resolve test)', () => {
    const content = fs.readFileSync(path.join(ROOT, 'references', 'guard-context7.md'), 'utf8');
    assert.match(content, /resolve-library-id/, 'guard thieu kiem tra resolve-library-id');
    assert.ok(content.split('\n').filter(l => l.trim().startsWith('- [ ]')).length >= 2,
      'guard can it nhat 2 dieu kien kiem tra');
  });

  it('workflows co tham chieu context7-pipeline', () => {
    const workflowsWithContext7 = ['write-code', 'plan', 'fix-bug'];
    for (const name of workflowsWithContext7) {
      const content = fs.readFileSync(path.join(ROOT, 'workflows', `${name}.md`), 'utf8');
      assert.match(content, /context7-pipeline/, `${name}.md: thieu tham chieu context7-pipeline`);
    }
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Stack-specific Context7 rules (antd=required, auth=required) | Universal "all external libraries" trigger (D-07) | This phase | Simpler, no case-by-case maintenance |
| Sequential lib-by-lib resolve+query | Batch resolve all -> batch query all (D-08) | This phase | More efficient for multi-library tasks |
| Guard: connection check only | Guard: connection + operational check (D-09) | This phase | Catches "connected but broken" scenarios |
| Silent fallback on Context7 failure | Hard stop + user choice (D-10/D-11) | This phase | Prevents hallucinated API usage |

**Deprecated/outdated:**
- Stack-specific trigger rules in write-code.md (antd, guard/jwt/role): replaced by universal trigger (D-07)
- "Context7 khong co -> knowledge san" fallback pattern: replaced by hard stop (D-10)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node:test) |
| Config file | None -- runs via `node --test` |
| Quick run command | `node --test test/smoke-integrity.test.js` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LIBR-01a | context7-pipeline.md exists with required content | unit | `node --test test/smoke-integrity.test.js -x` | Wave 0 |
| LIBR-01b | 5 target skills have Context7 in allowed-tools | unit | `node --test test/smoke-integrity.test.js -x` | Existing (partial) |
| LIBR-01c | 7 non-target skills do NOT have Context7 | unit | `node --test test/smoke-integrity.test.js -x` | Wave 0 |
| LIBR-01d | guard-context7.md has operational check | unit | `node --test test/smoke-integrity.test.js -x` | Wave 0 |
| LIBR-01e | Workflows reference context7-pipeline | unit | `node --test test/smoke-integrity.test.js -x` | Wave 0 |
| LIBR-01f | Pipeline has error handling per D-10/D-11 | unit | `node --test test/smoke-integrity.test.js -x` | Wave 0 |
| LIBR-01g | No stack-specific Context7 rules remain (D-07) | unit | `node --test test/smoke-integrity.test.js -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-integrity.test.js`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] New `describe('Repo integrity -- context7 standardization')` block in `test/smoke-integrity.test.js` -- covers LIBR-01a through LIBR-01g
- No new test files needed -- extend existing smoke-integrity.test.js

## Open Questions

1. **How should new-milestone's agent contracts reference the pipeline?**
   - What we know: new-milestone uses parallel Agent tools with `mcp__context7__*` in tools_allowed. The agents get their own instructions.
   - What's unclear: Whether to embed pipeline reference in agent prompts or keep Context7 in agent tool list only.
   - Recommendation: Keep Context7 in agent tool list (already works) + add a note in the pipeline reference that agents follow the same 2-step pattern. The agent prompts already say "Dung WebSearch + mcp__context7" which is sufficient.

2. **Should test.md workflow get an explicit Context7 step?**
   - What we know: test.md has Context7 in allowed-tools but no workflow step mentioning Context7. Test reads code and writes tests -- it may need to look up testing library APIs.
   - What's unclear: How often does the test skill need to query external library docs?
   - Recommendation: Add a brief Context7 reference in test.md's Buoc 3 (reading code) since test writers need to understand library APIs to write correct assertions. Follow the same @reference pattern.

3. **What library to use for guard operational check?**
   - What we know: D-09 suggests "react" or a library from the project.
   - What's unclear: Whether to always use "react" (universal) or try to detect a project library.
   - Recommendation: Use "react" as the default test library -- it's virtually guaranteed to exist in Context7's database. This avoids false negatives from niche libraries not being indexed. If "react" resolution fails, Context7 is genuinely non-functional.

## Sources

### Primary (HIGH confidence)
- Direct file reads of all 5 target skill files (commands/pd/*.md)
- Direct file reads of all 5 target workflow files (workflows/*.md)
- Direct file reads of guard files (references/guard-*.md)
- Direct file reads of existing test infrastructure (test/smoke-integrity.test.js)
- 06-CONTEXT.md user decisions (D-01 through D-12)
- Project state from STATE.md, REQUIREMENTS.md

### Secondary (MEDIUM confidence)
- Phase 1-4 pattern analysis (extract -> reference -> test) from accumulated decisions in STATE.md

### Tertiary (LOW confidence)
- None -- this phase operates entirely within existing project patterns with no external dependencies

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries, uses existing Node.js test runner
- Architecture: HIGH - follows established Phase 1-4 patterns (extract shared content -> reference file -> refactor -> test)
- Pitfalls: HIGH - all pitfalls derived from direct analysis of existing code and established project patterns

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable -- markdown file refactoring, no external dependency changes)
