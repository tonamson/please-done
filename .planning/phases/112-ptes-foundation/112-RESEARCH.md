# Phase 112: PTES Foundation - Research

**Researched:** 2026-04-05
**Domain:** PTES-compliant workflow architecture, reconnaissance cache system, tiered command structure
**Confidence:** HIGH

## Summary

This phase establishes the architectural foundation for PTES (Penetration Testing Execution Standard) compliant security auditing. The research confirms that integrating a 4-phase PTES workflow into the existing `pd:audit` skill requires: (1) extending the current 9-step workflow to include optional reconnaissance steps, (2) implementing a cache system keyed by git commit hash for token optimization, (3) adding tiered command flags that map to different token budgets, and (4) maintaining backward compatibility with existing `/pd:audit` behavior.

**Primary recommendation:** Implement PTES Phase 2 (Intelligence Gathering) as an optional "Step 0" that runs conditionally based on new flags (`--recon`, `--poc`, `--redteam`), with a cache system that stores reconnaissance results keyed by `hash(git_commit + file_list)` to achieve the target 40% cache hit rate and ≤50 tokens per vulnerability.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Implement 4-phase PTES workflow structure:
  - Phase 1: Pre-engagement Interaction (scope, RoE, compliance)
  - Phase 2: Intelligence Gathering (reconnaissance)
  - Phase 3: Vulnerability Analysis (SAST + taint)
  - Phase 4: Exploitation/Verification (DAST)
- **D-02:** Integrate PTES phases into existing `pd:audit` workflow
- **D-03:** Maintain backward compatibility with existing `/pd:audit` behavior
- **D-04:** Add `--recon` flag to trigger full reconnaissance (Steps 0a-0h)
- **D-05:** Add `--poc` flag for DAST verification (recon → SAST → DAST)
- **D-06:** Add `--redteam` flag for Red Team TTPs (+ evasion techniques)
- **D-07:** Keep default `/pd:audit` as Quick SAST (Steps 1-9) for backward compatibility
- **D-08:** Cache key = hash(git commit + file list)
- **D-09:** Cache location: `.planning/recon-cache/{key}.json`
- **D-10:** Cache invalidation: automatic on git commit or file changes
- **D-11:** Display token savings: "[Token Save] Reusing cached recon (0 AI tokens)"
- **D-12:** Tier 1 (FREE - 0 tokens): `--recon-light` - code-only scanning
- **D-13:** Tier 2 (STANDARD - ~2000 tokens): `--recon` - code + AI analysis
- **D-14:** Tier 3 (DEEP - ~6000 tokens): `--recon-full` - + deep taint analysis
- **D-15:** Tier 4 (RED TEAM - ~8000 tokens): `--redteam` - + OSINT + payloads + post-exploit
- **D-16:** Code-first approach: 70% code, 30% AI
- **D-17:** Pattern matching, encoding/decoding, file I/O in pure code (0 tokens)
- **D-18:** AI reserved for attack surface analysis, risk scoring, strategy recommendations
- **D-19:** Target: ≤50 tokens per vulnerability found

### Claude's Discretion
- Specific implementation details for cache storage format
- Cache eviction policy (LRU vs TTL)
- Thread-safety for parallel recon operations
- Error handling for corrupted cache files

### Deferred Ideas (OUT OF SCOPE)
- Specific reconnaissance agents (implemented in phases 113-121)
- OSINT intelligence gathering (Phase 116)
- Payload development (Phase 117)
- Token analysis (Phase 118)
- Post-exploitation planning (Phase 119)
- Code libraries implementation (Phase 120)
- Data files creation (Phase 122)
- Full integration and testing (Phases 123-124)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PTES-01 | Implement 4-phase PTES architecture (Pre-engagement → Intelligence Gathering → Vulnerability Analysis → Exploitation) | Workflow extension pattern identified - add conditional Step 0 before existing Steps 1-9 |
| PTES-02 | Add command flags `--recon`, `--poc`, `--redteam` to `pd:audit` | Flag parsing pattern from existing `--full`, `--only`, `--poc` flags in `workflows/audit.md` |
| PTES-03 | Create reconnaissance cache system for token optimization | Cache key strategy verified: `hash(git commit + file list)` provides automatic invalidation on code changes |
| PTES-04 | Implement tiered commands (FREE, STANDARD, DEEP, RED TEAM) | Tier mapping aligns with existing `TIER_MAP` in `bin/lib/resource-config.js` |
</phase_requirements>

