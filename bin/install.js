#!/usr/bin/env node

/**
 * Skills Installer — Cross-platform installer for /pd:* skills.
 *
 * Supports: Claude Code, Codex CLI, Gemini CLI, OpenCode, GitHub Copilot.
 * Architecture: Write Once (Claude Code) → Transpile at Install → Native per Platform.
 *
 * Usage:
 *   npx please-done                    # Interactive — choose platform
 *   npx please-done --claude           # Install for Claude Code
 *   npx please-done --codex            # Install for Codex CLI
 *   npx please-done --gemini           # Install for Gemini CLI
 *   npx please-done --opencode         # Install for OpenCode
 *   npx please-done --copilot          # Install for GitHub Copilot
 *   npx please-done --all              # Install all platforms
 *   npx please-done --uninstall --codex  # Uninstall from Codex
 *   npx please-done --global           # Global install (default)
 *   npx please-done --local            # Local install (project-level)
 */

"use strict";

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const {
  PLATFORMS,
  getGlobalDir,
  getLocalDir,
  getAllRuntimes,
} = require("./lib/platforms");
const { log, isWSL } = require("./lib/utils");
const {
  saveLocalPatches,
  writeManifest,
  reportLocalPatches,
  scanLeakedPaths,
} = require("./lib/manifest");

// ─── Constants ────────────────────────────────────────────
const SCRIPT_DIR = path.resolve(__dirname, "..");
const PROJECT_ROOT = SCRIPT_DIR;
const VERSION = fs
  .readFileSync(path.join(SCRIPT_DIR, "VERSION"), "utf8")
  .trim();

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
      case "--claude":
        flags.runtimes.push("claude");
        break;
      case "--codex":
        flags.runtimes.push("codex");
        break;
      case "--gemini":
        flags.runtimes.push("gemini");
        break;
      case "--opencode":
        flags.runtimes.push("opencode");
        break;
      case "--copilot":
        flags.runtimes.push("copilot");
        break;
      case "--all":
        flags.runtimes = getAllRuntimes();
        break;
      case "--global":
      case "-g":
        flags.isGlobal = true;
        break;
      case "--local":
      case "-l":
        flags.isGlobal = false;
        break;
      case "--uninstall":
      case "-u":
        flags.uninstall = true;
        break;
      case "--config-dir":
      case "-c":
        if (i + 1 < args.length) flags.configDir = args[++i];
        else {
          log.error("--config-dir requires a value");
          process.exit(1);
        }
        break;
      case "--help":
      case "-h":
        flags.help = true;
        break;
      default:
        if (arg.startsWith("-")) {
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

  console.log("");
  console.log("Choose a platform to install skills:");
  console.log("");
  runtimes.forEach((rt, i) => {
    console.log(`  ${i + 1}. ${PLATFORMS[rt].name}`);
  });
  console.log(`  ${runtimes.length + 1}. All`);
  console.log("");

  const answer = await ask(rl, `Choose (1-${runtimes.length + 1}): `);
  rl.close();

  const num = parseInt(answer, 10);
  if (num === runtimes.length + 1) return runtimes;
  if (num >= 1 && num <= runtimes.length) return [runtimes[num - 1]];

  log.error("Invalid selection.");
  process.exit(1);
}

async function promptLocation() {
  const rl = createRL();
  console.log("");
  console.log("Installation scope:");
  console.log("  1. Global (for all projects)");
  console.log("  2. Local (current project only)");
  console.log("");

  const answer = await ask(rl, "Choose (1-2, default: 1): ");
  rl.close();

  return answer === "2" ? false : true;
}

// ─── Installed dirs per platform (for manifest tracking) ──
function getInstalledDirs(runtime) {
  switch (runtime) {
    case "claude":
      return ["commands/pd"];
    case "codex":
      return ["skills"];
    case "gemini":
      return ["commands/pd"];
    case "opencode":
      return ["command"];
    case "copilot":
      return ["skills"];
    default:
      return [];
  }
}

// ─── Install dispatcher ───────────────────────────────────

/**
 * Install skills for a specific runtime.
 */
