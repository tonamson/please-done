#!/usr/bin/env node

/**
 * Benchmark — Measures installer performance + workflow structure analysis.
 *
 * Run: node test/benchmark.js
 * Results: printed to terminal in markdown format (copy-paste ready)
 */

"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");

const SKILLS_DIR = path.resolve(__dirname, "..");
const RESULTS = [];

function out(msg = "") {
  console.log(msg);
  RESULTS.push(msg);
}

// ─── Helpers ──────────────────────────────────────────────
function countFilesRecursive(dir) {
  let files = 0,
    lines = 0;
  if (!fs.existsSync(dir)) return { files, lines };
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = countFilesRecursive(full);
      files += sub.files;
      lines += sub.lines;
    } else {
      files++;
      try {
        lines += fs.readFileSync(full, "utf8").split("\n").length;
      } catch {}
    }
  }
  return { files, lines };
}

function silenced(fn) {
  const orig = console.log;
  console.log = () => {};
  const result = fn();
  console.log = orig;
  return result;
}

function countPattern(content, regex) {
  return (content.match(regex) || []).length;
}

// ─── Main ─────────────────────────────────────────────────
async function main() {
  out("# Benchmark — Please Done");
  out(`> Date: ${new Date().toISOString().slice(0, 10)}`);
  out(`> Node: ${process.version}`);
  out(`> OS: ${os.platform()} ${os.arch()}`);

  // ════════════════════════════════════════════════════════
  out("\n## 1. Installation performance");
  out("");
  out(
    "Install to temp directory → measure time + generated files → uninstall → confirm clean.",
  );
  out("");
  out(
    "| Platform | Install (ms) | Uninstall (ms) | Files | Lines | Path leak |",
  );
  out("|----------|-------------|---------------|-------|-------|-----------|");

  const { scanLeakedPaths } = require("../bin/lib/manifest");
  const platformMap = {
    codex: "Codex CLI",
    copilot: "GitHub Copilot",
    gemini: "Gemini CLI",
    opencode: "OpenCode",
  };

  let totalFiles = 0,
    totalLines = 0;

  for (const [key, name] of Object.entries(platformMap)) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `pd-bench-${key}-`));
    const installer = require(`../bin/lib/installers/${key}`);

    // Install
    const t1 = performance.now();
    await silenced(() =>
      installer.install(SKILLS_DIR, tmpDir, { version: "0.0.0-bench" }),
    );
    const installMs = Math.round(performance.now() - t1);

    // Count
    const { files, lines } = countFilesRecursive(tmpDir);
    totalFiles += files;
    totalLines += lines;

    // Leak check
    const leaked = scanLeakedPaths(tmpDir, "~/.claude/");

    // Uninstall
    const t2 = performance.now();
    await silenced(() => installer.uninstall(tmpDir));
    const uninstallMs = Math.round(performance.now() - t2);

    out(
      `| ${name} | ${installMs} | ${uninstallMs} | ${files} | ${lines.toLocaleString()} | ${leaked.length === 0 ? "✅ 0" : "❌ " + leaked.length} |`,
    );

    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  out("");
  out(
    `**Total**: ${totalFiles} files, ${totalLines.toLocaleString()} lines generated for 4 platforms from 1 single source.`,
  );

  // ════════════════════════════════════════════════════════
  out("\n## 2. Idempotency (safe reinstall)");
  out("");

  let idempotentPass = 0;
  for (const key of Object.keys(platformMap)) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `pd-idem-${key}-`));
    const installer = require(`../bin/lib/installers/${key}`);

    await silenced(() =>
      installer.install(SKILLS_DIR, tmpDir, { version: "1.0.0" }),
    );
    const count1 = countFilesRecursive(tmpDir).files;

    await silenced(() =>
      installer.install(SKILLS_DIR, tmpDir, { version: "2.0.0" }),
    );
    const count2 = countFilesRecursive(tmpDir).files;

    const ok = Math.abs(count1 - count2) <= 1; // manifest file may differ
    if (ok) idempotentPass++;

    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  out(
    `Install twice consecutively (v1 → v2): **${idempotentPass}/4 platforms** no extra files created.`,
  );

  // ════════════════════════════════════════════════════════
  out("\n## 3. Smoke tests");
  out("");

  // Run tests and count results
  const { execSync } = require("child_process");
  try {
    const testOutput = execSync("node --test 'test/smoke-*.test.js' 2>&1", {
      encoding: "utf8",
      cwd: SKILLS_DIR,
      timeout: 60000,
    });

    const passMatch = testOutput.match(/pass (\d+)/);
    const failMatch = testOutput.match(/fail (\d+)/);
    const durationMatch = testOutput.match(/duration_ms ([\d.]+)/);

    const pass = passMatch ? passMatch[1] : "?";
    const fail = failMatch ? failMatch[1] : "?";
    const duration = durationMatch
      ? Math.round(parseFloat(durationMatch[1]))
      : "?";

    out(`| Result | Count |`);
    out(`|--------|-------|`);
    out(`| ✅ Pass | ${pass} |`);
    out(`| ❌ Fail | ${fail} |`);
    out(`| ⏱ Duration | ${duration}ms |`);
  } catch (err) {
    const output = err.stdout || err.stderr || "";
    const passMatch = output.match(/pass (\d+)/);
    const failMatch = output.match(/fail (\d+)/);
    out(
      `Tests: ${passMatch ? passMatch[1] : "?"} pass, ${failMatch ? failMatch[1] : "?"} fail`,
    );
  }

  // ════════════════════════════════════════════════════════
  out("\n## 4. Workflow structure analysis");
  out("");

  // Read all workflow + command files
  const workflowDir = path.join(SKILLS_DIR, "workflows");
  const commandDir = path.join(SKILLS_DIR, "commands", "pd");
  const refDir = path.join(SKILLS_DIR, "references");
  const tplDir = path.join(SKILLS_DIR, "templates");

  let totalSteps = 0;
  let totalGates = 0;
  let totalRecovery = 0;
  let totalUserInteraction = 0;
  let totalWorkflowLines = 0;

  const workflowFiles = fs
    .readdirSync(workflowDir)
    .filter((f) => f.endsWith(".md"));

  for (const file of workflowFiles) {
    const content = fs.readFileSync(path.join(workflowDir, file), "utf8");
    totalWorkflowLines += content.split("\n").length;
    totalSteps += countPattern(content, /^##\s+Step\s+/gm);
    totalGates += countPattern(
      content,
      /STOP|BLOCK|\*\*STOP\*\*|\*\*BLOCK\*\*/g,
    );
    totalRecovery += countPattern(
      content,
      /recover|restore|PROGRESS\.md|DISCUSS_STATE|debug\//gi,
    );
    totalUserInteraction += countPattern(
      content,
      /AskUserQuestion|ask user|request.*confirmation/gi,
    );
  }

  // Count supporting files
  const refFiles = fs.existsSync(refDir)
    ? fs.readdirSync(refDir).filter((f) => f.endsWith(".md")).length
    : 0;
  const tplFiles = fs.existsSync(tplDir)
    ? fs.readdirSync(tplDir).filter((f) => f.endsWith(".md")).length
    : 0;
  const commandFiles = fs
    .readdirSync(commandDir)
    .filter((f) => f.endsWith(".md")).length;
  const rulesDir = path.join(commandDir, "rules");
  const rulesFiles = fs.existsSync(rulesDir)
    ? countFilesRecursive(rulesDir).files
    : 0;

  out("| Component | Count |");
  out("|-----------|-------|");
  out(`| Skills (user-invoked commands) | ${commandFiles} |`);
  out(`| Workflows (detailed processes) | ${workflowFiles.length} |`);
  out(`| Total workflow steps | ${totalSteps} |`);
  out(`| Check gates (STOP/BLOCK) | ${totalGates} |`);
  out(`| Recovery points (interruption) | ${totalRecovery} |`);
  out(`| User interaction points | ${totalUserInteraction} |`);
  out(`| Templates (file templates) | ${tplFiles} |`);
  out(`| References (shared conventions) | ${refFiles} |`);
  out(`| Rules (stack-specific code rules) | ${rulesFiles} |`);
  out(`| Total workflow lines | ${totalWorkflowLines.toLocaleString()} |`);

  // ════════════════════════════════════════════════════════
  out("\n## 5. Cross-platform capability");
  out("");
  out(
    "Write once in Claude Code format → installer auto-converts for each platform.",
  );
  out("");
  out("| Platform | Command | Config path | Tool mapping |");
  out("|----------|---------|-------------|-------------|");

  const { PLATFORMS } = require("../bin/lib/platforms");
  for (const [key, p] of Object.entries(PLATFORMS)) {
    const toolCount = Object.keys(p.toolMap || {}).length;
    out(
      `| ${p.name} | \`${p.commandPrefix}init\` | \`~/${p.dirName}/\` | ${toolCount > 0 ? toolCount + " tools" : "unchanged"} |`,
    );
  }

  // ════════════════════════════════════════════════════════
  out("\n## 6. Main workflow");
  out("");
  out("```");
  out("/pd:init          Initialize environment, detect tech stack");
  out("    ↓");
  out("/pd:scan          Scan project structure, security report");
  out("    ↓");
  out("/pd:new-milestone  Strategic planning + requirements + roadmap");
  out("    ↓");
  out("/pd:plan          Technical design + task breakdown");
  out("    ↓");
  out("/pd:write-code    AI writes code per plan (auto/parallel)");
  out("    ↓");
  out("/pd:test          Automated testing (or manual for frontend)");
  out("    ↓");
  out("/pd:fix-bug       Fix bugs using scientific method");
  out("    ↓");
  out("/pd:complete-milestone  Close version, create git tag, report");
  out("```");
  out("");
  out(
    "Each step has check gates — AI cannot skip or self-modify approved designs.",
  );

  // ════════════════════════════════════════════════════════
  out("\n---");
  out(
    `*Benchmark auto-generated by \`node test/benchmark.js\` — ${new Date().toISOString()}*`,
  );

  // Ghi file
  const outputPath = path.join(SKILLS_DIR, "BENCHMARK_RESULTS.md");
  fs.writeFileSync(outputPath, RESULTS.join("\n") + "\n", "utf8");
  console.log(`\n→ Results written to ${outputPath}`);
}

main().catch((err) => {
  console.error("Benchmark error:", err.message);
  process.exit(1);
});
