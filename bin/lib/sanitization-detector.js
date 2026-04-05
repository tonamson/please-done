/**
 * Sanitization Detector - Identifies validation and sanitization patterns
 * Phase 115: Advanced Reconnaissance - RECON-07 (D-09)
 *
 * Detects validation libraries, sanitization functions, and parameterized queries
 * to identify where taint propagation should stop.
 */

const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

/**
 * Detects sanitization and validation patterns in code
 */
class SanitizationDetector {
  constructor(options = {}) {
    this.validationLibraries = new Set([
      'joi', 'yup', 'zod', 'validator', 'express-validator', 'class-validator',
      'ajv', 'jsonschema', 'validate.js', 'schema-inspector'
    ]);
    this.sanitizationFunctions = new Map(); // Track detected sanitizers
    this.sanitizationPoints = []; // Points where taint is sanitized
    this.riskScoring = {
      critical: ['sql-execution', 'command-execution', 'eval', 'function-constructor'],
      high: ['xss', 'setTimeout-string', 'setInterval-string'],
      medium: ['file-system'],
      low: ['logging', 'res.send']
    };
  }

  /**
   * Check if a function name indicates sanitization
   * @param {string} name - Function name to check
   * @returns {boolean}
   */
  isSanitizationFunction(name) {
    if (!name || typeof name !== 'string') return false;

    const patterns = [
      // Named sanitizers
      { pattern: /^sanitize/i, type: 'named' },
      { pattern: /^validate/i, type: 'named' },
      { pattern: /^escape/i, type: 'named' },
      { pattern: /^encode/i, type: 'named' },
      { pattern: /^clean/i, type: 'named' },
      { pattern: /^purify/i, type: 'named' },
      { pattern: /^normalize/i, type: 'named' },
      { pattern: /^strip/i, type: 'named' },
      { pattern: /^trim/i, type: 'named' },

      // Built-in encoding
      { pattern: /^encodeURIComponent$/, type: 'builtin' },
      { pattern: /^encodeURI$/, type: 'builtin' },
      { pattern: /^htmlspecialchars$/i, type: 'builtin' },
      { pattern: /^htmlentities$/i, type: 'builtin' },

      // Framework-specific
      { pattern: /^DOMPurify/i, type: 'library' },
      { pattern: /^he\.encode/i, type: 'library' },
      { pattern: /^xss\.filter/i, type: 'library' },
      { pattern: /^bleach\.clean/i, type: 'library' },

      // ORM parameterized
      { pattern: /^\.validate$/i, type: 'orm' },
      { pattern: /^\.sanitize$/i, type: 'orm' },

      // SQL escaping
      { pattern: /escape/i, type: 'sql' },
      { pattern: /mysql_real_escape_string/i, type: 'sql' },
      { pattern: /pg_escape/i, type: 'sql' }
    ];

    return patterns.some(({ pattern }) => pattern.test(name));
  }

  /**
   * Analyze AST to detect if a call expression is a validation library call
   * @param {Object} path - Babel path object
   * @returns {Object|null} Validation info if detected, null otherwise
   */
  isValidationLibraryCall(path) {
    if (!path || !path.node) return null;

    const { callee } = path.node;
    if (!callee) return null;

    // Handle different validation library patterns

    // Joi: Joi.string().email().validate()
    if (this.isJoiValidation(path)) {
      return {
        library: 'joi',
        type: 'joi-validation',
        confidence: 'high'
      };
    }

    // Yup: yup.string().required().validate()
    if (this.isYupValidation(path)) {
      return {
        library: 'yup',
        type: 'yup-validation',
        confidence: 'high'
      };
    }

    // Zod: z.string().email().parse()
    if (this.isZodValidation(path)) {
      return {
        library: 'zod',
        type: 'zod-validation',
        confidence: 'high'
      };
    }

    // express-validator: body('email').isEmail()
    if (this.isExpressValidator(path)) {
      return {
        library: 'express-validator',
        type: 'express-validator',
        confidence: 'high'
      };
    }

    // class-validator decorators
    if (this.isClassValidator(path)) {
      return {
        library: 'class-validator',
        type: 'class-validator',
        confidence: 'medium'
      };
    }

    // validator.js functions
    if (this.isValidatorJs(path)) {
      return {
        library: 'validator',
        type: 'validator-js',
        confidence: 'high'
      };
    }

    // Ajv JSON schema validation
    if (this.isAjvValidation(path)) {
      return {
        library: 'ajv',
        type: 'ajv-validation',
        confidence: 'high'
      };
    }

    return null;
  }

