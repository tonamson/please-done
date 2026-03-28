# Phase 66: Workflow Translation - Research

**Researched:** 2026-03-28
**Domain:** Vietnamese-to-English translation of 13 workflow markdown files
**Confidence:** HIGH

## Summary

Phase 66 translates 13 workflow files (3,610 lines total) from Vietnamese to English. This is the heaviest translation batch in the v6.0 migration — workflows contain dense procedural instructions with step numbering ("Bước X"), XML structure tags, cross-references, and conditional logic tables.

The translation is purely linguistic — no structural, behavioral, or logic changes. Phase 65 established a proven pattern: translate prose, preserve markers/tags/placeholders, verify with grep sweep, run regression tests. Phase 66 follows the same approach but adds one critical concern: **test assertions in `smoke-integrity.test.js` that match Vietnamese strings within workflow files** must be updated to match the new English content (per D-08).

**Primary recommendation:** Translate workflows in 2 batches (7 smaller → 6 larger) per D-07. Update `smoke-integrity.test.js` assertions that directly reference Vietnamese workflow content within the same batch that translates those workflows. Run `node --test test/smoke-integrity.test.js` after each batch to confirm zero regressions.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Translate all 13 workflow files in `workflows/`. Do not expand scope to agents, rules, references, templates, or other directories (phases 67-68).
- **D-02:** Preserve all frontmatter keys, XML tags, placeholders (`$ARGUMENTS`, `@...`), and command semantics — only translate descriptive/prose content. (Carried from Phase 65)
- **D-03:** Do not rename files, change paths, or reorganize file structure. (Carried from Phase 65)
- **D-04:** Translate "Bước X" → "Step X" uniformly. Preserve sub-step patterns: "Bước 1.7" → "Step 1.7", "Bước 5b.1" → "Step 5b.1".
- **D-05:** Standardize English terminology: `phase`, `milestone`, `verification`, `requirements`, `success criteria`. (Carried from Phase 65)
- **D-06:** User-facing output text translates to English; variable names, file names, command names stay as-is. (Carried from Phase 65)
- **D-07:** Plan 01 handles 7 smaller workflows (init, scan, conventions, what-next, research, complete-milestone, test). Plan 02 handles 6 larger workflows (write-code, fix-bug, fix-bug-v1.5, plan, new-milestone, audit).
- **D-08:** Update test assertion strings in `smoke-integrity.test.js` that directly reference workflow content (Vietnamese test names, Vietnamese assertion strings about workflows). Prevents immediate regressions.
- **D-09:** Defer broader test string migration to Phase 69 (SYNC-02). Only fix assertions that would break from translating workflows.
- **D-10:** Preserve all `@workflows/name.md`, `@references/name.md`, `@templates/name.md` path references exactly. Translate only surrounding descriptive text.
- **D-11:** After translation, grep for Vietnamese diacritics across all 13 workflow files to confirm zero Vietnamese text remaining.
- **D-12:** Run `node --test test/smoke-integrity.test.js` to confirm no regressions.

### Claude's Discretion

- Specific English phrasing choices, as long as meaning and behavior are preserved.
- How to batch commits during the translation process.
- Whether to use temp files or direct edits (temp files recommended based on Phase 65 experience).

### Deferred Ideas (OUT OF SCOPE)