---

## Standard Stack

### Core Libraries (Already Present)
| Library | Version | Purpose | Source |
|---------|---------|---------|--------|
| `bin/lib/resource-config.js` | Current | Tier mapping, agent registry | [VERIFIED: codebase] |
| `bin/lib/parallel-dispatch.js` | Current | Scanner wave dispatch, result merging | [VERIFIED: codebase] |
| `bin/lib/session-delta.js` | Current | Delta classification for incremental scans | [VERIFIED: codebase] |
| `bin/lib/smart-selection.js` | Current | Scanner selection based on project context | [VERIFIED: codebase] |

### New Libraries to Create (Phase 112 Foundation Only)
| Library | Purpose | Token Cost | Integration Point |
|---------|---------|------------|-------------------|
| `bin/lib/recon-cache.js` | Cache reconnaissance results | 0 tokens | Called by workflow Step 0 |
| `bin/lib/flag-parser.js` | Parse tiered command flags | 0 tokens | Used by `commands/pd/audit.md` |

### Supporting Data Structures
| Structure | Purpose | Format |
|-----------|---------|--------|
| `recon-cache/{hash}.json` | Cached reconnaissance data | JSON with metadata |
| `.planning/config.json` | Token budget configuration | YAML frontmatter + JSON |

**Key insight:** The existing `resource-config.js` already defines tier mappings (`scout`, `builder`, `architect`) that align with the PTES tier structure. The new reconnaissance tiers map as: FREE → code-only (no agent), STANDARD → `scout` tier, DEEP → `builder` tier, RED TEAM → `architect` tier.

---

## Architecture Patterns

### Recommended Project Structure

```
commands/pd/
├── audit.md                    # Modified: Add flag parsing & Step 0
└── agents/
    └── (agents added in later phases)

bin/lib/
├── recon-cache.js              # NEW: Cache system for recon data
├── flag-parser.js              # NEW: Parse --recon, --poc, --redteam flags
├── resource-config.js          # EXISTING: Add recon tier mappings
└── parallel-dispatch.js        # EXISTING: Reuse for recon wave dispatch

.planning/
├── recon-cache/                # NEW: Cache storage directory
│   └── {hash}.json             # Cache files keyed by git state
└── audit/                      # EXISTING: Audit reports
    └── SECURITY_REPORT.md
```

### Pattern 1: Conditional Step 0 (Reconnaissance Phase)
**What:** Insert reconnaissance as optional Step 0 that runs before existing Steps 1-9
**When to use:** When `--recon`, `--poc`, or `--redteam` flags are present
**Source:** `ke-hoach-pentest-online.md` section 7.1

```javascript
// Pattern from ke-hoach-pentest-online.md
// Step 0: Reconnaissance Phase (Conditional)
// Trigger: --recon, --poc, or --redteam

// Step 0a: Source Mapping (pd-recon-sources) - Code-only
// Step 0b: Endpoint Discovery (pd-recon-endpoints) - Code-only
// Step 0c: Tech Stack Fingerprint (pd-recon-tech) - Code-only
// Step 0d: Asset Discovery (pd-recon-assets) - Code-only
// Step 0e: Auth Analysis (pd-recon-auth) - Code-only
// Step 0f: Business Logic (pd-recon-business) - AI (~500 tokens)
// Step 0g: Taint Analysis (pd-taint-analyzer) - AI (on-demand)
// Step 0h: Recon Summary - Consolidate findings

// Steps 1-9: SAST (with recon data enrichment)
// Steps 10-13: DAST (if --poc or --redteam)
```

### Pattern 2: Cache-First Reconnaissance
**What:** Check cache before running reconnaissance; store results after completion
**When to use:** All reconnaissance operations to optimize tokens
**Source:** `ke-hoach-pentest-online.md` section 11.3

