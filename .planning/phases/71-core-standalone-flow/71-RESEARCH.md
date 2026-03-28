# Phase 71: Core Standalone Flow - Research

**Researched:** 2026-03-29
**Domain:** Markdown skill/workflow templates — adding `--standalone` mode to `pd:test`
**Confidence:** HIGH

## Summary

This phase modifies two markdown template files (`commands/pd/test.md` and `workflows/test.md`) to add a parallel `--standalone` execution path. The domain is entirely internal — no external libraries, no new runtime dependencies, no code compilation. The work is pattern-matching against established conventions in the existing codebase.

The primary challenge is **surgical precision**: standard flow Steps 1–10 must remain byte-for-byte unchanged while adding Step 0 (router) and Steps S1–S8 (standalone flow). Guard logic in the skill file must become conditional without changing what the standard flow sees.

**Primary recommendation:** Treat this as a markdown template editing task with two non-overlapping insertion zones — prepend (Step 0) and append (Steps S1–S8) in the workflow, plus conditional guard syntax in the skill file.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** `--standalone [path]` accepts an optional file or directory path (relative or absolute). If path is a directory, scan and test all source files in it. If path is a single file, test that file specifically.
- **D-02:** `--standalone --all` scans all project source and generates/runs tests for everything.
- **D-03:** `--standalone` alone (no path, no --all) prompts user to provide a path or use --all.
- **D-04:** Invalid/nonexistent path produces a clear error message and stops.
- **D-05:** No new guard files created. Shared guard files (`guard-context.md`, `guard-fastcode.md`, `guard-context7.md`) remain unchanged — only `test.md` changes how it references them.
- **D-06:** Standalone mode: skip `guard-context.md` (CONTEXT.md not required), skip task status check (no tasks exist in standalone).
- **D-07:** FastCode and Context7 changed from hard guards to soft warnings with fallback in standalone mode (FastCode → Grep/Read fallback, Context7 → skip).
- **D-08:** Standard flow guards remain 100% unchanged — identical behavior to current implementation.
- **D-09:** When CONTEXT.md is missing (standalone mode), auto-detect tech stack via file markers in priority order: nest-cli.json/@nestjs/core → composer.json+wordpress/wp-content → hardhat.config.\*/foundry.toml → pubspec.yaml+flutter → package.json+frontend frameworks → error.
- **D-10:** Auto-detection is implemented inline in standalone flow Steps S1–S2, not as a separate module or utility.
- **D-11:** Standalone reports saved as `STANDALONE_TEST_REPORT_[YYYYMMDD_HHMMSS].md` in `.planning/reports/` directory.
- **D-12:** Report follows same table structure as standard TEST_REPORT.md, with added header `Mode: Standalone` and `Target: [path or --all]`. No milestone/phase references.
- **D-13:** Standalone bugs use literal `Patch version: standalone` format — not tied to any milestone version.

### Claude's Discretion

- Exact error message wording for auto-detection failures
- How deeply to scan directories when `[path]` points to a directory (shallow vs recursive)
- Ordering of test cases within standalone report

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID        | Description                                                                          | Research Support                                                                        |
| --------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| TEST-01   | `pd:test --standalone [path]` runs standalone flow without milestone/plan/write-code | Step 0 routing + Steps S1–S8 standalone flow in workflow; argument-hint update in skill |
| TEST-02   | `pd:test --standalone --all` scans all source and tests everything                   | S1 argument parsing handles `--all` flag + S2 directory scanning                        |
| TEST-03   | Standalone flow auto-detects tech stack when CONTEXT.md is missing                   | S2 inline auto-detection via file markers (D-09 priority order)                         |
| GUARD-01  | Standard flow guards remain unchanged                                                | Conditional guard syntax in skill; standard flow path unchanged                         |
| GUARD-02  | Standalone bypasses task status guards + conditional CONTEXT.md check                | Skill `<guards>` section uses mode-conditional instructions                             |
| GUARD-03  | FastCode/Context7 changed to soft warnings with fallback in standalone               | Skill guard references add standalone-mode fallback instructions                        |
| REPORT-01 | Creates `STANDALONE_TEST_REPORT_[timestamp].md` in `.planning/reports/`              | S7 creates report with standalone format                                                |
| REPORT-02 | Standalone bugs use `Patch version: standalone` format                               | S8 bug report template with literal `standalone` version                                |
| RECOV-01  | Detects interrupted sessions and offers resume/rewrite                               | S0.5 recovery check (mirrors Step 1.5 pattern)                                          |

