---
status: resolved
trigger: "Gemini CLI doesn't recognize /pd commands - says command not found"
created: 2026-03-23T10:15:00+07:00
updated: 2026-03-23T10:15:00+07:00
---

## Current Focus

hypothesis: CONFIRMED - Gemini CLI requires .toml format, installer was writing .md
test: All 345 automated tests pass. Need human verification in Gemini CLI.
expecting: /pd:scan and other /pd:* commands should now be recognized after re-running installer
next_action: User re-runs `npx please-done --gemini` and tests /pd:scan in Gemini CLI

## Symptoms

expected: Skills should run in Gemini CLI - user types /pd:scan and the skill executes
actual: Gemini CLI reports "command not found" for /pd commands
errors: Command not found for /pd commands
reproduction: User types /pd:scan or any /pd:* command in Gemini CLI
started: Never worked - first attempt to use skills in Gemini CLI

## Eliminated

## Evidence

- timestamp: 2026-03-23T10:15:00+07:00
  checked: ~/.gemini/commands/gsd/ directory (working GSD commands)
  found: All GSD commands use .toml extension (health.toml, execute-phase.toml, help.toml, etc.)
  implication: Gemini CLI requires .toml format for custom commands to be recognized

- timestamp: 2026-03-23T10:16:00+07:00
  checked: ~/.gemini/commands/pd/ directory (broken PD commands)
  found: All PD commands use .md extension (scan.md, init.md, plan.md, etc.) — 13 .md files
  implication: The installer writes .md files but Gemini CLI only reads .toml files

- timestamp: 2026-03-23T10:17:00+07:00
  checked: Gemini CLI official docs and GitHub issues
  found: Custom commands MUST use .toml format. GitHub issue #15535 requests .md support but NOT implemented. FileCommandLoader.ts only scans for **/*.toml
  implication: .md files are invisible to Gemini CLI command loader

- timestamp: 2026-03-23T10:18:00+07:00
  checked: bin/lib/installers/gemini.js line 44
  found: `fs.writeFileSync(path.join(commandsDir, '${skill.name}.md'), converted, 'utf8')` — writes .md extension
  implication: Installer bug — writes wrong file extension

- timestamp: 2026-03-23T10:19:00+07:00
  checked: bin/lib/converters/gemini.js and base.js
  found: Converter outputs YAML frontmatter + markdown body format. Gemini TOML format uses `description = "..."` and `prompt = "..."` keys. These are fundamentally different formats.
  implication: Not just a file extension issue — the CONTENT format is also wrong. Need to convert from YAML frontmatter + markdown body to TOML with description + prompt keys.

- timestamp: 2026-03-23T10:20:00+07:00
  checked: platforms.js gemini config
  found: `skillFormat: 'nested'` and `frontmatterFormat: 'yaml'` — configured as if Gemini uses same format as Claude Code
  implication: Platform config is wrong — Gemini uses TOML format, not YAML frontmatter

- timestamp: 2026-03-23T10:21:00+07:00
  checked: Gemini CLI version
  found: v0.34.0 (latest stable as of 2026-03-17)
  implication: No markdown command support exists in current version

## Resolution

root_cause: The Gemini CLI installer writes commands as .md files with YAML frontmatter format, but Gemini CLI requires .toml files with `description` and `prompt` keys. The converter (converters/gemini.js) processes content but keeps markdown format. The installer (installers/gemini.js) saves with .md extension. Both the file format AND extension are wrong. Working GSD commands in ~/.gemini/commands/gsd/ use correct .toml format as reference.
fix: |
  1. converters/gemini.js: Rewrote to output TOML format (description + prompt keys) instead of markdown with YAML frontmatter. Added escapeTomlString() for proper TOML string encoding (escape \, ", newlines, tabs).
  2. installers/gemini.js: Changed file extension from .md to .toml. Updated cleanup to remove both old .md and .toml files for idempotency.
  3. platforms.js: Updated Gemini config frontmatterFormat from 'yaml' to 'toml'.
  4. Updated tests in smoke-converters.test.js, smoke-installers.test.js, smoke-all-platforms.test.js, smoke-integrity.test.js to validate TOML output format.
verification: 345 automated tests pass (0 failures). Converter outputs correct TOML format matching GSD command structure. Installer creates .toml files. Awaiting user re-install + Gemini CLI verification.
files_changed:
  - bin/lib/converters/gemini.js
  - bin/lib/installers/gemini.js
  - bin/lib/platforms.js
  - test/smoke-converters.test.js
  - test/smoke-installers.test.js
  - test/smoke-all-platforms.test.js
  - test/smoke-integrity.test.js
