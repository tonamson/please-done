---
phase: 103
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - docs/error-troubleshooting.md
autonomous: true
requirements:
  - DOC-04

must_haves:
  truths:
    - "User can quickly find error information in table format"
    - "Each error has clear Cause explanation"
    - "Each error has numbered Suggested Actions to fix"
    - "All 15 common errors are documented with cross-references"
    - "Quick Reference table exists for fast scanning"
  artifacts:
    - path: "docs/error-troubleshooting.md"
      provides: "Comprehensive error troubleshooting guide"
      min_lines: 200
      sections:
        - "Quick Reference Table"
        - "Setup Errors"
        - "Planning Errors"
        - "Execution Errors"
        - "Debug Errors"
    - path: "docs/error-recovery.md"
      provides: "Existing error guide (preserved, not modified)"
      note: "Read-only reference, no breaking changes"
  key_links:
    - from: "docs/error-troubleshooting.md"
      to: "docs/setup.md"
      via: "See Also links"
      pattern: "\\[Setup Guide\\]\\(setup\\.md"
    - from: "docs/error-troubleshooting.md"
      to: "docs/error-recovery.md"
      via: "Related guide reference"
      pattern: "error-recovery\\.md"
    - from: "error entries"
      to: "skill commands"
      via: "Skills Affected field"
      pattern: "pd:(init|plan|write-code|test|fix-bug)"
---

<objective>
Tạo comprehensive error troubleshooting guide tại `docs/error-troubleshooting.md` với đầy đủ 15 common errors được phân loại theo 4 categories (Setup, Planning, Execution, Debug). Mỗi error có format chuẩn: Error description, Cause explanation, và numbered Suggested Actions.

Purpose: Giúp user nhanh chóng xác định nguyên nhân lỗi và biết cách khắc phục mà không cần tìm kiếm thêm, giảm thời gian debug và cải thiện developer experience.

Output: File `docs/error-troubleshooting.md` với Quick Reference table và 15 detailed error entries có cross-references đến relevant documentation.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/103/103-CONTEXT.md
@.planning/phases/103/103-RESEARCH.md
@docs/error-recovery.md

<interfaces>
Format chuẩn cho mỗi error entry (từ CONTEXT.md decisions):

```markdown
### ERR-XXX: Error Title

**Error:** "Error message text"
**Skills Affected:** pd:skill1, pd:skill2

**Cause:**
Giải thích nguyên nhân xảy ra lỗi, liệt kê các trường hợp.

**Suggested Actions:**
1. Step 1 với command cụ thể
2. Step 2 với command cụ thể
3. Step 3 để verify fix

**See Also:**
- [Link Name](relative-path.md#section)
- [Other Guide](other.md)
```

