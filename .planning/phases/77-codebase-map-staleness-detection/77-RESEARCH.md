# Phase 77: Codebase Map Staleness Detection — Research

**Researched:** 2025-07-16
**Domain:** Markdown workflow prose changes + JSON file writing (no new JS modules)
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STALE-01 | Codebase mapper auto-detects staleness via git commit-delta (>20 commits since last map); maps store `mapped_at_commit` SHA in META.json; scan.md Step 0 warns users | `pd-codebase-mapper.md` Step 5 (write phase) is the insertion point for META.json write; `workflows/scan.md` line 14 (before Step 1) is the insertion point for Step 0; git command `git rev-list <sha>..HEAD --count` is confirmed working |
</phase_requirements>

---

## Summary

Phase 77 implements silent-staleness detection for `.planning/codebase/` maps. The codebase-mapper agent runs once (during `pd:init` or `pd:scan`) and generates several `.md` files documenting project structure. Currently, these files have no timestamp or anchor commit — if a developer makes 50 commits, the map is never refreshed until they manually re-run the scan.

The fix is two-part: (1) the `pd-codebase-mapper` agent writes a `META.json` file alongside the map, recording the current git SHA at map-generation time; (2) `workflows/scan.md` gains a new Step 0 that reads this META.json, counts commits since that SHA via `git rev-list <sha>..HEAD --count`, and emits a non-blocking warning when the count exceeds 20. No new JS modules are needed — this is pure markdown workflow prose + one new JSON file.

The approach uses git commit-delta (not `mtime`, not tree-hash) as the staleness signal, which avoids false positives from `git checkout`, `npm install`, or filesystem timestamp drift. This aligns with the research-recommended approach in `.planning/research/ARCHITECTURE.md` Signal 2, adapted to use commit-delta instead of tree-hash as the phase requirement specifies.

**Primary recommendation:** Two targeted edits — append META.json write to `pd-codebase-mapper.md` Step 5, prepend Step 0 staleness check to `workflows/scan.md` before current Step 1.

---

## Standard Stack

### Core
| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| Node.js `child_process` / Bash | built-in | Run `git rev-list` | Already used throughout workflows |
| JSON | built-in | META.json format | Zero-dependency, agent-readable |
| `git rev-list <sha>..HEAD --count` | git built-in | Count commits since map | Confirmed working in project repo |

### No New npm Dependencies
This phase requires **zero new npm packages** — a hard constraint of the v8.0 milestone (confirmed in `.planning/research/SUMMARY.md`: "All six items are buildable **with zero new npm runtime dependencies**").

---

## Architecture Patterns

### Recommended Project Structure (changes only)

```
commands/pd/agents/
└── pd-codebase-mapper.md   # ADD: Step 6 — write META.json after existing Step 5

.planning/codebase/
├── STRUCTURE.md            # existing (unchanged)
├── STACK.md                # existing (unchanged)
├── ARCHITECTURE.md         # existing (unchanged)
├── CONVENTIONS.md          # existing (unchanged)
├── INTEGRATIONS.md         # existing (unchanged)
├── TESTING.md              # existing (unchanged)
├── CONCERNS.md             # existing (unchanged)
└── META.json               # NEW — written by pd-codebase-mapper

workflows/
└── scan.md                 # ADD: Step 0 before existing Step 1

test/
└── smoke-codebase-staleness.test.js   # NEW — Wave 0 gap
```

### Pattern 1: META.json Write (in pd-codebase-mapper.md)

**What:** After the agent finishes writing all map files, it also writes a `META.json` sidecar.  
**When to use:** End of every `pd-codebase-mapper` run.

```markdown
## Step 6: Write META.json
Run: `git rev-parse HEAD 2>/dev/null`
- If git command succeeds → capture SHA
- Write `.planning/codebase/META.json`:
```json
{
  "schema_version": 1,
  "mapped_at_commit": "<sha>",
  "mapped_at": "<ISO-8601 timestamp>"
}
```
- If no git → skip silently (do not write META.json)
```

**Exact META.json format:**
```json
{
  "schema_version": 1,
  "mapped_at_commit": "5dec59d9d037b975e85cf46c742c2e9ce5dc0549",
  "mapped_at": "2026-04-02T10:00:00.000Z"
}
```

