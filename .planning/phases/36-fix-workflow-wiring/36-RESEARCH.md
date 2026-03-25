# Phase 36: Fix Workflow Wiring - Research

**Researched:** 2026-03-25
**Domain:** Workflow markdown wiring bugs (text edits trong fix-bug.md)
**Confidence:** HIGH

## Summary

Phase 36 la gap closure cuoi cung cua v2.1 milestone, fix 2 wiring bugs duoc phat hien trong milestone audit. Scope cuc ky hep: chi sua text trong 1 file (`workflows/fix-bug.md`) tai 2 call sites, sau do regenerate snapshots.

**INT-07 (P1):** Dong 126 gan `validateEvidence(detectiveContent) -> detectiveResult` tra ve `{ valid, outcome, warnings }`, nhung `mergeParallelResults` (parallel-dispatch.js dong 66) expect `{ evidenceContent: string }`. Ket qua: Detective luon appear FAILED vi `detectiveResult.evidenceContent` la `undefined`. Tuong tu cho docSpecResult tai dong 133.

**INT-08 (P2):** Dong 357 destructure `{ hasLogicChange, signals, diagramUpdated, rulesSuggested }` nhung `runLogicSync` tra ve `{ logicResult, reportResult, rulesResult, warnings }`. Ket qua: `diagramUpdated` va `rulesSuggested` luon `undefined`, PDF update va CLAUDE.md rule suggestion KHONG BAO GIO fire.

**Primary recommendation:** Sua 2 doan text trong fix-bug.md, regenerate 4 platform snapshots, verify 763 tests van pass.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Dong 126 gan validateEvidence result cho detectiveResult nhung mergeParallelResults expect { evidenceContent: string }. Detective luon FAILED.
- **D-02:** Fix: Construct { evidenceContent: detectiveContent } khi goi mergeParallelResults, KHONG reuse validateEvidence result. Tuong tu cho docSpecResult.
- **D-03:** Giu validateEvidence call de validate rieng (dong 126), nhung truyen shape dung cho mergeParallelResults (dong 136).
- **D-04:** Dong 357 doc { hasLogicChange, signals, diagramUpdated, rulesSuggested } nhung runLogicSync tra ve { logicResult, reportResult, rulesResult, warnings }.
- **D-05:** Fix: Doi destructuring thanh { logicResult, reportResult, rulesResult, warnings }. Access sub-fields: logicResult.hasLogicChange, reportResult !== null, rulesResult.suggestions.
- **D-06:** Cap nhat conditions: dong 359 doi thanh logicResult?.hasLogicChange && reportResult. Dong 361 doi thanh rulesResult?.suggestions?.length > 0.
- **D-07:** Verify existing tests pass — KHONG them tests moi.
- **D-08:** Regenerate snapshots sau khi fix fix-bug.md.

### Claude's Discretion
- So luong plans va task breakdown
- Commit message style

### Deferred Ideas (OUT OF SCOPE)
None — gap closure phase, scope fixed by milestone audit

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROT-08 | Code Detective va Doc Specialist chay song song, ca 2 doc evidence_janitor.md | INT-07 fix dam bao mergeParallelResults nhan dung shape { evidenceContent } de Detective khong luon appear FAILED |
| FLOW-02 | Buoc 2 spawn Detective va DocSpec doc lap, merge ket qua | INT-07 fix dam bao allSucceeded phan anh dung trang thai khi ca 2 agent thanh cong |
| FLOW-05 | Buoc 5 sua code, chay test, commit, tai su dung logic v1.5 (logic-sync) | INT-08 fix dam bao runLogicSync return duoc destructure dung, PDF update va CLAUDE.md rule suggestion fire khi can |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Dung tieng viet toan bo, co dau chuan

## Architecture Patterns

### Pattern cot loi: Workflow = Markdown, Module = Pure JS

Du an nay co kien truc dac biet: workflow la markdown files (instructions cho AI agents), modules la pure JS functions. Khi co wiring bug:
- **Chi sua workflow (markdown)** — KHONG sua modules
- Modules da tested day du va hoat dong dung
- Bug xay ra vi workflow goi modules voi sai shape/destructuring

### Established Pattern tu Phase 34/35

| Pattern | Mo ta |
|---------|-------|
| Chi sua caller | Modules (parallel-dispatch.js, logic-sync.js) da dung. Chi sua cach workflow goi chung. |
| Snapshot regeneration | Sau khi sua workflow, chay `node test/generate-snapshots.js` de cap nhat 4 platform snapshots |
| Test verification | Chay `npm test` (763 tests) de dam bao khong regression |

