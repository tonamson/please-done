/**
 * Health Checker Module — Pure functions for diagnosing .planning/ directory issues.
 *
 * Pure functions: does NOT read files, zero fs imports, NO side effects.
 * Content/directory data passed via parameters, returns issue arrays.
 *
 * - checkMissingFiles: detect missing SUMMARY.md/VERIFICATION.md in completed phases
 * - checkStateMdStructure: validate STATE.md YAML frontmatter required fields
 * - checkOrphanedDirs: find phase directories not listed in ROADMAP
 * - runAllChecks: orchestrator combining all checks with severity sorting
 * - formatHealthReport: render issues as boxed table grouped by category
 */

'use strict';

// ─── Severity Level Enum ───────────────────────────────────

const SEVERITY_LEVEL = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  INFO: 'info',
};

// Severity sort order (lower = more severe)
const SEVERITY_ORDER = {
  [SEVERITY_LEVEL.CRITICAL]: 0,
  [SEVERITY_LEVEL.WARNING]: 1,
  [SEVERITY_LEVEL.INFO]: 2,
};

// ─── Helper Functions ──────────────────────────────────────

/**
 * Pad string to the right to a given length.
 * @param {string} str
 * @param {number} length
 * @returns {string}
 */
function padRight(str, length) {
  const s = String(str || '');
  if (s.length >= length) return s;
  return s + ' '.repeat(length - s.length);
}

/**
 * Extract value from YAML frontmatter string by key.
 * @param {string} fm - The frontmatter block (between --- markers)
 * @param {string} key - The key to extract
 * @returns {string}
 */
function extractFmValue(fm, key) {
  const re = new RegExp(`^${key}:\\s*(.+)$`, 'm');
  const m = fm.match(re);
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : '';
}

/**
 * Parse the progress section from frontmatter.
 * @param {string} fm - The frontmatter block
 * @returns {object}
 */
function parseProgressSection(fm) {
  const progress = {};
  const progressSection = fm.match(/progress:\s*\n((?:\s+\w+:.+\n?)+)/m);
  if (progressSection) {
    const lines = progressSection[1].split('\n');
    for (const line of lines) {
      const lm = line.match(/^\s+(\w+):\s*(.+)/);
      if (lm) {
        progress[lm[1]] = lm[2].trim();
      }
    }
  }
  return progress;
}

// ─── Check Functions ───────────────────────────────────────

/**
 * Check completed phases for missing SUMMARY.md and VERIFICATION.md.
 * @param {Array<{name: string, files: string[]}>} phaseDirs - Phase directory listings
 * @param {number[]} completedPhases - Phase numbers marked as complete
 * @returns {Array<{severity: string, category: string, location: string, issue: string, fix: string}>}
 */
function checkMissingFiles(phaseDirs, completedPhases) {
  if (!Array.isArray(phaseDirs) || !Array.isArray(completedPhases)) return [];
  if (phaseDirs.length === 0 || completedPhases.length === 0) return [];

  const issues = [];

  for (const phaseDir of phaseDirs) {
    // Extract phase number from directory name
    const numMatch = phaseDir.name.match(/^(\d+)-/);
    if (!numMatch) continue;
    const phaseNum = parseInt(numMatch[1]);

    // Only check completed phases
    if (!completedPhases.includes(phaseNum)) continue;

    const files = phaseDir.files || [];

    // Check for SUMMARY.md (any file ending with SUMMARY.md)
    const hasSummary = files.some(f => f.endsWith('SUMMARY.md'));
    if (!hasSummary) {
      issues.push({
        severity: SEVERITY_LEVEL.WARNING,
        category: 'missing_files',
        location: `Phase ${phaseNum} (${phaseDir.name})`,
        issue: `Missing SUMMARY.md in completed phase ${phaseNum}`,
        fix: `Re-run Phase ${phaseNum} execution`,
      });
    }

    // Check for VERIFICATION.md
    const hasVerification = files.some(f => f === 'VERIFICATION.md');
    if (!hasVerification) {
      issues.push({
        severity: SEVERITY_LEVEL.WARNING,
        category: 'missing_files',
        location: `Phase ${phaseNum} (${phaseDir.name})`,
        issue: `Missing VERIFICATION.md in completed phase ${phaseNum}`,
        fix: `Run /gsd-validate-phase ${phaseNum}`,
      });
    }
  }

  return issues;
}

