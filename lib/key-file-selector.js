/**
 * Key File Selector
 *
 * Intelligently selects important files from a project file list
 * based on entry points, config files, core modules, and importance scores.
 *
 * @module lib/key-file-selector
 * @version 1.0.0
 */

"use strict";

/**
 * Entry point file patterns (highest priority)
 * These are typically the main entry points of an application.
 */
const ENTRY_POINT_PATTERNS = [
  /\bmain\.(ts|js|mjs|cjs|jsx|tsx)$/i,
  /\bindex\.(ts|js|mjs|cjs|jsx|tsx)$/i,
  /\bapp\.(ts|js|mjs|cjs|jsx|tsx)$/i,
  /\bserver\.(ts|js|mjs|cjs|jsx|tsx)$/i,
  /\bcli\.(ts|js|mjs|cjs|jsx|tsx)$/i,
  /\bbin\/.+\.(js|ts|mjs|cjs)$/i,
  /\bcmd\/.+\.(js|ts|mjs|cjs)$/i,
  /\bcmds\/.+\.(js|ts|mjs|cjs)$/i,
  /\bcommands\/.+\.(js|ts|mjs|cjs)$/i,
];

/**
 * Configuration file patterns (second priority)
 * These define the project setup, dependencies, and tooling.
 */
const CONFIG_PATTERNS = [
  /package\.json$/i,
  /tsconfig\.json$/i,
  /jsconfig\.json$/i,
  /\.eslintrc(\.[cm]?js|\.json)?$/i,
  /\.prettierrc(\.[cm]?js|\.json)?$/i,
  /\.babelrc(\.[cm]?js|\.json)?$/i,
  /vite\.config\.(ts|js|mjs|cjs|json)$/i,
  /webpack\.config\.(ts|js|mjs|cjs|json)$/i,
  /rollup\.config\.(ts|js|mjs|cjs|json)$/i,
  /esbuild\.config\.(ts|js|mjs|cjs|json)$/i,
  /jest\.config\.(ts|js|mjs|cjs|json)$/i,
  /vitest\.config\.(ts|js|mjs|cjs|json)$/i,
  /playwright\.config\.(ts|js|mjs|cjs|json)$/i,
  /cypress\.config\.(ts|js|mjs|cjs|json)$/i,
  /karma\.config\.(ts|js|mjs|cjs|json)$/i,
  /tailwind\.config\.(ts|js|mjs|cjs|json)$/i,
  /postcss\.config\.(ts|js|mjs|cjs|json)$/i,
  /next\.config\.(ts|js|mjs|cjs|json)$/i,
  /nuxt\.config\.(ts|js|mjs|cjs|json)$/i,
  /svelte\.config\.(ts|js|mjs|cjs|json)$/i,
  /vue\.config\.(ts|js|mjs|cjs|json)$/i,
  /angular\.json$/i,
  /nest-cli\.json$/i,
  /dockerfile[^/]*$/i,
  /docker-compose[^/]*\.ya?ml$/i,
  /\.github\/workflows\/[^/]+\.ya?ml$/i,
  /\.gitlab-ci\.ya?ml$/i,
  /Makefile$/i,
  /\.env\.?\w*$/i,
];

/**
 * Core module patterns (third priority)
 * These are typically framework-specific core files.
 */
const CORE_MODULE_PATTERNS = [
  /\.module\.(ts|js)$/i, // NestJS, Angular modules
  /routes\.(ts|js|jsx|tsx)$/i, // Route definitions
  /router\.(ts|js|jsx|tsx)$/i, // Router configuration
  /layout\.(ts|js|jsx|tsx)$/i, // Layout components
  /pages\/(index|_app|_layout)\.(ts|js|jsx|tsx)$/i, // Next.js/Nuxt pages
  /app\/(page|layout|loading|error)\.(ts|js|jsx|tsx)$/i, // Next.js app router
  /lib\/index\.(ts|js|mjs|cjs)$/i, // Library entry points
  /src\/index\.(ts|js|mjs|cjs)$/i, // Source entry points
  /components\/.*\.(ts|js|jsx|tsx)$/i, // Component files
  /services\/.*\.(ts|js|jsx|tsx)$/i, // Service files
  /controllers\/.*\.(ts|js|jsx|tsx)$/i, // Controller files
  /models\/.*\.(ts|js|jsx|tsx)$/i, // Model files
  /middleware\/.*\.(ts|js|jsx|tsx)$/i, // Middleware files
  /hooks\/.*\.(ts|js|jsx|tsx)$/i, // Hook files
  /utils\/.*\.(ts|js|jsx|tsx)$/i, // Utility files
  /helpers\/.*\.(ts|js|jsx|tsx)$/i, // Helper files
  /types\/.*\.(ts|js|jsx|tsx)$/i, // Type definition files
  /constants\/.*\.(ts|js|jsx|tsx)$/i, // Constants files
  /config\.(ts|js|mjs|cjs|json)$/i, // Config files (generic)
  /store\.(ts|js|jsx|tsx)$/i, // State management
  /state\.(ts|js|jsx|tsx)$/i, // State management
];

