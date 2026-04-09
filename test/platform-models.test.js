'use strict';

/**
 * Platform Model Mapping Tests
 * Kiem tra platform-specific model resolution, fallback chain, va backward compatibility.
 * Bao gom cursor/windsurf platform definitions trong platforms.js.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  getModelForTier, PLATFORM_MODEL_MAP, FALLBACK_CHAIN, TIER_MAP,
} = require('../bin/lib/resource-config');
const {
  PLATFORMS, getAllRuntimes, getGlobalDir,
} = require('../bin/lib/platforms');

// ─── PLATFORM_MODEL_MAP structure ────────────────────────────

describe('PLATFORM_MODEL_MAP structure', () => {
  it('co du 7 platform keys', () => {
    const keys = Object.keys(PLATFORM_MODEL_MAP);
    assert.equal(keys.length, 7);
    assert.ok(keys.includes('claude'));
    assert.ok(keys.includes('codex'));
    assert.ok(keys.includes('gemini'));
    assert.ok(keys.includes('opencode'));
    assert.ok(keys.includes('copilot'));
    assert.ok(keys.includes('cursor'));
    assert.ok(keys.includes('windsurf'));
  });

  it('FALLBACK_CHAIN la [architect, builder, scout]', () => {
    assert.deepEqual(FALLBACK_CHAIN, ['architect', 'builder', 'scout']);
  });
});

// ─── getModelForTier voi platform ────────────────────────────

describe('getModelForTier voi platform', () => {

  describe('claude', () => {
    it('scout tra ve claude-haiku-4-5-20251001', () => {
      const result = getModelForTier('scout', 'claude');
      assert.equal(result.model, 'claude-haiku-4-5-20251001');
      assert.equal(result.effort, 'low');
      assert.equal(result.maxTurns, 15);
    });

    it('builder tra ve claude-sonnet-4-6-20250217', () => {
      const result = getModelForTier('builder', 'claude');
      assert.equal(result.model, 'claude-sonnet-4-6-20250217');
      assert.equal(result.effort, 'medium');
      assert.equal(result.maxTurns, 25);
    });

    it('architect tra ve claude-opus-4-6-20250205', () => {
      const result = getModelForTier('architect', 'claude');
      assert.equal(result.model, 'claude-opus-4-6-20250205');
      assert.equal(result.effort, 'high');
      assert.equal(result.maxTurns, 30);
    });
  });

  describe('codex', () => {
    it('scout tra ve gpt-5.4-mini', () => {
      const result = getModelForTier('scout', 'codex');
      assert.equal(result.model, 'gpt-5.4-mini');
      assert.equal(result.effort, 'low');
      assert.equal(result.maxTurns, 15);
    });

    it('builder tra ve gpt-5.3-codex', () => {
      const result = getModelForTier('builder', 'codex');
      assert.equal(result.model, 'gpt-5.3-codex');
      assert.equal(result.effort, 'medium');
      assert.equal(result.maxTurns, 25);
    });

    it('architect tra ve gpt-5.4', () => {
      const result = getModelForTier('architect', 'codex');
      assert.equal(result.model, 'gpt-5.4');
      assert.equal(result.effort, 'high');
      assert.equal(result.maxTurns, 30);
    });
  });

  describe('gemini', () => {
    it('scout tra ve gemini-2.5-flash', () => {
      const result = getModelForTier('scout', 'gemini');
      assert.equal(result.model, 'gemini-2.5-flash');
      assert.equal(result.effort, 'low');
      assert.equal(result.maxTurns, 15);
    });

    it('builder tra ve gemini-2.5-pro', () => {
      const result = getModelForTier('builder', 'gemini');
      assert.equal(result.model, 'gemini-2.5-pro');
      assert.equal(result.effort, 'medium');
      assert.equal(result.maxTurns, 25);
    });

    it('architect FALLBACK ve builder voi fallback: true', () => {
      const result = getModelForTier('architect', 'gemini');
      assert.equal(result.model, 'gemini-2.5-pro');
      assert.equal(result.effort, 'medium');
      assert.equal(result.maxTurns, 25);
      assert.equal(result.fallback, true);
      assert.equal(result.requestedTier, 'architect');
      assert.equal(result.resolvedTier, 'builder');
    });
  });

  describe('opencode, copilot, cursor, windsurf co 3 tiers day du', () => {
    for (const platform of ['opencode', 'copilot', 'cursor', 'windsurf']) {
      it(`${platform} scout khong co fallback`, () => {
        const result = getModelForTier('scout', platform);
        assert.ok(result.model);
        assert.equal(result.fallback, undefined);
      });

      it(`${platform} builder khong co fallback`, () => {
        const result = getModelForTier('builder', platform);
        assert.ok(result.model);
        assert.equal(result.fallback, undefined);
      });

      it(`${platform} architect khong co fallback`, () => {
        const result = getModelForTier('architect', platform);
        assert.ok(result.model);
        assert.equal(result.fallback, undefined);
      });
    }
  });
});

// ─── getModelForTier backward compatibility ──────────────────

describe('getModelForTier backward compatibility', () => {
  it('khong platform tra ve generic haiku cho scout', () => {
    const result = getModelForTier('scout');
    assert.equal(result.model, 'haiku');
    assert.equal(result.effort, 'low');
    assert.equal(result.maxTurns, 15);
    assert.equal(result.fallback, undefined);
  });

  it('khong platform tra ve generic opus cho architect', () => {
    const result = getModelForTier('architect');
    assert.equal(result.model, 'opus');
    assert.equal(result.effort, 'high');
    assert.equal(result.maxTurns, 30);
    assert.equal(result.fallback, undefined);
  });

  it('unknown platform tra ve generic haiku cho scout', () => {
    const result = getModelForTier('scout', 'unknown-platform');
    assert.equal(result.model, 'haiku');
    assert.equal(result.effort, 'low');
    assert.equal(result.maxTurns, 15);
    assert.equal(result.fallback, undefined);
  });
});

// ─── platforms.js: cursor va windsurf ────────────────────────

describe('platforms.js: cursor va windsurf', () => {
  it('PLATFORMS co 7 entries', () => {
    assert.equal(Object.keys(PLATFORMS).length, 7);
  });

  it('PLATFORMS.cursor co dirName .cursor va commandPrefix /pd:', () => {
    assert.ok(PLATFORMS.cursor);
    assert.equal(PLATFORMS.cursor.dirName, '.cursor');
    assert.equal(PLATFORMS.cursor.commandPrefix, '/pd:');
  });

  it('PLATFORMS.windsurf co dirName .windsurf va commandPrefix /pd:', () => {
    assert.ok(PLATFORMS.windsurf);
    assert.equal(PLATFORMS.windsurf.dirName, '.windsurf');
    assert.equal(PLATFORMS.windsurf.commandPrefix, '/pd:');
  });

  it('getGlobalDir cursor khong throw', () => {
    assert.doesNotThrow(() => getGlobalDir('cursor'));
  });

  it('getGlobalDir windsurf khong throw', () => {
    assert.doesNotThrow(() => getGlobalDir('windsurf'));
  });

  it('getAllRuntimes tra ve 11 items bao gom cursor va windsurf', () => {
    const runtimes = getAllRuntimes();
    assert.equal(runtimes.length, 11);
    assert.ok(runtimes.includes('cursor'));
    assert.ok(runtimes.includes('windsurf'));
  });
});