### Pattern 2: Step 0 Staleness Check (in workflows/scan.md)

**What:** New Step 0 inserted before existing Step 1 (line 15 in current file).  
**Exact insertion point:** After line 13 (`<process>`) / before line 15 (`## Step 1: Determine path`).

```markdown
## Step 0: Check codebase map freshness (non-blocking)
- Read `.planning/codebase/META.json` — if file does not exist → skip, continue to Step 1.
- Extract `mapped_at_commit` — if field missing or empty → skip, continue to Step 1.
- Run: `git rev-list <mapped_at_commit>..HEAD --count 2>/dev/null`
  - Command fails (no git, invalid SHA, shallow clone) → skip silently, continue to Step 1.
- Parse output as integer `N`.
- If `N > 20`:
  > ⚠️ **Codebase map is stale.** The map was generated **N commits ago**.
  > Run `/pd:scan` to refresh before continuing for accurate results.
- If `N ≤ 20` → no output, continue silently.
```

**Key properties:**
- Non-blocking: always continues to Step 1 regardless
- Silent on skip: no output when META.json absent, git absent, or SHA invalid
- Exact count in warning: "N commits ago" — not vague "may be stale"
- Prompts `/pd:scan` specifically (not `/pd:init`)

### Anti-Patterns to Avoid

- **Using `mtime` as staleness signal:** `git checkout` resets mtimes, causing constant false positives on every branch switch. Use git SHA.
- **Using tree-hash instead of commit-delta:** Tree-hash is more precise but requires re-hashing all source files on every scan — slower, and overkill since the requirement specifies commit-delta > 20.
- **Hard-blocking on stale map:** Map is a performance aid, not a correctness requirement. Always warn and continue.
- **Writing META.json when git is unavailable:** Only write if `git rev-parse HEAD` succeeds. Never write a META.json without a valid SHA.
- **Writing META.json from `scan.md` (the consumer):** Only `pd-codebase-mapper.md` should write META.json. `scan.md` only reads it.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Commit count since SHA | Custom log parser | `git rev-list <sha>..HEAD --count` | Single reliable git primitive, handles shallow clones by failing gracefully |
| JSON parsing in agent | Regex on raw text | Agent instruction to parse JSON directly | LLM agents can read JSON natively |
| Timestamp generation | Manual date math | `new Date().toISOString()` or bash `date -u +%Y-%m-%dT%H:%M:%S.000Z` | Standard ISO-8601, zero deps |

---

## File-by-File Change Map

### `commands/pd/agents/pd-codebase-mapper.md`

**Current Step 5** (writes map files, last step):
```
5. **Write results.** Create files in `.planning/codebase/`:
   - `STRUCTURE.md` — directory tree with annotations
   - `TECH_STACK.md` — detected tech stack
   - `ENTRY_POINTS.md` — main entry points
   - `DEPENDENCIES.md` — internal dependency graph
```

**Change:** Append a new Step 6 after Step 5:
```markdown
6. **Write META.json.** Record the current git commit SHA for staleness detection:
   - Run `git rev-parse HEAD 2>/dev/null` — if fails (no git) → skip this step entirely.
   - Write `.planning/codebase/META.json`:
     ```json
     {
       "schema_version": 1,
       "mapped_at_commit": "<output of git rev-parse HEAD>",
       "mapped_at": "<current ISO-8601 timestamp>"
     }
     ```
```

### `workflows/scan.md`

**Insertion point:** Line 14 (blank line between `<process>` tag on line 13 and `## Step 1` on line 15).

**Insert before Step 1:**
```markdown
## Step 0: Check codebase map freshness (non-blocking)
- Read `.planning/codebase/META.json` → not found → skip to Step 1.
- Read `mapped_at_commit` field → missing/empty → skip to Step 1.
- Run: `git rev-list <mapped_at_commit>..HEAD --count 2>/dev/null`
  - Command fails → skip to Step 1.
- `N` = integer result.
- `N > 20` → warn:
  > ⚠️ **Codebase map is stale** — generated **N commits ago**.
  > Run `/pd:scan` to refresh before continuing.
- `N ≤ 20` → no output.
- Always continue to Step 1 regardless.

```

**Renumber:** All subsequent steps shift: old Step 1→Step 1 (no renumber needed since Step 0 is new prefix, not a replacement).

