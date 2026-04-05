/**
 * Asset Discoverer - Discovers hidden assets including admin panels, debug endpoints,
 * backup files, configuration exposures, and source maps
 * Phase 114: Intelligence Gathering Extended (RECON-04)
 */

"use strict";

const fs = require("fs").promises;
const path = require("path");
const { ReconCache } = require("./recon-cache");

/**
 * Discovers hidden assets through wordlist-based scanning and file system analysis
 */
class AssetDiscoverer {
  /**
   * @param {Object} options - Configuration options
   * @param {ReconCache} options.cache - Cache instance for result optimization
   */
  constructor(options = {}) {
    this.cache = options.cache || new ReconCache();
    this.wordlistDir = options.wordlistDir || path.join(process.cwd(), "references", "wordlists");
    this.findings = [];
  }

  /**
   * Main entry point for hidden asset discovery
   * @param {string} projectPath - Path to project directory
   * @param {Object} options - Discovery options
   * @param {string} options.tier - Reconnaissance tier (free/standard/deep/redteam)
   * @returns {Promise<Array>} Array of findings with path, type, severity
   */
  async discoverHiddenAssets(projectPath, options = {}) {
    const { tier = "standard" } = options;
    this.findings = [];

    // Load wordlists based on tier
    const commonPaths = await this.loadWordlist("common-paths", tier);
    const backupExtensions = await this.loadWordlist("backup-extensions", tier);

    // Scan file system for backup/config files
    const fileSystemFindings = await this.scanFileSystem(projectPath, {
      commonPaths,
      backupExtensions,
    });

    // Classify and score each finding
    for (const finding of fileSystemFindings) {
      const assetType = this.classifyAssetType(finding.path);
      const risk = this.calculateRisk({
        ...finding,
        type: assetType,
      });

      this.findings.push({
        path: finding.path,
        type: assetType,
        severity: risk.severity,
        requiresAuth: finding.requiresAuth ?? false,
        evidence: finding.evidence || [],
      });
    }

    // Sort by severity (Critical > High > Medium > Low)
    return this.sortBySeverity(this.findings);
  }

  /**
   * Load wordlist file from references/wordlists/
   * @param {string} name - Wordlist name (e.g., 'common-paths')
   * @param {string} tier - Reconnaissance tier
   * @returns {Promise<Array>} Array of wordlist entries
   */
  async loadWordlist(name, tier = "standard") {
    const wordlistPath = path.join(this.wordlistDir, `${name}.txt`);

    try {
      const content = await fs.readFile(wordlistPath, "utf-8");
      const lines = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"));

      // Filter based on tier
      if (tier === "free") {
        return lines.slice(0, 10); // Limited paths for free tier
      } else if (tier === "standard") {
        return lines.slice(0, 30); // Moderate coverage
      } else if (tier === "deep" || tier === "redteam") {
        return lines; // Full coverage
      }

      return lines;
    } catch (error) {
      console.warn(`[asset-discoverer] Failed to load wordlist: ${wordlistPath}`, error.message);
      return [];
    }
  }

  /**
   * Scan file system for backup files and config exposures
   * @param {string} projectPath - Path to project directory
   * @param {Object} patterns - Pattern collections
   * @param {Array} patterns.commonPaths - Common path patterns
   * @param {Array} patterns.backupExtensions - Backup file extensions
   * @returns {Promise<Array>} Array of file system findings
   */
  async scanFileSystem(projectPath, patterns) {
    const findings = [];
    const { commonPaths, backupExtensions } = patterns;

    try {
      // Check if project path exists
      const stats = await fs.stat(projectPath).catch(() => null);
      if (!stats || !stats.isDirectory()) {
        return findings;
      }

      // Scan for files matching backup extensions
      const files = await this.getAllFiles(projectPath);

      for (const file of files) {
        const basename = path.basename(file);
        const relativePath = path.relative(projectPath, file);

        // Check for backup files
        for (const ext of backupExtensions) {
          if (basename.endsWith(ext)) {
            findings.push({
              path: relativePath,
              absolutePath: file,
              evidence: [`Backup file extension: ${ext}`],
            });
            break;
          }
        }

        // Check for config files
        if (basename === ".env" || basename.startsWith(".env.") || basename === "config.json") {
          findings.push({
            path: relativePath,
            absolutePath: file,
            evidence: [`Configuration file: ${basename}`],
          });
        }

        // Check for source maps
        if (basename.endsWith(".js.map") || basename.endsWith(".css.map")) {
          findings.push({
            path: relativePath,
            absolutePath: file,
            evidence: [`Source map file: ${basename}`],
          });
        }

        // Check for version control exposure
        if (relativePath.includes(".git/") && basename !== ".git") {
          findings.push({
            path: relativePath,
            absolutePath: file,
            evidence: ["Version control file exposure"],
          });
        }
      }

      // Check for paths that might exist (virtual paths for HTTP scanning)
      for (const commonPath of commonPaths) {
        // These would typically be checked via HTTP in a real scenario
        // For static analysis, we note them as potential paths
        findings.push({
          path: `/${commonPath}`,
          type: "potential-path",
          evidence: [`Common path from wordlist: ${commonPath}`],
        });
      }
    } catch (error) {
      console.warn("[asset-discoverer] File system scan error:", error.message);
    }

    return findings;
  }

