# Phase 71: Core Standalone Flow - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-29
**Phase:** 71-Core Standalone Flow
**Areas discussed:** Standalone argument parsing, Guard implementation, Auto-detection strategy, Report & bug format
**Mode:** Auto (--auto flag — all decisions auto-selected with recommended defaults)

---

## Standalone Argument Parsing

| Option                        | Description                                          | Selected |
| ----------------------------- | ---------------------------------------------------- | -------- |
| Flag + optional path argument | `--standalone [path]` with file/dir auto-detection   | ✓        |
| Flag + required path argument | `--standalone` always requires a path, no bare usage |          |
| Subcommand style              | `pd:test standalone [path]` instead of flag          |          |

**User's choice:** [auto] Flag + optional path argument (recommended default)
**Notes:** `--standalone [path]` for specific target, `--standalone --all` for full project, bare `--standalone` prompts for input. Path auto-detects file vs directory.

---

| Option                           | Description                                                 | Selected |
| -------------------------------- | ----------------------------------------------------------- | -------- |
| File or directory, auto-detected | Single file → test that file; directory → scan and test all | ✓        |
| File only                        | Only accept single file paths, use --all for directories    |          |
| Glob pattern                     | Accept glob patterns like `src/**/*.ts`                     |          |

**User's choice:** [auto] File or directory, auto-detected (recommended default)
**Notes:** Invalid/nonexistent paths produce clear error and stop execution.

---

## Guard Implementation

| Option                            | Description                                                       | Selected |
| --------------------------------- | ----------------------------------------------------------------- | -------- |
| Inline conditional in test.md     | No new guard files; only test.md changes how it references guards | ✓        |
| New guard-standalone.md file      | Separate guard micro-template for standalone mode                 |          |
| Wrapper guard with mode parameter | Modify existing guards to accept mode param                       |          |

**User's choice:** [auto] Inline conditional in test.md (recommended default)
**Notes:** Requirement explicitly states shared guard files must not be modified. Standalone skips CONTEXT.md guard and task status check. FastCode/Context7 become soft warnings with fallback.

---

## Auto-Detection Strategy

| Option                | Description                                                                       | Selected |
| --------------------- | --------------------------------------------------------------------------------- | -------- |
| File-marker detection | Check nest-cli.json, composer.json, hardhat.config.\*, pubspec.yaml, package.json | ✓        |
| Config file approach  | Require a `.pd-standalone.json` config file                                       |          |
| CLI flag override     | `--stack nestjs` flag, no auto-detection                                          |          |

**User's choice:** [auto] File-marker detection (recommended default)
**Notes:** Priority order: NestJS → WordPress → Solidity → Flutter → Frontend-only → Error. Implemented inline in standalone flow Steps S1–S2.

---

## Report & Bug Format

| Option                                 | Description                                                  | Selected |
| -------------------------------------- | ------------------------------------------------------------ | -------- |
| Same structure in `.planning/reports/` | Mirrored TEST_REPORT.md layout with standalone header fields | ✓        |
| Simplified format                      | Minimal report — just pass/fail table                        |          |
| Console-only output                    | No file report, just terminal output                         |          |

**User's choice:** [auto] Same structure in `.planning/reports/` (recommended default)
**Notes:** `STANDALONE_TEST_REPORT_[YYYYMMDD_HHMMSS].md`, adds `Mode: Standalone` and `Target:` headers. No milestone/phase references.

---

| Option                              | Description                                 | Selected |
| ----------------------------------- | ------------------------------------------- | -------- |
| `Patch version: standalone` literal | Bug reports use literal "standalone" string | ✓        |
| `Patch version: 0.0.0`              | Use zero version for standalone             |          |
| No bug reports                      | Standalone mode doesn't create bug reports  |          |

**User's choice:** [auto] `Patch version: standalone` literal (recommended default per REPORT-02)
**Notes:** `complete-milestone.md` will ignore standalone bugs (Phase 72 scope).

---

## Agent's Discretion

- Exact error message wording for auto-detection failures
- Directory scan depth (shallow vs recursive) when `[path]` is a directory
- Test case ordering within standalone report

## Deferred Ideas

None — discussion stayed within phase scope.
