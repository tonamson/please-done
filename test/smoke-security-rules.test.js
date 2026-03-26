/**
 * Smoke test cho security-rules.yaml
 * Xac nhan YAML co 13 OWASP categories va schema dung.
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const yaml = require('js-yaml');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const rulesPath = join(__dirname, '..', 'references', 'security-rules.yaml');
const rules = yaml.load(readFileSync(rulesPath, 'utf8'));

const EXPECTED_CATEGORIES = [
  'sql-injection',
  'xss',
  'cmd-injection',
  'path-traversal',
  'secrets',
  'auth',
  'deserialization',
  'misconfig',
  'prototype-pollution',
  'crypto',
  'insecure-design',
  'vuln-deps',
  'logging',
];

const REQUIRED_FIELDS = ['owasp', 'severity', 'patterns', 'fixes', 'fastcode_queries'];
const VALID_SEVERITIES = ['critical', 'high', 'medium', 'low'];

describe('security-rules.yaml', () => {

  it('Test 1: co dung 13 top-level keys', () => {
    const keys = Object.keys(rules);
    assert.equal(keys.length, 13, `Can 13 categories, co ${keys.length}`);
    for (const cat of EXPECTED_CATEGORIES) {
      assert.ok(keys.includes(cat), `Thieu category: ${cat}`);
    }
  });

  it('Test 2: moi category co 5 truong bat buoc', () => {
    for (const cat of EXPECTED_CATEGORIES) {
      const entry = rules[cat];
      assert.ok(entry, `Category ${cat} khong ton tai`);
      for (const field of REQUIRED_FIELDS) {
        assert.ok(
          entry[field] !== undefined && entry[field] !== null,
          `Category ${cat} thieu truong ${field}`
        );
      }
    }
  });

  it('Test 3: moi category co truong evidence_file (string)', () => {
    for (const cat of EXPECTED_CATEGORIES) {
      const entry = rules[cat];
      assert.ok(typeof entry.evidence_file === 'string', `Category ${cat} thieu evidence_file`);
      assert.ok(entry.evidence_file.length > 0, `Category ${cat} evidence_file rong`);
    }
  });

  it('Test 4: patterns[].regex va patterns[].description ton tai cho moi pattern entry', () => {
    for (const cat of EXPECTED_CATEGORIES) {
      const entry = rules[cat];
      assert.ok(Array.isArray(entry.patterns), `Category ${cat} patterns khong phai array`);
      assert.ok(entry.patterns.length > 0, `Category ${cat} patterns rong`);
      for (let i = 0; i < entry.patterns.length; i++) {
        const p = entry.patterns[i];
        assert.ok(
          typeof p.regex === 'string' && p.regex.length > 0,
          `Category ${cat} patterns[${i}] thieu regex`
        );
        assert.ok(
          typeof p.description === 'string' && p.description.length > 0,
          `Category ${cat} patterns[${i}] thieu description`
        );
      }
    }
  });

  it('Test 5: severity chi nhan 1 trong 4 gia tri: critical, high, medium, low', () => {
    for (const cat of EXPECTED_CATEGORIES) {
      const entry = rules[cat];
      assert.ok(
        VALID_SEVERITIES.includes(entry.severity),
        `Category ${cat} severity "${entry.severity}" khong hop le. Phai la: ${VALID_SEVERITIES.join(', ')}`
      );
    }
  });

  it('Test 6: fastcode_queries co it nhat 1 entry moi category', () => {
    for (const cat of EXPECTED_CATEGORIES) {
      const entry = rules[cat];
      assert.ok(Array.isArray(entry.fastcode_queries), `Category ${cat} fastcode_queries khong phai array`);
      assert.ok(
        entry.fastcode_queries.length >= 1,
        `Category ${cat} fastcode_queries rong, can it nhat 1 entry`
      );
    }
  });

});
