# Error Troubleshooting Guide

A comprehensive guide to diagnosing and fixing common errors encountered when using Please Done (PD) skills. This guide provides quick reference tables and detailed error entries to help you resolve issues quickly.

## Table of Contents

- [How to Use This Guide](#how-to-use-this-guide)
- [Quick Reference Table](#quick-reference-table)
  - [Setup Errors](#setup-errors-1)
  - [Planning Errors](#planning-errors-1)
  - [Execution Errors](#execution-errors-1)
  - [Debug Errors](#debug-errors-1)
- [Detailed Error Guide](#detailed-error-guide)
  - [Setup Errors](#setup-errors)
  - [Planning Errors](#planning-errors)
  - [Execution Errors](#execution-errors)
  - [Debug Errors](#debug-errors)
- [Related Documentation](#related-documentation)

---

## How to Use This Guide

1. **Quick Scan**: Look up your error in the [Quick Reference Table](#quick-reference-table) to find the cause and solution at a glance
2. **Detailed Guide**: Click on any error code (e.g., ERR-001) to see the full troubleshooting steps
3. **Follow Steps**: Execute the numbered "Suggested Actions" in order
4. **Still Stuck?**: Check the "See Also" links for additional resources

---

## Quick Reference Table

### Setup Errors

| Error | Cause | Solution |
|-------|-------|----------|
| FastCode MCP is not connected | Docker service not running or MCP misconfigured | 1. Check `docker ps`<br>2. Restart MCP container<br>3. Verify `claude_desktop_config.json` |
| Context7 MCP is not connected | MCP service unavailable or network issue | 1. Check network connectivity<br>2. Restart Context7 service<br>3. Use Grep/Read fallback |
| Missing prerequisites (Node/Python/Git) | Required tool not installed or not in PATH | 1. Install missing tool<br>2. Verify with `which [tool]`<br>3. Check PATH configuration |
| `.planning/` directory does not exist | Project not initialized | 1. Run `/pd:init`<br>2. Or run `/pd:onboard`<br>3. Retry command |

### Planning Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Missing `CONTEXT.md` | Project not initialized or file deleted | 1. Run `/pd:init`<br>2. Check project root<br>3. Retry command |
| Missing `ROADMAP.md` | No milestone created yet | 1. Run `/pd:new-milestone [name]`<br>2. Example: `/pd:new-milestone "v1.1"`<br>3. Retry `/pd:plan` |
| Phase does not exist in ROADMAP | Invalid phase number provided | 1. Check `.planning/ROADMAP.md`<br>2. Use valid phase number<br>3. Or run `/pd:plan` without phase |
| Circular dependencies detected | Phases have circular dependency references | 1. Review ROADMAP.md dependencies<br>2. Remove circular references<br>3. Reorder phases if needed |

### Execution Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Lint or build fails | Code violates lint rules or has syntax errors | 1. Read error output<br>2. Fix ESLint/TypeScript errors<br>3. Run `npm run lint && npm run build` |
| Tests fail | Implementation does not match expectations | 1. Read test failure details<br>2. Identify affected files<br>3. Fix implementation<br>4. Re-run tests |
| MCP is not connected (during execution) | FastCode/Context7 MCP unavailable | 1. Check Docker services<br>2. Skills auto-use fallback<br>3. Continue or retry after fixing |
| Test framework not found | Test runner not installed or configured | 1. Check `package.json` scripts<br>2. Install test framework<br>3. Run `/pd:test --standalone` |

### Debug Errors

| Error | Cause | Solution |
|-------|-------|----------|
| The bug cannot be reproduced | Insufficient information provided | 1. Add error messages and steps<br>2. Include expected vs actual<br>3. Check logs and retry |
| Unfinished tasks remain | Tasks not marked complete in milestone | 1. Run `/pd:status`<br>2. Complete remaining tasks<br>3. Retry `/pd:complete-milestone` |
| Open bugs remain | Bugs exist in `.planning/bugs/` | 1. List bugs: `ls .planning/bugs/`<br>2. Run `/pd:fix-bug` for each<br>3. Retry completion |

---

## Detailed Error Guide

## Setup Errors

### ERR-001: FastCode MCP is not connected

**Error:** "FastCode MCP is not connected"

**Skills Affected:** `pd:init`, `pd:plan`, `pd:write-code`, `pd:scan`, `pd:onboard`

**Cause:**
FastCode MCP server requires Docker to run. This error occurs when:
- Docker daemon is not running
- MCP container is stopped or has crashed
- Configuration in `claude_desktop_config.json` is incorrect
- Network connectivity issues between Claude and MCP server

**Suggested Actions:**
1. Check Docker status: `docker ps`
2. If Docker is not running, start Docker Desktop
3. Check if MCP container is running: `docker ps | grep fastcode`
4. If container is stopped, restart it: `docker start <container_id>`
5. Verify your Claude Desktop configuration:
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
6. Restart Claude Desktop to reload MCP configuration
7. Retry the skill command

**See Also:**
- [Setup Guide](setup.md#mcp-configuration)
- [Error Recovery Guide](error-recovery.md#mcp-connection-errors)

---

### ERR-002: Context7 MCP is not connected

**Error:** "Context7 MCP is not connected"

**Skills Affected:** `pd:plan`, `pd:write-code`, `pd:fix-bug`, `pd:research`

**Cause:**
Context7 MCP server is unavailable. This error occurs when:
- Context7 service is not running
- Network connectivity issues
- Configuration error in MCP settings
- Service temporarily down

**Suggested Actions:**
1. Check network connectivity to Context7 service
2. Verify Context7 MCP configuration in `claude_desktop_config.json`
3. Restart the Context7 MCP service if needed
4. Skills will automatically fall back to Grep/Read tools if Context7 is unavailable
5. If the fallback is working, you can continue execution
6. For persistent issues, check Context7 documentation or contact support
7. Retry the skill command after fixing connectivity

**See Also:**
- [Setup Guide](setup.md#mcp-configuration)
- [Research Command Reference](commands/pd/research.md)

---

### ERR-003: Missing prerequisites (Node/Python/Git)

**Error:** "Missing prerequisite: [tool]" or "[tool] is not installed"

**Skills Affected:** `pd:init`, `pd:scan`, `pd:onboard`, `pd:test`

**Cause:**
A required development tool is not installed or not available in the system PATH:
- Node.js is required for JavaScript/TypeScript projects
- Python is required for Python projects
- Git is required for version control operations

**Suggested Actions:**
1. Check if the tool is installed: `which node` / `which python` / `which git`
2. If not installed, install the required tool:
   - **Node.js**: Download from [nodejs.org](https://nodejs.org) or use `nvm`
   - **Python**: Download from [python.org](https://python.org) or use `pyenv`
   - **Git**: Download from [git-scm.com](https://git-scm.com)
3. Verify the installation: `node --version` / `python --version` / `git --version`
4. Ensure the tool is in your system PATH
5. Restart your terminal to refresh PATH
6. Retry the skill command

**See Also:**
- [Setup Guide](setup.md#prerequisites)
- [Project Initialization](commands/pd/init.md)

---

### ERR-004: .planning/ directory does not exist

**Error:** ".planning/ directory does not exist" or "The project has not been initialized yet"

**Skills Affected:** `pd:status`, `pd:what-next`, `pd:plan`, `pd:new-milestone`

**Cause:**
The project has not been initialized with `/pd:init`. The `.planning/` directory contains:
- Project configuration files
- ROADMAP.md and STATE.md
- Phase plans and summaries
- Bug tracking information

**Suggested Actions:**
1. Run `/pd:init` to initialize the project structure
2. Alternatively, run `/pd:onboard` for automated setup with additional analysis
3. Verify the `.planning/` directory was created: `ls -la .planning/`
4. Check that key files exist: `ls .planning/CONTEXT.md`
5. Retry your original command

**See Also:**
- [Init Command Reference](commands/pd/init.md)
- [Onboard Command Reference](commands/pd/onboard.md)

---

## Planning Errors

### ERR-005: Missing CONTEXT.md

**Error:** "CONTEXT.md is missing" or "Run `/pd:init` first"

**Skills Affected:** `pd:new-milestone`, `pd:plan`, `pd:complete-milestone`

**Cause:**
The project initialization file is missing. This occurs when:
- Project has not been initialized
- CONTEXT.md was accidentally deleted
- Running commands from wrong directory

**Suggested Actions:**
1. Run `/pd:init` to create CONTEXT.md with project settings
2. Check if you're in the correct project root directory
3. If CONTEXT.md exists elsewhere, move it to the project root
4. Verify the file was created: `cat .planning/CONTEXT.md`
5. Retry the skill command

**See Also:**
- [Initialization Guide](setup.md#initialization)
- [Context Documentation](.planning/CONTEXT.md)

---

### ERR-006: Missing ROADMAP.md

**Error:** "ROADMAP.md is missing" or "Run `/pd:new-milestone` first"

**Skills Affected:** `pd:plan`

**Cause:**
No milestone has been created yet. ROADMAP.md contains:
- Phase definitions and descriptions
- Task breakdowns
- Dependencies between phases
- Progress tracking

**Suggested Actions:**
1. Run `/pd:new-milestone [milestone-name]` to create a milestone
2. Example: `/pd:new-milestone "v1.1 Notifications Feature"`
3. Verify ROADMAP.md was created: `cat .planning/ROADMAP.md`
4. Review the generated roadmap structure
5. Retry `/pd:plan` to create plans for phases

**See Also:**
- [Milestone Guide](setup.md#milestones)
- [New Milestone Command](commands/pd/new-milestone.md)

---

### ERR-007: Phase does not exist in ROADMAP

**Error:** "Phase does not exist in ROADMAP" or "Invalid phase number"

**Skills Affected:** `pd:plan`, `pd:write-code`

**Cause:**
The specified phase number is not defined in the roadmap. This happens when:
- Typo in phase number
- Referencing a phase that hasn't been defined yet
- Using wrong format (e.g., "1" instead of "1.1")

**Suggested Actions:**
1. Open `.planning/ROADMAP.md` to view available phases
2. Check the correct phase number format (e.g., "1.2", "2.1")
3. Use a valid phase number from the roadmap
4. Alternatively, run `/pd:plan` without a phase number to automatically select the next phase
5. If the phase should exist, check ROADMAP.md for typos

**See Also:**
- [Planning Guide](setup.md#planning)
- [Plan Command Reference](commands/pd/plan.md)

---

### ERR-008: Circular dependencies detected

**Error:** "Circular dependencies detected" or "Cannot resolve phase dependencies"

**Skills Affected:** `pd:plan`, `pd:new-milestone`

**Cause:**
Phases have circular dependency references where:
- Phase A depends on Phase B
- Phase B depends on Phase A
- Or a longer chain that loops back

**Suggested Actions:**
1. Open `.planning/ROADMAP.md` to review phase dependencies
2. Identify the circular reference in the dependency chain
3. Remove or break the circular dependency
4. Reorder phases if needed to create a linear dependency flow
5. Save ROADMAP.md and retry the command

**See Also:**
- [Roadmap Structure](setup.md#roadmap-structure)
- [Dependency Management](.planning/phases/README.md)

---

## Execution Errors

### ERR-009: Lint or build fails

**Error:** "Lint or build fails" or specific lint error messages

**Skills Affected:** `pd:write-code`, `pd:test`

**Cause:**
Code violates linting rules or has build errors:
- ESLint errors (syntax, style violations)
- TypeScript type errors
- Import/export issues
- Missing dependencies

**Suggested Actions:**
1. Read the full error output to identify specific issues
2. Fix ESLint errors:
   - Add missing semicolons
   - Remove unused variables
   - Fix indentation and spacing
3. Fix TypeScript errors:
   - Resolve type mismatches
   - Add proper type annotations
   - Fix interface definitions
4. Run lint check: `npm run lint`
5. Run build: `npm run build`
6. If errors persist, use `/pd:write-code --resume` to retry from the failed step

**See Also:**
- [Code Standards](../CLAUDE.md)
- [Error Recovery Guide](error-recovery.md#code-issues)

---

### ERR-010: Tests fail

**Error:** "Tests fail" or "X tests failed: [test names]"

**Skills Affected:** `pd:test`, `pd:write-code`

**Cause:**
Implementation does not match test expectations:
- Logic errors in implementation
- Regression in existing functionality
- Test expectations not met
- Environment differences

**Suggested Actions:**
1. Read the test failure output to understand expected vs actual behavior
2. Identify the affected files from the error context
3. Review the implementation code
4. Fix the implementation to match expected behavior
5. Run tests again: `npm test` or `/pd:test --all`
6. If infrastructure error occurs, run `/pd:test --standalone` to set up test framework
7. Verify all tests pass before continuing

**See Also:**
- [Testing Guide](testing.md)
- [Test Command Reference](commands/pd/test.md)

---

### ERR-011: MCP is not connected (during execution)

**Error:** "MCP is not connected" (during test or write-code)

**Skills Affected:** `pd:test`, `pd:write-code`

**Cause:**
FastCode or Context7 MCP becomes unavailable during execution:
- Docker service stopped
- MCP container crashed
- Network interruption

**Suggested Actions:**
1. Check Docker status: `docker ps`
2. Skills will automatically use fallback tools (Grep/Read) if MCP is unavailable
3. A warning will display: "⚠️ FastCode unavailable — using Grep/Read fallback"
4. You can continue with execution using fallback tools
5. Alternatively, fix MCP connectivity and retry
6. Results may be slightly slower but will still work

**See Also:**
- [MCP Setup](setup.md#mcp)
- [Fallback Documentation](error-recovery.md#fallback-mode)

---

### ERR-012: Test framework not found

**Error:** "Test framework not found" or "Cannot run tests"

**Skills Affected:** `pd:test`

**Cause:**
Test runner is not installed or not configured:
- Missing test framework (Jest, Mocha, etc.)
- Missing configuration file
- Dependencies not installed

**Suggested Actions:**
1. Check `package.json` for test scripts in the "scripts" section
2. Install test dependencies:
   - `npm install --save-dev jest` (or your preferred framework)
3. Verify test configuration file exists (e.g., `jest.config.js`)
4. Run `/pd:test --standalone` to auto-setup test infrastructure
5. Verify installation: `npx jest --version`
6. Retry running tests

**See Also:**
- [Testing Setup](setup.md#testing)
- [Test Framework Guide](testing.md#framework-setup)

---

## Debug Errors

### ERR-013: The bug cannot be reproduced

**Error:** "The bug cannot be reproduced"

**Skills Affected:** `pd:fix-bug`

**Cause:**
Insufficient information provided to reproduce the bug:
- Missing error messages
- Incomplete steps to reproduce
- Missing environment details
- Unclear expected vs actual behavior

**Suggested Actions:**
1. Provide more detailed information:
   - Full error messages with stack traces
   - Exact steps to reproduce the issue
   - Expected behavior vs actual behavior
   - Environment details (OS, Node version, package versions)
2. Check the error logs: `tail -n 50 .planning/logs/agent-errors.jsonl`
3. Look for patterns in the logs that might indicate the root cause
4. Retry `/pd:fix-bug` with a more comprehensive bug description
5. Include specific file paths and line numbers if known

**See Also:**
- [Bug Investigation](error-recovery.md#pd:fix-bug)
- [Fix Bug Command](commands/pd/fix-bug.md)

---

### ERR-014: Unfinished tasks remain

**Error:** "There are unfinished tasks" or "Complete them before closing the milestone"

**Skills Affected:** `pd:complete-milestone`

**Cause:**
There are tasks in the current milestone that have not been marked as complete:
- Plans were created but not executed
- Tasks were partially completed
- STATE.md shows incomplete status

**Suggested Actions:**
1. Run `/pd:status` to see the list of incomplete tasks
2. Or read `.planning/STATE.md` to check current progress
3. Complete remaining tasks using `/pd:write-code` for each plan
4. Verify all tasks are marked complete in STATE.md
5. After all tasks are complete, retry `/pd:complete-milestone`

**See Also:**
- [Milestone Completion](setup.md#completing-milestones)
- [State Documentation](.planning/STATE.md)

---

### ERR-015: Open bugs remain

**Error:** "There are still unresolved bugs" or "Run `/pd:fix-bug` first"

**Skills Affected:** `pd:complete-milestone`

**Cause:**
There are unresolved bugs in the `.planning/bugs/` directory:
- Bugs were reported but not fixed
- Bug files still exist in the bugs folder
- Critical issues need resolution before milestone completion

**Suggested Actions:**
1. List open bugs: `ls -la .planning/bugs/`
2. Read each bug file to understand the issues: `cat .planning/bugs/*.md`
3. Run `/pd:fix-bug "[bug description]"` for each open bug
4. Or use `/pd:status` to see a bug summary
5. Verify all bugs are resolved (bug files may be moved to `.planning/bugs/fixed/`)
6. After all bugs are resolved, retry `/pd:complete-milestone`

**See Also:**
- [Bug Management](setup.md#bugs)
- [Bug Directory](.planning/bugs/)

---

## Related Documentation

- [Error Recovery Guide](error-recovery.md) — Advanced error handling and log analysis
- [Setup Guide](setup.md) — Initial setup and MCP configuration
- [CLAUDE.md](../CLAUDE.md) — Project conventions and coding standards
- [State Tracking](.planning/STATE.md) — Current project state and progress

---

*Last Updated: 2026-04-04*
