---
name: pd:sync-version
description: Sync version from package.json across README badges, version text, and doc file headers
---
<objective>
Sync version from package.json to all project files. Default mode updates files. --check mode validates without writing.
</objective>
<guards>
Stop and instruct the user if any of the following conditions fail:
- [ ] `package.json` exists -> "No package.json found. Run from project root."
- [ ] `.planning/` directory exists -> "The project has not been initialized yet. Run `/pd:init` first."
</guards>
<context>
User input: $ARGUMENTS
- No arguments: sync mode — update all files to match package.json version
- `--check`: validation-only — report mismatches without modifying files
No rules or FastCode MCP needed.
</context>
<execution_context>
No external workflow needed — pd:sync-version executes inline using bin/lib/version-sync.js.
</execution_context>
<process>
1. read `package.json` → pass content to `extractPackageVersion()` from `bin/lib/version-sync.js`. If null → STOP: "Could not read version from package.json."
2. read `README.md` → extract badge version via `extractBadgeVersion()` and text version via `extractTextVersion()`. Store results.
3. read `README.vi.md` → extract badge version via `extractBadgeVersion()` and doc version via `extractDocVersion()`. Store results.
4. glob `docs/skills/*.md` and `docs/workflows/*.md` → for each file: read content, extract version via `extractDocVersion()`. Store results. IMPORTANT: exclude any path containing `.planning/` (D-05).
5. glob `CLAUDE.vi.md` and `docs/*.vi.md` and `docs/*.md` files at root → extract doc versions. Exclude `.planning/` paths.
6. Call `compareVersions(packageVersion, allResults)` → get structured results array.
7. If `--check` flag present:
   - Call `formatVersionCheck(results, packageVersion)` → output via `log.info()`
   - Report total files checked, matches, and mismatches
8. If sync mode (default, no --check):
   - Call `formatVersionCheck(results, packageVersion)` → output via `log.info()` first (show what will change)
   - For each mismatched result:
     - README.md badge mismatch → use `replaceBadgeVersion(readmeContent, packageVersion)`, write via edit tool
     - README.md text mismatch → use `replaceTextVersion(readmeContent, packageVersion)`, write via edit tool
     - README.vi.md badge mismatch → use `replaceBadgeVersion(content, packageVersion)`, write via edit tool
     - Any doc file mismatch → use `replaceDocVersion(content, packageVersion)`, write via edit tool
   - Output summary: "Updated X files: file1 (old → new), file2 (old → new)"
   - Wrap sync in try/catch — if any file fails, log warning via `log.warn()` and continue (D-10 non-blocking)
</process>
<output>
**Create/Update:**
- --check: No files modified, only report displayed
- Sync mode: Updates all files with mismatched versions
**Next step:** None — pd:sync-version updates version references only
**Success when:**
- --check: Version status displayed for all target files
- Sync mode: All files updated to match package.json version
**Common errors:**
- `package.json` does not exist -> run from project root
- `.planning/` does not exist -> run `/pd:init`
</output>
<rules>
- All output MUST be in English
- DO NOT sync files in `.planning/` directory (D-05)
- DO NOT call FastCode MCP or Context7 MCP
- Sync is non-blocking — failures produce warnings, do not halt (D-10)
- Load functions from `bin/lib/version-sync.js` using require()
</rules>
