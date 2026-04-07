# Technology Stack

**Analysis Date:** 2026-04-07

## Languages

**Primary:**
- JavaScript/Node.js 16.7.0+ - CLI installer, skill workflows, test runners
- Markdown - Skill definitions, documentation, workflow specifications
- Python 3.12+ - FastCode backend, repository indexing, code analysis
- YAML - Configuration (NanoBot config, rules files)

**Secondary:**
- Bash/Shell - Installation scripts, cross-platform setup
- HTML - Web interface (FastCode web_app)
- JSON - Configuration files, metadata

## Runtime

**Environment:**
- Node.js 16.7.0+ (primary)
- Python 3.12+ (FastCode MCP backend)
- uv package manager (Python dependency management)

**Package Manager:**
- npm (Node.js dependencies)
- uv (Python environment setup)
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- FastAPI (Python) - REST API server for FastCode MCP backend
- Flask (Python) - Web interface for FastCode
- Uvicorn (Python) - ASGI server for FastAPI

**Testing:**
- Node's built-in `test` module (Node.js test runner) - `bin/lib/*.test.js` (co-located)
- Pytest (Python) - FastCode backend testing
- PromptFoo - Evaluation suite for skill workflow compliance
- c8 - Code coverage reporting (devDependency)

**Build/Dev:**
- None detected - pure Node.js/Python scripts, no build step

## Key Dependencies

**Critical:**
- `git` (required for submodule management) - FastCode submodule initialization
- `python-dotenv` - Environment configuration for FastCode
- `pyyaml` - YAML parsing for skill frontmatter
- `gitpython` - Repository management for FastCode indexing
- `click` - CLI framework for FastCode utilities

**Infrastructure & Indexing:**
- `tree-sitter` (multiple language parsers: python, javascript, typescript, java, go, c, cpp, rust, c-sharp) - Code parsing and AST analysis
- `libcst` - Python-specific code transformation
- `sentence-transformers` - Semantic embeddings for code search
- `faiss-cpu` - Vector database for embedding search
- `chromadb` - Embedded vector store integration
- `rank-bm25` - BM25 ranking for search results
- `networkx` - Graph analysis for code relationships

**LLM Integration:**
- `openai` - OpenAI API client for skill evaluation
- `anthropic` - Anthropic API client for Claude models
- `tiktoken` - Token counting for cost estimation
- `js-tiktoken` - JavaScript tokenization (devDependency)
- `js-yaml` - YAML parsing in JavaScript (devDependency)

**API & Server:**
- `fastapi` - REST API framework
- `flask` - Web framework for UI
- `flask-cors` - CORS middleware
- `pydantic` - Data validation
- `uvicorn` - ASGI server
- `python-multipart` - Form data parsing

**MCP (Model Context Protocol):**
- `mcp[cli]` - MCP SDK for Python server implementation

**Utilities:**
- `tqdm` - Progress bars for long operations
- `numpy`, `pandas` - Numerical/data operations
- `pathspec` - .gitignore pattern matching
- `diskcache` - Disk-based caching
- `redis` (optional) - In-memory caching

## Configuration

**Environment:**
- `env.example` - Example configuration for Gemini API setup
- `.env` files (not committed) - Secrets and API keys per platform
- `.pdconfig` - User-specific configuration (SKILLS_DIR path)
- `nanobot_config.json` - FastCode/NanoBot agent configuration (MCP providers, channels, tools)

**Build:**
- `package.json` - Node.js project metadata and scripts
- `requirements.txt` - Python dependencies
- No build configuration (tsc, webpack, etc.) required

**Installers:**
- `bin/install.js` - Interactive/CLI installer for all platforms
- `bin/lib/installers/` - Platform-specific installers (claude, codex, gemini, opencode, copilot)
- `bin/lib/converters/` - Convert skills to platform-specific format

## Platform Support

**Development:**
- macOS, Linux, Windows (WSL supported via isWSL() check)
- Python 3.12+ required for FastCode
- Git 2.x required for submodule management

**Production:**
- CloudRun (FastCode deployment)
- Docker support (Dockerfile + docker-compose.yml present in FastCode/)

## AI Coding Platforms Supported

1. **Claude Code** (Anthropic)
    - Primary implementation language
    - Config: `~/.claude/commands/pd/`
    - MCP servers: FastCode + Context7

2. **Codex CLI** (OpenAI)
    - Transpiled to OpenAI tool format
    - Config: `~/.codex/commands/pd/`

3. **Gemini CLI** (Google)
    - Transpiled to Google tool format
    - Config: `~/.gemini/commands/pd/`

4. **OpenCode** (OpenAI)
    - Transpiled to OpenCode format
    - Config: `~/.opencode/commands/pd/`

5. **GitHub Copilot**
    - Transpiled to Copilot format
    - Config: `~/.copilot/commands/pd/`

## Tech Stack Detection

The system detects and supports these technology stacks:

- **Backend:** NestJS, Express, FastAPI, Django
- **Frontend:** NextJS, React, Vue, Svelte, Vite
- **Mobile:** Flutter, React Native
- **Blockchain:** Solidity (Hardhat, Foundry)
- **CMS:** WordPress
- **Languages:** TypeScript, JavaScript, Python, PHP, Go, Rust, C/C++, Java, C#, Dart

---

*Stack analysis: 2026-04-07*
