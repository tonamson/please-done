/**
 * Authentication Analyzer - Detects authentication patterns and vulnerabilities
 * Phase 114: Intelligence Gathering Extended (RECON-05)
 */

"use strict";

const fs = require("fs").promises;
const path = require("path");
const { parse } = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const { ReconCache } = require("./recon-cache");

/**
 * Analyzes authentication patterns and identifies vulnerabilities
 */
class AuthAnalyzer {
  /**
   * @param {Object} options - Configuration options
   * @param {ReconCache} options.cache - Cache instance for result optimization
   */
  constructor(options = {}) {
    this.cache = options.cache || new ReconCache();
    this.credentialPatterns = [];
    this.authPatterns = [];
    this.jwtVulnerabilities = [];
    this.hardcodedCredentials = [];
  }

  /**
   * Main entry point for authentication analysis
   * @param {string} projectPath - Path to project directory
   * @param {Array} targetInfo - Routes from target-enumerator.js
   * @param {Object} options - Analysis options
   * @param {string} options.tier - Reconnaissance tier
   * @returns {Promise<Object>} Analysis results
   */
  async analyze(projectPath, targetInfo, options = {}) {
    const { tier = "standard" } = options;
    this.authPatterns = [];
    this.jwtVulnerabilities = [];
    this.hardcodedCredentials = [];

    // Load credential patterns from wordlist
    await this.loadCredentialPatterns();

    // Find source files to analyze
    const sourceFiles = await this.findSourceFiles(projectPath);

    // Analyze each file for auth patterns and vulnerabilities
    for (const filePath of sourceFiles) {
      try {
        const code = await fs.readFile(filePath, "utf-8");
        const ast = this.parseAST(code, filePath);

        // Detect authentication middleware
        const fileAuthPatterns = this.detectAuthMiddleware(ast, filePath);
        this.authPatterns.push(...fileAuthPatterns);

        // Analyze JWT implementation
        const fileJwtIssues = this.analyzeJwtImplementation(ast, filePath);
        this.jwtVulnerabilities.push(...fileJwtIssues);

        // Find hardcoded credentials
        const fileCredentials = this.findHardcodedCredentials(ast, filePath);
        this.hardcodedCredentials.push(...fileCredentials);
      } catch (error) {
        // Skip files that can't be parsed
        continue;
      }
    }

    // Generate auth coverage matrix
    const coverageMatrix = this.generateAuthCoverageMatrix(
      targetInfo || [],
      this.authPatterns
    );

    return {
      authPatterns: this.authPatterns,
      jwtAnalysis: this.jwtVulnerabilities,
      hardcodedCredentials: this.hardcodedCredentials,
      coverageMatrix,
      summary: {
        totalAuthPatterns: this.authPatterns.length,
        jwtVulnerabilities: this.jwtVulnerabilities.length,
        hardcodedCredentials: this.hardcodedCredentials.length,
        protectedRoutes: coverageMatrix.protected.length,
        unprotectedRoutes: coverageMatrix.unprotected.length,
        bypassCandidates: coverageMatrix.bypassCandidates.length,
      },
    };
  }

  /**
   * Load credential patterns from wordlist file
   */
  async loadCredentialPatterns() {
    const wordlistPath = path.join(
      process.cwd(),
      "references",
      "wordlists",
      "credential-patterns.txt"
    );

    try {
      const content = await fs.readFile(wordlistPath, "utf-8");
      this.credentialPatterns = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"));
    } catch (error) {
      // Use default patterns if file not available
      this.credentialPatterns = [
        "password",
        "passwd",
        "secret",
        "api_key",
        "apikey",
        "access_token",
        "token",
        "auth_token",
        "private_key",
      ];
    }
  }

  /**
   * Parse source code into AST
   */
  parseAST(code, filePath) {
    const isTypeScript = filePath.endsWith(".ts") || filePath.endsWith(".tsx");

    return parse(code, {
      sourceType: "module",
      allowImportExportEverywhere: true,
      plugins: [
        "jsx",
        "classProperties",
        "decorators-legacy",
        "dynamicImport",
        "optionalChaining",
        "nullishCoalescingOperator",
        ...(isTypeScript ? ["typescript"] : []),
      ],
    });
  }

