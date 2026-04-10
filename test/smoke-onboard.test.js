/**
 * Smoke tests — pd:onboard skill structure
 * Verifies commands/pd/onboard.md frontmatter, XML sections,
 * workflow reference, and guard file existence (TEST-01).
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { parseFrontmatter } = require('../bin/lib/utils');

const ROOT = path.resolve(__dirname, '..');
const SKILL_PATH = path.join(ROOT, 'commands', 'pd', 'onboard.md');
const WORKFLOW_PATH = path.join(ROOT, 'workflows', 'onboard.md');

function collectRefs(content) {
  return [
    ...content.matchAll(
      /@(workflows|templates|references)\/([a-z0-9_/-]+\.md)/g,
    ),
  ].map((match) => ({
    type: match[1],
    ref: `${match[1]}/${match[2]}`,
    absPath: path.join(ROOT, match[1], match[2]),
  }));
}

describe('pd:onboard skill — structure and reference integrity', () => {
  it('commands/pd/onboard.md exists', () => {
    assert.ok(fs.existsSync(SKILL_PATH), 'commands/pd/onboard.md not found');
  });

  it('commands/pd/onboard.md has required frontmatter fields', () => {
    const content = fs.readFileSync(SKILL_PATH, 'utf8');
    const { frontmatter } = parseFrontmatter(content);
    assert.ok(frontmatter.name, 'missing frontmatter.name');
    assert.ok(frontmatter.description, 'missing frontmatter.description');
    assert.ok(
      frontmatter['allowed-tools'],
      'missing frontmatter.allowed-tools',
    );
  });

  it('commands/pd/onboard.md has required XML sections', () => {
    const content = fs.readFileSync(SKILL_PATH, 'utf8');
    assert.match(
      content,
      /<objective>[\s\S]*<\/objective>/,
      'missing <objective>',
    );
    assert.match(
      content,
      /<guards>[\s\S]*<\/guards>/,
      'missing <guards>',
    );
    assert.match(
      content,
      /<execution_context>[\s\S]*<\/execution_context>/,
      'missing <execution_context>',
    );
    assert.match(
      content,
      /<process>[\s\S]*<\/process>/,
      'missing <process>',
    );
  });

  it('workflows/onboard.md exists and has <process> section', () => {
    assert.ok(
      fs.existsSync(WORKFLOW_PATH),
      'workflows/onboard.md not found',
    );
    const content = fs.readFileSync(WORKFLOW_PATH, 'utf8');
    assert.match(
      content,
      /<process>[\s\S]*<\/process>/,
      'workflows/onboard.md missing <process>',
    );
  });

  it('all @references in commands/pd/onboard.md resolve to existing files', () => {
    const content = fs.readFileSync(SKILL_PATH, 'utf8');
    const refs = collectRefs(content);
    assert.ok(refs.length > 0, 'no @references found in commands/pd/onboard.md');
    for (const ref of refs) {
      assert.ok(
        fs.existsSync(ref.absPath),
        `missing referenced file: ${ref.ref}`,
      );
    }
  });

  it('guard files referenced in <guards> section exist', () => {
    assert.ok(
      fs.existsSync(path.join(ROOT, 'references', 'guard-valid-path.md')),
      'missing references/guard-valid-path.md',
    );
    assert.ok(
      fs.existsSync(path.join(ROOT, 'references', 'guard-fastcode.md')),
      'missing references/guard-fastcode.md',
    );
  });
});
