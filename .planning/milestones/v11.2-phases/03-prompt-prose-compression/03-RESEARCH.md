# Phase 3: Prompt Prose Compression - Research

**Researched:** 2026-03-22
**Domain:** LLM prompt optimization / prose compression for Vietnamese+English AI skill files
**Confidence:** HIGH

## Summary

Phase 3 targets a 30-40% token reduction across all skill files (commands/pd/*.md), workflow files (workflows/*.md), reference files (references/*.md), and template files (templates/*.md) totaling 6,243 lines and ~320KB. The compression uses telegraphic shorthand style while preserving all behavioral instructions (things the AI must DO, CHECK, STOP, CREATE, UPDATE, COMMIT).

The primary compression opportunity is in workflow files (3,363 lines -- 54% of total), with the top 3 targets being new-milestone.md (667 lines), write-code.md (526 lines), and plan.md (454 lines). These files contain extensive prose explanations, verbose conditional logic, redundant context-setting paragraphs, and repeated pattern descriptions that can be compressed to arrow notation and bullet shorthand without losing behavioral meaning.

Token counting should use `js-tiktoken` (pure JS, no native deps, 2.8M weekly downloads, compatible with Node >=16.7.0 requirement). Baseline measurement before compression, per-file tracking during, and final comparison after.

**Primary recommendation:** Establish baseline token counts first, then compress files in descending size order (workflows > commands > references > templates), using behavioral instruction extraction checklists before and after each file.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Compress ALL file types: skills (1,125 lines), workflows (3,363 lines), references (985 lines), templates (770 lines)
- Workflows are the primary target -- 3x larger than skills, most prose lives there
- Top targets by size: workflows/new-milestone.md (667), workflows/write-code.md (526), workflows/plan.md (454)
- Telegraphic shorthand style -- maximize token savings
- Arrow notation: use arrows and inline symbols instead of full sentences
- Emoji status inline for state descriptions
- Bullet lists over paragraphs, tables over verbose explanations
- Remove filler words, redundant context, repeated explanations
- PRESERVE: all behavioral instructions (what AI must DO), guard conditions, error messages, user-facing strings
- Use tiktoken to count tokens before/after compression
- Establish baseline token count for all target files before starting
- Target: 30-40% total token reduction across all files
- Track per-file reduction to ensure even compression
- Before compressing each file: extract a before/after checklist of all behavioral instructions
- After compressing: verify every behavioral instruction from checklist is still present
- If any instruction missing -> add it back before moving on
- Behavioral = things the AI must DO, CHECK, STOP, CREATE, UPDATE, COMMIT

### Claude's Discretion
- Exact compression decisions per sentence/paragraph
- Whether to merge related bullet points or keep separate
- Table vs list format decisions within each file
- Order of files to compress (priority by token savings potential)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

### Specific Constraints
- Vietnamese content stays Vietnamese -- compress prose, don't translate
- Guard content already extracted to micro-templates (Phase 2) -- don't re-compress guards
- Phase 1 canonical section order is stable -- compress within sections, don't reorganize
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TOKN-02 | Reduce 30-40% text lines in workflow prose (structural content, don't touch behavioral instructions) | Compression technique (telegraphic shorthand), measurement (tiktoken baseline/after), behavioral verification (checklist extraction), file inventory with line counts |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| js-tiktoken | latest | Token counting for baseline and verification | Pure JS port of OpenAI tiktoken, 2.8M weekly downloads, no native deps, works with Node >=16.7.0, supports cl100k_base encoding used by Claude/GPT models |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node:fs | built-in | Read/write compressed files | All file operations |
| node:path | built-in | File path resolution | Locating target files |
| node:test | built-in | Test runner (already used by project) | Verification tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| js-tiktoken | tiktoken (WASM) | WASM version is faster but requires native bindings; js-tiktoken is pure JS, zero-dep, sufficient for file-level counting |
| js-tiktoken | Manual word/char counting | Not accurate for LLM token estimation; tiktoken matches actual model tokenization |

**Installation:**
```bash
npm install --save-dev js-tiktoken
```

## Architecture Patterns

### File Inventory and Compression Priority

Target files organized by compression priority (largest first = most savings):

```
workflows/           # 3,363 lines (54%) -- PRIMARY TARGET
  new-milestone.md     667 lines  -- highest priority
  write-code.md        526 lines
  plan.md              454 lines
  fix-bug.md           399 lines
  test.md              302 lines
  complete-milestone.md 279 lines
  scan.md              243 lines
  init.md              182 lines
  what-next.md         169 lines
  conventions.md       142 lines

commands/pd/         # 1,125 lines (18%)
  update.md            190 lines
  fetch-doc.md         152 lines
  write-code.md        101 lines
  plan.md               92 lines
  new-milestone.md      92 lines
  test.md               85 lines
  fix-bug.md            80 lines
  complete-milestone.md 79 lines
  init.md               69 lines
  scan.md               65 lines
  conventions.md        58 lines
  what-next.md          62 lines

references/          # 985 lines (16%)
  security-checklist.md 296 lines  -- large but behavioral-heavy
  ui-brand.md           223 lines
  verification-patterns.md 150 lines
  state-machine.md      105 lines
  conventions.md         84 lines
  questioning.md         67 lines
  prioritization.md      56 lines
  guard-*.md              4 lines total (SKIP -- already micro-templates)

templates/           # 770 lines (12%)
  plan.md              189 lines
  roadmap.md            89 lines
  research.md           76 lines
  verification-report.md 73 lines
  tasks.md              67 lines
  requirements.md       64 lines
  project.md            59 lines
  state.md              55 lines
  current-milestone.md  50 lines
  progress.md           48 lines
```

### Pattern 1: Behavioral Instruction Extraction Checklist

**What:** Before compressing any file, extract all behavioral instructions into a checklist. After compression, verify every item is still present.

**When to use:** Every file compression.

**How to identify behavioral instructions:**
```
Behavioral verbs (Vietnamese):
  DUNG (STOP), thong bao (notify), tao (create), doc (read),
  cap nhat (update), kiem tra (check), commit, ghi (write),
  hoi user (ask user), canh bao (warn), xoa (delete),
  nhay (jump to), tiep tuc (continue), bo qua (skip)

Behavioral markers:
  -> **DUNG** (STOP conditions)
  PHAI / PHẢI (MUST)
  KHONG / KHÔNG (MUST NOT)
  CAM / CẤM (FORBIDDEN)
  BAT BUOC / BẮT BUỘC (REQUIRED)
  AskUserQuestion (user interaction)
  Conditional branches: "Neu ... thi ..." / "Nếu ... thì ..."
  Error handling: "Nếu lỗi / fail / thất bại ..."
```

### Pattern 2: Telegraphic Compression

**What:** Convert prose to shorthand notation.

**When to use:** Structural/explanatory text that adds context but not behavioral instructions.

**Transformation rules:**
```
BEFORE (full prose):
  "Kiểm tra `.planning/CURRENT_MILESTONE.md` tồn tại:
   - Nếu KHÔNG tồn tại → DỪNG, thông báo: 'Thiếu CURRENT_MILESTONE.md. Chạy /pd:new-milestone để tạo.'"

AFTER (telegraphic):
  "`.planning/CURRENT_MILESTONE.md` → không có → DỪNG: 'Thiếu. Chạy `/pd:new-milestone`.'"

BEFORE (explanation paragraph):
  "Mục đích: giữ tầm nhìn dự án + lịch sử milestones xuyên suốt.
   Xem mẫu chi tiết: @templates/project.md"

AFTER (compressed):
  "> Mẫu: @templates/project.md"
```

### Pattern 3: Table Compression for Conditional Logic

**What:** Convert verbose if/else chains into compact tables.

**When to use:** Multi-branch conditional logic in workflow steps.

**Example:**
```
BEFORE:
  "- Nếu `$ARGUMENTS` chỉ định task number → đọc trạng thái task đó:
    - ⬜ hoặc 🔄 → tiếp tục (🔄 = resume task đang làm dở)
    - ✅ → hỏi user: 'Task [N] đã hoàn tất. Bạn muốn thực hiện lại?'
    - ❌ → hỏi user: 'Task [N] đang bị chặn. Xác nhận vẫn muốn tiếp tục?'
    - 🐛 → thông báo: 'Task [N] có lỗi. Nên chạy /pd:fix-bug thay vì viết lại code.'"

AFTER:
  "| Trạng thái | Hành động |
   |⬜/🔄|Tiếp tục (🔄=resume)|
   |✅|Hỏi: 'Thực hiện lại?'|
   |❌|Hỏi: 'Xác nhận tiếp tục?' → đổi ❌→🔄|
   |🐛|'Chạy `/pd:fix-bug`.'|"
```

### Anti-Patterns to Avoid
- **Removing STOP/DUNG conditions:** These are critical guard rails. Compress the surrounding prose, keep the action.
- **Merging distinct behavioral branches:** Two different conditional paths that lead to different actions must remain separate, even if they look similar.
- **Compressing AskUserQuestion blocks:** These define user interaction points. The label/description/options structure must be preserved (though option descriptions can be shortened).
- **Removing error recovery instructions:** Recovery steps (e.g., Buoc 1.1 in write-code) are behavioral -- compress prose around them, keep the logic.
- **Compressing guard micro-templates:** Already extracted to references/guard-*.md in Phase 2. Only 1 line each. Skip entirely.
- **Reorganizing section order:** Phase 1 established canonical order. Compress WITHIN sections only.
- **Compressing frontmatter:** YAML between `---` markers is machine-parsed. Do not touch.
- **Compressing XML tags:** `<objective>`, `<process>`, `<guards>`, etc. are structural markers parsed by converters. Keep tags, compress content inside.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token counting | Manual word/character counting | js-tiktoken with cl100k_base encoding | LLM tokenization is subword-based, not word-based; manual counting will give wrong results |
| Behavioral extraction | Regex-only pattern matching | Manual review + keyword-guided search | Behavioral instructions have too many forms to reliably auto-extract; human review is essential |
| Compression quality check | Automated diff comparison | Before/after behavioral checklist + test invocations | Semantic preservation cannot be verified by string diff alone |

## Common Pitfalls

### Pitfall 1: Silent Behavioral Loss
**What goes wrong:** A compression removes a conditional branch or STOP condition that looks like "just explanation" but is actually a critical guard.
**Why it happens:** Vietnamese prose mixes behavioral instructions with explanatory context in the same sentence.
**How to avoid:** Extract behavioral checklist BEFORE compressing. After compression, check every item. Specifically watch for: DUNG/STOP, PHAI/MUST, KHONG/MUST NOT, conditional branches with different actions.
**Warning signs:** Compressed file has fewer bullet points than the behavioral checklist has items.

### Pitfall 2: Breaking Converter Compatibility
**What goes wrong:** Compression changes file structure in a way that breaks inlineWorkflow(), extractXmlSection(), or platform converters.
**Why it happens:** The converter pipeline depends on specific patterns: `@workflows/X.md` references, `<process>...</process>` XML tags, `<required_reading>` sections, frontmatter fields.
**How to avoid:** Run `npm test` after each file compression. The smoke-integrity.test.js suite verifies: frontmatter parsing, XML section extraction, workflow inlining, cross-platform conversion.
**Warning signs:** Missing `<process>` tag content, broken `@workflows/` or `@references/` references, missing frontmatter fields.

### Pitfall 3: Uneven Compression
**What goes wrong:** Some files are compressed heavily (50%+) while others barely change, leading to inconsistent quality and potentially over-compressed files that lose nuance.
**Why it happens:** Large files with lots of explanation are easy to compress; small files with dense behavioral content resist compression.
**How to avoid:** Track per-file token reduction. Target 25-45% per file with exceptions for already-dense files (guard micro-templates, conventions.md). Flag any file below 15% or above 50% for review.
**Warning signs:** Standard deviation of per-file reduction rates is very high.

### Pitfall 4: Losing Vietnamese Diacritical Context
**What goes wrong:** Compression inadvertently changes Vietnamese diacritical marks (e.g., "PHẢI" becomes "PHAI" in non-guard sections, or vice versa).
**Why it happens:** Guards use non-diacritical Vietnamese (Phase 1 convention), but prose uses diacritical Vietnamese. Mixing conventions during compression.
**How to avoid:** Guards section: keep non-diacritical. All other sections: keep diacritical Vietnamese. Do not change the diacritical convention of any section.
**Warning signs:** `smoke-integrity.test.js` guard tests start failing; prose sections have inconsistent diacritical usage.

### Pitfall 5: Template Placeholder Damage
**What goes wrong:** Templates contain placeholder patterns like `[tên]`, `[version]`, `[DD_MM_YYYY]` that get compressed or merged, breaking the template structure.
**Why it happens:** Placeholders look like filler text.
**How to avoid:** Identify and preserve all `[bracketed]` placeholders and `{curly}` patterns in templates. These are fill-in fields used by skills at runtime.
**Warning signs:** Template files produce malformed output when used by plan/write-code skills.

### Pitfall 6: Reference File Over-Compression
**What goes wrong:** security-checklist.md (296 lines) is compressed aggressively, losing specific attack patterns, regex examples, or remediation steps.
**Why it happens:** Security checklist looks verbose but every row in the tables is a distinct check with specific detection and fix patterns.
**How to avoid:** In reference files with tables, each table row is likely behavioral. Compress prose paragraphs between tables, but keep table content intact. The tables in security-checklist.md Phan D are essentially lookup tables used during code review -- do not compress their content.
**Warning signs:** Security review steps in write-code become vague or miss specific checks.

## Code Examples

### Token Counting Script Pattern
```javascript
// Script to measure baseline and post-compression token counts
const { encodingForModel } = require('js-tiktoken');
const fs = require('fs');
const path = require('path');

const enc = encodingForModel('gpt-4o'); // cl100k_base encoding

function countTokens(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const tokens = enc.encode(content);
  return { path: filePath, tokens: tokens.length, lines: content.split('\n').length };
}

// Target directories
const dirs = ['commands/pd', 'workflows', 'references', 'templates'];
const results = [];

for (const dir of dirs) {
  const fullDir = path.join(__dirname, dir);
  const files = fs.readdirSync(fullDir).filter(f => f.endsWith('.md'));
  for (const file of files) {
    results.push(countTokens(path.join(fullDir, file)));
  }
}

// Summary
const total = results.reduce((sum, r) => sum + r.tokens, 0);
console.table(results.map(r => ({
  file: path.relative(__dirname, r.path),
  tokens: r.tokens,
  lines: r.lines,
})));
console.log(`\nTotal: ${total} tokens across ${results.length} files`);
```

### Behavioral Instruction Extraction Pattern
```javascript
// Extract behavioral instructions from a file for pre/post comparison
const BEHAVIORAL_PATTERNS = [
  /→\s*\*\*DỪNG\*\*/g,           // STOP conditions
  /→\s*DỪNG/g,                    // STOP without bold
  /PHẢI|PHAI|BẮT BUỘC/g,         // MUST requirements
  /KHÔNG|KHONG|CẤM|CAM/g,        // MUST NOT / FORBIDDEN
  /AskUserQuestion/g,              // User interaction points
  /thông báo:|thong bao:/gi,      // Notification actions
  /commit/gi,                      // Commit actions
  /tạo|cap nhat|xóa|ghi/gi,      // Create/update/delete/write
  /nhảy.*Bước|nhay.*Buoc/gi,     // Jump-to-step instructions
  /Nếu.*→|Neu.*→/g,              // Conditional branches
];

