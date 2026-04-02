# Stack Research — v8.0
# Developer Experience & Quality Hardening

**Project:** please-done (cross-platform AI coding skill framework)
**Milestone:** v8.0 — Developer Experience & Quality Hardening
**Researched:** 2025-07-14
**Confidence:** HIGH
**Constraints:** Node.js >=16.7.0, CommonJS, pure Node.js (no bundler), zero-to-minimal new runtime deps

---

## Developer Onboarding Patterns

### What the ecosystem uses

| Tool | Onboarding Library | Notes |
|------|--------------------|-------|
| create-turbo | `@inquirer/prompts` v8.x | Modern, composable, ESM-first (requires transpile for CJS) |
| create-nx-workspace | `enquirer` ~2.3.6 | CJS-compatible, used by NX + PM2, stable since 2019 |
| create-react-app (legacy) | `prompts` 2.x | Minimal, CJS, low deps (kleur + sisteransi) |
| GitHub CLI | Go's promptui | N/A for Node |
| Vite | none (no interactive install) | N/A |

**@inquirer/prompts** (v8.3.2): Modern API (`await input({message: ...})`), ESM-first so it requires either `import()` or `--experimental-vm-modules`. Does NOT work natively in CommonJS `require()`. Turbo uses it but turbo is ESM.

**enquirer** (v2.4.1): CJS-compatible, ships `Select`, `Confirm`, `Input`, `MultiSelect` prompts. Deps: `ansi-colors` + `strip-ansi` only. Used by NX and PM2. Works on Node 16+.

**@clack/prompts** (v1.2.0): Modern styled prompts with spinners + step groups. CJS-compatible. Deps: `fast-string-width`, `fast-wrap-ansi`, `sisteransi`, `@clack/core`. Excellent UX but newer (less ecosystem validation).

**Built-in `readline` + raw mode**: Already used in `bin/install.js` for `promptRuntime()` / `promptLocation()`. `process.stdin.setRawMode(true)` + `readline.emitKeypressEvents()` enables arrow key navigation without any dependency. Pattern used by Yarn classic, npm init. Works on Node 16.7+.

### Patterns that work in CLI onboarding

1. **Step-numbered wizard**: `[1/3] Choose platform → [2/3] Choose scope → [3/3] Confirm`. Clear progress reduces abandonment. Used by turbo, create-next-app.

2. **Sensible defaults with one-shot override**: Interactive when TTY; non-interactive when `--flag` provided. Already implemented in `install.js` (`isTTY` check).

3. **Post-install instructions block**: Print a formatted box of next steps after install. The existing `log.banner()` in `utils.js` covers this.

4. **Idempotent check before mutating**: Show what WILL change before changing it. `manifest.js` already tracks installed state — use this to show a diff summary.

### What this project already has

- `readline.createInterface` + `ask()` helper — functional but sequential (no arrow keys)
- `log.banner()` — box renderer for post-install messaging
- `log.step(num, total, msg)` — step indicator
- `manifest.js` — tracks installation state for idempotent checks

**Gap**: No arrow-key navigation for platform selection. Currently numeric `1-6` input only. For "DX hardening", this is the primary gap.

### Recommendation

**Enhance with raw mode readline** (zero new deps) for arrow-key selection in `promptRuntime()`. Pattern:

```javascript
// Raw mode arrow-key select — pure readline, no deps
function createArrowSelect(rl, items) {
  process.stdin.setRawMode(true);
  readline.emitKeypressEvents(process.stdin);
  let idx = 0;
  // render + listen for up/down/enter
  // CTRL+C → cleanup raw mode → exit(1)
}
```

If team prefers a polished library, **use `enquirer`** — CJS, works Node 16+, NX/PM2 validated, 2 small deps.

**Do NOT use `@inquirer/prompts`** — ESM-only, breaks CommonJS require chain without dynamic `import()` shim.

---

## Config Hot-Reload Patterns

### How major tools implement it

