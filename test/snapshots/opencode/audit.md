---
description: View and search discussion context audit trail — list, filter, and view stored discussion summaries
tools:
  - Read
  - Glob
  - Bash
---
<objective>
List, search, and view discussion context summaries stored in `.planning/contexts/`. READ ONLY. DO NOT edit files.
</objective>
<guards>
Stop and instruct the user if any of the following conditions fail:
- [ ] `.planning/` directory exists -> "The project has not been initialized yet. Run `/pd-init` first."
</guards>
<context>
User input: $ARGUMENTS
Per D-07 three modes:
- No arguments: List recent sessions (most recent first) with phase, date, decision count
- `--search "keyword"` or `--phase N` or `--from DATE` or `--to DATE`: Filter/search contexts
- `--view N`: Display full summary for phase N
Additional flags:
- `--json`: Output as machine-readable JSON
- `--limit N`: Limit list to N entries (default: 20)
</context>
<execution_context>
No external workflow needed — pd:audit executes inline using bin/lib/audit-trail.js.
</execution_context>
<process>
1. Load audit-trail functions:
   ```javascript
   const { parseContextFile, listContexts, filterContexts, formatAuditTable, formatAuditJson } = require('../../../bin/lib/audit-trail');
   ```
2. Glob `.planning/contexts/*.md` to find all context files
3. If no context files found: output "No discussion contexts found. Run /gsd-discuss-phase to create one."
4. For each context file: Read content using the Read tool
5. Build contextFiles array: `[{ filename: basename, content }, ...]`
6. Call `listContexts(contextFiles)` to get parsed and sorted contexts
7. Parse flags from $ARGUMENTS:
   - `--phase N`: Filter by phase number
   - `--search "keyword"`: Filter by keyword substring in decisions
   - `--from DATE`: Filter contexts on or after DATE (ISO format YYYY-MM-DD)
   - `--to DATE`: Filter contexts on or before DATE (ISO format YYYY-MM-DD)
   - `--view N`: View mode — display full context for phase N
   - `--json`: JSON output mode
   - `--limit N`: Limit list entries (default: 20)
8. If `--view N` flag present:
   - Find context where phase === N (parse N as integer)
   - If not found: output "No context found for phase N"
   - If found: display full content (frontmatter + decisions + next_step)
9. Otherwise (list/filter mode):
   - Build filters object from parsed flags: `{ keyword, phase, from, to }`
   - Apply filters: `const filtered = filterContexts(contexts, filters)`
   - Apply limit: `filtered.slice(0, limit)`
   - If `--json`: call `formatAuditJson(limited)` and output
   - Otherwise: call `formatAuditTable(limited)` and output
   - Show count: `Showing N of M contexts`
10. Output result
</process>
<output>
**Create/Update:**
- No files are created or modified, read-only only
**Next step:** None — pd:audit shows context history only
**Success when:**
- Context list shows phases with date and decision count
- Filters narrow results correctly
- View mode displays full context summary
- Zero files were written or modified
**Common errors:**
- `.planning/` does not exist → run `/pd-init`
- `.planning/contexts/` is empty → run `/gsd-discuss-phase` to create a context
</output>
<rules>
- All output MUST be in English
- READ ONLY. DO NOT edit any files
- DO NOT call FastCode MCP or Context7 MCP
- Load functions from `bin/lib/audit-trail.js` using require()
</rules>
<script type="error-handler">
const { createBasicErrorHandler } = require('../../../bin/lib/basic-error-handler');
const errorHandler = createBasicErrorHandler('pd:audit', '$CURRENT_PHASE', {
  operation: 'audit'
});
module.exports = { errorHandler };
</script>
