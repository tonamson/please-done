# Phase 19: Knowledge Correction - Research

**Researched:** 2026-03-24
**Domain:** Workflow markdown authoring (fix-bug.md, write-code.md, templates/progress.md)
**Confidence:** HIGH

## Summary

Phase 19 implements two requirements: CORR-01 (Buoc 6.5 "Logic Update" in fix-bug workflow) and CORR-02 ("Logic Changes" section in progress template). This is a pure markdown/template editing phase -- no JavaScript code, no plan-checker changes, no tests to write. The entire scope involves surgical edits to 3 markdown files: `workflows/fix-bug.md`, `workflows/write-code.md`, and `templates/progress.md`.

The fix-bug workflow already has a clear insertion point between Buoc 6c (Cong kiem tra) and Buoc 7 (Bao cao loi). The Buoc 6.5 "Logic Update" step must detect logic bugs, get user confirmation, update PLAN.md Truths table, commit separately with [LOI] prefix, then continue to Buoc 7. For CORR-02, PROGRESS.md template needs a conditional "Logic Changes" section, and both write-code and fix-bug workflows need instructions to populate it when logic changes occur.

**Primary recommendation:** Three surgical edits to existing markdown files, following established patterns (numbered step convention, confirmation prompt pattern from Buoc 1.7, [LOI] commit prefix). No new files to create.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** AI tu phan loai sau Buoc 6b -- neu nguyen nhan lien quan den Truth/business logic -> trigger Buoc 6.5. Bug code don thuan (typo, off-by-one, import thieu) -> skip 6.5.
- **D-02:** Khi AI phan loai la logic bug, thong bao + hoi user confirm truoc khi sua Truth: "Bug nay do Truth [TX] sai -> can sua PLAN.md. Dong y?"
- **D-03:** Neu user bac phan loai ("khong phai logic bug"), skip Buoc 6.5, tiep tuc Buoc 7. Ghi note vao SESSION: "User bac phan loai logic bug".
- **D-04:** Chi sua cot lien quan trong bang Truths 5 cot -- AI tu danh gia cot nao can thay doi dua tren nguyen nhan bug (co the la Su that, Truong hop bien, Cach kiem chung, hoac nhieu cot).
- **D-05:** Chi sua Truth hien co, KHONG them Truth moi. Logic thieu hoan toan = scope lon hon, ghi Deferred.
- **D-06:** Gia tri cu (before) duoc ghi trong BUG_*.md (phan "Phan tich nguyen nhan"). PLAN.md chi chua gia tri moi.
- **D-07:** Buoc 6.5 nam sau 6c (Cong kiem tra dat), truoc 7 (Bao cao). Luc nay da xac dinh nguyen nhan + du bang chung. Sua Truth TRUOC khi sua code.
- **D-08:** Commit rieng cho PLAN.md thay doi voi prefix [LOI]. Tach biet ro: sua tai lieu logic truoc, sua code sau.
- **D-09:** Khong tim thay PLAN.md -> skip Buoc 6.5, ghi vao BUG report: "Khong co PLAN.md de cap nhat Truth". Tiep tuc sua code.
- **D-10:** Chi sua PLAN.md (bang Truths), KHONG sua TASKS.md. Task van cung Truth ID, chi noi dung Truth thay doi.
- **D-11:** Ap dung ca write-code va fix-bug workflow -- ghi lai logic changes bat cu khi nao phat sinh.
- **D-12:** Format bang: `| Truth ID | Thay doi | Ly do |`. Gon, trung voi Truths format dang dung, de trace.
- **D-13:** Xoa cung PROGRESS.md sau commit thanh cong. BUG report va git diff da luu lai lich su.
- **D-14:** Khong co logic change -> khong tao section "Logic Changes" trong PROGRESS.md. Giu template gon.

### Claude's Discretion
- Wording chinh xac cua prompt Buoc 6.5 trong fix-bug.md
- Logic phan loai chi tiet (keywords, heuristics) de xac dinh bug do logic sai
- Format cau hoi confirm "Bug nay do Truth [TX] sai" (plain text hay AskUserQuestion)
- Cach tim PLAN.md lien quan (grep strategy, phase matching)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CORR-01 | fix-bug workflow co Buoc 6.5 "Logic Update" -- neu bug do logic sai, sua PLAN.md (cap nhat Truth) truoc khi sua code | Insertion point identified at line 190 (after 6c, before Buoc 7). All 10 decisions (D-01 to D-10) map to this step. Reuses existing patterns: [LOI] commit prefix, confirmation prompt pattern, PLAN.md grep from Buoc 3. |
| CORR-02 | progress template co muc "Logic Changes" ghi lai cac thay doi nghiep vu phat sinh trong qua trinh lam | Template edit to progress.md + instruction additions to both write-code.md and fix-bug.md. Decisions D-11 to D-14 define scope. Follows PROGRESS.md lifecycle (create -> update -> delete after commit). |
</phase_requirements>

