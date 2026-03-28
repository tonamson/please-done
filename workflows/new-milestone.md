<purpose>
Strategic planning: check → update project → ask → research (optional) → requirements → roadmap → approve.
Create/update PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md, CURRENT_MILESTONE.md with approval gates and staged commits.
For existing projects — may already have prior milestones.
</purpose>

<required_reading>
Read all files in execution_context before starting:
- @templates/project.md, @templates/requirements.md, @templates/roadmap.md, @templates/state.md, @templates/current-milestone.md
- @references/conventions.md
</required_reading>

<conditional_reading>
Automatically determine documents to read based on context:
- @references/questioning.md (WHEN detailed discussion with user is needed)
- @references/ui-brand.md (WHEN project has a user interface/Frontend)
- @references/prioritization.md (WHEN requirements need to be prioritized)
- @references/state-machine.md (WHEN complex milestone lifecycle state management is needed)
</conditional_reading>

<process>

## 0. Self-check

| # | File | Missing → |
|---|------|-----------|
| 1 | `.planning/CONTEXT.md` | "Run `/pd:init` first." → **STOP** |
| 2 | `.planning/rules/general.md` | "Rules are missing. Run `/pd:init` to recreate." → **STOP** |

Read both. Note language, date format, versioning convention, status icons.

---

## 0.5: Determine reference documents (Auto-discovery)

Analyze `CONTEXT.md` and context to activate supplementary documents:
- Has user interface? → read @references/ui-brand.md
- Need deep discussion with user? → read @references/questioning.md
- Many requirements need ordering? → read @references/prioritization.md
- Need complex state management? → read @references/state-machine.md

---

## 1. Create/Update PROJECT.md

> Template: @templates/project.md

**Does not exist:**
- Read CONTEXT.md → project information
- Ask user (@references/questioning.md): vision (1-3 sentences), target audience, constraints
- Create PROJECT.md from template

**Already exists:**
- Read PROJECT.md → milestone history, vision
- Previous milestone completed → add to "Milestone History" table
- Ask user: "Has the vision changed? Lessons from previous milestone?"
- Update if needed

**Update STATE.md** (if exists): `Last activity: [DD_MM_YYYY] — Started new milestone initialization`

---

## 2. Check scan report

- **NO** `.planning/scan/SCAN_REPORT.md`:
  - CONTEXT.md → new project (no code yet) → allow continuing
  - Project already has code → "Run `/pd:scan` first." → **STOP**
- **YES** → read: completion status, available libraries, issues & suggestions

---

## 3. Check existing roadmap

`.planning/ROADMAP.md` already exists:

```
AskUserQuestion({
  questions: [{
    question: "A roadmap already exists. What do you want to do?",
    header: "Existing Roadmap",
    multiSelect: false,
    options: [
      { label: "Overwrite entirely", description: "Delete old roadmap, start from scratch" },
      { label: "Continue from existing", description: "Keep old milestones, add new ones at the end" }
    ]
  }]
})
```

**OVERWRITE → warn about old milestone directories:**
```
AskUserQuestion({
  questions: [{
    question: "Old milestone directories still exist. How to handle?",
    header: "Old Milestones",
    multiSelect: false,
    options: [
      { label: "Backup (Recommended)", description: "Rename to milestones_backup_[date]" },
      { label: "Delete all", description: "Delete all old milestone directories" },
      { label: "Only delete those without code", description: "Keep milestones that have code, delete the rest" }
    ]
  }]
})
```
- AskUserQuestion not available as tool → ask as plain text (per rules). User does not respond OR tool technical error → auto backup: `.planning/milestones/` → `.planning/milestones_backup_[DD_MM_YYYY]/`. Note: "Auto-backed up due to no response received."

**`--reset-phase-numbers`:**
- Flag present → number phases from 1
- Old phase directories exist → archive first to avoid conflicts
- No flag → continue numbering from last phase of previous milestone

---

## 4. Gather milestone requirements

> Apply @references/questioning.md

`$ARGUMENTS` has content → use as initial context.

**OVERWRITE:** present completed milestones → ask everything (goals, core features, priorities) → deep dive (audience, scenarios, constraints, timeline)

**CONTINUE:** present existing milestones → ask about NEW milestones/features → deep dive (scope, relationship with existing features)

**New project:** CONTEXT.md + PROJECT.md as foundation → ask about main features → ask priorities, audience, constraints

---

## 5. Strategic research (Fast Parallel Research)

