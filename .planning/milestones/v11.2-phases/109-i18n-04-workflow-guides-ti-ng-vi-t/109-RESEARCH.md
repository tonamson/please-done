---
phase: 109
milestone: v11.2
requirement: I18N-04
date: 2026-04-05
---

# Phase 109 Research: Workflow Guides Tiếng Việt

**Researched:** 2026-04-05
**Domain:** Documentation translation (Vietnamese localization)
**Confidence:** HIGH

## Summary

This research analyzes three workflow guide source files and establishes translation patterns for creating Vietnamese translations. The workflow guides are user-facing documentation that provide step-by-step instructions for using PD commands.

**Key Findings:**
- Three workflow guides totaling ~2,800 lines (English source)
- Consistent structure across all files: metadata header, prerequisites, step-by-step instructions, decision points
- Heavy use of tables for command sequences and expected outputs
- 50+ PD commands referenced throughout (must remain in English)
- Translation pattern already established in Phase 106-108 deliverables

**Primary Recommendation:** Apply the established translation pattern from Phase 106-108 (README.vi.md, CLAUDE.vi.md, cheatsheet.vi.md) with Vietnamese translations for explanatory text and preserved English for commands, file paths, and technical terms.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Bilingual approach — keep English workflow files, add `.vi.md` versions as parallel files
- **D-02:** Follow Phase 106-108 translation patterns for consistency
- **D-03:** HTML comment header with source version tracking
- **D-04:** Language switcher badges linking between English and Vietnamese versions
- **D-05:** Preserve ALL command examples — commands stay in English
- **D-06:** Preserve ALL workflow sequences and step-by-step instructions
- **D-07:** Preserve file paths in examples — no translation of paths
- **D-08:** Preserve table structures — translate content cells, keep structure
- **D-09:** Keep technical terminology in English with Vietnamese explanation
- **D-10:** Translate descriptive/explanatory text to natural Vietnamese
- **D-11:** Keep workflow file references in English for cross-linking

### Claude's Discretion
- Exact phrasing choices where multiple Vietnamese translations are valid
- Badge styling (follow README.vi.md pattern)
- Section ordering (keep identical to source)

### Deferred Ideas
None — discussion stayed within phase scope

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| I18N-04 | Create Vietnamese translations of the 3 Workflow Guides with full content preservation | Source files analyzed, translation patterns established |

---

## Source Files Analysis

### File 1: getting-started.md

**File Path:** `docs/workflows/getting-started.md`

**Structure Overview:**
| Section | Description | Lines |
|---------|-------------|-------|
| Metadata header | Difficulty, time, prerequisites | 5 |
| Prerequisites | Checklist of requirements | 12 |
| Overview | What the guide covers | 12 |
| Step-by-Step Walkthrough | 7 steps with detailed instructions | ~180 |
| Summary | Completion checklist | 18 |
| Next Steps | Where to go next | 10 |
| See Also | Related documentation links | 10 |

**PD Commands Present:**
| Command | Count | Context |
|---------|-------|---------|
| `/pd:onboard` | 3 | Step 1, expected output, what it does |
| `/pd:new-milestone` | 3 | Step 2, expected output |
| `/pd:plan` | 4 | Step 3, decision points |
| `/pd:what-next` | 5 | Steps 4, 6, decision points |
| `/pd:write-code` | 5 | Steps 5, 6, decision points |
| `/pd:status` | 4 | Step 7, decision points |
| `/pd:map-codebase` | 1 | Decision point |
| `/pd:fix-bug` | 2 | Decision points |

**Table Structures:**
1. **Prerequisites table** — Checkbox list format
2. **Steps table** — 4 columns: Context, Command, Expected Output, Next Steps (5 rows)
3. **Decision Points tables** — Bullet lists within steps
4. **Summary checklist** — ✅ emoji list
5. **See Also table** — 2 columns: Document, Description

**Translation Complexity: MEDIUM**
- Straightforward narrative structure
- Repetitive command patterns
- Standard tables easy to translate cell-by-cell

**Key Terms to Translate:**
- "Getting Started" → "Bắt Đầu"
- "Step-by-Step Walkthrough" → "Hướng Dẫn Từng Bước"
- "Decision Points" → "Các Điểm Quyết Định"
- "Prerequisites" → "Yêu Cầu Tiên Quyết"
- "Overview" → "Tổng Quan"

---

### File 2: bug-fixing.md

