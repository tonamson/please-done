# Phase 7: Library Fallback and Version Detection - Research

**Researched:** 2026-03-22
**Domain:** Fallback chain for Context7 failures + auto-detection of library versions from project manifests
**Confidence:** HIGH

## Summary

Phase 7 transforms the Phase 6 hard-stop error handling into an intelligent auto-fallback chain and adds version-aware library queries. Currently, when Context7 fails, the pipeline stops and presents the user with 3 choices (D-10/D-11 from Phase 6). Phase 7 replaces this with automatic fallback: Context7 -> project docs (.planning/docs/) -> codebase examples (Grep/Read) -> training data, with a transparency message showing which source was used. Additionally, library versions are automatically read from package.json/pubspec.yaml/composer.json and passed to Context7 queries.

The scope is strictly modifying `references/context7-pipeline.md` (adding "Buoc 0: Version" and replacing "Xu ly loi" with the fallback chain) and adding corresponding smoke tests. No new files are created -- the pipeline reference is expanded in place. The existing patterns from fetch-doc.md (version detection from package.json) and scan.md (tech-stack heuristics for monorepo) are directly reusable. All 5 workflows that reference `@references/context7-pipeline.md` automatically inherit the changes without modification.

**Primary recommendation:** Expand `references/context7-pipeline.md` with a "Buoc 0: Version" section before the existing 2-step pipeline, and replace the current "Xu ly loi" hard-stop with an auto-fallback chain. Use the existing version detection pattern from `fetch-doc.md` Buoc 1 and monorepo heuristics from `scan.md`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Fallback order khi Context7 fail: (1) Project docs (.planning/docs/*.md tu /pd:fetch-doc), (2) Codebase examples (Grep/Read patterns trong code hien co), (3) Training data (knowledge san co cua model). Thu tu tu chinh xac nhat -> it chinh xac nhat.
- **D-02:** Mo rong `references/context7-pipeline.md` them section fallback -- KHONG tao file moi. Pipeline hien tai co "Xu ly loi" hard-stop 3 lua chon -> thay bang auto-fallback chain + transparency message.
- **D-03:** Fallback tu dong -- KHONG hoi user o moi buoc. Thu tat ca nguon roi bao ket qua cuoi cung. Chi dung khi KHONG nguon nao co docs.
- **D-04:** Khi fallback den training data (nguon cuoi), hien thi warning: "Warning Dung knowledge san, co the khong chinh xac cho version hien tai."
- **D-05:** Project docs fallback: tim trong `.planning/docs/` folder (output cua /pd:fetch-doc). Match ten thu vien voi filename (e.g., `nestjs-guards.md` cho `@nestjs/common`).
- **D-06:** Detect version tu manifest files: `package.json` (Node.js), `pubspec.yaml` (Flutter), `composer.json` (PHP). Doc file gan root nhat, parse ten thu vien -> lay version.
- **D-07:** Version info truyen vao `resolve-library-id` hoac `query-docs` neu Context7 ho tro version parameter. Neu khong ho tro: ghi nhan version cho transparency message.
- **D-08:** Monorepo support: nhieu `package.json` -> uu tien file gan nhat voi file dang sua. Heuristic: `nest-cli.json` -> backend package.json, `next.config.*` -> frontend package.json. Giong logic hien co trong `fetch-doc.md` Buoc 1.
- **D-09:** Version detect them vao pipeline reference -- thanh buoc "Buoc 0: Version" truoc resolve. KHONG tao file moi.
- **D-10:** Khong tim thay version -> dung "latest" va ghi note, KHONG dung workflow.
- **D-11:** Moi lan tra cuu thu vien, in 1 dong ngan: "[thu vien] v[version] -- nguon: Context7 | project docs | codebase | training data"
- **D-12:** Message tieng Viet, nhat quan voi style workflow hien tai.

### Claude's Discretion
- Logic match ten thu vien voi filename trong `.planning/docs/`
- Cach scan codebase examples (Grep patterns, import statements, etc.)
- Format chinh xac cua transparency message
- Thu tu thu fallback sources trong codebase (import patterns vs usage patterns)
- Cach handle version range (^2.0.0) -- co the dung range truc tiep hoac extract major version
- Testing strategy cho fallback scenarios

### Deferred Ideas (OUT OF SCOPE)
- Context7 version-specific queries (neu Context7 API ho tro version filter trong tuong lai)
- Auto-update project docs khi phat hien version thay doi
- Fallback metrics/telemetry (dem bao nhieu lan dung fallback)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LIBR-02 | Fallback chain khi Context7 fail -- project docs > codebase examples > training data | Fallback chain architecture, project docs matching, codebase scan patterns, transparency message format |
| LIBR-03 | Auto-detect library versions tu package.json/pubspec.yaml/composer.json de truyen vao Context7 | Version detection patterns from fetch-doc.md, Context7 API version support analysis, monorepo heuristics |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js test runner | Built-in (node:test) | Smoke tests | Already used across all 38 existing tests |
| assert/strict | Built-in (node:assert/strict) | Test assertions | Already used in smoke-integrity.test.js |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fs/path | Built-in | File system operations in tests | Reading .md files for pattern verification |

No new libraries needed -- this phase only modifies `references/context7-pipeline.md` and adds smoke tests using the existing test infrastructure.

## Architecture Patterns

### Existing Project Structure (relevant to this phase)
```
references/
  context7-pipeline.md     # TARGET: expand with version detect + fallback
  guard-context7.md        # NO CHANGE: guard stays as-is
workflows/
  write-code.md            # NO CHANGE: already @references context7-pipeline
  plan.md                  # NO CHANGE: already @references context7-pipeline
  fix-bug.md               # NO CHANGE: already @references context7-pipeline
  test.md                  # NO CHANGE: already @references context7-pipeline
commands/pd/
  fetch-doc.md             # READ ONLY: reuse version detection pattern (Buoc 1)
test/
  smoke-integrity.test.js  # TARGET: add fallback + version tests
```

### Pattern 1: Pipeline Expansion (single-file change propagation)
**What:** All 5 workflows reference `@references/context7-pipeline.md` via inline reference. Expanding the pipeline file automatically propagates changes to all consuming workflows.
**When to use:** This phase -- only `context7-pipeline.md` needs modification.
**Key insight:** This is the payoff of Phase 6's DRY refactoring. The single-line `@references/context7-pipeline.md` in each workflow means Phase 7 needs ZERO workflow file changes.

### Pattern 2: Version Detection (reuse from fetch-doc.md)
**What:** Extract library name, search for it in manifest files, return version string.
**Source:** `commands/pd/fetch-doc.md` Buoc 1 already has this exact pattern:
1. Extract library name from context
2. Grep name in `**/package.json` (exclude node_modules)
3. Multiple results -> prioritize exact match
4. Multiple versions -> use nearest package.json
5. Not found -> use "latest" with note

**Monorepo heuristic (from scan.md/init.md):**
| Indicator | Package.json Location |
|-----------|----------------------|
| `nest-cli.json` | Backend package.json (same or parent dir) |
| `next.config.*` | Frontend package.json (same or parent dir) |
| `pubspec.yaml` | Flutter project root |
| `wp-config.php` / `composer.json` | WordPress/PHP project root |

### Pattern 3: Fallback Chain (new, but follows established conventions)
**What:** Ordered attempt at multiple documentation sources, transparent reporting.
**Architecture:**

```
Context7 (resolve + query)
    |
    ├── SUCCESS -> use docs, report "nguon: Context7"
    |
    └── FAIL -> Fallback 1: Project Docs
                    |
                    ├── FOUND -> use docs, report "nguon: project docs"
                    |
                    └── NOT FOUND -> Fallback 2: Codebase Examples
                                        |
                                        ├── FOUND -> use patterns, report "nguon: codebase"
                                        |
                                        └── NOT FOUND -> Fallback 3: Training Data
                                                            |
                                                            └── ALWAYS -> use training data
                                                                         report "nguon: training data"
                                                                         + warning
```

### Pattern 4: Transparency Message
**What:** Single-line status message after each library lookup.
**Format recommendation:**

```
[thu vien] v[version] -- nguon: [Context7 | project docs | codebase | training data]
```

**Examples:**
```
@nestjs/common v10.3.0 -- nguon: Context7
react v18.2.0 -- nguon: project docs (.planning/docs/react-hooks.md)
express v4.18.2 -- nguon: codebase (src/app.ts)
lodash v4.17.21 -- nguon: training data ⚠ co the khong chinh xac cho version hien tai
```

### Anti-Patterns to Avoid
- **Creating new files:** D-02 explicitly says expand context7-pipeline.md, NOT create new files. No new reference files, no new workflow files.
- **Interactive fallback:** D-03 says auto-fallback, NOT ask user at each step. Try all sources, report result.
- **Breaking existing pipeline structure:** The pipeline has a clear format (Vietnamese non-diacritical, numbered steps, short). Keep the same style.
- **Over-engineering codebase scan:** Codebase examples fallback should be simple Grep for import statements and usage patterns, not a full code analysis engine.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Version detection logic | Custom parser | Reuse fetch-doc.md Buoc 1 pattern verbatim | Already tested, handles monorepo, edge cases covered |
| Monorepo resolution | Custom heuristic | Reuse scan.md/init.md tech-stack detection patterns | nest-cli.json, next.config.*, pubspec.yaml patterns established |
| Test infrastructure | New test framework | Node.js built-in test runner + existing smoke-integrity.test.js patterns | 38 tests already passing with this approach |
| Pipeline format | New reference format | Follow existing context7-pipeline.md style | Vietnamese non-diacritical, numbered Buoc, concise |

**Key insight:** The version detection pattern already exists in fetch-doc.md and is battle-tested. The monorepo heuristics already exist in scan.md and init.md. Phase 7's job is to document these patterns into the pipeline reference, not reinvent them.

## Common Pitfalls

### Pitfall 1: Making context7-pipeline.md too long
**What goes wrong:** Adding version detection + fallback chain doubles the pipeline length, making it harder for LLMs to follow.
**Why it happens:** Trying to document every edge case inline.
**How to avoid:** Current pipeline is 27 lines. Target: 45-55 lines maximum. Use compact table notation for fallback chain (like the scan.md tech detection table). Keep each section focused.
**Warning signs:** Pipeline exceeds 60 lines. LLM responses show confusion about pipeline steps.

### Pitfall 2: Breaking the existing 2-step flow
**What goes wrong:** Version detection and fallback logic disrupts the clear "Buoc 1: Resolve, Buoc 2: Query" structure.
**Why it happens:** Inserting version as "Buoc 0" could confuse the numbering or flow.
**How to avoid:** Use "Buoc 0: Version" BEFORE the existing steps, then add fallback as a replacement for "Xu ly loi" AFTER the existing steps. The core 2-step flow stays untouched in the middle.
**Warning signs:** Tests for "resolve-library-id" or "query-docs" in pipeline content start failing.

### Pitfall 3: Project docs filename matching too strict or too loose
**What goes wrong:** Library name "nestjs/common" doesn't match filename "nestjs-guards.md" or matches too many files.
**Why it happens:** Library package names (@nestjs/common) don't map 1:1 to doc filenames (nestjs-guards.md).
**How to avoid:** Use fuzzy matching strategy: (1) exact basename match first, (2) then prefix/keyword match, (3) list multiple matches and use most relevant. D-05 gives the example: `nestjs-guards.md` for `@nestjs/common` -- this is keyword-based matching.
**Warning signs:** Fallback to project docs never finds anything because matching is too strict.

### Pitfall 4: Version range parsing complexity
**What goes wrong:** Trying to parse semver ranges (^2.0.0, ~1.2.3, >=3.0.0) into exact versions.
**Why it happens:** package.json uses ranges, not pinned versions.
**How to avoid:** Keep it simple. Extract the version string as-is from the manifest. For the transparency message, show the raw range. For Context7 query, include the version info in the query text (Context7 doesn't have a dedicated version parameter -- see Context7 API analysis below). The user decision D-07 already accounts for this: "Neu khong ho tro: ghi nhan version cho transparency message."
**Warning signs:** Complex semver parsing logic being added to a markdown instruction file.

### Pitfall 5: Forgetting that `.planning/docs/` may not exist
**What goes wrong:** Fallback to project docs fails because the folder doesn't exist or is empty.
**Why it happens:** Not all projects run /pd:fetch-doc.
**How to avoid:** Fallback 1 should check: (1) .planning/docs/ exists, (2) has .md files, (3) any match library name. If any check fails -> skip to Fallback 2. This is a no-op, not an error.
**Warning signs:** Error messages about missing directories during fallback.

## Code Examples

### Example 1: Proposed expanded context7-pipeline.md
```markdown
# Context7 Pipeline

> Dung boi: write-code, plan, new-milestone, fix-bug, test
> Nguon su that cho quy trinh tra cuu thu vien ngoai

## Khi nao

BAT KY task nao su dung thu vien ngoai -> TU DONG tra cuu, KHONG can user yeu cau.

## Buoc 0: Version

Truoc khi resolve, detect version thu vien tu manifest:

| Manifest | Stack | Parse |
|----------|-------|-------|
| `package.json` | Node.js | dependencies + devDependencies -> ten:version |
| `pubspec.yaml` | Flutter | dependencies -> ten:version |
| `composer.json` | PHP | require + require-dev -> ten:version |

Nhieu manifest (monorepo) -> uu tien file gan nhat voi code dang sua.
Heuristic: `nest-cli.json` -> backend, `next.config.*` -> frontend.
Khong tim thay -> dung "latest", ghi note.

## Buoc 1: Resolve
`resolve-library-id` cho TUNG thu vien -> lay ID.
Nhieu thu vien -> resolve TAT CA truoc khi query.

## Buoc 2: Query
`query-docs` voi ID da resolve -> docs. Truyen version vao topic/query neu co.

## Fallback (Context7 loi hoac khong co ket qua)

Tu dong thu theo thu tu, KHONG hoi user:

| # | Nguon | Cach thu | Dieu kien thanh cong |
|---|-------|----------|---------------------|
| 1 | Project docs | Glob `.planning/docs/*.md` -> match ten thu vien | Tim thay file co noi dung lien quan |
| 2 | Codebase | Grep import/usage patterns trong code hien co | Tim thay patterns su dung thu vien |
| 3 | Training data | Knowledge san co cua model | Luon co (nguon cuoi) |

Fallback 3 (training data) -> hien thi: "⚠ Dung knowledge san, co the khong chinh xac cho version hien tai."

TAT CA nguon that bai (khong co docs, project docs, hay codebase) -> thong bao va dung training data.

## Transparency

Moi lan tra cuu, in 1 dong: `[thu vien] v[version] -- nguon: [ten nguon]`
VD: `@nestjs/common v10.3.0 -- nguon: Context7`
```

### Example 2: Smoke tests for version detection + fallback
```javascript
describe('Repo integrity -- library fallback and version detection', () => {
  it('context7-pipeline.md co Buoc 0 Version', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'references', 'context7-pipeline.md'), 'utf8');
    assert.match(content, /Buoc 0.*Version/i,
      'pipeline thieu Buoc 0 Version');
    assert.match(content, /package\.json/,
      'pipeline thieu package.json reference');
    assert.match(content, /pubspec\.yaml/,
      'pipeline thieu pubspec.yaml reference');
    assert.match(content, /composer\.json/,
      'pipeline thieu composer.json reference');
  });

  it('pipeline co fallback chain (D-01 order)', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'references', 'context7-pipeline.md'), 'utf8');
    assert.match(content, /[Ff]allback/,
      'pipeline thieu fallback section');
    assert.match(content, /[Pp]roject docs/i,
      'pipeline thieu project docs fallback');
    assert.match(content, /[Cc]odebase/,
      'pipeline thieu codebase fallback');
    assert.match(content, /[Tt]raining data/i,
      'pipeline thieu training data fallback');
  });

  it('fallback chain co thu tu dung (project docs truoc codebase truoc training)', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'references', 'context7-pipeline.md'), 'utf8');
    const projectDocsPos = content.search(/[Pp]roject docs/i);
    const codebasePos = content.search(/[Cc]odebase/);
    const trainingPos = content.search(/[Tt]raining data/i);
    assert.ok(projectDocsPos < codebasePos,
      'project docs phai truoc codebase');
    assert.ok(codebasePos < trainingPos,
      'codebase phai truoc training data');
  });

  it('fallback tu dong, KHONG hoi user (D-03)', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'references', 'context7-pipeline.md'), 'utf8');
    assert.match(content, /tu dong|TU DONG/,
      'fallback phai ghi ro tu dong');
    assert.match(content, /KHONG hoi/,
      'fallback phai ghi KHONG hoi user');
  });

  it('training data co warning (D-04)', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'references', 'context7-pipeline.md'), 'utf8');
    assert.match(content, /knowledge s[aă]n/,
      'pipeline thieu warning training data');
    assert.match(content, /khong chinh xac/,
      'pipeline thieu canh bao khong chinh xac');
  });

  it('pipeline KHONG con hard-stop 3 lua chon (thay the boi fallback)', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'references', 'context7-pipeline.md'), 'utf8');
    assert.ok(!content.includes('Tiep tuc khong docs'),
      'pipeline con sot hard-stop option 1');
    assert.ok(!content.includes('sua Context7 roi chay lai'),
      'pipeline con sot hard-stop option 2');
  });

  it('pipeline co transparency message format (D-11)', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'references', 'context7-pipeline.md'), 'utf8');
    assert.match(content, /nguon:/,
      'pipeline thieu transparency message format');
  });

  it('version detection co monorepo heuristic (D-08)', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'references', 'context7-pipeline.md'), 'utf8');
    assert.match(content, /nest-cli\.json/,
      'pipeline thieu NestJS monorepo heuristic');
    assert.match(content, /next\.config/,
      'pipeline thieu NextJS monorepo heuristic');
  });

  it('khong tim thay version thi dung latest (D-10)', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'references', 'context7-pipeline.md'), 'utf8');
    assert.match(content, /latest/,
      'pipeline thieu latest fallback khi khong co version');
  });
});
```

## Context7 API Analysis (Version Support)

**Confidence: HIGH** -- verified from official docs + GitHub repo + DeepWiki.

### resolve-library-id
| Parameter | Required | Description |
|-----------|----------|-------------|
| `libraryName` | Yes | Library name (e.g., "react", "next.js") |
| `query` | Yes | User's question/task for relevance ranking |

**No version parameter.** Returns library IDs in format `/org/project`. Response includes "Versions" field listing available versions.

### query-docs
| Parameter | Required | Description |
|-----------|----------|-------------|
| `libraryId` | Yes | Context7-compatible ID (e.g., `/facebook/react`) |
| `topic` | No | Focus on specific topic (e.g., "routing") |
| `tokens` | No | Max tokens to return (default 5000) |

**No dedicated version parameter.** However, the official docs state: "To get documentation for a specific library version, just mention the version in your prompt." This means version info should be included in the `topic` or `query` parameter text.

### Version Strategy for Pipeline
Based on Context7's API:
1. Detect version from manifest (Buoc 0)
2. Include version in `query` parameter when calling `resolve-library-id` (e.g., query: "How to use NestJS guards v10.3.0")
3. Include version in `topic` parameter when calling `query-docs` (e.g., topic: "guards setup v10.3.0")
4. Record version in transparency message regardless

This aligns with D-07: "Truyen vao resolve-library-id hoac query-docs neu Context7 ho tro. Neu khong ho tro: ghi nhan version cho transparency message."

## State of the Art

| Old Approach (Phase 6) | New Approach (Phase 7) | Impact |
|-------------------------|------------------------|--------|
| Context7 fail -> hard stop + 3 user choices | Context7 fail -> auto fallback chain | No user interruption, faster workflow |
| No version awareness | Auto-detect from manifest + pass to Context7 | More accurate library docs |
| No transparency | Single-line source attribution per lookup | User knows documentation provenance |
| Manual /pd:fetch-doc fallback | Automatic .planning/docs/ scan | Seamless use of pre-fetched docs |

**Phase 6 items replaced by Phase 7:**
- "Xu ly loi" section with 3 user choices (D-10/D-11 from Phase 6) -> replaced by auto-fallback chain
- "KHONG am tham tiep tuc khi Context7 khong kha dung" -> replaced by transparent fallback with source attribution

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
| LIBR-02a | Fallback chain exists in pipeline (3 sources in order) | unit | `node --test test/smoke-integrity.test.js` | Wave 0 |
| LIBR-02b | Fallback is automatic (KHONG hoi user) | unit | `node --test test/smoke-integrity.test.js` | Wave 0 |
| LIBR-02c | Training data has warning message | unit | `node --test test/smoke-integrity.test.js` | Wave 0 |
| LIBR-02d | Old hard-stop 3 choices removed | unit | `node --test test/smoke-integrity.test.js` | Wave 0 |
| LIBR-02e | Transparency message format present | unit | `node --test test/smoke-integrity.test.js` | Wave 0 |
| LIBR-03a | Buoc 0 Version section exists | unit | `node --test test/smoke-integrity.test.js` | Wave 0 |
| LIBR-03b | All 3 manifest types referenced | unit | `node --test test/smoke-integrity.test.js` | Wave 0 |
| LIBR-03c | Monorepo heuristics present | unit | `node --test test/smoke-integrity.test.js` | Wave 0 |
| LIBR-03d | Missing version falls back to "latest" | unit | `node --test test/smoke-integrity.test.js` | Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-integrity.test.js`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] New `describe('Repo integrity -- library fallback and version detection')` block in `test/smoke-integrity.test.js` -- covers LIBR-02a through LIBR-03d
- No new test files needed -- extend existing smoke-integrity.test.js

