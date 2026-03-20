#!/bin/bash
# Auto-scan security vulnerabilities after Edit/Write code files
# Hook: PostToolUse (Edit, Write)

# Only run for Edit or Write tools
if [[ "$CLAUDE_TOOL_NAME" != "Edit" && "$CLAUDE_TOOL_NAME" != "Write" ]]; then
  exit 0
fi

# Extract file path from tool input
FILE_PATH=$(echo "$CLAUDE_TOOL_INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('file_path',''))" 2>/dev/null)

if [[ -z "$FILE_PATH" || ! -f "$FILE_PATH" ]]; then
  exit 0
fi

# Only scan code files (not docs, configs, etc.)
EXT="${FILE_PATH##*.}"
case "$EXT" in
  ts|tsx|js|jsx|py|sol|go|java|rb|php|rs|c|cpp|h|dart|swift|kt)
    ;;
  *)
    exit 0
    ;;
esac

# Run semgrep scan on the single file
RESULT=$(semgrep scan --config auto --quiet --no-git-ignore "$FILE_PATH" 2>/dev/null)

if [[ -n "$RESULT" ]]; then
  echo "⚠️ SEMGREP SECURITY SCAN — Found issues in $FILE_PATH:"
  echo ""
  echo "$RESULT"
  echo ""
  echo "→ Please fix these security vulnerabilities before proceeding."
fi
