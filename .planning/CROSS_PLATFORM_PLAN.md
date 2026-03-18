# Kế hoạch Cross-Platform Skills
> Ngày: 18_03_2026
> Mô hình: Write Once (Claude Code) → Transpile at Install → Native per Platform
> Tham khảo: [GSD install.js](https://github.com/gsd-build/get-shit-done)

---

## Tổng quan kiến trúc

```
Source (Claude Code native)          Install-time Transpiler          Target Platforms
┌──────────────────────┐            ┌──────────────────┐            ┌─────────────────┐
│ commands/sk/*.md     │            │                  │──────────→ │ Claude Code     │
│ commands/sk/rules/*  │───────────→│  bin/install.js  │──────────→ │ Codex CLI       │
│ FastCode MCP config  │            │  (Node.js, 0 dep)│──────────→ │ Gemini CLI      │
│ VERSION, CHANGELOG   │            │                  │──────────→ │ OpenCode        │
└──────────────────────┘            └──────────────────┘──────────→ │ Copilot         │
                                                                    └─────────────────┘
```

**Nguyên tắc cốt lõi:**
- Source code skills CHỈ viết 1 lần bằng format Claude Code
- Installer đọc source → convert → copy vào đúng thư mục của từng platform
- Sau khi install, files là **native** — không cần runtime adapter
- Zero dependencies (chỉ dùng Node.js stdlib)

---

## Mapping giữa các Platform

### Tool Names
| Claude Code | Codex | Gemini CLI | OpenCode | Copilot |
|---|---|---|---|---|
| Read | Read | read_file | Read | read |
| Write | Write | write_file | Write | write |
| Edit | Edit | edit_file | Edit | edit |
| Bash | Bash | run_shell_command | Bash | execute |
| Glob | Glob | glob | Glob | glob |
| Grep | Grep | search_file_content | Grep | search |
| Agent (Task) | spawn_agent() | Task() | subagent mode | agent delegation |
| AskUserQuestion | request_user_input | AskUserQuestion | question | ask |
| mcp__*__ | mcp__*__ (auto) | auto-discovered | mcp__*__ | io.github.*/* |

### Command Invocation
| Claude Code | Codex | Gemini CLI | OpenCode | Copilot |
|---|---|---|---|---|
| `/sk:init` | `$sk-init` | `/sk:init` | `/sk-init` | `/sk:init` |

### Config Paths
| Claude Code | Codex | Gemini CLI | OpenCode | Copilot |
|---|---|---|---|---|
| `~/.claude/` | `~/.codex/` | `~/.gemini/` | `~/.config/opencode/` | `~/.copilot/` |

### Frontmatter Format
| Claude Code | Codex | Gemini CLI | OpenCode | Copilot |
|---|---|---|---|---|
| YAML | YAML (stripped) + XML adapter | YAML (tool names mapped) | YAML (modified) | YAML (tool names mapped) |

### MCP Config
| Claude Code | Codex | Gemini CLI | OpenCode | Copilot |
|---|---|---|---|---|
| settings.json `mcpServers` | config.toml `[mcp_servers.*]` | settings.json `mcpServers` | config riêng | settings.json |

---

## Giai đoạn thực hiện

### Giai đoạn 1: Cấu trúc dự án + CLI installer cơ bản
**Mục tiêu**: Tạo skeleton installer với CLI interface, platform detection, directory resolution

**Công việc:**
1. Tạo `bin/install.js` — CLI entry point
   - Parse args: `--global/-g`, `--local/-l`, `--claude`, `--codex`, `--gemini`, `--opencode`, `--copilot`, `--all`, `--uninstall/-u`, `--help/-h`
   - Interactive prompt chọn platform nếu không có flag
   - WSL detection + warning
2. Tạo `bin/lib/platforms.js` — Platform registry
   - `getDirName(runtime)` → tên thư mục config
   - `getGlobalDir(runtime)` → đường dẫn tuyệt đối config dir
   - `getCommandPrefix(runtime)` → prefix gọi skill (`/sk:`, `$sk-`, `/sk-`)
   - `getConfigPathSegment(runtime)` → path replacement mapping
3. Tạo `bin/lib/utils.js` — Tiện ích chung
   - `fileHash(path)` → SHA256
   - `parseYamlFrontmatter(content)` → parse/rebuild frontmatter
   - `copyWithPathReplacement(src, dest, runtime)` → copy + replace paths
4. Cập nhật `package.json` — Thêm `bin` entry, `files` array
5. Giữ nguyên `install.sh` cũ (cho đến khi installer mới hoàn chỉnh)

**Output**: `npx skills-cc --help` chạy được, hiện menu chọn platform

---

### Giai đoạn 2: Claude Code installer (thay thế install.sh)
**Mục tiêu**: Chuyển logic install.sh sang Node.js, đảm bảo tương đương 100%

**Công việc:**
1. `bin/lib/installers/claude.js`
   - Copy `commands/sk/*.md` → `~/.claude/commands/sk/` (symlink hoặc copy)
   - Copy `commands/sk/rules/*.md` → cùng vị trí
   - Generate `.skconfig` với SKILLS_DIR, FASTCODE_DIR, CURRENT_VERSION
2. MCP server registration
   - FastCode: `claude mcp add --scope user fastcode ...`
   - Context7: `claude mcp add --scope user context7 -- npx -y @upstash/context7-mcp@latest`
3. FastCode setup
   - Check git submodule, init nếu cần
   - Check Python 3.12+ + uv
   - Create venv, install requirements
   - Prompt Gemini API Key → write `.env` (interactive)
4. Write file manifest (`sk-file-manifest.json`)
5. Verify installation: đọc lại các file, check MCP status

**Output**: `npx skills-cc --claude` tương đương `./install.sh`

---

### Giai đoạn 3: Converter functions
**Mục tiêu**: Xây dựng các hàm chuyển đổi content từ Claude format sang từng platform

**Công việc:**
1. `bin/lib/converters/codex.js`
   - `convertToCodexSkill(content, skillName)` → YAML frontmatter stripped, thêm `<codex_skill_adapter>` XML
   - `generateCodexSkillAdapter(skillName)` → XML block map AskUserQuestion/Task
   - `convertToCodexAgent(content)` → `<codex_agent_role>` XML header
   - `generateAgentToml(name, content)` → per-agent `.toml` file
   - Path: `/sk:X` → `$sk-X`, `~/.claude/` → `~/.codex/`
2. `bin/lib/converters/gemini.js`
   - `convertToGemini(content)` → tool name mapping, escape `${VAR}`
   - `convertGeminiToolName(name)` → Read→read_file, Bash→run_shell_command...
   - Path: `~/.claude/` → `~/.gemini/`
3. `bin/lib/converters/opencode.js`
   - `convertToOpencode(content, isAgent)` → strip fields, add `model: inherit`
   - `convertOpencodeToolName(name)` → mapping
   - Path: `~/.claude/` → `~/.config/opencode/`
4. `bin/lib/converters/copilot.js`
   - `convertToCopilot(content)` → tool name mapping
   - `convertCopilotToolName(name)` → Read→read, Bash→execute...
   - Path: `~/.claude/` → `~/.copilot/` hoặc `.github/`
5. **Unit tests** cho từng converter (file `tests/converters.test.cjs`)

**Output**: Mỗi converter nhận Claude content → trả native content cho platform đó

---

### Giai đoạn 4: Platform installers (Codex, Gemini, OpenCode, Copilot)
**Mục tiêu**: Installer hoàn chỉnh cho từng platform

**Công việc:**
1. `bin/lib/installers/codex.js`
   - Convert commands → `~/.codex/skills/sk-*/SKILL.md`
   - Generate `config.toml` với MCP servers + agent configs
   - Idempotent merge (marker-based)
2. `bin/lib/installers/gemini.js`
   - Convert commands → `~/.gemini/commands/sk/*.md`
   - MCP config trong `settings.json` (same format as Claude)
3. `bin/lib/installers/opencode.js`
   - Convert commands → `~/.config/opencode/command/sk-*.md` (flat)
   - MCP config format riêng
4. `bin/lib/installers/copilot.js`
   - Convert commands → `~/.copilot/skills/sk-*/SKILL.md`
   - Merge instructions vào `copilot-instructions.md`
5. Mỗi installer phải:
   - Clean old files trước khi copy mới (idempotent)
   - Write manifest sau khi install
   - Handle existing user config (merge, không overwrite)

**Output**: `npx skills-cc --codex`, `--gemini`, `--opencode`, `--copilot` đều hoạt động

---

### Giai đoạn 5: Uninstall + Manifest tracking
**Mục tiêu**: Gỡ sạch theo platform, backup file user đã modify

**Công việc:**
1. `bin/lib/manifest.js`
   - `generateManifest(dir)` → `{ file: sha256hash }`
   - `writeManifest(configDir, runtime)` → ghi JSON
   - `saveLocalPatches(configDir)` → backup file user modified
   - `reportLocalPatches(configDir)` → thông báo file đã backup
2. Uninstall per platform
   - `--uninstall --claude` → remove commands, MCP entries, .skconfig
   - `--uninstall --codex` → remove skills, clean config.toml sections
   - `--uninstall --gemini` → remove commands, clean settings
   - `--uninstall --opencode` → remove flattened commands
   - `--uninstall --copilot` → remove skills, clean instructions.md
3. Leaked path scan — post-install verify không còn `~/.claude` trong non-Claude files

**Output**: Clean install/uninstall/re-install cycle hoạt động đúng

---

### Giai đoạn 6: NPM packaging + Documentation
**Mục tiêu**: Publish lên npm, viết docs cài đặt

**Công việc:**
1. Cập nhật `package.json`
   - `name`: `skills-cc` (hoặc tên khác)
   - `bin`: `{ "skills-cc": "bin/install.js" }`
   - `files`: `["bin", "commands", "VERSION", "CHANGELOG.md"]`
   - `engines`: `{ "node": ">=16.7.0" }`
2. Cập nhật `README.md`
   - Hướng dẫn cài đặt: `npx skills-cc@latest`
   - Bảng platform support
   - Prerequisites per platform
3. `.npmignore` — loại FastCode/, .planning/, tests/
4. Test E2E: `npx skills-cc --all` trên máy sạch

**Output**: `npm publish` + `npx skills-cc@latest` hoạt động end-to-end

---

## Ưu tiên & Dependencies

```
Giai đoạn 1 (skeleton)
    ↓
Giai đoạn 2 (Claude installer)
    ↓
Giai đoạn 3 (converters)    ← có thể song song với GĐ2
    ↓
Giai đoạn 4 (platform installers) ← phụ thuộc GĐ3
    ↓
Giai đoạn 5 (uninstall + manifest) ← phụ thuộc GĐ4
    ↓
Giai đoạn 6 (npm + docs)    ← phụ thuộc GĐ5
```

## Rủi ro & Giải pháp

| Rủi ro | Giải pháp |
|---|---|
| FastCode MCP chỉ chạy local (Python) | Hướng dẫn setup FastCode riêng per platform, installer chỉ generate MCP config |
| Platform thay đổi format | Converter tách riêng file, dễ update |
| Codex không có slash commands | Dùng `$sk-*` skills + XML adapter header |
| OpenCode flatten commands | Prefix `sk-` thay vì nested directory |
| User modify installed files | Manifest SHA256 + backup patches trước khi re-install |
