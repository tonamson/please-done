# Phase 112: PTES Foundation - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning
**Mode:** Auto (discuss mode)

<domain>
## Phase Boundary

Implement PTES-compliant workflow architecture for the `pd:audit` skill, adding reconnaissance capabilities and Red Team TTPs support.

**Scope:**
- Create 4-phase PTES architecture foundation
- Add new command flags: `--recon`, `--poc`, `--redteam`
- Implement reconnaissance cache system for token optimization
- Establish tiered command structure (FREE, STANDARD, DEEP, RED TEAM)

**Requirements:** PTES-01 to PTES-04 (4 requirements)

</domain>

<decisions>
## Implementation Decisions

### PTES Architecture
- **D-01:** Implement 4-phase PTES workflow structure:
  - Phase 1: Pre-engagement Interaction (scope, RoE, compliance)
  - Phase 2: Intelligence Gathering (reconnaissance)
  - Phase 3: Vulnerability Analysis (SAST + taint)
  - Phase 4: Exploitation/Verification (DAST)
- **D-02:** Integrate PTES phases into existing `pd:audit` workflow
- **D-03:** Maintain backward compatibility with existing `/pd:audit` behavior

### Command Flags Design
- **D-04:** Add `--recon` flag to trigger full reconnaissance (Steps 0a-0h)
- **D-05:** Add `--poc` flag for DAST verification (recon → SAST → DAST)
- **D-06:** Add `--redteam` flag for Red Team TTPs (+ evasion techniques)
- **D-07:** Keep default `/pd:audit` as Quick SAST (Steps 1-9) for backward compatibility

### Cache System Architecture
- **D-08:** Cache key = hash(git commit + file list)
- **D-09:** Cache location: `.planning/recon-cache/{key}.json`
- **D-10:** Cache invalidation: automatic on git commit or file changes
- **D-11:** Display token savings: "[Token Save] Reusing cached recon (0 AI tokens)"

### Tiered Command Structure
- **D-12:** Tier 1 (FREE - 0 tokens): `--recon-light` - code-only scanning
- **D-13:** Tier 2 (STANDARD - ~2000 tokens): `--recon` - code + AI analysis
- **D-14:** Tier 3 (DEEP - ~6000 tokens): `--recon-full` - + deep taint analysis
- **D-15:** Tier 4 (RED TEAM - ~8000 tokens): `--redteam` - + OSINT + payloads + post-exploit

### Token Optimization Strategy
- **D-16:** Code-first approach: 70% code, 30% AI
- **D-17:** Pattern matching, encoding/decoding, file I/O in pure code (0 tokens)
- **D-18:** AI reserved for attack surface analysis, risk scoring, strategy recommendations
- **D-19:** Target: ≤50 tokens per vulnerability found

### Claude's Discretion
- Specific implementation details for cache storage format
- Cache eviction policy (LRU vs TTL)
- Thread-safety for parallel recon operations
- Error handling for corrupted cache files

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### PTES/OWASP Standards
- `ke-hoach-pentest-online.md` — Full pentest plan with PTES/OWASP/MITRE standards
- `.planning/REQUIREMENTS.md` §PTES-01 to PTES-04 — Phase requirements

### Existing Audit Skill
- `commands/pd/audit.md` — Current `pd:audit` skill implementation
- `docs/skills/audit.md` — User-facing documentation

### Project Context
- `.planning/ROADMAP.md` §Phase 112 — Phase goal and success criteria
- `.planning/PROJECT.md` — Core value and constraints

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing `pd:audit` skill structure in `commands/pd/audit.md`
- Security audit patterns from Phase 46-51 (OWASP audit implementation)
- Agent pattern from `pd-sec-scanner.md`

### Established Patterns
- Flag-based command modification (similar to `--standalone` in test skill)
- Cache system pattern from `recon-cache.js` (documented in ke-hoach)
- Tiered approach from effort-level routing (haiku/sonnet/opus)

### Integration Points
- `pd:audit` command dispatcher needs flag parsing
- Workflow conditional steps based on flags
- Output format selection (JSON, table, markdown)

</code_context>

<specifics>
## Specific Ideas

**Command Matrix:**
```
/pd:audit                    → Quick SAST (default, backward compatible)
/pd:audit --recon           → Full Recon + SAST
/pd:audit --recon-light     → Code-only recon (0 tokens)
/pd:audit --recon-full      → Deep recon with taint
/pd:audit --poc             → Recon + SAST + DAST Verify
/pd:audit --redteam         → Recon + SAST + DAST + Evasion
/pd:audit --osint           → OSINT intelligence only
```

**Cache Display Format:**
```
[Token Save] Reusing cached recon (0 AI tokens)
[Recon] Analyzing attack surface (~2000 tokens)
[Token Budget] Used: 2100/6000 (35%)
```

**PTES Phase Integration:**
```
Step 0:  Reconnaissance Phase (Conditional on --recon/--poc/--redteam)
Steps 1-9: SAST (with recon data enrichment)
Steps 10-13: DAST (if --poc or --redteam)
```

</specifics>

<deferred>
## Deferred Ideas

None — phase scope is clear and bounded to PTES foundation architecture only. Specific reconnaissance agents, OSINT, payloads, tokens, and post-exploitation are in later phases (113-124).

</deferred>

---

*Phase: 112-ptes-foundation*
*Context gathered: 2026-04-05*
