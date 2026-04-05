/**
 * Data Flow Graph - DOT format graph generation for taint paths
 * Phase 115: Advanced Reconnaissance - RECON-07 (D-11)
 *
 * Generates DOT format data flow graphs showing source-to-sink taint paths
 * with proper node styling and edge labels.
 */

/**
 * Graph data structure for taint flow visualization
 */
class DataFlowGraph {
  constructor(options = {}) {
    this.nodes = new Map();
    this.edges = [];
    this.nodeCounter = 0;
    this.options = {
      rankdir: options.rankdir || 'LR', // Left to right layout
      fontname: options.fontname || 'Arial',
      fontsize: options.fontsize || 12,
      ...options
    };
  }

  /**
   * Add a node to the graph
   * Supports both object API: addNode({ id, type, label, ... })
   * and positional API: addNode(label, type, metadata)
   * @param {string|Object} labelOrOptions - Node label or options object
   * @param {string} type - Node type (for positional API)
   * @param {Object} metadata - Additional metadata (for positional API)
   * @returns {string} Node ID
   */
  addNode(labelOrOptions, type = 'default', metadata = {}) {
    let nodeData;

    if (typeof labelOrOptions === 'object' && labelOrOptions !== null) {
      // Object API: { id, type, label, ... }
      nodeData = {
        id: labelOrOptions.id || `node${++this.nodeCounter}`,
        type: labelOrOptions.type || 'default',
        label: this.escapeLabel(labelOrOptions.label || ''),
        ...labelOrOptions
      };
    } else {
      // Positional API: addNode(label, type, metadata)
      const id = `node${++this.nodeCounter}`;
      nodeData = {
        id,
        label: this.escapeLabel(labelOrOptions),
        type,
        ...metadata
      };
    }

    this.nodes.set(nodeData.id, nodeData);
    return nodeData.id;
  }

  /**
   * Add an edge between nodes
   * Supports both object API: addEdge({ from, to, label })
   * and positional API: addEdge(from, to, label)
   * @param {string|Object} fromOrOptions - Source node ID or options object
   * @param {string} to - Target node ID (for positional API)
   * @param {string} label - Edge label (for positional API)
   * @returns {Object} Edge object
   */
  addEdge(fromOrOptions, to, label = '') {
    let edgeData;

    if (typeof fromOrOptions === 'object' && fromOrOptions !== null) {
      // Object API: { from, to, label }
      edgeData = {
        from: fromOrOptions.from,
        to: fromOrOptions.to,
        label: this.escapeLabel(fromOrOptions.label || ''),
        ...fromOrOptions
      };
    } else {
      // Positional API: addEdge(from, to, label)
      edgeData = { from: fromOrOptions, to, label: this.escapeLabel(label) };
    }

    this.edges.push(edgeData);
    return edgeData;
  }

  /**
   * Get all nodes as array
   * @returns {Array} Array of node objects
   */
  getNodes() {
    return Array.from(this.nodes.values());
  }

  /**
   * Get all edges as array
   * @returns {Array} Array of edge objects
   */
  getEdges() {
    return this.edges;
  }

  /**
   * Get nodes by type
   * @param {string} type - Node type to filter by
   * @returns {Array} Array of matching nodes
   */
  getNodesByType(type) {
    return this.getNodes().filter(node => node.type === type);
  }

  /**
   * Get edges between two nodes
   * @param {string} from - Source node ID
   * @param {string} to - Target node ID
   * @returns {Array} Array of matching edges
   */
  getEdgesBetween(from, to) {
    return this.edges.filter(edge => edge.from === from && edge.to === to);
  }

  /**
   * Get edge by ID (index in edges array)
   * @param {string} id - Edge ID (can be index or custom id)
   * @returns {Object|null} Edge object or null
   */
  getEdgeById(id) {
    if (typeof id === 'number') {
      return this.edges[id] || null;
    }
    // Search by custom id property if exists
    return this.edges.find(edge => edge.id === id) || null;
  }

  /**
   * Find node by ID
   * @param {string} id - Node ID
   * @returns {Object|null} Node object or null
   */
  getNode(id) {
    return this.nodes.get(id) || null;
  }

