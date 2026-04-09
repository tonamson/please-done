---
status: awaiting_human_verify
trigger: "Opencode không nhận diện lệnh /pd: — skills của pd không xuất hiện sau khi restart terminal"
created: 2025-01-13T10:40:00Z
updated: 2025-01-13T10:46:00Z
---

## Current Focus

hypothesis: CONFIRMED - installer writes to ~/.config/opencode/ but OpenCode reads from ~/.opencode/
test: verified both directories exist with different content
expecting: skills should be in ~/.opencode/commands/pd/ but they're in ~/.config/opencode/command/
next_action: fix platforms.js getGlobalDir to use ~/.opencode/ for opencode runtime

## Symptoms

expected: Lệnh /pd: được nhận diện trong opencode và hiện ra danh sách skills
actual: Command not found — không có skill nào xuất hiện khi gõ /pd: trong opencode
errors: Command not recognized / no skills found
reproduction: Mở opencode, gõ /pd: — không thấy skill nào
started: Đã install rồi, sau khi tắt terminal khởi động lại thì không còn hoạt động

## Eliminated

## Evidence

- timestamp: 2025-01-13T10:40:00Z
  checked: ~/.opencode/ directory existence
  found: Directory exists with commands/ subfolder
  implication: opencode is installed, need to check if pd/ is inside commands/

- timestamp: 2025-01-13T10:42:00Z
  checked: ~/.opencode/commands/pd/ content
  found: Only contains AGENTS.md (from sync-instructions.js), no skill .md files
  implication: Skills not installed to this location

- timestamp: 2025-01-13T10:43:00Z
  checked: platforms.js getGlobalDir for opencode
  found: Returns ~/.config/opencode/ (XDG spec), NOT ~/.opencode/
  implication: Installer writes to wrong directory

- timestamp: 2025-01-13T10:44:00Z
  checked: ~/.config/opencode/command/ content
  found: 96 files including pd-*.md and gsd-*.md skills - all installed correctly
  implication: Skills ARE installed but to the wrong location

- timestamp: 2025-01-13T10:45:00Z
  checked: OpenCode binary location
  found: /root/.opencode/bin/opencode v1.4.1
  implication: OpenCode uses ~/.opencode/ as config root, NOT ~/.config/opencode/

## Resolution

root_cause: platforms.js getGlobalDir() returns ~/.config/opencode/ (XDG spec) but OpenCode v1.4.1 actually uses ~/.opencode/ as its config directory. Additionally, installer used "command/" (singular) but OpenCode expects "commands/" (plural). Skills were installed to wrong directory.
fix: Updated platforms.js to return ~/.opencode/ for opencode runtime. Updated opencode.js installer to use "commands/" instead of "command/". Re-ran installer to install 28 pd-* skills to ~/.opencode/commands/
verification: ls ~/.opencode/commands/pd-*.md shows 28 files installed correctly
files_changed: [bin/lib/platforms.js, bin/lib/installers/opencode.js, bin/install.js]
