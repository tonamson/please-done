---
phase: 93
version: 1.0.0
status: Ready for execution
created: 2026-04-04
---

# Phase 93 Plan: ONBOARD-01 — Context Generation & Summary

**Requirement:** ONBOARD-01  
**Milestone:** v11.0  
**Context:** `.planning/phases/93-onboard-01-context/93-CONTEXT.md`

---

## Goal

Add CONTEXT.md generation and onboarding summary output to `pd:onboard` skill.

---

## Success Criteria

1. ✅ Generates initial CONTEXT.md with key files
2. ✅ Creates onboarding summary with next steps
3. ✅ Shows detected stack and frameworks
4. ✅ Links to relevant documentation

---

## Analysis

### Current State
- `pd:onboard` skill exists (from Phase 78)
- State machine integration complete (Phase 92)
- Error handler wired (Phase 92)
- what-next integration complete (Phase 92)
- Missing: CONTEXT.md generation and summary output

### Files to Modify
1. `commands/pd/onboard.md` — Add context generation step
2. `workflows/onboard.md` — Add summary output display

### Integration Points
- Reuse tech-stack detection from scan workflow
- Use existing PROJECT.md as vision reference
- Connect to state machine for "planning-ready" state

---

## Implementation Tasks

### Task 1: Create CONTEXT.md Template
**File:** `templates/context-template.md`

**Content structure:**
```markdown
# Context: {project_name}

## Tech Stack
- **Framework:** {detected_framework}
- **Language:** {detected_language}
- **Build Tool:** {detected_build_tool}
- **Test Framework:** {detected_test_framework}

## Key Files
| File | Purpose |
|------|----------|
| {file1} | {purpose} |
| {file2} | {purpose} |

## Framework Patterns
- {pattern_1}
- {pattern_2}

## Documentation Links
- [Framework Docs]({url})
- [ORM Docs]({url})
- [Testing Docs]({url})
```

**Validation:**
- [ ] Template renders correctly with sample data
- [ ] All placeholders are replaced during generation
- [ ] Markdown is valid

---

### Task 2: Add Context Generation to Onboard Skill
**File:** `commands/pd/onboard.md`

**Add step after scan completion:**
```markdown
### Step 6: Generate CONTEXT.md

Generate `.planning/CONTEXT.md` using:
1. Tech stack from scan results
2. Key files (top 10-15 by importance)
3. Framework patterns detected
4. Documentation links mapped from stack

**Error handling:**
- If generation fails, log error but continue
- Missing data should not block completion
```

**Validation:**
- [ ] CONTEXT.md generated with correct format
- [ ] All sections populated
- [ ] Error handling works for edge cases

---

### Task 3: Create Summary Output Module
**File:** `lib/onboard-summary.js`

**Function:** `generateSummary(context)`

**Output format:**
```
╔════════════════════════════════════════════════════════════╗
║           PROJECT ONBOARDING COMPLETE                      ║
╠════════════════════════════════════════════════════════════╣
║ Tech Stack: {framework} + {language} + {database}        ║
║ Key Files: {file1}, {file2}                                ║
║ Source Code: {source_dir} ({file_count} files)             ║
╠════════════════════════════════════════════════════════════╣
║ Next Steps:                                                ║
║ • Review PROJECT.md for project vision                     ║
║ • Review CONTEXT.md for codebase overview                  ║
║ • Run /pd:plan to create development plan                  ║
╚════════════════════════════════════════════════════════════╝
```

**Validation:**
- [ ] Summary displays correctly in terminal
- [ ] All data correctly formatted
- [ ] Handles edge cases (no files, missing data)

---

### Task 4: Wire Summary to Onboard Workflow
**File:** `workflows/onboard.md`

**Add step after context generation:**
```markdown
### Step 7: Display Summary

Call `lib/onboard-summary.js` to display formatted summary.
Include:
1. Tech stack detection results
2. Key files summary
3. Next steps for user

**Output:** Display to stdout (not file)
```

