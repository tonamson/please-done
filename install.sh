#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_DIR="$HOME/.claude"
COMMANDS_DIR="$CLAUDE_DIR/commands/sk"
FASTCODE_DIR="$SCRIPT_DIR/FastCode"

# Thay thế API key trong .env (cross-platform, injection-safe)
update_env_key() {
    local key_value="$1"
    local env_file="$2"
    local tmpfile
    tmpfile=$(mktemp) || { printf "${RED}Error: mktemp failed${NC}\n"; return 1; }
    while IFS= read -r line || [ -n "$line" ]; do
        case "$line" in
            OPENAI_API_KEY=*) printf 'OPENAI_API_KEY=%s\n' "$key_value" ;;
            *) printf '%s\n' "$line" ;;
        esac
    done < "$env_file" > "$tmpfile"
    mv "$tmpfile" "$env_file"
}

printf "${CYAN}╔══════════════════════════════════════╗${NC}\n"
printf "${CYAN}║   Skills Installer for Claude Code   ║${NC}\n"
printf "${CYAN}╚══════════════════════════════════════╝${NC}\n"
echo ""

# ─── Step 1: Check prerequisites ──────────────────────────
printf "${YELLOW}[1/6] Checking prerequisites...${NC}\n"

if ! command -v claude &> /dev/null; then
    printf "${RED}✗ Claude Code CLI not found. Install it first.${NC}\n"
    exit 1
fi
printf "${GREEN}  ✓ Claude Code CLI${NC}\n"

if command -v python3 &> /dev/null; then
    PYTHON_CMD=python3
elif command -v python &> /dev/null; then
    PYTHON_CMD=python
else
    printf "${RED}✗ Python not found. Install Python 3.12+${NC}\n"
    exit 1
fi
PYTHON_VERSION=$($PYTHON_CMD --version | sed 's/Python //' | cut -d. -f1,2)
PYTHON_MAJOR=$(echo "$PYTHON_VERSION" | cut -d. -f1)
PYTHON_MINOR=$(echo "$PYTHON_VERSION" | cut -d. -f2)
if [ "$PYTHON_MAJOR" -lt 3 ] || { [ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 12 ]; }; then
    printf "${RED}✗ Python 3.12+ required (found $PYTHON_VERSION)${NC}\n"
    exit 1
fi
printf "${GREEN}  ✓ Python $PYTHON_VERSION ($PYTHON_CMD)${NC}\n"

if ! command -v uv &> /dev/null; then
    printf "${YELLOW}  → Installing uv...${NC}\n"
    curl -LsSf https://astral.sh/uv/install.sh | sh || pip3 install uv --break-system-packages || pip3 install uv
    export PATH="$HOME/.local/bin:$PATH"
fi
printf "${GREEN}  ✓ uv package manager${NC}\n"

if ! command -v git &> /dev/null; then
    printf "${RED}✗ Git not found.${NC}\n"
    exit 1
fi
printf "${GREEN}  ✓ Git${NC}\n"

# ─── Step 2: Init submodule (FastCode) ───────────────────
echo ""
printf "${YELLOW}[2/6] Setting up FastCode...${NC}\n"

cd "$SCRIPT_DIR"
git submodule update --init --recursive 2>/dev/null || true

if [ ! -f "$FASTCODE_DIR/mcp_server.py" ]; then
    printf "${RED}✗ FastCode submodule missing. Run: git submodule update --init${NC}\n"
    exit 1
fi
printf "${GREEN}  ✓ FastCode source ready${NC}\n"

# ─── Step 3: Setup Python venv ───────────────────────────
echo ""
printf "${YELLOW}[3/6] Setting up Python environment...${NC}\n"

cd "$FASTCODE_DIR"
if [ ! -d ".venv" ]; then
    uv venv --python=3.12 || uv venv --python=3.13 || uv venv
    printf "${GREEN}  ✓ Virtual environment created${NC}\n"
else
    printf "${GREEN}  ✓ Virtual environment exists${NC}\n"
fi

source .venv/bin/activate
uv pip install -r requirements.txt
printf "${GREEN}  ✓ Dependencies installed${NC}\n"

# ─── Step 4: Setup .env + Gemini API Key ─────────────────
echo ""
printf "${YELLOW}[4/6] Configuring environment...${NC}\n"

if [ -f "$FASTCODE_DIR/.env" ]; then
    # Đọc key hiện tại từ .env
    EXISTING_KEY=$(grep 'OPENAI_API_KEY=' "$FASTCODE_DIR/.env" 2>/dev/null | sed 's/OPENAI_API_KEY=//' || true)
    if [ -n "$EXISTING_KEY" ] && [ "$EXISTING_KEY" != "AIxxxx" ]; then
        printf "${GREEN}  ✓ .env đã có API key${NC}\n"
    else
        echo ""
        printf "${CYAN}  Nhập Gemini API Key của bạn (bắt buộc):${NC}\n"
        printf "  Lấy key tại: ${YELLOW}https://aistudio.google.com/apikey${NC}\n"
        printf "  → "
        read -rs GEMINI_KEY
        echo ""
        if [ -z "$GEMINI_KEY" ]; then
            printf "${RED}✗ Bạn chưa nhập Gemini API Key!${NC}\n"
            printf "${RED}  Không có API key thì FastCode MCP không hoạt động được.${NC}\n"
            printf "${RED}  Cài đặt thất bại. Chạy lại install.sh khi có key.${NC}\n"
            exit 1
        fi
        update_env_key "$GEMINI_KEY" "$FASTCODE_DIR/.env"
        printf "${GREEN}  ✓ API key đã được lưu vào .env${NC}\n"
    fi
