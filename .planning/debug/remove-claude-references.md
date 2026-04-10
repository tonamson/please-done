---
status: awaiting_human_verify
trigger: "Skills repo chứa references đến claude / Claude ở nhiều chỗ — cần thay thế bằng ngôn ngữ AI-agnostic"
created: 2025-01-14T10:00:00Z
updated: 2025-01-14T10:15:00Z
---

## Current Focus

hypothesis: Confirmed — generic "Claude" references needed replacement with AI-agnostic language
test: Run npm test to verify no regressions
expecting: All converter tests pass, only pre-existing failures remain
next_action: Request human verification

## Symptoms

expected: Không có references nào đến "claude" / "Claude" theo nghĩa generic — chỉ có platform-specific paths/names
actual: Nhiều chỗ trong converters dùng "Claude format" thay vì "pd format" hoặc "source format"
errors: Không có error — naming/branding issue
reproduction: grep -ri "claude" commands/pd/ bin/lib/ -- thấy nhiều kết quả
started: Đã tồn tại từ trước

## Eliminated

## Evidence

- timestamp: 2025-01-14T10:00:00Z
  checked: grep results in scope (commands/pd/, bin/lib/converters/, bin/lib/installers/, bin/lib/platforms.js)
  found: ~50 matches total
  implication: Cần phân loại từng match

- timestamp: 2025-01-14T10:05:00Z
  checked: Full review of all matches
  found: |
    **NEEDS FIX (generic "Claude" usage):**
    1. converters/opencode.js:2 — "Claude Code -> OpenCode" → "PD Skills (Claude Code format) -> OpenCode"
    2. converters/opencode.js:15 — "Claude format" → "source format" hoặc "pd format"
    3. converters/codex.js:1 — "Claude Code -> Codex" → "PD Skills (Claude Code format) -> Codex"
    4. converters/codex.js:13 — "teaches Codex how to map Claude concepts" → "teaches Codex how to map source skill concepts"
    5. converters/codex.js:43 — "from Claude format to Codex" → "from source format to Codex"
    6. converters/gemini.js:1 — "Claude Code -> Gemini" → "PD Skills (Claude Code format) -> Gemini"
    7. converters/gemini.js:43 — "Claude format sang Gemini" → "source format sang Gemini"
    8. converters/gemini.js:94 — "same as Claude" → "same as Claude Code" (clarify it's runtime name)
    9. converters/copilot.js:1 — "Claude Code -> GitHub Copilot" → "PD Skills (Claude Code format) -> GitHub Copilot"
    10. converters/copilot.js:17 — "Claude format sang Copilot" → "source format sang Copilot"
    11. converters/base.js:24-25 — "~/.claude/" và "claudeName" → document-level OK, internal usage
    12. converters/base.js:64 — variable name "claude" in loop → OK, it's iterating toolMap
    13. update.md:135 — "Restart Claude Code" → "Restart your AI assistant"
    14. platforms.js:39-44 — comments "uses Claude native tool names" → "uses source tool names" or "uses standard tool names"
    
    **KEEP (platform-specific, correct usage):**
    - All paths in installers: ~/.claude/, claude mcp add, etc. — these are Claude Code runtime paths
    - platforms.js:49-58 — claude platform definition — correct
    - platforms.js:189-190 — claude case in switch — correct
    - converters/base.js:48 — runtime !== 'claude' — correct check
    - update.md:31 — "(Claude Code: `~/.claude/...` -- other platforms are mapped)" — platform-specific note, OK
    - update.md:112,133,159 — ~/.claude/cache/ — platform-specific path for cache cleanup, but this runs on Claude only
    - rules/general.md:62 — "(Claude Code ONLY — other platforms skip)" — clarifying it's Claude-specific, OK
  implication: 14 items need fixing, mostly converter comments and 1 skill file line

## Resolution

root_cause: Converters and some skill files used "Claude" generically when referring to "source format" or "the AI assistant"
fix: |
  Replaced generic references:
  - "Claude Code -> X" → "PD Skills (source format) -> X" in converter file headers
  - "Claude format" → "source format" in JSDoc comments
  - "Claude concepts" → "source skill concepts"
  - "Restart Claude Code" → "Restart your AI assistant" in update.md
  - "uses Claude native tool names" → "uses source tool names (no mapping needed)"
  - "claudeName" → "sourceName" in base.js variable names
verification: npm test passed — all converter tests pass, only pre-existing STATE.md integration test failures remain
files_changed:
  - bin/lib/converters/opencode.js
  - bin/lib/converters/codex.js
  - bin/lib/converters/gemini.js
  - bin/lib/converters/copilot.js
  - bin/lib/converters/base.js
  - bin/lib/platforms.js
  - commands/pd/update.md