| Tool | Approach | Library |
|------|----------|---------|
| webpack | fs.watch on config file, restart compilation | chokidar (was v3, now v4/v5) |
| vite | fsevents (macOS) + chokidar internally | chokidar + fsevents optional |
| nodemon | chokidar v3 (still on v3 for Node 14+ compat) | chokidar |
| PM2 | chokidar for `--watch` mode | chokidar |
| Jest (watch mode) | chokidar v3 | chokidar |

### chokidar version landscape (HIGH confidence)

- **chokidar v3.x**: Node >=8, CJS, `fsevents` optional, most widely used. nodemon, Jest still use it.
- **chokidar v4.x**: Node >=14, dropped `fsevents`, uses native `fs.watch`. Lighter.
- **chokidar v5.x**: Node >=20.19.0, ESM-only, single dep (`readdirp`). **NOT compatible with this project** (requires Node 20+ and ESM).

### Native `fs.watch` capabilities by Node version

| Node | Recursive watch | Async iteration | Notes |
|------|-----------------|-----------------|-------|
| 16.7 | macOS/Windows only (non-recursive still works) | No | `fs.promises.watch` available as preview |
| 18.x | macOS/Windows | No stable | Still platform-inconsistent |
| 19.9+ | All platforms | Yes (`for await`) | Added recursive on Linux |
| 20+ | Stable recursive | Yes | Solid cross-platform |

**For Node 16.7+**: `fs.watch(filename, callback)` on a **single file** is reliable on all platforms. The `recursive: true` option is NOT reliable at Node 16.7 on Linux. But watching a single config file (not a directory) works fine everywhere.

### What config hot-reload means for this project

The v8.0 scope likely means:
1. **Skill config files** (`references/security-rules.yaml`, `resource-config.js`) — reload when changed without restarting the process
2. **Agent definition files** — detect edits during a session
3. **Workflow YAML/MD** — reload workflow when modified mid-session

Pattern used in practice:

```javascript
// Watch a single config file — pure Node.js, zero deps, Node 16.7+ compatible
function watchConfig(filePath, onReload, debounceMs = 150) {
  let timer;
  const watcher = fs.watch(filePath, (eventType) => {
    if (eventType === 'change' || eventType === 'rename') {
      clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          const fresh = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          onReload(fresh);
        } catch (err) {
          // parse error — skip reload, keep current config
        }
      }, debounceMs);
    }
  });
  return watcher; // caller calls watcher.close() to stop
}
```

**Why debounce**: editors write files in multiple `change` events (write + truncate + write). 150ms covers all editors.

**Why `rename` event**: some editors (vim, IntelliJ) write to temp file then rename to target. `rename` event fires on the original fd. Solution: re-open `fs.watch` on the new path after rename.

### Recommendation

**Use native `fs.watch` + 150ms debounce** for config hot-reload. Zero deps, works Node 16.7+, sufficient for single-file or small directory watching.

Only add **chokidar v3** if watching a full directory tree (e.g., watching all `commands/pd/**` for skill changes). chokidar v3 is CJS, Node >=8, actively maintained, used by nodemon/Jest.

**Do NOT use chokidar v5** — Node 20+ ESM-only, incompatible with this project's constraints.

---

## Status Dashboard CLI Patterns

### How major tools implement terminal status views

| Tool | Approach | Library |
|------|----------|---------|
| `pm2 status` | Full-screen TUI with blessed | `@pm2/blessed` (fork of blessed 0.1.81) + `cli-tableau` |
| `nx run-many` | Inline task list with spinners | `ora` + ANSI codes |
| `gh run watch` | Poll + redraw (ANSI erase + reprint) | Go's `glamour` (N/A for JS) |
| `turbo run` | Log lines per task, grouped | ANSI codes only |
| `listr2` pattern | Task list with status indicators | `listr2` (requires Node 22.13+) |
| `log-update` | Overwrite previous output in-place | `log-update` v7 (ESM-only) |

### Terminal status rendering approaches

**Approach 1: Full-screen TUI (blessed/terminal-kit)**
- Draws boxes, scrollable panels, keyboard nav
- blessed v0.1.81: last update 2019, no maintenance — HIGH risk
- terminal-kit: active, feature-rich, but heavy
- **Use when**: need persistent monitoring dashboard (like PM2 `pm2 monit`)
- **Not suitable here**: overkill for agent execution status