</phase_requirements>

## Standard Stack

Not applicable — this phase modifies only markdown template files. No library installations or version changes.

### Tools Used In Templates

| Tool                                | Purpose                                      | Already In Project             |
| ----------------------------------- | -------------------------------------------- | ------------------------------ |
| `mcp__fastcode__code_qa`            | Code analysis for understanding test targets | Yes — in test.md allowed-tools |
| `mcp__context7__resolve-library-id` | Third-party library docs                     | Yes — in test.md allowed-tools |
| `mcp__context7__query-docs`         | Third-party library docs                     | Yes — in test.md allowed-tools |
| Grep/Read (built-in)                | Fallback when FastCode unavailable           | Yes — always available         |

No new tools or dependencies needed.

## Architecture Patterns

### Current File Structure (unchanged)

```
commands/pd/test.md        ← Skill file (frontmatter + sections)
workflows/test.md          ← Workflow file (steps 1-10)
references/guard-context.md   ← Hard guard: CONTEXT.md exists
references/guard-fastcode.md  ← Hard guard: FastCode MCP connected
references/guard-context7.md  ← Hard guard: Context7 MCP connected
```

### Pattern 1: Skill File Frontmatter Convention

**What:** YAML frontmatter in `commands/pd/*.md` defines name, description, model, argument-hint, allowed-tools.
**Current `test.md` argument-hint:** `"[task number | --all]"`
**Target:** `"[task number | --all | --standalone [path] [--all]]"`

Existing patterns from other skills:

- `write-code.md`: `"[task number] [--auto | --parallel]"` — multi-flag precedent
- `audit.md`: `"[path] [--full|--only cat1,cat2|--poc|--auto-fix]"` — complex argument precedent

**Confidence: HIGH** — pattern well-established across 14 skill files.

### Pattern 2: Guard Conditional Logic

**What:** Guards currently use simple checklist format: `- [ ] condition -> "error message"` with `@references/guard-*.md` includes.
**Current test.md guards:**

```markdown
@references/guard-context.md

- [ ] Valid task number or `--all` flag provided -> "Provide a task number or use `--all`."
      @references/guard-fastcode.md
      @references/guard-context7.md
- [ ] At least one task is in `done` state -> "No completed tasks yet. Run `/pd:write-code` first."
```

**Challenge:** No existing skill uses conditional guards (mode-based). This is the first instance. The pattern must be clear enough for AI agents to parse correctly.

**Recommended approach:** Use explicit prose conditional blocks:

```markdown
**Standard mode** (no `--standalone` flag):
@references/guard-context.md

- [ ] Valid task number or `--all` flag provided -> ...
      @references/guard-fastcode.md
      @references/guard-context7.md
- [ ] At least one task is in `done` state -> ...

**Standalone mode** (`--standalone` flag present):

- [ ] Valid path provided OR `--all` flag -> ...
- [ ] FastCode MCP connected -> ⚠️ Warning only: "FastCode unavailable — using Grep/Read fallback."
- [ ] Context7 MCP connected -> ⚠️ Warning only: "Context7 unavailable — skipping library docs."
```

**Confidence: HIGH** — prose-based conditionals are the clearest pattern for AI agent parsing. No need to invent new syntax.

### Pattern 3: Workflow Step Routing

**What:** Current workflow has linear Steps 1–10. Need Step 0 as a router.
**No existing routing precedent** in any workflow file — this will be the first mode-based router.

**Recommended approach:** Simple flag-check at Step 0:

```markdown
## Step 0: Route by mode

- `$ARGUMENTS` contains `--standalone` → jump to Step S1
- Otherwise → continue to Step 1 (standard flow)
```

**Confidence: HIGH** — simple conditional routing, well within AI agent capability.

### Pattern 4: Step 1.5 Recovery (Reusable for Standalone)

**What:** Standard flow has Step 1.5 that detects interrupted sessions:

1. TEST_REPORT.md exists → ask keep/re-run
2. Uncommitted test files → ask keep/rewrite
3. No traces → continue

**Standalone adaptation for RECOV-01:**

