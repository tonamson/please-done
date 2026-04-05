/**
 * Service Discovery - Technology stack fingerprinting
 * Phase 113: Intelligence Gathering Core
 */

const fs = require('fs').promises;
const path = require('path');
const { ReconCache } = require('./recon-cache');

/**
 * Discovers technology stack and checks for vulnerabilities
 */
class ServiceDiscovery {
  constructor(options = {}) {
    this.cache = options.cache || new ReconCache();
    this.framework = null;
    this.dependencies = [];
    this.vulnerabilities = [];
    this.osvApiUrl = 'https://api.osv.dev/v1/query';
    this.osvBatchUrl = 'https://api.osv.dev/v1/querybatch';
  }

  /**
   * Analyze project dependencies
   * @param {string} projectPath - Path to project root
   * @returns {Promise<Object>} Technology stack information
   */
  async analyzeDependencies(projectPath) {
    const cacheKey = this.cache.getKey(`service-discovery:${projectPath}`);
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Read package.json
    const packageJson = await this.readPackageJson(projectPath);
    if (!packageJson) {
      return { error: 'No package.json found' };
    }

    // Detect framework
    this.framework = this.detectFramework(packageJson);

    // Map dependencies
    this.dependencies = await this.mapDependencies(packageJson);

    // Check for vulnerabilities
    this.vulnerabilities = await this.checkVulnerabilities(this.dependencies);

    // Build tech stack
    const techStack = this.buildTechStack(packageJson);

    const result = {
      framework: this.framework,
      dependencies: this.dependencies,
      vulnerabilities: this.vulnerabilities,
      outdated: this.dependencies.filter(d => d.isOutdated),
      techStack,
      summary: {
        totalDependencies: this.dependencies.length,
        vulnerableCount: this.vulnerabilities.length,
        outdatedCount: this.dependencies.filter(d => d.isOutdated).length
      }
    };

    await this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Read and parse package.json
   */
  async readPackageJson(projectPath) {
    try {
      const content = await fs.readFile(
        path.join(projectPath, 'package.json'),
        'utf-8'
      );
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Detect framework from package.json
   */
  detectFramework(packageJson) {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    const frameworks = [
      { name: 'Express', key: 'express', confidence: 'high' },
      { name: 'Fastify', key: 'fastify', confidence: 'high' },
      { name: 'NestJS', key: '@nestjs/core', confidence: 'high' },
      { name: 'Next.js', key: 'next', confidence: 'high' },
      { name: 'Koa', key: 'koa', confidence: 'medium' },
      { name: 'Hapi', key: '@hapi/hapi', confidence: 'high' },
      { name: 'Remix', key: '@remix-run/core', confidence: 'high' },
      { name: 'Nuxt.js', key: 'nuxt', confidence: 'high' },
      { name: 'SvelteKit', key: '@sveltejs/kit', confidence: 'high' }
    ];

    for (const fw of frameworks) {
      if (deps[fw.key]) {
        return {
          name: fw.name,
          version: deps[fw.key],
          confidence: fw.confidence
        };
      }
    }

    return { name: 'Unknown', version: null, confidence: 'low' };
  }

  /**
   * Map all dependencies with their metadata
   */
  async mapDependencies(packageJson) {
    const deps = [];
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    for (const [name, version] of Object.entries(allDeps)) {
      const normalizedVersion = this.normalizeVersion(version);
      const isDev = name in (packageJson.devDependencies || {});

      deps.push({
        name,
        version: normalizedVersion,
        isDev,
        type: this.classifyDependency(name),
        isOutdated: false, // Will be updated by checkOutdated
        latestVersion: null
      });
    }

    return deps;
  }

  /**
   * Classify dependency by type
   */
  classifyDependency(name) {
    const patterns = {
      database: /^(mongodb|mongoose|pg|mysql2|sqlite3|@prisma\/client|sequelize|typeorm|redis|ioredis)/i,
      auth: /^(passport|@auth0|jsonwebtoken|bcrypt|argon2|cookie-session|express-session|next-auth|@okta)/i,
      http: /^(axios|node-fetch|got|request|superagent)/i,
      framework: /^(express|fastify|koa|@hapi\/hapi|next|@nestjs|nuxt|@remix-run|@sveltejs)/i,
      testing: /^(jest|mocha|chai|@testing-library|cypress|playwright|vitest)/i,
      build: /^(webpack|vite|rollup|esbuild|@babel\/core|typescript|ts-node)/i,
      styling: /^(tailwindcss|styled-components|@emotion|sass|less|bootstrap)/i,
      validation: /^(joi|yup|zod|ajv|class-validator|validator)/i,
      security: /^(helmet|csurf|hpp|cors|rate-limiter-flexible|express-rate-limit)/i
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(name)) return type;
    }

    return 'utility';
  }

  /**
   * Normalize version string
   */
  normalizeVersion(version) {
    if (!version) return '0.0.0';
    // Remove ^, ~, >, <, = prefixes
    return version.replace(/^[\^~>=<]+/, '');
  }

  /**
   * Check dependencies for known vulnerabilities
   */
  async checkVulnerabilities(dependencies) {
    const vulnerabilities = [];
    const toCheck = dependencies.slice(0, 50); // Limit to avoid rate limits

    try {
      // Use batch API for efficiency
      const queries = toCheck.map(dep => ({
        package: {
          name: dep.name,
          ecosystem: 'npm'
        },
        version: dep.version
      }));

      const response = await fetch(this.osvBatchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries })
      });

      if (!response.ok) {
        throw new Error(`OSV API error: ${response.status}`);
      }

      const data = await response.json();

      for (let i = 0; i < toCheck.length; i++) {
        const dep = toCheck[i];
        const result = data.results?.[i];

        if (result?.vulns) {
          for (const vuln of result.vulns) {
            vulnerabilities.push({
              dependency: dep.name,
              version: dep.version,
              vulnerability: {
                id: vuln.id,
                summary: vuln.summary,
                severity: this.extractSeverity(vuln),
                aliases: vuln.aliases || [],
                published: vuln.published,
                modified: vuln.modified
              }
            });
          }
        }
      }
    } catch (error) {
      console.warn(`Vulnerability check failed: ${error.message}`);
    }

