# User Questioning Guide

> Used by: `/pd:new-milestone`, `/pd:plan --discuss`
> Ensures consistent, efficient, easy-to-understand questioning

## Principles

| # | Principle | Details |
|---|-----------|---------|
| 1 | Ask few, ask right | Maximum 3-5 questions per turn. Group related questions |
| 2 | Use AskUserQuestion | User selects with arrow keys — DO NOT ask to type text |
| 3 | First option is recommended | Add "(Recommended)" at end of label |
| 4 | Simple language | Write so non-programmers can understand |
| 5 | Fallback | AskUserQuestion unavailable → ask in text, wait for response |

## When to ask deeper

- Vague answer ("make it nice") → ask for specific criteria
- Multiple interpretations → provide examples + options
- Implicit constraints (deadline, budget, technical) → ask directly
- Generic listing → ask to break down

## When NOT to ask

- Already clear from CONTEXT.md, ROADMAP.md, SCAN_REPORT.md
- Only 1 reasonable choice
- Technical details user doesn't need to decide
- Already asked in same session

## How to write options

### Label
- 3-7 words, clear verb/noun
- E.g.: "Research first", "Skip", "Discuss further"

### Description
- Explain by **outcome/consequence** user can perceive
- NO bare technical jargon

| Bad | Good |
|-----|------|
| "httpOnly cookies — can't read from JS" | "Store login securely — hackers can't steal via website bugs" |
| "WebSocket real-time" | "Instant updates without reloading the page" |
| "Server-side rendering" | "Faster page load, better for Google search" |
| "Redis cache layer" | "Faster response for frequently visited pages" |

- Technical terms only when no simpler alternative → include brief explanation
- Pros/cons written briefly: "Pros: ..., Cons: ..."

## Question Grouping

| Count | How to ask |
|-------|-----------|
| 1 question | `multiSelect: false` — 2+ options |
| 2-4 questions | 1 `AskUserQuestion` with `multiSelect: true` |
| 5+ questions | Ask scope first ("Discuss all / Choose specific / Skip"), group ≤4 |

## Navigation

After AskUserQuestion with "Other":
> Select "Other" and type "back" to go back, or "cancel" to stop.

- `back` → return to previous question (first question → previous step)
- `cancel` → keep confirmed decisions, AI decides the rest → summary
- Other content → free-form answer → confirm understanding before continuing