```
AskUserQuestion({
  questions: [{
    question: "Do you want to conduct strategic research (architecture, libraries, data flow) before defining scope?",
    header: "Research",
    multiSelect: false,
    options: [
      { label: "Research first (Recommended)", description: "Use FastCode + Context7 for quick lookups, scan for architecture issues" },
      { label: "Skip, go straight to requirements", description: "Use existing knowledge" }
    ]
  }]
})
```

**"Skip":** jump to Step 6.

**"Research first":**
```bash
mkdir -p .planning/research
```

Execute **Parallel Tool Calls** instead of spawning sub-agents to optimize performance:
1. `mcp__fastcode__code_qa`: Search for reusable components/modules and detect potential architecture bottlenecks.
2. `mcp__context7__query-docs` (or WebSearch): Look up optimal libraries for the current stack and security risks to prevent.
3. **Internal logic**: Draft data flow and user journey to identify edge cases such as network errors, data loading, or undo operations.

After getting results, synthesize and write directly to `.planning/research/SUMMARY.md` (including: Recommended libraries, Reuse points, Architecture pitfalls, Data flows to watch).

Display summary for user: additional libraries, mandatory features, most critical warnings.

**Commit:**
```bash
git add .planning/research/ && git commit -m "docs: strategic research for milestone — [brief summary]"
```

**Update STATE.md:** `Last activity: [DD_MM_YYYY] — Strategic research completed`

---

## 6. Define requirements

> Template + criteria: @templates/requirements.md

### 6a. Analyze current state
- HAS scan report → completed/partial/unstarted features, available libraries
- HAS research → read `.planning/research/SUMMARY.md` → features by group
- New project → based on user requirements from Step 4
- **DO NOT call FastCode** for information already in the scan report

### 6b. Define scope by group
For EACH group:
```
AskUserQuestion({
  questions: [{
    question: "[Group name] — select features for this milestone:",
    header: "[Group]",
    multiSelect: true,
    options: [
      { label: "[Feature 1]", description: "[description — required/differentiator]" },
      { label: "Exclude this group", description: "Defer to next milestone" }
    ]
  }]
})
```

Classify: Selected → **v1** | Required not selected → **Future** | Differentiator not selected → **Out of scope**

### 6c. Check for gaps
```
AskUserQuestion({
  questions: [{
    question: "Are there any features not listed that you want to add?",
    header: "Additional",
    multiSelect: false,
    options: [
      { label: "No, that's complete", description: "Move on to creating the requirements list" },
      { label: "Yes, I want to add more", description: "Describe the features to add" }
    ]
  }]
})
```
"Yes" → collect more → re-scope.

### 6d. Create REQUIREMENTS.md
Per template @templates/requirements.md.
- Code: `[GROUP]-[NUMBER]` (AUTH-01, NOTIF-02)
- Has existing REQUIREMENTS.md → continue numbering from last code
- Apply good requirement criteria

### 6e. Approval gate — Requirements

Present ALL requirements:
```
## Requirements for Milestone v[X.Y]
### [Group 1]
- [ ] **GROUP1-01**: User can...
**Total: [X] requirements | [Y] groups**
```

```
AskUserQuestion({
  questions: [{
    question: "Are the requirements correctly scoped?",
    header: "Review requirements",
    multiSelect: false,
    options: [
      { label: "Approve", description: "Move on to roadmap creation" },
      { label: "Adjust", description: "Add/remove/edit then review again" }
    ]
  }]
})
```

- **"Approve"** → commit, continue to Step 7
- **"Adjust"** → edit → ask for approval again (loop until approved)

**Commit:**
```bash
git add .planning/REQUIREMENTS.md && git commit -m "docs: define requirements for milestone v[X.Y] ([N] requirements)"
```

**Update STATE.md:** `Last activity: [DD_MM_YYYY] — Milestone v[X.Y] requirements approved`

---

## 7. Design roadmap

> Template + rules: @templates/roadmap.md

### 7a. Split milestones and phases
- Split Milestones (1.0, 1.1, 2.0...) → Phases
- Each phase MUST have all 5 components (@templates/roadmap.md → "Phase Rules")
- Determine dependencies, priorities, version numbering, check for duplicates (when CONTINUING)

### 7b. Coverage check (REQUIRED)
ALL v1 requirements MUST be mapped to exactly 1 phase. Unmapped → **STOP**, fix first.

### 7c. Strategic decisions
Claude MUST document: why milestone X before Y, why prioritize Z, why split into N milestones, dependencies.