> **Note:** No renumbering needed — the existing steps 1–7 stay at their current numbers. Step 0 is a new prefix.

---

## Common Pitfalls

### Pitfall 1: META.json written when git is unavailable
**What goes wrong:** Agent writes `{"mapped_at_commit": null}` — later check sees `null`, fails to parse as valid SHA, may not skip gracefully.  
**Why it happens:** Agent executes write unconditionally.  
**How to avoid:** Only write META.json if `git rev-parse HEAD` exits 0 and returns a non-empty 40-char string.  
**Warning signs:** META.json with `null` or empty `mapped_at_commit`.

### Pitfall 2: Stale check blocks workflow
**What goes wrong:** Developer can't proceed because warning is treated as an error.  
**Why it happens:** Prose is ambiguous about blocking vs warning.  
**How to avoid:** Explicitly state "continue to Step 1" in all branches — including the `N > 20` branch. The warning is informational only.

### Pitfall 3: False positives from shallow clone
**What goes wrong:** `git rev-list <sha>..HEAD` on a shallow repo may return an error (SHA not in history) or inflated count.  
**Why it happens:** CI systems often clone with `--depth=1`.  
**How to avoid:** Redirect stderr to `/dev/null`, treat any non-zero exit as "skip" — don't parse partial output.

### Pitfall 4: Encoding the warning message with `\n` escape sequences
**What goes wrong:** Agent emits raw `\n` characters instead of actual line breaks.  
**How to avoid:** Spec the warning as a blockquote with markdown formatting — agents render these correctly.

---

## Code Examples

### Git SHA capture (in agent bash step)
```bash
# Source: git built-in, confirmed in repo
git rev-parse HEAD 2>/dev/null
# Output: 5dec59d9d037b975e85cf46c742c2e9ce5dc0549
# Exit code 0 on success, non-zero if not in git repo
```

### Commit-delta count (in Step 0)
```bash
# Source: git built-in, confirmed in repo
git rev-list 5dec59d9d037b975e85cf46c742c2e9ce5dc0549..HEAD --count 2>/dev/null
# Output: 23   (integer — number of commits since that SHA)
# Exit code non-zero if SHA invalid, shallow clone issue, or not in git repo
```

### META.json — complete example
```json
{
  "schema_version": 1,
  "mapped_at_commit": "5dec59d9d037b975e85cf46c742c2e9ce5dc0549",
  "mapped_at": "2026-04-02T10:00:00.000Z"
}
```

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` (v24.13.0) |
| Config file | none — `node --test 'test/*.test.js'` |
| Quick run command | `node --test 'test/smoke-codebase-staleness.test.js'` |
| Full suite command | `node --test 'test/*.test.js'` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STALE-01-A | META.json written with `mapped_at_commit` field | unit (JSON parse) | `node --test 'test/smoke-codebase-staleness.test.js'` | ❌ Wave 0 |
| STALE-01-B | Step 0: N > 20 → warning contains commit count | unit (string match) | `node --test 'test/smoke-codebase-staleness.test.js'` | ❌ Wave 0 |
| STALE-01-C | Step 0: no META.json → no error, no output | unit (no-throw) | `node --test 'test/smoke-codebase-staleness.test.js'` | ❌ Wave 0 |
| STALE-01-D | Step 0: N ≤ 20 → no warning emitted | unit (string match) | `node --test 'test/smoke-codebase-staleness.test.js'` | ❌ Wave 0 |

> **Note:** The staleness check logic is markdown prose (LLM instruction), not a JS module. Tests validate acceptance criteria via **grep-testable artifacts**:
>
> - `grep "mapped_at_commit" .planning/codebase/META.json` → exits 0 after mapper runs
> - `cat .planning/codebase/META.json | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); process.exit(d.mapped_at_commit && d.mapped_at_commit.length===40 ? 0 : 1)"` → validates SHA format
> - grep for Step 0 in scan.md: `grep "Step 0" workflows/scan.md`
> - grep for staleness threshold: `grep "20" workflows/scan.md`
> - grep for META.json write instruction in mapper: `grep "META.json" commands/pd/agents/pd-codebase-mapper.md`