- Check `.planning/reports/STANDALONE_TEST_REPORT_*.md` for recent reports
- Check uncommitted test files (same glob patterns)
- Offer resume/rewrite

**Confidence: HIGH** — direct pattern reuse from existing Step 1.5.

### Anti-Patterns to Avoid

- **Modifying Steps 1–10:** NEVER change existing step content. Only prepend Step 0 and append Steps S1–S8.
- **Creating new guard files:** D-05 locks this — only change how `test.md` references existing guards.
- **Extracting auto-detection to a module:** D-10 locks this — keep inline in steps S1–S2.
- **Using `@include` for standalone flow:** Standalone flow lives directly in `workflows/test.md`, not in a separate workflow file. This keeps the standard 1-file-per-skill pattern.

## Don't Hand-Roll

| Problem            | Don't Build             | Use Instead                                          | Why                                             |
| ------------------ | ----------------------- | ---------------------------------------------------- | ----------------------------------------------- |
| Stack detection    | Custom detection script | Inline file-marker checks (D-09)                     | Decision locked — inline only                   |
| Report formatting  | New report template     | Reuse standard TEST_REPORT.md table structure (D-12) | Consistency with existing reports               |
| Recovery logic     | New recovery system     | Mirror Step 1.5 pattern from standard flow           | Proven pattern, same edge cases                 |
| Guard conditionals | New guard syntax/DSL    | Prose-based conditional blocks                       | AI agents parse prose better than custom syntax |

## Common Pitfalls

### Pitfall 1: Accidentally Modifying Standard Flow

**What goes wrong:** Editing Steps 1–10 content while adding Step 0 or S-steps, breaking standard mode behavior.
**Why it happens:** Steps 1–10 are contiguous text. Easy to accidentally change whitespace, numbering, or content.
**How to avoid:** Plan 02 Task 3 explicitly verifies standard flow is untouched. Use append-only strategy: Step 0 goes above Step 1, Steps S1–S8 go after Step 10.
**Warning signs:** Any diff lines in the Step 1–10 range that aren't pure additions above/below.

### Pitfall 2: Guard Reference Breakage for Standard Flow

**What goes wrong:** Changing how guards reference `@references/guard-*.md` breaks standard flow guard behavior.
**Why it happens:** The conditional logic must wrap the existing guard references without changing their meaning for standard mode.
**How to avoid:** Standard mode section copies the exact current guard lines verbatim. Standalone section adds new conditional lines.
**Warning signs:** Standard flow no longer requires CONTEXT.md or stops on missing FastCode.

### Pitfall 3: Standalone Report Directory Missing

**What goes wrong:** `.planning/reports/` directory doesn't exist, so report write fails.
**Why it happens:** This is a new directory — never created before in the project.
**How to avoid:** Step S7 must include `mkdir -p .planning/reports/` or equivalent before writing.
**Warning signs:** Report write error or report written to wrong location.

### Pitfall 4: Argument Parsing Ambiguity

**What goes wrong:** `--standalone --all` vs `--all` conflict — agent might interpret `--all` as standard mode's `--all`.
**Why it happens:** Both modes use `--all` flag but with different meanings.
**How to avoid:** Step 0 must check `--standalone` FIRST. If present, all subsequent flags are parsed in standalone context. Standard `--all` only applies when `--standalone` is absent.
**Warning signs:** `pd:test --standalone --all` triggers standard mode's regression test instead of standalone full-project scan.

### Pitfall 5: Auto-Detection False Positives

**What goes wrong:** Wrong stack detected (e.g., project has both `package.json` with react AND `nest-cli.json`).
**Why it happens:** Multiple markers present in a monorepo or multi-stack project.
**How to avoid:** D-09 defines strict priority order — first match wins. NestJS markers checked before frontend markers.
**Warning signs:** Tests written for wrong framework (e.g., Jest component tests instead of NestJS e2e tests).

### Pitfall 6: Standalone Bug Reports Blocking Milestone Completion

**What goes wrong:** `pd:complete-milestone` sees standalone bugs and blocks completion.
**Why it happens:** Bug filtering doesn't account for `Patch version: standalone` format.
**How to avoid:** This is Phase 72's concern (SYNC-03), but standalone flow must use the exact format `Patch version: standalone` — not `Patch version: standalone.1` or any numbered variant.
**Warning signs:** `complete-milestone` fails due to unresolved bugs that aren't milestone-related.