### File duoc sua

Chi 1 file: `workflows/fix-bug.md`

### File duoc regenerate

4 platform snapshots (tu dong tu converter):
- `test/snapshots/codex/fix-bug.md`
- `test/snapshots/copilot/fix-bug.md`
- `test/snapshots/gemini/fix-bug.md`
- `test/snapshots/opencode/fix-bug.md`

## Code Examples

### INT-07: Fix detectiveResult shape mismatch (dong 125-138)

**Hien tai (SAI):**
```markdown
3. Read `{session_dir}/evidence_code.md` -> detectiveContent
   - Goi `validateEvidence(detectiveContent)` tu `bin/lib/evidence-protocol.js` -> detectiveResult

...

5. Read `{session_dir}/evidence_docs.md` -> docSpecContent (co the khong ton tai)
   - Neu file ton tai: validateEvidence(docSpecContent) -> docSpecResult
   - Neu file KHONG ton tai hoac invalid: docSpecResult = null

6. Goi `mergeParallelResults({ detectiveResult, docSpecResult })` tu `bin/lib/parallel-dispatch.js`
```

**Van de:** `detectiveResult` = `validateEvidence()` output = `{ valid, outcome, warnings }`. Nhung `mergeParallelResults` check `detectiveResult?.evidenceContent` — luon `undefined` -> Detective FAILED.

**Sau khi fix (DUNG):**
```markdown
3. Read `{session_dir}/evidence_code.md` -> detectiveContent
   - Goi `validateEvidence(detectiveContent)` tu `bin/lib/evidence-protocol.js` -> detectiveValidation
   - Construct detectiveResult: { evidenceContent: detectiveContent }

...

5. Read `{session_dir}/evidence_docs.md` -> docSpecContent (co the khong ton tai)
   - Neu file ton tai: validateEvidence(docSpecContent) -> docSpecValidation
   - Construct docSpecResult: { evidenceContent: docSpecContent }
   - Neu file KHONG ton tai hoac invalid: docSpecResult = null

6. Goi `mergeParallelResults({ detectiveResult, docSpecResult })` tu `bin/lib/parallel-dispatch.js`
```

**Key:** Rename validateEvidence output thanh `detectiveValidation`/`docSpecValidation` (giu validation rieng), construct `{ evidenceContent }` objects moi cho mergeParallelResults.

### INT-08: Fix runLogicSync destructuring (dong 356-361)

**Hien tai (SAI):**
```markdown
6. Try: goi `runLogicSync(...)` tu `bin/lib/logic-sync.js`
   -> { hasLogicChange, signals, diagramUpdated, rulesSuggested }
   Catch: WARNING: "Logic sync loi: {error.message}". KHONG block.
7. hasLogicChange = true va diagramUpdated -> hoi: "Cap nhat lai PDF? (Y/n)"
   Y -> `node bin/generate-pdf-report.js {reportPath}`
8. rulesSuggested co noi dung -> hien va hoi: "Them vao CLAUDE.md? (Y/n)"
```

**Sau khi fix (DUNG):**
```markdown
6. Try: goi `runLogicSync(...)` tu `bin/lib/logic-sync.js`
   -> { logicResult, reportResult, rulesResult, warnings }
   Catch: WARNING: "Logic sync loi: {error.message}". KHONG block.
7. logicResult?.hasLogicChange = true va reportResult !== null -> hoi: "Cap nhat lai PDF? (Y/n)"
   Y -> `node bin/generate-pdf-report.js {reportPath}`
8. rulesResult?.suggestions?.length > 0 -> hien rulesResult.suggestions va hoi: "Them vao CLAUDE.md? (Y/n)"
```

## Module Reference (KHONG sua — chi tham khao)

### mergeParallelResults (parallel-dispatch.js dong 66)

```javascript
// Input shape:
function mergeParallelResults({ detectiveResult, docSpecResult })
// detectiveResult: { evidenceContent: string } hoac { error: { message } }
// docSpecResult: { evidenceContent: string } hoac { error: { message } } hoac null

// Check: detectiveResult?.evidenceContent (dong 71)
// Neu undefined -> push warning "Code Detective that bai" -> valid: false
```

**Confidence:** HIGH — doc truc tiep tu source code tai `/home/please-done/bin/lib/parallel-dispatch.js` dong 62-81

### runLogicSync (logic-sync.js dong 220-249)

