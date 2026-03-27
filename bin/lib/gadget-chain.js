/**
 * Gadget Chain Module — Phat hien chuoi tan cong cross-category tu findings.
 *
 * Pure function: KHONG doc file, KHONG require('fs'), KHONG side effects.
 * Caller truyen findings array va parsed templates vao detectChains().
 *
 * - detectChains(findings, templates): phat hien gadget chain tu findings cross-category
 * - escalateSeverity(severities): tinh severity max+1, cap tai CRITICAL
 * - orderFixPriority(chains): sap fix phases theo reverse chain order (root truoc)
 * - SEVERITY_ORDER: 4 cap severity theo thu tu tang dan
 */

'use strict';

// ─── Constants ────────────────────────────────────────────────

const SEVERITY_ORDER = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

// ─── escalateSeverity ─────────────────────────────────────────

/**
 * Tinh severity tong hop: max(severities) + 1, cap tai CRITICAL.
 * Mang rong tra ve LOW (baseline).
 *
 * @param {string[]} severities - Mang severity values (case-insensitive)
 * @returns {string} Severity da escalate
 */
function escalateSeverity(severities) {
  if (!severities || severities.length === 0) return 'LOW';
  const maxIdx = Math.max(...severities.map(s => SEVERITY_ORDER.indexOf(s.toUpperCase())));
  const escalated = Math.min(maxIdx + 1, SEVERITY_ORDER.length - 1);
  return SEVERITY_ORDER[escalated];
}

// ─── detectChains ─────────────────────────────────────────────

/**
 * Phat hien gadget chain tu findings dua tren templates.
 * Chi xet findings co verdict FAIL hoac FLAG.
 * De-dup findings theo compound key file::name.
 *
 * @param {Array<{category: string, file: string, name: string, verdict: string, severity: string}>} findings
 * @param {Array<{id: string, name: string, links: Array<{from_cat: string, to_cat: string}>, root: string, escalation: string}>} templates
 * @returns {{chains: Array, linkedFindingKeys: string[]}}
 */
function detectChains(findings, templates) {
  const chains = [];
  const linkedFindings = new Set();

  // Group findings by category, chi lay FAIL/FLAG
  const byCat = new Map();
  for (const f of findings) {
    if (f.verdict !== 'FAIL' && f.verdict !== 'FLAG') continue;
    if (!byCat.has(f.category)) byCat.set(f.category, []);
    byCat.get(f.category).push(f);
  }

  for (const tmpl of templates) {
    const allPresent = tmpl.links.every(link =>
      byCat.has(link.from_cat) && byCat.has(link.to_cat)
    );
    if (!allPresent) continue;

    const involved = [];
    for (const link of tmpl.links) {
      involved.push(...(byCat.get(link.from_cat) || []));
      involved.push(...(byCat.get(link.to_cat) || []));
    }
    const unique = [...new Map(involved.map(f => [`${f.file}::${f.name}`, f])).values()];
    const severities = unique.map(f => f.severity);
    const escalated = escalateSeverity(severities);

    chains.push({
      id: tmpl.id,
      name: tmpl.name,
      root: tmpl.root,
      findings: unique,
      originalSeverities: severities,
      escalatedSeverity: escalated,
    });

    unique.forEach(f => linkedFindings.add(`${f.file}::${f.name}`));
  }

  return { chains, linkedFindingKeys: [...linkedFindings] };
}

// ─── orderFixPriority ─────────────────────────────────────────

/**
 * Sap fix phases theo severity giam dan.
 * Moi chain co fixPhases array: root category truoc, cac category khac sau.
 *
 * @param {Array<{id: string, root: string, escalatedSeverity: string, findings: Array}>} chains
 * @returns {Array} Chains da sap voi fixPhases
 */
function orderFixPriority(chains) {
  if (!chains || chains.length === 0) return [];

  // Sap theo severity giam dan (per D-09: gadget chain nguoc, root truoc)
  const sorted = [...chains].sort((a, b) => {
    const aIdx = SEVERITY_ORDER.indexOf(a.escalatedSeverity);
    const bIdx = SEVERITY_ORDER.indexOf(b.escalatedSeverity);
    return bIdx - aIdx; // giam dan
  });

  return sorted.map(chain => {
    // Tao fixPhases: root category truoc, cac category khac sau
    const categories = [...new Set(chain.findings.map(f => f.category))];
    const rootFirst = [
      chain.root,
      ...categories.filter(c => c !== chain.root),
    ].filter(c => categories.includes(c));

    return {
      ...chain,
      fixPhases: rootFirst.map((cat, idx) => ({
        priority: `P${idx}`,
        category: cat,
        findings: chain.findings.filter(f => f.category === cat),
      })),
    };
  });
}

// ─── Exports ──────────────────────────────────────────────────

module.exports = { detectChains, escalateSeverity, orderFixPriority, SEVERITY_ORDER };
