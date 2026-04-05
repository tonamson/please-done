/**
 * Google Dorks Generator
 * Phase 116: OSINT Intelligence (OSINT-01)
 * Generates categorized Google Dork queries for reconnaissance
 */

"use strict";

/**
 * @typedef {Object} DorkEntry
 * @property {string} query - The complete Google dork query
 * @property {string} category - Category of the dork (e.g., 'site-enumeration')
 * @property {string} description - Human-readable description
 * @property {string} mitre_technique - MITRE ATT&CK technique ID
 * @property {string} severity - Impact level: info, low, medium, high, critical
 */

/**
 * Google Dorks categorized query generator
 * Implements MITRE ATT&CK T1593.002 (Search Open Websites/Domains)
 */
class GoogleDorks {
  constructor() {
    this.categories = new Map([
      [
        "site-enumeration",
        {
          name: "Site Enumeration",
          description: "Discover site structure and sensitive paths",
          mitre_technique: "T1593.002",
          dorks: [
            { template: 'site:{target} inurl:admin', severity: "high" },
            { template: 'site:{target} inurl:login', severity: "medium" },
            { template: 'site:{target} inurl:api', severity: "medium" },
            { template: 'site:{target} inurl:portal', severity: "medium" },
            { template: 'site:{target} inurl:panel', severity: "high" },
            { template: 'site:{target} inurl:dashboard', severity: "medium" },
            { template: 'site:{target} inurl:console', severity: "high" },
            { template: 'site:{target} inurl:manage', severity: "medium" },
            { template: 'site:{target} inurl:backend', severity: "medium" },
            { template: 'site:{target} inurl:config', severity: "high" },
            { template: 'site:{target} inurl:setup', severity: "high" },
            { template: 'site:{target} inurl:install', severity: "high" },
            { template: 'site:{target} inurl:administrator', severity: "high" },
            { template: 'site:{target} inurl:wp-admin', severity: "high" },
            { template: 'site:{target} inurl:wp-login', severity: "medium" },
            { template: 'site:{target} inurl:phpmyadmin', severity: "critical" },
            { template: 'site:{target} inurl:cpanel', severity: "critical" },
            { template: 'site:{target} inurl:webmail', severity: "medium" },
            { template: 'site:{target} intitle:"login"', severity: "info" },
            { template: 'site:{target} intitle:"admin"', severity: "medium" },
          ],
        },
      ],
      [
        "exposed-files",
        {
          name: "Exposed Files",
          description: "Find exposed backup and configuration files",
          mitre_technique: "T1552.001",
          dorks: [
            { template: 'site:{target} ext:sql OR ext:bak OR ext:backup', severity: "critical" },
            { template: 'site:{target} ext:log OR ext:xml OR ext:json', severity: "medium" },
            { template: 'site:{target} filetype:env OR filetype:ini', severity: "critical" },
            { template: 'site:{target} filetype:config OR filetype:conf', severity: "high" },
            { template: 'site:{target} filetype:yml OR filetype:yaml', severity: "medium" },
            { template: 'site:{target} ext:zip OR ext:tar OR ext:gz OR ext:rar', severity: "high" },
            { template: 'site:{target} ext:sql.gz OR ext:sql.zip', severity: "critical" },
            { template: 'site:{target} filetype:sql "password" OR "pwd"', severity: "critical" },
            { template: 'site:{target} ext:old OR ext:orig OR ext:save', severity: "medium" },
            { template: 'site:{target} ext:tmp OR ext:temp', severity: "low" },
            { template: 'site:{target} filetype:pdf "confidential" OR "internal"', severity: "medium" },
            { template: 'site:{target} filetype:doc OR filetype:docx "password"', severity: "high" },
            { template: 'site:{target} ext:csv "email" OR "username"', severity: "high" },
            { template: 'site:{target} ext:xls OR ext:xlsx "password" OR "secret"', severity: "high" },
            { template: 'site:{target} filetype:mdb OR filetype:db', severity: "critical" },
            { template: 'site:{target} ext:git OR ext:svn OR ext:hg', severity: "high" },
            { template: 'site:{target} inurl:.env "DB_PASSWORD" OR "API_KEY"', severity: "critical" },
            { template: 'site:{target} filetype:properties "password"', severity: "critical" },
            { template: 'site:{target} ext:sql "phpMyAdmin" OR "dump"', severity: "critical" },
            { template: 'site:{target} filetype:bak "index" OR "backup"', severity: "medium" },
          ],
        },
      ],
      [
        "sensitive-info",
        {
          name: "Sensitive Information",
          description: "Discover exposed sensitive data and credentials",
          mitre_technique: "T1552",
          dorks: [
            { template: 'site:{target} intitle:"index of"', severity: "high" },
            { template: 'site:{target} intitle:"Index of /"', severity: "high" },
            { template: 'site:{target} intitle:"Directory Listing"', severity: "high" },
            { template: 'site:{target} "parent directory" "last modified"', severity: "medium" },
            { template: 'site:{target} intitle:"Apache2 Ubuntu Default Page"', severity: "info" },
            { template: 'site:{target} intitle:"Welcome to nginx!"', severity: "info" },
            { template: 'site:{target} "password" OR "secret" OR "key"', severity: "high" },
            { template: 'site:{target} "api_key" OR "apikey" OR "api-key"', severity: "critical" },
            { template: 'site:{target} "access_token" OR "auth_token"', severity: "critical" },
            { template: 'site:{target} "private_key" OR "ssh_key"', severity: "critical" },
            { template: 'site:{target} "database_password" OR "db_password"', severity: "critical" },
            { template: 'site:{target} "aws_access_key_id" OR "aws_secret"', severity: "critical" },
            { template: 'site:{target} "BEGIN RSA PRIVATE KEY"', severity: "critical" },
            { template: 'site:{target} "BEGIN OPENSSH PRIVATE KEY"', severity: "critical" },
            { template: 'site:{target} "-----BEGIN CERTIFICATE-----"', severity: "medium" },
            { template: 'site:{target} intext:"connectionString"', severity: "critical" },
            { template: 'site:{target} intext:"jdbc:" OR intext:"mongodb://"', severity: "critical" },
            { template: 'site:{target} intext:"firebase" AND intext:"apiKey"', severity: "critical" },
            { template: 'site:{target} "smtp" OR "imap" OR "pop3"', severity: "high" },
            { template: 'site:{target} "sendgrid" OR "mailgun" OR "mandrill"', severity: "high" },
          ],
        },
      ],
      [
        "error-disclosure",
        {
          name: "Error Disclosure",
          description: "Find error messages and debug information",
          mitre_technique: "T1595.002",
          dorks: [
            { template: 'site:{target} "error" OR "warning" OR "exception"', severity: "low" },
            { template: 'site:{target} "stack trace" OR "debug"', severity: "medium" },
            { template: 'site:{target} "Traceback" OR "Exception Type"', severity: "medium" },
            { template: 'site:{target} "Fatal error" OR "Parse error"', severity: "medium" },
            { template: 'site:{target} "SQL syntax" OR "MySQL error"', severity: "high" },
            { template: 'site:{target} "PostgreSQL" OR "ORA-" OR "Oracle error"', severity: "high" },
            { template: 'site:{target} "Microsoft OLE DB" OR "ODBC"', severity: "high" },
            { template: 'site:{target} "Warning: mysql_" OR "Warning: pg_"', severity: "high" },
            { template: 'site:{target} "Undefined index" OR "Undefined variable"', severity: "low" },
            { template: 'site:{target} "System Error" OR "Application Error"', severity: "medium" },
            { template: 'site:{target} "Internal Server Error" filetype:log', severity: "high" },
            { template: 'site:{target} "PHP Notice" OR "PHP Warning"', severity: "low" },
            { template: 'site:{target} "ASP.NET" "Server Error in"', severity: "medium" },
            { template: 'site:{target} intitle:"IIS Windows Server"', severity: "info" },
            { template: 'site:{target} "Directory Listing Denied"', severity: "info" },
            { template: 'site:{target} "Access Denied" "You don\'t have permission"', severity: "info" },
            { template: 'site:{target} "404 Not Found" "nginx"', severity: "info" },
            { template: 'site:{target} "Apache Tomcat" "Error Report"', severity: "medium" },
            { template: 'site:{target} "JBoss" OR "WildFly" "Exception"', severity: "medium" },
            { template: 'site:{target} "GlassFish Server" OR "WebLogic"', severity: "medium" },
          ],
        },
      ],
      [
        "cloud-storage",
        {
          name: "Cloud Storage",
          description: "Find exposed cloud storage buckets and resources",
          mitre_technique: "T1530",
          dorks: [
            { template: 'site:s3.amazonaws.com "{target}"', severity: "high" },
            { template: 'site:blob.core.windows.net "{target}"', severity: "high" },
            { template: 'site:storage.googleapis.com "{target}"', severity: "high" },
            { template: '{target} site:s3.amazonaws.com filetype:pdf', severity: "medium" },
            { template: 'site:{target} "s3.amazonaws.com" OR "s3://"', severity: "high" },
            { template: 'site:{target} "blob.core.windows.net" OR "wasabi"', severity: "high" },
            { template: 'site:{target} "digitaloceanspaces.com"', severity: "high" },
            { template: 'site:{target} "storage.cloud.google.com"', severity: "high" },
            { template: 'site:{target} "firebaseio.com"', severity: "high" },
            { template: 'site:{target} intext:"bucket" "amazonaws"', severity: "medium" },
          ],
        },
      ],
      [
        "github-gitlab",
        {
          name: "Code Repositories",
          description: "Find code repository references and exposed data",
          mitre_technique: "T1593.003",
          dorks: [
            { template: 'site:github.com "{target}"', severity: "info" },
            { template: 'site:gitlab.com "{target}"', severity: "info" },
            { template: 'site:bitbucket.org "{target}"', severity: "info" },
            { template: 'site:{target} "github.com" OR "gitlab.com"', severity: "info" },
            { template: 'site:{target} ".git" OR ".git/config"', severity: "critical" },
            { template: 'site:{target} ".gitignore" OR ".gitattributes"', severity: "medium" },
            { template: 'site:{target} "package.json" "dependencies"', severity: "low" },
            { template: 'site:{target} "requirements.txt" OR "Pipfile"', severity: "low" },
            { template: 'site:{target} "composer.json" OR "Gemfile"', severity: "low" },
            { template: 'site:{target} "Dockerfile" OR "docker-compose"', severity: "medium" },
          ],
        },
      ],
    ]);
  }

