# Error Recovery Guide

This guide helps diagnose and recover from common errors encountered when using PD skills.

## Quick Reference by Skill

### pd:fix-bug

**Common Error:** "Insufficient information to investigate"
- **Symptoms:** Janitor agent fails to collect symptoms
- **Recovery:** Provide more detailed bug description with specific error messages, steps to reproduce, and expected behavior
- **Example Log Entry:**
  ```json
  {
    "level": "ERROR",
    "agent": "pd:fix-bug",
    "error": "Insufficient information to investigate",
    "context": {
      "currentStep": "collecting-symptoms",
      "evidenceCollected": false
    }
  }
  ```

**Common Error:** "Detective uses heavy tool. Only 1 heavy task at a time."
- **Symptoms:** Code detective cannot run due to resource constraints
- **Recovery:** Wait for other heavy tasks to complete, or run in single-agent mode with `--single` flag
- **Example Log Entry:**
  ```json
  {
    "level": "WARN",
    "agent": "pd:fix-bug",
    "error": "Resource conflict: Detective uses heavy tool",
    "context": {
      "currentStep": "analyzing-code",
      "agentsInvoked": ["detective"]
    }
  }
  ```

**Common Error:** "Unable to collect symptoms. Please try again."
- **Symptoms:** Multiple agent failures during symptom collection
- **Recovery:** Check that MCP services are running, verify file permissions in .planning/debug/

### pd:plan

**Common Error:** "FastCode MCP is not connected"
- **Symptoms:** Cannot analyze existing codebase during planning
- **Recovery:** Check Docker service, verify MCP configuration in claude_desktop_config.json
- **Example Log Entry:**
  ```json
  {
    "level": "ERROR",
    "agent": "pd:plan",
    "error": "FastCode MCP is not connected",
    "context": {
      "planningMode": "auto",
      "researchComplete": false
    }
  }
  ```

**Common Error:** "ROADMAP.md is missing"
- **Symptoms:** Cannot create plan without roadmap
- **Recovery:** Run `/pd:new-milestone` first to create milestone structure

**Common Error:** "Phase does not exist in ROADMAP"
- **Symptoms:** Invalid phase number provided
- **Recovery:** Check ROADMAP.md for valid phase numbers

### pd:write-code

**Common Error:** "Lint or build fails"
- **Symptoms:** Code compiles but fails linting or build step
- **Recovery:** Read the error output, fix the specific issues mentioned, then re-run the task
- **Example Log Entry:**
  ```json
  {
    "level": "ERROR",
    "agent": "pd:write-code",
    "error": "ESLint: Unexpected token",
    "context": {
      "taskNumber": 3,
      "filesModified": ["src/api/auth.js"],
      "lintPassed": false,
      "buildPassed": true
    }
  }
  ```

**Common Error:** "The task is unclear"
- **Symptoms:** AI cannot understand what needs to be implemented
- **Recovery:** Run `/pd:plan` again with more specific requirements, or ask clarifying questions

**Common Error:** "MCP is not connected"
- **Symptoms:** Cannot access Context7 for library documentation
- **Recovery:** Check Context7 service and configuration

### pd:test

**Common Error:** "Test fails: related tests do not pass"
- **Symptoms:** Implementation breaks existing functionality
- **Recovery:** Review the failing tests, understand the expected behavior, fix the implementation
- **Example Log Entry:**
  ```json
  {
    "level": "ERROR",
    "agent": "pd:test",
    "error": "2 tests failed: auth middleware tests",
    "context": {
      "testType": "integration",
      "testsRun": 50,
      "testsPassed": 48
    }
  }
  ```

**Common Error:** "Test infrastructure error"
- **Symptoms:** Cannot run tests due to missing test files or configuration
- **Recovery:** Run `/pd:test --standalone` to set up test infrastructure

### pd:audit

**Common Error:** "Scanner failed to execute"
- **Symptoms:** Security scanner encounters an error
- **Recovery:** Check scanner dependencies, verify target files exist
- **Example Log Entry:**
  ```json
  {
    "level": "ERROR",
    "agent": "pd:audit",
    "error": "Scanner sql-injection failed to execute",
    "context": {
      "auditType": "security",
      "scannersUsed": ["sql-injection", "xss", "auth-bypass"],
      "findingsCount": 0
    }
  }
  ```