/**
 * Validate STATE.md YAML frontmatter for required fields and types.
 * @param {string} content - STATE.md file content
 * @returns {Array<{severity: string, category: string, location: string, issue: string, fix: string}>}
 */
function checkStateMdStructure(content) {
  if (!content || typeof content !== 'string' || content.trim() === '') {
    return [{
      severity: SEVERITY_LEVEL.CRITICAL,
      category: 'state_schema',
      location: '.planning/STATE.md',
      issue: 'STATE.md is empty or missing',
      fix: 'Run /pd:new-milestone to recreate STATE.md',
    }];
  }

  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    return [{
      severity: SEVERITY_LEVEL.CRITICAL,
      category: 'state_schema',
      location: '.planning/STATE.md',
      issue: 'STATE.md missing YAML frontmatter',
      fix: 'Edit .planning/STATE.md to add frontmatter block',
    }];
  }

  const fm = fmMatch[1];
  const issues = [];

  // Required top-level fields
  const requiredFields = [
    { key: 'gsd_state_version', label: 'gsd_state_version' },
    { key: 'milestone', label: 'milestone' },
    { key: 'status', label: 'status' },
  ];

  for (const field of requiredFields) {
    const value = extractFmValue(fm, field.key);
    if (!value) {
      issues.push({
        severity: SEVERITY_LEVEL.CRITICAL,
        category: 'state_schema',
        location: '.planning/STATE.md',
        issue: `Missing required field: ${field.label}`,
        fix: `Edit .planning/STATE.md to add missing ${field.label} field`,
      });
    }
  }

  // Check progress section exists
  const progressSection = fm.match(/progress:\s*\n((?:\s+\w+:.+\n?)+)/m);
  if (!progressSection) {
    issues.push({
      severity: SEVERITY_LEVEL.CRITICAL,
      category: 'state_schema',
      location: '.planning/STATE.md',
      issue: 'Missing required section: progress',
      fix: 'Edit .planning/STATE.md to add missing progress section',
    });
  } else {
    // Check progress sub-fields
    const progress = parseProgressSection(fm);
    const requiredProgressFields = ['total_phases', 'completed_phases', 'total_plans', 'completed_plans', 'percent'];

    for (const pf of requiredProgressFields) {
      if (!(pf in progress)) {
        issues.push({
          severity: SEVERITY_LEVEL.CRITICAL,
          category: 'state_schema',
          location: '.planning/STATE.md',
          issue: `Missing required field: progress.${pf}`,
          fix: `Edit .planning/STATE.md to add missing progress.${pf} field`,
        });
      }
    }

    // Type validation: percent must be numeric
    if ('percent' in progress) {
      const percentVal = String(progress.percent).replace(/^["']|["']$/g, '');
      if (isNaN(Number(percentVal))) {
        issues.push({
          severity: SEVERITY_LEVEL.WARNING,
          category: 'state_schema',
          location: '.planning/STATE.md',
          issue: `Invalid type for progress.percent: expected number, got "${percentVal}"`,
          fix: 'Edit .planning/STATE.md to set progress.percent to a numeric value',
        });
      }
    }
  }

  return issues;
}

/**
 * Check for phase directories not listed in ROADMAP.
 * @param {string[]} phaseDirs - Array of directory name strings
 * @param {number[]} roadmapPhases - Array of phase numbers from roadmap
 * @returns {Array<{severity: string, category: string, location: string, issue: string, fix: string}>}
 */
function checkOrphanedDirs(phaseDirs, roadmapPhases) {
  if (!Array.isArray(phaseDirs) || !Array.isArray(roadmapPhases)) return [];
  if (phaseDirs.length === 0 || roadmapPhases.length === 0) return [];

  const issues = [];

  for (const dirName of phaseDirs) {
    const numMatch = dirName.match(/^(\d+)-/);
    if (!numMatch) {
      // No numeric prefix — flag as orphaned
      issues.push({
        severity: SEVERITY_LEVEL.INFO,
        category: 'orphaned_dirs',
        location: `.planning/phases/${dirName}/`,
        issue: `Directory "${dirName}" has no phase number prefix`,
        fix: `Delete .planning/phases/${dirName}/ or rename with a valid phase number`,
      });
      continue;
    }

    const phaseNum = parseInt(numMatch[1]);
    if (!roadmapPhases.includes(phaseNum)) {
      issues.push({
        severity: SEVERITY_LEVEL.INFO,
        category: 'orphaned_dirs',
        location: `.planning/phases/${dirName}/`,
        issue: `Phase ${phaseNum} directory not found in ROADMAP.md`,
        fix: `Delete .planning/phases/${dirName}/ or add to ROADMAP.md`,
      });
    }
  }

  return issues;
}

/**
 * Run all health checks and combine results sorted by severity.
 * @param {object} params
 * @param {Array<{name: string, files: string[]}>} params.phaseDirs
 * @param {number[]} params.completedPhases
 * @param {number[]} params.roadmapPhases
 * @param {string[]} params.dirNames - Directory name strings for orphan check
 * @param {string} params.stateContent - STATE.md content
 * @returns {Array<{severity: string, category: string, location: string, issue: string, fix: string}>}
 */
function runAllChecks(params) {
  const { phaseDirs, completedPhases, roadmapPhases, dirNames, stateContent } = params;

  const issues = [];

  // Check missing files
  const missingFileIssues = checkMissingFiles(phaseDirs || [], completedPhases || []);
  issues.push(...missingFileIssues);

  // Check STATE.md structure
  const stateIssues = checkStateMdStructure(stateContent || '');
  issues.push(...stateIssues);

  // Check orphaned directories
  const orphanedIssues = checkOrphanedDirs(dirNames || [], roadmapPhases || []);
  issues.push(...orphanedIssues);

  // Sort by severity: critical first, then warning, then info
  issues.sort((a, b) => {
    const orderA = SEVERITY_ORDER[a.severity] !== undefined ? SEVERITY_ORDER[a.severity] : 99;
    const orderB = SEVERITY_ORDER[b.severity] !== undefined ? SEVERITY_ORDER[b.severity] : 99;
    return orderA - orderB;
  });

  return issues;
}

// ─── Report Formatting ─────────────────────────────────────

/**
 * Format health report as boxed table output grouped by category.
 * @param {Array<{severity: string, category: string, location: string, issue: string, fix: string}>} issues
 * @returns {string}
 */
function formatHealthReport(issues) {
  if (!issues || issues.length === 0) {
    return 'All checks passed ✓';
  }

  // Count severities
  const criticalCount = issues.filter(i => i.severity === SEVERITY_LEVEL.CRITICAL).length;
  const warningCount = issues.filter(i => i.severity === SEVERITY_LEVEL.WARNING).length;
  const infoCount = issues.filter(i => i.severity === SEVERITY_LEVEL.INFO).length;

  const W = 70;
  const lines = [];

  // Summary line
  const summary = `Health check: ${issues.length} issues found (${criticalCount} critical, ${warningCount} warning, ${infoCount} info)`;
  lines.push(summary);
  lines.push('');

  // Group by category
  const categoryOrder = ['state_schema', 'missing_files', 'orphaned_dirs'];
  const categoryLabels = {
    state_schema: 'State Schema',
    missing_files: 'Missing Files',
    orphaned_dirs: 'Orphaned Directories',
  };

  for (const cat of categoryOrder) {
    const catIssues = issues.filter(i => i.category === cat);
    if (catIssues.length === 0) continue;

    const label = categoryLabels[cat] || cat;
    lines.push(`╔${'═'.repeat(W)}╗`);
    lines.push(`║ ${padRight(label, W - 1)}║`);
    lines.push(`║ ${padRight('─'.repeat(W - 2), W - 1)}║`);

    for (const issue of catIssues) {
      const severityTag = `[${issue.severity.toUpperCase()}]`;
      lines.push(`║ ${padRight(`  ${severityTag} ${issue.issue}`, W - 1)}║`);
      lines.push(`║ ${padRight(`    Location: ${issue.location}`, W - 1)}║`);
      lines.push(`║ ${padRight(`    Fix: ${issue.fix}`, W - 1)}║`);
      lines.push(`║ ${padRight('', W - 1)}║`);
    }

    lines.push(`╚${'═'.repeat(W)}╝`);
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

// ─── Exports ────────────────────────────────────────────────

module.exports = {
  SEVERITY_LEVEL,
  checkMissingFiles,
  checkStateMdStructure,
  checkOrphanedDirs,
  runAllChecks,
  formatHealthReport,
};