  /**
   * Escape special characters for DOT labels
   * @param {string} label - Raw label
   * @returns {string} Escaped label
   */
  escapeLabel(label) {
    if (typeof label !== 'string') {
      return String(label);
    }

    return label
      .replace(/\\/g, '\\\\')  // Escape backslashes first
      .replace(/"/g, '\\"')   // Escape quotes
      .replace(/\n/g, '\\n')   // Escape newlines
      .replace(/\r/g, '\\r')   // Escape carriage returns
      .replace(/\t/g, '\\t')   // Escape tabs
      .substring(0, 50);       // Truncate long labels
  }

  /**
   * Generate DOT format output
   * @returns {string} DOT format graph
   */
  generateDOT() {
    const lines = ['digraph TaintGraph {'];

    // Graph attributes
    lines.push(`  rankdir=${this.options.rankdir};`);
    lines.push(`  node [fontname="${this.options.fontname}", fontsize=${this.options.fontsize}];`);
    lines.push(`  edge [fontname="${this.options.fontname}", fontsize=${this.options.fontsize - 2}];`);
    lines.push('');

    // Node definitions with styling
    for (const [id, node] of this.nodes) {
      const style = this.getNodeStyle(node.type);
      const tooltip = node.location ? `tooltip="${this.escapeLabel(`${node.location.file}:${node.location.line}`)}"` : '';
      lines.push(`  "${id}" [label="${node.label}", ${style}${tooltip ? ', ' + tooltip : ''}];`);
    }

    if (this.nodes.size > 0) {
      lines.push('');
    }

    // Edge definitions
    for (const edge of this.edges) {
      const labelAttr = edge.label ? ` [label="${this.escapeLabel(edge.label)}"]` : '';
      lines.push(`  "${edge.from}" -> "${edge.to}"${labelAttr};`);
    }

    lines.push('}');
    return lines.join('\n');
  }

  /**
   * Get DOT style attributes for node type
   * @param {string} type - Node type
   * @returns {string} Style attributes
   */
  getNodeStyle(type) {
    const styles = {
      source: 'shape=ellipse, fillcolor=lightcoral, style=filled',
      transform: 'shape=box, fillcolor=lightblue, style=filled',
      sink: 'shape=diamond, fillcolor=lightgoldenrod1, style=filled',
      sanitizer: 'shape=hexagon, fillcolor=lightgreen, style=filled',
      default: 'shape=box, fillcolor=white, style=filled'
    };
    return styles[type] || styles.default;
  }

  /**
   * Build graph from taint analysis results
   * @param {Array} taintFlows - Array of taint flow objects
   * @returns {string} DOT format graph
   */
  buildFromTaintResults(taintFlows) {
    if (!taintFlows || taintFlows.length === 0) {
      // Create empty graph with note
      this.addNode('No taint flows detected', 'default');
      return this.generateDOT();
    }

    for (const flow of taintFlows) {
      if (!flow.source) continue;

      // Add source node
      const sourceCode = flow.source.code ? flow.source.code.substring(0, 30) : flow.source.type;
      const sourceLabel = `${flow.source.type}\\n${sourceCode}`;
      const sourceId = this.addNode(sourceLabel, 'source', {
        location: flow.source.location,
        risk: 'source'
      });

      let prevId = sourceId;

      // Add intermediate transformations
      if (flow.path && flow.path.length > 0) {
        for (const transform of flow.path) {
          let transformLabel;
          if (typeof transform === 'object') {
            const varName = transform.variable || transform.property || 'unnamed';
            const type = transform.type || 'transform';
            transformLabel = `${type}\\n${varName}`;
          } else {
            transformLabel = String(transform);
          }

          const transformId = this.addNode(transformLabel, 'transform', {
            hop: transform.hops || 0
          });

          const edgeLabel = transform.type || '';
          this.addEdge(prevId, transformId, edgeLabel);
          prevId = transformId;
        }
      }

      // Add sanitizer node if flow is sanitized
      if (flow.sanitized) {
        const sanitizerId = this.addNode('sanitized\\n(sanitizer)', 'sanitizer', {
          method: flow.sanitizationMethod
        });
        this.addEdge(prevId, sanitizerId, 'sanitizes');
        prevId = sanitizerId;
      }

      // Add sink node
      if (flow.sink) {
        const sinkCode = flow.sink.code ? flow.sink.code.substring(0, 30) : flow.sink.type;
        const sinkLabel = `${flow.sink.type}\\n${sinkCode}`;
        const sinkId = this.addNode(sinkLabel, 'sink', {
          location: flow.sink.location,
          risk: flow.risk || 'medium'
        });
        this.addEdge(prevId, sinkId, flow.hops ? `${flow.hops} hops` : '');
      }
    }

    return this.generateDOT();
  }

  /**
   * Build graph from source-to-sink mapping
   * @param {Array} sourceToSinkMap - Array of { source, sinks } objects
   * @returns {string} DOT format graph
   */
  buildFromSourceToSinkMap(sourceToSinkMap) {
    if (!sourceToSinkMap || sourceToSinkMap.length === 0) {
      this.addNode('No data flows detected', 'default');
      return this.generateDOT();
    }

    for (const { source, sinks } of sourceToSinkMap) {
      // Add source node
      const sourceCode = source.code ? source.code.substring(0, 30) : source.type;
      const sourceLabel = `${source.type}\\n${sourceCode}`;
      const sourceId = this.addNode(sourceLabel, 'source', {
        location: source.location
      });

      // Add sink nodes and edges
      for (const sink of sinks) {
        const sinkCode = sink.code ? sink.code.substring(0, 30) : sink.type;
        const sinkLabel = `${sink.type}\\n${sinkCode}`;
        const sinkId = this.addNode(sinkLabel, 'sink', {
          location: sink.location,
          risk: sink.risk || 'medium'
        });
        this.addEdge(sourceId, sinkId, sink.risk || '');
      }
    }

    return this.generateDOT();
  }

  /**
   * Convert DOT to Mermaid flowchart syntax
   * @param {string} dotContent - DOT format content (optional, uses current graph if not provided)
   * @returns {string} Mermaid diagram
   */
  toMermaid(dotContent) {
    // If no DOT content provided, generate from current graph
    if (!dotContent) {
      return this.toMermaidFromGraph();
    }

    // Parse DOT and convert to Mermaid
    const lines = ['flowchart LR'];

    // Simple regex-based conversion
    const nodeRegex = /"(\w+)"\s*\[label="([^"]+)"[^;]*\]/g;
    const edgeRegex = /"(\w+)"\s*->\s*"(\w+)"(?:\s*\[label="([^"]*)"\])?;/g;

    const nodes = new Map();
    let match;

    // Extract nodes
    while ((match = nodeRegex.exec(dotContent)) !== null) {
      const [, id, label] = match;
      // Determine node style based on DOT style attributes
      let style = '';
      if (dotContent.includes('lightcoral') && dotContent.indexOf(match[0]) < dotContent.indexOf('lightgoldenrod1')) {
        style = '(['; // Source style
      } else if (dotContent.includes('lightgoldenrod1') && dotContent.indexOf(match[0]) > dotContent.indexOf('lightcoral')) {
        style = '{'; // Sink style
      }
      nodes.set(id, { label, style });
    }

    // Extract edges
    while ((match = edgeRegex.exec(dotContent)) !== null) {
      const [, from, to, label] = match;
      const edgeLabel = label ? `|"${label}"|` : '';
      lines.push(`  ${from}${edgeLabel} --> ${to}`);
    }

    // Add node definitions
    for (const [id, { label }] of nodes) {
      lines.push(`  ${id}["${label}"]`);
    }

    return lines.join('\n');
  }

