/**
 * Checkpoint Handler Module — CHECKPOINT flow va Continuation Agent (PROT-04, PROT-06).
 *
 * Khi agent ghi CHECKPOINT REACHED, orchestrator can trich xuat cau hoi cho user
 * va tao context cho agent tiep theo (Continuation Agent).
 * Module nay enforce gioi han 2 vong continuation.
 *
 * Pure functions: KHONG doc file, KHONG require('fs'), KHONG side effects.
 *
 * - extractCheckpointQuestion: trich xuat cau hoi tu evidence checkpoint
 * - buildContinuationContext: tao prompt cho continuation agent
 * - MAX_CONTINUATION_ROUNDS: gioi han vong continuation (2)
 */

'use strict';

const { parseEvidence } = require('./evidence-protocol');

// ─── Constants ────────────────────────────────────────────

/** Gioi han so vong continuation agent (per D-09). */
const MAX_CONTINUATION_ROUNDS = 2;

// ─── extractCheckpointQuestion ───────────────────────────

/**
 * Trich xuat cau hoi cho user tu evidence checkpoint (per D-05).
 *
 * @param {string} evidenceContent - Noi dung evidence file (frontmatter + body)
 * @returns {{ question: string, context: string, agentName: string|null, warnings: string[] }}
 */
function extractCheckpointQuestion(evidenceContent) {
  const warnings = [];
  const parsed = parseEvidence(evidenceContent);

  if (parsed.outcome !== 'checkpoint') {
    warnings.push(`outcome khong phai checkpoint: ${parsed.outcome}`);
    return { question: '', context: '', agentName: null, warnings };
  }

  const question = parsed.sections['Cau hoi cho User'] || '';
  const context = parsed.sections['Context cho Agent tiep'] || '';
  const agentName = parsed.agent;

  if (!question) {
    warnings.push('Evidence thieu section "Cau hoi cho User"');
  }

  return { question, context, agentName, warnings };
}

// ─── buildContinuationContext ────────────────────────────

/**
 * Tao prompt va metadata cho continuation agent (per D-10).
 *
 * @param {object} params
 * @param {string} params.evidencePath - Duong dan file evidence truoc
 * @param {string} params.userAnswer - Cau tra loi cua user
 * @param {string} params.sessionDir - Thu muc session
 * @param {number} params.currentRound - Vong hien tai (1-based)
 * @param {string} params.agentName - Ten agent
 * @returns {{ prompt: string, agentName: string, round: number, canContinue: boolean, warnings: string[] }}
 */
function buildContinuationContext({ evidencePath, userAnswer, sessionDir, currentRound, agentName }) {
  const warnings = [];
  const canContinue = currentRound <= MAX_CONTINUATION_ROUNDS;

  if (!canContinue) {
    warnings.push(`Da vuot qua ${MAX_CONTINUATION_ROUNDS} vong continuation — can nguoi xem xet`);
  }

  const prompt = [
    `CONTINUATION — Vong ${currentRound}/${MAX_CONTINUATION_ROUNDS}`,
    `Session dir: ${sessionDir}`,
    `Evidence truoc: ${evidencePath}`,
    `Cau tra loi user: ${userAnswer}`,
  ].join('\n');

  return { prompt, agentName, round: currentRound, canContinue, warnings };
}

// ─── Exports ─────────────────────────────────────────────

module.exports = {
  extractCheckpointQuestion,
  buildContinuationContext,
  MAX_CONTINUATION_ROUNDS,
};
