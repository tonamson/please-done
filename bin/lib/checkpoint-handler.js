/**
 * Checkpoint Handler Module — CHECKPOINT flow and Continuation Agent (PROT-04, PROT-06).
 *
 * When an agent writes CHECKPOINT REACHED, the orchestrator can extract the question for
 * the user and create context for the next agent (Continuation Agent).
 * This module enforces a 2-round continuation limit.
 *
 * Pure functions: NO file reads, NO require('fs'), NO side effects.
 *
 * - extractCheckpointQuestion: extract question from checkpoint evidence
 * - buildContinuationContext: create prompt for continuation agent
 * - MAX_CONTINUATION_ROUNDS: continuation round limit (2)
 */

'use strict';

const { parseEvidence } = require('./evidence-protocol');

// ─── Constants ────────────────────────────────────────────

/** Continuation round limit (per D-09). */
const MAX_CONTINUATION_ROUNDS = 2;

// ─── extractCheckpointQuestion ───────────────────────

/**
 * Extract the user-facing question from checkpoint evidence (per D-05).
 *
 * @param {string} evidenceContent - Evidence file content (frontmatter + body)
 * @returns {{ question: string, context: string, agentName: string|null, warnings: string[] }}
 */
function extractCheckpointQuestion(evidenceContent) {
  const warnings = [];
  const parsed = parseEvidence(evidenceContent);

  if (parsed.outcome !== 'checkpoint') {
    warnings.push(`outcome is not checkpoint: ${parsed.outcome}`);
    return { question: '', context: '', agentName: null, warnings };
  }

  const question = parsed.sections['Câu hỏi cho User'] || '';
  const context = parsed.sections['Context cho Agent tiếp'] || '';
  const agentName = parsed.agent;

  if (!question) {
    warnings.push('Evidence missing section "Câu hỏi cho User"');
  }

  return { question, context, agentName, warnings };
}

// ─── buildContinuationContext ────────────────────────────

/**
 * Create prompt and metadata for the continuation agent (per D-10).
 *
 * @param {object} params
 * @param {string} params.evidencePath - Path to previous evidence file
 * @param {string} params.userAnswer - User's answer
 * @param {string} params.sessionDir - Session directory
 * @param {number} params.currentRound - Current round (1-based)
 * @param {string} params.agentName - Agent name
 * @returns {{ prompt: string, agentName: string, round: number, canContinue: boolean, warnings: string[] }}
 */
function buildContinuationContext({ evidencePath, userAnswer, sessionDir, currentRound, agentName }) {
  const warnings = [];
  const canContinue = currentRound <= MAX_CONTINUATION_ROUNDS;

  if (!canContinue) {
    warnings.push(`Exceeded ${MAX_CONTINUATION_ROUNDS} continuation rounds — manual review needed`);
  }

  const prompt = [
    `CONTINUATION — Round ${currentRound}/${MAX_CONTINUATION_ROUNDS}`,
    `Session dir: ${sessionDir}`,
    `Previous evidence: ${evidencePath}`,
    `User answer: ${userAnswer}`,
  ].join('\n');

  return { prompt, agentName, round: currentRound, canContinue, warnings };
}

// ─── Exports ─────────────────────────────────────────────

module.exports = {
  extractCheckpointQuestion,
  buildContinuationContext,
  MAX_CONTINUATION_ROUNDS,
};
