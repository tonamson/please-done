/**
 * Recon Aggregator - Combines all reconnaissance data
 * Phase 113: Intelligence Gathering Core
 */

const { SourceMapper } = require('./source-mapper');
const { TargetEnumerator } = require('./target-enumerator');
const { ServiceDiscovery } = require('./service-discovery');
const { ReconCache } = require('./recon-cache');
const { AssetDiscoverer } = require('./asset-discoverer');
const { AuthAnalyzer } = require('./auth-analyzer');
const { WorkflowMapper } = require('./workflow-mapper');

/**
 * Aggregates reconnaissance data from all sources
 */
class ReconAggregator {
  constructor(options = {}) {
    this.cache = options.cache || new ReconCache();
    this.sourceMapper = new SourceMapper({ cache: this.cache });
    this.targetEnumerator = new TargetEnumerator();
    this.serviceDiscovery = new ServiceDiscovery({ cache: this.cache });
    this.assetDiscoverer = new AssetDiscoverer({ cache: this.cache });
    this.authAnalyzer = new AuthAnalyzer({ cache: this.cache });
    this.workflowMapper = new WorkflowMapper({ cache: this.cache });
    this.results = null;
  }

  /**
   * Run full reconnaissance on a project
   * @param {string} projectPath - Path to project root
   * @param {Object} options - Reconnaissance options
   * @returns {Promise<Object>} Complete reconnaissance report
   */
  async runFullRecon(projectPath, options = {}) {
    const { tier = 'standard' } = options;

    console.log(`\n🔍 Starting reconnaissance (${tier} tier)...\n`);

    // Phase 1: Service Discovery (always run)
    console.log('  → Analyzing technology stack...');
    const serviceInfo = await this.serviceDiscovery.analyzeDependencies(projectPath);

    // Phase 2: Source Mapping (standard/deep)
    let sourceInfo = null;
    if (tier !== 'free') {
      console.log('  → Mapping untrusted data sources...');
      const sourceFiles = await this.findSourceFiles(projectPath);
      sourceInfo = await this.runSourceAnalysis(sourceFiles);
    }

    // Phase 3: Target Enumeration (standard/deep)
    let targetInfo = null;
    if (tier !== 'free') {
      console.log('  → Discovering API endpoints...');
      targetInfo = await this.targetEnumerator.discoverRoutes(projectPath);
    }

    // Phase 114 modules (deep/redteam tiers)
    let assetInfo = null;
    let authInfo = null;
    if (tier === 'deep' || tier === 'redteam') {
      console.log('  → Discovering hidden assets...');
      assetInfo = await this.assetDiscoverer.discoverHiddenAssets(projectPath, options);

      console.log('  → Analyzing authentication...');
      authInfo = await this.authAnalyzer.analyze(projectPath, targetInfo, options);
    }

    // Phase 115: Business Logic Mapping (deep/redteam tiers)
    let workflowInfo = null;
    if (tier === 'deep' || tier === 'redteam') {
      console.log('  → Mapping business logic workflows...');
      const workflowFiles = await this.findSourceFiles(projectPath);
      workflowInfo = await this.runWorkflowAnalysis(workflowFiles);
    }

    // Compile results
    this.results = {
      summary: this.generateSummary(serviceInfo, sourceInfo, targetInfo, assetInfo, authInfo, workflowInfo),
      serviceInfo,
      sourceInfo,
      targetInfo,
      assetInfo,
      authInfo,
      workflowInfo,
      risks: this.generateRisks(serviceInfo, sourceInfo, targetInfo, assetInfo, authInfo, workflowInfo),
      recommendations: this.generateRecommendations(serviceInfo, sourceInfo, targetInfo, assetInfo, authInfo, workflowInfo)
    };

    console.log('  ✓ Reconnaissance complete\n');

    return this.results;
  }

