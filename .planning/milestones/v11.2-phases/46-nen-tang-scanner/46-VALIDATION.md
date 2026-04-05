---
phase: 46
slug: nen-tang-scanner
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 46 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | bash + grep assertions (no test framework — config/template phase) |
| **Config file** | none — validation via CLI and grep |
| **Quick run command** | `node bin/lib/resource-config.js 2>/dev/null && echo "PASS"` |
| **Full suite command** | `bash .planning/phases/46-nen-tang-scanner/validate-phase-46.sh` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick validation (node parse + grep checks)
- **After every plan wave:** Run full validation script
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 46-01-01 | 01 | 1 | AGENT-01 | file check | `test -f references/security-rules.yaml` | ❌ W0 | ⬜ pending |
| 46-01-02 | 01 | 1 | AGENT-01 | content check | `grep -c "^  sql-injection:" references/security-rules.yaml` | ❌ W0 | ⬜ pending |
| 46-02-01 | 02 | 1 | AGENT-02, AGENT-04 | file check | `test -f commands/pd/agents/pd-sec-scanner.md` | ❌ W0 | ⬜ pending |
| 46-02-02 | 02 | 1 | WIRE-04 | content check | `grep "fastcode_queries" commands/pd/agents/pd-sec-scanner.md` | ❌ W0 | ⬜ pending |
| 46-03-01 | 03 | 2 | AGENT-02 | content check | `grep "pd-sec-scanner" bin/lib/resource-config.js` | ✅ | ⬜ pending |
| 46-03-02 | 03 | 2 | AGENT-02 | count check | `node -e "const c=require('./bin/lib/resource-config.js');console.log(Object.keys(c.AGENT_REGISTRY).length)"` | ✅ | ⬜ pending |
| 46-04-01 | 04 | 3 | AGENT-04 | file absence | `test ! -f commands/pd/agents/pd-sec-sql-injection.md` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `references/security-rules.yaml` — created with 13 categories (Plan 01 output)
- [ ] `commands/pd/agents/pd-sec-scanner.md` — template agent (Plan 02 output)

*No test framework install needed — validation uses bash/node/grep.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| FastCode fallback to Grep+Glob | WIRE-04 | Requires Docker down state | Stop Docker, run scanner template mentally trace fallback path in template |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
