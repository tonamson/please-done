# Phase 30: Detective Interactions - Research

**Researched:** 2026-03-25
**Domain:** Orchestrator interaction logic — outcome routing, checkpoint flow, continuation agent, parallel dispatch
**Confidence:** HIGH

## Summary

Phase 30 xay dung cac module logic ma orchestrator (Phase 32) se dung de tuong tac voi user qua 3 nhanh ket qua: ROOT CAUSE choices, CHECKPOINT flow voi Continuation Agent, va parallel dispatch Detective+DocSpec. Tat ca logic la pure functions, nhat quan voi pattern da thiet lap tu Phase 28-29.

Code hien tai da co day du nen tang: `evidence-protocol.js` (parse/validate evidence voi 3 outcome types), `session-manager.js` (quan ly session voi status active/paused/resolved), `resource-config.js` (agent registry, tier mapping, parallel limit). Phase 30 can tao 2-3 module moi: (1) outcome-router — dinh tuyen hanh dong dua tren outcome type, (2) checkpoint-handler — trich xuat cau hoi tu evidence va quan ly continuation agent, (3) parallel-dispatch — logic spawn va hop nhat ket qua tu 2 agent song song.

**Primary recommendation:** Tao 3 pure function modules moi trong `bin/lib/`: `outcome-router.js`, `checkpoint-handler.js`, `parallel-dispatch.js`. Moi module nhan content strings, tra structured objects, KHONG doc file. Tai su dung `parseEvidence()` va `updateSession()` tu modules hien co.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Khi ROOT CAUSE duoc tim thay, orchestrator hien 3 lua chon qua AskUserQuestion: "Sua ngay", "Len ke hoach", "Tu sua".
- **D-02:** "Sua ngay" — Orchestrator truc tiep sua code, doc evidence_architect.md, chay test, commit [LOI]. Tai su dung logic v1.5 (debug-cleanup.js, logic-sync.js, regression-analyzer.js). KHONG spawn them agent.
- **D-03:** "Len ke hoach" — Tao FIX-PLAN.md trong session dir: root cause, files can sua, test can viet, risk assessment. User xem + sua tay truoc khi chay.
- **D-04:** "Tu sua" — Cap nhat SESSION.md status=paused, hien root cause summary + danh sach files can xem. User tu sua, sau do chay lai pd:fix-bug de verify qua Resume UI.
- **D-05:** Khi agent ghi CHECKPOINT REACHED, orchestrator doc evidence file, trich xuat "Cau hoi cho User" section, hien qua AskUserQuestion menu voi cac lua chon goi y.
- **D-06:** Truyen cau tra loi cua user cho agent tiep theo qua prompt injection (nhat quan voi D-11 Phase 29 — session dir qua prompt).
- **D-07:** Agent tiep theo chi nhan evidence cuoi (cua agent gui checkpoint) + cau tra loi user. KHONG doc toan bo evidence chain — tiet kiem token.
- **D-08:** Continuation Agent = spawn lai CUNG loai agent voi context moi. VD: Detective checkpoint — spawn Detective moi. Don gian, de hieu, de debug.
- **D-09:** Toi da 2 vong continuation. Sau 2 lan continuation ma van checkpoint — escalate: hien thong bao "Can nguoi xem xet", pause session. Tranh loop vo han, tiet kiem token.
- **D-10:** Continuation Agent nhan qua prompt: (1) evidence file cuoi, (2) cau tra loi user, (3) session dir path, (4) vong hien tai (1 hoac 2).
- **D-11:** Detective (builder/sonnet) va DocSpec (scout/haiku) chay song song. Ca 2 doc evidence_janitor.md (chi doc, khong xung dot). Ghi ra evidence_code.md va evidence_docs.md rieng.
- **D-12:** Neu 1 agent fail: ghi warning vao SESSION.md, tiep tuc voi evidence tu agent con lai. DocSpec la bo sung, khong bat buoc — workflow khong block.
- **D-13:** Evidence tu 2 agent GIU TACH RIENG — evidence_code.md va evidence_docs.md la 2 files doc lap. Repro va Architect doc ca 2. KHONG can merge logic.

