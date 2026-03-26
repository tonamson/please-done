# Phase 47: Luong Audit Cot loi - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Tao skill `pd:audit [path] [flags]` voi workflow 9 buoc, 2 che do tu dong phat hien (Doc lap/Tich hop), batch dispatch scanner song song 2/wave. Nguoi dung chay `pd:audit` va nhan ket qua quet bao mat end-to-end. Delta-aware, smart selection, va fix routing la stub cho phase sau.

</domain>

<decisions>
## Implementation Decisions

### Skill pd:audit entry point
- **D-01:** Model tier: Architect (Opus) orchestrator — workflow 9 buoc phuc tap can AI manh dieu phoi
- **D-02:** Guards: giu y het pd:scan — 3 guards (guard-context, guard-valid-path, guard-fastcode). Che do Doc lap bo qua guard-context
- **D-03:** Argument syntax: `pd:audit [path] [flags]` — path mac dinh ".", flags: `--full` (13 categories), `--only cat1,cat2` (chi dinh), `--poc`, `--auto-fix`
- **D-04:** --poc va --auto-fix: parse flag nhung bao "chua ho tro trong phien ban nay" — giu API on dinh tu dau cho Phase 50

### Workflow 9 buoc
- **D-05:** 6 buoc full, 3 buoc stub:
  - FULL: B1 Detect mode, B3 Scope/parse args, B5 Dispatch scanners, B6 Reporter, B7 Analyze/merge, B9 Save report
  - STUB: B2 Delta-aware (treat as full scan), B4 Smart selection (chay het 13 hoac --only), B8 Fix routing (bao "chua ho tro")
- **D-06:** Output format giua cac buoc: Markdown files trong temp dir, dung lai pattern tu pd:fix-bug
  - `/tmp/pd-audit-{hash}/01-detect.md`, `02-scope.md`, `03-dispatch/{category}.md`, `04-report.md`, `SECURITY_REPORT.md`

### 2 che do hoat dong
- **D-07:** Auto-detect: kiem tra `.planning/PROJECT.md` — ton tai = Tich hop, khong = Doc lap
- **D-08:** 3 diem khac giua 2 che do:
  1. Output path: Doc lap → `./SECURITY_REPORT.md`, Tich hop → `.planning/audit/SECURITY_REPORT.md`
  2. Guard set: Tich hop yeu cau guard-context, Doc lap bo qua
  3. Fix routing (stub): Tich hop se tao fix phases trong ROADMAP, Doc lap chi liet ke goi y trong report

### Batch dispatch
- **D-09:** Mo rong `parallel-dispatch.js` — them `buildScannerPlan(categories, batchSize, scanPath)`. Tai dung `mergeParallelResults`. Khong tao file moi
- **D-10:** Batch size mac dinh: 2 scanners/wave (7 waves cho 13 categories)
- **D-11:** Failure handling: log error, tiep tuc wave — scanner fail khong chan ca audit. Tai dung pattern tu `mergeParallelResults` hien tai

### Prior decisions (tu Phase 46)
- **D-12:** Scanner dispatch dung `getAgentConfig('pd-sec-scanner').categories` de lay 13 slugs (D-06 Phase 46)
- **D-13:** Moi scanner instance nhan `--category {slug}`, tier scout (Haiku) (D-07 Phase 46)
- **D-14:** FastCode tool-first, Grep fallback (D-08, D-09 Phase 46)

</decisions>

<specifics>
## Specific Ideas

- pd:scan la mau tham khao cho frontmatter, argument parsing, guard pattern
- parallel-dispatch.js da co buildParallelPlan + mergeParallelResults — mo rong thay vi tao moi
- session-manager.js pattern co the tai dung cho audit session directory
- Workflow 9 buoc thiet ke stub-first: B2, B4, B8 la extension points cho Phase 48-50

</specifics>

<canonical_refs>
## Canonical References

### Phase 46 artifacts (scanner foundation)
- `.planning/phases/46-nen-tang-scanner/46-CONTEXT.md` — D-06 toi D-09: scanner dispatch, tier, fallback decisions
- `references/security-rules.yaml` — 13 OWASP categories, patterns, fixes, fastcode_queries
- `commands/pd/agents/pd-sec-scanner.md` — Template agent doc YAML theo --category

### Existing code patterns
- `commands/pd/scan.md` — Skill entry point mau: frontmatter, guards, argument parsing
- `bin/lib/parallel-dispatch.js` — buildParallelPlan, mergeParallelResults — mo rong cho scanner
- `bin/lib/resource-config.js` — AGENT_REGISTRY, getAgentConfig(), isHeavyAgent()
- `bin/lib/session-manager.js` — Session folder management pattern

### Requirements
- `.planning/REQUIREMENTS.md` — CORE-01, CORE-02, CORE-03, BATCH-01, BATCH-02

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `parallel-dispatch.js`: buildParallelPlan + mergeParallelResults — mo rong them buildScannerPlan
- `resource-config.js`: getAgentConfig('pd-sec-scanner').categories — tra ve 13 slugs
- `session-manager.js`: createSession, generateSlug — tai dung cho audit session dir
- `commands/pd/scan.md`: frontmatter pattern cho pd:audit skill file

### Established Patterns
- Pure functions: khong doc file, khong require('fs'), khong side effects — tat ca modules trong bin/lib/ theo pattern nay
- Guard system: guard-context, guard-valid-path, guard-fastcode — da co san trong pd:scan
- Agent dispatch: spawn agent voi subagent_type tu AGENT_REGISTRY

### Integration Points
- pd:audit skill file → workflow orchestration
- parallel-dispatch.js → scanner wave dispatch
- resource-config.js → scanner config lookup
- security-rules.yaml → category slugs + patterns
- pd-sec-scanner.md → scanner agent template

</code_context>

<deferred>
## Deferred Ideas

- Delta-aware scanning (git diff scope) — Phase 49
- Smart scanner selection (context analysis, giam 40-60%) — Phase 48
- Fix routing (tu dong tao fix phases) — Phase 50
- POC pipeline (gadget chain) — Phase 50
- Function-level evidence checklist — Phase 48

</deferred>

---

*Phase: 47-luong-audit-cot-loi*
*Context gathered: 2026-03-26*