async function install(runtime, isGlobal, configDir) {
  const platform = PLATFORMS[runtime];
  const targetDir = configDir
    ? path.resolve(configDir)
    : isGlobal
      ? getGlobalDir(runtime)
      : getLocalDir(runtime);

  console.log("");
  log.info(`Installing for ${platform.name} → ${targetDir}`);

  // Backup user-modified files before overwrite
  const patchCount = saveLocalPatches(targetDir);
  if (patchCount > 0) {
    log.warn(`Backed up ${patchCount} locally modified file(s).`);
  }

  // Load platform-specific installer
  try {
    const installer = require(`./lib/installers/${runtime}`);
    await installer.install(SCRIPT_DIR, targetDir, {
      isGlobal,
      version: VERSION,
    });
  } catch (err) {
    if (err.code === "MODULE_NOT_FOUND") {
      log.warn(`Installer for ${platform.name} is not yet implemented.`);
      return;
    }
    throw err;
  }

  // Write manifest for future re-installs
  const installedDirs = getInstalledDirs(runtime);
  writeManifest(targetDir, VERSION, installedDirs);

  // Scan leaked paths for non-Claude platforms
  if (runtime !== "claude") {
    const leaked = scanLeakedPaths(targetDir, "~/.claude/");
    if (leaked.length > 0) {
      log.warn(
        `${leaked.length} file(s) still contain ~/.claude/ not yet replaced:`,
      );
      for (const f of leaked) log.info(`    ${f}`);
    }
  }

  // Report patches if any
  reportLocalPatches(targetDir);

  // Sync AGENTS.md to all runtimes after successful installation
  if (fs.existsSync(path.join(PROJECT_ROOT, 'AGENTS.md'))) {
    const { execSync } = require('child_process');
    try {
      execSync('node bin/sync-instructions.js', { cwd: PROJECT_ROOT, stdio: 'pipe' });
    } catch (err) {
      log.warn('Failed to sync agent instructions:', err.message);
      // Non-fatal - installation succeeded
    }
  }

  log.success(`${platform.name} — done!`);
}

/**
 * Uninstall skills from a runtime.
 */
async function uninstall(runtime, isGlobal, configDir) {
  const platform = PLATFORMS[runtime];
  const targetDir = configDir
    ? path.resolve(configDir)
    : isGlobal
      ? getGlobalDir(runtime)
      : getLocalDir(runtime);

  console.log("");
  log.info(`Uninstalling from ${platform.name} → ${targetDir}`);

  try {
    const installer = require(`./lib/installers/${runtime}`);
    if (typeof installer.uninstall === "function") {
      await installer.uninstall(targetDir, { isGlobal });
    } else {
      log.warn(`Uninstaller for ${platform.name} is not yet implemented.`);
      return;
    }
  } catch (err) {
    if (err.code === "MODULE_NOT_FOUND") {
      log.warn(`Installer for ${platform.name} is not yet implemented.`);
      return;
    }
    throw err;
  }

  log.success(`${platform.name} — uninstalled!`);
}

// ─── Help ─────────────────────────────────────────────────
function showHelp() {
  console.log(`
Skills Installer v${VERSION}
Cross-platform installer for /pd:* skills.

Usage:
  npx please-done [options]

Platforms:
  --claude          Install for Claude Code
  --codex           Install for Codex CLI
  --gemini          Install for Gemini CLI
  --opencode        Install for OpenCode
  --copilot         Install for GitHub Copilot
  --all             Install all platforms

Options:
  -g, --global      Global install (default)
  -l, --local       Local install (project-level)
  -u, --uninstall   Uninstall
  -c, --config-dir  Custom config directory
  -h, --help        Show help

Examples:
  npx please-done                     Interactive mode
  npx please-done --claude            Install for Claude Code
  npx please-done --all --global      Install all (global)
  npx please-done -u --codex          Uninstall from Codex
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
    log.warn(
      "WSL detected. Consider running the installer from native Linux, not through Windows.",
    );
  }

  // Banner
  log.banner([
    `  Skills Installer v${VERSION}`.padEnd(39),
    "  Cross-platform AI Coding Skills".padEnd(39),
  ]);

  // Resolve runtimes
  let runtimes = flags.runtimes;
  let isGlobal = flags.isGlobal;

  if (runtimes.length === 0 && !flags.help) {
    // Interactive mode
    if (!process.stdin.isTTY) {
      // Non-interactive: default to claude global
      runtimes = ["claude"];
    } else {
      runtimes = await promptRuntime();
      isGlobal = await promptLocation();
    }
  }

  // Execute (deduplicate if user uses --all + --claude simultaneously)
  runtimes = [...new Set(runtimes)];
  for (const runtime of runtimes) {
    if (flags.uninstall) {
      await uninstall(runtime, isGlobal, flags.configDir);
    } else {
      await install(runtime, isGlobal, flags.configDir);
    }
  }

  // Summary
  console.log("");
  if (!flags.uninstall) {
    const platformNames = runtimes.map((r) => PLATFORMS[r].name).join(", ");
    const platformLine = `  Platforms: ${platformNames}`;
    const bannerLines = [
      "  Installation complete!",
      platformLine,
      "",
      "  Restart your editor to load skills.",
    ];
    // If platform names are long → split into multiple lines to fit banner width
    if (platformLine.length > 39) {
      const names = runtimes.map((r) => PLATFORMS[r].name);
      const prefix = "  Platforms: ";
      const cont = "             "; // same indent
      const maxLen = 39;
      const lines = [];
      let current = prefix;
      for (let i = 0; i < names.length; i++) {
        const sep = i === 0 ? "" : ", ";
        if (
          (current + sep + names[i]).length > maxLen &&
          current !== prefix &&
          current !== cont
        ) {
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
  if (process.env.PD_DEBUG) console.error(err.stack);
  process.exit(1);
});

// Test exports
if (process.env.PD_TEST_MODE) {
  module.exports = { parseArgs, install, uninstall };
}
