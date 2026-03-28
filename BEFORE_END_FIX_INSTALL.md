# Installer V2 Overhaul Plan (Multi-Platform + Visual UX)

This document replaces the previous plan, focusing on implementing a modern installer with:

- Pragmatic multi-platform support (CLI + IDE)
- Simple installation, minimal questions, clear status
- Highly visual terminal experience (wizard, progress, summary)
- Post-install verification and safe self-healing capability

## 1) Product Goals

### 1.1 Primary Goals

1. New users complete setup in under 60 seconds using the default flow.
2. Support local-first installation for IDEs to see immediate results in the project.
3. Sync skills, rules, agents, MCP per platform without manual actions.
4. Provide post-install verification to reduce "installed but doesn't work" cases.

### 1.2 Technical Goals

1. Split installer into a clear pipeline, extensible with additional platform adapters.
2. Standardize logging, progress, warnings, exit codes.
3. Separate converter/minifier/post-install for independent testing.
4. Ensure idempotency: running install multiple times doesn't create duplicate artifacts.

### 1.3 Out of Scope (this cycle)

1. No changes to the business logic of the entire skills suite.
2. No full refactor of old converters unless they directly impact Installer V2.
3. No merging of roadmap changes outside the installation and UX setup topic.

## 2) Current State and Gaps to Close

### 2.1 Current State

1. Core installer per runtime already exists.
2. Basic local/global mode already exists.
3. Basic color and step logging in terminal already exists.
4. Installers for Claude/Codex/Gemini/OpenCode/Copilot already exist.
5. Smoke tests for legacy runtimes already exist.

### 2.2 Key Gaps

1. Cursor/Windsurf runtimes appear in the registry but don't have complete installer adapters.
2. No VS Code support via dedicated IDE profile setup.
3. No clear Antigravity branch (path, config merge policy, dedicated smoke test).
4. No minification pipeline for rules/references.
5. No unified verification step after install.
6. Interactive experience is still linear, not visual enough (no real progress bar or summary table).

## 3) Installer V2 Design Principles

1. Local-first for IDEs, global-first for CLI runtimes.
2. A single setup command that completes end-to-end without requiring users to read excessive docs.
3. Errors must include a specific fix suggestion.
4. Every step has a status: running/success/warn/fail.
5. Every new integration must have a smoke test before being enabled in the default list.

## 4) Target Platform Matrix

### 4.1 GA Group (enabled by default in interactive)

1. Claude Code
2. Codex CLI
3. Gemini CLI
4. OpenCode
5. GitHub Copilot

### 4.2 Beta Group (shows Beta label in interactive)

1. Cursor
2. Windsurf
3. VS Code setup profile

### 4.3 Experimental Group

1. Antigravity (extended branch of Gemini)

## 5) New CLI Experience

### 5.1 Proposed Flags

1. `node bin/install.js --target <runtime|ide>`
2. `node bin/install.js --ide <cursor|vscode|windsurf>`
3. `node bin/install.js --scope <local|global>`
4. `node bin/install.js --all`
5. `node bin/install.js --quick` (runs with smart defaults)
6. `node bin/install.js --verify-only`
7. `node bin/install.js --doctor`
8. `node bin/install.js --uninstall`

### 5.2 Minimal Interactive Flow (default)

1. Choose environment: CLI or IDE.
2. Choose specific platform (or all).
3. Choose scope local/global (pre-selected by environment).
4. Confirm once and run the pipeline.

### 5.3 Smart Default Rules

1. If IDE is selected without a scope, default to local.
2. If CLI is selected without a scope, default to global.
3. If not TTY, run quick mode safely with Claude global (or the specified target).

## 6) Installation Pipeline Architecture

Unified pipeline for all runtimes:

1. Resolve target + preflight check.
2. Convert/build artifacts (skills, rules, agents, minified docs if enabled).
3. Run installer adapter per platform.
4. Merge config (MCP, instructions, settings).
5. Verify + generate report.
6. Persist manifest + patch backup.