**Approach 2: In-place line update (log-update / ansi-escapes)**
- `log-update` v7: ESM-only, won't work in CJS project without shim
- `log-update` v4: last CJS-compatible version (old)
- **Pattern**: `process.stdout.write('\x1B[1A\x1B[2K')` — up one line, erase
- **Works in Node 16.7+**, zero deps if using raw ANSI

**Approach 3: Append-only with status markers**
- Each line is a permanent log entry: `  ✓ agent-01 complete (1.2s)`
- No cursor manipulation needed
- Works everywhere, never breaks in CI/non-TTY
- **Used by**: webpack build output, tsc --watch
- **This project already does this** via `log.success/warn/error`

**Approach 4: Periodic redraw (clear screen + reprint)**
- `process.stdout.write('\x1B[2J\x1B[H')` — clear screen, move to top
- Print full status table on each tick
- Used by `gh run watch`, `kubectl get pods --watch`
- Clean but jarring for users who scroll up

### What's practical for this project

The project needs to show **agent execution status** during multi-wave dispatch. Current pattern: append-only lines. Upgrade options:

**Minimal upgrade** (zero new deps):
```javascript
// ANSI in-place update for spinner
const SPINNER = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
let spinIdx = 0;
function tickSpinner(label) {
  if (!process.stdout.isTTY) return;
  process.stdout.write(`\r  ${SPINNER[spinIdx++ % SPINNER.length]} ${label}`);
}
// On complete:
function completeSpinner(label, success) {
  if (process.stdout.isTTY) process.stdout.write('\r\x1B[K'); // erase line
  log[success ? 'success' : 'error'](label);
}
```