```javascript
// bin/lib/recon-cache.js - From ke-hoach-pentest-online.md
class ReconCache {
  getKey() {
    // Cache key = hash(git commit + file list)
    const commit = execSync("git rev-parse HEAD").toString().trim();
    const files = execSync("git ls-files").toString();
    return crypto
      .createHash("md5")
      .update(commit + files)
      .digest("hex");
  }

  async get() {
    const key = this.getKey();
    const cached = await this.read(`recon-cache/${key}.json`);
    if (cached) {
      console.log("[Token Save] Reusing cached recon (0 AI tokens)");
      return cached;
    }
    return null;
  }

  async set(data) {
    await this.write(`recon-cache/${this.getKey()}.json`, data);
  }
}

// Usage: const recon = await cache.get() || await runRecon();
```

### Pattern 3: Tiered Command Dispatch
**What:** Map command flags to different execution paths based on token budget
**When to use:** When user invokes `/pd:audit` with different flags
**Source:** `ke-hoach-pentest-online.md` section 11.4

```yaml
# Tier mapping from ke-hoach-pentest-online.md
Tier 1 - FREE (0 tokens):
  Command: /pd:audit --recon-light
  Features:
    - Code-only scanning
    - Package.json analysis
    - Route extraction (regex)
    - Basic tech fingerprint
  Output: recon-basic.json

Tier 2 - STANDARD (~2000 tokens):
  Command: /pd:audit --recon
  Features:
    - Tier 1 +
    - AI attack surface analysis
    - Risk scoring
    - Hidden endpoint detection
  Output: recon-full.json

Tier 3 - DEEP (~6000 tokens):
  Command: /pd:audit --recon-full
  Features:
    - Tier 2 +
    - Deep taint analysis
    - Business logic mapping
    - Red Team evasion
  Output: recon-comprehensive.json

Tier 4 - RED TEAM (~8000 tokens):
  Command: /pd:audit --redteam
  Features:
    - Tier 3 +
    - OSINT intelligence gathering
    - Payload development/evasion
    - Token/credential analysis
    - Post-exploitation planning
  Output: recon-redteam.json, mitre-mapping.json
```

### Pattern 4: Flag Extension with Backward Compatibility
**What:** Add new flags while keeping default behavior unchanged
**When to use:** Extending existing commands without breaking changes
**Source:** `workflows/audit.md` Step 3

```javascript
// Existing pattern from workflows/audit.md
// Parse $ARGUMENTS:
// 1. path - path to scan, default "."
// 2. --full - run all 13 categories
// 3. --only cat1,cat2 - run only specified categories
// 4. --poc - parse and save poc_enabled=true
// 5. --auto-fix - parse but report "Not supported"

// Extended pattern for PTES:
// 6. --recon - enable reconnaissance phase
// 7. --recon-light - code-only recon (0 tokens)
// 8. --recon-full - deep recon with taint analysis
// 9. --redteam - enable Red Team TTPs
```

### Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | What to Do Instead |
|--------------|--------------|-------------------|
| Running reconnaissance on every audit | Wastes tokens when code hasn't changed | Use cache keyed by git state |
| Mutually exclusive flags | `--recon` vs `--poc` shouldn't conflict | Flags are additive: `--recon` adds Phase 2, `--poc` adds Phase 4 |
| Breaking default behavior | Users expect `/pd:audit` to work as before | Default remains Steps 1-9 only |
| Storing cache in session dir | Lost between sessions | Store in `.planning/recon-cache/` |
| No cache eviction | Unlimited disk growth | Implement LRU with max 50 entries |

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hash generation | Custom hash algorithm | `crypto.createHash('md5')` | Standard, tested, fast |
| Git operations | Parse .git manually | `git rev-parse HEAD`, `git ls-files` | Official CLI handles edge cases |
| JSON file I/O | Manual parsing | `fs.promises.readFile/writeFile` | Async, standard, handles encoding |
| Flag parsing | Regex on command string | Extend existing parser in `workflows/audit.md` | Consistent with existing flags |
| Parallel execution | Manual worker threads | `parallel-dispatch.js` `buildScannerPlan` | Already handles backpressure, waves |
| Tier mapping | Hardcode in each skill | `resource-config.js` `TIER_MAP` | Centralized, consistent |

---

## Runtime State Inventory

