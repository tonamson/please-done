/**
 * Claude Code installer — equivalent to install.sh but in Node.js.
 * Copy/symlink skills, setup FastCode MCP, register Context7.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const { log, commandExists, exec, listSkillFiles } = require("../utils");

const TOTAL_STEPS = 6;

function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

/**
 * Install skills for Claude Code.
 */
async function install(skillsDir, targetDir, options = {}) {
  const commandsDir = path.join(targetDir, "commands", "pd");
  const fastcodeDir = path.join(skillsDir, "FastCode");
  const skillsSrc = path.join(skillsDir, "commands", "pd");

  // ─── Step 1: Check prerequisites ──────────────────────
  log.step(1, TOTAL_STEPS, "Checking prerequisites...");

  if (!commandExists("claude")) {
    log.error(
      "Claude Code CLI not installed. Install first: https://claude.ai/download",
    );
    process.exit(1);
  }
  log.success("Claude Code CLI");

  // Python check
  let pythonCmd = null;
  if (commandExists("python3")) pythonCmd = "python3";
  else if (commandExists("python")) pythonCmd = "python";

  if (!pythonCmd) {
    log.error("Python not installed. Requires Python 3.12+");
    process.exit(1);
  }

  const pyVersion = exec(`${pythonCmd} --version`, {
    ignoreError: true,
  }).replace("Python ", "");
  const [pyMajor, pyMinor] = pyVersion.split(".").map(Number);
  if (pyMajor < 3 || (pyMajor === 3 && pyMinor < 12)) {
    log.error(`Python 3.12+ required (currently ${pyVersion})`);
    process.exit(1);
  }
  log.success(`Python ${pyVersion} (${pythonCmd})`);

  // uv check
  if (!commandExists("uv")) {
    log.warn("Installing uv...");
    try {
      exec("curl -LsSf https://astral.sh/uv/install.sh | sh", {
        timeout: 60000,
      });
    } catch (curlErr) {
      log.warn(
        `uv install via curl failed: ${curlErr.message}, trying pip3...`,
      );
      try {
        exec("pip3 install uv --break-system-packages");
      } catch (pip3Err) {
        log.warn(
          `pip3 --break-system-packages failed: ${pip3Err.message}, trying without flag...`,
        );
        exec("pip3 install uv");
      }
    }
  }
  log.success("uv package manager");

  if (!commandExists("git")) {
    log.error("Git not installed.");
    process.exit(1);
  }
  log.success("Git");

  // ─── Step 2: Init submodule (FastCode) ────────────────
  console.log("");
  log.step(2, TOTAL_STEPS, "Installing FastCode...");

  exec(`cd "${skillsDir}" && git submodule update --init --recursive`, {
    ignoreError: true,
  });

  const mcpServerPath = path.join(fastcodeDir, "mcp_server.py");
  if (!fs.existsSync(mcpServerPath)) {
    log.error("FastCode submodule missing. Run: git submodule update --init");
    process.exit(1);
  }
  log.success("FastCode source ready");

  // ─── Step 3: Setup Python venv ────────────────────────
  console.log("");
  log.step(3, TOTAL_STEPS, "Setting up Python environment...");

  const venvDir = path.join(fastcodeDir, ".venv");
  if (!fs.existsSync(venvDir)) {
    try {
      exec(`cd "${fastcodeDir}" && uv venv --python=${pyMajor}.${pyMinor}`, {
        timeout: 60000,
      });
    } catch (err) {
      log.warn(
        `uv venv with specific python failed: ${err.message}, trying default...`,
      );
      exec(`cd "${fastcodeDir}" && uv venv`, { timeout: 60000 });
    }
    log.success("Virtual environment created");
  } else {
    log.success("Virtual environment exists");
  }

  exec(
    `cd "${fastcodeDir}" && source .venv/bin/activate && uv pip install -r requirements.txt`,
    { timeout: 120000, shell: "/bin/bash" },
  );
  log.success("Dependencies installed");

  // ─── Step 4: Setup .env + Gemini API Key ──────────────
  console.log("");
  log.step(4, TOTAL_STEPS, "Configuring environment...");

  const envFile = path.join(fastcodeDir, ".env");
  const envExample = path.join(skillsDir, "env.example");

  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, "utf8");
    const keyMatch = envContent.match(/OPENAI_API_KEY=(.+)/);
    if (keyMatch && keyMatch[1] && keyMatch[1] !== "AIxxxx") {
      log.success(".env already has API key");
    } else {
      await promptGeminiKey(envFile);
    }
  } else {
    if (fs.existsSync(envExample)) {
      fs.copyFileSync(envExample, envFile);
    }
    await promptGeminiKey(envFile);
  }

  // ─── Step 5: Install skills ───────────────────────────
  console.log("");
  log.step(5, TOTAL_STEPS, "Installing skills...");

  fs.mkdirSync(commandsDir, { recursive: true });

  // Cleanup legacy sk directory if it still exists
  const legacySkDir = path.join(targetDir, "commands", "sk");
  if (fs.existsSync(legacySkDir)) {
    fs.rmSync(legacySkDir, { recursive: true, force: true });
    log.success("Removed legacy skills directory (commands/sk)");
  }

  // Remove old files (lstatSync to detect broken symlinks)
  if (fs.existsSync(commandsDir)) {
    const oldFiles = fs
      .readdirSync(commandsDir)
      .filter((f) => f.endsWith(".md"));
    for (const f of oldFiles) {
      const fp = path.join(commandsDir, f);
      try {
        fs.lstatSync(fp);
        fs.unlinkSync(fp);
      } catch {
        /* already gone */
      }
    }
  }

  // Symlink skill files
  const skills = listSkillFiles(skillsSrc);
  for (const skill of skills) {
    const dest = path.join(commandsDir, `${skill.name}.md`);
    try {
      fs.lstatSync(dest);
      fs.unlinkSync(dest);
    } catch {
      /* not exists */
    }
    fs.symlinkSync(skill.filePath, dest);
    log.success(`/pd:${skill.name}`);
  }

  // Symlink rules directory (lstatSync to clean broken symlinks)
  const rulesDir = path.join(skillsSrc, "rules");
  const rulesLink = path.join(commandsDir, "rules");
  if (fs.existsSync(rulesDir)) {
    try {
      fs.lstatSync(rulesLink);
      fs.unlinkSync(rulesLink);
    } catch {
      /* not exists */
    }
    fs.symlinkSync(rulesDir, rulesLink);
    log.success("Rules directory linked");
  }

  // ─── Step 6: Register MCP servers ─────────────────────
  console.log("");
  log.step(6, TOTAL_STEPS, "Registering MCP servers...");

  const pythonPath = path.join(fastcodeDir, ".venv", "bin", "python");
  const mcpScript = path.join(fastcodeDir, "mcp_server.py");

  // FastCode MCP
  exec("claude mcp remove --scope user fastcode", { ignoreError: true });
  try {
    exec(
      `claude mcp add --scope user fastcode -- "${pythonPath}" "${mcpScript}"`,
    );
    log.success("FastCode MCP registered");
  } catch {
    log.warn("FastCode MCP registration failed");
  }

  // Context7 MCP
  if (commandExists("npx")) {
    exec("claude mcp remove --scope user context7", { ignoreError: true });
    try {
      exec(
        "claude mcp add --scope user context7 -- npx -y @upstash/context7-mcp@latest",
      );
      log.success("Context7 MCP registered");
    } catch {
      log.warn("Context7 MCP registration failed (optional)");
    }
  } else {
    log.warn("npx not found — skipping Context7 MCP");
  }

  // ─── Save .pdconfig ───────────────────────────────────
  const configFile = path.join(commandsDir, ".pdconfig");
  let savedVersion = "";
  if (fs.existsSync(configFile)) {
    const existing = fs.readFileSync(configFile, "utf8");
    const match = existing.match(/^CURRENT_VERSION=(.+)$/m);
    if (match) savedVersion = match[0];
  }

  let configContent = `SKILLS_DIR=${skillsDir}\nFASTCODE_DIR=${fastcodeDir}\n`;
  if (savedVersion) configContent += `${savedVersion}\n`;
  fs.writeFileSync(configFile, configContent, "utf8");
  log.success(`Config saved: ${configFile}`);

  // ─── Summary ──────────────────────────────────────────
  console.log("");
  log.info(`Skills v${options.version} installed (${skills.length} skills):`);
  for (const skill of skills) {
    const descMatch = skill.content.match(/^description:\s*(.+)$/m);
    const desc = descMatch ? descMatch[1] : "";
    console.log(`  /pd:${skill.name.padEnd(20)} ${desc}`);
  }
}

