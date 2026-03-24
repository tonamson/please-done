# Phase 15: Workflow Verification - Research

**Researched:** 2026-03-23
**Domain:** Workflow logic verification / Markdown-based AI instruction audit
**Confidence:** HIGH

## Summary

Phase 15 la deep verification cho 3 workflow chinh (new-milestone, write-code, fix-bug) -- khong phai audit tong quat (Phase 14 da lam) ma la stress-test tung buoc logic, trace data flow, va doi chieu claims voi code that. Output la 1 file verification report duy nhat phuc vu Phase 16 (Bug Fixes).

Project nay la mot skill system cho AI coding assistants. Cac "workflows" la markdown files chua instructions cho AI agent thuc thi. Verification o day nghia la: moi buoc trong workflow co dung khong, data flow giua cac buoc co lien tuc khong, references co dung khong, va cac edge cases co duoc xu ly khong. KHONG phai verify code chay duoc (vi day la markdown instructions), ma la verify LOGIC va CONSISTENCY cua instructions.

**Primary recommendation:** Ap dung 4-level verification framework (verification-patterns.md) adapt cho workflow context: Exists (files/references ton tai), Substance (steps co logic that, khong stub), Connected (data flow giua steps lien tuc), Operational (edge cases va error handling du). Pre-define Truth inventory truoc khi trace, dung Grep/Glob code-backed verification cho moi claim.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Dung he thong 4 cap verification theo verification-patterns.md: Cap 1 (Ton tai -- file phai co tren dia), Cap 2 (Thuc chat -- code khong phai stub/placeholder), Cap 3 (Ket noi -- imports/exports/calls thuc te), Cap 4 (Hoat dong -- chay test logic)
- **D-02:** Code-backed verification -- moi claim trong workflow phai duoc doi chieu voi code that qua Grep/Glob (vd: workflow noi "utils.js export X" thi phai verify X thuc su ton tai)
- **D-03:** Truth-based edge cases -- moi behavior claim can co "Truth" tuong ung. Vd: "retry 3 lan" phai co Truth kiem chung hanh vi retry va dieu kien dung
- **D-04:** Key Links trace data flow xuyen steps -- neu Step 3 tao file va Step 7 dung file do, Key Link bat buoc ca hai steps phai tham chieu file nay
- **D-05:** State Machine strict -- trang thai chi duoc danh dau hoan tat SAU KHI code da viet, build thanh cong va commit. Build fail -> giu trang thai "dang chay"
- **D-06:** Fallback check cho external tools -- verify artifact dau ra, khong gia dinh tool luon dung. 2 lan tu sua that bai -> STOP + bao user
- **D-07:** Audit report (14-AUDIT-REPORT.md) la baseline -- Phase 15 la stress-test thuc te cho nhung gi audit cho la dung
- **D-08:** Confirm + deep-dive MOI issue da biet (C2, W9, W10, W12, W13, W15) -- xac dinh Impact thuc te de Phase 16 prioritize. KHONG skip bat ky issue nao
- **D-09:** Phat hien issues moi ma audit bo sot -- ghi vao verification report voi cross-reference nguoc audit (vd: "V5 la he luy cua W13 Phase 14")
- **D-10:** 1 file duy nhat: `15-VERIFICATION-REPORT.md` voi anchor links (#wflow-01, #wflow-02, #wflow-03) de dieu huong nhanh
- **D-11:** Hybrid trace format -- Steps pass: 1 dong ("Verified. Artifacts & state updates match spec"). Steps fail: full detail (Logic Trace, Code Reference, Impact, Suggested Fix)
- **D-12:** Pre-defined Truth inventory -- 3-5 Critical Truths per workflow truoc khi trace, bo sung Implicit Truths trong qua trinh verify
- **D-13:** Moi issue can: ID (V1, V2...), Source (WFLOW-0X), Affected lines, Severity (Critical/Warning/Info), Description & Impact, Suggested Fix cu the, Regression Risk (Low/Med/High)
- **D-14:** Report viet bang tieng Viet -- don gian, ro rang, de hieu nhat co the

### Claude's Discretion
- Thu tu verify 3 workflows (co the bat dau voi workflow don gian nhat)
- So luong Critical Truths per workflow (3-5 la guideline, khong phai hard limit)
- Chi tiet level cua Logic Trace cho failed steps
- Cach nhom issues trong Executive Summary

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WFLOW-01 | Verify workflow new-milestone end-to-end -- init context, questioning, research spawn, requirements definition, roadmap creation, state updates | 4-level verification adapted: verify all 14 @references/@templates exist (L1), verify step logic substance (L2), trace data flow PROJECT.md->REQUIREMENTS.md->ROADMAP.md->STATE.md->CURRENT_MILESTONE.md (L3), verify error handling + 2 approval gates (L4) |
| WFLOW-02 | Verify workflow write-code end-to-end -- plan reading, task execution, effort routing, Context7 pipeline, commit flow, verification | 4-level verification: verify all 9 references exist (L1), verify 3 modes logic + PROGRESS.md recovery (L2), trace TASKS.md->code->lint->commit->VERIFICATION_REPORT flow (L3), verify Kahn's algorithm + effort routing + parallel safety net (L4) |
| WFLOW-03 | Verify workflow fix-bug end-to-end -- bug reproduction, diagnosis, fix application, test verification, commit flow | 4-level verification: verify all 3 references exist (L1), verify 10-step scientific method (L2), trace SESSION->BUG report->TASKS.md flow (L3), verify stack fallback + patch version + gate check (L4) |
</phase_requirements>

## Standard Stack

### Core
| Tool | Purpose | Why Standard |
|------|---------|--------------|
| Grep (built-in) | Code-backed verification -- doi chieu workflow claims voi code that | D-02 yeu cau, da co san trong tool set |
| Glob (built-in) | Level 1 verification -- kiem tra file ton tai | D-01 yeu cau, da co san |
| Read (built-in) | Level 2 verification -- doc noi dung file kiem tra substance | Verification-patterns.md yeu cau |

### Supporting
| Asset | Purpose | When to Use |
|-------|---------|-------------|
| `references/verification-patterns.md` | 4-level verification framework | Methodology cho moi buoc verify |
| `references/state-machine.md` | State transition rules | Verify D-05 compliance trong workflows |
| `references/plan-checker.md` | Key Links + Truth-Task mapping patterns | Adapt Key Links concept cho workflow data flow tracing |
| `14-AUDIT-REPORT.md` | Baseline findings | D-07: confirm + deep-dive moi issue da biet |
| `references/conventions.md` | Task status symbols, commit prefixes, version rules | Cross-verify workflow instructions match conventions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual read-through | AST parsing | Workflows la markdown, khong co AST -- Grep/Read la chinh xac hon |
| Running workflows | Static analysis | Workflows la AI instructions, khong chay duoc -- static trace la dung cach |

## Architecture Patterns

### Recommended Report Structure
```
15-VERIFICATION-REPORT.md
  Executive Summary (table tong hop)
  Methodology (4-level, Truth inventory)
  WFLOW-01: new-milestone (#wflow-01)
    Truth Inventory (pre-defined + implicit)
    Logic Trace (step-by-step, hybrid format)
    Phase 14 Issues Deep-Dive
    Detailed Findings Table
  WFLOW-02: write-code (#wflow-02)
    [same structure]
  WFLOW-03: fix-bug (#wflow-03)
    [same structure]
  Cross-Workflow Issues
  Issue Registry (master table V1-VN)
  Recommendations cho Phase 16
```

### Pattern 1: 4-Level Verification Adapted cho Workflow Context

**What:** Ap dung verification-patterns.md cho markdown workflow files thay vi code files.

**Adaptation mapping:**

| Original Level | Workflow Adaptation | Kiem tra cu the |
|----------------|-------------------|-----------------|
| L1: Ton tai | Moi `@references/` va `@templates/` ton tai tren disk | `Glob` verify paths |
| L2: Thuc chat | Moi step co logic that (khong phai placeholder), co ro dieu kien vao/ra | Read step content, kiem tra >= threshold logic |
| L3: Ket noi | Data flow lien tuc giua steps -- file tao o step N duoc dung o step M | Trace file creation -> file usage across steps |
| L4: Hoat dong | Edge cases duoc handle, error handling co, fallbacks co | Review logic paths, verify claims voi code |

### Pattern 2: Truth Inventory Pre-Definition

**What:** Truoc khi trace workflow, dinh nghia 3-5 Critical Truths ma workflow PHAI dam bao.

**When to use:** Truoc moi workflow trace (D-12).

**Example (new-milestone):**
```markdown
## Truth Inventory: WFLOW-01

### Critical Truths (pre-defined)
| # | Truth | Cach kiem chung |
|---|-------|-----------------|
| CT-1 | Moi @reference va @template ton tai tren disk | Glob verify 14 paths |
| CT-2 | STATE.md duoc cap nhat tai 4+ checkpoints | Grep "STATE.md" in workflow, verify moi mention co update logic |
| CT-3 | 2 approval gates (requirements + roadmap) bat buoc | Trace Step 6e va 7f, verify AskUserQuestion + loop logic |
| CT-4 | CONTEXT.md khong ton tai -> workflow STOP | Verify Step 0 guard logic |

### Implicit Truths (phat hien trong khi trace)
| # | Truth | Step phat hien | Cach kiem chung |
|---|-------|---------------|-----------------|
| IT-1 | [bo sung khi trace] | | |
```

### Pattern 3: Hybrid Trace Format

**What:** Steps pass duoc ghi 1 dong. Steps fail duoc ghi chi tiet.

**When to use:** Moi step trong Logic Trace section (D-11).

**Example:**
```markdown
## Logic Trace

### Buoc 0: Tu kiem tra
PASS. Guards kiem tra CONTEXT.md + rules/general.md. Dieu kien ro rang, STOP logic dung.

### Buoc 3: Kiem tra lo trinh hien co
FAIL (W12 confirmed + V3 new)

**Logic Trace:**
- AskUserQuestion trinh bay 3 options: ghi de / viet tiep / xem file
- Fallback "Khong hoi duoc -> tu dong sao luu" (line 105)

**Code Reference:**
- `workflows/new-milestone.md:105` -- fallback condition

**Issues:**
- V3: Fallback condition thieu timeout/unavailability clarification
  - Impact: AI agent co the cho user tra loi vinh vien
  - Suggested Fix: Them "OR user does not respond within reasonable time"
  - Regression Risk: Low
```

### Pattern 4: Code-Backed Claim Verification

**What:** Moi claim trong workflow duoc doi chieu voi code that.

**When to use:** Bat ky step nao reference JS module, file path, hoac behavior cu the (D-02).

**Example verification steps:**
```
Workflow claim: "plan-checker.js" duoc goi o Step 8.1 (plan.md)
Verification:
  1. Grep "require.*plan-checker" in bin/ -> khong tim thay (C1 confirmed)
  2. Grep "plan-checker" in workflows/plan.md -> tim thay o line 298+
  3. Conclusion: Agent doc path tu workflow text, khong co programmatic import
```

### Anti-Patterns to Avoid
- **Audit lai tu dau:** Phase 14 da scan. Phase 15 KHONG re-scan -- chi deep-dive vao 3 workflows cua muc tieu va issues da biet
- **Fix bugs trong verification:** D-10 noi ro KHONG fix -- chi ghi nhan. Fix la Phase 16
- **Skip known issues:** D-08 bat buoc confirm + deep-dive MOI issue, ke ca nhung cai tuong chung chung
- **Verify toan bo 10 workflows:** Chi 3 workflows (new-milestone, write-code, fix-bug) trong scope

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File existence checks | Custom script | Glob tool | Da co san, chinh xac |
| Content matching | Regex manually | Grep tool | Da co san, nhanh |
| Verification methodology | Invent new framework | verification-patterns.md adapted | Da co framework 4-level trong project |
| Issue format | Tu dinh nghia format | D-13 format tu CONTEXT.md | User da lock format |
| State machine rules | Tu suy luan | state-machine.md | Nguon su that da co |
| Truth-Task mapping | Tu nghi ra | plan-checker.md CHECK-04 pattern | Adapt pattern da co |
| Report structure | Tu thiet ke | D-10, D-11 format tu CONTEXT.md | User da lock structure |
| Convention rules | Tu nho | conventions.md | Nguon su that duy nhat |

**Key insight:** Project nay da co tat ca framework can thiet -- verification-patterns.md, state-machine.md, plan-checker.md, conventions.md. Phase 15 chi can APPLY chung cho 3 workflow files, khong can tao gi moi.

## Common Pitfalls

### Pitfall 1: Nham lan "audit" voi "verification"
**What goes wrong:** Lam lai scan Phase 14 thay vi deep-trace logic tung buoc
**Why it happens:** Phase 14 va 15 deu nhin vao cung files, de overlap
**How to avoid:** Phase 14 = "scan tim issues". Phase 15 = "trace logic end-to-end, verify data flow, stress-test edge cases". Bat dau tu Truth Inventory, khong phai tu file scan
**Warning signs:** Findings chi la "file X co van de Y" ma khong co logic trace evidence

### Pitfall 2: Bo sot data flow gaps giua steps
**What goes wrong:** Moi step pass individual nhung data khong flow dung giua steps
**Why it happens:** Verify tung step doc lap, khong trace file X tao o step N -> dung o step M
**How to avoid:** Tao Key Links map truoc: "Step 6d tao REQUIREMENTS.md -> Step 7e doc REQUIREMENTS.md". Verify CA HAI dau
**Warning signs:** Steps pass nhung Cross-Step Key Links fail

### Pitfall 3: Khong phan biet severity dung
**What goes wrong:** Moi issue deu la "Warning" hoac moi issue deu la "Critical"
**Why it happens:** Khong co tieu chuan severity ro rang
**How to avoid:** Critical = logic break (agent se lam sai), Warning = degraded behavior (agent hoat dong nhung khong toi uu), Info = style/clarity improvement
**Warning signs:** Issue table khong co mix severity levels

### Pitfall 4: Suggested Fix qua chung chung
**What goes wrong:** "Fix the issue" thay vi "Them row 'Generic/Other' vao bang stack trace (line 133-140) voi flow: entry point -> handler -> business logic -> data layer -> response"
**Why it happens:** Khong doc ky context de hieu fix can lam gi cu the
**How to avoid:** D-13 yeu cau "Suggested Fix cu the" -- moi fix phai chi ro file, line, va noi dung thay doi
**Warning signs:** Phase 16 developer phai doc lai workflow de hieu fix la gi

### Pitfall 5: Khong cross-reference Phase 14
**What goes wrong:** Issue moi ma thuc ra la he luy cua issue Phase 14 da biet
**Why it happens:** Khong doc 14-AUDIT-REPORT.md truoc khi verify
**How to avoid:** D-09 yeu cau cross-reference format "V5 (Phase 15) la he luy cua W13 (Phase 14)". Doc audit report truoc, map issues truoc khi trace
**Warning signs:** Issues trung lap voi Phase 14 ma khong co cross-reference

### Pitfall 6: Quen verify State Machine compliance
**What goes wrong:** Workflow instructions noi "danh dau hoan tat" nhung khong dam bao dieu kien state-machine.md
**Why it happens:** State machine la separate reference, de quen
**How to avoid:** D-05 bat buoc strict compliance. Verify moi STATE.md update trong workflow match state-machine.md transitions
**Warning signs:** Task duoc danh ✅ truoc khi build pass

## Code Examples

### Example 1: Truth Inventory Template (per workflow)
```markdown
## Truth Inventory: WFLOW-0X — [Workflow Name]

### Critical Truths (pre-defined)
| # | Truth | Cach kiem chung | Ket qua |
|---|-------|-----------------|---------|
| CT-1 | [behavior claim] | [Grep/Glob/Read command] | PASS/FAIL |

### Implicit Truths (phat hien khi trace)
| # | Truth | Step | Cach kiem chung | Ket qua |
|---|-------|------|-----------------|---------|
| IT-1 | [phat hien khi trace] | [step #] | [verification] | PASS/FAIL |
```

### Example 2: Issue Entry Format (D-13)
```markdown
| ID | Source | Lines | Severity | Description & Impact | Suggested Fix | Regression Risk | Phase 14 Ref |
|----|--------|-------|----------|---------------------|---------------|-----------------|--------------|
| V1 | WFLOW-03 | 133-140 | Critical | Stack-specific trace khong co fallback cho generic stacks. Impact: AI agent khong co huong dan debug khi project dung Express, FastAPI, etc. | Them row "Generic/Other" vao bang: "entry point -> handler -> business logic -> data layer -> response" | Low | C2 (Phase 14) |
```

### Example 3: Key Links Data Flow Trace
```markdown
## Key Links: WFLOW-01 (new-milestone)

| Step tao | File | Step dung | Verified |
|----------|------|-----------|----------|
| Step 1 | PROJECT.md | Step 4 (read history) | PASS - Step 4 doc "lich su milestones" |
| Step 6d | REQUIREMENTS.md | Step 7e (update traceability) | PASS - Step 7e cap nhat bang theo doi |
| Step 7d | ROADMAP.md | Step 9a (CURRENT_MILESTONE) | PASS - Step 9a doc ROADMAP de xac dinh phase |
| Step 8 | STATE.md | Moi step updates | PASS - 4 checkpoints verified |
| Step 9a | CURRENT_MILESTONE.md | [plan.md reads] | PASS - Cross-workflow handoff dung |
```

### Example 4: Hybrid Trace PASS/FAIL
```markdown
### Buoc 5: Nghien cuu chien luoc
PASS. Optional step voi user choice. FastCode + Context7 parallel calls. Research output -> .planning/research/SUMMARY.md. STATE.md updated.

### Buoc 3: Kiem tra lo trinh hien co
FAIL (1 issue)

**Logic Trace:**
Line 73-110. AskUserQuestion voi 3 options. Fallback line 105.

**V3 — AskUserQuestion fallback thieu clarity**
- Source: WFLOW-01
- Lines: 105
- Severity: Warning
- Description: "Khong hoi duoc -> tu dong sao luu" khong phan biet tool unavailable vs user timeout
- Impact: AI agent khong biet khi nao trigger fallback
- Suggested Fix: Doi thanh "If AskUserQuestion is not available as a tool OR user does not respond within reasonable time -> auto backup"
- Regression Risk: Low
- Phase 14 Ref: W12
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node --test) |
| Config file | package.json scripts |
| Quick run command | `node --test test/smoke-plan-checker.test.js` |
| Full suite command | `node --test test/` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WFLOW-01 | new-milestone logic trace | manual-only | N/A -- workflow verification la manual analysis | N/A |
| WFLOW-02 | write-code logic trace | manual-only | N/A -- workflow verification la manual analysis | N/A |
| WFLOW-03 | fix-bug logic trace | manual-only | N/A -- workflow verification la manual analysis | N/A |

**Justification for manual-only:** Phase 15 output la 1 verification report (markdown document). Khong co code changes, khong co runtime behavior de test. Verification chinh la qua trinh manual analysis dung Grep/Glob/Read tools. Quality gate la report completeness va accuracy, verified bang /gsd:verify-work.

### Sampling Rate
- **Per task commit:** N/A -- Phase 15 khong tao code commits
- **Per wave merge:** N/A
- **Phase gate:** Report completeness check -- all 3 workflows traced, all Phase 14 issues deep-dived, issue registry complete

### Wave 0 Gaps
None -- Phase 15 la analysis phase, khong can test infrastructure. Existing test suite (443+ tests) khong lien quan vi khong co code changes.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Scan-based audit (Phase 14) | End-to-end logic trace (Phase 15) | v1.2 design | Deeper verification, finds data flow gaps scan misses |
| Check files exist only | 4-level verification (Exist->Substance->Connected->Operational) | v1.0 (verification-patterns.md) | Catches stubs, broken connections, not just missing files |

## Open Questions

1. **Thu tu verify 3 workflows**
   - What we know: new-milestone (10 steps, 405 lines), write-code (10+ steps, 423 lines, most complex), fix-bug (10 steps, 325 lines)
   - Recommendation: Bat dau voi fix-bug (don gian nhat, it steps nhat, 3 references) -> new-milestone (trung binh, 14 references) -> write-code (phuc tap nhat, 3 modes, parallel logic). Ly do: build experience tren workflow don gian truoc

2. **So luong Critical Truths per workflow**
   - What we know: D-12 goi y 3-5, khong phai hard limit
   - Recommendation: fix-bug 4 truths, new-milestone 4 truths, write-code 5 truths (complex nhat). Total 13 Critical Truths

3. **Pham vi code-backed verification**
   - What we know: D-02 yeu cau doi chieu voi code that, nhung cac "code" o day la JS modules (utils.js, plan-checker.js) va file system structure
   - Recommendation: Verify (1) moi @reference/@template ton tai, (2) moi JS module reference (plan-checker.js, utils.js) match behavior described in workflow, (3) moi file path mentioned in workflow (CONTEXT.md, STATE.md, etc.) has consistent naming across steps

## Pre-Defined Truth Inventories

### WFLOW-01: new-milestone (4 Critical Truths)
| # | Truth | Cach kiem chung |
|---|-------|-----------------|
| CT-1 | Tat ca 14 @reference va @template references ton tai tren disk | Glob verify 14 paths |
| CT-2 | STATE.md duoc cap nhat tai it nhat 4 checkpoints (Steps 1, 5, 6e, 7f) | Grep "STATE.md" in workflow, count update points |
| CT-3 | 2 approval gates (requirements Step 6e + roadmap Step 7f) bat buoc voi AskUserQuestion + loop | Trace approval logic at both gates |
| CT-4 | CONTEXT.md + rules/general.md thieu -> STOP (Step 0 guard) | Verify guard logic completeness |

### WFLOW-02: write-code (5 Critical Truths)
| # | Truth | Cach kiem chung |
|---|-------|-----------------|
| CT-1 | Tat ca 9 @reference references ton tai tren disk | Glob verify 9 paths |
| CT-2 | TASKS.md status update 🔄->✅ xay ra TRUOC commit (Step 7a truoc 7b) | Trace step ordering in workflow |
| CT-3 | PROGRESS.md recovery mechanism cover 6 resume points | Verify Step 1.1 case table completeness |
| CT-4 | Effort routing table (simple->haiku, standard->sonnet, complex->opus) match conventions.md | Cross-verify tables |
| CT-5 | Verification loop (Step 9.5) co MAX_ROUNDS=2 va 3 user options khi fail | Trace verification loop logic |

### WFLOW-03: fix-bug (4 Critical Truths)
| # | Truth | Cach kiem chung |
|---|-------|-----------------|
| CT-1 | Tat ca 3 @reference references ton tai tren disk | Glob verify 3 paths |
| CT-2 | Gate check (Step 6c) yeu cau 3 dieu kien truoc khi sua code | Verify 3 conditions listed |
| CT-3 | Patch version logic (Step 2) xu ly dung ca current va old version bugs | Trace version logic paths |
| CT-4 | SESSION file duoc tao (5a) va cap nhat xuyen suot (5c, 6a, 6b, 10) | Grep SESSION mentions, verify update points |

### Phase 14 Issues to Deep-Dive
| Phase 14 ID | Workflow | Description | Deep-Dive Focus |
|-------------|----------|-------------|-----------------|
| C2 | fix-bug | No generic stack fallback (lines 133-140) | Verify impact: list ALL stacks NOT covered, assess how often generic stacks appear |
| W9 | write-code | Parallel mode silent degradation | Verify: what happens when > Files: missing? Is there ANY user notification? |
| W12 | new-milestone | AskUserQuestion fallback clarity | Verify: what exact conditions trigger fallback? Timeout? Tool unavailable? |
| W10 | complete-milestone | Stale test grep pattern | OUT OF SCOPE (complete-milestone not in Phase 15 target) |
| W13 | plan.md | Plan checker step too long | OUT OF SCOPE (plan.md not in Phase 15 target) |
| W15 | init.md | Strict FastCode requirement | OUT OF SCOPE (init.md not in Phase 15 target) |

**Note:** W10, W13, W15 affect workflows NOT in Phase 15 scope. However, if write-code or fix-bug REFERENCE these workflows (cross-workflow handoffs), the connection point IS in scope.

## Sources

### Primary (HIGH confidence)
- `references/verification-patterns.md` -- 4-level verification framework, stub detection patterns
- `references/state-machine.md` -- state transition rules, prerequisites, edge cases
- `references/plan-checker.md` -- Key Links (ADV-01), Truth-Task mapping (CHECK-04)
- `references/conventions.md` -- task status symbols, commit prefixes, version rules, effort levels
- `workflows/new-milestone.md` -- 405 lines, 10 steps, target workflow
- `workflows/write-code.md` -- 423 lines, 10+ steps, most complex target workflow
- `workflows/fix-bug.md` -- 325 lines, 10 steps, target workflow
- `.planning/phases/14-skill-workflow-audit/14-AUDIT-REPORT.md` -- 27 issues baseline
- `.planning/phases/14-skill-workflow-audit/14-02-WORKFLOW-FINDINGS.md` -- detailed workflow findings
- `15-CONTEXT.md` -- 14 locked decisions

### Secondary (MEDIUM confidence)
- `commands/pd/new-milestone.md` -- skill file, guards, execution_context
- `commands/pd/write-code.md` -- skill file, guards, execution_context
- `commands/pd/fix-bug.md` -- skill file, guards, execution_context
- `references/context7-pipeline.md` -- Context7 lookup process
- `references/guard-context.md` -- CONTEXT.md guard pattern
- `references/guard-fastcode.md` -- FastCode guard pattern

### Tertiary (LOW confidence)
None -- all findings based on direct source file analysis.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- tools va references da co san trong project, khong can external dependencies
- Architecture: HIGH -- verification methodology locked by D-01 through D-14, report format locked
- Pitfalls: HIGH -- based on direct analysis of 3 workflow files va Phase 14 experience
- Truth inventories: HIGH -- derived from actual workflow content analysis

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable -- workflow files thay doi chi khi co bug fix o Phase 16)
