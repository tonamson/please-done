# Phase 33: Resilience & Backward Compatibility - Research

**Researched:** 2026-03-25
**Domain:** Workflow error handling, loop-back pattern, backward compatibility fallback
**Confidence:** HIGH

## Summary

Phase 33 them 2 tinh nang con lai cho workflow fix-bug.md: (1) INCONCLUSIVE loop-back quay lai Buoc 2 khi Architect khong ket luan duoc (toi da 3 vong), va (2) single-agent fallback de tuong thich nguoc voi v1.5 khi thieu agent configs hoac truyen `--single` flag.

Ca 2 tinh nang deu co pattern san trong codebase. INCONCLUSIVE loop-back theo sat pattern cua `buildContinuationContext()` trong checkpoint-handler.js (nhung max 3 thay vi 2, va quay ve Buoc 2 thay vi lai cung agent). Single-agent fallback chi la detection + redirect don gian — khong can tao module moi.

**Primary recommendation:** Them `buildInconclusiveContext()` vao outcome-router.js (pure function), sua fix-bug.md inconclusive block thanh loop-back, them Buoc 0 detection check truoc Resume UI. Cap nhat tests va snapshots.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Them `buildInconclusiveContext()` vao `bin/lib/outcome-router.js` — pure function, trich xuat Elimination Log tu evidence_architect.md, tao prompt cho Buoc 2 tiep theo. Tai su dung pattern tuong tu `buildContinuationContext()` cua checkpoint-handler.js.
- **D-02:** Theo doi so vong qua field `inconclusive_rounds` trong SESSION.md. Orchestrator kiem tra truoc moi lan loop, tang counter sau moi vong. Max 3 vong.
- **D-03:** Khi dat max 3 vong: pause session + hien full Elimination Log cho user. Tuong tu escalate pattern cua checkpoint-handler (D-09 Phase 30) nhung max la 3 thay vi 2.
- **D-04:** User bo sung thong tin moi qua AskUserQuestion free-text. Thong tin ghi vao session dir file `user_input_round_{N}.md`. Agent Buoc 2 nhan file nay + Elimination Log qua prompt injection.
- **D-05:** Flow INCONCLUSIVE loop-back: evidence_architect outcome=inconclusive -> hien Elimination Log -> AskUserQuestion free-text -> ghi user_input_round_N.md -> tang inconclusive_rounds trong SESSION.md -> quay lai Buoc 2 (Detective+DocSpec) voi context moi.
- **D-06:** Kiem tra su ton tai 5 agent files tai `.claude/agents/pd-*.md` luc workflow khoi dong (truoc Resume UI). Thieu bat ky file nao -> auto-fallback.
- **D-07:** Parse `--single` flag tu arguments dau workflow. Neu co -> skip toan bo orchestrator, load fix-bug-v1.5.md content.
- **D-08:** Auto-fallback UX: hien warning banner 1 dong ("Thieu agent configs, dung che do don agent") roi chay v1.5 workflow. Khong hoi user — fail silently vao safe mode.
- **D-09:** Implementation: Buoc 0 cua fix-bug.md them check block. Neu --single hoac thieu agents -> redirect sang fix-bug-v1.5.md logic. KHONG spawn process moi — inline v1.5 steps.
- **D-10:** Phase 32 da implement progressive disclosure banners (D-05 Phase 32). Phase 33 chi can dam bao INCONCLUSIVE loop cung hien banner nhat quan ("Vong {N}/3: Dang dieu tra them voi thong tin moi...").
- **D-11:** Test outcome-router.js additions (buildInconclusiveContext) + unit test cho agent detection logic.
- **D-12:** Chay toan bo test suite dam bao 601+ tests van pass. Cap nhat snapshots neu fix-bug.md thay doi.

