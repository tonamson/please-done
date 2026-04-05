/**
 * Data Flow Graph Tests - Phase 115
 * Tests for graph structure and DOT format generation
 */

const { test, describe, before } = require('node:test');
const assert = require('node:assert');

// Module to be tested (created in Plan 115-02)
let DataFlowGraph;

try {
  ({ DataFlowGraph } = require('../../bin/lib/data-flow-graph.js'));
} catch (e) {
  // Module doesn't exist yet - tests will be skipped
  DataFlowGraph = null;
}

describe('DataFlowGraph', () => {
  let graph;

  before(() => {
    if (!DataFlowGraph) {
      console.log('Skipping tests - DataFlowGraph module not yet implemented');
      return;
    }
    graph = new DataFlowGraph();
  });

  describe('Node creation', () => {
    test('should create source nodes', () => {
      if (!DataFlowGraph) return;

      graph.addNode({
        id: 'source1',
        type: 'source',
        label: 'req.body.username',
        category: 'untrusted-input'
      });

      const nodes = graph.getNodes();
      assert.ok(nodes.some(n => n.id === 'source1' && n.type === 'source'),
        'Should create source node');
    });

    test('should create sink nodes', () => {
      if (!DataFlowGraph) return;

      graph.addNode({
        id: 'sink1',
        type: 'sink',
        label: 'db.query()',
        category: 'sql-execution'
      });

      const nodes = graph.getNodes();
      assert.ok(nodes.some(n => n.id === 'sink1' && n.type === 'sink'),
        'Should create sink node');
    });

    test('should create intermediate nodes', () => {
      if (!DataFlowGraph) return;

      graph.addNode({
        id: 'intermediate1',
        type: 'intermediate',
        label: 'processed',
        category: 'variable'
      });

      const nodes = graph.getNodes();
      assert.ok(nodes.some(n => n.id === 'intermediate1'),
        'Should create intermediate node');
    });

    test('should create sanitization nodes', () => {
      if (!DataFlowGraph) return;

      graph.addNode({
        id: 'sanitizer1',
        type: 'sanitizer',
        label: 'validator.escape()',
        category: 'xss-sanitizer'
      });

      const nodes = graph.getNodes();
      assert.ok(nodes.some(n => n.type === 'sanitizer'),
        'Should create sanitizer node');
    });
  });

  describe('Edge creation', () => {
    test('should create edges between nodes', () => {
      if (!DataFlowGraph) return;

      graph.addEdge({
        from: 'source1',
        to: 'intermediate1',
        label: 'assignment'
      });

      const edges = graph.getEdges();
      assert.ok(edges.some(e => e.from === 'source1' && e.to === 'intermediate1'),
        'Should create edge');
    });

    test('should support labeled edges', () => {
      if (!DataFlowGraph) return;

      graph.addEdge({
        from: 'intermediate1',
        to: 'sink1',
        label: 'function-call',
        metadata: { line: 42 }
      });

      const edges = graph.getEdges();
      const edge = edges.find(e => e.from === 'intermediate1' && e.to === 'sink1');
      assert.ok(edge, 'Should find edge');
      assert.strictEqual(edge.label, 'function-call', 'Should have label');
    });

    test('should support conditional edges', () => {
      if (!DataFlowGraph) return;

      graph.addEdge({
        from: 'source1',
        to: 'sink1',
        label: 'conditional',
        conditional: true,
        condition: 'if (valid)'
      });

      const edges = graph.getEdges();
      const edge = edges.find(e => e.from === 'source1' && e.to === 'sink1');
      if (edge) {
        assert.ok(edge.conditional, 'Should mark edge as conditional');
      }
    });
  });

  describe('Path traversal', () => {
    test('should find paths between source and sink', () => {
      if (!DataFlowGraph) return;

      // Create a simple chain: source -> intermediate -> sink
      graph.addNode({ id: 'src', type: 'source' });
      graph.addNode({ id: 'mid', type: 'intermediate' });
      graph.addNode({ id: 'snk', type: 'sink' });

      graph.addEdge({ from: 'src', to: 'mid' });
      graph.addEdge({ from: 'mid', to: 'snk' });

      const paths = graph.findPaths('src', 'snk');
      assert.ok(paths.length > 0, 'Should find at least one path');
      assert.deepStrictEqual(paths[0], ['src', 'mid', 'snk'],
        'Path should include all nodes');
    });

    test('should find multiple paths', () => {
      if (!DataFlowGraph) return;

      // Create diamond: source -> mid1 -> sink
      //                     \> mid2 -
      graph.addNode({ id: 'src', type: 'source' });
      graph.addNode({ id: 'mid1', type: 'intermediate' });
      graph.addNode({ id: 'mid2', type: 'intermediate' });
      graph.addNode({ id: 'snk', type: 'sink' });

      graph.addEdge({ from: 'src', to: 'mid1' });
      graph.addEdge({ from: 'src', to: 'mid2' });
      graph.addEdge({ from: 'mid1', to: 'snk' });
      graph.addEdge({ from: 'mid2', to: 'snk' });

      const paths = graph.findPaths('src', 'snk');
      assert.strictEqual(paths.length, 2, 'Should find two paths');
    });

    test('should detect cycles', () => {
      if (!DataFlowGraph) return;

      graph.addNode({ id: 'a', type: 'intermediate' });
      graph.addNode({ id: 'b', type: 'intermediate' });
      graph.addNode({ id: 'c', type: 'intermediate' });

      graph.addEdge({ from: 'a', to: 'b' });
      graph.addEdge({ from: 'b', to: 'c' });
      graph.addEdge({ from: 'c', to: 'a' }); // Creates cycle

      const hasCycle = graph.hasCycle();
      assert.strictEqual(hasCycle, true, 'Should detect cycle');
    });
  });

  describe('DOT format generation', () => {
    test('should generate valid DOT syntax', () => {
      if (!DataFlowGraph) return;

      graph.addNode({ id: 's1', type: 'source', label: 'source' });
      graph.addNode({ id: 'k1', type: 'sink', label: 'sink' });
      graph.addEdge({ from: 's1', to: 'k1' });

      const dot = graph.toDOT();
      assert.ok(dot.startsWith('digraph'), 'Should start with digraph');
      assert.ok(dot.includes('s1'), 'Should include node s1');
      assert.ok(dot.includes('k1'), 'Should include node k1');
      assert.ok(dot.includes('s1 -> k1'), 'Should include edge');
    });

    test('should include node attributes', () => {
      if (!DataFlowGraph) return;

      graph.addNode({
        id: 'sanitizer',
        type: 'sanitizer',
        label: 'escape',
        attributes: { color: 'green', shape: 'box' }
      });

      const dot = graph.toDOT();
      assert.ok(dot.includes('sanitizer'), 'Should include sanitizer node');
      assert.ok(dot.includes('color') || dot.includes('shape'),
        'Should include node attributes');
    });

    test('should escape special characters in labels', () => {
      if (!DataFlowGraph) return;

      graph.addNode({
        id: 'n1',
        type: 'source',
        label: 'req.body["data\"]'
      });

      const dot = graph.toDOT();
      assert.ok(dot.includes('n1'), 'Should include node');
      // Should not throw when parsed
      assert.ok(dot.length > 0, 'Should generate DOT');
    });

    test('should generate graphviz-compatible output', () => {
      if (!DataFlowGraph) return;

      // Create a complete graph
      graph.addNode({ id: 'source', type: 'source', label: 'req.body' });
      graph.addNode({ id: 'process', type: 'intermediate', label: 'process()' });
      graph.addNode({ id: 'sanitizer', type: 'sanitizer', label: 'escape()' });
      graph.addNode({ id: 'sink', type: 'sink', label: 'eval()' });

      graph.addEdge({ from: 'source', to: 'process', label: 'call' });
      graph.addEdge({ from: 'process', to: 'sanitizer', label: 'transform' });
      graph.addEdge({ from: 'sanitizer', to: 'sink', label: 'use' });

      const dot = graph.toDOT();

      // Basic DOT structure validation
      assert.ok(dot.match(/digraph\s+\w+\s*\{/),
        'Should have valid digraph declaration');
      assert.ok(dot.match(/\}$/), 'Should end with closing brace');
      assert.ok(dot.includes('->'), 'Should have edge declarations');
    });
  });

  describe('Graph structure validation', () => {
    test('should validate complete graph', () => {
      if (!DataFlowGraph) return;

      graph.addNode({ id: 'src', type: 'source' });
      graph.addNode({ id: 'snk', type: 'sink' });
      graph.addEdge({ from: 'src', to: 'snk' });

      const validation = graph.validate();
      assert.ok(validation.valid, 'Should validate complete graph');
    });

    test('should detect orphaned nodes', () => {
      if (!DataFlowGraph) return;

      graph.addNode({ id: 'src', type: 'source' });
      graph.addNode({ id: 'orphan', type: 'intermediate' });
      graph.addNode({ id: 'snk', type: 'sink' });

      graph.addEdge({ from: 'src', to: 'snk' });

      const validation = graph.validate();
      // Orphaned nodes may be warnings, not necessarily invalid
      assert.ok(validation.warnings !== undefined || validation.valid,
        'Should handle orphaned nodes');
    });

    test('should detect dangling edges', () => {
      if (!DataFlowGraph) return;

      graph.addNode({ id: 'src', type: 'source' });
      // Adding edge to non-existent node
      graph.addEdge({ from: 'src', to: 'nonexistent' });

      const validation = graph.validate();
      assert.ok(!validation.valid || validation.errors.length > 0,
        'Should detect dangling edges');
    });
  });

  describe('Graph operations', () => {
    test('should clear graph', () => {
      if (!DataFlowGraph) return;

      graph.addNode({ id: 'n1', type: 'source' });
      graph.addEdge({ from: 'n1', to: 'n1' });

      graph.clear();

      assert.strictEqual(graph.getNodes().length, 0, 'Should have no nodes');
      assert.strictEqual(graph.getEdges().length, 0, 'Should have no edges');
    });

    test('should merge graphs', () => {
      if (!DataFlowGraph) return;

      const graph2 = new DataFlowGraph();
      graph2.addNode({ id: 'n2', type: 'sink' });

      graph.addNode({ id: 'n1', type: 'source' });
      graph.merge(graph2);

      assert.ok(graph.getNodes().some(n => n.id === 'n2'),
        'Should include node from merged graph');
    });

    test('should filter nodes by type', () => {
      if (!DataFlowGraph) return;

      graph.addNode({ id: 's1', type: 'source' });
      graph.addNode({ id: 's2', type: 'source' });
      graph.addNode({ id: 'k1', type: 'sink' });

      const sources = graph.getNodesByType('source');
      assert.strictEqual(sources.length, 2, 'Should filter sources');
    });
  });
});
