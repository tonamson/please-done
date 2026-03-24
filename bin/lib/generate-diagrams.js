/**
 * Diagram Generation Module — Business Logic Flowchart from Truths tables
 *
 * Pure function: nhan planContents array, tra ve Mermaid flowchart TD.
 * Zero file I/O — content passed as args.
 * Validates output bang mermaid-validator.js, retry max 2 lan.
 */

'use strict';

const { mermaidValidator } = require('./mermaid-validator');
const { parseFrontmatter } = require('./utils');
const { parseTruthsFromContent } = require('./truths-parser');

// ─── Constants ────────────────────────────────────────────

const MAX_NODES_PER_SUBGRAPH = 15;

// ─── Internal Helpers ──────────────────────────────────────

/**
 * Pad plan number to 2 digits.
 * @param {number} n
 * @returns {string}
 */
const pad = n => String(n).padStart(2, '0');

/**
 * Parse depends_on from frontmatter object.
 * Handle formats: undefined, Array, '[]', '[01]', '[22-01]', '["22-01"]'
 * @param {object} frontmatter
 * @returns {string[]} - Array of plan number strings (e.g. ['01', '02'])
 */
function parseDependsOnFromFrontmatter(frontmatter) {
  const raw = frontmatter.depends_on;
  if (!raw) return [];

  // Already an array (parsed by parseFrontmatter)
  if (Array.isArray(raw)) return raw.map(String);

  // String format: '[]', '[01]', '[01, 02]'
  const str = String(raw).trim();
  if (str === '[]' || str === '') return [];

  // Remove brackets and quotes, split by comma
  const inner = str.replace(/^\[|\]$/g, '').trim();
  if (!inner) return [];

  return inner.split(/\s*,\s*/).map(s => s.replace(/['"]/g, '').trim()).filter(Boolean);
}

/**
 * Sanitize label text for Mermaid compatibility.
 * Replace characters that break Mermaid parser.
 * @param {string} text
 * @returns {string}
 */
function sanitizeLabel(text) {
  return text
    .replace(/</g, 'nho hon')
    .replace(/>/g, 'lon hon')
    .replace(/&/g, 'va')
    .replace(/"/g, "'")
    .trim();
}

/**
 * Attempt to fix Mermaid syntax errors.
 * @param {string} text - Mermaid text
 * @param {Array<{line: number, message: string, type: string}>} errors
 * @returns {string} - Fixed text
 */
function sanitizeMermaidText(text, errors) {
  const lines = text.split('\n');

  for (const err of errors) {
    if (err.line > 0 && err.line <= lines.length) {
      const idx = err.line - 1;
      const line = lines[idx];

      // Fix unclosed quotes
      if (/unclosed.*quote/i.test(err.message)) {
        const quoteCount = (line.match(/"/g) || []).length;
        if (quoteCount % 2 !== 0) {
          // Add closing quote before end of line
          lines[idx] = line + '"';
        }
      }

      // Fix unquoted labels — wrap content in brackets with quotes
      if (/label.*not.*quote/i.test(err.message)) {
        lines[idx] = line.replace(
          /(\b[A-Za-z_]\w*)\[([^\]"]+)\]/g,
          (_, id, label) => `${id}["${label.trim()}"]`
        );
      }
    }
  }

  return lines.join('\n');
}

/**
 * Validate Mermaid text with retry logic.
 * @param {string} mermaidText
 * @param {number} maxRetries
 * @returns {{ diagram: string, valid: boolean, errors: Array, warnings: Array }}
 */
function validateAndRetry(mermaidText, maxRetries) {
  let text = mermaidText;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = mermaidValidator(text);

    if (result.valid) {
      return { diagram: text, valid: true, errors: [], warnings: result.warnings };
    }

    // If retries left, try to fix
    if (attempt < maxRetries) {
      text = sanitizeMermaidText(text, result.errors);
    } else {
      return { diagram: text, valid: false, errors: result.errors, warnings: result.warnings };
    }
  }

  // Should not reach here, but safety return
  const finalResult = mermaidValidator(text);
  return { diagram: text, valid: finalResult.valid, errors: finalResult.errors, warnings: finalResult.warnings };
}

// ─── Main Function ────────────────────────────────────────

/**
 * Generate Business Logic Flowchart from Truths tables in PLAN.md contents.
 *
 * @param {Array<{planNumber: number, content: string, phase: string}>} planContents
 * @param {object} [options] - { maxRetries: 2 }
 * @returns {{ diagram: string, valid: boolean, errors: Array, warnings: Array, truthCount: number, planCount: number }}
 */
function generateBusinessLogicDiagram(planContents, options = {}) {
  const maxRetries = options.maxRetries ?? 2;

  // Empty or invalid input — minimal diagram with Start/End only
  if (!planContents || !Array.isArray(planContents) || planContents.length === 0) {
    const minimal = 'flowchart TD\n  start(["Bat dau"]) --> done(["Hoan thanh"])';
    const validation = validateAndRetry(minimal, maxRetries);
    return {
      diagram: validation.diagram,
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
      truthCount: 0,
      planCount: 0,
    };
  }

  // Parse each plan
  const plans = planContents.map(p => {
    const { frontmatter, body } = parseFrontmatter(p.content);
    const truths = parseTruthsFromContent(body);
    const dependsOn = parseDependsOnFromFrontmatter(frontmatter);
    return {
      planNumber: p.planNumber,
      phase: p.phase,
      truths,
      dependsOn,
    };
  });

  // Count total truths
  const totalTruths = plans.reduce((sum, p) => sum + p.truths.length, 0);

  // If no truths found at all, return minimal diagram
  if (totalTruths === 0) {
    const minimal = 'flowchart TD\n  start(["Bat dau"]) --> done(["Hoan thanh"])';
    const validation = validateAndRetry(minimal, maxRetries);
    return {
      diagram: validation.diagram,
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
      truthCount: 0,
      planCount: planContents.length,
    };
  }

  // Determine if subgraphs needed
  const useSubgraphs = totalTruths > MAX_NODES_PER_SUBGRAPH;

  // Filter plans with truths for building diagram flow
  const plansWithTruths = plans.filter(p => p.truths.length > 0);

  // Build Mermaid text
  let lines = [];
  lines.push('flowchart TD');
  lines.push('  start(["Bat dau"])');

  if (useSubgraphs) {
    // ─── Subgraph mode ───
    for (const plan of plansWithTruths) {
      const pn = pad(plan.planNumber);
      lines.push(`  subgraph Plan${pn}["Ke hoach ${pn}"]`);

      for (const truth of plan.truths) {
        const nodeId = `P${pn}${truth.id}`;
        const label = sanitizeLabel(truth.description);
        lines.push(`    ${nodeId}["${label}"]`);
      }

      // Sequential arrows within subgraph
      for (let i = 0; i < plan.truths.length - 1; i++) {
        const fromId = `P${pn}${plan.truths[i].id}`;
        const toId = `P${pn}${plan.truths[i + 1].id}`;
        lines.push(`    ${fromId} --> ${toId}`);
      }

      lines.push('  end');
    }

    // Connect start to first subgraph
    const firstPn = pad(plansWithTruths[0].planNumber);
    lines.push(`  start --> Plan${firstPn}`);

    // Cross-plan arrows via depends_on
    for (const plan of plansWithTruths) {
      if (plan.dependsOn.length > 0) {
        const pn = pad(plan.planNumber);
        for (const dep of plan.dependsOn) {
          const depPn = pad(Number(dep));
          lines.push(`  Plan${depPn} --> Plan${pn}`);
        }
      }
    }

    // Connect sequentially if no depends_on links between consecutive plans
    for (let i = 0; i < plansWithTruths.length - 1; i++) {
      const currentPn = pad(plansWithTruths[i].planNumber);
      const nextPn = pad(plansWithTruths[i + 1].planNumber);
      const nextPlan = plansWithTruths[i + 1];
      // Only add sequential link if next plan doesn't have explicit depends_on current
      const hasExplicitDep = nextPlan.dependsOn.some(d => pad(Number(d)) === currentPn);
      if (!hasExplicitDep) {
        lines.push(`  Plan${currentPn} --> Plan${nextPn}`);
      }
    }

    // Connect last subgraph to end
    const lastPn = pad(plansWithTruths[plansWithTruths.length - 1].planNumber);
    lines.push(`  Plan${lastPn} --> done`);

  } else {
    // ─── Flat mode (no subgraphs) ───
    for (const plan of plansWithTruths) {
      const pn = pad(plan.planNumber);

      // Define nodes
      for (const truth of plan.truths) {
        const nodeId = `P${pn}${truth.id}`;
        const label = sanitizeLabel(truth.description);
        lines.push(`  ${nodeId}["${label}"]`);
      }

      // Sequential arrows within plan
      for (let i = 0; i < plan.truths.length - 1; i++) {
        const fromId = `P${pn}${plan.truths[i].id}`;
        const toId = `P${pn}${plan.truths[i + 1].id}`;
        lines.push(`  ${fromId} --> ${toId}`);
      }
    }

    // Connect start to first truth of first plan
    const firstPlan = plansWithTruths[0];
    const firstPn = pad(firstPlan.planNumber);
    lines.push(`  start --> P${firstPn}${firstPlan.truths[0].id}`);

    // Cross-plan arrows: last truth of dep plan → first truth of dependent plan
    for (const plan of plansWithTruths) {
      if (plan.dependsOn.length > 0) {
        const pn = pad(plan.planNumber);
        const firstTruth = plan.truths[0];
        for (const dep of plan.dependsOn) {
          const depPn = pad(Number(dep));
          const depPlan = plansWithTruths.find(p => pad(p.planNumber) === depPn);
          if (depPlan && depPlan.truths.length > 0) {
            const lastTruth = depPlan.truths[depPlan.truths.length - 1];
            lines.push(`  P${depPn}${lastTruth.id} --> P${pn}${firstTruth.id}`);
          }
        }
      }
    }

    // Sequential links for plans without explicit depends_on
    for (let i = 0; i < plansWithTruths.length - 1; i++) {
      const currentPlan = plansWithTruths[i];
      const nextPlan = plansWithTruths[i + 1];
      const currentPn = pad(currentPlan.planNumber);
      const nextPn = pad(nextPlan.planNumber);
      const hasExplicitDep = nextPlan.dependsOn.some(d => pad(Number(d)) === currentPn);
      if (!hasExplicitDep && currentPlan.truths.length > 0 && nextPlan.truths.length > 0) {
        const lastTruth = currentPlan.truths[currentPlan.truths.length - 1];
        const firstTruth = nextPlan.truths[0];
        lines.push(`  P${currentPn}${lastTruth.id} --> P${nextPn}${firstTruth.id}`);
      }
    }

    // Connect last truth to end
    const lastPlan = plansWithTruths[plansWithTruths.length - 1];
    const lastPn = pad(lastPlan.planNumber);
    const lastTruth = lastPlan.truths[lastPlan.truths.length - 1];
    lines.push(`  P${lastPn}${lastTruth.id} --> done`);
  }

  // Add end node
  lines.push('  done(["Hoan thanh"])');

  const mermaidText = lines.join('\n');

  // Validate with retry
  const validation = validateAndRetry(mermaidText, maxRetries);

  return {
    diagram: validation.diagram,
    valid: validation.valid,
    errors: validation.errors,
    warnings: validation.warnings,
    truthCount: totalTruths,
    planCount: planContents.length,
  };
}

// ─── Architecture Diagram (Plan 02) ──────────────────────

/**
 * Parse ARCHITECTURE.md content to extract layers.
 * Format: **Layer Name:** followed by bullet fields.
 * @param {string} content
 * @returns {Array<{name: string, location: string, dependsOn: string, usedBy: string}>}
 */
function parseArchitectureLayers(content) {
  const layers = [];
  const layerRegex = /\*\*([^*]+):\*\*\n([\s\S]*?)(?=\n\*\*[^*]+:\*\*|\n## |\n---|$)/g;
  let match;
  while ((match = layerRegex.exec(content)) !== null) {
    const name = match[1].trim();
    const block = match[2];
    const locationMatch = block.match(/Location:\s*`([^`]+)`/);
    const dependsMatch = block.match(/Depends on:\s*(.+)/);
    const usedByMatch = block.match(/Used by:\s*(.+)/);
    if (locationMatch) {
      layers.push({
        name,
        location: locationMatch[1].trim(),
        dependsOn: dependsMatch ? dependsMatch[1].trim() : '',
        usedBy: usedByMatch ? usedByMatch[1].trim() : '',
      });
    }
  }
  return layers;
}

/**
 * Determine Mermaid shape role based on file path.
 * @param {string} filePath
 * @returns {'service'|'database'|'api'|'external'}
 */
function detectRole(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.includes('database') || lower.includes('db') || lower.includes('store')) return 'database';
  if (lower.includes('templates/') || lower.includes('references/')) return 'external';
  if (lower.includes('platforms') || lower.includes('workflow')) return 'api';
  return 'service';
}

/**
 * Return node definition with correct Mermaid shape syntax.
 * @param {string} nodeId
 * @param {string} label
 * @param {string} role
 * @returns {string}
 */
function shapeWrap(nodeId, label, role) {
  const safe = sanitizeLabel(label);
  switch (role) {
    case 'database': return `${nodeId}[("${safe}")]`;
    case 'api': return `${nodeId}("${safe}")`;
    case 'external': return `${nodeId}[["${safe}"]]`;
    default: return `${nodeId}["${safe}"]`;
  }
}

/**
 * Check if a file path matches a layer's location pattern.
 * @param {string} filePath
 * @param {string} layerLocation
 * @returns {boolean}
 */
function fileMatchesLayer(filePath, layerLocation) {
  const locations = layerLocation.split(',').map(l => l.trim().replace(/`/g, ''));
  return locations.some(loc => {
    if (loc.endsWith('/')) return filePath.startsWith(loc);
    return filePath === loc || filePath.startsWith(loc);
  });
}

/**
 * Generate safe Mermaid node ID from file path.
 * @param {string} filePath
 * @returns {string}
 */
function makeNodeId(filePath) {
  return filePath.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

/**
 * Extract basename from file path.
 * @param {string} filePath
 * @returns {string}
 */
function basename(filePath) {
  const parts = filePath.split('/');
  return parts[parts.length - 1];
}

/**
 * Generate Architecture Diagram from codebase maps and plan metadata.
 *
 * @param {object} codebaseMaps
 *   - architecture {string} - Noi dung ARCHITECTURE.md
 *   - structure {string} - Noi dung STRUCTURE.md (optional)
 * @param {object} planMeta
 *   - filesModified {string[]} - Tat ca files bi thay doi trong milestone
 * @param {object} [options] - { maxRetries: 2 }
 * @returns {{ diagram: string, valid: boolean, errors: Array, warnings: Array, layerCount: number, nodeCount: number }}
 */
function generateArchitectureDiagram(codebaseMaps, planMeta, options = {}) {
  const maxRetries = options.maxRetries ?? 2;

  const architectureContent = (codebaseMaps && codebaseMaps.architecture) || '';
  const filesModified = (planMeta && planMeta.filesModified) || [];

  // Empty filesModified — minimal valid diagram
  if (filesModified.length === 0) {
    const minimal = 'flowchart LR\n  note["Khong co file thay doi trong milestone"]';
    const validation = validateAndRetry(minimal, maxRetries);
    return {
      diagram: validation.diagram,
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
      layerCount: 0,
      nodeCount: 0,
    };
  }

  // Parse layers from ARCHITECTURE.md
  const layers = parseArchitectureLayers(architectureContent);

  // Map files to layers — milestone scoped
  const activeLayers = [];
  for (const layer of layers) {
    const matchedFiles = filesModified.filter(f => fileMatchesLayer(f, layer.location));
    if (matchedFiles.length > 0) {
      activeLayers.push({ ...layer, files: matchedFiles });
    }
  }

  // Handle unmatched files — "Khac" layer
  const allMatched = activeLayers.flatMap(l => l.files);
  const unmatched = filesModified.filter(f => !allMatched.includes(f));
  if (unmatched.length > 0) {
    activeLayers.push({ name: 'Khac', location: '', files: unmatched, dependsOn: '', usedBy: '' });
  }

  // Build Mermaid text
  const lines = [];
  lines.push('flowchart LR');

  // Generate safe subgraph IDs
  for (let i = 0; i < activeLayers.length; i++) {
    const layer = activeLayers[i];
    const subgraphId = `Layer${i}`;
    lines.push(`  subgraph ${subgraphId}["${sanitizeLabel(layer.name)}"]`);

    for (const filePath of layer.files) {
      const nodeId = makeNodeId(filePath);
      const label = basename(filePath);
      const role = detectRole(filePath);
      lines.push(`    ${shapeWrap(nodeId, label, role)}`);
    }

    lines.push('  end');
  }

  // Add inter-layer connections based on dependsOn
  for (let i = 0; i < activeLayers.length; i++) {
    const layer = activeLayers[i];
    if (layer.dependsOn && layer.dependsOn !== 'None' && layer.dependsOn !== '') {
      for (let j = 0; j < activeLayers.length; j++) {
        if (i === j) continue;
        const otherName = activeLayers[j].name.toLowerCase();
        const deps = layer.dependsOn.toLowerCase();
        // Check if dependsOn references another active layer
        if (deps.includes(otherName.split(' ')[0]) || otherName.split(' ').some(w => deps.includes(w) && w.length > 3)) {
          lines.push(`  Layer${j} --> Layer${i}`);
        }
      }
    }
  }

  // Count nodes
  const nodeCount = activeLayers.reduce((sum, l) => sum + l.files.length, 0);

  const mermaidText = lines.join('\n');

  // Validate and retry
  const validation = validateAndRetry(mermaidText, maxRetries);

  return {
    diagram: validation.diagram,
    valid: validation.valid,
    errors: validation.errors,
    warnings: validation.warnings,
    layerCount: activeLayers.length,
    nodeCount,
  };
}

// ─── Exports ──────────────────────────────────────────────

module.exports = { generateBusinessLogicDiagram, generateArchitectureDiagram };