### Claude's Discretion
- So luong plans va task breakdown cho Phase 33
- Chi tiet implementation cua agent file detection (glob pattern vs hardcoded list)
- Error messages khi max loop reached
- Unit test structure va so luong test cases
- Converter pipeline snapshot update strategy

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FLOW-06 | Khi INCONCLUSIVE o Buoc 4, orchestrator quay lai Buoc 2 voi Elimination Log va thong tin moi tu user (max 3 vong) | buildInconclusiveContext() trong outcome-router.js, SESSION.md inconclusive_rounds tracking, user_input_round_N.md files, fix-bug.md INCONCLUSIVE block rewrite |
| FLOW-07 | User co the chay single-agent mode (v1.5 cu) khi khong co agent configs hoac truyen --single flag | Buoc 0 agent detection check, --single flag parsing, inline v1.5 redirect |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Dung tieng Viet toan bo, co dau chuan (trong code comments va user-facing text)

## Standard Stack

### Core (da co trong project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in test runner | node:test | Test framework | Da dung cho 26 test files, 601+ tests |
| node:assert/strict | built-in | Assertions | Da dung khap project |
| node:fs, node:path | built-in | File operations | Pure function tests khong can fs, nhung integration tests can |

### Supporting (da co)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| evidence-protocol.js | local | parseEvidence(), validateEvidence() | Doc va validate INCONCLUSIVE evidence |
| checkpoint-handler.js | local | Pattern reference | buildContinuationContext() la template cho buildInconclusiveContext() |
| outcome-router.js | local | Them buildInconclusiveContext() | Noi chinh de them INCONCLUSIVE routing logic |
| session-manager.js | local | updateSession() | Cap nhat inconclusive_rounds counter |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hardcoded agent list (5 files) | Glob `.claude/agents/pd-*.md` | Glob linh hoat hon nhung can import fs — xung dot voi pure function pattern. Hardcoded list an toan hon, da co danh sach trong smoke-agent-files.test.js |

**Khuyen nghi:** Dung hardcoded list 5 agent names (nhu da co trong test/smoke-agent-files.test.js AGENT_NAMES). Agent detection function nam trong fix-bug.md workflow logic (doc file), KHONG phai trong pure function module.

## Architecture Patterns

### Recommended Changes
```
bin/lib/
  outcome-router.js          # THEM: buildInconclusiveContext(), MAX_INCONCLUSIVE_ROUNDS
workflows/
  fix-bug.md                 # SUA: Buoc 0 (agent detection), INCONCLUSIVE block (loop-back)
test/
  smoke-outcome-router.test.js  # THEM: tests cho buildInconclusiveContext()
  snapshots/                     # CAP NHAT: sau khi fix-bug.md thay doi
```

### Pattern 1: buildInconclusiveContext() — theo checkpoint-handler.js
**What:** Pure function trich xuat Elimination Log tu evidence content, tao prompt cho Buoc 2 agents voi context moi (Elimination Log + user input path).
**When to use:** Khi outcome = 'inconclusive' va chua dat max vong.
**Example:**
```javascript
// Tuong tu buildContinuationContext() trong checkpoint-handler.js
const MAX_INCONCLUSIVE_ROUNDS = 3;

function buildInconclusiveContext({ evidenceContent, userInputPath, sessionDir, currentRound }) {
  const warnings = [];
  const canContinue = currentRound <= MAX_INCONCLUSIVE_ROUNDS;

  if (!canContinue) {
    warnings.push(`Da vuot qua ${MAX_INCONCLUSIVE_ROUNDS} vong dieu tra — can nguoi xem xet`);
  }

  const parsed = parseEvidence(evidenceContent);
  const eliminationLog = parsed.sections['Elimination Log'] || '';

  const prompt = [
    `INCONCLUSIVE LOOP-BACK — Vong ${currentRound}/${MAX_INCONCLUSIVE_ROUNDS}`,
    `Session dir: ${sessionDir}`,
    `Elimination Log tu vong truoc:\n${eliminationLog}`,
    `Thong tin bo sung tu user: ${userInputPath}`,
  ].join('\n');

  return { prompt, eliminationLog, round: currentRound, canContinue, warnings };
}
```