### Claude's Discretion
- Module structure cho outcome-router logic (pure function hay workflow markdown)
- Unit test cases cu the cho tung interaction path
- Error messages khi escalate sau 2 vong continuation
- FIX-PLAN.md template format

### Deferred Ideas (OUT OF SCOPE)
- Orchestrator workflow loop tong the (5 buoc) — Phase 32
- Loop-back khi INCONCLUSIVE (max 3 vong) — Phase 33
- Single-agent fallback mode (--single flag) — Phase 33
- Bug history recall truoc khi dieu tra — Phase 31
- Progressive disclosure (an chi tiet agent spawning) — Phase 32
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROT-03 | Khi ROOT CAUSE duoc tim thay, user duoc chon 1 trong 3: Sua ngay, Len ke hoach, hoac Tu sua | outcome-router.js: routeRootCause() nhan evidence parsed, tra action descriptor cho tung lua chon. prepareFixNow(), prepareFixPlan(), prepareSelfFix() |
| PROT-04 | Khi agent ghi CHECKPOINT REACHED, orchestrator hien cau hoi cho user va truyen cau tra loi cho agent tiep theo | checkpoint-handler.js: extractCheckpointQuestion() dung parseEvidence().sections de lay "Cau hoi cho User". buildContinuationPrompt() tao prompt cho agent tiep |
| PROT-06 | Khi user tra loi CHECKPOINT, orchestrator spawn agent moi tiep nhan context tu evidence files (Continuation Agent) | checkpoint-handler.js: buildContinuationContext() tra { agentName, prompt, round }. enforceContinuationLimit() kiem tra round <= 2 |
| PROT-08 | Code Detective va Doc Specialist chay song song, ca 2 doc evidence_janitor.md ma khong xung dot file | parallel-dispatch.js: buildParallelPlan() tra danh sach agents + shared input. mergeParallelResults() hop nhat ket qua, xu ly partial failure |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Dung tieng viet toan bo, co dau chuan (ap dung cho comments, tên biến mô tả, messages)

## Standard Stack

### Core (da co — tai su dung)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| evidence-protocol.js | Phase 29 | parseEvidence(), validateEvidence(), OUTCOME_TYPES | Da thiet lap, parse evidence content thanh structured object |
| session-manager.js | Phase 29 | updateSession(), getSession() | Quan ly session status (active/paused/resolved) |
| resource-config.js | Phase 28 | getAgentConfig(), AGENT_REGISTRY | Lay config agent khi spawn continuation |
| utils.js | v1.0+ | parseFrontmatter(), assembleMd() | Nen tang parse/build markdown |

### Moi tao (Phase 30)
| Module | Purpose | Pattern |
|--------|---------|---------|
| outcome-router.js | Dinh tuyen hanh dong theo outcome type (root_cause 3 lua chon) | Pure function, nhan evidence parsed object |
| checkpoint-handler.js | Trich xuat cau hoi, tao prompt cho Continuation Agent, enforce max 2 vong | Pure function, nhan evidence content + user answer |
| parallel-dispatch.js | Tao ke hoach spawn 2 agent song song, hop nhat ket qua | Pure function, nhan agent configs + evidence results |

### Reusable tu v1.5 (cho D-02 "Sua ngay")
| Module | Purpose | Khi nao dung |
|--------|---------|--------------|
| debug-cleanup.js | scanDebugMarkers() sau khi sua code | Buoc 5 cua "Sua ngay" flow |
| logic-sync.js | runLogicSync() phat hien thay doi logic | Buoc 5 cua "Sua ngay" flow |
| regression-analyzer.js | analyzeFromCallChain/SourceFiles() | Buoc 5 cua "Sua ngay" flow |

