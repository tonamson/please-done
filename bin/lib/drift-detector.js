/**
 * Drift Detector Module — Pure functions for detecting STATE.md schema drift.
 *
 * Pure functions: does NOT read files, zero fs imports, NO side effects.
 * Content passed via parameters, returns parsed data or issue arrays.
 *
 * - SUPPORTED_VERSIONS:    authoritative list of supported pd_state_version strings
 * - EXPECTED_STATE_SCHEMA: authoritative v1.0 schema definition (required fields)
 * - parseStateMdFields:    extract version, field names from STATE.md content
 * - detectSchemaDrift:     compare STATE.md against expected schema, return issues
 * - checkVersionSupport:   check whether a pd_state_version is supported
 * - formatDriftReport:     render issues as boxed table string (health-checker style)
 */

'use strict';

const yaml = require('js-yaml');

// ─── Constants ─────────────────────────────────────────────

const SEVERITY_CRITICAL = 'critical';
const SEVERITY_WARNING = 'warning';
const CATEGORY = 'schema_drift';
const LOCATION = '.planning/STATE.md';

// ─── Public: SUPPORTED_VERSIONS ────────────────────────────

/** Authoritative list of supported pd_state_version values. */
const SUPPORTED_VERSIONS = ['1.0'];

// ─── Public: EXPECTED_STATE_SCHEMA ─────────────────────────

/** Authoritative schema definition for STATE.md v1.0. */
const EXPECTED_STATE_SCHEMA = {
  version: '1.0',
  requiredTopLevelFields: [
    'pd_state_version',
    'milestone',
    'milestone_name',
    'status',
    'last_updated',
    'last_activity',
    'progress',
  ],
  requiredProgressFields: [
    'total_phases',
    'completed_phases',
    'total_plans',
    'completed_plans',
    'percent',
  ],
};

// ─── Helpers ───────────────────────────────────────────────

function padRight(str, length) {
  const s = String(str || '');
  if (s.length >= length) return s;
  return s + ' '.repeat(length - s.length);
}

function truncate(str, maxLength) {
  const s = String(str || '');
  if (s.length <= maxLength) return s;
  return s.slice(0, maxLength - 1) + '…';
}

// ─── Public: parseStateMdFields ────────────────────────────

/**
 * Extract schema-relevant fields from STATE.md content.
 * @param {string} content - Raw STATE.md file content
 * @returns {{ version: string|null, topLevelFields: string[], progressFields: string[], raw: object|null }}
 */
function parseStateMdFields(content) {
  const empty = { version: null, topLevelFields: [], progressFields: [], raw: null };
  if (!content || typeof content !== 'string' || content.trim() === '') return empty;

  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
  if (!fmMatch) return empty;

  let raw;
  try {
    raw = yaml.load(fmMatch[1]);
    if (!raw || typeof raw !== 'object') return empty;
  } catch (e) {
    return empty;
  }

  const rawVersion = raw.pd_state_version;
  let version = null;
  if (rawVersion != null) {
    if (typeof rawVersion === 'number') {
      // js-yaml parses bare `1.0` as number 1; preserve the decimal form
      version = Number.isInteger(rawVersion) ? rawVersion.toFixed(1) : String(rawVersion);
    } else {
      version = String(rawVersion);
    }
  }
  const topLevelFields = Object.keys(raw);
  const progressFields = (raw.progress && typeof raw.progress === 'object')
    ? Object.keys(raw.progress)
    : [];

  return { version, topLevelFields, progressFields, raw };
}

// ─── Public: detectSchemaDrift ─────────────────────────────

/**
 * Compare STATE.md content against the expected v1.0 schema and return issues.
 * @param {string} content - Raw STATE.md file content
 * @returns {Array<{severity: string, category: string, location: string, issue: string, fix: string}>}
 */
