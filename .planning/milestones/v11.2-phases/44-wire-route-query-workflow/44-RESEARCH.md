# Phase 44: Wire routeQuery vao Workflow - Research

**Researched:** 2026-03-26
**Domain:** Workflow integration — thay inline heuristic bang routeQuery() call
**Confidence:** HIGH

## Summary

Phase nay thay the inline routing heuristic trong `workflows/research.md` Buoc 1 (dong 16-18) bang mot CLI script goi `routeQuery()` tu `bin/lib/research-store.js`. routeQuery() da co san voi 10+ regex patterns va 20 tests passing — chi can tao CLI wrapper va cap nhat workflow.

Cong viec gom 3 phan: (1) tao `bin/route-query.js` theo pattern cua `bin/update-research-index.js`, (2) thay inline code trong workflow bang `node bin/route-query.js "$TOPIC"`, (3) regenerate 4 converter snapshots vi workflow content thay doi.

**Primary recommendation:** Tao CLI script don gian, thay 3 dong inline bang 1 dong CLI call, regenerate snapshots.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Tao CLI script `bin/route-query.js` — nhat quan voi Phase 43 pattern (bin/*.js goi bin/lib/*.js). Workflow goi: `ROUTE=$(node bin/route-query.js "$TOPIC")`.
- D-02: Script nhan 1 argument (topic string), goi `routeQuery()` tu research-store.js, in ket qua ra stdout ('internal' hoac 'external'). Exit code 0.
- D-03: Trust routeQuery() hoan toan — khong can fallback hay comparison voi inline cu.
- D-04: Giu nguyen hien thi "Da phan loai: [internal|external] research" — chi thay doi source tu inline sang routeQuery.
- D-05: Xoa hoan toan inline heuristic code trong workflows/research.md Buoc 1 (dong 16-18). Thay bang 1 dong goi CLI script. Khong giu comment ghi chu lich su.
- D-06: Buoc 1 sau khi sua: (1) Lay topic, (2) Xac dinh thu muc research, (3) `ROUTE=$(node bin/route-query.js "$TOPIC")`, (4) Hien thi, (5) Xac dinh thu muc con.
- routeQuery() tra ve 'internal'|'external', default external (Phase 42 D-01~D-03) — locked
- CLI script pattern: bin/*.js goi bin/lib/*.js (Phase 43 D-05) — locked
- Workflow goi CLI qua `node bin/...` (Phase 43 D-06) — locked
- Converter pipeline + snapshot regeneration khi workflow thay doi (Phase 42 D-15) — locked

### Claude's Discretion
- Error handling cho route-query.js (missing argument, empty string)
- Test data fixtures
- So luong plans va task breakdown

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STORE-04 | Lenh `pd research` tu dong route internal vs external dua tren noi dung cau hoi | routeQuery() da implement 10+ patterns (Phase 42). Phase nay wire no vao workflow de `pd research` thuc su su dung routeQuery thay vi inline heuristic |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Dung tieng Viet toan bo, co dau chuan — ap dung cho commit messages, output hien thi, comments trong code

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node:test | built-in | Test framework | Nhat quan voi tat ca tests trong project |
| node:assert/strict | built-in | Assertions | Nhat quan voi tat ca tests trong project |

### Supporting
Khong co thu vien ngoai — chi dung Node.js built-in modules (fs, path, process).

## Architecture Patterns

### CLI Script Pattern (tu Phase 43)

Pattern da thiet lap: `bin/*.js` la CLI entry point, `bin/lib/*.js` la library code.

```
bin/
├── route-query.js           # NEW — CLI wrapper cho routeQuery()
├── update-research-index.js # Phase 43 — CLI wrapper cho generateIndex()
└── lib/
    └── research-store.js    # routeQuery() da co san (dong 353)
```

### Pattern 1: CLI Script Template

**What:** Mau code cho `bin/route-query.js` dua tren `bin/update-research-index.js`
**When to use:** Khi tao CLI wrapper cho library function

```javascript
// Source: bin/update-research-index.js (Phase 43 pattern)
#!/usr/bin/env node
'use strict';

const { routeQuery } = require('./lib/research-store');

const topic = process.argv[2];
if (!topic || !topic.trim()) {
  // routeQuery da handle empty string -> return 'external'
  // nhung CLI nen tra ve 'external' luon cho nhat quan
  console.log('external');
  process.exit(0);
}

const result = routeQuery(topic);
console.log(result);
```

### Pattern 2: Workflow CLI Call

**What:** Cach workflow goi CLI script va su dung ket qua
**When to use:** Trong workflows/research.md Buoc 1

```markdown
3. Phan loai topic:
   ```
   ROUTE=$(node bin/route-query.js "$TOPIC")
   ```
```

### Anti-Patterns to Avoid
- **Giu lai inline heuristic "de backup":** routeQuery co 20 tests, inline chi co ~5 rules. Khong can fallback (D-03).
- **Duplicate patterns:** KHONG copy regex patterns tu routeQuery vao workflow hoac CLI script. routeQuery la source of truth duy nhat.
- **Them validation phuc tap trong CLI:** routeQuery da handle edge cases (empty string, non-string). CLI chi can forward va print.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Query routing logic | Inline regex trong workflow | routeQuery() tu research-store.js | 10+ patterns, 20 tests, da verified |
| CLI argument parsing | Custom parser | process.argv[2] truc tiep | Chi co 1 argument, khong can options |

**Key insight:** routeQuery() da la pure function voi full coverage. CLI script chi la thin wrapper — khong them logic.

## Common Pitfalls

### Pitfall 1: Quen regenerate snapshots
**What goes wrong:** 4 converter snapshot tests (codex, copilot, gemini, opencode) se fail vi `workflows/research.md` content thay doi
**Why it happens:** Converters transform workflow files -> platform-specific format. Khi workflow thay doi, output thay doi, snapshot outdated.
**How to avoid:** Chay `node test/generate-snapshots.js` SAU khi sua workflow, TRUOC khi chay tests.
**Warning signs:** 4 snapshot test failures dong loat cho research.md

### Pitfall 2: Shebang line missing
**What goes wrong:** Script khong chay truc tiep duoc neu thieu `#!/usr/bin/env node`
**Why it happens:** Copy paste thieu dong dau
**How to avoid:** Follow template tu `bin/update-research-index.js` — dong 1 la shebang

### Pitfall 3: Inline heuristic con sot
**What goes wrong:** Workflow van co logic routing cu ben canh CLI call moi
**Why it happens:** Xoa khong het, hoac giu lai "de an toan"
**How to avoid:** D-05 noi ro: xoa hoan toan, khong giu comment lich su. Verify bang grep "internal.*external" trong workflow sau khi sua.

### Pitfall 4: Topic co dau ngoac kep
**What goes wrong:** CLI nhan argument bi cat ngan boi shell
**Why it happens:** Topic string co the chua ky tu dac biet
**How to avoid:** Workflow luon wrap `"$TOPIC"` trong dau ngoac kep khi truyen cho CLI

## Code Examples

### bin/route-query.js — Full Implementation

```javascript
// Source: Dua tren bin/update-research-index.js pattern
#!/usr/bin/env node
'use strict';

/**
 * CLI script phan loai research query thanh internal hoac external.
 *
 * Nhan 1 argument (topic string), goi routeQuery() tu research-store.js,
 * in ket qua ra stdout ('internal' hoac 'external').
 *
 * Usage: node bin/route-query.js "ten file hoac thu vien"
 */

const { routeQuery } = require('./lib/research-store');

const topic = process.argv[2] || '';
const result = routeQuery(topic);
console.log(result);
```

### workflows/research.md Buoc 1 — Sau khi sua

```markdown
## Buoc 1: Phan loai query

1. Lay topic tu $ARGUMENTS (full text user nhap).
2. Xac dinh thu muc research tuyet doi: `path.resolve('.planning/research')`.
3. Phan loai topic:
   ```
   ROUTE=$(node bin/route-query.js "$TOPIC")
   ```
4. Hien thi: `"Da phan loai: [internal|external] research"`
5. Xac dinh thu muc con: `{research_dir}/internal/` hoac `{research_dir}/external/`
```

### routeQuery() — Reference (da co san)

```javascript
// Source: bin/lib/research-store.js dong 353-382
// 10 regex patterns: file extensions (.ts/.js/.md/.json/.py...),
// path patterns (src/, ./, bin/), definition keywords,
// camelCase, PascalCase, test patterns
// Default fallback: 'external'
function routeQuery(query) { /* ... */ }
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in) |
| Config file | none — dung node --test truc tiep |
| Quick run command | `node --test test/smoke-research-store.test.js` |
| Full suite command | `node --test test/smoke-research-store.test.js test/smoke-snapshot.test.js` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STORE-04 | route-query.js tra ve 'internal' hoac 'external' chinh xac | unit | `node --test test/smoke-research-store.test.js` | Co (routeQuery tests dong 665+, 20 tests) |
| STORE-04 | CLI script chay va in ket qua ra stdout | smoke | `node bin/route-query.js "ham createUser"` | Chua (CLI script chua ton tai) |
| STORE-04 | Snapshot tests pass sau workflow update | snapshot | `node --test test/smoke-snapshot.test.js` | Co (52 tests) |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-research-store.test.js`
- **Per wave merge:** `node --test test/smoke-research-store.test.js test/smoke-snapshot.test.js`
- **Phase gate:** Full suite green truoc verify-work

### Wave 0 Gaps
- [ ] `bin/route-query.js` — CLI script can tao moi
- [ ] Snapshot regeneration: `node test/generate-snapshots.js` — can chay sau khi sua workflow

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline heuristic (5 rules) trong workflow | routeQuery() (10+ patterns) trong research-store.js | Phase 42 | Nhan dien chinh xac hon, dac biet camelCase/PascalCase va nhieu file extensions |

## Open Questions

Khong co — tat ca decisions da locked, implementation straightforward.

## Sources

### Primary (HIGH confidence)
- `bin/lib/research-store.js` dong 353-399 — routeQuery() implementation, 10 regex patterns, exported
- `test/smoke-research-store.test.js` dong 665+ — 20 tests cho routeQuery, tat ca passing
- `bin/update-research-index.js` — CLI script template pattern (Phase 43)
- `workflows/research.md` dong 16-18 — inline heuristic hien tai can thay the
- `test/smoke-snapshot.test.js` — 52 snapshot tests, 4 platforms x 13 skills
- `test/generate-snapshots.js` — Script regenerate snapshots

### Secondary (MEDIUM confidence)
- Khong co

### Tertiary (LOW confidence)
- Khong co

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — chi dung Node.js built-in, da verified tren project
- Architecture: HIGH — follow pattern da thiet lap tu Phase 43 (bin/*.js -> bin/lib/*.js)
- Pitfalls: HIGH — dua tren kinh nghiem Phase 42/43 voi converter snapshots

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable — internal project patterns khong thay doi nhanh)
