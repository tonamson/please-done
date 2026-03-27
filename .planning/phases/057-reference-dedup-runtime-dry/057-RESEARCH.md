# Phase 57: Reference Dedup & Runtime DRY - Research

**Researched:** 2026-03-27
**Domain:** File merge, reference update, Node.js module extraction, converter consistency
**Confidence:** HIGH

## Summary

Phase 57 gom 2 nhom cong viec chinh: (1) gop 2 reference files thanh 1 va cap nhat toan bo references, (2) trich xuat shared installer utilities va review converter config consistency.

Codebase da co pattern ro rang cho ca 2 nhom. Reference merge la thao tac noi dung don gian — 2 file goc co noi dung hoan toan khac nhau nen chi can noi lai voi section headers. Installer utils chi can wrap `fs.mkdirSync(path, { recursive: true })` — day la pattern lap 14 lan tren 5 installer files. Converter configs da dung base converter pipeline chung, su khac biet giua cac platform la hop ly (do platform requirements khac nhau).

**Primary recommendation:** Thuc hien theo thu tu: (1) merge references truoc, (2) cap nhat tat ca source references, (3) regenerate snapshots, (4) tao installer-utils.js, (5) cap nhat 4 installers, (6) review converter configs. Thu tu nay dam bao snapshot tests khong bi break giua cac buoc.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Gop `verification-patterns.md` + `plan-checker.md` -> `verification.md` bang cach noi noi dung, giu ca 2 sections rieng biet. Section headers ro rang.
- **D-02:** File moi ten `verification.md` dat trong `references/`. Xoa 2 file cu sau khi merge.
- **D-03:** Chi cap nhat references trong source files: `commands/`, `workflows/`, `templates/`, `bin/lib/`. Day la cac file "nguon".
- **D-04:** Snapshots trong `test/snapshots/` se tu cap nhat khi chay converter — KHONG sua thu cong snapshots.
- **D-05:** Planning docs (`.planning/`) KHONG cap nhat — day la historical records.
- **D-06:** `bin/lib/utils.js` line ~254 co conditional_reading map reference `verification-patterns.md` — CAN cap nhat key thanh `verification.md`.
- **D-07:** `bin/lib/plan-checker.js` line ~10 co JSDoc reference `references/plan-checker.md` — CAN cap nhat thanh `references/verification.md`.
- **D-08:** `test/baseline-tokens.json` co entry cho `verification-patterns.md` — CAN cap nhat key.
- **D-09:** Tao `bin/lib/installer-utils.js` exports: `ensureDir(path)`, `validateGitRoot()`, `copyWithBackup(src, dest)`.
- **D-10:** 4 platform installers (codex, copilot, gemini, opencode) import utils. `claude.js` chi import neu co shared pattern.
- **D-11:** Giu logic platform-specific nguyen ven trong moi installer. Chi extract patterns lap ro rang.
- **D-12:** Review 4 converter configs cho consistent key names va format.

### Claude's Discretion
- Chi tiet merge format (heading levels, ordering) trong `verification.md`
- Ten ham cu the ngoai 3 ham da quyet dinh (neu phat hien them pattern lap)
- Muc do refactor converter configs (minor fixes vs restructure)
- Test naming va test structure cho installer-utils

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DEDU-01 | Gop `verification-patterns.md` + `plan-checker.md` -> `verification.md` | 2 file goc da doc, tong 147 + 320 dong. Noi dung khong trung lap — merge bang concatenation voi section headers |
| DEDU-02 | Cap nhat tat ca references den 2 file cu -> file moi | Da grep toan bo repo: 8 source files can cap nhat (workflows, templates, bin/lib). Snapshots tu regenerate |
| DRYU-01 | Trich `ensureDir()`, `validateGitRoot()`, `copyWithBackup()` thanh `installer-utils.js` | `mkdirSync({ recursive: true })` xuat hien 14 lan. `validateGitRoot` va `copyWithBackup` chua co — can tao moi |
| DRYU-02 | 4 platform installers import utils, giu logic platform-specific | Da doc 4 installer files, xac dinh chinh xac cac dong mkdirSync can thay the |
| DRYU-03 | Review 4 converter configs consistent | Da doc 5 converter files (base + 4 platform). Config structure da consistent qua base converter pipeline |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Dung tieng viet toan bo, co dau chuan

## Architecture Patterns

### Reference Merge Structure

File `references/verification.md` can co structure nhu sau:

```markdown
# Verification Reference

> Gop tu: verification-patterns.md + plan-checker.md

## Phan 1: Mau xac minh — Phat hien stub & placeholder

[noi dung nguyen van tu verification-patterns.md, bo dong tieu de goc]

## Phan 2: Plan Checker Rules

[noi dung nguyen van tu plan-checker.md, bo dong tieu de goc]
```

