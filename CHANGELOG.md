# Skills Changelog

All notable changes from v3.0 through v12.0 are documented below. For even earlier versions (pre-v2.8.0), see the frozen section at the bottom.

## [12.0] - 2026-04-06
### Added
- **PTES-Compliant Reconnaissance**: Full PTES (Penetration Testing Execution Standard) workflow with 4-tier architecture (FREE/STANDARD/DEEP/RED TEAM)
- **Intelligence Gathering Core**: source-mapper.js, target-enumerator.js, service-discovery.js, asset-discoverer.js, auth-analyzer.js, workflow-mapper.js, taint-engine.js
- **OSINT Intelligence**: google-dorks.js, ct-scanner.js, secret-detector.js, subdomain-osint.js, osint-aggregator.js
- **Payload Development**: payloads.js with WAF evasion, obfuscation, multi-layer encoding
- **Token Analysis**: token-analyzer.js for JWT, session cookies, and credential analysis
- **Post-Exploitation Planning**: post-exploit.js with web shell detection, persistence, exfiltration, lateral movement
- **5 Specialized Pentest Agents**: pd-recon-analyzer, pd-taint-tracker, pd-osint-intel, pd-payload-dev, pd-post-exploit
- **6 Data Files**: 5 wordlists + MITRE techniques mapping
- **Full Integration**: pd:audit --recon/--poc/--redteam workflows with >80% coverage

## [11.1] - 2026-04-04
### Added
- **Vietnamese Documentation**: Full Vietnamese translation of README, CLAUDE.md, cheat sheet, error troubleshooting
- **I18N Infrastructure**: Song ngữ Anh-Việt for all user-facing documentation

## [11.0] - 2026-04-04
### Added
- **Agent Error Logging (LOG-01)**: log-writer.js with structured JSONL, 16 skills wired
- **Status Dashboard (STATUS-01)**: read-only dashboard with auto-refresh and staleness detection
- **Auto-Onboarding (ONBOARD-01)**: pd:onboard with CONTEXT.md generation, 35 doc mappings
- **Lint Fail Recovery (LINT-01)**: progress-tracker.js with 3-strike threshold and soft guards
- **Staleness Detection (STALE-01)**: staleness-detector.js with 3-level detection
- **Integration Contract Tests (INTEG-01)**: schema validation foundation

## [10.0] - 2026-04-03
### Added
- **Skill Repo Audit Fixes**: 4 missing command docs (audit, conventions, onboard, status)
- **Vietnamese Commit Convention**: Replaced with English; fix-bug-v1.5.md archived
- **Error Handling**: Bare catch blocks replaced with PD_DEBUG conditional logging; process.exit(1) replaced with throw new Error()
- **Test Infrastructure**: smoke-onboard.test.js, smoke-error-handling.test.js with expanded coverage

## [9.0] - 2026-04-03
### Added
- **Bug Audit & Robustness**: Comprehensive bug tracking and resolution system

## [7.0] - 2026-04-02
### Added
- **Standalone Test Mode**: pd:test --standalone mode with conditional guards
- **State-Machine Sync**: new prerequisites row with side branch for standalone
- **what-next Integration**: detect standalone test reports and standalone bugs
- **Recovery Path**: detect interrupted standalone sessions, resume or rewrite

## [6.0] - 2026-03-28
### Added
- **Vietnamese → English Migration**: All 13 workflow files translated to English
- **Source Code Translation**: 33 JS source files translated, 12 test files synced

## [5.1] - 2026-03-27
### Added
- **Agent Consolidation**: 16 agents into commands/pd/agents/ as single source of truth
- **Symlink Architecture**: 16 symlinks in .claude/agents/
- **Reference Migration**: smoke-agent-files.test.js and fix-bug.md updated
- **Format Standardization**: legacy security agents converted to new YAML frontmatter
- **Registry Updates**: AGENT_REGISTRY 14→16, all smoke tests pass

## [5.0] - 2026-03-27
### Added
- **Agent Reform**: 6 new agents, 3-tier model system, platform-aware getAgentConfig()
- **Platform-Aware Mapping**: Config-driven tier→model per 7 platforms with automatic fallback
- **Parallel + Resource Guard**: Adaptive workers, heavy agent detection, backpressure, graceful degradation
- **Skill-Agent Integration**: pd-codebase-mapper auto-mapping, Research Squad integration
- **Reference Dedup**: verification-patterns.md + plan-checker.md merged → verification.md
- **Runtime DRY**: installer-utils.js with 6 shared utilities
- **Token Budget**: TOKEN_BUDGET per tier (4K/8K/12K), baseline 86,305 tokens

