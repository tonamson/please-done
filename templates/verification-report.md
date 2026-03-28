# VERIFICATION_REPORT.md Template

> `/pd:write-code` creates (Step 9.5) | `/pd:what-next`, `/pd:complete-milestone` read

Feature verification report after a phase has completed coding. Confirms that PLAN.md Truths **actually work**.

- `CODE_REPORT_TASK_N.md` = code report for 1 task
- `TEST_REPORT.md` = automated/manual test results
- `VERIFICATION_REPORT.md` = end-to-end verification based on Truths

## Template

```markdown
# Feature Verification — Phase [x.x]
> Date: [DD_MM_YYYY HH:MM]
> Status: [Passed | Has gaps | Needs manual verification]
> Result: [N]/[M] Truths verified
> Fix rounds: [0 | 1 | 2]

## Truths Verified
| # | Truth | Status | Type | Evidence |
|---|-------|--------|------|----------|
| T1 | [description] | ✅ PASSED | Test | [test name pass N/N] |
| T2 | [description] | ✅ PASSED | Log | [console/API output] |
| T3 | [description] | ❌ FAILED | Screenshot | [screenshot description] |
| T4 | [description] | ⚠️ NEEDS MANUAL CHECK | Manual | [need to run app / check UI] |

## Artifacts
| Artifact | Path | Exists | Substantive | Connected | Issue |
|----------|------|--------|-------------|-----------|-------|
| [name] | [path] | ✅ | ✅ | ✅ | — |
| [name] | [path] | ✅ | ❌ | — | [stub: return null] |
| [name] | [path] | ❌ | — | — | [file does not exist] |

## Key Links
| From | To | Description | Status |
|------|----|-------------|--------|
| [file A] | [file B] | [A calls B.method()] | ✅ CONNECTED |
| [file C] | [file D] | [C imports D] | ❌ BROKEN | [D does not export needed function] |

## Anti-patterns Detected
| File | Line | Pattern | Severity |
|------|------|---------|----------|
| [path] | [N] | [TODO: implement] | ⚠️ Warning |
| [path] | [N] | [return null — stub] | 🛑 Blocking |

## Gaps Fixed (if fix rounds occurred)
### Round [1|2]
| Gap | Description | Fix Applied | Result |
|-----|-------------|-------------|--------|
| T2 failed | [details] | [files fixed] | ✅ Passed after fix |

## Summary
- Verified: [N] Truths
- Failed: [M] Truths
- Needs manual check: [K] Truths
- Anti-patterns: [X] blocking, [Y] warnings
```

## Rules

- Overall status: `Passed` = all ✅ | `Has gaps` = ≥1 ❌ after 2 fix rounds | `Needs manual verification` = automated passed but needs user confirmation
- Column "Substantive" = Level 2 verification (@references/verification.md)
- Column "Connected" = Level 3 verification
- 🛑 Blocking = must fix before proceeding | ⚠️ Warning = noted
- Stored at: `.planning/milestones/[version]/phase-[phase]/VERIFICATION_REPORT.md`
