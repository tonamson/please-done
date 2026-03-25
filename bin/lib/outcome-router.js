/**
 * Outcome Router Module — Dinh tuyen hanh dong theo ROOT CAUSE outcome (PROT-03).
 *
 * Khi agent tim duoc nguyen nhan loi, user duoc hien 3 lua chon:
 * "Sua ngay", "Len ke hoach", "Tu sua".
 * Module nay cung cap pure functions de orchestrator (Phase 32) goi.
 *
 * Pure functions: KHONG doc file, KHONG require('fs'), KHONG side effects.
 * Content truyen qua tham so, return structured object voi warnings array.
 *
 * - buildRootCauseMenu: tao menu 3 lua chon tu evidence root_cause
 * - prepareFixNow: tao action descriptor cho "Sua ngay"
 * - prepareFixPlan: tao FIX-PLAN.md content cho "Len ke hoach"
 * - prepareSelfFix: tao session update cho "Tu sua"
 * - ROOT_CAUSE_CHOICES: constant 3 lua chon
 */

'use strict';

const { parseEvidence } = require('./evidence-protocol');
const { assembleMd } = require('./utils');

// ─── Constants ────────────────────────────────────────────

/**
 * 3 lua chon khi ROOT CAUSE duoc tim thay (D-01).
 */
const ROOT_CAUSE_CHOICES = [
  { key: 'fix_now',  label: 'Sua ngay' },
  { key: 'fix_plan', label: 'Len ke hoach' },
  { key: 'self_fix', label: 'Tu sua' },
];

// ─── buildRootCauseMenu ──────────────────────────────────

/**
 * Tao menu 3 lua chon tu evidence root_cause.
 *
 * @param {string} evidenceContent - Noi dung evidence file (frontmatter + body)
 * @returns {{ question: string, choices: Array<{key: string, label: string}>, summary: string, warnings: string[] }}
 */
function buildRootCauseMenu(evidenceContent) {
  const parsed = parseEvidence(evidenceContent);

  if (parsed.outcome !== 'root_cause') {
    return {
      question: '',
      choices: [],
      summary: '',
      warnings: [`outcome khong phai root_cause: ${parsed.outcome}`],
    };
  }

  const rootCause = parsed.sections['Nguyen nhan'] || 'Khong co mo ta';
  const question = `Da tim thay nguyen nhan:\n${rootCause}\n\nBan muon lam gi?`;
  const summary = rootCause.split('\n')[0].slice(0, 120);

  return {
    question,
    choices: [...ROOT_CAUSE_CHOICES],
    summary,
    warnings: [],
  };
}

// ─── prepareFixNow ───────────────────────────────────────

/**
 * Tao action descriptor cho "Sua ngay" (D-02).
 * Orchestrator truc tiep sua code, tai su dung logic v1.5.
 * KHONG tra agentName — orchestrator truc tiep sua code.
 *
 * @param {string} evidenceContent - Noi dung evidence file
 * @returns {{ action: string, reusableModules: string[], evidence: string, suggestion: string, commitPrefix: string, warnings: string[] }}
 */
function prepareFixNow(evidenceContent) {
  const parsed = parseEvidence(evidenceContent);

  const evidence = parsed.sections['Bang chung'] || '';
  const suggestion = parsed.sections['De xuat'] || '';

  return {
    action: 'fix_now',
    reusableModules: ['debug-cleanup', 'logic-sync', 'regression-analyzer'],
    evidence,
    suggestion,
    commitPrefix: '[LOI]',
    warnings: [],
  };
}

// ─── prepareFixPlan ──────────────────────────────────────

/**
 * Tao FIX-PLAN.md content cho "Len ke hoach" (D-03).
 * planPath la relative to session dir (Pitfall 4).
 *
 * @param {string} evidenceContent - Noi dung evidence file
 * @param {string} sessionDir - Duong dan session directory
 * @returns {{ action: string, planContent: string, planPath: string, warnings: string[] }}
 */
function prepareFixPlan(evidenceContent, sessionDir) {
  const parsed = parseEvidence(evidenceContent);

  const rootCause = parsed.sections['Nguyen nhan'] || '';
  const evidence = parsed.sections['Bang chung'] || '';
  const suggestion = parsed.sections['De xuat'] || '';

  const frontmatter = {
    type: 'fix-plan',
    session: parsed.session,
    created: new Date().toISOString(),
  };

  const body = `\n# FIX-PLAN\n\n## Nguyen nhan\n${rootCause}\n\n## Files can sua\n${evidence}\n\n## Test can viet\n- [ ] Test tai hien loi\n- [ ] Test sau khi sua\n\n## De xuat\n${suggestion}\n\n## Risk Assessment\n- [ ] Anh huong modules khac?\n- [ ] Can cap nhat docs?\n`;

  const planContent = assembleMd(frontmatter, body);

  return {
    action: 'fix_plan',
    planContent,
    planPath: 'FIX-PLAN.md',
    warnings: [],
  };
}

// ─── prepareSelfFix ──────────────────────────────────────

/**
 * Tao session update cho "Tu sua" (D-04).
 * Cap nhat SESSION.md status=paused, hien root cause summary + danh sach files.
 *
 * @param {string} evidenceContent - Noi dung evidence file
 * @returns {{ action: string, sessionUpdate: {status: string}, summary: string, filesForReview: string, resumeHint: string, warnings: string[] }}
 */
function prepareSelfFix(evidenceContent) {
  const parsed = parseEvidence(evidenceContent);

  const rootCause = parsed.sections['Nguyen nhan'] || '';
  const evidence = parsed.sections['Bang chung'] || '';

  return {
    action: 'self_fix',
    sessionUpdate: { status: 'paused' },
    summary: rootCause.split('\n')[0].slice(0, 200),
    filesForReview: evidence,
    resumeHint: 'Chay lai pd:fix-bug de verify sau khi sua.',
    warnings: [],
  };
}

// ─── Exports ─────────────────────────────────────────────

module.exports = {
  buildRootCauseMenu,
  prepareFixNow,
  prepareFixPlan,
  prepareSelfFix,
  ROOT_CAUSE_CHOICES,
};
