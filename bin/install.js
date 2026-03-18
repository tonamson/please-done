#!/usr/bin/env node

/**
 * Skills Installer — Cross-platform installer cho bộ /pd:* skills.
 *
 * Hỗ trợ: Claude Code, Codex CLI, Gemini CLI, OpenCode, GitHub Copilot.
 * Kiến trúc: Write Once (Claude Code) → Transpile at Install → Native per Platform.
 *
 * Usage:
 *   npx please-done                    # Interactive — chọn platform
 *   npx please-done --claude           # Cài cho Claude Code
 *   npx please-done --codex            # Cài cho Codex CLI
 *   npx please-done --gemini           # Cài cho Gemini CLI
 *   npx please-done --opencode         # Cài cho OpenCode
 *   npx please-done --copilot          # Cài cho GitHub Copilot
 *   npx please-done --all              # Cài tất cả platforms
 *   npx please-done --uninstall --codex  # Gỡ khỏi Codex
 *   npx please-done --global           # Global install (default)
 *   npx please-done --local            # Local install (project-level)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const { PLATFORMS, getGlobalDir, getLocalDir, getAllRuntimes } = require('./lib/platforms');
const { log, isWSL } = require('./lib/utils');
const { saveLocalPatches, writeManifest, reportLocalPatches, scanLeakedPaths } = require('./lib/manifest');

// ─── Constants ────────────────────────────────────────────
const SCRIPT_DIR = path.resolve(__dirname, '..');
const VERSION = fs.readFileSync(path.join(SCRIPT_DIR, 'VERSION'), 'utf8').trim();

// ─── Arg parsing ──────────────────────────────────────────
function parseArgs(argv) {
  const args = argv.slice(2);
  const flags = {
    runtimes: [],
    isGlobal: true,
    uninstall: false,
    configDir: null,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--claude': flags.runtimes.push('claude'); break;
      case '--codex': flags.runtimes.push('codex'); break;
      case '--gemini': flags.runtimes.push('gemini'); break;
      case '--opencode': flags.runtimes.push('opencode'); break;
      case '--copilot': flags.runtimes.push('copilot'); break;
      case '--all': flags.runtimes = getAllRuntimes(); break;
      case '--global': case '-g': flags.isGlobal = true; break;
      case '--local': case '-l': flags.isGlobal = false; break;
      case '--uninstall': case '-u': flags.uninstall = true; break;
      case '--config-dir': case '-c':
        if (i + 1 < args.length) flags.configDir = args[++i];
        else { log.error('--config-dir requires a value'); process.exit(1); }
        break;
      case '--help': case '-h': flags.help = true; break;
      default:
        if (arg.startsWith('-')) {
          log.warn(`Unknown flag: ${arg}`);
        }
    }
  }

  return flags;
}

// ─── Interactive prompt ───────────────────────────────────
function createRL() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

async function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

async function promptRuntime() {
  const rl = createRL();
  const runtimes = getAllRuntimes();

  console.log('');
  console.log('Chọn platform để cài đặt skills:');
  console.log('');
  runtimes.forEach((rt, i) => {
    console.log(`  ${i + 1}. ${PLATFORMS[rt].name}`);
  });
  console.log(`  ${runtimes.length + 1}. Tất cả`);
  console.log('');

  const answer = await ask(rl, `Chọn (1-${runtimes.length + 1}): `);
  rl.close();

  const num = parseInt(answer, 10);
  if (num === runtimes.length + 1) return runtimes;
  if (num >= 1 && num <= runtimes.length) return [runtimes[num - 1]];

  log.error('Lựa chọn không hợp lệ.');
  process.exit(1);
}

async function promptLocation() {
  const rl = createRL();
  console.log('');
  console.log('Phạm vi cài đặt:');
  console.log('  1. Global (cho mọi project)');
  console.log('  2. Local (chỉ project hiện tại)');
  console.log('');

  const answer = await ask(rl, 'Chọn (1-2, default: 1): ');
  rl.close();

  return answer === '2' ? false : true;
}

// ─── Installed dirs per platform (cho manifest tracking) ──
function getInstalledDirs(runtime) {
  switch (runtime) {
    case 'claude': return ['commands/pd'];
    case 'codex': return ['skills'];
    case 'gemini': return ['commands/pd'];
    case 'opencode': return ['command'];
    case 'copilot': return ['skills'];
    default: return [];
  }
}

// ─── Install dispatcher ───────────────────────────────────

/**
 * Cài đặt skills cho 1 runtime cụ thể.
 */
