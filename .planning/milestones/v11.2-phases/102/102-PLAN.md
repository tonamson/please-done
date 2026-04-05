---
phase: 102
code: DOC-03
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - /Volumes/Code/Nodejs/please-done/CLAUDE.md
autonomous: true
requirements:
  - DOC-03
must_haves:
  truths:
    - Common Workflows section exists in CLAUDE.md after Project Language Convention
    - 5 workflows documented with table format (context → command → expected output → next steps)
    - Each workflow has Decision Points section for error handling
    - Command reference updated with usage patterns table
    - No breaking changes to existing command references
  artifacts:
    - path: "CLAUDE.md"
      provides: "Updated documentation with Common Workflows section"
      min_sections: 7
      contains:
        - "## Common Workflows"
        - "### Workflow 1: Starting a New Project"
        - "### Workflow 2: Fixing a Bug"
        - "### Workflow 3: Checking Project Progress"
        - "### Workflow 4: Planning a Feature"
        - "### Workflow 5: Completing a Milestone"
        - "| Step | Command | Expected Output | Next Step |"
  key_links:
    - from: "CLAUDE.md ## Common Workflows"
      to: "docs/commands/"
      via: "Cross-reference links"
      pattern: "docs/commands/"
---

# Phase 102: DOC-03 — CLAUDE.md Usage Examples

## Objective

Update CLAUDE.md với section "Common Workflows" chứa 5 workflow thực tế, mỗi workflow tuân theo format context → command → expected output → next steps. Cập nhật command reference với usage patterns và flag combinations.

**Purpose:** Giúp người dùng hiểu cách sử dụng PD commands trong các tình huống thực tế thay vì chỉ đọc tài liệu reference khô khan.

**Output:** CLAUDE.md được cập nhật với Common Workflows section, không làm thay đổi nội dung hiện có.

---

## Context

### File Target
- `@/Volumes/Code/Nodejs/please-done/CLAUDE.md` — File cần cập nhật

### Research File
- `@/Volumes/Code/Nodejs/please-done/.planning/phases/102/102-RESEARCH.md` — Chứa 5 workflows đã nghiên cứu

### Current Structure
```
CLAUDE.md (hiện tại)
├── Project Language Convention (dòng 1-2)
├── Command Reference: pd:onboard (dòng 4-32)
├── Command Reference: pd:map-codebase (dòng 34-66)
├── Command Reference: pd:status (dòng 68-100)
└── Schema Validation (dòng 103-130)
```

### New Structure
```
CLAUDE.md (sau khi cập nhật)
├── Project Language Convention (dòng 1-2)
├── Common Workflows (MỚI — insert ở đây)
│   ├── Workflow 1: Starting a New Project
│   ├── Workflow 2: Fixing a Bug
│   ├── Workflow 3: Checking Project Progress
│   ├── Workflow 4: Planning a Feature
│   └── Workflow 5: Completing a Milestone
├── Command Reference: pd:onboard
├── Command Reference: pd:map-codebase
├── Command Reference: pd:status
└── Schema Validation
```

---

## Requirements from DOC-03

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| DOC-03-1 | Thêm mục "Common Workflows" với 3-5 workflow | Section tồn tại với ít nhất 3 workflows |
| DOC-03-2 | Mỗi workflow có context → command → expected output → next steps | Format bảng 4 cột: Context, Command, Expected Output, Next Steps |
| DOC-03-3 | Ví dụ: "Bắt đầu project mới", "Fix bug", "Kiểm tra tiến độ" | Các ví dụ này được cover trong Workflow 1, 2, 3 |
| DOC-03-4 | Cập nhật command reference với usage patterns | Thêm bảng flag combinations và error recovery patterns |

---

## Tasks

