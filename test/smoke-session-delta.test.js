/**
 * Session Delta Module Tests
 * Kiem tra classifyDelta(), appendAuditHistory(), parseAuditHistory() pure functions.
 * 14 test cases bao phu 3 requirements: DELTA-01 (classification), DELTA-02 (git diff scope), DELTA-03 (audit history).
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  classifyDelta, appendAuditHistory, parseAuditHistory, DELTA_STATUS,
} = require('../bin/lib/session-delta');

// ─── Fixture: evidence voi Function Checklist ────────────────

const EVIDENCE_WITH_CHECKLIST = `---
agent: pd-sec-scanner
category: xss
outcome: vulnerabilities_found
timestamp: 2026-03-26T10:00:00+07:00
session: abc123
commit_sha: a1b2c3d
---

## Function Checklist

| # | File | Ham | Dong | Verdict | Chi tiet |
|---|------|-----|------|---------|----------|
| 1 | src/api/users.js | getUserById | 42 | FLAG | IDOR |
| 2 | src/api/auth.js | login | 15 | PASS | OK |
| 3 | src/api/admin.js | deleteUser | 88 | FAIL | No auth check |
| 4 | src/utils/helper.js | formatDate | 10 | SKIP | Khong lien quan |
`;

const EVIDENCE_NO_CHECKLIST = `---
agent: pd-sec-scanner
category: xss
outcome: vulnerabilities_found
---

## Summary

Ket qua audit khong co Function Checklist.
`;

// ─── Test 1: classifyDelta(null, []) -> isFullScan=true ──────

describe('classifyDelta', () => {
  it('Test 1: null evidence -> isFullScan=true, functions.size=0', () => {
    const result = classifyDelta(null, []);
    assert.equal(result.isFullScan, true);
    assert.equal(result.functions.size, 0);
    assert.deepStrictEqual(result.summary, { skip: 0, rescan: 0, new: 0, knownUnfixed: 0 });
  });

  // ─── Test 2: empty string -> isFullScan=true ────────────────

  it('Test 2: empty string evidence -> isFullScan=true', () => {
    const result = classifyDelta('', []);
    assert.equal(result.isFullScan, true);
    assert.equal(result.functions.size, 0);
  });

  // ─── Test 3: no checklist section -> isFullScan=true ────────

  it('Test 3: evidence khong co ## Function Checklist -> isFullScan=true', () => {
    const result = classifyDelta(EVIDENCE_NO_CHECKLIST, []);
    assert.equal(result.isFullScan, true);
    assert.equal(result.functions.size, 0);
  });

  // ─── Test 4: co checklist, no files changed ─────────────────

  it('Test 4: co checklist, khong file nao doi -> PASS=SKIP, FLAG=KNOWN-UNFIXED, FAIL=KNOWN-UNFIXED', () => {
    const result = classifyDelta(EVIDENCE_WITH_CHECKLIST, []);
    assert.equal(result.isFullScan, false);
    assert.equal(result.functions.size, 4);

    // PASS + khong doi -> SKIP
    assert.equal(result.functions.get('src/api/auth.js::login'), DELTA_STATUS.SKIP);
    // FLAG + khong doi -> KNOWN-UNFIXED
    assert.equal(result.functions.get('src/api/users.js::getUserById'), DELTA_STATUS.KNOWN_UNFIXED);
    // FAIL + khong doi -> KNOWN-UNFIXED
    assert.equal(result.functions.get('src/api/admin.js::deleteUser'), DELTA_STATUS.KNOWN_UNFIXED);
    // SKIP verdict -> giu SKIP
    assert.equal(result.functions.get('src/utils/helper.js::formatDate'), DELTA_STATUS.SKIP);
  });

  // ─── Test 5: co checklist, file doi -> RE-SCAN ──────────────

  it('Test 5: file doi -> PASS+changed=RE-SCAN, FLAG+changed=RE-SCAN, FAIL+changed=RE-SCAN', () => {
    const changedFiles = ['src/api/users.js', 'src/api/auth.js', 'src/api/admin.js'];
    const result = classifyDelta(EVIDENCE_WITH_CHECKLIST, changedFiles);
    assert.equal(result.isFullScan, false);

    // PASS + changed -> RE-SCAN
    assert.equal(result.functions.get('src/api/auth.js::login'), DELTA_STATUS.RESCAN);
    // FLAG + changed -> RE-SCAN
    assert.equal(result.functions.get('src/api/users.js::getUserById'), DELTA_STATUS.RESCAN);
    // FAIL + changed -> RE-SCAN
    assert.equal(result.functions.get('src/api/admin.js::deleteUser'), DELTA_STATUS.RESCAN);
    // SKIP verdict -> giu SKIP bat ke file doi
    assert.equal(result.functions.get('src/utils/helper.js::formatDate'), DELTA_STATUS.SKIP);
  });

  // ─── Test 6: path normalization ─────────────────────────────

  it('Test 6: path normalization — ./src/file.js matches src/file.js', () => {
    const changedFiles = ['./src/api/users.js'];
    const result = classifyDelta(EVIDENCE_WITH_CHECKLIST, changedFiles);
    // ./src/api/users.js sau normalize = src/api/users.js -> match FLAG -> RE-SCAN
    assert.equal(result.functions.get('src/api/users.js::getUserById'), DELTA_STATUS.RESCAN);
  });

  // ─── Test 7: SKIP verdict giu SKIP bat ke file doi ──────────

  it('Test 7: SKIP verdict -> giu SKIP bat ke file doi hay khong', () => {
    const changedFiles = ['src/utils/helper.js'];
    const result = classifyDelta(EVIDENCE_WITH_CHECKLIST, changedFiles);
    assert.equal(result.functions.get('src/utils/helper.js::formatDate'), DELTA_STATUS.SKIP);
  });

  // ─── Test 8: compound key tranh collision ───────────────────

  it('Test 8: compound key — 2 ham trung ten khac file khong collision', () => {
    const evidence = `---
agent: pd-sec-scanner
category: xss
outcome: vulnerabilities_found
---

## Function Checklist

| # | File | Ham | Dong | Verdict | Chi tiet |
|---|------|-----|------|---------|----------|
| 1 | src/api/users.js | validate | 10 | PASS | OK |
| 2 | src/api/orders.js | validate | 20 | FLAG | Missing check |
`;
    const result = classifyDelta(evidence, []);
    assert.equal(result.functions.size, 2);
    assert.equal(result.functions.get('src/api/users.js::validate'), DELTA_STATUS.SKIP);
    assert.equal(result.functions.get('src/api/orders.js::validate'), DELTA_STATUS.KNOWN_UNFIXED);
  });

  // ─── Test 9: summary counts = functions Map size ────────────

  it('Test 9: summary counts khop voi functions Map size', () => {
    const result = classifyDelta(EVIDENCE_WITH_CHECKLIST, []);
    const totalFromSummary = result.summary.skip + result.summary.rescan + result.summary.new + result.summary.knownUnfixed;
    assert.equal(totalFromSummary, result.functions.size);
  });
});

// ─── Test 10-11: appendAuditHistory ──────────────────────────

describe('appendAuditHistory', () => {
  const auditEntry = {
    date: '2026-03-26',
    commit: 'a1b2c3d',
    verdictSummary: '1 PASS, 1 FLAG, 1 FAIL',
    deltaSummary: '2 re-scan, 1 skip',
  };

  it('Test 10: khong co ## Audit History -> append section + header + row', () => {
    const content = `---
agent: pd-sec-scanner
---

## Summary

Ket qua audit.
`;
    const updated = appendAuditHistory(content, auditEntry);
    assert.ok(updated.includes('## Audit History'));
    assert.ok(updated.includes('| Date | Commit | Verdict | Delta |'));
    assert.ok(updated.includes('| 2026-03-26 | a1b2c3d | 1 PASS, 1 FLAG, 1 FAIL | 2 re-scan, 1 skip |'));
  });

  it('Test 11: da co ## Audit History -> append row cuoi table', () => {
    const content = `---
agent: pd-sec-scanner
---

## Audit History

| Date | Commit | Verdict | Delta |
|------|--------|---------|-------|
| 2026-03-25 | x1y2z3w | 2 PASS | 1 new |
`;
    const updated = appendAuditHistory(content, auditEntry);
    // Row cu van con
    assert.ok(updated.includes('| 2026-03-25 | x1y2z3w | 2 PASS | 1 new |'));
    // Row moi duoc append
    assert.ok(updated.includes('| 2026-03-26 | a1b2c3d | 1 PASS, 1 FLAG, 1 FAIL | 2 re-scan, 1 skip |'));
  });
});

// ─── Test 12-13: parseAuditHistory ───────────────────────────

describe('parseAuditHistory', () => {
  it('Test 12: co ## Audit History voi data -> tra ve array entries dung', () => {
    const content = `---
agent: pd-sec-scanner
---

## Audit History

| Date | Commit | Verdict | Delta |
|------|--------|---------|-------|
| 2026-03-25 | x1y2z3w | 2 PASS | 1 new |
| 2026-03-26 | a1b2c3d | 1 PASS, 1 FLAG | 2 re-scan |
`;
    const entries = parseAuditHistory(content);
    assert.equal(entries.length, 2);
    assert.equal(entries[0].date, '2026-03-25');
    assert.equal(entries[0].commit, 'x1y2z3w');
    assert.equal(entries[0].verdict, '2 PASS');
    assert.equal(entries[0].delta, '1 new');
    assert.equal(entries[1].date, '2026-03-26');
    assert.equal(entries[1].commit, 'a1b2c3d');
    assert.equal(entries[1].verdict, '1 PASS, 1 FLAG');
    assert.equal(entries[1].delta, '2 re-scan');
  });

  it('Test 13: khong co ## Audit History -> tra ve []', () => {
    const content = `---
agent: pd-sec-scanner
---

## Summary

Ket qua audit.
`;
    const entries = parseAuditHistory(content);
    assert.deepStrictEqual(entries, []);
  });
});

// ─── Test 14: DELTA_STATUS export ────────────────────────────

describe('DELTA_STATUS export', () => {
  it('Test 14: DELTA_STATUS co 4 keys: SKIP, RESCAN, NEW, KNOWN_UNFIXED', () => {
    assert.equal(Object.keys(DELTA_STATUS).length, 4);
    assert.equal(DELTA_STATUS.SKIP, 'SKIP');
    assert.equal(DELTA_STATUS.RESCAN, 'RE-SCAN');
    assert.equal(DELTA_STATUS.NEW, 'NEW');
    assert.equal(DELTA_STATUS.KNOWN_UNFIXED, 'KNOWN-UNFIXED');
  });
});