### 7d. Create ROADMAP.md
- **OVERWRITE** → write new from template
- **CONTINUE** → keep existing milestones → add new AFTER the end → update dates
- Add strategic decisions to existing table

### 7e. Update REQUIREMENTS.md tracking table

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1.1 | Pending implementation |

Check: all v1 mapped → Done. Any unmapped requirements → **STOP**, fix first.

### 7f. Approval gate — Roadmap

Present: `[N] phases | [X] requirements mapped | Coverage: ✓` + phases table + details.

```
AskUserQuestion({
  questions: [{
    question: "Is the roadmap suitable?",
    header: "Review roadmap",
    multiSelect: false,
    options: [
      { label: "Approve", description: "Finalize and commit" },
      { label: "Adjust phases", description: "Change order, merge/split, move requirements" },
      { label: "View full file", description: "Display entire ROADMAP.md before deciding" }
    ]
  }]
})
```

- **"Approve"** → commit, continue to Step 8
- **"Adjust"** → edit → ask again (loop until approved)
- **"View full file"** → display → ask again

**Commit:**
```bash
git add .planning/ROADMAP.md .planning/REQUIREMENTS.md && git commit -m "docs: create roadmap for milestone v[X.Y] ([N] phases, [X] requirements mapped)"
```

Print strategic decisions table + review warning before `/pd:plan`.

**Update STATE.md:** `Last activity: [DD_MM_YYYY] — Milestone v[X.Y] roadmap approved`

---

## 8. Create/Reset STATE.md

```markdown
# Working State
> Updated: [DD_MM_YYYY]

## Current Position
- Milestone: v[X.Y] — [Name]
- Phase: Not started
- Plan: —
- Status: Ready for planning
- Last activity: [DD_MM_YYYY] — Milestone v[X.Y] initialized

## Accumulated Context
[Previous milestone → keep valuable context. First milestone → "None yet."]

## Blocking Issues
None
```

Has existing STATE.md → read "Accumulated Context" → keep it → reset the rest.

---

## 9. Create tracking + Commit

### 9a. Create/update CURRENT_MILESTONE.md
- **OVERWRITE or does not exist:** create new (milestone, version, first phase, status: Not started)
- **CONTINUE AND already exists:** keep as-is

### 9b. Create `.planning/milestones/[version]/` for ALL new milestones

### 9c. Update `> Updated: [DD_MM_YYYY]` in PROJECT.md

### 9d. Commit
```bash
git add .planning/STATE.md .planning/CURRENT_MILESTONE.md .planning/PROJECT.md && git commit -m "docs: initialize milestone v[X.Y] [Name] — ready for planning"
```

---

## 10. Notification

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MILESTONE INITIALIZATION COMPLETE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Milestone v[X.Y]: [Name]

| Artifact        | Path                          | Status |
|-----------------|-------------------------------|--------|
| Project          | .planning/PROJECT.md          | ✓      |
| Research         | .planning/research/           | ✓/—    |
| Requirements     | .planning/REQUIREMENTS.md     | ✓      |
| Roadmap          | .planning/ROADMAP.md          | ✓      |
| State            | .planning/STATE.md            | ✓      |
| Tracking         | .planning/CURRENT_MILESTONE.md| ✓      |

[N] phases | [X] requirements | Coverage 100% ✓

▶ Next: /pd:plan
   Phase [first]: [Name] — [Goal]
```

</process>

<rules>
- Follow `.planning/rules/general.md`
- Milestones realistic, prioritize core features first
- Backend + Frontend → Backend API first. Frontend-only (UI, SEO) → independent
- Only Frontend or only Backend → plan according to available stack
- New project: first phase = setup (initialization, config, libraries)
- Auth/Security always in first milestone
- DO NOT call FastCode for information already in the scan report
- MUST check CONTEXT.md + rules/general.md exist → STOP if missing
- MUST create/update PROJECT.md in Step 1 — before any other work
- ALL v1 requirements MUST be mapped to exactly 1 phase — unmapped → fix before approving
- Requirements MUST be user-oriented, testable, singular
- MUST create milestones/[version]/ directory when creating roadmap
- MUST have 2 approval gates: requirements + roadmap — loop until approved
- MUST commit after each gate
- MUST update STATE.md at each checkpoint (Step 1, 5, 6e, 7f), NOT just at the end
- STATE.md MUST keep "Accumulated Context" from previous milestone — DO NOT wipe clean
- FastCode and Context7 run in parallel during Strategic Research step
- Synthesize research directly into .planning/research/SUMMARY.md
- AskUserQuestion not available → ask as plain text, wait for response
</rules>