<task type="auto">
  <name>Task 1: Phân tích cấu trúc CLAUDE.md hiện tại</name>
  <files>/Volumes/Code/Nodejs/please-done/CLAUDE.md</files>
  <action>
    1. Đọc toàn bộ CLAUDE.md để hiểu cấu trúc hiện tại
    2. Xác định vị trí insert "Common Workflows" section (sau line 2 — Project Language Convention)
    3. Ghi nhận các command reference hiện có để đảm bảo không ghi đè
    4. Xác định anchor points để insert nội dung mới
  </action>
  <verify>
    <automated>grep -n "Project Language Convention" /Volumes/Code/Nodejs/please-done/CLAUDE.md && grep -n "Command Reference" /Volumes/Code/Nodejs/please-done/CLAUDE.md | head -3</automated>
  </verify>
  <done>
    - Xác định được vị trí insert (sau line 2)
    - Liệt kê được tất cả sections hiện có
    - Xác định anchor point để insert (trước "Command Reference: pd:onboard")
  </done>
</task>

<task type="auto">
  <name>Task 2: Thiết kế Common Workflows section structure</name>
  <files>/Volumes/Code/Nodejs/please-done/CLAUDE.md</files>
  <action>
    1. Tạo section header "## Common Workflows" với intro text
    2. Thêm table of contents cho 5 workflows
    3. Định nghĩa template cho mỗi workflow:
       - ### Workflow N: [Name]
       - **When to use:** [context]
       - **Command Sequence:** [code block]
       - **Steps:** [bảng 4 cột]
       - **Decision Points:** [bullet list]
  </action>
  <verify>
    <automated>grep -A 20 "## Common Workflows" /Volumes/Code/Nodejs/please-done/CLAUDE.md | head -25</automated>
  </verify>
  <done>
    - Section header "## Common Workflows" được thêm
    - Table of contents với 5 workflows
    - Template structure được định nghĩa
  </done>
</task>

<task type="auto">
  <name>Task 3: Viết Workflow 1 — Starting a New Project</name>
  <files>/Volumes/Code/Nodejs/please-done/CLAUDE.md</files>
  <action>
    Viết workflow đầy đủ theo template:
    
    ### Workflow 1: Starting a New Project
    
    **When to use:** You have cloned or initialized a codebase and want to set up PD structure for the first time.
    
    **Command Sequence:**
    ```
    /pd:onboard → /pd:new-milestone → /pd:plan → /pd:what-next → /pd:write-code
    ```
    
    **Steps:**
    
    | Context | Command | Expected Output | Next Steps |
    |---------|---------|-----------------|------------|
    | Fresh codebase, no PD structure | `/pd:onboard [path]` | Creates `.planning/` with PROJECT.md, ROADMAP.md, STATE.md | Proceed to milestone definition |
    | PD structure ready | `/pd:new-milestone v1.0` | Creates REQUIREMENTS.md, updates ROADMAP.md | Proceed to planning |
    | Milestone defined | `/pd:plan --auto 1.1` | Creates RESEARCH.md, PLAN.md, TASKS.md, plan-check: PASS | Check with `/pd:what-next` |
    | Plan created | `/pd:what-next` | Shows next task ID and command | Execute with `/pd:write-code` |
    | Task assigned | `/pd:write-code` | Code changes, task marked COMPLETED | Repeat from `/pd:what-next` |
    
    **Decision Points:**
    - **If plan-check shows BLOCK:** Read fixHint, adjust requirements, re-run `/pd:plan`
    - **If write-code fails lint:** Fix errors and re-run same command
    - **If what-next shows no tasks:** Milestone may be complete, check `/pd:status`
  </action>
  <verify>
    <automated>grep -A 30 "### Workflow 1: Starting a New Project" /Volumes/Code/Nodejs/please-done/CLAUDE.md | grep -E "(When to use|Command Sequence|Steps|Decision Points)" | wc -l</automated>
  </verify>
  <done>
    - Workflow 1 đầy đủ với 4 sections
    - Bảng Steps có đúng 4 cột: Context, Command, Expected Output, Next Steps
    - Decision Points có ít nhất 3 items
  </done>
</task>