## Standard Stack

Not applicable -- this phase involves only markdown template and workflow file edits. No libraries, no JavaScript, no build tools.

## Architecture Patterns

### Files to Modify

```
workflows/
  fix-bug.md        # Add Buoc 6.5 between 6c and 7
  write-code.md     # Add Logic Changes instructions to PROGRESS.md flow
templates/
  progress.md       # Add conditional "Logic Changes" section to template
```

### Pattern 1: Workflow Step Numbering Convention

**What:** Workflow steps use `## Buoc X.Y` format with sub-steps as `### Xa.`, `### Xb.`, etc.
**When to use:** Always when adding new steps to existing workflows.
**Evidence:** Buoc 1.7 was added in Phase 18 following this exact convention. Buoc 6.5 follows the same pattern -- between 6c and 7.

### Pattern 2: User Confirmation Prompt

**What:** When AI needs user confirmation before proceeding, use plain-text prompt with `(Y/n)` suffix and handle both accept/reject paths.
**Established in:** write-code.md Buoc 1.7 ("Logic dung chua? (Y/n)"), write-code.md Buoc 1.5 ("Xac nhan chay? (Y/n)")
**Apply to:** Buoc 6.5 confirmation ("Bug nay do Truth [TX] sai -> can sua PLAN.md. Dong y?")

### Pattern 3: Conditional Sections in Templates

**What:** Template sections that only appear when relevant data exists. No empty scaffolding.
**Established in:** progress.md is already minimal. CODE_REPORT uses "(CHI tao sections co du lieu -- bo sections khong lien quan)" pattern.
**Apply to:** "Logic Changes" section in PROGRESS.md -- only create when logic changes actually occur (D-14).

### Pattern 4: PLAN.md Grep Strategy (Reusable)

**What:** fix-bug.md Buoc 3 already has logic to grep PLAN.md from `.planning/milestones/[version-goc]/phase-*/PLAN.md`. The exact same strategy can be reused for Buoc 6.5 to find the correct PLAN.md to update.
**Code reference:** fix-bug.md line 76-78:
```
1. Grep chuc nang loi trong `.planning/milestones/[version-goc]/phase-*/PLAN.md`
2. CHI doc PLAN.md + CODE_REPORT cua phase(s) lien quan
3. Grep khong khop -> mo rong tim tat ca PLAN.md
```

### Anti-Patterns to Avoid
- **Creating new files:** This phase MUST NOT create new workflow files or templates. Only edit existing ones.
- **Modifying TASKS.md format:** D-10 explicitly forbids TASKS.md changes. Truth ID stays the same, only Truth content changes.
- **Adding new Truths:** D-05 explicitly restricts to editing existing Truths only. Missing logic entirely = Deferred.
- **Editing plan-checker.js:** No code changes needed. Plan-checker already handles 5-column Truths from Phase 17.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Finding related PLAN.md | New grep logic | Reuse Buoc 3 pattern from fix-bug.md | Already proven, same file paths |
| User confirmation flow | Custom prompt format | Reuse (Y/n) pattern from Buoc 1.7 | Consistency, already documented |
| Commit prefix | New convention | [LOI] prefix already in fix-bug.md | D-08 explicitly requires [LOI] |
| Truth change tracking | New tracking system | BUG_*.md "Phan tich nguyen nhan" + git diff | D-06 says old values go in BUG report |

## Common Pitfalls

### Pitfall 1: Incorrect Insertion Point in fix-bug.md

**What goes wrong:** Placing Buoc 6.5 in wrong position disrupts the investigation->fix->report flow.
**Why it happens:** fix-bug.md has complex flow with 6a, 6b, 6c substeps.
**How to avoid:** Buoc 6.5 MUST go after 6c ("Cong kiem tra truoc khi sua") and before Buoc 7 ("Viet bao cao loi"). At this point: (1) root cause is identified, (2) evidence is sufficient, (3) plan to fix is ready. Line 190 in current file: "Thieu dieu kien -> quay Buoc 5b/5c. Du -> Buoc 7." must become "Du -> Buoc 6.5 (neu logic bug) hoac Buoc 7."
**Warning signs:** If Buoc 6.5 appears before 6c, Truth changes happen without sufficient evidence.

### Pitfall 2: fix-bug Workflow Has No PROGRESS.md

