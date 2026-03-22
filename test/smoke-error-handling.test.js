'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Files that were targeted for error handling fixes (D-09)
const TARGET_FILES = [
  'bin/lib/manifest.js',
  'bin/lib/installers/claude.js',
  'bin/lib/installers/gemini.js',
];

describe('Error handling — no silent catches (D-09)', () => {
  for (const relPath of TARGET_FILES) {
    const absPath = path.join(ROOT, relPath);

    it(`${relPath} has no bare catch {} blocks`, () => {
      const content = fs.readFileSync(absPath, 'utf8');
      // Match: catch { }, catch {\n  } — truly empty catch blocks
      const bareCatch = /catch\s*\{[\s]*\}/g;
      // Match: catch { /* ignore */ } — generic silent ignore
      const ignoreCatch = /catch\s*\{[\s]*\/\*\s*ignore\s*\*\/[\s]*\}/g;

      const bareMatches = content.match(bareCatch) || [];
      const ignoreMatches = content.match(ignoreCatch) || [];

      assert.equal(bareMatches.length, 0,
        `${relPath} has ${bareMatches.length} bare catch {} block(s)`);
      assert.equal(ignoreMatches.length, 0,
        `${relPath} has ${ignoreMatches.length} catch { /* ignore */ } block(s)`);
    });

    it(`${relPath} uses log.warn() in all catch blocks`, () => {
      const content = fs.readFileSync(absPath, 'utf8');
      // Find all catch blocks with a variable (err) — these should have logging
      const catchBlocks = content.match(/catch\s*\((\w+)\)\s*\{[^}]*\}/g) || [];

      for (const block of catchBlocks) {
        const hasLogging = block.includes('log.warn') || block.includes('throw');
        // Allow: catch blocks that call exec() as fallback (claude.js pip3/uv venv)
        const hasFallback = block.includes('exec(');
        assert.ok(hasLogging || hasFallback,
          `catch block in ${relPath} has no log.warn/throw/fallback:\n${block.slice(0, 200)}`);
      }
    });
  }
});
