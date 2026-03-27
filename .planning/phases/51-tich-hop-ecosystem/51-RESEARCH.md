# Phase 51: Tich hop Ecosystem - Research

**Researched:** 2026-03-27
**Domain:** Workflow markdown editing + snapshot sync + smoke testing
**Confidence:** HIGH

## Summary

Phase 51 wire 3 diem ket noi pipeline security audit vao ecosystem hien tai: (1) security gate non-blocking trong complete-milestone Buoc 2, (2) uu tien 7.5 trong what-next Buoc 4, (3) nhanh phu pd:audit trong state-machine. Tat ca deu la chinh sua file markdown, khong co logic code moi.

Cong viec chinh la chinh sua 3 file goc (workflows + references), dong bo sang 4 snapshot folders (codex/copilot/gemini/opencode), va tao test suite kiem tra noi dung. Pattern da co san ro rang tu cac file hien tai.

**Primary recommendation:** Chinh sua truc tiep vao dung line numbers da xac dinh, regenerate snapshots bang `node test/generate-snapshots.js`, tao smoke test moi theo pattern `node:test` + `node:assert/strict`.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Security gate NON-BLOCKING. Khi chua co SECURITY_REPORT.md trong milestone dir, complete-milestone canh bao ro rang nhung cho phep bypass. Khong chan hoan toan
- **D-02:** Gate bypass = 2 lua chon: (1) Chay pd:audit ngay (2) Bo qua, tiep tuc complete-milestone. Khong can ghi ly do bypass
- **D-03:** Goi y pd:audit o uu tien 7.5 CHI KHI tat ca phases done + chua co SECURITY_REPORT.md trong milestone dir. Dieu kien: glob `.planning/milestones/[version]/SECURITY_REPORT.md` khong ton tai. Message: "Chua kiem toan bao mat. Chay `/pd:audit` truoc khi dong milestone."
- **D-04:** pd:audit la NHANH PHU -- giong fix-bug/what-next, chay bat ky luc nao sau init. Khong thay doi luong chinh. Gate trong complete-milestone la enforcement duy nhat
- **D-05:** Cap nhat 3 files chinh + 4 snapshot folders
- **D-06:** Tao test suite rieng `test/smoke-security-wire.test.js`

### Claude's Discretion
- Format chinh xac cua canh bao security gate trong complete-milestone
- Vi tri chen uu tien 7.5 trong bang uu tien what-next
- Cach mo ta pd:audit trong nhanh phu state machine
- Snapshot sync strategy (copy nguyen hay chi sections lien quan)

### Deferred Ideas (OUT OF SCOPE)
- CI/CD integration
- Configurable gate mode (blocking/non-blocking)
- Auto-run pd:audit khi gan complete-milestone

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WIRE-01 | Security gate trong complete-milestone: chua co SECURITY_REPORT -> canh bao non-blocking | Insertion point: line 53-54 (sau Cross-check ROADMAP, truoc Buoc 3). Pattern: tuong tu TEST_REPORT check |
| WIRE-02 | Uu tien 7.5 trong what-next: goi y pd:audit truoc complete-milestone | Insertion point: line 53-54 (giua row 7 va row 8 trong bang uu tien Buoc 4) |
| WIRE-03 | State machine update: them pd:audit vao luong trang thai | Insertion point: line 24 (sau `/pd:update` trong danh sach nhanh phu) |

</phase_requirements>

## Architecture Patterns

### WIRE-01: Security Gate trong complete-milestone.md

**File:** `workflows/complete-milestone.md`
**Vi tri chen:** SAU dong 53 (Cross-check ROADMAP), TRUOC dong 55 (Buoc 3: Kiem tra bugs)

Hien tai Buoc 2 co cau truc:
```
Line 35: ## Buoc 2: Kiem tra trang thai
Line 36-40: Quet tasks, TEST_REPORT, CODE_REPORT
Line 41: Cross-check CODE_REPORT
Line 44-51: Kiem tra tasks, TEST_REPORT chi tiet
Line 53: Cross-check ROADMAP
Line 55: ## Buoc 3: Kiem tra bugs
```

**Chen them section "Kiem tra bao mat" giua line 53 va 55.** Noi dung moi:

```markdown
**Kiem tra bao mat** (non-blocking): glob `.planning/milestones/[version]/SECURITY_REPORT.md`
- Ton tai → tiep tuc
- KHONG ton tai → canh bao: "Chua kiem toan bao mat milestone nay."
  - (1) Chay `/pd:audit` ngay
  - (2) Bo qua, tiep tuc complete-milestone
  - User chon (2) → ghi chu vao MILESTONE_COMPLETE.md: "Bao mat: chua kiem toan"
```

**Pattern tham khao:** TEST_REPORT check o line 45-50 -- tuong tu format canh bao + lua chon numbered.

### WIRE-02: Uu tien 7.5 trong what-next.md

**File:** `workflows/what-next.md`
**Vi tri chen:** Giua line 53 (row 7) va line 54 (row 8) trong bang uu tien Buoc 4.

Bang uu tien hien tai:
```
Line 43: | Uu tien | Dieu kien | Goi y |
Line 44: |---------|-----------|-------|
Line 45: | 1 | Bugs dang mo | `/pd:fix-bug` |
...
Line 53: | 7 | Phase hoan tat, con phases tiep | `/pd:plan [y.y]` |
Line 54: | 8 | Tat ca phases hoan tat | `/pd:complete-milestone` |
```

**Chen them row moi SAU line 53:**
```markdown
| 7.5 | Tat ca phases ✅ + chua co SECURITY_REPORT.md | "Chua kiem toan bao mat. Chay `/pd:audit` truoc khi dong milestone." |
```

**Dieu kien kich hoat:** Tat ca phases done (cung dieu kien nhu uu tien 8) + glob `.planning/milestones/[version]/SECURITY_REPORT.md` khong ton tai.

### WIRE-03: Nhanh phu pd:audit trong state-machine.md

**File:** `references/state-machine.md`
**Vi tri chen:** Them 1 bullet vao danh sach nhanh phu tai line 24 (sau `/pd:update`).

Hien tai:
```
Line 20: **Nhanh phu** (bat ky luc nao sau init):
Line 21: - `/pd:fix-bug` → dieu tra + sua loi
Line 22: - `/pd:what-next` → kiem tra tien trinh
Line 23: - `/pd:fetch-doc` → cache tai lieu
Line 24: - `/pd:update` → cap nhat skills
```

**Them dong 25:**
```markdown
- `/pd:audit` → kiem toan bao mat milestone
```

**Them row vao bang dieu kien tien quyet** (sau line 54):
```markdown
| `/pd:audit` | CONTEXT.md | "Chay `/pd:init` truoc" |
```

## Snapshot Sync Strategy

### Files can dong bo

Tat ca 4 snapshot folders (codex/copilot/gemini/opencode) deu co:
- `complete-milestone.md` -- can sync security gate
- `what-next.md` -- can sync uu tien 7.5

**QUAN TRONG:** Snapshots duoc GENERATE tu converters, KHONG copy truc tiep. Quy trinh:

1. Sua 3 file goc (workflows/complete-milestone.md, workflows/what-next.md, references/state-machine.md)
2. Chay `node test/generate-snapshots.js` de regenerate TAT CA snapshots
3. Snapshots se tu dong cap nhat vi converters doc tu source files

**Ngoai le:** `references/state-machine.md` KHONG co trong snapshots (chi co trong `references/` truc tiep). Kiem tra da xac nhan: snapshots chi chua files tu `commands/pd/` (sau khi convert).

**Luu y ve snapshot test:** `test/smoke-snapshot.test.js` so sanh output cua converters voi snapshots. Sau khi sua source + regenerate, test phai PASS vi snapshots da duoc cap nhat.

### Snapshot folders inventory

| Folder | complete-milestone.md | what-next.md | state-machine.md |
|--------|----------------------|--------------|------------------|
| codex | CO | CO | KHONG (reference, khong phai skill) |
| copilot | CO | CO | KHONG |
| gemini | CO | CO | KHONG |
| opencode | CO | CO | KHONG |

