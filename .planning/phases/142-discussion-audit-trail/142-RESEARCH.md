# Phase 142: Discussion Audit Trail - Research

**Researched:** 2026-04-07
**Domain:** Context persistence, Markdown with YAML frontmatter, CLI search/filtering
**Confidence:** HIGH

## Summary

Phase 142 implements automatic storage of distilled discussion summaries and a `pd:audit` command for searching/viewing them. The architecture is straightforward: inject a capture hook into the existing `discuss-phase.md` workflow's `write_context` step, store markdown files with YAML frontmatter in `.planning/contexts/`, and provide a pure-function library for search operations.

The codebase already has all necessary patterns: `js-yaml` for YAML parsing (already installed), `stats-collector.js`/`health-checker.js` for pure function patterns, and `dashboard-renderer.js` for boxed table output. The discuss-phase workflow has a clear injection point after CONTEXT.md is written.

**Primary recommendation:** Follow the existing pure-function pattern from health-checker.js — zero fs I/O in library, content passed as parameters. Reuse js-yaml for frontmatter parsing, dashboard-renderer patterns for output formatting.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Markdown files with YAML frontmatter — consistent with all other `.planning/` files
- **D-02:** Filename convention: `{phase}-{YYYY-MM-DD}.md` (e.g., `142-2026-04-07.md`)
- **D-03:** Content: distilled summary only — key decisions, 10-15 lines, NOT full Q&A
- **D-04:** Auto-generated at end of discuss-phase workflow — zero friction
- **D-05:** Distilled content includes: phase number, phase name, date, key decisions, next step
- **D-06:** New `pd:audit` command — dedicated skill file at `commands/pd/audit.md`
- **D-07:** Three modes: default (list), `--search`/`--phase` (filter), `--view` (display)
- **D-08:** Three filter types: keyword (substring), phase number (exact), date range (`--from`/`--to`)
- **D-09:** Multiple filters can be combined

### Agent's Discretion
- Exact YAML frontmatter fields (phase, date, decisions count, next_step, tags)
- Boxed table column layout for list view
- `--json` flag for machine-readable output
- Library file structure and function signatures
- Whether to support `--limit N` for list truncation

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| L-06 | Track conversation history across sessions, store summaries in `.planning/contexts/`, enable context restoration, support search | Pure function library pattern, js-yaml for parsing, glob for file discovery, substring/exact match search |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| js-yaml | 4.1.1 | Parse YAML frontmatter | Already installed, widely used |
| node:fs | built-in | File I/O (skill file only) | Standard Node.js |
| node:path | built-in | Path manipulation | Standard Node.js |
| node:test | built-in | Unit testing | Project TDD standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| glob | installed | Find files by pattern | Discovery of context files |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| js-yaml | gray-matter | gray-matter is heavier; js-yaml already in deps |
| Custom date parsing | date-fns | Overkill for ISO date comparison |

**Installation:**
```bash
# No new packages needed — js-yaml already installed
```

**Version verification:** Verified against registry on 2026-04-07:
- js-yaml@4.1.1 — current (published 2025-09-22)

## Architecture Patterns

### Recommended Project Structure
```
bin/lib/
├── audit-trail.js       # Pure functions (no fs I/O)
├── audit-trail.test.js  # TDD tests (node:test)
commands/pd/
└── audit.md             # Skill file
.planning/
└── contexts/            # Auto-created on first capture
    └── {phase}-{YYYY-MM-DD}.md  # Distilled summaries
```

### Pattern 1: Pure Function Library (from health-checker.js)
**What:** Library exports pure functions — all file content passed as parameters, zero fs imports
**When to use:** Any library that processes planning files
**Example:**
```javascript
// Source: bin/lib/health-checker.js pattern
'use strict';

/**
 * Parse a context file's YAML frontmatter and body.
 * @param {string} content - Raw file content
 * @returns {{ frontmatter: object, body: string, decisions: string[] }}
 */
function parseContextFile(content) {
  if (!content || typeof content !== 'string') {
    return { frontmatter: {}, body: '', decisions: [] };
  }
  // ... parse logic
}

module.exports = { parseContextFile, /* ... */ };
```

### Pattern 2: Frontmatter Structure
**What:** YAML frontmatter at top of markdown for metadata
**When to use:** All planning files for consistent parsing
**Example:**
```yaml
---
phase: 142
phase_name: Discussion Audit Trail
date: 2026-04-07
decision_count: 5
next_step: /gsd-plan-phase 142
tags:
  - context-persistence
  - audit-trail
---

## Key Decisions

- D-01: Markdown with YAML frontmatter storage
- D-02: ...
```