Each step needs:

1. `id`
2. `title`
3. `durationMs`
4. `status`
5. `warnings[]`
6. `fixHints[]`

## 7) Terminal UX Design (Visual Setup)

### 7.1 Display Components

1. Header box: version name, mode, target, scope.
2. Overall progress bar by percentage.
3. Spinner for current step.
4. Status line colored by severity:

- green: success
- yellow: warning
- red: fail
- cyan: info

5. End summary table:

- installed
- updated
- skipped
- warnings
- failed

### 7.2 Log Conventions for Quick Reading

1. One title line per step.
2. No long stack traces unless `--debug` is used.
3. Each error must have at least one fix suggestion.

### 7.3 Suggested Libraries

1. `chalk`
2. `cli-progress`
3. `ora`
4. `boxen` (optional)

## 8) Per-Platform Adapter Design

### 8.1 Cursor Adapter

1. Create/update `.cursorrules` using block markers managed by the installer.
2. Sync required rules into the instruction profile.
3. Merge MCP config via the corresponding Cursor config file.
4. Support clean uninstall by marker, not destroying user content outside markers.

### 8.2 VS Code Adapter

1. Create/update `.vscode/settings.json` for custom instruction profile.
2. Create/update internal instruction file in the project (if needed).
3. Merge MCP config if the platform uses a compatible configuration.
4. Clearly separate installer-managed data using a marker key.

### 8.3 Windsurf Adapter

1. Similar model to Cursor with its own path and config schema.
2. Has a tool/config mapping layer to avoid hardcoded duplication.

### 8.4 Gemini + Antigravity

1. Keep Gemini installer as base.
2. Separate Antigravity mode:

- Path: `~/.gemini/antigravity/commands/pd/`
- Separate settings merge policy
- Separate smoke test

3. Don't mix path logic to avoid writing to the wrong environment.

## 9) Sync Rules + Agent Squad + Minification

### 9.1 Sync Rules

1. Selectively copy core rules to where the IDE can read them.
2. Apply path/tool replacement per runtime map.
3. Ensure no `~/.claude/` path leaks on other runtimes.

### 9.2 Agent Squad

1. Sync `commands/pd/agents/` directory to the corresponding runtime destination.
2. Register or expose agents per each platform's standard.
3. Verify existence after installation in the verification report.

### 9.3 Minification

1. Create module `bin/lib/converters/minifier.js`.
2. Output `*.min.md` for rules/references per configuration.
3. Compression strategy:

- remove duplicate examples
- remove decorative parts that don't affect behavior
- preserve mandatory requirements and guards

4. Has toggle flag: `--minify on|off|auto`.

## 10) Post-install Verification (mandatory for interactive)

### 10.1 Minimum Check Suite

1. Verify destination files exist at the correct path.
2. Verify merged config parses correctly.
3. Verify skills discoverability (at least 1 sample command).
4. Verify agents/rules are fully copied.
5. Verify manifest is written.

### 10.2 Verification Results

1. PASS: all required checks pass.
2. WARN: runs but has suboptimal items.
3. FAIL: cannot be used after installation.

### 10.3 Report Output

1. Print terminal summary.
2. Write JSON report file (optional) for CI debugging.

## 11) Self-Healing (safe, no user data destruction)

### 11.1 Scope for This Cycle

1. Only fix files managed by the installer (per marker/manifest).
2. Don't arbitrarily fix custom documents outside markers.

### 11.2 Mechanism

1. If old config has wrong schema but is recoverable, migrate it.
2. If migration fails, backup old file, create new standard file.
3. Always log a warning and the backup path.

## 12) Phase-Based Implementation Plan

### Phase A: Core CLI + UX Shell

1. Standardize arg parser V2.
2. Create progress/state framework for the installer pipeline.
3. Upgrade logging to visual wizard format.
4. Add summary table and standard exit codes.

### Phase B: IDE Adapters (Cursor, VS Code, Windsurf)

