/**
 * Unit tests for taint-engine.js
 * Phase 115: Advanced Reconnaissance (RECON-07)
 */

"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert");

// Test subject
const { TaintEngine } = require("./taint-engine");
const { ReconCache } = require("./recon-cache");

// ─── Mock Code Fixtures ─────────────────────────────────────

// Fixture 1 - Simple taint flow
const fixtureSimpleTaint = `
app.get('/user', (req, res) => {
  const userId = req.query.id;
  db.query('SELECT * FROM users WHERE id = ?', [userId]);
});
`;

// Fixture 2 - Sanitized taint flow
const fixtureSanitized = `
app.post('/user', (req, res) => {
  const email = req.body.email;
  if (!validator.isEmail(email)) return res.status(400).send();
  db.query('INSERT INTO users (email) VALUES (?)', [email]);
});
`;

// Fixture 3 - Inter-procedural taint
const fixtureInterProcedural = `
function getUserId(req) {
  return req.query.id;
}

function processUser(userId) {
  db.query('SELECT * FROM users WHERE id = ?', [userId]);
}

app.get('/user', (req, res) => {
  const id = getUserId(req);
  processUser(id);
});
`;

// Fixture 4 - Multiple sinks with mixed sanitization
const fixtureMixedSanitization = `
app.post('/submit', (req, res) => {
  const data = req.body.data;
  const clean = validator.isInt(data) ? parseInt(data) : 0;
  eval('console.log(' + data + ')');
  db.query('INSERT INTO logs VALUES (?)', [clean]);
});
`;

// ─── Tests ──────────────────────────────────────────────────

