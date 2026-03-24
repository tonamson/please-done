# Project Research Summary

**Project:** please-done v1.4 — Visual Business Logic Reports
**Domain:** Mermaid.js diagram generation, PDF export, management report templates, workflow integration
**Researched:** 2026-03-24
**Confidence:** HIGH

## Executive Summary

Milestone v1.4 them visual reporting vao please-done AI coding skill framework. Hien tai, toan bo dau ra cua framework la Markdown thuan tuy — cac nha quan ly nhan duoc danh sach task va bang loi, khong co bieu do luong nghiep vu hay kien truc he thong. v1.4 lap day khoang trong nay bang cach sinh so do Mermaid tu du lieu co cau truc san co (bang Truths, Key Links, Artifacts, CODE_REPORTs) roi dong goi thanh MANAGEMENT_REPORT.md chuyen nghiep kem xuat PDF. Loi the cot loi so voi cac cong cu SaaS: moi node trong so do co the truy vet nguoc ve Truth ID — duong ket noi truc tiep tu yeu cau nghiep vu -> ke hoach trien khai -> so do truc quan -> bao cao PDF.

Huong tiep can duoc khuyen nghi la kien truc hai lop: Lop 1 la AI sinh Mermaid-in-Markdown (zero dependencies, hoat dong tren Node 16.7+); Lop 2 la xuat PDF tuy chon qua Puppeteer (yeu cau Node 18+, cai rieng). Stack cu the la `puppeteer@24` + `marked@17` trong mot script tuy chinh `scripts/generate-report-pdf.js` — khong dung wrapper package vi md-to-pdf khong ho tro Mermaid native va triet ly du an la "pure scripts, no bundler". Day la 2 runtime dependency dau tien cua du an ke tu khi ra mat, nhung khong duoc them vao `package.json` dependencies chinh — phai dung runtime detection de bao toan install experience cho nguoi dung hien tai.

Rui ro chinh la Puppeteer/Chromium binary bloat (~200MB) pha vo install experience neu bi them sai vao dependencies, Node.js version incompatibility neu nang engines tu 16.7 len 18 mot cach khong can than, va AI-generated Mermaid syntax errors do Mermaid parser nghiem ngat voi ky tu dac biet. Ba rui ro nay co the gay cascading failure xuyen suot toan bo 4 phase neu khong duoc giai quyet o Phase 1. Mitigation ro rang: Puppeteer la opt-in runtime dependency; giu `engines.node >= 16.7.0`; them Mermaid syntax validator khong can Puppeteer (merval pattern) vao Phase 2 truoc khi viet script.

---

## Key Findings

### Recommended Stack

Toan bo ecosystem Mermaid/PDF yeu cau Node 18+, tuy nhien du an phai giu kha nang tuong thich voi Node 16.7+. Giai phap la dung lazy `require()` va runtime detection — script kiem tra Node version va Puppeteer availability luc chay, khong phai luc install. Mermaid duoc inject qua CDN vao Puppeteer page context (khong cai npm) vi Mermaid can DOM (`SVGTextElement.getBBox`) khong the chay server-side thuan tuy.

**Core technologies:**
- `puppeteer@24`: PDF generation + headless Chrome cho Mermaid rendering — industry standard, tu download Chromium, Node 18+ required. Dung `puppeteer` (full) khong dung `puppeteer-core` de script "just work" ma khong can nguoi dung tu cau hinh Chrome path.
- `marked@17`: Markdown-to-HTML voi custom renderer — 11,484 dependents, nhe, nhanh. Custom renderer intercept mermaid code blocks thanh `<pre class="mermaid">` cho Mermaid CDN render.
- `mermaid@11` (CDN, khong npm): Diagram rendering trong Puppeteer page context — inject qua `page.addScriptTag({ url: CDN_URL })`. Pin version cu the de tranh CDN thay doi.
- Mermaid syntax validator (zero-dependency, pure JS): validate truoc khi render, tranh crash workflow. Pattern: merval library hoac viet nho tuong duong.

**Khong dung:** md-to-pdf (khong native Mermaid), mermaid npm package trong Node.js (can DOM), puppeteer-core (yeu cau manual Chrome config), architecture-beta / C4Context (experimental syntax, rui ro render).

**Chi tiet:** Xem `.planning/research/STACK.md`

### Expected Features

6 tinh nang bat buoc cho v1.4, co dependency chain ro rang: TS-1 la root, TS-2 va TS-3 song song sau TS-1, TS-4 phu thuoc TS-2 va TS-3, TS-5 phu thuoc TS-4, TS-6 phu thuoc TS-5 va toan bo upstream.

