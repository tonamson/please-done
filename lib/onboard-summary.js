/**
 * Onboarding Summary Module
 *
 * Generates and displays formatted onboarding summary output
 * for the pd:onboard skill.
 *
 * @module lib/onboard-summary
 */

"use strict";

// ─── Terminal colors ──────────────────────────────────────
const COLORS = {
  reset: "\x1b[0m",
  cyan: "\x1b[0;36m",
  dim: "\x1b[2m",
};

/**
 * Wrap text with color codes
 * @param {string} color - Color name from COLORS
 * @param {string} text - Text to colorize
 * @returns {string} - Colorized text
 */
function colorize(color, text) {
  return `${COLORS[color] || ""}${text}${COLORS.reset}`;
}

/**
 * Generate and display onboarding summary
 * @param {Object} context - Context object with project info
 * @param {Object} context.techStack - Detected tech stack
 * @param {Array} context.keyFiles - Selected key files
 * @param {string} context.sourceDir - Source directory path
 * @param {number} context.fileCount - Total file count
 * @returns {string} - Formatted summary string
 */
function generateSummary(context) {
  const { techStack = {}, keyFiles = [], sourceDir, fileCount = 0 } = context;

  const width = 58;
  const formattedTechStack = formatTechStack(techStack);
  const formattedKeyFiles = formatKeyFiles(keyFiles);
  const formattedSourceDir = sourceDir || "Current directory";
  const formattedFileCount = fileCount === 0 ? "0 files" : `${fileCount} files`;

  const lines = [
    "           PROJECT ONBOARDING COMPLETE                    ",
    "",
    ` Tech Stack: ${formattedTechStack.padEnd(width - 13)}`,
    ` Key Files: ${formattedKeyFiles.padEnd(width - 12)}`,
    ` Source Code: ${formattedSourceDir} (${formattedFileCount})`.padEnd(
      width + 1
    ),
    "",
    " Next Steps:                                              ",
    " • Review PROJECT.md for project vision                   ",
    " • Review CONTEXT.md for codebase overview                ",
    " • Run /pd:plan to create development plan                ",
  ];

  const summary = formatBox(lines, width);

  // Display to terminal
  console.log(summary);

  return summary;
}

/**
 * Format lines into a box with drawing characters
 * @param {Array<string>} lines - Lines to display in the box
 * @param {number} width - Width of the content area
 * @returns {string} - Formatted box string
 */
function formatBox(lines, width) {
  const horizontal = "═".repeat(width + 2);
  const result = [];

  // Top border
  result.push(colorize("cyan", `╔${horizontal}╗`));

  // Content
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Empty line (separator)
    if (line.trim() === "") {
      result.push(colorize("cyan", `╠${horizontal}╣`));
      continue;
    }

    // Content line
    const padded = line.padEnd(width).slice(0, width);
    result.push(colorize("cyan", `║ ${padded}║`));
  }

  // Bottom border
  result.push(colorize("cyan", `╚${horizontal}╝`));

  return result.join("\n");
}

/**
 * Format tech stack for display
 * @param {Object} techStack - Tech stack object
 * @returns {string} - Formatted string like "NestJS + TypeScript + Prisma"
 */
function formatTechStack(techStack) {
  if (!techStack || Object.keys(techStack).length === 0) {
    return "Unknown";
  }

  const parts = [];

  // Priority order for display
  const priorities = [
    "framework",
    "language",
    "database",
    "orm",
    "buildTool",
    "testFramework",
  ];

  for (const key of priorities) {
    if (techStack[key]) {
      parts.push(capitalizeFirst(techStack[key]));
    }
  }

  // Add any remaining keys not in priority list
  for (const key of Object.keys(techStack)) {
    if (!priorities.includes(key) && techStack[key]) {
      parts.push(capitalizeFirst(techStack[key]));
    }
  }

  return parts.length > 0 ? parts.join(" + ") : "Unknown";
}

/**
 * Capitalize first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} - Capitalized string
 */
function capitalizeFirst(str) {
  if (!str || typeof str !== "string") return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Format key files list (truncated if needed)
 * @param {Array} keyFiles - Array of file paths
 * @param {number} maxLength - Max characters for the line
 * @returns {string} - Formatted file list
 */
function formatKeyFiles(keyFiles, maxLength = 45) {
  if (!keyFiles || keyFiles.length === 0) {
    return "None detected";
  }

  // Get just the filenames (basename) for cleaner display
  const fileNames = keyFiles.map((file) => {
    if (typeof file === "string") {
      // Extract filename from path
      const parts = file.split(/[/\\]/);
      return parts[parts.length - 1];
    }
    return String(file);
  });

  // Join with comma and space
  let result = fileNames.join(", ");

  // Truncate if too long
  if (result.length > maxLength) {
    result = result.substring(0, maxLength - 3) + "...";
  }

  return result;
}

module.exports = {
  generateSummary,
  formatTechStack,
  formatKeyFiles,
};