Quick Reference Table format:
```markdown
| Error | Cause | Solution |
|-------|-------|----------|
| Error text | Brief cause | 1. Step 1<br>2. Step 2 |
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Review existing error-recovery.md and identify gaps</name>
  <files>docs/error-recovery.md (read-only)</files>
  <action>
Đọc và phân tích file docs/error-recovery.md hiện tại để xác định:
1. Những errors nào đã được document (cross-check với 15 errors trong research)
2. Format inconsistencies (bullet points vs headers, thiếu numbered steps)
3. Gaps cần bổ sung cho error-troubleshooting.md

Tạo gap analysis summary gồm:
- Errors already covered trong error-recovery.md
- Errors missing cần document
- Format improvements cần thực hiện
- Links cần thêm đến các docs khác

Lưu analysis này dưới dạng comment trong file hoặc reference để sử dụng cho các task sau.
  </action>
  <verify>
    <automated>grep -c "Common Error" docs/error-recovery.md && echo "Analyzed error-recovery.md successfully"</automated>
  </verify>
  <done>Đã phân tích error-recovery.md, xác định được gaps và improvements cần thực hiện</done>
</task>

<task type="auto">
  <name>Task 2: Design error-troubleshooting.md structure and create header</name>
  <files>docs/error-troubleshooting.md</files>
  <action>
Tạo file docs/error-troubleshooting.md với structure chuẩn:

1. **Header với title và description:**
   - Title: "# Error Troubleshooting Guide"
   - Description: Giải thích mục đích file

2. **Table of Contents:**
   - Quick Reference Table
   - Setup Errors
   - Planning Errors
   - Execution Errors
   - Debug Errors

3. **Quick Reference Table section:**
   - Tạo table template với columns: Error | Cause | Solution
   - Placeholder rows cho 4 categories

4. **Category sections:**
   - Setup Errors section header
   - Planning Errors section header
   - Execution Errors section header
   - Debug Errors section header

5. **Footer:**
   - Related Documentation section với links đến error-recovery.md, setup.md
   - "Last Updated" timestamp

Sử dụng markdown table syntax chuẩn với proper alignment.
  </action>
  <verify>
    <automated>ls docs/error-troubleshooting.md && grep -q "Quick Reference Table" docs/error-troubleshooting.md && echo "Structure created"</automated>
  </verify>
  <done>File structure created với header, TOC, và 4 category sections</done>
</task>

<task type="auto">
  <name>Task 3: Document Setup Errors (4 errors)</name>
  <files>docs/error-troubleshooting.md</files>
  <action>
Thêm Setup Errors section với 4 errors đầu tiên (per 103-RESEARCH.md):

**Quick Reference Table entries:**
Add 4 rows vào Quick Reference Table cho:
1. FastCode MCP not connected
2. Context7 MCP not connected
3. Missing prerequisites (Node/Python/Git)
4. .planning/ directory doesn't exist

**Detailed Error Entries:**

### ERR-001: FastCode MCP is not connected
**Error:** "FastCode MCP is not connected"
**Skills Affected:** pd:init, pd:plan, pd:write-code, pd:scan, pd:onboard
**Cause:** Docker daemon không chạy, MCP container bị stop, hoặc claude_desktop_config.json sai
**Suggested Actions:**
1. Kiểm tra Docker: `docker ps`
2. Start Docker Desktop nếu chưa chạy
3. Restart MCP: `docker restart <container_id>`
4. Verify config trong `claude_desktop_config.json`
5. Thử lại command
**See Also:** [Setup Guide](setup.md#mcp-configuration)

### ERR-002: Context7 MCP is not connected
[Similar format - từ research]

### ERR-003: Missing prerequisites
[Similar format - từ research]

### ERR-004: .planning/ directory doesn't exist
[Similar format - từ research]

Đảm bảo format chuẩn: Error/Cause/Suggested Actions/See Also.
  </action>
  <verify>
    <automated>grep -c "^### ERR-00[1-4]:" docs/error-troubleshooting.md | grep -q "4" && echo "Setup errors documented"</automated>
  </verify>
  <done>4 Setup errors documented trong error-troubleshooting.md</done>
</task>

<task type="auto">
  <name>Task 4: Document Planning Errors (4 errors)</name>
  <files>docs/error-troubleshooting.md</files>
  <action>
Thêm Planning Errors section với 4 errors (per 103-RESEARCH.md):

**Quick Reference Table entries:**
Add 4 rows vào Quick Reference Table cho:
5. Missing CONTEXT.md
6. Missing ROADMAP.md
7. Phase not found in roadmap
8. Missing rules

**Detailed Error Entries:**

### ERR-005: Missing CONTEXT.md
**Error:** "CONTEXT.md is missing - run `/pd:init` first"
**Skills Affected:** pd:new-milestone, pd:plan, pd:complete-milestone
**Cause:** Project chưa được initialize hoặc CONTEXT.md bị xóa
**Suggested Actions:**
1. Run `/pd:init` để tạo CONTEXT.md
2. Kiểm tra project root nếu file tồn tại ở vị trí khác
3. Thử lại command sau khi init
**See Also:** [Initialization Guide](setup.md#initialization)

### ERR-006: Missing ROADMAP.md
**Error:** "ROADMAP.md is missing - run `/pd:new-milestone`"
**Skills Affected:** pd:plan
**Cause:** Chưa có milestone nào được tạo
**Suggested Actions:**
1. Run `/pd:new-milestone [milestone-name]` để tạo roadmap
2. Ví dụ: `/pd:new-milestone "v1.1 Features"`
3. Sau khi tạo, thử lại `/pd:plan`
**See Also:** [Milestone Guide](setup.md#milestones)

### ERR-007: Phase does not exist in ROADMAP
[Format tương tự]

### ERR-008: Missing rules
[Format tương tự]

Đảm bảo mỗi error có Skills Affected, Cause, 3-5 numbered actions, và See Also links.
  </action>
  <verify>
    <automated>grep -c "^### ERR-00[5-8]:" docs/error-troubleshooting.md | grep -q "4" && echo "Planning errors documented"</automated>
  </verify>
  <done>4 Planning errors documented (ERR-005 đến ERR-008)</done>
</task>

<task type="auto">
  <name>Task 5: Document Execution Errors (4 errors)</name>
  <files>docs/error-troubleshooting.md</files>
  <action>
Thêm Execution Errors section với 4 errors (per 103-RESEARCH.md):

**Quick Reference Table entries:**
Add 4 rows vào Quick Reference Table cho:
9. Lint or build fails
10. Tests fail
11. MCP not connected during execution
12. Test framework not found

**Detailed Error Entries:**

### ERR-009: Lint or build fails
**Error:** "Lint or build fails"
**Skills Affected:** pd:write-code
**Cause:** Code vi phạm lint rules hoặc có syntax/type errors
**Suggested Actions:**
1. Đọc error output để xác định lỗi cụ thể
2. Fix ESLint errors: thiếu semicolon, unused vars
3. Fix TypeScript errors: type mismatches
4. Run lint lại: `npm run lint`
5. Run build: `npm run build`
6. Nếu persist, dùng `/pd:write-code --resume`
**See Also:** [Code Standards](CLAUDE.md#code-standards)

### ERR-010: Tests fail
**Error:** "Tests fail: X tests failed"
**Skills Affected:** pd:test, pd:write-code
**Cause:** Implementation không pass test expectations
**Suggested Actions:**
1. Đọc test failure output (expected vs actual)
2. Identify files bị ảnh hưởng
3. Fix implementation
4. Run tests lại: `npm test`
5. Nếu infrastructure error, run `/pd:test --standalone`
**See Also:** [Testing Guide](testing.md)

### ERR-011: MCP is not connected (during execution)
**Error:** "MCP is not connected"
**Skills Affected:** pd:test, pd:write-code
**Cause:** FastCode/Context7 MCP không available
**Suggested Actions:**
1. Kiểm tra Docker và MCP services
2. Skills sẽ tự động dùng fallback (Grep/Read)
3. Continue execution hoặc fix MCP rồi retry
**See Also:** [MCP Setup](setup.md#mcp)

### ERR-012: Test framework not found
**Error:** "Test framework not found"
**Skills Affected:** pd:test
**Cause:** Test runner chưa được install hoặc config thiếu
**Suggested Actions:**
1. Kiểm tra `package.json` cho test scripts
2. Install dependencies: `npm install --save-dev [framework]`
3. Verify config file tồn tại
4. Run `/pd:test --standalone` để auto-setup
**See Also:** [Testing Setup](setup.md#testing)

  </action>
  <verify>
    <automated>grep -c "^### ERR-0[0-9][0-9]:" docs/error-troubleshooting.md | grep -q "4" && echo "Execution errors documented"</automated>
  </verify>
  <done>4 Execution errors documented (ERR-009 đến ERR-012)</done>
</task>

<task type="auto">
  <name>Task 6: Document Debug Errors (3 errors)</name>
  <files>docs/error-troubleshooting.md</files>
  <action>
Thêm Debug Errors section với 3 errors (per 103-RESEARCH.md):

**Quick Reference Table entries:**
Add 3 rows vào Quick Reference Table cho:
13. Bug cannot be reproduced
14. Unfinished tasks remain
15. Open bugs remain

**Detailed Error Entries:**

### ERR-013: The bug cannot be reproduced
**Error:** "The bug cannot be reproduced"
**Skills Affected:** pd:fix-bug
**Cause:** Không đủ information để reproduce bug
**Suggested Actions:**
1. Cung cấp thêm thông tin:
   - Specific error messages đầy đủ
   - Steps to reproduce chi tiết
   - Expected vs actual behavior
   - Environment details (OS, versions)
2. Kiểm tra logs: `tail -f .planning/logs/agent-errors.jsonl`
3. Thử lại `/pd:fix-bug` với description đầy đủ hơn
**See Also:** [Bug Investigation](error-recovery.md#pd:fix-bug)

### ERR-014: Unfinished tasks remain
**Error:** "There are unfinished tasks - complete them before closing the milestone"
**Skills Affected:** pd:complete-milestone
**Cause:** Có tasks chưa được đánh dấu complete trong milestone
**Suggested Actions:**
1. Run `/pd:status` để xem task list
2. Hoặc đọc `.planning/STATE.md` để check progress
3. Complete remaining tasks bằng `/pd:write-code`
4. Sau khi tất cả done, retry `/pd:complete-milestone`
**See Also:** [Milestone Completion](setup.md#completing-milestones)

### ERR-015: Open bugs remain
**Error:** "There are still unresolved bugs - run `/pd:fix-bug` first"
**Skills Affected:** pd:complete-milestone
**Cause:** Có bugs chưa được fix trong `.planning/bugs/`
**Suggested Actions:**
1. List open bugs: `ls .planning/bugs/`
2. Run `/pd:fix-bug "[bug description]"` cho mỗi bug
3. Hoặc `/pd:status` để xem bug summary
4. Sau khi tất cả resolved, retry `/pd:complete-milestone`
**See Also:** [Bug Management](setup.md#bugs)

  </action>
  <verify>
    <automated>test $(grep -c "^### ERR-013:" docs/error-troubleshooting.md) -ge 1 && test $(grep -c "^### ERR-014:" docs/error-troubleshooting.md) -ge 1 && test $(grep -c "^### ERR-015:" docs/error-troubleshooting.md) -ge 1 && echo "Debug errors documented"</automated>
  </verify>
  <done>3 Debug errors documented (ERR-013 đến ERR-015), tất cả 15 errors complete</done>
</task>

<task type="auto">
  <name>Task 7: Add Quick Reference table and cross-references</name>
  <files>docs/error-troubleshooting.md</files>
  <action>
Hoàn thiện Quick Reference table và thêm cross-references:

**1. Populate Quick Reference Table:**
Thay thế placeholders trong Quick Reference Table với actual data:

```markdown
## Quick Reference Table

