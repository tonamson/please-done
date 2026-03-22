#!/usr/bin/env node
'use strict';

const { encodingForModel } = require('js-tiktoken');
const fs = require('node:fs');
const path = require('node:path');

// ---------- Config ----------

const ROOT = path.resolve(__dirname, '..');
const DIRS = ['commands/pd', 'workflows', 'references', 'templates'];
const BASELINE_PATH = path.join(ROOT, 'test', 'baseline-tokens.json');

// Skip guard micro-templates (1-line files, already minimal)
const SKIP_PATTERN = /^guard-.*\.md$/;

// ---------- Token counting ----------

const enc = encodingForModel('gpt-4o');

function countTokens(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return {
    tokens: enc.encode(content).length,
    lines: content.split('\n').length,
  };
}

// ---------- Scan target files ----------

function scanFiles() {
  const results = {};

  for (const dir of DIRS) {
    const fullDir = path.join(ROOT, dir);
    if (!fs.existsSync(fullDir)) continue;

    const entries = fs.readdirSync(fullDir, { withFileTypes: true });
    const mdFiles = entries
      .filter(e => e.isFile() && e.name.endsWith('.md') && !SKIP_PATTERN.test(e.name))
      .map(e => e.name)
      .sort();

    for (const file of mdFiles) {
      const rel = path.join(dir, file);
      const full = path.join(ROOT, rel);
      results[rel] = countTokens(full);
    }
  }

  return results;
}

// ---------- Display helpers ----------

function padRight(str, len) {
  return String(str).length >= len ? String(str) : String(str) + ' '.repeat(len - String(str).length);
}

function padLeft(str, len) {
  return String(str).length >= len ? String(str) : ' '.repeat(len - String(str).length) + String(str);
}

function printTable(results) {
  // Group by directory
  const groups = {};
  for (const [rel, data] of Object.entries(results)) {
    const dir = path.dirname(rel);
    if (!groups[dir]) groups[dir] = [];
    groups[dir].push({ file: path.basename(rel), ...data });
  }

  const fileColWidth = 35;
  const tokColWidth = 8;
  const lineColWidth = 6;
  const sep = '-'.repeat(fileColWidth + tokColWidth + lineColWidth + 6);

  console.log('');
  console.log(padRight('File', fileColWidth) + ' | ' + padLeft('Tokens', tokColWidth) + ' | ' + padLeft('Lines', lineColWidth));
  console.log(sep);

  let grandTokens = 0;
  let grandLines = 0;
  let grandFiles = 0;

  for (const dir of DIRS) {
    const items = groups[dir];
    if (!items) continue;

    console.log(`\n  [${dir}]`);

    let dirTokens = 0;
    let dirLines = 0;

    for (const item of items) {
      const rel = `  ${item.file}`;
      console.log(padRight(rel, fileColWidth) + ' | ' + padLeft(item.tokens, tokColWidth) + ' | ' + padLeft(item.lines, lineColWidth));
      dirTokens += item.tokens;
      dirLines += item.lines;
    }

    console.log(padRight(`  Subtotal (${items.length} files)`, fileColWidth) + ' | ' + padLeft(dirTokens, tokColWidth) + ' | ' + padLeft(dirLines, lineColWidth));
    grandTokens += dirTokens;
    grandLines += dirLines;
    grandFiles += items.length;
  }

  console.log(sep);
  console.log(padRight(`TOTAL (${grandFiles} files)`, fileColWidth) + ' | ' + padLeft(grandTokens, tokColWidth) + ' | ' + padLeft(grandLines, lineColWidth));
  console.log('');

  return { total: grandTokens, files: grandFiles, lines: grandLines };
}

// ---------- Baseline ----------

function writeBaseline(results) {
  const total = Object.values(results).reduce((sum, r) => sum + r.tokens, 0);
  const baseline = {
    files: results,
    total,
    capturedAt: new Date().toISOString(),
  };

  // Ensure test/ directory exists
  const testDir = path.dirname(BASELINE_PATH);
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  fs.writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n');
  console.log(`Baseline saved to ${path.relative(ROOT, BASELINE_PATH)}`);
  console.log(`Total baseline: ${total} tokens across ${Object.keys(results).length} files`);
}