async function install(runtime, isGlobal, configDir) {
  const platform = PLATFORMS[runtime];
  const targetDir = configDir
    ? path.resolve(configDir)
    : (isGlobal ? getGlobalDir(runtime) : getLocalDir(runtime));

  console.log('');
  log.info(`Installing for ${platform.name} → ${targetDir}`);

  // Backup user-modified files trước khi overwrite
  const patchCount = saveLocalPatches(targetDir);
  if (patchCount > 0) {
    log.warn(`Đã backup ${patchCount} file(s) có thay đổi local.`);
  }

  // Load platform-specific installer
  try {
    const installer = require(`./lib/installers/${runtime}`);
    await installer.install(SCRIPT_DIR, targetDir, { isGlobal, version: VERSION });
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      log.warn(`Installer cho ${platform.name} chưa được triển khai.`);
      return;
    }
    throw err;
  }

  // Write manifest cho lần re-install sau
  const installedDirs = getInstalledDirs(runtime);
  writeManifest(targetDir, VERSION, installedDirs);

  // Scan leaked paths cho non-Claude platforms
  if (runtime !== 'claude') {
    const leaked = scanLeakedPaths(targetDir, '~/.claude/');
    if (leaked.length > 0) {
      log.warn(`${leaked.length} file(s) còn chứa ~/.claude/ chưa replace:`);
      for (const f of leaked) log.info(`    ${f}`);
    }
  }

  // Report patches nếu có
  reportLocalPatches(targetDir);

  log.success(`${platform.name} — hoàn tất!`);
}

/**
 * Gỡ skills khỏi 1 runtime.
 */
async function uninstall(runtime, isGlobal, configDir) {
  const platform = PLATFORMS[runtime];
  const targetDir = configDir
    ? path.resolve(configDir)
    : (isGlobal ? getGlobalDir(runtime) : getLocalDir(runtime));

  console.log('');
  log.info(`Uninstalling from ${platform.name} → ${targetDir}`);

  try {
    const installer = require(`./lib/installers/${runtime}`);
    if (typeof installer.uninstall === 'function') {
      await installer.uninstall(targetDir, { isGlobal });
    } else {
      log.warn(`Uninstaller cho ${platform.name} chưa được triển khai.`);
      return;
    }
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      log.warn(`Installer cho ${platform.name} chưa được triển khai.`);
      return;
    }
    throw err;
  }

  log.success(`${platform.name} — đã gỡ!`);
}

// ─── Help ─────────────────────────────────────────────────
function showHelp() {
  console.log(`
Skills Installer v${VERSION}
Cross-platform installer cho bộ /pd:* skills.

Usage:
  npx please-done [options]

Platforms:
  --claude          Cài cho Claude Code
  --codex           Cài cho Codex CLI
  --gemini          Cài cho Gemini CLI
  --opencode        Cài cho OpenCode
  --copilot         Cài cho GitHub Copilot
  --all             Cài tất cả platforms

Options:
  -g, --global      Global install (default)
  -l, --local       Local install (project-level)
  -u, --uninstall   Gỡ cài đặt
  -c, --config-dir  Custom config directory
  -h, --help        Hiện help

Examples:
  npx please-done                     Interactive mode
  npx please-done --claude            Cài cho Claude Code
  npx please-done --all --global      Cài tất cả (global)
  npx please-done -u --codex          Gỡ khỏi Codex
`);
}

// ─── Main ─────────────────────────────────────────────────
async function main() {
  const flags = parseArgs(process.argv);

  // Help
  if (flags.help) {
    showHelp();
    process.exit(0);
  }

  // WSL check
  if (isWSL()) {
    log.warn('Phát hiện WSL. Nên chạy installer từ Linux native, không qua Windows.');
  }

  // Banner
  log.banner([
    `  Skills Installer v${VERSION}`.padEnd(39),
    '  Cross-platform AI Coding Skills'.padEnd(39),
  ]);

  // Resolve runtimes
  let runtimes = flags.runtimes;
  let isGlobal = flags.isGlobal;

  if (runtimes.length === 0 && !flags.help) {
    // Interactive mode
    if (!process.stdin.isTTY) {
      // Non-interactive: default to claude global
      runtimes = ['claude'];
    } else {
      runtimes = await promptRuntime();
      isGlobal = await promptLocation();
    }
  }

  // Execute (deduplicate nếu user dùng --all + --claude cùng lúc)
  runtimes = [...new Set(runtimes)];
  for (const runtime of runtimes) {
    if (flags.uninstall) {
      await uninstall(runtime, isGlobal, flags.configDir);
    } else {
      await install(runtime, isGlobal, flags.configDir);
    }
  }

  // Summary
  console.log('');
  if (!flags.uninstall) {
    const platformNames = runtimes.map(r => PLATFORMS[r].name).join(', ');
    const platformLine = `  Platforms: ${platformNames}`;
    const bannerLines = [
      '  Cài đặt hoàn tất!',
      platformLine,
      '',
      '  Khởi động lại editor để load skills.',
    ];
    // Nếu platform names dài → tách thành nhiều dòng vừa banner width
    if (platformLine.length > 39) {
      const names = runtimes.map(r => PLATFORMS[r].name);
      const prefix = '  Platforms: ';
      const cont = '             '; // same indent
      const maxLen = 39;
      const lines = [];
      let current = prefix;
      for (let i = 0; i < names.length; i++) {
        const sep = i === 0 ? '' : ', ';
        if ((current + sep + names[i]).length > maxLen && current !== prefix && current !== cont) {
          lines.push(current);
          current = cont + names[i];
        } else {
          current += sep + names[i];
        }
      }
      if (current.trim()) lines.push(current);
      bannerLines.splice(1, 1, ...lines);
    }
    log.banner(bannerLines);
  }
}

main().catch((err) => {
  log.error(err.message);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});

// Test exports
if (process.env.PD_TEST_MODE) {
  module.exports = { parseArgs, install, uninstall };
}