## Project Docs Matching Strategy (Claude's Discretion)

### Recommended algorithm for matching library name to .planning/docs/ files:

1. **Normalize library name:** `@nestjs/common` -> `nestjs`, `react-dom` -> `react`, `@angular/core` -> `angular`
2. **Exact filename match:** check if `[normalized].md` exists (e.g., `nestjs.md`)
3. **Prefix match:** check if any file starts with normalized name (e.g., `nestjs-guards.md`, `nestjs-pipes.md`)
4. **Keyword match in metadata:** Grep doc files for library name in their `> Nguon:` header line
5. **Multiple matches:** use the file whose title/topic is most relevant to the current task context
6. **No match:** skip to fallback 2 (codebase)

### Recommended algorithm for codebase examples scan:

1. **Import statements:** Grep for `import.*from.*['"][library-name]` or `require\(['"][library-name]`
2. **Usage patterns:** Grep for common API calls specific to the library
3. **Order:** import patterns first (more reliable), then usage patterns (wider coverage)
4. **Scope:** scan only source files (.ts, .tsx, .js, .jsx, .py, .php, .dart), exclude node_modules/vendor/build

## Version Range Handling (Claude's Discretion)

### Recommended approach:
- **Show raw range in transparency message:** `@nestjs/common v^10.3.0` -- honest, no lossy conversion
- **Extract base version for Context7 query:** strip ^/~/>=/<= prefix, use the version number in query text
- **Examples:**
  - `^10.3.0` -> query includes "v10.3" (major.minor)
  - `~4.18.2` -> query includes "v4.18" (major.minor)
  - `>=3.0.0` -> query includes "v3" (major only)
  - `4.17.21` (pinned) -> query includes "v4.17.21" (exact)

