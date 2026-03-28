/**
 * Outcome Router Module — Route actions based on ROOT CAUSE outcome (PROT-03).
 *
 * When the agent finds the root cause, the user is shown 3 choices:
 * "Fix now", "Create plan", "Self fix".
 * This module provides pure functions for the orchestrator (Phase 32) to call.
 *
 * Pure functions: does NOT read files, does NOT require('fs'), NO side effects.
 * Content passed via parameters, returns structured object with warnings array.
 *
 * - buildRootCauseMenu: create 3-choice menu from evidence root_cause
 * - prepareFixNow: create action descriptor for "Fix now"
 * - prepareFixPlan: create FIX-PLAN.md content for "Create plan"
 * - prepareSelfFix: create session update for "Self fix"
 * - ROOT_CAUSE_CHOICES: constant 3 choices
 */

"use strict";

const { parseEvidence } = require("./evidence-protocol");
const { assembleMd } = require("./utils");

// ─── Constants ────────────────────────────────────────────

/** Limit for INCONCLUSIVE loop-back rounds (FLOW-06). */
const MAX_INCONCLUSIVE_ROUNDS = 3;

/**
 * 3 choices when ROOT CAUSE is found (D-01).
 */
const ROOT_CAUSE_CHOICES = [
  { key: "fix_now", label: "Fix now" },
  { key: "fix_plan", label: "Create plan" },
  { key: "self_fix", label: "Self fix" },
];

// ─── buildRootCauseMenu ──────────────────────────────────

/**
 * Create 3-choice menu from evidence root_cause.
 *
 * @param {string} evidenceContent - Evidence file content (frontmatter + body)
 * @returns {{ question: string, choices: Array<{key: string, label: string}>, summary: string, warnings: string[] }}
 */
function buildRootCauseMenu(evidenceContent) {
  const parsed = parseEvidence(evidenceContent);

  if (parsed.outcome !== "root_cause") {
    return {
      question: "",
      choices: [],
      summary: "",
      warnings: [`outcome is not root_cause: ${parsed.outcome}`],
    };
  }

  const rootCause = parsed.sections["Root Cause"] || "No description available";
  const question = `Root cause found:\n${rootCause}\n\nWhat would you like to do?`;
  const summary = rootCause.split("\n")[0].slice(0, 120);

  return {
    question,
    choices: [...ROOT_CAUSE_CHOICES],
    summary,
    warnings: [],
  };
}

// ─── prepareFixNow ───────────────────────────────────────

/**
 * Create action descriptor for "Fix now" (D-02).
 * Orchestrator directly fixes code, reusing v1.5 logic.
 * Does NOT return agentName — orchestrator directly fixes code.
 *
 * @param {string} evidenceContent - Evidence file content
 * @returns {{ action: string, reusableModules: string[], evidence: string, suggestion: string, commitPrefix: string, warnings: string[] }}
 */
function prepareFixNow(evidenceContent) {
  const parsed = parseEvidence(evidenceContent);

  const evidence = parsed.sections["Evidence"] || "";
  const suggestion = parsed.sections["Suggestion"] || "";

  return {
    action: "fix_now",
    reusableModules: ["debug-cleanup", "logic-sync", "regression-analyzer"],
    evidence,
    suggestion,
    commitPrefix: "[BUG]",
    warnings: [],
  };
}

// ─── prepareFixPlan ──────────────────────────────────────

/**
 * Create FIX-PLAN.md content for "Create plan" (D-03).
 * planPath is relative to session dir (Pitfall 4).
 *
 * @param {string} evidenceContent - Evidence file content
 * @param {string} sessionDir - Session directory path
 * @returns {{ action: string, planContent: string, planPath: string, warnings: string[] }}
 */
