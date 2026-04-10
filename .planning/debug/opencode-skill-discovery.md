---
status: awaiting_human_verify
trigger: "After running `node bin/install.js --all opencode`, OpenCode cannot find/see the installed pd: skills."
created: 2025-01-14T10:50:00Z
updated: 2025-01-14T10:58:00Z
---

## Current Focus

hypothesis: CONFIRMED — VERSION file was outdated (12.3.0) when skills had changed. Bumping to 12.7.0 forced re-install.
test: User needs to verify OpenCode can now discover and use /pd-audit, /pd-init, etc.
expecting: OpenCode commands work with /pd-audit (dash), NOT /pd:audit (colon)
next_action: Await human verification of OpenCode command discovery

## Symptoms

expected: OpenCode displays pd: skills (e.g., /pd:init, /pd:audit) when user types /pd: in the command bar
actual: OpenCode reports "skills not found" — cannot discover any pd: skills
errors: No installer error — installer completes successfully with "Installation complete!"
reproduction: 1. Run `node bin/install.js --all opencode` from /home/please-done. 2. Open OpenCode. 3. Try /pd:init or /pd:audit → not found.
started: After v12.7 changes (restored audit.md). Worked in previous session after fixing path from ~/.config/opencode/ to ~/.opencode/ and command/ to commands/.

## Eliminated

## Evidence

- timestamp: 2025-01-14T10:50:00Z
  checked: ~/.opencode/commands/ directory listing
  found: 29 pd-*.md files present (pd-audit.md, pd-init.md, etc.) + pd/ subdirectory + rules files. Last modified Apr 9.
  implication: Skills ARE installed. Issue is either naming or OpenCode discovery mechanism.

- timestamp: 2025-01-14T10:50:00Z
  checked: bin/lib/converters/opencode.js (lines 39-42)
  found: flattenName() returns `pd-${skillName}` — so audit → pd-audit.md
  implication: Installer uses dash (-) not colon (:) in filename. Command = /pd-audit not /pd:audit

- timestamp: 2025-01-14T10:50:00Z
  checked: bin/lib/installers/opencode.js (line 89)
  found: log.info("Invoke with: /pd-init, /pd-write-code, /pd-plan ...") — confirms DASH syntax
  implication: Installer expects users to use /pd-init, /pd-audit (dash), not /pd:init (colon)

- timestamp: 2025-01-14T10:55:00Z
  checked: pd-file-manifest.json version vs git history
  found: |
    - Manifest version: 12.3.0 (installed Apr 9, 10:43)
    - VERSION file: 12.3.0 (bumped Apr 8)  
    - audit.md OWASP change: Apr 10 (commit db089d2)
    - Timeline: VERSION bump → install → audit.md change (NO VERSION BUMP AFTER)
  implication: ROOT CAUSE — audit.md changed AFTER v12.3.0 install, but VERSION was NOT bumped. Installer sees "12.3.0 == 12.3.0" → skips re-install. Installed files are STALE.

- timestamp: 2025-01-14T10:55:00Z
  checked: ~/.opencode/commands/pd-audit.md content
  found: Still has OLD "discussion context audit trail" content, NOT OWASP/PTES security audit
  implication: Confirms stale content — installer skipped updating because version matched

## Resolution

root_cause: Installer idempotent check compares VERSION file (12.3.0) with manifest version (12.3.0) and skips re-install when they match. But audit.md was changed AFTER the v12.3.0 install (Apr 10) without bumping VERSION. Result: installed skills are STALE, don't contain the OWASP/PTES security audit changes.
fix: Bumped VERSION from 12.3.0 to 12.7.0 to match the v12.7 tag and force re-install
verification: |
  1. Ran `node bin/install.js --opencode` — showed "Upgrading OpenCode from v12.3.0 → v12.7.0..."
  2. Verified pd-audit.md now has OWASP/PTES content (description: "OWASP/PTES security audit...")
  3. Manifest version updated to 12.7.0
  4. 20 skills installed successfully
files_changed: [VERSION]