## Architecture Patterns

### Recommended Project Structure
```
bin/lib/
├── outcome-router.js      # PROT-03: ROOT CAUSE choices routing
├── checkpoint-handler.js   # PROT-04 + PROT-06: CHECKPOINT flow + Continuation Agent
├── parallel-dispatch.js    # PROT-08: parallel dispatch logic
├── evidence-protocol.js    # (da co) parse/validate evidence
├── session-manager.js      # (da co) session management
├── resource-config.js      # (da co) agent config/registry
├── debug-cleanup.js        # (da co) v1.5 reuse
├── logic-sync.js           # (da co) v1.5 reuse
└── regression-analyzer.js  # (da co) v1.5 reuse
```

### Pattern 1: Pure Function Module (da thiet lap)
**What:** Module chi chua pure functions, KHONG doc file, KHONG require('fs'), KHONG side effects.
**When to use:** Tat ca logic modules trong Phase 30.
**Example:**
```javascript
// Source: evidence-protocol.js, session-manager.js (pattern da thiet lap)
'use strict';

/**
 * Route ROOT CAUSE outcome sang action descriptor.
 * Pure function: nhan parsed evidence, tra structured action.
 */
function routeRootCause(parsedEvidence, userChoice) {
  // ... logic ...
  return { action, params, warnings: [] };
}

module.exports = { routeRootCause };
```

### Pattern 2: Non-blocking Warnings (da thiet lap)
**What:** Functions tra `{ ..., warnings: [] }` thay vi throw khi gap loi format.
**When to use:** Tat ca functions trong Phase 30.
**Example:**
```javascript
// Source: session-manager.js updateSession() pattern
function mergeParallelResults(results) {
  const warnings = [];
  if (!results.detective) {
    warnings.push('Code Detective khong tra ket qua');
  }
  // DocSpec la optional, chi warning
  if (!results.docSpec) {
    warnings.push('Doc Specialist khong tra ket qua — tiep tuc voi evidence co san');
  }
  return { mergedEvidence, warnings };
}
```

### Pattern 3: Prompt Injection (da thiet lap Phase 29)
**What:** Truyen context cho agent qua prompt string, khong qua file config.
**When to use:** Continuation Agent (D-10), parallel dispatch.
**Example:**
```javascript
// Continuation Agent prompt structure (D-10)
function buildContinuationPrompt({ evidencePath, userAnswer, sessionDir, round }) {
  return [
    `Session dir: ${sessionDir}`,
    `Evidence truoc: ${evidencePath}`,
    `Cau tra loi user: ${userAnswer}`,
    `Vong hien tai: ${round}/2`,
  ].join('\n');
}
```

### Anti-Patterns to Avoid
- **Doc toan bo evidence chain:** D-07 chi ro chi nhan evidence cuoi + cau tra loi user. KHONG doc lai toan bo chain.
- **Merge evidence thanh 1 file:** D-13 giu tach rieng evidence_code.md va evidence_docs.md. KHONG merge.
- **Spawn nested subagent:** Out of Scope — Claude Code cam subagent spawn subagent.
- **Unlimited continuation:** D-09 gioi han max 2 vong. Phai enforce trong code.
- **Block workflow khi DocSpec fail:** D-12 DocSpec la bo sung, KHONG bat buoc.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Parse evidence content | Custom regex parser | parseEvidence() tu evidence-protocol.js | Da validated, handle frontmatter + sections |
| Parse session status | Regex tren SESSION.md | getSession() tu session-manager.js | Handle edge cases (missing fields, malformed) |
| Get agent model/tools | Hardcode model names | getAgentConfig() tu resource-config.js | Single source of truth, de thay doi |
| Build markdown files | String concatenation | assembleMd() tu utils.js | Chuan YAML frontmatter format |
| Validate outcome type | Custom if/else chain | OUTCOME_TYPES constant tu evidence-protocol.js | 3 outcomes da dinh nghia voi requiredSections |

