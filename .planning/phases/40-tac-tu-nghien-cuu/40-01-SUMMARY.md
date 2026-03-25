---
phase: 40-tac-tu-nghien-cuu
plan: 01
subsystem: research-agents
tags: [agents, evidence-collector, fact-checker, resource-config]
dependency_graph:
  requires: [resource-config.js, research-store.js, confidence-scorer.js]
  provides: [pd-evidence-collector agent, pd-fact-checker agent]
  affects: [AGENT_REGISTRY, smoke-agent-files, smoke-resource-config]
tech_stack:
  added: []
  patterns: [agent-definition-yaml-frontmatter, source-or-skip-rule]
key_files:
  created:
    - .claude/agents/pd-evidence-collector.md
    - .claude/agents/pd-fact-checker.md
  modified:
    - bin/lib/resource-config.js
    - test/smoke-agent-files.test.js
    - test/smoke-resource-config.test.js
decisions:
  - "Evidence Collector dung Context7 tools cho external research, Fact Checker chi dung Read/Grep/Bash de xac minh"
  - "Agent frontmatter dung flat format (tools comma-separated) nhat quan voi 5 agents hien co"
metrics:
  duration: 272s
  completed: "2026-03-25T16:10:00Z"
  tasks: 5
  files: 5
---

# Phase 40 Plan 01: Tac tu Nghien cuu — Evidence Collector va Fact Checker

2 research agents voi giao thuc chong ao giac: Evidence Collector (builder/sonnet) thu thap bang chung tu 2+ nguon doc lap, Fact Checker (architect/opus) xac minh tinh chinh xac va danh dau claims khong xac minh duoc

## Ket qua

| Task | Mo ta | Commit | Files |
|------|-------|--------|-------|
| 1 | Tao Evidence Collector agent definition | 305ae7d | .claude/agents/pd-evidence-collector.md |
| 2 | Tao Fact Checker agent definition | c337693 | .claude/agents/pd-fact-checker.md |
| 3 | Dang ky agents vao resource-config.js | a5435ea | bin/lib/resource-config.js |
| 4 | Cap nhat tests cho 2 agents moi | 95d9f68 | test/smoke-agent-files.test.js, test/smoke-resource-config.test.js |
| 5 | Chay toan bo test suite — 896 pass, 0 fail | (verification) | — |

## Chi tiet Ky thuat

### Evidence Collector (pd-evidence-collector)
- **Tier:** builder / sonnet / medium effort / 25 turns
- **Tools:** Read, Glob, Grep, Write, Bash, Context7 (resolve-library-id, query-docs)
- **Process:** 6 buoc — doc yeu cau, tim nguon internal, tim nguon external, ghi file voi frontmatter, ghi bang chung voi citations, cap nhat AUDIT_LOG
- **Rule cot loi:** Source-or-skip bat buoc — claim khong co source = khong ghi

### Fact Checker (pd-fact-checker)
- **Tier:** architect / opus / high effort / 30 turns
- **Tools:** Read, Glob, Grep, Bash
- **Process:** 5 buoc — doc research file, kiem tra tung source, danh dau confidence, ghi verification results, cap nhat AUDIT_LOG
- **Rule cot loi:** KHONG sua noi dung goc, chi annotations. Claims khong xac minh = `[KHONG XAC MINH DUOC]`

### AGENT_REGISTRY
- Tang tu 5 len 7 agents
- pd-evidence-collector: builder tier, 7 tools (bao gom Context7)
- pd-fact-checker: architect tier, 4 tools

## Quyet dinh

1. **Evidence Collector dung Context7 tools**: De tra cuu documentation chinh thuc khi research external topics — nhat quan voi pd-doc-specialist da dung Context7
2. **Flat frontmatter format**: Giu nhat quan voi 5 agents hien co (tools comma-separated, khong dung YAML list trong frontmatter) de parseAgentFrontmatter hoat dong dung

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Sua frontmatter format agent files**
- **Found during:** Task 4
- **Issue:** Agent files ban dau dung YAML list format cho allowed-tools va flat tools, nhung test parseAgentFrontmatter chi parse format `key: value` tren 1 dong
- **Fix:** Chuyen sang flat format nhat quan voi 5 agents hien co (tools comma-separated)
- **Files modified:** .claude/agents/pd-evidence-collector.md, .claude/agents/pd-fact-checker.md
- **Commit:** 95d9f68

## Known Stubs

None — toan bo agents da co day du process, rules, va frontmatter.

## Verification

- 896 smoke tests pass, 0 fail, 0 regression
- 43 tests trong 2 test files cap nhat (agent-files + resource-config)
- getAgentConfig('pd-evidence-collector').model = sonnet
- getAgentConfig('pd-fact-checker').model = opus

## Self-Check: PASSED

- 5/5 files found
- 4/4 commits found
