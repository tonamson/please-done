/**
 * Bug Memory Module Tests
 * Kiem tra 3 ham core: createBugRecord, searchBugs, buildIndex.
 * Pure function module: khong co I/O, content truyen qua tham so.
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  createBugRecord, searchBugs, buildIndex,
} = require('../bin/lib/bug-memory');

// ─── Helpers ─────────────────────────────────────────────

const { parseFrontmatter } = require('../bin/lib/utils');

/**
 * Tao bug record test data nhanh.
 * Tra ve { frontmatter, body, id, number } tuong tu ket qua parseFrontmatter.
 */
function makeBugRecord({
  id = 'BUG-001', number = 1,
  file = 'src/api.js', func = 'handleRequest',
  errorMessage = 'TypeError: cannot read null',
  sessionId = 'S001', status = 'resolved',
  resolvedDate = '2026-03-25',
  rootCause = 'Bien null khong duoc kiem tra',
  fix = 'Them null check truoc khi truy cap',
} = {}) {
  const content = `---
file: ${file}
function: ${func}
error_message: ${errorMessage}
session_id: ${sessionId}
resolved_date: ${resolvedDate}
status: ${status}
---
\nNguyen nhan: ${rootCause}\nFix: ${fix}\n`;

  const parsed = parseFrontmatter(content);
  return { frontmatter: parsed.frontmatter, body: parsed.body, id, number, content };
}

// ─── createBugRecord ────────────────────────────────────

describe('createBugRecord', () => {
  it('Test 1: existingBugs=[] tra ve id=BUG-001, fileName=BUG-001.md', () => {
    const result = createBugRecord({
      existingBugs: [], file: 'src/api.js', rootCause: 'Loi null',
    });
    assert.equal(result.id, 'BUG-001');
    assert.equal(result.fileName, 'BUG-001.md');
  });

  it('Test 2: existingBugs=[{number:3}] tra ve id=BUG-004 (max+1)', () => {
    const result = createBugRecord({
      existingBugs: [{ number: 3 }], file: 'src/api.js', rootCause: 'Loi null',
    });
    assert.equal(result.id, 'BUG-004');
    assert.equal(result.number, 4);
  });

  it('Test 3: Content chua YAML frontmatter voi 6 truong', () => {
    const result = createBugRecord({
      existingBugs: [], file: 'src/api.js', functionName: 'handleRequest',
      errorMessage: 'TypeError', sessionId: 'S001', rootCause: 'Loi null',
    });
    const { frontmatter } = parseFrontmatter(result.content);
    assert.equal(frontmatter.file, 'src/api.js');
    assert.equal(frontmatter.function, 'handleRequest');
    assert.equal(frontmatter.error_message, 'TypeError');
    assert.equal(frontmatter.session_id, 'S001');
    assert.ok(frontmatter.resolved_date);
    assert.equal(frontmatter.status, 'resolved');
  });

  it('Test 4: Body chua rootCause va fix text', () => {
    const result = createBugRecord({
      existingBugs: [], file: 'src/api.js',
      rootCause: 'Bien null', fix: 'Them null check',
    });
    assert.ok(result.content.includes('Nguyen nhan: Bien null'));
    assert.ok(result.content.includes('Fix: Them null check'));
  });

  it('Test 5: Throw Error khi thieu tham so file', () => {
    assert.throws(
      () => createBugRecord({ existingBugs: [], rootCause: 'Loi' }),
      /thieu tham so file/
    );
  });

  it('Test 6: Throw Error khi thieu tham so rootCause', () => {
    assert.throws(
      () => createBugRecord({ existingBugs: [], file: 'x.js' }),
      /thieu tham so rootCause/
    );
  });

  it('Test 7: Optional fields rong van tao duoc', () => {
    const result = createBugRecord({
      existingBugs: [], file: 'x.js', rootCause: 'Loi',
    });
    assert.ok(result.id);
    assert.ok(result.content);
    assert.equal(result.number, 1);
  });
});

// ─── searchBugs ─────────────────────────────────────────

