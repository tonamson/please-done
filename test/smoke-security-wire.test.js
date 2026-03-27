'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const ROOT = join(__dirname, '..');

describe('Security wire integration', () => {
  const completeMilestone = readFileSync(join(ROOT, 'workflows', 'complete-milestone.md'), 'utf8');
  const whatNext = readFileSync(join(ROOT, 'workflows', 'what-next.md'), 'utf8');
  const stateMachine = readFileSync(join(ROOT, 'references', 'state-machine.md'), 'utf8');

  it('WIRE-01: complete-milestone co security gate check', () => {
    assert.ok(completeMilestone.includes('SECURITY_REPORT'), 'Thieu SECURITY_REPORT check');
    assert.ok(completeMilestone.includes('pd:audit'), 'Thieu goi y pd:audit');
    // Verify non-blocking — khong co tu "CHAN" trong section security gate
    assert.ok(!completeMilestone.match(/SECURITY_REPORT[\s\S]*?\*\*CHAN\*\*/),
      'Security gate phai non-blocking');
  });

  it('WIRE-01b: complete-milestone check dung path .planning/audit/', () => {
    assert.ok(completeMilestone.includes('.planning/audit/SECURITY_REPORT.md'),
      'Security gate phai check .planning/audit/SECURITY_REPORT.md (khop voi audit.md B9 output)');
  });

  it('WIRE-02: what-next co uu tien 7.5', () => {
    assert.ok(whatNext.includes('7.5'), 'Thieu uu tien 7.5');
    assert.ok(whatNext.includes('pd:audit'), 'Thieu goi y pd:audit');
    assert.ok(whatNext.includes('SECURITY_REPORT'), 'Thieu dieu kien SECURITY_REPORT');
  });

  it('WIRE-03: state-machine co pd:audit nhanh phu', () => {
    assert.ok(stateMachine.includes('pd:audit'), 'Thieu pd:audit trong state machine');
    // Verify nam trong section nhanh phu
    const nhanhPhuIdx = stateMachine.indexOf('Nhanh phu');
    const auditIdx = stateMachine.indexOf('pd:audit');
    assert.ok(nhanhPhuIdx < auditIdx, 'pd:audit phai nam sau "Nhanh phu"');
  });

  it('WIRE-03b: state-machine co pd:audit trong bang dieu kien tien quyet', () => {
    // pd:audit phai xuat hien it nhat 2 lan: nhanh phu + bang dieu kien
    const matches = stateMachine.match(/pd:audit/g);
    assert.ok(matches && matches.length >= 2,
      `pd:audit phai xuat hien >= 2 lan, thuc te: ${matches ? matches.length : 0}`);
    // Kiem tra row trong bang dieu kien
    assert.ok(stateMachine.includes('| `/pd:audit`'),
      'Thieu row pd:audit trong bang dieu kien tien quyet');
  });

  // Snapshot sync tests
  const PLATFORMS = ['codex', 'copilot', 'gemini', 'opencode'];

  it('Snapshots complete-milestone + what-next dong bo', () => {
    for (const platform of PLATFORMS) {
      const snapCM = readFileSync(
        join(ROOT, 'test', 'snapshots', platform, 'complete-milestone.md'), 'utf8'
      );
      assert.ok(snapCM.includes('SECURITY_REPORT'),
        `${platform}/complete-milestone.md thieu SECURITY_REPORT`);
    }
    for (const platform of PLATFORMS) {
      const snapWN = readFileSync(
        join(ROOT, 'test', 'snapshots', platform, 'what-next.md'), 'utf8'
      );
      assert.ok(snapWN.includes('7.5'),
        `${platform}/what-next.md thieu uu tien 7.5`);
    }
  });
});