None.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TRANS-03 | Translate 13 workflow files (workflows/*.md) from Vietnamese to English | File inventory verified: 13 files, 3,610 lines total, 212 "Bước" occurrences, 1,794 lines with Vietnamese diacritics |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Use English throughout, with standard grammar and spelling

## Standard Stack

No external libraries required. This phase uses only existing project tools:

| Tool | Purpose | Why |
|------|---------|-----|
| `grep` (BSD) | Vietnamese diacritic sweep verification | Available on macOS, sufficient for regex character class matching |
| `node --test` | Run smoke-integrity.test.js | Node.js v24.13.0 already installed |
| `wc -l` | Line count validation | Standard UNIX tool |

## Architecture Patterns

### Workflow File Structure

All 13 workflow files follow a consistent structure with these XML tags:

| Tag | Count | Preservation Rule |
|-----|-------|-------------------|
| `<process>` | 13 (all files) | Keep tag, translate content inside |
| `<purpose>` | 12 | Keep tag, translate content |
| `<rules>` | 13 | Keep tag, translate content |
| `<required_reading>` | 9 | Keep tag, translate descriptions but preserve `@path` refs |
| `<conditional_reading>` | 10 | Keep tag, translate descriptions but preserve `@path` refs |
| `<research_injection>` | 2 | Keep tag, translate content |
| `<context>` | 1 | Keep tag, translate content |
| `<verification_loop>` | 1 | Keep tag, translate content |
| `<success_criteria>` | 2 | Keep tag, translate content |

### Step Numbering Inventory

Total "Bước" occurrences across all 13 files: **212**

| File | "Bước" count | Vietnamese diacritic lines |
|------|-------------|---------------------------|
| plan.md | 38 | 305 |
| write-code.md | 39 | 284 |
| fix-bug-v1.5.md | 35 | 278 |
| new-milestone.md | 7 | 194 |
| complete-milestone.md | 17 | 170 |
| audit.md | 13 | 134 |
| test.md | 15 | 127 |
| init.md | 18 | 85 |
| scan.md | 10 | 63 |
| what-next.md | 8 | 57 |
| research.md | 6 | 53 |
| conventions.md | 6 | 44 |
| fix-bug.md | 0 | 0 |

**Note:** `fix-bug.md` uses non-diacritical Vietnamese (e.g., "Buoc", "Kiem tra") — 408 lines of Vietnamese content without diacritics. The diacritic grep will pass, but the content still needs translation to English.

### Cross-Reference Patterns

Workflows reference each other and other files via `@type/name.md`:
- `@workflows/name.md` — inter-workflow references
- `@references/name.md` — shared reference files
- `@templates/name.md` — template files

All these path references must be preserved verbatim (per D-10).

### Translation Pattern (from Phase 65)

Phase 65 established a proven translation workflow:
1. Read source file completely
2. Translate prose content to English
3. Preserve: XML tags, frontmatter keys, placeholders (`$ARGUMENTS`, `@path` refs), command names (`/pd:*`), variable names, file paths
4. Convert step numbering: "Bước X" → "Step X" (including sub-steps)
5. Write translated content
6. Verify with grep diacritic sweep
7. Run regression tests

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Vietnamese detection | Custom parser | `grep '[àáạ...ỹ]' workflows/*.md` | Simple regex covers all diacritic characters; already proven in Phase 65 |
| Test regression check | Manual file comparison | `node --test test/smoke-integrity.test.js` | Existing test suite catches structural and content regressions |
| Non-diacritical Vietnamese detection | Automated tool | Manual review during translation | Non-diacritical Vietnamese (like in fix-bug.md) cannot be reliably detected by regex |

## Common Pitfalls

### Pitfall 1: Missing Non-Diacritical Vietnamese

**What goes wrong:** `fix-bug.md` and potentially other files contain Vietnamese without diacritics (e.g., "Kiem tra", "Buoc", "Thieu"). The diacritic grep sweep (D-11) will show zero matches, but the file still has Vietnamese text.
**Why it happens:** Diacritic grep only catches accented characters, not all Vietnamese words.
**How to avoid:** During translation, read each file fully. Don't rely solely on grep to identify Vietnamese content — use it only as a safety gate for diacritical characters.
**Warning signs:** A workflow file showing 0 diacritic lines but clearly having Vietnamese prose.

### Pitfall 2: Breaking Test RegExp Assertions

**What goes wrong:** `smoke-integrity.test.js` has assertions that match Vietnamese strings within workflow files. Translating the workflow without updating the test causes test failures.
**Why it happens:** Tests use regex patterns that match specific Vietnamese words/phrases in workflow content.
**How to avoid:** Update test assertions in the SAME batch as the corresponding workflow translation. See "Critical Test Assertions" section below for the exhaustive list.
**Warning signs:** `node --test test/smoke-integrity.test.js` fails after translating a workflow.

### Pitfall 3: Altering Tabular Structure or Markdown Formatting

**What goes wrong:** Markdown tables in workflows have specific column alignment. Translation may produce longer/shorter text that breaks table rendering or changes whitespace behavior.
**Why it happens:** Vietnamese words may be shorter/longer than English equivalents.
**How to avoid:** After translation, verify tables still render correctly. Don't pad or align — just ensure pipe characters are in the right places.
**Warning signs:** Misaligned pipe `|` characters in translated tables.

### Pitfall 4: Changing Command Semantics During Translation

**What goes wrong:** Translating action verbs in step instructions changes what the AI agent does.
**Why it happens:** Over-translation — e.g., translating "DỪNG" (STOP) to something softer, or expanding abbreviations.
**How to avoid:** Key behavioral keywords: "DỪNG" → "STOP", "BẮT BUỘC" → "REQUIRED", "KHÔNG" → "DO NOT", "CHỈ" → "ONLY". Maintain the same force level.
**Warning signs:** Behavioral instructions becoming less imperative after translation.

### Pitfall 5: Regex Patterns in Workflow Content

**What goes wrong:** Some workflows contain regex patterns or grep commands that match Vietnamese text. Translating the surrounding prose but not adjusting inline regex patterns breaks functionality.
**Why it happens:** Not distinguishing between prose Vietnamese and Vietnamese within code/regex blocks.
**How to avoid:** Preserve code blocks, inline code, and regex patterns exactly as-is unless they contain user-visible Vietnamese text that is part of the workflow instruction (not the matched pattern).
**Warning signs:** Code blocks containing Vietnamese strings — evaluate each case: is this static text to match, or prose to translate?

## Critical Test Assertions — Impact Analysis

### Assertions That WILL Break (must update per D-08)

These test assertions match Vietnamese strings in workflow files being translated:

| Line | Test | Regex/Match | Workflow | Required Change |
|------|------|-------------|----------|-----------------|
| 115 | `inlineWorkflow xử lý được mọi command có workflow` | `/(Bước\|Buoc) [0-9]+/` | All via inline | Update regex to `/(Step\|Bước\|Buoc) [0-9]+/` or `/(Step) [0-9]+/` |
| 693 | `fix-bug workflow co single-agent fallback` | `/Kiem tra che do hoat dong/` | fix-bug.md | Update to match English translation (e.g., `/Check operating mode/`) |
| 727 | `test workflow co effort routing` | `/Effort routing cho test/` | test.md | Update to match English (e.g., `/Effort routing for test/`) |
| 1144 | `write-code.md co post-wave build check` | `/build fail.*D[UƯ]NG\|D[UƯ]NG.*build fail/is` | write-code.md | Update to use `STOP` (e.g., `/build fail.*STOP\|STOP.*build fail/is`) |
| 1156 | `write-code.md co agent context minimization` | `/KH[OÔ]NG dump to[aà]n b[oộ] PLAN/i` | write-code.md | Update to English (e.g., `/DO NOT dump (the )?entire PLAN/i`) |
| 1168 | `write-code.md co > Files: cross-reference` | `/> Files:.*cross-reference\|giao nhau/i` | write-code.md | Already handles English "cross-reference" — can simplify to remove Vietnamese "giao nhau" |

### Assertions That Need Careful Review (may or may not break)

| Line | Test | Regex/Match | Workflow | Risk |
|------|------|-------------|----------|------|
| 339 | output section check | `/Next step\|Buoc tiep theo\|Bước tiếp theo/` | Skills (not workflows) | LOW — checks skill files, not workflow files directly. Already has English "Next step" variant. |
| 615, 623 | `plan workflow co effort classification` | `/Effort level/` | plan.md | LOW — "Effort level" is already English. Test description uses Vietnamese "Buoc 5" but regex checks English string. |
| 655 | `write-code workflow co effort->model routing` | `/model:\s*\{resolved_model\}/` | write-code.md | LOW — regex checks English/code pattern. Test description uses Vietnamese "Buoc 10". |

### Assertions That DO NOT Break (reference files, not workflows)

Tests checking `references/context7-pipeline.md`, `references/guard-*.md`, `references/conventions.md`, and `templates/*.md` are out of scope for Phase 66. These files belong to phases 67-68.

### Test Name Strings (Vietnamese test names)

Per D-09, Vietnamese test names like `"mỗi command có frontmatter tối thiểu"` and assertion messages like `"thiếu frontmatter.name"` are deferred to Phase 69 (SYNC-02). Phase 66 only updates assertions whose regex patterns would fail due to workflow content changing.

## Code Examples

### Step Numbering Translation

```markdown
# Before (Vietnamese)
## Bước 1: Xác định đường dẫn dự án
## Bước 1.5: Kiểm tra khôi phục sau gián đoạn
## Bước 5b.1: Tạo session mới

# After (English)
## Step 1: Determine project path
## Step 1.5: Check recovery after interruption
## Step 5b.1: Create new session
```

### Behavioral Keyword Mapping

| Vietnamese | English | Force Level |
|------------|---------|-------------|
| DỪNG / DUNG | STOP | Hard stop |
| BẮT BUỘC / BAT BUOC | REQUIRED / MANDATORY | Mandatory |
| KHÔNG / KHONG | DO NOT | Prohibition |
| CHỈ / CHI | ONLY | Restriction |
| CÓ / CO | YES | Affirmative |
| THIẾU / THIEU | MISSING | Error condition |
| Chạy | Run | Action |
| Đọc | Read | Action |
| Ghi | Write | Action |
| Kiểm tra / Kiem tra | Check | Action |
| Cảnh báo / Canh bao | Warning | Alert |
| Hiển thị / Hien thi | Display | Action |

### Cross-Reference Preservation

```markdown
# Before — preserve @path references, translate surrounding text
Đọc KHI cần:
- @references/prioritization.md -> phân loại rủi ro bug -- KHI nhiều bugs cần ưu tiên
- @references/context7-pipeline.md -> tra cứu tài liệu thư viện qua Context7 -- KHI lỗi liên quan thư viện

# After
Read WHEN needed:
- @references/prioritization.md -> classify bug risk -- WHEN multiple bugs need prioritization
- @references/context7-pipeline.md -> look up library docs via Context7 -- WHEN error involves a library
```

### Test Assertion Update Pattern

```javascript
// Before (matches Vietnamese)
assert.match(
  content,
  /Kiem tra che do hoat dong/,
  "fix-bug.md: thieu Buoc 0 detection",
);

// After (matches English)
assert.match(
  content,
  /Check operating mode/,
  "fix-bug.md: missing Step 0 detection",
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Vietnamese workflow content | English workflow content | Phase 66 (current) | AI agents consume clearer instructions, reduced token ambiguity |
| "Bước X" step numbering | "Step X" step numbering | Phase 66 (current) | Standard English convention |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Test execution | ✓ | v24.13.0 | — |
| grep (BSD) | Vietnamese diacritic sweep | ✓ | 2.6.0-FreeBSD | — |
| git | Commits | ✓ | — | — |

No missing dependencies.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner |
| Config file | None — uses `node --test` directly |
| Quick run command | `node --test test/smoke-integrity.test.js` |
| Full suite command | `node --test test/smoke-*.test.js` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TRANS-03 | All 13 workflow files contain zero Vietnamese diacritics | smoke | `grep -c '[àáạảãâầấậẩẫăằắặẳẵđèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹ]' workflows/*.md \|\| true` | ✅ (inline command) |
| TRANS-03 | Workflow structure preserved (XML tags, cross-refs) | smoke | `node --test test/smoke-integrity.test.js` | ✅ |
| TRANS-03 | Step numbering uses English convention | manual | Visual review during translation | N/A |

### Sampling Rate

- **Per task commit:** `grep -c '[àáạ...ỹ]' workflows/{translated-files} && node --test test/smoke-integrity.test.js`
- **Per wave merge:** `node --test test/smoke-integrity.test.js`
- **Phase gate:** Full diacritic sweep + test suite green

### Wave 0 Gaps

None — existing test infrastructure covers all phase requirements. No new test files needed.

## Sources

### Primary (HIGH confidence)

- Direct file inspection: all 13 workflow files read and measured
- `test/smoke-integrity.test.js` — 1,185 lines, all assertions analyzed for Vietnamese content matching against workflow files
- Phase 65 research + verification report — proven translation patterns
- `CONTEXT.md` — locked decisions from discuss phase

### Secondary (MEDIUM confidence)

- Phase 65 01-SUMMARY.md — execution experience (translation approach validated)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no external libraries needed, only existing project tools
- Architecture: HIGH — file structure and patterns directly inspected from source files
- Pitfalls: HIGH — test assertion impact exhaustively analyzed line-by-line from smoke-integrity.test.js
- Test impact map: HIGH — every assertion referencing workflow files reviewed

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable — translation is a one-time operation)