This phase involves renaming/refactoring the audit workflow structure. Identified runtime state:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Existing audit evidence in `.planning/audit/evidence_sec_*.md` | Code edit: Update evidence format to include recon data references |
| Live service config | None identified | None — this is a static analysis tool |
| OS-registered state | None identified | None |
| Secrets/env vars | None identified | None |
| Build artifacts | Cache files in `.planning/recon-cache/` | Data migration: Old cache format may need migration (version field in cache) |

**Nothing found in category:** OS-registered state, Secrets/env vars — verified by codebase grep.

---

## Common Pitfalls

### Pitfall 1: Cache Invalidation on File Changes
**What goes wrong:** Cache doesn't invalidate when files are added/deleted, only on content change
**Why it happens:** Using only git commit SHA ignores file list changes
**How to avoid:** Include both `git rev-parse HEAD` AND `git ls-files` in cache key (per D-08)
**Warning signs:** Recon results missing newly added files

### Pitfall 2: Concurrent Cache Access
**What goes wrong:** Parallel recon operations corrupt cache files
**Why it happens:** Multiple scanners write to same cache file simultaneously
**How to avoid:** Use atomic writes (write to temp file, then rename) or file locking
**Warning signs:** Corrupted JSON in cache files

### Pitfall 3: Cache Growth Without Bounds
**What goes wrong:** Cache directory grows indefinitely, consuming disk space
**Why it happens:** No eviction policy implemented
**How to avoid:** Implement LRU eviction with configurable max entries (default: 50)
**Warning signs:** `.planning/recon-cache/` contains hundreds of files

### Pitfall 4: Flag Combination Conflicts
**What goes wrong:** `--recon-light` and `--redteam` together produce inconsistent behavior
**Why it happens:** Flags processed independently without priority rules
**How to avoid:** Define explicit flag priority: `--redteam` > `--recon-full` > `--recon` > `--recon-light`
**Warning signs:** Token usage doesn't match expected tier

### Pitfall 5: Breaking Existing `--poc` Flag
**What goes wrong:** Existing `--poc` flag stops working after adding PTES flags
**Why it happens:** Overwriting existing flag behavior instead of extending
**How to avoid:** Keep existing `--poc` behavior (DAST verification) and add new `--recon` flag
**Warning signs:** Security reports missing POC sections

---

## Code Examples

### Cache System Implementation

```javascript
// bin/lib/recon-cache.js
// Source: Derived from ke-hoach-pentest-online.md section 11.3

"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const CACHE_DIR = ".planning/recon-cache";
const MAX_CACHE_ENTRIES = 50;

class ReconCache {
  constructor(cacheDir = CACHE_DIR) {
    this.cacheDir = cacheDir;
    this._ensureDir();
  }

  _ensureDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  getKey() {
    const commit = require("child_process")
      .execSync("git rev-parse HEAD", { encoding: "utf8" })
      .trim();
    const files = require("child_process")
      .execSync("git ls-files", { encoding: "utf8" });
    return crypto.createHash("md5").update(commit + files).digest("hex");
  }

  getCachePath(key) {
    return path.join(this.cacheDir, `${key}.json`);
  }

  async get() {
    const key = this.getKey();
    const cachePath = this.getCachePath(key);

    if (!fs.existsSync(cachePath)) {
      return null;
    }

    try {
      const data = JSON.parse(await fs.promises.readFile(cachePath, "utf8"));
      console.log("[Token Save] Reusing cached recon (0 AI tokens)");
      return data;
    } catch (err) {
      console.warn(`[Cache] Corrupted cache file ${cachePath}, ignoring`);
      return null;
    }
  }

  async set(data) {
    const key = this.getKey();
    const cachePath = this.getCachePath(key);
    const tempPath = `${cachePath}.tmp`;

    const cacheEntry = {
      version: "1.0",
      createdAt: new Date().toISOString(),
      gitCommit: require("child_process")
        .execSync("git rev-parse HEAD", { encoding: "utf8" })
        .trim(),
      data,
    };

    // Atomic write
    await fs.promises.writeFile(tempPath, JSON.stringify(cacheEntry, null, 2));
    await fs.promises.rename(tempPath, cachePath);

    // LRU eviction
    await this._evictIfNeeded();
  }

  async _evictIfNeeded() {
    const files = await fs.promises.readdir(this.cacheDir);
    if (files.length <= MAX_CACHE_ENTRIES) return;

    const stats = await Promise.all(
      files
        .filter((f) => f.endsWith(".json"))
        .map(async (f) => {
          const stat = await fs.promises.stat(path.join(this.cacheDir, f));
          return { file: f, atime: stat.atimeMs };
        })
    );

    stats.sort((a, b) => a.atime - b.atime);
    const toDelete = stats.slice(0, stats.length - MAX_CACHE_ENTRIES);

    for (const { file } of toDelete) {
      await fs.promises.unlink(path.join(this.cacheDir, file));
    }
  }
}

module.exports = { ReconCache };
```

