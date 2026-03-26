#!/usr/bin/env node
'use strict';

/**
 * CLI script tao INDEX.md tu research files trong internal/ va external/.
 *
 * Doc tat ca .md files trong .planning/research/internal/ va .planning/research/external/,
 * goi parseResearchFiles() + generateIndex() tu index-generator.js, ghi INDEX.md ra disk.
 *
 * Dung RESEARCH_DIR env variable de override duong dan (cho testing).
 *
 * Usage: node bin/update-research-index.js
 */

const fs = require('fs');
const path = require('path');
const { parseResearchFiles, generateIndex } = require('./lib/index-generator');

// Cho phep override duong dan qua env (dung trong tests)
const researchDir = process.env.RESEARCH_DIR || path.resolve('.planning/research');
const subDirs = ['internal', 'external'];
const allFiles = [];

for (const sub of subDirs) {
  const dirPath = path.join(researchDir, sub);
  if (!fs.existsSync(dirPath)) continue;
  const names = fs.readdirSync(dirPath).filter(n => n.endsWith('.md'));
  for (const name of names) {
    const content = fs.readFileSync(path.join(dirPath, name), 'utf8');
    allFiles.push({ filename: name, content });
  }
}

const entries = parseResearchFiles(allFiles);
const indexContent = generateIndex(entries);

const indexPath = path.join(researchDir, 'INDEX.md');
fs.writeFileSync(indexPath, indexContent, 'utf8');

console.log(`INDEX.md cap nhat: ${entries.length} entries`);
