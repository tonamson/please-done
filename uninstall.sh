#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

COMMANDS_DIR="$HOME/.claude/commands/sk"

printf "${YELLOW}Uninstalling skills...${NC}\n"

# Remove skill symlinks
if [ -d "$COMMANDS_DIR" ]; then
    rm -rf "$COMMANDS_DIR"
    printf "${GREEN}  ✓ Removed skill commands${NC}\n"
fi

# Remove MCP servers
if command -v claude &> /dev/null; then
    claude mcp remove --scope user fastcode 2>/dev/null && \
        printf "${GREEN}  ✓ Removed FastCode MCP${NC}\n" || \
        printf "${YELLOW}  ⚠ FastCode MCP not found${NC}\n"
    # Context7 MCP KHÔNG gỡ — có thể dùng chung với Cursor/IDE khác
fi

echo ""
printf "${GREEN}Uninstall complete.${NC}\n"
printf "FastCode source and venv still exist in this repo.\n"
printf "Delete this repo to fully remove everything.\n"