describe('searchBugs', () => {
  const bug1 = makeBugRecord({
    id: 'BUG-001', number: 1, file: 'src/api.js',
    func: 'handleRequest', errorMessage: 'TypeError: cannot read null',
  });

  it('Test 8: Khop 3/3 truong tra ve score=3', () => {
    const { matches } = searchBugs({
      bugRecords: [bug1],
      file: 'src/api.js', functionName: 'handleRequest',
      errorMessage: 'TypeError: cannot read null',
    });
    assert.equal(matches.length, 1);
    assert.equal(matches[0].score, 3);
  });

  it('Test 9: Khop 2/3 truong tra ve score=2', () => {
    const { matches } = searchBugs({
      bugRecords: [bug1],
      file: 'src/api.js', functionName: 'handleRequest',
      errorMessage: 'khong khop gi',
    });
    assert.equal(matches.length, 1);
    assert.equal(matches[0].score, 2);
  });

  it('Test 10: Khop 1/3 truong tra ve score=1', () => {
    const { matches } = searchBugs({
      bugRecords: [bug1],
      file: 'src/api.js', functionName: 'otherFunc',
      errorMessage: 'khong khop',
    });
    assert.equal(matches.length, 1);
    assert.equal(matches[0].score, 1);
  });

  it('Test 11: Khop 0/3 truong khong co trong matches', () => {
    const { matches } = searchBugs({
      bugRecords: [bug1],
      file: 'other.py', functionName: 'otherFunc',
      errorMessage: 'khong khop',
    });
    assert.equal(matches.length, 0);
  });

  it('Test 12: File path matching la case-insensitive substring ca 2 chieu', () => {
    // 'src/api.js' khop 'API.js' (bug file includes search term)
    const { matches: m1 } = searchBugs({
      bugRecords: [bug1],
      file: 'API.js', functionName: '', errorMessage: '',
    });
    assert.ok(m1.length >= 1, 'API.js phai khop src/api.js');

    // Nguoc lai: search file dai hon bug file
    const bug2 = makeBugRecord({ id: 'BUG-002', number: 2, file: 'API.js' });
    const { matches: m2 } = searchBugs({
      bugRecords: [bug2],
      file: 'src/api.js', functionName: '', errorMessage: '',
    });
    assert.ok(m2.length >= 1, 'src/api.js phai khop API.js');
  });

  it('Test 13: Function matching la case-insensitive exact', () => {
    // 'handleRequest' khop 'HANDLEREQUEST'
    const { matches: m1 } = searchBugs({
      bugRecords: [bug1],
      file: '', functionName: 'HANDLEREQUEST', errorMessage: '',
    });
    assert.ok(m1.length >= 1, 'HANDLEREQUEST phai khop handleRequest');

    // 'handle' khong khop 'handleRequest' (substring khong duoc)
    const { matches: m2 } = searchBugs({
      bugRecords: [bug1],
      file: '', functionName: 'handle', errorMessage: '',
    });
    // Neu co matches, score phai tu file/error, khong tu function
    for (const m of m2) {
      // Function khong duoc gop vao score
    }
    // Kiem tra cu the: chi search function 'handle', khong khop file/error
    const bug3 = makeBugRecord({ id: 'BUG-003', number: 3, file: 'other.py', func: 'handleRequest', errorMessage: 'other error' });
    const { matches: m3 } = searchBugs({
      bugRecords: [bug3],
      file: '', functionName: 'handle', errorMessage: '',
    });
    assert.equal(m3.length, 0, 'handle khong khop handleRequest (exact match)');
  });

  it('Test 14: Error message matching la case-insensitive substring ca 2 chieu', () => {
    const { matches: m1 } = searchBugs({
      bugRecords: [bug1],
      file: '', functionName: '', errorMessage: 'TYPEERROR',
    });
    assert.ok(m1.length >= 1, 'TYPEERROR phai khop TypeError: cannot read null');

    // Nguoc lai
    const bug4 = makeBugRecord({ id: 'BUG-004', number: 4, file: 'other.py', func: 'other', errorMessage: 'TypeError' });
    const { matches: m2 } = searchBugs({
      bugRecords: [bug4],
      file: '', functionName: '', errorMessage: 'TypeError: full message',
    });
    assert.ok(m2.length >= 1, 'TypeError: full message phai khop TypeError');
  });

  it('Test 15: Ket qua sort theo score giam dan', () => {
    const bugLow = makeBugRecord({ id: 'BUG-010', number: 10, file: 'other.py', func: 'other', errorMessage: 'TypeError: cannot read null' });
    const bugHigh = makeBugRecord({ id: 'BUG-011', number: 11, file: 'src/api.js', func: 'handleRequest', errorMessage: 'TypeError: cannot read null' });
    const { matches } = searchBugs({
      bugRecords: [bugLow, bugHigh],
      file: 'src/api.js', functionName: 'handleRequest',
      errorMessage: 'TypeError: cannot read null',
    });
    assert.ok(matches.length >= 2);
    assert.ok(matches[0].score >= matches[1].score);
  });

  it('Test 16: bugRecords=[] tra ve matches=[]', () => {
    const { matches } = searchBugs({
      bugRecords: [], file: 'x.js',
    });
    assert.deepEqual(matches, []);
  });

  it('Test 17: Thieu tat ca tieu chi tra ve warnings', () => {
    const { matches, warnings } = searchBugs({
      bugRecords: [bug1],
    });
    assert.deepEqual(matches, []);
    assert.ok(warnings.length > 0);
    assert.ok(warnings.some(w => w.includes('thieu tat ca tieu chi tim kiem')));
  });

  it('Test 18: Bug record khong co frontmatter tra ve warning, khong crash', () => {
    const badBug = { id: 'BUG-BAD', number: 99, content: 'no frontmatter here', frontmatter: null, body: 'no frontmatter here' };
    const { matches, warnings } = searchBugs({
      bugRecords: [badBug],
      file: 'x.js',
    });
    assert.ok(warnings.some(w => w.includes('khong co frontmatter')));
    // Khong crash
    assert.ok(Array.isArray(matches));
  });
});

