#!/usr/bin/env node
/**
 * bin/sync-instructions.js
 * 
 * Synchronizes AGENTS.md to all supported runtime environments.
 * Reads the source AGENTS.md and copies/generates runtime-specific versions.
 * 
 * Usage: node bin/sync-instructions.js [--dry-run] [--verbose]
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const RUNTIMES = [
  { name: 'Claude Code', env: 'CLAUDE_CODE', dir: '~/.claude/commands/pd' },
  { name: 'Codex CLI', env: 'CODEX_CLI', dir: '~/.codex/commands/pd' },
  { name: 'Gemini CLI', env: 'GEMINI_CLI', dir: '~/.gemini/commands/pd' },
  { name: 'OpenCode', env: 'OPENCODE', dir: '~/.opencode/commands/pd' },
  { name: 'GitHub Copilot', env: 'GITHUB_COPILOT', dir: '~/.copilot/commands/pd' },
  { name: 'Cursor', env: 'CURSOR', dir: '~/.cursor/commands/pd' },
  { name: 'Windsurf', env: 'WINDSURF', dir: '~/.windsurf/commands/pd' },
  { name: 'Cline', env: 'CLINE', dir: '~/.cline/commands/pd' },
  { name: 'Trae', env: 'TRAE', dir: '~/.trae/commands/pd' },
  { name: 'Augment', env: 'AUGMENT', dir: '~/.augment/commands/pd' },
  { name: 'Kilo', env: 'KILO', dir: '~/.kilo/commands/pd' },
  { name: 'Antigravity', env: 'ANTIGRAVITY', dir: '~/.antigravity/commands/pd' },
];

const SOURCE_FILE = 'AGENTS.md';
const DEST_FILE = 'AGENTS.md';

function expandPath(p) {
  return path.normalize(p.replace(/^~/, os.homedir()));
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    return true;
  }
  return false;
}

function syncRuntime(runtime, options = {}) {
  const destDir = expandPath(runtime.dir);
  const destPath = path.join(destDir, DEST_FILE);
  const created = ensureDir(destDir);
  
  if (options.verbose) {
    console.log(`  ${runtime.name}: ${created ? 'created' : 'exists'} ${destDir}`);
  }
  
  if (options.dryRun) {
    console.log(`  [DRY RUN] Would copy to ${destPath}`);
    return { status: 'skipped', path: destPath };
  }
  
  // Copy source to destination
  fs.copyFileSync(SOURCE_FILE, destPath);
  
  return { status: 'synced', path: destPath };
}

function main() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    help: args.includes('--help') || args.includes('-h')
  };
  
  if (options.help) {
    console.log(`
bin/sync-instructions.js — Sync AGENTS.md to all runtimes

Usage: node bin/sync-instructions.js [options]

Options:
  --dry-run    Show what would be done without making changes
  --verbose    Show detailed output
  --help       Show this help message

Examples:
  node bin/sync-instructions.js
  node bin/sync-instructions.js --dry-run --verbose
`);
    return;
  }
  
  // Find source file
  const sourcePath = path.resolve(process.cwd(), SOURCE_FILE);
  if (!fs.existsSync(sourcePath)) {
    console.error(`Error: ${SOURCE_FILE} not found in ${process.cwd()}`);
    console.error('Run this script from the project root after creating AGENTS.md');
    process.exit(1);
  }
  
  console.log(`Syncing ${SOURCE_FILE} to ${RUNTIMES.length} runtimes...`);
  if (options.dryRun) console.log('[DRY RUN MODE]\n');
  
  const results = [];
  let successCount = 0;
  let skipCount = 0;
  
  for (const runtime of RUNTIMES) {
    try {
      const result = syncRuntime(runtime, options);
      results.push({ runtime: runtime.name, ...result });
      if (result.status === 'synced') successCount++;
      else skipCount++;
    } catch (err) {
      results.push({ runtime: runtime.name, status: 'error', error: err.message });
      console.error(`  ERROR ${runtime.name}: ${err.message}`);
    }
  }
  
  console.log(`\nSync complete: ${successCount} synced, ${skipCount} skipped, ${results.filter(r => r.status === 'error').length} errors`);
  
  if (options.verbose || options.dryRun) {
    console.log('\nDetails:');
    for (const r of results) {
      console.log(`  ${r.runtime}: ${r.status}${r.path ? ` (${r.path})` : ''}${r.error ? ` - ${r.error}` : ''}`);
    }
  }
  
  // Exit with error if any failures
  const errorCount = results.filter(r => r.status === 'error').length;
  if (errorCount > 0) {
    console.error(`\n${errorCount} runtime(s) failed to sync.`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { RUNTIMES, syncRuntime, expandPath, ensureDir };