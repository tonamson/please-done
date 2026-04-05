---
phase: 104
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - /Volumes/Code/Nodejs/please-done/docs/workflows/getting-started.md
  - /Volumes/Code/Nodejs/please-done/docs/workflows/bug-fixing.md
  - /Volumes/Code/Nodejs/please-done/docs/workflows/milestone-management.md
autonomous: true
requirements:
  - DOC-05
must_haves:
  truths:
    - "docs/workflows/ directory exists with 3 guide files"
    - "getting-started.md has 7 step-by-step sections with commands and expected outputs"
    - "bug-fixing.md has 6 step-by-step sections with commands and expected outputs"
    - "milestone-management.md has 6 step-by-step sections with commands and expected outputs"
    - "Each guide includes decision points in 'If... then...' format"
    - "All guides are text-based with no external media dependencies"
  artifacts:
    - path: "/Volumes/Code/Nodejs/please-done/docs/workflows/getting-started.md"
      provides: "Complete beginner workflow guide"
      min_lines: 150
      sections:
        - "Prerequisites"
        - "Overview"
        - "Step-by-Step Walkthrough"
        - "Summary"
        - "Next Steps"
    - path: "/Volumes/Code/Nodejs/please-done/docs/workflows/bug-fixing.md"
      provides: "Complete bug fixing workflow guide"
      min_lines: 120
      sections:
        - "Prerequisites"
        - "Overview"
        - "Step-by-Step Walkthrough"
        - "Summary"
        - "Next Steps"
    - path: "/Volumes/Code/Nodejs/please-done/docs/workflows/milestone-management.md"
      provides: "Complete milestone management workflow guide"
      min_lines: 140
      sections:
        - "Prerequisites"
        - "Overview"
        - "Step-by-Step Walkthrough"
        - "Summary"
        - "Next Steps"
  key_links:
    - from: "getting-started.md"
      to: "bug-fixing.md"
      via: "See Also link"
    - from: "bug-fixing.md"
      to: "milestone-management.md"
      via: "See Also link"
    - from: "All guides"
      to: "CLAUDE.md"
      via: "Command Reference links"
---

# Phase 104 Plan 01: Workflow Walkthrough Guides

## Objective

Create three comprehensive text-based workflow walkthrough guides that help users understand and execute common Please Done workflows step-by-step. Each guide provides commands, expected outputs, and decision points.

## Execution Context

@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md

## Context

@.planning/phases/104/104-CONTEXT.md
@.planning/phases/104/104-RESEARCH.md
@/Volumes/Code/Nodejs/please-done/CLAUDE.md
@/Volumes/Code/Nodejs/please-done/docs/error-troubleshooting.md

## Guide Specifications

### Guide 1: Getting Started (Beginner)
- **Target Audience:** Users new to Please Done
- **Prerequisites:** Node.js, Python, Git, Claude Code CLI installed
- **Steps:** 7 steps covering onboard → new-milestone → plan → what-next → write-code
- **Complexity:** Low - each command explained in detail

### Guide 2: Bug Fixing (Intermediate)
- **Target Audience:** Users with existing project structure
- **Prerequisites:** .planning/ directory exists, bug description ready
- **Steps:** 6 steps covering fix-bug → investigation → test → verification
- **Complexity:** Medium - includes error handling and retry logic

### Guide 3: Milestone Management (Advanced)
- **Target Audience:** Users planning and completing milestones
- **Prerequisites:** Understanding of phases, tasks, and milestones
- **Steps:** 6 steps covering new-milestone → plan → execute → test → complete-milestone
- **Complexity:** High - includes decision points and branching

## Step Template

Each step in all guides follows this format:

```markdown
### Step N: [Descriptive Title]

**Command:**
```
Exact command to run
```

**Expected Output:**
```
Sample output text
```

**What this does:**
Brief explanation of the command's purpose and effect.

**Decision Points:**
- If [condition A], then [action X]
- If [condition B], then [action Y]
```

## Tasks

