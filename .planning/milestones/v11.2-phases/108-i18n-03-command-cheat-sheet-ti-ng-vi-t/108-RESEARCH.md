---
phase: 108
plan: 01
type: research
milestone: v11.2
milestone_name: Vietnamese Documentation
---

# Phase 108: I18N-03 — Command Cheat Sheet Tiếng Việt — Research

**Researched:** 2026-04-05
**Domain:** Vietnamese Documentation Translation
**Confidence:** HIGH

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Bilingual approach — keep English docs/cheatsheet.md, add docs/cheatsheet.vi.md as parallel file
- **D-02:** Follow Phase 106-107 (README.vi.md, CLAUDE.vi.md) translation pattern for consistency
- **D-03:** HTML comment header with source version tracking (same as previous files)
- **D-04:** Language switcher badges linking between cheatsheet.md and cheatsheet.vi.md
- **D-05:** Preserve ALL commands — commands stay in English (e.g., `/pd:plan`, `/pd:status`)
- **D-06:** Preserve ALL flags — flags stay in English (e.g., `--auto`, `--wave`)
- **D-07:** Preserve file paths in examples — no translation of paths
- **D-08:** Preserve ALL table structures — translate headers and descriptions, keep command syntax intact

### Claude's Discretion
- Exact phrasing choices where multiple Vietnamese translations are valid
- Badge styling (follow README.vi.md pattern)
- Section ordering (keep identical to source)

### Deferred Ideas
- None — discussion stayed within phase scope

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| I18N-03 | Tạo cheat sheet tiếng Việt: File `docs/cheatsheet.vi.md`, dịch descriptions và explanations, giữ nguyên commands và flags | Source analysis below provides structural patterns; translation patterns from previous phases ensure consistency |

---

## Executive Summary

Phase 108 creates a Vietnamese translation of the Command Cheat Sheet (`docs/cheatsheet.vi.md`). This is a documentation-only phase requiring precise translation of natural language content while preserving all technical elements (commands, flags, paths, table structures).

The source file (`docs/cheatsheet.md`) is ~202 lines containing 5 command categories, 16 commands total, a Popular Flags Reference table, and a Legend section explaining flag notation. Translation must follow established patterns from README.vi.md and CLAUDE.vi.md (Phase 106-107), including HTML comment headers, language switcher badges, and specific technical terminology conventions.

**Primary recommendation:** Create `docs/cheatsheet.vi.md` with: (1) HTML comment header tracking source version, (2) language switcher badges, (3) translated title "Bảng Tham Khảo Lệnh Please Done", (4) all table headers and descriptions in Vietnamese, (5) all commands/flags/paths preserved in English, (6) Legend notation symbols kept universal.

---

## Source Analysis

### docs/cheatsheet.md Structure

**Line count:** 202 lines

**Sections identified:**

| Section | Lines | Content Type |
|---------|-------|--------------|
| Header + Intro | 1-10 | Title, description, how-to-read guide |
| Table of Contents | 12-20 | Bullet list with anchor links |
| Project Commands | 24-42 | Category intro + command table + notes |
| Planning Commands | 45-58 | Category intro + command table + notes |
| Execution Commands | 61-79 | Category intro + command table + notes |
| Debug Commands | 82-100 | Category intro + command table + notes |
| Utility Commands | 103-124 | Category intro + command table + notes |
| Popular Flags Reference | 127-149 | 3-column flag reference table |
| Legend | 152-183 | Flag notation explanation + value types table |
| Command Count Summary | 186-195 | Category statistics table |
| Footer | 199-202 | Last updated + reference |

**Table structures to preserve:**

1. **Command Category Tables** (5 tables, 3 columns each):
   - Columns: `Command`, `Usage`, `Example`
   - 16 rows total across 5 categories

2. **Popular Flags Reference** (1 table, 3 columns):
   - Columns: `Flag`, `Description`, `Commands`
   - 15 rows

3. **Legend Value Types** (1 table, 3 columns):
   - Columns: `Pattern`, `Meaning`, `Example`
   - 8 rows

4. **Command Count Summary** (1 table, 3 columns):
   - Columns: `Category`, `Commands`, `Count`
   - 6 rows (including Total)

**Special elements:**

| Element | Lines | Translation Approach |
|-----------|-------|---------------------|
| Command syntax `/pd:*` | Throughout | Keep in English (API) |
| Flags `--*` | Throughout | Keep in English (API) |
| File paths `./my-project` | Throughout | Keep as-is |
| Code blocks | 35-41, 54-57, etc. | Keep commands in English |
| Legend notation `[--flag]`, `\|` | 156-160 | Keep symbols, translate explanations |

---