function extractBehaviors(content) {
  const behaviors = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    for (const pattern of BEHAVIORAL_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(lines[i])) {
        behaviors.push({ line: i + 1, text: lines[i].trim() });
        break;
      }
    }
  }
  return behaviors;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Full prose instructions | Telegraphic shorthand + arrow notation | This phase | 30-40% token reduction per invocation |
| Verbose explanatory paragraphs | Bullet lists + tables | This phase | Faster AI parsing, less wasted context window |
| Repeated pattern descriptions across files | Guard micro-templates (Phase 2) + compressed inline | Phase 2 + Phase 3 | Guards already deduplicated, now compress remaining prose |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in, Node >=16.7.0) |
| Config file | package.json scripts.test |
| Quick run command | `node --test test/smoke-integrity.test.js` |
| Full suite command | `node --test 'test/*.test.js'` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TOKN-02-a | Total token count reduced by >= 30% | script | `node scripts/count-tokens.js` (compare with baseline) | Wave 0 |
| TOKN-02-b | All behavioral instructions preserved | manual + script | Extract behaviors before/after, diff | Wave 0 |
| TOKN-02-c | Converter compatibility maintained | integration | `node --test test/smoke-integrity.test.js` | Existing |
| TOKN-02-d | Cross-platform conversion still works | integration | `node --test test/smoke-converters.test.js` | Existing |
| TOKN-02-e | Skills produce identical outputs on representative invocations | manual | Compare skill invocation outputs before/after | Manual |