```javascript
// Return shape:
function runLogicSync(params) {
  return { logicResult, reportResult, rulesResult, warnings };
}
// logicResult: { hasLogicChange, signals, summary } hoac null
// reportResult: { updatedContent, diagramResult } hoac null (chi khi hasLogicChange=true)
// rulesResult: { suggestions: string[], reasoning: string }
// warnings: string[]
```

**Confidence:** HIGH — doc truc tiep tu source code tai `/home/please-done/bin/lib/logic-sync.js` dong 220-249

## Common Pitfalls

### Pitfall 1: Sua qua rong — thay doi ca module

**What goes wrong:** Thay vi chi sua workflow, dev co the muon sua module de "phu hop" voi workflow cu
**Why it happens:** Trong khi doc code, de thay module la noi "sai" va muon fix o do
**How to avoid:** Modules da tested day du (4 tests parallel-dispatch, 15+ tests logic-sync). Chi sua caller (workflow).
**Warning signs:** Bat ky thay doi nao trong `bin/lib/*.js`

### Pitfall 2: Khong regenerate snapshots

**What goes wrong:** Tests fail vi snapshots van chua noi dung cu cua fix-bug.md
**Why it happens:** Quen chay `node test/generate-snapshots.js` sau khi sua workflow
**How to avoid:** Luon regenerate snapshots ngay sau khi sua fix-bug.md, truoc khi chay tests
**Warning signs:** smoke-snapshot.test.js fail

### Pitfall 3: Lam mat validateEvidence call

**What goes wrong:** Xoa validateEvidence call hoan toan thay vi rename variable
**Why it happens:** Nham tuong validateEvidence khong can thiet nua
**How to avoid:** D-03 noi ro: GIU validateEvidence call de validate rieng, chi rename output variable
**Warning signs:** Khong con validateEvidence call tai dong 126

### Pitfall 4: Optional chaining thieu nhat quan

**What goes wrong:** Khong dung `?.` cho logicResult, rulesResult — co the null khi detectLogicChanges throw
**Why it happens:** Quen rang runLogicSync co try/catch noi bo, logicResult co the null
**How to avoid:** D-06 chi dinh cu the: `logicResult?.hasLogicChange`, `rulesResult?.suggestions?.length > 0`
**Warning signs:** Dieu kien khong co `?.`

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Snapshot regeneration | Manual edit snapshots | `node test/generate-snapshots.js` | 4 platforms x 12 skills = 48 files, tu dong tu converter pipeline |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in, Node.js 18+) |
| Config file | Khong can — npm test script da cau hinh |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROT-08 | mergeParallelResults nhan { evidenceContent } shape | unit (existing) | `node --test test/smoke-parallel-dispatch.test.js` | co |
| FLOW-02 | allSucceeded = true khi ca 2 agent OK | unit (existing) | `node --test test/smoke-parallel-dispatch.test.js` | co |
| FLOW-05 | runLogicSync return { logicResult, reportResult, rulesResult } | unit (existing) | `node --test test/smoke-logic-sync.test.js` | co |
| D-08 | Snapshots nhat quan sau fix | snapshot | `node --test test/smoke-snapshot.test.js` | co |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite 763 tests green

### Wave 0 Gaps
None — test infrastructure day du, khong can them tests moi (per D-07).

## Standard Stack

Khong co dependencies moi. Du an chi su dung:
- Node.js built-in `node:test` cho testing
- Pure JS modules khong co external deps
- Markdown workflows

## Open Questions

Khong co. Scope da duoc xac dinh chinh xac boi milestone audit va CONTEXT.md. Ca 2 bugs da co fix direction cu the.

## Sources

### Primary (HIGH confidence)
- `/home/please-done/bin/lib/parallel-dispatch.js` dong 62-81 — mergeParallelResults function signature va logic
- `/home/please-done/bin/lib/logic-sync.js` dong 218-249 — runLogicSync return shape
- `/home/please-done/workflows/fix-bug.md` dong 125-139, 355-361 — hien tai (buggy) call sites
- `/home/please-done/test/smoke-parallel-dispatch.test.js` — 4 test cases cho mergeParallelResults
- `/home/please-done/test/smoke-logic-sync.test.js` — 15 test cases cho logic-sync module
- `/home/please-done/.planning/v2.1-MILESTONE-AUDIT.md` — INT-07, INT-08 descriptions

### Secondary (MEDIUM confidence)
Khong can — tat ca thong tin tu source code truc tiep.

### Tertiary (LOW confidence)
Khong co.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — khong co deps moi, du an da co san
- Architecture: HIGH — pattern da established tu Phase 34/35
- Pitfalls: HIGH — bugs da duoc audit ky, fix direction cu the

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable — chi text edits, khong phu thuoc external)