<task type="auto">
  <name>Task 1: Create docs/workflows/ directory structure</name>
  <files>/Volumes/Code/Nodejs/please-done/docs/workflows/</files>
  <action>
    Create the docs/workflows/ directory to hold all workflow guides:
    
    ```bash
    mkdir -p docs/workflows
    ```
    
    This directory will contain:
    - getting-started.md
    - bug-fixing.md
    - milestone-management.md
    
    Add a README.md in the workflows directory:
    ```markdown
    # Workflow Guides
    
    Step-by-step walkthrough guides for common Please Done workflows.
    
    ## Available Guides
    
    1. [Getting Started](getting-started.md) — Your first PD project (Beginner)
    2. [Bug Fixing](bug-fixing.md) — Debug and fix issues (Intermediate)
    3. [Milestone Management](milestone-management.md) — Plan and complete milestones (Advanced)
    
    ## Quick Reference
    
    - New to PD? Start with [Getting Started](getting-started.md)
    - Encountered a bug? See [Bug Fixing](bug-fixing.md)
    - Ready to ship? Follow [Milestone Management](milestone-management.md)
    ```
  </action>
  <verify>
    <automated>test -d docs/workflows &amp;&amp; test -f docs/workflows/README.md &amp;&amp; echo "Directory and README created"</automated>
  </verify>
  <done>docs/workflows/ directory exists with README.md</done>
</task>