<task type="auto">
  <name>Task 4: Viết Workflow 2 — Fixing a Bug</name>
  <files>/Volumes/Code/Nodejs/please-done/CLAUDE.md</files>
  <action>
    Viết workflow đầy đủ theo template:
    
    ### Workflow 2: Fixing a Bug
    
    **When to use:** You encounter an error in production or development and need systematic investigation and fix.
    
    **Command Sequence:**
    ```
    /pd:fix-bug "description" → (investigation) → /pd:test → /pd:what-next
    ```
    
    **Steps:**
    
    | Context | Command | Expected Output | Next Steps |
    |---------|---------|-----------------|------------|
    | Bug encountered | `/pd:fix-bug "login fails with 500 error"` | Creates BUG_REPORT.md with reproduction steps | AI investigates automatically |
    | Investigation complete | (auto) Root cause analysis | AI identifies root cause in code | Review findings |
    | Root cause found | (auto) Fix plan created | Files to modify identified | AI applies fix |
    | Fix applied | (auto) Code changes | Modified files with fix | Verify with tests |
    | Fix complete | `/pd:test` | Test results, including regression test | If pass: done; If fail: re-run fix-bug |
    
    **Decision Points:**
    - **If bug cannot be reproduced:** Add more details to description, re-run `/pd:fix-bug`
    - **If fix causes new issues:** Re-run `/pd:fix-bug` with new symptoms
    - **If tests fail after fix:** The fix may be incomplete, re-run with updated context
  </action>
  <verify>
    <automated>grep -A 30 "### Workflow 2: Fixing a Bug" /Volumes/Code/Nodejs/please-done/CLAUDE.md | grep -E "(When to use|Command Sequence|Steps|Decision Points)" | wc -l</automated>
  </verify>
  <done>
    - Workflow 2 đầy đủ với 4 sections
    - Bảng Steps có đúng 4 cột
    - Decision Points có ít nhất 3 items
  </done>
</task>

<task type="auto">
  <name>Task 5: Viết Workflow 3 — Checking Project Progress</name>
  <files>/Volumes/Code/Nodejs/please-done/CLAUDE.md</files>
  <action>
    Viết workflow đầy đủ theo template:
    
    ### Workflow 3: Checking Project Progress
    
    **When to use:** You want to know the current project state without modifying anything — quick status check.
    
    **Command Sequence:**
    ```
    /pd:status → (optional) /pd:what-next
    ```
    
    **Steps:**
    
    | Context | Command | Expected Output | Next Steps |
    |---------|---------|-----------------|------------|
    | Need status overview | `/pd:status` | 8-field dashboard: milestone, phase, tasks, bugs, errors, blockers, last commit | None (read-only) |
    | Map may be stale | `/pd:status --auto-refresh` | Dashboard with staleness indicator (fresh/aging/stale) | Refresh if stale |
    | Want next task | `/pd:what-next` | Specific task ID and guidance | Execute recommended command |
    
    **Sample Output:**
    ```
    Milestone: v1.1 Documentation Improvements
    Phase: 102 — DOC-03 Usage Examples
    Plan: 102-PLAN.md
    Tasks: 4/5 completed (1 pending)
    Bugs: 0 unresolved
    Errors: 0 recent
    Blockers: None
    Last commit: c17fa4e docs: create milestone v11.1 roadmap
    Map: fresh
    ```
    
    **Decision Points:**
    - **If map is stale:** Run `/pd:map-codebase` to refresh
    - **If bugs > 0:** Consider `/pd:fix-bug` before continuing
    - **If blockers exist:** Address blockers first
  </action>
  <verify>
    <automated>grep -A 35 "### Workflow 3: Checking Project Progress" /Volumes/Code/Nodejs/please-done/CLAUDE.md | grep -E "(When to use|Command Sequence|Steps|Decision Points)" | wc -l</automated>
  </verify>
  <done>
    - Workflow 3 đầy đủ với 4 sections
    - Có Sample Output block
    - Bảng Steps có đúng 4 cột
  </done>