### Sampling Rate
- **Per file compression:** `node --test test/smoke-integrity.test.js` (fast, ~2s)
- **Per wave merge:** `node --test 'test/*.test.js'` (full suite)
- **Phase gate:** Full suite green + token count script shows >= 30% reduction

### Wave 0 Gaps
- [ ] `scripts/count-tokens.js` -- baseline token counting script (run before compression, save baseline, run after to compare)
- [ ] `test/baseline-tokens.json` -- saved baseline token counts per file
- [ ] Install `js-tiktoken` as devDependency

*(Existing test infrastructure covers converter compatibility and skill structure integrity)*

## Compression Strategy Notes

### What to Compress (high savings, low risk)
1. **Explanatory paragraphs** -- "Muc dich:", "Ghi chu:", context-setting prose
2. **Redundant descriptions** -- same concept explained differently in multiple places
3. **Verbose conditional prose** -- "Neu X ton tai thi lam Y, neu khong thi lam Z" -> table or arrow notation
4. **Step purpose descriptions** -- "> Muc dich: ..." lines before steps
5. **Filler words** -- "cac", "tat ca cac", "sau do", "tiep tuc", "bat dau", "dau tien" when not adding meaning
6. **Long option descriptions in AskUserQuestion** -- shorten description fields while keeping label + options intact
7. **Repeated cross-references** -- "xem @references/X.md" when already in execution_context

