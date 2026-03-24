# Phase 18: Logic-First Execution - Research

**Researched:** 2026-03-24
**Domain:** Workflow prompt engineering, verification template design, markdown instruction authoring
**Confidence:** HIGH

## Summary

Phase 18 implements two requirements that extend the Truth Protocol (Phase 17) into the execution and verification layers. EXEC-01 adds a "Buoc 1.7: Re-validate Logic" step to the write-code workflow, requiring the AI to output a targeted paraphrase of Business Logic from the Truths table before editing any files (~100 tokens). EXEC-02 restructures the verification-report template to explicitly tie each Truth to typed evidence (Log/Screenshot/Test) rather than free-form text.

Both changes are pure markdown edits to existing workflow/template files. No JavaScript code changes are needed (unlike Phase 17 which modified plan-checker.js). The primary technical risk is snapshot cascade: modifying `workflows/write-code.md` triggers regeneration of 4 write-code.md snapshots (codex/gemini/copilot/opencode). The verification-report template change does NOT cascade to snapshots because it is referenced by path (`@templates/verification-report.md`), not inlined.

**Primary recommendation:** Ship EXEC-01 (workflow edit + snapshot regen) and EXEC-02 (template edit) as two separate plans. EXEC-01 touches write-code.md which cascades to 4 snapshots; EXEC-02 touches only the template file and write-code.md Buoc 9.5 section. If both touch write-code.md, combine into a single plan to avoid double snapshot regeneration.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EXEC-01 | write-code workflow co Buoc 1.7 "Re-validate Logic" -- AI in ra targeted paraphrase cua Business Logic truoc khi sua file (~100 tokens) | Insertion point identified: between Buoc 1.6 (line 143) and Buoc 2 (line 154) of write-code.md. Pattern: read PLAN.md Truths table, output paraphrase, then proceed to Buoc 2 |
| EXEC-02 | verification-report template doi cau truc tu "Test Case Passed" sang "Truths Verified" voi bang chung (Log/Screenshot/Test) di kem moi Truth | Current template at templates/verification-report.md already uses Truths table but "Bang chung" column is free-form. Need to formalize evidence types and restructure section header language |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node:test | built-in (Node 24) | Test runner | Already used (455 tests passing) |
| node:assert/strict | built-in | Assertions | Already used throughout |

### Supporting
No additional libraries needed. This phase modifies markdown workflow files and templates only.

**Installation:** None required.

## Architecture Patterns

### Project Structure (Relevant Files)
```
workflows/
  write-code.md         # EXEC-01: Add Buoc 1.7 between 1.6 and 2
templates/
  verification-report.md  # EXEC-02: Restructure evidence format
test/
  snapshots/              # 4 platforms x 12 skills = 48 snapshots
  generate-snapshots.js   # Regeneration script
  smoke-snapshot.test.js  # 48 snapshot comparison tests
```

### Pattern 1: Surgical Workflow Edit (established in Phase 17)
**What:** Add a new step to an existing workflow by inserting between numbered steps. Maintain the `---` separator pattern between steps. Follow the established Vietnamese writing style with diacritics.
**When to use:** EXEC-01 -- adding Buoc 1.7.
**Example from Phase 17:**
Phase 17 Plan 02 modified workflows/plan.md Buoc 4.3 by changing only the Tang 1 section (lines 182-186) and one rules summary line (line 491). Same surgical approach applies here.

**Key constraint:** write-code.md current step numbering:
- Buoc 1.5: Wave analysis (parallel only)
- Buoc 1.6: Document analysis
- **[INSERT HERE] Buoc 1.7: Re-validate Logic**
- Buoc 2: Read context for task

### Pattern 2: Template Reference (NOT inline)
**What:** Templates are referenced by path (`@templates/verification-report.md`) in workflows. Converters resolve the `@` prefix to `[SKILLS_DIR]/templates/` but do NOT inline template content into snapshots.
**When to use:** Understanding EXEC-02 cascade impact.
**Implication:** Changing `templates/verification-report.md` does NOT require snapshot regeneration. Only changing `workflows/write-code.md` requires it.