## [4.0] - 2026-03-27
### Added
- **OWASP Security Audit Pipeline**: smart scanner selection, session delta, POC/gadget chain analysis
- **Security Scanner Selection**: selectScanner() pure function with 12 signals, 3 base scanners
- **POC Pipeline**: gadget-chain.js with 7 chain templates, pd-sec-fixer agent
- **Template Agent**: pd-sec-scanner.md with 13 OWASP categories
- **Reporter Agent**: pd-sec-reporter.md for SECURITY_REPORT.md generation
- **FastCode MCP Integration**: tool-first, AI-last approach

## [3.0] - 2026-03-26
### Added
- **Research Squad System**: Evidence Collector (sonnet) + Fact Checker (opus)
- **Research Store**: research-store.js with 7 pure functions for structured evidence
- **Audit Modules**: confidence-scorer.js, audit-logger.js, index-generator.js
- **Workflow Guards**: CHECK-06 Research Backing, CHECK-07 Hedging Language, Strategy Injection
- **pd:research Command**: auto-detect internal/external, Evidence Collector → INDEX.md → Fact Checker

## [2.8.0] - 21_03_2026

## [2.8.0] - 21_03_2026
### Changed
- **Rules**: Reduced token cost -79% (262K → 55K characters) — removed 27 framework tutorial files, keeping only specific conventions. Framework knowledge looked up via Context7 MCP instead
- **Rules headings**: Translated English headings/labels in rules and documentation to Vietnamese
- **README.md**: Added "Convention System" section explaining why both Rules and CLAUDE.md are needed, guide for fork customization
- **INTEGRATION_GUIDE.md**: Rewritten to match new rules structure, translated to Vietnamese (Phase → Stage, Input/Output → Input/Output)
- **Workflows**: Updated init, scan, plan, write-code, fix-bug, test — removed references to deleted refs, using Context7

### Added
- **Skill `/pd:conventions`**: Scan project code, detect coding conventions, ask user, create project-specific CLAUDE.md (0 token cost — Claude Code auto-loads)
- **Eval tests**: 4 workflow tests + 2 trigger tests for conventions and rules optimization

## [2.7.3] - 21_03_2026
### Changed
- **security-checklist.md**: Added contextual security analysis framework (endpoint type, data sensitivity, auth type), context-based rules (PUBLIC/ADMIN/INTERNAL), advanced analysis (trust boundaries, idempotency, response minimization, secure-by-default, operational security, human error prevention), overall review before commit
- **write-code.md**: Integrated contextual security analysis into Steps 2/4/6.5b, added "Security Review" section to CODE_REPORT template, PLAN.md to commit list, STATE.md "Coding" lifecycle
- **plan.md**: Added Step 8.5 plan commit (protects PLAN.md + TASKS.md from loss on interruption), STATE.md Phase only updates when CURRENT_MILESTONE also changes (prevents desync during pre-plan)
- **test.md**: Auto-detect incomplete phases not yet tested after auto-advance
- **what-next.md**: Added scan for incomplete phases not yet tested + Priority 5.5 warning for untested phases
- **complete-milestone.md**: Check TEST_REPORT staleness (compare test date vs last [BUG] commit)
- **state-machine.md**: Updated auto-advance + test interaction flow, plan commit
- **templates/state.md**: Added "Coding" status + auto-advance sync

### Fixed
- **Codex converter**: Added mandatory fallback when `request_user_input` is unavailable — prevents flow breakage in skills that need user input

### Added
- **test/smoke-state-machine.test.js**: 60 test cases — full lifecycle, auto-advance, dependency logic (circular detection), version filtering (semver traps), crash recovery, what-next priority, SESSION lifecycle, re-plan, skip phases, DISCUSS_STATE, CURRENT_MILESTONE↔ROADMAP consistency, --auto boundary
- **test/smoke-all-platforms.test.js**: 36 test cases — Claude installer (symlinks, idempotency, uninstall), cross-platform 5 platforms (all skills/content/rules/leak/.pdconfig)
- **test/smoke-integrity.test.js**: 10 test cases — cross-file refs, workflow resolution, full-skill conversion
- **claude.js installSkillsOnly()**: Testable function extracted from Step 5, does not affect original install()

## [2.7.2] - 21_03_2026
### Fixed
- **Version sync**: Synchronized public version across repo from `2.7.1` to `2.7.2` in `VERSION`, `package.json`, `package-lock.json`, `README.md`
- **Release hygiene**: Fixed metadata mismatch between `package.json` and `package-lock.json` for more stable publish preparation

