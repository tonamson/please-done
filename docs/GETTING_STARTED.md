# Getting Started with Please Done

Go from zero to your first generated plan in under 10 minutes.

## Prerequisites

- Node.js 18+ installed
- A project directory (existing or new)
- Git initialized in that directory

## Step 0: Install (~1 min)

```bash
npm install -g please-done
```

Verify with `pd:what-next` — it should suggest onboarding.

## Step 1: Onboard Your Project (~2 min)

```bash
cd your-project
pd:onboard
```

This scans your codebase and creates `.planning/` with STATE.md, CONTEXT.md, and CONVENTIONS.md.

> ⚠️ Pitfall: `pd:onboard` requires a git repository. Run `git init` first if needed.

## Step 2: Define Your First Milestone (~1 min)

```bash
pd:new-milestone "v1.0 MVP"
```

Creates `.planning/ROADMAP.md` with phases and requirements. Each phase becomes a unit of work.

## Step 3: Plan the First Phase (~2 min)

```bash
pd:plan --auto 1.1
```

Generates a PLAN.md with tasks, verification steps, and success criteria for Phase 1.

> ⚠️ Pitfall: Running `pd:plan` before `pd:new-milestone` fails — there are no phases to plan yet.

## Step 4: Execute and Test (~5 min)

```bash
pd:write-code --auto
pd:test --all
```

Executes tasks from the plan, commits each task, and runs verification.

## What's Next?

Repeat the cycle: `pd:plan` → `pd:write-code` → `pd:test` for each phase. When all phases are done:

```bash
pd:complete-milestone
```

This finalizes the milestone and prepares the project for the next version.

See [WORKFLOW_OVERVIEW.md](WORKFLOW_OVERVIEW.md) for the full lifecycle diagram.

## Lost? Use `pd:what-next`

Run `pd:what-next` at any point — it checks your project state and suggests the correct next command.

---

For all commands and options, see [COMMAND_REFERENCE.md](COMMAND_REFERENCE.md).
