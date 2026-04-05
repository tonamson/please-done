# Phase 106: I18N-01 — README Song Ngữ - Research

**Researched:** 2026-04-04
**Domain:** GitHub Documentation Internationalization (English-Vietnamese)
**Confidence:** HIGH

---

## Summary

Nghiên cứu tập trung vào các best practices cho việc tạo tài liệu song ngữ trên GitHub, cụ thể là mẫu README.md song ngữ Anh-Việt. Các quyết định trong CONTEXT.md đã được xác nhận là phù hợp với các chuẩn mực quốc tế.

**Primary recommendation:** Sử dụng pattern `README.md` (English) + `README.vi.md` (Vietnamese) với badge-style language switcher ở đầu file. Giữ nguyên tất cả commands, code examples, và file paths; chỉ dịch descriptions và explanations.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
1. **Translation Approach:** Technical commands và code examples giữ nguyên tiếng Anh, chỉ dịch explanations và descriptions.
2. **File Naming Convention:** Sử dụng `.vi.md` suffix cho tất cả file tiếng Việt.
3. **Language Switcher UI:** Badge-style links ở đầu file, ngay dưới badges version/license.
4. **Terminology Handling:** Giữ các thuật ngữ kỹ thuật quan trọng bằng tiếng Anh trong lần đầu xuất hiện, sau đó có thể dùng tiếng Việt.
5. **Content Scope:** Dịch toàn bộ README.md hiện tại (~33KB), không bỏ sót section nào (21 sections total).

### Claude's Discretion
- Cách tổ chức bảng dịch thuật ngữ (có thể đặt ở cuối file hoặc inline)
- Style của language switcher (có thể dùng text links hoặc badges)

### Deferred Ideas (OUT OF SCOPE)
- Video tutorials voiceover tiếng Việt
- Interactive documentation đa ngôn ngữ
- Auto-detect language từ system locale
- Thay đổi code hoặc logic
- Dịch comments trong code
- Dịch test files
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| I18N-01 | Tạo phiên bản README tiếng Việt song song với bản tiếng Anh | File naming pattern `README.vi.md` confirmed as standard. Badge-style language switcher is best practice. |
</phase_requirements>

---

## Standard Stack

### Core Pattern
| Component | Pattern | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| Primary README | `README.md` | Default English version | GitHub default, international standard |
| Vietnamese README | `README.vi.md` | Localized version | BCP 47 language code, widely recognized |
| Language Switcher | Badge-style links | Navigation between versions | Visual, works on all Markdown renderers |

### What to Translate vs Keep

| Element | Action | Rationale |
|---------|--------|-----------|
| Section headings | Translate | Improves readability for Vietnamese users |
| Explanatory paragraphs | Translate | Core value of localization |
| Installation instructions (prose) | Translate | Users need to understand steps |
| **Code blocks** | **Keep English** | Must remain copy-pasteable |
| **Command examples** | **Keep English** | Commands are API, not content |
| **File paths** | **Keep English** | Actual filesystem paths |
| **Badge URLs/syntax** | **Keep English** | Functional elements |
| **Repository URLs** | **Keep English** | Links must work |
| **Variable names/config keys** | **Keep English** | Code references |
| Table of contents | Translate | But update anchor links accordingly |

---

## Architecture Patterns

### Recommended File Structure
```
/
├── README.md              # English (source of truth)
├── README.vi.md           # Vietnamese translation
├── CLAUDE.md              # English conventions
├── CLAUDE.vi.md           # (Phase 107) Vietnamese conventions
└── docs/
    ├── cheatsheet.md
    ├── cheatsheet.vi.md   # (Phase 108)
    └── ...
```

### Language Switcher Pattern

**Recommended Format (Badge-style):**
```markdown
[![English](https://img.shields.io/badge/lang-English-blue.svg)](README.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](README.vi.md)
```

**Alternative (Text links):**
```markdown
**Read this in:** [English](README.md) | [Tiếng Việt](README.vi.md)
```

**Placement:** Immediately after version/license badges, before project description.

### Translation Memory Pattern

**Recommended:** Add HTML comment at top of translated file to track source version:
```markdown
<!-- Translated from README.md commit: abc1234 -->
```