**Must have (table stakes — toan bo 6 phai ship):**
- **TS-1: Mermaid Aesthetics Rules** (`references/mermaid-rules.md`) — foundation: color palette, node shapes (service=rounded, DB=cylinder, API=hexagon), label conventions (toi da 20 ky tu/node), max 15-20 nodes/diagram, direction rules (TD cho logic, LR cho architecture), bat buoc double-quote quoting cho moi node label
- **TS-2: Business Logic Flowchart** (`flowchart TD` tu Truths + Key Links) — core visual deliverable; node = Truth description, decision diamond = Edge Cases; tuy chon gop D-1 (Truth ID annotation)
- **TS-3: Architecture Diagram** (`flowchart LR` voi subgraphs tu Artifacts + Key Links + CODE_REPORTs) — system structure; subgraph = module boundary; tranh experimental syntax
- **TS-4: Management Report Template** (`templates/management-report.md`) — 7 sections: Executive Summary, Business Outcomes, Architecture Overview, Key Feature Flows, Quality Metrics, Risk & Tech Debt, Next Steps; ngon ngu tieng Viet huong san pham theo ui-brand.md Layer 1
- **TS-5: PDF Export Script** (`scripts/generate-report-pdf.js`) — Puppeteer pipeline: read .md -> HTML (marked) -> inject Mermaid CDN -> render -> page.pdf(); graceful degradation neu Node < 18 hoac Puppeteer chua cai; 30s timeout; `finally` cleanup
- **TS-6: Workflow Integration** (them Buoc 4.5 + 4.6 vao `workflows/complete-milestone.md`) — non-blocking, optional; MILESTONE_COMPLETE.md luon duoc tao bat ke diagram step co thanh cong hay khong

**Should have (differentiators — them sau validation, v1.4.x):**
- **D-1: Truth-to-Diagram Tracing** — annotate flowchart nodes voi Truth ID (e.g., `T1: [mo ta]`); low marginal cost, co the gop vao TS-2
- **D-2: Cross-Phase Dependency Diagram** — flowchart LR tu cross-phase integration table da tinh o Buoc 3.5b
- **D-4: Quality Dashboard** — Mermaid `pie` chart cho test/bug metrics

**Defer (v1.5+):**
- D-3: Sequence Diagrams (chi can cho milestone co API features)
- D-5: Milestone Timeline (gantt; can date tracking chua co)
- Upgrade len `architecture-beta` syntax (khi Mermaid on dinh API)

**Anti-features — khong lam:**
- Interactive HTML diagrams (can web server, pha vo CLI workflow)
- Real-time diagrams trong write-code (qua phuc tap cho prompt-based system)
- Full code-to-flowchart conversion (so do khong doc duoc, sai muc dich)

**Chi tiet:** Xem `.planning/research/FEATURES.md`

### Architecture Approach

Kien truc hai lop tach biet hoan toan AI text generation (zero dependencies, chay tren moi Node version) khoi PDF rendering (Puppeteer, Node 18+, optional). Lop 1 luon hoat dong va da co gia tri vi Mermaid-in-Markdown render native tren GitHub, VS Code, va cac Markdown viewer hien dai. Lop 2 la convenience cho manager nhan PDF. Moi component moi deu theo 6 patterns da thiet lap cua du an: template-driven output, conditional reading, pure functions, CLI wrapper, graceful degradation, non-blocking workflow steps.

**Major components (6 moi, 5 sua doi):**
1. `references/mermaid-rules.md` [MOI] — standalone reference, zero dependencies, dinh nghia visual language
2. `templates/management-report.md` [MOI] — scaffold template voi Mermaid block placeholders, AI dien noi dung thuc
3. `bin/lib/mermaid-validator.js` [MOI] — pure-function validator, zero deps, validate syntax truoc render
4. `scripts/generate-report-pdf.js` [MOI] — CLI script voi lazy require Puppeteer, graceful exit neu thieu dep
5. `bin/lib/report-generator.js` [MOI, optional] — pure-function helpers extract data tu CODE_REPORTs
6. `workflows/complete-milestone.md` [SUA] — them Buoc 4.5 (MANAGEMENT_REPORT.md) + Buoc 4.6 (optional PDF)
7. `commands/pd/complete-milestone.md` [SUA] — them conditional_reading cho template + mermaid-rules
8. `test/smoke-mermaid-validator.test.js` [MOI] — unit tests cho validator
9. `package.json` [SUA] — them npm script `"report:pdf"` (KHONG them puppeteer/marked vao dependencies)
10. 48 converter snapshots [REGENERATE] — sau khi sua complete-milestone.md