### Pattern 3: Snapshot Cascade (established in Phase 17)
**What:** Modifying a workflow file triggers snapshot regeneration for that workflow across 4 platforms. Script: `node test/generate-snapshots.js`. Verify: `node --test test/smoke-snapshot.test.js`.
**When to use:** After ANY edit to workflows/write-code.md.
**Cascade scope for this phase:**
- `workflows/write-code.md` changed -> 4 snapshots: `test/snapshots/{codex,gemini,copilot,opencode}/write-code.md`
- `templates/verification-report.md` changed -> 0 snapshots (referenced by path, not inlined)

### Anti-Patterns to Avoid
- **Inlining token-heavy instructions in Buoc 1.7:** The step must be concise (~100 tokens AI output budget). The workflow instruction itself should be 3-5 lines max, not a detailed essay.
- **Changing step numbers of existing steps:** Do NOT renumber Buoc 2 through Buoc 10. Buoc 1.7 is deliberately numbered as a sub-step of Buoc 1, consistent with Buoc 1.5 and Buoc 1.6.
- **Adding new verification logic to plan-checker.js:** EXEC-01 and EXEC-02 are prompt/template changes only. No plan-checker changes are in scope.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Snapshot regeneration | Manual file edits | `node test/generate-snapshots.js` | Script handles all 48 snapshots across 4 platforms automatically |
| Test validation | Manual checking | `node --test 'test/*.test.js'` | 455 existing tests catch regressions |
| Step numbering | New integer steps | Sub-step numbering (1.7) | Existing pattern: 1.5, 1.6 are sub-steps. Avoids renumbering cascade |

**Key insight:** This phase is purely about workflow markdown authoring and template design. There is no JavaScript to write. The "code" is the prompt instructions themselves.

## Common Pitfalls

### Pitfall 1: Buoc 1.7 output bloat
**What goes wrong:** The Re-validate Logic step becomes too verbose, consuming excessive tokens before actual code writing begins.
**Why it happens:** Without a clear output budget, the AI may dump the entire Truths table plus elaboration.
**How to avoid:** Specify "~100 tokens" budget in the workflow instruction. Instruct "targeted paraphrase" not "copy-paste". Example: "Dien giai ngan gon Business Logic cua task nay (toi da ~100 tokens) -- KHONG sao chep nguyen bang Truths."
**Warning signs:** If the paraphrase exceeds 3-4 sentences, it's too long.

### Pitfall 2: Forgetting snapshot regeneration
**What goes wrong:** write-code.md is edited but snapshots are not regenerated, causing 4 snapshot test failures.
**Why it happens:** The cascade is not obvious -- template changes don't cascade, but workflow changes do.
**How to avoid:** After editing write-code.md, ALWAYS run `node test/generate-snapshots.js` then `node --test test/smoke-snapshot.test.js`. Verify exactly 4 files changed in `test/snapshots/*/write-code.md`.
**Warning signs:** `git diff --stat test/snapshots/` shows 0 or != 4 write-code.md changes.

### Pitfall 3: Breaking the separator pattern
**What goes wrong:** Inserting Buoc 1.7 without the `---` horizontal rule separator breaks the visual structure of the workflow.
**Why it happens:** Each "Buoc" section in write-code.md is separated by `---`.
**How to avoid:** Look at how Buoc 1.6 ends (line 150-152): content, blank line, `---`, blank line, next Buoc. Follow the same pattern.

### Pitfall 4: Evidence column too rigid
**What goes wrong:** The verification-report evidence types (Log/Screenshot/Test) become mandatory categories that don't fit all verification scenarios.
**Why it happens:** Over-formalizing a flexible field.
**How to avoid:** Make evidence types a recommendation, not a rigid schema. Some Truths are verified by file existence (Artifact check), others by test output, others by manual inspection. The template should show evidence TYPE as a prefix, not force exactly one of three categories.

### Pitfall 5: Misunderstanding EXEC-02 scope
**What goes wrong:** Assuming EXEC-02 requires changing the actual Buoc 9.5 logic in write-code.md workflow, leading to unnecessary workflow edits.
**Why it happens:** The requirement says "verification-report template doi cau truc" which could be interpreted as changing the workflow logic too.
**How to avoid:** EXEC-02 changes `templates/verification-report.md` (the template that defines the report format). The workflow at Buoc 9.5e says "Tong hop -> VERIFICATION_REPORT.md (@templates/verification-report.md)" which means "generate the report following the template." Changing the template is sufficient -- the AI reads the template at runtime and follows it. However, Buoc 9.5d/9.5e descriptions in write-code.md should be updated to mention "Truths Verified" language for consistency.

