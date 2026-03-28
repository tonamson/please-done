/**
 * OpenCode installer.
 * Skills → ~/.config/opencode/command/pd-*.md (flat, no nested dirs)
 * Frontmatter: strip name, add model: inherit
 */

"use strict";

const fs = require("fs");
const path = require("path");

const { log, listSkillFiles } = require("../utils");
const { convertSkill, flattenName } = require("../converters/opencode");
const {
  ensureDir,
  savePdconfig,
  cleanOldFiles,
} = require("../installer-utils");

async function install(skillsDir, targetDir, options = {}) {
  const skillsSrc = path.join(skillsDir, "commands", "pd");
  const commandDir = path.join(targetDir, "command");

  // ─── Step 1: Convert & copy skills (flat) ─────────────
  log.step(1, 3, "Converting skills for OpenCode...");

  ensureDir(commandDir);

  // Clean old pd-* and legacy sk-* files
  cleanOldFiles(
    commandDir,
    (f) => (f.startsWith("pd-") || f.startsWith("sk-")) && f.endsWith(".md"),
  );

  const skills = listSkillFiles(skillsSrc);
  for (const skill of skills) {
    const converted = convertSkill(skill.content, skillsDir);
    const filename = `${flattenName(skill.name)}.md`;
    fs.writeFileSync(path.join(commandDir, filename), converted, "utf8");
    log.success(`/pd-${skill.name}`);
  }

  // ─── Step 2: Save .pdconfig ─────────────────────────
  log.step(2, 3, "Saving .pdconfig configuration...");

  const fastcodeDir = path.join(skillsDir, "FastCode");
  const pdconfigFile = path.join(targetDir, ".pdconfig");
  savePdconfig(pdconfigFile, skillsDir, fastcodeDir);
  log.success(`Config saved: ${pdconfigFile}`);

  // ─── Step 3: Copy rules (inline into command dir) ──────
  log.step(3, 3, "Copy rules...");

  const rulesDir = path.join(skillsSrc, "rules");
  if (fs.existsSync(rulesDir)) {
    const entries = fs.readdirSync(rulesDir, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(rulesDir, entry.name);
      if (entry.isFile() && entry.name.endsWith(".md")) {
        let content = fs.readFileSync(srcPath, "utf8");
        content = content.replace(/~\/\.claude\//g, "~/.config/opencode/");
        content = content.replace(/\/pd:([a-z0-9_-]+)/g, "/pd-$1");
        fs.writeFileSync(
          path.join(commandDir, `pd-rules-${entry.name}`),
          content,
          "utf8",
        );
      } else if (entry.isDirectory()) {
        for (const sf of fs
          .readdirSync(srcPath)
          .filter((f) => f.endsWith(".md"))) {
          let content = fs.readFileSync(path.join(srcPath, sf), "utf8");
          content = content.replace(/~\/\.claude\//g, "~/.config/opencode/");
          content = content.replace(/\/pd:([a-z0-9_-]+)/g, "/pd-$1");
          fs.writeFileSync(
            path.join(commandDir, `pd-rules-${entry.name}-${sf}`),
            content,
            "utf8",
          );
        }
      }
    }
    log.success("Rules copied");
  }

  // Summary
  console.log("");
  log.info(`Skills v${options.version} — ${skills.length} skills for OpenCode`);
  log.info("Invoke with: /pd-init, /pd-write-code, /pd-plan ...");
}

async function uninstall(targetDir) {
  const commandDir = path.join(targetDir, "command");

  if (fs.existsSync(commandDir)) {
    const files = fs
      .readdirSync(commandDir)
      .filter((f) => f.startsWith("pd-") || f.startsWith("sk-"));
    for (const f of files) {
      fs.unlinkSync(path.join(commandDir, f));
    }
    log.success("Skills removed");
  }
}

module.exports = { install, uninstall };