<task type="auto">
  <name>Task 2: Write getting-started.md (7 steps)</name>
  <files>/Volumes/Code/Nodejs/please-done/docs/workflows/getting-started.md</files>
  <action>
    Create getting-started.md following this structure:
    
    # Getting Started Workflow Guide
    
    ## Prerequisites
    - [ ] Node.js 16+ installed
    - [ ] Python 3.12+ installed
    - [ ] Git installed
    - [ ] Claude Code CLI installed
    - [ ] A code project (or create a new one)
    
    ## Overview
    This guide walks you through setting up Please Done on a new project, from initial onboarding to completing your first task.
    
    ## Step-by-Step Walkthrough
    
    ### Step 1: Onboard Your Project
    
    **Command:**
    ```
    /pd:onboard
    ```
    
    **Expected Output:**
    ```
    Analyzing codebase structure...
    Detected tech stack: Node.js, React
    Created .planning/PROJECT.md
    Created .planning/ROADMAP.md
    Created .planning/STATE.md
    Created .planning/CONTEXT.md
    Onboarding complete! Run /pd:new-milestone next.
    ```
    
    **What this does:**
    Analyzes your codebase structure, detects tech stack, and creates the initial planning directory with project context.
    
    **Decision Points:**
    - If you see "MCP not connected", check that FastCode MCP is running
    - If `.planning/` already exists, you may be in the wrong directory
    
    ### Step 2: Create Your First Milestone
    
    **Command:**
    ```
    /pd:new-milestone v1.0
    ```
    
    **Expected Output:**
    ```
    Created REQUIREMENTS.md with initial structure
    Updated ROADMAP.md with v1.0 milestone
    Current milestone set to: v1.0
    Next: Run /pd:plan to start Phase 1
    ```
    
    **What this does:**
    Defines your first milestone and creates the requirements document structure.
    
    **Decision Points:**
    - If milestone already exists, use a different version like v1.1
    - If ROADMAP.md is missing, run /pd:onboard first
    
    ### Step 3: Plan Your First Phase
    
    **Command:**
    ```
    /pd:plan --auto
    ```
    
    **Expected Output:**
    ```
    Phase 1.1 selected: Setup Foundation
    Creating RESEARCH.md...
    Creating PLAN.md...
    Creating TASKS.md...
    Plan-check: PASS
    Run /pd:what-next to see your first task
    ```
    
    **What this does:**
    Creates a detailed plan for Phase 1.1 with research, plan, and tasks documents.
    
    **Decision Points:**
    - If plan-check shows BLOCK, read the fixHint and adjust requirements
    - If you want to discuss options, use /pd:plan --discuss instead
    
    ### Step 4: Check What's Next
    
    **Command:**
    ```
    /pd:what-next
    ```
    
    **Expected Output:**
    ```
    Milestone: v1.0
    Phase: 1.1 — Setup Foundation
    Task: 1.1.1 — Create project structure
    Status: Ready to execute
    
    Recommended command: /pd:write-code
    ```
    
    **What this does:**
    Shows your current progress and recommends the next command to run.
    
    **Decision Points:**
    - If status shows "Plan incomplete", run /pd:plan first
    - If no tasks available, milestone may be complete
    
    ### Step 5: Execute Tasks
    
    **Command:**
    ```
    /pd:write-code
    ```
    
    **Expected Output:**
    ```
    Loading PLAN.md...
    Executing Task 1.1.1: Create project structure
    Files created: 3
    Tests passing: 5/5
    Committed: a1b2c3d — feat(1.1.1): create project structure
    Task 1.1.1: COMPLETED
    ```
    
    **What this does:**
    Executes the current task from TASKS.md, runs tests, and commits changes.
    
    **Decision Points:**
    - If lint fails, fix errors and re-run /pd:write-code
    - If tests fail, run /pd:fix-bug "test failure description"
    
    ### Step 6: Continue to Next Task
    
    **Command:**
    ```
    /pd:what-next
    ```
    
    **Expected Output:**
    ```
    Task 1.1.1: COMPLETED
    Task 1.1.2: Create configuration — Ready
    Run /pd:write-code to continue
    ```
    
    **What this does:**
    Checks for the next available task in the current phase.
    
    **Decision Points:**
    - If all tasks complete, you'll see "Phase complete" message
    - If stuck, run /pd:status for full project view
    
    ### Step 7: Check Project Status
    
    **Command:**
    ```
    /pd:status
    ```
    
    **Expected Output:**
    ```
    Milestone: v1.0
    Phase: 1.1 — Setup Foundation
    Tasks: 2/3 completed (1 pending)
    Bugs: 0 unresolved
    Errors: 0 recent
    Blockers: None
    Map: fresh
    ```
    
    **What this does:**
    Displays a dashboard view of your project's current state.
    
    **Decision Points:**
    - If Map shows "stale", run /pd:status --auto-refresh
    - If Blockers exist, resolve them before continuing
    
    ## Summary
    
    Congratulations! You've:
    - Set up Please Done on your project
    - Created your first milestone and phase
    - Completed your first tasks
    - Learned to check status and progress
    
    ## Next Steps
    
    - Continue executing remaining tasks with `/pd:what-next` and `/pd:write-code`
    - When phase is complete, plan the next phase with `/pd:plan`
    - Encounter a bug? See [Bug Fixing Guide](bug-fixing.md)
    - Ready to complete milestone? See [Milestone Management](milestone-management.md)
    
    ## See Also
    
    - [Bug Fixing Guide](bug-fixing.md)
    - [Milestone Management Guide](milestone-management.md)
    - [Error Troubleshooting](/docs/error-troubleshooting.md)
    - [Command Cheat Sheet](/docs/cheatsheet.md)
    ```
  </action>
  <verify>
    <automated>test -f docs/workflows/getting-started.md &amp;&amp; grep -c "### Step" docs/workflows/getting-started.md | grep -q "7" &amp;&amp; echo "Getting started guide complete"</automated>
  </verify>
  <done>getting-started.md exists with 7 complete steps</done>
</task>

<task type="auto">
  <name>Task 3: Write bug-fixing.md (6 steps)</name>
  <files>/Volumes/Code/Nodejs/please-done/docs/workflows/bug-fixing.md</files>
  <action>
    Create bug-fixing.md following this structure:
    
    # Bug Fixing Workflow Guide
    
    ## Prerequisites
    - [ ] Project has .planning/ directory initialized
    - [ ] You can reproduce the bug
    - [ ] Bug description ready (error message, expected vs actual behavior)
    
    ## Overview
    This guide walks you through the systematic bug fixing process using /pd:fix-bug, from symptom collection to verified fix.
    
    ## Step-by-Step Walkthrough
    
    ### Step 1: Initiate Bug Fix
    
    **Command:**
    ```
    /pd:fix-bug "Login fails with 500 error when using OAuth"
    ```
    
    **Expected Output:**
    ```
    Creating BUG_REPORT.md...
    Collecting symptoms...
    Evidence collected: error logs, recent commits, affected files
    Invoking Bug Janitor for analysis...
    ```
    
    **What this does:**
    Creates a bug report and starts the automated investigation process.
    
    **Decision Points:**
    - If "Insufficient information" error, add more details to description
    - If "MCP not connected" error, check Docker services
    
    ### Step 2: Review Investigation Results
    
    **Command:**
    ```
    (wait for analysis - no command needed)
    ```
    
    **Expected Output:**
    ```
    Root Cause Analysis:
    - File: src/auth/oauth.js:45
    - Issue: Missing null check for user.profile
    - Affected: login flow for new users
    
    Fix Plan:
    1. Add null check before accessing profile
    2. Add regression test
    ```
    
    **What this does:**
    The Bug Janitor and Code Detective analyze the code to identify root cause.
    
    **Decision Points:**
    - If root cause unclear, provide more context and re-run /pd:fix-bug
    - If wrong file identified, add file path hints to bug description
    
    ### Step 3: Apply the Fix
    
    **Command:**
    ```
    (AI automatically applies fix)
    ```
    
    **Expected Output:**
    ```
    Applying fix...
    Modified: src/auth/oauth.js
    + if (!user.profile) return null;
    Committed: fix(auth): add null check for OAuth profile
    ```
    
    **What this does:**
    AI applies the identified fix and creates a commit with the changes.
    
    **Decision Points:**
    - If fix seems incorrect, review the changes before continuing
    - If multiple files affected, ensure all changes make sense
    
    ### Step 4: Verify with Tests
    
    **Command:**
    ```
    /pd:test
    ```
    
    **Expected Output:**
    ```
    Running test suite...
    Tests: 47 passed, 0 failed
    New regression test: PASS
    Coverage: +2% (OAuth handling)
    ```
    
    **What this does:**
    Runs the test suite to verify the fix doesn't break existing functionality.
    
    **Decision Points:**
    - If tests fail, the fix may be incomplete — re-run /pd:fix-bug
    - If new test needed, add test case and re-run
    
    ### Step 5: Check Bug Resolution
    
    **Command:**
    ```
    /pd:what-next
    ```
    
    **Expected Output:**
    ```
    Bug Report: OAuth login fix
    Status: RESOLVED
    Tests: PASSING
    
    Next: Continue with regular development
    ```
    
    **What this does:**
    Confirms the bug has been resolved and shows next development steps.
    
    **Decision Points:**
    - If bug still reproducible, re-run /pd:fix-bug with updated description
    - If related issues found, create new bug reports
    
    ### Step 6: Review and Close
    
    **Command:**
    ```
    /pd:status
    ```
    
    **Expected Output:**
    ```
    Milestone: v1.0
    Phase: 1.2
    Tasks: On track
    Bugs: 0 unresolved (1 recently resolved)
    Recent: OAuth login fix committed
    ```
    
    **What this does:**
    Shows project status with the bug now resolved.
    
    **Decision Points:**
    - If more bugs exist, prioritize by severity
    - If phase blocked by bugs, resolve all before continuing
    
    ## Summary
    
    You've successfully:
    - Reported and investigated a bug
    - Applied a targeted fix
    - Verified with tests
    - Confirmed resolution
    
    ## Next Steps
    
    - Return to regular development with `/pd:what-next`
    - Document the fix in your CHANGELOG
    - Consider adding the pattern to your project's CLAUDE.md
    
    ## See Also
    
    - [Getting Started Guide](getting-started.md)
    - [Milestone Management Guide](milestone-management.md)
    - [Error Troubleshooting](/docs/error-troubleshooting.md)
    - [Error Recovery](/docs/error-recovery.md)
    ```
  </action>
  <verify>
    <automated>test -f docs/workflows/bug-fixing.md &amp;&amp; grep -c "### Step" docs/workflows/bug-fixing.md | grep -q "6" &amp;&amp; echo "Bug fixing guide complete"</automated>
  </verify>
  <done>bug-fixing.md exists with 6 complete steps</done>
