# Phase 95: LINT-01 — Lint Failure Tracking - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-04
**Phase:** 95-LINT-01 — Lint Failure Tracking
**Areas discussed:** API Design, Integration Points, Storage Scope, Threshold Signaling
**Mode:** Auto (--auto flag used)

---

## API Design

| Option | Description | Selected |
|--------|-------------|----------|
| Simple Counter Functions | `incrementLintFail()`, `getLintFailCount()`, `resetLintFail()` | ✓ |
| Configurable Counter | Includes `setLintFailCount(n)`, `configureThreshold()` | |
| Event Emitter Pattern | `on('lintFail', callback)`, event-based | |

**User's choice:** Simple Counter Functions (auto-selected as recommended)
**Notes:** Cleanest API matching existing codebase patterns. Threshold hardcoded at 3 to match existing write-code.md logic.

---

## Integration Points

| Option | Description | Selected |
|--------|-------------|----------|
| write-code + fix-bug | Core skills that encounter lint | ✓ |
| All 16 skills | Wire into every skill | |
| write-code only | Minimal integration | |

**User's choice:** write-code + fix-bug (auto-selected as recommended)
**Notes:** Primary integration is write-code Step 5. fix-bug can optionally reset lint count when resolving issues.

---

## Storage Scope

| Option | Description | Selected |
|--------|-------------|----------|
| PROGRESS.md only | Per-task scope, auto-reset | ✓ |
| STATE.md only | Cross-task tracking | |
| Both files | Dual tracking (complex) | |

**User's choice:** PROGRESS.md only (auto-selected as recommended)
**Notes:** Matches Phase 76 design. Counter resets naturally when PROGRESS.md deleted after successful commit.

---

## Threshold Signaling

| Option | Description | Selected |
|--------|-------------|----------|
| Return status object | `{count, thresholdReached, lastError}` | ✓ |
| Throw exception | Throw when threshold reached | |
| Boolean only | Just return `isThresholdReached` | |

**User's choice:** Return status object (auto-selected as recommended)
**Notes:** Consistent with other libs in codebase. Caller decides action based on `thresholdReached` flag.

---

## Claude's Discretion

- Function naming conventions (follow existing bin/lib/*.js patterns)
- Whether to expose `setLintFailCount(n)` for testing
- Exact error message truncation threshold
- DEBUG logging integration

## Deferred Ideas

- Cross-task lint history in STATE.md — out of scope
- Configurable threshold — future enhancement
- Integration with pd:test beyond basic wiring
- Integration with skills other than write-code/fix-bug

---

*Auto-generated discussion log for --auto mode*