## [2.7.1] - 20_03_2026
### Changed
- **README.md**: Added badges (version, license, node, platforms), table of contents (TOC), "Additional Documentation" section (links to INTEGRATION_GUIDE, AUDIT_CHECKLIST, CHANGELOG), "License" section (MIT)
- **README.md**: Removed "Pass Rate" column from eval table, improved format for test skill descriptions and commit patterns
- **LICENSE**: Created MIT license file

## [2.7.0] - 19_03_2026
### Added
- **Semgrep auto-scan**: Automatic security vulnerability scanning (OWASP Top 10, injection, XSS, hardcoded secrets) every time AI writes/edits code
- **Semgrep MCP server**: AI can proactively call Semgrep to scan the entire project or check specific patterns
- **PostToolUse hook**: Hook `semgrep-scan.sh` runs after every Edit/Write for code files (.ts, .js, .py, .sol, .php...) — alerts immediately if vulnerabilities found
- **4th security layer**: Added Semgrep to the defense-in-depth model (platform deny → skill rules → .gitignore → semgrep scan)

### Changed
- **README.md**: Added Semgrep to MCP servers table, Semgrep MCP local setup guide (CLI + MCP + hook), updated 4-layer security model

## [2.6.2] - 19_03_2026
### Changed
- **Rename**: `backend.md` → `nestjs.md`, `frontend.md` → `nextjs.md` — synchronized naming convention with [stack]-refs/
- **nestjs-refs/**: 5 reference docs (authentication, database-patterns, testing, swagger, error-handling)
- **nextjs-refs/**: 5 reference docs (server-components, authentication, seo-metadata, api-integration, zustand-patterns)
- **nestjs.md**: added `## Project Structure`, `## Security (REQUIRED)` (rate limiting, helmet, CORS, validation), `## Detailed Reference`
- **nextjs.md**: added `## Security (REQUIRED)` (XSS, token storage, env vars, form validation), `## Detailed Reference`
- **Detection flags**: `hasBackend` → `hasNestJS`, `hasFrontend` → `hasNextJS` (Express/Vite/React keep hasBackend/hasFrontend)
- **INTEGRATION_GUIDE.md**: updated ~34 anchor patterns to match current state
- **README.md**: fix test skill description missing Flutter, updated nestjs-refs/nextjs-refs descriptions

## [2.6.1] - 19_03_2026
### Fixed
- **test.md**: description + objective missing Flutter (only listed NestJS/WordPress/Solidity)
- **fix-bug.md**: Step 5 rules read list missing `flutter.md`
- **init.md**: "future stack" example still showed Flutter although already integrated (→ Laravel)

## [2.6.0] - 19_03_2026
### Added
- **Flutter stack support** — rules (`flutter.md`), 8 reference docs (`flutter-refs/`), detection, scan, plan, write-code, test, fix-bug
- Architecture: GetX (Logic + State + View + Binding), design tokens, Dio, manual fromJson/toJson
- Testing: flutter_test + mocktail (unit + widget tests)
- Detection: `pubspec.yaml` + Grep `flutter` | Fallback: `lib/main.dart`
- All 8 skill files + README + AUDIT_CHECKLIST updated for Flutter

## [2.5.1] - 19_03_2026
### Fixed
- **Solidity rules**: Added DoS attack vector rules (unbounded loops, batch fail-silently, call revert), FORBID `selfdestruct` (EIP-6780), custom errors gas optimization
- **Audit checklist**: Added section 9a DoS (5 checklist items + code examples), event emit order check, `selfdestruct` check, escape clause for array max 50
- **Templates**: Uncommented `OperatorUpdated` event declaration (Template 1a + Template 2 combo had compile error if forgotten)
- **Scan.md**: Added glob filter `(glob: "*.php")` for WordPress grep patterns, `(glob: "*.ts")` for NestJS patterns
- **FastCode failure handling**: Unified fallback Grep/Read + warning for plan.md, write-code.md, test.md (previously STOPPED completely)
- **Complete-milestone.md**: Added `## WordPress` section in MILESTONE_COMPLETE template
- **Test.md**: `## Database Verification` → `## Data Verification (Database/On-chain state)`. Steps 2 + 4 headings added "(NestJS flow ONLY)"
- **Write-code.md**: `If Backend task:` → `If Backend (NestJS) task:`. Security checklist added DoS, Flash Loan, Frontrunning/MEV, FORBID tx.origin
- **README.md**: Added `test/*.ts` for Hardhat test files. Copilot config `instructions.md` → `copilot-instructions.md`

## [2.5.0] - 19_03_2026
### Added
- **Solidity smart contract stack support**: Added `solidity.md` rules (coding standards, OpenZeppelin imports, SafeERC20, security modifiers, NatSpec, gas optimization, signature verification)
- **2 Solidity reference docs** (`solidity-refs/`): templates (base contract + signature verification pattern), audit-checklist (12 categories + pre-deploy checklist) — copied to `.planning/docs/solidity/` on init
- **Solidity detection**: `init.md` + `scan.md` detect via `hardhat.config.*`, `foundry.toml`, `contracts/**/*.sol`
- **Solidity test flow**: `test.md` supports Hardhat (ethers.js + chai) + Foundry (forge-std) alongside Jest/Supertest/PHPUnit
- **Solidity scan patterns**: `scan.md` scans contracts, OZ imports, interfaces, events, custom modifiers, security patterns
- **Solidity bug tracing**: `fix-bug.md` traces function call → require checks → state changes → external interactions → events
- **3 eval tests Solidity**: init detection, write-code rules compliance, Hardhat test flow
- **3 additional eval tests Solidity (audit)**: Foundry detection, scan Solidity patterns, fix-bug Solidity trace

### Changed
- `init.md`: Glob added `.sol` + exclude `artifacts/cache`. Detection patterns `hardhat.config.*`, `foundry.toml`, `contracts/**/*.sol`. Copy `solidity-refs/` → `.planning/docs/solidity/`. Notification box + rules list added solidity.md
- `scan.md`: Glob added `.sol`, new Solidity scan section (contracts, OZ imports, interfaces, events, modifiers, security patterns)
- `plan.md`: `<context>` reads `solidity.md` rules by stack
- `write-code.md`: Solidity task section (SPDX, pragma, OZ imports, clearUnknownToken, NatSpec, security checklist, compile/test commands). Test suggestions include Solidity
- `test.md`: New Hardhat + Foundry test flow (deploy, core function, access control, input validation, reentrancy, pause/unpause, clearUnknownToken)
- `fix-bug.md`: `<context>` + Step 5 + Step 7 include Solidity trace + audit checklist reference
- `what-next.md`: Priority 6 includes Solidity for test suggestion
- `complete-milestone.md`: TEST_REPORT check includes Solidity
- `general.md`: Code style notes "Solidity follows its own rules in solidity.md"

### Fixed
- `README.md`: Current version showed v2.4.0 → fixed to v2.5.0 (matches VERSION + package.json)
- `audit-checklist.md`: `safeApprove (or forceApprove)` → `forceApprove` (OZ v5 deprecated `safeApprove`)
- `scan.md`: Grep `event .*Event` → `^\s*event ` (old pattern missed events not ending with "Event" like Transfer, Approval)
- `solidity.md`: Missing indent convention (4 spaces) + file naming convention (PascalCase for .sol files) — added Code style section
- **Signature verification security overhaul** (3 files):
  - `solidity.md`: `block.chainid` + `address(this)` elevated from "Recommended" → **REQUIRED** (cross-chain replay is a real attack vector). Added `mapping(bytes32)` instead of `mapping(bytes)`, EIP-712 requirement when user signs via wallet
  - `templates.md`: Template 2 rewrite — hash includes chainid + address(this), changed `signatureUsed` → `hashUsed` (bytes32 key, cheaper gas + immune to malleability), renamed `OPERATOR` → `operator` (state variable must be camelCase), added EIP-712 guidance, updated diagram + NatSpec + checklist
  - `audit-checklist.md`: Section 6 split into 4 subsections (hash binding, verification logic, EIP-712, replay), added `block.chainid` + `address(this)` + `hashUsed` to required checklist
- **Audit round 3** — `templates.md`: snake_case → camelCase naming, Template 2 compatibility notes. `solidity.md`: NatSpec English exception explicit. `scan.md`: interface grep broadened. `plan.md`: Solidity/WordPress design sections
- **Audit round 4** (CRITICAL):
  - **4 non-Claude installers** (`codex.js`, `gemini.js`, `opencode.js`, `copilot.js`): `readdirSync().filter('.md')` missed subdirectories `solidity-refs/`, `wordpress-refs/` → added recursive copy
  - `test.md`: TEST_REPORT heading "Automated Results (Jest)" hardcoded → parameterized `[Jest|PHPUnit|Hardhat|Foundry]`
  - `what-next.md`: Step 3.5 said "Backend" → "Backend NestJS, WordPress, or Solidity" (matches Priority 6)
  - `scan.md`: Modifier grep `modifier ` too broad → `^\s*modifier\s+\w+`
  - `templates.md`: Template 1b constructor missing `require(addr != address(0))` for AccessControl
  - `solidity.md`: Added `forceApprove` (OZ v5) to Security section
  - 4 new eval tests: Solidity TEST_REPORT heading, what-next Solidity routing, mixed NestJS+Solidity init, WordPress TEST_REPORT heading. Total 56 workflow tests
- **Audit round 5**:
  - `scan.md`: SCAN_REPORT template missing "Solidity Analysis" section (Backend/Frontend/WordPress had one, Solidity didn't) → added section with Contracts, OZ Imports, Security Modifiers, Events
  - `test.md`: Description/objective hardcoded "Jest + Supertest for NestJS" → fixed to multi-framework (Jest + Supertest, PHPUnit, Hardhat/Foundry)
  - `codex.js` + `opencode.js`: Regex `/pd:([a-z0-9-]+)` missing underscore `_` → fixed to `[a-z0-9_-]+` (future-proofing for skill names with underscore)
  - 2 new eval tests: SCAN_REPORT Solidity section, Foundry test flow. Total 58 workflow tests
- **Audit round 6**:
  - `platforms.js`: Regex `/pd:([a-z0-9-]+)` missing underscore → `[a-z0-9_-]+` (matches codex/opencode fix from round 5)
  - `copilot.js` installer: Rules copy missing Write, Edit replacements → added 2 tool name replacements (matches converter COPILOT_TOOL_MAP)
  - `gemini.js` installer: Rules copy COMPLETELY MISSING tool name replacements → added Read→read_file, Write→write_file, Edit→edit_file, Bash→run_shell_command, Glob→glob, Grep→search_file_content
  - `scan.md`: SCAN_REPORT template heading hardcoded "(NestJS)"/"(NextJS)" → generic "Backend Analysis"/"Frontend Analysis"
  - `templates.md`: `clearUnknownToken` missing `nonReentrant` modifier (risk ERC777 reentrancy) → added for both Template 1a + 1b. Added `forceApprove` comment/example for both templates
  - `test.md`: Description hardcodes framework names → generic "(NestJS/WordPress/Solidity)"
  - `general.md`: Commit message format ambiguous when no git → added "(only when git exists)"
  - `promptfooconfig.yaml`: write-code Solidity test added assertions for forceApprove + clearUnknownToken nonReentrant

## [2.4.0] - 19_03_2026
### Added
- **WordPress stack support**: Added `wordpress.md` rules (coding standards, security, hooks, database, REST API, performance, i18n, enqueue assets)
- **9 WordPress reference docs** (`wordpress-refs/`): plugin-architecture, theme-development, gutenberg-blocks, woocommerce, security-hardening, database-migrations, wp-cli, multisite, testing — copied to `.planning/docs/wordpress/` on init
- **WordPress detection**: `init.md` + `scan.md` detect via `wp-config.php`, `wp-content/plugins/*/`, `wp-content/themes/*/style.css`
- **WordPress test flow**: `test.md` supports PHPUnit + `WP_UnitTestCase` alongside Jest/Supertest
- **WordPress scan patterns**: `scan.md` scans plugins, themes, custom tables (`dbDelta`/`$wpdb->prefix`), REST API (`register_rest_route`), hooks (`add_action`/`add_filter`)
- **WordPress bug tracing**: `fix-bug.md` traces hook/action → callback → $wpdb → output, checks sanitize/escape/nonce/capability/prepared statements
- **3 eval tests WordPress**: init detection, write-code rules compliance, PHPUnit test flow

### Changed
- `init.md`: Glob added `.php` + exclude `wp-includes/wp-admin` (avoid core WP files). `<context>` + Step 8 notification + `<rules>` security list all include WordPress
- `scan.md`: Glob added `.php`, Grep patterns use `|` (ripgrep syntax instead of `\|`), new WordPress scan section, `<rules>` security added `wp-config.php`
- `plan.md`: `<context>` reads `wordpress.md` rules by stack
- `write-code.md`: WordPress task section (ABSPATH check, docs lookup, Context7, `composer run lint`). Test suggestions: "NestJS or WordPress" instead of "NestJS only". Fallback lint: `composer run lint`
- `fix-bug.md`: `<context>` + Step 5 + Step 7 include WordPress
- `what-next.md`: Priority 6 includes WordPress for test suggestion
- `complete-milestone.md`: TEST_REPORT check includes WordPress
- `general.md`: Code style notes "(TS/JS) — PHP follows its own rules". Security added `wp-config.php`. Commit format added `[TRACKING]`
- `backend.md`: Decorator `@Roles` (fixed from `@Group/@Role`), RequestWithUser suggestion, MongoDB prefix `m` with example, new Middleware & Interceptor section, Soft delete 3 patterns (TypeORM/Mongoose/Prisma)
- `frontend.md`: Sub-components escape clause (>500 lines), new Error Handling & Loading section
- `README.md`: Rules table + `.planning/` tree include WordPress, tech stack table added WordPress row
- `promptfooconfig.yaml`: Glob patterns added `.php`, lint command synchronized, PHPUnit comment

### Fixed
- `wordpress.md`: `update_meta_cache` → `update_post_meta_cache` (correct WP_Query parameter)
- `wordpress.md`: `composer run phpcs` → `composer run lint` (matches testing.md reference)
- `init.md`: Glob missing `.php` → WordPress PHP-only project treated as "new project" (critical)
- `scan.md`: Grep `\|` → `|` (ripgrep syntax)
- `write-code.md`: 4 places referenced NestJS-only for test → fixed to include WordPress
- `promptfooconfig.yaml`: 6× glob missing `.php`, 1× old `composer phpcs`

## [2.3.0] - 19_03_2026
### Added
- **DISCUSS mode using AskUserQuestion**: `plan.md` rewritten with full DISCUSS mode — user selects using arrow keys instead of typing A/B/C. Supports multiSelect, single select, grouping for 5+ issues
- **Extended discussion loop (3.5.4)**: User can choose "Discuss more" after summary table → Claude presents new issues → loops until user is satisfied
- **DISCUSS hybrid table**: PLAN.md clearly distinguishes "User chose" vs "Claude decided" with supplementary notes for auto-decisions
- **Tracking commit**: `write-code.md` creates separate `[TRACKING]` commit when phase completes — separate from task code commits
- **7 new eval tests**: Rules-missing check, 3.5.4 loop, back/cancel keywords, hybrid table, tracking commit, bug report header, TEST_REPORT failures. Total 41 tests (100% pass)

### Changed
- `plan.md`: Step 4.5 expanded — covers 6 DISCUSS/AUTO cases (skip-all, cancel, partial, full, 0 issues)
- `plan.md`: Options language MUST be simple for non-developers, with good/bad examples
- `plan.md`: Handle "back"/"cancel" keywords via Other — return to previous issue or cancel discussion
- `init.md`: Check rules files when user keeps CONTEXT.md — warn if general.md is missing
- `init.md`: Fixed false positive NestJS detection — main.ts must contain `NestFactory` (avoids Vite/Angular confusion)
- `new-milestone.md`: Step 6 clearly distinguishes OVERWRITE vs APPEND behavior for ROADMAP
- `test.md`: Bug report header 2 lines matching fix-bug.md — `Status | Feature | Task` and `Patch version | Fix attempt`
- `test.md`: Update 🐛 status in BOTH places (table + detail block)
- `what-next.md`: Priority 6 separates "not tested" vs "test failed" — suggests /pd:fix-bug when TEST_REPORT has ❌
- `write-code.md`: --auto STOPS at original phase boundary (does NOT auto-jump to next phase even if CURRENT_MILESTONE advanced)
- `install.js`: Dedup runtimes when using --all + --claude together
- `install.js`: Banner word-wrapping for long platform names
- `claude.js`: Cleanup symlink before creating new (prevents EEXIST)
- `utils.js`: Null/undefined protection + truncate for banner lines

### Fixed
- 2 old eval tests failed due to missing scenario data → fixed: --auto phase boundary scenario clearer, what-next all-phases-done with complete TEST_REPORT

## [2.2.1] - 18_03_2026
### Changed
- `what-next.md`: Added mandatory Vietnamese output rule (previously didn't read general.md so lacked language rule)
- `update.md`: Similarly — added Vietnamese rule directly in `<rules>`
- `README.md`: Added multi-layer security guide for all 5 platforms (built-in rules + platform deny list + .gitignore)

## [2.2.0] - 18_03_2026
### Added
- **Eval suite (Promptfoo)**: Prompt quality evaluation suite following Anthropic best practices
- **32 workflow compliance tests**: Checks each skill follows correct process, branch logic, prerequisite handling
- **19 trigger accuracy tests**: Checks descriptions trigger the right skill (true positive, true negative, disambiguation)
- **Benchmark history**: Save JSON results + compare trends over time (`npm run eval:compare`)
- **Full eval pipeline**: `npm run eval:full` runs workflow + trigger + benchmark in 1 command
- **Skill classification**: Notes all 11 skills as "Encoded Preference" type in config

### Changed
- `write-code.md`: Improved description clarity — reduced false positive trigger for miscellaneous work (refactor, README)

## [2.1.0] - 18_03_2026
### Fixed
- **Codex `mergeCodexConfig` lost markers**: 2nd+ merge caused duplicate append because markers were stripped — now preserves markers for idempotency
- **`--config-dir` without value**: parseArgs crash with `undefined` when flag is last arg — added bounds check + error message
- **Gemini JSON silent parse failures**: Corrupted settings.json lost data silently — added `log.warn`

### Added
- **Complete npm scripts**: Added `install:opencode`, `install:copilot`, `uninstall:codex`, `uninstall:gemini`, `uninstall:opencode`, `uninstall:copilot`, `uninstall:all`

## [2.0.1] - 18_03_2026
### Changed
- **Skill rename**: `pd:roadmap` → `pd:new-milestone` — synchronized naming convention with `pd:complete-milestone`
- Updated references in: `init.md`, `plan.md`, `what-next.md`, `complete-milestone.md`, `README.md`, `claude.js` installer

## [2.0.0] - 18_03_2026
### Added
- **Cross-platform installer**: Supports 5 platforms — Claude Code, Codex CLI, Gemini CLI, OpenCode, GitHub Copilot
- `bin/install.js`: CLI installer with interactive mode, per-platform flags (`--claude`, `--codex`, `--gemini`, `--opencode`, `--copilot`, `--all`)
- Converters: transpile skills from Claude Code format to native format for each platform (tool names, command prefix, paths, frontmatter)
- Codex: XML skill adapter header (`<codex_skill_adapter>`), MCP config in `config.toml` (TOML)
- Gemini: tool name mapping (Read→read_file, Bash→run_shell_command), MCP config in `settings.json`
- OpenCode: flat command structure (`command/pd-*.md`), strip frontmatter fields
- Copilot: skill directories (`skills/pd-*/SKILL.md`), merge instructions into `copilot-instructions.md`
- SHA256 manifest tracking — detect + auto-backup user-modified files before re-install
- Leaked path scan — verify no `~/.claude/` in non-Claude platform output
- Integrated uninstall (`--uninstall`) — clean per platform, marker-based idempotent

### Changed
- `complete-milestone.md`: Added Step 8 to update `VERSION` and `package.json` on milestone completion
- `general.md`: Added security rule — when code uses a new env variable, MUST add key to `.env.example` with placeholder value

### Removed
- `install.sh` — replaced by `bin/install.js --claude`
- `uninstall.sh` — replaced by `bin/install.js --uninstall --claude`

## [1.2.2] - 18_03_2026
### Changed
- `complete-milestone.md`: Added Step 8 to update `VERSION` and `package.json` on milestone completion, git add version files in commit

## [1.2.1] - 18_03_2026
### Changed
- `general.md`: Added security rule — when code uses a new env variable, MUST add key to `.env.example` with placeholder value

## [1.2.0] - 18_03_2026
### Added
- **Transparency for AUTO mode**: `plan.md`, `roadmap.md` record all decisions Claude made (approach, reasoning, rejected alternatives) — user can review before coding
- **Strategic decisions in ROADMAP**: roadmap.md added mandatory section recording reasoning for milestone division, priority ordering
- **Standard format specs in `general.md`**: CURRENT_MILESTONE.md format, TASKS.md dependency format, phase/version numbering convention, icon matching patterns
- **Multi-stack detection**: `init.md`, `scan.md` detect Express, Vite, React generic beyond NestJS/NextJS; `test.md` supports notification + fallback for non-NestJS
- **Phase auto-advance**: `write-code.md` auto-advances CURRENT_MILESTONE to next phase when current phase completes
- **`--all` regression test**: `test.md` reads cross-phase context, determines patch version by milestone containing failed task
- **Task cross-phase lookup**: `test.md` finds task in other phases if not in current phase

### Changed
- `write-code.md`: Swapped Step 7/8 order — git commit BEFORE, mark ✅ AFTER (rollback if commit fails)
- `write-code.md`: Added stop when PLAN.md lacks info, circular dependency detection, lint/build retry limit (3 times), update `New project` flag after first task
- `write-code.md`: Parallel mode added empty wave guard, file conflict detection via `> Files:` field
- `plan.md`: Step 4.5 records decisions AFTER design (not before), added CURRENT_MILESTONE existence check, handles conflicting `--discuss --auto` flags
- `scan.md`: Rules delete only template files (keeps custom rules), added path validation for CONTEXT.md, explicit Step 6 guard for new projects
- `roadmap.md`: Added cleanup/backup on OVERWRITE, version conflict check on APPEND, mode-specific questions
- `fix-bug.md`: Added git commit after user confirms fix, Grep/Read fallback when FastCode fails, consistent patch version regex, retry suggestion after 3 attempts
- `test.md`: Shared code bug attribution, testPathPattern for current phase, 3-digit patch version convention
- `complete-milestone.md`: CODE_REPORT verify per-task per-phase (not cross-phase), CHANGELOG prepend, re-run guard, git tag check
- `what-next.md`: Read ROADMAP for priority 7, cross-check bugs vs tasks, renumbered priorities 1-8, TEST_REPORT content check
- `fetch-doc.md`: Version detection from package.json by library name, SPA content detection, clarified 10 filter → 5 fetch, HTTP error handling, monorepo version conflict
- `update.md`: Clear semver comparison, branch check before pull, submodule check, rollback by commit hash, CHANGELOG shows only new entries
- `init.md`: CONTEXT.md added `Updated:` line, monorepo path support, rules delete only template files
- Bug severity 4 levels unified between `fix-bug.md` and `test.md`
- TASKS.md update in BOTH places (table + detail block) consistent across all skills

## [1.1.2] - 18_03_2026
### Changed
- `complete-milestone.md`: Added suggestion to run `/pd:scan` after completing milestone to update architecture
- `update.md`: Delete cache status line (`pd-update-check.json`) after successful update — stops showing notification immediately
- `update.md`: Added mandatory rule to delete cache after update

## [1.1.1] - 18_03_2026
### Added
- New version notification on status line (bottom left) — `⬆ Skills v[x.x.x] — /pd:update`
- SessionStart hook (`pd-check-update.js`) — checks remote version on session start, caches for 10 minutes
- Integrated into statusline display

### Fixed
- Fix `update.md` Step 8: "Append" caused duplicate CURRENT_VERSION — changed to idempotent replacement
- Fix `what-next.md` context/rules: specified to use Bash for version check (previously said "only Read/Glob")
- Deleted orphaned `check-update.sh` (replaced by `pd-check-update.js`)

## [1.1.0] - 18_03_2026
### Added
- `/pd:update` — Check + update skills from GitHub, show changelog, suggest restart
- `/pd:plan --discuss` — Interactive discussion mode: list issues, user chooses to discuss, options A-E per issue
- `/pd:plan --auto` — Default mode, Claude decides all design
- Automatic version check — notification when new version available (once per conversation)
- `VERSION` + `CHANGELOG.md` — Version tracking system for the skills suite

### Changed
- `plan.md`: Supports 2 modes AUTO/DISCUSS, saves design decisions to PLAN.md "Design Decisions" section
- `plan.md`: DISCUSS flow supports back/cancel/change decision, validates invalid input
- `write-code.md`: Reads + follows "Design Decisions" section from PLAN.md (Step 2 + rules)
- `general.md`: Added automatic Skills version check section
- `what-next.md`: Added Step 6 version check (guard against duplicate check)
- `install.sh`: Shows version on install, lists `/pd:update`, preserves CURRENT_VERSION in .pdconfig

### Fixed
- Fixed XML structure across all 11 skills: balanced tags, removed extra `</output>`, consistent endings
- Fixed template comment `(ONLY create this section if DISCUSS mode)` inside code block — moved outside
- Fixed `install.sh` overwriting `.pdconfig` losing CURRENT_VERSION — preserve before overwrite
- Fixed `update.md` not handling LOCAL > REMOTE — added complete semver comparison (4 branches)
- Fixed `plan.md` DISCUSS flow missing error handling — added invalid input, back, cancel handling

## [1.0.0] - 18_03_2026
### Initial Release
- 10 skills suite: init, scan, roadmap, plan, fetch-doc, write-code, test, fix-bug, what-next, complete-milestone
- Rules: general.md, backend.md (NestJS), frontend.md (NextJS)
- FastCode MCP + Context7 MCP integration
- install.sh + uninstall.sh
