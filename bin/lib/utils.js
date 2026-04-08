/**
 * Common utilities for installer — parse frontmatter, hash files,
 * copy with path replacement, and terminal colors.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ─── Terminal colors ──────────────────────────────────────
const COLORS = {
  red: "\x1b[0;31m",
  green: "\x1b[0;32m",
  yellow: "\x1b[1;33m",
  cyan: "\x1b[0;36m",
  dim: "\x1b[2m",
  reset: "\x1b[0m",
};

function colorize(color, text) {
  if (!process.stdout.isTTY || process.env.NO_COLOR) return text;
  return `${COLORS[color] || ""}${text}${COLORS.reset}`;
}

const log = {
  info: (msg) => console.log(msg),
  success: (msg) => console.log(colorize("green", `  ✓ ${msg}`)),
  warn: (msg) => console.log(colorize("yellow", `  ⚠ ${msg}`)),
  error: (msg) => console.log(colorize("red", `  ✗ ${msg}`)),
  step: (num, total, msg) =>
    console.log(colorize("cyan", `[${num}/${total}] ${msg}`)),
  banner: (lines) => {
    const width = 40;
    const border = width + 1; // ║ + space(1) + content(width-1) + ║ = width+1 between borders
    console.log(colorize("cyan", `╔${"═".repeat(border)}╗`));
    for (const line of lines) {
      const padded = (line || "").padEnd(width).slice(0, width);
      console.log(colorize("cyan", `║ ${padded}║`));
    }
    console.log(colorize("cyan", `╚${"═".repeat(border)}╝`));
  },
};

// ─── Frontmatter parser ───────────────────────────────────

/**
 * Parse YAML frontmatter from markdown content.
 * Returns { frontmatter: object, body: string, raw: string }
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content, raw: "" };

  const raw = match[1];
  const body = match[2];
  const frontmatter = {};

  let currentKey = null;
  let inArray = false;
  let arrayValues = [];

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();

    // Array item
    if (inArray && trimmed.startsWith("- ")) {
      arrayValues.push(trimmed.slice(2).trim());
      continue;
    }

    // End of array — save previous
    if (inArray && currentKey) {
      frontmatter[currentKey] = arrayValues;
      inArray = false;
      arrayValues = [];
      currentKey = null;
    }

    // Key: value pair
    const kvMatch = trimmed.match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      const value = kvMatch[2].trim();

      if (value === "") {
        // Could be start of array
        currentKey = key;
        inArray = true;
        arrayValues = [];
      } else {
        frontmatter[key] = value;
      }
    }
  }

  // Flush last array
  if (inArray && currentKey) {
    frontmatter[currentKey] = arrayValues;
  }

  return { frontmatter, body, raw };
}

/**
 * Rebuild YAML frontmatter from object.
 */
function buildFrontmatter(fm) {
  const lines = [];
  for (const [key, value] of Object.entries(fm)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) {
        lines.push(`  - ${item}`);
      }
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  return lines.join("\n");
}

/**
 * Combine frontmatter + body into complete markdown.
 */
function assembleMd(frontmatter, body) {
  const fm = buildFrontmatter(frontmatter);
  return `---\n${fm}\n---\n${body}`;
}

// ─── File utilities ───────────────────────────────────────

/**
 * SHA256 hash for file content.
 */
function fileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(content).digest("hex");
  } catch (err) {
    if (process.env.PD_DEBUG) console.error('[fileHash]', err);
    return null;
  }
}

/**
 * Read list of skill files from source directory.
 * Returns array of { name, filePath, content }
 */
function listSkillFiles(skillsDir) {
  const files = fs
    .readdirSync(skillsDir)
    .filter((f) => f.endsWith(".md") && !f.startsWith("."));

  return files.map((f) => ({
    name: f.replace(".md", ""),
    filePath: path.join(skillsDir, f),
    content: fs.readFileSync(path.join(skillsDir, f), "utf8"),
  }));
}

/**
 * Check if command exists in PATH.
 */
