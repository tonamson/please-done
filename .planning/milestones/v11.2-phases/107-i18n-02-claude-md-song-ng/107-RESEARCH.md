---
phase: 107
plan: 01
type: research
milestone: v11.2
milestone_name: Vietnamese Documentation
---

# Phase 107: I18N-02 — CLAUDE.md Song Ngữ - Research

**Researched:** 2026-04-04
**Domain:** GitHub Documentation Internationalization (English-Vietnamese)
**Confidence:** HIGH

---

## Summary

Nghiên cứu tập trung vào việc tạo bản dịch tiếng Việt cho file `CLAUDE.md` (~290 dòng), tài liệu chứa các quy ước dự án và workflows. Dựa trên thành công của Phase 106 (README Song Ngữ), pha này áp dụng cùng pattern với các điều chỉnh riêng cho nội dung kỹ thuật của CLAUDE.md.

**Primary recommendation:** Sử dụng pattern `CLAUDE.md` (English) + `CLAUDE.vi.md` (Vietnamese) với badge-style language switcher. Giữ nguyên tất cả commands, code examples, và file paths; chỉ dịch explanations và descriptions. CLAUDE.md có cấu trúc phẳng hơn README.md, chủ yếu là các bảng và ví dụ workflow.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
1. **Translation Approach:** Technical commands và code examples giữ nguyên tiếng Anh, chỉ dịch explanations và descriptions.
2. **File Naming Convention:** Sử dụng `.vi.md` suffix cho file tiếng Việt.
3. **Language Switcher UI:** Badge-style links ở đầu file.
4. **HTML Comment Header:** Source version tracking giống README.vi.md pattern.
5. **Content Scope:** Dịch toàn bộ CLAUDE.md (~290 lines), không bỏ sót section nào.

### Content Handling (Locked)
- **D-05:** Preserve ALL command examples — commands stay in English
- **D-06:** Preserve ALL workflow code blocks — exact commands/flags unchanged
- **D-07:** Preserve file paths in examples — no translation of paths
- **D-08:** Preserve table structures — translate content cells, keep structure

### Technical Terms (Locked)
- **D-09:** Keep technical terminology in English with Vietnamese explanation
  - "Skills" → "Skills" (with Vietnamese description)
  - "Phase", "Milestone", "Plan" → keep English, explain in Vietnamese
  - "Workflow" → "Workflow" (quy trình làm việc)
- **D-10:** Translate descriptive/explanatory text to natural Vietnamese
- **D-11:** Keep CLAUDE.md section anchors (`#quick-start`, etc.) in English for cross-file linking

### Claude's Discretion
- Exact phrasing choices where multiple Vietnamese translations are valid
- Badge styling (follow README.vi.md pattern)
- Section ordering (keep identical to source)

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
| I18N-02 | Tạo phiên bản CLAUDE.md tiếng Việt | File naming pattern `CLAUDE.vi.md` confirmed as standard. Badge-style language switcher is best practice. ~290 lines to translate. |
</phase_requirements>

---

## Source Analysis

### CLAUDE.md Structure Overview

**Total Lines:** ~290 lines
**Sections:** 4 major sections with subsections

```
CLAUDE.md
├── Project Language Convention (2 lines)
├── Common Workflows (main section)
│   ├── Table of Contents (5 workflows listed)
│   ├── Workflow 1: Starting a New Project
│   ├── Workflow 2: Fixing a Bug
│   ├── Workflow 3: Checking Project Progress
│   ├── Workflow 4: Planning a Feature
│   └── Workflow 5: Completing a Milestone
├── Command Usage Patterns
│   ├── Frequently Used Flag Combinations (table)
│   ├── Error Recovery Patterns (table)
│   └── Quick Reference: Command Categories (table)
├── Command Reference: pd:onboard
├── Command Reference: pd:map-codebase
├── Command Reference: pd:status
└── Schema Validation
```

### Section Details

| Section | Lines | Special Elements | Translation Priority |
|---------|-------|------------------|---------------------|
| Project Language Convention | 2 | None | High - Sets tone |
| Common Workflows header | 3 | None | High |
| Table of Contents | 5 | Anchor links | High - TOC structure |
| Workflow 1-5 | ~180 | Tables, code blocks, decision lists | High - Core content |
| Command Usage Patterns | ~40 | Tables | Medium |
| Command References (3) | ~55 | Code blocks, output examples | Medium-High |
| Schema Validation | ~20 | Code example, table | Medium |

