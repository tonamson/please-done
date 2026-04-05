# Bug Fixing Workflow Guide

[![English](https://img.shields.io/badge/lang-English-blue.svg)](bug-fixing.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](bug-fixing.vi.md)

> **Difficulty:** 🟡 Intermediate  
> **Time:** Varies by bug complexity  
> **Prerequisites:** `.planning/` directory exists, bug description ready

---

## Prerequisites

Before starting, ensure you have:

- [ ] Project has `.planning/` directory initialized
- [ ] You can reproduce the bug consistently
- [ ] Bug description ready (error message, expected vs actual behavior)
- [ ] Understanding of which feature/area is affected

---

## Overview

This guide walks you through the systematic bug fixing process using `/pd:fix-bug`, from symptom collection to verified fix. By the end, you will have:

1. Reported and investigated the bug
2. Identified root cause
3. Applied a targeted fix
4. Verified with tests
5. Confirmed resolution

---

## Step-by-Step Walkthrough

### Step 1: Initiate Bug Fix

**Command:**
```
/pd:fix-bug "Login fails with 500 error when using OAuth for new users"
```

**Expected Output:**
```
Creating BUG_REPORT.md...
Collecting symptoms...
Evidence collected:
- Error logs: TypeError: Cannot read property 'email' of null
- Recent commits: src/auth/oauth.js modified 2 days ago
- Affected files: src/auth/oauth.js, src/routes/login.js
- Test failures: oauth.test.js: 2 failing

Invoking Bug Janitor for analysis...
```

**What this does:**
Creates a structured bug report with reproduction steps and starts the automated investigation process. The Bug Janitor and Code Detective analyze the code to identify the root cause.

**Decision Points:**
- If "Insufficient information" error, add more details to description (error message, file paths, steps to reproduce)
- If "MCP not connected" error, check Docker services are running
- If bug cannot be reproduced, verify environment matches production

---

### Step 2: Review Investigation Results

**Command:**
```
(wait for analysis - no command needed)
```

**Expected Output:**
```
========================================
Root Cause Analysis
========================================

File: src/auth/oauth.js:45
Issue: Missing null check for user.profile
Impact: login flow fails for new users without profile data

Fix Plan:
1. Add null check before accessing profile.email
2. Add regression test for null profile case
3. Update error handling

Files to modify:
- src/auth/oauth.js (add null check)
- test/auth/oauth.test.js (add test case)
```

**What this does:**
The Bug Janitor and Code Detective analyze the code to identify root cause, affected files, and propose a fix plan.

**Decision Points:**
- If root cause is unclear, provide more context and re-run `/pd:fix-bug` with additional details
- If wrong file identified, add file path hints to bug description
- If fix plan seems incorrect, review findings before proceeding

---

### Step 3: Apply the Fix

**Command:**
```
(AI automatically applies fix based on investigation)
```

**Expected Output:**
```
Applying fix...
Modified: src/auth/oauth.js
@@ -42,7 +42,10 @@ async function handleOAuth(user) {
-  const email = user.profile.email;
+  if (!user.profile) {
+    throw new AuthError('Profile data missing');
+  }
+  const email = user.profile.email;

Modified: test/auth/oauth.test.js
+ Added test case: 'should handle null profile'

Running tests...
New regression test: PASS

Committed: fix(auth): add null check for OAuth profile
Hash: a1b2c3d
```

**What this does:**
AI applies the identified fix, creates a regression test, runs tests to verify, and commits the changes.

**Decision Points:**
- If fix seems incorrect, review the changes before continuing
- If multiple files affected, ensure all changes make sense
- If new test fails, the fix may need adjustment

---

### Step 4: Verify with Tests

**Command:**
```
/pd:test
```

**Expected Output:**
```
Running test suite...

Test Suites: 12 passed, 12 total
Tests:       47 passed, 0 failed
Snapshots:   0 updated
Coverage:    +2% (OAuth handling)

New regression test: PASS
No regressions detected
```

**What this does:**
Runs the full test suite to verify the fix doesn't break existing functionality and that the new regression test passes.

**Decision Points:**
- If tests fail, the fix may be incomplete — re-run `/pd:fix-bug` with updated context
- If new test needed, add test case and re-run
- If coverage decreased, consider adding more tests

---

### Step 5: Check Bug Resolution

**Command:**
```
/pd:what-next
```

**Expected Output:**
```
Milestone: v1.0
Phase: 1.2 — User Authentication
Tasks: 3/5 completed (2 pending)

Bug Report: OAuth login fix
Status: RESOLVED
Tests: PASSING
Verification: Complete

Next: Continue with regular development
```

**What this does:**
Confirms the bug has been resolved and shows next development steps.

**Decision Points:**
- If bug still reproducible in production, re-run `/pd:fix-bug` with updated description
- If related issues found, create new bug reports for each
- If task blocked by this bug, it should now be unblocked

---

### Step 6: Review and Close

**Command:**
```
/pd:status
```

**Expected Output:**
```
Milestone: v1.0
Phase: 1.2 — User Authentication
Tasks: On track
Bugs: 0 unresolved (1 recently resolved)
Errors: 0 recent
Blockers: None

Recent Activity:
- OAuth login fix committed (a1b2c3d)
- Tests: All passing
```

**What this does:**
Shows project status with the bug now resolved. The bug report is archived and project can continue.

**Decision Points:**
- If more bugs exist, prioritize by severity (critical → high → medium → low)
- If phase blocked by bugs, resolve all before continuing
- Consider documenting the fix pattern in CLAUDE.md if it recurs

---

## Summary

You have successfully:

- ✅ Reported and investigated a bug systematically
- ✅ Identified root cause through automated analysis
- ✅ Applied a targeted fix with regression test
- ✅ Verified fix with full test suite
- ✅ Confirmed resolution and closed bug report

The `/pd:fix-bug` command provides:
- Structured investigation with evidence collection
- Root cause analysis with fix recommendations
- Automatic regression test generation
- Integration with existing test suite

---

## Next Steps

- Return to regular development with `/pd:what-next`
- Document the fix in your CHANGELOG.md
- Consider adding the pattern to your project's CLAUDE.md if it may recur
- Review other open bugs with `/pd:status`

---

## See Also

- [Getting Started Guide](getting-started.md) — Basic PD workflow
- [Milestone Management Guide](milestone-management.md) — Complete milestones
- [Error Troubleshooting](/docs/error-troubleshooting.md) — Common error solutions
- [Error Recovery](/docs/error-recovery.md) — Recovery procedures
- [Command Cheat Sheet](/docs/cheatsheet.md) — Quick command reference