### Pattern 2: Single-agent Detection — Buoc 0 trong fix-bug.md
**What:** Check 5 agent files + --single flag truoc Resume UI. Neu thieu -> inline v1.5 logic.
**When to use:** Dau tien trong workflow, truoc bat ky agent spawning nao.
**Example (workflow markdown):**
```markdown
## Buoc 0: Kiem tra che do hoat dong

1. Parse $ARGUMENTS -> kiem tra co `--single` flag khong
2. Neu KHONG co --single:
   - Kiem tra 5 files ton tai:
     `.claude/agents/pd-bug-janitor.md`
     `.claude/agents/pd-code-detective.md`
     `.claude/agents/pd-doc-specialist.md`
     `.claude/agents/pd-repro-engineer.md`
     `.claude/agents/pd-fix-architect.md`
   - Thieu bat ky file nao -> auto-fallback = true
3. Neu --single HOAC auto-fallback:
   Hien: "Thieu agent configs, dung che do don agent"
   Doc va thuc hien theo noi dung fix-bug-v1.5.md. DUNG workflow v2.1 tai day.
4. Neu du 5 files -> tiep tuc Buoc 0.5 (Resume UI hien tai)
```

### Pattern 3: INCONCLUSIVE Loop-back Flow trong fix-bug.md
**What:** Thay the stub hien tai (dong 214-220) bang loop-back logic day du.
**Example (workflow markdown):**
```markdown
**NEU outcome = 'inconclusive':**
  1. Goi `buildInconclusiveContext({ evidenceContent, userInputPath: null, sessionDir, currentRound })`
     tu `bin/lib/outcome-router.js` -> { eliminationLog, canContinue }
  2. Hien Elimination Log cho user
  3. NEU canContinue = false (da dat 3 vong):
     Thong bao: "Da dieu tra 3 vong. Day la Elimination Log day du: ..."
     Read SESSION.md -> updateSession({ status: 'paused' }). DUNG workflow.
  4. NEU canContinue = true:
     Hoi user bo sung thong tin qua AskUserQuestion free-text
     Ghi response vao `{session_dir}/user_input_round_{N}.md`
     Read SESSION.md -> updateSession({ appendToBody: 'inconclusive_rounds: {N}' })
     Hien banner: "--- Vong {N}/3: Dang dieu tra them voi thong tin moi ---"
     Quay lai Buoc 2 (spawn Detective + DocSpec voi context moi)
```

### Anti-Patterns to Avoid
- **Spawn process moi cho v1.5 fallback:** KHONG tao subprocess — inline v1.5 steps truc tiep trong fix-bug.md (per D-09)
- **Tao module moi cho agent detection:** Detection logic thuoc ve workflow, khong phai pure function module. Workflow doc file truc tiep.
- **Dung fs.existsSync trong pure function:** outcome-router.js la pure function — KHONG import fs. Agent detection nam trong workflow.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Parse Elimination Log | Custom parser | parseEvidence().sections['Elimination Log'] | Da co san, da test |
| Counter tracking | Custom state management | SESSION.md frontmatter + updateSession() | Nhat quan voi checkpoint-handler pattern |
| Evidence validation | Manual format check | validateEvidence() | Non-blocking, da handle ca edge cases |
| Continuation prompt | Custom template | Theo sat buildContinuationContext() pattern | Da chung minh hoat dong trong Phase 30 |

**Key insight:** Moi building block da ton tai — Phase 33 chi la to hop cac pure functions da co voi workflow logic moi.

## Common Pitfalls

### Pitfall 1: Khong reset inconclusive_rounds khi session tiep tuc tu khac outcome
**What goes wrong:** Session cu co inconclusive_rounds = 2, user resume session, Architect tra root_cause -> inconclusive_rounds van con 2. Neu sau do INCONCLUSIVE lai xay ra, chi con 1 vong.
**Why it happens:** Counter khong reset khi flow thanh cong.
**How to avoid:** Counter chi active trong 1 "batch" INCONCLUSIVE lien tiep. Khi outcome khac root_cause/checkpoint xay ra, counter khong can reset vi no chi check trong INCONCLUSIVE block.
**Warning signs:** Test voi session co mix outcomes.

