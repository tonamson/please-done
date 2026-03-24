/**
 * Session Manager Module Tests
 * Kiem tra createSession, listSessions, getSession, updateSession, constants.
 * Pure function module: khong co I/O, chi tra ket qua tu content strings.
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  createSession, listSessions, getSession, updateSession,
  SESSION_STATUSES, SESSION_FOLDER_RE,
} = require('../bin/lib/session-manager');

// ─── Helper ──────────────────────────────────────────────

function makeSessionMd({
  id = 'S001', slug = 'timeout-api', status = 'active',
  outcome = 'null', created = '2026-03-24T10:00:00+07:00',
  updated = '2026-03-24T10:30:00+07:00',
} = {}) {
  return `---\nid: ${id}\nslug: ${slug}\nstatus: ${status}\ncreated: ${created}\nupdated: ${updated}\noutcome: ${outcome}\n---\n\n# ${id}: ${slug}\n\n## Mo ta\nTest bug description\n\n## Evidence Trail\n- [ ] evidence_janitor.md\n- [x] evidence_code.md\n`;
}

// ─── SESSION_STATUSES ────────────────────────────────────

describe('SESSION_STATUSES', () => {
  it('co 3 gia tri: active, paused, resolved', () => {
    assert.deepEqual(SESSION_STATUSES, ['active', 'paused', 'resolved']);
  });
});

// ─── SESSION_FOLDER_RE ───────────────────────────────────

describe('SESSION_FOLDER_RE', () => {
  it('match S001-timeout-api', () => {
    assert.equal(SESSION_FOLDER_RE.test('S001-timeout-api'), true);
  });

  it('match S123-loi-login', () => {
    assert.equal(SESSION_FOLDER_RE.test('S123-loi-login'), true);
  });

  it('khong match resolved', () => {
    assert.equal(SESSION_FOLDER_RE.test('resolved'), false);
  });

  it('khong match random-folder', () => {
    assert.equal(SESSION_FOLDER_RE.test('random-folder'), false);
  });

  it('capture groups: number va slug', () => {
    const m = SESSION_FOLDER_RE.exec('S001-timeout-api');
    assert.equal(m[1], '001');
    assert.equal(m[2], 'timeout-api');
  });
});

// ─── createSession ───────────────────────────────────────

describe('createSession', () => {
  it('tao session dau tien S001 tu danh sach rong', () => {
    const result = createSession({ existingSessions: [], description: 'Loi timeout khi goi API' });
    assert.equal(result.id, 'S001');
    assert.match(result.slug, /^[a-z0-9-]+$/);
    assert.equal(result.folderName, `S001-${result.slug}`);
    assert.ok(result.sessionMd.includes('status: active'));
  });

  it('tao S004 khi co sessions [1, 3] (max+1, khong reuse)', () => {
    const result = createSession({
      existingSessions: [{ number: 1 }, { number: 3 }],
      description: 'Bug login',
    });
    assert.equal(result.id, 'S004');
  });

  it('slug cat con 40 ky tu khi description dai', () => {
    const result = createSession({
      existingSessions: [],
      description: 'Loi timeout khi goi API cuc ky dai vo cung tan la quai di khong the tin duoc',
    });
    assert.ok(result.slug.length <= 40);
  });

  it('slug bo dau tieng Viet', () => {
    const result = createSession({
      existingSessions: [],
      description: 'Loi ket noi co so du lieu',
    });
    // slug khong co ky tu unicode dau
    assert.match(result.slug, /^[a-z0-9-]+$/);
    // khong con dau tieng Viet — "loi" tu "Loi" (khong dau thi giu nguyen)
    assert.ok(result.slug.includes('loi'));
  });

  it('throw khi description null', () => {
    assert.throws(() => createSession({ description: null }), /thieu tham so/);
  });

  it('throw khi description undefined', () => {
    assert.throws(() => createSession({}), /thieu tham so/);
  });

  it('sessionMd co status: active', () => {
    const result = createSession({ existingSessions: [], description: 'Test bug' });
    assert.ok(result.sessionMd.includes('status: active'));
  });

  it('sessionMd co outcome: null', () => {
    const result = createSession({ existingSessions: [], description: 'Test bug' });
    assert.ok(result.sessionMd.includes('outcome: null'));
  });

  it('sessionMd co heading # S001: slug', () => {
    const result = createSession({ existingSessions: [], description: 'Test bug' });
    assert.ok(result.sessionMd.includes(`# S001: ${result.slug}`));
  });

  it('sessionMd co section ## Mo ta', () => {
    const result = createSession({ existingSessions: [], description: 'Test bug' });
    assert.ok(result.sessionMd.includes('## Mo ta'));
  });

  it('sessionMd co section ## Evidence Trail', () => {
    const result = createSession({ existingSessions: [], description: 'Test bug' });
    assert.ok(result.sessionMd.includes('## Evidence Trail'));
  });
});

// ─── listSessions ────────────────────────────────────────

describe('listSessions', () => {
  it('chi tra ve entries match S{NNN} pattern', () => {
    const folders = ['S001-bug-a', 'S002-bug-b', 'resolved', 'random'];
    const data = [
      { folderName: 'S001-bug-a', sessionMdContent: makeSessionMd({ id: 'S001', slug: 'bug-a', status: 'active' }) },
      { folderName: 'S002-bug-b', sessionMdContent: makeSessionMd({ id: 'S002', slug: 'bug-b', status: 'active' }) },
    ];
    const result = listSessions(folders, data);
    assert.equal(result.length, 2);
  });

  it('sorted by number tang dan', () => {
    const folders = ['S003-bug-c', 'S001-bug-a'];
    const data = [
      { folderName: 'S003-bug-c', sessionMdContent: makeSessionMd({ id: 'S003', slug: 'bug-c', status: 'active' }) },
      { folderName: 'S001-bug-a', sessionMdContent: makeSessionMd({ id: 'S001', slug: 'bug-a', status: 'active' }) },
    ];
    const result = listSessions(folders, data);
    assert.equal(result[0].number, 1);
    assert.equal(result[1].number, 3);
  });

  it('loai bo sessions resolved', () => {
    const folders = ['S001-bug-a', 'S002-bug-b'];
    const data = [
      { folderName: 'S001-bug-a', sessionMdContent: makeSessionMd({ id: 'S001', slug: 'bug-a', status: 'resolved' }) },
      { folderName: 'S002-bug-b', sessionMdContent: makeSessionMd({ id: 'S002', slug: 'bug-b', status: 'active' }) },
    ];
    const result = listSessions(folders, data);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'S002');
  });

  it('giu sessions active', () => {
    const folders = ['S001-bug-a'];
    const data = [
      { folderName: 'S001-bug-a', sessionMdContent: makeSessionMd({ id: 'S001', slug: 'bug-a', status: 'active' }) },
    ];
    const result = listSessions(folders, data);
    assert.equal(result.length, 1);
    assert.equal(result[0].status, 'active');
  });

  it('tra ve mang rong khi khong co folders', () => {
    const result = listSessions([], []);
    assert.deepEqual(result, []);
  });

  it('moi entry co day du fields', () => {
    const folders = ['S001-bug-a'];
    const data = [
      { folderName: 'S001-bug-a', sessionMdContent: makeSessionMd({ id: 'S001', slug: 'bug-a', status: 'active' }) },
    ];
    const result = listSessions(folders, data);
    const entry = result[0];
    assert.ok('number' in entry);
    assert.ok('id' in entry);
    assert.ok('slug' in entry);
    assert.ok('status' in entry);
    assert.ok('outcome' in entry);
    assert.ok('updated' in entry);
  });
});

// ─── getSession ──────────────────────────────────────────

describe('getSession', () => {
  it('parse SESSION.md hoan chinh', () => {
    const content = makeSessionMd();
    const session = getSession(content);
    assert.equal(session.id, 'S001');
    assert.equal(session.slug, 'timeout-api');
    assert.equal(session.status, 'active');
    assert.equal(session.outcome, 'null');
    assert.ok(session.created);
    assert.ok(session.updated);
    assert.ok(Array.isArray(session.evidenceTrail));
  });

  it('evidenceTrail bao gom file chua done (- [ ])', () => {
    const content = makeSessionMd();
    const session = getSession(content);
    const names = session.evidenceTrail.map(e => e.name);
    assert.ok(names.includes('evidence_janitor.md'));
  });

  it('evidenceTrail bao gom file da done (- [x]) voi flag done', () => {
    const content = makeSessionMd();
    const session = getSession(content);
    const codeEntry = session.evidenceTrail.find(e => e.name === 'evidence_code.md');
    assert.ok(codeEntry);
    assert.equal(codeEntry.done, true);
  });

  it('throw khi content null', () => {
    assert.throws(() => getSession(null), /thieu tham so/);
  });

  it('throw khi content khong phai string', () => {
    assert.throws(() => getSession(123), /thieu tham so/);
  });
});

// ─── updateSession ───────────────────────────────────────

describe('updateSession', () => {
  it('update status tu active sang paused', () => {
    const content = makeSessionMd({ status: 'active' });
    const { sessionMd } = updateSession(content, { status: 'paused' });
    assert.ok(sessionMd.includes('status: paused'));
  });

  it('update outcome sang root_cause', () => {
    const content = makeSessionMd();
    const { sessionMd } = updateSession(content, { outcome: 'root_cause' });
    assert.ok(sessionMd.includes('outcome: root_cause'));
  });

  it('appendToBody them dong moi vao cuoi body', () => {
    const content = makeSessionMd();
    const { sessionMd } = updateSession(content, { appendToBody: '\n- [ ] evidence_repro.md' });
    assert.ok(sessionMd.includes('- [ ] evidence_repro.md'));
  });

  it('updated timestamp duoc cap nhat', () => {
    const content = makeSessionMd({ updated: '2026-03-24T10:30:00+07:00' });
    const { sessionMd } = updateSession(content, { status: 'paused' });
    // timestamp moi phai khac timestamp cu
    assert.ok(!sessionMd.includes('updated: 2026-03-24T10:30:00+07:00'));
  });

  it('throw khi content null', () => {
    assert.throws(() => updateSession(null, {}), /thieu tham so/);
  });

  it('throw khi content khong phai string', () => {
    assert.throws(() => updateSession(123, {}), /thieu tham so/);
  });

  it('warnings khi status khong hop le', () => {
    const content = makeSessionMd();
    const { warnings } = updateSession(content, { status: 'invalid_status' });
    assert.ok(warnings.length > 0);
    assert.ok(warnings.some(w => w.includes('khong hop le') || w.includes('status')));
  });
});