**Common Error:** "Smart scanner selection failed"
- **Symptoms:** Cannot determine appropriate scanners for codebase
- **Recovery**: Run `/pd:scan` first to generate codebase maps

### pd:init

**Common Error**: "CONTEXT.md already exists"
- **Symptoms**: Cannot initialize project that is already initialized
- **Recovery**: Run `/pd:what-next` to see current state, or delete CONTEXT.md if you want to re-initialize

**Common Error**: "Missing required files for initialization"
- **Symptoms**: Cannot find rules/general.md or other required files
- **Recovery**: Check that all template files are present in .planning/templates/

### pd:scan

**Common Error:** "FastCode MCP connection failed"
- **Symptoms**: Cannot analyze codebase structure
- **Recovery**: Check Docker and MCP configuration

### pd:research

**Common Error:** "Context7 query failed"
- **Symptoms**: Cannot look up library documentation
- **Recovery**: Verify library name is correct, check Context7 service status
- **Example Log Entry:**
  ```json
  {
    "level": "ERROR",
    "agent": "pd:research",
    "error": "Context7 query failed: library not found",
    "context": {
      "executionMode": "quick",
      "queryType": "context7",
      "library": "unknown-package"
    }
  }
  ```

### pd:complete-milestone

**Common Error:** "Open bugs exist - cannot complete milestone"
- **Symptoms**: Milestone has unresolved bugs
- **Recovery**: Run `/pd:fix-bug` to resolve all bugs before completing milestone

**Common Error:** "Not all phases are implemented"
- **Symptoms**: Trying to complete milestone with missing phase deliverables
- **Recovery**: Check ROADMAP.md, ensure all required phases are planned and coded

## General Recovery Steps

### Step 1: Check Logs

View recent errors:
```bash
tail -f .planning/logs/agent-errors.jsonl
```

### Step 2: Identify Error Type

Check the error message and context in the log:
- `level`: `ERROR` (needs immediate fix) or `WARN` (can proceed)
- `agent`: Which skill failed
- `error`: The specific error message
- `context`: Additional details about what was happening

### Step 3: Apply Recovery

Based on the error type:
- **Missing prerequisites**: Run the missing command first
- **MCP issues**: Check Docker/services
- **Code issues**: Fix the specific error
- **Resource conflicts**: Wait or use single-agent mode
- **User input needed**: Ask clarifying questions

### Step 4: Verify Fix

Re-run the command and check:
- No new errors in the log
- Task completes successfully
- Expected output is generated

## Log File Format

Each log entry in `.planning/logs/agent-errors.jsonl` follows this format:

```json
{
  "timestamp": "2026-04-03T12:00:00.000Z",
  "level": "ERROR",
  "phase": "89",
  "step": "collecting-symptoms",
  "agent": "pd:fix-bug",
  "error": "Error message",
  "context": {
    "stack": "Error stack trace",
    "skill-specific-fields": "values"
  }
}
```

## Quick Commands

Check recent errors:
```bash
tail -n 20 .planning/logs/agent-errors.jsonl | jq '.'
```

View errors for specific skill:
```bash
grep '"agent":"pd:fix-bug"' .planning/logs/agent-errors.jsonl | jq '.'
```

Clear old logs:
```bash
rm .planning/logs/agent-errors.jsonl
```

## Need More Help?

If you encounter an error not covered in this guide:

1. Check the detailed log entry in `.planning/logs/agent-errors.jsonl`
2. Look at the context fields for clues
3. Run `/pd:what-next` to see current state
4. Check if the error is consistent or intermittent
5. Create a bug investigation session: `/pd:fix-bug "[skill name] error: [error message]"`

## Error Patterns by Category

### MCP Connection Errors
- FastCode not connected
- Context7 not connected
- **Recovery**: Check Docker, restart MCP services, verify config

### File System Errors
- Missing required files
- Permission denied
- **Recovery**: Check file paths, permissions, run from correct directory

### Resource Constraint Errors
- Heavy agent conflict
- Memory/CPU limits
- **Recovery**: Wait for other tasks, use single-agent mode

### Input Validation Errors
- Missing arguments
- Invalid phase numbers
- **Recovery**: Provide required arguments, check valid values

### Integration Errors
- Tests fail after code changes
- Security findings block milestone
- **Recovery**: Review test failures, fix issues, re-run tests
