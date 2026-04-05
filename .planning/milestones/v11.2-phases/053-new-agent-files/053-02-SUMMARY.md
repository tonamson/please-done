---
phase: "053"
plan: "02"
subsystem: agents
tags: [agent-reform, smoke-tests, parseFrontmatter]
dependency_graph:
  requires: [AGEN-08, 053-01]
  provides: [AGEN-08]
  affects: [smoke-agent-files]
tech_stack:
  added: []
  patterns: [parseFrontmatter-validation, bidirectional-tools-check]
key_files:
  created: []
  modified:
    - test/smoke-agent-files.test.js
key_decisions:
  - "Dung parseFrontmatter tu utils.js thay vi parseAgentFrontmatter noi bo — parser chuan ho tro YAML arrays"
  - "Adapt Test 4 (no model/maxTurns/effort) thanh model-tier consistency — vi Wave 1 tao agents voi model/maxTurns/effort truc tiep"
metrics:
  duration: "126s"
  completed: "2026-03-27"
  tasks_completed: 1
  tasks_total: 1
  tests_added: 6
  tests_total: 26
---

# Phase 53 Plan 02: Mo rong smoke tests voi parseFrontmatter validation -- Summary

Them 6 test cases moi dung parseFrontmatter tu utils.js de validate 6 agents moi, bao gom bidirectional tools consistency va tier-model mapping.

## Ket qua

| Task | Mo ta | Commit | Files |
|------|-------|--------|-------|
| 1 | Them 6 tests parseFrontmatter cho 6 agents moi | e5104b8 | test/smoke-agent-files.test.js |

## Chi tiet

### Task 1: Mo rong smoke-agent-files.test.js

Them vao cuoi file:
- Import `parseFrontmatter` tu `bin/lib/utils.js`
- Constant `NEW_AGENT_NAMES` voi 6 agents moi
- Describe block `New agent files (parseFrontmatter validation)` voi 6 tests:
  1. **File existence** -- 6 files ton tai va co noi dung
  2. **Frontmatter fields** -- name, description, model, tools hop le (dung parseFrontmatter)
  3. **Body structure** -- objective, process, rules blocks
  4. **Model-tier consistency** -- model khong phai inherit, khop voi TIER_MAP[tier]
  5. **Bidirectional tools** -- registry tools = file tools (ca 2 chieu)
  6. **Tier consistency** -- AGENT_REGISTRY tier map sang dung model trong file

Tong: 26/26 agent tests pass, 1038/1038 full smoke suite pass.

## Xac minh

- `node --test test/smoke-agent-files.test.js` -- 26/26 pass
- `node --test test/smoke-*.test.js` -- 1038/1038 pass
- Existing tests (20 tests tu Wave 1) khong bi sua doi
- File co `parseFrontmatter` import, `NEW_AGENT_NAMES` constant, `registryTools`/`fileTools` variables

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Adapt tests cho agent file format thuc te**
- **Found during:** Task 1
- **Issue:** Plan thiet ke tests voi `allowed-tools` (YAML array) va `tier` field, nhung Wave 1 tao agents voi `tools` (comma-separated string) va `model` (khong co tier truc tiep)
- **Fix:** Dung `frontmatter.tools.split(',')` thay vi `frontmatter['allowed-tools']`, dung TIER_MAP de map tier -> model thay vi so sanh tier truc tiep
- **Files modified:** test/smoke-agent-files.test.js
- **Commit:** e5104b8

## Known Stubs

None -- tat ca tests hoat dong voi du lieu thuc, khong co placeholder.

## Self-Check: PASSED

- test/smoke-agent-files.test.js: FOUND
- Commit e5104b8: FOUND
