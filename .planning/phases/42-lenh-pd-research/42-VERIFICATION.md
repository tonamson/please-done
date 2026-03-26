---
status: passed
phase: 42-lenh-pd-research
verified_at: "2026-03-26T04:00:00Z"
requirements:
  - id: STORE-04
    status: verified
    evidence: "routeQuery function trong bin/lib/research-store.js — phan loai internal/external"
  - id: AGENT-03
    status: verified
    evidence: "workflows/research.md pipeline 3 buoc: route -> Evidence Collector -> Fact Checker"
  - id: EXTRA-01
    status: verified
    evidence: "workflows/research.md Buoc 3 cross-validate files cung topic o ca internal/ va external/"
---

# Phase 42 Verification: Lenh pd research

## Goal
Nguoi dung co the goi 1 lenh duy nhat de nghien cuu — he thong tu phan loai internal/external va chay pipeline thu thap + xac minh tu dong

## Must-Haves Verification

### SC-1: routeQuery function (STORE-04) ✓
- `bin/lib/research-store.js` chua `function routeQuery(query)` — exported trong module.exports
- 20 test cases PASS trong `test/smoke-research-store.test.js`
- Phan loai chinh xac: file extensions, path patterns, camelCase/PascalCase, definition keywords -> internal; fallback -> external

### SC-2: Skill file pd:research (AGENT-03) ✓
- `commands/pd/research.md` ton tai voi frontmatter chuan: `name: pd:research`, `model: sonnet`
- Guards, execution_context tham chieu `@workflows/research.md`
- allowed-tools bao gom `Agent` de spawn subagents

### SC-3: Workflow research.md (AGENT-03, EXTRA-01) ✓
- `workflows/research.md` mo ta pipeline 3 buoc: route -> collect -> verify
- Buoc 2: spawn `pd-evidence-collector` voi absolute path + topic
- Buoc 3: spawn `pd-fact-checker` voi cross-validation instruction
- Xung dot phat hien: ghi nhan voi evidence tu ca 2 phia, khong tu resolve (EXTRA-01)

### SC-4: Converter snapshots ✓
- 4 snapshot files ton tai: `test/snapshots/{codex,copilot,gemini,opencode}/research.md`
- Snapshot tests PASS
- Full test suite: 931 tests, 931 pass, 0 fail

## Test Suite
- Command: `node --test test/smoke-*.test.js`
- Result: 931 pass, 0 fail

## Automated Checks
- [x] routeQuery function exported
- [x] pd:research skill file exists with correct frontmatter
- [x] workflow references pd-evidence-collector and pd-fact-checker
- [x] workflow contains cross-validation instructions
- [x] 4 platform snapshots exist
- [x] Full test suite passes (931/931)