**Ly do:** 2 file goc co noi dung hoan toan khac nhau:
- `verification-patterns.md` (147 dong): mau phat hien stub/placeholder, 4 cap do xac minh
- `plan-checker.md` (320 dong): 8 check rules cho plan-checker.js, format detection, severity

### Source Files Can Cap Nhat References

Da xac dinh chinh xac cac file va dong can thay doi:

| File | Dong | Thay doi |
|------|------|----------|
| `bin/lib/utils.js` | 254 | Key `'references/verification-patterns.md'` -> `'references/verification.md'` |
| `bin/lib/plan-checker.js` | 10 | JSDoc `references/plan-checker.md` -> `references/verification.md` |
| `test/baseline-tokens.json` | 115 | Key `"references/verification-patterns.md"` -> `"references/verification.md"` |
| `workflows/plan.md` | 215 | `@references/verification-patterns.md` -> `@references/verification.md` |
| `workflows/write-code.md` | 16, 162, 344, 356 | 4 cho reference `verification-patterns.md` -> `verification.md` |
| `workflows/complete-milestone.md` | 13, 31, 76 | 3 cho reference `verification-patterns.md` -> `verification.md` |
| `templates/plan.md` | 147 | `@references/verification-patterns.md` -> `@references/verification.md` |
| `templates/verification-report.md` | 63 | `@references/verification-patterns.md` -> `@references/verification.md` |

**Luu y:** `plan-checker.md` chi duoc reference tai 1 cho duy nhat (plan-checker.js line 10). `verification-patterns.md` duoc reference tai 7 cho khac.

**KHONG cap nhat:**
- `.planning/` files (D-05 — historical records)
- `test/snapshots/` (D-04 — tu regenerate)
- `FINAL_optimize-repo.md` (planning doc)
- `.planning/MILESTONES.md` (planning doc)
- `.planning/PROJECT.md` (planning doc)

### Snapshot Regeneration

Sau khi cap nhat source files, chay:
```bash
node test/generate-snapshots.js
```

Dieu nay se regenerate toan bo 48 snapshots (4 platforms x 12 skills). Snapshots chua references/verification-patterns.md se tu dong cap nhat vi converter doc tu source files.

### baseline-tokens.json Update

File nay co entry:
```json
"references/verification-patterns.md": {
  "tokens": 1918,
  "lines": 151
}
```

Can:
1. Doi key thanh `"references/verification.md"`
2. Cap nhat `tokens` va `lines` cho file merged moi (khoang 2800-3000 tokens, ~470 dong)
3. Xoa entry `plan-checker.md` neu co (hien tai KHONG co trong baseline — chi `verification-patterns.md` co)

### Installer Utils Module

```javascript
// bin/lib/installer-utils.js
'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Tao thu muc recursive. Wrapper cho fs.mkdirSync({ recursive: true }).
 */
function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

/**
 * Kiem tra .git ton tai tai working directory.
 * Throw Error neu khong phai git repo.
 */
function validateGitRoot(dir) {
  if (!fs.existsSync(path.join(dir || process.cwd(), '.git'))) {
    throw new Error('Khong phai git repo — khong tim thay .git');
  }
}

/**
 * Copy file, tao backup neu dest da ton tai.
 * Backup file: dest + '.bak'
 */
function copyWithBackup(src, dest) {
  if (fs.existsSync(dest)) {
    fs.copyFileSync(dest, dest + '.bak');
  }
  fs.copyFileSync(src, dest);
}

module.exports = { ensureDir, validateGitRoot, copyWithBackup };
```

### Installer Update Pattern

Trong moi installer, thay doi:
```javascript
// TRUOC
const fs = require('fs');
fs.mkdirSync(someDir, { recursive: true });

// SAU
const { ensureDir } = require('./installer-utils');
// hoac
const { ensureDir } = require('../installer-utils');
ensureDir(someDir);
```

**Chi tiet mkdirSync can thay the:**

| Installer | Dong | Context |
|-----------|------|---------|
| codex.js | 34 | Tao skillDir trong vong lap |
| codex.js | 47 | Tao rulesDestDir |
| codex.js | 58 | Tao subDestDir cho rules subdirectories |
| codex.js | 96 | Tao targetDir cho MCP config |
| copilot.js | 40 | Tao skillDir trong vong lap |
| copilot.js | 69 | Tao rulesDestDir |
| copilot.js | 91 | Tao subDestDir |
| copilot.js | 105 | Tao targetDir cho instructions |
| gemini.js | 22 | Tao commandsDir |
| gemini.js | 54 | Tao rulesDestDir |
| gemini.js | 73 | Tao subDestDir |
| opencode.js | 22 | Tao commandDir |