  /**
   * Detect Joi validation pattern
   */
  isJoiValidation(path) {
    const code = path.toString();
    const callee = path.node.callee;

    // Check for Joi. patterns
    if (callee.type === 'MemberExpression') {
      const objectChain = this.getMemberChain(callee);
      if (objectChain.includes('Joi') || objectChain.includes('joi')) {
        // Check for validation methods
        const validationMethods = ['validate', 'validateAsync', 'assert', 'attempt'];
        if (validationMethods.some(m => objectChain.endsWith(m))) {
          return true;
        }
        // Check for chain methods that imply validation
        const chainMethods = ['string', 'number', 'boolean', 'array', 'object', 'email', 'alphanum'];
        if (chainMethods.some(m => objectChain.includes(m))) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Detect Yup validation pattern
   */
  isYupValidation(path) {
    const callee = path.node.callee;
    const code = path.toString();

    // Check for yup. patterns
    if (callee.type === 'MemberExpression') {
      const objectChain = this.getMemberChain(callee);
      if (objectChain.startsWith('yup.') || code.includes('yup.')) {
        const validationMethods = ['validate', 'validateSync', 'isValid', 'isValidSync'];
        if (validationMethods.some(m => objectChain.endsWith(m))) {
          return true;
        }
        // Schema building methods
        const schemaMethods = ['string', 'number', 'boolean', 'array', 'object', 'mixed'];
        if (schemaMethods.some(m => objectChain.includes(m))) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Detect Zod validation pattern
   */
  isZodValidation(path) {
    const callee = path.node.callee;
    const code = path.toString();

    if (callee.type === 'MemberExpression') {
      const objectChain = this.getMemberChain(callee);

      // z.parse(), z.string().parse(), etc.
      if (objectChain.startsWith('z.') || code.match(/\bz\b/)) {
        const validationMethods = ['parse', 'parseAsync', 'safeParse', 'safeParseAsync'];
        if (validationMethods.some(m => objectChain.endsWith(m))) {
          return true;
        }
        // Schema methods
        const schemaMethods = ['string', 'number', 'boolean', 'array', 'object', 'enum'];
        if (schemaMethods.some(m => objectChain.includes(m))) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Detect express-validator pattern
   */
  isExpressValidator(path) {
    const callee = path.node.callee;

    if (callee.type === 'CallExpression') {
      // body('field'), param('id'), query('search'), etc.
      const innerCallee = callee.callee;
      if (innerCallee?.type === 'Identifier') {
        const validatorFunctions = ['body', 'param', 'query', 'header', 'cookie'];
        if (validatorFunctions.includes(innerCallee.name)) {
          return true;
        }
      }
    }

    // Check for chained validation methods
    if (callee.type === 'MemberExpression') {
      const objectChain = this.getMemberChain(callee);
      const validationMethods = [
        'isEmail', 'isURL', 'isAlphanumeric', 'isNumeric', 'isUUID',
        'isLength', 'isIn', 'matches', 'custom', 'escape', 'trim'
      ];
      if (validationMethods.some(m => objectChain.includes(m))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Detect class-validator decorators
   */
  isClassValidator(path) {
    // Check for decorator usage
    const code = path.toString();
    const decoratorPattern = /@(IsString|IsNumber|IsEmail|IsOptional|Validate|ValidateNested)/;
    return decoratorPattern.test(code);
  }

  /**
   * Detect validator.js usage
   */
  isValidatorJs(path) {
    const callee = path.node.callee;

    if (callee.type === 'Identifier') {
      const validatorFunctions = [
        'isEmail', 'isURL', 'isIP', 'isFQDN', 'isBoolean', 'isAlpha', 'isAlphanumeric',
        'isNumeric', 'isPort', 'isLowercase', 'isUppercase', 'isAscii', 'isBase64',
        'isCreditCard', 'isCurrency', 'isDataURI', 'isDecimal', 'isDivisibleBy',
        'isHash', 'isHexColor', 'isHexadecimal', 'isJSON', 'isJWT', 'isLatLong',
        'isLength', 'isMACAddress', 'isMD5', 'isMimeType', 'isMobilePhone',
        'isMongoId', 'isMultibyte', 'isPostalCode', 'isSemver', 'isUUID',
        'isWhitelisted', 'isSlug', 'escape', 'unescape', 'stripLow', 'whitelist',
        'blacklist', 'normalizeEmail', 'toBoolean', 'toDate', 'toFloat', 'toInt',
        'toString', 'trim', 'ltrim', 'rtrim'
      ];
      return validatorFunctions.includes(callee.name);
    }

    // Check for validator. prefix
    if (callee.type === 'MemberExpression') {
      const objectChain = this.getMemberChain(callee);
      if (objectChain.startsWith('validator.')) {
        return true;
      }
    }

    return false;
  }

  /**
   * Detect Ajv JSON schema validation
   */
  isAjvValidation(path) {
    const callee = path.node.callee;
    const code = path.toString();

    if (callee.type === 'MemberExpression') {
      const objectChain = this.getMemberChain(callee);
      if (objectChain.includes('ajv') || objectChain.includes('validate')) {
        if (code.includes('compile') || code.includes('validate')) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get member expression chain as string
   */
  getMemberChain(node) {
    if (node.type === 'Identifier') {
      return node.name;
    }
    if (node.type === 'MemberExpression') {
      const object = this.getMemberChain(node.object);
      const property = node.property?.name || node.property?.value || '';
      return `${object}.${property}`;
    }
    if (node.type === 'CallExpression') {
      const callee = this.getMemberChain(node.callee);
      return `${callee}()`;
    }
    return '';
  }

  /**
   * Check if a database query uses parameterized queries (safe)
   * @param {Object} path - Babel path
   * @returns {Object|null} Info about parameterized query
   */
  isParameterizedQuery(path) {
    if (!path || !path.node) return null;

    const { callee, arguments: args } = path.node;
    const code = path.toString();

    // Sequelize: Model.findOne({ where: { ... } })
    if (code.includes('where:') && code.includes('replacements:')) {
      return { type: 'parameterized', library: 'sequelize', confidence: 'high' };
    }

    // Sequelize raw query with replacements
    if (callee?.type === 'MemberExpression') {
      const chain = this.getMemberChain(callee);
      if (chain.includes('sequelize') || chain.includes('query')) {
        // Check for replacements option
        const lastArg = args[args.length - 1];
        if (lastArg?.type === 'ObjectExpression') {
          const hasReplacements = lastArg.properties?.some(
            p => p.key?.name === 'replacements' || p.key?.name === 'bind'
          );
          if (hasReplacements) {
            return { type: 'parameterized', library: 'sequelize', confidence: 'high' };
          }
        }

        // Check for ? placeholders (prepared statements)
        const queryArg = args[0];
        if (queryArg?.type === 'StringLiteral' && queryArg.value.includes('?')) {
          return { type: 'parameterized', library: 'sequelize', confidence: 'medium' };
        }
      }
    }

    // MySQL/PostgreSQL parameterized
    if (args.length >= 2) {
      const queryArg = args[0];
      const valuesArg = args[1];

      if (queryArg?.type === 'StringLiteral' &&
          (queryArg.value.includes('?') || queryArg.value.includes('$1'))) {
        if (valuesArg?.type === 'ArrayExpression') {
          return { type: 'parameterized', library: 'mysql/pg', confidence: 'high' };
        }
      }
    }

    // Prisma ORM
    if (code.includes('prisma.') && code.includes('where:')) {
      return { type: 'orm-safe', library: 'prisma', confidence: 'high' };
    }

    return null;
  }

  /**
   * Analyze a function body to determine if it sanitizes input
   * @param {Object} ast - Function AST
   * @param {string} paramName - Parameter to check
   * @returns {Object} Sanitization analysis result
   */
  analyzeFunctionSanitization(ast, paramName) {
    let returnsInput = false;
    let returnsNewValue = false;
    let hasModification = false;
    let sanitizationPattern = null;

    traverse(ast, {
      ReturnStatement(path) {
        const argument = path.node.argument;
        if (!argument) return;

        // Direct return of parameter: function(x) { return x; } - NOT sanitized
        if (argument.type === 'Identifier' && argument.name === paramName) {
          returnsInput = true;
        }
        // Return of modified value: function(x) { return sanitize(x); } - SANITIZED
        else {
          returnsNewValue = true;
        }
      },

      AssignmentExpression(path) {
        // Check if parameter is modified
        const left = path.node.left;
        if (left.type === 'Identifier' && left.name === paramName) {
          hasModification = true;
        }
      },

      CallExpression(path) {
        // Check for sanitization calls
        const callee = path.node.callee;
        if (callee.type === 'Identifier' && this.isSanitizationFunction(callee.name)) {
          sanitizationPattern = callee.name;
        }
      }
    });

    return {
      isSanitizationFunction: returnsNewValue || sanitizationPattern !== null,
      returnsInput,
      returnsNewValue,
      hasModification,
      sanitizationPattern,
      confidence: sanitizationPattern ? 'high' : (returnsNewValue ? 'medium' : 'low')
    };
  }

  /**
   * Track sanitization of a variable
   * @param {string} variable - Variable name
   * @param {Object} sanitizer - Sanitization info
   */
  trackSanitization(variable, sanitizer) {
    const point = {
      variable,
      sanitizer,
      timestamp: Date.now()
    };

    this.sanitizationPoints.push(point);
    this.sanitizationFunctions.set(variable, sanitizer);
  }

  /**
   * Get all recorded sanitization points
   * @returns {Array} Sanitization points
   */
  getSanitizationReport() {
    return {
      points: this.sanitizationPoints,
      functions: Array.from(this.sanitizationFunctions.entries()),
      summary: {
        totalSanitizations: this.sanitizationPoints.length,
        uniqueVariables: new Set(this.sanitizationPoints.map(p => p.variable)).size
      }
    };
  }

  /**
   * Detect if taint flow should stop at this point
   * @param {Object} path - Babel path
   * @param {string} variableName - Variable being tracked
   * @returns {Object} Decision about taint propagation
   */
  shouldStopTaint(path, variableName) {
    // Check for validation library calls
    const validation = this.isValidationLibraryCall(path);
    if (validation) {
      return {
        stop: true,
        reason: 'validation-library',
        details: validation
      };
    }

    // Check for parameterized queries
    const parameterized = this.isParameterizedQuery(path);
    if (parameterized) {
      return {
        stop: true,
        reason: 'parameterized-query',
        details: parameterized
      };
    }

    // Check for sanitization functions
    if (path.node?.callee) {
      const calleeName = this.getMemberChain(path.node.callee);
      if (this.isSanitizationFunction(calleeName)) {
        return {
          stop: true,
          reason: 'sanitization-function',
          details: { function: calleeName }
        };
      }
    }

    return { stop: false };
  }

  /**
   * Detect sanitization patterns in code string
   * @param {string} code - Source code to analyze
   * @returns {Object} Detection results with patterns array
   */
  detect(code) {
    if (!code || typeof code !== 'string') {
      return { patterns: [] };
    }

    const patterns = [];
    const self = this;

    try {
      const ast = parse(code, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        plugins: [
          'jsx',
          'classProperties',
          'decorators-legacy',
          'dynamicImport',
          'optionalChaining',
          'nullishCoalescingOperator'
        ]
      });

      traverse(ast, {
        CallExpression(path) {
          const node = path.node;
          const callee = node.callee;

          // Check for validation library calls
          const validation = self.isValidationLibraryCall(path);
          if (validation) {
            patterns.push({
              type: validation.type || 'validation-library',
              library: validation.library,
              confidence: validation.confidence,
              location: self.getLocation(path)
            });
            return;
          }

          // Check for parameterized queries
          const parameterized = self.isParameterizedQuery(path);
          if (parameterized) {
            patterns.push({
              type: 'parameterized-query',
              library: parameterized.library,
              confidence: parameterized.confidence,
              location: self.getLocation(path)
            });
            return;
          }

          // Check for sanitization functions
          if (callee) {
            const calleeName = self.getMemberChain(callee);
            if (self.isSanitizationFunction(calleeName)) {
              patterns.push({
                type: 'manual-sanitization',
                function: calleeName,
                confidence: 'medium',
                location: self.getLocation(path)
              });
            }
          }
        },

        MemberExpression(path) {
          // Check for regex-based sanitization like str.replace(/pattern/, '')
          const node = path.node;
          if (node.property?.name === 'replace') {
            const parent = path.parent;
            if (parent?.type === 'CallExpression') {
              const args = parent.arguments;
              if (args.length >= 2 && args[0]?.type === 'RegExpLiteral') {
                patterns.push({
                  type: 'regex-sanitization',
                  confidence: 'medium',
                  location: self.getLocation(path)
                });
              }
            }
          }
        },

        // Detect whitelist validation patterns
        IfStatement(path) {
          const test = path.node.test;
          if (test?.type === 'CallExpression' &&
              test.callee?.property?.name === 'test') {
            const object = test.callee.object;
            if (object?.type === 'RegExpLiteral') {
              patterns.push({
                type: 'whitelist-validation',
                confidence: 'low',
                location: self.getLocation(path)
              });
            }
          }
        }
      });

    } catch (error) {
      // Parse error - return empty patterns
      return { patterns: [] };
    }

    return { patterns };
  }

  /**
   * Get location information from a path
   * @param {Object} path - Babel path
   * @returns {Object} Location info
   */
  getLocation(path) {
    const loc = path.node?.loc;
    return {
      line: loc?.start?.line || 0,
      column: loc?.start?.column || 0
    };
  }

  /**
   * Calculate risk for a flow with potential sanitization
   * @param {Object} source - Taint source
   * @param {Object} sink - Taint sink
   * @param {boolean} isSanitized - Whether sanitization occurred
   * @returns {Object} Risk assessment
   */
  assessRisk(source, sink, isSanitized) {
    const riskLevels = { low: 1, medium: 2, high: 3, critical: 4 };

    // Critical sinks
    if (this.riskScoring.critical.includes(sink.type)) {
      if (!isSanitized) {
        return {
          level: 'critical',
          score: 4,
          description: `Unsanitized ${source.type} reaches ${sink.type} sink`,
          recommendation: 'Add sanitization or use parameterized queries'
        };
      }
      return {
        level: 'medium',
        score: 2,
        description: `Sanitized ${source.type} reaches ${sink.type} sink`,
        recommendation: 'Verify sanitization is complete'
      };
    }

    // High-risk sinks
    if (this.riskScoring.high.includes(sink.type)) {
      if (!isSanitized) {
        return {
          level: 'high',
          score: 3,
          description: `Unsanitized ${source.type} reaches ${sink.type} sink`,
          recommendation: 'Add output encoding or sanitization'
        };
      }
      return {
        level: 'low',
        score: 1,
        description: `Sanitized ${source.type} reaches ${sink.type} sink`,
        recommendation: 'Review sanitization effectiveness'
      };
    }

    // Medium and low risk
    const baseLevel = this.riskScoring.medium.includes(sink.type) ? 'medium' : 'low';
    return {
      level: baseLevel,
      score: riskLevels[baseLevel],
      description: `${source.type} reaches ${sink.type} sink`,
      recommendation: 'Review for completeness'
    };
  }

  /**
   * Reset detector state
   */
  reset() {
    this.sanitizationFunctions.clear();
    this.sanitizationPoints = [];
  }
}

/**
 * Standalone function to check if a function is a sanitizer
 * @param {string} name - Function name
 * @returns {boolean}
 */
function isSanitizationFunction(name) {
  const detector = new SanitizationDetector();
  return detector.isSanitizationFunction(name);
}

/**
 * Standalone function to track sanitization
 * @param {string} variable - Variable name
 * @param {Object} sanitizer - Sanitizer info
 * @returns {Object} Sanitization record
 */
function trackSanitization(variable, sanitizer) {
  return {
    variable,
    sanitizer,
    timestamp: Date.now(),
    tainted: false
  };
}

module.exports = {
  SanitizationDetector,
  isSanitizationFunction,
  trackSanitization
};