## Code Examples

### Example 1: Skill File Argument-Hint Update

```yaml
# Current
argument-hint: "[task number | --all]"

# Updated
argument-hint: "[task number | --all | --standalone [path] [--all]]"
```

### Example 2: Conditional Guard Section

```markdown
<guards>
**If `--standalone` flag is present (standalone mode):**
- [ ] Valid path provided OR `--all` flag used OR prompt user → "Provide a target path or use `--standalone --all`."
- FastCode MCP: check connection → if unavailable, warn "⚠️ FastCode unavailable — using Grep/Read fallback" and CONTINUE (do not stop).
- Context7 MCP: check connection → if unavailable, warn "⚠️ Context7 unavailable — skipping library docs lookup" and CONTINUE (do not stop).

**Otherwise (standard mode — default):**
@references/guard-context.md

- [ ] Valid task number or `--all` flag provided -> "Provide a task number or use `--all`."
      @references/guard-fastcode.md
      @references/guard-context7.md
- [ ] At least one task is in `done` state -> "No completed tasks yet. Run `/pd:write-code` first."
      </guards>
```

### Example 3: Step 0 Router

```markdown
## Step 0: Route by mode

Check `$ARGUMENTS`:

- Contains `--standalone` → go to **Step S1** (standalone flow)
- Does NOT contain `--standalone` → continue to **Step 1** (standard flow)
```

### Example 4: Step S2 Auto-Detection

```markdown
## Step S2: Detect tech stack

Since CONTEXT.md is not required in standalone mode, auto-detect tech stack:

1. Check `nest-cli.json` exists OR `package.json` contains `@nestjs/core` → **NestJS** (Jest + Supertest)
2. Check `composer.json` with `wordpress` dependency OR `wp-content/` directory exists → **WordPress** (PHPUnit)
3. Check `hardhat.config.*` exists OR `foundry.toml` exists → **Solidity** (Hardhat/Foundry)
4. Check `pubspec.yaml` with `flutter` SDK → **Flutter** (flutter_test + mocktail)
5. Check `package.json` with `react`/`vue`/`angular`/`next` → **Frontend-only** (manual test)
6. No match → ERROR: "Cannot auto-detect stack. Specify stack manually or create CONTEXT.md with `/pd:init`."

Use detected stack for remaining steps.
If CONTEXT.md EXISTS (user ran `/pd:init` previously), read it instead of auto-detecting.
```

### Example 5: Standalone Report Format

```markdown
# Standalone Test Report

> Date: [DD_MM_YYYY HH:MM]
> Mode: Standalone
> Target: [path or --all]
> Stack: [auto-detected or from CONTEXT.md]
> Total: [X] tests | ✅ [Y] passed | ❌ [Z] failed

## Results [Jest|PHPUnit|Hardhat|Foundry|FlutterTest|Manual Testing]

| Test case | Input | Expected | Actual | Result |
```

### Example 6: Standalone Bug Report Header

```markdown
# Bug Report (from standalone testing)

> Date: [DD_MM_YYYY HH:MM:SS] | Severity: [Critical/High/Medium/Low]
> Status: Unresolved | Feature: [Name] | Target: [path]
> Patch version: standalone | Fix attempts: 0
```

## State of the Art

| Old Approach            | Current Approach            | When Changed          | Impact                                                |
| ----------------------- | --------------------------- | --------------------- | ----------------------------------------------------- |
| No standalone testing   | Adding `--standalone` mode  | v7.0 (this milestone) | Users can test any module without pipeline            |
| Guards always hard-fail | Conditional guards per mode | v7.0 Phase 71         | Standalone users aren't blocked by missing CONTEXT.md |

## Project Constraints (from CLAUDE.md)

- Use English throughout, with standard grammar and spelling
- All output, reports, commit messages, comments must be in English

## Open Questions

1. **Directory scan depth for `--standalone [directory-path]`**
   - What we know: D-01 says "scan and test all source files in it"
   - What's unclear: Recursive (all subdirectories) or shallow (just the directory)?
   - Recommendation: Recursive — matches developer expectation and `--all` semantics. Planner should specify recursive with common exclusions (node_modules, dist, .git, vendor).