## Open Questions

1. **How should .planning/docs/ filename matching handle scoped packages?**
   - What we know: D-05 gives example `nestjs-guards.md` for `@nestjs/common`. The match is keyword-based, not exact.
   - What's unclear: Edge cases with very generic names (e.g., library named "core" matching multiple doc files).
   - Recommendation: Use the strategy documented above (normalize -> exact -> prefix -> keyword). In ambiguous cases, prefer the most recently created doc file. This is simple to describe in the pipeline and robust enough for real usage.

2. **Should fallback 2 (codebase examples) return code snippets or just confirm the library is used?**
   - What we know: The purpose is to give the LLM enough context to generate correct API calls.
   - What's unclear: Whether a simple "library X is imported in file Y" is sufficient vs extracting usage examples.
   - Recommendation: Grep for import statements + up to 3 usage examples. The pipeline instruction should say "Grep import patterns + doc usage examples trong code" without being overly prescriptive about the exact extraction logic. The LLM will handle the details.

## Sources

### Primary (HIGH confidence)
- Direct file reads of `references/context7-pipeline.md` -- current 27-line pipeline structure
- Direct file reads of `commands/pd/fetch-doc.md` Buoc 1 -- version detection pattern
- Direct file reads of `workflows/scan.md` -- tech-stack detection heuristics
- Direct file reads of `workflows/init.md` -- monorepo detection patterns
- Direct file reads of `test/smoke-integrity.test.js` -- 38 passing tests, existing patterns
- 07-CONTEXT.md user decisions (D-01 through D-12)
- Context7 official GitHub repo (https://github.com/upstash/context7) -- API parameters
- Context7 DeepWiki docs (https://deepwiki.com/upstash/context7/4.1-resolve-library-id) -- resolve-library-id response format
- Context7 official docs (https://context7.com/docs/agentic-tools/ai-sdk/tools/resolve-library-id) -- tool specifications

### Secondary (MEDIUM confidence)
- Phase 6 research and CONTEXT.md -- established patterns and decisions being extended
- Smithery.ai Context7 listing (https://smithery.ai/server/@upstash/context7) -- API overview

### Tertiary (LOW confidence)
- None -- all findings verified with primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries, reuses existing test infrastructure
- Architecture: HIGH - single-file expansion of existing pipeline, patterns copied from existing fetch-doc.md and scan.md
- Context7 API: HIGH - verified from official docs, GitHub, and DeepWiki that no version parameter exists; version goes in query text
- Pitfalls: HIGH - derived from direct analysis of existing code and Phase 6 patterns

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable -- markdown file modification, no external dependency changes)