  /**
   * Generate Google dork queries for a target
   * @param {string} target - Target domain (e.g., "example.com")
   * @param {string[]} [categories] - Specific categories to generate (default: all)
   * @returns {DorkEntry[]} Array of dork objects with query, category, description, mitre_technique
   */
  generate(target, categories = null) {
    if (!target || typeof target !== "string") {
      throw new Error("Target must be a non-empty string");
    }

    // Sanitize target - remove protocol and path
    const cleanTarget = target
      .replace(/^https?:\/\//i, "")
      .replace(/\/.*$/, "")
      .toLowerCase()
      .trim();

    if (!cleanTarget || !cleanTarget.includes(".")) {
      throw new Error("Invalid target domain");
    }

    const results = [];
    const selectedCategories = categories || Array.from(this.categories.keys());

    for (const categoryKey of selectedCategories) {
      const category = this.categories.get(categoryKey);
      if (!category) continue;

      for (const dork of category.dorks) {
        const query = dork.template.replace(/\{target\}/g, cleanTarget);
        results.push({
          query,
          category: categoryKey,
          description: this._generateDescription(query, categoryKey),
          mitre_technique: category.mitre_technique,
          severity: dork.severity,
        });
      }
    }

    return results;
  }

  /**
   * Generate human-readable description for a dork query
   * @param {string} query - The generated query
   * @param {string} category - Category key
   * @returns {string} Description
   */
  _generateDescription(query, category) {
    const descriptions = {
      "site-enumeration": "Administrative interface or login page discovery",
      "exposed-files": "Potentially exposed file or backup",
      "sensitive-info": "Sensitive information or credential exposure",
      "error-disclosure": "Error message or debug information disclosure",
      "cloud-storage": "Cloud storage resource exposure",
      "github-gitlab": "Code repository or configuration file",
    };
    return descriptions[category] || "OSINT reconnaissance query";
  }

  /**
   * Get available dork categories
   * @returns {Object[]} Array of category objects with key, name, description
   */
  getCategories() {
    const result = [];
    for (const [key, category] of this.categories) {
      result.push({
        key,
        name: category.name,
        description: category.description,
        mitre_technique: category.mitre_technique,
        count: category.dorks.length,
      });
    }
    return result;
  }

  /**
   * Export dorks in format suitable for specific tools
   * @param {string} tool - Target tool: 'browser', 'cli', 'json', 'txt', 'markdown'
   * @param {DorkEntry[]} dorks - Array of dork entries from generate()
   * @returns {string} Formatted output
   */
  exportForTool(tool, dorks) {
    if (!Array.isArray(dorks)) {
      throw new Error("Dorks must be an array");
    }

    switch (tool.toLowerCase()) {
      case "browser":
        return this._exportBrowser(dorks);
      case "cli":
        return this._exportCli(dorks);
      case "json":
        return this._exportJson(dorks);
      case "txt":
      case "text":
        return this._exportText(dorks);
      case "markdown":
      case "md":
        return this._exportMarkdown(dorks);
      default:
        throw new Error(`Unknown export format: ${tool}`);
    }
  }

  /**
   * Export for browser - returns Google search URLs
   * @param {DorkEntry[]} dorks
   * @returns {string[]}
   */
  _exportBrowser(dorks) {
    return dorks.map(
      (d) => `https://www.google.com/search?q=${encodeURIComponent(d.query)}`
    );
  }

  /**
   * Export for CLI - returns shell commands
   * @param {DorkEntry[]} dorks
   * @returns {string}
   */
  _exportCli(dorks) {
    const lines = dorks.map(
      (d) =>
        `# ${d.description} [${d.mitre_technique} | ${d.severity}]\n${d.query}`
    );
    return lines.join("\n\n");
  }

  /**
   * Export as JSON
   * @param {DorkEntry[]} dorks
   * @returns {string}
   */
  _exportJson(dorks) {
    return JSON.stringify(dorks, null, 2);
  }

  /**
   * Export as plain text
   * @param {DorkEntry[]} dorks
   * @returns {string}
   */
  _exportText(dorks) {
    return dorks.map((d) => d.query).join("\n");
  }

  /**
   * Export as Markdown table
   * @param {DorkEntry[]} dorks
   * @returns {string}
   */
  _exportMarkdown(dorks) {
    const lines = [
      "| Query | Category | Severity | MITRE Technique |",
      "|-------|----------|----------|-----------------|",
    ];
    for (const d of dorks) {
      const query = d.query.replace(/\|/g, "\\|");
      lines.push(
        `| ${query} | ${d.category} | ${d.severity} | ${d.mitre_technique} |`
      );
    }
    return lines.join("\n");
  }
}

module.exports = { GoogleDorks };
