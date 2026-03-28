# Benchmark — Please Done
> Date: 2026-03-27
> Node: v24.13.0
> OS: darwin arm64

## 1. Installation Performance

Install to temp directory → measure time + generated files → uninstall → confirm clean.

| Platform | Install (ms) | Uninstall (ms) | Files | Lines | Path leak |
|----------|---------|---------|-------|------|-----------|
| Codex CLI | 59 | 18 | 24 | 5,483 | ✅ 0 |
| GitHub Copilot | 85 | 23 | 24 | 5,168 | ✅ 0 |
| Gemini CLI | 63 | 12 | 24 | 1,253 | ✅ 0 |
| OpenCode | 45 | 11 | 23 | 5,256 | ✅ 0 |

**Total**: 95 files, 17,160 lines generated for 4 platforms from a single source.

## 2. Idempotency (safe reinstall)

Install 2 consecutive times (v1 → v2): **4/4 platforms** created no extra files.

## 3. Smoke Tests

| Result | Count |
|---------|---------|
| ✅ Pass | ? |
| ❌ Fail | ? |
| ⏱ Duration | ?ms |

## 4. Workflow Structure Analysis

| Component | Count |
|-----------|---------|
| Skills (user-callable commands) | 14 |
| Workflows (detailed processes) | 13 |
| Total workflow steps | 111 |
| Verification gates (STOP/BLOCK) | 53 |
| Recovery points (interruption) | 38 |
| User interaction points | 34 |
| Templates (file templates) | 12 |
| References (general conventions) | 13 |
| Rules (stack-specific coding rules) | 8 |
| Total workflow lines | 3,623 |

## 5. Cross-Platform Capability

Written once in Claude Code format → installer auto-converts for each platform.

| Platform | Command syntax | Config path | Tool mapping |
|----------|----------|-----------------|-------------|
| Claude Code | `/pd:init` | `~/.claude/` | unchanged |
| Codex CLI | `$pd-init` | `~/.codex/` | unchanged |
| Gemini CLI | `/pd:init` | `~/.gemini/` | 9 tools |
| OpenCode | `/pd-init` | `~/.opencode/` | unchanged |
| GitHub Copilot | `/pd:init` | `~/.github/` | 9 tools |
| Cursor | `/pd:init` | `~/.cursor/` | unchanged |
| Windsurf | `/pd:init` | `~/.windsurf/` | unchanged |

## 6. Main Workflow

```
/pd:init          Initialize environment, detect tech stack
    ↓
/pd:scan          Scan project structure, security report
    ↓
/pd:new-milestone Strategic planning + requirements + roadmap
    ↓
/pd:plan          Technical design + split task list
    ↓
/pd:write-code    AI writes code per plan (auto/parallel)
    ↓
/pd:test          Automated testing (or manual for frontend)
    ↓
/pd:fix-bug       Scientific bug fixing methodology
    ↓
/pd:complete-milestone  Close version, create git tag, report
```

Each step has verification gates — AI cannot skip or unilaterally change approved designs.

---
*Benchmark run automatically by `node test/benchmark.js` — 2026-03-27T17:07:07.473Z*