**Files khong thay doi:** `plan-checker.js`, `workflows/plan.md`, `workflows/write-code.md`, `templates/plan.md`, platform converters (tu dong propagate).

**Chi tiet:** Xem `.planning/research/ARCHITECTURE.md`

### Critical Pitfalls

1. **Puppeteer vao main package.json dependencies** — pha vo Node 16.7 compatibility, tang install size 10,000x, anh huong tat ca users. Phong tranh: dung `try/require` runtime detection; KHONG them vao `dependencies` hay `devDependencies`; giu `engines.node >= 16.7.0`.

2. **AI-generated Mermaid syntax errors crash render pipeline** — Mermaid parser khong co partial-render mode, mot ky tu sai pha vo toan bo diagram. LLMs thuong sinh sai syntax (ky tu dac biet, reserved keywords, zero-width chars). Phong tranh: bat buoc double-quote quoting cho toan bo node labels trong mermaid-rules.md; them merval-style validator truoc khi render; graceful degradation sang raw Mermaid code block neu render fail.

3. **complete-milestone workflow bi fragile** — bat ky failure nao o diagram step khong duoc block milestone completion. Phong tranh: Buoc 4.5 va 4.6 phai non-blocking; workflow instruction dung "attempt" khong dung "phai"; feature-flag: chi attempt render neu Puppeteer available.

4. **Existing 448+ tests bi break** — Puppeteer import o top-level crash khi chua install; snapshot tests detect moi change trong workflows/templates. Phong tranh: lazy require trong function body; skip-guard trong test files; regenerate 48 snapshots sau khi thay doi complete-milestone.md trong commit tach biet.

5. **Headless Chrome failures trong CI/Docker** — missing system libraries, no sandbox, corporate antivirus block Chromium. Phong tranh: PDF generation khong duoc la CI step; test Mermaid syntax only trong CI (zero-dep validator); script gracefully exit voi install instructions.

6. **Vietnamese font rendering** — dau tieng Viet bi garbled trong PDF neu khong cau hinh font. Phong tranh: specify `fontFamily: "Noto Sans"` hoac font tuong duong trong Puppeteer page styles; test thuc te voi van ban tieng Viet truoc khi merge.

**Chi tiet:** Xem `.planning/research/PITFALLS.md`

---

## Implications for Roadmap

Dependency chain TS-1 -> {TS-2, TS-3} -> TS-4 -> TS-5 -> TS-6 quyet dinh thu tu phase bat buoc. Khong the thay doi thu tu nay.

### Phase 1: Foundation — Mermaid Rules + Management Report Template
**Rationale:** TS-1 la root dependency. Tat ca diagram features phu thuoc vao rules. TS-4 template can biet diagram output format de define embedding structure. Ca hai component deu standalone (zero dependencies), khong rui ro ky thuat. Phase nay thiet lap visual language va report format cho toan bo milestone.
**Delivers:** `references/mermaid-rules.md` (node shapes, colors, label conventions, max 20 nodes, quoting rules, direction rules, anti-patterns) + `templates/management-report.md` (7-section scaffold template voi Mermaid placeholders va huong dan cho AI)
**Addresses:** TS-1, TS-4 (foundation)
**Avoids:** Pitfall 3 (AI syntax errors) bang explicit quoting rules va negative examples trong mermaid-rules.md

### Phase 2: Diagram Generation + Mermaid Validator
**Rationale:** TS-2 va TS-3 co the build song song sau Phase 1. Mermaid validator phai ton tai truoc khi viet PDF script de validation logic co the unit test doc lap khong can Puppeteer. `report-generator.js` la optional acceleration — AI co the generate diagrams thuan tuy tu doc CODE_REPORTs.
**Delivers:** `bin/lib/mermaid-validator.js` (pure-function, zero deps, validate syntax truoc render) + `test/smoke-mermaid-validator.test.js` + `bin/lib/report-generator.js` (optional) + workflow instructions cho AI tao `flowchart TD` va `flowchart LR` theo rules
**Addresses:** TS-2 (Business Logic Flowchart), TS-3 (Architecture Diagram); tuy chon gop D-1 (Truth ID annotation)
**Uses:** Pure-function pattern tu `plan-checker.js`; merval pattern cho validation
**Avoids:** Pitfall 3 (syntax validation truoc render); Pitfall 5 (pure functions khong can Puppeteer, tests luon pass)

