---
phase: 93
name: ONBOARD-01 — Context Generation & Summary
requirement: ONBOARD-01
milestone: v11.0
status: discuss-complete
---

# Phase 93 Context: ONBOARD-01 — Context Generation & Summary

> **Status:** Discuss complete — ready for research/planning
> **Decision Mode:** Auto (all choices logged inline)

---

## Phase Summary

Add CONTEXT.md generation and onboarding summary output to `pd:onboard` skill.

1. **CONTEXT.md generation** — Create key files documentation with tech stack details
2. **Onboarding summary** — Show detected stack, frameworks, and next steps
3. **Documentation links** — Link to relevant docs based on detected stack

---

## Background

From **Phase 92**, we enhanced `pd:onboard` with:
- State machine integration (no prerequisites)
- Error handler wiring for structured logging
- what-next integration for new projects

Now in **Phase 93**, we add the final component:
- **Context generation** — After scan completes, generate CONTEXT.md with key findings
- **Summary output** — Display onboarding summary with stack detection results

---

## Gray Areas Decided

### 1. CONTEXT.md Content Scope
**Decision:** Generate focused CONTEXT.md, not full documentation

**Content includes:**
- Detected tech stack (framework, language, build tool)
- Key files summary (entry points, config files, main source dirs)
- Framework-specific patterns detected
- Links to relevant documentation

**Content excludes:**
- Full architecture analysis (kept in PROJECT.md)
- Detailed code patterns (for SCAN_REPORT.md)
- Implementation recommendations (for planning phases)

**Rationale:**
- CONTEXT.md should be concise reference, not exhaustive documentation
- PROJECT.md already captures vision and architecture
- SCAN_REPORT.md already captures detailed code analysis
- CONTEXT.md fills the gap: "What should an AI know about this codebase?"

### 2. Summary Output Format
**Decision:** Markdown formatted summary with clear sections

**Sections:**
```
╔════════════════════════════════════════════════════════════╗
║           PROJECT ONBOARDING COMPLETE                      ║
╠════════════════════════════════════════════════════════════╣
║ Tech Stack: TypeScript + NestJS + Prisma                   ║
║ Key Files: src/main.ts, src/app.module.ts                  ║
║ Source Code: src/ (12 files, ~800 lines)                   ║
╠════════════════════════════════════════════════════════════╣
║ Next Steps:                                                ║
║ • Review PROJECT.md for project vision                     ║
║ • Review CONTEXT.md for codebase overview                  ║
║ • Run /pd:plan to create development plan                  ║
╚════════════════════════════════════════════════════════════╝
```

**Rationale:**
- Visual clarity with box-drawing characters
- Quick scan for key information
- Clear call-to-action for next steps

### 3. Stack Detection Strategy
**Decision:** Use existing scan infrastructure

**Implementation:**
- Leverage tech-stack detection from Phase 92
- Use file pattern matching already in scan workflow
- No new detection logic needed

**Rationale:**
- Avoid duplication — scan already identifies stack
- Focus on presentation, not detection
- Consistent with DRY principle

### 4. Documentation Links
**Decision:** Link to framework-specific docs based on detected stack

**Link Categories:**
- Framework docs (NestJS, Next.js, etc.)
- Database/ORM docs (Prisma, TypeORM, etc.)
- Testing framework docs (Jest, Vitest, etc.)
- Build tool docs (Webpack, Vite, etc.)

**Implementation:**
- Map detected technologies to documentation URLs
- Use well-known URLs (e.g., docs.nestjs.com)
- Include version-specific links when version detected

### 5. Scope Boundaries
**In Scope:**
- CONTEXT.md generation with tech stack details
- Key files summary (limited to 10-15 most important)
- Onboarding summary output
- Documentation links based on detected stack
- Integration with existing pd:onboard flow

**Out of Scope:**
- Interactive prompts during onboard (keep it automated)
- Custom templates per framework (use generic format)
- Live documentation fetching (static links only)
- Multi-language support for summary (keep English)

---

## Prior Decisions Applied

From **Phase 78:**
- Onboard is fully automated (no user prompts)
- FastCode guard is soft check (warn + continue)

From **Phase 92:**
- Error handler already wired for structured logging
- State machine entry already exists
- what-next already suggests onboard

From **Phase 88-89 (LOG-01):**
- Use structured error logging for any failures

---

## Deferred Ideas

1. **Custom templates per framework** — Future enhancement for richer CONTEXT.md
2. **Interactive stack confirmation** — Could add prompts for ambiguous stacks
3. **Auto-fetch latest docs** — Could integrate with docs APIs for live links

---

## Research Gaps

1. **CONTEXT.md format** — Verify existing CONTEXT.md examples for consistency
2. **Summary output location** — Confirm where to display summary (stdout, file, or both)
3. **Key file selection criteria** — Define algorithm for "most important" files

---

## Success Criteria

Per ROADMAP.md:

1. ✅ Generates initial CONTEXT.md with key files
2. ✅ Creates onboarding summary with next steps
3. ✅ Shows detected stack and frameworks
4. ✅ Links to relevant documentation

---

## Next Steps

1. **Research:** Review existing CONTEXT.md files, verify summary display approach
2. **Plan:** Create PLAN.md with tasks for context generation
3. **Execute:** Implement CONTEXT.md generation, summary output, doc links
4. **Verify:** Run smoke tests, verify end-to-end onboard flow

---

## Auto-Selected Choices Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| CONTEXT.md scope | Focused reference | PROJECT.md and SCAN_REPORT.md cover depth |
| Summary format | Markdown boxed | Visual clarity, quick scan |
| Stack detection | Reuse existing | Avoid duplication, use scan results |
| Doc links | Static URLs | Simple, reliable, no external API calls |
| Scope | Generation + summary | Keep focused, defer enhancements |

---

## References

- Phase 92: `.planning/phases/92-onboarding-skill-foundation/`
- `commands/pd/onboard.md` — skill definition file
- `workflows/onboard.md` — orchestration workflow
- `.planning/CONTEXT.md` — example context file format
- Phase 78: Original onboard skill creation

---

*Phase: 93-onboard-01-context*
*Context gathered: 2026-04-04*