  /**
   * Detect authentication middleware patterns
   * @param {Object} ast - Babel AST
   * @param {string} filePath - Path to file being analyzed
   * @returns {Array} Detected auth patterns
   */
  detectAuthMiddleware(ast, filePath) {
    const patterns = [];

    traverse(ast, {
      CallExpression: (nodePath) => {
        const { callee, arguments: args } = nodePath.node;

        // Express: app.use(authMiddleware)
        if (
          callee.type === "MemberExpression" &&
          callee.property?.name === "use"
        ) {
          const middleware = args[0];
          if (middleware?.type === "Identifier") {
            const authType = this.classifyAuthMiddleware(middleware.name);
            if (authType) {
              patterns.push({
                type: authType,
                file: filePath,
                line: nodePath.node.loc?.start?.line || 0,
                pattern: "express-use",
                middleware: middleware.name,
              });
            }
          }
        }

        // JWT: jwt.verify() calls
        if (
          callee.type === "MemberExpression" &&
          callee.object?.name === "jwt" &&
          callee.property?.name === "verify"
        ) {
          patterns.push({
            type: "jwt",
            file: filePath,
            line: nodePath.node.loc?.start?.line || 0,
            pattern: "jwt-verify",
          });
        }

        // Passport: passport.authenticate()
        if (
          callee.type === "MemberExpression" &&
          callee.object?.name === "passport" &&
          callee.property?.name === "authenticate"
        ) {
          const strategyArg = args[0];
          const strategy =
            strategyArg?.type === "StringLiteral"
              ? strategyArg.value
              : "unknown";
          patterns.push({
            type: "passport",
            file: filePath,
            line: nodePath.node.loc?.start?.line || 0,
            pattern: "passport-authenticate",
            strategy,
          });
        }

        // Session: express-session middleware
        if (
          callee.type === "Identifier" &&
          callee.name === "session"
        ) {
          patterns.push({
            type: "session",
            file: filePath,
            line: nodePath.node.loc?.start?.line || 0,
            pattern: "express-session",
          });
        }

        // OAuth provider patterns
        if (
          callee.type === "MemberExpression" &&
          callee.object?.name?.match(/oauth|google|github|facebook/i)
        ) {
          patterns.push({
            type: "oauth",
            file: filePath,
            line: nodePath.node.loc?.start?.line || 0,
            pattern: "oauth-provider",
            provider: callee.object.name,
          });
        }

        // API Key: check for apiKey patterns
        if (
          callee.type === "MemberExpression" &&
          callee.object?.name?.toLowerCase().includes("apikey")
        ) {
          patterns.push({
            type: "api-key",
            file: filePath,
            line: nodePath.node.loc?.start?.line || 0,
            pattern: "api-key-middleware",
          });
        }
      },
    });

    return patterns;
  }

  /**
   * Classify authentication middleware by name
   */
  classifyAuthMiddleware(name) {
    if (!name) return null;
    const lowerName = name.toLowerCase();

    const authPatterns = [
      { pattern: /^auth/, type: "custom-auth" },
      { pattern: /jwt/, type: "jwt" },
      { pattern: /passport/, type: "passport" },
      { pattern: /session/, type: "session" },
      { pattern: /bearer/, type: "bearer-token" },
      { pattern: /api.?key/, type: "api-key" },
      { pattern: /requireauth/, type: "custom-auth" },
      { pattern: /isauth/, type: "custom-auth" },
      { pattern: /verifytoken/, type: "jwt" },
      { pattern: /checkauth/, type: "custom-auth" },
      { pattern: /authenticate/, type: "custom-auth" },
      { pattern: /protect/, type: "custom-auth" },
      { pattern: /guard/, type: "custom-auth" },
      { pattern: /basic/, type: "basic-auth" },
      { pattern: /oauth/, type: "oauth" },
    ];

    for (const { pattern, type } of authPatterns) {
      if (pattern.test(lowerName)) return type;
    }
    return null;
  }

