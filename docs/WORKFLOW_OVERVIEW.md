# please-done (PD) Workflow Overview

The **please-done (PD)** system is more than a set of CLI commands; it is an **Operating Protocol** for AI Agents. PD forces AI to work like a "Senior Engineer": Think carefully (Plan) -> Break down work (Task) -> Check feasibility (Check) -> Execute (Execute) -> Prove (Verify).

---

## 1. Lifecycle of a Phase (Milestone)

Every project in PD follows a closed-loop cycle of 5 main steps:

### Step 1: Initialization - `pd init`
Set up the project structure. Create the project's "nervous system" including the `.planning/` directory and `ROADMAP.md` file. Here, Requirements are clearly defined.

### Step 2: Planning - `pd plan`
This is the most critical step. AI is not allowed to write code immediately. It must:
- Read `ROADMAP.md` to understand the current Phase's objectives.
- Create `PLAN.md`: Describe the strategy, technical solution, and Key Links.
- Create `TASKS.md`: Break `PLAN.md` down into specific, measurable tasks (Effort, Files, Truths).
- **Plan-Checker:** A set of automated rules (D-01 through D-13) will scan the Plan. If the Plan is too large (> 6 tasks) or too complex, AI must redo it.

### Step 3: Task Preparation - `pd what-next`
AI looks at `STATE.md` to know where it is and what needs to be done next. It selects the highest-priority uncompleted Task for execution.

### Step 4: Execution - `pd write-code`
AI focuses on exactly 1 Task at a time.
- Read the Task description in `TASKS.md`.
- Modify or create the listed files.
- Ensure compliance with language/framework-specific Rules (NestJS, NextJS, Flutter...).

### Step 5: Verification & Acceptance - `pd test` & `pd complete-milestone`
- **Verify:** AI writes a verification report (`verification-report.md`), proving that the "Truths" established in Step 2 are all correct.
- **Complete:** When all Tasks in the Phase are done, AI updates `ROADMAP.md` and `CHANGELOG.md`, closing a successful cycle.

---

## 2. State Management (The State Machine)

Why does PD's AI never "lose its mind" (context drift)? It's thanks to `STATE.md`.
- This file stores: most recent Activity, current Phase, current Task.
- Every PD command either updates or reads from `STATE.md`.
- If the Agent crashes, a new Agent only needs to read `STATE.md` to resume work immediately without asking the User again.

---

## 3. The "Surgical" Principle (Precise Intervention)

PD's philosophy is **Surgical update**:
- Only change what is necessary.
- No "while I'm at it" refactoring outside the Task scope.
- Every change must have a reason (mapped to a Truth in the Plan).

---
*This document is a foundational guide. For details on each command, please read [COMMAND_REFERENCE.md](COMMAND_REFERENCE.md).*