// ---------- Compare ----------

function compare(results) {
  if (!fs.existsSync(BASELINE_PATH)) {
    console.error('Error: No baseline found. Run with --baseline first.');
    process.exit(1);
  }

  const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
  const currentTotal = Object.values(results).reduce((sum, r) => sum + r.tokens, 0);

  const fileColWidth = 35;
  const basColWidth = 8;
  const curColWidth = 8;
  const deltaColWidth = 8;
  const pctColWidth = 8;
  const sep = '-'.repeat(fileColWidth + basColWidth + curColWidth + deltaColWidth + pctColWidth + 12);

  console.log('');
  console.log(
    padRight('File', fileColWidth) + ' | ' +
    padLeft('Base', basColWidth) + ' | ' +
    padLeft('Current', curColWidth) + ' | ' +
    padLeft('Delta', deltaColWidth) + ' | ' +
    padLeft('Change', pctColWidth)
  );
  console.log(sep);

  // Group by directory
  const allFiles = new Set([...Object.keys(baseline.files), ...Object.keys(results)]);
  const groups = {};
  for (const rel of allFiles) {
    const dir = path.dirname(rel);
    if (!groups[dir]) groups[dir] = [];
    groups[dir].push(rel);
  }

  let totalBase = 0;
  let totalCurrent = 0;

  for (const dir of DIRS) {
    const files = groups[dir];
    if (!files) continue;

    files.sort();
    console.log(`\n  [${dir}]`);

    let dirBase = 0;
    let dirCurrent = 0;

    for (const rel of files) {
      const base = (baseline.files[rel] || {}).tokens || 0;
      const cur = (results[rel] || {}).tokens || 0;
      const delta = cur - base;
      const pct = base === 0 ? 'NEW' : ((delta / base) * 100).toFixed(1) + '%';

      console.log(
        padRight('  ' + path.basename(rel), fileColWidth) + ' | ' +
        padLeft(base, basColWidth) + ' | ' +
        padLeft(cur, curColWidth) + ' | ' +
        padLeft(delta, deltaColWidth) + ' | ' +
        padLeft(pct, pctColWidth)
      );

      dirBase += base;
      dirCurrent += cur;
    }

    const dirDelta = dirCurrent - dirBase;
    const dirPct = dirBase === 0 ? 'N/A' : ((dirDelta / dirBase) * 100).toFixed(1) + '%';
    console.log(
      padRight(`  Subtotal`, fileColWidth) + ' | ' +
      padLeft(dirBase, basColWidth) + ' | ' +
      padLeft(dirCurrent, curColWidth) + ' | ' +
      padLeft(dirDelta, deltaColWidth) + ' | ' +
      padLeft(dirPct, pctColWidth)
    );

    totalBase += dirBase;
    totalCurrent += dirCurrent;
  }

  const totalDelta = totalCurrent - totalBase;
  const totalPct = totalBase === 0 ? 'N/A' : ((totalDelta / totalBase) * 100).toFixed(1) + '%';

  console.log(sep);
  console.log(
    padRight('TOTAL', fileColWidth) + ' | ' +
    padLeft(totalBase, basColWidth) + ' | ' +
    padLeft(totalCurrent, curColWidth) + ' | ' +
    padLeft(totalDelta, deltaColWidth) + ' | ' +
    padLeft(totalPct, pctColWidth)
  );
  console.log('');
  console.log(`Baseline captured: ${baseline.capturedAt}`);
  console.log(`Overall change: ${totalDelta} tokens (${totalPct})`);
  console.log('');
}

// ---------- Main ----------

function main() {
  const args = process.argv.slice(2);
  const isBaseline = args.includes('--baseline');
  const isCompare = args.includes('--compare');

  try {
    const results = scanFiles();

    if (isBaseline) {
      printTable(results);
      writeBaseline(results);
    } else if (isCompare) {
      compare(results);
    } else {
      printTable(results);
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