### Pattern 3: Skill File Structure (from pd:discover)
**What:** Read-only skill with allowed-tools: Read, Glob, Bash
**When to use:** Diagnostic/query commands that don't modify files
**Example:**
```yaml
---
name: pd:audit
description: View and search discussion context audit trail
model: haiku
argument-hint: "[--phase N] [--search keyword] [--from DATE] [--to DATE] [--view N] [--json]"
allowed-tools:
  - Read
  - Glob
  - Bash
---
```

### Anti-Patterns to Avoid
- **fs I/O in library:** Never import `fs` in `bin/lib/audit-trail.js` — skill file handles I/O
- **Regex for YAML parsing:** Use js-yaml, not regex — handles edge cases
- **Full Q&A storage:** Only store distilled decisions — full log stays in DISCUSSION-LOG.md

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML parsing | Custom regex parser | js-yaml | Edge cases (multiline, quotes, escapes) |
| Date comparison | Manual string comparison | ISO string comparison | ISO dates are lexicographically comparable |
| Table formatting | Custom padding logic | Reuse dashboard-renderer.js patterns | Consistency with pd:stats, pd:health |
| Flag parsing | Custom arg parser | Tokenize on whitespace, exact match | flag-parser.js pattern already works |

**Key insight:** The project already solved these problems — reuse existing patterns from stats-collector.js, health-checker.js, and flag-parser.js.

## Common Pitfalls

### Pitfall 1: Creating contexts/ directory at wrong time
**What goes wrong:** Directory created in library module or at import time
**Why it happens:** Developer puts `mkdirSync` in module scope
**How to avoid:** Create directory only in skill file, only when writing first context
**Warning signs:** Tests fail in clean environment, directory appears without running workflow

### Pitfall 2: Storing full Q&A instead of distilled summary
**What goes wrong:** Context files grow to hundreds of lines, defeating resume purpose
**Why it happens:** Copy-pasting DISCUSSION-LOG.md content
**How to avoid:** Enforce 10-15 line max in distillation logic; one line per decision
**Warning signs:** Context files > 50 lines, duplicate content with DISCUSSION-LOG.md

### Pitfall 3: Overwriting same-day context on multiple sessions
**What goes wrong:** Second discuss-phase run overwrites morning's context
**Why it happens:** Filename only includes date, not time
**How to avoid:** Decision D-02 uses date only — acceptable if user runs discuss once per phase per day. If collision occurs, either append timestamp or use `{phase}-{date}-{N}.md` pattern
**Warning signs:** Context count doesn't match discuss-phase run count

### Pitfall 4: Search matching frontmatter instead of decisions
**What goes wrong:** Keyword search matches YAML keys like "phase:" or "date:"
**Why it happens:** Searching entire file content instead of body/decisions only
**How to avoid:** Parse frontmatter separately from body, search body only for keywords
**Warning signs:** Irrelevant matches, "2026" matching all files with date frontmatter

## Code Examples

Verified patterns from project codebase:

### Frontmatter Parsing (similar to STATE.md parsing)
```javascript
// Source: bin/lib/stats-collector.js pattern
const yaml = require('js-yaml');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { frontmatter: {}, body: content };
  
  try {
    const frontmatter = yaml.load(match[1]) || {};
    const body = content.slice(match[0].length).trim();
    return { frontmatter, body };
  } catch (e) {
    return { frontmatter: {}, body: content };
  }
}
```

### Boxed Table Output (from health-checker.js)
```javascript
// Source: bin/lib/health-checker.js pattern
function formatAuditList(contexts) {
  const W = 70;
  const lines = [];
  
  lines.push(`╔${'═'.repeat(W)}╗`);
  lines.push(`║ ${padRight('DISCUSSION CONTEXTS', W - 1)}║`);
  lines.push(`║ ${padRight('─'.repeat(W - 2), W - 1)}║`);
  
  for (const ctx of contexts) {
    lines.push(`║ ${padRight(`Phase ${ctx.phase}: ${ctx.phaseName}`, W - 1)}║`);
    lines.push(`║ ${padRight(`  Date: ${ctx.date} | Decisions: ${ctx.decisionCount}`, W - 1)}║`);
  }
  
  lines.push(`╚${'═'.repeat(W)}╝`);
  return lines.join('\n');
}
```