This helps with:
- Knowing when translation is outdated
- Sync tracking between versions
- Future automation possibilities

---

## Vietnamese Technical Translation Conventions

### Writing Style
- **Restructure English sentences** to sound natural in Vietnamese—avoid word-for-word translation
- **Avoid passive voice** where possible
- Example: "File was not found" → "Không tìm thấy tập tin" (Not: "Tập tin không được tìm thấy")

### Capitalization Rules
| Context | Rule | Example |
|---------|------|---------|
| Proper nouns | Capitalize ALL syllables | "Nguyễn Du", "Hà Nội" |
| UI elements | Capitalize first syllable only | "Thoát", "Tùy chọn" |
| Sentences | Capitalize first syllable only | "Chạy lệnh sau..." |

### Number and Format Conventions
| Format | Vietnamese Style | Example |
|--------|------------------|---------|
| Decimal separator | Comma (no space) | `12,45` |
| Thousands separator | Dot (no space) | `100.000` |
| Version numbers | Keep dots | `Phiên bản 1.2.3` |
| Date format | dd/mm/yyyy | `04/04/2026` |

### Common Technical Terms Translation

| English | Vietnamese | Notes |
|---------|------------|-------|
| README | README | Keep as-is (proper noun) |
| Installation | Cài đặt | |
| Quick Start | Bắt đầu nhanh | |
| Prerequisites | Yêu cầu tiên quyết | Or "Điều kiện tiên quyết" |
| Requirements | Yêu cầu | |
| Workflow | Quy trình làm việc | |
| Command | Lệnh | |
| Skill | Kỹ năng | Or keep "skill" in quotes |
| Platform | Nền tảng | |
| Configuration | Cấu hình | |
| Repository | Kho lưu trữ | Or keep "repo" |
| Documentation | Tài liệu | |
| License | Giấy phép | |
| Table of Contents | Mục lục | |

### Terms to Keep in English
These should remain in English (optionally with Vietnamese explanation in parentheses on first use):

- **CLI** (Command Line Interface)
- **AI** (Trí tuệ nhân tạo / AI)
- **MCP** (Model Context Protocol)
- **API**
- **URL**
- **JSON**, **YAML**, **TOML**
- **Git**, **GitHub**
- **Node.js**, **Python**
- **npm**, **pip**
- All command names: `/pd:init`, `/pd:plan`, etc.
- All file extensions: `.md`, `.js`, `.ts`, etc.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Complex language detection | Custom browser detection | Simple manual links | GitHub doesn't auto-serve localized READMEs |
| Automatic translation | Machine translation only | Human-reviewed translation | MT requires post-editing for accuracy |
| Anchor link management | Manual TOC updates | Consistent heading structure | GitHub auto-generates anchors from heading text |

---

## Common Pitfalls

### Pitfall 1: Breaking Code Examples
**What goes wrong:** Translating comments or strings inside code blocks
**Why it happens:** Over-enthusiastic translation
**How to avoid:** Clearly mark code fences as DO NOT TRANSLATE
**Warning signs:** Code blocks contain Vietnamese text

### Pitfall 2: Broken Anchor Links
**What goes wrong:** Table of contents links break because heading anchors change when translated
**Why it happens:** GitHub generates anchors from heading text (e.g., `#quick-start` vs `#bắt-đầu-nhanh`)
**How to avoid:** Update all TOC links in Vietnamese version to match translated headings
**Warning signs:** Links in TOC don't jump to sections

### Pitfall 3: Translating File Paths
**What goes wrong:** Changing `.planning/` to something like `/.kế-hoạch/`
**Why it happens:** Literal translation of path descriptions
**How to avoid:** File paths are code, not content—never translate
**Warning signs:** Instructions don't work when followed

### Pitfall 4: Inconsistent Terminology
**What goes wrong:** Same English term translated differently in different sections
**Why it happens:** Working section by section without reference
**How to avoid:** Create a glossary table before starting
**Warning signs:** "Command" becomes "lệnh" in one place, "câu lệnh" in another

### Pitfall 5: Wrong Number Format
**What goes wrong:** Using English number formatting (1,000.50) instead of Vietnamese (1.000,50)
**Why it happens:** Copy-paste from source
**How to avoid:** Be aware of Vietnamese conventions: dot for thousands, comma for decimals
**Warning signs:** Numbers look "weird" to Vietnamese readers