    return vulnerabilities;
  }

  /**
   * Extract severity from vulnerability data
   */
  extractSeverity(vuln) {
    // Try CVSS score first
    if (vuln.database_specific?.severity) {
      return vuln.database_specific.severity;
    }

    // Check aliases for CVE and infer from ID
    const hasCVE = vuln.aliases?.some(a => a.startsWith('CVE-'));
    if (hasCVE) return 'HIGH';

    // Default based on ecosystem
    return 'MODERATE';
  }

  /**
   * Build complete technology stack
   */
  buildTechStack(packageJson) {
    const deps = this.dependencies;
    const stack = {
      runtime: 'Node.js',
      framework: this.framework,
      database: this.findFirstOfType(deps, 'database'),
      auth: this.findFirstOfType(deps, 'auth'),
      httpClient: this.findFirstOfType(deps, 'http'),
      validation: this.findFirstOfType(deps, 'validation'),
      security: deps.filter(d => d.type === 'security').map(d => d.name),
      testing: deps.filter(d => d.type === 'testing').map(d => d.name),
      buildTools: deps.filter(d => d.type === 'build').map(d => d.name)
    };

    // Identify external services
    const externalServices = this.identifyExternalServices(deps);
    if (externalServices.length > 0) {
      stack.externalServices = externalServices;
    }

    return stack;
  }

  /**
   * Find first dependency of a type
   */
  findFirstOfType(deps, type) {
    const dep = deps.find(d => d.type === type);
    return dep ? { name: dep.name, version: dep.version } : null;
  }

  /**
   * Identify external services from dependencies
   */
  identifyExternalServices(deps) {
    const servicePatterns = {
      'AWS': /^@aws-sdk\//,
      'Azure': /^@azure\//,
      'Google Cloud': /^@google-cloud\//,
      'Stripe': /^stripe$/,
      'Twilio': /^twilio$/,
      'SendGrid': /^@sendgrid\//,
      'Sentry': /^@sentry\//,
      'Datadog': /^dd-trace/,
      'New Relic': /^newrelic$/,
      'MongoDB Atlas': /^mongodb$/,
      'Redis': /^redis|ioredis$/,
      'Elasticsearch': /^@elastic\//,
      'Algolia': /^algoliasearch$/,
      'Cloudinary': /^cloudinary$/
    };

    const services = [];

    for (const [service, pattern] of Object.entries(servicePatterns)) {
      const found = deps.find(d => pattern.test(d.name));
      if (found) {
        services.push({
          name: service,
          package: found.name,
          version: found.version
        });
      }
    }

    return services;
  }

  /**
   * Get framework information
   */
  getFramework() {
    return this.framework;
  }

  /**
   * Get all dependencies
   */
  getDependencies() {
    return this.dependencies;
  }

  /**
   * Get vulnerable dependencies
   */
  getVulnerabilities() {
    return this.vulnerabilities;
  }

  /**
   * Get outdated dependencies
   */
  getOutdated() {
    return this.dependencies.filter(d => d.isOutdated);
  }
}

module.exports = { ServiceDiscovery };