## Translation Patterns

### From Previous Phases (README.vi.md, CLAUDE.vi.md)

**HTML Comment Header Pattern:**
```markdown
<!-- Translated from cheatsheet.md -->
<!-- Source version: 4.0.0 -->
<!-- Translation date: 2026-04-05 -->
```

**Language Switcher Badges:**
```markdown
[![English](https://img.shields.io/badge/lang-English-blue.svg)](cheatsheet.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](cheatsheet.vi.md)
```

**Title Translation:**
- "Please Done Command Cheat Sheet" → "Bảng Tham Khảo Lệnh Please Done"

**Section Header Translation (from CLAUDE.vi.md):**
- "Common Workflows" → "Các Quy Trình Làm Việc Thường Gặp"
- "Table of Contents" → "Mục Lục"
- "Notes" → "Ghi chú" / "Lưu ý"

---

## Technical Terminology

### Keep in English (API Surface)

| Term | Reason |
|------|--------|
| `/pd:onboard`, `/pd:init`, etc. | Command names are the API — must stay identical |
| `--auto`, `--discuss`, `--wave` | Flag names are the API |
| `PROJECT.md`, `CONTEXT.md`, etc. | File names in examples |
| `fresh`, `aging`, `stale` | Status values (used in code) |
| `PASS`, `WARN`, `BLOCK` | Plan-check statuses |
| `1.2`, `2.1` | Phase identifiers |
| `Wave 1`, `Wave 2` | Execution wave terminology |

### Translate to Vietnamese

| English | Vietnamese | Source |
|---------|------------|--------|
| Command Cheat Sheet | Bảng Tham Khảo Lệnh | CONTEXT.md D-10 |
| How to Read | Cách Đọc Bảng Này | [ASSUMED] |
| Quick reference | Tài liệu tham khảo nhanh | [ASSUMED] |
| Project Commands | Lệnh Quản Lý Dự Án | [ASSUMED] |
| Planning Commands | Lệnh Lập Kế Hoạch | [ASSUMED] |
| Execution Commands | Lệnh Thực Thi | [ASSUMED] |
| Debug Commands | Lệnh Gỡ Lỗi | [ASSUMED] |
| Utility Commands | Lệnh Tiện Ích | CLAUDE.vi.md:213 |
| Usage | Cú pháp | [ASSUMED] |
| Example | Ví dụ | [ASSUMED] |
| Description | Mô tả | CLAUDE.vi.md:186 |
| Notes | Ghi chú / Lưu ý | CLAUDE.vi.md:47 |
| Legend | Chú Giải | [ASSUMED] |
| Optional flag | Cờ tùy chọn | [ASSUMED] |
| Required value | Giá trị bắt buộc | [ASSUMED] |
| Or (\|) | Hoặc | [ASSUMED] |
| Category | Nhóm / Danh mục | CLAUDE.vi.md:213 |
| Count | Số lượng | [ASSUMED] |
| Total | Tổng cộng | [ASSUMED] |
| Popular Flags Reference | Tham Khảo Cờ Thường Dùng | [ASSUMED] |

---

## Special Considerations

### 1. Command Tables (Critical Structure)

Each category has a 3-column table. Must preserve:
- Column structure: Command | Usage | Example
- Command column: ALL commands stay in English
- Usage column: Commands/flags in English, translate any prose
- Example column: Keep examples exactly as-is

### 2. Legend Section (Lines 152-183)

The Legend explains flag notation. Key points:
- Keep notation symbols: `[--flag]`, `--flag value`, `|`, etc.
- Translate explanations only
- Keep the "Common Patterns" code block structure
- Value types table: translate headers and "Meaning" column only

### 3. Notes Sections

Each category has a **Notes** subsection with bullet points explaining each command. These should be translated to natural Vietnamese while keeping:
- Command names in English
- File paths in English
- Flag names in English

Example transformation:
```markdown
**Notes:**
- `onboard`: Orient AI to unfamiliar codebase — creates `.planning/` with PROJECT.md, SCAN_REPORT.md, CONTEXT.md
```
→
```markdown
**Ghi chú:**
- `onboard`: Định hướng AI vào codebase lạ — tạo `.planning/` với PROJECT.md, SCAN_REPORT.md, CONTEXT.md
```

### 4. Popular Flags Reference

15 flags listed. Structure:
- Flag column: Keep `--flag-name`
- Description column: Translate
- Commands column: Keep command names (e.g., `plan`, `write-code`)

### 5. Table of Contents

Anchor links in the TOC reference English section IDs (e.g., `#project-commands`). These must remain unchanged as they link to anchors generated from English headers.

