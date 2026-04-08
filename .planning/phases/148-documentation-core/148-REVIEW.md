---
phase: 148-documentation-core
reviewed: 2026-04-04T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - docs/cheatsheet.md
  - docs/COMMAND_REFERENCE.md
findings:
  critical: 2
  warning: 8
  info: 0
  total: 10
status: issues_found
---

# Phase 148: Code Review Report

**Reviewed:** 2026-04-04  
**Depth:** standard  
**Files Reviewed:** 2  
**Status:** issues_found

## Summary

Both files correctly list exactly 20 commands, `COMMAND_REFERENCE.md` has no `commands/*.md` broken links, and all 20 `### \`pd:...\`` headings are present. The COMMAND_REFERENCE rewrite is accurate — every command's purpose, syntax, and example match the actual `commands/pd/*.md` source files.

The cheatsheet, however, was only partially updated. Four commands (`audit`, `test`, `fetch-doc`, `conventions`) still carry stale or invented metadata from before this phase. Two of these are critical because the documented syntax is actively wrong in a way that will cause user-facing failures. The remaining issues are flag discrepancies and category inconsistencies between the two files.

---

## Critical Issues

### CR-01: `pd:audit` — wrong description and non-existent flags in cheatsheet

**File:** `docs/cheatsheet.md` (Debug Commands table, notes block, Popular Flags Reference)  
**Issue:** The cheatsheet describes `pd:audit` as *"Code quality and security analysis"* with flags `--security` and `--performance`. The actual command (`commands/pd/audit.md`) is a **context audit trail viewer** — it lists and searches `.planning/contexts/` discussion summaries. It has no `--security` or `--performance` flags. COMMAND_REFERENCE is correct. The cheatsheet entry appears to have been copied from an older, different concept and was never updated.

A user following the cheatsheet will:
- Misunderstand what the command does
- Invoke `/pd:audit --security` expecting a security scan (which will either fail or produce no output)
- Never discover the actual audit trail functionality

**Fix:**
```markdown
| `/pd:audit` | `/pd:audit [--phase N] [--search keyword] [--view N] [--json] [--limit N]` | `/pd:audit --search "auth"` |

**Notes:**
- `audit`: View and search the discussion context audit trail in `.planning/contexts/`
  - `--phase N`: Filter by phase number
  - `--search "keyword"`: Search summaries by keyword
  - `--view N`: Show full summary for phase N
  - `--limit N`: Limit results (default 10)
  - `--json`: Output in JSON format
```

Also remove `--security` and `--performance` rows from the **Popular Flags Reference** table and add the correct `--phase N`, `--search`, `--view N` rows pointing to `audit`.

---

### CR-02: `pd:fetch-doc` — cheatsheet documents wrong syntax (name instead of URL)

**File:** `docs/cheatsheet.md` (Utility Commands table, notes block)  
**Issue:** The cheatsheet shows:

```
Usage:   /pd:fetch-doc [library]
Example: /pd:fetch-doc react
```

The actual command (`commands/pd/fetch-doc.md`) requires a **URL** as the mandatory first argument:

```yaml
argument-hint: "<URL> [custom-name]"
```

The command's guard explicitly rejects input that lacks `http`/`https`. `/pd:fetch-doc react` will fail. COMMAND_REFERENCE is correct (`/pd:fetch-doc <URL> [custom-name]`).

**Fix:**
```markdown
| `/pd:fetch-doc` | `/pd:fetch-doc <URL> [custom-name]` | `/pd:fetch-doc https://docs.stripe.com/api stripe-api` |

**Notes:**
- `fetch-doc`: Download documentation from a URL and cache it locally (uses WebFetch)
  - `<URL>`: Required — must start with `http://` or `https://`
  - `[custom-name]`: Optional filename override for the cached file
```

---

## Warnings

### WR-01: `pd:test` — cheatsheet shows non-existent flags

**File:** `docs/cheatsheet.md` (Execution Commands table, notes block, Popular Flags Reference)  
**Issue:** The cheatsheet documents `/pd:test [--coverage] [--watch]`. The actual argument-hint is `[task number | --all | --standalone [path] [--all]]`. Neither `--coverage` nor `--watch` appears anywhere in `commands/pd/test.md`. COMMAND_REFERENCE is correct.

**Fix:**
```markdown
| `/pd:test` | `/pd:test [task number \| --all \| --standalone path]` | `/pd:test --all` |

**Notes:**
- `test`: Write and run tests based on detected stack (Jest/PHPUnit/Hardhat/flutter_test)
  - `--all`: Run tests for all tasks in the current phase
  - `--standalone [path]`: Test any module without requiring a full milestone context
