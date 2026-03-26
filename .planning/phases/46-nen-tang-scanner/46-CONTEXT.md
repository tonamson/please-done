# Phase 46: Nen tang Scanner - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Gop 13 scanner agents rieng le thanh 1 template `pd-sec-scanner.md` + 1 file `security-rules.yaml` tap trung. Dang ky trong AGENT_REGISTRY va thiet lap FastCode tool-first pattern. Xoa 13 agent files cu sau khi migrate.

</domain>

<decisions>
## Implementation Decisions

### Cau truc YAML
- **D-01:** File `references/security-rules.yaml` to chuc nested theo category slug (sql-injection, xss, cmd-injection...). Moi category chua 5 truong: owasp, severity, patterns[], fixes[], fastcode_queries[].
- **D-02:** Dat tai `references/security-rules.yaml` — nhat quan voi `references/security-checklist.md` da co.

### Template agent
- **D-03:** 1 template `pd-sec-scanner.md` nhan `--category` slug, doc `references/security-rules.yaml`, extract rules cua category tuong ung. Template chua logic chung (evidence format, FastCode flow), YAML chua rules rieng.
- **D-04:** Migrate rules tu 13 files cu vao YAML roi xoa 13 files. Chi giu `pd-sec-scanner.md` + `pd-sec-reporter.md`.
- **D-05:** Evidence output giu format hien tai: YAML frontmatter (agent, outcome, timestamp, session) + markdown body (summary table, findings voi file:line, severity). Function-level checklist (EVID-01) thuoc Phase 48.

### AGENT_REGISTRY
- **D-06:** 1 entry `pd-sec-scanner` voi field `categories: [13 slugs]` + 1 entry `pd-sec-reporter`. Dispatch logic spawn nhieu instance tu 1 entry voi `--category` khac nhau.
- **D-07:** Tat ca 13 scanner categories cung tier `scout` (Haiku). Reporter giu tier `builder` (Sonnet).

### FastCode pattern
- **D-08:** Tool-first flow: (1) Load YAML rules cho category, (2) Chay fastcode_queries[] tu YAML de discovery code, (3) AI phan tich ket qua FastCode de xac dinh PASS/FLAG/FAIL, (4) Xuat evidence. AI khong tu tim code ma chi danh gia.
- **D-09:** Khi FastCode khong available (Docker chua chay) — fallback dung Grep + Glob tim code thay the. Ghi note "FastCode unavailable" trong evidence. Khong chan pipeline.

### Claude's Discretion
- Chi tiet YAML schema (field names, value types) — Claude chon dua tren codebase conventions
- Thu tu migrate 13 files — Claude chon hieu qua nhat
- Cach ghi categories list trong AGENT_REGISTRY — array hoac object tuy thich hop

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Resource system
- `bin/lib/resource-config.js` — AGENT_REGISTRY hien tai (8 entries), tier/model mapping, HEAVY_TOOL_PATTERNS, adaptive parallel limits

### Agent templates
- `commands/pd/agents/pd-sec-sql-injection.md` — Mau scanner cu (1 trong 13 files can migrate)
- `commands/pd/agents/pd-sec-reporter.md` — Reporter agent (giu nguyen, khong migrate)
- `commands/pd/agents/pd-code-detective.md` — Mau agent dung FastCode (tham khao pattern)

### References
- `references/security-checklist.md` — Security audit checklist hien tai
- `references/guard-fastcode.md` — FastCode MCP guard (Docker requirement)

### Requirements
- `.planning/REQUIREMENTS.md` — AGENT-01, AGENT-02, AGENT-04, WIRE-04

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `resource-config.js` AGENT_REGISTRY: Da co 8 entries, them 2 entries moi (pd-sec-scanner + pd-sec-reporter)
- `references/security-checklist.md`: Reference doc cho security — YAML co the tham chieu
- 13 scanner md files: Nguon rules de migrate vao YAML

### Established Patterns
- Agent frontmatter: flat format voi allowed-tools comma-separated (Phase 40 decision)
- Tier system: scout (Haiku) / builder (Sonnet) / architect (Opus) da chuan hoa
- Heavy tool detection: `HEAVY_TOOL_PATTERNS = ["mcp__fastcode__"]` — scanner entries se bi anh huong
- Evidence output: YAML frontmatter + markdown body — da chuan tu v2.1

### Integration Points
- `resource-config.js`: Them 2 entries vao AGENT_REGISTRY
- `references/`: Them security-rules.yaml
- `commands/pd/agents/`: Them pd-sec-scanner.md, xoa 13 files cu

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 46-nen-tang-scanner*
*Context gathered: 2026-03-26*