  /**
   * Convert current graph to Mermaid syntax
   * @returns {string} Mermaid diagram
   */
  toMermaidFromGraph() {
    const lines = ['flowchart LR'];

    // Define nodes with Mermaid shapes based on type
    for (const [id, node] of this.nodes) {
      let shape;
      switch (node.type) {
        case 'source':
          shape = '(['; // Stadium shape for sources
          lines.push(`  ${id}${shape}"${node.label}"])`);
          break;
        case 'sink':
          shape = '{'; // Diamond shape for sinks
          lines.push(`  ${id}${shape}"${node.label}"}`);
          break;
        case 'sanitizer':
          shape = '{{'; // Hexagon for sanitizers
          lines.push(`  ${id}${shape}"${node.label}"}}`);
          break;
        case 'transform':
        default:
          shape = '['; // Box for transforms
          lines.push(`  ${id}${shape}"${node.label}"]`);
      }
    }

    // Add edges
    for (const edge of this.edges) {
      const label = edge.label ? `|"${edge.label}"|` : '';
      lines.push(`  ${edge.from}${label} --> ${edge.to}`);
    }

    return lines.join('\n');
  }

  /**
   * Generate HTML with embedded DOT (using viz.js or similar)
   * @param {string} dotContent - DOT content
   * @returns {string} HTML document
   */
  generateHTML(dotContent) {
    const dot = dotContent || this.generateDOT();

    return `<!DOCTYPE html>
<html>
<head>
  <title>Taint Flow Graph</title>
  <script src="https://unpkg.com/viz.js@2.1.2-pre.1/viz.js"></script>
  <script src="https://unpkg.com/viz.js@2.1.2-pre.1/full.render.js"></script>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    #graph { text-align: center; }
    pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>Data Flow Graph</h1>
  <div id="graph"></div>
  <h2>DOT Source</h2>
  <pre>${this.escapeLabel(dot)}</pre>
  <script>
    const dot = \`${dot.replace(/`/g, '\\`')}\`;
    const viz = new Viz();
    viz.renderSVGElement(dot)
      .then(element => {
        document.getElementById('graph').appendChild(element);
      })
      .catch(error => {
        document.getElementById('graph').innerHTML = '<p>Error rendering graph: ' + error + '</p>';
      });
  </script>
</body>
</html>`;
  }

  /**
   * Export graph as JSON
   * @returns {Object} Graph data structure
   */
  toJSON() {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
      metadata: {
        nodeCount: this.nodes.size,
        edgeCount: this.edges.length,
        generated: new Date().toISOString()
      }
    };
  }

  /**
   * Load graph from JSON
   * @param {Object} data - JSON data
   */
  fromJSON(data) {
    this.nodes.clear();
    this.edges = [];

    if (data.nodes) {
      for (const node of data.nodes) {
        this.nodes.set(node.id, node);
        const num = parseInt(node.id.replace('node', ''), 10);
        if (num > this.nodeCounter) {
          this.nodeCounter = num;
        }
      }
    }

    if (data.edges) {
      this.edges = data.edges;
    }
  }

  /**
   * Merge another graph into this one
   * @param {DataFlowGraph} other - Graph to merge
   */
  merge(other) {
    const idMap = new Map();

    // Merge nodes
    for (const [oldId, node] of other.nodes) {
      const newId = this.addNode(node.label, node.type, node);
      idMap.set(oldId, newId);
    }

    // Merge edges with remapped IDs
    for (const edge of other.edges) {
      const fromId = idMap.get(edge.from);
      const toId = idMap.get(edge.to);
      if (fromId && toId) {
        this.addEdge(fromId, toId, edge.label);
      }
    }
  }

  /**
   * Find paths from a source node
   * @param {string} sourceId - Source node ID
   * @returns {Array} Array of paths
   */
  findPathsFromSource(sourceId) {
    const paths = [];
    const visited = new Set();

    const dfs = (currentId, currentPath) => {
      if (visited.has(currentId)) return;
      visited.add(currentId);

      const newPath = [...currentPath, currentId];
      const outgoingEdges = this.edges.filter(e => e.from === currentId);

      if (outgoingEdges.length === 0) {
        // Reached a sink
        paths.push(newPath);
      } else {
        for (const edge of outgoingEdges) {
          dfs(edge.to, newPath);
        }
      }

      visited.delete(currentId);
    };

    dfs(sourceId, []);
    return paths;
  }

  /**
   * Find all source-to-sink paths
   * @returns {Array} Array of paths
   */
  findAllSourceToSinkPaths() {
    const paths = [];

    for (const [id, node] of this.nodes) {
      if (node.type === 'source') {
        paths.push(...this.findPathsFromSource(id));
      }
    }

    return paths;
  }

  /**
   * Get statistics about the graph
   * @returns {Object} Statistics
   */
  getStatistics() {
    const nodeTypes = new Map();
    for (const node of this.nodes.values()) {
      nodeTypes.set(node.type, (nodeTypes.get(node.type) || 0) + 1);
    }

    return {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.length,
      nodeTypes: Object.fromEntries(nodeTypes),
      sourceToSinkPaths: this.findAllSourceToSinkPaths().length
    };
  }

  /**
   * Clear the graph
   */
  clear() {
    this.nodes.clear();
    this.edges = [];
    this.nodeCounter = 0;
  }

  /**
   * Find all paths between two nodes
   * @param {string} from - Start node ID
   * @param {string} to - End node ID
   * @returns {Array} Array of paths (each path is array of node IDs)
   */
  findPaths(from, to) {
    const paths = [];
    const visited = new Set();

    const dfs = (currentId, currentPath) => {
      if (currentId === to) {
        paths.push([...currentPath, to]);
        return;
      }

      if (visited.has(currentId)) return;
      visited.add(currentId);

      const newPath = [...currentPath, currentId];
      const outgoingEdges = this.edges.filter(e => e.from === currentId);

      for (const edge of outgoingEdges) {
        if (!visited.has(edge.to)) {
          dfs(edge.to, newPath);
        }
      }

      visited.delete(currentId);
    };

    dfs(from, []);
    return paths;
  }

  /**
   * Check if graph has any cycles
   * @returns {boolean} True if graph has a cycle
   */
  hasCycle() {
    const visited = new Set();
    const recursionStack = new Set();

    const hasCycleFromNode = (nodeId) => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoingEdges = this.edges.filter(e => e.from === nodeId);
      for (const edge of outgoingEdges) {
        if (!visited.has(edge.to)) {
          if (hasCycleFromNode(edge.to)) {
            return true;
          }
        } else if (recursionStack.has(edge.to)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        if (hasCycleFromNode(nodeId)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Alias for generateDOT()
   * @returns {string} DOT format graph
   */
  toDOT() {
    return this.generateDOT();
  }

  /**
   * Validate graph structure
   * @returns {Object} Validation result
   */
  validate() {
    const errors = [];
    const warnings = [];

    // Check for orphaned nodes (no incoming or outgoing edges)
    const connectedNodes = new Set();
    for (const edge of this.edges) {
      connectedNodes.add(edge.from);
      connectedNodes.add(edge.to);
    }

    for (const [id, node] of this.nodes) {
      if (!connectedNodes.has(id) && this.nodes.size > 1) {
        warnings.push(`Node "${id}" is orphaned (no connections)`);
      }
    }

    // Check for dangling edges (references to non-existent nodes)
    for (const edge of this.edges) {
      if (!this.nodes.has(edge.from)) {
        errors.push(`Edge references non-existent source: "${edge.from}"`);
      }
      if (!this.nodes.has(edge.to)) {
        errors.push(`Edge references non-existent target: "${edge.to}"`);
      }
    }

    // Check for duplicate node IDs
    const nodeIds = Array.from(this.nodes.keys());
    const uniqueIds = new Set(nodeIds);
    if (nodeIds.length !== uniqueIds.size) {
      errors.push('Duplicate node IDs found');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary: {
        nodeCount: this.nodes.size,
        edgeCount: this.edges.length,
        orphanedNodes: this.nodes.size - connectedNodes.size
      }
    };
  }

  /**
   * Get orphaned nodes (nodes with no connections)
   * @returns {Array} Array of orphaned node IDs
   */
  getOrphanedNodes() {
    const connectedNodes = new Set();
    for (const edge of this.edges) {
      connectedNodes.add(edge.from);
      connectedNodes.add(edge.to);
    }

    const orphaned = [];
    for (const [id, node] of this.nodes) {
      if (!connectedNodes.has(id)) {
        orphaned.push(node);
      }
    }
    return orphaned;
  }
}

/**
 * Convenience function to generate DOT from taint results
 * @param {Array} taintFlows - Taint flow results
 * @param {Object} options - Graph options
 * @returns {string} DOT format
 */
function generateDOT(taintFlows, options = {}) {
  const graph = new DataFlowGraph(options);
  return graph.buildFromTaintResults(taintFlows);
}

module.exports = {
  DataFlowGraph,
  generateDOT
};