  /**
   * Find source files to analyze
   */
  async findSourceFiles(projectPath) {
    const { glob } = require('glob');
    const path = require('path');

    // Find JavaScript/TypeScript files excluding tests and node_modules
    const patterns = [
      '**/*.{js,ts,jsx,tsx}',
      '!**/node_modules/**',
      '!**/*.test.{js,ts}',
      '!**/*.spec.{js,ts}',
      '!**/dist/**',
      '!**/build/**',
      '!**/.*/**'
    ];

    const files = await glob(patterns, { cwd: projectPath, absolute: true });
    return files.slice(0, 100); // Limit to avoid timeout
  }

  /**
   * Run source analysis on multiple files
   */
  async runSourceAnalysis(files) {
    const allSources = [];
    const allSinks = [];
    const riskyFlows = [];

    for (const file of files) {
      try {
        const result = await this.sourceMapper.analyze(file);
        allSources.push(...result.sources);
        allSinks.push(...result.sinks);
        riskyFlows.push(...result.riskyFlows);
      } catch (err) {
        // Skip files that can't be parsed
        continue;
      }
    }

    return {
      sources: allSources,
      sinks: allSinks,
      riskyFlows: riskyFlows.slice(0, 50), // Top 50 risky flows
      summary: {
        filesAnalyzed: files.length,
        totalSources: allSources.length,
        totalSinks: allSinks.length,
        highRiskFlows: riskyFlows.filter(r => r.riskLevel >= 3).length,
        criticalRiskFlows: riskyFlows.filter(r => r.riskLevel >= 4).length
      }
    };
  }

  /**
   * Run workflow analysis on multiple files
   * Phase 115: RECON-06 Business Logic Mapping
   */
  async runWorkflowAnalysis(files) {
    const allWorkflows = [];
    const allFlaws = [];

    // Limit to 50 files for expensive AST analysis (per RESEARCH.md Pitfall 4)
    const analysisFiles = files.slice(0, 50);

    for (const file of analysisFiles) {
      try {
        const result = await this.workflowMapper.analyze(file);
        if (result.workflows.states.length > 0) {
          allWorkflows.push(result);
        }
        if (result.flaws.length > 0) {
          allFlaws.push(...result.flaws);
        }
      } catch (err) {
        continue;
      }
    }

    return {
      workflows: allWorkflows,
      flaws: allFlaws,
      summary: {
        filesAnalyzed: analysisFiles.length,
        workflowsDetected: allWorkflows.length,
        flawsFound: allFlaws.length,
        criticalFlaws: allFlaws.filter(f => f.severity === 'CRITICAL').length,
        highFlaws: allFlaws.filter(f => f.severity === 'HIGH').length
      }
    };
  }

  /**
   * Generate summary statistics
   */
  generateSummary(serviceInfo, sourceInfo, targetInfo, assetInfo, authInfo, workflowInfo) {
    return {
      overallRisk: this.calculateOverallRisk(serviceInfo, sourceInfo, targetInfo, assetInfo, authInfo, workflowInfo),
      techStack: serviceInfo?.framework?.name || 'Unknown',
      vulnerableDependencies: serviceInfo?.vulnerabilities?.length || 0,
      outdatedDependencies: serviceInfo?.summary?.outdatedCount || 0,
      untrustedSources: sourceInfo?.sources?.length || 0,
      riskyFlows: sourceInfo?.summary?.highRiskFlows || 0,
      routesDiscovered: Array.isArray(targetInfo) ? targetInfo.length : 0,
      unprotectedRoutes: Array.isArray(targetInfo)
        ? targetInfo.filter(r => !r.authRequired).length
        : 0,
      internalRoutes: Array.isArray(targetInfo)
        ? targetInfo.filter(r => !r.isDocumented).length
        : 0,
      hiddenAssets: assetInfo?.length || 0,
      criticalAssets: assetInfo?.filter(a => a.severity === 'CRITICAL').length || 0,
      authPatterns: authInfo?.authPatterns?.length || 0,
      jwtVulnerabilities: authInfo?.jwtAnalysis?.length || 0,
      hardcodedCredentials: authInfo?.hardcodedCredentials?.length || 0,
      bypassCandidates: authInfo?.coverageMatrix?.bypassCandidates?.length || 0,
      workflowsDetected: workflowInfo?.workflows?.length || 0,
      logicFlaws: workflowInfo?.flaws?.length || 0,
      criticalLogicFlaws: workflowInfo?.summary?.criticalFlaws || 0
    };
  }