/**
 * Uninstall skills from Claude Code.
 */
async function uninstall(targetDir) {
  const commandsDir = path.join(targetDir, "commands", "pd");
  // Cleanup legacy sk directory if it still exists
  const legacyDir = path.join(targetDir, "commands", "sk");
  for (const dir of [legacyDir]) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      log.success("Removed legacy skills directory (commands/sk)");
    }
  }

  // Remove skill symlinks
  if (fs.existsSync(commandsDir)) {
    const files = fs.readdirSync(commandsDir);
    for (const f of files) {
      const fp = path.join(commandsDir, f);
      const stat = fs.lstatSync(fp);
      if (stat.isSymbolicLink() || f.endsWith(".md") || f === ".pdconfig") {
        fs.unlinkSync(fp);
      }
    }
    // Remove rules symlink (lstatSync to detect broken symlinks)
    const rulesLink = path.join(commandsDir, "rules");
    try {
      fs.lstatSync(rulesLink);
      fs.unlinkSync(rulesLink);
    } catch {
      /* not exists */
    }

    // Remove empty dir
    try {
      fs.rmdirSync(commandsDir);
    } catch {
      /* not empty */
    }
  }

  // Remove MCP
  exec("claude mcp remove --scope user fastcode", { ignoreError: true });
  log.success("FastCode MCP removed");

  log.success("Skills removed from Claude Code");
}

