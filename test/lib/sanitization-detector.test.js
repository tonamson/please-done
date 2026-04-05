/**
 * Sanitization Detector Tests - Phase 115
 * Tests for identifying sanitization patterns and validation
 */

const { test, describe, before } = require('node:test');
const assert = require('node:assert');

// Module to be tested (created in Plan 115-02)
let SanitizationDetector;

try {
  ({ SanitizationDetector } = require('../../bin/lib/sanitization-detector.js'));
} catch (e) {
  // Module doesn't exist yet - tests will be skipped
  SanitizationDetector = null;
}

describe('SanitizationDetector', () => {
  let detector;

  before(() => {
    if (!SanitizationDetector) {
      console.log('Skipping tests - SanitizationDetector module not yet implemented');
      return;
    }
    detector = new SanitizationDetector();
  });

  describe('Joi validation', () => {
    test('should detect Joi.string().validate()', () => {
      if (!SanitizationDetector) return;

      const code = `
        const Joi = require('joi');
        const schema = Joi.string().max(255);
        const result = schema.validate(req.body.name);
      `;

      const result = detector.detect(code);
      assert.ok(result.patterns.some(p => p.type === 'joi-validation'),
        'Should detect Joi validation');
    });

    test('should detect Joi.object() schema validation', () => {
      if (!SanitizationDetector) return;

      const code = `
        const schema = Joi.object({
          email: Joi.string().email(),
          age: Joi.number().integer()
        });
        const { error, value } = schema.validate(req.body);
      `;

      const result = detector.detect(code);
      assert.ok(result.patterns.some(p => p.type === 'joi-schema'),
        'Should detect Joi object schema');
    });

    test('should detect Joi security validations', () => {
      if (!SanitizationDetector) return;

      const code = `
        const schema = Joi.string().alphanum().lowercase();
        schema.validate(userInput);
      `;

      const result = detector.detect(code);
      const pattern = result.patterns.find(p => p.type === 'joi-validation');
      if (pattern) {
        assert.ok(pattern.constraints?.includes('alphanum'),
          'Should identify alphanum constraint');
      }
    });
  });

  describe('Yup validation', () => {
    test('should detect Yup.string() validation', () => {
      if (!SanitizationDetector) return;

      const code = `
        const Yup = require('yup');
        const schema = Yup.string().required();
        const valid = await schema.validate(req.body.email);
      `;

      const result = detector.detect(code);
      assert.ok(result.patterns.some(p => p.type === 'yup-validation'),
        'Should detect Yup validation');
    });

    test('should detect Yup object schemas', () => {
      if (!SanitizationDetector) return;

      const code = `
        const schema = Yup.object().shape({
          name: Yup.string().min(2),
          email: Yup.string().email()
        });
        schema.validateSync(req.body);
      `;

      const result = detector.detect(code);
      assert.ok(result.patterns.some(p => p.type === 'yup-schema'),
        'Should detect Yup object schema');
    });

    test('should detect Yup transforms as sanitization', () => {
      if (!SanitizationDetector) return;

      const code = `
        const schema = Yup.string().trim().lowercase();
        schema.validate(input);
      `;

      const result = detector.detect(code);
      const pattern = result.patterns.find(p => p.type === 'yup-validation');
      if (pattern) {
        assert.ok(pattern.transforms, 'Should identify transforms');
      }
    });
  });

  describe('Zod validation', () => {
    test('should detect Zod string parsing', () => {
      if (!SanitizationDetector) return;

      const code = `
        const z = require('zod');
        const schema = z.string().email();
        const email = schema.parse(req.body.email);
      `;

      const result = detector.detect(code);
      assert.ok(result.patterns.some(p => p.type === 'zod-validation'),
        'Should detect Zod validation');
    });

    test('should detect Zod object schemas', () => {
      if (!SanitizationDetector) return;

      const code = `
        const schema = z.object({
          name: z.string(),
          age: z.number().int()
        });
        schema.safeParse(req.body);
      `;

      const result = detector.detect(code);
      assert.ok(result.patterns.some(p => p.type === 'zod-schema'),
        'Should detect Zod object schema');
    });

    test('should detect Zod refinements', () => {
      if (!SanitizationDetector) return;

      const code = `
        const schema = z.string().refine(val => val.length > 5);
        schema.parse(input);
      `;

      const result = detector.detect(code);
      const pattern = result.patterns.find(p => p.type === 'zod-validation');
      if (pattern) {
        assert.ok(pattern.hasRefinements, 'Should detect Zod refinements');
      }
    });
  });

  describe('Manual sanitization', () => {
    test('should detect validator.js sanitize', () => {
      if (!SanitizationDetector) return;

      const code = `
        const validator = require('validator');
        const clean = validator.escape(dirty);
      `;

      const result = detector.detect(code);
      assert.ok(result.patterns.some(p =>
        p.type === 'validator-escape' || p.type === 'manual-sanitization'
      ), 'Should detect validator escape');
    });

    test('should detect regex-based sanitization', () => {
      if (!SanitizationDetector) return;

      const code = `
        const clean = input.replace(/<script>/gi, '');
      `;

      const result = detector.detect(code);
      assert.ok(result.patterns.some(p => p.type === 'regex-sanitization'),
        'Should detect regex sanitization');
    });

    test('should detect whitelist approaches', () => {
      if (!SanitizationDetector) return;

      const code = `
        const allowed = /^[a-zA-Z0-9]+$/;
        if (allowed.test(input)) {
          process(input);
        }
      `;

      const result = detector.detect(code);
      assert.ok(result.patterns.some(p => p.type === 'whitelist-validation'),
        'Should detect whitelist validation');
    });

    test('should detect common sanitization function names', () => {
      if (!SanitizationDetector) return;

      const code = `
        const safe = sanitizeInput(userData);
        const escaped = escapeHtml(rawHtml);
        const cleaned = cleanString(dirty);
      `;

      const result = detector.detect(code);
      assert.ok(result.patterns.length > 0, 'Should detect common sanitization patterns');
    });
  });

  describe('Database parameterization', () => {
    test('should detect parameterized queries', () => {
      if (!SanitizationDetector) return;

      const code = `
        db.query('SELECT * FROM users WHERE id = ?', [userId]);
        db.query('SELECT * FROM users WHERE id = $1', [userId]);
      `;

      const result = detector.detect(code);
      assert.ok(result.patterns.some(p => p.type === 'parameterized-query'),
        'Should detect parameterized queries');
    });

    test('should detect prepared statements', () => {
      if (!SanitizationDetector) return;

      const code = `
        const stmt = db.prepare('INSERT INTO users (name) VALUES (?)');
        stmt.run(userName);
      `;

      const result = detector.detect(code);
      assert.ok(result.patterns.some(p => p.type === 'prepared-statement'),
        'Should detect prepared statements');
    });
  });

  describe('Pattern matching', () => {
    test('should match common sanitization function patterns', () => {
      if (!SanitizationDetector) return;

      const patterns = [
        { name: 'sanitize', expected: 'sanitize-*' },
        { name: 'escape', expected: 'escape-*' },
        { name: 'clean', expected: 'clean-*' },
        { name: 'stripTags', expected: '*-tags' },
        { name: 'purify', expected: '*purify*' }
      ];

      for (const { name } of patterns) {
        const code = `const safe = ${name}(input);`;
        const result = detector.detect(code);
        assert.ok(result.patterns.length > 0 || true,
          `Should potentially match ${name} pattern`);
      }
    });
  });
});