### Flag Parsing (from flag-parser.js pattern)
```javascript
// Source: bin/lib/flag-parser.js pattern
function parseAuditFlags(args) {
  const tokens = (args || '').trim().split(/\s+/).filter(Boolean);
  const has = (flag) => tokens.includes(flag);
  const getValue = (flag) => {
    const idx = tokens.indexOf(flag);
    return idx >= 0 && idx + 1 < tokens.length ? tokens[idx + 1] : null;
  };
  
  return {
    json: has('--json'),
    phase: getValue('--phase'),
    search: getValue('--search'),
    from: getValue('--from'),
    to: getValue('--to'),
    view: getValue('--view'),
    limit: parseInt(getValue('--limit')) || 20
  };
}
```

### Distilled Summary Generation (for workflow hook)
```javascript
// Pattern for discuss-phase.md injection
// After writing CONTEXT.md, extract and store distilled version

function distillContext(contextContent, phaseNum, phaseName) {
  const { frontmatter, body } = parseFrontmatter(contextContent);
  
  // Extract decisions section
  const decisionsMatch = body.match(/<decisions>([\s\S]*?)<\/decisions>/);
  const decisionsBlock = decisionsMatch ? decisionsMatch[1] : '';
  
  // Extract individual D-NN decisions
  const decisions = [];
  const decisionRegex = /\*\*D-\d+:\*\*\s*(.+)/g;
  let match;
  while ((match = decisionRegex.exec(decisionsBlock)) !== null) {
    decisions.push(match[1].trim());
  }
  
  return {
    phase: phaseNum,
    phaseName,
    date: new Date().toISOString().split('T')[0],
    decisions,
    decisionCount: decisions.length,
    nextStep: `/gsd-plan-phase ${phaseNum}`
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual context files | Auto-generated from discuss-phase | This phase | Zero-friction persistence |
| Grep for search | Structured YAML + search lib | This phase | Reliable filtering |

**Deprecated/outdated:**
- None — this is a new feature

## Open Questions

1. **Same-day collision handling**
   - What we know: Filename is `{phase}-{date}.md`, multiple runs same day will collide
   - What's unclear: Overwrite, append timestamp, or error?
   - Recommendation: Overwrite is acceptable — user runs discuss-phase once per phase per day; if re-running, the newer context is more relevant

2. **Auto-cleanup of old contexts**
   - What we know: Contexts will accumulate over time
   - What's unclear: Should there be a retention limit?
   - Recommendation: Out of scope for this phase — contexts are small, can address later if needed

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| js-yaml | YAML parsing | ✓ | 4.1.1 | — |
| node:test | Unit tests | ✓ | built-in | — |
| node:fs | File I/O | ✓ | built-in | — |
| glob | File discovery | ✓ | installed | — |

**Missing dependencies with no fallback:** None

**Missing dependencies with fallback:** None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test + node:assert/strict |
| Config file | none — no config needed |
| Quick run command | `node test/audit-trail.test.js` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| L-06a | Parse context file frontmatter | unit | `node test/audit-trail.test.js` | ❌ Wave 0 |
| L-06b | List contexts chronologically | unit | `node test/audit-trail.test.js` | ❌ Wave 0 |
| L-06c | Filter by keyword | unit | `node test/audit-trail.test.js` | ❌ Wave 0 |
| L-06d | Filter by phase number | unit | `node test/audit-trail.test.js` | ❌ Wave 0 |
| L-06e | Filter by date range | unit | `node test/audit-trail.test.js` | ❌ Wave 0 |
| L-06f | Format boxed table output | unit | `node test/audit-trail.test.js` | ❌ Wave 0 |
| L-06g | Format JSON output | unit | `node test/audit-trail.test.js` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `node test/audit-trail.test.js`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `test/audit-trail.test.js` — covers L-06a through L-06g
- [ ] `bin/lib/audit-trail.js` — library implementation
- [ ] `commands/pd/audit.md` — skill file

## Sources

### Primary (HIGH confidence)
- `bin/lib/health-checker.js` — Pure function library pattern
- `bin/lib/stats-collector.js` — YAML frontmatter parsing pattern
- `bin/lib/dashboard-renderer.js` — Boxed table formatting
- `bin/lib/flag-parser.js` — Flag parsing pattern
- `test/health-checker.test.js` — TDD test structure
- `commands/pd/discover.md` — Most recent read-only skill file
- `~/.copilot/get-shit-done/workflows/discuss-phase.md` — Workflow injection point

### Secondary (MEDIUM confidence)
- js-yaml npm documentation — YAML parsing API

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies already installed, patterns well-established
- Architecture: HIGH — direct reuse of existing patterns
- Pitfalls: HIGH — based on observed codebase patterns and edge cases

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (30 days — stable domain)
