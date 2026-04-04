# Phase 103: DOC-04 — Error Message Improvements - Research

**Researched:** 2026-04-04
**Domain:** Error handling, troubleshooting documentation
**Confidence:** HIGH

## Summary

Phase này tập trung cải thiện error messages cho 16 PD skill commands bằng cách tạo `docs/error-troubleshooting.md` - một reference guide giúp user nhanh chóng xác định và khắc phục lỗi.

Từ phân tích 16 skill files (`commands/pd/*.md`), tôi đã xác định được 15 error patterns phổ biến nhất, được phân loại thành 4 categories: Setup, Planning, Execution, và Debug. Mỗi error đều có format chuẩn gồm Error description, Cause explanation, và Suggested actions dạng numbered steps.

**Primary recommendation:** Tạo `docs/error-troubleshooting.md` với table format (Error | Cause | Solution), group theo category, và include cross-references đến relevant documentation.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
1. **Content Scope:** Review 16 skill commands (commands/pd/*.md), focus on user-facing error messages (not internal logs)
2. **Error Message Format:** Mỗi error có 3 phần: Error (mô tả), Cause (giải thích), Suggested action (hướng dẫn fix)
3. **Error Troubleshooting Guide:** File `docs/error-troubleshooting.md`, format Table với Error | Cause | Solution, group theo category
4. **Documentation Links:** Link mỗi error đến relevant documentation, sử dụng relative paths
5. **Suggested action format:** Numbered steps, imperative style

### Claude's Discretion
- Cách prioritize errors (dựa trên frequency + user impact)
- Detailed wording cho mỗi suggested action
- Organization trong error-troubleshooting.md

### Deferred Ideas (OUT OF SCOPE)
- Automated error classification → requires ML, v11.x backlog
- Real-time error analytics → requires infrastructure
- Skill code refactoring → out of scope for docs phase
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DOC-04 | Error Message Improvements - cải thiện error messages để user biết cách khắc phục | Phân tích 16 skill files, xác định 15 error patterns phổ biến nhất, review existing error-recovery.md |
</phase_requirements>

## Top 15 Errors Identified từ Skill Analysis

Dựa trên phân tích 16 skill files và error-recovery.md hiện tại, đây là các errors thường gặp nhất:

### Category 1: Setup Errors (4 errors)

| # | Error | Skills Affected | Frequency |
|---|-------|-----------------|-----------|
| 1 | FastCode MCP is not connected | init, plan, write-code, scan, onboard | HIGH |
| 2 | Context7 MCP is not connected | plan, write-code, fix-bug, research | HIGH |
| 3 | Missing prerequisites (Node, Python, Git) | init, scan, onboard | MEDIUM |
| 4 | `.planning/` directory does not exist | status, what-next | MEDIUM |

### Category 2: Planning Errors (4 errors)

| # | Error | Skills Affected | Frequency |
|---|-------|-----------------|-----------|
| 5 | Missing `CONTEXT.md` - run `/pd:init` first | new-milestone, plan, complete-milestone | HIGH |
| 6 | Missing `ROADMAP.md` - run `/pd:new-milestone` | plan | HIGH |
| 7 | Phase does not exist in `ROADMAP` | plan | MEDIUM |
| 8 | Missing rules - run `/pd:init` to recreate | new-milestone | MEDIUM |

### Category 3: Execution Errors (4 errors)

| # | Error | Skills Affected | Frequency |
|---|-------|-----------------|-----------|
| 9 | Lint or build fails | write-code | HIGH |
| 10 | Tests fail | test, write-code | HIGH |
| 11 | MCP is not connected | test, write-code | MEDIUM |
| 12 | Test framework not found | test | MEDIUM |

### Category 4: Debug/Misc Errors (3 errors)

| # | Error | Skills Affected | Frequency |
|---|-------|-----------------|-----------|
| 13 | The bug cannot be reproduced | fix-bug | HIGH |
| 14 | Unfinished tasks remain - complete first | complete-milestone | MEDIUM |
| 15 | Open bugs remain - run `/pd:fix-bug` | complete-milestone | MEDIUM |

## Current State của error-recovery.md

File `/Volumes/Code/Nodejs/please-done/docs/error-recovery.md` đã tồn tại với structure:

### Existing Structure Analysis

1. **Quick Reference by Skill** - Errors được group theo skill (pd:fix-bug, pd:plan, pd:write-code, etc.)
2. **General Recovery Steps** - 4 bước: Check Logs → Identify Error Type → Apply Recovery → Verify Fix
3. **Log File Format** - Mô tả JSON structure của `.planning/logs/agent-errors.jsonl`
4. **Quick Commands** - Bash commands để view/clear logs
5. **Error Patterns by Category** - MCP Connection, File System, Resource Constraint, Input Validation, Integration

### Strengths của error-recovery.md hiện tại
- Bao gồm nhiều errors cho các skills quan trọng
- Có example log entries (JSON format)
- Có quick commands để diagnostic
- Phân loại theo pattern types

### Gaps cần bổ sung
1. **Format không consistent** - Có entries dùng "Common Error", có chỗ dùng "Symptoms", "Recovery"
2. **Thiếu numbered steps** - "Recovery" mô tả chung chung, không cụ thể
3. **Không có table format** - Khó scan và tìm nhanh
4. **Không link đến documentation** - User phải tự tìm
5. **Missing suggested action structure** - Cần Error | Cause | Solution format

## Recommended Structure cho error-troubleshooting.md

Dựa trên decisions trong CONTEXT.md, file mới sẽ có structure sau:

```markdown
# Error Troubleshooting Guide

## Quick Reference Table

### Setup Errors

| Error | Cause | Solution |
|-------|-------|----------|
| FastCode MCP is not connected | Docker service not running or MCP misconfigured | 1. Check Docker status: `docker ps` <br> 2. Restart MCP container <br> 3. Verify claude_desktop_config.json |
| ... | ... | ... |

### Planning Errors
...

### Execution Errors
...

### Debug Errors
...

## Detailed Error Guide

### ERR-001: FastCode MCP is not connected

**Error:** "FastCode MCP is not connected"

**Cause:** 
FastCode MCP server yêu cầu Docker để chạy. Lỗi này xảy ra khi:
- Docker daemon không chạy
- MCP container bị stop hoặc crash
- Configuration trong `claude_desktop_config.json` bị sai

**Suggested Actions:**
1. Kiểm tra Docker status: `docker ps`
2. Nếu Docker không chạy, start Docker Desktop
3. Restart MCP container: `docker restart <container_name>`
4. Kiểm tra configuration trong `claude_desktop_config.json`
5. Thử lại command

**See Also:**
- [Setup Guide](setup.md#mcp-configuration)
- [Docker Troubleshooting](docker-troubleshooting.md)
```

## Suggested Actions cho mỗi Error Type

### 1. FastCode MCP is not connected

**Error:** "FastCode MCP is not connected"
**Skills:** init, plan, write-code, scan, onboard

**Cause:** Docker service không chạy hoặc MCP configuration bị sai

**Suggested Actions:**
1. Kiểm tra Docker đang chạy: `docker ps`
2. Nếu Docker Desktop chưa start, khởi động Docker Desktop
3. Kiểm tra MCP container status: `docker ps | grep fastcode`
4. Nếu container không chạy, start lại: `docker start <container_id>`
5. Verify configuration trong `claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "fastcode": {
         "command": "docker",
         "args": ["run", "--rm", "-i", "fastcode-mcp"]
       }
     }
   }
   ```
6. Thử lại skill command

**See Also:** `docs/setup.md#mcp-configuration`

### 2. Context7 MCP is not connected

**Error:** "Context7 MCP is not connected"
**Skills:** plan, write-code, fix-bug, research

**Cause:** Context7 MCP server không available hoặc configuration sai

**Suggested Actions:**
1. Kiểm tra network connectivity
2. Verify Context7 MCP trong configuration
3. Restart MCP service nếu cần
4. Nếu vẫn lỗi, skills có thể continue với fallback (Grep/Read)

### 3. Missing prerequisites (Node, Python, Git)

**Error:** "Missing prerequisite: [tool]"
**Skills:** init, scan, onboard

**Cause:** Tool cần thiết chưa được install hoặc không có trong PATH

**Suggested Actions:**
1. Kiểm tra tool đã install chưa: `which [tool]`
2. Nếu chưa install:
   - Node: Install từ [nodejs.org](https://nodejs.org)
   - Python: Install từ [python.org](https://python.org)
   - Git: Install từ [git-scm.com](https://git-scm.com)
3. Verify version: `[tool] --version`
4. Đảm bảo tool có trong PATH
5. Thử lại skill command

### 4. `.planning/` directory does not exist

**Error:** ".planning/ directory does not exist" hoặc "The project has not been initialized yet"
**Skills:** status, what-next

**Cause:** Project chưa được initialize với `/pd:init`

**Suggested Actions:**
1. Run `/pd:init` để initialize project
2. Hoặc run `/pd:onboard` cho automated setup
3. Sau khi init, thử lại command

### 5. Missing `CONTEXT.md`

**Error:** "CONTEXT.md is missing" hoặc "Run `/pd:init` first"
**Skills:** new-milestone, plan, complete-milestone

**Cause:** Project chưa được initialize hoặc CONTEXT.md bị xóa

**Suggested Actions:**
1. Run `/pd:init` để tạo CONTEXT.md
2. Nếu CONTEXT.md tồn tại nhưng ở vị trí khác, kiểm tra project root
3. Thử lại command sau khi init

### 6. Missing `ROADMAP.md`

**Error:** "ROADMAP.md is missing" hoặc "Run `/pd:new-milestone` first"
**Skills:** plan

**Cause:** Chưa có milestone nào được tạo

**Suggested Actions:**
1. Run `/pd:new-milestone [milestone-name]` để tạo milestone
2. VD: `/pd:new-milestone "v1.1 Notifications"`
3. Sau khi tạo roadmap, thử lại `/pd:plan`

### 7. Phase does not exist in `ROADMAP`

**Error:** "Phase does not exist in ROADMAP" hoặc "Invalid phase number"
**Skills:** plan

**Cause:** Phase number được cung cấp không tồn tại trong roadmap

**Suggested Actions:**
1. Mở `.planning/ROADMAP.md` để xem danh sách phases
2. Kiểm tra phase number đúng format (VD: "1.2", "2.1")
3. Sử dụng phase number hợp lệ
4. Hoặc run `/pd:plan` không có phase number để tự động chọn phase tiếp theo

### 8. Missing rules

**Error:** "Rules are missing" hoặc "Run `/pd:init` to recreate them"
**Skills:** new-milestone

**Cause:** Rule files trong `.planning/rules/` bị thiếu hoặc bị xóa

**Suggested Actions:**
1. Run `/pd:init` để recreate rule files
2. Kiểm tra `.planning/rules/general.md` tồn tại sau khi init
3. Thử lại command

### 9. Lint or build fails

**Error:** "Lint or build fails" hoặc specific lint errors (ESLint, TypeScript)
**Skills:** write-code

**Cause:** Code vi phạm lint rules hoặc có syntax/type errors

**Suggested Actions:**
1. Đọc error output để xác định lỗi cụ thể
2. Fix các lỗi được liệt kê:
   - ESLint errors: Sửa theo rule (vd: thiếu semicolon, unused vars)
   - TypeScript errors: Fix type mismatches
   - Build errors: Kiểm tra imports, dependencies
3. Run lint/build lại để verify: `npm run lint` hoặc `npm run build`
4. Nếu lỗi persist, dùng `/pd:write-code --resume` để skip to lint step

### 10. Tests fail

**Error:** "Tests fail" hoặc "X tests failed: [test names]"
**Skills:** test, write-code

**Cause:** Implementation không pass test expectations hoặc có regression

**Suggested Actions:**
1. Đọc test failure output để hiểu expected vs actual
2. Identify files bị ảnh hưởng từ error context
3. Fix implementation để match expected behavior
4. Run tests lại: `npm test` hoặc `/pd:test --all`
5. Nếu test infrastructure error, run `/pd:test --standalone` để setup

### 11. MCP is not connected (Test/Write-code)

**Error:** "MCP is not connected" trong test/write-code context
**Skills:** test, write-code

**Cause:** FastCode/Context7 MCP không available

**Suggested Actions:**
1. Kiểm tra Docker và MCP services
2. Skills sẽ tự động dùng fallback (Grep/Read) nếu MCP unavailable
3. Warning sẽ hiển thị: "⚠️ FastCode unavailable — using Grep/Read fallback"
4. Continue với execution hoặc fix MCP rồi retry

### 12. Test framework not found

**Error:** "Test framework not found" hoặc "Cannot run tests"
**Skills:** test

**Cause:** Test runner chưa được install hoặc config thiếu

**Suggested Actions:**
1. Kiểm tra `package.json` cho test scripts
2. Install test dependencies: `npm install --save-dev [framework]`
3. Verify test config file tồn tại (jest.config.js, etc.)
4. Run `/pd:test --standalone` để auto-setup test infrastructure

### 13. The bug cannot be reproduced

**Error:** "The bug cannot be reproduced"
**Skills:** fix-bug

**Cause:** Không đủ information để reproduce bug

**Suggested Actions:**
1. Cung cấp thêm thông tin:
   - Specific error messages đầy đủ
   - Steps to reproduce chi tiết
   - Expected vs actual behavior
   - Environment details (OS, versions)
2. Kiểm tra logs: `tail -f .planning/logs/agent-errors.jsonl`
3. Thử lại `/pd:fix-bug` với description đầy đủ hơn

### 14. Unfinished tasks remain

**Error:** "There are unfinished tasks" hoặc "Complete them before closing the milestone"
**Skills:** complete-milestone

**Cause:** Có tasks chưa được đánh dấu complete trong milestone

**Suggested Actions:**
1. Run `/pd:status` để xem task list
2. Hoặc đọc `.planning/STATE.md` để check progress
3. Complete remaining tasks bằng `/pd:write-code`
4. Sau khi tất cả tasks done, retry `/pd:complete-milestone`

### 15. Open bugs remain

**Error:** "There are still unresolved bugs" hoặc "Run `/pd:fix-bug` first"
**Skills:** complete-milestone

**Cause:** Có bugs chưa được fix trong `.planning/bugs/`

**Suggested Actions:**
1. List open bugs: `ls .planning/bugs/`
2. Run `/pd:fix-bug "[bug description]"` cho mỗi open bug
3. Hoặc `/pd:status` để xem bug summary
4. Sau khi tất cả bugs resolved, retry `/pd:complete-milestone`

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Error logging infrastructure | Custom logger | `bin/lib/skill-error-logger.js` | Already has JSON formatting, file rotation, structured context |
| Error handler per skill | Custom try-catch | `bin/lib/basic-error-handler.js` / `enhanced-error-handler.js` | Standardized error handling với phase context |
| Log file parsing | Manual jq commands | `tail -n 20 .planning/logs/agent-errors.jsonl \| jq '.'` | JSON format đã được thiết kế cho jq filtering |
| Error classification | Rule-based classifier | Document trong error-troubleshooting.md | ML classification là deferred idea (out of scope) |

## Common Pitfalls

### Pitfall 1: Inconsistent Error Message Format
**What goes wrong:** Các skill dùng formats khác nhau cho "Common errors" section - có chỗ dùng bullet points, có chỗ dùng headers
**Why it happens:** Không có style guide chuẩn cho error documentation
**How to avoid:** Dùng template chuẩn: `**Error:**` + `**Cause:**` + `**Suggested Actions:**` numbered list
**Warning signs:** Error sections trong skill files có format khác nhau

### Pitfall 2: Circular Documentation References
**What goes wrong:** Error message link đến doc, nhưng doc lại reference ngược lại error message
**Why it happens:** Thiếu planning cho documentation structure
**How to avoid:** Tạo single source of truth (error-troubleshooting.md), các skills reference đến đó
**Warning signs:** User phải đọc nhiều files để tìm solution

### Pitfall 3: Missing Context in Suggested Actions
**What goes wrong:** "Recovery" steps quá generic, không actionable
**Why it happens:** Viết từ góc nhìn developer, không phải user
**How to avoid:** Mỗi step phải có command cụ thể hoặc file path cụ thể
**Warning signs:** Steps như "Check the configuration" không có hướng dẫn cụ thể

## Code Examples

### Error Table Format (Markdown)

```markdown
### Category: Setup Errors

| Error | Cause | Solution |
|-------|-------|----------|
| FastCode MCP is not connected | Docker service not running | 1. Check Docker: `docker ps`<br>2. Restart container<br>3. Verify config |
| CONTEXT.md missing | Project not initialized | 1. Run `/pd:init`<br>2. Retry command |
```

### Error Entry Format (Detailed)

```markdown
### ERR-001: FastCode MCP is not connected

**Error:** "FastCode MCP is not connected"

**Cause:** 
Docker daemon không chạy hoặc MCP configuration sai.

**Suggested Actions:**
1. Kiểm tra Docker status: `docker ps`
2. Start Docker Desktop nếu chưa chạy
3. Restart MCP container: `docker restart <container_id>`
4. Verify `claude_desktop_config.json`
5. Thử lại command

**See Also:**
- [Setup Guide](setup.md#mcp-configuration)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Error messages chỉ có mô tả | Error + Cause + Suggested Actions | Phase 103 | User có thể tự fix không cần hỏi |
| Skill-specific error docs | Centralized error-troubleshooting.md | Phase 103 | Single reference point, dễ maintain |
| Bullet point recovery steps | Numbered imperative steps | Phase 103 | Dễ follow, actionable |
| No documentation links | Cross-references đến relevant docs | Phase 103 | Complete self-service troubleshooting |

## Open Questions

1. **Error Code System (ERR-001, ERR-002)**
   - What we know: CONTEXT.md không yêu cầu error codes
   - What's unclear: Có nên thêm error codes để dễ reference không?
   - Recommendation: Có thể thêm sau, không bắt buộc cho phase này

2. **Automation of Error Detection**
   - What we know: `.planning/logs/agent-errors.jsonl` có structured logs
   - What's unclear: Có nên scan logs để suggest errors phổ biến không?
   - Recommendation: Out of scope (deferred), chỉ làm documentation

3. **Multi-language Support**
   - What we know: Error messages hiện tại là English
   - What's unclear: Có cần support Vietnamese errors không?
   - Recommendation: Theo CLAUDE.md, All output MUST be in English - giữ English

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in) |
| Config file | `package.json` test scripts |
| Quick run command | `npm test -- --test-name-pattern="error"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|------------|
| DOC-04 | error-troubleshooting.md exists | unit | `ls docs/error-troubleshooting.md` | ❌ Wave 0 |
| DOC-04 | File có table format | unit | `grep "| Error | Cause | Solution |" docs/error-troubleshooting.md` | ❌ Wave 0 |
| DOC-04 | Có ít nhất 15 errors documented | unit | `grep -c "^### " docs/error-troubleshooting.md` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `ls docs/error-troubleshooting.md`
- **Per wave merge:** Verify markdown table format
- **Phase gate:** File exists với complete error entries

### Wave 0 Gaps
- [ ] `docs/error-troubleshooting.md` — chưa tồn tại
- [ ] Table format với Error | Cause | Solution columns
- [ ] Ít nhất 15 error entries
- [ ] Cross-references đến existing documentation

## Sources

### Primary (HIGH confidence)
- `/Volumes/Code/Nodejs/please-done/commands/pd/*.md` - 16 skill files với Common errors sections
- `/Volumes/Code/Nodejs/please-done/docs/error-recovery.md` - Existing error documentation
- `/Volumes/Code/Nodejs/please-done/.planning/phases/103/103-CONTEXT.md` - Phase requirements và decisions

### Secondary (MEDIUM confidence)
- `/Volumes/Code/Nodejs/please-done/bin/lib/basic-error-handler.js` - Error handler implementation
- `/Volumes/Code/Nodejs/please-done/bin/lib/enhanced-error-handler.js` - Enhanced error context
- `/Volumes/Code/Nodejs/please-done/.planning/logs/agent-errors.jsonl` - Actual error log format

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Dựa trên actual skill files và error-recovery.md
- Architecture: HIGH - Format được define trong CONTEXT.md decisions
- Pitfalls: MEDIUM - Dựa trên review của error-recovery.md hiện tại

**Research date:** 2026-04-04
**Valid until:** 30 days (stable domain - error patterns ít thay đổi)

## RESEARCH COMPLETE

**Phase:** 103 - DOC-04 Error Message Improvements
**Confidence:** HIGH

### Key Findings
1. Đã xác định 15 error patterns phổ biến từ 16 skill files, phân loại thành 4 categories
2. File `error-recovery.md` hiện tại có gaps: inconsistent format, thiếu numbered steps, không có table view
3. Format chuẩn cho error-troubleshooting.md: Table (Error | Cause | Solution) + Detailed entries với numbered actions
4. Tất cả suggested actions nên dùng imperative style, có commands cụ thể

### File Created
`/Volumes/Code/Nodejs/please-done/.planning/phases/103/103-RESEARCH.md`

### Open Questions Answered
- Error codes: Optional, không bắt buộc
- Language: English (theo CLAUDE.md)
- Automation: Out of scope cho phase này

### Ready for Planning
Research complete. Planner có thể tạo PLAN.md dựa trên findings này.
