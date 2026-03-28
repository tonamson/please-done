# Command `pd test`

## Purpose
Ensure the quality and reliability of written code. Prove it with data and actual results.

## How It Works
1. **Run Test Suite:** Execute the project's existing test suites (Jest, Mocha, Flutter test, etc.).
2. **Check Regression:** Ensure new changes don't break existing features.
3. **Write Report (verification-report.md):** AI creates a summary report of tests run, results (Pass/Fail), and "Truths" that have been verified.

## Why is this command important?
In PD, a Milestone is only considered complete when it has a test report. This is the basis for "locking in" the code.

## Output
- Test results in the console.
- File `.planning/milestones/[version]/phase-[phase]/verification-report.md`.
- Suggested next command (usually `pd complete-milestone`).

## Usage Tips
- If your project has specific test commands, declare them in `.planning/PROJECT.md` or `rules/general.md` so AI knows how to run them correctly.

---
**Next step:** [pd complete-milestone](complete-milestone.md)
