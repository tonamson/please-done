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

echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   Skills Installer for Claude Code   ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

# ─── Step 1: Check prerequisites ──────────────────────────
echo -e "${YELLOW}[1/6] Checking prerequisites...${NC}"

if ! command -v claude &> /dev/null; then
    echo -e "${RED}✗ Claude Code CLI not found. Install it first.${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Claude Code CLI${NC}"

if command -v python3 &> /dev/null; then
    PYTHON_CMD=python3
elif command -v python &> /dev/null; then
    PYTHON_CMD=python
else
    echo -e "${RED}✗ Python not found. Install Python 3.12+${NC}"
    exit 1
fi
PYTHON_VERSION=$($PYTHON_CMD --version | sed 's/Python //' | cut -d. -f1,2)
echo -e "${GREEN}  ✓ Python $PYTHON_VERSION ($PYTHON_CMD)${NC}"

if ! command -v uv &> /dev/null; then
    echo -e "${YELLOW}  → Installing uv...${NC}"
    curl -LsSf https://astral.sh/uv/install.sh | sh 2>/dev/null || pip3 install uv --break-system-packages 2>/dev/null || pip3 install uv
    export PATH="$HOME/.local/bin:$PATH"
fi
echo -e "${GREEN}  ✓ uv package manager${NC}"

if ! command -v git &> /dev/null; then
    echo -e "${RED}✗ Git not found.${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Git${NC}"

# ─── Step 2: Init submodule (FastCode) ───────────────────
echo ""
echo -e "${YELLOW}[2/6] Setting up FastCode...${NC}"

cd "$SCRIPT_DIR"
git submodule update --init --recursive 2>/dev/null || true

if [ ! -f "$FASTCODE_DIR/mcp_server.py" ]; then
    echo -e "${RED}✗ FastCode submodule missing. Run: git submodule update --init${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ FastCode source ready${NC}"

# ─── Step 3: Setup Python venv ───────────────────────────
echo ""
echo -e "${YELLOW}[3/6] Setting up Python environment...${NC}"

cd "$FASTCODE_DIR"
if [ ! -d ".venv" ]; then
    uv venv --python=3.12 2>/dev/null || uv venv --python=3.13 2>/dev/null || uv venv
    echo -e "${GREEN}  ✓ Virtual environment created${NC}"
else
    echo -e "${GREEN}  ✓ Virtual environment exists${NC}"
fi

source .venv/bin/activate
uv pip install -r requirements.txt -q
echo -e "${GREEN}  ✓ Dependencies installed${NC}"

# ─── Step 4: Setup .env + Gemini API Key ─────────────────
echo ""
echo -e "${YELLOW}[4/6] Configuring environment...${NC}"

if [ -f "$FASTCODE_DIR/.env" ]; then
    # Đọc key hiện tại từ .env
    EXISTING_KEY=$(grep 'OPENAI_API_KEY=' "$FASTCODE_DIR/.env" 2>/dev/null | sed 's/OPENAI_API_KEY=//' || true)
    if [ -n "$EXISTING_KEY" ] && [ "$EXISTING_KEY" != "AIxxxx" ]; then
        echo -e "${GREEN}  ✓ .env đã có API key${NC}"
    else
        echo ""
        echo -e "${CYAN}  Nhập Gemini API Key của bạn (bắt buộc):${NC}"
        echo -e "  Lấy key tại: ${YELLOW}https://aistudio.google.com/apikey${NC}"
        echo -n "  → "
        read -r GEMINI_KEY
        if [ -z "$GEMINI_KEY" ]; then
            echo ""
            echo -e "${RED}✗ Bạn chưa nhập Gemini API Key!${NC}"
            echo -e "${RED}  Không có API key thì FastCode MCP không hoạt động được.${NC}"
            echo -e "${RED}  Cài đặt thất bại. Chạy lại install.sh khi có key.${NC}"
            exit 1
        fi
        sed -i '' "s|OPENAI_API_KEY=.*|OPENAI_API_KEY=$GEMINI_KEY|" "$FASTCODE_DIR/.env"
        echo -e "${GREEN}  ✓ API key đã được lưu vào .env${NC}"
    fi