**Key insight:** Phase 30 modules la cau noi giua evidence data (Phase 29) va orchestrator workflow (Phase 32). Chung KHONG lam I/O — chi transform data. Orchestrator Phase 32 se doc file, goi cac functions nay, roi hanh dong dua tren ket qua.

## Common Pitfalls

### Pitfall 1: Quen enforce max 2 vong continuation
**What goes wrong:** Loop vo han — agent checkpoint, spawn agent moi, lai checkpoint, spawn tiep...
**Why it happens:** Khong co counter hoac counter khong duoc truyen qua prompt.
**How to avoid:** `buildContinuationContext()` PHAI nhan va return `round`. Function rieng `enforceContinuationLimit(round)` throw khi round > 2.
**Warning signs:** Test khong cover case round=3.

### Pitfall 2: Block workflow khi DocSpec fail
**What goes wrong:** Toan bo debug session dung lai vi DocSpec (optional agent) timeout hoac loi.
**Why it happens:** Logic merge doi ca 2 ket qua moi tiep tuc.
**How to avoid:** `mergeParallelResults()` chi warning khi DocSpec fail, van tra ket qua tu Detective alone. Detective la critical path, DocSpec la bonus.
**Warning signs:** Khong co test case cho "1 agent fail" scenario.

### Pitfall 3: Truyền quá nhiều context cho Continuation Agent
**What goes wrong:** Token bung no — agent nhan toan bo evidence chain thay vi chi evidence cuoi.
**Why it happens:** Developer muon "cung cap day du thong tin".
**How to avoid:** D-07 quy dinh chi nhan: (1) evidence cuoi, (2) cau tra loi user, (3) session dir, (4) vong hien tai. KHONG doc them.
**Warning signs:** Prompt > 1000 tokens cho continuation.

### Pitfall 4: FIX-PLAN.md ghi ngoai session dir
**What goes wrong:** FIX-PLAN tao o root hoac .planning/ thay vi trong session dir.
**Why it happens:** Khong truyen session dir path.
**How to avoid:** `prepareFixPlan()` PHAI return path relative to session dir, KHONG return absolute path.
**Warning signs:** Test khong kiem tra output path.

### Pitfall 5: "Sua ngay" spawn them agent
**What goes wrong:** Vi pham D-02 — orchestrator phai truc tiep sua code, KHONG spawn agent moi.
**Why it happens:** Developer nghi can agent chuyen biet de sua code.
**How to avoid:** `prepareFixNow()` tra ve action descriptor voi reusable module references (debug-cleanup.js, logic-sync.js, regression-analyzer.js). Orchestrator (Phase 32) se truc tiep dung cac modules nay.
**Warning signs:** `prepareFixNow()` return agentName thay vi action descriptor.

### Pitfall 6: AskUserQuestion format khong nhat quan
**What goes wrong:** Moi interaction dung format khac nhau — user mat phuong huong.
**Why it happens:** Khong co chuan cho AskUserQuestion menu.
**How to avoid:** Tat ca user interaction qua cung 1 format: question string + array of choices. Module tra ve structured object, orchestrator render.
**Warning signs:** Hardcode UI text trong module thay vi tra structured data.

## Code Examples

### outcome-router.js — routeRootCause()