### Pitfall 2: fix-bug.md snapshot test fail sau khi sua workflow
**What goes wrong:** smoke-snapshot.test.js va smoke-integrity.test.js so sanh noi dung fix-bug.md. Sua workflow -> tests fail.
**Why it happens:** Converter pipeline va integrity tests doc truc tiep file content.
**How to avoid:** SAU KHI sua fix-bug.md, chay `node test/generate-snapshots.js` de regenerate snapshots. Kiem tra smoke-integrity.test.js xem co assertion nao can cap nhat.
**Warning signs:** Test fail voi message "thieu X" hoac "khong match snapshot".

### Pitfall 3: Thieu backward compat test cho --single flag parsing
**What goes wrong:** --single flag khong duoc parse dung khi co them arguments sau no.
**Why it happens:** Arguments parsing khong chuan hoa.
**How to avoid:** --single la boolean flag, kiem tra trong $ARGUMENTS voi match/includes. Test ca 2 truong hop: `--single` va `--single loi gi do`.

### Pitfall 4: Loop-back khong truyen du context cho Buoc 2 agents
**What goes wrong:** Detective va DocSpec o vong 2+ khong biet vong truoc da kiem tra gi.
**Why it happens:** Chi truyen user input ma khong truyen Elimination Log.
**How to avoid:** Prompt cho Buoc 2 PHAI gom ca: (1) Elimination Log, (2) user_input_round_N.md path, (3) evidence_janitor.md goc. Agent doc tat ca de biet vung "an toan" va vung can dieu tra them.

### Pitfall 5: Da co test failures trong repo hien tai
**What goes wrong:** Repo hien tai co 3-5 test failures trong smoke-integrity.test.js (backward compat default sonnet, effort routing). Cac failures nay KHONG lien quan Phase 33 — chung la TDD RED tests tu Phase 32 scope.
**Why it happens:** Phase 32 thay doi fix-bug.md tu v1.5 format sang v2.1 orchestrator format, mot so integrity assertions chua update.
**How to avoid:** Phase 33 can FIX cac test failures nay hoac xac nhan chung da duoc fix. Khi kiem tra "601+ tests van pass", can phan biet test moi fail vs test da fail truoc.

## Code Examples

### buildInconclusiveContext() — day du
```javascript
// Source: Pattern tu checkpoint-handler.js, dieu chinh cho INCONCLUSIVE
'use strict';

const { parseEvidence } = require('./evidence-protocol');

const MAX_INCONCLUSIVE_ROUNDS = 3;

/**
 * Tao context cho Buoc 2 khi INCONCLUSIVE loop-back (per D-01, D-05).
 *
 * @param {object} params
 * @param {string} params.evidenceContent - Noi dung evidence_architect.md
 * @param {string|null} params.userInputPath - Duong dan file user_input_round_N.md (null o vong dau)
 * @param {string} params.sessionDir - Thu muc session
 * @param {number} params.currentRound - Vong hien tai (1-based)
 * @returns {{ prompt: string, eliminationLog: string, round: number, canContinue: boolean, warnings: string[] }}
 */
function buildInconclusiveContext({ evidenceContent, userInputPath, sessionDir, currentRound }) {
  const warnings = [];
  const canContinue = currentRound <= MAX_INCONCLUSIVE_ROUNDS;

  if (!canContinue) {
    warnings.push(`Da vuot qua ${MAX_INCONCLUSIVE_ROUNDS} vong dieu tra — can nguoi xem xet`);
  }

  const parsed = parseEvidence(evidenceContent);
  const eliminationLog = parsed.sections['Elimination Log'] || '';

  if (!eliminationLog) {
    warnings.push('Evidence thieu Elimination Log section');
  }

  const promptParts = [
    `INCONCLUSIVE LOOP-BACK — Vong ${currentRound}/${MAX_INCONCLUSIVE_ROUNDS}`,
    `Session dir: ${sessionDir}`,
    `Elimination Log tu vong truoc:\n${eliminationLog}`,
  ];

  if (userInputPath) {
    promptParts.push(`Thong tin bo sung tu user: ${userInputPath}`);
  }

  const prompt = promptParts.join('\n');

  return { prompt, eliminationLog, round: currentRound, canContinue, warnings };
}

module.exports = {
  // ... existing exports
  buildInconclusiveContext,
  MAX_INCONCLUSIVE_ROUNDS,
};
```

