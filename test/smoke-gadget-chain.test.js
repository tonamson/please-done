'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { detectChains, escalateSeverity, orderFixPriority, SEVERITY_ORDER } = require('../bin/lib/gadget-chain');

describe('SEVERITY_ORDER', () => {
  it('co 4 cap dung thu tu', () => {
    assert.deepStrictEqual(SEVERITY_ORDER, ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
  });
});

describe('escalateSeverity', () => {
  it('tra ve LOW khi mang rong', () => {
    assert.equal(escalateSeverity([]), 'LOW');
  });
  it('tang 1 bac tu LOW -> MEDIUM', () => {
    assert.equal(escalateSeverity(['LOW']), 'MEDIUM');
  });
  it('tang 1 bac tu max(HIGH,MEDIUM) -> CRITICAL', () => {
    assert.equal(escalateSeverity(['HIGH', 'MEDIUM']), 'CRITICAL');
  });
  it('cap tai CRITICAL khi da la CRITICAL', () => {
    assert.equal(escalateSeverity(['CRITICAL', 'CRITICAL']), 'CRITICAL');
  });
  it('case-insensitive', () => {
    assert.equal(escalateSeverity(['high']), 'CRITICAL');
  });
});

describe('detectChains', () => {
  // Template fixtures
  const templates = [
    { id: 'sqli-data-leak', name: 'SQLi->DataLeak', links: [{ from_cat: 'sql-injection', to_cat: 'secrets' }], root: 'sql-injection', escalation: '+1' },
    { id: 'xss-session', name: 'XSS->Session', links: [{ from_cat: 'xss', to_cat: 'auth' }], root: 'xss', escalation: '+1' },
  ];

  it('tra ve rong khi khong co findings', () => {
    const r = detectChains([], templates);
    assert.equal(r.chains.length, 0);
    assert.equal(r.linkedFindingKeys.length, 0);
  });

  it('phat hien chain khi ca 2 categories co FAIL/FLAG', () => {
    const findings = [
      { category: 'sql-injection', file: 'a.js', name: 'query', verdict: 'FAIL', severity: 'HIGH' },
      { category: 'secrets', file: 'b.js', name: 'getKey', verdict: 'FLAG', severity: 'MEDIUM' },
    ];
    const r = detectChains(findings, templates);
    assert.equal(r.chains.length, 1);
    assert.equal(r.chains[0].id, 'sqli-data-leak');
    assert.equal(r.chains[0].escalatedSeverity, 'CRITICAL'); // max(HIGH)=2, +1=3=CRITICAL
  });

  it('khong phat hien chain khi chi co 1 category', () => {
    const findings = [
      { category: 'xss', file: 'a.js', name: 'render', verdict: 'FAIL', severity: 'HIGH' },
    ];
    const r = detectChains(findings, templates);
    assert.equal(r.chains.length, 0);
  });

  it('bo qua findings voi verdict PASS', () => {
    const findings = [
      { category: 'sql-injection', file: 'a.js', name: 'query', verdict: 'PASS', severity: 'HIGH' },
      { category: 'secrets', file: 'b.js', name: 'getKey', verdict: 'FAIL', severity: 'MEDIUM' },
    ];
    const r = detectChains(findings, templates);
    assert.equal(r.chains.length, 0);
  });

  it('de-dup findings theo file::name key', () => {
    const findings = [
      { category: 'sql-injection', file: 'a.js', name: 'query', verdict: 'FAIL', severity: 'HIGH' },
      { category: 'secrets', file: 'a.js', name: 'query', verdict: 'FLAG', severity: 'HIGH' },
    ];
    const r = detectChains(findings, templates);
    // from_cat=sql-injection co, to_cat=secrets co -> chain match
    assert.equal(r.chains.length, 1);
    // De-dup: chi 1 unique finding (same file::name)
    assert.equal(r.chains[0].findings.length, 1);
  });
});

describe('orderFixPriority', () => {
  it('tra ve rong khi khong co chains', () => {
    assert.deepStrictEqual(orderFixPriority([]), []);
  });

  it('root truoc, severity giam dan', () => {
    const chains = [
      { id: 'a', root: 'xss', escalatedSeverity: 'HIGH', findings: [{ category: 'xss' }, { category: 'auth' }] },
      { id: 'b', root: 'sql-injection', escalatedSeverity: 'CRITICAL', findings: [{ category: 'sql-injection' }, { category: 'secrets' }] },
    ];
    const ordered = orderFixPriority(chains);
    assert.equal(ordered[0].id, 'b'); // CRITICAL truoc HIGH
    assert.equal(ordered[1].id, 'a');
  });

  it('moi entry co fixPhases voi root truoc', () => {
    const chains = [
      { id: 'a', root: 'sql-injection', escalatedSeverity: 'CRITICAL', findings: [
        { category: 'sql-injection', severity: 'HIGH' },
        { category: 'secrets', severity: 'MEDIUM' },
      ]},
    ];
    const ordered = orderFixPriority(chains);
    assert.equal(ordered[0].fixPhases[0].category, 'sql-injection'); // root truoc
  });
});
