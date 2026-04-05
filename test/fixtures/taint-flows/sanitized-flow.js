/**
 * Sanitized taint flow fixture
 * Demonstrates both sanitized (safe) and unsanitized (vulnerable) patterns
 */

const db = require('./database');
const validator = require('validator');

/**
 * SAFE pattern: Sanitization stops taint propagation
 * Source: req.body.email
 * Sanitizer: validator.normalizeEmail()
 * Sink: SQL query (now safe)
 */
function sanitizedEmailQuery(req, res) {
  // Source
  const userEmail = req.body.email;

  // SANITIZER: Email normalization removes dangerous characters
  const safeEmail = validator.normalizeEmail(userEmail);

  // Sanitized data can be safely used in queries
  const query = 'SELECT * FROM users WHERE email = ?';

  // Sink with parameterized query (double safety)
  db.query(query, [safeEmail], (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
      return;
    }
    res.json({ users: results });
  });
}

/**
 * UNSAFE pattern: No sanitization
 * Source: req.body.comment
 * Sink: XSS vulnerable
 */
function unsanitizedXSS(req, res) {
  // Source
  const comment = req.body.comment;

  // Directly used without sanitization
  // VULNERABILITY: XSS if comment contains <script> tags
  res.send(`
    <div class="comment">
      ${comment}
    </div>
  `);
}

/**
 * SAFE pattern: HTML escaping
 * Source: req.body.description
 * Sanitizer: manual HTML entity encoding
 * Sink: HTML response
 */
function sanitizedHTML(req, res) {
  // Source
  const rawDescription = req.body.description;

  // SANITIZER: Manual HTML entity encoding
  const escapedDescription = rawDescription
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  // Safe to use in HTML
  res.send(`
    <div class="description">
      ${escapedDescription}
    </div>
  `);
}

/**
 * PARTIALLY SAFE: Some fields sanitized, others not
 */
function mixedSanitization(req, res) {
  // Source 1: Sanitized
  const rawName = req.body.name;
  const safeName = validator.escape(rawName);

  // Source 2: NOT sanitized (vulnerable!)
  const bio = req.body.bio; // VULNERABLE

  res.send(`
    <div class="profile">
      <h1>${safeName}</h1>
      <p>${bio}</p>
    </div>
  `);
}

/**
 * SAFE pattern: Joi validation
 * Source: req.body.userData
 * Sanitizer: Joi schema validation
 * Sink: Database insert
 */
const Joi = require('joi');

const userSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  age: Joi.number().integer().min(0).max(150),
  email: Joi.string().email()
});

function joiValidatedInsert(req, res) {
  // Source
  const userData = req.body.userData;

  // SANITIZER: Joi validation with strict schema
  const { error, value } = userSchema.validate(userData);

  if (error) {
    res.status(400).json({ error: 'Invalid input' });
    return;
  }

  // Safe to use validated value
  db.query(
    'INSERT INTO users (username, age, email) VALUES (?, ?, ?)',
    [value.username, value.age, value.email],
    (err) => {
      if (err) {
        res.status(500).json({ error: 'Database error' });
        return;
      }
      res.json({ success: true, user: value });
    }
  );
}

/**
 * SAFE pattern: Zod parsing
 * Source: req.body.config
 * Sanitizer: Zod schema parsing
 * Sink: Config processing
 */
const { z } = require('zod');

const configSchema = z.object({
  host: z.string().regex(/^[a-zA-Z0-9.-]+$/),
  port: z.number().int().min(1).max(65535),
  secure: z.boolean()
});

function zodValidatedConfig(req, res) {
  // Source
  const rawConfig = req.body.config;

  // SANITIZER: Zod schema parsing
  const result = configSchema.safeParse(rawConfig);

  if (!result.success) {
    res.status(400).json({ error: 'Invalid config' });
    return;
  }

  // Safe to use parsed config
  const safeConfig = result.data;
  res.json({ config: safeConfig });
}

/**
 * UNSAFE pattern: Wrong sanitization for context
 * Using SQL escaping for HTML context
 */
function wrongSanitizationType(req, res) {
  // Source
  const content = req.body.content;

  // WRONG SANITIZER: SQL escaping doesn't protect against XSS
  const sqlEscaped = content.replace(/'/g, "''");

  // Still vulnerable to XSS!
  res.send(`<div>${sqlEscaped}</div>`);
}

// Export both variants for testing
module.exports = {
  // Safe patterns
  sanitizedEmailQuery,
  sanitizedHTML,
  joiValidatedInsert,
  zodValidatedConfig,

  // Vulnerable patterns
  unsanitizedXSS,
  mixedSanitization,
  wrongSanitizationType
};
