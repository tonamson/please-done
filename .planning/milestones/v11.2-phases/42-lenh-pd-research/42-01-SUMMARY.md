---
phase: 42-lenh-pd-research
plan: 01
subsystem: research-store
tags: [routeQuery, keyword-heuristic, TDD, pure-function]
dependency_graph:
  requires: []
  provides: [routeQuery]
  affects: [research-store.js]
tech_stack:
  added: []
  patterns: [keyword-heuristic-routing, regex-pattern-matching]
key_files:
  created: []
  modified: [bin/lib/research-store.js, test/smoke-research-store.test.js]
decisions:
  - id: D-PASCAL
    summary: "PascalCase regex yeu cau lowercase sau uppercase thu 2 de tranh match ten thu vien (GraphQL, PostgreSQL)"
metrics:
  duration: 133s
  completed: "2026-03-26T02:30:00Z"
  tasks: 1
  tests_added: 20
  tests_total: 87
---

# Phase 42 Plan 01: routeQuery Keyword Heuristic Routing Summary

routeQuery pure function phan loai query thanh internal/external bang 10 regex patterns, TDD voi 20 test cases moi, PascalCase regex duoc tinh chinh de tranh false positive voi ten thu vien.

## Ket qua

| Hang muc | Gia tri |
|----------|---------|
| Function moi | routeQuery(query) -> 'internal' \| 'external' |
| Internal patterns | 10 regex (file extensions, paths, keywords, camelCase, PascalCase) |
| Test cases moi | 20 (10 internal + 5 external + 5 edge cases) |
| Tong tests | 87/87 PASS |
| Thoi gian | 133s |

## Commits

| Hash | Loai | Mo ta |
|------|------|-------|
| 9c2045e | test | RED phase — 20 failing test cases cho routeQuery |
| e144793 | feat | GREEN phase — routeQuery implementation, 87/87 PASS |

## Chi tiet ky thuat

### routeQuery Internal Patterns (10 regex)

1. File extensions: `.ts`, `.js`, `.tsx`, `.jsx`, `.mjs`, `.cjs`
2. Source extensions: `.py`, `.rb`, `.go`, `.rs`, `.java`, `.dart`
3. Config extensions: `.md`, `.json`, `.yaml`, `.yml`, `.toml`
4. Path patterns: `src/`, `lib/`, `bin/`, `test/`, `commands/`, `workflows/`
5. Relative paths: `./`
6. Definition keywords: `ham`, `function`, `class`, `interface`, `type`, `enum`
7. Test file patterns: `*.test.*`, `*.spec.*`
8. camelCase: `validateConfidence`, `createUser`
9. PascalCase: `AuthController`, `UserPayload` (yeu cau lowercase sau uppercase thu 2)

### Fallback Logic (D-03)

- Khong match pattern nao -> return `'external'`
- Input khong hop le (null, undefined, empty, non-string, whitespace) -> return `'external'`

## Quyet dinh

### D-PASCAL: PascalCase regex tinh chinh

**Van de:** Regex `/[A-Z][a-z]+[A-Z][a-zA-Z]*/` match ca ten thu vien nhu "PostgreSQL", "GraphQL" -> false positive.

**Giai phap:** Doi thanh `/[A-Z][a-z]+[A-Z][a-z]+[a-zA-Z]*/` — yeu cau it nhat 1 ky tu lowercase SAU uppercase thu 2. "AuthController" (Co -> ontroller) van match, "PostgreSQL" (SQ -> khong co lowercase) khong match.

## Sai lech so voi ke hoach

Khong co sai lech lon. PascalCase regex duoc tinh chinh trong GREEN phase (Rule 1 — auto-fix bug) de tranh false positive voi ten thu vien.

## Known Stubs

Khong co stubs.

## Self-Check: PASSED