**claude.js:** Chi co 2 cho mkdirSync (lines 142, 313) — ca 2 deu la `fs.mkdirSync(commandsDir, { recursive: true })`. Theo D-10, chi import neu co shared pattern. Claude installer co logic khac biet (symlink-based, .env copy) nen KHONG bat buoc import. Tuy nhien `ensureDir` van ap dung duoc cho 2 cho nay — de tuy y.

### Converter Config Consistency Review

Da doc ca 5 converter files. Ket qua review:

| Property | codex | copilot | gemini | opencode |
|----------|-------|---------|--------|----------|
| `runtime` | 'codex' | 'copilot' | 'gemini' | 'opencode' |
| `skillsDir` | co | co | co | co |
| `pathReplace` | '~/.codex/' | dynamic (global/local) | '~/.gemini/' | '~/.config/opencode/' |
| `buildFrontmatter` | co | co | co | co |
| `toolMap` | KHONG co | COPILOT_TOOL_MAP | GEMINI_TOOL_MAP | KHONG co |
| `pdconfigFix` | co | co | KHONG co | co |
| `mcpToolConvert` | KHONG co | co | KHONG co | KHONG co |
| `postProcess` | co | KHONG co | co | co |
| `prependBody` | co (adapter) | KHONG co | KHONG co | KHONG co |

**Nhan xet:** Su khac biet giua cac converter la **HOP LY** vi moi platform co requirements khac nhau:
- Codex can adapter header (`prependBody`) vi dung dollar-prefix syntax
- Copilot can `mcpToolConvert` vi MCP tool naming khac
- Gemini can TOML output format (postProcess khac)
- OpenCode khong can toolMap vi tool names giong Claude

**Inconsistency nho phat hien:**
1. **codex** khong dung `toolMap` tu `platforms.js` — thay vao do dung `postProcess` de replace `$ARGUMENTS` va `AskUserQuestion`. Day khong phai inconsistency — codex khong can tool mapping vi skill adapter da xu ly.
2. **gemini** khong co `pdconfigFix` — vi Gemini dung path `.gemini/commands/pd/.pdconfig` trung voi actual path nen khong can fix. Tuy nhien neu check ky thi Gemini luu `.pdconfig` trong `commandsDir` (line 88) — va `pdconfigFix` trong base converter fix path `commands/pd/.pdconfig` → khong can fix cho Gemini vi path da dung.

**Ket luan:** Converter configs da consistent trong pham vi cho phep. Khong can thay doi lon. Co the them comment giai thich tai sao moi platform co/khong co certain fields.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Directory creation | Custom mkdir logic | `ensureDir()` wrapper | Pattern lap 14 lan, de quen `{ recursive: true }` |
| Snapshot regeneration | Thu cong edit snapshots | `node test/generate-snapshots.js` | Script co san, 48 snapshots tu dong |
| Reference search | Thu cong tim references | `grep -rn "verification-patterns\|plan-checker"` | Grep da cho ket qua chinh xac |

## Common Pitfalls

### Pitfall 1: Quen cap nhat baseline-tokens.json
**What goes wrong:** Token count khong khop voi file moi, baseline tests co the fail
**Why it happens:** baseline-tokens.json it khi duoc nho toi khi rename/merge files
**How to avoid:** Cap nhat key VA values (tokens, lines) cho file merged. Chay `node bin/count-tokens.js` de tinh lai neu can.
**Warning signs:** Smoke test integrity hoac token baseline test fail

### Pitfall 2: Edit snapshots thu cong thay vi regenerate
**What goes wrong:** Snapshots khong khop voi actual converter output, 48 tests fail
**Why it happens:** Tuong rung chi can find-replace trong snapshot files
**How to avoid:** Luon dung `node test/generate-snapshots.js` sau khi thay doi source files
**Warning signs:** smoke-snapshot.test.js fail

### Pitfall 3: installer-utils.js path import sai
**What goes wrong:** `require('./installer-utils')` khong resolve dung
**Why it happens:** installer files nam trong `bin/lib/installers/` nhung utils co the dat tai `bin/lib/`
**How to avoid:** Dat `installer-utils.js` tai `bin/lib/installer-utils.js`, import tu installers bang `require('../installer-utils')`
**Warning signs:** `MODULE_NOT_FOUND` error khi chay installer

### Pitfall 4: Thay doi converter behavior khi review consistency
**What goes wrong:** Snapshot tests fail vi converter output thay doi
**Why it happens:** "Fix" mot inconsistency nhung thuc ra la platform-specific behavior
**How to avoid:** DRYU-03 la REVIEW, khong phai refactor. Chi sua khi thuc su inconsistent (VD: key name sai chinh ta), khong sua logic khac nhau giua platforms.
**Warning signs:** Snapshot tests fail sau khi "sua" converter