### Sampling Rate
- **Per task commit:** `node --test 'test/smoke-codebase-staleness.test.js'`
- **Per wave merge:** `node --test 'test/*.test.js'`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `test/smoke-codebase-staleness.test.js` — covers STALE-01-A through STALE-01-D
  - Fixtures: temp dir with fake `.planning/codebase/META.json` containing known SHA
  - Tests: JSON shape validation, warning message format, skip-on-missing behavior
  - Pattern: follows `test/smoke-session-delta.test.js` (`node:test` + `node:assert/strict`, pure functions)

> Since the staleness logic is markdown prose (not a JS pure function), the test file validates the **output contracts**:
> - META.json schema shape (after mapper runs in a temp repo)
> - Warning message text format (via string fixture matching)

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| git | commit-delta count | ✓ | (project is a git repo) | Skip META.json write; skip Step 0 silently |
| Node.js | test runner | ✓ | v24.13.0 | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:**
- git unavailable: Both writer and reader skip silently — no error surfaced to user.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| mtime-based staleness | git commit-delta | Phase 77 | Immune to `git checkout` false positives |
| No staleness signal | META.json sidecar | Phase 77 | Maps now self-describe when they were taken |
| Tree-hash (ARCHITECTURE.md draft) | Commit-delta (REQUIREMENTS.md final) | Phase 77 spec | Simpler, no file-hashing overhead; threshold > 20 avoids noise |

---

## Open Questions

1. **Does `pd-codebase-mapper` get invoked via `pd:init` as well as `pd:scan`?**
   - What we know: `pd-codebase-mapper.md` is listed under `commands/pd/agents/` — it's a sub-agent, called from workflows. The `workflows/scan.md` calls it (via Step 3 FastCode MCP / Step 2a). `workflows/init.md` may also invoke it.
   - What's unclear: Whether `workflows/init.md` calls this agent (not checked in this research).
   - Recommendation: If init.md calls pd-codebase-mapper, META.json will be written there too automatically (because the write is inside the agent, not the workflow). No additional changes needed. Worth verifying during planning.

2. **Should Step 0 also be added to `workflows/write-code.md` and `workflows/plan.md`?**
   - What we know: ARCHITECTURE.md suggests staleness check in "pd:plan, pd:write-code, pd:scan". The phase requirement only specifies `scan.md Step 0`.
   - What's unclear: Whether the planner should scope to scan.md only (per STALE-01 as written) or also add to other workflows.
   - Recommendation: Scope to scan.md only for this phase. Adding to other workflows is an expansion — can be a follow-on.

---

## Sources

### Primary (HIGH confidence)
- `.planning/REQUIREMENTS.md` — STALE-01 requirement text (exact wording: "git commit-delta (>20 commits since last map)", "maps store `Mapped at commit: [sha]`")
- `.planning/research/ARCHITECTURE.md` — Staleness Detection Architecture section (META.json format, git commands, recommended approach)
- `.planning/research/SUMMARY.md` — STALE-01 row: "scan.md Step 0 re-hashes and warns if commit-delta > 20"
- `workflows/scan.md` lines 1–109 — exact current structure, insertion point confirmed at line 14
- `commands/pd/agents/pd-codebase-mapper.md` — current Step 5 (write results), confirmed as insertion point for new Step 6
- `find .planning/codebase` output — confirmed no META.json exists yet
- `git rev-list HEAD --count` — confirmed working in repo (returns 945)
- `package.json` scripts — `node --test 'test/*.test.js'` is the test runner

### Secondary (MEDIUM confidence)
- Test directory listing — no `smoke-codebase-staleness.test.js` exists (Wave 0 gap confirmed)
- `test/smoke-session-delta.test.js` — confirmed test pattern: `node:test`, `node:assert/strict`, pure function coverage

---

## Metadata

**Confidence breakdown:**
- Insertion points: HIGH — confirmed by reading exact line numbers in both files
- META.json format: HIGH — specified in REQUIREMENTS.md + cross-confirmed in ARCHITECTURE.md
- Git command: HIGH — `git rev-list <sha>..HEAD --count` verified working in project repo
- Test gap: HIGH — file listing confirms no existing staleness tests
- Warning text format: MEDIUM — REQUIREMENTS.md says "names exact commit count and prompts user to re-run pd:scan"; exact wording is the agent author's to define within those constraints

**Research date:** 2025-07-16
**Valid until:** 2025-08-16 (stable domain — no external dependencies)
