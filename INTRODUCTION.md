# Please Done — "Please, Get It Done!"

> A free skills suite for AI coding tools — turns ideas into structured code, without supervising every step.

---

## Why the Name "Please Done"?

Anyone who has used AI to write code knows this feeling: you ask AI to do something, it writes code but goes in the wrong direction, lacks context, or forgets what it did before. You have to repeat yourself over and over, fix again and again, until you want to get on your knees and beg: **"Please, get it done!"**

That is Please Done — the inner voice of developers working with AI.

The root cause lies in 2 inherent weaknesses of AI:

1. **No plan** — AI writes code per question, with no big picture. Each question gets a different approach, drifting further off course.
2. **No memory** — AI doesn't know what it wrote before, what decisions were made, what commitments exist. Each new session is a blank slate.

Please Done solves both: it gives AI a **clear plan** to stay on track, and an **external memory** (tracking files in `.planning/`) to preserve context. You only plan once — AI writes code following that exact plan, with the right structure, the right rules, the right order.

So it finally **gets it done** for you.

---

## How It Works

```
You describe the project     AI auto-scans, analyzes     You review the plan          AI writes code per plan

   /pd:init          →     /pd:scan            →     /pd:plan            →     /pd:write-code
   Detect tech stack        Structure report           Technical design          Per task, auto-commit
   Load matching rules      Dependencies, security     Split task list           Lint check, report
```

### Step 1 — Initialize (`/pd:init`)

AI auto-detects the project's tech stack (NestJS, NextJS, WordPress, Solidity, Flutter...) and loads the corresponding coding rules. No manual configuration needed.

### Step 2 — Scan Project (`/pd:scan`)

AI scans the entire codebase: directory structure, dependencies, design patterns in use, security vulnerabilities. Results are saved as a report for subsequent steps.

### Step 3 — Plan (`/pd:new-milestone` + `/pd:plan`)

This is the most important step. AI creates:

- **Roadmap** — project overview, split into milestones and phases
- **Technical design** — details: API endpoints, database schemas, component structure, architecture decisions
- **Task list** — specific tasks with dependency ordering, each task specifying files to create/modify

You can choose:
- **Auto mode** — AI decides everything, records reasoning for you to review
- **Discuss mode** (`--discuss`) — AI presents issues requiring decisions, you choose the approach

### Step 4 — AI Writes Code (`/pd:write-code`)

After the plan is approved, AI writes code per task:

- Reads the technical design before writing
- Follows coding rules for the current tech stack (naming, structure, security...)
- Auto-runs lint + build after each task
- Auto-commits with clear messages
- Creates detailed reports for each completed task

**3 execution modes:**

| Mode | Command | Behavior |
|---|---|---|
| Per task | `/pd:write-code` | Complete 1 task, stop and ask |
| Auto | `/pd:write-code --auto` | Complete all tasks sequentially |
| Parallel | `/pd:write-code --parallel` | Analyze dependencies, run independent tasks simultaneously using multi-agent |

### Step 5 — Test + Complete

- `/pd:test` — AI writes tests, runs them, reports results
- `/pd:fix-bug` — Found a bug? AI auto-analyzes the cause, fixes it, commits, loops until resolved
- `/pd:complete-milestone` — Checks all tasks + tests pass, creates summary report, tags version

---

## Why It Saves Time

### Plan Once, No Repeating

All design decisions are recorded. AI reads the design before writing every line of code — no need to remind "which library to use", "what's the directory structure", "what's the API response format".

### No Drifting Mid-Way

The task list has a clear dependency order. AI knows which tasks come first, which must wait.

### Lost Connection? Hit Esc by Accident? No Problem.

All progress is saved to disk (not connection-dependent). When you return:
- AI knows how many files were written, which step it's on
- Continues from where it stopped — no rewriting from scratch
- Works for all commands: write-code, plan, test, fix-bug

### Auto Rules by Tech Stack

Each tech stack has its own rule set — directory structure, naming conventions, security patterns, lint commands. AI auto-loads the right rules, no need to remind "use constant initializers" or "sanitize input".

### Parallel Mode for Large Projects

AI analyzes the dependency graph between tasks, groups into waves, runs independent tasks simultaneously using multi-agent. Backend and frontend can be written concurrently — frontend uses the API spec from the design to code ahead, without waiting for the backend to finish.

---

## Compared to Using AI Directly

