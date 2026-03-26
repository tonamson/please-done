---
phase: 46-nen-tang-scanner
plan: 02
subsystem: security-scanner
tags: [agent-registry, wiring, cleanup, resource-config]
dependency_graph:
  requires: [security-rules-yaml, sec-scanner-template]
  provides: [agent-registry-9-entries, getAgentConfig-extra-fields]
  affects: [pd-sec-dispatcher, phase-47]
tech_stack:
  added: []
  patterns: [spread-extra-fields, agent-registry-wiring]
key_files:
  created: []
  modified:
    - bin/lib/resource-config.js
    - test/smoke-resource-config.test.js
    - test/smoke-agent-files.test.js
    - package.json
    - package-lock.json
  deleted:
    - commands/pd/agents/pd-sec-sql-injection.md
    - commands/pd/agents/pd-sec-xss.md
    - commands/pd/agents/pd-sec-cmd-injection.md
    - commands/pd/agents/pd-sec-path-traversal.md
    - commands/pd/agents/pd-sec-secrets.md
    - commands/pd/agents/pd-sec-auth.md
    - commands/pd/agents/pd-sec-deserialization.md
    - commands/pd/agents/pd-sec-misconfig.md
    - commands/pd/agents/pd-sec-prototype-pollution.md
    - commands/pd/agents/pd-sec-crypto.md
    - commands/pd/agents/pd-sec-insecure-design.md
    - commands/pd/agents/pd-sec-vuln-deps.md
    - commands/pd/agents/pd-sec-logging.md
decisions:
  - "getAgentConfig() dung destructuring + spread de tu dong forward extra fields (categories, v.v.)"
  - "smoke-agent-files test dung AGENT_NAMES thay vi Object.entries(AGENT_REGISTRY) de chi kiem tra 7 agents co file tai .claude/agents/"
metrics:
  duration: 141s
  completed: "2026-03-26T07:50:35Z"
  tasks: 2
  files: 18
---

# Phase 46 Plan 02: Dang ky AGENT_REGISTRY va xoa 13 scanner files cu Summary

AGENT_REGISTRY mo rong tu 7 len 9 entries (pd-sec-scanner voi 13 categories, pd-sec-reporter), getAgentConfig() spread extra fields, 13 scanner files cu bi xoa.

## Ket qua

### Task 1: Them 2 entries vao AGENT_REGISTRY va sua getAgentConfig()

Them pd-sec-scanner (scout, 4 tools, 13 categories) va pd-sec-reporter (builder, 3 tools) vao AGENT_REGISTRY. Sua getAgentConfig() dung destructuring `{ tier, tools, ...extra }` de tu dong spread bat ky field moi nao (categories) vao ket qua tra ve.

Them 5 test cases moi:
- pd-sec-scanner full config (ke ca categories length 13)
- pd-sec-reporter full config
- Extra fields spread verification
- isHeavyAgent cho pd-sec-scanner (true vi co fastcode)
- Assertion 7 -> 9 agents

**Commit:** `a22df4a`

### Task 2: Xoa 13 scanner files cu va cap nhat test

Xoa 13 file pd-sec-*.md cu (sql-injection, xss, cmd-injection, path-traversal, secrets, auth, deserialization, misconfig, prototype-pollution, crypto, insecure-design, vuln-deps, logging). Chi con pd-sec-scanner.md va pd-sec-reporter.md.

Sua test consistency trong smoke-agent-files.test.js de dung AGENT_NAMES loop thay vi Object.entries(AGENT_REGISTRY) — tranh loi khi registry co agents khong nam o .claude/agents/.

Cai dat js-yaml devDependency cho smoke-security-rules test.

**Commit:** `a274016`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Cai dat js-yaml devDependency**
- **Found during:** Task 2
- **Issue:** smoke-security-rules.test.js require js-yaml nhung chua cai dat
- **Fix:** npm install --save-dev js-yaml
- **Files modified:** package.json, package-lock.json
- **Commit:** a274016

## Known Stubs

None — tat ca artifacts hoan chinh, khong co placeholder.

## Verification

| Kiem tra | Ket qua |
|----------|---------|
| `node --test test/smoke-security-rules.test.js` | 6/6 PASS |
| `node --test test/smoke-resource-config.test.js` | 35/35 PASS |
| `node --test test/smoke-agent-files.test.js` | 12/12 PASS |
| `ls commands/pd/agents/pd-sec-*.md \| wc -l` | 2 (scanner + reporter) |
| `node -e "...getAgentConfig('pd-sec-scanner').categories.length"` | 13 |
| AGENT_REGISTRY co 9 entries | OK |
| getAgentConfig spread extra fields | OK |
| isHeavyAgent('pd-sec-scanner') == true | OK |

## Self-Check: PASSED

Tat ca files ton tai/da xoa dung, tat ca commits ton tai trong git log.