### Special Elements Found

#### 1. HTML Anchors
```markdown
<a id="quick-start"></a>
## Bắt Đầu Nhanh
```
**Decision:** Keep anchors in English (per D-11) for cross-file linking compatibility.

#### 2. Tables (6 major tables)
- Workflow steps table (5 occurrences)
- Command flags table
- Error recovery patterns table
- Command categories table
- Schema validation table

**Decision:** Translate headers and descriptive cells; keep technical content (commands, paths) in English.

#### 3. Code Blocks
- Command sequences (e.g., `/pd:onboard → /pd:plan`)
- Output examples (e.g., status dashboard)
- JavaScript code example (Schema Validation section)

**Decision:** Keep ALL code blocks exactly as-is; translate comments only if present.

#### 4. Decision Points Lists
```markdown
**Decision Points:**
- **If plan-check shows BLOCK:** Read fixHint...
```

**Decision:** Translate the condition description; keep technical terms like "plan-check", "fixHint" in English.

---

## Translation Patterns

### From README.vi.md (Phase 106 - Verified Pattern)

#### HTML Header Format
```markdown
<!-- Translated from CLAUDE.md -->
<!-- Source version: 4.0.0 -->
<!-- Translation date: 2026-04-04 -->
```

#### Language Switcher Badges
```markdown
[![English](https://img.shields.io/badge/lang-English-blue.svg)](CLAUDE.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](CLAUDE.vi.md)
```

#### Section Anchor Pattern
```markdown
<a id="workflow-1-starting-a-new-project"></a>
### Workflow 1: Khởi Tạo Dự Án Mới
```
**Note:** Anchor ID stays English; heading text translates.

#### Table Translation Pattern
```markdown
<!-- Original -->
| Context | Command | Expected Output | Next Steps |

<!-- Vietnamese -->
| Ngữ cảnh | Lệnh | Kết quả mong đợi | Bước tiếp theo |
```

---

## Technical Terminology

### Keep in English (with Vietnamese explanation on first use)

| Term | First Use Pattern | Subsequent Use |
|------|------------------|----------------|
| Skills | "Skills" (kỹ năng) | "Skills" or "kỹ năng" |
| Phase | "Phase" (giai đoạn) | "Phase" |
| Milestone | "Milestone" (cột mốc) | "Milestone" |
| Plan | "Plan" (kế hoạch) | "Plan" |
| Workflow | "Workflow" (quy trình làm việc) | "Workflow" |
| Command | "Command" (lệnh) | "command" or "lệnh" |
| Context | "Context" (ngữ cảnh) | "context" |
| Prerequisites | "Prerequisites" (điều kiện tiên quyết) | "prerequisites" |
| Output | "Output" (đầu ra) | "output" |
| Dashboard | "Dashboard" (bảng điều khiển) | "dashboard" |

### Translate to Vietnamese

| English | Vietnamese | Notes |
|---------|------------|-------|
| Common Workflows | Các Quy Trình Làm Việc Thường Gặp | Capitalize first letter of each word |
| When to use | Khi nào dùng | |
| Command Sequence | Chuỗi Lệnh | |
| Steps | Các Bước | |
| Expected Output | Kết Quả Mong Đợi | |
| Next Steps | Bước Tiếp Theo | |
| Decision Points | Điểm Quyết Định | |
| Frequently Used | Thường Dùng | |
| Flag Combinations | Tổ Hợp Cờ (Flags) | Keep "flags" in parens |
| Error Recovery | Phục Hồi Lỗi | |
| Quick Reference | Tham Khảo Nhanh | |
| Project lifecycle | Vòng đời dự án | |
| Design and research | Thiết kế và nghiên cứu | |
| Implementation | Thực thi | |
| Investigation | Điều tra | |
| Status and guidance | Trạng thái và hướng dẫn | |
| Usage | Cách dùng | |
| What it does | Chức năng | |
| Table of Contents | Mục Lục | |

---

## Special Considerations

### 1. Command Preservation (Critical)

**All PD commands must remain unchanged:**
- `/pd:onboard`, `/pd:init`, `/pd:plan`, `/pd:write-code`, `/pd:status`
- `/pd:fix-bug`, `/pd:test`, `/pd:new-milestone`, `/pd:complete-milestone`
- Flags: `--auto`, `--discuss`, `--coverage`, `--wave`, etc.