describe("TaintEngine", () => {
  describe("constructor", () => {
    it("should accept cache parameter", () => {
      const cache = new ReconCache();
      const engine = new TaintEngine({ cache });
      assert.strictEqual(engine.cache, cache);
    });

    it("should create new cache if none provided", () => {
      const engine = new TaintEngine();
      assert.ok(engine.cache);
    });

    it("should create SourceMapper instance", () => {
      const engine = new TaintEngine();
      assert.ok(engine.sourceMapper);
    });
  });

  describe("analyze", () => {
    it("should analyze file and return taint results", async () => {
      const engine = new TaintEngine();
      const fs = require("fs").promises;
      const os = require("os");
      const path = require("path");

      // Create temp file
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "taint-test-"));
      const tmpFile = path.join(tmpDir, "test.js");
      await fs.writeFile(tmpFile, fixtureSimpleTaint);

      try {
        const result = await engine.analyze(tmpFile);
        assert.ok(result.sources);
        assert.ok(result.sinks);
        assert.ok(result.summary);
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });

    it("should include sanitizationEdges in result", async () => {
      const engine = new TaintEngine();
      const fs = require("fs").promises;
      const os = require("os");
      const path = require("path");

      // Create temp file
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "taint-test-"));
      const tmpFile = path.join(tmpDir, "test.js");
      await fs.writeFile(tmpFile, fixtureSanitized);

      try {
        const result = await engine.analyze(tmpFile);
        assert.ok(Array.isArray(result.sanitizationEdges));
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });

    it("should use cache when available", async () => {
      const cache = new ReconCache();
      const engine = new TaintEngine({ cache });
      const fs = require("fs").promises;
      const os = require("os");
      const path = require("path");

      // Create temp file
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "taint-test-"));
      const tmpFile = path.join(tmpDir, "test.js");
      await fs.writeFile(tmpFile, fixtureSimpleTaint);

      try {
        // First call
        const result1 = await engine.analyze(tmpFile);
        // Second call should use cache
        const result2 = await engine.analyze(tmpFile);
        assert.deepStrictEqual(result1.summary, result2.summary);
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe("buildDataFlowGraph", () => {
    it("should generate valid Mermaid flowchart syntax", () => {
      const engine = new TaintEngine();
      const sources = [
        { type: "req.query", location: { line: 1 } }
      ];
      const sinks = [
        { type: "sql.query", risk: "high", code: "db.query()", location: { line: 3 } }
      ];
      const sanitizationEdges = new Map();

      const result = engine.buildDataFlowGraph(sources, sinks, sanitizationEdges);
      assert.ok(result.graph.includes("flowchart TD"));
      assert.ok(result.graph.includes("S0"));
      assert.ok(result.graph.includes("K0"));
    });

    it("should include source nodes with S prefix", () => {
      const engine = new TaintEngine();
      const sources = [
        { type: "req.body", location: { line: 1 } },
        { type: "req.query", location: { line: 2 } }
      ];
      const sinks = [
        { type: "sql.query", risk: "high", code: "db.query()", location: { line: 3 } }
      ];
      const sanitizationEdges = new Map();

      const result = engine.buildDataFlowGraph(sources, sinks, sanitizationEdges);
      assert.ok(result.graph.includes("S0"));
      assert.ok(result.graph.includes("S1"));
    });

    it("should include sink nodes with K prefix", () => {
      const engine = new TaintEngine();
      const sources = [
        { type: "req.body", location: { line: 1 } }
      ];
      const sinks = [
        { type: "sql.query", risk: "high", code: "db.query()", location: { line: 2 } },
        { type: "eval", risk: "critical", code: "eval()", location: { line: 3 } }
      ];
      const sanitizationEdges = new Map();

      const result = engine.buildDataFlowGraph(sources, sinks, sanitizationEdges);
      assert.ok(result.graph.includes("K0"));
      assert.ok(result.graph.includes("K1"));
    });

    it("should mark sanitized edges with --sanitized-->", () => {
      const engine = new TaintEngine();
      const sources = [
        { type: "req.body", location: { line: 1 } }
      ];
      const sinks = [
        { type: "sql.query", risk: "high", code: "db.query()", location: { line: 3 } }
      ];
      const sanitizationEdges = new Map();
      sanitizationEdges.set("0-db.query()", {
        sanitized: true,
        sanitizer: "validator.isEmail",
        location: { file: "test.js", line: 2 }
      });

      const result = engine.buildDataFlowGraph(sources, sinks, sanitizationEdges);
      assert.ok(result.graph.includes("--sanitized-->"));
    });

    it("should return { graph, valid, errors, warnings }", () => {
      const engine = new TaintEngine();
      const sources = [
        { type: "req.body", location: { line: 1 } }
      ];
      const sinks = [
        { type: "sql.query", risk: "high", code: "db.query()", location: { line: 2 } }
      ];
      const sanitizationEdges = new Map();

      const result = engine.buildDataFlowGraph(sources, sinks, sanitizationEdges);
      assert.ok(typeof result.graph === "string");
      assert.ok(typeof result.valid === "boolean");
      assert.ok(Array.isArray(result.errors));
      assert.ok(Array.isArray(result.warnings));
    });
  });

  describe("buildTaintPaths", () => {
    it("should build paths from sanitizationEdges", () => {
      const engine = new TaintEngine();
      const sources = [
        { type: "req.body", variable: "body", location: { line: 1 } },
        { type: "req.query", variable: "query", location: { line: 2 } }
      ];
      const sinks = [
        { type: "sql.query", code: "db.query()", location: { line: 3 } },
        { type: "eval", code: "eval()", location: { line: 4 } }
      ];
      const sanitizationEdges = new Map([
        ["0-db.query()", { sanitized: true, sanitizer: "validator.isEmail", location: { line: 2 } }]
      ]);

      const result = engine.buildTaintPaths(sources, sinks, sanitizationEdges);
      assert.ok(Array.isArray(result));
      assert.ok(result.length > 0);
      assert.ok(result[0].sanitized === true);
      assert.ok(result[0].sanitizer === "validator.isEmail");
    });

    it("should handle unsanitized flows", () => {
      const engine = new TaintEngine();
      const sources = [
        { type: "req.body", variable: "body", location: { line: 1 } }
      ];
      const sinks = [
        { type: "eval", code: "eval()", location: { line: 2 } }
      ];
      const sanitizationEdges = new Map([
        ["0-eval()", { sanitized: false, sanitizer: null, location: null }]
      ]);

      const result = engine.buildTaintPaths(sources, sinks, sanitizationEdges);
      assert.ok(Array.isArray(result));
      assert.ok(result[0].sanitized === false);
    });
  });

  describe("generateTaintReport", () => {
    it("should calculate sanitizationCoverage percentage", () => {
      const engine = new TaintEngine();
      const analysisResult = {
        sources: [{ type: "req.body" }],
        sinks: [{ type: "sql.query", risk: "high" }],
        sourceToSinkMap: [
          {
            source: { type: "req.body" },
            sinks: [
              { type: "sql.query", risk: "high", sanitized: true, sanitizer: "validator.isEmail" }
            ]
          }
        ],
        sanitizationEdges: [{ sanitizer: "validator.isEmail" }],
        riskyFlows: [{ riskLevel: 3 }],
        summary: {
          totalSources: 1,
          totalSinks: 1,
          riskyFlows: 1,
          sanitizedFlows: 1
        }
      };

      const report = engine.generateTaintReport(analysisResult);
      assert.ok(report.sanitizationCoverage.includes("%"));
    });

    it("should count unsanitized vs sanitized flows", () => {
      const engine = new TaintEngine();
      const analysisResult = {
        sources: [{ type: "req.body" }, { type: "req.query" }],
        sinks: [
          { type: "sql.query", risk: "high" },
          { type: "eval", risk: "critical" }
        ],
        sourceToSinkMap: [
          {
            source: { type: "req.body" },
            sinks: [
              { type: "sql.query", risk: "high", sanitized: true, sanitizer: "validator.isEmail" }
            ]
          },
          {
            source: { type: "req.query" },
            sinks: [
              { type: "eval", risk: "critical", sanitized: false, sanitizer: null }
            ]
          }
        ],
        sanitizationEdges: [{ sanitizer: "validator.isEmail" }],
        riskyFlows: [{ riskLevel: 4 }, { riskLevel: 3 }],
        summary: {
          totalSources: 2,
          totalSinks: 2,
          riskyFlows: 2,
          sanitizedFlows: 1
        }
      };

      const report = engine.generateTaintReport(analysisResult);
      assert.strictEqual(report.summary.sanitizedFlows, 1);
      assert.strictEqual(report.summary.unsanitizedFlows, 1);
    });

    it("should include flows array with sanitization info", () => {
      const engine = new TaintEngine();
      const analysisResult = {
        sources: [{ type: "req.body" }],
        sinks: [{ type: "sql.query", risk: "high" }],
        sourceToSinkMap: [
          {
            source: { type: "req.body" },
            sinks: [
              { type: "sql.query", risk: "high", sanitized: false, sanitizer: null }
            ]
          }
        ],
        sanitizationEdges: [],
        riskyFlows: [{ riskLevel: 3 }],
        summary: {
          totalSources: 1,
          totalSinks: 1,
          riskyFlows: 1,
          sanitizedFlows: 0
        }
      };

      const report = engine.generateTaintReport(analysisResult);
      assert.ok(Array.isArray(report.flows));
      assert.strictEqual(report.flows.length, 1);
      assert.strictEqual(report.flows[0].sanitized, false);
    });
  });

  describe("getTaintPaths", () => {
    it("should return array of taint paths", () => {
      const engine = new TaintEngine();
      const paths = engine.getTaintPaths(0, "db.query()");
      assert.ok(Array.isArray(paths));
    });

    it("should include sanitization status per path", () => {
      const engine = new TaintEngine();
      const paths = engine.getTaintPaths(0, "db.query()");
      if (paths.length > 0) {
        assert.ok("sanitized" in paths[0]);
      }
    });
  });

  describe("buildDataFlowGraph - additional branch coverage", () => {
    it("should handle critical risk sinks in graph output", () => {
      const engine = new TaintEngine();
      const sources = [{ type: "req.body", location: { line: 1 } }];
      const sinks = [{ type: "eval", risk: "critical", code: "eval()", location: { line: 3 } }];
      const sanitizationEdges = new Map();

      const result = engine.buildDataFlowGraph(sources, sinks, sanitizationEdges);
      assert.ok(result.graph.includes("eval"), "critical sink should be in graph");
      assert.ok(result.graph.includes("K0"), "should have K0 node");
    });

    it("should handle high risk sinks in graph output", () => {
      const engine = new TaintEngine();
      const sources = [{ type: "req.body", location: { line: 1 } }];
      const sinks = [{ type: "sql.query", risk: "high", code: "db.query()", location: { line: 3 } }];
      const sanitizationEdges = new Map();

      const result = engine.buildDataFlowGraph(sources, sinks, sanitizationEdges);
      assert.ok(result.graph.includes("sql.query"), "high risk sink should be in graph");
      assert.ok(result.graph.includes("K0"), "should have K0 node");
    });

    it("should handle unsanitized edges without style", () => {
      const engine = new TaintEngine();
      const sources = [{ type: "req.body", location: { line: 1 } }];
      const sinks = [{ type: "sql.query", risk: "high", code: "db.query()", location: { line: 3 } }];
      const sanitizationEdges = new Map();
      sanitizationEdges.set("0-db.query()", {
        sanitized: false,
        sanitizer: null,
        location: null
      });

      const result = engine.buildDataFlowGraph(sources, sinks, sanitizationEdges);
      assert.ok(result.graph.includes("-->"), "unsanitized should use -->");
      assert.ok(!result.graph.includes("--sanitized-->"), "unsanitized should not include sanitized marker");
    });

    it("should handle sink not found in sanitizationEdges iteration", () => {
      const engine = new TaintEngine();
      const sources = [{ type: "req.body", location: { line: 1 } }];
      const sinks = [{ type: "sql.query", risk: "high", code: "db.query()", location: { line: 3 } }];
      const sanitizationEdges = new Map();
      sanitizationEdges.set("0-other.sink()", {
        sanitized: true,
        sanitizer: "validator",
        location: { line: 2 }
      });

      const result = engine.buildDataFlowGraph(sources, sinks, sanitizationEdges);
      assert.ok(result.graph.includes("flowchart TD"));
    });

    it("should handle sanitized edge with style", () => {
      const engine = new TaintEngine();
      const sources = [{ type: "req.body", location: { line: 1 } }];
      const sinks = [{ type: "sql.query", risk: "high", code: "db.query()", location: { line: 3 } }];
      const sanitizationEdges = new Map();
      sanitizationEdges.set("0-db.query()", {
        sanitized: true,
        sanitizer: "validator.isEmail",
        location: { line: 2 }
      });

      const result = engine.buildDataFlowGraph(sources, sinks, sanitizationEdges);
      assert.ok(result.graph.includes("--sanitized-->"), "sanitized should use --sanitized-->");
      assert.ok(result.graph.includes("fill:#90EE90"), "sanitized should have green style");
    });
  });

  describe("buildTaintPaths - additional branch coverage", () => {
    it("should handle missing source (returns empty paths)", () => {
      const engine = new TaintEngine();
      const sources = [{ type: "req.body", variable: "body", location: { line: 1 } }];
      const sinks = [{ type: "sql.query", code: "db.query()", location: { line: 3 } }];
      const sanitizationEdges = new Map();
      sanitizationEdges.set("99-db.query()", {
        sanitized: true,
        sanitizer: "validator",
        location: { line: 2 }
      });

      const result = engine.buildTaintPaths(sources, sinks, sanitizationEdges);
      assert.ok(Array.isArray(result));
      assert.strictEqual(result.length, 0, "should return empty when source not found");
    });

    it("should handle missing sink (returns empty paths)", () => {
      const engine = new TaintEngine();
      const sources = [{ type: "req.body", variable: "body", location: { line: 1 } }];
      const sinks = [{ type: "sql.query", code: "db.query()", location: { line: 3 } }];
      const sanitizationEdges = new Map();
      sanitizationEdges.set("0-nonexistent.sink()", {
        sanitized: false,
        sanitizer: null,
        location: null
      });

      const result = engine.buildTaintPaths(sources, sinks, sanitizationEdges);
      assert.ok(Array.isArray(result));
      assert.strictEqual(result.length, 0, "should return empty when sink not found");
    });
  });

  describe("generateTaintReport - additional branch coverage", () => {
    it("should calculate sanitizationCoverage as 0% when no sanitized flows", () => {
      const engine = new TaintEngine();
      const analysisResult = {
        sources: [{ type: "req.body" }],
        sinks: [{ type: "eval", risk: "critical" }],
        sourceToSinkMap: [
          {
            source: { type: "req.body" },
            sinks: [{ type: "eval", risk: "critical", sanitized: false, sanitizer: null }]
          }
        ],
        sanitizationEdges: [],
        riskyFlows: [{ riskLevel: 4 }],
        summary: {
          totalSources: 1,
          totalSinks: 1,
          riskyFlows: 1,
          sanitizedFlows: 0
        }
      };

      const report = engine.generateTaintReport(analysisResult);
      assert.strictEqual(report.sanitizationCoverage, "0%");
      assert.strictEqual(report.summary.criticalFlows, 1);
      assert.strictEqual(report.summary.highFlows, 0);
    });

    it("should count critical and high flows separately", () => {
      const engine = new TaintEngine();
      const analysisResult = {
        sources: [{ type: "req.body" }, { type: "req.query" }],
        sinks: [{ type: "eval", risk: "critical" }, { type: "sql.query", risk: "high" }],
        sourceToSinkMap: [
          {
            source: { type: "req.body" },
            sinks: [{ type: "eval", risk: "critical", sanitized: false, sanitizer: null }]
          },
          {
            source: { type: "req.query" },
            sinks: [{ type: "sql.query", risk: "high", sanitized: true, sanitizer: "escape" }]
          }
        ],
        sanitizationEdges: [{ sanitizer: "escape" }],
        riskyFlows: [{ riskLevel: 4 }, { riskLevel: 3 }],
        summary: {
          totalSources: 2,
          totalSinks: 2,
          riskyFlows: 2,
          sanitizedFlows: 1
        }
      };

      const report = engine.generateTaintReport(analysisResult);
      assert.strictEqual(report.summary.criticalFlows, 1);
      assert.strictEqual(report.summary.highFlows, 1);
      assert.strictEqual(report.summary.totalFlows, 2);
    });

    it("should handle empty sourceToSinkMap", () => {
      const engine = new TaintEngine();
      const analysisResult = {
        sources: [],
        sinks: [],
        sourceToSinkMap: [],
        sanitizationEdges: [],
        riskyFlows: [],
        summary: {
          totalSources: 0,
          totalSinks: 0,
          riskyFlows: 0,
          sanitizedFlows: 0
        }
      };

      const report = engine.generateTaintReport(analysisResult);
      assert.strictEqual(report.summary.totalFlows, 0);
      assert.strictEqual(report.summary.unsanitizedFlows, 0);
      assert.strictEqual(report.summary.sanitizedFlows, 0);
    });
  });
});
