# Phase 9: Converter Pipeline Optimization - Research

**Researched:** 2026-03-22
**Domain:** Node.js refactoring -- template method pattern, error propagation, snapshot testing
**Confidence:** HIGH

## Summary

Phase 9 addresses two requirements: INST-01 (base converter extraction) and INST-02 (error propagation). The 4 converter files (codex.js 167 lines, copilot.js 147 lines, gemini.js 102 lines, opencode.js 71 lines = 487 total) share ~80% identical logic: frontmatter parsing, workflow inlining, path replacement, tool name mapping, MCP tool conversion, and frontmatter rebuilding. Each converter reimplements this pipeline independently with platform-specific data.

The error handling scope covers 8 specific silent `catch {}` blocks across manifest.js (3 locations), installers/claude.js (2 locations), and installers/gemini.js (1 location), plus 2 locations with acceptable logging already in place. The decision framework classifies errors as hard (re-throw) or soft (log+continue).

Verification uses snapshot testing: capture all 4 converters x 12 skills = 48 output snapshots BEFORE refactoring, then compare AFTER to prove zero behavioral change. Existing test infrastructure (249 tests, node:test runner) provides a solid foundation.

**Primary recommendation:** Create `bin/lib/converters/base.js` with a single `convertSkill(content, platformConfig)` function. Each platform converter reduces to a config object + platform-specific hook functions. Use existing `TOOL_MAP` from `platforms.js` instead of duplicated maps in converter files.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Template method pattern with config object -- a single `convertSkill(content, platformConfig)` function that accepts platform-specific hooks
- **D-02:** Platform config object contains: `toolMap`, `pathReplace`, `configGenerator`, `outputStructure`, `mcpToolConverter`, and any platform-specific post-processing hooks
- **D-03:** Shared conversion pipeline order: `parseFrontmatter -> inlineGuardRefs -> inlineWorkflow -> classifyRefs -> pathReplace -> toolMap -> mcpToolConvert -> rebuildFrontmatter`
- **D-04:** Each platform converter file reduces to: config object definition + platform-specific functions (configGenerator, merge/strip helpers)
- **D-05:** Keep pure function style -- no classes, matches existing codebase conventions
- **D-06:** Shared operations: frontmatter parse/rebuild, path replacement, tool name mapping with word-boundary regex, MCP tool reference conversion, workflow inlining orchestration
- **D-07:** Platform-specific logic stays in individual configs: Codex (TOML, adapter, $ARGUMENTS), Copilot (instructions merging, MCP namespace), Gemini (${VAR} escaping, JSON MCP), OpenCode (flattenName, field stripping)
- **D-08:** Error handling scope includes converters, manifest.js, AND installers -- entire install pipeline
- **D-09:** Silent `catch {}` must either: (a) log a warning with context, or (b) re-throw with descriptive message
- **D-10:** Hard errors: file write failures, converter output corruption, config generation failures. Soft warnings: broken symlinks during scan, legacy file cleanup, optional config merge
- **D-11:** No error accumulation pattern -- fail fast on hard errors, log+continue on soft warnings
- **D-12:** Specific silent catches: manifest.js:31 (symlink), manifest.js:72,90,180 (JSON parse), claude.js:62-68 (uv install), claude.js:97-100 (venv), gemini.js:148 (silent catch)
- **D-13:** Snapshot testing -- capture converter output BEFORE refactoring, compare AFTER
- **D-14:** 4 converters x 12 skills = 48 output comparisons
- **D-15:** Snapshots stored in `tests/snapshots/` directory
- **D-16:** Whitespace-only differences ignored (trailing newlines, indentation normalization)
- **D-17:** Run existing `smoke-integrity.test.js` + new snapshot tests as verification gate

### Claude's Discretion
- Base converter file location (new `bin/lib/converters/base.js` vs extend `utils.js`)
- Exact config object shape and default values
- Snapshot generation script implementation
- Whether to split large platform configs into separate helper files
- Test file organization for snapshot tests

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INST-01 | Extract ~80% shared converter logic into base converter -- platform-specific converters only override differences | Base converter pattern with `convertSkill(content, platformConfig)` function. Shared pipeline identified: parseFrontmatter -> inlineGuardRefs -> inlineWorkflow -> pathReplace -> toolMap -> mcpToolConvert -> rebuildFrontmatter. Platform configs contain only diff data. |
| INST-02 | Propagate errors clearly -- no silent catch, log failures, verify outputs | 8 specific silent catch locations identified across manifest.js and installers. Classification: hard errors (re-throw) vs soft warnings (log+continue). Existing `log.warn()` utility available. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node:test | Built-in (Node 16+) | Test runner | Already used across 249 tests in 6 files |
| node:assert/strict | Built-in | Assertions | Already used throughout test suite |
| node:fs | Built-in | File operations | Core to all converters and installers |
| node:path | Built-in | Path manipulation | Core to all converters and installers |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node:crypto | Built-in | SHA256 hashing | Already used in manifest.js for file hashing |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual snapshot testing | jest-snapshot / snap-shot-it | External dependency unnecessary -- project has zero production deps, only js-tiktoken as devDep |
| Class-based template method | Config object + function | D-05 mandates pure function style -- no classes |