</task>

<task type="auto">
  <name>Task 4: Write milestone-management.md (6 steps)</name>
  <files>/Volumes/Code/Nodejs/please-done/docs/workflows/milestone-management.md</files>
  <action>
    Create milestone-management.md following this structure:
    
    # Milestone Management Workflow Guide
    
    ## Prerequisites
    - [ ] Understanding of phases, tasks, and milestones
    - [ ] Project initialized with /pd:onboard
    - [ ] Previous milestone completed (if any)
    
    ## Overview
    This guide covers the complete milestone lifecycle: planning phases, executing tasks, and completing milestones.
    
    ## Step-by-Step Walkthrough
    
    ### Step 1: Plan New Milestone
    
    **Command:**
    ```
    /pd:new-milestone v2.0
    ```
    
    **Expected Output:**
    ```
    Created REQUIREMENTS.md with structure
    Updated ROADMAP.md with v2.0 milestone
    Phases defined: 5 phases estimated
    Dependencies mapped
    Current milestone: v2.0
    ```
    
    **What this does:**
    Defines requirements and roadmap for the new milestone.
    
    **Decision Points:**
    - If version exists, use v2.1 or specify full version
    - If requirements unclear, review with stakeholders first
    
    ### Step 2: Plan First Phase
    
    **Command:**
    ```
    /pd:plan --auto 2.1
    ```
    
    **Expected Output:**
    ```
    Phase 2.1: Core Features
    Creating RESEARCH.md...
    Creating PLAN.md (8 tasks)...
    Creating TASKS.md...
    Plan-check: PASS
    Ready to execute with /pd:what-next
    ```
    
    **What this does:**
    Creates detailed plan for Phase 2.1 of milestone v2.0.
    
    **Decision Points:**
    - If plan-check BLOCK, read fixHint and adjust scope
    - If plan-check WARN, proceed but note potential issues
    
    ### Step 3: Execute Phase Tasks
    
    **Command:**
    ```
    /pd:what-next
    ```
    
    **Expected Output:**
    ```
    Phase 2.1: Core Features
    Task 2.1.1: Setup database schema — Ready
    Recommended: /pd:write-code
    ```
    
    **Command:**
    ```
    /pd:write-code
    ```
    
    **Expected Output:**
    ```
    Executing Task 2.1.1...
    Files modified: 4
    Tests: PASS
    Committed: a1b2c3d
    Task 2.1.1: COMPLETED
    ```
    
    **What this does:**
    Iterates through all tasks in the phase, executing each one.
    
    **Decision Points:**
    - If task blocked, check /pd:status for blockers
    - If lint fails repeatedly, use /pd:fix-bug
    - Continue loop: /pd:what-next → /pd:write-code until phase complete
    
    ### Step 4: Verify Phase Completion
    
    **Command:**
    ```
    /pd:status
    ```
    
    **Expected Output:**
    ```
    Milestone: v2.0
    Phase: 2.1 — Core Features
    Tasks: 8/8 completed
    Status: Phase complete
    Next: Plan Phase 2.2 or complete milestone
    ```
    
    **What this does:**
    Confirms all tasks in the phase are completed.
    
    **Decision Points:**
    - If more phases in milestone, run /pd:plan for next phase
    - If this is final phase, proceed to complete milestone
    
    ### Step 5: Final Testing
    
    **Command:**
    ```
    /pd:test --coverage
    ```
    
    **Expected Output:**
    ```
    Running full test suite...
    Tests: 156 passed, 0 failed
    Coverage: 87%
    No regressions detected
    ```
    
    **What this does:**
    Ensures all tests pass before completing the milestone.
    
    **Decision Points:**
    - If tests fail, fix with /pd:fix-bug before completing
    - If coverage low, add tests before completing
    
    ### Step 6: Complete Milestone
    
    **Command:**
    ```
    /pd:complete-milestone
    ```
    
    **Expected Output:**
    ```
    Checking prerequisites...
    All tasks: COMPLETED
    Tests: PASSING
    Bugs: 0 unresolved
    Verification: Complete
    
    Archiving milestone v2.0...
    Created CHANGELOG.md summary
    ROADMAP.md updated
    
    Milestone v2.0: COMPLETED
    
    Next: Start v2.1 with /pd:new-milestone
    ```
    
    **What this does:**
    Finalizes the milestone, archives it, and prepares for the next.
    
    **Decision Points:**
    - If unfinished tasks exist, complete them first
    - If open bugs exist, resolve with /pd:fix-bug first
    - If verification incomplete, run /pd:verify-work
    
    ## Summary
    
    You've successfully:
    - Planned and structured a milestone
    - Executed all phase tasks
    - Verified with comprehensive testing
    - Completed and archived the milestone
    
    ## Next Steps
    
    - Review the CHANGELOG.md summary
    - Start next milestone with /pd:new-milestone
    - Share learnings with your team
    
    ## See Also
    
    - [Getting Started Guide](getting-started.md)
    - [Bug Fixing Guide](bug-fixing.md)
    - [Error Troubleshooting](/docs/error-troubleshooting.md)
    - [Command Cheat Sheet](/docs/cheatsheet.md)
    ```
  </action>
  <verify>
    <automated>test -f docs/workflows/milestone-management.md &amp;&amp; grep -c "### Step" docs/workflows/milestone-management.md | grep -q "6" &amp;&amp; echo "Milestone management guide complete"</automated>
  </verify>
  <done>milestone-management.md exists with 6 complete steps</done>
</task>

<task type="auto">
  <name>Task 5: Add cross-references and index</name>
  <files>/Volumes/Code/Nodejs/please-done/docs/workflows/</files>
  <action>
    Update the README.md to include a proper index with difficulty levels:
    
    ```markdown
    # Workflow Guides
    
    Step-by-step walkthrough guides for common Please Done workflows.
    
    Choose your starting point based on your experience level:
    
    ## 🟢 Beginner
    **[Getting Started](getting-started.md)**
    - Your first PD project from scratch
    - 7 steps: onboard → new-milestone → plan → execute
    - No prior PD experience required
    
    ## 🟡 Intermediate
    **[Bug Fixing](bug-fixing.md)**
    - Debug and fix production issues
    - 6 steps: identify → fix → test → verify
    - Requires existing project structure
    
    ## 🔴 Advanced
    **[Milestone Management](milestone-management.md)**
    - Plan and complete full milestones
    - 6 steps: plan → execute → test → complete
    - Understanding of phases and tasks recommended
    
    ---
    
    ## Quick Decision Guide
    
    | Situation | Recommended Guide |
    |-----------|------------------|
    | New to PD? | [Getting Started](getting-started.md) |
    | Something broken? | [Bug Fixing](bug-fixing.md) |
    | Ready to ship? | [Milestone Management](milestone-management.md) |
    | Not sure? | Run `/pd:status` first |
    
    ## Additional Resources
    
    - [Error Troubleshooting](/docs/error-troubleshooting.md) — Fix common errors
    - [Command Cheat Sheet](/docs/cheatsheet.md) — Quick command reference
    - [Error Recovery](/docs/error-recovery.md) — Recovery procedures
    - [CLAUDE.md](/CLAUDE.md) — Full command documentation
    ```
    
    Also add a link from docs/README.md or main README.md to these guides if they exist.
  </action>
  <verify>
    <automated>grep -q "Beginner" docs/workflows/README.md &amp;&amp; grep -q "Intermediate" docs/workflows/README.md &amp;&amp; grep -q "Advanced" docs/workflows/README.md &amp;&amp; echo "README updated with difficulty levels"</automated>
  </verify>
  <done>README.md has clear difficulty levels and quick decision guide</done>
</task>

<task type="auto">
  <name>Task 6: Verify all guides complete</name>
  <files>/Volumes/Code/Nodejs/please-done/docs/workflows/</files>
  <action>
    Verify all three guides meet the requirements:
    
    1. Check getting-started.md:
       - Has Prerequisites section
       - Has 7 steps with ### Step N: format
       - Each step has Command, Expected Output, Decision Points
       - Has Summary and Next Steps
    
    2. Check bug-fixing.md:
       - Has Prerequisites section
       - Has 6 steps with ### Step N: format
       - Each step has Decision Points
       - Links to error-troubleshooting.md
    
    3. Check milestone-management.md:
       - Has Prerequisites section
       - Has 6 steps with ### Step N: format
       - Has decision points for phase/milestone completion
       - Links to other guides
    
    4. Verify formatting:
       - All code blocks properly fenced
       - All tables have headers
       - All links work
       - Consistent heading levels
    
    5. Count verification:
       - getting-started.md: 7 steps minimum
       - bug-fixing.md: 6 steps minimum
       - milestone-management.md: 6 steps minimum
  </action>
  <verify>
    <automated>
      test $(grep -c "### Step" docs/workflows/getting-started.md) -ge 7 &amp;&amp; \
      test $(grep -c "### Step" docs/workflows/bug-fixing.md) -ge 6 &amp;&amp; \
      test $(grep -c "### Step" docs/workflows/milestone-management.md) -ge 6 &amp;&amp; \
      grep -q "Decision Points" docs/workflows/getting-started.md &amp;&amp; \
      grep -q "Decision Points" docs/workflows/bug-fixing.md &amp;&amp; \
      grep -q "Decision Points" docs/workflows/milestone-management.md &amp;&amp; \
      echo "All guides verified complete"
    </automated>
  </verify>
  <done>All 3 guides verified with proper structure, steps, and decision points</done>
</task>

## Verification

1. docs/workflows/ directory exists with README.md
2. getting-started.md has 7 complete steps
3. bug-fixing.md has 6 complete steps
4. milestone-management.md has 6 complete steps
5. Each guide includes:
   - Prerequisites checklist
   - Overview section
   - Numbered steps with commands and expected outputs
   - Decision Points in "If... then..." format
   - Summary and Next Steps
6. README.md has difficulty levels and quick decision guide
7. All cross-references work

## Success Criteria

- File docs/workflows/getting-started.md exists with complete beginner workflow
- File docs/workflows/bug-fixing.md exists with complete debug workflow
- File docs/workflows/milestone-management.md exists with complete milestone workflow
- Each guide has step-by-step format with commands, expected outputs, decision points
- All guides are text-based with no external dependencies
- Cross-references between guides work correctly

## Output

After completion, create `.planning/phases/104/104-01-SUMMARY.md`