  /**
   * Analyze JWT implementation for vulnerabilities
   * @param {Object} ast - Babel AST
   * @param {string} filePath - Path to file being analyzed
   * @returns {Array} JWT vulnerability findings
   */
  analyzeJwtImplementation(ast, filePath) {
    const vulnerabilities = [];

    traverse(ast, {
      CallExpression: (nodePath) => {
        const { callee, arguments: args } = nodePath.node;

        // Pattern: jwt.verify(token, secret) without algorithm option
        if (
          callee.type === "MemberExpression" &&
          callee.object?.name === "jwt" &&
          callee.property?.name === "verify"
        ) {
          // Check if options object with algorithms is provided
          const optionsArg = args[2]; // jwt.verify(token, secret, options)
          let hasAlgorithmPinned = false;

          if (optionsArg?.type === "ObjectExpression") {
            for (const prop of optionsArg.properties || []) {
              if (
                prop.key?.name === "algorithms" &&
                prop.value?.type === "ArrayExpression"
              ) {
                hasAlgorithmPinned = true;
                break;
              }
            }
          }

          if (!hasAlgorithmPinned) {
            vulnerabilities.push({
              type: "jwt-algorithm-not-pinned",
              severity: "HIGH",
              file: filePath,
              line: nodePath.node.loc?.start?.line || 0,
              description:
                "JWT verification without explicit algorithm pinning - vulnerable to algorithm confusion",
              remediation: 'Add { algorithms: ["RS256"] } option to jwt.verify()',
              cve: "CVE-2024-54150",
            });
          }
        }

        // Pattern: jwt.sign with sensitive data
        if (
          callee.type === "MemberExpression" &&
          callee.object?.name === "jwt" &&
          callee.property?.name === "sign"
        ) {
          const payloadArg = args[0];
          if (this.containsSensitiveData(payloadArg)) {
            vulnerabilities.push({
              type: "jwt-sensitive-payload",
              severity: "MEDIUM",
              file: filePath,
              line: nodePath.node.loc?.start?.line || 0,
              description: "JWT payload may contain sensitive data",
            });
          }
        }

        // Pattern: Algorithm confusion - dynamic algorithm selection
        if (
          callee.type === "MemberExpression" &&
          callee.object?.name === "jwt" &&
          callee.property?.name === "verify"
        ) {
          const optionsArg = args[2];
          if (optionsArg?.type === "ObjectExpression") {
            for (const prop of optionsArg.properties || []) {
              if (
                prop.key?.name === "algorithm" &&
                prop.value?.type !== "StringLiteral"
              ) {
                vulnerabilities.push({
                  type: "jwt-algorithm-confusion",
                  severity: "HIGH",
                  file: filePath,
                  line: nodePath.node.loc?.start?.line || 0,
                  description:
                    "Dynamic algorithm selection may allow algorithm confusion attacks",
                });
              }
            }
          }
        }
      },
    });

    return vulnerabilities;
  }

  /**
   * Check if AST node contains sensitive data patterns
   */
  containsSensitiveData(node) {
    if (!node) return false;

    const sensitiveKeys = [
      "password",
      "secret",
      "privateKey",
      "creditCard",
      "ssn",
      "socialSecurity",
    ];

    const code = JSON.stringify(node);
    return sensitiveKeys.some((key) =>
      code.toLowerCase().includes(key.toLowerCase())
    );
  }

  /**
   * Find hardcoded credentials in source code
   * @param {Object} ast - Babel AST
   * @param {string} filePath - Path to file being analyzed
   * @returns {Array} Credential findings
   */
  findHardcodedCredentials(ast, filePath) {
    const findings = [];

    // Filter out test files
    if (
      filePath.includes(".test.") ||
      filePath.includes(".spec.") ||
      filePath.includes("__tests__")
    ) {
      return findings;
    }

    // Build regex from credential patterns
    const credentialRegex = new RegExp(
      this.credentialPatterns.join("|"),
      "i"
    );

    traverse(ast, {
      // Pattern: const password = 'hardcoded'
      VariableDeclarator: (nodePath) => {
        const { id, init } = nodePath.node;

        if (id.type === "Identifier" && init?.type === "StringLiteral") {
          const varName = id.name;
          const varValue = init.value;

          if (credentialRegex.test(varName)) {
            // Skip placeholder values
            if (
              varValue.match(/^[*x]+$/) ||
              varValue.match(/changeme|placeholder|example|test/i)
            ) {
              return;
            }

            const credentialType = this.classifyCredentialType(varName);
            findings.push({
              type: "hardcoded-credential",
              credentialType,
              variable: varName,
              file: filePath,
              line: nodePath.node.loc?.start?.line || 0,
              severity: credentialType === "password" ? "CRITICAL" : "HIGH",
              description: `Hardcoded ${credentialType} in source code`,
            });
          }
        }
      },

      // Pattern: process.env.SECRET || 'fallback'
      LogicalExpression: (nodePath) => {
        const { operator, right } = nodePath.node;

        if (operator === "||" && right?.type === "StringLiteral") {
          const fallbackValue = right.value;

          // Skip if fallback is empty or placeholder
          if (
            !fallbackValue ||
            fallbackValue.match(/^[*x]+$/) ||
            fallbackValue.match(/changeme|placeholder|example|test/i)
          ) {
            return;
          }

          const parent = nodePath.parent;
          if (
            parent?.type === "VariableDeclarator" &&
            parent.id?.type === "Identifier"
          ) {
            const varName = parent.id.name;

            if (credentialRegex.test(varName)) {
              const credentialType = this.classifyCredentialType(varName);
              findings.push({
                type: "fallback-credential",
                credentialType,
                variable: varName,
                file: filePath,
                line: nodePath.node.loc?.start?.line || 0,
                severity: "HIGH",
                description: `Fallback ${credentialType} may expose hardcoded value`,
              });
            }
          }
        }
      },
    });

    return findings;
  }

