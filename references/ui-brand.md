# UI & Brand — Product Guide for Planning & Design

> Used by: `/pd:new-milestone`, `/pd:plan`, `/pd:write-code`, `/pd:complete-milestone`
> 3 layers: (1) product framing, (2) design continuity, (3) UX for new features without UI

---

## Layer 1: Product Framing

> Apply when: writing REQUIREMENTS, ROADMAP, PLAN, MILESTONE_COMPLETE

### Core Principles

**Every output must answer: "What does the user get?"**
Always frame from end-user perspective. Cannot describe the benefit → ask: "Why does the user need this?"

### Writing requirements

Format: `[CODE]-[NUM]: User can [action] to [purpose/benefit]`

| Bad (tech-focused) | Good (user-focused) |
|-----|-----|
| "Create login API endpoint" | "User can log in with email" |
| "Setup Redis caching" | "Page loads in under 2 seconds" |
| "Implement WebSocket" | "User sees new messages instantly" |
| "Add JWT authentication middleware" | "Only logged-in users can view admin pages" |
| "Deploy ERC20 smart contract" | "User can transfer tokens between wallets" |
| "Configure GetX bindings" | "App opens fast, smooth page transitions" |

### Success criteria

Format: `[Who] can [action] → [observable result]`

| Bad | Good |
|-----|-----|
| "API returns 200 OK" | "Login succeeds → redirects to homepage within 1 second" |
| "Database has correct schema" | "Create new account → appears immediately in admin list" |
| "Contract deploys successfully" | "User sends token → balance updates correctly within 15 seconds" |

### Phase = Product outcome

| Bad | Good |
|-----|-----|
| "Setup NestJS modules + entities" | "Basic account management (register, login, profile)" |
| "Implement auth middleware" | "Security: only authorized users access corresponding features" |

### Consistency

- Keep naming consistent: REQUIREMENTS → ROADMAP → PLAN → TASKS → MILESTONE_COMPLETE
- Group features by **user flow**, NOT by technical architecture
- CHANGELOG uses user language — "Fixed: slow login", not "Fix: connection pool exhaustion"

### Scope control

- Phase 1 = minimal version — core functionality only
- Phase >6 deliverables → too large, split
- Deliverable contains "and" → split into 2
- "Will need in the future" → defer, note as "Future requirements"

---

## Layer 2: Design Continuity — Inheriting Existing Design

> Apply when: project ALREADY HAS UI/UX, needs extension/upgrade

### Principles

**Inherit first, propose new later.**
Project already has design → new features MUST prioritize reusing existing patterns.

### Before designing new features

| # | Question | Action |
|---|---------|--------|
| 1 | Does a similar feature already exist? | Grep/FastCode to find similar component/page/flow → reuse |
| 2 | What layout is used for this page type? | Read UI code → maintain same grid/spacing/hierarchy |
| 3 | Current navigation pattern? | Sidebar? Tab? Breadcrumb? → use same pattern |
| 4 | Current form pattern? | Label position, validation display, submit flow → keep consistent |
| 5 | What do tables/lists use? | Pagination? Infinite scroll? Filter? → reuse |
| 6 | Feedback pattern (toast, modal, inline)? | Find success/error pattern → reuse |

### Rules

- **DO NOT create new layout component** if similar already exists
- **DO NOT change navigation structure** unless user requests
- **DO NOT change design system** (colors, spacing, typography) — use existing tokens/theme
- New feature REQUIRES new pattern → record in PLAN.md "Design Decision" + explain why

### Record design patterns in PLAN.md

When planning a phase with UI, "Technical Design" section MUST include:

```markdown
### UI — Inherited Patterns
| Pattern | Referenced from | Applied to |
|---------|----------------|-----------|
| Form layout | src/pages/users/create.tsx | New [X] creation page |
| Table + filter | src/components/DataTable.tsx | [X] listing |
| Detail page | src/pages/orders/[id].tsx | [X] detail |

### UI — New Patterns (if any)
| Pattern | Reason for not reusing | Description |
|---------|----------------------|-------------|
```

---

## Layer 3: UX Gaps — New Features Without UI/UX

> Apply when: feature never existed before, no mockup/wireframe

### Principles

**No designer → AI must consider all states before coding.**

### Mandatory UX Checklist for each new feature

`/pd:plan` designing feature without UI → MUST consider 7 aspects:

