# Codebase Structure

## Directory Layout

```
please-done/
├── bin/                        # Installation & conversion engine
│   ├── install.js              # Main installer entry point (CLI)
│   └── lib/
│       ├── utils.js            # Shared utilities (frontmatter, XML, hashing)
│       ├── platforms.js        # Platform definitions & path mappings
│       ├── manifest.js         # Manifest generation & change detection
│       ├── converters/         # Platform-specific skill converters
│       │   ├── codex.js        # Codex CLI converter
│       │   ├── copilot.js      # GitHub Copilot converter
│       │   ├── gemini.js       # Gemini CLI converter
│       │   └── opencode.js     # OpenCode converter
│       └── installers/         # Platform-specific installers
│           ├── claude.js       # Claude Code installer (symlink-based)
│           ├── codex.js        # Codex CLI installer
│           ├── copilot.js      # Copilot installer
│           ├── gemini.js       # Gemini CLI installer
│           └── opencode.js     # OpenCode installer
│
├── commands/                   # Skill command definitions (Claude Code format)
│   └── pd/                     # All pd:* skill commands
│       ├── init.md             # /pd:init - workspace initialization
│       ├── scan.md             # /pd:scan - project scanning
│       ├── new-milestone.md    # /pd:new-milestone - milestone planning
│       ├── plan.md             # /pd:plan - technical planning
│       ├── write-code.md       # /pd:write-code - code execution
│       ├── test.md             # /pd:test - test writing
│       ├── fix-bug.md          # /pd:fix-bug - bug fixing
│       ├── complete-milestone.md # /pd:complete-milestone
│       ├── what-next.md        # /pd:what-next - progress check
│       ├── fetch-doc.md        # /pd:fetch-doc - docs fetcher
│       ├── update.md           # /pd:update - self-update
│       └── conventions.md      # /pd:conventions - code conventions
│
├── workflows/                  # Workflow logic (inlined into commands)
│   ├── init.md
│   ├── scan.md
│   ├── new-milestone.md
│   ├── plan.md
│   ├── write-code.md
│   ├── test.md
│   ├── fix-bug.md
│   ├── complete-milestone.md
│   ├── what-next.md
│   └── conventions.md
│
├── templates/                  # Planning document templates
│   ├── project.md              # PROJECT.md template
│   ├── requirements.md         # REQUIREMENTS.md template
│   ├── roadmap.md              # ROADMAP.md template
│   ├── current-milestone.md    # CURRENT_MILESTONE.md template
│   ├── state.md                # STATE.md template
│   ├── plan.md                 # PLAN.md template
│   ├── tasks.md                # TASKS.md template
│   └── progress.md             # PROGRESS.md template
│
├── references/                 # Reference docs loaded by skills
│   ├── prioritization.md       # Task prioritization rules
│   ├── questioning.md          # Questioning framework
│   ├── ui-brand.md             # UI/brand guidelines
│   ├── conventions.md          # General code conventions
│   ├── security-checklist.md   # Security audit checklist
│   └── state-machine.md        # Planning state machine rules
│
├── test/                       # Smoke tests (node:test)
│   ├── smoke-integrity.test.js # Repo integrity checks
│   ├── smoke-converters.test.js# Converter output tests
│   ├── smoke-installers.test.js# Installer behavior tests
│   ├── smoke-utils.test.js     # Utils/platforms/manifest tests
│   ├── smoke-state-machine.test.js # State machine tests
│   ├── smoke-all-platforms.test.js # Cross-platform tests
│   └── benchmark.js            # Performance benchmarks
│
├── evals/                      # Prompt evaluation framework
│   ├── run.js                  # Eval runner
│   ├── trigger-wrapper.js      # Trigger evaluation wrapper
│   ├── prompt-wrapper.js       # Prompt evaluation wrapper
│   └── trigger-config.yaml     # Trigger test config
│
├── FastCode/                   # FastCode MCP server (git submodule)
│   ├── docker-compose.yml      # Docker setup for FastCode
│   ├── config/config.yaml      # FastCode configuration
│   ├── fastcode/               # Python FastCode engine
│   ├── nanobot/                # Nanobot communication layer
│   └── .venv/                  # Python virtual environment
│
├── .claude/                    # Claude Code project settings
│   ├── settings.json           # Shared settings
│   └── settings.local.json     # Local settings
│
└── .planning/                  # Planning state directory
    └── codebase/               # Codebase analysis documents
```

## Key Locations

| What | Where |
|------|-------|
| CLI entry point | `bin/install.js` |
| Converter logic | `bin/lib/converters/*.js` |
| Installer logic | `bin/lib/installers/*.js` |
| Shared utilities | `bin/lib/utils.js` |
| Platform definitions | `bin/lib/platforms.js` |
| Skill definitions | `commands/pd/*.md` |
| Workflow implementations | `workflows/*.md` |
| Planning templates | `templates/*.md` |
| Reference docs | `references/*.md` |
| Tests | `test/smoke-*.test.js` |
| Evals | `evals/` |

## Naming Conventions

### Files
- **Skills/Commands:** kebab-case `.md` files in `commands/pd/` (e.g., `write-code.md`, `fix-bug.md`)
- **Workflows:** matching kebab-case `.md` in `workflows/` (same name as command)
- **Converters/Installers:** platform name `.js` (e.g., `codex.js`, `gemini.js`)
- **Tests:** `smoke-{area}.test.js` prefix pattern
- **Templates:** kebab-case `.md` (e.g., `current-milestone.md`)

### Directories
- Top-level directories are lowercase, no hyphens
- Exception: `FastCode/` (git submodule, PascalCase)

## Where to Add New Code

| Adding... | Location | Pattern |
|-----------|----------|---------|
| New skill | `commands/pd/{name}.md` + `workflows/{name}.md` | Follow existing skill frontmatter format |
| New platform | `bin/lib/converters/{platform}.js` + `bin/lib/installers/{platform}.js` + register in `platforms.js` |
| New template | `templates/{name}.md` | Markdown with placeholder variables |
| New reference | `references/{name}.md` | Pure markdown content |
| New test | `test/smoke-{area}.test.js` | Use `node:test` + `node:assert/strict` |
| New eval | `evals/` | Follow existing eval runner pattern |