```javascript
// Module moi — Phase 30
'use strict';

const { parseEvidence } = require('./evidence-protocol');

/**
 * 3 lua chon khi ROOT CAUSE duoc tim thay (D-01).
 */
const ROOT_CAUSE_CHOICES = [
  { key: 'fix_now',  label: 'Sua ngay' },
  { key: 'fix_plan', label: 'Len ke hoach' },
  { key: 'self_fix', label: 'Tu sua' },
];

/**
 * Tao menu lua chon tu evidence ROOT CAUSE FOUND.
 *
 * @param {string} evidenceContent - Noi dung evidence file (frontmatter + body)
 * @returns {{ question: string, choices: Array<{key: string, label: string}>, summary: string, warnings: string[] }}
 */
function buildRootCauseMenu(evidenceContent) {
  const warnings = [];
  const parsed = parseEvidence(evidenceContent);

  if (parsed.outcome !== 'root_cause') {
    warnings.push(`outcome khong phai root_cause: ${parsed.outcome}`);
    return { question: '', choices: [], summary: '', warnings };
  }

  const rootCause = parsed.sections['Nguyen nhan'] || 'Khong co mo ta';
  const suggestion = parsed.sections['De xuat'] || '';

  const question = `Da tim thay nguyen nhan:\n${rootCause}\n\nBan muon lam gi?`;
  const summary = rootCause.split('\n')[0].slice(0, 120);

  return { question, choices: [...ROOT_CAUSE_CHOICES], summary, warnings };
}

module.exports = { buildRootCauseMenu, ROOT_CAUSE_CHOICES };
```

### outcome-router.js — prepareFixNow(), prepareFixPlan(), prepareSelfFix()

```javascript
/**
 * "Sua ngay" action descriptor (D-02).
 * Tra ve danh sach modules can dung — orchestrator truc tiep goi, KHONG spawn agent.
 */
function prepareFixNow(evidenceContent) {
  const parsed = parseEvidence(evidenceContent);
  const warnings = [];

  const evidence = parsed.sections['Bang chung'] || '';
  const suggestion = parsed.sections['De xuat'] || '';

  return {
    action: 'fix_now',
    reusableModules: ['debug-cleanup', 'logic-sync', 'regression-analyzer'],
    evidence,
    suggestion,
    commitPrefix: '[LOI]',
    warnings,
  };
}

/**
 * "Len ke hoach" action descriptor (D-03).
 * Tra ve FIX-PLAN.md template content.
 */
function prepareFixPlan(evidenceContent, sessionDir) {
  const parsed = parseEvidence(evidenceContent);
  const warnings = [];

  const rootCause = parsed.sections['Nguyen nhan'] || '';
  const evidence = parsed.sections['Bang chung'] || '';
  const suggestion = parsed.sections['De xuat'] || '';

  const planContent = assembleMd(
    { type: 'fix-plan', session: parsed.session, created: new Date().toISOString() },
    `\n# FIX-PLAN\n\n## Nguyen nhan\n${rootCause}\n\n## Files can sua\n${evidence}\n\n## Test can viet\n- [ ] Test tai hien loi\n- [ ] Test sau khi sua\n\n## De xuat\n${suggestion}\n\n## Risk Assessment\n- [ ] Anh huong modules khac?\n- [ ] Can cap nhat docs?\n`
  );

  return {
    action: 'fix_plan',
    planContent,
    planPath: 'FIX-PLAN.md', // relative to session dir
    warnings,
  };
}

/**
 * "Tu sua" action descriptor (D-04).
 * Tra ve session update data va summary cho user.
 */
function prepareSelfFix(evidenceContent) {
  const parsed = parseEvidence(evidenceContent);
  const warnings = [];

  const rootCause = parsed.sections['Nguyen nhan'] || '';
  const evidence = parsed.sections['Bang chung'] || '';

  return {
    action: 'self_fix',
    sessionUpdate: { status: 'paused' },
    summary: rootCause.split('\n')[0].slice(0, 200),
    filesForReview: evidence,
    resumeHint: 'Chay lai pd:fix-bug de verify sau khi sua.',
    warnings,
  };
}
```

### checkpoint-handler.js — extractCheckpointQuestion()

```javascript
// Module moi — Phase 30
'use strict';

const { parseEvidence } = require('./evidence-protocol');

/** Gioi han toi da vong continuation (D-09). */
const MAX_CONTINUATION_ROUNDS = 2;