**Installation:** No new dependencies needed. All tools are Node.js built-ins already in use.

## Architecture Patterns

### Recommended Project Structure
```
bin/lib/converters/
  base.js          # NEW: shared pipeline + convertSkill(content, platformConfig)
  codex.js         # REFACTORED: config object + adapter/TOML helpers (exports unchanged)
  copilot.js       # REFACTORED: config object + instructions merge/strip (exports unchanged)
  gemini.js        # REFACTORED: config object + MCP JSON config (exports unchanged)
  opencode.js      # REFACTORED: config object + flattenName (exports unchanged)
bin/lib/
  manifest.js      # MODIFIED: silent catches -> log.warn() or re-throw
  installers/
    claude.js      # MODIFIED: silent catches -> log.warn()
    gemini.js      # MODIFIED: silent catch -> log.warn()
test/
  smoke-converters.test.js  # EXISTING: 34 tests, must remain green
  smoke-snapshot.test.js    # NEW: 48 snapshot comparisons
  snapshots/                # NEW: generated snapshot files
    codex/                  # 12 skill outputs
    copilot/                # 12 skill outputs
    gemini/                 # 12 skill outputs
    opencode/               # 12 skill outputs
  generate-snapshots.js     # NEW: one-time snapshot generation script
```

### Pattern 1: Config-Object Template Method (D-01, D-02, D-05)

**What:** A single `convertSkill(content, platformConfig)` function in base.js that runs the shared pipeline, delegating platform-specific behavior via config object hooks.

**When to use:** When 4+ implementations share 80% logic with different data/hooks.