### Unit test cho buildInconclusiveContext()
```javascript
// Source: Theo pattern cua smoke-checkpoint-handler.test.js
const BODY_INCONCLUSIVE = `## INVESTIGATION INCONCLUSIVE

## Elimination Log
| File | Logic | Ket qua |
|------|-------|---------|
| src/api.js | null check | Binh thuong |
| src/db.js | query logic | Binh thuong |

## Huong dieu tra tiep
Can kiem tra them middleware layer.`;

describe('buildInconclusiveContext', () => {
  it('tra ve canContinue=true khi round <= 3', () => {
    const result = buildInconclusiveContext({
      evidenceContent: makeEvidence({ outcome: 'inconclusive', body: BODY_INCONCLUSIVE }),
      userInputPath: '/tmp/S001/user_input_round_1.md',
      sessionDir: '/tmp/S001',
      currentRound: 1,
    });
    assert.equal(result.canContinue, true);
    assert.equal(result.round, 1);
    assert.ok(result.eliminationLog.includes('src/api.js'));
  });

  it('tra ve canContinue=false khi round > 3', () => {
    const result = buildInconclusiveContext({
      evidenceContent: makeEvidence({ outcome: 'inconclusive', body: BODY_INCONCLUSIVE }),
      userInputPath: null,
      sessionDir: '/tmp/S001',
      currentRound: 4,
    });
    assert.equal(result.canContinue, false);
    assert.ok(result.warnings.length > 0);
  });

  it('prompt chua Elimination Log va vong hien tai', () => {
    const result = buildInconclusiveContext({
      evidenceContent: makeEvidence({ outcome: 'inconclusive', body: BODY_INCONCLUSIVE }),
      userInputPath: '/tmp/S001/user_input_round_1.md',
      sessionDir: '/tmp/S001',
      currentRound: 2,
    });
    assert.ok(result.prompt.includes('Vong 2/3'));
    assert.ok(result.prompt.includes('src/api.js'));
    assert.ok(result.prompt.includes('user_input_round_1.md'));
  });

  it('warning khi thieu Elimination Log', () => {
    const result = buildInconclusiveContext({
      evidenceContent: makeEvidence({ outcome: 'inconclusive', body: '## INVESTIGATION INCONCLUSIVE\n\n## Huong dieu tra tiep\nKhong biet.' }),
      userInputPath: null,
      sessionDir: '/tmp/S001',
      currentRound: 1,
    });
    assert.ok(result.warnings.some(w => w.includes('Elimination Log')));
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| INCONCLUSIVE -> pause workflow (Phase 32 stub) | INCONCLUSIVE -> loop-back Buoc 2 (Phase 33) | Phase 33 | User khong can restart tu dau |
| Chi v2.1 orchestrator mode | v2.1 + v1.5 fallback | Phase 33 | Backward compatible khi thieu agent configs |
| Ko co agent detection | Buoc 0 detection truoc Resume UI | Phase 33 | Graceful fallback thay vi crash |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node:test) |
| Config file | Khong co config file rieng — dung package.json script |
| Quick run command | `node --test test/smoke-outcome-router.test.js` |
| Full suite command | `node --test 'test/*.test.js'` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FLOW-06-a | buildInconclusiveContext tra ve prompt voi Elimination Log | unit | `node --test test/smoke-outcome-router.test.js` | Co (can them tests) |
| FLOW-06-b | canContinue=false khi round > MAX_INCONCLUSIVE_ROUNDS | unit | `node --test test/smoke-outcome-router.test.js` | Can them |
| FLOW-06-c | MAX_INCONCLUSIVE_ROUNDS = 3 | unit | `node --test test/smoke-outcome-router.test.js` | Can them |
| FLOW-06-d | Warning khi thieu Elimination Log | unit | `node --test test/smoke-outcome-router.test.js` | Can them |
| FLOW-07-a | fix-bug.md co Buoc 0 detection (integrity) | smoke | `node --test test/smoke-integrity.test.js` | Can them assertion |
| FLOW-07-b | fix-bug.md co --single flag handling | smoke | `node --test test/smoke-integrity.test.js` | Can them assertion |
| FLOW-07-c | Snapshots match sau khi update fix-bug.md | snapshot | `node --test test/smoke-snapshot.test.js` | Co (can regenerate) |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-outcome-router.test.js`
- **Per wave merge:** `node --test 'test/*.test.js'`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Them tests cho `buildInconclusiveContext()` trong `test/smoke-outcome-router.test.js`
- [ ] Them tests cho `MAX_INCONCLUSIVE_ROUNDS` export
- [ ] Regenerate snapshots sau khi sua fix-bug.md: `node test/generate-snapshots.js`
- [ ] Kiem tra va fix cac integrity test failures hien co (backward compat sonnet, effort routing) — co the lien quan den Phase 32 thay doi