function detectSchemaDrift(content) {
  const { version, topLevelFields, progressFields, raw } = parseStateMdFields(content);

  // Guard: no parseable frontmatter (IN-01: removed dead `&& progressFields.length === 0`)
  if (topLevelFields.length === 0) {
    return [{
      severity: SEVERITY_CRITICAL,
      category: CATEGORY,
      location: LOCATION,
      issue: 'STATE.md is empty or has no parseable frontmatter',
      fix: 'Run /pd:new-milestone to recreate STATE.md',
    }];
  }

  const issues = [];

  // Step 3.5 FIRST: Version support check — only when field is present to avoid
  // double-reporting alongside the "Missing required field: pd_state_version" issue (CR-01, WR-02)
  if (topLevelFields.includes('pd_state_version')) {
    const versionCheck = checkVersionSupport(version);
    if (!versionCheck.supported) {
      issues.push({
        severity: SEVERITY_CRITICAL,
        category: CATEGORY,
        location: LOCATION,
        issue: `Unsupported pd_state_version: ${version ?? '(missing)'} (expected one of ${SUPPORTED_VERSIONS.join(', ')})`,
        fix: versionCheck.upgrade_path,
      });
    }
  }

  // Step 3: Missing required top-level fields
  for (const field of EXPECTED_STATE_SCHEMA.requiredTopLevelFields) {
    if (!topLevelFields.includes(field)) {
      issues.push({
        severity: SEVERITY_CRITICAL,
        category: CATEGORY,
        location: LOCATION,
        issue: `Missing required field: ${field}`,
        fix: `Add field ${field} to STATE.md frontmatter`,
      });
    }
  }

  // Step 4: Unknown top-level fields not in schema
  for (const field of topLevelFields) {
    if (!EXPECTED_STATE_SCHEMA.requiredTopLevelFields.includes(field)) {
      issues.push({
        severity: SEVERITY_WARNING,
        category: CATEGORY,
        location: LOCATION,
        issue: `Unknown field: ${field} (not in schema v1.0)`,
        fix: `Remove ${field} or update EXPECTED_STATE_SCHEMA if intentional`,
      });
    }
  }

  // Step 5: Progress sub-fields — emit one diagnostic if progress is null/invalid (CR-02),
  // else check individual sub-fields
  if (topLevelFields.includes('progress')) {
    if (!raw || !raw.progress || typeof raw.progress !== 'object') {
      issues.push({
        severity: SEVERITY_CRITICAL,
        category: CATEGORY,
        location: LOCATION,
        issue: 'Invalid progress section: expected a YAML mapping with sub-fields, got null or scalar',
        fix: 'Edit STATE.md to replace `progress: null` with a proper mapping (total_phases, completed_phases, total_plans, completed_plans, percent)',
      });
    } else {
      for (const field of EXPECTED_STATE_SCHEMA.requiredProgressFields) {
        if (!progressFields.includes(field)) {
          issues.push({
            severity: SEVERITY_CRITICAL,
            category: CATEGORY,
            location: LOCATION,
            issue: `Missing required field: progress.${field}`,
            fix: `Add field ${field} under the progress: section in STATE.md`,
          });
        }
      }
    }
  }

  return issues;
}

// ─── Public: checkVersionSupport ───────────────────────────

/**
 * Check whether a pd_state_version value is supported.
 * @param {string|null|undefined} version
 * @returns {{ supported: boolean, latest: string, upgrade_path: string|null }}
 */
function checkVersionSupport(version) {
  const latest = SUPPORTED_VERSIONS[SUPPORTED_VERSIONS.length - 1];

  if (version == null) {
    return {
      supported: false,
      latest,
      upgrade_path: 'Version unknown — recreate STATE.md with /pd:new-milestone',
    };
  }

  const versionStr = String(version);

  if (SUPPORTED_VERSIONS.includes(versionStr)) {
    return { supported: true, latest, upgrade_path: null };
  }

  // Build upgrade path
  const isNumericVersion = /^[\d.]+$/.test(versionStr);
  const fieldList = EXPECTED_STATE_SCHEMA.requiredTopLevelFields.join(', ');
  const upgrade_path = isNumericVersion
    ? `Migrate from v${versionStr} to v${latest}: ensure fields [${fieldList}] are present`
    : 'Version unknown — recreate STATE.md with /pd:new-milestone';

  return { supported: false, latest, upgrade_path };
}

// ─── Public: formatDriftReport ─────────────────────────────

/**
 * Format drift detection issues as a boxed table report.
 * Returns "No schema drift detected ✓" when issues is empty.
 * @param {object[]} issues - From detectSchemaDrift
 * @returns {string}
 */
function formatDriftReport(issues) {
  if (!Array.isArray(issues) || issues.length === 0) {
    return 'No schema drift detected ✓';
  }

  const W = 70;
  const lines = [];

  const criticalCount = issues.filter(i => i.severity === SEVERITY_CRITICAL).length;
  const warningCount = issues.filter(i => i.severity === SEVERITY_WARNING).length;
  lines.push(`Schema check: ${issues.length} issue(s) found (${criticalCount} critical, ${warningCount} ${warningCount !== 1 ? 'warnings' : 'warning'})`);
  lines.push('');

  lines.push(`╔${'═'.repeat(W)}╗`);
  lines.push(`║ ${padRight('Schema Drift', W - 1)}║`);
  lines.push(`║ ${padRight('─'.repeat(W - 2), W - 1)}║`);

  for (const issue of issues) {
    const tag = `[${String(issue.severity || 'warning').toUpperCase()}]`;
    lines.push(`║ ${padRight(truncate(`  ${tag} ${issue.issue}`, W - 1), W - 1)}║`);
    lines.push(`║ ${padRight(truncate(`    Location: ${issue.location}`, W - 1), W - 1)}║`);
    lines.push(`║ ${padRight(truncate(`    Fix: ${issue.fix || '(no fix provided)'}`, W - 1), W - 1)}║`);
    lines.push(`║ ${padRight('', W - 1)}║`);
  }

  lines.push(`╚${'═'.repeat(W)}╝`);
  return lines.join('\n');
}

// ─── Exports ────────────────────────────────────────────────

module.exports = {
  SUPPORTED_VERSIONS,
  EXPECTED_STATE_SCHEMA,
  parseStateMdFields,
  detectSchemaDrift,
  checkVersionSupport,
  formatDriftReport,
};