| # | Aspect | Question to answer | Record in |
|---|--------|-------------------|-----------|
| 1 | **Entry point** | Where does user enter this feature? Menu? Link? Redirect? Push notification? | PLAN.md — Technical Design |
| 2 | **Main action (CTA)** | What is the main action on the page? Which button is most prominent? | PLAN.md — Technical Design |
| 3 | **Empty state** | What shows when no data? Guide user to create first item? | TASKS.md — acceptance criteria |
| 4 | **Loading state** | What shows while loading? Skeleton? Spinner? Placeholder? | TASKS.md — acceptance criteria |
| 5 | **Error state** | What shows on error? Retry? Specific message? Fallback? | TASKS.md — acceptance criteria |
| 6 | **Permission/Role state** | Who can see this feature? Who cannot? What shows without permission? | PLAN.md — Guards/Middleware |
| 7 | **Responsive** | How does mobile differ from desktop? Table → stack? Menu → hamburger? | PLAN.md — Technical Design |

### Stack-specific adjustments

**Backend-only (NestJS API):** Skip Layers 2+3. Layer 1 still applies.

**Solidity:**

| # | Aspect | Question | Record in |
|---|--------|---------|-----------|
| 1 | **Wallet interaction** | How does user connect wallet? MetaMask? WalletConnect? | PLAN.md |
| 2 | **Transaction flow** | Approve → send → confirm → receipt? Gas estimation? | PLAN.md |
| 3 | **Pending state** | What shows while transaction pending? Tx hash? Loading? | TASKS.md |
| 4 | **Revert/Error state** | What shows on tx revert? Parse revert reason? | TASKS.md |
| 5 | **Permission/Role** | Who calls function? onlyOwner? Role-based? Wallet rejected? | PLAN.md |

**Flutter:**
- 7 web aspects apply, adjust:
  - **Responsive** → **Platform-specific**: iOS vs Android (navigation bar, back gesture, permissions)
  - **Entry point** → includes: deep link, push notification, widget/shortcut
  - Add: **Offline state** — what shows when offline? Cache? Retry?

**WordPress:**
- 7 aspects apply, adjust:
  - **Entry point** → admin menu position, plugin settings, block inserter
  - **Empty state** → activation state (plugin just activated, not configured)
  - Add: **Block editor integration** — block preview? Sidebar inspector? Placeholder?

### Advanced questions (complex features)

| # | Aspect | Question |
|---|--------|---------|
| 8 | **Cognitive load** | Does new feature overload the page? Need to split? |
| 9 | **Position in flow** | Where in user flow? Before/after which step? |
| 10 | **Breaking pattern** | Breaks what user is used to? Need migration path? |
| 11 | **Onboarding** | Will new user understand? Need tooltip/guide? |
| 12 | **Undo/Cancel** | Can it be undone? Destructive → confirm dialog |

### Workflow integration

**`/pd:plan` (Step 4):** Feature without UI → consider 7 aspects → record in PLAN.md `### UX States`. Cannot decide → "Technical Note", suggest user provide mockup.

**`/pd:write-code` (Step 2):** Read `UX States` in PLAN.md → each state MUST have code. PLAN.md missing → warn + self-supplement.

**Format in PLAN.md:**

```markdown
### UX States — [Feature name]
| State | Display | User action |
|-------|---------|------------|
| Empty | [description: illustration + CTA "Create first [X]"] | Click CTA → create form |
| Loading | [description: skeleton/spinner] | Wait |
| Error | [description: message + "Retry" button] | Click retry |
| No permission | [description: message "You don't have permission"] | Go back to previous page |
| Success | [description: toast/redirect] | Continue flow |

Entry point: [Sidebar menu → "Manage X" item]
Main CTA: ["Create new" button top-right corner]
Responsive: [Mobile: table → card list, filter → bottom sheet]
```

---

## Summary Checklist

### Before approving Roadmap
- [ ] Each requirement is user-oriented ("User can...")
- [ ] Success criteria are demonstrable
- [ ] Names consistent throughout documents
- [ ] Phase 1 is small enough

### Before approving Plan
- [ ] **Layer 2**: Existing UI patterns listed and reused
- [ ] **Layer 3**: New features have all 7 UX states (empty/loading/error/permission/responsive/entry/CTA)
- [ ] New patterns (if any) explain why existing ones cannot be reused
- [ ] Cognitive load does not increase excessively for current page

### Before coding
- [ ] UX States in PLAN.md have corresponding code
- [ ] Empty/Loading/Error states not forgotten
- [ ] Responsive handled (if frontend)
