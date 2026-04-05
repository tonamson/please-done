# Phase 87: Test Coverage - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — all criteria are technical)

<domain>
## Phase Boundary

Phase 87 delivers test coverage for v10.0 audit gaps. Specifically:

1. **New file**: `test/smoke-onboard.test.js` — verifies `commands/pd/onboard.md` skill structure, `workflows/onboard.md` workflow references, and guard file existence checks
2. **Updated file**: `test/smoke-error-handling.test.js` — expand TARGET_FILES to include `bin/plan-check.js` and `bin/lib/utils.js` (with PD_DEBUG pattern exemption comments for the log.warn check)
3. **Full suite regression**: `npm test` must pass with 1224+ tests, 0 failures

This phase does NOT add runtime behavior — only test coverage.

</domain>

<decisions>
## Implementation Decisions

### Test Style
- Use existing pattern: `node:test` + `assert/strict`, `describe`/`it` blocks
- File-system assertions (file exists, content contains) — no runtime invocation needed for smoke tests
- Follow existing smoke test header comment style

### smoke-onboard.test.js Structure
- Check `commands/pd/onboard.md` exists and has required frontmatter fields: name, description, model, allowed-tools
- Check `commands/pd/onboard.md` has required XML sections: `<objective>`, `<guards>`, `<execution_context>`, `<process>`
- Check `workflows/onboard.md` exists and has `<process>` section
- Check all `@references` in `commands/pd/onboard.md` resolve to existing files
- Check guard files (`references/guard-valid-path.md`, `references/guard-fastcode.md`) exist

### smoke-error-handling.test.js Update
- Add `bin/plan-check.js` and `bin/lib/utils.js` to TARGET_FILES for "no bare catch {}" test (both now pass after Phase 86)
- Add explicit exemption comment for the `log.warn` test: plan-check.js and utils.js are CLI/utility scripts that use PD_DEBUG pattern (`console.error`) not the `log` module — this is by design per Phase 86 decisions D-01/D-03

### the agent's Discretion
- Number of assertions per test block — match existing smoke test density
- Exact content of exemption comments (clear and factual)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `test/smoke-error-handling.test.js` — exists, needs TARGET_FILES update
- `test/smoke-integrity.test.js` — has `parseFrontmatter`, `listSkillFiles`, `collectRefs` helpers (reusable patterns)
- `bin/lib/utils.js` `parseFrontmatter` — parse skill frontmatter
- `commands/pd/onboard.md` — the skill to test (exists, created in Phase 78)
- `workflows/onboard.md` — the workflow to test (exists, created in Phase 78)

### Established Patterns
- Smoke tests use `node:test` + `node:assert/strict`
- File existence: `fs.existsSync(absPath)`
- Content assertions: `assert.match(content, /pattern/)` or `assert.ok(content.includes(...))`
- ROOT = `path.resolve(__dirname, '..')`

### Integration Points
- `npm test` runs all `test/smoke-*.test.js` via `node --test`
- smoke-error-handling.test.js TARGET_FILES adds new entries

</code_context>

<specifics>
## Specific Ideas

- TEST-02 says "(or explicit exemption comments)" — use exemption comments rather than restructuring the test
- smoke-onboard.test.js tests the STRUCTURE of the skill, not its runtime behavior

</specifics>

<deferred>
## Deferred Ideas

None — scope matches ROADMAP Phase 87 exactly.

</deferred>