### Phase 3: PDF Export Script
**Rationale:** Script can template (Phase 1) de test end-to-end, va can validator (Phase 2) cho pre-render validation. Day la phase co rui ro ky thuat cao nhat vi lien quan den Puppeteer, Chromium, file I/O, cross-platform. Phai build doc lap truoc khi integrate vao workflow.
**Delivers:** `scripts/generate-report-pdf.js` (lazy require Puppeteer, Node version check, 30s timeout, `finally` cleanup, graceful exit khi thieu deps) + npm script `"report:pdf"` trong package.json
**Addresses:** TS-5 (PDF Export Script)
**Uses:** `puppeteer@24` + `marked@17` + Mermaid CDN injection (`mermaid@11`)
**Avoids:** Pitfall 1 (Node version — graceful exit Node < 18); Pitfall 2 (Puppeteer khong trong main deps); Pitfall 6 (CI/Docker — PDF khong phai CI step); Vietnamese font configuration trong script

### Phase 4: Workflow Integration + Snapshot Regeneration
**Rationale:** TS-6 phai la phase cuoi vi phu thuoc tat ca upstream features. Thay doi `complete-milestone.md` affects tat ca 5 platform converters (48 snapshots). Regenerate snapshots phai la buoc rieng biet va duoc kiem tra ky. Day la phase co rui ro trung binh-cao nhat ve test stability.
**Delivers:** `workflows/complete-milestone.md` (Buoc 4.5 non-blocking + Buoc 4.6 optional) + `commands/pd/complete-milestone.md` (conditional_reading) + 48 converter snapshots regenerated + Step 10 notification cap nhat PDF path
**Addresses:** TS-6 (Workflow Integration)
**Avoids:** Pitfall 4 (workflow fragility — non-blocking, optional); Pitfall 5 (snapshot regeneration trong isolated commit, khong gop voi workflow change commit)

### Phase Ordering Rationale