else
    cp "$SCRIPT_DIR/env.example" "$FASTCODE_DIR/.env"
    echo ""
    printf "${CYAN}  Nhập Gemini API Key của bạn (bắt buộc):${NC}\n"
    printf "  Lấy key tại: ${YELLOW}https://aistudio.google.com/apikey${NC}\n"
    printf "  → "
    read -rs GEMINI_KEY
    echo ""
    if [ -z "$GEMINI_KEY" ]; then
        printf "${RED}✗ Bạn chưa nhập Gemini API Key!${NC}\n"
        printf "${RED}  Không có API key thì FastCode MCP không hoạt động được.${NC}\n"
        printf "${RED}  Cài đặt thất bại. Chạy lại install.sh khi có key.${NC}\n"
        rm -f "$FASTCODE_DIR/.env"
        exit 1
    fi
    update_env_key "$GEMINI_KEY" "$FASTCODE_DIR/.env"
    printf "${GREEN}  ✓ API key đã được lưu vào .env${NC}\n"
fi

# ─── Step 5: Install skills (symlink) ───────────────────
echo ""
printf "${YELLOW}[5/6] Installing skills...${NC}\n"

mkdir -p "$COMMANDS_DIR"

# Remove old files/symlinks in target
for file in "$COMMANDS_DIR"/*.md; do
    [ -e "$file" ] && rm "$file"
done

# Create symlinks from repo → claude commands
for file in "$SCRIPT_DIR/commands/sk/"*.md; do
    filename=$(basename "$file")
    ln -sf "$file" "$COMMANDS_DIR/$filename"
    printf "${GREEN}  ✓ /sk:${filename%.md}${NC}\n"
done

# Symlink rules directory
if [ -d "$SCRIPT_DIR/commands/sk/rules" ]; then
    ln -sfn "$SCRIPT_DIR/commands/sk/rules" "$COMMANDS_DIR/rules"
    printf "${GREEN}  ✓ Rules directory linked${NC}\n"
fi

# ─── Step 6: Register MCP servers ───────────────────────
echo ""
printf "${YELLOW}[6/6] Registering MCP servers...${NC}\n"

# FastCode MCP (BẮT BUỘC)
PYTHON_PATH="$FASTCODE_DIR/.venv/bin/python"
MCP_PATH="$FASTCODE_DIR/mcp_server.py"

claude mcp remove --scope user fastcode 2>/dev/null || true
claude mcp add --scope user fastcode -- "$PYTHON_PATH" "$MCP_PATH" 2>/dev/null && \
    printf "${GREEN}  ✓ FastCode MCP registered${NC}\n" || \
    printf "${YELLOW}  ⚠ FastCode MCP registration failed${NC}\n"

# Context7 MCP (TÙY CHỌN — tra cứu API thư viện)
if command -v npx &> /dev/null; then
    claude mcp remove --scope user context7 2>/dev/null || true
    claude mcp add --scope user context7 -- npx -y @upstash/context7-mcp@latest 2>/dev/null && \
        printf "${GREEN}  ✓ Context7 MCP registered${NC}\n" || \
        printf "${YELLOW}  ⚠ Context7 MCP registration failed (tùy chọn — skills vẫn hoạt động)${NC}\n"
else
    printf "${YELLOW}  ⚠ npx not found — bỏ qua Context7 MCP (tùy chọn)${NC}\n"
fi

# Lưu config path để skills biết repo ở đâu
CONFIG_FILE="$COMMANDS_DIR/.skconfig"
echo "SKILLS_DIR=$SCRIPT_DIR" > "$CONFIG_FILE"
echo "FASTCODE_DIR=$FASTCODE_DIR" >> "$CONFIG_FILE"
printf "${GREEN}  ✓ Config saved: $CONFIG_FILE${NC}\n"

# ─── Done ────────────────────────────────────────────────
echo ""
printf "${CYAN}╔══════════════════════════════════════╗${NC}\n"
printf "${CYAN}║         Installation Complete!        ║${NC}\n"
printf "${CYAN}╚══════════════════════════════════════╝${NC}\n"
echo ""
SKILL_COUNT=$(ls -1 "$COMMANDS_DIR"/*.md 2>/dev/null | wc -l | tr -d ' ')
printf "Skills installed ($SKILL_COUNT):\n"
printf "  /sk:init               Khởi tạo (CHẠY ĐẦU TIÊN)\n"
printf "  /sk:scan               Quét dự án + npm audit\n"
printf "  /sk:roadmap            Lập lộ trình\n"
printf "  /sk:plan               Kế hoạch + chia công việc\n"
printf "  /sk:fetch-doc          Tải tài liệu (cache local)\n"
printf "  /sk:write-code         Viết code + commit [TASK-N]\n"
printf "  /sk:test               Jest + Supertest + commit [KIỂM THỬ]\n"
printf "  /sk:fix-bug            Debug + commit [LỖI]\n"
printf "  /sk:what-next          Kiểm tra tiến trình + gợi ý bước tiếp\n"
printf "  /sk:complete-milestone Commit [PHIÊN BẢN] + git tag\n"
echo ""
printf "${YELLOW}TIẾP THEO:${NC}\n"
printf "  1. Khởi động lại Claude Code để load skills mới\n"
printf "  2. Gõ ${GREEN}/sk:init${NC} trong dự án bất kỳ để bắt đầu\n"
echo ""