**However:** The display text should be translated:
- `[Project Commands](#project-commands)` → `[Lệnh Quản Lý Dự Án](#project-commands)`

---

## Validation Architecture

### Dimension 1: Content Completeness
- **Verification:** Line count comparison (`wc -l cheatsheet.md` vs `wc -l cheatsheet.vi.md`)
- **Expected:** Vietnamese version should have similar line count (±5 lines for language differences)
- **Truth:** "All sections from source are present in translation"

### Dimension 2: Structure Preservation
- **Verification:** Table count and structure comparison
- **Method:** `grep -c "^|" cheatsheet.md` should equal `grep -c "^|" cheatsheet.vi.md`
- **Truth:** "All tables have identical column structure"

### Dimension 3: Command/Flag Preservation
- **Verification:** Extract all `/pd:*` and `--*` patterns from both files, compare
- **Method:** `grep -oE '/pd:[a-z-]+|(--[a-z-]+)' cheatsheet.md | sort | uniq` vs same for .vi.md
- **Truth:** "All commands and flags appear identically in both files"

### Dimension 4: Badge/Header Format
- **Verification:** Check for HTML comment header and language switcher badges
- **Method:** `head -7 cheatsheet.vi.md` must contain:
  - `<!-- Translated from cheatsheet.md -->`
  - Language badge lines
- **Truth:** "Header follows established bilingual pattern"

### Dimension 5: Table Alignment
- **Verification:** All markdown tables render correctly
- **Method:** Visual inspection in markdown preview; check `|` count per line
- **Truth:** "No broken table formatting"

### Dimension 6: Legend Notation
- **Verification:** Legend symbols preserved, explanations translated
- **Method:** Check that `[--flag]`, `--flag value`, `\|`, etc. appear unchanged in Legend section
- **Truth:** "Flag notation is universal across language versions"

### Dimension 7: Natural Language Flow
- **Verification:** Readability check of translated descriptions
- **Method:** Native speaker review of key sections (How to Read, Notes, Legend explanations)
- **Truth:** "Vietnamese translations sound natural and clear"

### Dimension 8: Success Criteria Coverage
- **Truth:** "docs/cheatsheet.vi.md contains all content from cheatsheet.md"
- **Verification:** Side-by-side comparison of section presence:
  - [ ] Header + Intro
  - [ ] Table of Contents
  - [ ] Project Commands section
  - [ ] Planning Commands section
  - [ ] Execution Commands section
  - [ ] Debug Commands section
  - [ ] Utility Commands section
  - [ ] Popular Flags Reference
  - [ ] Legend
  - [ ] Command Count Summary
  - [ ] Footer

---

## Research Findings

### Key Insights for Planning

1. **Template available:** README.vi.md and CLAUDE.vi.md provide clear patterns to follow
2. **Scope is manageable:** ~200 lines, 5 main sections, predictable structure
3. **No technical dependencies:** Pure documentation task, no code changes required
4. **Validation is straightforward:** Mechanical checks (command count, table structure) plus human review

### Translation Quality Standards

Based on previous phases:
- Technical terms (commands, flags) are kept in English
- Descriptions are translated to natural Vietnamese
- Table structures are preserved exactly
- HTML comments track source version for future updates

### Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Broken table formatting | Low | High | Use markdown table validator; preview before commit |
| Commands accidentally translated | Low | High | Explicit grep verification in validation step |
| Inconsistent terminology with previous files | Medium | Medium | Reference README.vi.md and CLAUDE.vi.md for term consistency |
| Missing section during translation | Low | High | Checklist verification against source TOC |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | "Usage" → "Cú pháp" is appropriate translation | Technical Terminology | User may prefer "Cách dùng" — either is acceptable per discretion |
| A2 | Legend notation symbols should stay universal | Special Considerations | If wrong, users may be confused by translated symbols — low risk |
| A3 | Section order should match source exactly | User Constraints | CONTEXT.md confirms this via D-02 and Claude's Discretion |

---

## Open Questions

None — all requirements are clear from CONTEXT.md and previous phase patterns.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| None | — | — | — | — |

This is a documentation-only phase with no external dependencies.

---

## Sources

### Primary (HIGH confidence)
- `docs/cheatsheet.md` — Source content structure analysis
- `README.vi.md` — Translation pattern reference
- `CLAUDE.vi.md` — Technical terminology reference
- `.planning/phases/108-i18n-03-command-cheat-sheet-ti-ng-vi-t/108-CONTEXT.md` — Locked decisions

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` — I18N-03 requirement specification

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — Translation patterns established in Phase 106-107
- Architecture: HIGH — Clear file structure from source analysis
- Pitfalls: MEDIUM — Based on common markdown translation issues

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (30 days for documentation)