else
    cp "$SCRIPT_DIR/env.example" "$FASTCODE_DIR/.env"
    echo ""
    echo -e "${CYAN}  Nhập Gemini API Key của bạn (bắt buộc):${NC}"
    echo -e "  Lấy key tại: ${YELLOW}https://aistudio.google.com/apikey${NC}"
    echo -n "  → "
    read -r GEMINI_KEY
    if [ -z "$GEMINI_KEY" ]; then
        echo ""
        echo -e "${RED}✗ Bạn chưa nhập Gemini API Key!${NC}"
        echo -e "${RED}  Không có API key thì FastCode MCP không hoạt động được.${NC}"
        echo -e "${RED}  Cài đặt thất bại. Chạy lại install.sh khi có key.${NC}"
        rm -f "$FASTCODE_DIR/.env"
        exit 1
    fi
    sed -i '' "s|OPENAI_API_KEY=.*|OPENAI_API_KEY=$GEMINI_KEY|" "$FASTCODE_DIR/.env"
    echo -e "${GREEN}  ✓ API key đã được lưu vào .env${NC}"
fi

# ─── Step 5: Install skills (symlink) ───────────────────
echo ""
echo -e "${YELLOW}[5/6] Installing skills...${NC}"

mkdir -p "$COMMANDS_DIR"

# Remove old files/symlinks in target
for file in "$COMMANDS_DIR"/*.md; do
    [ -e "$file" ] && rm "$file"
done

# Create symlinks from repo → claude commands
for file in "$SCRIPT_DIR/commands/sk/"*.md; do
    filename=$(basename "$file")
    ln -sf "$file" "$COMMANDS_DIR/$filename"
    echo -e "${GREEN}  ✓ /sk:${filename%.md}${NC}"
done

# ─── Step 6: Register MCP server ────────────────────────
echo ""
echo -e "${YELLOW}[6/6] Registering FastCode MCP server...${NC}"

PYTHON_PATH="$FASTCODE_DIR/.venv/bin/python"
MCP_PATH="$FASTCODE_DIR/mcp_server.py"

# Xóa MCP cũ nếu có, đăng ký lại với path đúng
claude mcp remove --scope user fastcode 2>/dev/null || true
claude mcp add --scope user fastcode -- "$PYTHON_PATH" "$MCP_PATH" 2>/dev/null && \
    echo -e "${GREEN}  ✓ FastCode MCP registered (global)${NC}" || \
    echo -e "${YELLOW}  ⚠ MCP registration failed${NC}"

# Lưu config path để skills biết repo ở đâu
CONFIG_FILE="$COMMANDS_DIR/.skconfig"
echo "SKILLS_DIR=$SCRIPT_DIR" > "$CONFIG_FILE"
echo "FASTCODE_DIR=$FASTCODE_DIR" >> "$CONFIG_FILE"
echo -e "${GREEN}  ✓ Config saved: $CONFIG_FILE${NC}"

# ─── Done ────────────────────────────────────────────────
echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         Installation Complete!        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""
echo -e "Skills installed (9):"
echo -e "  /sk:init               Khởi tạo (CHẠY ĐẦU TIÊN)"
echo -e "  /sk:scan               Quét dự án + npm audit"
echo -e "  /sk:roadmap            Lập lộ trình"
echo -e "  /sk:plan               Kế hoạch + chia công việc"
echo -e "  /sk:fetch-doc          Tải tài liệu (cache local)"
echo -e "  /sk:write-code         Viết code + commit [TASK-N]"
echo -e "  /sk:test               Jest + Supertest + commit [KIỂM THỬ]"
echo -e "  /sk:fix-bug            Debug + commit [LỖI]"
echo -e "  /sk:complete-milestone Commit [PHIÊN BẢN] + git tag"
echo ""
echo -e "${YELLOW}TIẾP THEO:${NC}"
echo -e "  1. Khởi động lại Claude Code để load skills mới"
echo -e "  2. Gõ ${GREEN}/sk:init${NC} trong dự án bất kỳ để bắt đầu"
echo ""