---

## Code Examples

### Language Switcher Implementation
```markdown
<!-- At the very top of README.md and README.vi.md -->
[![English](https://img.shields.io/badge/lang-English-blue.svg)](README.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](README.vi.md)

# Please Done — Cross-Platform AI Coding Skills
```

### Vietnamese Translation Pattern
```markdown
<!-- Original English -->
## Quick Start

Get started with Please Done in 5 commands:

| Step | Command | What it does |
|------|---------|--------------|
| 1 | `/pd:onboard` | Orient AI to your codebase |

<!-- Vietnamese -->
## Bắt Đầu Nhanh

Bắt đầu sử dụng Please Done với 5 lệnh sau:

| Bước | Lệnh | Chức năng |
|------|------|-----------|
| 1 | `/pd:onboard` | Giúp AI làm quen với codebase của bạn |
```

### HTML Comment for Version Tracking
```markdown
<!-- Translated from README.md commit: 74ca00a -->
<!-- Source version: 4.0.0 -->
<!-- Translation date: 2026-04-04 -->
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single README with inline translations | Separate files per language (README.vi.md) | 2020+ | Cleaner, maintainable, standard BCP 47 codes |
| Text-only language switcher | Badge-style switcher | 2022+ | More visual, consistent with other badges |
| Manual translation tracking | HTML comment markers | 2023+ | Easier sync management |

---

## Open Questions

1. **Anchor Link Translation**
   - What we know: GitHub generates anchors from heading text
   - What's unclear: Whether to add manual HTML anchors to preserve English links
   - Recommendation: Update TOC links in Vietnamese version to match Vietnamese headings (standard practice)

2. **Table Header Translation**
   - What we know: Tables should keep structure
   - What's unclear: Whether to translate column headers that are technical terms
   - Recommendation: Translate headers for readability, keep row content if technical

---

## Validation Architecture

> This phase involves documentation changes only—no code or tests to validate. Validation is manual review.

### Phase Requirements → Validation Map
| Req ID | Behavior | Test Type | Validation Method |
|--------|----------|-----------|-------------------|
| I18N-01 | README.vi.md exists | Manual | File exists check |
| I18N-01 | Language switcher present | Manual | Visual inspection |
| I18N-01 | Structure preserved | Manual | Side-by-side comparison |

### Wave 0 Gaps
- None — documentation phase requires no test infrastructure

---

## Sources

### Primary (HIGH confidence)
- [Lara Translate - How to Localize a README File for GitHub](https://blog.laratranslate.com/how-to-localize-a-readme-file-github) - File naming, language switcher patterns, what to translate
- [zdoc README-i18n](https://readme-i18n.com/en) - Translation automation tools and patterns
- [GitHub Docs - README formatting](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes) - Anchor generation rules

### Secondary (MEDIUM confidence)
- [Gengo Vietnamese Style Guide](https://gengo.com/vi/translators/resources/style-guide/) - Vietnamese technical translation conventions
- [SEAtongue Vietnamese Localization Guide](https://seatongue.com/resources/language-center/vietnamese-localization-guide/) - Cultural and UI considerations
- [Globalization Partners - Vietnamese Software Internationalization](https://www.globalizationpartners.com/resources/vietnamese-software-internationalization/) - Software-specific guidance

### Real Examples (Verified patterns)
- [AFFiNE GitHub](https://github.com/toeverything/Affine) - Multi-language README with badge switcher
- [Supabase GitHub](https://github.com/supabase/supabase) - Language selection pattern
- [Excalidraw GitHub](https://github.com/excalidraw/excalidraw) - Badge-style language switcher

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified with multiple authoritative sources and real-world examples
- Architecture: HIGH - Pattern is widely adopted by major open-source projects
- Pitfalls: MEDIUM-HIGH - Based on common issues in i18n projects

**Research date:** 2026-04-04
**Valid until:** 2026-07-04 (90 days for documentation standards)

**Estimated effort:** 
- Source analysis: 15 minutes
- Translation: 2-3 hours (33KB content, 21 sections)
- Review: 30 minutes
- Total: ~4 hours