/**
 * Trich xuat cau hoi tu evidence CHECKPOINT REACHED (D-05).
 *
 * @param {string} evidenceContent - Noi dung evidence file
 * @returns {{ question: string, context: string, agentName: string|null, warnings: string[] }}
 */
function extractCheckpointQuestion(evidenceContent) {
  const warnings = [];
  const parsed = parseEvidence(evidenceContent);

  if (parsed.outcome !== 'checkpoint') {
    warnings.push(`outcome khong phai checkpoint: ${parsed.outcome}`);
    return { question: '', context: '', agentName: null, warnings };
  }

  const question = parsed.sections['Cau hoi cho User'] || '';
  const context = parsed.sections['Context cho Agent tiep'] || '';
  const agentName = parsed.agent;

  if (!question) {
    warnings.push('Evidence thieu section "Cau hoi cho User"');
  }

  return { question, context, agentName, warnings };
}

/**
 * Tao context cho Continuation Agent (D-10).
 *
 * @param {object} params
 * @param {string} params.evidencePath - Path toi evidence cuoi cung
 * @param {string} params.userAnswer - Cau tra loi cua user
 * @param {string} params.sessionDir - Path toi session directory
 * @param {number} params.currentRound - Vong hien tai (1 hoac 2)
 * @param {string} params.agentName - Ten agent can spawn lai
 * @returns {{ prompt: string, agentName: string, round: number, canContinue: boolean, warnings: string[] }}
 */
function buildContinuationContext(params) {
  const { evidencePath, userAnswer, sessionDir, currentRound, agentName } = params;
  const warnings = [];

  const canContinue = currentRound <= MAX_CONTINUATION_ROUNDS;

  if (!canContinue) {
    warnings.push(`Da vuot qua ${MAX_CONTINUATION_ROUNDS} vong continuation — can nguoi xem xet`);
  }

  const prompt = [
    `CONTINUATION — Vong ${currentRound}/${MAX_CONTINUATION_ROUNDS}`,
    `Session dir: ${sessionDir}`,
    `Evidence truoc: ${evidencePath}`,
    `Cau tra loi user: ${userAnswer}`,
  ].join('\n');

  return { prompt, agentName, round: currentRound, canContinue, warnings };
}

module.exports = {
  extractCheckpointQuestion,
  buildContinuationContext,
  MAX_CONTINUATION_ROUNDS,
};
```

### parallel-dispatch.js — buildParallelPlan(), mergeParallelResults()

```javascript
// Module moi — Phase 30
'use strict';

const { getAgentConfig } = require('./resource-config');
const { validateEvidence } = require('./evidence-protocol');

/**
 * Tao ke hoach spawn Detective + DocSpec song song (D-11).
 *
 * @param {string} sessionDir - Path toi session directory
 * @param {string} janitarEvidencePath - Path toi evidence_janitor.md
 * @returns {{ agents: Array<{name: string, config: object, inputPath: string, outputFile: string}>, warnings: string[] }}
 */
function buildParallelPlan(sessionDir, janitarEvidencePath) {
  const warnings = [];

  const detectiveConfig = getAgentConfig('pd-code-detective');
  const docSpecConfig = getAgentConfig('pd-doc-specialist');

  return {
    agents: [
      {
        name: 'pd-code-detective',
        config: detectiveConfig,
        inputPath: janitarEvidencePath,
        outputFile: 'evidence_code.md',
        critical: true,   // Detective la critical path
      },
      {
        name: 'pd-doc-specialist',
        config: docSpecConfig,
        inputPath: janitarEvidencePath,
        outputFile: 'evidence_docs.md',
        critical: false,   // DocSpec la optional (D-12)
      },
    ],
    warnings,
  };
}

