/**
 * Parse PTES-related flags from a skill argument string (/pd:audit ...).
 * Priority: --redteam > --recon-full > --recon > --recon-light; --poc is independent.
 */

"use strict";

/**
 * @typedef {Object} PtesFlags
 * @property {string} tier - none | free | standard | deep | redteam
 * @property {boolean} recon
 * @property {boolean} poc
 * @property {boolean} redteam
 * @property {number} tokenBudget
 */

/**
 * @param {string} args
 * @returns {PtesFlags}
 */
function parsePtesFlags(args) {
  const s = typeof args === "string" ? args : "";
  /** Tokenize on whitespace — no dynamic RegExp (ReDoS-safe). Exact flag tokens only. */
  const tokens = s.trim() === "" ? [] : s.trim().split(/\s+/);
  const has = (flag) => tokens.includes(flag);

  let tier = "none";
  let recon = false;
  let poc = has("--poc");
  let redteamF = false;
  let tokenBudget = 0;

  if (has("--redteam")) {
    tier = "redteam";
    recon = true;
    redteamF = true;
    poc = true;
    tokenBudget = 8000;
  } else if (has("--recon-full")) {
    tier = "deep";
    recon = true;
    tokenBudget = 6000;
  } else if (has("--recon-light")) {
    tier = "free";
    recon = true;
    tokenBudget = 0;
  } else if (has("--recon")) {
    tier = "standard";
    recon = true;
    tokenBudget = 2000;
  }

  return {
    tier,
    recon,
    poc,
    redteam: redteamF,
    tokenBudget,
  };
}

module.exports = { parsePtesFlags };