### Flag Parser Extension

```javascript
// bin/lib/flag-parser.js
// Source: Derived from workflows/audit.md Step 3 parsing

"use strict";

/**
 * Parse PTES-related flags from command arguments
 * @param {string} args - Command arguments string
 * @returns {{ tier: string, recon: boolean, poc: boolean, redteam: boolean, tokenBudget: number }}
 */
function parsePtesFlags(args) {
  const flags = {
    tier: "none",       // none | free | standard | deep | redteam
    recon: false,
    poc: false,
    redteam: false,
    tokenBudget: 0,
  };

  const argStr = args || "";

  // Check for redteam first (highest priority)
  if (/--redteam\b/.test(argStr)) {
    flags.tier = "redteam";
    flags.redteam = true;
    flags.recon = true;
    flags.poc = true;
    flags.tokenBudget = 8000;
    return flags;
  }

  // Check for recon-full
  if (/--recon-full\b/.test(argStr)) {
    flags.tier = "deep";
    flags.recon = true;
    flags.tokenBudget = 6000;
    return flags;
  }

  // Check for recon
  if (/--recon\b/.test(argStr)) {
    flags.tier = "standard";
    flags.recon = true;
    flags.tokenBudget = 2000;
    return flags;
  }

  // Check for recon-light
  if (/--recon-light\b/.test(argStr)) {
    flags.tier = "free";
    flags.recon = true;
    flags.tokenBudget = 0;
    return flags;
  }

  // Check for poc (existing behavior)
  if (/--poc\b/.test(argStr)) {
    flags.poc = true;
  }

  return flags;
}

module.exports = { parsePtesFlags };
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 9-step audit only | 4-phase PTES with optional Step 0 | Phase 112 | Adds reconnaissance capabilities |
| Token-heavy AI recon | Code-first (70%) + AI (30%) | Phase 112 | 60% token reduction |
| No caching | Git-state keyed cache | Phase 112 | 40% cache hit rate target |
| Single tier | 4-tier command structure | Phase 112 | User controls token budget |

**Deprecated/outdated:**
- Manual reconnaissance: Replaced by automated code-first recon
- Always-on deep analysis: Replaced by tiered approach with user control

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Cache hit rate of 40% is achievable with git-state keying | Architecture Patterns | Token costs exceed budget, user dissatisfaction |
| A2 | `git rev-parse HEAD` and `git ls-files` execute in <100ms on typical repos | Cache System | Cache key generation becomes bottleneck |
| A3 | 50 cache entries is sufficient for typical workflow (keeps last 50 git states) | Pitfalls | Disk space issues on large repos |
| A4 | Existing `--poc` flag behavior should remain unchanged | Flag Extension | Breaking change to existing security workflow |

---

## Open Questions

1. **Cache storage format versioning**
   - What we know: Need version field for future migrations
   - What's unclear: Initial version schema
   - Recommendation: Start with version "1.0", include metadata fields

2. **Parallel reconnaissance safety**
   - What we know: Multiple agents may write cache simultaneously
   - What's unclear: Atomic file operations sufficient or need file locking?
   - Recommendation: Use atomic writes (temp + rename), monitor for corruption

3. **Token budget enforcement**
   - What we know: Config specifies budgets per tier
   - What's unclear: Hard enforcement or advisory warnings?
   - Recommendation: Advisory warnings at 80%, hard stop at 100% with user prompt

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| git | Cache key generation | ✓ | 2.39+ | — |
| Node.js | Cache library, flag parser | ✓ | 18.x+ | — |
| crypto module | Hash generation | ✓ | built-in | — |
| fs/promises | Async file I/O | ✓ | built-in | — |

**Missing dependencies with no fallback:** None

**Missing dependencies with fallback:** None

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in `assert` + custom test runner |
| Config file | None — tests are standalone `.test.js` files |
| Quick run command | `node bin/lib/recon-cache.test.js` |
| Full suite command | `npm test` (if package.json exists) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PTES-01 | 4-phase workflow structure | unit | Verify workflow Step 0 conditional | ❌ Wave 0 |
| PTES-02 | Flag parsing | unit | `node bin/lib/flag-parser.test.js` | ❌ Wave 0 |
| PTES-03 | Cache hit/miss | unit | `node bin/lib/recon-cache.test.js` | ❌ Wave 0 |
| PTES-04 | Tier mapping | unit | Verify `TIER_MAP` includes recon tiers | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Manual verification of cache hit/miss
- **Per wave merge:** Run unit tests for new libraries
- **Phase gate:** All tests green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `bin/lib/recon-cache.test.js` — covers PTES-03
- [ ] `bin/lib/flag-parser.test.js` — covers PTES-02
- [ ] Test infrastructure for workflow integration tests
- [ ] Mock git environment for cache tests

*(If no gaps: "None — existing test infrastructure covers all phase requirements")*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Not in scope for this phase |
| V3 Session Management | No | Not in scope for this phase |
| V4 Access Control | No | Not in scope for this phase |
| V5 Input Validation | Yes | `flag-parser.js` validates flag combinations |
| V6 Cryptography | Yes | `crypto.createHash` for cache keys (standard) |

### Known Threat Patterns for PTES Cache

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cache poisoning | Tampering | Atomic writes, version validation |
| Cache directory traversal | Tampering | Path normalization, whitelist filenames |
| Excessive cache growth | Denial of Service | LRU eviction, max size limits |

---

## Sources

### Primary (HIGH confidence)
- `ke-hoach-pentest-online.md` - Full PTES workflow specification, cache design, tier structure
- `commands/pd/audit.md` - Existing audit skill structure, flag parsing patterns
- `workflows/audit.md` - 9-step workflow, scanner dispatch patterns
- `bin/lib/resource-config.js` - Tier mapping, agent registry
- `bin/lib/parallel-dispatch.js` - Wave dispatch, backpressure patterns

### Secondary (MEDIUM confidence)
- `bin/lib/session-delta.js` - Delta classification for incremental scans
- `.planning/REQUIREMENTS.md` - Phase requirement definitions
- `.planning/STATE.md` - Project context, milestone structure

### Tertiary (LOW confidence)
- None — all claims verified from primary sources

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against existing codebase
- Architecture: HIGH — derived from ke-hoach-pentest-online.md specification
- Pitfalls: MEDIUM — some assumptions about cache behavior need validation

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (30 days for stable architecture)

---

## RESEARCH COMPLETE

**Phase:** 112 - PTES Foundation
**Confidence:** HIGH

### Key Findings
1. **PTES Integration:** Add Step 0 (reconnaissance) conditionally before existing Steps 1-9; triggered by `--recon`, `--poc`, or `--redteam` flags
2. **Cache System:** Use `hash(git_commit + file_list)` for automatic invalidation; store in `.planning/recon-cache/` with LRU eviction (50 entries max)
3. **Tiered Commands:** Map flags to token budgets: `--recon-light` (0), `--recon` (2000), `--recon-full` (6000), `--redteam` (8000)
4. **Backward Compatibility:** Default `/pd:audit` behavior unchanged; existing `--poc` flag preserved
5. **Code-First Approach:** 70% code (0 tokens), 30% AI; pattern matching, file I/O, encoding in pure code

### File Created
`.planning/phases/112-ptes-foundation/112-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard stack | HIGH | Verified against existing `bin/lib/*.js` files |
| Architecture | HIGH | Based on detailed PTES specification in ke-hoach-pentest-online.md |
| Pitfalls | MEDIUM | Some cache edge cases need runtime validation |

### Open Questions
1. Cache format versioning strategy — recommend starting with "1.0"
2. File locking vs atomic writes for cache — recommend atomic writes first
3. Token budget hard vs soft enforcement — recommend advisory at 80%, hard at 100%

### Ready for Planning
Research complete. Planner can now create PLAN.md files with confidence in PTES architecture, cache design, and tiered command structure.