/**
 * Hop nhat ket qua tu 2 agent song song (D-12, D-13).
 * DocSpec fail -> chi warning, van tiep tuc.
 *
 * @param {object} params
 * @param {object|null} params.detectiveResult - { evidenceContent, error }
 * @param {object|null} params.docSpecResult - { evidenceContent, error }
 * @returns {{ results: Array<{agent: string, outcome: string|null, valid: boolean}>, allSucceeded: boolean, warnings: string[] }}
 */
function mergeParallelResults(params) {
  const { detectiveResult, docSpecResult } = params;
  const warnings = [];
  const results = [];

  // Detective (critical)
  if (detectiveResult?.evidenceContent) {
    const validation = validateEvidence(detectiveResult.evidenceContent);
    results.push({ agent: 'pd-code-detective', outcome: validation.outcome, valid: validation.valid });
    if (!validation.valid) warnings.push(...validation.warnings.map(w => `Detective: ${w}`));
  } else {
    const errMsg = detectiveResult?.error?.message || 'Khong co ket qua';
    warnings.push(`Code Detective that bai: ${errMsg}`);
    results.push({ agent: 'pd-code-detective', outcome: null, valid: false });
  }

  // DocSpec (optional — D-12)
  if (docSpecResult?.evidenceContent) {
    const validation = validateEvidence(docSpecResult.evidenceContent);
    results.push({ agent: 'pd-doc-specialist', outcome: validation.outcome, valid: validation.valid });
    if (!validation.valid) warnings.push(...validation.warnings.map(w => `DocSpec: ${w}`));
  } else {
    const errMsg = docSpecResult?.error?.message || 'Khong co ket qua';
    warnings.push(`Doc Specialist khong tra ket qua: ${errMsg} — tiep tuc voi evidence co san`);
  }

  const allSucceeded = results.every(r => r.valid);

  return { results, allSucceeded, warnings };
}

module.exports = { buildParallelPlan, mergeParallelResults };
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| v1.5 single agent debug | v2.1 multi-agent detective team | Phase 28-29 (2026-03-24) | Module hoa, pure functions, evidence-based handoff |
| Hardcode model names | Tier mapping qua resource-config.js | Phase 28 | Linh hoat thay doi model theo agent |
| Console.log truc tiep | AskUserQuestion tool | Phase 29 | Nhat quan UX, menu choices |
| String parsing evidence | parseEvidence() structured parser | Phase 29 | Reliable, testable, co sections map |

**Deprecated/outdated:**
- Pattern cu "doc toan bo codebase lai" trong moi agent — thay bang evidence chain handoff (PROT-07)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node:test + node:assert/strict) |
| Config file | Khong co file config rieng — dung `npm test` |
| Quick run command | `node --test test/smoke-outcome-router.test.js` |
| Full suite command | `node --test 'test/*.test.js'` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROT-03 | buildRootCauseMenu() tra 3 choices tu evidence root_cause | unit | `node --test test/smoke-outcome-router.test.js -x` | Wave 0 |
| PROT-03 | prepareFixNow() tra action descriptor voi reusable modules | unit | `node --test test/smoke-outcome-router.test.js -x` | Wave 0 |
| PROT-03 | prepareFixPlan() tra FIX-PLAN.md content dung template | unit | `node --test test/smoke-outcome-router.test.js -x` | Wave 0 |
| PROT-03 | prepareSelfFix() tra sessionUpdate status=paused | unit | `node --test test/smoke-outcome-router.test.js -x` | Wave 0 |
| PROT-04 | extractCheckpointQuestion() trich xuat "Cau hoi cho User" tu evidence checkpoint | unit | `node --test test/smoke-checkpoint-handler.test.js -x` | Wave 0 |
| PROT-06 | buildContinuationContext() tra prompt voi 4 thanh phan (D-10) | unit | `node --test test/smoke-checkpoint-handler.test.js -x` | Wave 0 |
| PROT-06 | buildContinuationContext() tra canContinue=false khi round > 2 | unit | `node --test test/smoke-checkpoint-handler.test.js -x` | Wave 0 |
| PROT-08 | buildParallelPlan() tra 2 agents voi config dung tu registry | unit | `node --test test/smoke-parallel-dispatch.test.js -x` | Wave 0 |
| PROT-08 | mergeParallelResults() hop nhat khi ca 2 thanh cong | unit | `node --test test/smoke-parallel-dispatch.test.js -x` | Wave 0 |
| PROT-08 | mergeParallelResults() chi warning khi DocSpec fail, van tiep tuc | unit | `node --test test/smoke-parallel-dispatch.test.js -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-{module}.test.js`
- **Per wave merge:** `node --test 'test/*.test.js'`
- **Phase gate:** Full suite green truoc khi verify

