# Skill Repo Audit Report — v9.0

**Date:** 2026-04-03
**Scope:** Full audit of `please-done` skill repo — structure, code quality, content, documentation
**Baseline:** 1224 tests pass / 0 fail

---

## Summary

| Category | 🔴 Critical | 🟠 High | 🟡 Medium | 🔵 Low | ✅ Pass |
|----------|:-----------:|:-------:|:---------:|:------:|:------:|
| Version & Docs | — | 2 | 2 | 1 | — |
| Markdown Content | — | 1 | 2 | — | — |
| Orphaned Files | — | 1 | 1 | — | — |
| Code Quality (JS) | — | 1 | 2 | — | — |
| Test Coverage | — | — | 2 | — | — |
| Naming/Structure | — | — | — | — | 3 |

**Total: 0 critical, 5 high, 9 medium, 1 low**

---

## 🟠 HIGH Priority

### H-01: README.md version badge is stale

**File:** `README.md:3`
**Problem:** Badge shows `version-2.8.0` but `package.json` and `VERSION` both say `4.0.0`.

```markdown
<!-- Current (wrong) -->
[![Version](https://img.shields.io/badge/version-2.8.0-blue.svg)]

<!-- Should be -->
[![Version](https://img.shields.io/badge/version-4.0.0-blue.svg)]
```

**Fix:** Update badge to `4.0.0`. Consider automating via `npm version` hook.

---

### H-02: INTEGRATION_GUIDE.md referenced but does not exist

**File:** `README.md:238` and `README.md:524`
**Problem:** README links to `INTEGRATION_GUIDE.md` which does not exist. Users clicking the link get a 404.

```markdown
See [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for how to add new stacks or edit rules.
```

**Fix:** Either create `INTEGRATION_GUIDE.md` or remove/update the references in README.

---

### H-03: write-code.md says "commit in Vietnamese" — contradicts conventions.md

**File:** `workflows/write-code.md:471`
**Problem:** Workflow rule says commit messages must be in Vietnamese with diacritics:
```
- MUST commit after build pass, message in Vietnamese with diacritics
```

But `references/conventions.md:70` says:
```
- Commit messages: English
```

The project migrated to English in v6.0. This is a leftover from the old convention.

**Fix:** Change line 471 in `workflows/write-code.md` to:
```
- MUST commit after build pass, message in English following conventions.md prefixes
```

---

### H-04: Orphaned workflow file `fix-bug-v1.5.md`

**File:** `workflows/fix-bug-v1.5.md`
**Problem:** This is a deprecated v1.5 version of the fix-bug workflow. It IS still referenced by `workflows/fix-bug.md:32` as a fallback for when user explicitly requests v1.5 mode — but this mode is never exposed to users via any command.

```markdown
<!-- fix-bug.md line 32 -->
Read and execute per content of file `workflows/fix-bug-v1.5.md`. STOP workflow v2.1 here.
```

**Fix:** Either:
- Archive to `workflows/legacy/fix-bug-v1.5.md` if truly deprecated
- Or document the v1.5 fallback in `commands/pd/fix-bug.md` if it's a valid user option

---

### H-05: `plan-check.js` has 2 empty `catch {}` blocks — violates error handling contract

**File:** `bin/plan-check.js:66` and `bin/plan-check.js:76`
**Problem:** Both catch blocks silently swallow errors:

```javascript
// Line 66 — research directory check
try {
  hasResearchFiles = (
    fs.existsSync(researchInternalDir) && ...
  );
} catch {}   // ❌ Silent — user won't know if research check failed

// Line 76 — config.json severity overrides
try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  check06Severity = config?.checks?.research_backing?.severity;
} catch {}   // ❌ Silent — broken config.json goes unnoticed
```

Additionally, `smoke-error-handling.test.js` only checks 3 files (`manifest.js`, `installers/claude.js`, `installers/gemini.js`) — `plan-check.js` is NOT in the error handling test scope, so this won't be caught automatically.

**Fix:**
```javascript
} catch (err) {
  // Non-blocking — defaults are safe, but log for debugging
  if (process.env.DEBUG) console.warn(`Research dir check failed: ${err.message}`);
}
```

---

## 🟡 MEDIUM Priority

### M-01: 4 command docs missing from `docs/commands/`

**Current:** 12 docs exist for 16 commands. Missing:

| Command | File | Status |
|---------|------|--------|
| `pd:audit` | `docs/commands/audit.md` | ❌ Missing |
| `pd:conventions` | `docs/commands/conventions.md` | ❌ Missing |
| `pd:onboard` | `docs/commands/onboard.md` | ❌ Missing |
| `pd:status` | `docs/commands/status.md` | ❌ Missing |

**Fix:** Create docs for all 4 commands following the same format as existing docs.

---

### M-02: No test file for `pd:onboard` command

**Problem:** All other major commands have smoke tests. `onboard` has NO test file (`test/smoke-onboard.test.js` does not exist) and no grep matches in any test file.

Snapshots exist in `test/snapshots/*/onboard.md` (validates conversion), but there are no behavioral contract tests for the onboard workflow itself.

**Fix:** Create `test/smoke-onboard.test.js` with at minimum:
- Skill file structure validation (frontmatter, XML sections)
- Workflow reference resolution check
- Guard reference check

---

### M-03: `de_xuat_cai_tien.md` is entirely in Vietnamese

**File:** `de_xuat_cai_tien.md` (266 lines)
**Problem:** This improvement proposals document is in Vietnamese but the project language policy since v6.0 is English-only. It's in the repo root and visible to all users.

