# Workflow Guides

Step-by-step walkthrough guides for common Please Done workflows.

Choose your starting point based on your experience level:

---

## Quick Decision Guide

| Situation | Recommended Guide |
|-----------|------------------|
| New to PD? | [Getting Started](getting-started.md) |
| Something broken? | [Bug Fixing](bug-fixing.md) |
| Ready to ship? | [Milestone Management](milestone-management.md) |
| Not sure where you are? | Run `/pd:status` first |

---

## 🟢 Beginner

**[Getting Started](getting-started.md)**

Your first PD project from scratch.

- **7 steps:** onboard → new-milestone → plan → execute
- **No prior PD experience required**
- **Time:** ~15 minutes to first task complete
- **Prerequisites:** Node.js, Python, Git, Claude Code CLI

Use this when:
- You've never used PD before
- Setting up PD on a new codebase
- Learning the basic command flow

---

## 🟡 Intermediate

**[Bug Fixing](bug-fixing.md)**

Debug and fix production issues systematically.

- **6 steps:** identify → investigate → fix → test → verify
- **Requires existing project structure**
- **Time:** Varies by bug complexity
- **Prerequisites:** `.planning/` directory exists

Use this when:
- Tests are failing
- Production error encountered
- Need systematic debugging approach

---

## 🔴 Advanced

**[Milestone Management](milestone-management.md)**

Plan and complete full milestones.

- **6 steps:** plan → execute → test → complete
- **Understanding of phases and tasks recommended**
- **Time:** Depends on milestone scope
- **Prerequisites:** Understanding of PD workflow

Use this when:
- Planning a release
- Completing a milestone
- Managing multiple phases

---

## Additional Resources

- [Error Troubleshooting](/docs/error-troubleshooting.md) — Fix common errors
- [Command Cheat Sheet](/docs/cheatsheet.md) — Quick command reference
- [Error Recovery](/docs/error-recovery.md) — Recovery procedures
- [CLAUDE.md](/CLAUDE.md) — Full command documentation

---

## Guide Formats

Each guide follows a consistent structure:

1. **Prerequisites** — What you need before starting
2. **Overview** — What the workflow accomplishes
3. **Step-by-Step Walkthrough** — Detailed instructions with:
   - **Command:** Exact command to run
   - **Expected Output:** What you should see
   - **What this does:** Explanation of the step
   - **Decision Points:** If/then guidance for common situations
4. **Summary** — What you accomplished
5. **Next Steps** — Where to go from here
6. **See Also** — Related guides and resources