### Wave 0 Gaps
- [ ] `test/smoke-outcome-router.test.js` — covers PROT-03 (4 functions)
- [ ] `test/smoke-checkpoint-handler.test.js` — covers PROT-04, PROT-06 (2 functions + constant)
- [ ] `test/smoke-parallel-dispatch.test.js` — covers PROT-08 (2 functions, 3 scenarios)

## Open Questions

1. **FIX-PLAN.md template format chi tiet**
   - What we know: Can chua root cause, files can sua, test can viet, risk assessment (D-03)
   - What's unclear: Section ordering, co can YAML frontmatter cho FIX-PLAN.md khong
   - Recommendation: Dung YAML frontmatter (nhat quan voi evidence files) + 5 sections. Claude's discretion area — planner quyet dinh chi tiet.

2. **Error message khi escalate sau 2 vong**
   - What we know: Hien thong bao "Can nguoi xem xet", pause session (D-09)
   - What's unclear: Message co nen bao gom summary tu evidence cuoi khong
   - Recommendation: Tra summary tu evidence cuoi + huong dan tiep theo ("Xem evidence files tai: {path}"). Claude's discretion area.

3. **AskUserQuestion format cho checkpoint goi y**
   - What we know: D-05 noi "hien qua AskUserQuestion menu voi cac lua chon goi y"
   - What's unclear: Lua chon goi y tu dau — tu evidence content hay predefined list
   - Recommendation: Trich xuat tu "Cau hoi cho User" section. Neu section co bullet list → dung lam choices. Neu khong → dung free text prompt.

## Sources

### Primary (HIGH confidence)
- `bin/lib/evidence-protocol.js` — parseEvidence(), validateEvidence(), OUTCOME_TYPES structure
- `bin/lib/session-manager.js` — updateSession(), getSession(), SESSION_STATUSES
- `bin/lib/resource-config.js` — getAgentConfig(), AGENT_REGISTRY, PARALLEL_LIMIT
- `bin/lib/utils.js` — parseFrontmatter(), assembleMd()
- `.claude/agents/pd-code-detective.md` — evidence_code.md output format
- `.claude/agents/pd-doc-specialist.md` — evidence_docs.md output format
- `test/smoke-evidence-protocol.test.js` — test pattern (node:test + node:assert/strict)
- `test/smoke-session-manager.test.js` — test pattern voi makeHelper functions

### Secondary (MEDIUM confidence)
- `2.1_UPGRADE_DEBUG.md` — Strategy document, Section 2 (Detective Protocols), Section 4 (Execution Loop)
- `.planning/REQUIREMENTS.md` — PROT-03, PROT-04, PROT-06, PROT-08 definitions

### Tertiary (LOW confidence)
- None — tat ca findings dua tren source code hien co.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — tat ca modules da ton tai va da doc ma nguon truc tiep
- Architecture: HIGH — pattern pure function + non-blocking warnings da thiet lap qua 5 modules (Phase 28-29)
- Pitfalls: HIGH — dua tren decisions cu the tu CONTEXT.md, de kiem tra

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable — internal modules, khong phu thuoc library external)
