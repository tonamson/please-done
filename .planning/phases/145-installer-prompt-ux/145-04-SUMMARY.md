---
phase: 145
plan: "04"
title: "Prompt UX Smoke Tests"
subsystem: "test/installer"
tags: [tests, smoke, prompt, tty, non-interactive, ux]
dependency_graph:
  requires: [prompt-module, platform_description_field, tty-guarded-colorize]
  provides: [smoke-test-coverage-for-install-04]
  affects: []
tech_stack:
  added: []
  patterns: [node-test-runner, child_process-spawn, integration-testing]
key_files:
  created:
    - test/smoke-prompt.test.js
  modified: []
decisions:
  - "Tests use node:test runner (project standard)"
  - "Integration tests spawn installer process via execSync to test actual TTY guard behavior"
  - "Platform description tests verify exact D-10 wording for key platforms"
  - "Refactoring tests verify install.js no longer contains inline readline code"
metrics:
  duration: "130s"
  tasks: 1
  completed: "2026-04-07T20:06:13Z"
---

# Phase 145 Plan 04: Prompt UX Smoke Tests Summary

**One-liner:** Created comprehensive smoke test suite verifying TTY guard, non-TTY fallback, platform descriptions, and installer refactoring with 15 test cases.

## What Was Built

### New File: test/smoke-prompt.test.js

Created a smoke test file with 6 describe blocks and 15 test cases covering all INSTALL-04 success criteria:

```javascript
// 6 describe blocks covering:
// 1. TTY guard on colorize() — piped output has zero ANSI
// 2. Platform descriptions — all 7 platforms + D-10 wording
// 3. prompt.js module exports — public API verification
// 4. Non-TTY fallback — announcement messages
// 5. Confirmation line — "Installing for:" appears
// 6. install.js refactoring — no inline readline code
```

### Test Coverage

| Describe Block | Tests | Purpose |
|----------------|-------|---------|
| TTY guard on colorize() | 2 | Piped output + NO_COLOR support |
| Platform descriptions | 5 | All 7 platforms + exact D-10 wording for 4 |
| prompt.js module exports | 2 | Public API + private helper verification |
| Non-TTY fallback | 2 | Announcement + "all platforms" default |
| Confirmation line | 1 | "Installing for:" output |
| install.js refactoring | 3 | Import, no createRL, no readline |

### Test Techniques

- **Integration tests** spawn installer via `execSync` to test real TTY behavior
- **Unit tests** verify module exports and file contents directly
- **ANSI detection** uses regex `/\x1b/g` to count escape sequences
- **Pattern matching** verifies exact D-10 description wording

## Verification Results

All tests pass:

```
▶ TTY guard on colorize()
  ✔ piped output contains zero ANSI escape sequences
  ✔ NO_COLOR=1 suppresses color output
▶ Platform descriptions
  ✔ all 7 platforms have description field
  ✔ claude description matches D-10
  ✔ codex description matches D-10
  ✔ gemini description matches D-10
  ✔ windsurf description matches D-10
▶ prompt.js module exports
  ✔ exports promptRuntime and promptLocation
  ✔ does not export createRL or ask (private helpers)
▶ Non-TTY fallback
  ✔ prints non-interactive announcement for promptRuntime
  ✔ non-TTY mode installs for all platforms by default
▶ Confirmation line
  ✔ prints Installing for: after selection
▶ install.js refactoring
  ✔ imports from ./lib/prompt
  ✔ does not contain inline createRL function
  ✔ does not require readline directly
ℹ tests 15
ℹ suites 6
ℹ pass 15
ℹ fail 0
```

## Commits

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Create smoke tests for prompt UX | 4fa4170 | test/smoke-prompt.test.js |

## Deviations from Plan

None — plan executed exactly as written. The plan provided exact test content which worked correctly after verification.

## Success Criteria Checklist

- [x] `test/smoke-prompt.test.js` exists with 6 describe blocks
- [x] TTY guard tests verify zero ANSI in piped output
- [x] NO_COLOR test verifies environment variable support
- [x] Platform description tests verify all 7 platforms have descriptions
- [x] prompt.js export tests verify public API
- [x] Non-TTY fallback tests verify announcement messages
- [x] Confirmation line test verifies "Installing for:" output
- [x] Refactoring tests verify install.js structure changes
- [x] All tests pass when run with `node --test`
- [x] At least 12 test cases (15 present)

## Requirement Completion

- **INSTALL-04**: COMPLETE. All acceptance criteria now have automated test coverage:
  - TTY guard: `test/smoke-prompt.test.js` "TTY guard on colorize()" (2 tests)
  - Platform descriptions: `test/smoke-prompt.test.js` "Platform descriptions" (5 tests)
  - Non-TTY fallback: `test/smoke-prompt.test.js` "Non-TTY fallback" (2 tests)
  - Confirmation line: `test/smoke-prompt.test.js` "Confirmation line" (1 test)
  - Module structure: `test/smoke-prompt.test.js` "prompt.js module exports" + "install.js refactoring" (5 tests)

## Self-Check: PASSED

- [x] test/smoke-prompt.test.js exists
- [x] Commit 4fa4170 exists in git log
- [x] All 15 tests pass
