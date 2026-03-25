# Coding Conventions

**Analysis Date:** 2026-03-22

## Naming Patterns

**Files:**
- Module files: `lowercase-with-hyphens.js` (VD: `smoke-utils.test.js`, `smoke-converters.test.js`)
- Index/entry points: `install.js`, `manifest.js`, `utils.js`
- Converters: `[platform-name].js` (VD: `codex.js`, `gemini.js`, `copilot.js`, `opencode.js`)
- Installers: `[platform-name].js` in `installers/` directory

**Functions:**
- camelCase for all functions: `parseFrontmatter()`, `buildFrontmatter()`, `listSkillFiles()`
- Helper functions: prefixed with meaningful verb or action: `generateManifest()`, `detectChanges()`, `extractXmlSection()`
- Async functions: `async function functionName()` (no special prefix)
- Factory/builder functions: `generate*`, `build*`, `create*` (VD: `generateManifest()`, `buildFrontmatter()`)

**Variables:**
- camelCase for local variables and parameters: `const skillName`, `let configDir`
- UPPER_CASE for file/module-level constants: `MANIFEST_NAME`, `TOTAL_STEPS`, `PLATFORMS`
- Prefix booleans with `is` or `has`: `isGlobal`, `commandExists()`
- Directory/path variables: `*Dir` suffix (VD: `skillsDir`, `targetDir`, `configDir`)
- Relative paths: `*Path` suffix with underscore prefix for internal helpers (VD: `filePath`, `absPath`)

**Types/Objects:**
- Constants are UPPER_CASE objects or primitives: `PLATFORMS`, `COLORS`, `TOOL_MAP`
- Config objects: descriptive camelCase: `frontmatter`, `manifest`, `flags`
- Result objects returned from functions: descriptive and clear (VD: `{ frontmatter, body, raw }`)

## Code Style

**Formatting:**
- Indentation: 2 spaces (consistent throughout)
- Line breaks: Always use `;` (semicolon-required style)
- No automatic formatter detected (no eslint or prettier config files)
- Consistent spacing: spaces around operators, after keywords

**Linting:**
- Not detected — no `.eslintrc`, `.prettierrc`, or linting config files
- Code is hand-formatted following Node.js convention
- Strict mode: `'use strict';` used in all modules

**Comments:**
- Block comments for section headers: `// ─── Section Name ────` (uses box drawing characters)
- Function JSDoc comments before definitions with parameters and return types
- Inline comments explain complex logic, regex patterns, or transformations
- Comments in Vietnamese (matches project language)

## Import Organization

**Order:**
1. Built-in Node.js modules: `require('fs')`, `require('path')`, `require('crypto')`
2. Core utilities from same project: `require('../utils')`, `require('../lib/platforms')`
3. Module exports immediately follow imports

**Path Aliases:**
- No alias system — relative paths only
- Relative paths use `../` to traverse up directories
- Absolute paths use `path.resolve(__dirname, '...')` for reliable root-relative access

**Module exports:**
```javascript
module.exports = {
  functionOne,
  functionTwo,
  constantOne,
};
```

## Error Handling

**Patterns:**
- Try-catch used for command execution and file operations
- `ignoreError` option passed to exec() for non-critical operations
- Silent failures in `catch` blocks when errors are expected: `catch { /* ignore */ }`
- Named error variables in catch blocks when error details needed: `catch (err) { ... throw err; }`
- Process exits with `process.exit(1)` for critical failures
- Custom errors not thrown — use log functions instead for user-facing errors

**Examples:**
```javascript
try {
  execSync(`command`, { stdio: 'ignore' });
  return true;
} catch {
  return false;  // Silent failure for optional checks
}

try {
  exec(`git submodule update`, { ignoreError: true });
} catch (err) {
  if (options.failFast) throw err;
}
```

## Logging

**Framework:** Custom `log` object in `bin/lib/utils.js` (not console directly)