- **Foundation truoc:** TS-1 la root dependency, khong the bo qua. Template can rules truoc khi define scaffold. Ca hai la additive files moi, zero-risk.
- **Validator truoc Script:** Mermaid validator phai ton tai truoc PDF script de pre-render validation co the goi validator. Tach biet validation logic khoi rendering logic cho phep unit test doc lap.
- **Script truoc Workflow:** PDF script phai duoc test doc lap truoc khi integrate vao complete-milestone workflow de tranh pha vo workflow dang stable va da duoc battle-tested qua 4 milestones.
- **Workflow la cuoi cung:** Thay doi complete-milestone la high-risk (affects 5 converters, 48 snapshots). Delay den cuoi de co the test hoan chinh voi script da verify.
- **Tach biet rui ro:** Phase 1-2 zero-risk (khong dependency moi); Phase 3 high-risk (Puppeteer) duoc co lap; Phase 4 medium-risk (workflow change) duoc test sau khi Phase 3 stable.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (PDF Script):** Puppeteer/Chromium timing issues va `waitForSelector` pattern cu the cho Mermaid render completion; Vietnamese font availability trong Chromium bundled by Puppeteer; cross-platform behavior (macOS/Linux/Windows); `page.pdf()` options cho landscape orientation voi wide flowcharts.
- **Phase 4 (Workflow Integration):** Cu phap chinh xac cua conditional_reading trong complete-milestone command file; cach cac converter inline content de predict snapshot changes truoc khi chay.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Tao reference/template file la well-documented pattern trong du an. Xem `references/ui-brand.md` va `templates/plan.md` lam mau.
- **Phase 2 (Validator):** Pure-function validator theo pattern cua `plan-checker.js`. Mermaid syntax spec day du trong official docs. Khong can research them.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | puppeteer, marked, mermaid-cli deu duoc verify tu official docs. Node version requirements la hard constraints da xac nhan. Tat ca alternatives duoc phan tich va loai bo voi ly do cu the. |
| Features | HIGH | 6 table stakes features deu co trong PROJECT.md requirements. Dependency chain duoc phan tich tu codebase thuc te. Data sources (Truths, Artifacts, Key Links) da ton tai va co cau truc. |
| Architecture | HIGH | Toan bo codebase hien tai da duoc doc va phan tich (10 workflows, 11 templates, tat ca converters, 448+ tests). Cac patterns tich hop da duoc verify. File layout sau v1.4 da duoc dinh nghia cu the. |
| Pitfalls | HIGH | Cac pitfall dua tren GitHub issues thuc te (mermaid-cli #842, #556, #958), Puppeteer docs, va phan tich truc tiep codebase. Recovery strategies duoc document cho moi pitfall. |

**Overall confidence:** HIGH

### Gaps to Address

- **md-mermaid-to-pdf vs puppeteer+marked custom script:** ARCHITECTURE.md de xuat `md-mermaid-to-pdf` nhu Layer 2 package, nhung STACK.md khuyen nghi custom script `puppeteer + marked` truc tiep. Hai file nghien cuu co su khong nhat quan nay. **Khuyen nghi: theo STACK.md** — custom script phu hop hon voi triet ly du an, md-mermaid-to-pdf la package it duoc verify (MEDIUM confidence).

- **optionalDependencies vs runtime detection:** ARCHITECTURE.md de xuat `optionalDependencies` trong package.json, nhung PITFALLS.md khuyen nghi khong them bat ky gi vao package.json va dung runtime detection hoan toan. **Khuyen nghi: runtime detection** (theo PITFALLS.md) de hoan toan khong anh huong install experience. Can quyet dinh cuoi trong Phase 1 planning.

- **Diagram node limit:** ARCHITECTURE.md noi max 15 nodes, FEATURES.md noi 25-30 nodes, PITFALLS.md noi 15-20 nodes. **Khuyen nghi: 20 nodes hard limit, 15 nodes recommended** — ghi ro trong mermaid-rules.md voi ly giai: duoi 15 nodes la ideal, 15-20 chap nhan duoc, tren 20 phai split thanh overview + detail diagrams.

- **Vietnamese font testing:** Can xac nhan fonts cu the available trong Chromium bundled by Puppeteer@24 tren macOS va Linux. Can test thuc te trong Phase 3 truoc khi merge. Noto Sans la first candidate.

---

## Sources

### Primary (HIGH confidence)

- Codebase analysis: `workflows/complete-milestone.md`, `templates/plan.md`, `references/ui-brand.md`, `bin/lib/plan-checker.js`, `package.json`, `test/` directory (448+ tests, 48 snapshots)
- [Puppeteer system requirements](https://pptr.dev/guides/system-requirements) — Node 18+ requirement confirmed
- [@mermaid-js/mermaid-cli npm](https://www.npmjs.com/package/@mermaid-js/mermaid-cli) — Node ^18.19 || >=20 requirement confirmed
- [marked npm](https://www.npmjs.com/package/marked) — v17.0.5, current/LTS Node only
- [Mermaid Flowchart Syntax](https://mermaid.js.org/syntax/flowchart.html) — official syntax reference
- [Puppeteer troubleshooting](https://pptr.dev/troubleshooting) — headless Chrome failure modes
- [Node.js EOL dates](https://endoflife.date/nodejs) — Node 16 EOL Sep 2023

### Secondary (MEDIUM confidence)

- [Merval — zero-dependency Mermaid validator](https://github.com/aj-archipelago/merval) — validation without Puppeteer pattern
- [mermaid-cli Issue #958](https://github.com/mermaid-js/mermaid-cli/issues/958) — CrowdStrike interference voi Chromium
- [mermaid-cli Issue #842](https://github.com/mermaid-js/mermaid-cli/issues/842) — chrome-headless-shell not found
- [GenAIScript: fixing AI-generated Mermaid errors](https://microsoft.github.io/genaiscript/blog/mermaids/) — LLM Mermaid syntax patterns
- [Mermaid server-side rendering — Issue #3650](https://github.com/mermaid-js/mermaid/issues/3650) — DOM required, JSDOM insufficient
- [Puppeteer Issue #3027](https://github.com/puppeteer/puppeteer/issues/3027) — Chromium binary size
- [md-mermaid-to-pdf npm](https://www.npmjs.com/package/md-mermaid-to-pdf) — alternative package (MEDIUM: chua verify production-readiness)

### Tertiary (LOW confidence)

- [mermaid-md-to-pdf (klokie)](https://github.com/klokie/mermaid-md-to-pdf) — LOW: chi 5 commits, khong co releases, khong dung
- [sebastianjs pure SVG renderer](https://github.com/mermaid-js/mermaid) — LOW: wrapper khong chinh thuc, co the render khac real Mermaid

---
*Research completed: 2026-03-24*
*Ready for roadmap: yes*