function prepareFixPlan(evidenceContent, sessionDir) {
  const parsed = parseEvidence(evidenceContent);

  const rootCause = parsed.sections["Root Cause"] || "";
  const evidence = parsed.sections["Evidence"] || "";
  const suggestion = parsed.sections["Suggestion"] || "";

  const frontmatter = {
    type: "fix-plan",
    session: parsed.session,
    created: new Date().toISOString(),
  };

  const body = `\n# FIX-PLAN\n\n## Root Cause\n${rootCause}\n\n## Files to modify\n${evidence}\n\n## Tests to write\n- [ ] Test to reproduce the bug\n- [ ] Test after fix\n\n## Suggestion\n${suggestion}\n\n## Risk Assessment\n- [ ] Affects other modules?\n- [ ] Needs docs update?\n`;

  const planContent = assembleMd(frontmatter, body);

  return {
    action: "fix_plan",
    planContent,
    planPath: `${sessionDir}/FIX-PLAN.md`,
    warnings: [],
  };
}

// ─── prepareSelfFix ──────────────────────────────────────

/**
 * Create session update for "Self fix" (D-04).
 * Updates SESSION.md status=paused, shows root cause summary + file list.
 *
 * @param {string} evidenceContent - Evidence file content
 * @returns {{ action: string, sessionUpdate: {status: string}, summary: string, filesForReview: string, resumeHint: string, warnings: string[] }}
 */
function prepareSelfFix(evidenceContent) {
  const parsed = parseEvidence(evidenceContent);

  const rootCause = parsed.sections["Root Cause"] || "";
  const evidence = parsed.sections["Evidence"] || "";

  return {
    action: "self_fix",
    sessionUpdate: { status: "paused" },
    summary: rootCause.split("\n")[0].slice(0, 200),
    filesForReview: evidence,
    resumeHint: "Run pd:fix-bug again to verify after fixing.",
    warnings: [],
  };
}

// ─── buildInconclusiveContext ────────────────────────────

/**
 * Create context for Step 2 agents when INCONCLUSIVE loop-back (FLOW-06).
 * Extracts Elimination Log from evidence_architect.md, creates prompt for next round.
 *
 * Pattern: similar to buildContinuationContext() in checkpoint-handler.js.
 * Pure function — does NOT import fs. Content passed via parameters.
 *
 * @param {object} params
 * @param {string} params.evidenceContent - Evidence file content (frontmatter + body)
 * @param {string|null} params.userInputPath - Path to additional user info file
 * @param {string} params.sessionDir - Session directory
 * @param {number} params.currentRound - Current round (1-based)
 * @returns {{ prompt: string, eliminationLog: string, round: number, canContinue: boolean, warnings: string[] }}
 */
function buildInconclusiveContext({
  evidenceContent,
  userInputPath,
  sessionDir,
  currentRound,
}) {
  const warnings = [];
  const canContinue = currentRound <= MAX_INCONCLUSIVE_ROUNDS;

  if (!canContinue) {
    warnings.push(
      `Exceeded ${MAX_INCONCLUSIVE_ROUNDS} investigation rounds — needs human review`,
    );
  }

  const parsed = parseEvidence(evidenceContent);
  const eliminationLog = parsed.sections["Elimination Log"] || "";

  if (!eliminationLog) {
    warnings.push("Evidence missing Elimination Log section");
  }

  const promptParts = [
    `INCONCLUSIVE LOOP-BACK — Round ${currentRound}/${MAX_INCONCLUSIVE_ROUNDS}`,
    `Session dir: ${sessionDir}`,
    `Elimination Log from previous round:\n${eliminationLog}`,
  ];

  if (userInputPath) {
    promptParts.push(`Additional info from user: ${userInputPath}`);
  }

  const prompt = promptParts.join("\n");

  return { prompt, eliminationLog, round: currentRound, canContinue, warnings };
}

// ─── Exports ─────────────────────────────────────────────

module.exports = {
  buildRootCauseMenu,
  prepareFixNow,
  prepareFixPlan,
  prepareSelfFix,
  buildInconclusiveContext,
  ROOT_CAUSE_CHOICES,
  MAX_INCONCLUSIVE_ROUNDS,
};
