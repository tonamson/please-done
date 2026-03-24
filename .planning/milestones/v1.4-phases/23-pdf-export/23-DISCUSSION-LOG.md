# Phase 23: PDF Export - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 23-pdf-export
**Areas discussed:** Mermaid → Image, PDF styling, Dependency strategy, Fallback behavior

---

## Mermaid → Image

### Q1: Mermaid text duoc render thanh hinh anh bang cach nao?

| Option | Description | Selected |
|--------|-------------|----------|
| Puppeteer render | Load Mermaid.js trong headless Chrome, render truc tiep → screenshot PNG. Chat luong cao, cung Puppeteer dung cho PDF | ✓ |
| mermaid-cli pre-render | Dung @mermaid-js/mermaid-cli render Mermaid → SVG/PNG truoc | |
| Inline SVG trong HTML | Load mermaid.js CDN, render client-side trong Puppeteer | |

**User's choice:** Puppeteer render (Recommended)
**Notes:** Cung Puppeteer dung cho ca render Mermaid va xuat PDF — khong can them dep

### Q2: Mermaid.js load tu dau khi render trong Puppeteer?

| Option | Description | Selected |
|--------|-------------|----------|
| CDN | Load tu cdn.jsdelivr.net/npm/mermaid. Nhe, luon latest. Can internet | ✓ |
| Bundled local | Copy mermaid.min.js vao project (vendor/). Offline-capable, tang repo ~2MB | |
| npm install | Them mermaid vao devDependencies | |

**User's choice:** CDN (Recommended)

### Q3: Output hinh anh Mermaid o dinh dang nao trong PDF?

| Option | Description | Selected |
|--------|-------------|----------|
| Inline render | Render Mermaid truc tiep trong HTML page → print toan bo sang PDF. SVG sac net | ✓ |
| PNG screenshots | Screenshot tung diagram rieng le thanh PNG, nhung vao HTML bang <img> | |
| SVG file rieng | Export Mermaid thanh .svg file, nhung vao HTML | |

**User's choice:** Inline render (Recommended)
**Notes:** SVG inline sac net o moi zoom level

---

## PDF Styling

### Q1: Muc do chuyen nghiep cua PDF?

| Option | Description | Selected |
|--------|-------------|----------|
| Professional | CSS day du: font sans-serif, margin rong, heading Corporate Blue, table borders, page breaks | ✓ |
| Minimal clean | CSS nhe: font mac dinh, margin chuan, khong color brand | |
| Branded | Professional + cover page, header/footer moi trang, page numbers | |

**User's choice:** Professional (Recommended)

### Q2: CSS styling duoc embed o dau?

| Option | Description | Selected |
|--------|-------------|----------|
| Inline trong script | CSS la template string trong generate-pdf-report.js. Tat ca 1 file | ✓ |
| File CSS rieng | Tao templates/pdf-styles.css. Tach biet concerns | |
| Markdown CSS theme | Dung github-markdown.css, override Corporate Blue colors | |

**User's choice:** Inline trong script (Recommended)

### Q3: Kich thuoc trang PDF?

| Option | Description | Selected |
|--------|-------------|----------|
| A4 | 210×297mm — chuan van phong Viet Nam va quoc te | ✓ |
| Letter | 8.5×11in — chuan My | |
| Bo qua (You decide) | Claude chon phu hop | |

**User's choice:** A4 (Recommended)

---

## Dependency Strategy

### Q1: Puppeteer duoc quan ly the nao trong project?

| Option | Description | Selected |
|--------|-------------|----------|
| Runtime detect | KHONG them vao package.json. try/catch require('puppeteer'). Giu zero production deps | ✓ |
| Optional peer dep | Them vao peerDependencies + peerDependenciesMeta (optional: true) | |
| devDependency | Them vao devDependencies. Auto install | |

**User's choice:** Runtime detect (Recommended)
**Notes:** Giu zero production deps — nhat quan voi project constraint

### Q2: Khi Puppeteer khong co, script huong dan user the nao?

| Option | Description | Selected |
|--------|-------------|----------|
| Log install command | In ra: 'PDF export can Puppeteer. Chay: npm install puppeteer' roi fallback | ✓ |
| Chi warning | Log warning chung, khong chi cu the cach cai | |
| Silent fallback | Khong noi gi, tu dong fallback | |

**User's choice:** Log install command (Recommended)

---

## Fallback Behavior

### Q1: Khi khong co Puppeteer, output fallback la gi?

| Option | Description | Selected |
|--------|-------------|----------|
| Markdown file | Xuat .md da fill day du data (Mermaid text giu nguyen). Doc tren GitHub/VS Code | ✓ |
| HTML file | Xuat .html voi Mermaid CDN script. Mo browser la thay diagram | |
| Plain text | Xuat .txt khong co formatting | |

**User's choice:** Markdown file (Recommended)
**Notes:** GitHub auto-render Mermaid code blocks — user van thay diagram

### Q2: Khi Node.js < 18, xu ly the nao?

| Option | Description | Selected |
|--------|-------------|----------|
| Same fallback | Check Node version, neu < 18 thi log warning + xuat Markdown. Logic giong nhau | ✓ |
| Block + error | In error va exit. Khong tao file gi | |
| Try anyway | Van thu load Puppeteer — neu fail thi fallback | |

**User's choice:** Same fallback (Recommended)

### Q3: Script exit code khi fallback?

| Option | Description | Selected |
|--------|-------------|----------|
| Exit 0 + warning | Fallback thanh cong = exit 0. Log warning. Non-blocking cho CI/CD | ✓ |
| Exit 1 | Fallback = partial failure, exit 1 | |
| Exit 2 (custom) | Exit code rieng cho fallback | |

**User's choice:** Exit 0 + warning (Recommended)
**Notes:** Non-blocking cho Phase 24 workflow integration

---

## Claude's Discretion

- Script CLI interface (args, options, output path)
- HTML template structure cho Puppeteer page
- Markdown-to-HTML conversion approach
- Test strategy va test cases cu the
- Error handling chi tiet trong render pipeline

## Deferred Ideas

None — discussion stayed within phase scope
