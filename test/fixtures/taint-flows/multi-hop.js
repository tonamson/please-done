/**
 * Multi-hop taint propagation fixture
 * Demonstrates taint flowing through multiple hops before reaching sink
 */

const db = require('./database');

/**
 * Vulnerable function with multi-hop taint propagation
 * Source: req.body.user.name (hop 1)
 * Hop 2: username variable
 * Hop 3: processed variable
 * Hop 4: sqlQuery construction
 * Sink: db.query() execution
 */
function processUserRequest(req, res) {
  // HOP 1: Source - untrusted user input
  const userData = req.body.user;
  const username = userData.name;

  // HOP 2: First transformation
  const processed = username.trim().toLowerCase();

  // HOP 3: Second transformation (concatenation)
  const prefixed = 'user_' + processed;

  // HOP 4: Query construction
  const sqlQuery = `
    SELECT * FROM users
    WHERE username = '${prefixed}'
    AND active = 1
  `;

  // SINK: SQL execution
  db.query(sqlQuery, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ users: results });
  });
}

/**
 * Another vulnerable pattern - nested function calls
 * Source: req.body.data
 */
function processNested(req, res) {
  // HOP 1: Source
  const rawData = req.body.data;

  // HOP 2: Function call
  const validated = validateInput(rawData);

  // HOP 3: Another function call
  const transformed = transformData(validated);

  // HOP 4: Yet another function
  const finalData = prepareForStorage(transformed);

  // SINK: Command execution
  const { exec } = require('child_process');
  exec(`process-data --input "${finalData}"`, (error, stdout) => {
    res.json({ output: stdout });
  });
}

/**
 * Helper functions (these don't sanitize, just transform)
 */
function validateInput(input) {
  // This only checks length, doesn't sanitize
  if (input.length > 100) {
    throw new Error('Input too long');
  }
  return input;
}

function transformData(data) {
  // Transform but don't sanitize
  return data.replace(/\s+/g, ' ');
}

function prepareForStorage(data) {
  // Just wrap in quotes, not safe
  return `"${data}"`;
}

/**
 * Complex multi-hop with object property access
 */
function complexFlow(req, res) {
  // HOP 1: Source from nested object
  const userInput = req.body.settings?.configuration?.query;

  // HOP 2: Destructuring
  const { query, params } = { query: userInput, params: req.body.params };

  // HOP 3: Array processing
  const parts = [query, 'ORDER BY', 'id'];
  const assembled = parts.join(' ');

  // HOP 4: Template string
  const finalQuery = `SELECT * FROM data WHERE ${assembled}`;

  // HOP 5: Passed to another function
  executeQuery(finalQuery, res);
}

function executeQuery(query, res) {
  // Final sink after multiple hops
  const db = require('./database');
  db.query(query, (err, results) => {
    res.json(results);
  });
}

// Taint flow analysis should detect:
// 1. At least 3 hops before reaching sink
// 2. Both SQL injection and command injection patterns
// 3. Nested object property access
// 4. Array element propagation

module.exports = {
  processUserRequest,
  processNested,
  complexFlow
};
