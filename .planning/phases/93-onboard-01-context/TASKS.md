---
phase: 93
version: 1.0.0
status: Ready for execution
created: 2026-04-04
---

# Phase 93 Tasks: ONBOARD-01 — Context Generation

---

## Task 1: Create CONTEXT.md Template

**Status:** completed
**Owner:** 
**Est:** 1h
**Dependencies:** None

**Description:**
Create `templates/context-template.md` with structure for tech stack, key files, framework patterns, and documentation links.

**Acceptance Criteria:**
- [ ] Template renders correctly with sample data
- [ ] All placeholders are replaced during generation
- [ ] Markdown is valid

---

## Task 2: Add Context Generation to Onboard Skill

**Status:** completed
**Owner:** 
**Est:** 2h
**Dependencies:** Task 1, Task 5, Task 6

**Description:**
Update `commands/pd/onboard.md` to add Step 6: Generate CONTEXT.md after scan completion.

**Acceptance Criteria:**
- [ ] CONTEXT.md generated with correct format
- [ ] All sections populated
- [ ] Error handling works for edge cases

---

## Task 3: Create Summary Output Module

**Status:** completed
**Owner:** 
**Est:** 2h
**Dependencies:** Task 5, Task 6

**Description:**
Create `lib/onboard-summary.js` with `generateSummary(context)` function for formatted terminal output.

**Acceptance Criteria:**
- [ ] Summary displays correctly in terminal
- [ ] All data correctly formatted
- [ ] Handles edge cases (no files, missing data)

---

## Task 4: Wire Summary to Onboard Workflow

**Status:** completed
**Owner:** 
**Est:** 1h
**Dependencies:** Task 3

**Description:**
Update `workflows/onboard.md` to add Step 7: Display Summary after context generation.

**Acceptance Criteria:**
- [ ] Summary displays at end of onboard
- [ ] Format is clear and readable
- [ ] No duplicate output

---

## Task 5: Create Documentation Link Mapper

**Status:** completed
**Owner:** 
**Est:** 1h
**Dependencies:** None

**Description:**
Create `lib/doc-link-mapper.js` with `getDocumentationLinks(techStack)` function mapping frameworks to docs URLs.

**Acceptance Criteria:**
- [ ] All common frameworks mapped
- [ ] Links are valid URLs
- [ ] Graceful fallback for unknown technologies

---

## Task 6: Create Key File Selector

**Status:** completed
**Owner:** 
**Est:** 2h
**Dependencies:** None

**Description:**
Create `lib/key-file-selector.js` with `selectKeyFiles(fileList, maxFiles = 15)` function using selection criteria.

**Acceptance Criteria:**
- [ ] Entry points always included
- [ ] Config files detected correctly
- [ ] Max file limit respected
- [ ] Diverse file types selected

---

## Task 7: Update Onboard Tests

**Status:** completed
**Owner:** 
**Est:** 2h
**Dependencies:** Task 2, Task 4

**Description:**
Update `test/onboard-integration.test.js` with test cases for context generation and summary display.

**Acceptance Criteria:**
- [ ] All tests pass
- [ ] New coverage for context generation
- [ ] No regressions in existing tests

---

## Task 8: Update Smoke Tests

**Status:** completed
**Owner:** 
**Est:** 1h
**Dependencies:** Task 7

**Description:**
Update `test/smoke/onboard-smoke.test.js` to verify end-to-end flow with CONTEXT.md and summary.

**Acceptance Criteria:**
- [ ] Smoke tests pass
- [ ] All artifacts created
- [ ] Log files clean

---

## Wave Summary

| Wave | Tasks | Est Total |
|------|-------|-----------|
| Wave 1 | 1, 6, 5, 3 | 6h |
| Wave 2 | 2, 4 | 3h |
| Wave 3 | 7, 8 | 3h |

---

*Tasks created: 2026-04-04*