### What NOT to Compress (behavioral, high risk)
1. **STOP/DUNG conditions** -- every single one must remain
2. **Error messages and user-facing strings** -- exact wording matters
3. **Guard checklist items** -- already in micro-templates, skip
4. **AskUserQuestion structure** -- labels, options, multiSelect flags
5. **Step numbers and ordering** -- "Buoc 1", "Buoc 2" etc. used for cross-references ("nhay Buoc 7")
6. **File paths and reference paths** -- `@workflows/X.md`, `.planning/Y.md`
7. **Git commands and bash commands** -- exact syntax matters
8. **Table structure in reference files** -- each row is a lookup entry
9. **Code examples and regex patterns** -- used for pattern matching
10. **Frontmatter YAML** -- machine-parsed by converters
11. **XML section tags** -- `<process>`, `<guards>`, etc. parsed by extractXmlSection()

### Estimated Compression Potential by File Category
| Category | Lines | Prose % | Est. Compression | Est. Savings |
|----------|-------|---------|-------------------|-------------|
| Workflows | 3,363 | ~60% | 35-40% | ~1,200 lines |
| Commands | 1,125 | ~40% | 25-30% | ~310 lines |
| References | 985 | ~45% | 25-35% | ~300 lines |
| Templates | 770 | ~50% | 30-35% | ~260 lines |
| **Total** | **6,243** | | | **~2,070 lines (33%)** |

