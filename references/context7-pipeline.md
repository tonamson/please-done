# Context7 Pipeline

> Used by: write-code, plan, new-milestone, fix-bug, test
> Single source of truth for external library lookup process

## When

ANY task using an external library -> AUTOMATIC lookup, NO user request needed.

## Step 0: Version

Before resolving, detect library version from manifest:

| Manifest | Stack | Parse |
|----------|-------|-------|
| `package.json` | Node.js | dependencies + devDependencies -> name:version |
| `pubspec.yaml` | Flutter | dependencies -> name:version |
| `composer.json` | PHP | require + require-dev -> name:version |

Multiple manifests (monorepo) -> prioritize the file closest to the code being edited.
Heuristic: `nest-cli.json` -> backend, `next.config.*` -> frontend.
Not found -> use "latest", add note.

## Step 1: Resolve

`resolve-library-id` for EACH library -> get ID.
Multiple libraries -> resolve ALL before querying.

## Step 2: Query

`query-docs` with resolved ID -> docs. Pass version into topic/query if available.

## Fallback (Context7 error or no results)

Automatically try in order, DO NOT ask user:

| # | Source | Method | Success condition |
|---|--------|--------|-------------------|
| 1 | Project docs | Glob `.planning/docs/*.md` -> match library name | Found file with relevant content |
| 2 | Codebase | Grep import/usage patterns in existing code | Found library usage patterns |
| 3 | Training data | Model's built-in knowledge | Always available (last resort) |

Fallback 3 (training data) -> display: "Using built-in knowledge, may not be accurate for current version."

ALL sources fail -> use training data with warning.

## Transparency

Every lookup, print 1 line: `[library] v[version] -- source: [source name]`
E.g.: `@nestjs/common v10.3.0 -- source: Context7`