// ─── buildIndex ─────────────────────────────────────────

describe('buildIndex', () => {
  const bug1 = makeBugRecord({
    id: 'BUG-001', number: 1, file: 'src/api.js',
    func: 'handleRequest', errorMessage: 'TypeError: cannot read null',
    sessionId: 'S001', status: 'resolved', resolvedDate: '2026-03-25',
  });
  const bug2 = makeBugRecord({
    id: 'BUG-002', number: 2, file: 'src/db.js',
    func: 'queryData', errorMessage: 'ConnectionError: timeout',
    sessionId: 'S002', status: 'resolved', resolvedDate: '2026-03-24',
  });

  it('Test 19: bugRecords=[] tra ve markdown voi "Tong so: 0 bugs"', () => {
    const result = buildIndex([]);
    assert.ok(result.includes('Tong so: 0 bugs'));
  });

  it('Test 20: Voi 2 bug records, INDEX co section "## Theo File" voi bang', () => {
    const result = buildIndex([bug1, bug2]);
    assert.ok(result.includes('## Theo File'));
    assert.ok(result.includes('src/api.js'));
    assert.ok(result.includes('src/db.js'));
  });

  it('Test 21: Voi 2 bug records, INDEX co section "## Theo Function" voi bang', () => {
    const result = buildIndex([bug1, bug2]);
    assert.ok(result.includes('## Theo Function'));
    assert.ok(result.includes('handleRequest'));
    assert.ok(result.includes('queryData'));
  });

  it('Test 22: Voi 2 bug records, INDEX co section "## Tat ca Bugs" voi bang', () => {
    const result = buildIndex([bug1, bug2]);
    assert.ok(result.includes('## Tat ca Bugs'));
    assert.ok(result.includes('BUG-001'));
    assert.ok(result.includes('BUG-002'));
  });

  it('Test 23: Section "## Theo Keyword" liet ke error message keywords', () => {
    const result = buildIndex([bug1, bug2]);
    assert.ok(result.includes('## Theo Keyword'));
  });
});