## Open Questions

1. **Cach luu inconclusive_rounds trong SESSION.md**
   - What we know: updateSession() ho tro frontmatter updates va appendToBody
   - What's unclear: Nen dung frontmatter field (can sua parseFrontmatter) hay appendToBody string parsing?
   - Recommendation: Dung appendToBody voi format chuan `\n- inconclusive_rounds: {N}` roi grep/parse khi can doc lai. Don gian hon sua frontmatter schema. Hoac them field vao frontmatter object — updateSession() da ho tro bat ky field nao trong frontmatter via parseFrontmatter/assembleMd.

2. **Existing test failures**
   - What we know: smoke-integrity.test.js co 3-5 failures (backward compat sonnet, effort routing) tu khi Phase 32 thay doi fix-bug.md
   - What's unclear: Cac failures nay da duoc track chua? Phase 33 co trach nhiem fix khong?
   - Recommendation: Phase 33 PHAI dam bao toan bo tests pass khi xong (per success criteria #4). Can fix hoac update cac integrity assertions lien quan den fix-bug.md.

## Sources

### Primary (HIGH confidence)
- `/home/please-done/bin/lib/outcome-router.js` — current module structure, pure function pattern
- `/home/please-done/bin/lib/checkpoint-handler.js` — buildContinuationContext() template pattern
- `/home/please-done/bin/lib/evidence-protocol.js` — parseEvidence(), OUTCOME_TYPES.inconclusive
- `/home/please-done/bin/lib/session-manager.js` — updateSession() API
- `/home/please-done/workflows/fix-bug.md` — current INCONCLUSIVE stub (dong 214-220)
- `/home/please-done/workflows/fix-bug-v1.5.md` — v1.5 fallback content (438 dong)
- `/home/please-done/test/smoke-outcome-router.test.js` — existing test patterns
- `/home/please-done/test/smoke-agent-files.test.js` — agent file list va detection pattern

### Secondary (MEDIUM confidence)
- `/home/please-done/.planning/phases/33-resilience-backward-compatibility/33-CONTEXT.md` — user decisions D-01 through D-12

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — tat ca modules da ton tai, chi them function moi
- Architecture: HIGH — pattern truc tiep tu checkpoint-handler.js, da chung minh o Phase 30
- Pitfalls: HIGH — da doc code thuc te, xac dinh duoc 5 pitfall cu the tu codebase analysis

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable — internal codebase, khong phu thuoc external)
