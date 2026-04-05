/**
 * Secret Detector Unit Tests
 * Phase 116: OSINT Intelligence (OSINT-03)
 */

"use strict";

const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert");
const {
  SecretDetector,
  SECRET_PATTERNS,
} = require("./secret-detector");

describe("SecretDetector", () => {
  let detector;

  beforeEach(() => {
    detector = new SecretDetector();
  });

  describe("constructor", () => {
    it("should initialize with default patterns", () => {
      assert.ok(detector.patterns.length > 0);
      assert.ok(detector.patterns.some((p) => p.id === "AWS_ACCESS_KEY_ID"));
    });

    it("should accept custom patterns", () => {
      const custom = [{ id: "TEST", name: "Test", pattern: /test/g, confidence: "low", category: "test" }];
      const customDetector = new SecretDetector({ patterns: custom });
      assert.strictEqual(customDetector.patterns.length, 1);
    });

    it("should read GITHUB_TOKEN from env", () => {
      process.env.GITHUB_TOKEN = "test-token";
      const envDetector = new SecretDetector();
      assert.strictEqual(envDetector.githubToken, "test-token");
      delete process.env.GITHUB_TOKEN;
    });
  });

  describe("scan", () => {
    it("should detect AWS Access Key ID", () => {
      // AKIA + 16 alphanumeric characters
      const text = "AKIAIOSFODNN7ABCDEFGHIJKLMN";
      const findings = detector.scan(text);
      assert.strictEqual(findings.length, 1);
      assert.strictEqual(findings[0].rule_id, "AWS_ACCESS_KEY_ID");
      assert.strictEqual(findings[0].confidence, "high");
    });

    it("should detect AWS Session Token", () => {
      // ASIA + 16 alphanumeric characters
      const text = "ASIAIOSFODNN7ABCDEFGHIJKLMN";
      const findings = detector.scan(text);
      assert.strictEqual(findings.length, 1);
      assert.strictEqual(findings[0].rule_id, "AWS_SECRET_ACCESS_KEY");
    });

    it("should detect GitHub PAT", () => {
      // ghp_ + 36 alphanumeric characters
      const text = "ghp_wxyz1234lmno5678pqrs9012uvwx345678yz";
      const findings = detector.scan(text);
      assert.strictEqual(findings.length, 1);
      assert.strictEqual(findings[0].rule_id, "GITHUB_PAT");
    });

    it("should detect GitHub OAuth token", () => {
      // gho_ + 36 alphanumeric characters
      const text = "gho_wxyz1234lmno5678pqrs9012uvwx345678yz";
      const findings = detector.scan(text);
      assert.strictEqual(findings.length, 1);
      assert.strictEqual(findings[0].rule_id, "GITHUB_OAUTH");
    });

    it("should detect Slack token", () => {
      const text = "xoxb-987654321098-9876543210987-AbCdEfGhIjKlMnOpQrStUvWx";
      const findings = detector.scan(text);
      assert.strictEqual(findings.length, 1);
      assert.strictEqual(findings[0].rule_id, "SLACK_TOKEN");
    });

    it("should detect JWT token", () => {
      const text = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
      const findings = detector.scan(text);
      assert.strictEqual(findings.length, 1);
      assert.strictEqual(findings[0].rule_id, "JWT_TOKEN");
      assert.strictEqual(findings[0].confidence, "medium");
    });

    it("should detect RSA private key", () => {
      const text = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA0Z3VS5JJcds3xfn/ygWyF8PbnGy0AHB7MhgwKVPSmwaFkYLv
MIIEpAIBAAKCAQEA0Z3VS5JJcds3xfn/ygWyF8PbnGy0AHB7MhgwK
-----END RSA PRIVATE KEY-----`;
      const findings = detector.scan(text);
      assert.strictEqual(findings.length, 1);
      assert.strictEqual(findings[0].rule_id, "RSA_PRIVATE_KEY");
      assert.strictEqual(findings[0].confidence, "critical");
    });

    it("should detect database URL", () => {
      const text = "postgres://user:secr3tpwd987@localhost:5432/db";
      const findings = detector.scan(text);
      assert.strictEqual(findings.length, 1);
      assert.strictEqual(findings[0].rule_id, "DATABASE_URL");
    });

    it("should detect generic API key", () => {
      const text = 'api_key = "akv8d9f7g6h5j4k3l2m1n0p9q8r7s6t5"';
      const findings = detector.scan(text);
      // Can match multiple patterns
      assert.ok(findings.length >= 1);
      assert.ok(findings.some((f) => f.rule_id === "GENERIC_API_KEY"));
    });

    it("should detect Google API key", () => {
      const text = "AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqq4HI";
      const findings = detector.scan(text);
      assert.strictEqual(findings.length, 1);
      assert.strictEqual(findings[0].rule_id, "GOOGLE_API_KEY");
    });

    it("should detect bearer token", () => {
      const text = "Authorization: bearer wxyz1234lmno5678pqrs9012";
      const findings = detector.scan(text);
      assert.strictEqual(findings.length, 1);
      assert.strictEqual(findings[0].rule_id, "BEARER_TOKEN");
    });

    it("should return empty array for empty text", () => {
      const findings = detector.scan("");
      assert.strictEqual(findings.length, 0);
    });

    it("should return empty array for null", () => {
      const findings = detector.scan(null);
      assert.strictEqual(findings.length, 0);
    });

    it("should include file path in findings", () => {
      const text = "AKIAIOSFODNN7ABCDEFGHIJKLMN";
      const findings = detector.scan(text, { filePath: "/path/to/file" });
      assert.strictEqual(findings.length, 1);
      assert.strictEqual(findings[0].file_path, "/path/to/file");
    });

    it("should calculate correct line numbers", () => {
      const text = `line1
line2
AKIAIOSFODNN7ABCDEFGHIJKLMN
line4`;
      const findings = detector.scan(text);
      assert.strictEqual(findings.length, 1);
      assert.strictEqual(findings[0].line, 3);
    });

    it("should apply line offset", () => {
      const text = "AKIAIOSFODNN7ABCDEFGHIJKLMN";
      const findings = detector.scan(text, { lineOffset: 10 });
      assert.strictEqual(findings.length, 1);
      assert.strictEqual(findings[0].line, 11);
    });

    it("should detect multiple secrets in same text", () => {
      const text = `
aws_key = "AKIAIOSFODNN7ABCDEFGHIJKLMN"
github_token = "ghp_wxyz1234lmno5678pqrs9012uvwx345678yz"
slack_token = "xoxb-987654321098-9876543210987-AbCdEfGhIjKlMnOpQrStUvWx"
      `;
      const findings = detector.scan(text);
      assert.ok(findings.length >= 3);
      assert.ok(findings.some((f) => f.rule_id === "AWS_ACCESS_KEY_ID"));
      assert.ok(findings.some((f) => f.rule_id === "GITHUB_PAT"));
      assert.ok(findings.some((f) => f.rule_id === "SLACK_TOKEN"));
    });
  });

  describe("validateFinding", () => {
    it("should filter out example placeholders", () => {
      const finding = {
        match: "AKIAEXAMPLE123456789",
        rule_id: "AWS_ACCESS_KEY_ID",
        confidence: "high",
      };
      const valid = detector.validateFinding(finding);
      assert.strictEqual(valid, false);
    });

    it("should filter out values containing 'example'", () => {
      const finding = {
        match: "this_contains_example_here",
        rule_id: "AWS_ACCESS_KEY_ID",
        confidence: "high",
      };
      const valid = detector.validateFinding(finding);
      assert.strictEqual(valid, false);
    });

    it("should filter out dummy values", () => {
      const finding = {
        match: "AKIAdummy123456789",
        rule_id: "AWS_ACCESS_KEY_ID",
        confidence: "high",
      };
      const valid = detector.validateFinding(finding);
      assert.strictEqual(valid, false);
    });

    it("should filter out repeated characters", () => {
      const finding = {
        match: "aaaaaaaaaaaaaaaaaaaa",
        rule_id: "AWS_ACCESS_KEY_ID",
        confidence: "high",
      };
      const valid = detector.validateFinding(finding);
      assert.strictEqual(valid, false);
    });

    it("should filter out sequential characters", () => {
      const finding = {
        match: "01234567890123456789",
        rule_id: "AWS_ACCESS_KEY_ID",
        confidence: "high",
      };
      const valid = detector.validateFinding(finding);
      assert.strictEqual(valid, false);
    });

    it("should accept valid findings", () => {
      const finding = {
        match: "AKIAIOSFODNN7ABCDEFGHIJKLMN",
        rule_id: "AWS_ACCESS_KEY_ID",
        confidence: "high",
      };
      const valid = detector.validateFinding(finding);
      assert.strictEqual(valid, true);
    });

    it("should reject empty findings", () => {
      const valid = detector.validateFinding(null);
      assert.strictEqual(valid, false);
    });

    it("should reject findings with empty match", () => {
      const valid = detector.validateFinding({ match: "" });
      assert.strictEqual(valid, false);
    });

    it("should reject very short matches", () => {
      const finding = {
        match: "abc",
        rule_id: "TEST",
        confidence: "high",
      };
      const valid = detector.validateFinding(finding);
      assert.strictEqual(valid, false);
    });
  });

  describe("scanFile", () => {
    it("should throw on non-existent file", async () => {
      await assert.rejects(
        async () => {
          await detector.scanFile("/nonexistent/path");
        },
        /File not found/
      );
    });
  });

  describe("scanGitHubRepo", () => {
    it("should throw without GitHub token", async () => {
      const noTokenDetector = new SecretDetector({ githubToken: null });
      delete process.env.GITHUB_TOKEN;

      await assert.rejects(
        async () => {
          await noTokenDetector.scanGitHubRepo("owner", "repo");
        },
        /GitHub token not configured/
      );
    });
  });

  describe("getPatterns", () => {
    it("should return all pattern metadata", () => {
      const patterns = detector.getPatterns();
      assert.ok(patterns.length > 0);

      for (const p of patterns) {
        assert.ok(p.id, "Should have id");
        assert.ok(p.name, "Should have name");
        assert.ok(p.confidence, "Should have confidence");
        assert.ok(p.category, "Should have category");
      }
    });

    it("should not expose regex patterns", () => {
      const patterns = detector.getPatterns();
      for (const p of patterns) {
        assert.strictEqual(p.pattern, undefined);
      }
    });
  });

  describe("getStats", () => {
    it("should calculate statistics correctly", () => {
      const findings = [
        { rule_id: "A", confidence: "high", category: "api" },
        { rule_id: "B", confidence: "high", category: "api" },
        { rule_id: "C", confidence: "medium", category: "db" },
        { rule_id: "D", confidence: "critical", category: "crypto" },
      ];

      const stats = detector.getStats(findings);

      assert.strictEqual(stats.total, 4);
      assert.strictEqual(stats.byConfidence.high, 2);
      assert.strictEqual(stats.byConfidence.medium, 1);
      assert.strictEqual(stats.byConfidence.critical, 1);
      assert.strictEqual(stats.byCategory.api, 2);
      assert.strictEqual(stats.byCategory.db, 1);
      assert.strictEqual(stats.byCategory.crypto, 1);
      assert.strictEqual(stats.criticalCount, 1);
      assert.strictEqual(stats.highConfidenceCount, 2);
    });

    it("should handle empty findings", () => {
      const stats = detector.getStats([]);

      assert.strictEqual(stats.total, 0);
      assert.strictEqual(stats.byConfidence.high, 0);
      assert.strictEqual(stats.criticalCount, 0);
      assert.deepStrictEqual(stats.byCategory, {});
    });
  });

  describe("pattern coverage", () => {
    it("should have AWS patterns", () => {
      const patterns = detector.getPatterns();
      assert.ok(patterns.some((p) => p.id === "AWS_ACCESS_KEY_ID"));
      assert.ok(patterns.some((p) => p.id === "AWS_SECRET_ACCESS_KEY"));
    });

    it("should have GitHub patterns", () => {
      const patterns = detector.getPatterns();
      assert.ok(patterns.some((p) => p.id === "GITHUB_PAT"));
      assert.ok(patterns.some((p) => p.id === "GITHUB_OAUTH"));
      assert.ok(patterns.some((p) => p.id === "GITHUB_APP_TOKEN"));
    });

    it("should have private key patterns", () => {
      const patterns = detector.getPatterns();
      assert.ok(patterns.some((p) => p.id === "RSA_PRIVATE_KEY"));
      assert.ok(patterns.some((p) => p.id === "EC_PRIVATE_KEY"));
      assert.ok(patterns.some((p) => p.id === "OPENSSH_PRIVATE_KEY"));
    });

    it("should have JWT pattern", () => {
      const patterns = detector.getPatterns();
      assert.ok(patterns.some((p) => p.id === "JWT_TOKEN"));
    });

    it("should have database patterns", () => {
      const patterns = detector.getPatterns();
      assert.ok(patterns.some((p) => p.id === "DATABASE_URL"));
    });

    it("should have Google API key pattern", () => {
      const patterns = detector.getPatterns();
      assert.ok(patterns.some((p) => p.id === "GOOGLE_API_KEY"));
    });
  });
});
