# Phase 43: Wire INDEX.md vao Pipeline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 43-wire-index-md-pipeline
**Areas discussed:** Diem goi generateIndex(), Xu ly 2 module trung, Orchestration trong workflow

---

## Diem goi generateIndex()

### Q1: Khi nao goi generateIndex() trong pipeline research?

| Option | Description | Selected |
|--------|-------------|----------|
| Sau Fact Checker xong (Recommended) | Goi 1 lan cuoi pipeline — INDEX.md phan anh trang thai da xac minh. Tat ca files (ca internal + external) duoc index. | ✓ |
| Sau moi agent (2 lan) | Goi sau Evidence Collector va lai sau Fact Checker — INDEX.md san sang som hon cho Fact Checker cross-validate. | |
| Sau Evidence Collector | Chi goi 1 lan sau Collector — Fact Checker dung INDEX.md moi nhat de cross-validate. | |

**User's choice:** Sau Fact Checker xong (Recommended)
**Notes:** Khong co ghi chu them.

### Q2: generateIndex() can scan nhung thu muc nao?

| Option | Description | Selected |
|--------|-------------|----------|
| Ca internal/ + external/ (Recommended) | INDEX.md la chi muc toan bo research — Strategy Injection va Fact Checker can thay tat ca files de match va cross-validate | ✓ |
| Chi thu muc vua ghi | Chi index files thuoc source type cua lan chay hien tai (internal HOAC external) | |

**User's choice:** Ca internal/ + external/ (Recommended)
**Notes:** Khong co ghi chu them.

---

## Xu ly 2 module trung

### Q3: generateIndex() ton tai o ca research-store.js va index-generator.js. Xu ly the nao?

| Option | Description | Selected |
|--------|-------------|----------|
| Dung index-generator.js (Recommended) | Module chuyen biet hon — co parseResearchFiles + buildIndexRow. research-store.js delegate sang no hoac bo export generateIndex. | ✓ |
| Dung research-store.js | Giu ngoi nha goc P38 — index-generator.js tro thanh thua. | |
| Giu ca 2, khong doi | Ca 2 van hoat dong, khong can refactor. | |

**User's choice:** Dung index-generator.js (Recommended)
**Notes:** Khong co ghi chu them.

### Q4: research-store.js hien export generateIndex. Bo export hay delegate sang index-generator.js?

| Option | Description | Selected |
|--------|-------------|----------|
| Delegate (Recommended) | research-store.js giu export generateIndex nhung noi bo goi index-generator.js — backward compatible, khong break callers | ✓ |
| Bo export | Xoa generateIndex khoi research-store.js — callers phai chuyen sang import index-generator.js | |

**User's choice:** Delegate (Recommended)
**Notes:** Khong co ghi chu them.

---

## Orchestration trong workflow

### Q5: Ai doc files + goi generateIndex() sau pipeline xong?

| Option | Description | Selected |
|--------|-------------|----------|
| Tao CLI script (Recommended) | Tao bin/update-research-index.js — doc tat ca .md trong internal/ + external/, parse frontmatter, goi generateIndex(), ghi INDEX.md. Workflow chi can chay `node bin/update-research-index.js` | ✓ |
| Inline trong workflow prompt | Them huong dan trong research.md de agent tu doc files + goi generateIndex qua Bash. Khong can file moi, nhung agent co the lam sai. | |
| Dung parseResearchFiles tu index-generator.js | parseResearchFiles da handle parse frontmatter. CLI script goi parseResearchFiles -> generateIndex. Gon hon option 1. | |

**User's choice:** Tao CLI script (Recommended)
**Notes:** Khong co ghi chu them.

### Q6: CLI script co nen dung parseResearchFiles() tu index-generator.js de parse frontmatter khong?

| Option | Description | Selected |
|--------|-------------|----------|
| Co, dung parseResearchFiles (Recommended) | index-generator.js da co parseResearchFiles handle parse frontmatter. CLI script chi can: doc files -> goi parseResearchFiles -> generateIndex -> ghi INDEX.md | ✓ |
| Khong, tu parse | CLI script tu doc files va parse frontmatter — khong phu thuoc index-generator.js | |

**User's choice:** Co, dung parseResearchFiles (Recommended)
**Notes:** Khong co ghi chu them.

---

## Claude's Discretion

- Error handling cho edge cases (thu muc rong, file khong co frontmatter)
- Test data fixtures
- So luong plans va task breakdown

## Deferred Ideas

None — discussion stayed within phase scope.
