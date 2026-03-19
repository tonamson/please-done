/**
 * Claude Code installer — tương đương install.sh nhưng bằng Node.js.
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
 * Install skills cho Claude Code.
 */
async function install(skillsDir, targetDir, options = {}) {
  const commandsDir = path.join(targetDir, "commands", "pd");
  const fastcodeDir = path.join(skillsDir, "FastCode");
  const skillsSrc = path.join(skillsDir, "commands", "pd");

  // ─── Step 1: Check prerequisites ──────────────────────
  log.step(1, TOTAL_STEPS, "Kiểm tra yêu cầu...");

  if (!commandExists("claude")) {
    log.error(
      "Claude Code CLI chưa cài. Cài trước: https://claude.ai/download",
    );
    process.exit(1);
  }
  log.success("Claude Code CLI");

  // Python check
  let pythonCmd = null;
  if (commandExists("python3")) pythonCmd = "python3";
  else if (commandExists("python")) pythonCmd = "python";

  if (!pythonCmd) {
    log.error("Python chưa cài. Cần Python 3.12+");
    process.exit(1);
  }

  const pyVersion = exec(`${pythonCmd} --version`, {
    ignoreError: true,
  }).replace("Python ", "");
  const [pyMajor, pyMinor] = pyVersion.split(".").map(Number);
  if (pyMajor < 3 || (pyMajor === 3 && pyMinor < 12)) {
    log.error(`Python 3.12+ cần thiết (hiện có ${pyVersion})`);
    process.exit(1);
  }
  log.success(`Python ${pyVersion} (${pythonCmd})`);

  // uv check
  if (!commandExists("uv")) {
    log.warn("Đang cài uv...");
    try {
      exec("curl -LsSf https://astral.sh/uv/install.sh | sh", {
        timeout: 60000,
      });
    } catch {
      try {
        exec("pip3 install uv --break-system-packages");
      } catch {
        exec("pip3 install uv");
      }
    }
  }
  log.success("uv package manager");

  if (!commandExists("git")) {
    log.error("Git chưa cài.");
    process.exit(1);
  }
  log.success("Git");

  // ─── Step 2: Init submodule (FastCode) ────────────────
  console.log("");
  log.step(2, TOTAL_STEPS, "Cài đặt FastCode...");

  exec(`cd "${skillsDir}" && git submodule update --init --recursive`, {
    ignoreError: true,
  });

  const mcpServerPath = path.join(fastcodeDir, "mcp_server.py");
  if (!fs.existsSync(mcpServerPath)) {
    log.error("FastCode submodule thiếu. Chạy: git submodule update --init");
    process.exit(1);
  }
  log.success("FastCode source ready");

  // ─── Step 3: Setup Python venv ────────────────────────
  console.log("");
  log.step(3, TOTAL_STEPS, "Cài đặt Python environment...");

  const venvDir = path.join(fastcodeDir, ".venv");
  if (!fs.existsSync(venvDir)) {
    try {
      exec(`cd "${fastcodeDir}" && uv venv --python=${pyMajor}.${pyMinor}`, {
        timeout: 60000,
      });
    } catch {
      exec(`cd "${fastcodeDir}" && uv venv`, { timeout: 60000 });
    }
    log.success("Virtual environment đã tạo");
  } else {
    log.success("Virtual environment đã có");
  }

  exec(
    `cd "${fastcodeDir}" && source .venv/bin/activate && uv pip install -r requirements.txt`,
    { timeout: 120000, shell: "/bin/bash" },
  );
  log.success("Dependencies đã cài");

  // ─── Step 4: Setup .env + Gemini API Key ──────────────
  console.log("");
  log.step(4, TOTAL_STEPS, "Cấu hình environment...");

  const envFile = path.join(fastcodeDir, ".env");
  const envExample = path.join(skillsDir, "env.example");

  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, "utf8");
    const keyMatch = envContent.match(/OPENAI_API_KEY=(.+)/);
    if (keyMatch && keyMatch[1] && keyMatch[1] !== "AIxxxx") {
      log.success(".env đã có API key");
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
  log.step(5, TOTAL_STEPS, "Cài đặt skills...");

  fs.mkdirSync(commandsDir, { recursive: true });

  // Cleanup thư mục cũ từ bản sk nếu còn tồn tại
  const legacySkDir = path.join(targetDir, "commands", "sk");
  if (fs.existsSync(legacySkDir)) {
    fs.rmSync(legacySkDir, { recursive: true, force: true });
    log.success("Đã xóa thư mục skills cũ (commands/sk)");
  }

  // Remove old files (lstatSync để detect cả broken symlinks)
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

  // Symlink rules directory (lstatSync để clean broken symlinks)
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
  log.step(6, TOTAL_STEPS, "Đăng ký MCP servers...");

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
      log.warn("Context7 MCP registration failed (tùy chọn)");
    }
  } else {
    log.warn("npx not found — bỏ qua Context7 MCP");
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
 * Uninstall skills khỏi Claude Code.
 */
async function uninstall(targetDir) {
  const commandsDir = path.join(targetDir, "commands", "pd");
  // Cleanup thư mục cũ từ bản sk nếu còn tồn tại
  const legacyDir = path.join(targetDir, "commands", "sk");
  for (const dir of [legacyDir]) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      log.success("Đã xóa thư mục skills cũ (commands/sk)");
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
    // Remove rules symlink (lstatSync để detect broken symlinks)
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

  log.success("Skills đã gỡ khỏi Claude Code");
}

/**
 * Prompt user nhập Gemini API Key.
 */
async function promptGeminiKey(envFile) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("");
  console.log("  Nhập Gemini API Key của bạn (bắt buộc):");
  console.log("  Lấy key tại: https://aistudio.google.com/apikey");

  const key = await ask(rl, "  → ");
  rl.close();

  if (!key) {
    log.error("Chưa nhập Gemini API Key! FastCode MCP cần key này.");
    log.error("Chạy lại installer khi có key.");
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

  log.success("API key đã lưu");
}

module.exports = { install, uninstall };
