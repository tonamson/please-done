# Version Bump Guide

This document standardizes the version bumping process for the entire `please-done` repo.

Goals:
- Prevent version mismatches between files
- Clearly distinguish `patch` from `upgrade`
- Have a fixed checklist before release

## Version Standard

This repo uses Semantic Versioning:

- `MAJOR.MINOR.PATCH`
- Example: `2.7.1`

Meaning:
- `PATCH`: bug fixes, wording adjustments, converter/installer fixes, small additions that don't break existing behavior
- `MINOR`: new features, new skills, new stack support, new workflows, new evals without breaking compatibility
- `MAJOR`: breaking changes, command syntax changes, installation structure changes, output format changes making old versions incompatible

## When to Bump Patch

Bump `PATCH` when changes fall into one of these categories:

- Fix bugs in installer, converter, utils
- Fix documentation, README, changelog, wording
- Fix detection logic without changing public contract
- Add warnings, validation, guard rails
- Add small rules or adjust prompts for stability
- Fix metadata mismatches, packaging, version sync

Example:
- `2.7.1` -> `2.7.2`

## When to Bump Upgrade

In this repo, "bump upgrade" means bumping at `MINOR` or `MAJOR` level.

### Minor Upgrade

Bump `MINOR` when:

- Adding a new skill
- Adding runtime/platform support
- Adding new stack support like Flutter, Solidity, WordPress
- Adding significant workflows, templates, references
- Adding eval suite or new capability while maintaining backward compatibility

Example:
- `2.7.1` -> `2.8.0`

### Major Upgrade

Bump `MAJOR` when:

- Renaming commands forcing users to change usage habits
- Changing output format, installation file structure, or config format
- Removing runtime support
- Changing workflows in a way that affects repos already using them

Example:
- `2.7.1` -> `3.0.0`

## Files That Must Be Version-Synced

Every time you bump version, check at minimum these files:

1. `VERSION`
2. `package.json`
3. `package-lock.json`
4. `README.md`
5. `CHANGELOG.md`

## How to Bump Patch

Example bumping from `2.7.1` to `2.7.2`.

### Step 1: Update version source

Edit files:

- `VERSION` -> `2.7.2`
- `package.json` -> `"version": "2.7.2"`

### Step 2: Sync lockfile

Run:

```bash
npm install --package-lock-only
```

Goal:
- Update `package-lock.json`
- Prevent mismatch between `package.json` and `package-lock.json`

### Step 3: Update README

Find and fix all places showing version:

- Version badge
- "Current version" line

### Step 4: Write changelog

Add new entry at the top of `CHANGELOG.md` using the existing format:

```md
## [2.7.2] - DD_MM_YYYY
### Fixed
- Change description
```

If it's a docs or metadata patch, describe it accurately — don't inflate it as a feature.

### Step 5: Final check

Checklist:

- `VERSION` correct
- `package.json` correct
- `package-lock.json` correct
- `README.md` has no old version in public sections
- `CHANGELOG.md` has new entry

## How to Bump Minor Upgrade

Example bumping from `2.7.1` to `2.8.0`.

Same steps as patch, but changelog should be clearly divided:

- `### Added`
- `### Changed`
- `### Fixed`

Additional checklist:

- README describes the new feature
- Skills/platforms/stacks lists are updated
- Related integration documentation is synced

## How to Bump Major Upgrade

Example bumping from `2.7.1` to `3.0.0`.

In addition to the steps above, mandatory additions:

- `### Breaking changes` section in changelog
- Migration guide in `README.md` or separate document
- Clearly state what users need to do after updating

Should also include:

- Before/after command examples
- Old name → new name mapping
- Warning for old local configs

## Changelog Writing Rules

Prioritize recording actual impact:

- Which file changed
- Why it changed
- What benefit to users
- Whether there are breaking changes

Avoid vague entries like:

- "Improved the system"
- "Optimization"
- "Fixed many small bugs"

## Minimum Release Process

Before publishing:

1. Decide bump type: `patch`, `minor`, or `major`
2. Sync all version files
3. Update `CHANGELOG.md`
4. Check if `README.md` still has old version
5. Run minimum checks:

```bash
npm test
```

If there's an eval pipeline, also run:

```bash
npm run eval
```

6. Create git tag:

```bash
git tag v2.8.0
```

7. Push tag to remote (when ready to release):

```bash
git push origin v2.8.0
```

## Quick Copy Checklist

```md
- [ ] Determine correct bump type
- [ ] Edit VERSION
- [ ] Edit package.json
- [ ] Regenerate package-lock.json
- [ ] Edit README badge + current version
- [ ] Add new entry to CHANGELOG.md
- [ ] Check no old version remains in public files
- [ ] Run minimum tests
- [ ] Run eval if available
- [ ] Create git tag: `git tag v[version]`
- [ ] Push tag: `git push origin v[version]` (when ready to release)
```

## Further Standardization Suggestions

To raise version standards across the repo, consider:

- Only release when `VERSION`, `package.json`, `package-lock.json` all match
- Add CI check that fails if version is mismatched
- Have a script that auto-checks version files before publishing
- Rules: docs-only fix → bump `patch`, new feature → bump `minor`, breaking change → bump `major`

## Conclusion

If changes are small, bug fixes, documentation adjustments: bump `PATCH`.

If adding new capability without breaking compatibility: bump `MINOR`.

If there's a breaking change: bump `MAJOR`.

The most important principle is:

- Bump the right version level
- Sync all public files
- Write a clear changelog
- Create a git tag to mark the release milestone