**Log levels:**
- `log.info(msg)` — Informational messages
- `log.success(msg)` — Success messages with green checkmark `✓`
- `log.warn(msg)` — Warnings with yellow caution symbol `⚠`
- `log.error(msg)` — Errors with red cross `✗`
- `log.step(num, total, msg)` — Progress indication `[num/total] msg`
- `log.banner(lines)` — Boxed banner with cyan borders

**Patterns:**
- Logged before taking action: `log.step(1, TOTAL_STEPS, 'Checking prerequisites...')`
- Immediate feedback on success/failure: `log.success('Component ready')`
- No direct `console.log()` in library code — only in `bin/install.js` for interactive UI

## Frontmatter Handling

**Format:** YAML between `---` delimiters

**Standard fields:**
- `name`: Skill name (prefixed with `pd:` or platform-specific format)
- `description`: Short description
- `allowed-tools`: Array of tool names (CLI, MCP tools, custom tools)
- `argument-hint`: Optional hint for command arguments

**Parsing convention:**
- Parse using `parseFrontmatter()` → returns `{ frontmatter: object, body: string, raw: string }`
- Build using `buildFrontmatter(object)` → returns YAML string
- Assemble final markdown with `assembleMd(frontmatter, body)`

## XML Section Extraction

**Pattern:** Custom XML-like tags in markdown body for structured content

**Standard tags:**
- `<objective>` — Skill objective statement
- `<context>` — Context and requirements
- `<process>` — Step-by-step process or instructions
- `<rules>` — Rules and constraints
- `<execution_context>` — References to templates/workflows
- `<required_reading>` — Files to read before executing

**Extraction utility:**
```javascript
const content = extractXmlSection(body, 'process');  // Returns inner content or null
```

## Async Patterns

**Promise-based:**
- Use `async/await` for installer functions
- Interactive prompts use Promise-based `readline` wrappers:
```javascript
function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}
```

**Error propagation:**
- Let errors bubble up from async operations
- Catch only when handling gracefully (e.g., optional commands)

## Conditional Checks

**Existence checks:**
- `fs.existsSync(path)` for file/directory checks
- Optional chaining not used (targets Node.js 16.7.0+, supports it but not convention)
- Explicit null/falsy checks: `if (!value)`, `if (value === null)`

**Regex patterns:**
- Global flag for multiple replacements: `/pattern/g`
- Case-insensitive option: `(?i)` in inline patterns or `new RegExp(..., 'i')`
- Word boundary: `\b` for exact token matching
- Multiline handling: `[\s\S]*?` for content with line breaks (non-greedy)

## Data Structure Conventions

**Arrays of objects:**
```javascript
const skills = listSkillFiles(dir);  // Returns: [{ name, filePath, content }, ...]
const refs = extractReadingRefs(content);  // Returns: array of unique strings
const changes = detectChanges(configDir);  // Returns: [{ relPath, status }, ...]
```

**Objects tracking state:**
```javascript
const flags = {
  runtimes: [],
  isGlobal: true,
  uninstall: false,
  configDir: null,
};

const manifest = {
  version,
  timestamp: new Date().toISOString(),
  fileCount: number,
  files: { 'relative/path': 'sha256hash' },
};
```

## File Operations

**Reading:**
- `fs.readFileSync(path, 'utf8')` for synchronous reads (blocking but simple for install scripts)
- `fs.readdirSync(dir)` to list files
- `fs.readdirSync(dir, { withFileTypes: true })` when need file type info

**Writing:**
- `fs.writeFileSync(path, content, 'utf8')` with explicit encoding
- Always append newline to JSON files: `+ '\n'`
- `fs.mkdirSync(path, { recursive: true })` for directory creation

**Hashing:**
- SHA256 for file integrity: `crypto.createHash('sha256').update(content).digest('hex')`
- Used for change detection in manifest system

## Module Structure

**Exports pattern:**
Each module exports related functions as named exports:

```javascript
module.exports = {
  parseFrontmatter,
  buildFrontmatter,
  extractXmlSection,
  listSkillFiles,
  // ... other exports
};
```

**Dependency injection:**
- Pass `skillsDir` or `rootDir` to converter functions to enable relative file access
- No global state — functions are pure when possible

---

*Convention analysis: 2026-03-22*