1. Create installer modules for each IDE.
2. Merge instructions/config by marker.
3. Add corresponding uninstall.

### Phase C: Gemini Antigravity

1. Add Antigravity mode/path.
2. Separate converter/config merge policy if needed.
3. Add verify and uninstall for the new mode.

### Phase D: Minification + Agent Rollout

1. Create minifier module.
2. Add build-minify pipeline before install.
3. Roll out agents for all adapters.

### Phase E: Verification + Doctor

1. Create `bin/lib/post-install.js`.
2. Integrate `--verify-only` and `--doctor`.
3. Standardize report and warning hints.

### Phase F: Hardening + Docs + Release

1. Add full test matrix.
2. Update README/INTRODUCTION/INTEGRATION_GUIDE.
3. Run installation time and stability benchmarks.

## 13) Testing Plan

### 13.1 Unit Tests

1. Flag parser.
2. Minifier deterministic output.
3. Config merger by marker.
4. Verification checks.

### 13.2 Smoke Tests

1. Install/uninstall per platform.
2. Idempotency (run install twice).
3. No path leaks to other runtimes.
4. Local and global modes both pass.

### 13.3 Golden Tests for UX Output

1. Snapshot of summary table.
2. Snapshot of errors with fix hints.

## 14) Acceptance Criteria

1. GA runtime installs successfully with `--quick` without interaction.
2. IDE beta runtime has a stable local-first flow.
3. Verification report returns PASS/WARN/FAIL accurately per status.
4. No duplicate artifacts when reinstalling.
5. Uninstall cleans up everything managed by the installer.
6. Documentation with full instructions for new commands.

## 15) Risks and Mitigations

1. Risk of IDE config schema changes:

- Mitigation: adapter separates parser/merger layer, has fallback backup.

2. Risk of minification losing semantics:

- Mitigation: run diff guard + behavioral sample tests before publishing.

3. Risk of interactive flow being too long:

- Mitigation: quick mode by default, only ask 3 core questions.

4. Risk of environment incompatibility:

- Mitigation: doctor mode + clear fix hints.

## 16) File-Level Implementation Map (Proposed)

1. `bin/install.js`

- Arg parser V2, interactive wizard, progress orchestration.

2. `bin/lib/platforms.js`

- Standardize metadata support level (ga/beta/experimental).

3. `bin/lib/installers/cursor.js`

- Cursor adapter.

4. `bin/lib/installers/vscode.js`

- VS Code profile adapter.

5. `bin/lib/installers/windsurf.js`

- Windsurf adapter.

6. `bin/lib/installers/gemini.js`

- Add Antigravity mode.

7. `bin/lib/converters/minifier.js`

- Build `*.min.md` output.

8. `bin/lib/post-install.js`

- Verification + doctor checks.

9. `test/smoke-installers.test.js`

- Extend test matrix for new runtimes.

10. `test/smoke-install-ux.test.js`

- Snapshot output for visual flow.

## 17) Definition of Done (DoD)

1. All acceptance criteria completed.
2. CI tests pass for installer-related tests.
3. Release note clearly states runtime support levels.
4. Migration note for users transitioning from old to new commands.
5. Rollback plan in case beta adapters encounter errors.

## 18) Rollout Roadmap

1. Release 1:

- Core UX + verify-only + doctor + GA runtime hardening.

2. Release 2:

- Cursor/Windsurf/VS Code beta.

3. Release 3:

- Antigravity experimental + minify pipeline default auto.

## 19) Suggested Commands After V2 Completion

1. Quick install for new users:

- `node bin/install.js --quick`

2. IDE local-first install:

- `node bin/install.js --ide cursor --scope local`

3. Post-install verification only:

- `node bin/install.js --verify-only`

4. Environment diagnostics:

- `node bin/install.js --doctor`

---

Note: The focus of V2 is "easy-to-understand setup, look at the terminal and know what's happening, done and ready to use immediately". All technical decisions should prioritize this principle first.