function commandExists(cmd) {
  const { execSync } = require("child_process");
  try {
    execSync(`command -v ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Run shell command, return stdout.
 */
function exec(cmd, options = {}) {
  const { execSync } = require("child_process");
  try {
    return execSync(cmd, {
      encoding: "utf8",
      stdio: options.silent ? "pipe" : ["pipe", "pipe", "pipe"],
      timeout: options.timeout || 30000,
      ...options,
    }).trim();
  } catch (err) {
    if (options.ignoreError) return "";
    throw err;
  }
}

/**
 * Detect WSL environment.
 */
function isWSL() {
  if (process.platform === "win32") return false;
  try {
    const release = fs.readFileSync("/proc/version", "utf8").toLowerCase();
    return release.includes("microsoft") || release.includes("wsl");
  } catch {
    return false;
  }
}

// ─── Workflow inlining ─────────────────────────────────

/**
 * Extract content inside an XML tag from string.
 * Returns trimmed content or null if not found.
 */
function extractXmlSection(content, tagName) {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`);
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Extract @templates/... and @references/... references from text.
 * Returns unique array in order of appearance.
 */
function extractReadingRefs(content) {
  if (content == null) return [];
  const refs = [];
  const seen = new Set();

  for (const match of content.matchAll(
    /@(templates|references)\/([a-z0-9_/-]+\.md)/g,
  )) {
    const ref = `${match[1]}/${match[2]}`;
    if (!seen.has(ref)) {
      seen.add(ref);
      refs.push(ref);
    }
  }

  return refs;
}

/**
 * Replace @references/guard-*.md with corresponding file content.
 * Only matches standalone @references/guard-*.md lines (does not match other refs).
 * If file does not exist, keeps original line.
 */
function inlineGuardRefs(body, skillsDir) {
  return body.replace(
    /^@references\/(guard-[a-z0-9_-]+\.md)$/gm,
    (match, filename) => {
      const guardPath = path.join(skillsDir, "references", filename);
      if (!fs.existsSync(guardPath)) return match;
      return fs.readFileSync(guardPath, "utf8").trim();
    },
  );
}

/**
 * Loading conditions for optional references.
 * Key = ref path (e.g., 'references/security-checklist.md')
 * Value = loading condition string
 */
const CONDITIONAL_LOADING_MAP = {
  "references/security-checklist.md":
    "WHEN task relates to auth, encryption, input validation, data exposure",
  "references/ui-brand.md":
    "WHEN task creates/modifies UI components or user-facing screens",
  "references/verification.md":
    "WHEN task needs multi-level verification (not simple pass/fail)",
  "references/state-machine.md":
    "WHEN task relates to milestone state transitions",
  "references/questioning.md":
    "WHEN DISCUSS mode -- needs interactive user questioning",
  "references/prioritization.md":
    "WHEN task ordering/ranking multiple tasks or triage",
  "templates/current-milestone.md":
    "WHEN task relates to milestone state management",
  "templates/state.md": "WHEN task relates to milestone state management",
};

/**
 * Classify refs from execution_context into required vs optional.
 * Parses lines matching @(references|templates)/X.md (required|optional).
 * Workflows are excluded (handled separately).
 * Returns { required: string[], optional: string[] } where strings are 'references/X.md' or 'templates/X.md'.
 */
function classifyRefs(executionContext) {
  if (executionContext == null) return { required: [], optional: [] };
  const required = [];
  const optional = [];

  for (const line of executionContext.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(
      /^@(references|templates)\/([a-z0-9_/-]+\.md)\s+\((required|optional)\)$/,
    );
    if (!match) continue;

    const ref = `${match[1]}/${match[2]}`;
    if (match[3] === "optional") {
      optional.push(ref);
    } else {
      required.push(ref);
    }
  }

  return { required, optional };
}

/**
 * Inline workflow content into command body.
 * If command references @workflows/X.md, read workflow file and:
 * - Replace <execution_context> with <required_reading> from workflow (only required refs)
 * - Append <conditional_reading> for optional refs (file paths + loading conditions)
 * - Replace thin <process> with full <process> from workflow
 * - Merge <rules> from command + workflow
 *
 * Uses original Claude path (~/.claude/) — converter will replace paths later.
 */
function inlineWorkflow(body, skillsDir) {
  // Expand guard references (independent of workflow presence)
  body = inlineGuardRefs(body, skillsDir);

  // Find @workflows/X.md reference
  const workflowMatch = body.match(/@workflows\/([a-z0-9_-]+\.md)/);
  if (!workflowMatch) return body;

  const executionContext = extractXmlSection(body, "execution_context") || "";
  const workflowPath = path.join(skillsDir, "workflows", workflowMatch[1]);
  if (!fs.existsSync(workflowPath)) return body;

  const workflowContent = fs.readFileSync(workflowPath, "utf8");

  // Extract sections from workflow
  const wfProcess = extractXmlSection(workflowContent, "process");
  const wfRules = extractXmlSection(workflowContent, "rules");
  const wfRequiredReading = extractXmlSection(
    workflowContent,
    "required_reading",
  );
  const wfResearchInjection = extractXmlSection(
    workflowContent,
    "research_injection",
  );

  // Classify command refs as required/optional
  const { required: cmdRequired, optional: cmdOptional } =
    classifyRefs(executionContext);
  const optionalSet = new Set(cmdOptional);

  // 1. Replace <execution_context> with <required_reading> from workflow (only required refs)
  if (wfRequiredReading) {
    let reading = wfRequiredReading;
    // Transform @templates/ and @references/ into [SKILLS_DIR]-based paths
    reading = reading.replace(/@templates\//g, "[SKILLS_DIR]/templates/");
    reading = reading.replace(/@references\//g, "[SKILLS_DIR]/references/");
    // Remove generic "Read all referenced files..." line
    reading = reading.replace(
      /Read all referenced files in execution_context.*?:\n?/g,
      "",
    );

    // Filter out optional refs from required_reading
    const filteredReading = reading
      .split("\n")
      .filter((line) => {
        for (const opt of optionalSet) {
          if (line.includes(`[SKILLS_DIR]/${opt}`)) {
            return false;
          }
        }
        return true;
      })
      .join("\n");

    const workflowRefs = extractReadingRefs(wfRequiredReading);

    // Add extra REQUIRED refs from command not already in workflow
    const extraRequired = cmdRequired.filter(
      (ref) => !workflowRefs.includes(ref),
    );
    let requiredSection = filteredReading.trim();
    if (extraRequired.length > 0) {
      const extraLines = extraRequired
        .map((ref) => `- [SKILLS_DIR]/${ref}`)
        .join("\n");
      requiredSection = `${requiredSection}\n${extraLines}`;
    }

    body = body.replace(
      /<execution_context>[\s\S]*?<\/execution_context>/,
      `<required_reading>\nRead .pdconfig → get SKILLS_DIR, then read the following files before starting:\n(Claude Code: cat ~/.claude/commands/pd/.pdconfig — other platforms: converter auto-converts paths)\n${requiredSection}\n</required_reading>`,
    );

    // Build <conditional_reading> for optional refs
    if (cmdOptional.length > 0) {
      const conditionalLines = cmdOptional.map((ref) => {
        const condition = CONDITIONAL_LOADING_MAP[ref] || "WHEN task needs it";
        return `- [SKILLS_DIR]/${ref} -- ${condition}`;
      });

      const conditionalBlock = `\n<conditional_reading>\nRead ONLY WHEN needed (analyze task description first):\n${conditionalLines.join("\n")}\n</conditional_reading>`;

      body = body.replace(
        "</required_reading>",
        "</required_reading>" + conditionalBlock,
      );
    }
  } else {
    body = body.replace(
      /<execution_context>[\s\S]*?<\/execution_context>\n?/,
      "",
    );
  }

  // 1b. Inject <research_injection> from workflow (after conditional_reading, before process)
  if (wfResearchInjection) {
    const researchBlock = `\n<research_injection>\n${wfResearchInjection}\n</research_injection>`;
    // Insert after </conditional_reading> if present, otherwise after </required_reading>
    if (body.includes("</conditional_reading>")) {
      body = body.replace(
        "</conditional_reading>",
        "</conditional_reading>" + researchBlock,
      );
    } else if (body.includes("</required_reading>")) {
      body = body.replace(
        "</required_reading>",
        "</required_reading>" + researchBlock,
      );
    }
  }

  // 2. Replace thin <process> with full <process> from workflow
  if (wfProcess) {
    let processContent = wfProcess;
    processContent = processContent.replace(
      /@templates\//g,
      "[SKILLS_DIR]/templates/",
    );
    processContent = processContent.replace(
      /@references\//g,
      "[SKILLS_DIR]/references/",
    );

    body = body.replace(
      /<process>[\s\S]*?<\/process>/,
      `<process>\n${processContent}\n</process>`,
    );
  }

  // 3. Merge rules: command rules + workflow rules
  if (wfRules) {
    let transformedWfRules = wfRules;
    transformedWfRules = transformedWfRules.replace(
      /@templates\//g,
      "[SKILLS_DIR]/templates/",
    );
    transformedWfRules = transformedWfRules.replace(
      /@references\//g,
      "[SKILLS_DIR]/references/",
    );

    const existingRulesMatch = body.match(/<rules>([\s\S]*?)<\/rules>/);
    if (existingRulesMatch) {
      const cmdRules = existingRulesMatch[1].trim();
      body = body.replace(
        /<rules>[\s\S]*?<\/rules>/,
        `<rules>\n${cmdRules}\n${transformedWfRules}\n</rules>`,
      );
    } else {
      body += `\n<rules>\n${transformedWfRules}\n</rules>`;
    }
  }

  return body;
}

module.exports = {
  log,
  parseFrontmatter,
  buildFrontmatter,
  assembleMd,
  fileHash,
  listSkillFiles,
  commandExists,
  exec,
  isWSL,
  extractXmlSection,
  extractReadingRefs,
  classifyRefs,
  inlineGuardRefs,
  inlineWorkflow,
};
