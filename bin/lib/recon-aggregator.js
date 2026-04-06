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
const { TaintEngine } = require('./taint-engine');
const { PayloadGenerator } = require('./payloads');
const { TokenAnalyzer } = require('./token-analyzer');
const { PostExploitAnalyzer } = require('./post-exploit');

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
    this.taintEngine = new TaintEngine({ cache: this.cache });
    this.payloadGenerator = new PayloadGenerator({ cache: this.cache });
    this.tokenAnalyzer = new TokenAnalyzer({ cache: this.cache });
    this.postExploitAnalyzer = new PostExploitAnalyzer({ cache: this.cache });
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

    // Phase 115: Taint Analysis (deep/redteam tiers)
    let taintInfo = null;
    if (tier === 'deep' || tier === 'redteam') {
      console.log('  → Running taint analysis...');
      const taintFiles = await this.findSourceFiles(projectPath);
      taintInfo = await this.runTaintAnalysis(taintFiles);
    }

    // Phase 117: Payload Generation (deep/redteam tiers)
    let payloadInfo = null;
    if (tier === 'deep' || tier === 'redteam') {
      console.log('  → Generating WAF-evasion test payloads...');
      payloadInfo = this.runPayloadGeneration(projectPath);
    }

    // Phase 118: Token Analysis (deep/redteam tiers)
    let tokenInfo = null;
    if (tier === 'deep' || tier === 'redteam') {
      console.log('  → Analyzing tokens and credentials...');
      tokenInfo = await this.runTokenAnalysis(projectPath);
    }

    // Phase 119: Post-Exploitation (deep/redteam tiers)
    let postExploitInfo = null;
    if (tier === 'deep' || tier === 'redteam') {
      console.log('  → Analyzing post-exploitation vectors...');
      postExploitInfo = await this.runPostExploitAnalysis(projectPath);
    }

    // Compile results
    this.results = {
      summary: this.generateSummary(serviceInfo, sourceInfo, targetInfo, assetInfo, authInfo, workflowInfo, taintInfo, payloadInfo, tokenInfo, postExploitInfo),
      serviceInfo,
      sourceInfo,
      targetInfo,
      assetInfo,
      authInfo,
      workflowInfo,
      taintInfo,
      payloadInfo,
      tokenInfo,
      postExploitInfo,
      risks: this.generateRisks(serviceInfo, sourceInfo, targetInfo, assetInfo, authInfo, workflowInfo, taintInfo, payloadInfo, tokenInfo, postExploitInfo),
      recommendations: this.generateRecommendations(serviceInfo, sourceInfo, targetInfo, assetInfo, authInfo, workflowInfo, taintInfo, payloadInfo, tokenInfo, postExploitInfo)
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
        console.warn(`[recon-aggregator] sourceMapper.analyze skipped ${file}: ${err.message}`);
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
   * Run taint analysis on multiple files
   * Phase 115: RECON-07 Taint Analysis
   */
  async runTaintAnalysis(files) {
    const allTaintResults = [];

    // Limit to 50 files for expensive AST analysis (consistent with runWorkflowAnalysis)
    const analysisFiles = files.slice(0, 50);

    for (const file of analysisFiles) {
      try {
        const result = await this.taintEngine.analyze(file);
        if (result.summary && (result.summary.totalSources > 0 || result.summary.totalSinks > 0)) {
          allTaintResults.push(result);
        }
      } catch (err) {
        continue;
      }
    }

    // Aggregate data flow graphs
    const dataFlowGraphs = allTaintResults
      .filter(r => r.dataFlowGraph?.graph)
      .map(r => r.dataFlowGraph.graph);

    // Aggregate taint reports
    const taintReports = allTaintResults.map(r => this.taintEngine.generateTaintReport(r));

    // Calculate totals
    const totalSources = allTaintResults.reduce((sum, r) => sum + (r.summary?.totalSources || 0), 0);
    const totalSinks = allTaintResults.reduce((sum, r) => sum + (r.summary?.totalSinks || 0), 0);
    const riskyFlows = allTaintResults.reduce((sum, r) => sum + (r.summary?.riskyFlows || 0), 0);
    const sanitizedFlows = allTaintResults.reduce((sum, r) => sum + (r.summary?.sanitizedFlows || 0), 0);

    return {
      results: allTaintResults,
      dataFlowGraphs,
      taintReports,
      summary: {
        filesAnalyzed: analysisFiles.length,
        totalSources,
        totalSinks,
        riskyFlows,
        sanitizedFlows,
        sanitizationCoverage: riskyFlows > 0
          ? ((sanitizedFlows / riskyFlows) * 100).toFixed(1) + '%'
          : '0%'
      }
    };
  }

  /**
   * Generate WAF-evasion test payloads
   * Phase 117: PAYLOAD-01 to PAYLOAD-05
   */
  runPayloadGeneration(projectPath) {
    const payloads = {
      commandInjection: this.payloadGenerator.generateCommandInjectionPayloads(),
      xssEvasion: this.payloadGenerator.generateXssEvasionPayloads(),
      sqliEvasion: this.payloadGenerator.generateSqliEvasionPayloads(),
      doubleExtension: this.payloadGenerator.generateDoubleExtensionTestFiles()
    };
    return payloads;
  }

  /**
   * Run token analysis on source files
   * Phase 118: TOKEN-01 to TOKEN-04
   */
  async runTokenAnalysis(projectPath) {
    const fs = require('fs');
    const files = await this.findSourceFiles(projectPath);
    const allTokens = [];
    const allCookies = [];
    const allVulnerabilities = [];

    for (const file of files.slice(0, 50)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const result = this.tokenAnalyzer.analyze(content);
        if (result.jwtAnalysis) {
          for (const jwt of result.jwtAnalysis) {
            if (jwt.vulnerabilities?.length > 0) {
              allVulnerabilities.push(...jwt.vulnerabilities.map(v => ({ ...v, location: file, type: 'jwt' })));
            }
          }
        }
        if (result.cookieAnalysis) {
          for (const cookie of result.cookieAnalysis) {
            if (cookie.vulnerabilities?.length > 0) {
              allCookies.push({ ...cookie, location: file });
            }
          }
        }
        if (result.tokenFindings) {
          const findings = result.tokenFindings;
          if (findings.bearerTokens?.length > 0) {
            allTokens.push(...findings.bearerTokens.map(t => ({ ...t, location: file, secret: false })));
          }
          if (findings.apiKeys?.length > 0) {
            allTokens.push(...findings.apiKeys.map(t => ({ ...t, location: file, secret: true })));
          }
          if (findings.basicAuth?.length > 0) {
            allTokens.push(...findings.basicAuth.map(t => ({ ...t, location: file, secret: true })));
          }
          if (findings.environmentCredentials?.length > 0) {
            allTokens.push(...findings.environmentCredentials.map(t => ({ ...t, location: file, secret: true })));
          }
        }
      } catch (err) {
        continue;
      }
    }

    return {
      vulnerabilities: allVulnerabilities,
      tokens: allTokens,
      cookies: allCookies,
      summary: {
        filesAnalyzed: Math.min(files.length, 50),
        jwtVulnerabilities: allVulnerabilities.filter(v => v.type === 'jwt').length,
        sessionCookies: allCookies.length,
        exposedTokens: allTokens.length,
        criticalVulnerabilities: allVulnerabilities.filter(v => v.severity === 'CRITICAL').length
      }
    };
  }

  /**
   * Run post-exploitation analysis on source files
   * Phase 119: POST-01 to POST-04
   */
  async runPostExploitAnalysis(projectPath) {
    const fs = require('fs');
    const files = await this.findSourceFiles(projectPath);
    const allFindings = {
      webShells: [],
      persistence: [],
      exfiltration: [],
      lateralMovement: []
    };

    for (const file of files.slice(0, 50)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const result = this.postExploitAnalyzer.analyze(content, file);
        if (result.webShells?.length > 0) {
          allFindings.webShells.push(...result.webShells.map(w => ({ ...w, location: file })));
        }
        if (result.persistence?.length > 0) {
          allFindings.persistence.push(...result.persistence.map(p => ({ ...p, location: file })));
        }
        if (result.exfiltration?.length > 0) {
          allFindings.exfiltration.push(...result.exfiltration.map(e => ({ ...e, location: file })));
        }
        if (result.lateralMovement?.length > 0) {
          allFindings.lateralMovement.push(...result.lateralMovement.map(l => ({ ...l, location: file })));
        }
      } catch (err) {
        continue;
      }
    }

    return allFindings;
  }

  /**
   * Generate summary statistics
   */
  generateSummary(serviceInfo, sourceInfo, targetInfo, assetInfo, authInfo, workflowInfo, taintInfo, payloadInfo, tokenInfo, postExploitInfo) {
    return {
      overallRisk: this.calculateOverallRisk(serviceInfo, sourceInfo, targetInfo, assetInfo, authInfo, workflowInfo, tokenInfo, postExploitInfo),
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
      criticalLogicFlaws: workflowInfo?.summary?.criticalFlaws || 0,
      taintSources: taintInfo?.summary?.totalSources || 0,
      taintSinks: taintInfo?.summary?.totalSinks || 0,
      riskyFlows: taintInfo?.summary?.riskyFlows || 0,
      sanitizedFlows: taintInfo?.summary?.sanitizedFlows || 0,
      sanitizationCoverage: taintInfo?.summary?.sanitizationCoverage || '0%',
      commandInjectionPayloads: payloadInfo?.commandInjection?.length || 0,
      xssEvasionPayloads: payloadInfo?.xssEvasion?.length || 0,
      sqliEvasionPayloads: payloadInfo?.sqliEvasion?.length || 0,
      // Phase 118: Token analysis
      jwtVulnerabilitiesAnalyzed: tokenInfo?.summary?.jwtVulnerabilities || 0,
      sessionCookiesAnalyzed: tokenInfo?.summary?.sessionCookies || 0,
      exposedTokens: tokenInfo?.summary?.exposedTokens || 0,
      criticalTokenVulnerabilities: tokenInfo?.summary?.criticalVulnerabilities || 0,
      // Phase 119: Post-exploitation analysis
      webShellsDetected: postExploitInfo?.webShells?.length || 0,
      persistenceRisks: postExploitInfo?.persistence?.length || 0,
      exfiltrationChannels: postExploitInfo?.exfiltration?.length || 0,
      lateralMovementPaths: postExploitInfo?.lateralMovement?.length || 0
    };
  }

  /**
   * Calculate overall risk level
   */
  calculateOverallRisk(serviceInfo, sourceInfo, targetInfo, assetInfo, authInfo, workflowInfo, tokenInfo, postExploitInfo) {
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

    // Phase 118: Token vulnerabilities (max 15 points)
    const criticalTokenVulns = tokenInfo?.summary?.criticalVulnerabilities || 0;
    const jwtVulnsAnalyzed = tokenInfo?.summary?.jwtVulnerabilities || 0;
    score += criticalTokenVulns * 5 + Math.min(jwtVulnsAnalyzed, 15);

    // Phase 119: Post-exploitation indicators (max 15 points)
    const webShells = postExploitInfo?.webShells?.length || 0;
    const criticalWebShells = postExploitInfo?.webShells?.filter(w => w.severity === 'CRITICAL').length || 0;
    const persistence = postExploitInfo?.persistence?.length || 0;
    const exfiltration = postExploitInfo?.exfiltration?.length || 0;
    const lateralMovement = postExploitInfo?.lateralMovement?.length || 0;
    score += criticalWebShells * 5 + Math.min(webShells * 2, 15) + Math.min(persistence, 5) + Math.min(exfiltration, 5) + Math.min(lateralMovement, 5);

    if (score >= 60) return 'CRITICAL';
    if (score >= 40) return 'HIGH';
    if (score >= 20) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Generate risk findings
   */
  generateRisks(serviceInfo, sourceInfo, targetInfo, assetInfo, authInfo, workflowInfo, taintInfo, payloadInfo, tokenInfo, postExploitInfo) {
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

    // Phase 115: Taint analysis risks
    if (taintInfo?.summary?.riskyFlows > 0) {
      const riskyFlows = taintInfo.summary.riskyFlows;
      const criticalFlows = riskyFlows - taintInfo.summary.sanitizedFlows;
      if (criticalFlows > 0) {
        risks.push({
          severity: 'HIGH',
          category: 'Injection',
          title: `${criticalFlows} unsanitized injection paths`,
          description: 'Untrusted input flows to dangerous sinks without sanitization',
          affected: taintInfo.results?.slice(0, 3).map(r => r.sources?.[0]?.location?.file).filter(Boolean) || []
        });
      }
    }

    // Phase 118: Token risks
    if (tokenInfo?.vulnerabilities?.length > 0) {
      const criticalTokens = tokenInfo.vulnerabilities.filter(v => v.severity === 'CRITICAL');
      if (criticalTokens.length > 0) {
        risks.push({
          severity: 'CRITICAL',
          category: 'Token',
          title: `${criticalTokens.length} critical token vulnerabilities`,
          description: 'JWT alg:none, weak secrets, or predictable session IDs detected',
          affected: criticalTokens.slice(0, 3).map(v => v.location)
        });
      }
    }

    // Exposed credentials in source
    if (tokenInfo?.tokens?.some(t => t.secret)) {
      risks.push({
        severity: 'CRITICAL',
        category: 'Credentials',
        title: 'Exposed credentials in source code',
        description: 'API keys, tokens, or secrets found in source files',
        affected: tokenInfo.tokens.filter(t => t.secret).slice(0, 3).map(t => t.location)
      });
    }

    // Phase 119: Post-Exploitation risks
    if (postExploitInfo?.webShells?.length > 0) {
      const criticalWebShells = postExploitInfo.webShells.filter(w => w.severity === 'CRITICAL');
      if (criticalWebShells.length > 0) {
        risks.push({
          severity: 'CRITICAL',
          category: 'Persistence',
          title: `${criticalWebShells.length} web shell backdoors detected`,
          description: 'Code execution backdoors found in source (T1505.003)',
          affected: criticalWebShells.slice(0, 3).map(w => w.location)
        });
      }
    }

    if (postExploitInfo?.persistence?.length > 0) {
      risks.push({
        severity: 'HIGH',
        category: 'Persistence',
        title: `${postExploitInfo.persistence.length} persistence mechanisms detected`,
        description: 'Cron jobs, startup scripts, or SSH key configurations found (T1053)',
        affected: postExploitInfo.persistence.slice(0, 3).map(p => p.location)
      });
    }

    if (postExploitInfo?.exfiltration?.length > 0) {
      risks.push({
        severity: 'HIGH',
        category: 'Exfiltration',
        title: `${postExploitInfo.exfiltration.length} data exfiltration channels detected`,
        description: 'DNS tunneling, HTTP exfiltration, or cloud storage paths found (T1560)',
        affected: postExploitInfo.exfiltration.slice(0, 3).map(e => e.location)
      });
    }

    if (postExploitInfo?.lateralMovement?.length > 0) {
      risks.push({
        severity: 'HIGH',
        category: 'Lateral Movement',
        title: `${postExploitInfo.lateralMovement.length} lateral movement paths detected`,
        description: 'Network scanning, pass-the-hash, or SSH tunneling patterns found (T1021)',
        affected: postExploitInfo.lateralMovement.slice(0, 3).map(l => l.location)
      });
    }

    return risks.sort((a, b) => {
      const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(serviceInfo, sourceInfo, targetInfo, assetInfo, authInfo, workflowInfo, taintInfo, payloadInfo, tokenInfo, postExploitInfo) {
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

    // Phase 115: Taint analysis recommendations
    if (taintInfo?.summary?.riskyFlows > 0) {
      const unsanitizedFlows = taintInfo.summary.riskyFlows - taintInfo.summary.sanitizedFlows;
      if (unsanitizedFlows > 0) {
        recommendations.push({
          priority: 'HIGH',
          title: 'Implement input sanitization',
          description: `${unsanitizedFlows} unsanitized source-to-sink paths need validation/sanitization`,
          affected: taintInfo.results?.slice(0, 3).map(r => r.sources?.[0]?.location?.file).filter(Boolean) || []
        });
      }
    }

    // Phase 117: WAF testing recommendations
    if (payloadInfo) {
      const totalPayloads = (payloadInfo.commandInjection?.length || 0) +
        (payloadInfo.xssEvasion?.length || 0) +
        (payloadInfo.sqliEvasion?.length || 0);
      if (totalPayloads > 0) {
        recommendations.push({
          priority: 'MEDIUM',
          title: 'Test WAF effectiveness with evasion payloads',
          description: `Generated ${totalPayloads} WAF-evasion test payloads (${payloadInfo.commandInjection?.length || 0} command injection, ${payloadInfo.xssEvasion?.length || 0} XSS, ${payloadInfo.sqliEvasion?.length || 0} SQLi). Test your WAF against these to verify detection coverage.`
        });
      }
    }

    // Phase 118: Token security recommendations
    if (tokenInfo?.vulnerabilities?.length > 0) {
      const jwtAlgNone = tokenInfo.vulnerabilities.filter(v => v.type === 'alg_none');
      if (jwtAlgNone.length > 0) {
        recommendations.push({
          priority: 'URGENT',
          title: 'Fix JWT algorithm vulnerabilities',
          description: `${jwtAlgNone.length} JWTs with alg:none - remove unsigned tokens or use RS256/HS256 with secure secrets`,
          affected: jwtAlgNone.slice(0, 3).map(v => v.location)
        });
      }
    }

    // Cookie security
    const insecureCookies = tokenInfo?.cookies?.filter(c => !c.flags?.secure || !c.flags?.httpOnly);
    if (insecureCookies?.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        title: 'Secure session cookies',
        description: `${insecureCookies.length} cookies missing security flags - add HttpOnly and Secure flags`,
        affected: insecureCookies.slice(0, 3).map(c => c.name)
      });
    }

    // Phase 119: Post-exploitation recommendations
    if (postExploitInfo?.webShells?.length > 0) {
      recommendations.push({
        priority: 'URGENT',
        title: 'Remove web shell backdoors',
        description: `${postExploitInfo.webShells.length} web shell patterns detected - remove immediately`,
        affected: postExploitInfo.webShells.slice(0, 3).map(w => w.location)
      });
    }

    if (postExploitInfo?.persistence?.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        title: 'Review persistence mechanisms',
        description: `${postExploitInfo.persistence.length} persistence patterns found - verify legitimacy or remove`,
        affected: postExploitInfo.persistence.slice(0, 3).map(p => p.location)
      });
    }

    if (postExploitInfo?.exfiltration?.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        title: 'Investigate data exfiltration channels',
        description: `${postExploitInfo.exfiltration.length} exfiltration patterns detected - block or monitor these channels`,
        affected: postExploitInfo.exfiltration.slice(0, 3).map(e => e.location)
      });
    }

    if (postExploitInfo?.lateralMovement?.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        title: 'Block lateral movement paths',
        description: `${postExploitInfo.lateralMovement.length} lateral movement patterns found - restrict network access`,
        affected: postExploitInfo.lateralMovement.slice(0, 3).map(l => l.location)
      });
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
