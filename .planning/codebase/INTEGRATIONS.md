# External Integrations

**Analysis Date:** 2026-03-22

## APIs & External Services

**LLM Providers:**
- OpenAI (ChatGPT, Codex)
  - SDK: `openai` package
  - Auth: `OPENAI_API_KEY` environment variable
  - Used in: FastCode backend, NanoBot agent, skill evaluation (PromptFoo)

- Anthropic (Claude)
  - SDK: `anthropic` package
  - Auth: Handled by Claude Code CLI (internal)
  - Used in: Primary skill platform, PromptFoo evaluation

- Google Gemini
  - Auth: `OPENAI_API_KEY` (via OpenAI-compatible endpoint)
  - Base URL: `https://generativelanguage.googleapis.com/v1beta/openai`
  - Model: `gemini-2.5-flash-lite` (configurable)
  - Used in: FastCode MCP server, Gemini CLI support

**Search & Documentation:**
- Context7 MCP Server
  - Purpose: Framework/library documentation retrieval
  - Integration: MCP protocol via `mcp__context7__query-docs` tool calls
  - Used in: Skill workflows for version-specific docs lookup

## Data Storage

**Repository Source Control:**
- GitHub (remote)
  - Connection: Git clone/remote operations
  - Used for: FastCode repository indexing and analysis

**Local Storage:**
- File system (SQLite, disk caching)
  - Cache: `diskcache` package
  - Vector store: ChromaDB (embedded)
  - Caching: Redis (optional)

**Code Indexing:**
- ChromaDB (embedded vector database)
  - Purpose: Code embedding storage and semantic search
  - Connection: Local database in FastCode directory
  - Client: `chromadb` package

- FAISS (Facebook AI Similarity Search)
  - Purpose: Efficient vector similarity search
  - Package: `faiss-cpu`

**Workspace:**
- Nanobot workspace: `~/.nanobot/workspace/` (configurable)
- Skills directory: `SKILLS_DIR` (from `.pdconfig`)

## Authentication & Identity

**API Authentication:**
- Environment variables (`.env` files)
  - `OPENAI_API_KEY` - OpenAI API access
  - `ANTHROPIC_API_KEY` - Anthropic API access (if needed)
  - `GEMINI_API_KEY` - Google Gemini access (via OpenAI endpoint)

**Platform-Specific Configuration:**
- Claude Code: OAuth handled by Anthropic CLI
- Codex CLI: API key per OpenAI
- Gemini CLI: API key configuration in `.gemini/settings.json`
- OpenCode: CLI-managed authentication
- GitHub Copilot: GitHub.com OAuth

## MCP (Model Context Protocol) Servers

**FastCode MCP Server** (Python)
- Location: `FastCode/mcp_server.py`
- Purpose: Code repository indexing, semantic search, architecture analysis
- Tools exposed:
  - `mcp__fastcode__list_indexed_repos` - List available indexed repositories
  - `mcp__fastcode__code_qa` - Query repository code semantically
  - Used in: Skill workflows (`/pd:init`, `/pd:scan`, `/pd:new-milestone`)

**Context7 MCP Server** (External)
- Purpose: Documentation lookup for frameworks and libraries
- Tools exposed:
  - `mcp__context7__query-docs` - Query official documentation
  - Used in: Skill workflows when version-specific guidance needed

**Semgrep MCP Server** (Optional)
- Purpose: Static analysis and pattern matching
- Tools exposed: Pattern-based code scanning
- Used in: `/pd:scan` for security and quality checks

## Monitoring & Observability

**Logging:**
- Console logging (stdout/stderr)
- Python logging module (FastCode backend)
- Structured logging via NanoBot agent

**Error Tracking:**
- None configured (built-in error handling)
- Skill evaluation results captured in PromptFoo reports

## CI/CD & Deployment

**Hosting:**
- Docker (for FastCode)
  - Dockerfile: `FastCode/Dockerfile`
  - Docker Compose: `FastCode/docker-compose.yml`
  - Cloud: CloudRun compatible

**Testing Infrastructure:**
- GitHub Actions (implied from `.github/` directory structure)
- PromptFoo evaluation suite (local)
  - Config: `promptfooconfig.yaml`
  - Evaluation: `npm run eval`, `npm run eval:view`

**Package Distribution:**
- npm (Node.js Package Manager)
  - Published as: `please-done`
  - Registry: npmjs.com
  - Installation: `npx please-done` or `npm install -g please-done`

## Environment Configuration

**Required Environment Variables:**

For FastCode MCP:
- `OPENAI_API_KEY` or `GEMINI_API_KEY` - LLM API access
- `BASE_URL` (optional) - Custom API endpoint
- `MODEL` (optional) - LLM model selection

For NanoBot agent:
- Per-provider API keys configured in `nanobot_config.json`
  - Anthropic: `apiKey`
  - OpenAI: `apiKey`
  - OpenRouter: `apiKey`
  - DeepSeek: `apiKey`
  - Groq: `apiKey`
  - Zhipu: `apiKey`
  - DashScope: `apiKey`
  - vLLM: `apiKey`
  - Gemini: `apiKey`
  - Moonshot: `apiKey`
  - AIHubMix: `apiKey`

**Secrets Location:**
- `.env` files (not committed)
- `.pdconfig` (user-local configuration, not committed)
- `nanobot_config.json` sections with empty `apiKey` fields (placeholder)

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected

## Platform Configuration Files

**Claude Code:**
- Path: `~/.claude/commands/pd/`
- Format: Markdown skill files
- MCP: Registered via `claude mcp add` command

**Codex CLI:**
- Path: `~/.codex/commands/pd/`
- Format: Converted skill files + TOML config for MCP

**Gemini CLI:**
- Path: `~/.gemini/commands/pd/`
- Format: Converted skill files + `settings.json` for MCP
- Env config: `env.example` shows Gemini API setup

**OpenCode:**
- Path: `~/.opencode/commands/pd/`
- Format: Converted skill files

**GitHub Copilot:**
- Path: `~/.copilot/commands/pd/`
- Format: Converted skill files

## Framework Detection Integration

The system performs automatic stack detection during `/pd:init`:

**Detection Methods:**
1. File-based detection (Glob patterns)
   - `**/nest-cli.json` → NestJS
   - `**/next.config.*` → NextJS
   - `**/hardhat.config.*` → Solidity
   - `**/foundry.toml` → Solidity
   - `**/pubspec.yaml` → Flutter
   - `**/wp-config.php` → WordPress

2. Content-based detection (Grep patterns)
   - package.json dependencies → Framework identification
   - AST parsing via Tree-Sitter → Language and framework detection

3. FastCode integration
   - `mcp__fastcode__code_qa` call indexes detected project
   - Provides semantic understanding for subsequent analysis

---

*Integration audit: 2026-03-22*