/**
 * Prompt user for Gemini API Key.
 */
async function promptGeminiKey(envFile) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("");
  console.log("  Enter your Gemini API Key (required):");
  console.log("  Get your key at: https://aistudio.google.com/apikey");

  const key = await ask(rl, "  → ");
  rl.close();

  if (!key) {
    log.error("Gemini API Key not entered! FastCode MCP requires this key.");
    log.error("Re-run the installer when you have a key.");
    process.exit(1);
  }

  // Update .env file
  if (fs.existsSync(envFile)) {
    let content = fs.readFileSync(envFile, "utf8");
    content = content.replace(/OPENAI_API_KEY=.*/, `OPENAI_API_KEY=${key}`);
    fs.writeFileSync(envFile, content, "utf8");
  } else {
    fs.writeFileSync(
      envFile,
      `OPENAI_API_KEY=${key}\nBASE_URL=https://generativelanguage.googleapis.com/v1beta/openai\nMODEL=gemini-2.5-flash-lite\n`,
      "utf8",
    );
  }

  log.success("API key saved");
}

/**
 * Install skill files only (Step 5 + .pdconfig) — used for testing.
 * Skips prerequisites check and Python/MCP setup.
 */
function installSkillsOnly(skillsDir, targetDir, options = {}) {
  const commandsDir = path.join(targetDir, "commands", "pd");
  const fastcodeDir = path.join(skillsDir, "FastCode");
  const skillsSrc = path.join(skillsDir, "commands", "pd");

  fs.mkdirSync(commandsDir, { recursive: true });

  // Cleanup legacy
  const legacySkDir = path.join(targetDir, "commands", "sk");
  if (fs.existsSync(legacySkDir)) {
    fs.rmSync(legacySkDir, { recursive: true, force: true });
  }

  // Remove old files
  if (fs.existsSync(commandsDir)) {
    const oldFiles = fs
      .readdirSync(commandsDir)
      .filter((f) => f.endsWith(".md"));
    for (const f of oldFiles) {
      const fp = path.join(commandsDir, f);
      try {
        fs.lstatSync(fp);
        fs.unlinkSync(fp);
      } catch {
        /* already gone */
      }
    }
  }

  // Symlink skill files
  const skills = listSkillFiles(skillsSrc);
  for (const skill of skills) {
    const dest = path.join(commandsDir, `${skill.name}.md`);
    try {
      fs.lstatSync(dest);
      fs.unlinkSync(dest);
    } catch {
      /* not exists */
    }
    fs.symlinkSync(skill.filePath, dest);
  }

  // Symlink rules directory
  const rulesDir = path.join(skillsSrc, "rules");
  const rulesLink = path.join(commandsDir, "rules");
  if (fs.existsSync(rulesDir)) {
    try {
      fs.lstatSync(rulesLink);
      fs.unlinkSync(rulesLink);
    } catch {
      /* not exists */
    }
    fs.symlinkSync(rulesDir, rulesLink);
  }

  // .pdconfig
  const configFile = path.join(commandsDir, ".pdconfig");
  let configContent = `SKILLS_DIR=${skillsDir}\nFASTCODE_DIR=${fastcodeDir}\n`;
  if (options.version) configContent += `CURRENT_VERSION=${options.version}\n`;
  fs.writeFileSync(configFile, configContent, "utf8");

  return { skills, commandsDir };
}

module.exports = { install, uninstall, installSkillsOnly };
