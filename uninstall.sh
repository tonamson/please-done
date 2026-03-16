#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

COMMANDS_DIR="$HOME/.claude/commands/sk"

echo -e "${YELLOW}Uninstalling skills...${NC}"

# Remove skill symlinks
if [ -d "$COMMANDS_DIR" ]; then
    rm -rf "$COMMANDS_DIR"
    echo -e "${GREEN}  ✓ Removed skill commands${NC}"
fi

# Remove MCP
if command -v claude &> /dev/null; then
    claude mcp remove --scope user fastcode 2>/dev/null && \
        echo -e "${GREEN}  ✓ Removed FastCode MCP${NC}" || \
        echo -e "${YELLOW}  ⚠ FastCode MCP not found${NC}"
fi

echo ""
echo -e "${GREEN}Uninstall complete.${NC}"
echo -e "FastCode source and venv still exist in this repo."
echo -e "Delete this repo to fully remove everything."