**Validation:**
- [ ] Summary displays at end of onboard
- [ ] Format is clear and readable
- [ ] No duplicate output

---

### Task 5: Add Documentation Link Mapping
**File:** `lib/doc-link-mapper.js`

**Function:** `getDocumentationLinks(techStack)`

**Mapping format:**
```javascript
const DOC_LINKS = {
  'nestjs': 'https://docs.nestjs.com',
  'nextjs': 'https://nextjs.org/docs',
  'prisma': 'https://www.prisma.io/docs',
  'typeorm': 'https://typeorm.io',
  'jest': 'https://jestjs.io/docs',
  'vitest': 'https://vitest.dev/guide',
  // ... etc
};
```

**Validation:**
- [ ] All common frameworks mapped
- [ ] Links are valid URLs
- [ ] Graceful fallback for unknown technologies

---

### Task 6: Create Key File Selection Algorithm
**File:** `lib/key-file-selector.js`

**Function:** `selectKeyFiles(fileList, maxFiles = 15)`

**Selection criteria (in order):**
1. Entry points (main.ts, index.js, etc.)
2. Config files (package.json, tsconfig.json, etc.)
3. Core modules (app.module.ts, layout files, etc.)
4. By importance score (if available from scan)

**Validation:**
- [ ] Entry points always included
- [ ] Config files detected correctly
- [ ] Max file limit respected
- [ ] Diverse file types selected

---

### Task 7: Update Onboard Tests
**File:** `test/onboard-integration.test.js`

**Add test cases:**
1. `context.md generated after onboard`
2. `summary displays correctly`
3. `documentation links included`
4. `edge case: unknown stack`
5. `edge case: empty project`

**Validation:**
- [ ] All tests pass
- [ ] New coverage for context generation
- [ ] No regressions in existing tests

---

### Task 8: Update Smoke Tests
**File:** `test/smoke/onboard-smoke.test.js`

**Verify:**
1. End-to-end onboard flow completes
2. CONTEXT.md exists after onboard
3. Summary output is present
4. No errors in logs

**Validation:**
- [ ] Smoke tests pass
- [ ] All artifacts created
- [ ] Log files clean

---

## Execution Order

### Wave 1: Core Implementation
| # | Task | Est | Dependencies |
|---|------|-----|--------------|
| 1 | Create CONTEXT.md template | 1h | None |
| 6 | Create key file selector | 2h | None |
| 5 | Create doc link mapper | 1h | None |
| 3 | Create summary module | 2h | #5, #6 |

### Wave 2: Integration
| # | Task | Est | Dependencies |
|---|------|-----|--------------|
| 2 | Add context generation to skill | 2h | #1, #6, #5 |
| 4 | Wire summary to workflow | 1h | #3 |

### Wave 3: Testing
| # | Task | Est | Dependencies |
|---|------|-----|--------------|
| 7 | Update onboard tests | 2h | #2, #4 |
| 8 | Update smoke tests | 1h | #7 |

---

## Verification

### Pre-merge checks
- [ ] All 8 tasks complete
- [ ] Tests pass: `npm test -- onboard`
- [ ] Smoke tests pass: `npm run test:smoke`
- [ ] No lint errors: `npm run lint`

### Acceptance criteria
1. Running `/pd:onboard` generates `.planning/CONTEXT.md`
2. Summary displays with tech stack, key files, next steps
3. Documentation links relevant to detected stack
4. All existing onboard functionality preserved
5. Zero regressions in init/scan flows

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Template format mismatch | Low | Medium | Review against existing CONTEXT.md examples |
| Unknown stack → no doc links | Medium | Low | Add generic fallback message |
| Key file selection too broad | Low | Low | Cap at 15, prioritize entry/config |
| Summary too verbose | Low | Low | Keep to 15 lines max |

---

## Notes

- **Phase 78** created original onboard — reference for patterns
- **Phase 92** integrated state machine and error handling
- **Phase 89** has error handler pattern for reference
- Keep changes additive — don't modify existing onboard steps

---

*Plan created: 2026-04-04*
*Ready for execution*