**Fix:** Either:
- Translate to English as `IMPROVEMENT_PROPOSALS.md`
- Or archive to `.planning/legacy/de_xuat_cai_tien.md` with a note

---

### M-04: `N_FIGMA_TO_HTML_NOTES.md` is a loose note in repo root

**File:** `N_FIGMA_TO_HTML_NOTES.md`
**Problem:** This is an implementation note file sitting in the repo root. It's not referenced by any skill or documentation.

**Fix:** Move to `docs/notes/` or `.planning/research/` depending on whether it's active or historical.

---

### M-05: `references/mermaid-rules.md` is not referenced anywhere

**File:** `references/mermaid-rules.md`
**Problem:** No command, workflow, or template references this file. Grep across all `.md` files returns zero matches.

**Fix:** Either wire it into a command's `execution_context` as `(optional)` or remove it.

---

### M-06: `utils.js` has 3 bare `catch` blocks with no logging

**File:** `bin/lib/utils.js:140, 169, 200`
**Problem:** Three functions silently catch errors and return defaults:

```javascript
// Line 140 — fileHash()
catch { return null; }

// Line 169 — isWsl()
catch { return false; }

// Line 200 — detectPlatformSync()
catch { return false; }
```

These are designed to be non-throwing (safe defaults), but provide zero diagnostic information.

**Fix:** Add `process.env.DEBUG` conditional logging like:
```javascript
catch (err) {
  if (process.env.DEBUG) console.warn(`fileHash failed for ${filePath}: ${err.message}`);
  return null;
}
```

---

### M-07: `process.exit(1)` in `installers/claude.js` (6 calls)

**File:** `bin/lib/installers/claude.js` — 6 calls to `process.exit(1)`
**Problem:** Library code calls `process.exit()` directly, making it:
- Impossible to reuse in non-CLI contexts (e.g., testing)
- Hard to test (tests can't catch exits)

Other installers (`codex.js`, `copilot.js`, `gemini.js`, `opencode.js`) do NOT call `process.exit()` — they throw instead. `claude.js` is the only outlier.

**Fix:** Replace `process.exit(1)` with `throw new Error(...)` and let `bin/install.js` handle the exit.

---

### M-08: CHANGELOG.md version stuck at 2.8.0

**File:** `CHANGELOG.md`
**Problem:** Last entry is `[2.8.0] - 21_03_2026`. The project is now at v4.0.0 with 13 shipped milestones. Versions v3.0 through v4.0 (milestones v3.0–v8.0) are not documented in CHANGELOG.

**Fix:** Either:
- Add missing version entries (v3.0–v4.0) to CHANGELOG.md
- Or declare CHANGELOG.md deprecated in favor of `.planning/MILESTONES.md` as the source of truth

---

### M-09: `smoke-error-handling.test.js` only covers 3 files

**File:** `test/smoke-error-handling.test.js`
**Problem:** The "no bare catch {}" test only checks:
- `bin/lib/manifest.js`
- `bin/lib/installers/claude.js`
- `bin/lib/installers/gemini.js`

It does NOT cover `bin/plan-check.js` (has 2 bare catches) or `bin/lib/utils.js` (has 3 bare catches).

**Fix:** Add `bin/plan-check.js` and `bin/lib/utils.js` to `TARGET_FILES` — or exempt them explicitly with a comment explaining why bare catches are acceptable.

---

## 🔵 LOW Priority

### L-01: `js-tiktoken` may be removable

**File:** `package.json` devDependency
**Problem:** Only used in `scripts/count-tokens.js` — a developer utility script, not part of the main product. Could be an optional dependency instead.

**Impact:** Minimal. The dependency is small and doesn't affect production.

**Fix (optional):** Move to `optionalDependencies` or document that it's only for the `count-tokens` script.

---

## ✅ Passing Checks (No Action Needed)

| Area | Status | Notes |
|------|--------|-------|
| **Command XML structure** | ✅ Pass | All 16 commands have `<objective>`, `<guards>`, proper frontmatter |
| **Workflow references** | ✅ Pass | All `@workflows/*.md`, `@references/*.md`, `@templates/*.md` resolve |
| **Agent coverage** | ✅ Pass | All 16 agents referenced by at least one workflow |
| **Guard files** | ✅ Pass | All 4 guard files are correctly formatted as soft-check checklists with fallback instructions |
| **Naming conventions** | ✅ Pass | All files use consistent kebab-case |
| **`use strict`** | ✅ Pass | All 42+ JS files have `'use strict'` |
| **File hash + null guards** | ✅ Pass | Fixed in v9.0 Phase 81 (`extractReadingRefs`, `classifyRefs`, `fileHash`) |
| **Template currency** | ✅ Pass | All 12 templates match current workflow outputs |
| **Dependency integrity** | ✅ Pass | `package.json` version matches `VERSION` file (4.0.0) |

---

## Suggested Fix Order

1. **H-03** — Fix Vietnamese commit message rule (1 line change)
2. **H-01** — Update README version badge (1 line change)
3. **H-05** — Fix empty catch blocks in plan-check.js (2 blocks)
4. **M-06** — Add debug logging to utils.js catches (3 blocks)
5. **H-02** — Create or remove INTEGRATION_GUIDE.md reference
6. **M-01** — Create 4 missing command docs
7. **M-03 + M-04** — Archive/move loose files in repo root
8. **M-05** — Remove or wire `mermaid-rules.md`
9. **H-04** — Archive `fix-bug-v1.5.md`
10. **M-02** — Create onboard smoke test
11. **M-07** — Refactor `process.exit` in claude.js installer
12. **M-08** — Update or deprecate CHANGELOG.md
13. **M-09** — Expand error-handling test scope