2. **CONTEXT.md exists in standalone mode**
   - What we know: D-06 says skip guard-context.md, D-09 says auto-detect when missing
   - What's unclear: If CONTEXT.md happens to exist, should standalone use it?
   - Recommendation: Yes — if CONTEXT.md exists, read tech stack from it instead of auto-detecting. This avoids unnecessary detection when the user already ran `/pd:init`. Code example 4 covers this.

3. **Step S-numbering and count**
   - What we know: Roadmap says S1–S8
   - What's unclear: Exact breakdown of each S-step
   - Recommendation: Map to the natural flow:
     - S1: Parse standalone arguments + validate path
     - S2: Detect tech stack (auto or CONTEXT.md)
     - S3: Check test infrastructure (reuse Step 2 table)
     - S4: Read target code (FastCode with Grep/Read fallback)
     - S5: Write test files
     - S6: Run tests + display results + user confirmation
     - S7: Create STANDALONE_TEST_REPORT
     - S8: Create bug report (if failures) + git commit

4. **Recovery step placement**
   - What we know: RECOV-01 requires interrupted session detection
   - What's unclear: Should it be a separate step or part of S1?
   - Recommendation: Insert as "Step S0.5" between Step 0 routing and S1 argument parsing — mirrors how Step 1.5 sits between Step 1 and Step 2 in standard flow. Or integrate into early S1.

## Validation Architecture

### Test Framework

| Property           | Value                                        |
| ------------------ | -------------------------------------------- |
| Framework          | Node.js built-in test runner (`node --test`) |
| Config file        | package.json `scripts.test`                  |
| Quick run command  | `npm test`                                   |
| Full suite command | `npm test`                                   |

### Phase Requirements → Test Map

| Req ID    | Behavior                                        | Test Type   | Automated Command                                              | File Exists? |
| --------- | ----------------------------------------------- | ----------- | -------------------------------------------------------------- | ------------ |
| TEST-01   | Standalone flow runs without milestone/plan     | integration | Manual verification — markdown template behavior               | N/A          |
| TEST-02   | `--standalone --all` scans all source           | integration | Manual verification — markdown template behavior               | N/A          |
| TEST-03   | Auto-detect tech stack from file markers        | unit        | Could test detection logic if extracted — but D-10 says inline | N/A          |
| GUARD-01  | Standard flow guards unchanged                  | regression  | Diff check — Steps 1–10 unchanged vs git baseline              | ❌ Wave 0    |
| GUARD-02  | Standalone bypasses task guards                 | integration | Manual verification — agent follows template                   | N/A          |
| GUARD-03  | FastCode/Context7 soft warnings                 | integration | Manual verification — agent follows template                   | N/A          |
| REPORT-01 | Standalone report created in .planning/reports/ | integration | Manual verification — file existence check                     | N/A          |
| REPORT-02 | Bug uses `Patch version: standalone`            | integration | Manual verification — file content check                       | N/A          |
| RECOV-01  | Detects interrupted sessions                    | integration | Manual verification — agent follows template                   | N/A          |

**Note:** This phase modifies markdown templates (AI agent instructions), not executable code. Most requirements are verified through manual/UAT testing — running `pd:test --standalone` against a real project and confirming behavior. The one automated check is GUARD-01 (regression diff).

### Sampling Rate

- **Per task commit:** Git diff verification — Steps 1–10 unchanged
- **Per wave merge:** Read modified files, verify structure
- **Phase gate:** Run `pd:test --standalone` on a test project, confirm all 9 requirements

### Wave 0 Gaps

- [ ] Baseline snapshot of `workflows/test.md` Steps 1–10 for regression comparison (GUARD-01)

## Sources

### Primary (HIGH confidence)

- Direct file reads: `commands/pd/test.md`, `workflows/test.md`, all guard files, `references/conventions.md`, `references/state-machine.md`
- `.planning/REQUIREMENTS.md` — requirement definitions
- `.planning/phases/71-core-standalone-flow/71-CONTEXT.md` — locked decisions

### Secondary (MEDIUM confidence)

- Pattern analysis across 14 skill files and 13 workflow files — argument-hint conventions, guard patterns

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no external dependencies, purely internal markdown
- Architecture: HIGH — patterns fully visible from existing codebase, well-established conventions
- Pitfalls: HIGH — clear from reading existing files and understanding the constraints

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (stable — internal project templates, no external dependencies)