## Open Questions

1. **Exact encoding model for token counting**
   - What we know: js-tiktoken supports cl100k_base (GPT-4/Claude), o200k_base (GPT-4o)
   - What's unclear: Which encoding best approximates Claude's actual tokenizer
   - Recommendation: Use cl100k_base as reasonable approximation. The goal is relative reduction (30-40%), not absolute count. Any BPE tokenizer will show similar relative compression ratios.

2. **Template compression depth**
   - What we know: Templates contain structural markdown (tables, headings, comments) that serve as fill-in patterns
   - What's unclear: How aggressively to compress template "instruction" comments vs template "structure"
   - Recommendation: Compress instruction/explanation comments (lines starting with `<!-- ... -->` and `> Dung boi:` headers). Keep structural markdown intact (table headers, heading hierarchy, placeholder patterns).

## Sources

### Primary (HIGH confidence)
- Project codebase analysis -- direct file reading of all 45 target files
- smoke-integrity.test.js -- existing test infrastructure verification
- utils.js -- converter pipeline and XML section extraction logic
- package.json -- Node >=16.7.0 engine requirement, existing test scripts

### Secondary (MEDIUM confidence)
- [js-tiktoken npm](https://www.npmjs.com/package/js-tiktoken) -- package capabilities, weekly downloads, compatibility
- [tiktoken npm](https://www.npmjs.com/package/tiktoken) -- WASM alternative considered

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- js-tiktoken is well-established, project has no native dep constraints
- Architecture: HIGH -- file inventory and compression patterns derived from direct codebase analysis
- Pitfalls: HIGH -- identified from actual file content analysis and converter pipeline review

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable domain -- prose compression techniques don't change rapidly)