</task>

<task type="auto">
  <name>Task 6: Viết Workflow 4 — Planning a Feature</name>
  <files>/Volumes/Code/Nodejs/please-done/CLAUDE.md</files>
  <action>
    Viết workflow đầy đủ theo template:
    
    ### Workflow 4: Planning a Feature
    
    **When to use:** You have requirements for a new feature and need technical design before coding.
    
    **Command Sequence:**
    ```
    (optional) /pd:research → /pd:plan → /pd:what-next
    ```
    
    **Steps:**
    
    | Context | Command | Expected Output | Next Steps |
    |---------|---------|-----------------|------------|
    | Need technical research | `/pd:research "React Server Components"` | RESEARCH.md with options, patterns, pitfalls | Use findings in plan |
    | Research done or skip | `/pd:plan --auto 1.2` | PLAN.md, TASKS.md, plan-check report | Review plan-check |
    | Plan-check complete | Review output | PASS, WARN, or BLOCK status | If BLOCK: fix and re-plan |
    | Plan validated | `/pd:what-next` | Next task ID and guidance | `/pd:write-code` |
    
    **Decision Points:**
    - **--auto vs --discuss:** Use `--discuss` for architecture decisions requiring user input
    - **If plan-check BLOCK:** Read fixHint, adjust scope, re-run `/pd:plan`
    - **If plan-check WARN:** Proceed but note warnings may cause issues later
    
    **Plan-Check Quality Checks:**
    - CHECK-01: Requirements coverage
    - CHECK-02: Task completeness
    - CHECK-03: No circular dependencies
    - CHECK-04: Truth-task coverage
    - ADV-01: Key links handled
    - ADV-02: Scope sanity (≤6 tasks)
  </action>
  <verify>
    <automated>grep -A 35 "### Workflow 4: Planning a Feature" /Volumes/Code/Nodejs/please-done/CLAUDE.md | grep -E "(When to use|Command Sequence|Steps|Decision Points)" | wc -l</automated>
  </verify>
  <done>
    - Workflow 4 đầy đủ với 4 sections
    - Có Plan-Check Quality Checks subsection
    - Bảng Steps có đúng 4 cột
  </done>
</task>

<task type="auto">
  <name>Task 7: Viết Workflow 5 — Completing a Milestone</name>
  <files>/Volumes/Code/Nodejs/please-done/CLAUDE.md</files>
  <action>
    Viết workflow đầy đủ theo template:
    
    ### Workflow 5: Completing a Milestone
    
    **When to use:** All tasks are completed and you want to finalize the milestone properly.
    
    **Command Sequence:**
    ```
    /pd:test → /pd:complete-milestone → (optional) /pd:new-milestone
    ```
    
    **Steps:**
    
    | Context | Command | Expected Output | Next Steps |
    |---------|---------|-----------------|------------|
    | Tasks complete | `/pd:test --coverage` | Test report, coverage metrics | Verify all pass |
    | Tests passing | `/pd:complete-milestone` | ROADMAP.md updated (status: Done), CHANGELOG.md summary | Review completion |
    | Ready for next | `/pd:new-milestone v2.0` | New milestone structure created | Start next phase |
    
    **Preconditions Checked:**
    - All tasks COMPLETED in TASKS.md
    - verification-report.md exists with Pass result
    - No unresolved bugs (BUG_*.md)
    
    **Decision Points:**
    - **If tests fail:** Run `/pd:fix-bug` before completing
    - **If open bugs exist:** Must resolve first (command will fail)
    - **If verification report missing:** Run `/pd:verify` first
  </action>
  <verify>
    <automated>grep -A 30 "### Workflow 5: Completing a Milestone" /Volumes/Code/Nodejs/please-done/CLAUDE.md | grep -E "(When to use|Command Sequence|Steps|Decision Points)" | wc -l</automated>
  </verify>
  <done>
    - Workflow 5 đầy đủ với 4 sections
    - Có Preconditions Checked subsection
    - Bảng Steps có đúng 4 cột
  </done>