**What goes wrong:** Trying to add "Logic Changes" to PROGRESS.md in fix-bug workflow when fix-bug doesn't use PROGRESS.md at all.
**Why it happens:** PROGRESS.md is a write-code concept only. fix-bug uses SESSION_*.md and BUG_*.md.
**How to avoid:** For CORR-02 in fix-bug context: logic changes are recorded in BUG_*.md "Phan tich nguyen nhan" section (old values, D-06) and the PLAN.md commit diff (new values). The "Logic Changes" table format from D-12 should be added to BUG_*.md report template section, NOT to a non-existent PROGRESS.md.
**Warning signs:** Grep "PROGRESS" in fix-bug.md returns zero results (confirmed).

### Pitfall 3: Scope Creep into Code Changes

**What goes wrong:** Attempting to modify plan-checker.js, converter files, or test snapshots.
**Why it happens:** Phase 17 modified plan-checker heavily, creating false expectation that Truth-related phases need code changes.
**How to avoid:** Phase 19 is STRICTLY markdown workflow/template edits. The plan-checker already handles 5-column Truths. No JavaScript changes needed.
**Warning signs:** If plan mentions .js files, it's out of scope.

### Pitfall 4: Forgetting Both Workflows Need CORR-02

**What goes wrong:** Only adding Logic Changes tracking to fix-bug but not write-code, or vice versa.
**Why it happens:** CORR-02 seems like a fix-bug concern, but D-11 explicitly says "Ap dung ca write-code va fix-bug workflow".
**How to avoid:** Must add Logic Changes instructions to BOTH workflows. write-code already has PROGRESS.md create/update flow -- extend it. fix-bug needs Logic Changes in BUG_*.md report.
**Warning signs:** D-11 mentions both workflows explicitly.

### Pitfall 5: Breaking Existing Step References

**What goes wrong:** Adding Buoc 6.5 may break internal references in fix-bug.md that say "-> Buoc 7" or "-> Buoc 6c".
**Why it happens:** fix-bug.md has multiple places referencing step numbers for flow control.
**How to avoid:** Grep all "Buoc 7" and "Buoc 6c" references. Update flow references where 6c currently points to 7 -- it should now point to "6.5 (neu logic bug) hoac 7". Specifically line 190: "Du -> Buoc 7" needs update.
**Warning signs:** Grep `Bước 7` and `Bước 6c` in fix-bug.md to find all references.

## Code Examples

### Example 1: Buoc 6.5 Logic Update (for fix-bug.md)

Based on CONTEXT.md D-01 through D-10 and established workflow patterns:

```markdown
## Buoc 6.5: Logic Update -- cap nhat Truth khi bug do logic sai

**Phan loai:** Nguyen nhan bug (tu Buoc 6b) lien quan den business logic / Truth trong PLAN.md?
- Typo, off-by-one, import thieu, loi cu phap → KHONG phai logic bug → **skip 6.5, toi Buoc 7**
- Logic tinh toan sai, dieu kien nghiep vu sai, edge case thieu, gia tri nguong sai → **logic bug → tiep tuc 6.5**

### 6.5a. Tim PLAN.md lien quan
Dung cung strategy Buoc 3: Grep `.planning/milestones/[version-goc]/phase-*/PLAN.md` → tim bang Truths 5 cot.
Khong tim thay PLAN.md → ghi vao BUG report: "Khong co PLAN.md de cap nhat Truth". Skip 6.5, toi Buoc 7.

### 6.5b. Xac dinh Truth can sua
- CHI sua Truth hien co, KHONG them Truth moi
- CHI sua cot lien quan (Su that, Truong hop bien, Cach kiem chung — hoac nhieu cot)
- Logic thieu hoan toan → ghi Deferred, KHONG them Truth moi

### 6.5c. Xac nhan voi user

Bug nay do Truth sai — can cap nhat PLAN.md:

| Truth | Hien tai | Sua thanh |
|-------|---------|-----------|
| T[x] | [gia tri cu] | [gia tri moi] |

Dong y sua PLAN.md? (Y/n)

- User dong y → 6.5d
- User bac ("khong phai logic bug") → skip 6.5, ghi SESSION: "User bac phan loai logic bug" → Buoc 7

### 6.5d. Cap nhat PLAN.md + commit
- Sua bang Truths trong PLAN.md (CHI PLAN.md, KHONG sua TASKS.md)
- Gia tri cu ghi trong BUG report "Phan tich nguyen nhan"
- Commit rieng:
  git add [PLAN.md path]
  git commit -m "[LOI] Cap nhat Truth [TX]: [tom tat thay doi]"
- Tiep tuc Buoc 7
```

### Example 2: Logic Changes in PROGRESS.md Template

```markdown
## Logic Changes
| Truth ID | Thay doi | Ly do |
|----------|---------|-------|
| T2 | Sua nguong khoa: 3→5 lan, them thoi gian 15 phut | Bug #BUG_24_03_2026: logic cu khong match yeu cau bao mat moi |
```

