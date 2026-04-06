# v12.2 Requirements: Developer Experience Improvements

**Defined:** 2026-04-06
**Core Value:** Enhance workflow tooling with automation commands and detection features to reduce friction in the development cycle

---

## v12.2 Requirements

### Workflow Commands

- [ ] **L-02**: Merge pd:next into pd:what-next
  - Add auto-execute logic to `what-next` skill
  - Detect current state and execute the appropriate next command
  - Preserve advisory mode (show suggestion without executing)
  - Add `--execute` flag for auto-execute behavior

- [ ] **L-03**: pd:stats command
  - Display project statistics: phases, plans, requirements, git metrics
  - Show milestone progress and timeline
  - IncludeLOC counts and file counts
  - Format output as table or JSON (with `--json` flag)

- [ ] **L-04**: pd:health command
  - Diagnose planning directory issues
  - Check for missing files (VERIFICATION.md, SUMMARY.md)
  - Validate STATE.md structure
  - Report issues with severity levels
  - Suggest fixes for each issue found

### Automation

- [ ] **L-01**: Automated version badge sync
  - Sync version number across README.md, CLAUDE.md, package.json
  - Update version badge in documentation on milestone completion
  - Detect version mismatches across files
  - Add `--check` flag for validation-only mode

### Discovery & Tracking

- [ ] **L-05**: MCP Tool Discovery
  - Auto-discover available MCP tools
  - List tools with descriptions and capabilities
  - Identify which tools are configured vs available
  - Output tool inventory for debugging

- [ ] **L-06**: Discussion Audit Trail
  - Track conversation history across sessions
  - Store discussion summaries in `.planning/contexts/`
  - Enable context restoration for paused work
  - Support search across past discussions

### Detection & Validation

- [ ] **L-07**: Scope Reduction Detection
  - Warn when plan scope shrinks during execution
  - Compare task counts between phases
  - Detect dropped requirements mid-milestone
  - Report scope changes in milestone audit

- [ ] **L-08**: Schema Drift Detection
  - Detect planning file schema changes
  - Compare current STATE.md structure to expected schema
  - Validate gsd_state_version matches supported versions
  - Report migration requirements

---

## Deferred (Future Milestones)

- M-01: Wave Execution (parallel plans)
- M-02: Additional runtime support (beyond initial 12)
- M-03: TypeScript SDK
- M-04: Git Branching Strategies
- M-05: Context Window Monitoring
- M-06: Developer Profiling
- M-07: Verification Debt Tracking
- M-08: Ship Command

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Breaking changes to skill names | Must maintain backward compatibility |
| New platform targets | Focus on improving existing workflow |
| Code-level verification | Plan checker only checks plan documents |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| L-01 | Phase 140 | Not started |
| L-02 | Phase 137 | Not started |
| L-03 | Phase 138 | Not started |
| L-04 | Phase 139 | Not started |
| L-05 | Phase 141 | Not started |
| L-06 | Phase 142 | Not started |
| L-07 | Phase 143 | Not started |
| L-08 | Phase 144 | Not started |

**Coverage:**
- v12.2 requirements: 8 total
- Phases: 8 (137-144)
- Mapped: 8/8 ✓
- Unmapped: 0

---

*Defined: 2026-04-06*
*Source: Deferred items from v12.1*