**Rationale:** These are API calls that users copy-paste. Changing them breaks functionality.

### 2. File Path Preservation (Critical)

**Do NOT translate:**
- `.planning/` (not `/.kế-hoạch/`)
- `commands/pd/` (not `lệnh/pd/`)
- `README.md`, `CLAUDE.md`
- `.claude/`, `.codex/`, etc.

### 3. Table Alignment

CLAUDE.md contains multiple tables with technical content:
- Column headers: Translate for readability
- Row content (commands): Keep English
- Descriptions: Translate to Vietnamese

**Example:**
```markdown
| Command | Common Flags | Use Case |
|---------|--------------|----------|
| `/pd:plan` | `--auto` | AI decides approach |
```

Becomes:
```markdown
| Lệnh | Cờ Thường Dùng | Trường Hợp Dùng |
|------|----------------|-----------------|
| `/pd:plan` | `--auto` | AI tự quyết định cách tiếp cận |
```

### 4. Code Block Preservation

**JavaScript example in Schema Validation:**
```javascript
const { validateContext } = require('./bin/lib/schema-validator');
// Keep exactly as-is, including comments if any
```

**Output examples (like status dashboard):**
```
Milestone: v1.1 Documentation Improvements
Phase: 102 — DOC-03 Usage Examples
```
Keep format, translate labels if appropriate.

### 5. Workflow Structure

Each workflow (1-5) follows identical structure:
1. **When to use:** → "Khi nào dùng:"
2. **Command Sequence:** → "Chuỗi lệnh:"
3. **Steps:** → "Các bước:"
4. **Decision Points:** → "Điểm quyết định:"

Maintain this structure for consistency.

---

## Validation Architecture

> This phase involves documentation translation. Validation uses Nyquist framework with 8 dimensions.

### Dimension 1: Content Completeness
- **Truth:** "CLAUDE.vi.md contains all sections from CLAUDE.md"
- **Verification:** `grep -c "^##" CLAUDE.md` vs `grep -c "^##" CLAUDE.vi.md` (section count match)
- **Command:** `diff <(grep "^##" CLAUDE.md | wc -l) <(grep "^##" CLAUDE.vi.md | wc -l)`

### Dimension 2: Structure Preservation
- **Truth:** "All tables, code blocks, and lists preserve original structure"
- **Verification:**
  - Table count: `grep -c "^|" CLAUDE.md` vs CLAUDE.vi.md
  - Code block count: `grep -c "^\`\`\`" CLAUDE.md` vs CLAUDE.vi.md
- **Command:** `diff <(grep -c "^|" CLAUDE.md) <(grep -c "^|" CLAUDE.vi.md)`

### Dimension 3: Command Preservation
- **Truth:** "All PD commands remain in English"
- **Verification:** No Vietnamese characters inside code blocks or command sequences
- **Command:** `grep -E "^\s*\`\/pd:" CLAUDE.vi.md` — should show only English commands

### Dimension 4: Badge/Header Format
- **Truth:** "HTML comment header and language switcher badges follow README.vi.md pattern"
- **Verification:**
  - File starts with `<!-- Translated from CLAUDE.md -->`
  - Contains language switcher badges
  - Badges link correctly to CLAUDE.md and CLAUDE.vi.md
- **Command:** `head -10 CLAUDE.vi.md | grep -E "Translated from|lang-English|lang-Tiếng"`

### Dimension 5: Cross-File Links
- **Truth:** "Links between CLAUDE.md and CLAUDE.vi.md work correctly"
- **Verification:** Click/navigate between files using badges
- **Command:** `grep -E "\]\(CLAUDE\." CLAUDE.vi.md` — should find links to CLAUDE.md

### Dimension 6: Technical Terminology
- **Truth:** "Technical terms kept in English with Vietnamese context"
- **Verification:**
  - Commands: `/pd:` prefix preserved
  - File paths: English preserved
  - Terms: Phase, Milestone, Plan, Skills in English
- **Sample check:** `grep -c "/pd:" CLAUDE.vi.md` should match CLAUDE.md count

### Dimension 7: Natural Language Flow
- **Truth:** "Vietnamese translations sound natural, not word-for-word"
- **Verification:** Manual review of sample paragraphs
- **Sample sections to check:**
  - "When to use" descriptions
  - Decision point explanations
  - Command reference descriptions