### Pitfall 5: Khong xoa file goc sau merge
**What goes wrong:** 2 file cu van ton tai, gay confuse va integrity test co the fail
**Why it happens:** Quen xoa sau khi tao file moi
**How to avoid:** Xoa `references/verification-patterns.md` va `references/plan-checker.md` ngay sau khi tao `references/verification.md`
**Warning signs:** Integrity test bao reference file khong dung

## Code Examples

### Merge 2 reference files

```javascript
const fs = require('fs');
const vp = fs.readFileSync('references/verification-patterns.md', 'utf8');
const pc = fs.readFileSync('references/plan-checker.md', 'utf8');

// Bo tieu de goc (dong dau tien) cua moi file
const vpBody = vp.split('\n').slice(1).join('\n').trim();
const pcBody = pc.split('\n').slice(1).join('\n').trim();

const merged = `# Verification Reference

> Gop tu: verification-patterns.md + plan-checker.md
> Doc boi: write-code (Buoc 9.5), complete-milestone (Buoc 3.5), plan-checker.js

## Phan 1: Mau xac minh — Phat hien stub & placeholder

${vpBody}

---

## Phan 2: Plan Checker Rules

${pcBody}
`;

fs.writeFileSync('references/verification.md', merged, 'utf8');
```

### Cap nhat CONDITIONAL_LOADING_MAP trong utils.js

```javascript
// TRUOC (line 254):
'references/verification-patterns.md': 'KHI task can multi-level verification (khong phai simple pass/fail)',

// SAU:
'references/verification.md': 'KHI task can multi-level verification (khong phai simple pass/fail)',
```

### Cap nhat JSDoc trong plan-checker.js

```javascript
// TRUOC (line 10):
 * Rules spec: references/plan-checker.md

// SAU:
 * Rules spec: references/verification.md
```

### Cap nhat baseline-tokens.json

```json
// XOA entry:
"references/verification-patterns.md": { "tokens": 1918, "lines": 151 }

// THEM entry (tokens/lines can tinh lai):
"references/verification.md": { "tokens": ?, "lines": ? }
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in Node.js test runner) |
| Config file | None — dung truc tiep `node --test` |
| Quick run command | `node --test test/smoke-integrity.test.js` |
| Full suite command | `node --test test/smoke-*.test.js` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DEDU-01 | verification.md ton tai, 2 file cu da xoa | smoke | `node --test test/smoke-integrity.test.js` | co (integrity test kiem tra ref ton tai) |
| DEDU-02 | Zero broken @references/ trong source files | smoke | `node --test test/smoke-integrity.test.js` | co (test kiem tra moi @ref ton tai) |
| DRYU-01 | installer-utils.js exports 3 ham | unit | `node --test test/smoke-installer-utils.test.js` | KHONG — Wave 0 |
| DRYU-02 | 4 installers dung shared utils | smoke | `node --test test/smoke-installers.test.js` | co (installer test da co san) |
| DRYU-03 | Converter configs consistent | smoke | `node --test test/smoke-converters.test.js` | co |

### Additional Tests
| Test | Command | Purpose |
|------|---------|---------|
| Snapshot tests | `node --test test/smoke-snapshot.test.js` | Dam bao converter output khong thay doi bat ngo |
| All smoke tests | `node --test test/smoke-*.test.js` | Full regression |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-integrity.test.js test/smoke-snapshot.test.js`
- **Per wave merge:** `node --test test/smoke-*.test.js`
- **Phase gate:** Full suite green truoc /gsd:verify-work

### Wave 0 Gaps
- [ ] `test/smoke-installer-utils.test.js` — covers DRYU-01 (ensureDir, validateGitRoot, copyWithBackup)

## Sources

### Primary (HIGH confidence)
- Doc truc tiep source code: bin/lib/utils.js, bin/lib/plan-checker.js, 5 installer files, 5 converter files
- Doc truc tiep: references/verification-patterns.md (147 dong), references/plan-checker.md (320 dong)
- Grep toan bo repo cho `verification-patterns.md` va `plan-checker.md` — 100% coverage
- Chay `node --test test/smoke-integrity.test.js` — 56 tests pass

### Secondary (MEDIUM confidence)
- Baseline-tokens.json analysis — file structure ro rang

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - khong co dependency moi, chi dung Node.js built-in (fs, path)
- Architecture: HIGH - doc truc tiep code, xac dinh chinh xac tung dong can thay doi
- Pitfalls: HIGH - dua tren kinh nghiem tu cac phase truoc (snapshot regeneration, baseline update)

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable — no external dependencies)