**Table status board** (zero deps — pure ANSI):
```javascript
// Render status table with ANSI codes, redraw on state change
function renderAgentTable(agents) {
  const lines = agents.map(a => {
    const icon = {pending:'○', running:'◉', done:'✓', failed:'✗'}[a.status] || '?';
    const color = {done:'\x1b[32m', failed:'\x1b[31m', running:'\x1b[33m'}[a.status] || '';
    return `  ${color}${icon}\x1b[0m  ${a.name.padEnd(25)} ${a.elapsed || ''}`;
  });
  // Move cursor up N lines, reprint
  if (process.stdout.isTTY) {
    process.stdout.write(`\x1B[${agents.length}A`);
    lines.forEach(l => process.stdout.write(l + '\x1B[K\n'));
  }
}
```

**`ora`** (v9.3.0): CJS-compatible, minimal (no transitive deps from v6+), used by NX. Best option if a polished spinner is needed with one dep. However: ora v9 might be ESM. Check: ora v5.4.1 is last CJS version.

### Recommendation

**Phase 1 (zero deps)**: Implement spinner + in-place status using raw ANSI codes. Add a `renderStatus(agents[])` function to a new `bin/lib/status-renderer.js` module. Pure ANSI, TTY-gated, graceful fallback to append-only in CI.

**If spinner library needed**: Use **ora v5.4.1** (last CJS-compatible ora, stable, widely used). NOT v9 (ESM).

**Do NOT use**: blessed (unmaintained), listr2 v10 (Node 22+), log-update v7 (ESM), ink (requires React + Node 20+).

---

## Structured Logging Standards

### Industry standard fields (HIGH confidence)

**Pino** (v10.3.1) — de facto standard for Node.js structured logging:
- Default fields: `level` (number: 10=trace, 20=debug, 30=info, 40=warn, 50=error, 60=fatal), `time` (epoch ms), `pid`, `hostname`, `msg`
- Level names as strings via `pino-pretty` for dev
- All custom fields merged at top level: `{ level: 30, time: 1720000000000, msg: "agent dispatched", session: "S001", agent: "pd-sec-xss" }`

**Winston** (v3.19.0) — older standard:
- Fields: `level` (string), `message`, `timestamp` (ISO string), `service`
- More configuration overhead, slower than pino
- Still widely used but pino is preferred for new projects

**OpenTelemetry logs** (v0.214.0):
- Fields: `Timestamp`, `ObservedTimestamp`, `TraceId`, `SpanId`, `SeverityNumber`, `SeverityText`, `Body`, `Resource`, `Attributes`
- Full spec overkill for a CLI tool
- Relevant if traces/spans are needed across agent calls

### What fields make sense for agent framework logging

For AI agent execution contexts, the relevant fields beyond pino defaults are:

| Field | Type | Purpose |
|-------|------|---------|
| `session` | string | Session ID (e.g., `S001-fix-auth`) |
| `agent` | string | Agent name (e.g., `pd-sec-xss`) |
| `phase` | string | Current milestone phase |
| `milestone` | string | Milestone version |
| `tool` | string | Tool being called (Read/Write/Bash/SubAgent) |
| `wave` | number | Parallel dispatch wave number |
| `duration_ms` | number | Duration of operation |
| `outcome` | string | `resolved`/`inconclusive`/`checkpoint` |
| `confidence` | string | `HIGH`/`MEDIUM`/`LOW` |

### What the project currently does

- `log` in `utils.js`: colored console output, human-readable only — no machine-parseable format
- `audit-logger.js`: append-only AUDIT_LOG.md markdown table — structured but in markdown, not JSON
- `session-manager.js`: markdown-based session tracking — not JSON

**No JSON structured logging exists today.** All output is either human-readable ANSI console or markdown files.

### Pino's dependency overhead

Pino v10 has 10 dependencies (`atomic-sleep`, `on-exit-leak-free`, `pino-abstract-transport`, `pino-std-serializers`, `sonic-boom`, `thread-stream`, etc.). For a tool that currently has **zero runtime deps**, adding pino is a significant footprint increase.

### NDJSON alternative (zero deps)

For this project's pattern (pure functions, no bundler, minimal deps), a lightweight structured logger is buildable in ~50 lines:

```javascript
// bin/lib/structured-logger.js — zero deps NDJSON emitter
'use strict';

const LEVELS = { trace: 10, debug: 20, info: 30, warn: 40, error: 50 };

function createLogger(defaultFields = {}) {
  function emit(level, msg, fields = {}) {
    if (!process.env.PD_STRUCTURED_LOG) return; // opt-in via env var
    const entry = {
      time: Date.now(),
      level: LEVELS[level] || 30,
      msg,
      ...defaultFields,
      ...fields,
    };
    process.stderr.write(JSON.stringify(entry) + '\n');
  }
  return {
    trace: (msg, f) => emit('trace', msg, f),
    debug: (msg, f) => emit('debug', msg, f),
    info:  (msg, f) => emit('info',  msg, f),
    warn:  (msg, f) => emit('warn',  msg, f),
    error: (msg, f) => emit('error', msg, f),
    child: (extra) => createLogger({ ...defaultFields, ...extra }),
  };
}

module.exports = { createLogger };
```

Usage:
```javascript
const { createLogger } = require('./structured-logger');
const log = createLogger({ service: 'please-done' });
const sessionLog = log.child({ session: 'S001', phase: '3.2' });
sessionLog.info('agent dispatched', { agent: 'pd-sec-xss', wave: 2 });
// → {"time":1720000000,"level":30,"msg":"agent dispatched","service":"please-done","session":"S001","phase":"3.2","agent":"pd-sec-xss","wave":2}
```

**Write to stderr** (not stdout): structured logs to stderr keeps stdout clean for piped output. Standard pattern used by pino, bunyan.

**Opt-in via `PD_STRUCTURED_LOG=1`**: keeps normal humans unaffected, CI/monitoring systems can enable.

---

## Recommendations

### Priority order for v8.0

#### 1. Structured logging — `bin/lib/structured-logger.js`
**Build it custom.** Zero new deps, ~50 lines, opt-in via `PD_STRUCTURED_LOG` env var. Write to stderr as NDJSON. Standard fields: `time`, `level`, `msg` + agent-framework fields (`session`, `agent`, `phase`, `tool`, `wave`, `outcome`).

**Do NOT add pino** — 10 transitive deps for a tool that currently has zero runtime deps is unjustifiable.

#### 2. Status renderer — `bin/lib/status-renderer.js`
**Build with raw ANSI codes.** Zero deps, TTY-gated (degrades to append-only in CI). Implement:
- `createSpinner(label)` → returns `{tick(), complete(success)}` — in-place line update
- `renderAgentTable(agents[])` — cursor-up redraw of N-line status table
- `renderBox(lines[])` — the existing `log.banner()` generalized

**Do NOT add ora/listr2** — ora v9 is ESM, listr2 v10 requires Node 22. If a spinner dep is needed: ora v5.4.1 (last CJS, stable).

#### 3. Onboarding wizard enhancement — enhance `bin/install.js`
**Enhance with raw mode readline** (zero new deps). Add arrow-key navigation to `promptRuntime()`. Add a numbered "What's new in v8" block using `log.banner()`. Add pre-install diff: "Will install N skills to PATH".

**If arrow-key UX is required without raw mode complexity**: use **enquirer** v2.4.1 — CJS, Node 16+, 2 small deps, NX/PM2 validated. API: `const { Select } = require('enquirer'); await new Select({...}).run()`.

**Do NOT use @inquirer/prompts** — ESM-only, incompatible with CommonJS require.

#### 4. Config hot-reload — `bin/lib/config-watcher.js`
**Use native `fs.watch` + 150ms debounce.** Zero deps, works Node 16.7+. Pattern: watch single file, debounce, re-open watcher after `rename` event. Sufficient for watching `references/security-rules.yaml`, agent `.md` files, or config JSON.

**Only add chokidar v3** if needing recursive directory watching. chokidar v3 (NOT v5) — CJS, Node >=8, used by nodemon/Jest.

### Dependency decision table

| Need | Solution | New Dep? | Notes |
|------|----------|----------|-------|
| Structured JSON logs | Custom NDJSON emitter | **No** | ~50 lines, opt-in |
| Spinner / in-place status | Raw ANSI + TTY check | **No** | ~60 lines |
| Arrow-key prompts | raw mode readline | **No** | ~80 lines OR |
| Arrow-key prompts (polished) | enquirer v2.4.1 | 1 dep | CJS, NX/PM2 validated |
| Config file hot-reload | `fs.watch` + debounce | **No** | Native Node 16.7+ |
| Dir tree watching | chokidar v3 | 1 dep | Only if needed |

### What NOT to add

| Library | Why Not |
|---------|---------|
| `pino` | 10 transitive deps for a zero-dep project |
| `@inquirer/prompts` | ESM-only, breaks CommonJS |
| `chokidar v5` | Requires Node 20+ ESM |
| `listr2 v10` | Requires Node 22.13+ |
| `ink` | Requires React + Node 20+ |
| `blessed` | Unmaintained since 2019 |
| `log-update v7` | ESM-only |
| `ora v9` | Likely ESM (verify before using; v5.4.1 is safe CJS) |
| `winston` | Slow, heavy for what's needed |

---

## Sources

- `npm show` output: chokidar v5.0.0, @inquirer/prompts v8.3.2, enquirer v2.4.1, @clack/prompts v1.2.0, listr2 v10.2.1, ora v9.3.0, pino v10.3.1, log-update v7.2.0, ink v6.8.0 — HIGH confidence (live npm registry)
- `create-nx-workspace` deps: enquirer ~2.3.6 — HIGH confidence (live npm)
- `create-turbo` deps: @inquirer/prompts — HIGH confidence (live npm)
- `nodemon` deps: chokidar — HIGH confidence (live npm)
- `pm2` deps: @pm2/blessed, cli-tableau, enquirer — HIGH confidence (live npm)
- Node.js built-in APIs verified: `process.stdin.setRawMode`, `readline.emitKeypressEvents`, `fs.promises.watch`, `readline/promises` — HIGH confidence (direct runtime check)
- Codebase analysis: `bin/lib/utils.js` (log, COLORS, readline usage), `bin/install.js` (promptRuntime, promptLocation, readline pattern) — HIGH confidence
- `bin/lib/audit-logger.js` — markdown-based structured logging, not JSON — HIGH confidence
- fs.watch platform behavior: Node 16 recursive limitations — HIGH confidence (Node.js docs + runtime verification)
