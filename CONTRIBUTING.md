<!-- generated-by: pd-doc-writer -->
# Contributing to please-done

Thanks for your interest in contributing! **please-done** is a cross-platform AI coding skills toolkit — one source of `pd:*` skills installed natively into Claude Code, Codex CLI, Gemini CLI, OpenCode, GitHub Copilot, Cursor, Windsurf, and more. Contributions that improve skill quality, expand platform coverage, or fix bugs are all welcome.

## Table of Contents

1. [How to contribute](#how-to-contribute)
2. [Development setup](#development-setup)
3. [Contribution types](#contribution-types)
4. [How to add a new skill](#how-to-add-a-new-pd-skill)
5. [How to add a new platform](#how-to-add-a-new-platform)
6. [Code style](#code-style)
7. [Running tests](#running-tests)
8. [PR process](#pr-process)
9. [Community standards](#community-standards)

---

## How to contribute

| Path | When to use |
|---|---|
| **GitHub Issues** | Bug reports, feature requests, new platform proposals |
| **Pull Requests** | Bug fixes, new skills, platform support, documentation |
| **Discussions** | Design questions, "is this a good idea?" conversations before you write code |

Before opening a PR for a large change (new platform, reworked skill category), open an issue first to align on direction. Small fixes and documentation improvements can go straight to a PR.

---

## Development setup

**Prerequisites:** Node.js `>= 16.7.0`

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/<your-username>/please-done.git
cd please-done

# 2. Install dev dependencies (c8 for coverage, js-yaml for converters)
npm install

# 3. Verify the test suite passes
npm test
```

No build step is required — the project is plain Node.js. You can run any `bin/` script directly with `node`.

---

## Contribution types

### Bug fixes
Open an issue first if the bug is not already tracked. Include the platform you are on, the `please-done` version (`cat VERSION`), and the exact error message.

### New `pd:*` skills
Skills are Markdown files in `commands/pd/` with YAML frontmatter. Adding one new `.md` file is the only required step; the installer transpiles it for every platform automatically. See [How to add a new skill](#how-to-add-a-new-pd-skill) below.

### New platform support
Adding a platform requires changes to the platform registry, a converter module, and an installer module. See [How to add a new platform](#how-to-add-a-new-platform) below.

### Documentation
Fix a typo, clarify a skill description, improve inline comments in `bin/lib/*.js`, or add/update a `references/` doc. Documentation PRs are reviewed quickly.

### Agent sub-skills
Agents live in `commands/pd/agents/` and follow the same Markdown format as top-level skills. Add the file there and it will be picked up by the installer alongside the main skills.

### Rule files
Shared rule fragments live in `commands/pd/rules/` and `commands/pd/rules/general.md`. These are `@referenced` by skills at runtime via the `inlineWorkflow` step of the converter.

---

## How to add a new `pd:*` skill

Every skill is a single Markdown file with a YAML frontmatter block followed by a prompt body. The file name determines the skill name.

**1. Create the skill file**

```
commands/pd/<skill-name>.md
```

**2. Write the frontmatter**

```yaml
---
name: pd:<skill-name>
description: One-line description shown in the platform skill picker
model: haiku         # haiku | sonnet | opus — pick the lightest model that fits
argument-hint: "[optional args description]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---
```

Use canonical Claude Code tool names (`Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep`, `Agent`, `WebFetch`, `WebSearch`). The converters in `bin/lib/converters/` translate these to the correct names for each platform at install time using the `TOOL_MAP` in `bin/lib/platforms.js`.

**3. Write the prompt body**

Structure the body with `<objective>`, `<guards>`, and `<context>` sections — follow the style in any existing skill such as `commands/pd/fix-bug.md` or `commands/pd/plan.md`. Guards use `@references/guard-*.md` fragments; reference the appropriate ones for your skill.

**4. Test the skill locally**

```bash
# Install the skill into your local Claude Code config for manual smoke-testing
npm run install:claude

# Run the test suite to confirm no existing tests break
npm test
```

**5. Add a test if appropriate**

Integration tests live in `test/integration/`. Smoke tests live at the top level of `test/`. When the skill has distinct failure modes, adding a smoke test is encouraged.

---

## How to add a new platform

Adding a platform touches five files. Use an existing platform (e.g. `opencode`) as your reference implementation throughout.

### Step 1 — Register the platform in `bin/lib/platforms.js`

Add a `TOOL_MAP` entry (map canonical Claude tool names → the platform's names; empty object if they are identical):

```js
// bin/lib/platforms.js
const TOOL_MAP = {
  // ... existing entries ...
  myplatform: {
    Read:      'read_file',
    Write:     'write_file',
    Bash:      'run_command',
    // omit tools that share the Claude name
  },
};
```

Add a `PLATFORMS` entry:

```js
const PLATFORMS = {
  // ... existing entries ...
  myplatform: {
    name:               'My Platform',
    description:        'Short description of the AI runtime',
    dirName:            '.myplatform',          // config directory name in $HOME
    commandPrefix:      '/pd:',                 // how skills are invoked
    commandSeparator:   ':',
    envVar:             'MYPLATFORM_CONFIG_DIR', // env override
    skillFormat:        'nested',               // 'nested' | 'flat' | 'skill-dir'
    frontmatterFormat:  'yaml',                 // 'yaml' | 'toml'
    toolMap:            TOOL_MAP.myplatform,
  },
};
```

Add the default path resolution inside `getGlobalDir()`:

```js
case 'myplatform':
  return path.join(home, '.myplatform');
```

### Step 2 — Create a converter in `bin/lib/converters/myplatform.js`

Copy `bin/lib/converters/opencode.js` as a starting point and adjust the `buildFrontmatter`, `pdconfigFix`, `mcpToolConvert`, and `postProcess` hooks to match your platform's skill format. The shared pipeline lives in `bin/lib/converters/base.js` — call `convertSkill(content, config)` from there.

### Step 3 — Create an installer in `bin/lib/installers/myplatform.js`

Copy `bin/lib/installers/opencode.js` as a starting point. Implement the `install(skillsDir, targetDir, options)` export. The function should:

1. Check that the platform CLI is available (`commandExists`).
2. Determine the target directory (global vs local).
3. Convert and write each skill file from `commands/pd/` using your converter.
4. Write the manifest via `writeManifest` (from `bin/lib/manifest.js`).

### Step 4 — Wire the CLI flag in `bin/install.js`

Add a `case '--myplatform':` in `parseArgs()` and a `case 'myplatform':` in the runtime dispatch block. Also add `'myplatform'` to `npm run install:myplatform` in `package.json` scripts if you want a named shortcut.

### Step 5 — Add tests

Add a file `test/smoke-all-platforms.test.js` assertion (or a dedicated smoke test) that validates the converter output round-trips correctly for your platform.

---

## Code style

There is no enforced linter or formatter at this time. Follow the conventions already present in the files you touch:

- **`'use strict';`** at the top of every CommonJS module.
- **`const` over `let`** unless reassignment is necessary; no `var`.
- **JSDoc on exported functions** — include `@param` and `@returns` types.
- **Section comment banners** use the `// ─── Section Name ───` style found throughout `bin/lib/`.
- **Error messages** are sentence-cased and actionable (tell the user what to do, not just what went wrong).
- **No external runtime dependencies** — the project has zero production `dependencies` in `package.json`. Keep it that way; everything must work with the Node.js standard library.

---

## Running tests

```bash
# Full test suite
npm test

# Smoke tests only (fast — good for development iteration)
npm run test:smoke

# Integration tests
npm run test:integration

# Coverage report
npm run test:coverage

# Specific test files
npm run test:platforms   # all-platforms smoke
npm run test:converters  # converter round-trips
npm run test:utils       # utility functions
```

Tests use Node.js's built-in `node:test` runner (no external test framework). Coverage is measured with `c8`. There is no enforced coverage threshold, but PRs that drop coverage on modified paths will receive a review note.

---

## PR process

1. **Fork** the repo and create a branch: `feat/add-myplatform`, `fix/gemini-toml-escape`, `docs/update-architecture`.
2. **Keep PRs focused** — one platform, one skill, or one bug fix per PR. Large batched changes are harder to review.
3. **Update the description** in `commands/pd/<skill>.md` and/or `bin/lib/platforms.js` as appropriate for your change.
4. **Run the full test suite** (`npm test`) before pushing. Broken tests block merge.
5. **Write a clear PR description** covering: what changed, why, and how to test it manually.
6. **Changelog is managed separately** — do not edit `CHANGELOG.md` in your PR.
7. **Review turnaround** — expect a first review within a few days. Maintainers may request changes; address them with new commits rather than force-pushing during active review.
8. **Squash on merge** — the maintainer will squash your commits into a single conventional commit on `main`.

---

## Community standards

This project follows standard open-source collaboration norms: be respectful, be constructive, and assume good intent. No formal Code of Conduct document exists yet — one will be added as the contributor community grows.

Please report any conduct concerns directly to the maintainer via the GitHub repository contact.

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE) that covers this project.