## Code Examples

### Example 1: Buoc 1.7 instruction text (for write-code.md)

```markdown
## Buoc 1.7: Re-validate Logic -- xac nhan Business Logic truoc khi code

Doc PLAN.md "Tieu chi thanh cong -> Su that phai dat" VA task detail `> Truths:`.
In ra **targeted paraphrase** cua Business Logic lien quan toi task nay:

```
**Logic cua Task [N]:**
- T[x]: [dien giai ngan gon su that + gia tri nghiep vu, KHONG sao chep nguyen van]
- T[y]: [tuong tu]
```

Quy tac:
- Chi Truths ma task nay map toi (tu `> Truths:` trong TASKS.md)
- Toi da ~100 tokens -- dien giai, KHONG copy-paste bang
- Muc dich: kiem tra AI HIEU logic truoc khi viet code, khong chi doc qua
- Khong co Truths (plan format cu) -> bo qua Buoc 1.7
```

### Example 2: Updated verification-report Truths table (for templates/verification-report.md)

```markdown
## Truths Verified -- Su that da xac minh
| # | Su that | Trang thai | Loai bang chung | Bang chung |
|---|---------|-----------|-----------------|-----------|
| T1 | [mo ta] | DAT | Test | `npm test -- --grep "auth"` pass 5/5 |
| T2 | [mo ta] | DAT | Log | Server log: `POST /login 200 OK` |
| T3 | [mo ta] | CHUA DAT | Screenshot | [screenshot cho thay form loi] |
| T4 | [mo ta] | CAN KIEM TRA THU CONG | Manual | Can chay app tren thiet bi that |
```

### Example 3: Buoc 9.5d update (for write-code.md consistency)

```markdown
**9.5d -- Cap 4: Truths Verified (kiem tra logic)**
Voi moi Truth: verify "Cach kiem chung" tren code thuc te.
- Ghi nhan **loai bang chung** cho moi Truth: Test | Log | Screenshot | File | Manual
- Cross-check: Truths ma TAT CA artifacts dat Cap 1-3 -> kha nang cao dat.
```

## Cascade Analysis

Critical analysis for the planner -- which files change and what cascades:

| File Changed | Cascade | Snapshot Impact |
|-------------|---------|-----------------|
| `workflows/write-code.md` | 4 write-code.md snapshots | MUST regenerate via `node test/generate-snapshots.js` |
| `templates/verification-report.md` | None | Referenced by path, not inlined |
| `workflows/complete-milestone.md` | 4 complete-milestone.md snapshots | ONLY if workflow text changes (NOT needed for EXEC-02) |

**Recommendation:** If both EXEC-01 and EXEC-02 touch write-code.md, batch them in a single plan to avoid double snapshot regeneration. Regenerate once at the end.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 3-col Truths table | 5-col Truths table (+ Business Value + Edge Cases) | Phase 17 (v1.3) | Truths now carry business context |
| CHECK-04 WARN for taskless Truths | CHECK-04 BLOCK for taskless Truths | Phase 17 (v1.3) | "No Truth = No Code" enforced |
| No pre-code logic check | Buoc 1.7 Re-validate Logic (THIS PHASE) | Phase 18 | AI must prove understanding before coding |
| Free-form evidence in verification | Typed evidence (THIS PHASE) | Phase 18 | Structured proof per Truth |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in, Node 24.13.0) |
| Config file | None (built-in runner) |
| Quick run command | `node --test test/smoke-snapshot.test.js` |
| Full suite command | `node --test 'test/*.test.js'` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EXEC-01 | write-code.md contains Buoc 1.7 with Re-validate Logic instruction | smoke | `grep -c "Buoc 1.7" workflows/write-code.md` | N/A (grep check) |
| EXEC-01 | 4 write-code.md snapshots regenerated and matching | snapshot | `node --test test/smoke-snapshot.test.js` | Exists |
| EXEC-02 | verification-report template has "Truths Verified" section and evidence type column | smoke | `grep -c "Loai bang chung" templates/verification-report.md` | N/A (grep check) |
| EXEC-02 | Full test suite still passes (no regressions) | full | `node --test 'test/*.test.js'` | Exists |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-snapshot.test.js` (48 snapshot tests)
- **Per wave merge:** `node --test 'test/*.test.js'` (455+ tests)
- **Phase gate:** Full suite green before verification

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements. Snapshot tests already exist. No new test files needed.

## Insertion Point Analysis (EXEC-01)

Precise location for Buoc 1.7 in `workflows/write-code.md`:

```
Line 143: ## Buoc 1.6: Phan tich task -- quyet dinh tai lieu tham khao
...
Line 150: Neu khong ro -> BO QUA. Neu phat hien can giua chung -> doc khi can (tu sua, khong can khoi dong lai).
Line 151: (blank)
Line 152: ---
Line 153: (blank)
Line 154: ## Buoc 2: Doc context cho task
```

**Insert Buoc 1.7 between line 152 (---) and line 154 (Buoc 2).** Follow the same pattern:
1. `## Buoc 1.7: [title]`
2. Content (3-8 lines max)
3. Blank line
4. `---`
5. Blank line
6. `## Buoc 2:` (existing, unchanged)