**File Path:** `docs/workflows/bug-fixing.md`

**Structure Overview:**
| Section | Description | Lines |
|---------|-------------|-------|
| Metadata header | Difficulty, time, prerequisites | 5 |
| Prerequisites | Checklist of requirements | 11 |
| Overview | What the guide covers | 11 |
| Step-by-Step Walkthrough | 6 steps with detailed instructions | ~170 |
| Summary | Completion checklist | 17 |
| Next Steps | Where to go next | 8 |
| See Also | Related documentation links | 10 |

**PD Commands Present:**
| Command | Count | Context |
|---------|-------|---------|
| `/pd:fix-bug` | 6 | Steps 1, 2, 4, decision points |
| `/pd:test` | 3 | Steps 4, 5 |
| `/pd:what-next` | 3 | Steps 5, 6 |
| `/pd:status` | 2 | Step 6 |

**Table Structures:**
1. **Prerequisites table** — Checkbox list format
2. **Steps tables** — 4 columns: Context, Command, Expected Output, Next Steps (6 rows)
3. **Decision Points tables** — Bullet lists within steps
4. **Summary checklist** — ✅ emoji list
5. **See Also table** — Related documents

**Translation Complexity: MEDIUM**
- Similar structure to getting-started.md
- More complex expected output examples (code diffs)
- Technical terms: "Root Cause Analysis", "Regression Test"

**Key Terms to Translate:**
- "Bug Fixing" → "Sửa Lỗi"
- "Root Cause Analysis" → "Phân Tích Nguyên Nhân Gốc"
- "Regression Test" → "Test Hồi Quy"
- "Expected Output" → "Kết Quả Mong Đợi"

**Special Elements:**
- Code diff examples (must preserve formatting)
- ASCII art divider lines (preserve as-is)

---

### File 3: milestone-management.md

**File Path:** `docs/workflows/milestone-management.md`

**Structure Overview:**
| Section | Description | Lines |
|---------|-------------|-------|
| Metadata header | Difficulty, time, prerequisites | 5 |
| Prerequisites | Checklist of requirements | 12 |
| Overview | What the guide covers | 11 |
| Step-by-Step Walkthrough | 6 steps with detailed instructions | ~200 |
| Summary | Completion checklist | 19 |
| Next Steps | Where to go next | 9 |
| See Also | Related documentation links | 10 |

**PD Commands Present:**
| Command | Count | Context |
|---------|-------|---------|
| `/pd:new-milestone` | 3 | Step 1, decision points |
| `/pd:plan` | 3 | Step 2, decision points |
| `/pd:what-next` | 2 | Steps 3, decision points |
| `/pd:write-code` | 2 | Steps 3, decision points |
| `/pd:status` | 2 | Steps 4, 6 |
| `/pd:test` | 3 | Steps 5, decision points |
| `/pd:complete-milestone` | 3 | Step 6, decision points |
| `/pd:fix-bug` | 1 | Decision point |
| `/pd:verify-work` | 1 | Decision point |

**Table Structures:**
1. **Prerequisites table** — Checkbox list format
2. **Steps tables** — 4 columns: Context, Command, Expected Output, Next Steps (6 rows)
3. **Decision Points tables** — Bullet lists within steps
4. **Summary checklist** — ✅ emoji list
5. **See Also table** — Related documents

**Translation Complexity: MEDIUM-HIGH**
- More complex lifecycle concepts
- Multiple inter-dependent commands
- Coverage metrics and test results in examples

**Key Terms to Translate:**
- "Milestone Management" → "Quản Lý Milestone"
- "Milestone Lifecycle" → "Vòng Đời Milestone"
- "Phase" → "Phase" (keep English, add Vietnamese explanation)
- "Quality Gates" → "Cổng Chất Lượng"

---

## Translation Patterns from Prior Art

### HTML Comment Header Format

**Source tracking pattern (from README.vi.md, CLAUDE.vi.md, cheatsheet.vi.md):**
```markdown
<!-- Translated from docs/workflows/getting-started.md -->
<!-- Source version: 4.0.0 -->
<!-- Translation date: 2026-04-05 -->
```

**Rules:**
1. First 3 lines of file
2. Empty line after header
3. Source version matches main repo version
4. Translation date in ISO format

### Badge Format for Language Switchers

**Pattern from README.vi.md:**
```markdown
[![English](https://img.shields.io/badge/lang-English-blue.svg)](getting-started.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](getting-started.vi.md)
```

