# Phase 4: Conditional Context Loading - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Skills load references and rules only when the current task type requires them, eliminating the eager-loading anti-pattern. Currently all optional references (up to 858 lines / ~1700 tokens) are loaded for every invocation regardless of need. After this phase, a task that doesn't need security checks skips `security-checklist.md` (285 lines), a non-UI task skips `ui-brand.md` (208 lines), etc. True lazy loading on ALL platforms — Claude Code and converters alike.

</domain>

<decisions>
## Implementation Decisions

### Loading trigger mechanism
- **D-01:** AI analyzes task description from TASKS.md at the START of workflow execution (new Bước 1.5) to decide which optional references to load
- **D-02:** Analysis based on task description keywords/context — e.g., "auth" → load security-checklist, "form" → load ui-brand
- **D-03:** Soft fallback — if AI discovers mid-execution it needs a reference it didn't load, it reads the file then (self-correcting, no restart needed)
- **D-04:** Loading decisions are silent — no user notification about which refs were loaded/skipped

### Loading mechanism — Claude Code
- **D-05:** Claude Code uses symlinked skills (no inlining). Add conditional loading instructions in workflow `<process>` sections — "Đọc X CHỈ KHI task liên quan đến Y" pattern
- **D-06:** Claude already reads files on demand via `@references/` — the change is instructional, not mechanical
- **D-07:** True lazy loading — AI only reads optional reference files when task analysis says they're needed

### Loading mechanism — Converter platforms
- **D-08:** Modify `inlineWorkflow()` in `bin/lib/utils.js` to separate required vs optional references
- **D-09:** Required references go in `<required_reading>` (inlined always). Optional references go in `<conditional_reading>` block with FILE PATHS and loading criteria — NOT inlined
- **D-10:** True lazy loading for converters — optional refs kept as `[SKILLS_DIR]/references/X.md` file paths, AI reads file only when needed
- **D-11:** All 4 converter platforms (Codex, Gemini, Copilot, OpenCode) support file reading — no inline fallback needed
- **D-12:** Converter platforms all use `inlineWorkflow()` — one change propagates to all 4

### Loading scope — which refs are conditional
- **D-13:** `conventions.md` promoted from `(optional)` to `(required)` — always loaded (needed for every commit, only 76 lines)
- **D-14:** 6 remaining optional references get per-reference loading conditions:

| Reference | Lines | Loading Condition | Used By |
|-----------|-------|-------------------|---------|
| `security-checklist.md` | 285 | Task involves auth, encryption, input validation, data exposure | write-code |
| `ui-brand.md` | 208 | Task creates/modifies UI components or user-facing screens | plan, write-code, new-milestone, complete-milestone |
| `verification-patterns.md` | 146 | Task needs multi-level verification (not simple pass/fail) | write-code, complete-milestone |
| `state-machine.md` | 104 | Task involves milestone state transitions | new-milestone, complete-milestone, what-next |
| `questioning.md` | 65 | DISCUSS mode — interactive user questioning needed | plan, new-milestone |
| `prioritization.md` | 54 | Task ordering/ranking multiple tasks or triaging | plan, write-code, fix-bug, new-milestone |

### Framework rules
- **D-15:** Keep existing conditional pattern — "CHỈ nếu tồn tại" already works, no change needed
- **D-16:** Framework rules files (34-83 lines each) are smaller than optional references — not worth additional optimization

### Skill-level execution_context changes
- **D-17:** Skills keep `(required)` / `(optional)` tags from Phase 1 — these become the source of truth for `inlineWorkflow()` logic
- **D-18:** Move `conventions.md` from `(optional)` to `(required)` in all skills that reference it
- **D-19:** `update.md` and `fetch-doc.md` have no optional references — no changes needed

### Token savings measurement
- **D-20:** Measure before/after using tiktoken (same tooling from Phase 3)
- **D-21:** Target: 2000-3200 tokens saved per invocation when optional references are skipped
- **D-22:** Largest savings: `write-code` (5 optional refs = 769 lines skippable), `complete-milestone` (4 optional refs = 534 lines skippable)

### Claude's Discretion
- Exact conditional loading instruction phrasing in Vietnamese
- How `inlineWorkflow()` separates required vs optional (regex on `(optional)` tag vs structured parsing)
- `<conditional_reading>` format and layout
- Exact position of task-analysis step in workflow process
- Testing strategy for verifying conditional loading correctness

</decisions>

<specifics>
## Specific Ideas

- Phase 1 already tagged references as `(required)` vs `(optional)` — this tagging is the foundation for conditional loading
- True lazy loading on ALL platforms, not just Claude — converters keep file paths instead of inlining optional refs
- The biggest win is `security-checklist.md` (285 lines) — only needed by `write-code` and only for security-critical tasks
- `ui-brand.md` (208 lines) referenced by 4 skills but only relevant for UI/frontend work
- Soft fallback is important — if AI misses a reference, it self-corrects without restarting

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Loading mechanism
- `bin/lib/utils.js` §inlineWorkflow (lines 255-333) — Current eager-loading implementation, must be modified to separate required/optional
- `bin/lib/utils.js` §inlineGuardRefs (lines 235-244) — Guard expansion logic (unchanged by this phase)

### Converter pipeline
- `bin/lib/converters/codex.js` — Example converter calling inlineWorkflow()
- `bin/lib/converters/gemini.js` — Same pattern, all 4 converters share the call
- `bin/lib/converters/copilot.js` — Same pattern
- `bin/lib/converters/opencode.js` — Same pattern

### Claude Code installation
- `bin/lib/installers/claude.js` §installSkills (lines 157-173) — Symlinks only, no inlining — conditional loading is instructional

### Skill files (modification targets)
- `commands/pd/write-code.md` — 5 optional refs, largest savings target
- `commands/pd/complete-milestone.md` — 4 optional refs
- `commands/pd/new-milestone.md` — 5 optional refs
- `commands/pd/plan.md` — 4 optional refs
- All other skills with optional refs — conventions.md promotion to required

### Prior phase decisions
- `01-CONTEXT.md` §Reference Loading — Phase 1 established required/optional tagging
- `03-CONTEXT.md` — Phase 3 compression baseline (30.6% reduction already achieved)

### Token measurement
- Token counting script from Phase 3 — reuse for before/after measurement

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `parseFrontmatter()` in utils.js: Parse skill frontmatter for metadata
- `extractXmlSection()` in utils.js: Extract/replace XML sections — can extract execution_context for modification
- `inlineWorkflow()` in utils.js: The function to modify — currently inlines everything unconditionally
- Token counting script from Phase 3: Reuse for measurement

### Established Patterns
- `(required)` / `(optional)` tagging in execution_context — Phase 1 convention, now becomes load-control signal
- `@references/X.md` path convention — consistent across all skills and converters
- `[SKILLS_DIR]/references/` path replacement — converters already use this for file paths
- Vietnamese instructional text — conditional instructions should follow same language convention
- Workflow `<process>` sections — where conditional loading instructions and task-analysis step belong

### Integration Points
- `inlineWorkflow()` is called by ALL 4 converters — single modification point for true lazy loading
- Claude Code uses symlinks — conditional loading is instruction-only
- `smoke-integrity.test.js` — may need test updates for new conditional_reading section
- Reference files installed alongside skills — converters can reference them via file paths

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-conditional-context-loading*
*Context gathered: 2026-03-22*
