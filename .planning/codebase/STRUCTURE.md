# Codebase Structure

**Analysis Date:** 2026-04-07

## Directory Layout

```
please-done/
├── bin/                        # Installation & conversion engine
│   ├── install.js              # Main installer entry point (CLI)
│   ├── plan-check.js           # Plan validation utility
│   ├── sync-instructions.js    # Post-install sync for instructions
│   ├── route-query.js          # Query routing utility
│   ├── log-writer.js           # Structured logging
│   ├── generate-pdf-report.js  # PDF report generation
│   └── lib/
│       ├── utils.js            # Shared utilities (frontmatter, XML, hashing)
│       ├── platforms.js        # Platform definitions & path mappings
│       ├── manifest.js         # Manifest generation & change detection
│       ├── schema-validator.js # Artifact validation (CONTEXT, TASKS, PROGRESS)
│       ├── audit-trail.js      # Comprehensive audit trail (v14)
│       ├── scope-checker.js    # Phase scope validation
│       ├── audit-logger.js     # Audit logging
│       ├── skill-error-logger.js # Skill error tracking
│       ├── enhanced-error-handler.js # Structured error handling
│       ├── health-checker.js   # Health checking for GSD
│       ├── refresh-detector.js # Staleness detection
│       ├── staleness-detector.js # Codebase staleness detection
│       ├── parallel-dispatch.js # Wave-based task execution
│       ├── smart-selection.js  # Smart agent selection
│       ├── skill-integrator.js # Skill integration utilities
│       ├── skill-executor.js # Skill execution wrapper
│       ├── outcome-router.js   # Outcome routing for GSD
│       ├── plan-checker.js     # Plan validation logic
│       ├── workflow-mapper.js # Workflow mapping utilities
│       ├── research-store.js   # Research data storage
│       ├── stats-collector.js # Statistics collection
│       ├── progress-tracker.js # Progress tracking
│       ├── checkpoint-handler.js # Checkpoint management
│       ├── session-manager.js  # Session state management
│       ├── session-delta.js   # Session delta tracking
│       ├── token-analyzer.js  # Token usage analysis
│       ├── bug-memory.js       # Bug memory system
│       ├── regression-analyzer.js # Regression analysis
│       ├── confidence-scorer.js # Confidence scoring
│       ├── logic-sync.js       # Logic synchronization
│       ├── version-sync.js     # Version synchronization
│       ├── dashboard-renderer.js # Status dashboard
│       ├── index-generator.js  # Index generation
│       ├── mcp-discovery.js    # MCP server discovery
│       ├── service-discovery.js # Service discovery
│       ├── secret-detector.js  # Secret detection
│       ├── recon-aggregator.js # Recon data aggregation
│       ├── recon-scanner.js    # Recon scanning
│       ├── recon-cache.js      # Recon caching
│       ├── ct-scanner.js       # CT (Certificate Transparency) scanning
│       ├── source-mapper.js    # Source mapping
│       ├── taint-engine.js     # Taint analysis engine
│       ├── post-exploit.js     # Post-exploitation modules
│       ├── payloads.js         # Payload definitions
│       ├── gadget-chain.js     # Gadget chain analysis
│       ├── evasion-engine.js   # Evasion techniques
│       ├── target-enumerator.js # Target enumeration
│       ├── subdomain-osint.js  # Subdomain OSINT
│       ├── osint-aggregator.js # OSINT aggregation
│       ├── google-dorks.js     # Google dorks
│       ├── asset-discoverer.js # Asset discovery
│       ├── auth-analyzer.js    # Authentication analysis
│       ├── report-filler.js    # Report generation
│       ├── pdf-renderer.js     # PDF rendering
│       ├── mermaid-validator.js # Mermaid diagram validation
│       ├── generate-diagrams.js # Diagram generation
│       ├── resource-config.js  # Resource configuration
│       ├── evidence-protocol.js # Evidence handling
│       ├── debug-cleanup.js    # Debug cleanup
│       ├── init.cjs            # Initialization utilities
│       ├── flag-parser.js      # Flag parsing
│       ├── log-schema.js       # Log schema definitions
│       ├── log-reader.js       # Log reading
│       ├── log-manager.js      # Log management
│       ├── log-writer.js       # Log writing (lib version)
│       ├── installer-utils.js  # Installer utilities
│       ├── truths-parser.js    # Truths parser
│       ├── basic-error-handler.js # Basic error handling
│       ├── repro-test-generator.js # Test reproduction
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
│       ├── onboard.md          # /pd:onboard - project onboarding
│       ├── new-milestone.md    # /pd:new-milestone - milestone planning
│       ├── complete-milestone.md # /pd:complete-milestone
│       ├── plan.md             # /pd:plan - technical planning
│       ├── write-code.md       # /pd:write-code - code execution
│       ├── test.md             # /pd:test - test writing
│       ├── fix-bug.md          # /pd:fix-bug - bug fixing
│       ├── what-next.md        # /pd:what-next - progress check
│       ├── status.md           # /pd:status - status dashboard
│       ├── stats.md            # /pd:stats - project statistics
│       ├── health.md           # /pd:health - health checking
│       ├── audit.md            # /pd:audit - audit trail
│       ├── discover.md         # /pd:discover - discovery
│       ├── fetch-doc.md        # /pd:fetch-doc - docs fetcher
│       ├── update.md           # /pd:update - self-update
│       ├── sync-version.md     # /pd:sync-version - version sync
│       ├── conventions.md      # /pd:conventions - code conventions
│       ├── agents/               # Agent definitions
│       │   └── gsd-codebase-mapper.md # Codebase mapper agent
│       └── rules/                # Framework-specific rules
│           ├── general.md
│           ├── nestjs.md
│           ├── nextjs.md
│           ├── django.md
│           ├── fastapi.md
│           ├── flutter.md
│           ├── react-native.md
│           ├── solidity.md
│           ├── wordpress.md
│           └── solidity-refs/    # Solidity reference materials
│
├── workflows/                  # Workflow logic (inlined into commands)
│   ├── init.md
│   ├── scan.md
│   ├── onboard.md
│   ├── new-milestone.md
│   ├── complete-milestone.md
│   ├── plan.md
│   ├── write-code.md
│   ├── test.md
│   ├── fix-bug.md
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
│   ├── progress.md             # PROGRESS.md template
│   └── agent-templates/        # Agent-specific templates
│       └── codebase-mapper.md
│
├── references/                 # Reference docs loaded by skills
│   ├── prioritization.md       # Task prioritization rules
│   ├── questioning.md          # Questioning framework
│   ├── ui-brand.md             # UI/brand guidelines
│   ├── conventions.md          # General code conventions
│   ├── security-checklist.md   # Security audit checklist
│   ├── state-machine.md        # Planning state machine rules
│   ├── verification.md         # Verification guidelines
│   ├── guard-file-locations.md # File location guards
│   ├── guard-plan-checks.md    # Plan validation guards
│   └── guard-plan-validation.md # Plan validation rules
│
├── lib/                        # Standalone utilities
│   ├── doc-link-mapper.js      # Documentation link mapping
│   ├── key-file-selector.js    # Key file selection
│   └── onboard-summary.js      # Onboarding summary
│
├── test/                       # Smoke tests (node:test)
│   ├── smoke-integrity.test.js # Repo integrity checks
│   ├── smoke-converters.test.js# Converter output tests
│   ├── smoke-installers.test.js# Installer behavior tests
│   ├── smoke-utils.test.js     # Utils/platforms/manifest tests
│   ├── smoke-state-machine.test.js # State machine tests
│   ├── smoke-all-platforms.test.js # Cross-platform tests
│   ├── smoke-bug-memory.test.js # Bug memory tests
│   ├── smoke-logic-sync.test.js # Logic sync tests
│   ├── smoke-snapshot.test.js # Snapshot tests
│   ├── smoke-standalone.test.js # Standalone tests
│   ├── smoke-outcome-router.test.js # Outcome router tests
│   ├── smoke-truths-parser.test.js # Truths parser tests
│   ├── smoke-error-handling.test.js # Error handling tests
│   ├── smoke-confidence-scorer.test.js # Confidence scorer tests
│   ├── smoke-installer-utils.test.js # Installer utils tests
│   ├── smoke-codebase-staleness.test.js # Codebase staleness tests
│   ├── smoke-session-manager.test.js # Session manager tests
│   ├── smoke-update-research-index.test.js # Research index tests
│   ├── smoke-research-store.test.js # Research store tests
│   ├── smoke-converters.test.js # Converter tests
│   ├── smoke-integrity.test.js # Integrity tests
│   ├── smoke-gadget-chain.test.js # Gadget chain tests
│   ├── smoke-debug-cleanup.test.js # Debug cleanup tests
│   ├── smoke-generate-diagrams.test.js # Diagram generation tests
│   ├── smoke-log-writer.test.js # Log writer tests
│   ├── smoke-mermaid-validator.test.js # Mermaid validator tests
│   ├── smoke-audit-logger.test.js # Audit logger tests
│   ├── smoke-log-schema.test.js # Log schema tests
│   ├── smoke-checkpoint-handler.test.js # Checkpoint handler tests
│   ├── basic-error-handler.test.js # Basic error handler tests
│   ├── enhanced-error-handler.test.js # Enhanced error handler tests
│   ├── health-checker.test.js # Health checker tests
│   ├── dashboard-renderer.test.js # Dashboard renderer tests
│   ├── stats-collector.test.js # Stats collector tests
│   ├── progress-tracker.test.js # Progress tracker tests
│   ├── version-sync.test.js # Version sync tests
│   ├── refresh-detector.test.js # Refresh detector tests
│   ├── skill-error-logger.test.js # Skill error logger tests
│   ├── log-manager.test.js # Log manager tests
│   ├── log-reader.test.js # Log reader tests
│   ├── log-writer.test.js # Log writer tests
│   ├── log-writer.test.js # Log writer tests (duplicate)
│   ├── schema-validator.test.js # Schema validator tests
│   ├── audit-trail.test.js # Audit trail tests
│   ├── platform-models.test.js # Platform models tests
│   ├── pd-onboard-integration.test.js # Onboard integration tests
│   ├── pd-status-workflow.integration.test.js # Status workflow tests
│   ├── pd-status.integration.test.js # Status integration tests
│   ├── lint-failure-tracking.integration.test.js # Lint failure tracking
│   ├── lint-recovery.integration.test.js # Lint recovery tests
│   ├── integration-contracts.test.js # Integration contracts tests
│   ├── integration/              # Integration test utilities
│   ├── workflows/                # Workflow-specific tests
│   ├── fixtures/                 # Test fixtures
│   ├── baseline-tokens.json      # Token baselines
│   └── generate-snapshots.js     # Snapshot generation
│
├── evals/                      # Prompt evaluation framework
│   ├── run.js                  # Eval runner
│   ├── trigger-wrapper.js      # Trigger evaluation wrapper
│   ├── prompt-wrapper.js       # Prompt evaluation wrapper
│   ├── benchmarks/             # Benchmark configurations
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
│   ├── settings.local.json     # Local settings
│   ├── commands/               # Command definitions
│   ├── projects/               # Project configurations
│   ├── skills/                 # GSD Skills
│   ├── get-shit-done/          # GSD Workflow definitions
│   │   └── workflows/          # GSD orchestrator workflows
│   ├── agents/                 # GSD Agent definitions
│   └── cache/                  # Cache directory
│
├── .planning/                  # Planning state directory
│   ├── codebase/               # Codebase analysis documents (THIS DIRECTORY)
│   │   ├── STACK.md
│   │   ├── INTEGRATIONS.md
│   │   ├── ARCHITECTURE.md
│   │   ├── STRUCTURE.md
│   │   ├── CONVENTIONS.md
│   │   ├── TESTING.md
│   │   └── CONCERNS.md
│   ├── milestones/             # Milestone directories
│   ├── bugs/                   # Bug reports
│   ├── research/               # Research data
│   ├── debug/                  # Debug information
│   ├── logs/                   # Log files
│   └── phases/                 # Phase directories
│
├── docs/                       # Documentation
│   └── (project documentation)
│
└── scripts/                    # Utility scripts
    ├── integrate-skill-logging.js # Skill logging integration
    └── count-tokens.js         # Token counting utility
```

