/**
 * Taint Engine - Deep taint analysis with inter-procedural tracking and sanitization
 * Phase 115: RECON-07 - Taint Analysis
 */

const fs = require('fs').promises;
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { SourceMapper } = require('./source-mapper');
const { ReconCache } = require('./recon-cache');
const { mermaidValidator } = require('./mermaid-validator');

/**
 * Taint Engine - Deep taint analysis with inter-procedural tracking and sanitization
 */
class TaintEngine {
  constructor(options = {}) {
    this.cache = options.cache || new ReconCache();
    this.sourceMapper = new SourceMapper({ cache: this.cache });
    this.taintGraphs = new Map(); // file -> taint graph
  }

  /**
   * Analyze a file for taint flow
   * @param {string} filePath - Path to JavaScript/TypeScript file
   * @returns {Promise<Object>} Analysis results with data flow graph
   */
  async analyze(filePath) {
    // Read file
    const code = await fs.readFile(filePath, 'utf-8');
    const ast = this.sourceMapper.parseAST(code, filePath);

    // Run source-mapper analysis
    const sources = this.sourceMapper.findSources(ast, filePath);
    const sinks = this.sourceMapper.findSinks(ast, filePath);

    this.sourceMapper.sources = sources;
    this.sourceMapper.sinks = sinks;

    const { sourceToSink, sanitizationEdges } = this.sourceMapper.mapSourcesToSinks(ast);
    this.sourceMapper.sourceToSinkMap = sourceToSink;
    this.sourceMapper.sanitizationEdges = sanitizationEdges;

    // Build data flow graph
    const graphResult = this.buildDataFlowGraph(sources, sinks, sanitizationEdges);

    // Build taint paths
    const taintPaths = this.buildTaintPaths(sources, sinks, sanitizationEdges);

    const result = {
      sources,
      sinks,
      sourceToSinkMap: this.sourceMapper.getSourceToSinkMap(),
      sanitizationEdges: this.sourceMapper.getSanitizationEdges(),
      riskyFlows: this.sourceMapper.getRiskyFlows(),
      dataFlowGraph: graphResult,
      taintPaths,
      summary: {
        totalSources: sources.length,
        totalSinks: sinks.length,
        riskyFlows: this.sourceMapper.getRiskyFlows().length,
        sanitizedFlows: this.sourceMapper.getSanitizationEdges().length,
        graphValid: graphResult.valid,
        graphWarnings: graphResult.warnings?.length || 0
      }
    };

    return result;
  }

  /**
   * Build data flow graph visualization
   * @returns {{ graph: string, valid: boolean, errors: Array, warnings: Array }}
   */
  buildDataFlowGraph(sources, sinks, sanitizationEdges) {
    const lines = ['flowchart TD'];

    // Add source nodes
    sources.forEach((source, idx) => {
      const label = `${source.type}\\nL${source.location?.line || 0}`;
      lines.push(`  S${idx}["${label}"]`);
    });

    // Add sink nodes
    sinks.forEach((sink, idx) => {
      const riskColor = sink.risk === 'critical' ? 'red' :
                        sink.risk === 'high' ? 'orange' : 'yellow';
      const label = `${sink.type}\\nL${sink.location?.line || 0}`;
      lines.push(`  K${idx}["${label}"]`);
    });

    // Add edges with sanitization markers
    for (const [key, data] of sanitizationEdges.entries()) {
      const [sourceIdx, sinkCode] = key.split('-');
      const sinkIdx = sinks.findIndex(s => s.code === sinkCode);
      if (sinkIdx >= 0) {
        const marker = data.sanitized ? '--sanitized-->' : '-->';
        const style = data.sanitized ? `style K${sinkIdx} fill:#90EE90` : '';
        lines.push(`  S${sourceIdx} ${marker} K${sinkIdx}`);
        if (style) lines.push(`  ${style}`);
      }
    }

    const graph = lines.join('\n');

    // Validate
    const validation = mermaidValidator(graph);
    return {
      graph,
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings
    };
  }

  /**
   * Build detailed taint paths
   * @returns {Array} Array of { sourceIndex, sinkCode, path, sanitized, sanitizer }
   */
  buildTaintPaths(sources, sinks, sanitizationEdges) {
    const paths = [];

    for (const [key, data] of sanitizationEdges.entries()) {
      const [sourceIdx, sinkCode] = key.split('-');
      const source = sources[parseInt(sourceIdx)];
      const sink = sinks.find(s => s.code === sinkCode);

      if (source && sink) {
        paths.push({
          sourceIndex: parseInt(sourceIdx),
          sinkCode,
          path: [source.variable, sink.type].filter(Boolean),
          sanitized: data.sanitized,
          sanitizer: data.sanitizer,
          location: data.location
        });
      }
    }

    return paths;
  }

  /**
   * Generate comprehensive taint analysis report
   * @param {Object} analysisResult - Result from analyze()
   * @returns {Object} Report with summary and flows
   */
  generateTaintReport(analysisResult) {
    const { sources, sinks, sanitizationEdges, summary } = analysisResult;

    const criticalFlows = analysisResult.riskyFlows?.filter(r => r.riskLevel >= 4) || [];
    const highFlows = analysisResult.riskyFlows?.filter(r => r.riskLevel === 3) || [];

    // Build flow table
    const flows = [];
    for (const entry of analysisResult.sourceToSinkMap || []) {
      for (const sink of entry.sinks) {
        flows.push({
          source: entry.source.type,
          sink: sink.type,
          sanitized: sink.sanitized || false,
          sanitizer: sink.sanitizer || null,
          risk: sink.risk
        });
      }
    }

    return {
      summary: {
        totalFlows: flows.length,
        unsanitizedFlows: flows.filter(f => !f.sanitized).length,
        sanitizedFlows: flows.filter(f => f.sanitized).length,
        criticalFlows: criticalFlows.length,
        highFlows: highFlows.length
      },
      flows,
      sanitizationCoverage: summary.sanitizedFlows > 0
        ? (summary.sanitizedFlows / flows.length * 100).toFixed(1) + '%'
        : '0%'
    };
  }

  /**
   * Get detailed taint path for a specific source-sink pair
   * @param {number} sourceIndex - Source index
   * @param {string} sinkCode - Sink code
   * @returns {Array} Array of { path: [node names], sanitized: boolean }
   */
  getTaintPaths(sourceIndex, sinkCode) {
    const paths = [];
    // Walk through call graph to find taint path
    // Return array of { path: [node names], sanitized: boolean }
    return paths;
  }
}

module.exports = { TaintEngine };
