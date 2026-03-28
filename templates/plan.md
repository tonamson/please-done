# PLAN.md Template

> `/pd:plan` creates | `/pd:write-code`, `/pd:test`, `/pd:fix-bug` read

Detailed technical design for 1 phase: objective, decisions, research, design, execution order.

- `TASKS.md` = task list (@templates/tasks.md)
- `ROADMAP.md` = phases overview (@templates/roadmap.md)
- `PLAN.md` = technical design for 1 phase

## Template

```markdown
# Implementation Plan
> Milestone: [name] (v[x.x])
> Phase: [x.x]
> Mode: [Auto | Discuss]
> Created: [DD_MM_YYYY]

## Objective
[Describe the phase goal — product-oriented, not just technical]

## Design Decisions

<!-- DISCUSS → original table: -->
| # | Issue | Decision | Source |
|---|-------|----------|--------|
| 1 | [Name] | [Approach] | User selected / Claude decided |

<!-- AUTO (or DISCUSS skip-all) → expanded table: -->
| # | Issue | Selected Approach | Reason | Rejected Alternatives |
|---|-------|-------------------|--------|-----------------------|
| 1 | [Name] | [Approach] | [Why chosen] | [Other options → why rejected] |

<!-- DISCUSS hybrid → original table + Reason/Alternatives notes for Claude's self-decisions -->
<!-- No decisions → write: -->
No special design decisions — everything is clearly defined from ROADMAP/CONTEXT.

## Research
> Details: see [RESEARCH.md](./RESEARCH.md)

### Research Summary
<!-- Condensed from RESEARCH.md — keep only information affecting design -->

### Available Libraries
| Name | Version | Used For |

### Reusable Code
| Function/Service | File | Description |

### Research Warnings
<!-- Extracted from RESEARCH.md "Do Not Build From Scratch" + "Pitfalls" — only items affecting design -->

### Fetched Documentation
| Name | Relevant Sections |

## Technical Design

<!-- ONLY create sections with data, skip irrelevant sections -->

<!-- Backend -->
### API Endpoints
| Method | Path | Description | Authentication |

### Database
[Schema + migration strategy]

### DTOs & Validation

<!-- WordPress -->
### Plugin/Theme Architecture
[Plugin/theme structure]

### Custom Post Types & Taxonomies
| Name | Slug | Description |

### REST API Endpoints
| Route | Callback | Permission |

### Hooks & Filters
| Type | Hook Name | Callback | Description |

<!-- Solidity -->
### Contract Architecture
| Name | Base Contract | Description |

### Contract Functions
| Function | Visibility | Modifiers | Description |

### Token Interactions
[SafeERC20, approve patterns]

<!-- Flutter -->
### Screens & Navigation
| Route | View | Logic | Binding |

### State Management (GetX)
| Controller | State | Reactive Variables |

### Design System Tokens
[AppColors, AppSpacing, AppTextStyles]

<!-- General — ALWAYS create -->
### Files to Create/Modify
| Action | Path | Description |

### Libraries to Add

## UI/UX Design (if applicable)

<!-- Layer 2 — Inherit patterns from existing code (@references/ui-brand.md) -->
### UI — Inherited Patterns
| Pattern | Referenced From | Applied To |
|---------|----------------|------------|

### UI — New Patterns (if any)
| Pattern | Reason Not Reusing | Description |
|---------|---------------------|-------------|

<!-- Layer 3 — UX States for new features (@references/ui-brand.md) -->
### UX States — [Feature Name]
| State | Display | User Action |
|-------|---------|-------------|
| Empty | [description] | [action] |
| Loading | [description] | [action] |
| Error | [description] | [action] |
| No permission | [description] | [action] |
| Success | [description] | [action] |

Entry point: [where to enter from]
Main CTA: [primary button/action]
Responsive: [how mobile differs from desktop]

## Success Criteria (Goal-backward)

<!-- Reason BACKWARD from the objective: "What must be TRUE when the phase is complete?"
  Not a task list but OBSERVABLE OUTCOMES. Each criterion = 1 verifiable fact. -->

### Required Truths
<!-- Each line = 1 thing that MUST be TRUE when phase is complete. Affirmative, verifiable. -->
| # | Truth | Business Value | Edge Cases | Verification Method |
|---|-------|---------------|------------|---------------------|
| T1 | [e.g.: User can log in with email + password] | [e.g.: Ensure account security] | [e.g.: Wrong password 5 times, empty email, expired token] | [e.g.: POST /auth/login returns valid JWT] |
| T2 | [e.g.: Token expires after 1 hour] | [e.g.: Protect login session] | [e.g.: Tampered token, expired refresh token] | [e.g.: JWT decode → exp = iat + 3600] |

### Required Artifacts
<!-- Files/modules that MUST exist. Each artifact traces back to ≥1 Truth. "Automated Check" column → @references/verification.md -->
| Artifact | Expected Path | Serves Truth | Automated Check |
|----------|---------------|--------------|-----------------|
| [e.g.: Auth service] | [src/auth/auth.service.ts] | T1, T2 | `exports: [login, register]`, `min_lines: 30` |
| [e.g.: Auth controller] | [src/auth/auth.controller.ts] | T1 | `imports: [AuthService]`, `contains: "@Post('login')"` |

### Key Links
<!-- How artifacts CONNECT to each other. Broken link → Truth not met. -->
| From | To | Description |
|------|----|-------------|
| [e.g.: auth.controller] | [auth.service] | [Controller calls service.login()] |

### Gap Analysis
<!-- Self-check: Which Truths are NOT YET covered? Leave empty if no gaps. -->
No gaps — all Truths are covered by the technical design and artifacts above.

## Execution Order

> Each task in TASKS.md MUST have an `Effort:` field in the metadata line.
> Default: `standard`. See @references/conventions.md.

1. [Step 1]
2. [Step 2]

## Technical Notes
```

## Rules

- **ONLY create sections with data** — skip irrelevant sections for the stack
- Section "Design Decisions": **ALWAYS** create in both modes
- Section "Success Criteria (Goal-backward)": **ALWAYS** create — missing = plan is incomplete
- Code MUST follow decisions in the table — cannot follow → STOP, notify user