## Key Locations

| What | Where |
|------|-------|
| CLI entry point | `bin/install.js` |
| Converter logic | `bin/lib/converters/*.js` |
| Installer logic | `bin/lib/installers/*.js` |
| Shared utilities | `bin/lib/utils.js` |
| Platform definitions | `bin/lib/platforms.js` |
| Schema validation | `bin/lib/schema-validator.js` |
| Audit trail | `bin/lib/audit-trail.js` |
| Health checking | `bin/lib/health-checker.js` |
| Parallel dispatch | `bin/lib/parallel-dispatch.js` |
| Skill definitions | `commands/pd/*.md` |
| Workflow implementations | `workflows/*.md` |
| Planning templates | `templates/*.md` |
| Reference docs | `references/*.md` |
| Tests | `test/smoke-*.test.js`, `test/*.test.js` |
| Evals | `evals/` |
| GSD workflows | `.claude/get-shit-done/workflows/` |

## Naming Conventions

### Files
- **Skills/Commands:** kebab-case `.md` files in `commands/pd/` (e.g., `write-code.md`, `fix-bug.md`)
- **Workflows:** matching kebab-case `.md` in `workflows/` (same name as command)
- **Converters/Installers:** platform name `.js` (e.g., `codex.js`, `gemini.js`)
- **Tests:** `smoke-{area}.test.js` or `{module}.test.js` pattern
- **Templates:** kebab-case `.md` (e.g., `current-milestone.md`)
- **Library files:** kebab-case `.js` in `bin/lib/` (e.g., `audit-trail.js`, `scope-checker.js`)

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
| New test | `test/smoke-{area}.test.js` or `test/{module}.test.js` | Use `node:test` + `node:assert/strict` |
| New eval | `evals/` | Follow existing eval runner pattern |
| New library module | `bin/lib/{name}.js` | Export functions via `module.exports` |
| GSD workflow | `.claude/get-shit-done/workflows/{name}.md` | Follow GSD workflow format |
| GSD agent | `.claude/agents/{name}.md` | Follow agent definition format |

## Special Directories

**.planning/codebase/:**
- Purpose: Contains codebase intelligence documents
- Generated: Yes, by `/gsd:map-codebase`
- Committed: Yes, tracked in git
- Files: STACK.md, INTEGRATIONS.md, ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md

**.claude/get-shit-done/workflows/:**
- Purpose: GSD orchestrator workflows
- Generated: No, source files
- Committed: Yes
- Used by: GSD commands

**bin/lib/:**
- Purpose: Core library modules
- Contains: 80+ utility and feature modules
- Pattern: Each module focused on single responsibility
- Tests: Co-located `.test.js` files

**test/:**
- Purpose: Test suite
- Contains: 50+ test files
- Framework: Node.js built-in `node:test`
- Pattern: Smoke tests and integration tests

---

*Structure analysis: 2026-04-07*