```

Remove `--coverage` and `--watch` from the Popular Flags Reference table.

---

### WR-02: `pd:conventions` — cheatsheet shows a `[language]` argument that does not exist

**File:** `docs/cheatsheet.md` (Utility Commands table)  
**Issue:** The cheatsheet shows `/pd:conventions [language]` with example `/pd:conventions typescript`. The actual argument-hint is `(no arguments needed)` — the command auto-detects the project stack. Passing a language argument will be silently ignored, but the documented syntax is misleading. COMMAND_REFERENCE is correct.

**Fix:**
```markdown
| `/pd:conventions` | `/pd:conventions` | `/pd:conventions` |
```

---

### WR-03: `pd:init` — cheatsheet shows `[--force]`, COMMAND_REFERENCE shows `[project path]`

**File:** `docs/cheatsheet.md` (Project Commands table)  
**Issue:** The cheatsheet shows `/pd:init [--force]` while COMMAND_REFERENCE shows `/pd:init [project path]`. The actual argument-hint is `[project path, defaults to current directory]`. There is no `--force` flag in `commands/pd/init.md`. The Popular Flags Reference also lists `--force` pointing to `init`. COMMAND_REFERENCE is correct.

**Fix:**
```markdown
| `/pd:init` | `/pd:init [path]` | `/pd:init` |
```

Remove the `--force` row from the Popular Flags Reference table.

---

### WR-04: `pd:scan` — cheatsheet shows `[--deep]`, COMMAND_REFERENCE shows `[project path]`

**File:** `docs/cheatsheet.md` (Project Commands table)  
**Issue:** The cheatsheet shows `/pd:scan [--deep]` while COMMAND_REFERENCE shows `/pd:scan [project path]`. The actual argument-hint is `[project path, defaults to current directory]`. There is no `--deep` flag in `commands/pd/scan.md`. The Popular Flags Reference also lists `--deep` for `scan`. COMMAND_REFERENCE is correct.

**Fix:**
```markdown
| `/pd:scan` | `/pd:scan [path]` | `/pd:scan` |
```

Remove the `--deep` row from the Popular Flags Reference table.

---

### WR-05: `pd:write-code` — cheatsheet flags differ from COMMAND_REFERENCE and actual command

**File:** `docs/cheatsheet.md` (Execution Commands table, notes block, Popular Flags Reference)  
**Issue:** The cheatsheet shows `/pd:write-code [--wave N] [--skip-verify] [--auto | --parallel]`. The actual argument-hint is `[task number] [--auto | --parallel | --resume]`. Neither `--wave N` nor `--skip-verify` appears in `commands/pd/write-code.md`, and `--resume` is omitted. COMMAND_REFERENCE is correct.

**Fix:**
```markdown
| `/pd:write-code` | `/pd:write-code [task number] [--auto \| --parallel \| --resume]` | `/pd:write-code --auto` |

**Notes:**
- `--auto`: Execute all tasks sequentially without stopping
- `--parallel`: Execute tasks in parallel waves using multiple agents
- `--resume`: Resume from interruption point (auto-detects progress)
```

Remove `--wave N` and `--skip-verify` from the Popular Flags Reference; add `--resume`.

---

### WR-06: `pd:update` — cheatsheet omits the `--apply` flag

**File:** `docs/cheatsheet.md` (Utility Commands table, notes block)  
**Issue:** The cheatsheet shows only `[--check]`. The actual argument-hint is `[--check | --apply]` and the command logic explicitly branches on `--apply` to perform the actual update. Without documenting `--apply`, users have no way to know how to apply an update. COMMAND_REFERENCE is correct.

**Fix:**
```markdown
| `/pd:update` | `/pd:update [--check \| --apply]` | `/pd:update --check` |

**Notes:**
- No flag or `--check`: Check for a newer version only (safe, read-only)
- `--apply`: Check and immediately apply the update
```

---

### WR-07: `pd:new-milestone` — cheatsheet omits `--reset-phase-numbers` flag

**File:** `docs/cheatsheet.md` (Project Commands table)  
**Issue:** The cheatsheet shows `/pd:new-milestone [version]` (example: `/pd:new-milestone v2.0`). The actual argument-hint is `[milestone name, e.g. 'v1.1 Notifications'] [--reset-phase-numbers]`. The `--reset-phase-numbers` flag is omitted entirely. COMMAND_REFERENCE is correct.

**Fix:**
```markdown
| `/pd:new-milestone` | `/pd:new-milestone [milestone name] [--reset-phase-numbers]` | `/pd:new-milestone "v2.0 Performance"` |
```

---

### WR-08: Category inconsistencies — 5 commands in different categories across the two files

**File:** `docs/cheatsheet.md` vs `docs/COMMAND_REFERENCE.md`  
**Issue:** The two documents disagree on which category 5 commands belong to:

| Command | Cheatsheet | COMMAND_REFERENCE |
|---------|-----------|-------------------|
| `pd:research` | Debug | Planning |
| `pd:fetch-doc` | Utility | Planning |
| `pd:update` | Utility | Planning |
| `pd:conventions` | Utility | Debug |
| `pd:sync-version` | Utility | Project |

A reader using one document as a reference and the other for context will not find commands where they expect them. The category structure should be identical in both files.

**Fix:** Standardize both files to one agreed category structure. COMMAND_REFERENCE's grouping is more semantically coherent (research/fetch-doc/update grouped under Planning where they are used; conventions under Debug where it is used for investigation). Recommend aligning cheatsheet to match COMMAND_REFERENCE's categories.

---

_Reviewed: 2026-04-04_  
_Reviewer: gsd-code-reviewer_  
_Depth: standard_