| Error | Cause | Solution |
|-------|-------|----------|
| FastCode MCP not connected | Docker service not running | 1. Check `docker ps`<br>2. Restart container<br>3. Verify config |
| Context7 MCP not connected | MCP service unavailable | 1. Check network<br>2. Restart service<br>3. Use fallback |
| ... | ... | ... |
```

Cần có 15 rows (4 Setup + 4 Planning + 4 Execution + 3 Debug).

**2. Add Related Documentation section:**
Thêm section ở cuối file:
```markdown
## Related Documentation

- [Error Recovery Guide](error-recovery.md) - Advanced error handling và log analysis
- [Setup Guide](setup.md) - Initial setup và MCP configuration
- [CLAUDE.md](../CLAUDE.md) - Project conventions và standards
```

**3. Add Usage Instructions:**
Thêm section "How to Use This Guide" sau TOC:
- Tìm error trong Quick Reference table
- Click vào error code để xem detailed guide
- Follow numbered Suggested Actions
- Nếu vẫn lỗi, check "See Also" links

**4. Verify table formatting:**
- Đảm bảo markdown table render correctly
- Check alignment và line breaks trong Solution column
  </action>
  <verify>
    <automated>grep -c "|" docs/error-troubleshooting.md | awk '{if($1>=30) print "Table complete"; else print "Need more rows"}' && grep -q "Related Documentation" docs/error-troubleshooting.md && echo "Cross-references added"</automated>
  </verify>
  <done>Quick Reference Table populated với 15 rows và cross-references added</done>
</task>

<task type="auto">
  <name>Task 8: Verify formatting and validate completeness</name>
  <files>docs/error-troubleshooting.md</files>
  <action>
Final verification và formatting polish:

**1. Verify completeness checklist:**
- [ ] 15 error entries với ERR-001 đến ERR-015
- [ ] Mỗi entry có: Error, Skills Affected, Cause, Suggested Actions, See Also
- [ ] Quick Reference Table có đủ 15 rows
- [ ] 4 category sections (Setup, Planning, Execution, Debug)
- [ ] Related Documentation section với links

**2. Verify formatting:**
- Check markdown table syntax (| column | column |)
- Verify headers render correctly (##, ###)
- Ensure numbered lists dùng 1. 2. 3. format
- Check code blocks có proper backticks

**3. Verify cross-references:**
- All "See Also" links dùng relative paths
- Links point đến existing files
- No circular references

**4. Line count verification:**
File should have at least 200 lines (15 detailed entries + table + sections).

**5. Final polish:**
- Consistent spacing giữa sections
- Proper line breaks trong table cells (<br>)
- Header levels consistency

**Command để verify:**
- `grep -c "^### ERR-"` - đếm error entries
- `wc -l` - check line count
- `grep "|" | wc -l` - check table rows
  </action>
  <verify>
    <automated>ERR_COUNT=$(grep -c "^### ERR-" docs/error-troubleshooting.md) && LINE_COUNT=$(wc -l < docs/error-troubleshooting.md) && echo "Errors: $ERR_COUNT, Lines: $LINE_COUNT" && if [ "$ERR_COUNT" -eq 15 ] && [ "$LINE_COUNT" -ge 200 ]; then echo "VALIDATION PASSED"; else echo "VALIDATION FAILED"; fi</automated>
  </verify>
  <done>File validated: 15 errors documented, proper formatting, cross-references complete</done>
</task>

</tasks>

<verification>
**Wave 1 Completion Checks:**

1. **File Existence:**
   - `docs/error-troubleshooting.md` exists
   - File readable và properly formatted markdown

2. **Content Completeness:**
   - 15 error entries (ERR-001 đến ERR-015)
   - Quick Reference Table với 15 rows
   - 4 category sections (Setup, Planning, Execution, Debug)

3. **Format Compliance:**
   - Mỗi error có: Error description, Skills Affected, Cause, Suggested Actions, See Also
   - Numbered steps trong Suggested Actions
   - Table format: Error | Cause | Solution

4. **Cross-References:**
   - Links đến setup.md, error-recovery.md, CLAUDE.md
   - Relative paths sử dụng đúng

5. **No Breaking Changes:**
   - `docs/error-recovery.md` không bị modify
   - Only new file created

**Verification Commands:**
```bash
# Count error entries
grep -c "^### ERR-" docs/error-troubleshooting.md
# Expected: 15