### Dimension 8: Success Criteria Coverage
- **Truth:** "All I18N-02 success criteria met"
- **Verification:**
  - File `CLAUDE.vi.md` exists
  - Technical terms translated accurately
  - All examples and workflows preserved
- **Command:**
  ```bash
  test -f CLAUDE.vi.md && \
  wc -l CLAUDE.vi.md | awk '{print $1}' && \
  grep -c "^###" CLAUDE.vi.md
  ```
  Expected: File exists, ~290+ lines, 8+ subsections

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| I18N-02 | CLAUDE.vi.md exists | file-check | `test -f CLAUDE.vi.md` | Wave 0 |
| I18N-02 | Language switcher present | content-check | `grep "lang-Tiếng" CLAUDE.vi.md` | Wave 0 |
| I18N-02 | Structure preserved | line-count | `wc -l CLAUDE.vi.md` >= 280 | Wave 1 |
| I18N-02 | Commands preserved | pattern-check | `grep -c "/pd:" CLAUDE.vi.md` >= 20 | Wave 1 |
| I18N-02 | Tables preserved | structure-check | Tables match count | Wave 1 |

### Wave 0 Gaps
- None — this is documentation-only phase with established pattern from Phase 106

---

## Research Findings

### Key Takeaways for Planning

1. **Pattern Established:** Phase 106 (README.vi.md) provides proven template. Follow exactly for consistency.

2. **Scope Smaller than Phase 106:**
   - Phase 106: ~750 lines, 21 sections
   - Phase 107: ~290 lines, ~8 major sections
   - Estimated effort: ~40% of Phase 106

3. **Content Type Differences:**
   - CLAUDE.md has more tables (workflow steps)
   - CLAUDE.md has fewer narrative sections
   - CLAUDE.md includes JavaScript code example (Schema Validation)

4. **Critical Success Factors:**
   - Preserve all `/pd:` commands exactly
   - Keep file paths in English
   - Maintain table structure while translating headers
   - Add HTML anchor tags before each section header

5. **Risk Areas:**
   - Decision Points lists contain conditionals that need careful translation
   - Schema Validation section has JavaScript code block
   - Command reference tables have specific formatting

### Comparison: README.vi.md vs CLAUDE.vi.md

| Aspect | README.vi.md | CLAUDE.vi.md (Expected) |
|--------|--------------|------------------------|
| Lines | ~758 | ~290 |
| Sections | 21 | 8 |
| Tables | Many | 6 major tables |
| Code blocks | Bash examples | JavaScript + output |
| Narrative style | Descriptive | Instructional |
| Badges | Many (version, license, etc.) | Language switcher only |

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking command examples by translating | Low | High | Clear rule: never translate inside code fences |
| Inconsistent terminology with README.vi.md | Medium | Medium | Reference Phase 106 glossary, maintain consistency |
| Missing anchor links for TOC | Medium | Medium | Add `<a id="...">` before each section header |
| Table structure misalignment | Low | High | Verify pipe count per row matches original |
| Workflow section count mismatch | Low | Medium | Verify all 5 workflows present after translation |
| JavaScript code block modified | Low | High | Mark as DO NOT TRANSLATE in task instructions |

---

## Estimation

| Activity | Time Estimate |
|----------|---------------|
| Source analysis (CLAUDE.md structure) | 15 minutes |
| Translation (290 lines, technical content) | 1.5-2 hours |
| Review and verification | 30 minutes |
| **Total** | **~2.5-3 hours** |

---

## Sources

### Primary (HIGH confidence)
- `README.vi.md` - Phase 106 output, verified pattern
- `CLAUDE.md` - Source content, analyzed structure
- `106-01-PLAN.md` - Reference plan structure
- `106-01-SUMMARY.md` - Verification approach reference

### Pattern Verification
- File naming: BCP 47 language code `.vi.md` confirmed
- Badge format: shields.io pattern confirmed working
- HTML comment tracking: Established in Phase 106

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Pattern from Phase 106 proven
- Architecture: HIGH - Same structure as Phase 106
- Pitfalls: HIGH - Phase 106 experience informs

**Research date:** 2026-04-04
**Valid until:** 2026-07-04 (90 days for documentation standards)

**Dependencies:**
- Phase 106 complete (README.vi.md pattern established)
- CLAUDE.md stable (no pending changes)
