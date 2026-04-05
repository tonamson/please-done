/**
 * Unit tests for auth-analyzer.js
 * Phase 114: Intelligence Gathering Extended (RECON-05)
 */

"use strict";

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs").promises;
const os = require("os");

// Test subject
const { AuthAnalyzer, generateAuthCoverageMatrix } = require("./auth-analyzer");
const { ReconCache } = require("./recon-cache");

describe("AuthAnalyzer", () => {
  describe("constructor", () => {
    it("should accept cache parameter", () => {
      const cache = new ReconCache();
      const analyzer = new AuthAnalyzer({ cache });
      assert.strictEqual(analyzer.cache, cache);
    });

    it("should create new cache if none provided", () => {
      const analyzer = new AuthAnalyzer();
      assert.ok(analyzer.cache);
    });
  });

  describe("detectAuthMiddleware", () => {
    it("should detect Express app.use(authMiddleware) patterns", async () => {
      const analyzer = new AuthAnalyzer();
      const code = `
        const express = require('express');
        const app = express();
        const authMiddleware = require('./auth');

        app.use(authMiddleware);
        app.use(authenticateUser);
      `;
      const ast = analyzer.parseAST(code, "test.js");
      const patterns = analyzer.detectAuthMiddleware(ast, "test.js");

      assert.ok(
        patterns.some(
          (p) => p.type === "custom-auth" && p.pattern === "express-use"
        ),
        "Should detect custom auth middleware"
      );
    });

    it("should detect JWT jwt.verify() calls", async () => {
      const analyzer = new AuthAnalyzer();
      const code = `
        const jwt = require('jsonwebtoken');

        function verifyToken(token) {
          return jwt.verify(token, process.env.JWT_SECRET);
        }
      `;
      const ast = analyzer.parseAST(code, "test.js");
      const patterns = analyzer.detectAuthMiddleware(ast, "test.js");

      assert.ok(
        patterns.some(
          (p) => p.type === "jwt" && p.pattern === "jwt-verify"
        ),
        "Should detect JWT verification"
      );
    });

    it("should detect Passport passport.authenticate() calls", async () => {
      const analyzer = new AuthAnalyzer();
      const code = `
        const passport = require('passport');

        app.get('/protected',
          passport.authenticate('jwt', { session: false }),
          handler
        );
      `;
      const ast = analyzer.parseAST(code, "test.js");
      const patterns = analyzer.detectAuthMiddleware(ast, "test.js");

      assert.ok(
        patterns.some(
          (p) => p.type === "passport" && p.pattern === "passport-authenticate"
        ),
        "Should detect Passport authentication"
      );
      assert.ok(
        patterns.some((p) => p.strategy === "jwt"),
        "Should detect JWT strategy"
      );
    });

    it("should detect session middleware", async () => {
      const analyzer = new AuthAnalyzer();
      const code = `
        const session = require('express-session');

        app.use(session({ secret: 'keyboard cat' }));
      `;
      const ast = analyzer.parseAST(code, "test.js");
      const patterns = analyzer.detectAuthMiddleware(ast, "test.js");

      assert.ok(
        patterns.some(
          (p) => p.type === "session" && p.pattern === "express-session"
        ),
        "Should detect session middleware"
      );
    });
  });

  describe("analyzeJwtImplementation", () => {
    it("should flag jwt.verify() without algorithms option", async () => {
      const analyzer = new AuthAnalyzer();
      const code = `
        const jwt = require('jsonwebtoken');

        // Missing algorithms option - vulnerable!
        const decoded = jwt.verify(token, secret);
      `;
      const ast = analyzer.parseAST(code, "test.js");
      const vulns = analyzer.analyzeJwtImplementation(ast, "test.js");

      assert.ok(
        vulns.some((v) => v.type === "jwt-algorithm-not-pinned"),
        "Should flag missing algorithm pinning"
      );
      assert.ok(
        vulns.some((v) => v.severity === "HIGH"),
        "Should be HIGH severity"
      );
      assert.ok(
        vulns.some((v) => v.cve === "CVE-2024-54150"),
        "Should reference CVE-2024-54150"
      );
    });

    it("should not flag jwt.verify() with algorithms option", async () => {
      const analyzer = new AuthAnalyzer();
      const code = `
        const jwt = require('jsonwebtoken');

        // Properly configured with algorithms
        const decoded = jwt.verify(token, secret, { algorithms: ['RS256'] });
      `;
      const ast = analyzer.parseAST(code, "test.js");
      const vulns = analyzer.analyzeJwtImplementation(ast, "test.js");

      assert.strictEqual(
        vulns.filter((v) => v.type === "jwt-algorithm-not-pinned").length,
        0,
        "Should not flag when algorithms is specified"
      );
    });

    it("should detect algorithm confusion vulnerability patterns", async () => {
      const analyzer = new AuthAnalyzer();
      const code = `
        const jwt = require('jsonwebtoken');

        // Dynamic algorithm - vulnerable!
        jwt.verify(token, secret, { algorithm: getAlgorithmFromToken(token) });
      `;
      const ast = analyzer.parseAST(code, "test.js");
      const vulns = analyzer.analyzeJwtImplementation(ast, "test.js");

      assert.ok(
        vulns.some((v) => v.type === "jwt-algorithm-confusion"),
        "Should detect algorithm confusion"
      );
    });

    it("should detect sensitive data in JWT payload", async () => {
      const analyzer = new AuthAnalyzer();
      const code = `
        const jwt = require('jsonwebtoken');

        // Sensitive data in payload
        const token = jwt.sign(
          { userId: 1, password: user.password },
          secret
        );
      `;
      const ast = analyzer.parseAST(code, "test.js");
      const vulns = analyzer.analyzeJwtImplementation(ast, "test.js");

      assert.ok(
        vulns.some((v) => v.type === "jwt-sensitive-payload"),
        "Should detect sensitive payload"
      );
    });
  });

  describe("findHardcodedCredentials", () => {
    it("should detect password = 'hardcoded' patterns", async () => {
      const analyzer = new AuthAnalyzer();
      await analyzer.loadCredentialPatterns();
      const code = `
        const password = 'supersecret123';
        const dbPassword = 'db-secret';
      `;
      const ast = analyzer.parseAST(code, "test.js");
      const findings = analyzer.findHardcodedCredentials(ast, "test.js");

      assert.ok(
        findings.some(
          (f) =>
            f.type === "hardcoded-credential" && f.credentialType === "password"
        ),
        "Should detect hardcoded password"
      );
      assert.ok(
        findings.some((f) => f.severity === "CRITICAL"),
        "Password should be CRITICAL severity"
      );
    });

    it("should detect process.env.SECRET || 'fallback' patterns", async () => {
      const analyzer = new AuthAnalyzer();
      await analyzer.loadCredentialPatterns();
      const code = `
        const JWT_SECRET = process.env.JWT_SECRET || 'my-secret-key';
        const apiKey = process.env.API_KEY || 'fallback-key';
      `;
      const ast = analyzer.parseAST(code, "test.js");
      const findings = analyzer.findHardcodedCredentials(ast, "test.js");

      assert.ok(
        findings.some((f) => f.type === "fallback-credential"),
        "Should detect fallback credentials"
      );
      assert.ok(
        findings.some((f) => f.severity === "HIGH"),
        "Fallback should be HIGH severity"
      );
    });

    it("should filter out test files", async () => {
      const analyzer = new AuthAnalyzer();
      await analyzer.loadCredentialPatterns();
      const code = `
        const password = 'test-password';
      `;
      const ast = analyzer.parseAST(code, "test.js");
      const findings = analyzer.findHardcodedCredentials(
        ast,
        "auth.test.js"
      );

      assert.strictEqual(
        findings.length,
        0,
        "Should filter out test files"
      );
    });

    it("should filter out test files with .spec.js", async () => {
      const analyzer = new AuthAnalyzer();
      await analyzer.loadCredentialPatterns();
      const code = `
        const password = 'test-password';
      `;
      const ast = analyzer.parseAST(code, "test.js");
      const findings = analyzer.findHardcodedCredentials(
        ast,
        "auth.spec.js"
      );

      assert.strictEqual(
        findings.length,
        0,
        "Should filter out spec files"
      );
    });

    it("should skip placeholder values", async () => {
      const analyzer = new AuthAnalyzer();
      await analyzer.loadCredentialPatterns();
      const code = `
        const password = 'changeme';
        const secret = '***';
        const token = 'placeholder';
      `;
      const ast = analyzer.parseAST(code, "test.js");
      const findings = analyzer.findHardcodedCredentials(ast, "test.js");

      assert.strictEqual(
        findings.length,
        0,
        "Should skip placeholder values"
      );
    });
  });

  describe("generateAuthCoverageMatrix", () => {
    it("should correctly categorize protected routes", () => {
      const routes = [
        { path: "/public", authRequired: false },
        { path: "/api/users", authRequired: true },
        { path: "/admin", authRequired: true },
      ];
      const authPatterns = [{ type: "jwt", pattern: "jwt-verify" }];

      const matrix = generateAuthCoverageMatrix(routes, authPatterns);

      assert.strictEqual(matrix.protected.length, 2, "Should have 2 protected routes");
      assert.strictEqual(matrix.unprotected.length, 1, "Should have 1 unprotected route");
      assert.ok(
        matrix.protected.some((r) => r.path === "/admin"),
        "Admin should be protected"
      );
    });

    it("should identify bypassCandidates for sensitive unprotected routes", () => {
      const routes = [
        { path: "/public", authRequired: false },
        { path: "/admin/users", authRequired: false },
        { path: "/api/admin/config", authRequired: false },
        { path: "/user/profile", authRequired: false },
      ];
      const authPatterns = [];

      const matrix = generateAuthCoverageMatrix(routes, authPatterns);

      assert.ok(matrix.bypassCandidates.length > 0, "Should have bypass candidates");
      assert.ok(
        matrix.bypassCandidates.some((c) => c.path.includes("admin")),
        "Should identify admin routes as bypass candidates"
      );
      assert.ok(
        matrix.bypassCandidates.some((c) => c.severity === "HIGH"),
        "Bypass candidates should be HIGH severity"
      );
      assert.ok(
        matrix.bypassCandidates.some(
          (c) => c.bypassType === "missing-auth-on-sensitive-route"
        ),
        "Should have correct bypass type"
      );
    });

    it("should update summary correctly", () => {
      const routes = [
        { path: "/public", authRequired: false },
        { path: "/api/users", authRequired: true },
        { path: "/admin", authRequired: false },
      ];
      const authPatterns = [];

      const matrix = generateAuthCoverageMatrix(routes, authPatterns);

      assert.strictEqual(matrix.summary.total, 3);
      assert.strictEqual(matrix.summary.protected, 1);
      assert.strictEqual(matrix.summary.unprotected, 2);
      assert.strictEqual(matrix.summary.sensitiveUnprotected, 1);
    });
  });

  describe("analyze", () => {
    let tempDir;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "auth-analyzer-test-"));
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it("should return complete analysis results", async () => {
      // Create a test file
      await fs.writeFile(
        path.join(tempDir, "server.js"),
        `
        const jwt = require('jsonwebtoken');
        const express = require('express');
        const app = express();

        app.get('/public', (req, res) => res.send('public'));

        app.get('/protected', authenticateJWT, (req, res) => res.send('protected'));

        function authenticateJWT(req, res, next) {
          const token = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
          next();
        }
      `
      );

      const analyzer = new AuthAnalyzer();
      const targetInfo = [
        { path: "/public", authRequired: false },
        { path: "/protected", authRequired: true },
      ];
      const result = await analyzer.analyze(tempDir, targetInfo, {
        tier: "standard",
      });

      assert.ok(result.authPatterns, "Should have authPatterns");
      assert.ok(result.jwtAnalysis, "Should have jwtAnalysis");
      assert.ok(result.hardcodedCredentials, "Should have hardcodedCredentials");
      assert.ok(result.coverageMatrix, "Should have coverageMatrix");
      assert.ok(result.summary, "Should have summary");
    });
  });
});
