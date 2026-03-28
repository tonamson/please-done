---
description: Download documentation from a URL using the current library version, and cache it locally for fast lookup
tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - WebFetch
---
<objective>
Download documentation from a URL into a local markdown file with version metadata and a section index. Cache the exact version so later skills can read the index first, then open only the required section.
</objective>
<guards>
Stop and instruct the user if any of the following conditions fail:
- [ ] `.planning/CONTEXT.md` ton tai -> "Chay `/pd-init` truoc."
- [ ] URL is valid (has `http` or `https`) -> "Invalid URL. Check it again."
- [ ] WebFetch is available -> "WebFetch is unavailable. Check the MCP setup."
      </guards>
<context>
User input: $ARGUMENTS
Example: `/pd-fetch-doc https://docs.nestjs.com/guards [nestjs-guards]`
</context>
<execution_context>
None -- this skill is handled directly and does not use a separate workflow.
<!-- Audit 2026-03-23: Intentional -- self-contained skill without workflow (lightweight/utility pattern). See Phase 14 Audit I1. -->
</execution_context>
<process>
## Step 1: Validate input, filename, and version
- `.planning/CONTEXT.md` exists but `docs/` is missing -> `mkdir -p .planning/docs` | if missing -> STOP: run `/pd-init`
- Invalid URL -> ask the user
- **Filename from URL:** last path segments (drop query/hash), prepend a domain keyword
  - `docs.nestjs.com/guards` -> `nestjs-guards` | `ant.design/components/table` -> `antd-table`
  - If the user provides a custom name -> use it
- **Library version:**
  1. Extract the package name from the URL
  2. Grep for that name in `**/package.json` (excluding node_modules) -> get the version
  3. Multiple results -> prefer exact match
  4. Multiple different versions -> ask the user to choose or use the nearest package.json
  5. Not found -> ask the user or store `latest`
  - Heuristic: NestJS/backend URL -> backend `package.json` (Glob `**/nest-cli.json`) | NextJS/React URL -> frontend `package.json` (Glob `**/next.config.*`)
## Step 2: Check whether the doc already exists
`.planning/docs/[name].md`:
- EXISTS + SAME version + SAME URL -> ask whether to refresh
- EXISTS + SAME version + DIFFERENT URL -> ask: use a new name or overwrite?
- EXISTS + DIFFERENT version -> "Version changed", fetch again
- MISSING -> continue
## Step 3: Fetch the main page
WebFetch the URL -> extract content + internal links on the same domain (technical pages only, skip blog/changelog)
**HTTP errors:**
- 429 -> wait 5s, retry (max 2 times)
- 301/302 -> follow redirect
- 401/403 -> STOP: "This page requires login"
- Timeout >30s -> report that the page is not responding
- 404/500/empty -> retry once
- Still failing -> STOP: "Could not fetch [URL]."
**SPA detection:** content < 500 chars -> warn: "This page uses JS rendering. Try Context7 MCP."
## Step 4: Fetch related pages
From the links found in Step 3:
- Filter technical pages (API, config, examples, getting started)
- Rank up to 10 pages -> fetch the top 5 pages (multiple WebFetch calls in one block)
- Failed pages -> skip with warning, continue
## Step 5: Save file with index
Create `.planning/docs/[name].md`:
```markdown
# [Library Name] Documentation
> Source: [original URL]
> Version: [x.x.x] (from package.json)
> Fetched: [DD_MM_YYYY]
> Pages: [N]
## Quick Index
| #   | Section         | Keywords           | Line |
| --- | --------------- | ------------------ | ---- |
| 1   | Guards Overview | guard, canActivate | 20   |
---
## Section 1: [Title]
> Source: [URL]
> [Content kept in its original language]
```
> Line numbers are approximate. When reading, search by heading text instead of relying on line numbers.
## Step 6: Notify
- Number of successful pages, file path, version
- "When the library is upgraded, run `/pd-fetch-doc` again to refresh it"
  </process>
<output>
**Create/Update:**
- `.planning/docs/[name].md` -- cached documentation with version metadata and index
**Next step:** `/pd-plan` or `/pd-write-code`
**Success when:**
- Documentation is created with the correct version from `package.json`
- The quick index contains keywords and line numbers for each section
- Content preserves the original language and code examples
**Common errors:**
- WebFetch is unavailable -> check MCP
- URL returns `401/403` -> cannot fetch automatically
- The page is an SPA -> try Context7 MCP
  </output>
<rules>
- Headings and notes: English | documentation content: keep the original language
- You MUST record the version from `package.json` and check whether the doc already exists before fetching
- You MUST include a quick index with keywords and line numbers
- Maximum 10 pages, and fetch only technical pages on the same domain
- Preserve code examples exactly
</rules>