/**
 * File type importance weights
 * Used when importance scores are not available.
 */
const FILE_TYPE_WEIGHTS = {
  ".ts": 1.2, // TypeScript slightly preferred
  ".tsx": 1.3, // TSX for React components
  ".js": 1.0, // Base weight
  ".jsx": 1.1, // JSX for React components
  ".mjs": 1.0, // ES modules
  ".cjs": 1.0, // CommonJS
  ".json": 0.8, // Config files
  ".md": 0.5, // Documentation
};

/**
 * Calculates a base importance score for a file based on its path.
 *
 * @param {string} filePath - The file path to score
 * @returns {number} - Base importance score (higher = more important)
 */
function calculateBaseScore(filePath) {
  let score = 0;

  // Check entry point patterns (highest weight)
  for (const pattern of ENTRY_POINT_PATTERNS) {
    if (pattern.test(filePath)) {
      score += 100;
      break;
    }
  }

  // Check config patterns (second highest)
  if (score === 0) {
    for (const pattern of CONFIG_PATTERNS) {
      if (pattern.test(filePath)) {
        score += 80;
        break;
      }
    }
  }

  // Check core module patterns (third highest)
  if (score === 0) {
    for (const pattern of CORE_MODULE_PATTERNS) {
      if (pattern.test(filePath)) {
        score += 60;
        break;
      }
    }
  }

  // Apply file type weight
  const ext = filePath.match(/\.[^./]+$/);
  if (ext) {
    const extension = ext[0].toLowerCase();
    score *= FILE_TYPE_WEIGHTS[extension] || 0.7;
  }

  // Bonus for being in src/ or lib/ directories
  if (/\b(src|lib)\//.test(filePath)) {
    score += 5;
  }

  // Bonus for being at root level (closer to project root = more important)
  const depth = (filePath.match(/\//g) || []).length;
  score += Math.max(0, 10 - depth);

  return score;
}

/**
 * Categorizes a file into one of the priority categories.
 *
 * @param {string} filePath - The file path to categorize
 * @returns {string} - Category: 'entry', 'config', 'core', or 'other'
 */
function categorizeFile(filePath) {
  for (const pattern of ENTRY_POINT_PATTERNS) {
    if (pattern.test(filePath)) {
      return "entry";
    }
  }

  for (const pattern of CONFIG_PATTERNS) {
    if (pattern.test(filePath)) {
      return "config";
    }
  }

  for (const pattern of CORE_MODULE_PATTERNS) {
    if (pattern.test(filePath)) {
      return "core";
    }
  }

  return "other";
}

/**
 * Calculates a final importance score for a file.
 * Uses the file's own score if available, otherwise calculates base score.
 *
 * @param {Object} file - File object from the file list
 * @returns {number} - Final importance score
 */
function calculateImportanceScore(file) {
  // If the file already has an importance score, use it
  if (typeof file.importance === "number") {
    return file.importance;
  }

  // If the file has a score property, use it
  if (typeof file.score === "number") {
    return file.score;
  }

  // Otherwise calculate from path
  return calculateBaseScore(file.path || file);
}

/**
 * Selects key files from a project file list based on priority criteria.
 *
 * Selection order:
 * 1. Entry points (main.ts, index.js, etc.) - always included
 * 2. Config files (package.json, tsconfig.json, etc.)
 * 3. Core modules (app.module.ts, routes files, etc.)
 * 4. By importance score (if available from scan)
 *
 * @param {Array} fileList - Array of file objects with path, size, etc.,
 *                          or array of file path strings
 * @param {number} maxFiles - Maximum number of files to return (default: 15)
 * @returns {Array} - Array of selected file paths
 *
 * @example
 * // With file objects
 * const files = [
 *   { path: 'src/main.ts', size: 1024, importance: 95 },
 *   { path: 'package.json', size: 512 },
 *   { path: 'src/utils/helper.ts', size: 256 }
 * ];
 * const keyFiles = selectKeyFiles(files, 10);
 * // Returns: ['src/main.ts', 'package.json', ...]
 *
 * @example
 * // With file path strings
 * const files = ['src/main.ts', 'package.json', 'README.md'];
 * const keyFiles = selectKeyFiles(files);
 * // Returns: ['src/main.ts', 'package.json']
 */
function selectKeyFiles(fileList, maxFiles = 15) {
  if (!Array.isArray(fileList) || fileList.length === 0) {
    return [];
  }

  // Normalize file list to objects with scores
  const normalizedFiles = fileList.map((file) => {
    if (typeof file === "string") {
      return {
        path: file,
        score: calculateBaseScore(file),
        category: categorizeFile(file),
      };
    }

    const path = file.path || file.filePath || "";
    return {
      path,
      size: file.size || 0,
      score: calculateImportanceScore(file),
      category: categorizeFile(path),
    };
  });

  // Separate files by category
  const categories = {
    entry: [],
    config: [],
    core: [],
    other: [],
  };

  for (const file of normalizedFiles) {
    if (categories[file.category]) {
      categories[file.category].push(file);
    } else {
      categories.other.push(file);
    }
  }

  // Sort each category by score (descending)
  for (const category of Object.values(categories)) {
    category.sort((a, b) => b.score - a.score);
  }

  // Select files in priority order
  const selected = [];
  const selectedPaths = new Set();

  // 1. Always include entry points first
  for (const file of categories.entry) {
    if (selected.length < maxFiles && !selectedPaths.has(file.path)) {
      selected.push(file.path);
      selectedPaths.add(file.path);
    }
  }

  // 2. Include config files
  for (const file of categories.config) {
    if (selected.length < maxFiles && !selectedPaths.has(file.path)) {
      selected.push(file.path);
      selectedPaths.add(file.path);
    }
  }

  // 3. Include core modules
  for (const file of categories.core) {
    if (selected.length < maxFiles && !selectedPaths.has(file.path)) {
      selected.push(file.path);
      selectedPaths.add(file.path);
    }
  }

  // 4. Fill remaining slots with highest-scoring 'other' files
  for (const file of categories.other) {
    if (selected.length < maxFiles && !selectedPaths.has(file.path)) {
      selected.push(file.path);
      selectedPaths.add(file.path);
    }
  }

  return selected;
}

/**
 * Gets detailed information about why files were selected.
 *
 * @param {Array} fileList - Array of file objects or strings
 * @param {number} maxFiles - Maximum number of files to analyze
 * @returns {Array} - Array of objects with path, category, and score
 *
 * @example
 * const details = getSelectionDetails(files, 10);
 * // Returns:
 * // [
 * //   { path: 'src/main.ts', category: 'entry', score: 115 },
 * //   { path: 'package.json', category: 'config', score: 88 },
 * //   ...
 * // ]
 */
function getSelectionDetails(fileList, maxFiles = 15) {
  if (!Array.isArray(fileList) || fileList.length === 0) {
    return [];
  }

  const normalizedFiles = fileList.map((file) => {
    if (typeof file === "string") {
      return {
        path: file,
        score: calculateBaseScore(file),
        category: categorizeFile(file),
      };
    }

    const path = file.path || file.filePath || "";
    return {
      path,
      size: file.size || 0,
      score: calculateImportanceScore(file),
      category: categorizeFile(path),
    };
  });

  // Sort by score descending
  normalizedFiles.sort((a, b) => b.score - a.score);

  // Return top maxFiles with details
  return normalizedFiles.slice(0, maxFiles).map((file) => ({
    path: file.path,
    category: file.category,
    score: Math.round(file.score * 100) / 100, // Round to 2 decimal places
  }));
}

module.exports = {
  selectKeyFiles,
  getSelectionDetails,
  categorizeFile,
  calculateBaseScore,
  calculateImportanceScore,
  // Export constants for testing and customization
  ENTRY_POINT_PATTERNS,
  CONFIG_PATTERNS,
  CORE_MODULE_PATTERNS,
  FILE_TYPE_WEIGHTS,
};
