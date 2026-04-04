/**
 * Refresh Detector - Staleness detection for status dashboard
 * Pure functions for determining if data refresh is needed
 *
 * @module refresh-detector
 */

/**
 * Check if data is stale based on last update time and threshold
 *
 * @param {string|number|Date} lastUpdate - Timestamp of last update
 * @param {number} threshold - Threshold in minutes (default: 10)
 * @returns {boolean} True if data is stale
 */
function checkStaleness(lastUpdate, threshold = 10) {
  if (!lastUpdate) {
    return true;
  }

  const lastUpdateTime = new Date(lastUpdate).getTime();
  if (isNaN(lastUpdateTime)) {
    return true;
  }

  const thresholdMs = threshold * 60 * 1000;
  const now = Date.now();

  return (now - lastUpdateTime) > thresholdMs;
}

/**
 * Determine if auto-refresh should be triggered based on state
 *
 * @param {Object} state - Current state object
 * @param {string|number|Date} state.lastUpdated - Last update timestamp
 * @param {boolean} state.hasActiveTasks - Whether tasks are in progress
 * @param {number} [threshold=10] - Threshold in minutes
 * @returns {boolean} True if auto-refresh should trigger
 */
function shouldAutoRefresh(state, threshold = 10) {
  if (!state) {
    return false;
  }

  // Don't auto-refresh if tasks are actively running
  if (state.hasActiveTasks) {
    return false;
  }

  return checkStaleness(state.lastUpdated, threshold);
}

/**
 * Get refresh recommendation message based on state
 *
 * @param {Object} state - Current state object
 * @param {string|number|Date} state.lastUpdated - Last update timestamp
 * @param {boolean} state.hasActiveTasks - Whether tasks are in progress
 * @param {number} [threshold=10] - Threshold in minutes
 * @returns {Object} Recommendation with message and metadata
 */
function getRefreshRecommendation(state, threshold = 10) {
  const defaultResult = {
    needsRefresh: false,
    message: "Data is current",
    minutesSinceUpdate: 0,
    threshold,
  };

  if (!state) {
    return defaultResult;
  }

  const lastUpdateTime = new Date(state.lastUpdated).getTime();
  if (isNaN(lastUpdateTime)) {
    return {
      ...defaultResult,
      needsRefresh: true,
      message: "Unable to determine last update time",
    };
  }

  const now = Date.now();
  const minutesSinceUpdate = Math.floor((now - lastUpdateTime) / (60 * 1000));

  if (state.hasActiveTasks) {
    return {
      needsRefresh: false,
      message: "Tasks in progress - refresh deferred",
      minutesSinceUpdate,
      threshold,
    };
  }

  const isStale = minutesSinceUpdate > threshold;

  if (isStale) {
    return {
      needsRefresh: true,
      message: `Data is stale (${minutesSinceUpdate} minutes old). Run /pd:status --auto-refresh`,
      minutesSinceUpdate,
      threshold,
    };
  }

  return {
    needsRefresh: false,
    message: `Data is current (${minutesSinceUpdate} minutes old)`,
    minutesSinceUpdate,
    threshold,
  };
}

/**
 * Calculate staleness level for display purposes
 *
 * @param {number} minutesSinceUpdate - Minutes since last update
 * @param {number} threshold - Threshold in minutes
 * @returns {string} Staleness level: 'fresh', 'aging', or 'stale'
 */
function getStalenessLevel(minutesSinceUpdate, threshold = 10) {
  if (minutesSinceUpdate < threshold * 0.5) {
    return "fresh";
  }
  if (minutesSinceUpdate < threshold) {
    return "aging";
  }
  return "stale";
}

export {
  checkStaleness,
  shouldAutoRefresh,
  getRefreshRecommendation,
  getStalenessLevel,
};
