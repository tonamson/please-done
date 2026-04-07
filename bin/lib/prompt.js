/**
 * Interactive prompt utilities for installer.
 * Handles TTY and non-TTY modes with appropriate announcements.
 */

"use strict";

const readline = require("readline");
const { PLATFORMS, getAllRuntimes } = require("./platforms");
const { log } = require("./utils");

// ─── Private helpers ──────────────────────────────────────

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

// ─── Exported prompt functions ────────────────────────────

/**
 * Prompt user to select runtime platform(s).
 * Non-TTY: announces "Non-interactive mode" and returns all platforms.
 * TTY: displays numbered list with descriptions, returns selected platform(s).
 */
async function promptRuntime() {
  // D-12: Non-TTY detection at function entry
  if (!process.stdin.isTTY) {
    // D-13, D-15: Announce and return all platforms
    log.info("Non-interactive mode: installing for all platforms");
    return getAllRuntimes();
  }

  const rl = createRL();
  const runtimes = getAllRuntimes();

  console.log("");
  console.log("Choose a platform to install skills:");
  console.log("");

  // D-11: Display format with em dash and description
  runtimes.forEach((rt, i) => {
    console.log(`  ${i + 1}. ${PLATFORMS[rt].name} — ${PLATFORMS[rt].description}`);
  });
  console.log(`  ${runtimes.length + 1}. All platforms`);
  console.log("");

  const answer = await ask(rl, `Choose (1-${runtimes.length + 1}): `);
  rl.close();

  const num = parseInt(answer, 10);
  if (num === runtimes.length + 1) return runtimes;
  if (num >= 1 && num <= runtimes.length) return [runtimes[num - 1]];

  log.error("Invalid selection.");
  process.exit(1);
}

/**
 * Prompt user to select installation scope.
 * Non-TTY: announces "Non-interactive mode" and returns true (global).
 * TTY: displays numbered options, returns true for global, false for local.
 */
async function promptLocation() {
  // D-12: Non-TTY detection at function entry
  if (!process.stdin.isTTY) {
    // D-14, D-15: Announce and return global
    log.info("Non-interactive mode: using global install");
    return true;
  }

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

module.exports = { promptRuntime, promptLocation };