  /**
   * Calculate overall risk level
   */
  calculateOverallRisk(serviceInfo, sourceInfo, targetInfo, assetInfo, authInfo, workflowInfo) {
    let score = 0;

    // Vulnerable dependencies (max 30 points)
    const vulnCount = serviceInfo?.vulnerabilities?.length || 0;
    score += Math.min(vulnCount * 5, 30);

    // Outdated dependencies (max 15 points)
    const outdatedCount = serviceInfo?.summary?.outdatedCount || 0;
    score += Math.min(outdatedCount * 1, 15);

    // Risky flows (max 35 points)
    const criticalFlows = sourceInfo?.summary?.criticalRiskFlows || 0;
    const highRiskFlows = sourceInfo?.summary?.highRiskFlows || 0;
    score += criticalFlows * 7 + Math.min(highRiskFlows * 2, 35);

    // Unprotected routes (max 20 points)
    const routes = Array.isArray(targetInfo) ? targetInfo : [];
    const internalRoutes = routes.filter(r => !r.isDocumented).length;
    const unprotectedRoutes = routes.filter(r => !r.authRequired).length;
    score += internalRoutes * 3 + Math.min(unprotectedRoutes, 20);

    // Phase 114: Hidden assets (max 10 points)
    const criticalAssets = assetInfo?.filter(a => a.severity === 'CRITICAL').length || 0;
    const highAssets = assetInfo?.filter(a => a.severity === 'HIGH').length || 0;
    score += criticalAssets * 5 + Math.min(highAssets * 2, 10);

    // Phase 114: Auth vulnerabilities (max 10 points)
    const jwtVulns = authInfo?.jwtAnalysis?.length || 0;
    const hardcodedCreds = authInfo?.hardcodedCredentials?.length || 0;
    const bypassCandidates = authInfo?.coverageMatrix?.bypassCandidates?.length || 0;
    score += Math.min(jwtVulns * 3 + hardcodedCreds * 5 + bypassCandidates * 2, 10);

    // Phase 115: Business logic flaws (max 10 points)
    const criticalLogicFlaws = workflowInfo?.flaws?.filter(f => f.severity === 'CRITICAL').length || 0;
    const highLogicFlaws = workflowInfo?.flaws?.filter(f => f.severity === 'HIGH').length || 0;
    score += criticalLogicFlaws * 5 + Math.min(highLogicFlaws * 2, 10);

    if (score >= 60) return 'CRITICAL';
    if (score >= 40) return 'HIGH';
    if (score >= 20) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Generate risk findings
   */
  generateRisks(serviceInfo, sourceInfo, targetInfo, assetInfo, authInfo, workflowInfo) {
    const risks = [];

    // Service risks
    if (serviceInfo?.vulnerabilities?.length > 0) {
      const criticalVulns = serviceInfo.vulnerabilities.filter(
        v => v.vulnerability?.severity === 'CRITICAL'
      );
      if (criticalVulns.length > 0) {
        risks.push({
          severity: 'CRITICAL',
          category: 'Dependency',
          title: `${criticalVulns.length} critical vulnerabilities in dependencies`,
          description: `Found ${criticalVulns.length} dependencies with critical severity CVEs`,
          affected: criticalVulns.map(v => v.dependency)
        });
      }
    }

    // Outdated framework
    if (serviceInfo?.framework?.name) {
      const fw = serviceInfo.framework;
      if (['Express', 'Fastify', 'Koa'].includes(fw.name)) {
        // Check if version is significantly outdated
        const majorVersion = parseInt(fw.version?.split('.')[0]);
        if (fw.name === 'Express' && majorVersion < 4) {
          risks.push({
            severity: 'HIGH',
            category: 'Framework',
            title: `Outdated ${fw.name} version`,
            description: `Using ${fw.name} ${fw.version} - consider upgrading to latest`,
            affected: [fw.name]
          });
        }
      }
    }

    // Source/Sink risks
    if (sourceInfo?.riskyFlows?.length > 0) {
      const criticalFlows = sourceInfo.riskyFlows.filter(r => r.riskLevel >= 4);
      if (criticalFlows.length > 0) {
        risks.push({
          severity: 'CRITICAL',
          category: 'Injection',
          title: `${criticalFlows.length} critical injection paths`,
          description: 'Untrusted input flows to dangerous sinks without sanitization',
          affected: criticalFlows.slice(0, 5).map(f => f.source.location.file)
        });
      }

      const highFlows = sourceInfo.riskyFlows.filter(r => r.riskLevel === 3);
      if (highFlows.length > 0) {
        risks.push({
          severity: 'HIGH',
          category: 'Injection',
          title: `${highFlows.length} high-risk injection paths`,
          description: 'Potential injection vulnerabilities in data flow',
          affected: highFlows.slice(0, 3).map(f => f.source.location.file)
        });
      }
    }

    // Target risks
    if (Array.isArray(targetInfo)) {
      const internalRoutes = targetInfo.filter(r => !r.isDocumented);
      if (internalRoutes.length > 0) {
        risks.push({
          severity: 'MEDIUM',
          category: 'Exposure',
          title: `${internalRoutes.length} internal/undocumented routes`,
          description: 'Routes that may be unintentionally exposed',
          affected: internalRoutes.slice(0, 5).map(r => r.path)
        });
      }

      const sensitiveUnprotected = targetInfo.filter(r => {
        const sensitivePatterns = /admin|user|account|password|token|api|internal|debug/i;
        return !r.authRequired && sensitivePatterns.test(r.path);
      });

      if (sensitiveUnprotected.length > 0) {
        risks.push({
          severity: 'HIGH',
          category: 'Authentication',
          title: 'Sensitive routes without authentication',
          description: `${sensitiveUnprotected.length} sensitive routes lack authentication`,
          affected: sensitiveUnprotected.slice(0, 5).map(r => r.path)
        });
      }
    }

    // Phase 114: Hidden asset risks
    if (assetInfo?.length > 0) {
      const criticalAssets = assetInfo.filter(a => a.severity === 'CRITICAL');
      if (criticalAssets.length > 0) {
        risks.push({
          severity: 'CRITICAL',
          category: 'Exposure',
          title: `${criticalAssets.length} critical hidden asset exposures`,
          description: `Found ${criticalAssets.length} CRITICAL severity exposed assets (admin panels, debug endpoints)`,
          affected: criticalAssets.slice(0, 5).map(a => a.path)
        });
      }

      const highAssets = assetInfo.filter(a => a.severity === 'HIGH');
      if (highAssets.length > 0) {
        risks.push({
          severity: 'HIGH',
          category: 'Exposure',
          title: `${highAssets.length} high-risk exposed assets`,
          description: `Found ${highAssets.length} HIGH severity exposed assets (config files, backups)`,
          affected: highAssets.slice(0, 5).map(a => a.path)
        });
      }
    }

    // Phase 114: Authentication risks
    if (authInfo) {
      // JWT vulnerabilities
      if (authInfo.jwtAnalysis?.length > 0) {
        const jwtVulns = authInfo.jwtAnalysis;
        const algorithmConfusion = jwtVulns.filter(v => v.type === 'jwt-algorithm-not-pinned');
        if (algorithmConfusion.length > 0) {
          risks.push({
            severity: 'HIGH',
            category: 'Authentication',
            title: 'JWT algorithm confusion vulnerability',
            description: 'JWT verification without explicit algorithm pinning - vulnerable to algorithm confusion (CVE-2024-54150)',
            affected: algorithmConfusion.slice(0, 3).map(v => `${v.file}:${v.line}`)
          });
        }
      }

      // Hardcoded credentials
      if (authInfo.hardcodedCredentials?.length > 0) {
        const creds = authInfo.hardcodedCredentials;
        const criticalCreds = creds.filter(c => c.severity === 'CRITICAL');
        if (criticalCreds.length > 0) {
          risks.push({
            severity: 'CRITICAL',
            category: 'Credentials',
            title: `${criticalCreds.length} hardcoded credentials found`,
            description: 'Hardcoded credentials in source code are a critical security risk',
            affected: criticalCreds.slice(0, 5).map(c => `${c.file}:${c.line}`)
          });
        }
      }

      // Bypass candidates
      if (authInfo.coverageMatrix?.bypassCandidates?.length > 0) {
        const candidates = authInfo.coverageMatrix.bypassCandidates;
        risks.push({
          severity: 'HIGH',
          category: 'Authentication',
          title: `${candidates.length} authentication bypass candidates`,
          description: 'Sensitive routes without authentication that may allow unauthorized access',
          affected: candidates.slice(0, 5).map(c => c.path)
        });
      }
    }

    // Phase 115: Business logic risks
    if (workflowInfo?.flaws?.length > 0) {
      const criticalFlaws = workflowInfo.flaws.filter(f => f.severity === 'CRITICAL');
      if (criticalFlaws.length > 0) {
        risks.push({
          severity: 'CRITICAL',
          category: 'Business Logic',
          title: `${criticalFlaws.length} critical business logic flaws`,
          description: 'Missing state validation, TOCTOU, or workflow bypass vulnerabilities',
          affected: criticalFlaws.slice(0, 5).map(f => `${f.location.file}:${f.location.line}`)
        });
      }
    }

    return risks.sort((a, b) => {
      const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(serviceInfo, sourceInfo, targetInfo, assetInfo, authInfo, workflowInfo) {
    const recommendations = [];

    // Dependency recommendations
    if (serviceInfo?.vulnerabilities?.length > 0) {
      recommendations.push({
        priority: 'URGENT',
        title: 'Update vulnerable dependencies',
        description: `Run 'npm audit fix' or manually update ${serviceInfo.vulnerabilities.length} vulnerable packages`,
        affected: serviceInfo.vulnerabilities.slice(0, 5).map(v => v.dependency)
      });
    }

    // Framework update
    if (serviceInfo?.framework?.name) {
      const fw = serviceInfo.framework;
      recommendations.push({
        priority: 'HIGH',
        title: `Review ${fw.name} version`,
        description: `Currently using ${fw.name} ${fw.version} - check for security updates`
      });
    }

    // Input validation
    if (sourceInfo?.riskyFlows?.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        title: 'Implement input validation',
        description: `${sourceInfo.riskyFlows.length} potential injection points need sanitization`,
        affected: ['All controllers handling user input']
      });
    }

    // Authentication
    if (Array.isArray(targetInfo)) {
      const unprotected = targetInfo.filter(r => !r.authRequired);
      if (unprotected.length > 5) {
        recommendations.push({
          priority: 'MEDIUM',
          title: 'Review unprotected routes',
          description: `${unprotected.length} routes lack authentication - verify intended behavior`,
          affected: unprotected.slice(0, 3).map(r => r.path)
        });
      }
    }

    // Internal routes
    if (Array.isArray(targetInfo)) {
      const internal = targetInfo.filter(r => !r.isDocumented);
      if (internal.length > 0) {
        recommendations.push({
          priority: 'LOW',
          title: 'Document or remove internal routes',
          description: `${internal.length} internal routes may be unintentionally exposed`,
          affected: internal.slice(0, 3).map(r => r.path)
        });
      }
    }

    // Phase 114: Hidden asset recommendations
    if (assetInfo?.length > 0) {
      const criticalAssets = assetInfo.filter(a => a.severity === 'CRITICAL');
      if (criticalAssets.length > 0) {
        recommendations.push({
          priority: 'URGENT',
          title: 'Remove or secure exposed critical assets',
          description: `${criticalAssets.length} CRITICAL assets exposed - admin panels, debug endpoints, and backup files should not be publicly accessible`,
          affected: criticalAssets.slice(0, 3).map(a => a.path)
        });
      }
    }

    // Phase 114: JWT security recommendations
    if (authInfo?.jwtAnalysis?.length > 0) {
      const jwtVulns = authInfo.jwtAnalysis.filter(v => v.type === 'jwt-algorithm-not-pinned');
      if (jwtVulns.length > 0) {
        recommendations.push({
          priority: 'HIGH',
          title: 'Pin JWT verification algorithms',
          description: `Add explicit { algorithms: ['RS256'] } option to jwt.verify() calls to prevent algorithm confusion attacks (CVE-2024-54150)`,
          affected: jwtVulns.slice(0, 3).map(v => `${v.file}:${v.line}`)
        });
      }
    }

    // Phase 114: Hardcoded credential recommendations
    if (authInfo?.hardcodedCredentials?.length > 0) {
      const creds = authInfo.hardcodedCredentials;
      recommendations.push({
        priority: 'URGENT',
        title: 'Move credentials to environment variables',
        description: `${creds.length} hardcoded credentials found - use environment variables or secret management instead`,
        affected: creds.slice(0, 3).map(c => `${c.file}:${c.line}`)
      });
    }

    // Phase 114: Auth bypass mitigation
    if (authInfo?.coverageMatrix?.bypassCandidates?.length > 0) {
      const candidates = authInfo.coverageMatrix.bypassCandidates;
      recommendations.push({
        priority: 'HIGH',
        title: 'Add authentication to sensitive routes',
        description: `${candidates.length} sensitive routes lack authentication - add middleware to protect admin, user, and API endpoints`,
        affected: candidates.slice(0, 3).map(c => c.path)
      });
    }

    // Phase 115: Business logic recommendations
    if (workflowInfo?.flaws?.length > 0) {
      const criticalFlaws = workflowInfo.flaws.filter(f => f.severity === 'CRITICAL');
      if (criticalFlaws.length > 0) {
        recommendations.push({
          priority: 'URGENT',
          title: 'Fix critical business logic flaws',
          description: `${criticalFlaws.length} critical logic flaws - implement atomic validation and state machine enforcement`,
          affected: criticalFlaws.slice(0, 3).map(f => `${f.location.file}:${f.location.line}`)
        });
      }
    }

    return recommendations;
  }

  /**
   * Export results to JSON
   */
  exportToJson(pretty = false) {
    if (!this.results) {
      throw new Error('No reconnaissance results available. Run runFullRecon first.');
    }
    return pretty
      ? JSON.stringify(this.results, null, 2)
      : JSON.stringify(this.results);
  }

  /**
   * Get source map results
   */
  getSourceMap() {
    return this.results?.sourceInfo;
  }

  /**
   * Get target map results
   */
  getTargetMap() {
    return this.results?.targetInfo;
  }

  /**
   * Get tech stack results
   */
  getTechStack() {
    return this.results?.serviceInfo;
  }

  /**
   * Get risk report
   */
  getRiskReport() {
    return {
      risks: this.results?.risks || [],
      recommendations: this.results?.recommendations || [],
      summary: this.results?.summary || {}
    };
  }
}

module.exports = { ReconAggregator };
