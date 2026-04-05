/**
 * Object property taint flow fixture
 * Demonstrates taint tracking through nested object properties and array elements
 */

const { exec } = require('child_process');

/**
 * Nested object property access - taint flows through property chain
 * Source: req.body.data.nested.value
 * Sink: eval() - code injection
 */
function nestedObjectFlow(req, res) {
  // Source: Deeply nested object property
  const userCode = req.body.data?.nested?.value;

  // This is vulnerable to code injection
  try {
    // SINK: eval with user-controlled nested property
    const result = eval(userCode);
    res.json({ result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

/**
 * Array element taint - taint flows through array access
 * Source: req.query.items[0]
 * Sink: shell.exec - command injection
 */
function arrayElementFlow(req, res) {
  // Source: First array element
  const commandArg = req.query.items[0];

  // VULNERABILITY: Command injection
  // SINK: exec with user-controlled array element
  exec(`ls ${commandArg}`, (error, stdout) => {
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ output: stdout });
  });
}

/**
 * Mixed nested object and array access
 * Source: req.body.users[0].profile.settings.theme
 * Sink: dynamic import - potential RCE
 */
function mixedPropertyChain(req, res) {
  // Source: Very deep mixed access
  const moduleName = req.body.users?.[0]?.profile?.settings?.theme;

  // VULNERABILITY: Path traversal / RCE if moduleName is controlled
  // SINK: Dynamic import with user-controlled path
  import(`./themes/${moduleName}.js`)
    .then(module => {
      res.json({ theme: module.default });
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
}

/**
 * Computed property access
 * Source: req.body.fieldName determines which property to access
 */
function computedPropertyAccess(req, res) {
  const fieldName = req.body.fieldName; // e.g., "__proto__" or "constructor"
  const data = { value: "safe" };

  // VULNERABILITY: Prototype pollution if fieldName is "__proto__"
  const userValue = req.body.data[fieldName];

  // This could be used for prototype pollution
  data[fieldName] = userValue;

  res.json({ data });
}

/**
 * Bracket notation with variables
 * Source: req.query keys
 */
function bracketNotationFlow(req, res) {
  const obj = {};

  // Copying all query parameters to object
  for (const key in req.query) {
    // Source: Each query parameter value
    obj[key] = req.query[key];
  }

  // Later using in SQL
  const userId = obj['userId'];
  const db = require('./database');

  // VULNERABILITY: SQL injection
  db.query(`SELECT * FROM users WHERE id = ${userId}`, (err, results) => {
    res.json({ users: results });
  });
}

/**
 * Destructuring with taint
 * Source: req.body deeply nested destructuring
 */
function destructuringFlow(req, res) {
  // Source: Complex destructuring
  const {
    data: {
      config: { command },
      users: [firstUser]
    }
  } = req.body;

  // command and firstUser are now tainted
  // VULNERABILITY: Command injection
  exec(`${command} ${firstUser.name}`, (error, stdout) => {
    res.json({ output: stdout });
  });
}

/**
 * Optional chaining with taint
 * Source: req.body with optional chaining
 */
function optionalChainingFlow(req, res) {
  // Source: Optional chaining access
  const script = req.body?.config?.script?.code;

  if (script) {
    // VULNERABILITY: Code injection
    const result = Function(script)();
    res.json({ result });
  } else {
    res.json({ result: null });
  }
}

/**
 * Array methods with tainted data
 * Source: req.body.items array
 */
function arrayMethodsFlow(req, res) {
  // Source: Array of user inputs
  const items = req.body.items.map(item => item.value);

  // Join creates single tainted string
  const joined = items.join(',');

  // VULNERABILITY: SQL injection via joined values
  const db = require('./database');
  db.query(`INSERT INTO logs (data) VALUES ('${joined}')`, (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true });
  });
}

/**
 * Object spread with taint
 * Source: req.body spread into new object
 */
function objectSpreadFlow(req, res) {
  // Source: Spreading user data
  const config = {
    timeout: 5000,
    ...req.body.config
  };

  // VULNERABILITY: If config contains command or script
  if (config.script) {
    const result = eval(config.script);
    res.json({ result });
  } else {
    res.json({ config });
  }
}

// Taint analysis should detect:
// 1. Property access chains (a.b.c.d)
// 2. Array element access (arr[0], arr[index])
// 3. Computed property names (obj[key])
// 4. Destructuring patterns
// 5. Optional chaining (obj?.prop)
// 6. Array methods (map, filter, reduce)
// 7. Object spread/rest

module.exports = {
  nestedObjectFlow,
  arrayElementFlow,
  mixedPropertyChain,
  computedPropertyAccess,
  bracketNotationFlow,
  destructuringFlow,
  optionalChainingFlow,
  arrayMethodsFlow,
  objectSpreadFlow
};
