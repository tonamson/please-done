import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  checkStaleness,
  shouldAutoRefresh,
  getRefreshRecommendation,
  getStalenessLevel,
} from '../bin/lib/refresh-detector.js';

describe('refresh-detector', () => {
  describe('checkStaleness', () => {
    test('returns true when lastUpdate is null', () => {
      assert.strictEqual(checkStaleness(null, 10), true);
    });

    test('returns true when lastUpdate is undefined', () => {
      assert.strictEqual(checkStaleness(undefined, 10), true);
    });

    test('returns true when lastUpdate is empty string', () => {
      assert.strictEqual(checkStaleness('', 10), true);
    });

    test('returns true when lastUpdate is invalid date', () => {
      assert.strictEqual(checkStaleness('invalid', 10), true);
    });

    test('returns false when data is fresh', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      assert.strictEqual(checkStaleness(fiveMinutesAgo, 10), false);
    });

    test('returns true when data is stale', () => {
      const fifteenMinutesAgo = new Date(
        Date.now() - 15 * 60 * 1000
      ).toISOString();
      assert.strictEqual(checkStaleness(fifteenMinutesAgo, 10), true);
    });

    test('uses default threshold of 10 minutes', () => {
      const twelveMinutesAgo = new Date(
        Date.now() - 12 * 60 * 1000
      ).toISOString();
      assert.strictEqual(checkStaleness(twelveMinutesAgo), true);
    });

    test('respects custom threshold', () => {
      const eightMinutesAgo = new Date(
        Date.now() - 8 * 60 * 1000
      ).toISOString();
      assert.strictEqual(checkStaleness(eightMinutesAgo, 5), true);
      assert.strictEqual(checkStaleness(eightMinutesAgo, 10), false);
    });

    test('handles timestamp as number (milliseconds)', () => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      assert.strictEqual(checkStaleness(fiveMinutesAgo, 10), false);
    });

    test('handles timestamp as Date object', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      assert.strictEqual(checkStaleness(fiveMinutesAgo, 10), false);
    });

    test('returns false at exact threshold boundary', () => {
      const exactlyTenMinutesAgo = new Date(
        Date.now() - 10 * 60 * 1000 + 1
      ).toISOString();
      assert.strictEqual(checkStaleness(exactlyTenMinutesAgo, 10), false);
    });
  });

  describe('shouldAutoRefresh', () => {
    test('returns false when state is null', () => {
      assert.strictEqual(shouldAutoRefresh(null, 10), false);
    });

    test('returns false when state is undefined', () => {
      assert.strictEqual(shouldAutoRefresh(undefined, 10), false);
    });

    test('returns false when tasks are active', () => {
      const state = {
        lastUpdated: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        hasActiveTasks: true,
      };
      assert.strictEqual(shouldAutoRefresh(state, 10), false);
    });

    test('returns true when idle and stale', () => {
      const state = {
        lastUpdated: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        hasActiveTasks: false,
      };
      assert.strictEqual(shouldAutoRefresh(state, 10), true);
    });

    test('returns false when idle but fresh', () => {
      const state = {
        lastUpdated: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        hasActiveTasks: false,
      };
      assert.strictEqual(shouldAutoRefresh(state, 10), false);
    });

    test('uses default threshold when not specified', () => {
      const state = {
        lastUpdated: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        hasActiveTasks: false,
      };
      assert.strictEqual(shouldAutoRefresh(state), true);
    });
  });

  describe('getRefreshRecommendation', () => {
    test('returns default result when state is null', () => {
      const result = getRefreshRecommendation(null, 10);
      assert.strictEqual(result.needsRefresh, false);
      assert.strictEqual(result.message, 'Data is current');
    });

    test('returns default result when state is undefined', () => {
      const result = getRefreshRecommendation(undefined, 10);
      assert.strictEqual(result.needsRefresh, false);
      assert.strictEqual(result.message, 'Data is current');
    });

    test('recommends refresh when stale and idle', () => {
      const state = {
        lastUpdated: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        hasActiveTasks: false,
      };
      const result = getRefreshRecommendation(state, 10);
      assert.strictEqual(result.needsRefresh, true);
      assert.ok(result.message.includes('stale'));
      assert.ok(result.message.includes('--auto-refresh'));
      assert.strictEqual(result.minutesSinceUpdate, 15);
    });

    test('defers refresh when tasks are active', () => {
      const state = {
        lastUpdated: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        hasActiveTasks: true,
      };
      const result = getRefreshRecommendation(state, 10);
      assert.strictEqual(result.needsRefresh, false);
      assert.ok(result.message.includes('deferred'));
    });

    test('reports current when fresh', () => {
      const state = {
        lastUpdated: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        hasActiveTasks: false,
      };
      const result = getRefreshRecommendation(state, 10);
      assert.strictEqual(result.needsRefresh, false);
      assert.ok(result.message.includes('current'));
      assert.strictEqual(result.minutesSinceUpdate, 5);
    });

    test('handles invalid date', () => {
      const state = {
        lastUpdated: 'invalid',
        hasActiveTasks: false,
      };
      const result = getRefreshRecommendation(state, 10);
      assert.strictEqual(result.needsRefresh, true);
      assert.ok(result.message.includes('Unable to determine'));
    });

    test('includes threshold in result', () => {
      const state = {
        lastUpdated: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        hasActiveTasks: false,
      };
      const result = getRefreshRecommendation(state, 15);
      assert.strictEqual(result.threshold, 15);
    });
  });

  describe('getStalenessLevel', () => {
    test("returns 'fresh' when below 50% of threshold", () => {
      assert.strictEqual(getStalenessLevel(4, 10), 'fresh');
    });

    test("returns 'aging' when between 50% and 100% of threshold", () => {
      assert.strictEqual(getStalenessLevel(7, 10), 'aging');
    });

    test("returns 'stale' when above threshold", () => {
      assert.strictEqual(getStalenessLevel(12, 10), 'stale');
    });

    test('handles edge case at 50%', () => {
      assert.strictEqual(getStalenessLevel(5, 10), 'aging');
    });

    test('handles edge case at threshold', () => {
      assert.strictEqual(getStalenessLevel(10, 10), 'stale');
    });

    test("returns 'fresh' at 0 minutes", () => {
      assert.strictEqual(getStalenessLevel(0, 10), 'fresh');
    });
  });

  describe('integration', () => {
    test('end-to-end: detects stale idle state correctly', () => {
      const state = {
        lastUpdated: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        hasActiveTasks: false,
      };

      const isStale = checkStaleness(state.lastUpdated, 10);
      const shouldRefresh = shouldAutoRefresh(state, 10);
      const recommendation = getRefreshRecommendation(state, 10);
      const level = getStalenessLevel(recommendation.minutesSinceUpdate, 10);

      assert.strictEqual(isStale, true);
      assert.strictEqual(shouldRefresh, true);
      assert.strictEqual(recommendation.needsRefresh, true);
      assert.strictEqual(level, 'stale');
    });

    test('end-to-end: respects active task priority', () => {
      const state = {
        lastUpdated: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        hasActiveTasks: true,
      };

      const isStale = checkStaleness(state.lastUpdated, 10);
      const shouldRefresh = shouldAutoRefresh(state, 10);
      const recommendation = getRefreshRecommendation(state, 10);

      assert.strictEqual(isStale, true);
      assert.strictEqual(shouldRefresh, false);
      assert.strictEqual(recommendation.needsRefresh, false);
    });
  });
});
