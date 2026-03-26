# Phase 44: Wire routeQuery vao Workflow - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Thay the inline routing heuristic trong `workflows/research.md` Buoc 1 bang lenh goi `routeQuery()` tu `bin/lib/research-store.js` — dam bao 10+ regex patterns duoc su dung thay vi ~5 luat inline. Unblock su dung day du cac patterns da implement trong Phase 42.

</domain>

<decisions>
## Implementation Decisions

### Cach goi routeQuery tu workflow
- **D-01:** Tao CLI script `bin/route-query.js` — nhat quan voi Phase 43 pattern (bin/*.js goi bin/lib/*.js). Workflow goi: `ROUTE=$(node bin/route-query.js "$TOPIC")`.
- **D-02:** Script nhan 1 argument (topic string), goi `routeQuery()` tu research-store.js, in ket qua ra stdout ('internal' hoac 'external'). Exit code 0.

### Xu ly ket qua
- **D-03:** Trust routeQuery() hoan toan — khong can fallback hay comparison voi inline cu. routeQuery da co 20+ tests va 10+ patterns, chinh xac hon inline.
- **D-04:** Giu nguyen hien thi "Da phan loai: [internal|external] research" (Phase 42 D-04) — chi thay doi source tu inline sang routeQuery.

### Cleanup inline heuristic
- **D-05:** Xoa hoan toan inline heuristic code trong workflows/research.md Buoc 1 (dong 16-18 hien tai). Thay bang 1 dong goi CLI script. Khong giu comment ghi chu lich su.
- **D-06:** Buoc 1 sau khi sua: (1) Lay topic, (2) Xac dinh thu muc research, (3) `ROUTE=$(node bin/route-query.js "$TOPIC")`, (4) Hien thi, (5) Xac dinh thu muc con.

### Carrying Forward
- routeQuery() tra ve 'internal'|'external', default external (Phase 42 D-01~D-03) — locked
- CLI script pattern: bin/*.js goi bin/lib/*.js (Phase 43 D-05) — locked
- Workflow goi CLI qua `node bin/...` (Phase 43 D-06) — locked
- Converter pipeline + snapshot regeneration khi workflow thay doi (Phase 42 D-15) — locked

### Claude's Discretion
- Error handling cho route-query.js (missing argument, empty string)
- Test data fixtures
- So luong plans va task breakdown

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### routeQuery (source of truth)
- `bin/lib/research-store.js` — routeQuery() function dong 353+, 10+ regex patterns
- `test/smoke-research-store.test.js` — 20+ tests cho routeQuery (dong 665+)

### Workflow (modify)
- `workflows/research.md` — Buoc 1 can thay inline heuristic bang CLI call

### CLI pattern (follow)
- `bin/update-research-index.js` — Phase 43 CLI script pattern de follow

### Tests (verify)
- `test/smoke-research-store.test.js` — Tests cho routeQuery

### Converters (update snapshots)
- `test/smoke-snapshot.test.js` — Snapshot tests se fail khi workflow thay doi
- `test/generate-snapshots.js` — Script regenerate snapshots

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `routeQuery()` trong research-store.js — pure function, da co san, chi can goi
- `bin/update-research-index.js` — template cho CLI script pattern (shebang, require, process.argv)

### Established Patterns
- Pure function pattern: modules return values, caller ghi file
- CLI scripts trong `bin/` goi library functions tu `bin/lib/`
- Workflow files goi CLI qua `node bin/...`
- Converter snapshots regenerate khi workflow thay doi

### Integration Points
- `workflows/research.md` Buoc 1 — thay inline code bang CLI call
- `commands/pd/research.md` — converter se pick up workflow changes tu dong
- `test/snapshots/` — 4 platform snapshots can regenerate

</code_context>

<specifics>
## Specific Ideas

Khong co yeu cau dac biet — su dung standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 44-wire-route-query-workflow*
*Context gathered: 2026-03-26*