</task>

<task type="auto">
  <name>Task 8: Cập nhật Command Reference với Usage Patterns</name>
  <files>/Volumes/Code/Nodejs/please-done/CLAUDE.md</files>
  <action>
    Thêm section mới "## Command Usage Patterns" sau Common Workflows và trước các Command Reference chi tiết:
    
    ## Command Usage Patterns
    
    ### Frequently Used Flag Combinations
    
    | Command | Common Flags | Use Case |
    |---------|--------------|----------|
    | `/pd:plan` | `--auto` | AI decides approach (default) |
    | `/pd:plan` | `--discuss` | Interactive, user chooses approach |
    | `/pd:plan` | `--research` | Include research phase |
    | `/pd:write-code` | `--wave 2` | Execute only wave 2 tasks |
    | `/pd:write-code` | `--skip-verify` | Skip verification (faster) |
    | `/pd:status` | `--auto-refresh` | Enable staleness detection |
    | `/pd:status` | `--refresh-threshold=5` | 5-minute stale threshold |
    | `/pd:test` | `--coverage` | Generate coverage report |
    | `/pd:test` | `--watch` | Run tests in watch mode |
    | `/pd:fix-bug` | `--quick` | Skip deep analysis |
    
    ### Error Recovery Patterns
    
    | Error | Recovery Command |
    |-------|------------------|
    | Plan too large | `/pd:plan --discuss` (split scope) |
    | Plan-check BLOCK | Read fixHint, adjust, re-run `/pd:plan` |
    | Lint fails | Fix errors, re-run `/pd:write-code` |
    | Tests fail | `/pd:fix-bug "test failure"` |
    | MCP not connected | Check Docker, re-run command |
    | Stale data | `/pd:status --auto-refresh` |
    | Write-code wrong file | `/pd:what-next` to re-orient |
    
    ### Quick Reference: Command Categories
    
    | Category | Commands | Purpose |
    |----------|----------|---------|
    | Project | onboard, init, scan, new-milestone, complete-milestone | Project lifecycle |
    | Planning | plan, research, fetch-doc, update | Design and research |
    | Execution | write-code, test | Implementation |
    | Debug | fix-bug, audit | Investigation |
    | Utility | status, what-next, conventions | Status and guidance |
  </action>
  <verify>
    <automated>grep -A 50 "## Command Usage Patterns" /Volumes/Code/Nodejs/please-done/CLAUDE.md | grep -E "(Frequently Used Flag|Error Recovery|Quick Reference)" | wc -l</automated>
  </verify>
  <done>
    - Section "## Command Usage Patterns" được thêm
    - Có 3 subsections: Flag Combinations, Error Recovery, Quick Reference
    - Tất cả bảng đều đúng định dạng markdown
  </done>
</task>