# Check file size
wc -l docs/error-troubleshooting.md
# Expected: >= 200 lines

# Verify table format
grep "| Error | Cause | Solution |" docs/error-troubleshooting.md

# Check error-recovery.md preserved
md5sum docs/error-recovery.md
```
</verification>

<success_criteria>
**Phase 103 Complete khi:**

1. **File Created:**
   - `docs/error-troubleshooting.md` exists tại đúng location
   - File có ít nhất 200 lines
   - Markdown format valid

2. **All 15 Errors Documented:**
   - 4 Setup Errors (ERR-001 đến ERR-004)
   - 4 Planning Errors (ERR-005 đến ERR-008)
   - 4 Execution Errors (ERR-009 đến ERR-012)
   - 3 Debug Errors (ERR-013 đến ERR-015)

3. **Format Standards Met:**
   - Mỗi error có Error/Cause/Suggested Actions/See Also
   - Suggested Actions là numbered steps (1., 2., 3.)
   - Skills Affected được liệt kê

4. **Quick Reference Complete:**
   - Table có 15 rows (mỗi error một row)
   - Columns: Error | Cause | Solution
   - Solution column dùng <br> cho multiple steps

5. **Cross-References Added:**
   - Links đến setup.md
   - Links đến error-recovery.md
   - Links đến CLAUDE.md

6. **No Breaking Changes:**
   - `docs/error-recovery.md` unchanged
   - No modifications to existing skill files
</success_criteria>

<output>
Sau khi hoàn thành, tạo `.planning/phases/103/103-01-SUMMARY.md` với:
- File created: docs/error-troubleshooting.md
- Lines of documentation: [actual count]
- Errors documented: 15 (4 Setup + 4 Planning + 4 Execution + 3 Debug)
- Quick Reference Table: 15 rows
- Cross-references: setup.md, error-recovery.md, CLAUDE.md
</output>
