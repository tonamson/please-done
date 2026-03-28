# please-done (PD) Command Reference

The **please-done (PD)** system consists of CLI commands designed to guide an AI Agent through a standardized software development process. Each command below has detailed documentation about its purpose, how it works, and expected results.

---

### 🚀 Initialization & Roadmap Phase
- [**`pd init`**](commands/init.md): Initialize a project or set up the PD structure for the first time.
- [**`pd new-milestone`**](commands/new-milestone.md): Start a new Phase from the Roadmap.

### 🧠 Planning & Research Phase
- [**`pd research`**](commands/research.md): **NEW** - Activate the Research Squad for multi-layer research (Parallel Research).
- [**`pd plan`**](commands/plan.md): The heart of PD — Design solutions based on research results.
- [**`pd fetch-doc`**](commands/fetch-doc.md): Fetch the latest external library documentation.
- [**`pd update`**](commands/update.md): Adjust plans when changes or feedback occur.

### 💻 Execution & Navigation Phase
- [**`pd what-next`**](commands/what-next.md): The compass that identifies the next Task to work on.
- [**`pd write-code`**](commands/write-code.md): Execute code changes (Coding) according to the plan.

### 🛠️ Quality Control & Bug Fixing Phase
- [**`pd fix-bug`**](commands/fix-bug.md): Controlled bug-fixing process (Reproduction -> Plan -> Fix).
- [**`pd scan`**](commands/scan.md): Check synchronization between Code and Design documents.

### ✅ Acceptance & Completion Phase
- [**`pd test`**](commands/test.md): Run the test suite and write acceptance reports.
- [**`pd complete-milestone`**](commands/complete-milestone.md): Close a Phase, summarize and update the Roadmap.

---

### Tips for Users & Agents:
- Always check the [**Workflow Overview**](WORKFLOW_OVERVIEW.md) to understand the operating philosophy.
- If a command fails, don't try to proceed with the next one; use `pd fix-bug` or go back to `pd scan` to find the root cause.
- Documenting all actions in `.planning/` is mandatory to maintain context.