## EXEC-02 Template Redesign Analysis

### Current template structure (templates/verification-report.md)
```
## Truths -- Su that phai dat
| # | Su that | Trang thai | Bang chung |
```
- "Bang chung" is free-form text
- Section header: "Truths -- Su that phai dat"
- Summary says "Dat: [N] Truths"

### Target structure per EXEC-02
```
## Truths Verified -- Su that da xac minh
| # | Su that | Trang thai | Loai bang chung | Bang chung |
```
Changes:
1. Section header: "Truths -- Su that phai dat" -> "Truths Verified -- Su that da xac minh"
2. Add "Loai bang chung" column with values: Test | Log | Screenshot | File | Manual
3. Summary: "Tieu chi dat" -> "Truths Verified" (consistent language)
4. Header metadata: "Ket qua: [N]/[M] tieu chi dat" -> "Ket qua: [N]/[M] Truths verified"

### Impact on consumers
| Consumer | How it reads template | Impact |
|----------|----------------------|--------|
| write-code.md Buoc 9.5e | `@templates/verification-report.md` path reference | AI reads template at runtime, follows new format automatically |
| complete-milestone.md Buoc 3.5a | Reads existing VERIFICATION_REPORT.md, checks status | Reads "Trang thai" field which remains unchanged (Dat/Co gap/Can kiem tra thu cong) |
| what-next.md | Checks VERIFICATION_REPORT.md existence + status | Same status field, no change needed |

**Critical finding:** No workflow changes needed for EXEC-02's template change to take effect. The AI reads the template at runtime. However, updating Buoc 9.5d/9.5e text in write-code.md for consistency is recommended (not strictly required).

## Sources

### Primary (HIGH confidence)
- `workflows/write-code.md` -- full file read, step numbering confirmed
- `templates/verification-report.md` -- full file read, current structure mapped
- `templates/plan.md` -- Truths table structure confirmed (5-col from Phase 17)
- `bin/lib/plan-checker.js` -- confirmed no changes needed for this phase
- `references/plan-checker.md` -- confirmed no changes needed for this phase
- `.planning/phases/17-truth-protocol/17-CONTEXT.md` -- Phase 17 decisions reviewed
- `.planning/phases/17-truth-protocol/17-02-PLAN.md` -- Phase 17 execution pattern studied
- `.planning/phases/17-truth-protocol/17-VERIFICATION.md` -- Phase 17 verification reviewed

### Secondary (HIGH confidence)
- Test suite baseline: 455 pass, 0 fail (verified by running `node --test 'test/*.test.js'`)
- Snapshot cascade verified: `grep -l "verification-report"` across all 4 platform snapshot dirs confirms write-code.md and complete-milestone.md are the only affected snapshots

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, pure markdown edits
- Architecture: HIGH -- insertion point precisely identified, cascade fully mapped
- Pitfalls: HIGH -- based on Phase 17 execution experience and direct file analysis

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable -- no external dependencies to go stale)