**Rules:**
1. English badge links to `.md` (English source)
2. Vietnamese badge links to `.vi.md` (translation)
3. Blue for English, red for Vietnamese
4. URL-encoded space in "Tiếng Việt" → `Tiếng%20Việt`
5. Badges appear immediately after HTML comment header

### Section Anchor Patterns

**Pattern from CLAUDE.vi.md:**
```markdown
<a id="workflow-1-starting-a-new-project"></a>
### Quy trình 1: Khởi Tạo Dự Án Mới
```

**Rules:**
1. Keep anchor IDs in English (for cross-linking compatibility)
2. Translate the visible heading text
3. Anchor appears before heading

### Table Translation Pattern

**From cheatsheet.vi.md:**
| English Pattern | Vietnamese Pattern |
|-----------------|-------------------|
| Command | Lệnh |
| Syntax | Cú pháp |
| Example | Ví dụ |
| Description | Mô tả |

**Rules:**
1. Translate column headers
2. Keep command values in English
3. Translate description/example cells

---

## Technical Terminology

### Terms to Keep in English

Based on CLAUDE.vi.md and cheatsheet.vi.md patterns:

| Term | Vietnamese Explanation | Pattern |
|------|------------------------|---------|
| Phase | Phase (giai đoạn) | Keep English, add parenthetical |
| Milestone | Milestone (cột mốc) | Keep English, add parenthetical |
| Task | Task (nhiệm vụ) | Keep English, add parenthetical |
| Plan | Plan (kế hoạch) | Keep English, add parenthetical |
| Workflow | Workflow (quy trình làm việc) | Keep English, add parenthetical first use |
| Bug | Bug (lỗi) | Keep English, add parenthetical |
| Commit | Commit | Keep English (git term) |
| PR | PR (Pull Request) | Keep English, add parenthetical |

### PD Commands (Never Translate)

All `/pd:*` commands must remain exactly as written:
- `/pd:onboard`
- `/pd:new-milestone`
- `/pd:plan`
- `/pd:write-code`
- `/pd:what-next`
- `/pd:status`
- `/pd:fix-bug`
- `/pd:test`
- `/pd:complete-milestone`

### File Paths (Never Translate)

Preserve all file paths exactly:
- `.planning/`
- `docs/workflows/`
- `CONTEXT.md`
- `ROADMAP.md`
- `REQUIREMENTS.md`

---

## Translation Style Guide

### Tone and Formality

**From CLAUDE.vi.md analysis:**
- Use formal but accessible Vietnamese
- Technical documentation tone
- Imperative for instructions ("Chạy", "Kiểm tra", "Xem")
- Descriptive for explanations

### Common Translations

| English | Vietnamese | Notes |
|---------|------------|-------|
| Getting Started | Bắt Đầu | Title case |
| Bug Fixing | Sửa Lỗi | Action-oriented |
| Milestone Management | Quản Lý Milestone | Mixed terminology |
| Prerequisites | Yêu Cầu Tiên Quyết | Formal term |
| Overview | Tổng Quan | Standard translation |
| Step-by-Step | Từng Bước | Instructional |
| Walkthrough | Hướng Dẫn | Guide/ tutorial |
| Decision Points | Các Điểm Quyết Định | Plural |
| Expected Output | Kết Quả Mong Đợi | Result-oriented |
| What this does | Chức năng / Tác dụng | Explanation |
| Next Steps | Bước Tiếp Theo | Navigation |
| See Also | Xem Thêm | Cross-reference |
| Summary | Tổng Kết | Conclusion |

---

## Nyquist Coverage Strategy

For documentation translation, the 8 Nyquist dimensions apply differently than for code. Here's the coverage approach:

| Dimension | Application to Translation | Coverage Approach |
|-----------|---------------------------|-------------------|
| **N1: Parseable** | Document must render correctly as Markdown | Verify no broken links, proper table formatting |
| **N2: Runnable** | Commands must be copy-pasteable | Preserve all `/pd:*` commands exactly |
| **N3: Observable** | Output examples must match reality | Keep expected output blocks unchanged |
| **N4: Verifiable** | Translation accuracy check | Side-by-side comparison with source |
| **N5: Diffable** | Track changes between versions | HTML comment with source version |
| **N6: Reversible** | Can revert to English | Language switcher badges |
| **N7: Composable** | Links work across documents | Preserve anchor IDs, translate display text |
| **N8: Traceable** | Track translation to source | Source file reference in HTML comment |