  /**
   * Classify credential type from variable name
   */
  classifyCredentialType(varName) {
    const lowerName = varName.toLowerCase();

    if (lowerName.includes("password") || lowerName.includes("passwd"))
      return "password";
    if (lowerName.includes("secret")) return "secret";
    if (lowerName.includes("api_key") || lowerName.includes("apikey"))
      return "api-key";
    if (lowerName.includes("token")) return "token";
    if (lowerName.includes("private_key")) return "private-key";
    return "credential";
  }

  /**
   * Generate authentication coverage matrix
   * @param {Array} routes - Routes from target-enumerator.js
   * @param {Array} authPatterns - Detected auth patterns
   * @returns {Object} Coverage matrix
   */
  generateAuthCoverageMatrix(routes, authPatterns) {
    const matrix = {
      protected: [],
      unprotected: [],
      bypassCandidates: [],
      summary: {
        total: routes.length,
        protected: 0,
        unprotected: 0,
        sensitiveUnprotected: 0,
      },
    };

    // Sensitive route patterns
    const sensitivePatterns =
      /admin|user|account|password|token|api|internal|debug|config|setting/i;

    // Check if any global auth middleware exists
    const hasGlobalAuth = authPatterns.some(
      (p) => p.pattern === "express-use" && p.type !== null
    );

    for (const route of routes || []) {
      const isSensitive = sensitivePatterns.test(route.path);
      const hasRouteAuth = route.authRequired || false;

      if (hasRouteAuth || hasGlobalAuth) {
        matrix.protected.push(route);
        matrix.summary.protected++;
      } else {
        matrix.unprotected.push(route);
        matrix.summary.unprotected++;

        if (isSensitive) {
          matrix.bypassCandidates.push({
            ...route,
            bypassType: "missing-auth-on-sensitive-route",
            severity: "HIGH",
            reason: `Sensitive route ${route.path} lacks authentication`,
          });
          matrix.summary.sensitiveUnprotected++;
        }
      }
    }

    return matrix;
  }

  /**
   * Find source files to analyze
   */
  async findSourceFiles(projectPath) {
    const { glob } = require("glob");

    const patterns = [
      "**/*.{js,ts,jsx,tsx}",
      "!**/node_modules/**",
      "!**/*.test.{js,ts}",
      "!**/*.spec.{js,ts}",
      "!**/dist/**",
      "!**/build/**",
    ];

    try {
      const files = await glob(patterns, { cwd: projectPath, absolute: true });
      return files.slice(0, 100); // Limit to avoid timeout
    } catch (error) {
      return [];
    }
  }

  /**
   * Get detected auth patterns
   */
  getAuthPatterns() {
    return this.authPatterns;
  }

  /**
   * Get JWT vulnerabilities
   */
  getJwtVulnerabilities() {
    return this.jwtVulnerabilities;
  }

  /**
   * Get hardcoded credentials
   */
  getHardcodedCredentials() {
    return this.hardcodedCredentials;
  }
}

/**
 * Convenience function for standalone auth analysis
 * @param {string} projectPath - Path to project
 * @param {Array} targetInfo - Routes from target-enumerator
 * @param {Object} options - Analysis options
 * @returns {Promise<Object>} Analysis results
 */
async function generateAuthCoverageMatrix(routes, authPatterns) {
  const analyzer = new AuthAnalyzer();
  return analyzer.generateAuthCoverageMatrix(routes, authPatterns);
}

module.exports = {
  AuthAnalyzer,
  generateAuthCoverageMatrix,
};