| | Typing commands directly to AI | Using Please Done |
|---|---|---|
| **Planning** | In your head (AI doesn't know) | In PLAN.md (AI can read) |
| **Progress tracking** | Self-remember | TASKS.md + auto status |
| **Coding rules** | Remind every time | Auto-loaded by tech stack |
| **Lost connection** | Lose all context | Continue from where stopped |
| **Switch sessions** | Re-explain everything | `/pd:what-next` → instant overview |
| **Testing** | "Write tests for this" | AI writes tests based on actual code |
| **Version control** | Type manually or AI guesses | Automatic, following conventions |
| **Multiple AI platforms** | Each platform different | Same workflow, 5 platforms |

---

## Real Benchmarks

> Reproduce with `node test/benchmark.js` — not self-reported numbers.

### Workflow System

| | Count |
|---|---|
| User-callable commands | 11 |
| Total workflow steps | 78 |
| Verification gates (AI cannot skip) | 48 |
| Recovery points (crash-resistant) | 42 |
| Coding rules by tech stack | 35 files |
| Total workflow logic lines | 3,167 |

### Cross-Platform Installation

Write once → generates **191 files, 46,100 lines** for 4 platforms:

| Platform | Install time | Files generated |
|---|---|---|
| Codex CLI | 33ms | 48 |
| GitHub Copilot | 24ms | 48 |
| Gemini CLI | 19ms | 48 |
| OpenCode | 15ms | 47 |

### Quality

| | |
|---|---|
| Automated tests (smoke tests) | **75/75 pass** |
| Cross-platform path leaks | **0** |
| Safe reinstall (idempotent) | **4/4 platforms** |
| Total test run time | **338ms** |

---

## Supports 5 AI Coding Platforms

| Platform | Command |
|---|---|
| Claude Code | `/pd:init`, `/pd:plan`... |
| Codex CLI | `$pd-init`, `$pd-plan`... |
| Gemini CLI | `/pd:init`, `/pd:plan`... |
| OpenCode | `/pd-init`, `/pd-plan`... |
| GitHub Copilot | `/pd:init`, `/pd:plan`... |

Written once for Claude Code, the installer auto-converts to each platform's native format.

---

## Tech Stacks with Specialized Rules

| Tech Stack | Rule Set | Reference Docs |
|---|---|---|
| NestJS | Controllers, services, DTOs, guards | 5 docs (authentication, database, testing, API docs, error handling) |
| NextJS (App Router) | Components, state management, API layer, server components | 5 docs (server components, authentication, SEO, API, state management) |
| WordPress | Security, hooks, REST API, WP coding standards | 9 docs (plugins, themes, block editor, e-commerce...) |
| Solidity | OpenZeppelin, security, NatSpec comments, gas optimization | 2 docs (contract templates, audit checklist) |
| Flutter (GetX) | UI, state, navigation, networking, platform channels | 8 docs (state, navigation, design system, testing...) |

Other stacks (Express, Vite/React...) are detected but only apply general rules. Extensible by adding new rule files.

---

## Free and Open Source

- MIT License — use for personal and commercial projects
- No registration, no usage limits
- Requirements: Node.js 16+ and at least 1 AI coding tool installed

### Installation

```bash
git clone https://github.com/tonamson/please-done.git
cd please-done
node bin/install.js
```

### Getting Started

```bash
cd /path/to/your/project
/pd:init              # Initialize
/pd:scan              # Scan project
/pd:new-milestone     # Create roadmap
/pd:plan              # Technical design + split tasks
/pd:write-code --auto # AI writes code per plan
```

---

## Overall Workflow

```
┌──────────────────────────────────────────────────────────────────────┐
│                       PLEASE DONE WORKFLOW                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  /pd:init ──→ /pd:scan ──→ /pd:new-milestone ──→ /pd:plan           │
│  Detect        Analyze      Roadmap + phases       Technical design  │
│  tech stack    codebase     + milestones            + split tasks     │
│                                                                      │
│                              ┌───────────────────────┐               │
│                              │    /pd:write-code      │               │
│                              │  AI writes per design  │               │
│                              │  Lint → Build           │               │
│                              │  → Commit               │               │
│                              └──────┬────────────────┘               │
│                                     │                                │
│                              ┌──────▼────────────────┐               │
│              ┌───────────────│      /pd:test          │               │
│              │  Bug found?   │  Write + run tests     │               │
│              │               └──────┬────────────────┘               │
│       ┌──────▼──────┐               │                                │
│       │ /pd:fix-bug │               │ Tests pass                     │
│       │ Analyze,    │───────────────┘                                │
│       │ fix, loop   │                                                │
│       └─────────────┘        ┌──────▼────────────────┐               │
│                              │/pd:complete-milestone  │               │
│                              │ Summarize, tag          │               │
│                              │ version, release        │               │
│                              └───────────────────────┘               │
│                                                                      │
│  Utilities:                                                          │
│  /pd:what-next    → Forgot what you were doing? AI suggests next     │
│  /pd:fetch-doc    → Download library docs locally                    │
│  /pd:update       → Update Please Done                               │
└──────────────────────────────────────────────────────────────────────┘
```

---

*Please Done — You plan, AI executes.*