**Example:**
```javascript
// bin/lib/converters/base.js
// Source: Designed from analysis of 4 existing converter files

const { parseFrontmatter, buildFrontmatter, inlineWorkflow } = require('../utils');
const { convertCommandRef } = require('../platforms');

/**
 * Shared conversion pipeline.
 * Pipeline order (D-03): parseFrontmatter -> inlineGuardRefs -> inlineWorkflow
 *   -> pathReplace -> toolMap -> mcpToolConvert -> rebuildFrontmatter
 */
function convertSkill(content, config) {
  const { frontmatter, body } = parseFrontmatter(content);

  // 1. Build platform frontmatter (platform decides which fields to keep)
  const newFm = config.buildFrontmatter(frontmatter);

  // 2. Inline workflow (includes inlineGuardRefs) -- MUST run BEFORE text replacements
  let newBody = body;
  if (config.skillsDir) {
    newBody = inlineWorkflow(newBody, config.skillsDir);
  }

  // 3. Replace command references (/pd:xxx -> platform format)
  if (config.runtime && config.runtime !== 'claude') {
    newBody = convertCommandRef(config.runtime, newBody);
  }

  // 4. Path replacement (~/.claude/ -> platform path)
  if (config.pathReplace) {
    newBody = newBody.replace(/~\/\.claude\//g, config.pathReplace);
  }

  // 5. Fix .pdconfig path if needed
  if (config.pdconfigFix) {
    newBody = config.pdconfigFix(newBody);
  }

  // 6. Tool name mapping
  if (config.toolMap && Object.keys(config.toolMap).length > 0) {
    for (const [claude, platform] of Object.entries(config.toolMap)) {
      const regex = new RegExp(`\\b${claude}\\b(?!\\()`, 'g');
      newBody = newBody.replace(regex, platform);
    }
  }

  // 7. MCP tool conversion
  if (config.mcpToolConvert) {
    newBody = config.mcpToolConvert(newBody);
  }

  // 8. Platform-specific post-processing hooks
  if (config.postProcess) {
    newBody = config.postProcess(newBody);
  }

  // 9. Rebuild output
  return `---\n${buildFrontmatter(newFm)}\n---\n${config.prependBody || ''}${newBody}`;
}

module.exports = { convertSkill };
```

### Pattern 2: Platform Config Object (D-02, D-04)

**What:** Each platform converter defines a config object with platform-specific data and hook functions, then delegates to base.convertSkill().

**Example (OpenCode -- simplest converter):**
```javascript
// bin/lib/converters/opencode.js -- AFTER refactoring
// Source: Refactored from existing 71-line converter

const { convertSkill: baseConvert } = require('./base');

function convertSkill(content, skillsDir) {
  return baseConvert(content, {
    runtime: 'opencode',
    skillsDir,
    pathReplace: '~/.config/opencode/',
    toolMap: {},  // OpenCode uses same tool names as Claude
    buildFrontmatter: (fm) => {
      const newFm = {};
      if (fm.description) newFm.description = fm.description;
      if (fm['allowed-tools'] && Array.isArray(fm['allowed-tools'])) {
        newFm.tools = fm['allowed-tools'];
      }
      return newFm;
    },
    pdconfigFix: (body) =>
      body.replace(/~\/\.config\/opencode\/commands\/pd\/\.pdconfig/g, '~/.config/opencode/.pdconfig'),
    postProcess: (body) => {
      let result = body;
      result = result.replace(/AskUserQuestion/g, 'question');
      result = result.replace(/SlashCommand/g, 'skill');
      return result;
    },
  });
}

function flattenName(skillName) {
  return `pd-${skillName}`;
}

module.exports = { convertSkill, flattenName };
```

### Pattern 3: Error Classification (D-09, D-10, D-11)

**What:** Replace silent catches with classified error handling -- hard errors re-throw, soft warnings log with context.

**Example:**
```javascript
// manifest.js line 31: broken symlink during scan
try {
  stat = fs.statSync(fullPath);
} catch (err) {
  log.warn(`Broken symlink skipped: ${fullPath} (${err.code || err.message})`);
  continue; // soft warning -- scan can continue
}

// manifest.js line 72: legacy manifest cleanup
try { fs.unlinkSync(legacyManifest); } catch (err) {
  log.warn(`Failed to remove legacy manifest: ${legacyManifest} (${err.message})`);
}

// manifest.js line 90: JSON parse fallback
try {
  return JSON.parse(fs.readFileSync(mp, 'utf8'));
} catch (err) {
  log.warn(`Invalid manifest JSON: ${mp} (${err.message})`);
  continue; // soft warning -- try next manifest path
}

// manifest.js line 180: reportLocalPatches JSON parse
try {
  const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
  // ... report
} catch (err) {
  log.warn(`Failed to read backup metadata: ${metaFile} (${err.message})`);
}

// claude.js lines 62-68: uv install chain
try {
  exec('curl -LsSf https://astral.sh/uv/install.sh | sh', { timeout: 60000 });
} catch (curlErr) {
  log.warn(`uv install via curl failed: ${curlErr.message}, trying pip3...`);
  try {
    exec('pip3 install uv --break-system-packages');
  } catch (pip3Err) {
    log.warn(`pip3 --break-system-packages failed: ${pip3Err.message}, trying without flag...`);
    exec('pip3 install uv'); // last resort -- let it throw if this fails too
  }
}

// claude.js lines 97-100: venv creation
try {
  exec(`cd "${fastcodeDir}" && uv venv --python=${pyMajor}.${pyMinor}`, { timeout: 60000 });
} catch (err) {
  log.warn(`uv venv with specific python failed: ${err.message}, trying default...`);
  exec(`cd "${fastcodeDir}" && uv venv`, { timeout: 60000 });
}

// gemini.js line 148: uninstall settings.json cleanup
try {
  const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
  // ... cleanup
} catch (err) {
  log.warn(`Failed to clean settings.json: ${settingsFile} (${err.message})`);
}
```

### Anti-Patterns to Avoid
- **Breaking module.exports API:** Installers import `convertSkill` from converters by name. The refactored converters MUST export the exact same function signatures to avoid breaking import chains.
- **Moving platform-specific logic to base:** The adapter header (Codex), instructions merge (Copilot), ${VAR} escaping (Gemini), and flattenName (OpenCode) must remain in their respective converter files -- they are NOT shared.
- **Premature abstraction of frontmatter building:** Each platform builds frontmatter differently (Codex: name+description only, Gemini: keeps most fields + filters MCP tools from allowed-tools, OpenCode: strips name + renames allowed-tools -> tools, Copilot: keeps name+description). This must stay as a hook function, not forced into a shared pattern.
- **Changing error handling in gemini.js:109:** This location (`settings.json` parse in install) already has `log.warn()` -- it is acceptable as-is per D-12.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing | Custom parser | Existing `parseFrontmatter()` in utils.js | Already handles arrays, key-value pairs, edge cases |
| Snapshot comparison | Custom diff | Simple string equality with whitespace normalization | 48 comparisons are straightforward string matches |
| Tool name regex | New regex patterns | Existing word-boundary pattern `\b${name}\b(?!\()` | Already proven across 4 converters and 249 tests |
| Command ref conversion | Per-converter logic | Existing `convertCommandRef()` from platforms.js | Already handles /pd:xxx -> platform format |

**Key insight:** The existing codebase already has well-tested utility functions. The refactoring is about ORCHESTRATING existing functions through a shared pipeline, not building new primitives.

## Common Pitfalls

### Pitfall 1: Converter API Signature Mismatch
**What goes wrong:** The 4 converters have DIFFERENT `convertSkill()` signatures:
- `codex.convertSkill(content, skillName, skillsDir)` -- 3 args, skillName for adapter
- `copilot.convertSkill(content, isGlobal, skillsDir)` -- 3 args, isGlobal for path choice
- `gemini.convertSkill(content, skillsDir)` -- 2 args
- `opencode.convertSkill(content, skillsDir)` -- 2 args
**Why it happens:** Each platform was built independently with different needs.
**How to avoid:** The refactored converters must maintain EXACTLY the same external signatures. The base.convertSkill() is internal -- each platform's public convertSkill() wraps it, passing the right config with platform-specific params already resolved.
**Warning signs:** Import errors in installers after refactoring.

### Pitfall 2: Pipeline Step Ordering
**What goes wrong:** Text replacements applied BEFORE workflow inlining corrupt the inlined content. Or tool name mapping applied after MCP conversion double-replaces.
**Why it happens:** The existing converters all inline workflow first, but the order of subsequent steps matters.
**How to avoid:** The pipeline order is locked by D-03: `parseFrontmatter -> inlineGuardRefs -> inlineWorkflow -> classifyRefs -> pathReplace -> toolMap -> mcpToolConvert -> rebuildFrontmatter`. Note that `inlineGuardRefs` is called INSIDE `inlineWorkflow()` already -- the base converter just calls `inlineWorkflow()`.
**Warning signs:** Snapshot diffs showing double-replaced tool names or corrupted workflow content.

### Pitfall 3: TOOL_MAP Duplication Between platforms.js and Converters
**What goes wrong:** Tool maps exist in TWO places: `platforms.js` (TOOL_MAP object) and each converter file (GEMINI_TOOL_MAP, COPILOT_TOOL_MAP). If base converter uses one but platform uses the other, inconsistencies arise.
**Why it happens:** platforms.js was added later as a registry but converters weren't updated to use it.
**How to avoid:** Base converter config should reference `TOOL_MAP` from platforms.js. Remove duplicate maps from converter files. Verify via snapshot tests that output is identical.
**Warning signs:** Different tool names in converter output vs what platforms.js specifies.

### Pitfall 4: Gemini allowed-tools Filtering is Unique
**What goes wrong:** Only Gemini filters MCP tools OUT of the frontmatter `allowed-tools` array. If this logic is accidentally generalized or missed, Gemini output breaks.
**Why it happens:** Gemini auto-discovers MCP tools, so they must be removed from the frontmatter declaration.
**How to avoid:** The `buildFrontmatter` hook for Gemini must include the `convertGeminiTool()` filtering logic. This is platform-specific, not shared.
**Warning signs:** Gemini snapshot diffs showing `mcp__` entries in frontmatter.

### Pitfall 5: Codex Adapter Header Position
**What goes wrong:** Codex prepends an XML adapter header between frontmatter and body. If the base converter doesn't support a "prependBody" mechanism, the adapter gets lost.
**Why it happens:** No other converter prepends content before the body.
**How to avoid:** Base converter config must support a `prependBody` field (or equivalent hook) that inserts content between frontmatter and body.
**Warning signs:** Codex output missing `<codex_skill_adapter>` section.

### Pitfall 6: Copilot Path Depends on isGlobal
**What goes wrong:** Copilot's path replacement is `~/.copilot/` (global) or `.github/` (local). If the config always uses one, half the installs break.
**Why it happens:** Copilot is the only converter with a runtime parameter that changes path replacement.
**How to avoid:** Copilot's public `convertSkill(content, isGlobal, skillsDir)` must resolve `pathReplace` based on isGlobal BEFORE passing config to base converter.
**Warning signs:** Local Copilot installs showing `~/.copilot/` paths instead of `.github/`.

## Code Examples

### Current Duplication Pattern (verified from source code)

All 4 converters repeat this exact pattern:
```javascript
// DUPLICATED in codex.js:49-84, copilot.js:28-64, gemini.js:37-78, opencode.js:18-58
const { frontmatter, body } = parseFrontmatter(content);
// ... build newFm (different per platform)
let newBody = body;
if (skillsDir) {
  newBody = inlineWorkflow(newBody, skillsDir);
}
// ... path replacement (different target path per platform)
newBody = newBody.replace(/~\/\.claude\//g, PLATFORM_PATH);
// ... tool mapping (different map per platform, same regex pattern)
for (const [claude, platform] of Object.entries(TOOL_MAP)) {
  const regex = new RegExp(`\\b${claude}\\b(?!\\()`, 'g');
  newBody = newBody.replace(regex, platform);
}
return `---\n${buildFrontmatter(newFm)}\n---\n${newBody}`;
```

### Snapshot Test Pattern
```javascript
// test/smoke-snapshot.test.js
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SNAPSHOTS_DIR = path.join(__dirname, 'snapshots');
const { listSkillFiles } = require('../bin/lib/utils');

const codex = require('../bin/lib/converters/codex');
const copilot = require('../bin/lib/converters/copilot');
const gemini = require('../bin/lib/converters/gemini');
const opencode = require('../bin/lib/converters/opencode');

function normalize(str) {
  // D-16: ignore whitespace-only differences
  return str.replace(/\s+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
}

describe('Converter snapshot tests', () => {
  const skills = listSkillFiles(path.join(ROOT, 'commands', 'pd'));

  for (const platform of ['codex', 'copilot', 'gemini', 'opencode']) {
    describe(`${platform} snapshots`, () => {
      for (const skill of skills) {
        it(`${skill.name} matches snapshot`, () => {
          const snapshotPath = path.join(SNAPSHOTS_DIR, platform, `${skill.name}.md`);
          assert.ok(fs.existsSync(snapshotPath),
            `Missing snapshot: ${snapshotPath}. Run: node test/generate-snapshots.js`);

          const expected = normalize(fs.readFileSync(snapshotPath, 'utf8'));

          let actual;
          switch (platform) {
            case 'codex': actual = codex.convertSkill(skill.content, skill.name, ROOT); break;
            case 'copilot': actual = copilot.convertSkill(skill.content, true, ROOT); break;
            case 'gemini': actual = gemini.convertSkill(skill.content, ROOT); break;
            case 'opencode': actual = opencode.convertSkill(skill.content, ROOT); break;
          }

          assert.equal(normalize(actual), expected,
            `${platform}/${skill.name} output changed from snapshot`);
        });
      }
    });
  }
});
```

### Snapshot Generation Script
```javascript
// test/generate-snapshots.js
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SNAPSHOTS_DIR = path.join(__dirname, 'snapshots');
const { listSkillFiles } = require('../bin/lib/utils');

const codex = require('../bin/lib/converters/codex');
const copilot = require('../bin/lib/converters/copilot');
const gemini = require('../bin/lib/converters/gemini');
const opencode = require('../bin/lib/converters/opencode');

function normalize(str) {
  return str.replace(/\s+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
}

const skills = listSkillFiles(path.join(ROOT, 'commands', 'pd'));
const platforms = {
  codex: (skill) => codex.convertSkill(skill.content, skill.name, ROOT),
  copilot: (skill) => copilot.convertSkill(skill.content, true, ROOT),
  gemini: (skill) => gemini.convertSkill(skill.content, ROOT),
  opencode: (skill) => opencode.convertSkill(skill.content, ROOT),
};

let count = 0;
for (const [platform, convert] of Object.entries(platforms)) {
  const dir = path.join(SNAPSHOTS_DIR, platform);
  fs.mkdirSync(dir, { recursive: true });

  for (const skill of skills) {
    const output = normalize(convert(skill));
    fs.writeFileSync(path.join(dir, `${skill.name}.md`), output + '\n', 'utf8');
    count++;
  }
}

console.log(`Generated ${count} snapshots (${Object.keys(platforms).length} platforms x ${skills.length} skills)`);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 4 independent converter files | Shared base + config objects | Phase 9 (this phase) | ~60% code reduction in converters |
| Silent catch {} everywhere | Classified error handling (hard/soft) | Phase 9 (this phase) | Debuggable install failures |
| Duplicate TOOL_MAP in converters | Single source in platforms.js | Phase 9 (this phase) | Single update point for tool names |
| No snapshot tests | 48 snapshot comparisons | Phase 9 (this phase) | Refactoring safety net |

## Open Questions

1. **Base converter file location**
   - What we know: D-05 says pure functions, existing utils.js has 430 lines of shared utilities
   - Options: (a) New `bin/lib/converters/base.js` -- clean separation, converter-specific; (b) Extend `utils.js` -- all utilities in one place
   - Recommendation: **Use `bin/lib/converters/base.js`** -- the conversion pipeline is converter-specific logic, not general utility. Keeps utils.js focused on primitives (parse, build, hash) while base.js handles orchestration. Also avoids making utils.js even larger.

2. **TOOL_MAP deduplication approach**
   - What we know: `platforms.js` already has `TOOL_MAP.gemini` and `TOOL_MAP.copilot` identical to maps in converter files. Codex and OpenCode have empty maps in platforms.js.
   - What's unclear: Should base converter read from platforms.js directly or should config objects pass the map?
   - Recommendation: **Config objects pass the map**, sourced from `platforms.js`. This keeps base.js decoupled from platforms.js and allows platform converters to override if needed. Delete duplicate maps from converter files.

3. **Copilot local mode snapshot coverage**
   - What we know: D-14 specifies 48 snapshots (4 x 12). Copilot has both global (isGlobal=true) and local (isGlobal=false) modes.
   - What's unclear: Should we add local mode snapshots (making it 60 total)?
   - Recommendation: **48 snapshots (global only) for initial verification**. The isGlobal difference is only in path replacement (`~/.copilot/` vs `.github/`), and existing tests already cover both modes. Add local mode snapshots only if snapshot tests prove insufficient.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in, Node.js 16+) |
| Config file | none -- uses package.json scripts |
| Quick run command | `node --test test/smoke-converters.test.js` |
| Full suite command | `node --test 'test/*.test.js'` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INST-01 | Base converter produces identical output to original converters | snapshot | `node --test test/smoke-snapshot.test.js` | Wave 0 |
| INST-01 | Existing converter tests pass after refactoring | unit | `node --test test/smoke-converters.test.js` | Existing (34 tests) |
| INST-01 | All platform installs produce correct output | integration | `node --test test/smoke-all-platforms.test.js` | Existing |
| INST-01 | Repo integrity maintained | integration | `node --test test/smoke-integrity.test.js` | Existing |
| INST-02 | Silent catches replaced with log.warn or re-throw | unit | `node --test test/smoke-error-handling.test.js` | Wave 0 |
| INST-02 | Existing installer tests pass after error changes | integration | `node --test test/smoke-installers.test.js` | Existing |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-converters.test.js && node --test test/smoke-snapshot.test.js`
- **Per wave merge:** `node --test 'test/*.test.js'`
- **Phase gate:** Full suite (249+ tests) green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `test/snapshots/` directory -- 48 snapshot files generated from current converter output (BEFORE any refactoring)
- [ ] `test/generate-snapshots.js` -- one-time snapshot generation script
- [ ] `test/smoke-snapshot.test.js` -- snapshot comparison test (4 converters x 12 skills)
- [ ] `test/smoke-error-handling.test.js` -- verifies no bare `catch {}` remains in target files

## Sources

### Primary (HIGH confidence)
- Direct source code analysis of all 4 converters (codex.js, copilot.js, gemini.js, opencode.js)
- Direct source code analysis of utils.js, platforms.js, manifest.js
- Direct source code analysis of all 5 installers (claude.js, codex.js, copilot.js, gemini.js, opencode.js)
- Direct source code analysis of all 6 test files (249 tests, all passing)
- 09-CONTEXT.md decisions (D-01 through D-17)

### Secondary (MEDIUM confidence)
- Node.js built-in test runner documentation (node:test module)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies, all Node.js built-ins already in use
- Architecture: HIGH -- pattern derived directly from analyzing 4 existing converter implementations, duplication patterns verified line-by-line
- Pitfalls: HIGH -- all 6 pitfalls identified from actual code analysis (API signature differences, pipeline ordering, TOOL_MAP duplication, Gemini filtering, Codex adapter, Copilot isGlobal)

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable -- internal refactoring of existing codebase)
