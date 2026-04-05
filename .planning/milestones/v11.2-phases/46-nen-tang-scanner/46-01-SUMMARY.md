---
phase: 46-nen-tang-scanner
plan: 01
subsystem: security-scanner
tags: [yaml, agent-template, owasp, tdd]
dependency_graph:
  requires: []
  provides: [security-rules-yaml, sec-scanner-template]
  affects: [pd-sec-reporter, resource-config]
tech_stack:
  added: [js-yaml]
  patterns: [yaml-config, template-agent, fastcode-tool-first]
key_files:
  created:
    - references/security-rules.yaml
    - commands/pd/agents/pd-sec-scanner.md
    - test/smoke-security-rules.test.js
  modified:
    - package.json
    - package-lock.json
decisions:
  - "YAML schema voi 6 truong moi category: owasp, severity, evidence_file, patterns[], fixes[], fastcode_queries[]"
  - "patterns[] co them truong stack de chi dinh ngon ngu ap dung"
  - "js-yaml them vao devDependencies cho test YAML parsing"
metrics:
  duration: 409s
  completed: "2026-03-26T07:44:40Z"
  tasks: 2
  files: 5
---

# Phase 46 Plan 01: Tao security-rules.yaml va template pd-sec-scanner.md Summary

YAML cau hinh tap trung 13 OWASP categories migrate tu 13 scanner files cu, kem template agent tong hop nhan --category slug doc YAML de quet bao mat.

## Ket qua

### Task 1: Tao security-rules.yaml va test kiem chung (TDD)

**RED:** Tao 6 test cases kiem chung YAML schema — tests FAIL vi chua co YAML file.

**GREEN:** Tao `references/security-rules.yaml` voi 13 categories day du:
- sql-injection (24 patterns), xss (31 patterns), cmd-injection (34 patterns)
- path-traversal (24 patterns), secrets (21 patterns), auth (18 patterns)
- deserialization (29 patterns), misconfig (22 patterns), prototype-pollution (13 patterns)
- crypto (28 patterns), insecure-design (16 patterns), vuln-deps (14 patterns)
- logging (18 patterns)

Moi category co: owasp, severity, evidence_file, patterns[] (regex + description + stack), fixes[], fastcode_queries[].

**Commits:**
- `e332237` test(46-01): them failing test cho security-rules.yaml schema
- `b5cb2bb` feat(46-01): tao security-rules.yaml voi 13 OWASP categories va test xac nhan

### Task 2: Tao template pd-sec-scanner.md

Tao template agent tong hop `commands/pd/agents/pd-sec-scanner.md`:
- Frontmatter: name pd-sec-scanner, tier scout, allowed-tools Read/Glob/Grep/mcp__fastcode__code_qa
- Process 8 buoc: nhan --category, doc YAML, extract rules, xac dinh stack, FastCode tool-first, Grep fallback, phan loai FAIL/FLAG/PASS, ghi evidence
- Rules: tieng Viet co dau, khong sua code, dan chung file:dong, FastCode uu tien

**Commit:** `f832391` feat(46-01): tao template pd-sec-scanner.md tong hop thay the 13 scanner

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — tat ca artifacts hoan chinh, khong co placeholder.

## Verification

| Kiem tra | Ket qua |
|----------|---------|
| `node --test test/smoke-security-rules.test.js` | 6/6 PASS |
| YAML parse thanh cong | OK |
| Template co pd-sec-scanner name | OK |
| Template tham chieu security-rules.yaml | OK |
| Template co mcp__fastcode__code_qa | OK |
| Template co Grep fallback | OK |

## Self-Check: PASSED

Tat ca 3 files tao moi ton tai, tat ca 3 commits ton tai trong git log.
