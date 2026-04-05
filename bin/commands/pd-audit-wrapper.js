#!/usr/bin/env node
/**
 * pd-audit-wrapper - CLI for running ReconAggregator from audit workflow
 * Phase 123: INT-01 Integration
 */

'use strict';

const path = require('path');
const { ReconAggregator } = require('../lib/recon-aggregator');
const { ReconCache } = require('../lib/recon-cache');
const { parsePtesFlags } = require('../lib/flag-parser');
const { getPtesTier } = require('../lib/resource-config');

/**
 * Run reconnaissance and return results
 * @param {string} projectPath - Path to project root
 * @param {string} args - Skill arguments string (e.g., "--recon --poc")
 * @returns {Promise<Object>} Reconnaissance results
 */
async function runRecon(projectPath, args) {
  const parsed = parsePtesFlags(args);

  if (!parsed.recon) {
    return null; // No recon requested
  }

  // Initialize cache
  const cache = new ReconCache();

  // Check cache first
  const cached = cache.get();
  if (cached) {
    console.log('[Token Save] Reusing cached recon (0 AI tokens)');
    return cached;
  }

  // Get tier configuration
  const tierConfig = getPtesTier(parsed.tier);
  console.log(`[Token Budget] ${parsed.tier} tier: ${tierConfig.tokenBudget} budget`);

  // Run reconnaissance
  const aggregator = new ReconAggregator({ cache });
  const results = await aggregator.runFullRecon(projectPath, { tier: parsed.tier });

  // Cache results
  cache.set(results);

  return results;
}

module.exports = { runRecon };
