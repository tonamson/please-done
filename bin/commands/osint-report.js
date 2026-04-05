#!/usr/bin/env node
/**
 * OSINT Report Generator CLI
 * Phase 116: OSINT Intelligence Integration (OSINT-03, OSINT-04)
 * CLI tool for generating OSINT reports in multiple formats
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { OsintAggregator } = require("../lib/osint-aggregator");
const { ReconCache } = require("../lib/recon-cache");

/**
 * OSINT Report Generator - formats and outputs OSINT findings
 */
class OsintReportGenerator {
  constructor(options = {}) {
    this.outputFormat = options.outputFormat || "table";
    this.outputPath = options.outputPath || null;
    this.appendMode = options.appendMode || false;
    this.riskFilter = options.riskFilter || null;
  }

  /**
   * Generate JSON report
   * @param {Object} report - OSINT report from aggregator
   * @returns {string} JSON string
   */
  generateJSON(report) {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Generate CLI table format
   * @param {Object} report - OSINT report from aggregator
   * @returns {string} Formatted table string
   */
  generateTable(report) {
    const lines = [];

    // Header
    lines.push("╔" + "═".repeat(78) + "╗");
    lines.push("║" + this._center("OSINT INTELLIGENCE REPORT", 78) + "║");
    lines.push("╠" + "═".repeat(78) + "╣");

    // Target info
    lines.push(this._row("Target:", report.target));
    lines.push(this._row("Scope:", report.scope));
    lines.push(this._row("Duration:", `${report.durationMs}ms`));
    lines.push(this._row("Findings:", `${report.summary.totalFindings} total`));
    lines.push("╠" + "═".repeat(78) + "╣");

    // Summary
    lines.push("║ " + "SUMMARY".padEnd(77) + "║");
    lines.push(this._row("  Critical:", report.summary.criticalCount.toString()));
    lines.push(this._row("  High:", report.summary.highCount.toString()));
    lines.push(this._row("  Medium:", report.summary.mediumCount.toString()));
    lines.push(this._row("  Low:", report.summary.lowCount.toString()));
    lines.push(this._row("  Info:", report.summary.infoCount.toString()));
    lines.push("╠" + "═".repeat(78) + "╣");

    // Findings by type
    const findings = this._filterByRisk(report.findings);

    // Google Dorks
    const dorks = findings.filter((f) => f.type === "dork");
    if (dorks.length > 0) {
      lines.push("║ " + "GOOGLE DORKS".padEnd(77) + "║");
      lines.push("╠" + "─".repeat(78) + "╣");
      for (const dork of dorks.slice(0, 20)) {
        const risk = (dork.risk || "unknown").toUpperCase().padStart(8);
        const query = dork.data.query.substring(0, 60);
        lines.push(this._row(`  [${risk}]`, query));
      }
      if (dorks.length > 20) {
        lines.push(this._row("", `... and ${dorks.length - 20} more`));
      }
      lines.push("╠" + "═".repeat(78) + "╣");
    }

    // Subdomains
    const subdomains = findings.filter((f) => f.type === "subdomain");
    if (subdomains.length > 0) {
      lines.push("║ " + "SUBDOMAINS DISCOVERED".padEnd(77) + "║");
      lines.push("╠" + "─".repeat(78) + "╣");
      for (const sub of subdomains.slice(0, 20)) {
        const conf = `${sub.confidence}%`.padStart(4);
        lines.push(this._row(`  [${conf}]`, sub.data.subdomain));
      }
      if (subdomains.length > 20) {
        lines.push(this._row("", `... and ${subdomains.length - 20} more`));
      }
      lines.push("╠" + "═".repeat(78) + "╣");
    }

    // Secrets
    const secrets = findings.filter((f) => f.type === "secret");
    if (secrets.length > 0) {
      lines.push("║ " + "SECRETS FOUND".padEnd(77) + "║");
      lines.push("╠" + "─".repeat(78) + "╣");
      for (const secret of secrets) {
        const risk = (secret.risk || "unknown").toUpperCase().padStart(8);
        lines.push(this._row(`  [${risk}]`, secret.data.pattern));
      }
      lines.push("╠" + "═".repeat(78) + "╣");
    }

    // Sources
    lines.push("║ " + "SOURCES".padEnd(77) + "║");
    lines.push("╠" + "─".repeat(78) + "╣");
    for (const [source, count] of Object.entries(report.summary.bySource)) {
      lines.push(this._row(`  ${source}:`, count.toString()));
    }

    // Footer
    lines.push("╚" + "═".repeat(78) + "╝");

    return lines.join("\n");
  }

  /**
   * Generate Markdown report
   * @param {Object} report - OSINT report from aggregator
   * @returns {string} Markdown formatted string
   */
  generateMarkdown(report) {
    const lines = [];

    // Title
    lines.push("# OSINT Intelligence Report");
    lines.push("");

    // Executive Summary
    lines.push("## Executive Summary");
    lines.push("");
    lines.push(`| Field | Value |`);
    lines.push(`|-------|-------|`);
    lines.push(`| **Target** | ${report.target} |`);
    lines.push(`| **Scope** | ${report.scope} |`);
    lines.push(`| **Duration** | ${report.durationMs}ms |`);
    lines.push(`| **Total Findings** | ${report.summary.totalFindings} |`);
    lines.push("");

    // Risk Summary
    lines.push("### Risk Distribution");
    lines.push("");
    lines.push(`- **Critical:** ${report.summary.criticalCount}`);
    lines.push(`- **High:** ${report.summary.highCount}`);
    lines.push(`- **Medium:** ${report.summary.mediumCount}`);
    lines.push(`- **Low:** ${report.summary.lowCount}`);
    lines.push(`- **Info:** ${report.summary.infoCount}`);
    lines.push("");

    const findings = this._filterByRisk(report.findings);

    // Google Dorks Section
    const dorks = findings.filter((f) => f.type === "dork");
    if (dorks.length > 0) {
      lines.push("## Google Dorks");
      lines.push("");
      lines.push("| Query | Category | Risk | MITRE |");
      lines.push("|-------|----------|------|-------|");
      for (const dork of dorks) {
        const query = dork.data.query.replace(/\|/g, "\\|");
        const category = dork.data.category;
        const risk = dork.risk || "unknown";
        const mitre = dork.data.mitreTechnique;
        lines.push(`| ${query} | ${category} | ${risk} | ${mitre} |`);
      }
      lines.push("");
    }

    // Subdomains Section
    const subdomains = findings.filter((f) => f.type === "subdomain");
    if (subdomains.length > 0) {
      lines.push("## Subdomains Discovered");
      lines.push("");
      lines.push("| Subdomain | Sources | Confidence | Issuer |");
      lines.push("|-----------|---------|------------|--------|");
      for (const sub of subdomains) {
        const subdomain = sub.data.subdomain;
        const sources = sub.data.sources?.join(", ") || "unknown";
        const confidence = `${sub.confidence}%`;
        const issuer = sub.data.issuer || "N/A";
        lines.push(`| ${subdomain} | ${sources} | ${confidence} | ${issuer} |`);
      }
      lines.push("");
    }

    // Secrets Section
    const secrets = findings.filter((f) => f.type === "secret");
    if (secrets.length > 0) {
      lines.push("## Secrets Found");
      lines.push("");
      lines.push("| Pattern | Category | Risk | Confidence |");
      lines.push("|---------|----------|------|------------|");
      for (const secret of secrets) {
        const pattern = secret.data.pattern;
        const category = secret.data.category;
        const risk = secret.risk || "unknown";
        const confidence = `${secret.confidence}%`;
        lines.push(`| ${pattern} | ${category} | ${risk} | ${confidence} |`);
      }
      lines.push("");

      lines.push("> **WARNING:** These are potential findings based on pattern matching. " +
        "Manual verification is required before taking action.");
      lines.push("");
    }

    // Sources Section
    lines.push("## Data Sources");
    lines.push("");
    lines.push("| Source | Findings |");
    lines.push("|--------|----------|");
    for (const [source, count] of Object.entries(report.summary.bySource)) {
      lines.push(`| ${source} | ${count} |`);
    }
    lines.push("");

    // Recommendations
    lines.push("## Recommendations");
    lines.push("");
    if (report.summary.criticalCount > 0) {
      lines.push("1. **Immediate Action Required:** Review critical findings immediately.");
    }
    if (report.summary.highCount > 0) {
      lines.push("2. **High Priority:** Address high-risk findings within 24 hours.");
    }
    if (dorks.length > 0) {
      lines.push("3. **Google Dorks:** Review dork queries for sensitive information exposure.");
    }
    if (subdomains.length > 0) {
      lines.push("4. **Subdomains:** Verify all subdomains are authorized and properly secured.");
    }
    if (secrets.length > 0) {
      lines.push("5. **Secrets:** Rotate any exposed credentials and audit access logs.");
    }
    lines.push("");

    // Metadata
    lines.push("---");
    lines.push("*Report generated by pd:audit OSINT module*");
    lines.push(`*Timestamp: ${report.metadata.completedAt}*`);

    return lines.join("\n");
  }

  /**
   * Generate brief summary
   * @param {Object} report - OSINT report from aggregator
   * @returns {string} Summary string
   */
  generateSummary(report) {
    const parts = [
      `OSINT Report for ${report.target} (${report.scope} scope):`,
      `${report.summary.totalFindings} findings total`,
    ];

    if (report.summary.criticalCount > 0) {
      parts.push(`${report.summary.criticalCount} critical`);
    }
    if (report.summary.highCount > 0) {
      parts.push(`${report.summary.highCount} high risk`);
    }

    const byType = [];
    if (report.summary.byType.dork) {
      byType.push(`${report.summary.byType.dork} dorks`);
    }
    if (report.summary.byType.subdomain) {
      byType.push(`${report.summary.byType.subdomain} subdomains`);
    }
    if (report.summary.byType.secret) {
      byType.push(`${report.summary.byType.secret} secrets`);
    }

    if (byType.length > 0) {
      parts.push(`(${byType.join(", ")})`);
    }

    return parts.join(" ");
  }

  /**
   * Write report to file or stdout
   * @param {string} content - Report content
   * @param {string} [outputPath] - Output file path
   * @param {boolean} [append] - Append to existing file
   */
  writeOutput(content, outputPath = null, append = false) {
    if (outputPath) {
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const flag = append ? "a" : "w";
      fs.writeFileSync(outputPath, content, { flag });
      console.log(`Report written to: ${outputPath}`);
    } else {
      console.log(content);
    }
  }

  /**
   * Filter findings by risk level
   * @param {Array} findings
   * @returns {Array}
   * @private
   */
  _filterByRisk(findings) {
    if (!this.riskFilter) {
      return findings;
    }

    const riskLevels = ["critical", "high", "medium", "low", "info"];
    const minIndex = riskLevels.indexOf(this.riskFilter);

    if (minIndex === -1) {
      return findings;
    }

    return findings.filter((f) => {
      const riskIndex = riskLevels.indexOf(f.risk);
      return riskIndex !== -1 && riskIndex <= minIndex;
    });
  }

  /**
   * Center text in a field
   * @param {string} text
   * @param {number} width
   * @returns {string}
   * @private
   */
  _center(text, width) {
    const padding = Math.max(0, width - text.length);
    const left = Math.floor(padding / 2);
    const right = padding - left;
    return " ".repeat(left) + text + " ".repeat(right);
  }

  /**
   * Format a row for table output
   * @param {string} label
   * @param {string} value
   * @returns {string}
   * @private
   */
  _row(label, value) {
    const fullText = label + value;
    const padding = Math.max(0, 78 - fullText.length);
    return "║ " + fullText + " ".repeat(padding) + "║";
  }
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  let target = null;
  let outputFormat = "table";
  let outputPath = null;
  let appendMode = false;
  let scope = "quick";
  let riskFilter = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      showHelp();
      process.exit(0);
    } else if (arg === "--json") {
      outputFormat = "json";
    } else if (arg === "--markdown" || arg === "--md") {
      outputFormat = "markdown";
    } else if (arg === "--table") {
      outputFormat = "table";
    } else if (arg === "--output" || arg === "-o") {
      outputPath = args[++i];
    } else if (arg === "--append" || arg === "-a") {
      appendMode = true;
    } else if (arg === "--full") {
      scope = "full";
    } else if (arg === "--quick") {
      scope = "quick";
    } else if (arg === "--risk") {
      riskFilter = args[++i];
    } else if (arg === "--test") {
      // Self-test mode
      await runSelfTest();
      process.exit(0);
    } else if (!arg.startsWith("--")) {
      target = arg;
    }
  }

  if (!target) {
    console.error("Error: Target domain required");
    console.error("Usage: osint-report.js <domain> [options]");
    console.error("Run with --help for more information");
    process.exit(1);
  }

  // Create generator
  const generator = new OsintReportGenerator({
    outputFormat,
    outputPath,
    appendMode,
    riskFilter,
  });

  // Create aggregator
  const cache = new ReconCache();
  const aggregator = new OsintAggregator({ cache });

  // Progress callback
  aggregator.onProgress((event) => {
    if (event.stage === "complete") {
      console.error(`Gathered ${event.findingsCount} findings`);
    } else if (event.progress % 25 === 0) {
      console.error(`${event.stage}: ${event.progress}%`);
    }
  });

  try {
    // Gather OSINT data
    const report = await aggregator.gather(target, { scope, useCache: true });

    // Generate output
    let content;
    switch (outputFormat) {
      case "json":
        content = generator.generateJSON(report);
        break;
      case "markdown":
        content = generator.generateMarkdown(report);
        break;
      case "table":
      default:
        content = generator.generateTable(report);
        break;
    }

    // Write output
    generator.writeOutput(content, outputPath, appendMode);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
OSINT Report Generator

Usage: osint-report.js <domain> [options]

Options:
  --json              Output as JSON
  --markdown, --md    Output as Markdown
  --table             Output as formatted table (default)
  --output, -o FILE   Write to file instead of stdout
  --append, -a        Append to existing file
  --full              Full OSINT scope (includes secret detection)
  --quick             Quick OSINT scope (default)
  --risk LEVEL        Filter by minimum risk level (critical, high, medium)
  --test              Run self-test
  --help, -h          Show this help message

Examples:
  osint-report.js example.com
  osint-report.js example.com --json -o report.json
  osint-report.js example.com --full --markdown -o report.md
  osint-report.js example.com --risk high --table
`);
}

/**
 * Run self-test
 */
async function runSelfTest() {
  console.log("Running self-test...\n");

  const generator = new OsintReportGenerator();

  // Sample report
  const sampleReport = {
    target: "example.com",
    scope: "quick",
    durationMs: 1234,
    findings: [
      {
        type: "dork",
        source: "google-dorks",
        data: {
          query: "site:example.com inurl:admin",
          category: "site-enumeration",
          description: "Admin interface discovery",
          mitreTechnique: "T1593.002",
        },
        timestamp: new Date().toISOString(),
        risk: "high",
        confidence: 80,
      },
      {
        type: "subdomain",
        source: "ct-logs",
        data: {
          subdomain: "www.example.com",
          sources: ["ct"],
          issuer: "Let's Encrypt",
        },
        timestamp: new Date().toISOString(),
        risk: "medium",
        confidence: 90,
      },
    ],
    metadata: {
      target: "example.com",
      scope: "quick",
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      sources: [{ name: "google-dorks", findings: 1, status: "success" }],
      durationMs: 1234,
      sourcesCompleted: 1,
      sourcesFailed: 0,
    },
    summary: {
      totalFindings: 2,
      byType: { dork: 1, subdomain: 1 },
      byRisk: { high: 1, medium: 1 },
      bySource: { "google-dorks": 1, "ct-logs": 1 },
      criticalCount: 0,
      highCount: 1,
      mediumCount: 1,
      lowCount: 0,
      infoCount: 0,
    },
  };

  // Test JSON format
  console.log("Testing JSON format...");
  const jsonOutput = generator.generateJSON(sampleReport);
  const parsed = JSON.parse(jsonOutput);
  assert.strictEqual(parsed.target, "example.com", "JSON: target mismatch");
  console.log("  JSON: OK");

  // Test table format
  console.log("\nTesting table format...");
  const tableOutput = generator.generateTable(sampleReport);
  assert.ok(tableOutput.includes("OSINT INTELLIGENCE REPORT"), "Table: header missing");
  assert.ok(tableOutput.includes("example.com"), "Table: target missing");
  console.log("  Table: OK");

  // Test markdown format
  console.log("\nTesting markdown format...");
  const mdOutput = generator.generateMarkdown(sampleReport);
  assert.ok(mdOutput.includes("# OSINT Intelligence Report"), "Markdown: header missing");
  assert.ok(mdOutput.includes("example.com"), "Markdown: target missing");
  console.log("  Markdown: OK");

  // Test summary
  console.log("\nTesting summary...");
  const summary = generator.generateSummary(sampleReport);
  assert.ok(summary.includes("2 findings"), "Summary: count missing");
  console.log("  Summary: OK");

  console.log("\nAll self-tests passed!");
}

// Self-test assertions
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}
assert.strictEqual = (a, b, message) => {
  if (a !== b) {
    throw new Error(`${message}: expected ${b}, got ${a}`);
  }
};
assert.ok = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

// Run main if called directly
if (require.main === module) {
  main().catch((err) => {
    console.error(`Fatal error: ${err.message}`);
    process.exit(1);
  });
}

module.exports = {
  OsintReportGenerator,
};