<task type="auto">
  <name>Task 9: Verify formatting và cross-references</name>
  <files>/Volumes/Code/Nodejs/please-done/CLAUDE.md</files>
  <action>
    1. Kiểm tra tất cả sections được đánh số đúng thứ tự
    2. Kiểm tra tất cả bảng markdown có đúng 4 cột (Workflows) hoặc 3 cột (Patterns)
    3. Kiểm tra tất cả code blocks được đóng đúng
    4. Kiểm tra không có broken links
    5. Kiểm tra các heading levels nhất quán (##, ###)
    6. Đảm bảo section cũ không bị thay đổi (onboard, map-codebase, status, Schema Validation)
    7. Chạy markdown lint nếu có
  </action>
  <verify>
    <automated>
      test $(grep -c "## Common Workflows" /Volumes/Code/Nodejs/please-done/CLAUDE.md) -ge 1 && \
      test $(grep -c "### Workflow" /Volumes/Code/Nodejs/please-done/CLAUDE.md) -ge 5 && \
      test $(grep -c "## Command Usage Patterns" /Volumes/Code/Nodejs/please-done/CLAUDE.md) -ge 1 && \
      test $(grep -c "## Command Reference: pd:onboard" /Volumes/Code/Nodejs/please-done/CLAUDE.md) -ge 1 && \
      echo "All sections verified"
    </automated>
  </verify>
  <done>
    - Tất cả 5 workflows tồn tại và được đánh số
    - Common Workflows section tồn tại
    - Command Usage Patterns section tồn tại
    - Các command reference cũ vẫn còn nguyên vẹn
    - Không có syntax errors trong markdown
  </done>
</task>

---

## Verification

### Pre-execution Checks
- [ ] CLAUDE.md file tồn tại và có thể đọc được
- [ ] Research file 102-RESEARCH.md đã được đọc và hiểu rõ
- [ ] Backup của CLAUDE.md đã được tạo (nếu cần)

### Post-execution Checks
- [ ] Common Workflows section được thêm sau Project Language Convention
- [ ] Cả 5 workflows được viết đầy đủ theo template
- [ ] Mỗi workflow có table format với 4 cột: Context, Command, Expected Output, Next Steps
- [ ] Command Usage Patterns section được thêm với 3 subsections
- [ ] Các command reference cũ (onboard, map-codebase, status) không bị thay đổi
- [ ] Schema Validation section không bị thay đổi
- [ ] File markdown syntax hợp lệ (tất cả code blocks đóng đúng)

### Automated Verification Commands
```bash
# Kiểm tra sections tồn tại
grep -E "^## (Common Workflows|Command Usage Patterns)" /Volumes/Code/Nodejs/please-done/CLAUDE.md

# Kiểm tra 5 workflows
grep -E "^### Workflow [1-5]:" /Volumes/Code/Nodejs/please-done/CLAUDE.md

# Kiểm tra bảng 4 cột
grep -E "^\| Context \| Command \| Expected Output \| Next Steps \|" /Volumes/Code/Nodejs/please-done/CLAUDE.md

# Kiểm tra command reference cũ vẫn còn
grep -E "^### Command Reference:" /Volumes/Code/Nodejs/please-done/CLAUDE.md

# Đếm số dòng file (để verify có thêm nội dung)
wc -l /Volumes/Code/Nodejs/please-done/CLAUDE.md
```

---

## Success Criteria

| Criteria | Target | Verification |
|----------|--------|--------------|
| DOC-03-1 | Common Workflows section với 5 workflows | `grep "## Common Workflows" CLAUDE.md` |
| DOC-03-2 | Mỗi workflow có table 4 cột | `grep "| Context | Command |" CLAUDE.md` |
| DOC-03-3 | Các ví dụ được cover | Workflows 1, 2, 3 tồn tại |
| DOC-03-4 | Command reference với usage patterns | `grep "## Command Usage Patterns" CLAUDE.md` |
| No breaking changes | Các section cũ không bị thay đổi | `diff <(head -2 CLAUDE.md) <(echo -e "### Project Language Convention\n- Use English throughout...")` |

---

## Output

Sau khi hoàn thành, tạo file `.planning/phases/102/102-SUMMARY.md` với nội dung:

```markdown
# Phase 102 Summary

## Completed
- Added Common Workflows section with 5 workflows
- Updated Command Reference with usage patterns
- All DOC-03 requirements satisfied

## Artifacts Modified
- /Volumes/Code/Nodejs/please-done/CLAUDE.md

## Verification
- [x] Common Workflows section exists
- [x] 5 workflows documented with table format
- [x] Command Usage Patterns section added
- [x] No breaking changes to existing content
```

---

## Notes

- **Integration Point:** Common Workflows section được insert sau line 2 (Project Language Convention) và trước Command Reference: pd:onboard
- **Formatting:** Sử dụng markdown table format chuẩn với `|` và `---` 
- **Cross-references:** Các workflow reference đến command chi tiết trong docs/commands/
- **Language:** Tuân thủ Project Language Convention — sử dụng tiếng Anh