### Example 3: Conditional Logic Changes in write-code.md

Addition to Buoc 4 or near PROGRESS.md update instructions:

```markdown
**Logic Changes (neu co):**
Phat hien logic nghiep vu can dieu chinh trong qua trinh code (VD: edge case moi, gia tri nguong can sua):
1. Cap nhat PLAN.md Truths tuong ung (chi sua Truth hien co)
2. Ghi vao PROGRESS.md section "## Logic Changes":
   | Truth ID | Thay doi | Ly do |
3. Khong co logic change → KHONG tao section nay
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Bug fix code directly | Phase 18: Re-validate logic (Buoc 1.7) before writing code | Phase 18 (2026-03-24) | AI confirms understanding before acting |
| 3-column Truths table | 5-column Truths (Su that, Gia tri nghiep vu, Truong hop bien, Cach kiem chung) | Phase 17 (2026-03-23) | Richer truth documentation |
| Truth-Task mapping optional | CHECK-04 BLOCK (Task without Truth = blocked) | Phase 17 (2026-03-23) | Mandatory traceability |
| No truth correction flow | **[NEW Phase 19]** Buoc 6.5 Logic Update | Pending | Corrects Truth before code when logic is wrong |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node --test) |
| Config file | package.json "test" script |
| Quick run command | `node --test test/smoke-integrity.test.js` |
| Full suite command | `node --test 'test/*.test.js'` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CORR-01 | Buoc 6.5 exists in fix-bug.md with correct flow | unit (integrity) | `node --test test/smoke-integrity.test.js` | Existing tests check workflow structure |
| CORR-02 | Logic Changes section in progress template | unit (integrity) | `node --test test/smoke-integrity.test.js` | Existing tests check template structure |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-integrity.test.js`
- **Per wave merge:** `node --test 'test/*.test.js'`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None -- existing test infrastructure (smoke-integrity.test.js) validates workflow/template cross-references. No new test files needed since this phase only modifies markdown content, not JavaScript code. The integrity tests will catch broken `@references/` and `@templates/` links if any are introduced.

## Open Questions

1. **Logic Changes in fix-bug context**
   - What we know: fix-bug does not use PROGRESS.md. It uses BUG_*.md reports and SESSION_*.md files.
   - What's unclear: D-11 says "ap dung ca write-code va fix-bug workflow" for Logic Changes. In fix-bug, the natural place is BUG_*.md "Phan tich nguyen nhan" section where old Truth values already go (per D-06).
   - Recommendation: For fix-bug, the Logic Changes table should be added to BUG_*.md report template (Buoc 7 format), not a new PROGRESS.md. This satisfies both D-06 (old values in BUG report) and D-11 (both workflows track changes). The planner should clarify this in the plan.

2. **Buoc 6.5 ordering relative to Buoc 7 (bug report) and Buoc 8 (code fix)**
   - What we know: D-07 says "Sua Truth TRUOC khi sua code". Current flow is 6c -> 7 (report) -> 8 (code fix).
   - What's unclear: Buoc 6.5 updates PLAN.md and commits BEFORE the bug report (Buoc 7). But the bug report needs to reference the Truth change. The BUG report in Buoc 7 already has "Phan tich nguyen nhan" which will contain old values (D-06).
   - Recommendation: Flow should be 6c -> 6.5 (classify + confirm + update Truth + commit PLAN.md) -> 7 (write bug report that references the Truth change) -> 8 (fix code). This is consistent with D-07 wording.

## Sources

### Primary (HIGH confidence)
- `workflows/fix-bug.md` -- Full current workflow, verified insertion point between 6c (line 184-190) and Buoc 7 (line 192)
- `workflows/write-code.md` -- Full current workflow, PROGRESS.md lifecycle at lines 56-83 and 222 and 301
- `templates/progress.md` -- Current template format, confirmed minimal structure
- `templates/plan.md` -- 5-column Truths table format (target for Buoc 6.5 edits)
- `19-CONTEXT.md` -- All 14 decisions (D-01 to D-14)
- `17-CONTEXT.md` -- Prior phase decisions on Truths format
- `18-CONTEXT.md` -- Prior phase decisions on Buoc 1.7 and confirmation patterns
- `references/conventions.md` -- [LOI] commit prefix, step numbering conventions

### Secondary (MEDIUM confidence)
- Grep analysis of PROGRESS references in both workflows -- confirmed fix-bug.md has zero PROGRESS.md usage

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No libraries involved, pure markdown edits
- Architecture: HIGH -- Insertion points clearly identified, patterns well-established from Phases 17-18
- Pitfalls: HIGH -- Based on direct code analysis, not speculation

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable -- markdown templates change slowly)