**Ket luan:** Snapshots la converter output tu commands/pd/*.md, KHONG phai tu workflows/ hay references/. Khi sua workflows/complete-milestone.md va workflows/what-next.md, converters se inline workflow content vao skill output → snapshots thay doi.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Snapshot generation | Copy thu cong tung file | `node test/generate-snapshots.js` | 4 platforms x N skills = sai sot khi copy thu cong |
| Markdown table formatting | Viet table bang tay khong kiem tra | Copy exact format tu rows ke ben | Bang phai align dung columns |

## Common Pitfalls

### Pitfall 1: Snapshot khong dong bo
**What goes wrong:** Sua workflow nhung quen regenerate snapshots → smoke-snapshot.test.js FAIL
**Why it happens:** Snapshots khong tu cap nhat, can chay generate-snapshots.js
**How to avoid:** Luon chay `node test/generate-snapshots.js` SAU khi sua bat ky workflow nao
**Warning signs:** `smoke-snapshot.test.js` fail voi message "output changed from snapshot"

### Pitfall 2: Chen sai vi tri trong bang uu tien
**What goes wrong:** Row 7.5 bi chen ngoai table markdown → render sai
**Why it happens:** Bang markdown can dung format `| col1 | col2 | col3 |`
**How to avoid:** Copy chinh xac format cua row 7 hoac row 8, thay noi dung
**Warning signs:** Markdown render khong hien thi row moi trong table

### Pitfall 3: Security gate blocking thay vi non-blocking
**What goes wrong:** Gate chan complete-milestone thay vi chi canh bao
**Why it happens:** Dung tu "CHAN" thay vi "canh bao" trong workflow text
**How to avoid:** D-01 chi ro: NON-BLOCKING. Dung pattern "(1) Chay audit (2) Bo qua" giong TEST_REPORT check
**Warning signs:** Workflow text dung `**CHAN**` thay vi `canh bao`

### Pitfall 4: Quen cap nhat dieu kien tien quyet trong state-machine
**What goes wrong:** Them nhanh phu nhung khong them row vao bang dieu kien
**Why it happens:** Bang dieu kien o phan khac cua file
**How to avoid:** Cap nhat CA HAI: danh sach nhanh phu (line 20-24) VA bang dieu kien (line 42-54)

## Test Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in Node.js test runner) |
| Config file | Khong co config rieng -- dung built-in |
| Quick run command | `node --test test/smoke-security-wire.test.js` |
| Full suite command | `node --test test/smoke-*.test.js` |

### Test Pattern (tu smoke-security-rules.test.js va smoke-agent-files.test.js)

```javascript
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const ROOT = join(__dirname, '..');

describe('Security wire integration', () => {
  // Doc file 1 lan, dung trong nhieu tests
  const completeMilestone = readFileSync(join(ROOT, 'workflows', 'complete-milestone.md'), 'utf8');
  const whatNext = readFileSync(join(ROOT, 'workflows', 'what-next.md'), 'utf8');
  const stateMachine = readFileSync(join(ROOT, 'references', 'state-machine.md'), 'utf8');

  it('WIRE-01: complete-milestone co security gate check', () => {
    assert.ok(completeMilestone.includes('SECURITY_REPORT'), 'Thieu SECURITY_REPORT check');
    assert.ok(completeMilestone.includes('pd:audit'), 'Thieu goi y pd:audit');
    // Verify non-blocking
    assert.ok(!completeMilestone.match(/SECURITY_REPORT[\s\S]*?\*\*CHAN\*\*/),
      'Security gate phai non-blocking');
  });

  it('WIRE-02: what-next co uu tien 7.5', () => {
    assert.ok(whatNext.includes('7.5'), 'Thieu uu tien 7.5');
    assert.ok(whatNext.includes('pd:audit'), 'Thieu goi y pd:audit');
    assert.ok(whatNext.includes('SECURITY_REPORT'), 'Thieu dieu kien SECURITY_REPORT');
  });

  it('WIRE-03: state-machine co pd:audit nhanh phu', () => {
    assert.ok(stateMachine.includes('pd:audit'), 'Thieu pd:audit trong state machine');
    // Verify nam trong section nhanh phu
    const nhanhPhuIdx = stateMachine.indexOf('Nhanh phu');
    const auditIdx = stateMachine.indexOf('pd:audit');
    assert.ok(nhanhPhuIdx < auditIdx, 'pd:audit phai nam sau "Nhanh phu"');
  });

  // Snapshot sync tests
  const PLATFORMS = ['codex', 'copilot', 'gemini', 'opencode'];

  it('Snapshots complete-milestone dong bo', () => {
    for (const platform of PLATFORMS) {
      const snap = readFileSync(
        join(ROOT, 'test', 'snapshots', platform, 'complete-milestone.md'), 'utf8'
      );
      assert.ok(snap.includes('SECURITY_REPORT'),
        `${platform}/complete-milestone.md thieu SECURITY_REPORT`);
    }
  });

  it('Snapshots what-next dong bo', () => {
    for (const platform of PLATFORMS) {
      const snap = readFileSync(
        join(ROOT, 'test', 'snapshots', platform, 'what-next.md'), 'utf8'
      );
      assert.ok(snap.includes('7.5'),
        `${platform}/what-next.md thieu uu tien 7.5`);
    }
  });
});
```

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WIRE-01 | complete-milestone co security gate non-blocking | content check | `node --test test/smoke-security-wire.test.js` | Wave 0 |
| WIRE-02 | what-next co uu tien 7.5 | content check | `node --test test/smoke-security-wire.test.js` | Wave 0 |
| WIRE-03 | state-machine co pd:audit nhanh phu | content check | `node --test test/smoke-security-wire.test.js` | Wave 0 |
| D-05 | 4 snapshot folders dong bo | content check | `node --test test/smoke-security-wire.test.js` | Wave 0 |

### Wave 0 Gaps
- [ ] `test/smoke-security-wire.test.js` -- covers WIRE-01, WIRE-02, WIRE-03, snapshot sync

## Code Examples

### Exact insertion content for WIRE-01 (complete-milestone.md)

Chen SAU line 53 (Cross-check ROADMAP), TRUOC `## Buoc 3`:

```markdown

**Kiem tra bao mat** (non-blocking): glob `.planning/milestones/[version]/SECURITY_REPORT.md`
- Ton tai → tiep tuc
- KHONG ton tai → canh bao: "Chua kiem toan bao mat milestone nay."
  - (1) Chay `/pd:audit` ngay → sau khi xong, quay lai complete-milestone
  - (2) Bo qua, tiep tuc
  - User chon (2) → ghi MILESTONE_COMPLETE.md: "Bao mat: chua kiem toan"

```

### Exact insertion content for WIRE-02 (what-next.md)

Chen SAU line 53 (row uu tien 7):

```markdown
| 7.5 | Tat ca phases ✅ + chua co `SECURITY_REPORT.md` | `/pd:audit` — "Chua kiem toan bao mat. Chay `/pd:audit` truoc khi dong milestone." |
```

### Exact insertion content for WIRE-03 (state-machine.md)

Chen SAU line 24 (dong `/pd:update`):

```markdown
- `/pd:audit` → kiem toan bao mat milestone
```

Them row vao bang dieu kien tien quyet (SAU dong `/pd:update` trong bang):

```markdown
| `/pd:audit` | CONTEXT.md | "Chay `/pd:init` truoc" |
```

## Validation Architecture

### Sampling Rate
- **Per task commit:** `node --test test/smoke-security-wire.test.js`
- **Per wave merge:** `node --test test/smoke-*.test.js`
- **Phase gate:** Full suite green truoc verify

## Sources

### Primary (HIGH confidence)
- Doc truc tiep `workflows/complete-milestone.md` -- xac dinh chinh xac line numbers
- Doc truc tiep `workflows/what-next.md` -- xac dinh bang uu tien va line numbers
- Doc truc tiep `references/state-machine.md` -- xac dinh nhanh phu va bang dieu kien
- Doc truc tiep `test/smoke-snapshot.test.js` -- hieu snapshot generation pattern
- Doc truc tiep `test/smoke-security-rules.test.js` -- hieu smoke test pattern
- Doc truc tiep `test/smoke-agent-files.test.js` -- hieu integration test pattern
- Verified all 4 snapshot folders co complete-milestone.md va what-next.md

### Secondary (MEDIUM confidence)
- `51-CONTEXT.md` -- decisions va canonical refs

## Metadata

**Confidence breakdown:**
- Insertion points: HIGH -- doc truc tiep files, xac dinh chinh xac line numbers
- Test pattern: HIGH -- doc nhieu test files hien tai, pattern nhat quan
- Snapshot sync: HIGH -- verified generate-snapshots.js va snapshot test flow
- Content format: HIGH -- follow patterns tu existing checks trong cung files

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable -- markdown files thay doi cham)