  /**
   * Get all files recursively from directory
   * @param {string} dirPath - Directory path
   * @returns {Promise<Array>} Array of file paths
   */
  async getAllFiles(dirPath) {
    const files = [];

    const entries = await fs.readdir(dirPath, { withFileTypes: true }).catch(() => []);

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      // Skip node_modules and .git directories (but include .git files for exposure detection)
      if (entry.name === "node_modules") {
        continue;
      }

      if (entry.isDirectory()) {
        files.push(...(await this.getAllFiles(fullPath)));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Classify asset type based on path patterns
   * @param {string} assetPath - Asset path to classify
   * @returns {string} Asset type: 'admin-panel', 'debug-endpoint', 'config-exposure',
   *                   'backup-file', 'source-map', or 'unknown'
   */
  classifyAssetType(assetPath) {
    const lowerPath = assetPath.toLowerCase();

    // Admin panel patterns
    const adminPatterns = [
      /\/admin/,
      /\/dashboard/,
      /\/panel/,
      /\/manage/,
      /\/backend/,
      /\/control/,
      /\/wp-admin/,
      /\/phpmyadmin/,
    ];
    for (const pattern of adminPatterns) {
      if (pattern.test(lowerPath)) return "admin-panel";
    }

    // Debug endpoint patterns
    const debugPatterns = [
      /\/debug/,
      /\/__debug__/,
      /\/test/,
      /\/testing/,
      /\/dev/,
      /\/development/,
      /\/staging/,
      /\/api-docs/,
      /\/swagger/,
      /\/openapi/,
    ];
    for (const pattern of debugPatterns) {
      if (pattern.test(lowerPath)) return "debug-endpoint";
    }

    // Config exposure patterns
    const configPatterns = [
      /\.env/,
      /config\.json/,
      /database\.yml/,
      /\.git\/config/,
      /\.git\/HEAD/,
    ];
    for (const pattern of configPatterns) {
      if (pattern.test(lowerPath)) return "config-exposure";
    }

    // Backup file patterns
    const backupPatterns = [
      /\.bak$/,
      /\.backup$/,
      /\.old$/,
      /\.orig$/,
      /\.zip$/,
      /\.tar\.gz$/,
      /\.tgz$/,
      /\.sql$/,
      /\.sql\.gz$/,
      /\.dump$/,
      /\.tar$/,
      /\.gz$/,
      /\.7z$/,
      /\.rar$/,
    ];
    for (const pattern of backupPatterns) {
      if (pattern.test(lowerPath)) return "backup-file";
    }

    // Source map patterns
    const sourceMapPatterns = [/\.js\.map$/, /\.css\.map$/];
    for (const pattern of sourceMapPatterns) {
      if (pattern.test(lowerPath)) return "source-map";
    }

    return "unknown";
  }

  /**
   * Calculate risk severity based on asset type and context
   * Per D-13 to D-16:
   * - CRITICAL: admin-panel without auth, debug in production, backup exposed, hardcoded credentials
   * - HIGH: config-exposure, source-map, weak JWT
   * - MEDIUM: undocumented API, test pages
   * - LOW: dev routes, internal docs
   *
   * @param {Object} asset - Asset object with type and context
   * @returns {Object} Risk assessment with severity and reasoning
   */
  calculateRisk(asset) {
    const { type, requiresAuth = false, isProduction = true } = asset;

    let severity = "LOW";
    const reasons = [];

    switch (type) {
      case "admin-panel":
        if (!requiresAuth) {
          severity = "CRITICAL";
          reasons.push("Admin panel without authentication");
        } else {
          severity = "MEDIUM";
          reasons.push("Admin panel requires authentication");
        }
        break;

      case "debug-endpoint":
        if (isProduction) {
          severity = "CRITICAL";
          reasons.push("Debug endpoint exposed in production");
        } else {
          severity = "HIGH";
          reasons.push("Debug endpoint exposed");
        }
        break;

      case "backup-file":
        severity = "HIGH";
        reasons.push("Backup file may contain sensitive data");
        break;

      case "config-exposure":
        severity = "HIGH";
        reasons.push("Configuration file exposed");
        break;

      case "source-map":
        severity = "MEDIUM";
        reasons.push("Source map exposes original source code");
        break;

      case "unknown":
      default:
        severity = "LOW";
        reasons.push("Unknown asset type");
        break;
    }

    return {
      severity,
      reasons,
      type,
    };
  }

  /**
   * Sort findings by severity (CRITICAL > HIGH > MEDIUM > LOW)
   * @param {Array} findings - Array of finding objects
   * @returns {Array} Sorted findings
   */
  sortBySeverity(findings) {
    const severityWeight = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    return findings.sort((a, b) => {
      return (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0);
    });
  }

  /**
   * Get summary of findings
   * @returns {Object} Summary statistics
   */
  getSummary() {
    const counts = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };

    for (const finding of this.findings) {
      counts[finding.severity] = (counts[finding.severity] || 0) + 1;
    }

    return {
      total: this.findings.length,
      bySeverity: counts,
      byType: this.findings.reduce((acc, f) => {
        acc[f.type] = (acc[f.type] || 0) + 1;
        return acc;
      }, {}),
    };
  }

  /**
   * Get all findings
   * @returns {Array} Array of findings
   */
  getFindings() {
    return this.findings;
  }
}

/**
 * Convenience function for standalone asset discovery
 * @param {string} projectPath - Path to project
 * @param {Object} options - Discovery options
 * @returns {Promise<Array>} Findings array
 */
async function discoverHiddenAssets(projectPath, options = {}) {
  const discoverer = new AssetDiscoverer(options);
  return discoverer.discoverHiddenAssets(projectPath, options);
}

module.exports = {
  AssetDiscoverer,
  discoverHiddenAssets,
};