### Verification Checklist

For each translated file:
- [ ] All tables render correctly (no broken pipes)
- [ ] All commands preserved in English
- [ ] All file paths preserved exactly
- [ ] Language switcher badges link correctly
- [ ] Anchor IDs match English source
- [ ] No translation of code blocks or expected output
- [ ] Consistent terminology throughout

---

## Word Count and Complexity Assessment

| File | English Lines | Est. Vietnamese Lines | Complexity |
|------|---------------|----------------------|------------|
| getting-started.md | ~250 | ~280 | Low-Medium |
| bug-fixing.md | ~230 | ~260 | Medium |
| milestone-management.md | ~270 | ~300 | Medium-High |
| **Total** | **~750** | **~840** | **Medium** |

**Complexity Factors:**
- (+) Repetitive structure across files (translates quickly)
- (+) Established patterns from Phase 106-108
- (-) Need to preserve exact command formatting
- (-) Table-heavy content requires careful cell alignment

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Language switching | Manual link management | Badge pattern from README.vi.md | Consistent UX, proven pattern |
| Translation memory | Custom term database | Follow Phase 106-108 precedents | Consistency across all docs |
| Source tracking | Manual version notes | HTML comment header | Machine-readable, standard |

---

## Common Pitfalls

### Pitfall 1: Translating Commands
**What goes wrong:** User copies `/pd:kế-hoạch` which doesn't exist
**Why it happens:** Over-eager translation of command names
**How to avoid:** Never translate text after `/pd:` — commands are API

### Pitfall 2: Breaking Table Structure
**What goes wrong:** Markdown tables render incorrectly
**Why it happens:** Pipe characters `|` in translated text not escaped
**How to avoid:** Verify table renders correctly; check pipe alignment

### Pitfall 3: Translating File Paths
**What goes wrong:** Links to `.planning/quy-định/` don't exist
**Why it happens:** Translating path components as if they were words
**How to avoid:** File paths are identifiers — preserve exactly

### Pitfall 4: Changing Anchor IDs
**What goes wrong:** Cross-document links break
**Why it happens:** Translating `<a id="...">` values
**How to avoid:** Keep anchor IDs in English, translate only visible headers

---

## Code Examples

### Translation Header Template

```markdown
<!-- Translated from docs/workflows/FILENAME.md -->
<!-- Source version: 4.0.0 -->
<!-- Translation date: 2026-04-05 -->

[![English](https://img.shields.io/badge/lang-English-blue.svg)](FILENAME.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](FILENAME.vi.md)

# VIETNAMESE TITLE

VIETNAMESE DESCRIPTION
```

### Table Translation Example

**English source:**
```markdown
| Context | Command | Expected Output | Next Steps |
|---------|---------|-----------------|------------|
| Fresh codebase | `/pd:onboard` | Creates `.planning/` | Define milestone |
```

**Vietnamese translation:**
```markdown
| Ngữ cảnh | Lệnh | Kết quả mong đợi | Bước tiếp theo |
|----------|------|------------------|----------------|
| Codebase mới | `/pd:onboard` | Tạo `.planning/` | Định nghĩa milestone |
```

---

## Sources

### Primary (HIGH confidence)
- `/Volumes/Code/Nodejs/please-done/docs/workflows/getting-started.md` — Source file analysis
- `/Volumes/Code/Nodejs/please-done/docs/workflows/bug-fixing.md` — Source file analysis
- `/Volumes/Code/Nodejs/please-done/docs/workflows/milestone-management.md` — Source file analysis
- `/Volumes/Code/Nodejs/please-done/README.vi.md` — Translation pattern reference
- `/Volumes/Code/Nodejs/please-done/CLAUDE.vi.md` — Technical terminology reference
- `/Volumes/Code/Nodejs/please-done/docs/cheatsheet.vi.md` — Command preservation patterns
- `/Volumes/Code/Nodejs/please-done/.planning/phases/109-i18n-04-workflow-guides-ti-ng-vi-t/109-CONTEXT.md` — Locked decisions

---

## Metadata

**Confidence breakdown:**
- Translation patterns: HIGH — 3 prior examples analyzed
- Technical terminology: HIGH — CLAUDE.vi.md provides established terms
- File structure: HIGH — All source files examined
- Command inventory: HIGH — Grep-verified counts

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (30 days for documentation)
